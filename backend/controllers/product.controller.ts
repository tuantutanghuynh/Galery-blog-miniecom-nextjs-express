import type { Request, Response } from 'express';

import type { Prisma } from '@prisma/client';

import prisma from '../services/prisma';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

import { PRODUCT_STATUS } from '../constants/product';

interface CreateProductVariantInput {
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  variantAttributes?: Prisma.InputJsonValue;
  variantKey?: string;
  imageUrl?: string | null;
}

interface CreateProductImageInput {
  url: string;
  altText?: string | null;
  position?: number;
}

/**
 * Lấy danh sách sản phẩm công khai cho khách hàng xem trên website.
 * - Chỉ lấy sản phẩm có trạng thái active (đang mở bán).
 * - Sắp xếp sản phẩm mới nhất lên đầu (createdAt giảm dần).
 * - Mở rộng lọc danh mục cho cả danh mục con của thương hiệu.
 * - Eager-load kèm thông tin danh mục, danh sách ảnh (theo vị trí) và biến thể (theo giá tăng dần).
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '12', categorySlug } = req.query;

  const take = Math.min(Number(pageSize) || 12, 50);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: Prisma.ProductWhereInput = {
    status: PRODUCT_STATUS.ACTIVE,
  };

  if (categorySlug && typeof categorySlug === 'string') {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new ApiError(
        404,
        'CATEGORY_NOT_FOUND',
        'Không tìm thấy danh mục'
      );
    }

    const children = await prisma.category.findMany({
      where: { parentId: category.id },
    });

    const categoryIds = [category.id, ...children.map((c) => c.id)];

    where.categoryId = { in: categoryIds };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
        images: {
          orderBy: { position: 'asc' },
        },
        variants: {
          orderBy: { price: 'asc' },
        },
      },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  sendSuccess(res, items, {
    page: Number(page),
    pageSize: take,
    total,
  });
});

/**
 * Lấy thông tin chi tiết một sản phẩm theo đường dẫn tĩnh (slug).
 * - Bắt buộc sản phẩm phải ở trạng thái active (nếu là draft hoặc archived sẽ trả về 404).
 * - Kèm theo các thông số kỹ thuật động của danh mục (CategoryAttribute).
 */
export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        include: {
          attributes: {
            orderBy: { attributeLabel: 'asc' },
          },
        },
      },
      images: {
        orderBy: { position: 'asc' },
      },
      variants: {
        orderBy: { price: 'asc' },
      },
    },
  });

  if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new ApiError(
      404,
      'PRODUCT_NOT_FOUND',
      'Không tìm thấy sản phẩm'
    );
  }

  sendSuccess(res, product);
});

/**
 * Lấy danh sách sản phẩm dành cho quản trị viên (Admin Dashboard).
 * - Hiển thị toàn bộ trạng thái (draft, active, archived).
 * - Hỗ trợ tìm kiếm theo tên sản phẩm (search) và lọc theo status, categorySlug.
 */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', status, categorySlug, search } = req.query;

  const take = Math.min(Number(pageSize) || 20, 100);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: Prisma.ProductWhereInput = {};

  if (status && typeof status === 'string') {
    where.status = status;
  }

  if (search && typeof search === 'string') {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (categorySlug && typeof categorySlug === 'string') {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new ApiError(
        404,
        'CATEGORY_NOT_FOUND',
        'Không tìm thấy danh mục'
      );
    }

    const children = await prisma.category.findMany({
      where: { parentId: category.id },
    });

    const categoryIds = [category.id, ...children.map((c) => c.id)];

    where.categoryId = { in: categoryIds };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
        images: {
          orderBy: { position: 'asc' },
        },
        variants: {
          orderBy: { price: 'asc' },
        },
      },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  sendSuccess(res, items, {
    page: Number(page),
    pageSize: take,
    total,
  });
});

