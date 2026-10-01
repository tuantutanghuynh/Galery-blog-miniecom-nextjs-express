import { describe, it, expect } from 'vitest';
import { sanitizeContent } from './sanitizeContent';

describe('sanitizeContent', () => {
  it('gỡ thẻ script', () => {
    const ra = sanitizeContent('<p>An toàn</p><script>alert(1)</script>');
    expect(ra).toBe('<p>An toàn</p>');
  });

  it('gỡ thuộc tính onerror trên ảnh', () => {
    const ra = sanitizeContent('<img src="x" onerror="alert(1)">');
    expect(ra).not.toContain('onerror');
  });

  it('gỡ liên kết javascript:', () => {
    const ra = sanitizeContent('<a href="javascript:alert(1)">bấm</a>');
    expect(ra).not.toContain('javascript:');
  });

  it('giữ nguyên định dạng hợp lệ', () => {
    const vao = '<h2>Tiêu đề</h2><p><strong>đậm</strong></p>';
    expect(sanitizeContent(vao)).toBe(vao);
  });
});
