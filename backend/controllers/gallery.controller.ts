import type { Request, Response } from 'express';

import fs from 'fs/promises';

import path from 'path';

import prisma from '../services/prisma';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

/**
 * Lấy danh sách các hình ảnh trong bộ sưu tập Gallery.
 * - Sắp xếp theo thứ tự hiển thị (position tăng dần).
 * - Hỗ trợ lọc theo danh mục (categorySlug) và mở rộng cho cả các danh mục con.
 * - Có phân trang (page, pageSize tối đa 50).
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { categorySlug, page = '1', pageSize = '10' } = req.query;

  const take = Math.min(Number(pageSize) || 10, 50);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: { categoryId?: { in: string[] } } = {};

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
    prisma.galleryItem.findMany({
      where,
      orderBy: {
        position: 'asc',
      },
      include: {
        category: true,
      },
      skip,
      take,
    }),
    prisma.galleryItem.count({ where }),
  ]);

  sendSuccess(res, items, {
    page: Number(page),
    pageSize: take,
    total,
  });
});

/**
 * Thêm một tác phẩm/hình ảnh mới vào bộ sưu tập Gallery.
 * - Yêu cầu bắt buộc phải có imageUrl và altText (phục vụ SEO hình ảnh và trợ năng).
 * - Gán vị trí hiển thị (mặc định position = 0).
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { title, imageUrl, altText, categoryId, position } = req.body;

  const item = await prisma.galleryItem.create({
    data: {
      title,
      imageUrl,
      altText,
      categoryId: categoryId || null,
      position: position ?? 0,
    },
  });

  sendSuccess(res, item, null, 201);
});

/**
 * Lấy chi tiết một mục hình ảnh gallery theo ID.
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const item = await prisma.galleryItem.findUnique({
    where: { id },
  });

  if (!item) {
    throw new ApiError(
      404,
      'GALLERY_ITEM_NOT_FOUND',
      'Không tìm thấy ảnh'
    );
  }

  sendSuccess(res, item);
});

/**
 * Cập nhật thông tin hình ảnh trong bộ sưu tập.
 * - Nếu thay đổi ảnh mới và ảnh cũ là file lưu cục bộ (/uploads/), tự động dọn dẹp file cũ trên ổ đĩa.
 * - Cập nhật tiêu đề, altText, vị trí hiển thị hoặc danh mục.
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const { title, imageUrl, altText, categoryId, position } = req.body;

  const existing = await prisma.galleryItem.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'GALLERY_ITEM_NOT_FOUND',
      'Không tìm thấy ảnh'
    );
  }

  // Nếu thay đổi đường dẫn ảnh và ảnh cũ nằm trong thư mục /uploads/ cục bộ -> Xoá file cũ
  if (
    imageUrl &&
    existing.imageUrl !== imageUrl &&
    existing.imageUrl.startsWith('/uploads/')
  ) {
    const filename = existing.imageUrl.replace('/uploads/', '');

    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Lỗi khi xoá file ảnh cũ: ${filePath}`, err);
    }
  }

  const updated = await prisma.galleryItem.update({
    where: { id },
    data: {
      title: title !== undefined ? title : existing.title,
      imageUrl: imageUrl || existing.imageUrl,
      altText: altText || existing.altText,
      categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
      position: position !== undefined ? position : existing.position,
    },
  });

  sendSuccess(res, updated);
});

/**
 * Xóa vĩnh viễn một hình ảnh khỏi Gallery.
 * - Kiểm tra sự tồn tại trong DB.
 * - Tự động xóa file vật lý trên máy chủ nếu là ảnh lưu cục bộ (/uploads/).
 * - Xóa bản ghi trong cơ sở dữ liệu.
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.galleryItem.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'GALLERY_ITEM_NOT_FOUND',
      'Không tìm thấy ảnh'
    );
  }

  if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
    const filename = existing.imageUrl.replace('/uploads/', '');

    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Lỗi khi xoá file ảnh: ${filePath}`, err);
    }
  }

  await prisma.galleryItem.delete({
    where: { id },
  });

  sendSuccess(res, {
    message: 'Đã xoá ảnh',
  });
});

export default {
  list,
  create,
  getById,
  update,
  remove,
};
