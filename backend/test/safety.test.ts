import { describe, it, expect } from 'vitest';

// Canh cổng an toàn trong test/setup.ts. Import cấu hình thật của app trước khi kiểm, vì
// config/env.ts tự gọi dotenv.config() — nếu cổng viết sai, đó chính là lúc giá trị production
// trong .env quay trở lại.
describe('Cổng an toàn của bộ test', () => {
  it('database trỏ về máy local và tên có chữ "test", kể cả sau khi app nạp cấu hình', async () => {
    await import('../config/env');
    for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
      const u = new URL(process.env[key] ?? '');
      expect(['localhost', '127.0.0.1', '::1', '[::1]']).toContain(u.hostname);
      expect(u.pathname).toMatch(/test/i);
      expect(u.hostname).not.toMatch(/supabase/i);
    }
  });

  it('không gửi được thư thật và không báo được lên Sentry production', async () => {
    await import('../config/env');
    expect(process.env.SMTP_USER).toBe('');
    expect(process.env.SMTP_PASS).toBe('');
    expect(process.env.RESEND_API_KEY).toBe('');
    expect(process.env.SENTRY_DSN).toBe('');
  });
});
