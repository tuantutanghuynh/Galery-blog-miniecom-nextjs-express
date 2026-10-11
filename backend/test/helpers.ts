import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../services/prisma';
import { signAccessToken } from '../services/jwt.service';

// Hàm trợ giúp dùng chung cho các test có ghi database. Mọi hàm ở đây chỉ chạy được trên
// database test: test/setup.ts đã chặn mọi URL không phải localhost + tên có chữ "test".

export const BRAND_SLUG = 'gom-su-trang-tri';

// Gọi ở đầu mỗi file test có ghi database. Khi chưa có .env.test, setup.ts trỏ database về một
// địa chỉ không tồn tại; báo lỗi rõ ràng ở đây hay hơn để từng test chết vì lỗi kết nối khó hiểu.
export function requireTestDatabase(): void {
  if ((process.env.DATABASE_URL ?? '').includes('not_configured')) {
    throw new Error('Chưa có database test. Xem backend/.env.test.example để dựng.');
  }
}

// Xoá sạch mọi bảng giữa các test để mỗi test tự đứng được, không phụ thuộc thứ tự chạy.
// Tên bảng lấy từ catalog của PostgreSQL, không bao giờ từ dữ liệu người dùng.
export async function resetDb(): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}

// Mỗi request dùng một IP giả riêng (qua X-Forwarded-For, app đang bật trust proxy) để bộ giới
// hạn tốc độ của test này không ảnh hưởng test khác. Test về giới hạn tốc độ thì cố ý dùng chung.
let ipCounter = 0;
export function uniqueIp(): string {
  ipCounter += 1;
  return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`;
}

export async function createBrand(slug = BRAND_SLUG) {
  return prisma.category.create({ data: { name: `Thương hiệu ${slug}`, slug } });
}

export async function createProduct(opts: {
  categoryId: string;
  price?: number;
  status?: 'active' | 'draft' | 'archived';
  name?: string;
}) {
  const suffix = crypto.randomBytes(4).toString('hex');
  const product = await prisma.product.create({
    data: {
      categoryId: opts.categoryId,
      name: opts.name ?? `Bình gốm ${suffix}`,
      slug: `binh-gom-${suffix}`,
      status: opts.status ?? 'active',
      variants: {
        create: {
          sku: `SKU-${suffix}`,
          price: opts.price ?? 1_500_000,
          variantKey: 'default',
          variantAttributes: { label: 'Mặc định' },
        },
      },
    },
    include: { variants: true },
  });
  return { product, variant: product.variants[0] };
}

export const STRONG_PASSWORD = 'Matkhau#2026';

export async function createUser(opts: { email?: string; role?: 'customer' | 'admin'; password?: string } = {}) {
  const email = opts.email ?? `khach-${crypto.randomBytes(4).toString('hex')}@example.com`;
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(opts.password ?? STRONG_PASSWORD, 4),
      role: opts.role ?? 'customer',
    },
  });
}

// Token truy cập ký trực tiếp, không đi qua /auth/login: để các test không liên quan đến đăng
// nhập không tiêu hao lượt của bộ giới hạn tốc độ.
export function tokenFor(user: { id: string; role: string }): string {
  return signAccessToken({ sub: user.id, role: user.role });
}

export { prisma };
