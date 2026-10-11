import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Gửi thư qua máy chủ SMTP của Google Workspace bằng chính hộp thư của shop.
//
// Chọn Google thay vì một dịch vụ gửi thư riêng vì tên miền nghiaphai.com đã có sẵn SPF và
// DKIM trỏ về Google: thư gửi từ đây qua được bộ lọc chống giả mạo mà không phải sửa DNS.
// Đổi lại, SMTP Workspace chỉ hợp với thư giao dịch số lượng nhỏ (đặt lại mật khẩu, báo đơn).
// Gửi bản tin hàng loạt qua đây dễ khiến Google khoá tài khoản — việc đó phải dùng dịch vụ khác.
//
// Thiếu SMTP_USER hoặc SMTP_PASS thì không gửi gì, chỉ ghi ra log. Nhờ vậy máy local và môi
// trường chưa cấu hình vẫn chạy được, nhưng luôn để lại dấu vết thay vì im lặng.

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      // Mật khẩu ứng dụng của Google hiển thị theo nhóm có dấu cách; Google chấp nhận cả hai
      // dạng nhưng bỏ dấu cách để không phụ thuộc vào việc người cấu hình dán kiểu nào.
      auth: { user, pass: pass.replace(/\s+/g, '') },
    });
  }
  return transporter;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Hộp thư nhận thông báo đơn mới. Mặc định là chính hộp thư gửi đi.
export function shopInbox(): string | undefined {
  return process.env.SHOP_NOTIFY_EMAIL || process.env.SMTP_USER;
}

// Mọi dữ liệu khách nhập (tên, ghi chú, địa chỉ) đều phải qua đây trước khi vào HTML của thư.
// Không escape thì khách gõ `<a href=...>` vào ô tên là chèn được link lừa đảo vào thư mà
// shop sẽ mở — và thư đó đến từ chính tên miền của shop nên trông rất đáng tin.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

// Trả về true nếu đã giao cho máy chủ SMTP, false nếu chưa cấu hình. Lỗi gửi thì ném ra để
// nơi gọi quyết định — các controller gọi hàm này theo kiểu "bắn rồi quên" và tự bắt lỗi,
// vì khách không nên phải chờ hay bị lỗi chỉ vì thư gửi chậm.
export async function sendMail(message: MailMessage): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mail] Chưa cấu hình SMTP, không gửi: "${message.subject}" -> ${message.to}`);
    return false;
  }

  const from = process.env.MAIL_FROM || `Nghĩa Phái <${process.env.SMTP_USER}>`;
  await t.sendMail({ from, ...message });
  return true;
}

export default { sendMail, isMailConfigured, shopInbox, escapeHtml };
