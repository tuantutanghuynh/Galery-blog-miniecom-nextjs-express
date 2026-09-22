import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../services/prisma';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

// Yêu cầu tư vấn mua hàng: khách chọn sản phẩm, để lại số điện thoại, nhân viên gọi lại và
// chốt đơn thủ công. Không có thanh toán, không trừ kho, không giữ hàng — nên ở đây không có
// transaction và không có bất kỳ thao tác nào lên tồn kho.

export const QUOTE_STATUS = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  CLOSED: 'CLOSED',
} as const;

export type QuoteStatus = (typeof QUOTE_STATUS)[keyof typeof QUOTE_STATUS];

const MAX_ITEMS = 50;

// Nhận yêu cầu từ khách vãng lai.
export const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) throw new ApiError(400, 'BRAND_REQUIRED', 'Thiếu thông tin thương hiệu');
  const { customerName, phone, email, address, note, items, website_url } = req.body;

  // Bot điền vào trường ẩn -> trả 200 giả rồi vứt đi. Báo lỗi tử tế chỉ dạy bot lần sau né.
  if (website_url) {
    return sendSuccess(res, { message: 'Đã nhận yêu cầu tư vấn.' }, null, 201);
  }

  if (!customerName?.trim() || !phone?.trim() || !address?.trim()) {
    throw new ApiError(400, 'MISSING_FIELDS', 'Vui lòng điền họ tên, số điện thoại và địa chỉ.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'EMPTY_ITEMS', 'Chưa có sản phẩm nào trong yêu cầu.');
  }

  if (items.length > MAX_ITEMS) {
    throw new ApiError(400, 'TOO_MANY_ITEMS', 'Yêu cầu có quá nhiều sản phẩm.');
  }

  const variantIds = [...new Set(items.map((i: any) => i.variantId).filter(Boolean))] as string[];
  if (variantIds.length === 0) {
    throw new ApiError(400, 'EMPTY_ITEMS', 'Chưa có sản phẩm nào trong yêu cầu.');
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });

  const byId = new Map(variants.map((v) => [v.id, v]));

  const snapshot = items
    .map((raw: any) => {
      const variant = byId.get(raw.variantId);
      if (!variant) return null;

      const quantity = Math.min(Math.max(Number(raw.quantity) || 1, 1), 99);
      const variantAttrs = (variant.variantAttributes as Record<string, any>) || {};
      return {
        variantId: variant.id,
        sku: variant.sku,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantLabel: variantAttrs?.label || variant.sku,
        unitPrice: variant.price,
        quantity,
        lineTotal: variant.price * quantity,
        imageUrl: variant.imageUrl || variant.product.images[0]?.url || null,
      };
    })
    .filter(Boolean) as Prisma.InputJsonValue[];

  if (snapshot.length === 0) {
    throw new ApiError(400, 'ITEMS_UNAVAILABLE', 'Các sản phẩm trong yêu cầu không còn tồn tại.');
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

  sendSuccess(res, { id: created.id, createdAt: created.createdAt }, null, 201);
});

// Danh sách yêu cầu của chính người đang đăng nhập, cho trang cá nhân.
export const listMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) throw new ApiError(401, 'UNAUTHENTICATED', 'Chưa xác thực');
  const rows = await prisma.quoteRequest.findMany({
    where: { userId: req.user.id, brandSlug: req.brand.slug },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  sendSuccess(res, rows.map(({ finalAmount, ...rest }) => rest));
});

// Danh sách cho nhân viên, mới nhất trước.
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) throw new ApiError(400, 'BRAND_REQUIRED', 'Thiếu thông tin thương hiệu');
  const { page = '1', pageSize = '20', status } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: Prisma.QuoteRequestWhereInput = { brandSlug: req.brand.slug };
  if (status && typeof status === 'string' && status in QUOTE_STATUS) {
    where.status = status;
  }

  const [rows, total] = await Promise.all([
    prisma.quoteRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.quoteRequest.count({ where }),
  ]);

  sendSuccess(res, rows, { page: Number(page), pageSize: take, total });
});

// Nhân viên đánh dấu đã gọi hoặc đã chốt.
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) throw new ApiError(400, 'BRAND_REQUIRED', 'Thiếu thông tin thương hiệu');
  const { status, finalAmount } = req.body;
  if (!status || !(status in QUOTE_STATUS)) {
    throw new ApiError(400, 'INVALID_STATUS', 'Trạng thái không hợp lệ.');
  }

  const data: Prisma.QuoteRequestUpdateInput = { status };

  if (status === QUOTE_STATUS.CLOSED) {
    const amount = Number(finalAmount);
    if (!Number.isInteger(amount) || amount < 0) {
      throw new ApiError(400, 'INVALID_AMOUNT', 'Vui lòng nhập số tiền đã chốt.');
    }
    data.finalAmount = amount;
    data.closedAt = new Date();
  } else {
    data.finalAmount = null;
    data.closedAt = null;
  }

  const id = req.params.id as string;
  const { count } = await prisma.quoteRequest.updateMany({
    where: { id, brandSlug: req.brand.slug },
    data,
  });
  if (count === 0) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Không tìm thấy yêu cầu.');

  sendSuccess(res, { id, ...data });
});

// Doanh thu và tỉ lệ chốt theo khoảng thời gian.
export const stats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) throw new ApiError(400, 'BRAND_REQUIRED', 'Thiếu thông tin thương hiệu');
  const { from, to } = req.query;

  const closedWhere: Prisma.QuoteRequestWhereInput = {
    brandSlug: req.brand.slug,
    closedAt: { not: null },
  };

  if (from || to) {
    closedWhere.closedAt = {
      not: null,
      ...(from && typeof from === 'string' ? { gte: new Date(from) } : {}),
      ...(to && typeof to === 'string' ? { lte: new Date(to) } : {}),
    };
  }

  const createdWhere: Prisma.QuoteRequestWhereInput = { brandSlug: req.brand.slug };
  if (from || to) {
    createdWhere.createdAt = {
      ...(from && typeof from === 'string' ? { gte: new Date(from) } : {}),
      ...(to && typeof to === 'string' ? { lte: new Date(to) } : {}),
    };
  }

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

// Xoá hẳn, dùng để dọn spam lọt qua honeypot.
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) throw new ApiError(400, 'BRAND_REQUIRED', 'Thiếu thông tin thương hiệu');
  const id = req.params.id as string;
  const { count } = await prisma.quoteRequest.deleteMany({
    where: { id, brandSlug: req.brand.slug, status: QUOTE_STATUS.NEW },
  });

  if (count === 0) {
    const existing = await prisma.quoteRequest.findFirst({
      where: { id, brandSlug: req.brand.slug },
    });
    if (existing) {
      throw new ApiError(
        409,
        'QUOTE_NOT_DELETABLE',
        'Chỉ xoá được yêu cầu chưa gọi. Yêu cầu đã gọi hoặc đã chốt là dữ liệu bán hàng.'
      );
    }
    throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Không tìm thấy yêu cầu.');
  }

  sendSuccess(res, { message: 'Đã xoá yêu cầu.' });
});

export default { submit, listMine, adminList, updateStatus, stats, remove, QUOTE_STATUS };
