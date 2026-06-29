import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Đọc thủ công file .env ở thư mục gốc nếu có
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      process.env[key] = val;
    }
  });
}

const rawUrl = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!rawUrl || !token) {
  console.error('❌ Lỗi: Thiếu TURSO_DATABASE_URL hoặc TURSO_AUTH_TOKEN trong file .env');
  console.log('Hãy tạo file .env ở thư mục gốc và điền vào:');
  console.log('TURSO_DATABASE_URL=your_database_url');
  console.log('TURSO_AUTH_TOKEN=your_auth_token');
  process.exit(1);
}

const url = rawUrl.startsWith('libsql://') ? rawUrl.replace('libsql://', 'https://') : rawUrl;

console.log('🔄 Đang kiểm tra kết nối tới Turso DB:', url);

try {
  const db = createClient({ url, authToken: token });
  const r = await db.execute('select 1 as ok');
  if (r.rows?.[0]?.ok === 1) {
    console.log('✅ KẾT NỐI TURSO THÀNH CÔNG!');
  } else {
    console.log('⚠️ Kết quả kiểm tra không khớp:', r.rows);
  }
} catch (e) {
  console.error('❌ KẾT NỐI THẤT BẠI. Chi tiết lỗi:', e.message);
}
