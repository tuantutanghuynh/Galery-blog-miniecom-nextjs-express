import type { Request, Response } from 'express';

import prisma from '../services/prisma';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

import { PRODUCT_STATUS } from '../constants/product';

/**
 * Lấy thông tin giỏ hàng của người dùng hiện tại theo thương hiệu (brand).
 * - Luôn tính lại đơn giá và thành tiền theo giá mới nhất trong database.
 * - Kiểm tra số lượng tồn kho khả dụng (stockQuantity - reservedQuantity).
 * - Gắn cờ cảnh báo (warnings: UNAVAILABLE, OUT_OF_STOCK, INSUFFICIENT_STOCK) nếu sản phẩm gặp vấn đề về tồn kho.
 * - Trả về `hasIssues = true` nếu có bất kỳ sản phẩm nào có cảnh báo để frontend vô hiệu hóa nút thanh toán.
 */
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa xác thực'
    );
  }

  const cart = await prisma.cart.findUnique({
    where: {
      userId_brandSlug: {
        userId: req.user.id,
        brandSlug: req.brand.slug,
      },
    },
    include: {
      items: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          variant: {
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
          },
        },
      },
    },
  });

  if (!cart) {
    return sendSuccess(res, {
      id: null,
      brandSlug: req.brand.slug,
      items: [],
      subtotal: 0,
      hasIssues: false,
    });
  }

  const items = cart.items.map((item) => {
    const { variant } = item;

    const available = variant.stockQuantity - variant.reservedQuantity;

    const warnings: string[] = [];

    if (variant.product.status !== PRODUCT_STATUS.ACTIVE) {
      warnings.push('UNAVAILABLE');
    } else if (available <= 0) {
      warnings.push('OUT_OF_STOCK');
    } else if (item.quantity > available) {
      warnings.push('INSUFFICIENT_STOCK');
    }

    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice: variant.price,
      lineTotal: variant.price * item.quantity,
      available,
      warnings,
      variant: {
        id: variant.id,
        sku: variant.sku,
        variantAttributes: variant.variantAttributes,
        imageUrl: variant.imageUrl || variant.product.images[0]?.url || null,
      },
      product: {
        id: variant.product.id,
        name: variant.product.name,
        slug: variant.product.slug,
      },
    };
  });

  sendSuccess(res, {
    id: cart.id,
    brandSlug: cart.brandSlug,
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    hasIssues: items.some((i) => i.warnings.length > 0),
  });
});

/**
 * Thêm một biến thể sản phẩm vào giỏ hàng.
 * - Tự động tạo giỏ hàng nếu người dùng chưa có giỏ hàng cho thương hiệu này.
 * - Kiểm tra xem biến thể có thuộc phạm vi danh mục của thương hiệu hiện tại không (tránh lẫn lộn dữ liệu).
 * - Nếu sản phẩm đã có trong giỏ hàng: Tăng số lượng (`increment`).
 * - Nếu sản phẩm chưa có trong giỏ: Thêm mới dòng CartItem.
 */
export const addItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa xác thực'
    );
  }

  const { variantId, quantity = 1 } = req.body;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant) {
    throw new ApiError(
      404,
      'VARIANT_NOT_FOUND',
      'Không tìm thấy biến thể sản phẩm'
    );
  }

  if (variant.product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new ApiError(
      409,
      'PRODUCT_UNAVAILABLE',
      'Sản phẩm hiện không bán'
    );
  }

  if (!req.brand.categoryIds.includes(variant.product.categoryId)) {
    throw new ApiError(
      404,
      'VARIANT_NOT_FOUND',
      'Không tìm thấy biến thể sản phẩm'
    );
  }

  const cart = await prisma.cart.upsert({
    where: {
      userId_brandSlug: {
        userId: req.user.id,
        brandSlug: req.brand.slug,
      },
    },
    create: {
      userId: req.user.id,
      brandSlug: req.brand.slug,
    },
    update: {},
  });

  const item = await prisma.cartItem.upsert({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId,
      },
    },
    create: {
      cartId: cart.id,
      variantId,
      quantity,
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
  });

  const available = variant.stockQuantity - variant.reservedQuantity;

  const warning = item.quantity > available ? 'INSUFFICIENT_STOCK' : null;

  sendSuccess(
    res,
    {
      id: item.id,
      quantity: item.quantity,
      available,
      warning,
    },
    null,
    201
  );
});

/**
 * Cập nhật số lượng của một sản phẩm trong giỏ hàng.
 * - Được gọi khi người dùng bấm tăng/giảm số lượng trên giao diện giỏ hàng.
 * - Kiểm tra quyền sở hữu giỏ hàng của chính người dùng.
 * - Cập nhật số lượng cụ thể và trả về cảnh báo nếu vượt quá tồn kho khả dụng.
 */
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa xác thực'
    );
  }

  const { quantity } = req.body;

  const id = req.params.id as string;

  const item = await prisma.cartItem.findFirst({
    where: {
      id,
      cart: {
        userId: req.user.id,
        brandSlug: req.brand.slug,
      },
    },
    include: {
      variant: true,
    },
  });

  if (!item) {
    throw new ApiError(
      404,
      'CART_ITEM_NOT_FOUND',
      'Không tìm thấy sản phẩm trong giỏ'
    );
  }

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  const available = item.variant.stockQuantity - item.variant.reservedQuantity;

  const warning = updated.quantity > available ? 'INSUFFICIENT_STOCK' : null;

  sendSuccess(res, {
    id: updated.id,
    quantity: updated.quantity,
    available,
    warning,
  });
});

/**
 * Xóa một sản phẩm khỏi giỏ hàng.
 * - Chỉ xóa khi sản phẩm thuộc về giỏ hàng của chính người dùng đang đăng nhập.
 */
export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.brand) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa xác thực'
    );
  }

  const id = req.params.id as string;

  const item = await prisma.cartItem.findFirst({
    where: {
      id,
      cart: {
        userId: req.user.id,
        brandSlug: req.brand.slug,
      },
    },
  });

  if (!item) {
    throw new ApiError(
      404,
      'CART_ITEM_NOT_FOUND',
      'Không tìm thấy sản phẩm trong giỏ'
    );
  }

  await prisma.cartItem.delete({
    where: { id: item.id },
  });

  sendSuccess(res, {
    message: 'Đã xoá khỏi giỏ hàng',
  });
});

export default {
  getCart,
  addItem,
  updateItem,
  removeItem,
};
