import crypto from 'crypto';

import type { Request, Response } from 'express';

import type { Prisma } from '@prisma/client';

import prisma from '../services/prisma';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

import { PRODUCT_STATUS } from '../constants/product';

import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ORDER_TRANSITIONS,
  PAYMENT_WINDOW_HOURS,
  SHIPPING_FEE_NOT_CALCULATED,
} from '../constants/order';

/**
 * Hàm tiện ích: Sinh mã đơn hàng ngẫu nhiên, thân thiện với người dùng (ví dụ: NP-260930-K3F9A2).
 * - Kết hợp tiền tố thương hiệu (NP), ngày tạo (YYMMDD) và 6 ký tự ngẫu nhiên base-36.
 */
function generateOrderCode(): string {
  const d = new Date();

  const date = [
    String(d.getFullYear()).slice(2),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('');

  const tail = crypto
    .randomBytes(4)
    .readUInt32BE(0)
    .toString(36)
    .toUpperCase()
    .padStart(6, '0')
    .slice(0, 6);

  return `NP-${date}-${tail}`;
}

/**
 * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái đơn hàng (Finite State Machine).
 * - Tránh việc chuyển trạng thái sai quy trình (ví dụ: đơn đã CANCELLED không thể tự nhảy sang CONFIRMED).
 */
function assertTransition(from: string, to: string): void {
  const allowed = ORDER_TRANSITIONS[from] || [];

  if (!allowed.includes(to)) {
    throw new ApiError(
      409,
      'INVALID_STATE_TRANSITION',
      `Không thể chuyển đơn từ ${from} sang ${to}`
    );
  }
}

/**
 * Tạo đơn hàng mới từ giỏ hàng hiện tại của người dùng.
 * - Toàn bộ quy trình chạy trong 1 Database Transaction:
 *   1. Lấy thông tin giỏ hàng, sắp xếp variantId để triệt tiêu nguy cơ Deadlock.
 *   2. Kiểm tra tồn kho và thực hiện cập nhật có điều kiện (conditional update):
 *      - Nếu là COD: Trừ trực tiếp vào `stockQuantity`.
 *      - Nếu là Chuyển khoản (Bank Transfer): Tăng `reservedQuantity` (giữ hàng tạm thời trong PAYMENT_WINDOW_HOURS).
 *   3. Tạo bản ghi Order cùng các dòng OrderItem (chụp lại giá và tên sản phẩm tại thời điểm mua).
 *   4. Xóa sạch các sản phẩm trong giỏ hàng (CartItem).
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa xác thực'
    );
  }

  const { paymentMethod, shippingAddress, note } = req.body;

  const cart = await prisma.cart.findUnique({
    where: {
      userId_brandSlug: {
        userId: req.user.id,
        brandSlug: req.brand.slug,
      },
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(
      422,
      'CART_EMPTY',
      'Giỏ hàng đang trống'
    );
  }

  const unavailable = cart.items.find(
    (i) => i.variant.product.status !== PRODUCT_STATUS.ACTIVE
  );

  if (unavailable) {
    throw new ApiError(
      409,
      'PRODUCT_UNAVAILABLE',
      `Sản phẩm "${unavailable.variant.product.name}" hiện không bán`
    );
  }

  // Sắp xếp các sản phẩm theo ID tăng dần để đảm bảo mọi transaction luôn giữ khóa theo cùng 1 thứ tự (chống Deadlock)
  const items = [...cart.items].sort((a, b) =>
    a.variantId < b.variantId ? -1 : 1
  );

  const userId = req.user.id;

  const brandSlug = req.brand.slug;

  const isCod = paymentMethod === PAYMENT_METHOD.COD;

  const order = await prisma.$transaction(
    async (tx) => {
      for (const item of items) {
        // Cập nhật nguyên tử kèm điều kiện tồn kho
        const claimed = isCod
          ? await tx.$executeRaw`
              UPDATE "ProductVariant"
              SET "stockQuantity" = "stockQuantity" - ${item.quantity}
              WHERE "id" = ${item.variantId}
                AND "stockQuantity" - "reservedQuantity" >= ${item.quantity}`
          : await tx.$executeRaw`
              UPDATE "ProductVariant"
              SET "reservedQuantity" = "reservedQuantity" + ${item.quantity}
              WHERE "id" = ${item.variantId}
                AND "stockQuantity" - "reservedQuantity" >= ${item.quantity}`;

        if (claimed !== 1) {
          throw new ApiError(
            409,
            'OUT_OF_STOCK',
            `Sản phẩm "${item.variant.product.name}" không đủ hàng`
          );
        }
      }

      const subtotal = items.reduce(
        (sum, i) => sum + i.variant.price * i.quantity,
        0
      );

      const shippingFee = SHIPPING_FEE_NOT_CALCULATED;

      const created = await tx.order.create({
        data: {
          code: generateOrderCode(),
          userId,
          brandSlug,
          orderStatus: isCod
            ? ORDER_STATUS.CONFIRMED
            : ORDER_STATUS.PENDING_PAYMENT,
          paymentMethod,
          paymentStatus: isCod ? PAYMENT_STATUS.UNPAID : PAYMENT_STATUS.PENDING,
          subtotal,
          shippingFee,
          grandTotal: subtotal + shippingFee,
          shippingAddress,
          note: note || null,
          expiresAt: isCod
            ? null
            : new Date(Date.now() + PAYMENT_WINDOW_HOURS * 3600 * 1000),
          items: {
            create: items.map((i) => ({
              variantId: i.variantId,
              productName: i.variant.product.name,
              sku: i.variant.sku,
              unitPrice: i.variant.price,
              quantity: i.quantity,
              lineTotal: i.variant.price * i.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return created;
    },
    { timeout: 15000 }
  );

  sendSuccess(res, order, null, 201);
});

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại (cho trang cá nhân khách hàng).
 */
export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa xác thực'
    );
  }

  const { page = '1', pageSize = '10' } = req.query;

  const take = Math.min(Number(pageSize) || 10, 50);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: Prisma.OrderWhereInput = {
    userId: req.user.id,
    brandSlug: req.brand.slug,
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: true,
      },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  sendSuccess(res, items, {
    page: Number(page),
    pageSize: take,
    total,
  });
});

