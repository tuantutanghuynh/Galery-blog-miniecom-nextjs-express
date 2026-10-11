import type { Request, Response } from 'express';

import type { Prisma } from '@prisma/client';

import prisma from '../services/prisma';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

import { parsePagination } from '../utils/pagination';

import * as Sentry from '@sentry/node';

import { sendMail, shopInbox } from '../services/mail.service';

import { quoteShopEmail, quoteCustomerEmail } from '../services/mailTemplates';

import type { QuoteLine, QuoteSummary } from '../services/mailTemplates';

export const QUOTE_STATUS = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  CLOSED: 'CLOSED',
} as const;

export type QuoteStatus = (typeof QUOTE_STATUS)[keyof typeof QUOTE_STATUS];

const MAX_ITEMS = 50;

// Cột finalAmount là Int của PostgreSQL. Vượt mức này thì database từ chối và người dùng nhận 500,
// nên chặn trước bằng một lỗi nói rõ lý do.
const MAX_FINAL_AMOUNT = 2_147_483_647;

// Bắt đầu bằng 0 hoặc +84. Di động: 03/05/07/08/09 + 8 số (10 số). Máy bàn: 02 + 9 số (11 số).
// Bỏ qua dấu chấm, khoảng trắng, gạch nối, ngoặc vì khách hay gõ kiểu 0768.986.986.
const PHONE_PATTERN = /^(?:0|\+84)(?:[35789]\d{8}|2\d{9})$/;

function isVietnamesePhone(raw: string): boolean {
  return PHONE_PATTERN.test(raw.replace(/[\s.\-()]/g, ''));
}

// `status in QUOTE_STATUS` coi cả thuộc tính có sẵn của mọi object (toString, constructor) là
// hợp lệ, và giá trị rác đó sẽ được ghi thẳng vào database. So với danh sách giá trị thật.
function isQuoteStatus(value: unknown): value is QuoteStatus {
  return typeof value === 'string' && (Object.values(QUOTE_STATUS) as string[]).includes(value);
}

// Ngày trong query thống kê. Không có thì bỏ qua; có mà không đọc được thì báo 400, vì
// `new Date('abc')` ra Invalid Date và Prisma ném lỗi thành 500.
function parseDateParam(raw: unknown, name: string): Date | undefined {
  if (raw === undefined || raw === '') return undefined;
  const date = typeof raw === 'string' ? new Date(raw) : new Date(NaN);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, 'INVALID_DATE', `Giá trị "${name}" không phải ngày hợp lệ.`);
  }
  return date;
}

interface QuoteRequestItemInput {
  variantId?: string;
  quantity?: number | string;
}