/**
 * Tạo mới một sản phẩm cùng các biến thể và danh sách hình ảnh trong một transaction.
 * - Kiểm tra trùng lặp slug sản phẩm và mã SKU của từng biến thể.
 * - Sử dụng createMany cho biến thể và hình ảnh để tối ưu tốc độ ghi DB.
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const {
    categoryId,
    name,
    slug,
    description,
    brand,
    status,
    attributes,
    variants = [],
    images = [],
  } = req.body;

  const existingSlug = await prisma.product.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    throw new ApiError(
      409,
      'SLUG_TAKEN',
      'Slug đã tồn tại, vui lòng chọn slug khác'
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(
      404,
      'CATEGORY_NOT_FOUND',
      'Không tìm thấy danh mục'
    );
  }

  const skus = variants.map((v: { sku: string }) => v.sku);

  if (new Set(skus).size !== skus.length) {
    throw new ApiError(
      422,
      'DUPLICATE_SKU',
      'Các biến thể không được trùng SKU'
    );
  }

  const takenSku = await prisma.productVariant.findFirst({
    where: {
      sku: { in: skus },
    },
  });

  if (takenSku) {
    throw new ApiError(
      409,
      'SKU_TAKEN',
      `SKU đã tồn tại: ${takenSku.sku}`
    );
  }

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        categoryId,
        name,
        slug,
        description,
        brand,
        status: status || PRODUCT_STATUS.DRAFT,
        attributes: attributes ?? {},
      },
    });

    if (variants.length) {
      await tx.productVariant.createMany({
        data: variants.map((v: CreateProductVariantInput) => ({
          productId: created.id,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQuantity: v.stockQuantity ?? 0,
          variantAttributes: v.variantAttributes ?? {},
          variantKey: v.variantKey || v.sku,
          imageUrl: v.imageUrl ?? null,
        })),
      });
    }

    if (images.length) {
      await tx.productImage.createMany({
        data: images.map((img: CreateProductImageInput, index: number) => ({
          productId: created.id,
          url: img.url,
          altText: img.altText ?? null,
          position: img.position ?? index,
        })),
      });
    }

    return tx.product.findUnique({
      where: { id: created.id },
      include: {
        category: true,
        images: {
          orderBy: { position: 'asc' },
        },
        variants: {
          orderBy: { price: 'asc' },
        },
      },
    });
  });

  sendSuccess(res, product, null, 201);
});

/**
 * Cập nhật thông tin cơ bản của sản phẩm.
 * - Hỗ trợ cập nhật từng phần (tên, slug, mô tả, danh mục, thông số kỹ thuật động attributes).
 * - Không cập nhật biến thể và kho hàng tại đây để đảm bảo an toàn dữ liệu.
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'PRODUCT_NOT_FOUND',
      'Không tìm thấy sản phẩm'
    );
  }

  const {
    categoryId,
    name,
    slug,
    description,
    brand,
    status,
    attributes,
  } = req.body;

  if (slug && slug !== existing.slug) {
    const takenSlug = await prisma.product.findUnique({
      where: { slug },
    });

    if (takenSlug) {
      throw new ApiError(
        409,
        'SLUG_TAKEN',
        'Slug đã tồn tại, vui lòng chọn slug khác'
      );
    }
  }

  if (categoryId && categoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ApiError(
        404,
        'CATEGORY_NOT_FOUND',
        'Không tìm thấy danh mục'
      );
    }
  }

  const data: Prisma.ProductUpdateInput = {};

  if (categoryId) data.category = { connect: { id: categoryId } };

  if (name !== undefined) data.name = name;

  if (slug !== undefined) data.slug = slug;

  if (description !== undefined) data.description = description;

  if (brand !== undefined) data.brand = brand;

  if (status !== undefined) data.status = status;

  if (attributes !== undefined) data.attributes = attributes;

  const product = await prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
      images: {
        orderBy: { position: 'asc' },
      },
      variants: {
        orderBy: { price: 'asc' },
      },
    },
  });

  sendSuccess(res, product);
});

/**
 * Cập nhật giá và số lượng tồn kho của một biến thể sản phẩm.
 * - Kiểm tra không cho phép đặt số lượng tồn kho thấp hơn số lượng đang giữ cho các đơn chờ thanh toán (reservedQuantity).
 */
export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const variantId = req.params.variantId as string;

  const { price, compareAtPrice, stockQuantity, label } = req.body;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new ApiError(
      404,
      'VARIANT_NOT_FOUND',
      'Không tìm thấy biến thể'
    );
  }

  if (
    stockQuantity !== undefined &&
    stockQuantity < variant.reservedQuantity
  ) {
    throw new ApiError(
      409,
      'STOCK_BELOW_RESERVED',
      `Không thể đặt tồn kho thấp hơn ${variant.reservedQuantity} đang giữ cho đơn chờ thanh toán`
    );
  }

  const data: Prisma.ProductVariantUpdateInput = {};

  if (price !== undefined) data.price = price;

  if (compareAtPrice !== undefined) data.compareAtPrice = compareAtPrice;

  if (stockQuantity !== undefined) data.stockQuantity = stockQuantity;

  if (label !== undefined) {
    const existingAttrs =
      (variant.variantAttributes as Record<string, unknown>) || {};

    data.variantAttributes = { ...existingAttrs, label };
  }

  const updated = await prisma.productVariant.update({
    where: { id: variant.id },
    data,
  });

  sendSuccess(res, updated);
});

