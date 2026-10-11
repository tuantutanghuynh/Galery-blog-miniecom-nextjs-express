import { describe, it, expect, afterEach, vi } from 'vitest';
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

describe('sendMail qua Resend (RESEND_API_KEY có giá trị)', () => {
  const saved = { key: process.env.RESEND_API_KEY, from: process.env.MAIL_FROM };
  afterEach(() => {
    process.env.RESEND_API_KEY = saved.key;
    process.env.MAIL_FROM = saved.from;
    if (saved.key === undefined) delete process.env.RESEND_API_KEY;
    if (saved.from === undefined) delete process.env.MAIL_FROM;
    vi.unstubAllGlobals();
  });

  it('gọi đúng API, đúng header, đúng tên trường reply_to', async () => {
    process.env.RESEND_API_KEY = 're_test_123';
    process.env.MAIL_FROM = 'Nghĩa Phái <canhnhut@nghiaphai.com>';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'x' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const ok = await sendMail(quoteShopEmail('shop@nghiaphai.com', quote, lines, 'u'));

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test_123');
    const body = JSON.parse(init.body);
    expect(body.from).toBe('Nghĩa Phái <canhnhut@nghiaphai.com>');
    expect(body.to).toBe('shop@nghiaphai.com');
    expect(body.reply_to).toBe('khach@example.com');
    expect(body).not.toHaveProperty('replyTo');
  });

  it('Resend từ chối thì ném lỗi có kèm lý do', async () => {
    process.env.RESEND_API_KEY = 're_test_123';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"message":"The nghiaphai.com domain is not verified"}', { status: 403 })));

    await expect(sendMail(passwordResetEmail('a@x.com', 'https://x'))).rejects.toThrow(/403.*not verified/);
  });
});
