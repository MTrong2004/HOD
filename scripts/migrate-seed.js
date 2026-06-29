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
// Để chính xác và tránh thay thế nhầm chữ trong câu hỏi, ta chỉ thay thế khi nằm ngoài dấu nháy hoặc dựa vào vị trí của câu lệnh SQL.
// Nhưng trong seed_questions.sql, các dòng có dạng:
//   ('HOD102', 1, '...', '...', '...', '...', '...', true, false, 'low', null)
// Chúng ta có thể dùng regex thay thế các giá trị boolean độc lập ở cuối câu insert:
// Thay thế ", true," thành ", 1," và ", false," thành ", 0,"
// Thay thế ", true)" thành ", 1)" và ", false)" thành ", 0)"
content = content.replace(/,\s*true\s*,/g, ', 1,');
content = content.replace(/,\s*false\s*,/g, ', 0,');
content = content.replace(/,\s*true\s*\)/g, ', 1)');
content = content.replace(/,\s*false\s*\)/g, ', 0)');

// Ghi kết quả ra file mới
fs.writeFileSync(outputPath, content, 'utf8');
console.log(`Đã xuất file SQLite seed tại: ${outputPath}`);
