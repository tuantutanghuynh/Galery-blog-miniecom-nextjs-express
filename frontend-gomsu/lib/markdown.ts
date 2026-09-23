// Không dùng isomorphic-dompurify trên Server Component vì thư viện jsdom quá nặng
// và thường gây crash Server Component (React Error #441) trong Next.js 14+.
// Ở đây dữ liệu được tạo bởi Admin nội bộ nên có thể tạm tin tưởng,
// lý tưởng nhất là sanitize ở Backend trước khi lưu vào DB.

// Khai báo màu chữ/màu nền dán kèm khi admin copy nội dung từ Word hay Google Docs: trình
// soạn thảo Quill giữ nguyên chúng, nên bài viết xuất hiện chữ xanh đậm trên nền trắng đè
// lên nền tối của site. Lọc ở tầng hiển thị thay vì sửa dữ liệu trong DB để vừa chữa được
// mọi bài đã đăng, vừa chặn luôn những lần dán sau này.
const COLOUR_DECLARATION = /(?:background-color|background|color)\s*:[^;]*;?/gi;

// Quill tạo dòng trống bằng `<p><br></p>`. Khối nội dung đã có `space-y-4` lo khoảng cách
// giữa các đoạn, nên những đoạn rỗng này chỉ làm bài viết giãn ra gấp đôi một cách vô cớ.
const EMPTY_PARAGRAPH = /<p>\s*(?:<br\s*\/?>\s*)+<\/p>/gi;

function stripInlineColours(html: string): string {
  return html.replace(/\sstyle="([^"]*)"/gi, (_match, declarations: string) => {
    // Chỉ bỏ phần màu sắc, giữ lại các khai báo khác (ví dụ text-align) nếu có.
    const kept = declarations.replace(COLOUR_DECLARATION, '').trim();
    return kept ? ` style="${kept}"` : '';
  });
}

export function renderHtml(content?: string | null): string {
  if (!content) return '';
  return stripInlineColours(content).replace(EMPTY_PARAGRAPH, '');
}

export function excerptFromContent(content?: string | null, maxLength = 155): string {
  // Loại bỏ các thẻ HTML để lấy raw text
  const plain = (content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain;
}
