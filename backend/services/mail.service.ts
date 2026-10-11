import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Gửi thư giao dịch (đặt lại mật khẩu, báo đơn, xác nhận cho khách). Có hai đường, chọn theo
// biến môi trường:
//
//   1. RESEND_API_KEY có giá trị → gửi qua API của Resend bằng HTTPS. Đây là đường dùng trên
//      production. Render gói miễn phí CHẶN mọi kết nối ra cổng SMTP (25, 465, 587): bản đầu
//      dùng SMTP Google chạy tốt ở máy local nhưng trên Render chỉ nhận về "Connection timeout".
//      HTTPS đi cổng 443 nên không bị chặn.
//   2. Không có key nhưng có SMTP_USER + SMTP_PASS → gửi qua SMTP Google Workspace. Giữ lại cho
//      máy local và cho trường hợp sau này chuyển sang gói Render trả phí.
//
// Không có cấu hình nào thì chỉ ghi ra log, để môi trường chưa cấu hình vẫn chạy được nhưng
// luôn để lại dấu vết thay vì im lặng.
//
// Cả hai đường chỉ hợp với thư giao dịch số lượng nhỏ. Bản tin hàng loạt cần một cấu hình riêng.

// Giới hạn chờ cho mỗi lần gửi. Mặc định của nodemailer là 2 phút, và trên Render mỗi thư hỏng
// từng giữ một kết nối treo đúng 2 phút trước khi báo lỗi.
const SEND_TIMEOUT_MS = 15_000;

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
      connectionTimeout: SEND_TIMEOUT_MS,
      greetingTimeout: SEND_TIMEOUT_MS,
      socketTimeout: SEND_TIMEOUT_MS,
    });
  }
  return transporter;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_USER && process.env.SMTP_PASS));
}

// Địa chỉ người gửi. Với Resend, tên miền trong địa chỉ này phải đã được xác minh trên Resend,
// nếu không API từ chối với lỗi 403.
function fromAddress(): string {
  return process.env.MAIL_FROM || `Nghĩa Phái <${process.env.SMTP_USER}>`;
}

async function sendViaResend(apiKey: string, message: MailMessage): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromAddress(),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!res.ok) {
    // Đưa nội dung lỗi của Resend vào thông báo (đã cắt ngắn): "domain is not verified" hay
    // "invalid API key" chỉ đọc được từ body, còn mã HTTP thì không đủ để biết phải sửa gì.
    const body = await res.text().catch(() => '');
    throw new Error(`Resend trả về ${res.status}: ${body.slice(0, 300)}`);
  }
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

// Trả về true nếu đã giao cho dịch vụ gửi thư, false nếu chưa cấu hình. Lỗi gửi thì ném ra để
// nơi gọi quyết định — các controller gọi hàm này theo kiểu "bắn rồi quên" và tự bắt lỗi,
// vì khách không nên phải chờ hay bị lỗi chỉ vì thư gửi chậm.
export async function sendMail(message: MailMessage): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await sendViaResend(resendKey, message);
    return true;
  }

  const t = getTransporter();
  if (!t) {
    console.warn(`[mail] Chưa cấu hình gửi thư, không gửi: "${message.subject}" -> ${message.to}`);
    return false;
  }

  await t.sendMail({ from: fromAddress(), ...message });
  return true;
}

export default { sendMail, isMailConfigured, shopInbox, escapeHtml };
