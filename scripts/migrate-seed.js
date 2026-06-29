import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('seed_questions.sql');
const outputPath = path.resolve('seed_questions_sqlite.sql');

if (!fs.existsSync(inputPath)) {
  console.error(`Không tìm thấy file: ${inputPath}`);
  process.exit(1);
}

console.log(`Đang đọc file: ${inputPath}...`);
let content = fs.readFileSync(inputPath, 'utf8');

console.log('Đang chuyển đổi cú pháp PostgreSQL sang SQLite...');

// 1. Thay thế "public.questions" thành "questions"
content = content.replace(/public\.questions/g, 'questions');

// 2. Loại bỏ ép kiểu JSONB "::jsonb"
content = content.replace(/::jsonb/g, '');

// 3. Thay thế boolean: "true" -> "1", "false" -> "0"
// Chạy lặp lại để giải quyết các trường hợp gối đầu như ", true, true,"
content = content.replace(/,\s*true\s*,/g, ', 1,');
content = content.replace(/,\s*true\s*,/g, ', 1,');
content = content.replace(/,\s*false\s*,/g, ', 0,');
content = content.replace(/,\s*false\s*,/g, ', 0,');
content = content.replace(/,\s*true\s*\)/g, ', 1)');
content = content.replace(/,\s*false\s*\)/g, ', 0)');

// 4. Thay thế now() thành datetime('now')
content = content.replace(/now\(\)/g, "datetime('now')");

// 5. Loại bỏ lệnh NOTIFY của Postgres
content = content.replace(/notify\s+pgrst.*/gi, '');

// Ghi kết quả ra file mới
fs.writeFileSync(outputPath, content, 'utf8');
console.log(`Đã xuất file SQLite seed tại: ${outputPath}`);
