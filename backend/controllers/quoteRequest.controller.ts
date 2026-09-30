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

// Nhận yêu cầu từ khách vãng lai. Đây là endpoint công khai thứ hai (sau /contact) cho phép
// người lạ ghi vào database, nên nó mang theo honeypot giống hệt form liên hệ.
//
// Client chỉ gửi variantId và số lượng. Tên, SKU và giá đều do server đọc lại từ database —
// giá client gửi lên không bao giờ được tin, kể cả khi luồng này không hề chuyển tiền: nhân
// viên sẽ đọc đúng con số đó để báo giá qua điện thoại, nên một giá bị sửa từ trình duyệt sẽ
// thành cam kết miệng với khách.
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
      // Bỏ qua dòng trỏ tới sản phẩm đã bị xoá thay vì làm hỏng cả yêu cầu: khách để trang mở vài
      // ngày rồi mới gửi là chuyện bình thường, và mất một dòng vẫn tốt hơn mất cả khách.
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
      // Gắn tài khoản nếu khách tình cờ đang đăng nhập. Không có thì để trống — luồng này
      // không bắt đăng nhập, xem ghi chú ở model QuoteRequest.
      userId: req.user?.id || null,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      address: address.trim(),
      note: note?.trim() || null,
      items: snapshot,
    },
  });

  // Chỉ trả về id và mốc thời gian. Trang cảm ơn không cần đọc lại gì, và đây là endpoint công
  // khai nên trả ít nhất có thể.
  sendSuccess(res, { id: created.id, createdAt: created.createdAt }, null, 201);
});

// Danh sách yêu cầu của chính người đang đăng nhập, cho trang cá nhân.
//
// Lọc theo userId chứ không theo số điện thoại: tra bằng số điện thoại thì ai biết số của
// người khác là đọc được họ tên và địa chỉ của họ.
export const listMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) throw new ApiError(401, 'UNAUTHENTICATED', 'Chưa xác thực');
  const rows = await prisma.quoteRequest.findMany({
    where: { userId: req.user.id, brandSlug: req.brand.slug },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Không trả finalAmount: đó là con số nhân viên chốt nội bộ, có thể khác giá khách thấy
  // và chưa chắc đã thống nhất với khách.
  sendSuccess(res, rows.map(({ finalAmount, ...rest }) => rest));
});

// Danh sách cho nhân viên, mới nhất trước. Lọc theo brand để khi storefront thứ hai chạy thì
// hai bên không đọc đơn của nhau — khác với hộp thư liên hệ vốn dùng chung.
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

// Nhân viên đánh dấu đã gọi hoặc đã chốt. Kiểm tra brand trong cùng câu lệnh update để người
// của brand này không sửa được yêu cầu của brand kia.
//
// Chốt đơn bắt buộc kèm số tiền thật đã thoả thuận — đó là con số duy nhất dùng được cho
// thống kê doanh thu. Rời khỏi trạng thái chốt thì xoá cả hai trường, để không còn bản ghi
// nào mang số tiền chốt mà lại không ở trạng thái đã chốt.
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

// Doanh thu và tỉ lệ chốt theo khoảng thời gian, tính trên số tiền thật chứ không phải giá
// khách xem trên web. `from`/`to` là chuỗi ngày ISO; thiếu thì lấy toàn bộ lịch sử.
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

// Xoá hẳn, dùng để dọn spam lọt qua honeypot. Không có thùng rác và không hoàn tác được.
//
// Chỉ xoá được yêu cầu còn ở trạng thái "chưa gọi", vì spam thì luôn nằm ở đó. Đơn đã gọi là
// đã có người thật nói chuyện, đơn đã chốt là một lần bán hàng thật — xoá chúng là xoá sổ
// sách, và thống kê doanh thu sẽ hụt đi mà không ai biết. Chặn ngay trong câu lệnh xoá chứ
// không chỉ ẩn nút trên giao diện, vì giao diện không phải là nơi bảo vệ dữ liệu.
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
