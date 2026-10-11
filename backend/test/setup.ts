import path from 'path';
import dotenv from 'dotenv';

// Cổng an toàn cho toàn bộ bộ test. Chạy trước khi bất kỳ file test nào import app hay prisma.
//
// Vì sao cần: `backend/.env` trỏ thẳng vào database Supabase PRODUCTION, và chứa cấu hình gửi
// thư thật (SMTP) lẫn Sentry production. Không có cổng này thì một test tạo yêu cầu tư vấn sẽ
// ghi vào database thật, gửi thư thật cho shop, và đẩy lỗi lên Sentry thật.

// Địa chỉ cố ý không tồn tại: dùng khi chưa có .env.test. Nó vẫn qua được phép kiểm tra bên dưới
// (localhost, tên có "test"), nên các test không cần database vẫn chạy bình thường, còn test nào
// lỡ chạm database thì lỗi kết nối ngay chứ không bao giờ rơi về production.
const NO_TEST_DB = 'postgresql://no_test_db@127.0.0.1:1/miniecom_test_not_configured';

const loaded = dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });
export const hasTestDatabase = !loaded.error;

if (!hasTestDatabase) {
  process.env.DATABASE_URL = NO_TEST_DB;
  process.env.DIRECT_URL = NO_TEST_DB;
}

process.env.NODE_ENV = 'test';

// Tắt mọi đường ra ngoài. Đặt chuỗi rỗng chứ không xoá: config/env.ts gọi dotenv.config() sau
// đó, và dotenv chỉ bỏ qua biến đã TỒN TẠI — xoá đi thì giá trị thật trong .env sẽ quay lại.
for (const key of ['SMTP_USER', 'SMTP_PASS', 'RESEND_API_KEY', 'SENTRY_DSN', 'SHOP_NOTIFY_EMAIL']) {
  process.env[key] = '';
}

function assertSafeDatabase(name: string): void {
  const raw = process.env[name] ?? '';
  let host = '';
  let db = '';
  try {
    const u = new URL(raw);
    host = u.hostname;
    db = u.pathname.replace(/^\//, '');
  } catch {
    // để trống, phép kiểm tra dưới sẽ chặn
  }
  const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);
  if (!isLocal || !/test/i.test(db)) {
    throw new Error(
      `Từ chối chạy test: ${name} phải trỏ tới máy local và tên database phải chứa "test" ` +
        `(đang là host="${host}", db="${db}"). Xem backend/.env.test.example.`
    );
  }
}

assertSafeDatabase('DATABASE_URL');
assertSafeDatabase('DIRECT_URL');
