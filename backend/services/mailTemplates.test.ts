import { describe, it, expect, afterEach } from 'vitest';
import { passwordResetEmail, quoteShopEmail, quoteCustomerEmail } from './mailTemplates';
import type { QuoteLine, QuoteSummary } from './mailTemplates';
import { sendMail, escapeHtml, shopInbox } from './mail.service';

const lines: QuoteLine[] = [
  { productName: 'Bình gốm men lam', variantLabel: 'Cao 30cm', quantity: 2, unitPrice: 1500000, lineTotal: 3000000 },
  { productName: 'Đĩa trang trí', variantLabel: 'Mặc định', quantity: 1, unitPrice: 800000, lineTotal: 800000 },
];

const quote: QuoteSummary = {
  id: 'q1',
  customerName: 'Nguyễn Văn A',
  phone: '0900000000',
  email: 'khach@example.com',
  address: 'Hà Nội',
  note: null,
};

describe('escapeHtml', () => {
  it('vô hiệu hoá thẻ HTML', () => {
    expect(escapeHtml('<a href="x">bấm</a>')).toBe('&lt;a href=&quot;x&quot;&gt;bấm&lt;/a&gt;');
  });
});

describe('quoteShopEmail', () => {
  it('khách gõ thẻ HTML vào ô tên thì thư không chứa thẻ đó', () => {
    const doc = quoteShopEmail('shop@x.com', { ...quote, customerName: '<a href="https://lua-dao.example">Bấm</a>' }, lines, 'https://site/admin');
    expect(doc.html).not.toContain('<a href="https://lua-dao.example">');
    expect(doc.html).toContain('&lt;a href=');
  });

  it('cộng đúng tạm tính và có link quản lý', () => {
    const doc = quoteShopEmail('shop@x.com', quote, lines, 'https://site/admin/quote-requests');
    expect(doc.text).toContain('Tạm tính: 3.800.000đ');
    expect(doc.html).toContain('https://site/admin/quote-requests');
  });

  it('trả lời thư là gửi thẳng cho khách', () => {
    expect(quoteShopEmail('shop@x.com', quote, lines, 'u').replyTo).toBe('khach@example.com');
    expect(quoteShopEmail('shop@x.com', { ...quote, email: null }, lines, 'u').replyTo).toBeUndefined();
  });
});

describe('quoteCustomerEmail', () => {
  it('gửi tới email khách và nhắc số điện thoại shop', () => {
    const doc = quoteCustomerEmail('khach@example.com', quote, lines, '0768.986.986');
    expect(doc.to).toBe('khach@example.com');
    expect(doc.text).toContain('0768.986.986');
  });
});

describe('passwordResetEmail', () => {
  it('chứa đúng link đặt lại', () => {
    const link = 'https://www.nghiaphai.com/auth/reset-password?token=abc&email=a%2Bb%40x.com';
    const doc = passwordResetEmail('a+b@x.com', link);
    expect(doc.text).toContain(link);
  });
});

describe('sendMail khi chưa cấu hình SMTP', () => {
  const saved = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
  afterEach(() => {
    process.env.SMTP_USER = saved.user;
    process.env.SMTP_PASS = saved.pass;
  });

  it('không gửi, trả về false, không ném lỗi', async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    await expect(sendMail(passwordResetEmail('a@x.com', 'https://x'))).resolves.toBe(false);
  });

  it('hộp thư nhận báo đơn mặc định là hộp thư gửi đi', () => {
    process.env.SMTP_USER = 'shop@nghiaphai.com';
    delete process.env.SHOP_NOTIFY_EMAIL;
    expect(shopInbox()).toBe('shop@nghiaphai.com');
  });
});
