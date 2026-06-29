import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Đọc .env ở thư mục gốc
if (fs.existsSync(path.join(root, '.env'))) {
  const envContent = fs.readFileSync(path.join(root, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      process.env[key] = val;
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. Xử lý API
  if (req.url.startsWith('/api/')) {
    const filePath = path.join(root, 'api', 'index.js');

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    let bodyBuffer = [];
    req.on('data', chunk => {
      bodyBuffer.push(chunk);
    });

    req.on('end', async () => {
      const bodyStr = Buffer.concat(bodyBuffer).toString();
      try {
        const modulePath = `file://${filePath}`;
        // Load dynamically and bypass cache in case files change during development
        const { default: handler } = await import(`${modulePath}?v=${Date.now()}`);

        const headers = new Headers();
        Object.entries(req.headers).forEach(([k, v]) => {
          if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v));
        });

        const webReq = new Request(`http://localhost${req.url}`, {
          method: req.method,
          headers: headers,
          body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? bodyStr : undefined
        });

        const webRes = await handler(webReq);

        const resHeaders = {};
        webRes.headers.forEach((v, k) => {
          resHeaders[k] = v;
        });

        res.writeHead(webRes.status, resHeaders);
        const bodyText = await webRes.text();
        res.end(bodyText);
      } catch (e) {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 2. Serve static files
  let safePath = req.url.split('?')[0];
  if (safePath === '/') safePath = '/index.html';
  const filePath = path.join(root, safePath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 LOCAL DEV SERVER RUNNING AT: http://localhost:${PORT}`);
  console.log(`Database connected: ${process.env.TURSO_DATABASE_URL}\n`);
});
