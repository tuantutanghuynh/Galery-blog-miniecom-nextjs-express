import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import app from '../app';
import { jwtAccessSecret } from '../config/env';
import { STRONG_PASSWORD, createUser, prisma, requireTestDatabase, resetDb, tokenFor, uniqueIp } from './helpers';

// Đặc tả lấy từ auth.route.ts (luật mật khẩu, 422 VALIDATION_ERROR), comment "vì sao" trong
// auth.controller.ts (đăng ký luôn là customer, trả lời chung để chống dò email, token đặt lại
// dùng một lần, hết hạn sau 1 giờ), token.service.ts (xoay vòng refresh token, phát hiện token bị
// dùng lại thì thu hồi mọi phiên), và app.ts (/auth/* có bộ giới hạn tốc độ chặt hơn mức chung).

const AUTH = '/api/v1/auth';

function post(path: string, body: unknown, ip = uniqueIp()) {
  return request(app).post(`${AUTH}${path}`).set('X-Forwarded-For', ip).send(body as object);
}

function me(token: string) {
  return request(app).get(`${AUTH}/me`).set('X-Forwarded-For', uniqueIp()).set('Authorization', `Bearer ${token}`);
}

const registerBody = (extra: Record<string, unknown> = {}) => ({
  email: `moi-${crypto.randomBytes(4).toString('hex')}@example.com`,
  password: STRONG_PASSWORD,
  confirmPassword: STRONG_PASSWORD,
  fullName: 'Nguyễn Thị Ánh',
  ...extra,
});

// Tạo sẵn một token đặt lại mật khẩu đã biết giá trị gốc. Endpoint thật chỉ gửi giá trị gốc qua
// thư, mà thư bị tắt trong test, nên ghi thẳng bản băm vào bảng theo đúng cách controller lưu.
async function seedResetToken(userId: string, expiresAt = new Date(Date.now() + 60 * 60 * 1000)) {
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  await prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  return raw;
}

