import request from 'supertest';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import app from '../app';
import {
  BRAND_SLUG,
  createBrand,
  createProduct,
  createUser,
  prisma,
  requireTestDatabase,
  resetDb,
  tokenFor,
  uniqueIp,
} from './helpers';

// Đặc tả lấy từ comment "vì sao" trong quoteRequest.controller.ts và quoteRequest.route.ts:
// giá luôn đọc lại từ database, honeypot trả 2xx giả rồi bỏ qua, chỉ trả id + mốc thời gian,
// trang cá nhân không lộ finalAmount, chỉ xoá được yêu cầu "chưa gọi", và tách dữ liệu theo brand.

const API = '/api/v1/quote-requests';

function submit(body: unknown, opts: { ip?: string; token?: string; brand?: string | null } = {}) {
  const r = request(app).post(API).set('X-Forwarded-For', opts.ip ?? uniqueIp());
  if (opts.brand !== null) r.set('X-Brand-Slug', opts.brand ?? BRAND_SLUG);
  if (opts.token) r.set('Authorization', `Bearer ${opts.token}`);
  return r.send(body as object);
}

function asAdmin(token: string, brand = BRAND_SLUG) {
  return {
    get: (p: string) => request(app).get(`${API}${p}`).set('Authorization', `Bearer ${token}`).set('X-Brand-Slug', brand).set('X-Forwarded-For', uniqueIp()),
    patch: (p: string, b: object) => request(app).patch(`${API}${p}`).set('Authorization', `Bearer ${token}`).set('X-Brand-Slug', brand).set('X-Forwarded-For', uniqueIp()).send(b),
    del: (p: string) => request(app).delete(`${API}${p}`).set('Authorization', `Bearer ${token}`).set('X-Brand-Slug', brand).set('X-Forwarded-For', uniqueIp()),
  };
}

const validBody = (variantId: string, extra: Record<string, unknown> = {}) => ({
  customerName: 'Nguyễn Thị Ánh',
  phone: '0901234567',
  address: 'Bát Tràng, Gia Lâm, Hà Nội',
  items: [{ variantId, quantity: 2 }],
  ...extra,
});

let brandId = '';
let variantId = '';
const PRICE = 1_500_000;

beforeAll(() => requireTestDatabase());
beforeEach(async () => {
  await resetDb();
  brandId = (await createBrand()).id;
  variantId = (await createProduct({ categoryId: brandId, price: PRICE })).variant.id;
});
afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe('POST /quote-requests — bậc 0: đúng luồng', () => {
  it('khách vãng lai gửi hợp lệ → 201, chỉ trả id + createdAt, lưu đúng giá từ database', async () => {
    const res = await submit(validBody(variantId));
    expect(res.status).toBe(201);
    expect(Object.keys(res.body.data).sort()).toEqual(['createdAt', 'id']);

    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row).toMatchObject({ status: 'NEW', brandSlug: BRAND_SLUG, userId: null, finalAmount: null });
    const items = row.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ variantId, unitPrice: PRICE, quantity: 2, lineTotal: 2 * PRICE });
  });

  it('khách đang đăng nhập → yêu cầu được gắn vào tài khoản', async () => {
    const user = await createUser();
    const res = await submit(validBody(variantId), { token: tokenFor(user) });
    expect(res.status).toBe(201);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row.userId).toBe(user.id);
  });

  it('token hỏng không chặn khách mà coi như khách vãng lai', async () => {
    const res = await submit(validBody(variantId), { token: 'khong-phai-jwt' });
    expect(res.status).toBe(201);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row.userId).toBeNull();
  });
});

