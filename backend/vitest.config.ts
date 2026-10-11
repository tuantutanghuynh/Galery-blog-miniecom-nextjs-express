import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Chạy trước mọi file test, trước cả khi file test kịp import app: đổi database sang
    // database test và tắt mọi biến gây tác dụng phụ ra ngoài (gửi thư, báo Sentry).
    setupFiles: ['./test/setup.ts'],
    // Các file test có ghi dữ liệu dùng chung một database test, chạy song song thì file này
    // xoá dữ liệu của file kia giữa chừng.
    fileParallelism: false,
    exclude: ['node_modules/**', 'dist/**'],
  },
});
