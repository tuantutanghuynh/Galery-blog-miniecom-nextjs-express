import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Admin get-by-id', () => {
  it('bài viết: chưa đăng nhập thì 401', async () => {
    const res = await request(app).get('/api/v1/blog/admin/khong-ton-tai');
    expect(res.status).toBe(401);
  });
  it('sản phẩm: chưa đăng nhập thì 401', async () => {
    const res = await request(app).get('/api/v1/products/admin/khong-ton-tai');
    expect(res.status).toBe(401);
  });
});