/**
 * Gán thêm một hình ảnh đã tải lên vào sản phẩm.
 * - Tự động tính toán vị trí position tiếp theo để thêm vào cuối danh sách ảnh.
 */
export const addImage = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const { url, altText } = req.body;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new ApiError(
      404,
      'PRODUCT_NOT_FOUND',
      'Không tìm thấy sản phẩm'
    );
  }

  const last = await prisma.productImage.findFirst({
    where: { productId: product.id },
    orderBy: { position: 'desc' },
  });

  const image = await prisma.productImage.create({
    data: {
      productId: product.id,
      url,
      altText: altText || product.name,
      position: last ? last.position + 1 : 0,
    },
  });

  sendSuccess(res, image, null, 201);
});

/**
 * Cập nhật altText hoặc thay đổi thứ tự (position) hiển thị của một bức ảnh.
 */
export const updateImage = asyncHandler(async (req: Request, res: Response) => {
  const imageId = req.params.imageId as string;

  const { altText, position } = req.body;

  const existing = await prisma.productImage.findUnique({
    where: { id: imageId },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'IMAGE_NOT_FOUND',
      'Không tìm thấy ảnh'
    );
  }

  const data: Prisma.ProductImageUpdateInput = {};

  if (altText !== undefined) data.altText = altText;

  if (position !== undefined) data.position = position;

  const updated = await prisma.productImage.update({
    where: { id: existing.id },
    data,
  });

  sendSuccess(res, updated);
});

/**
 * Gỡ bỏ một hình ảnh khỏi sản phẩm.
 */
export const removeImage = asyncHandler(async (req: Request, res: Response) => {
  const imageId = req.params.imageId as string;

  const existing = await prisma.productImage.findUnique({
    where: { id: imageId },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'IMAGE_NOT_FOUND',
      'Không tìm thấy ảnh'
    );
  }

  await prisma.productImage.delete({
    where: { id: existing.id },
  });

  sendSuccess(res, {
    message: 'Đã xoá ảnh',
  });
});

/**
 * Xóa vĩnh viễn một sản phẩm cùng toàn bộ hình ảnh và các biến thể liên quan trong một transaction.
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'PRODUCT_NOT_FOUND',
      'Không tìm thấy sản phẩm'
    );
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({
      where: { productId: id },
    }),
    prisma.productVariant.deleteMany({
      where: { productId: id },
    }),
    prisma.product.delete({
      where: { id },
    }),
  ]);

  sendSuccess(res, {
    message: 'Đã xoá sản phẩm',
  });
});

/**
 * Thêm một biến thể mới cho một sản phẩm đã có.
 * - Kiểm tra tính duy nhất của mã SKU.
 */
export const addVariant = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const { sku, price, compareAtPrice, stockQuantity, label } = req.body;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new ApiError(
      404,
      'PRODUCT_NOT_FOUND',
      'Không tìm thấy sản phẩm'
    );
  }

  const existingSku = await prisma.productVariant.findUnique({
    where: { sku },
  });

  if (existingSku) {
    throw new ApiError(
      409,
      'SKU_TAKEN',
      `SKU đã tồn tại: ${sku}`
    );
  }

  const variantAttributes = label ? { label } : {};

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku,
      price: price || 0,
      compareAtPrice: compareAtPrice || null,
      stockQuantity: stockQuantity || 0,
      variantAttributes,
      variantKey: sku,
    },
  });

  sendSuccess(res, variant, null, 201);
});

/**
 * Xóa một biến thể sản phẩm.
 * - Đảm bảo ràng buộc nghiệp vụ: Mỗi sản phẩm bắt buộc phải có ít nhất một biến thể (không cho xóa biến thể cuối cùng).
 */
export const removeVariant = asyncHandler(async (req: Request, res: Response) => {
  const variantId = req.params.variantId as string;

  const existing = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'VARIANT_NOT_FOUND',
      'Không tìm thấy biến thể'
    );
  }

  const variantCount = await prisma.productVariant.count({
    where: {
      productId: existing.productId,
    },
  });

  if (variantCount <= 1) {
    throw new ApiError(
      400,
      'LAST_VARIANT',
      'Không thể xóa biến thể duy nhất của sản phẩm. Một sản phẩm phải có ít nhất một biến thể.'
    );
  }

  await prisma.productVariant.delete({
    where: { id: variantId },
  });

  sendSuccess(res, {
    message: 'Đã xóa biến thể',
  });
});

export default {
  addVariant,
  removeVariant,
  list,
  getBySlug,
  adminList,
  create,
  update,
  updateVariant,
  addImage,
  updateImage,
  removeImage,
  remove,
};
