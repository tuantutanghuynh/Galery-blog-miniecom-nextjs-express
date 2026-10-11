import { escapeHtml } from './mail.service';
import type { MailMessage } from './mail.service';

// Nội dung các thư, viết thành hàm thuần: nhận dữ liệu, trả về tiêu đề + bản chữ + bản HTML.
// Tách khỏi phần gửi để kiểm thử được nội dung mà không cần máy chủ SMTP.
//
// Mỗi thư luôn có cả bản chữ thuần lẫn bản HTML: bộ lọc thư rác chấm điểm thấp những thư chỉ
// có HTML, và một số ứng dụng đọc thư chỉ hiển thị bản chữ.

export interface QuoteLine {
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface QuoteSummary {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  note: string | null;
}

const BRAND = 'Nghĩa Phái';

function money(v: number): string {
  return `${v.toLocaleString('vi-VN')}đ`;
}

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="vi"><body style="margin:0;padding:24px;background:#f6f5f2;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e6e3dc">
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:22px;margin:0 0 20px">${escapeHtml(title)}</h1>
${body}
<p style="margin:32px 0 0;font-size:12px;color:#888">${BRAND} — Gốm sứ nghệ thuật Bát Tràng</p>
</div></body></html>`;
}

function linesTable(lines: QuoteLine[]): { html: string; text: string } {
  const rows = lines
    .map(
      (l) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(l.productName)}<br><span style="color:#888;font-size:13px">${escapeHtml(l.variantLabel)} × ${l.quantity}</span></td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${money(l.lineTotal)}</td></tr>`
    )
    .join('');
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  return {
    html: `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}<tr><td style="padding:12px 0;font-weight:bold">Tạm tính</td><td style="padding:12px 0;text-align:right;font-weight:bold">${money(total)}</td></tr></table>`,
    text:
      lines.map((l) => `- ${l.productName} (${l.variantLabel}) x${l.quantity}: ${money(l.lineTotal)}`).join('\n') +
      `\nTạm tính: ${money(total)}`,
  };
}

export function passwordResetEmail(to: string, link: string): MailMessage {
  const subject = `Đặt lại mật khẩu tài khoản ${BRAND}`;
  return {
    to,
    subject,
    text: `Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản ${to}.\n\nMở liên kết sau để đặt mật khẩu mới (hiệu lực 1 giờ):\n${link}\n\nNếu không phải bạn yêu cầu, hãy bỏ qua thư này — mật khẩu hiện tại vẫn giữ nguyên.`,
    html: layout(
      'Đặt lại mật khẩu',
      `<p style="font-size:15px;line-height:1.6">Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>${escapeHtml(to)}</strong>.</p>
<p style="margin:28px 0"><a href="${escapeHtml(link)}" style="background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;font-size:14px;letter-spacing:1px">ĐẶT MẬT KHẨU MỚI</a></p>
<p style="font-size:13px;color:#666;line-height:1.6">Liên kết có hiệu lực trong 1 giờ. Nếu không phải bạn yêu cầu, hãy bỏ qua thư này — mật khẩu hiện tại vẫn giữ nguyên.</p>`
    ),
  };
}

export function quoteShopEmail(to: string, q: QuoteSummary, lines: QuoteLine[], adminUrl: string): MailMessage {
  const t = linesTable(lines);
  const subject = `Yêu cầu tư vấn mới: ${q.customerName} — ${q.phone}`;
  const info = [
    ['Khách hàng', q.customerName],
    ['Điện thoại', q.phone],
    ['Email', q.email || '(không để lại)'],
    ['Địa chỉ', q.address],
    ['Ghi chú', q.note || '(không có)'],
  ];
  return {
    to,
    // Bấm "Trả lời" trong hộp thư là gửi thẳng cho khách, nếu khách có để lại email.
    replyTo: q.email || undefined,
    subject,
    text: `${info.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${t.text}\n\nXem và xử lý: ${adminUrl}`,
    html: layout(
      'Có yêu cầu tư vấn mới',
      `<table style="font-size:14px;line-height:1.7;margin-bottom:20px">${info
        .map(([k, v]) => `<tr><td style="color:#888;padding-right:16px;vertical-align:top">${k}</td><td>${escapeHtml(v)}</td></tr>`)
        .join('')}</table>
${t.html}
<p style="margin:28px 0 0"><a href="${escapeHtml(adminUrl)}" style="color:#1a1a1a">Mở trang quản lý yêu cầu tư vấn →</a></p>`
    ),
  };
}

export function quoteCustomerEmail(to: string, q: QuoteSummary, lines: QuoteLine[], contactPhone: string): MailMessage {
  const t = linesTable(lines);
  const subject = `${BRAND} đã nhận yêu cầu tư vấn của bạn`;
  return {
    to,
    subject,
    text: `Chào ${q.customerName},\n\nCảm ơn bạn đã quan tâm. ${BRAND} đã nhận yêu cầu tư vấn và sẽ gọi lại cho bạn qua số ${q.phone} để báo giá chính xác và thống nhất cách giao hàng.\n\n${t.text}\n\nGiá trên là tạm tính theo giá niêm yết, chưa gồm phí vận chuyển.\nCần liên hệ ngay: ${contactPhone}`,
    html: layout(
      'Đã nhận yêu cầu tư vấn',
      `<p style="font-size:15px;line-height:1.6">Chào ${escapeHtml(q.customerName)},</p>
<p style="font-size:15px;line-height:1.6">Cảm ơn bạn đã quan tâm. ${BRAND} đã nhận yêu cầu tư vấn và sẽ gọi lại cho bạn qua số <strong>${escapeHtml(q.phone)}</strong> để báo giá chính xác và thống nhất cách giao hàng.</p>
${t.html}
<p style="font-size:13px;color:#666;line-height:1.6;margin-top:16px">Giá trên là tạm tính theo giá niêm yết, chưa gồm phí vận chuyển. Cần liên hệ ngay: <strong>${escapeHtml(contactPhone)}</strong></p>`
    ),
  };
}
