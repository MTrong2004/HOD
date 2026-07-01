import { transform } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile, rm } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const HTML_FILES = ['index.html', 'admin.html'];
const CSS_FILES = ['app.css', 'admin.css', 'landing.css'];
// Không mangle tên biến/hàm: admin.js/app.js có hàng chục onclick="tenHam(...)"
// tham chiếu hàm global qua string, đổi tên sẽ làm vỡ các nút bấm đó.
const JS_FILES = ['config.js', 'landing.js', 'app.js', 'admin.js'];

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  for (const f of HTML_FILES) {
    await copyFile(path.join(root, f), path.join(dist, f));
  }
  await copyFile(path.join(root, 'public', 'background.webp'), path.join(dist, 'background.webp'));

  for (const f of CSS_FILES) {
    const src = await readFile(path.join(root, f), 'utf8');
    const out = await transform(src, { loader: 'css', minify: true });
    await writeFile(path.join(dist, f), out.code);
  }

  for (const f of JS_FILES) {
    const src = await readFile(path.join(root, f), 'utf8');
    const out = await transform(src, {
      loader: 'js',
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false
    });
    await writeFile(path.join(dist, f), out.code);
  }

  console.log('Build xong -> dist/');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