/**
 * Lấy chi tiết một đơn hàng của khách hàng theo mã đơn (order code).
 * - Bắt buộc phải khớp userId của người đang đăng nhập để tránh lộ đơn của người khác.
 */
export const getMyOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa xác thực'
    );
  }

  const code = req.params.code as string;

  const order = await prisma.order.findFirst({
    where: {
      code,
      userId: req.user.id,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new ApiError(
      404,
      'ORDER_NOT_FOUND',
      'Không tìm thấy đơn hàng'
    );
  }

  sendSuccess(res, order);
});

/**
 * Danh sách đơn hàng dành cho quản trị viên (Admin).
 * - Hỗ trợ lọc theo trạng thái đơn hàng (orderStatus) và trạng thái thanh toán (paymentStatus).
 * - Kèm thông tin tài khoản người đặt (fullName, email).
 */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  if (!req.brand) {
    throw new ApiError(
      400,
      'BRAND_REQUIRED',
      'Thiếu thông tin thương hiệu'
    );
  }

  const { page = '1', pageSize = '20', orderStatus, paymentStatus } = req.query;

  const take = Math.min(Number(pageSize) || 20, 100);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: Prisma.OrderWhereInput = {
    brandSlug: req.brand.slug,
  };

  if (orderStatus && typeof orderStatus === 'string') {
    where.orderStatus = orderStatus;
  }

  if (paymentStatus && typeof paymentStatus === 'string') {
    where.paymentStatus = paymentStatus;
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  sendSuccess(res, items, {
    page: Number(page),
    pageSize: take,
    total,
  });
});

/**
 * Xác nhận đơn hàng chuyển khoản đã nhận được tiền (Admin bấm hoặc Webhook thanh toán gọi).
 * - Chuyển trạng thái đơn sang CONFIRMED và thanh toán sang PAID.
 * - Chuyển số lượng giữ kho (reservedQuantity) thành số lượng xuất kho thực tế (trừ cả stockQuantity và reservedQuantity).
 */
export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new ApiError(
      404,
      'ORDER_NOT_FOUND',
      'Không tìm thấy đơn hàng'
    );
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new ApiError(
      409,
      'ALREADY_PAID',
      'Đơn hàng đã được thanh toán'
    );
  }

  assertTransition(order.orderStatus, ORDER_STATUS.CONFIRMED);

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (!item.variantId) continue;

      await tx.$executeRaw`
        UPDATE "ProductVariant"
        SET "stockQuantity" = "stockQuantity" - ${item.quantity},
            "reservedQuantity" = "reservedQuantity" - ${item.quantity}
        WHERE "id" = ${item.variantId}`;
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        orderStatus: ORDER_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PAID,
        paidAt: new Date(),
        expiresAt: null,
      },
      include: {
        items: true,
      },
    });
  });

  sendSuccess(res, updated);
});

/**
 * Hủy một đơn hàng và hoàn trả lại số lượng tồn kho/giữ kho.
 * - Nếu đơn đang chờ thanh toán (PENDING_PAYMENT): Trả lại `reservedQuantity`.
 * - Nếu đơn đã xác nhận (CONFIRMED): Trả lại vào `stockQuantity`.
 */
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new ApiError(
      404,
      'ORDER_NOT_FOUND',
      'Không tìm thấy đơn hàng'
    );
  }

  assertTransition(order.orderStatus, ORDER_STATUS.CANCELLED);

  const wasHoldingReservation =
    order.orderStatus === ORDER_STATUS.PENDING_PAYMENT;

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (!item.variantId) continue;

      await (wasHoldingReservation
        ? tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedQuantity" = "reservedQuantity" - ${item.quantity}
            WHERE "id" = ${item.variantId}`
        : tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "stockQuantity" = "stockQuantity" + ${item.quantity}
            WHERE "id" = ${item.variantId}`);
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        orderStatus: ORDER_STATUS.CANCELLED,
        expiresAt: null,
      },
      include: {
        items: true,
      },
    });
  });

  sendSuccess(res, updated);
});

export default {
  createOrder,
  listMyOrders,
  getMyOrder,
  adminList,
  confirmPayment,
  cancelOrder,
};
