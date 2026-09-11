import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export function renderMarkdown(content) {
  const rawHtml = marked.parse(content || '');
  return DOMPurify.sanitize(rawHtml);
}

// Fallback khi bài viết chưa có excerpt/seoDescription — tự rút gọn từ content,
// bỏ ký tự cú pháp Markdown cơ bản để không lộ dấu # / ** / [] ra meta description.
export function excerptFromContent(content, maxLength = 155) {
  const plain = (content || '')
    .replace(/[#*_`>[\]()~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain;
}
