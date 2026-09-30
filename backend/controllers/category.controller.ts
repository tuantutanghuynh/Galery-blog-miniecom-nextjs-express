import type { Request, Response } from 'express';

import prisma from '../services/prisma';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

const ATTRIBUTE_TYPES = ['text', 'number'];

/**
 * Hàm tiện ích: Chuẩn hóa nhãn tiếng Việt thành mã khóa kỹ thuật (attributeKey).
 * Ví dụ: "Chiều cao (cm)" -> "chieu_cao_cm".
 */
function slugifyKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Lấy danh sách toàn bộ danh mục cùng các thuộc tính động đi kèm.
 * - Trả về cây danh mục để các storefront (Gốm sứ / Petshop) lọc theo BRAND_CATEGORY_SLUG.
 * - Bao gồm cả danh mục gốc (root category) và danh mục con (sub-category).
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      attributes: true,
    },
  });

  sendSuccess(res, categories);
});

/**
 * Tạo danh mục sản phẩm mới.
 * - Kiểm tra slug có bị trùng lặp hay không (slug là định danh duy nhất trên URL).
 * - Nếu truyền `parentId`: Tạo danh mục con nằm dưới danh mục cha tương ứng.
 * - Nếu không truyền `parentId`: Tạo danh mục gốc đại diện cho một thương hiệu/ngành hàng mới.
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, description, parentId } = req.body;

  const existing = await prisma.category.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new ApiError(
      409,
      'SLUG_TAKEN',
      'Slug danh mục đã tồn tại'
    );
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      parentId: parentId || null,
    },
  });

  sendSuccess(res, category, null, 201);
});

/**
 * Lấy danh sách các thông số/thuộc tính kỹ thuật của một danh mục cụ thể.
 * - Sắp xếp theo tên nhãn hiển thị từ A đến Z.
 */
export const listAttributes = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.params.id as string;

  const rows = await prisma.categoryAttribute.findMany({
    where: { categoryId },
    orderBy: {
      attributeLabel: 'asc',
    },
  });

  sendSuccess(res, rows);
});

/**
 * Tạo mới một thông số kỹ thuật động cho danh mục.
 * - Ví dụ: Chiều cao, Nhiệt độ nung, Dung tích, Chất liệu...
 * - Tự động tạo `attributeKey` từ nhãn người dùng nhập.
 * - Kiểm tra xem danh mục đã tồn tại thông số có cùng mã khóa chưa.
 */
export const createAttribute = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.params.id as string;

  const { attributeLabel, attributeType = 'text' } = req.body;

  if (!attributeLabel?.trim()) {
    throw new ApiError(
      400,
      'MISSING_LABEL',
      'Vui lòng nhập tên thông số.'
    );
  }

  if (!ATTRIBUTE_TYPES.includes(attributeType)) {
    throw new ApiError(
      400,
      'INVALID_TYPE',
      'Kiểu dữ liệu không hợp lệ.'
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(
      404,
      'CATEGORY_NOT_FOUND',
      'Không tìm thấy danh mục.'
    );
  }

  const attributeKey = slugifyKey(attributeLabel);

  if (!attributeKey) {
    throw new ApiError(
      400,
      'INVALID_LABEL',
      'Tên thông số phải có ít nhất một chữ cái hoặc số.'
    );
  }

  const existing = await prisma.categoryAttribute.findFirst({
    where: {
      categoryId,
      attributeKey,
    },
  });

  if (existing) {
    throw new ApiError(
      409,
      'ATTRIBUTE_EXISTS',
      'Danh mục đã có thông số này.'
    );
  }

  const created = await prisma.categoryAttribute.create({
    data: {
      categoryId,
      attributeKey,
      attributeLabel: attributeLabel.trim(),
      attributeType,
    },
  });

  sendSuccess(res, created, null, 201);
});

/**
 * Xóa định nghĩa một thông số khỏi danh mục.
 * - Chỉ xóa định nghĩa thuộc tính ở danh mục, không xóa giá trị đã lưu trong JSON của sản phẩm cũ.
 */
export const removeAttribute = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.params.id as string;

  const attributeId = req.params.attributeId as string;

  const { count } = await prisma.categoryAttribute.deleteMany({
    where: {
      id: attributeId,
      categoryId,
    },
  });

  if (count === 0) {
    throw new ApiError(
      404,
      'ATTRIBUTE_NOT_FOUND',
      'Không tìm thấy thông số.'
    );
  }

  sendSuccess(res, {
    message: 'Đã xoá thông số.',
  });
});

export default {
  list,
  create,
  listAttributes,
  createAttribute,
  removeAttribute,
};