beforeAll(() => requireTestDatabase());
beforeEach(async () => {
  await resetDb();
});
afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe('Đăng ký', () => {
  it('bậc 0: đăng ký hợp lệ → 201, trả token dùng được ngay, không trả passwordHash', async () => {
    const body = registerBody();
    const res = await post('/register', body);
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: body.email, fullName: 'Nguyễn Thị Ánh', role: 'customer' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expect((await me(res.body.data.accessToken)).status).toBe(200);
  });

  it('bậc 8: gửi kèm role admin vẫn chỉ được tài khoản khách', async () => {
    const res = await post('/register', registerBody({ role: 'admin' }));
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');
    const row = await prisma.user.findUniqueOrThrow({ where: { id: res.body.data.user.id } });
    expect(row.role).toBe('customer');
  });

  it.each([
    ['7 ký tự', 'Ab1#xyz'],
    ['thiếu chữ hoa', 'matkhau#2026'],
    ['thiếu chữ thường', 'MATKHAU#2026'],
    ['thiếu chữ số', 'Matkhau#abcd'],
    ['thiếu ký tự đặc biệt', 'Matkhau2026'],
  ])('bậc 1+2: mật khẩu %s → 422 VALIDATION_ERROR', async (_n, password) => {
    const res = await post('/register', registerBody({ password, confirmPassword: password }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(await prisma.user.count()).toBe(0);
  });

  it('bậc 2: xác nhận mật khẩu không khớp, email sai dạng, họ tên toàn khoảng trắng → 422', async () => {
    for (const extra of [{ confirmPassword: 'Khac#2026x' }, { email: 'khong-phai-email' }, { fullName: '   ' }]) {
      const res = await post('/register', registerBody(extra));
      expect(res.status).toBe(422);
    }
    expect(await prisma.user.count()).toBe(0);
  });

  it('bậc 4: email đã có → 409 EMAIL_TAKEN, kể cả khi khác chữ hoa/thường', async () => {
    const body = registerBody({ email: 'trung@example.com' });
    expect((await post('/register', body)).status).toBe(201);
    const res = await post('/register', { ...body, email: 'TRUNG@Example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('bậc 6: bấm đăng ký hai lần cùng lúc → một tài khoản, lần còn lại 409 chứ không phải 500', async () => {
    // 5 request thay vì 2: lỗi tranh chấp chỉ lộ ra khi các request thật sự chồng lên nhau,
    // gửi nhiều hơn thì test bắt được ổn định thay vì lúc đỏ lúc xanh.
    const body = registerBody({ email: 'dup@example.com' });
    const responses = await Promise.all(Array.from({ length: 5 }, () => post('/register', body)));
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409, 409, 409, 409]);
    expect(await prisma.user.count()).toBe(1);
  });
});

describe('Đăng nhập', () => {
  it('bậc 0: đúng mật khẩu → 200 với cặp token; email viết hoa vẫn đăng nhập được', async () => {
    await createUser({ email: 'khach@example.com' });
    const res = await post('/login', { email: 'Khach@Example.com', password: STRONG_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('bậc 8: sai mật khẩu và email không tồn tại trả cùng một lỗi (không dò được email)', async () => {
    await createUser({ email: 'co-that@example.com' });
    const wrongPass = await post('/login', { email: 'co-that@example.com', password: 'Sai#mat2026' });
    const noUser = await post('/login', { email: 'khong-co@example.com', password: 'Sai#mat2026' });
    expect(wrongPass.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPass.body.error).toEqual(noUser.body.error);
  });

  it('bậc 2: mật khẩu gửi lên là số → 4xx, không phải 500', async () => {
    await createUser({ email: 'so@example.com' });
    const res = await post('/login', { email: 'so@example.com', password: 12345678 });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('bậc 8: dò mật khẩu 20 lần liên tiếp từ một IP thì phải bị chặn 429 trước khi hết lượt', async () => {
    await createUser({ email: 'nan-nhan@example.com' });
    const ip = '198.51.100.23';
    const statuses: number[] = [];
    for (let i = 0; i < 20; i += 1) {
      statuses.push((await post('/login', { email: 'nan-nhan@example.com', password: `Doan#${i}abcD` }, ip)).status);
    }
    expect(statuses).toContain(429);
  });
});

describe('Access token và /me', () => {
  it('bậc 3: không có token, sai định dạng, sai chữ ký, hết hạn, alg none → đều 401', async () => {
    const user = await createUser();
    const expired = jwt.sign({ sub: user.id, role: 'customer', exp: Math.floor(Date.now() / 1000) - 1 }, jwtAccessSecret as string);
    const forged = jwt.sign({ sub: user.id, role: 'admin' }, 'khoa-gia-mao');
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: user.id, role: 'admin' })}.`;

    expect((await request(app).get(`${AUTH}/me`).set('X-Forwarded-For', uniqueIp())).status).toBe(401);
    expect((await request(app).get(`${AUTH}/me`).set('X-Forwarded-For', uniqueIp()).set('Authorization', tokenFor(user))).status).toBe(401);
    for (const token of [expired, forged, none]) {
      expect((await me(token)).status).toBe(401);
    }
  });

  // Frontend hiện nguyên error.message cho người dùng, nên câu báo lỗi phải là tiếng Việt.
  it('bậc 9: thông báo khi thiếu token hoặc token hết hạn là tiếng Việt', async () => {
    const user = await createUser();
    const expired = jwt.sign({ sub: user.id, role: 'customer', exp: Math.floor(Date.now() / 1000) - 1 }, jwtAccessSecret as string);
    const missing = await request(app).get(`${AUTH}/me`).set('X-Forwarded-For', uniqueIp());
    const stale = await me(expired);
    expect(missing.body.error.message).toBe('Bạn chưa đăng nhập');
    expect(stale.body.error.message).toBe('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  });

  it('tài khoản đã bị xoá mà token còn hạn → 404, không lộ dữ liệu', async () => {
    const user = await createUser();
    const token = tokenFor(user);
    await prisma.user.delete({ where: { id: user.id } });
    expect((await me(token)).status).toBe(404);
  });
});

describe('Refresh token', () => {
  async function login() {
    const user = await createUser();
    const res = await post('/login', { email: user.email, password: STRONG_PASSWORD });
    return { user, refreshToken: res.body.data.refreshToken as string };
  }

  it('bậc 0+4: đổi refresh token được token mới; token cũ không dùng lại được', async () => {
    const { refreshToken } = await login();
    const first = await post('/refresh', { refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.data.refreshToken).not.toBe(refreshToken);
    expect((await me(first.body.data.accessToken)).status).toBe(200);
    expect((await post('/refresh', { refreshToken })).status).toBe(401);
  });

  it('bậc 8: token cũ bị đem ra dùng lại → thu hồi luôn token mới (phát hiện bị đánh cắp)', async () => {
    const { refreshToken } = await login();
    const rotated = (await post('/refresh', { refreshToken })).body.data.refreshToken;
    expect((await post('/refresh', { refreshToken })).status).toBe(401);
    expect((await post('/refresh', { refreshToken: rotated })).status).toBe(401);
  });

  it('bậc 6: gửi cùng một refresh token hai lần cùng lúc → chỉ một lần được cấp phiên mới', async () => {
    // Database local trả lời rất nhanh nên các request hiếm khi chồng lên nhau; lặp 10 vòng để lỗi
    // tranh chấp (nếu có) lộ ra mỗi lần chạy chứ không phải lúc có lúc không.
    for (let round = 0; round < 10; round += 1) {
      const { user, refreshToken } = await login();
      const responses = await Promise.all(Array.from({ length: 5 }, () => post('/refresh', { refreshToken })));
      expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
      expect(await prisma.refreshToken.count({ where: { userId: user.id, revokedAt: null } })).toBeLessThanOrEqual(1);
    }
  });

  it('bậc 9: refresh token đã quá hạn → 401', async () => {
    const { user, refreshToken } = await login();
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await post('/refresh', { refreshToken })).status).toBe(401);
  });

  it('bậc 2: refresh token bịa, rỗng, hoặc là object → 4xx, không phải 500', async () => {
    expect((await post('/refresh', { refreshToken: 'bia-ra' })).status).toBe(401);
    expect((await post('/refresh', {})).status).toBe(422);
    const res = await post('/refresh', { refreshToken: { $ne: null } });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('đăng xuất thu hồi refresh token; đăng xuất không kèm token vẫn thành công', async () => {
    const { refreshToken } = await login();
    expect((await post('/logout', { refreshToken })).status).toBe(200);
    expect((await post('/refresh', { refreshToken })).status).toBe(401);
    expect((await post('/logout', {})).status).toBe(200);
  });
});

describe('Quên và đặt lại mật khẩu', () => {
  it('bậc 8: email có và không có tài khoản nhận cùng một câu trả lời', async () => {
    await createUser({ email: 'co@example.com' });
    const known = await post('/request-password-reset', { email: 'co@example.com' });
    const unknown = await post('/request-password-reset', { email: 'khong@example.com' });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
  });

  it('bậc 4: yêu cầu lại thì token cũ bị thay, chỉ còn một token và hết hạn sau khoảng 1 giờ', async () => {
    const user = await createUser({ email: 'lai@example.com' });
    await post('/request-password-reset', { email: 'lai@example.com' });
    await post('/request-password-reset', { email: 'lai@example.com' });
    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } });
    expect(tokens).toHaveLength(1);
    const minutes = (tokens[0].expiresAt.getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(55);
    expect(minutes).toBeLessThanOrEqual(60);
  });

  it('bậc 0: đặt lại thành công → mật khẩu cũ hết dùng được, mật khẩu mới dùng được', async () => {
    const user = await createUser({ email: 'doi@example.com' });
    const token = await seedResetToken(user.id);
    const newPassword = 'MoiHon#2027';
    expect((await post('/reset-password', { email: 'doi@example.com', token, newPassword })).status).toBe(200);
    expect((await post('/login', { email: 'doi@example.com', password: STRONG_PASSWORD })).status).toBe(401);
    expect((await post('/login', { email: 'doi@example.com', password: newPassword })).status).toBe(200);
  });

  // Chủ dự án chốt ngày 2026-10-11: đổi mật khẩu thì bắt buộc đăng xuất mọi phiên cũ, để kẻ đã
  // chiếm được phiên không giữ được quyền truy cập sau khi chủ tài khoản lấy lại mật khẩu.
  it('bậc 8: đặt lại mật khẩu đăng xuất mọi phiên cũ (refresh token cũ hết dùng được)', async () => {
    const user = await createUser({ email: 'bi-chiem@example.com' });
    const sessions = await Promise.all(
      [1, 2].map(async () => (await post('/login', { email: 'bi-chiem@example.com', password: STRONG_PASSWORD })).body.data.refreshToken as string)
    );
    const token = await seedResetToken(user.id);
    expect((await post('/reset-password', { email: 'bi-chiem@example.com', token, newPassword: 'MoiHon#2027' })).status).toBe(200);
    for (const refreshToken of sessions) {
      expect((await post('/refresh', { refreshToken })).status).toBe(401);
    }
    expect(await prisma.refreshToken.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);
  });

  it('bậc 4: token chỉ dùng được một lần', async () => {
    const user = await createUser({ email: 'motlan@example.com' });
    const token = await seedResetToken(user.id);
    expect((await post('/reset-password', { email: 'motlan@example.com', token, newPassword: 'MoiHon#2027' })).status).toBe(200);
    const again = await post('/reset-password', { email: 'motlan@example.com', token, newPassword: 'LanHai#2028' });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe('INVALID_TOKEN');
  });

  it('bậc 9: token quá 1 giờ → 400 EXPIRED_TOKEN, mật khẩu không đổi', async () => {
    const user = await createUser({ email: 'het@example.com' });
    const token = await seedResetToken(user.id, new Date(Date.now() - 1000));
    const res = await post('/reset-password', { email: 'het@example.com', token, newPassword: 'MoiHon#2027' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EXPIRED_TOKEN');
    expect((await post('/login', { email: 'het@example.com', password: STRONG_PASSWORD })).status).toBe(200);
  });

  it('bậc 3: token của người A không đặt lại được mật khẩu người B', async () => {
    const a = await createUser({ email: 'a@example.com' });
    await createUser({ email: 'b@example.com' });
    const token = await seedResetToken(a.id);
    const res = await post('/reset-password', { email: 'b@example.com', token, newPassword: 'ChiemQuyen#1' });
    expect(res.status).toBe(400);
    expect((await post('/login', { email: 'b@example.com', password: STRONG_PASSWORD })).status).toBe(200);
  });

  it('bậc 8: trang đặt lại không cho dò email: email có và không có tài khoản trả cùng một lỗi khi token sai', async () => {
    await createUser({ email: 'that@example.com' });
    const body = { token: 'doan-bua', newPassword: 'MoiHon#2027' };
    const known = await post('/reset-password', { ...body, email: 'that@example.com' });
    const unknown = await post('/reset-password', { ...body, email: 'khong-that@example.com' });
    expect(known.status).toBe(unknown.status);
    expect(known.body.error.code).toBe(unknown.body.error.code);
  });

  it('bậc 2: token là mảng hoặc object → 4xx, không phải 500', async () => {
    await createUser({ email: 'kieu@example.com' });
    for (const token of [['abc'], { a: 1 }]) {
      const res = await post('/reset-password', { email: 'kieu@example.com', token, newPassword: 'MoiHon#2027' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    }
  });
});