// Gửi hai thư sau khi một yêu cầu tư vấn được lưu: báo cho shop, và xác nhận cho khách nếu khách
// có để lại email (ô email trong form là tuỳ chọn).
//
// Cố ý không await. Yêu cầu đã nằm an toàn trong database, nên thư chỉ là thông báo phụ: khách
// không nên phải chờ SMTP, càng không nên nhận lỗi chỉ vì Google chậm hay từ chối gửi. Mỗi thư
// bắt lỗi riêng để thư này hỏng không kéo thư kia hỏng theo, và lỗi được báo lên Sentry vì một
// shop bỏ lỡ thông báo đơn hàng là mất khách thật.
function notifyQuoteRequest(quote: QuoteSummary, lines: QuoteLine[]): void {
  const report = (label: string) => (err: unknown) => {
    console.error(`[mail] Gửi ${label} thất bại:`, err instanceof Error ? err.message : err);
    Sentry.captureException(err);
  };

  const shop = shopInbox();
  if (shop) {
    const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin/quote-requests`;
    sendMail(quoteShopEmail(shop, quote, lines, adminUrl)).catch(report('thư báo shop'));
  }

  if (quote.email) {
    const phone = process.env.SHOP_PHONE || '0768.986.986';
    sendMail(quoteCustomerEmail(quote.email, quote, lines, phone)).catch(report('thư xác nhận cho khách'));
  }
}

/**
 * Tiếp nhận yêu cầu tư vấn mua hàng từ khách (Lead / Báo giá).
 * - Khách chọn sản phẩm, để lại số điện thoại/địa chỉ để nhân viên gọi lại tư vấn.
 * - Kiểm tra honeypot chống bot.
 * - Chụp lại bản chụp (snapshot) của sản phẩm (tên, giá, hình ảnh) lưu vào trường JSON items.
 * - Không trừ kho và không giữ hàng.
 */
export const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) {
    throw new ApiError(
      400,
      'BRAND_REQUIRED',
      'Thiếu thông tin thương hiệu'
    );
  }

  const { customerName, phone, email, address, note, items, website_url } = req.body;

  // Honeypot check: Bot điền vào trường ẩn -> trả 200 giả rồi bỏ qua
  if (website_url) {
    return sendSuccess(
      res,
      { message: 'Đã nhận yêu cầu tư vấn.' },
      null,
      201
    );
  }

  // Body là JSON do client tự gửi, nên "họ tên" có thể là số, mảng hay object. Chặn ở đây, nếu
  // không thì `.trim()` phía dưới ném TypeError và khách nhận về lỗi 500 khó hiểu.
  if ([customerName, phone, address, email, note].some((v) => v != null && typeof v !== 'string')) {
    throw new ApiError(
      400,
      'INVALID_FIELDS',
      'Dữ liệu gửi lên không hợp lệ.'
    );
  }

  if (!customerName?.trim() || !phone?.trim() || !address?.trim()) {
    throw new ApiError(
      400,
      'MISSING_FIELDS',
      'Vui lòng điền họ tên, số điện thoại và địa chỉ.'
    );
  }

  if (!isVietnamesePhone(phone)) {
    throw new ApiError(
      400,
      'INVALID_PHONE',
      'Số điện thoại không hợp lệ. Vui lòng nhập số di động 10 số hoặc số máy bàn 11 số.'
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(
      400,
      'EMPTY_ITEMS',
      'Chưa có sản phẩm nào trong yêu cầu.'
    );
  }

  if (items.length > MAX_ITEMS) {
    throw new ApiError(
      400,
      'TOO_MANY_ITEMS',
      'Yêu cầu có quá nhiều sản phẩm.'
    );
  }

  const variantIds = [
    ...new Set(
      items
        .map((i: QuoteRequestItemInput) => i.variantId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (variantIds.length === 0) {
    throw new ApiError(
      400,
      'EMPTY_ITEMS',
      'Chưa có sản phẩm nào trong yêu cầu.'
    );
  }

  // Chỉ nhận sản phẩm đang bán của đúng brand này. Thiếu điều kiện thì khách đoán được id có thể
  // hỏi giá món còn ở dạng nháp, món đã ngừng bán, hay món của storefront khác.
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: variantIds },
      product: {
        status: 'active',
        categoryId: { in: req.brand.categoryIds },
      },
    },
    include: {
      product: {
        include: {
          images: {
            orderBy: { position: 'asc' },
            take: 1,
          },
        },
      },
    },
  });

  const byId = new Map(variants.map((v) => [v.id, v]));

  const snapshot = items
    .map((raw: QuoteRequestItemInput) => {
      if (!raw.variantId) return null;

      const variant = byId.get(raw.variantId);

      if (!variant) return null;

      // Làm tròn xuống trước khi kẹp: số món phải là số nguyên, kéo theo thành tiền là số nguyên.
      const quantity = Math.min(Math.max(Math.floor(Number(raw.quantity)) || 1, 1), 99);

      const variantAttrs =
        (variant.variantAttributes as Record<string, unknown>) || {};

      const label =
        typeof variantAttrs.label === 'string'
          ? variantAttrs.label
          : variant.sku;

      return {
        variantId: variant.id,
        sku: variant.sku,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantLabel: label,
        unitPrice: variant.price,
        quantity,
        lineTotal: variant.price * quantity,
        imageUrl: variant.imageUrl || variant.product.images[0]?.url || null,
      };
    })
    // Lọc null bằng type guard thay vì ép kiểu: giữ được kiểu thật của từng dòng để thư thông
    // báo phía dưới dùng lại, không phải đoán lại cấu trúc của một mảng JSON vô danh.
    .filter(<T,>(line: T | null): line is T => line !== null);

  if (snapshot.length === 0) {
    throw new ApiError(
      400,
      'ITEMS_UNAVAILABLE',
      'Các sản phẩm trong yêu cầu không còn tồn tại.'
    );
  }

  const created = await prisma.quoteRequest.create({
    data: {
      brandSlug: req.brand.slug,
      userId: req.user?.id || null,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      address: address.trim(),
      note: note?.trim() || null,
      items: snapshot,
    },
  });

  notifyQuoteRequest(created, snapshot);

  sendSuccess(
    res,
    {
      id: created.id,
      createdAt: created.createdAt,
    },
    null,
    201
  );
});

/**
 * Lấy danh sách yêu cầu tư vấn của chính người dùng đang đăng nhập (cho trang cá nhân).
 */
export const listMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa xác thực'
    );
  }

  const rows = await prisma.quoteRequest.findMany({
    where: {
      userId: req.user.id,
      brandSlug: req.brand.slug,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  sendSuccess(res, rows.map(({ finalAmount, ...rest }) => rest));
});

/**
 * Danh sách yêu cầu tư vấn dành cho nhân viên chốt đơn (Admin).
 * - Sắp xếp yêu cầu mới nhất lên đầu.
 * - Hỗ trợ lọc theo trạng thái (NEW, CONTACTED, CLOSED).
 * - Hỗ trợ phân trang chuẩn.
 */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) {
    throw new ApiError(
      400,
      'BRAND_REQUIRED',
      'Thiếu thông tin thương hiệu'
    );
  }

  const { status } = req.query;

  const { page, take, skip } = parsePagination(req.query, { defaultSize: 20, maxSize: 100 });

  const where: Prisma.QuoteRequestWhereInput = {
    brandSlug: req.brand.slug,
  };

  if (isQuoteStatus(status)) {
    where.status = status;
  }

  const [rows, total] = await Promise.all([
    prisma.quoteRequest.findMany({
      where,
      // `id` làm tie-breaker: hai mục trùng hệt giá trị createdAt vẫn có thứ tự cố định giữa các trang.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
    prisma.quoteRequest.count({ where }),
  ]);

  sendSuccess(res, rows, {
    page,
    pageSize: take,
    total,
  });
});

/**
 * Nhân viên cập nhật trạng thái của yêu cầu tư vấn (Đã liên hệ hoặc Đã chốt đơn).
 * - Khi chuyển sang CLOSED: Bắt buộc phải nhập `finalAmount` (số tiền chốt thực tế sau thương lượng).
 * - Cập nhật thời điểm chốt đơn (closedAt).
 */
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) {
    throw new ApiError(
      400,
      'BRAND_REQUIRED',
      'Thiếu thông tin thương hiệu'
    );
  }

  const { status, finalAmount } = req.body;

  if (!isQuoteStatus(status)) {
    throw new ApiError(
      400,
      'INVALID_STATUS',
      'Trạng thái không hợp lệ.'
    );
  }

  const data: Prisma.QuoteRequestUpdateInput = { status };

  if (status === QUOTE_STATUS.CLOSED) {
    // Chỉ nhận số hoặc chuỗi chữ số. Không đưa thẳng vào Number(): Number('') và Number(null)
    // đều ra 0, Number(true) ra 1, nên ô bỏ trống sẽ lặng lẽ thành một đơn chốt 0đ.
    const amount =
      typeof finalAmount === 'number'
        ? finalAmount
        : typeof finalAmount === 'string' && finalAmount.trim() !== ''
          ? Number(finalAmount)
          : NaN;

    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new ApiError(
        400,
        'INVALID_AMOUNT',
        'Vui lòng nhập số tiền đã chốt.'
      );
    }

    if (amount > MAX_FINAL_AMOUNT) {
      throw new ApiError(
        400,
        'AMOUNT_TOO_LARGE',
        'Số tiền vượt quá giới hạn hệ thống (tối đa 2.147.483.647đ).'
      );
    }

    data.finalAmount = amount;
    data.closedAt = new Date();
  } else {
    data.finalAmount = null;
    data.closedAt = null;
  }

  const id = req.params.id as string;

  const { count } = await prisma.quoteRequest.updateMany({
    where: {
      id,
      brandSlug: req.brand.slug,
    },
    data,
  });

  if (count === 0) {
    throw new ApiError(
      404,
      'QUOTE_NOT_FOUND',
      'Không tìm thấy yêu cầu.'
    );
  }

  sendSuccess(res, { id, ...data });
});

/**
 * Thống kê doanh thu và tỷ lệ chốt đơn theo khoảng thời gian.
 * - Tính tổng doanh thu thực tế từ trường `finalAmount` của các đơn đã chốt (CLOSED).
 * - Tính tỷ lệ chuyển đổi (conversionRate = đơn đã chốt / tổng yêu cầu nhận được).
 */
export const stats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) {
    throw new ApiError(
      400,
      'BRAND_REQUIRED',
      'Thiếu thông tin thương hiệu'
    );
  }

  const from = parseDateParam(req.query.from, 'from');
  const to = parseDateParam(req.query.to, 'to');
  const range = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  const closedWhere: Prisma.QuoteRequestWhereInput = {
    brandSlug: req.brand.slug,
    closedAt: { not: null, ...range },
  };

  const createdWhere: Prisma.QuoteRequestWhereInput = {
    brandSlug: req.brand.slug,
    ...(from || to ? { createdAt: range } : {}),
  };

  const [closed, totalRequests] = await Promise.all([
    prisma.quoteRequest.aggregate({
      where: closedWhere,
      _sum: { finalAmount: true },
      _count: true,
    }),
    prisma.quoteRequest.count({ where: createdWhere }),
  ]);

  const closedCount = closed._count || 0;

  const revenue = closed._sum.finalAmount || 0;

  sendSuccess(res, {
    totalRequests,
    closedCount,
    revenue,
    averageOrderValue: closedCount > 0 ? Math.round(revenue / closedCount) : 0,
    conversionRate: totalRequests > 0 ? Math.round((closedCount / totalRequests) * 100) : 0,
  });
});

/**
 * Xóa một yêu cầu tư vấn.
 * - Chỉ cho phép xóa các yêu cầu ở trạng thái NEW (chưa gọi điện, có thể là tin nhắn rác hoặc spam).
 * - Không cho phép xóa đơn đã gọi hoặc đã chốt vì đây là dữ liệu báo cáo kinh doanh.
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) {
    throw new ApiError(
      400,
      'BRAND_REQUIRED',
      'Thiếu thông tin thương hiệu'
    );
  }

  const id = req.params.id as string;

  const { count } = await prisma.quoteRequest.deleteMany({
    where: {
      id,
      brandSlug: req.brand.slug,
      status: QUOTE_STATUS.NEW,
    },
  });

  if (count === 0) {
    const existing = await prisma.quoteRequest.findFirst({
      where: {
        id,
        brandSlug: req.brand.slug,
      },
    });

    if (existing) {
      throw new ApiError(
        409,
        'QUOTE_NOT_DELETABLE',
        'Chỉ xoá được yêu cầu chưa gọi. Yêu cầu đã gọi hoặc đã chốt là dữ liệu bán hàng.'
      );
    }

    throw new ApiError(
      404,
      'QUOTE_NOT_FOUND',
      'Không tìm thấy yêu cầu.'
    );
  }

  sendSuccess(res, {
    message: 'Đã xoá yêu cầu.',
  });
});

export default {
  submit,
  listMine,
  adminList,
  updateStatus,
  stats,
  remove,
  QUOTE_STATUS,
};