describe('POST /quote-requests — bậc 1: giá trị biên', () => {
  it('số lượng 0 hoặc âm được nâng lên 1', async () => {
    for (const quantity of [0, -5]) {
      const res = await submit(validBody(variantId, { items: [{ variantId, quantity }] }));
      expect(res.status).toBe(201);
      const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
      expect((row.items as Array<{ quantity: number }>)[0].quantity).toBe(1);
    }
  });

  it('số lượng quá lớn bị chặn ở trần 99', async () => {
    const res = await submit(validBody(variantId, { items: [{ variantId, quantity: 100_000 }] }));
    expect(res.status).toBe(201);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect((row.items as Array<{ quantity: number }>)[0].quantity).toBe(99);
  });

  it('số lượng lẻ (2.5) không được lưu thành số lẻ: tiền VND và số món phải là số nguyên', async () => {
    const res = await submit(validBody(variantId, { items: [{ variantId, quantity: 2.5 }] }));
    expect(res.status).toBeLessThan(500);
    if (res.status === 201) {
      const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
      const line = (row.items as Array<{ quantity: number; lineTotal: number }>)[0];
      expect(Number.isInteger(line.quantity)).toBe(true);
      expect(Number.isInteger(line.lineTotal)).toBe(true);
    }
  });

  it('đúng 50 dòng thì nhận, 51 dòng thì từ chối TOO_MANY_ITEMS', async () => {
    const fifty = Array.from({ length: 50 }, () => ({ variantId, quantity: 1 }));
    expect((await submit(validBody(variantId, { items: fifty }))).status).toBe(201);
    const res = await submit(validBody(variantId, { items: [...fifty, { variantId, quantity: 1 }] }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TOO_MANY_ITEMS');
  });
});

describe('POST /quote-requests — bậc 2: đầu vào sai', () => {
  it.each([
    ['thiếu họ tên', { customerName: undefined }],
    ['họ tên chỉ có khoảng trắng', { customerName: '   ' }],
    ['thiếu số điện thoại', { phone: undefined }],
    ['thiếu địa chỉ', { address: undefined }],
  ])('%s → 400 MISSING_FIELDS', async (_n, override) => {
    const res = await submit(validBody(variantId, override));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_FIELDS');
  });

  it.each([
    ['không có sản phẩm', { items: [] }],
    ['items không phải mảng', { items: 'binh-gom' }],
    ['dòng không có variantId', { items: [{ quantity: 1 }] }],
  ])('%s → 400 EMPTY_ITEMS', async (_n, override) => {
    const res = await submit(validBody(variantId, override));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_ITEMS');
  });

  it('sản phẩm không tồn tại → 400 ITEMS_UNAVAILABLE, không tạo yêu cầu', async () => {
    const res = await submit(validBody(variantId, { items: [{ variantId: '00000000-0000-0000-0000-000000000000', quantity: 1 }] }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ITEMS_UNAVAILABLE');
    expect(await prisma.quoteRequest.count()).toBe(0);
  });

  it.each([
    ['họ tên là số', { customerName: 12345 }],
    ['số điện thoại là mảng', { phone: ['0901234567'] }],
    ['địa chỉ là object', { address: { duong: 'Bát Tràng' } }],
  ])('%s → lỗi 4xx rõ ràng, không phải 500', async (_n, override) => {
    const res = await submit(validBody(variantId, override));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('JSON hỏng → lỗi 4xx, không phải 500', async () => {
    const res = await request(app)
      .post(API)
      .set('X-Forwarded-For', uniqueIp())
      .set('X-Brand-Slug', BRAND_SLUG)
      .set('Content-Type', 'application/json')
      .send('{"customerName": "A",');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('thiếu header X-Brand-Slug → 400 BRAND_REQUIRED', async () => {
    const res = await submit(validBody(variantId), { brand: null });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BRAND_REQUIRED');
  });

  it('brand không tồn tại → 404 BRAND_NOT_FOUND', async () => {
    const res = await submit(validBody(variantId), { brand: 'khong-co-brand-nay' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BRAND_NOT_FOUND');
  });

  it('lỗi không lộ chi tiết nội bộ (stack, tên Prisma)', async () => {
    const res = await submit(validBody(variantId, { customerName: 12345 }));
    expect(JSON.stringify(res.body)).not.toMatch(/prisma|stack|at \w+ \(|TypeError/i);
  });
});

describe('POST /quote-requests — bậc 8: người dùng ác ý', () => {
  it('giá client gửi lên bị bỏ qua, luôn dùng giá trong database', async () => {
    const res = await submit(validBody(variantId, { items: [{ variantId, quantity: 1, unitPrice: 1, price: 1, lineTotal: 1 }] }));
    expect(res.status).toBe(201);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect((row.items as Array<{ unitPrice: number; lineTotal: number }>)[0]).toMatchObject({ unitPrice: PRICE, lineTotal: PRICE });
  });

  it('không gán được trạng thái, số tiền chốt hay chủ sở hữu từ phía client', async () => {
    const other = await createUser();
    const res = await submit(validBody(variantId, { status: 'CLOSED', finalAmount: 999, userId: other.id, brandSlug: 'khac' }));
    expect(res.status).toBe(201);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row).toMatchObject({ status: 'NEW', finalAmount: null, userId: null, brandSlug: BRAND_SLUG });
  });

  it('bot điền trường ẩn (honeypot) → trả 2xx giả nhưng không ghi gì', async () => {
    const res = await submit(validBody(variantId, { website_url: 'http://spam.example' }));
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(await prisma.quoteRequest.count()).toBe(0);
  });

  it('chuỗi chèn mã được lưu nguyên văn như dữ liệu, không làm hỏng request', async () => {
    const evil = `<script>alert(1)</script>' OR 1=1 --`;
    const res = await submit(validBody(variantId, { customerName: evil, note: '../../etc/passwd' }));
    expect(res.status).toBe(201);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row.customerName).toBe(evil);
    expect(await prisma.quoteRequest.count()).toBe(1);
  });

  it('cùng một IP gửi lần thứ 11 trong 15 phút → 429, theo đúng phong bì lỗi chuẩn của API', async () => {
    const ip = '203.0.113.7';
    for (let i = 0; i < 10; i += 1) {
      expect((await submit(validBody(variantId), { ip })).status).toBe(201);
    }
    const res = await submit(validBody(variantId), { ip });
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
  });
});

// Chủ dự án chốt ngày 2026-10-11: chỉ sản phẩm đang bán (active) của đúng brand mới được đưa
// vào yêu cầu tư vấn; số điện thoại bắt buộc đúng định dạng Việt Nam.
describe('POST /quote-requests — quy tắc chủ dự án đã chốt', () => {
  it.each(['draft', 'archived'] as const)('sản phẩm %s → 400 ITEMS_UNAVAILABLE, không tạo yêu cầu', async (status) => {
    const hidden = (await createProduct({ categoryId: brandId, status })).variant.id;
    const res = await submit(validBody(hidden, { items: [{ variantId: hidden, quantity: 1 }] }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ITEMS_UNAVAILABLE');
    expect(await prisma.quoteRequest.count()).toBe(0);
  });

  it('sản phẩm của brand khác → 400 ITEMS_UNAVAILABLE, không tạo yêu cầu', async () => {
    const otherBrand = await createBrand('thu-cung');
    const foreign = (await createProduct({ categoryId: otherBrand.id })).variant.id;
    const res = await submit(validBody(foreign, { items: [{ variantId: foreign, quantity: 1 }] }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ITEMS_UNAVAILABLE');
    expect(await prisma.quoteRequest.count()).toBe(0);
  });

  it('sản phẩm nằm trong danh mục con của brand vẫn được nhận', async () => {
    const child = await prisma.category.create({ data: { name: 'Bình hoa', slug: 'binh-hoa', parentId: brandId } });
    const inChild = (await createProduct({ categoryId: child.id })).variant.id;
    const res = await submit(validBody(inChild, { items: [{ variantId: inChild, quantity: 1 }] }));
    expect(res.status).toBe(201);
  });

  it.each(['0768986986', '0768.986.986', '0768 986 986', '+84768986986', '02438253456'])(
    'số điện thoại hợp lệ "%s" → 201',
    async (phone) => {
      expect((await submit(validBody(variantId, { phone }))).status).toBe(201);
    }
  );

  it.each(['123', 'abcdefghij', '090123', '09012345678901', '1768986986', '0768-986-98a'])(
    'số điện thoại sai định dạng "%s" → 400, không tạo yêu cầu',
    async (phone) => {
      const res = await submit(validBody(variantId, { phone }));
      expect(res.status).toBe(400);
      expect(await prisma.quoteRequest.count()).toBe(0);
    }
  );
});

describe('POST /quote-requests — bậc 9: tiếng Việt và khoảng trắng', () => {
  it('giữ nguyên dấu tiếng Việt và emoji, cắt khoảng trắng đầu cuối', async () => {
    const res = await submit(validBody(variantId, { customerName: '  Trần Đức Thắng 🏺  ', note: '  Giao giờ hành chính  ' }));
    expect(res.status).toBe(201);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(row.customerName).toBe('Trần Đức Thắng 🏺');
    expect(row.note).toBe('Giao giờ hành chính');
  });
});

describe('Yêu cầu tư vấn — khu vực đã đăng nhập', () => {
  async function seedQuote(over: Partial<{ status: string; finalAmount: number | null; brandSlug: string; userId: string | null }> = {}) {
    return prisma.quoteRequest.create({
      data: {
        brandSlug: over.brandSlug ?? BRAND_SLUG,
        userId: over.userId ?? null,
        customerName: 'Khách',
        phone: '0900000000',
        address: 'Hà Nội',
        items: [],
        status: over.status ?? 'NEW',
        finalAmount: over.finalAmount ?? null,
      },
    });
  }

  it('bậc 3: chưa đăng nhập → 401, tài khoản khách gọi API admin → 403', async () => {
    expect((await request(app).get(`${API}/admin/list`).set('X-Brand-Slug', BRAND_SLUG)).status).toBe(401);
    const customer = await createUser();
    expect((await asAdmin(tokenFor(customer)).get('/admin/list')).status).toBe(403);
    expect((await asAdmin(tokenFor(customer)).get('/admin/stats')).status).toBe(403);
  });

  it('/mine chỉ trả yêu cầu của chính mình và không lộ finalAmount', async () => {
    const me = await createUser();
    const other = await createUser();
    await seedQuote({ userId: me.id, status: 'CLOSED', finalAmount: 5_000_000 });
    await seedQuote({ userId: other.id });
    const res = await request(app).get(`${API}/mine`).set('Authorization', `Bearer ${tokenFor(me)}`).set('X-Brand-Slug', BRAND_SLUG);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).not.toHaveProperty('finalAmount');
  });

  it('bậc 0+4: chốt đơn ghi số tiền và thời điểm; quay lại "đã gọi" thì xoá cả hai', async () => {
    const admin = tokenFor(await createUser({ role: 'admin' }));
    const q = await seedQuote();
    expect((await asAdmin(admin).patch(`/admin/${q.id}/status`, { status: 'CLOSED', finalAmount: 3_000_000 })).status).toBe(200);
    let row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: q.id } });
    expect(row.finalAmount).toBe(3_000_000);
    expect(row.closedAt).not.toBeNull();

    expect((await asAdmin(admin).patch(`/admin/${q.id}/status`, { status: 'CONTACTED' })).status).toBe(200);
    row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: q.id } });
    expect(row).toMatchObject({ status: 'CONTACTED', finalAmount: null, closedAt: null });
  });

  it.each([
    ['chốt đơn không kèm số tiền', { status: 'CLOSED' }],
    ['số tiền âm', { status: 'CLOSED', finalAmount: -1 }],
    ['số tiền lẻ', { status: 'CLOSED', finalAmount: 1.5 }],
    ['trạng thái không có trong danh sách', { status: 'DONE' }],
    ['trạng thái là tên thuộc tính kế thừa của object (toString)', { status: 'toString' }],
    ['trạng thái là constructor', { status: 'constructor' }],
  ])('bậc 2: %s → 400, không ghi gì', async (_n, body) => {
    const admin = tokenFor(await createUser({ role: 'admin' }));
    const q = await seedQuote();
    const res = await asAdmin(admin).patch(`/admin/${q.id}/status`, body);
    expect(res.status).toBe(400);
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: q.id } });
    expect(row.status).toBe('NEW');
  });

  // Chủ dự án chốt ngày 2026-10-11: chốt đơn bắt buộc nhập số tiền thật, không được bỏ trống,
  // và phải là con số hợp lệ. Trước đây ô trống bị JavaScript đổi thành 0 và lưu thành đơn 0đ.
  it.each([
    ['null', null],
    ['chuỗi rỗng', ''],
    ['chỉ có khoảng trắng', '   '],
    ['chữ', 'ba triệu'],
    ['true', true],
    ['mảng rỗng', []],
    ['vô cực', 'Infinity'],
  ])('bậc 2: chốt đơn với số tiền %s → 400 INVALID_AMOUNT, không ghi gì', async (_n, finalAmount) => {
    const admin = tokenFor(await createUser({ role: 'admin' }));
    const q = await seedQuote();
    const res = await asAdmin(admin).patch(`/admin/${q.id}/status`, { status: 'CLOSED', finalAmount });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_AMOUNT');
    const row = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: q.id } });
    expect(row).toMatchObject({ status: 'NEW', finalAmount: null });
  });

  it('bậc 1: chốt đơn 0đ khi admin gõ rõ số 0, và nhận số tiền gửi dạng chuỗi số', async () => {
    const admin = tokenFor(await createUser({ role: 'admin' }));
    for (const [finalAmount, saved] of [[0, 0], ['2500000', 2_500_000]] as const) {
      const q = await seedQuote();
      expect((await asAdmin(admin).patch(`/admin/${q.id}/status`, { status: 'CLOSED', finalAmount })).status).toBe(200);
      expect((await prisma.quoteRequest.findUniqueOrThrow({ where: { id: q.id } })).finalAmount).toBe(saved);
    }
  });

  it('bậc 1: chốt một đơn 3 tỷ đồng (tác phẩm nghệ thuật) không được làm sập server', async () => {
    const admin = tokenFor(await createUser({ role: 'admin' }));
    const q = await seedQuote();
    const res = await asAdmin(admin).patch(`/admin/${q.id}/status`, { status: 'CLOSED', finalAmount: 3_000_000_000 });
    expect(res.status).toBeLessThan(500);
  });

  it('bậc 4: chỉ xoá được yêu cầu "chưa gọi"; đã gọi/đã chốt → 409; không tồn tại → 404', async () => {
    const admin = tokenFor(await createUser({ role: 'admin' }));
    const fresh = await seedQuote();
    const called = await seedQuote({ status: 'CONTACTED' });
    const closed = await seedQuote({ status: 'CLOSED', finalAmount: 1 });

    expect((await asAdmin(admin).del(`/admin/${fresh.id}`)).status).toBe(200);
    expect(await prisma.quoteRequest.findUnique({ where: { id: fresh.id } })).toBeNull();

    for (const q of [called, closed]) {
      const res = await asAdmin(admin).del(`/admin/${q.id}`);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('QUOTE_NOT_DELETABLE');
      expect(await prisma.quoteRequest.findUnique({ where: { id: q.id } })).not.toBeNull();
    }
    expect((await asAdmin(admin).del('/admin/00000000-0000-0000-0000-000000000000')).status).toBe(404);
  });

  it('bậc 3: admin của brand này không sửa, không xoá được yêu cầu của brand khác (trả 404)', async () => {
    await createBrand('thu-cung');
    const admin = tokenFor(await createUser({ role: 'admin' }));
    const foreign = await seedQuote({ brandSlug: 'thu-cung' });
    expect((await asAdmin(admin).patch(`/admin/${foreign.id}/status`, { status: 'CONTACTED' })).status).toBe(404);
    expect((await asAdmin(admin).del(`/admin/${foreign.id}`)).status).toBe(404);
    expect(await prisma.quoteRequest.findUnique({ where: { id: foreign.id } })).not.toBeNull();
  });

  it('thống kê tính đúng doanh thu, số đơn chốt và tỉ lệ chốt', async () => {
    const admin = tokenFor(await createUser({ role: 'admin' }));
    await seedQuote();
    await seedQuote({ status: 'CONTACTED' });
    for (const amount of [1_000_000, 3_000_000]) {
      const q = await seedQuote();
      await asAdmin(admin).patch(`/admin/${q.id}/status`, { status: 'CLOSED', finalAmount: amount });
    }
    const res = await asAdmin(admin).get('/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ totalRequests: 4, closedCount: 2, revenue: 4_000_000, averageOrderValue: 2_000_000, conversionRate: 50 });
  });

  it('bậc 2: thống kê với ngày không hợp lệ → 400, không phải 500', async () => {
    const admin = tokenFor(await createUser({ role: 'admin' }));
    const res = await asAdmin(admin).get('/admin/stats?from=khong-phai-ngay');
    expect(res.status).toBe(400);
  });
});
