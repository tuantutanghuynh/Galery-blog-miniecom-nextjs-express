import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from './apiClient';

describe('apiFetch', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {}, meta: null, error: null }),
    });
  });

  it('luôn gửi header X-Brand-Slug để backend biết đây là brand nào', async () => {
    await apiFetch('/cart');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers['X-Brand-Slug']).toBe('gom-su-trang-tri');
  });

  it('không ghi đè header mà nơi gọi đã tự đặt', async () => {
    await apiFetch('/cart', { headers: { 'Content-Type': 'application/json' } });
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-Brand-Slug']).toBe('gom-su-trang-tri');
  });
});
