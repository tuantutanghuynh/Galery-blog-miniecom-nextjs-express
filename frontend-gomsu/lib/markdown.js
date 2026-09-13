import DOMPurify from 'isomorphic-dompurify';

export function renderHtml(content) {
  return DOMPurify.sanitize(content || '');
}

export function excerptFromContent(content, maxLength = 155) {
  // Loại bỏ các thẻ HTML để lấy raw text
  const plain = (content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain;
}
