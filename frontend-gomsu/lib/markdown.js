// Không dùng isomorphic-dompurify trên Server Component vì thư viện jsdom quá nặng
// và thường gây crash Server Component (React Error #441) trong Next.js 14+.
// Ở đây dữ liệu được tạo bởi Admin nội bộ nên có thể tạm tin tưởng, 
// lý tưởng nhất là sanitize ở Backend trước khi lưu vào DB.
export function renderHtml(content) {
  return content || '';
}

export function excerptFromContent(content, maxLength = 155) {
  // Loại bỏ các thẻ HTML để lấy raw text
  const plain = (content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain;
}
