import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export function renderMarkdown(content) {
  const rawHtml = marked.parse(content || '');
  return DOMPurify.sanitize(rawHtml);
}
