// Dùng `bcryptjs` cho khớp với auth.controller — hash phải do cùng một thư viện tạo ra để
// tránh mọi khác biệt ngầm giữa bản native và bản thuần JS.
import bcrypt from 'bcryptjs';
import prisma from '../services/prisma';

// Tạo tài khoản admin, hoặc đặt lại mật khẩu cho tài khoản admin đã có.
//
// Bản cũ (seedAdmin.js) dùng `update: {}`, nghĩa là gặp email đã tồn tại thì nó không làm gì
// cả — đúng cho việc seed lần đầu, nhưng vô dụng đúng lúc cần nhất là khi quên mật khẩu.
// Bản này ghi đè mật khẩu, vì đường khôi phục qua email vẫn chưa gửi được thư.
//
// Cách dùng (chạy từ thư mục backend/, mật khẩu để trong nháy ĐƠN vì zsh coi `!` là ký tự
// lịch sử và sẽ làm hỏng lệnh nếu dùng nháy kép):
//   npx tsx scripts/seedAdmin.ts admin@nghiaphai.com 'MatKhauMoi#2026'
//
// Mật khẩu phải theo đúng quy tắc mà route /auth/reset-password đang kiểm, để tài khoản tạo
// bằng script không lọt qua được một tiêu chuẩn thấp hơn API.
const RULES: [RegExp, string][] = [
  [/.{8,}/, 'ít nhất 8 ký tự'],
  [/[A-Z]/, 'một chữ hoa'],
  [/[a-z]/, 'một chữ thường'],
  [/[0-9]/, 'một chữ số'],
  [/[!@#$%^&*(),.?":{}|<>]/, 'một ký tự đặc biệt'],
];

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    // In ví dụ thật thay vì dấu ngoặc nhọn: gõ nguyên `<email>` vào zsh sẽ thành cú pháp
    // chuyển hướng và báo "parse error near `<'".
    console.error(
      'Thiếu tham số.\n' +
        "  Cách dùng: npx tsx scripts/seedAdmin.ts admin@nghiaphai.com 'MatKhauMoi#2026'\n" +
        '  (chạy từ thư mục backend/, mật khẩu để trong nháy ĐƠN)'
    );
    process.exitCode = 1;
    return;
  }

  const thieu = RULES.filter(([re]) => !re.test(password)).map(([, mo_ta]) => mo_ta);
  if (thieu.length > 0) {
    console.error(`Mật khẩu chưa đạt, còn thiếu: ${thieu.join(', ')}.`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    // Ghi đè cả mật khẩu lẫn quyền: nếu tài khoản lỡ bị hạ xuống customer thì lệnh này cũng
    // kéo nó về admin, tránh trường hợp đặt lại được mật khẩu nhưng vẫn không vào được panel.
    update: { passwordHash, role: 'admin' },
    create: { email, passwordHash, fullName: 'Quản Trị Viên', role: 'admin' },
  });

  console.log(`Xong. Tài khoản admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error('Lỗi:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
