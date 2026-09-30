import type { Request, Response } from 'express';

import type { Prisma } from '@prisma/client';

import prisma from '../services/prisma';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

import { sanitizeContent } from '../utils/sanitizeContent';

/**
 * Lấy danh sách bài viết blog công khai cho khách truy cập website.
 * - Chỉ hiển thị các bài viết có status = 'published' và ngày xuất bản publishedAt <= hiện tại (ẩn bài hẹn giờ).
 * - Hỗ trợ lọc theo danh mục thương hiệu (categorySlug) và mở rộng cho cả các danh mục con.
 * - Sắp xếp bài mới nhất lên đầu theo ngày xuất bản (publishedAt giảm dần).
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '10', categorySlug } = req.query;

  const take = Math.min(Number(pageSize) || 10, 50);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: Prisma.BlogPostWhereInput = {
    status: 'published',
    publishedAt: {
      lte: new Date(),
    },
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
    prisma.blogPost.findMany({
      where,
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      skip,
      take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  sendSuccess(res, items, {
    page: Number(page),
    pageSize: take,
    total,
  });
});

/**
 * Lấy chi tiết một bài viết blog công khai theo đường dẫn tĩnh (slug).
 * - Không hiển thị bài viết nháp (draft) hoặc bài viết được lên lịch xuất bản trong tương lai.
 * - Chỉ trả về thông tin cơ bản của tác giả (id, fullName), bảo vệ email và mật khẩu.
 */
export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const isFutureScheduled =
    post && post.publishedAt && new Date(post.publishedAt) > new Date();

  if (!post || post.status !== 'published' || isFutureScheduled) {
    throw new ApiError(
      404,
      'POST_NOT_FOUND',
      'Không tìm thấy bài viết'
    );
  }

  sendSuccess(res, post);
});

/**
 * Lấy danh sách bài viết dành cho quản trị viên (Admin Dashboard).
 * - Hiển thị cả bài viết nháp (draft), bài đã đăng (published) và bài hẹn giờ (scheduled).
 * - Hỗ trợ tìm kiếm tiêu đề bài viết (không phân biệt hoa thường).
 * - Hỗ trợ lọc theo trạng thái và danh mục thương hiệu.
 */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', status, categorySlug, search } = req.query;

  const take = Math.min(Number(pageSize) || 20, 100);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: Prisma.BlogPostWhereInput = {};

  if (search && typeof search === 'string') {
    where.title = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (status === 'draft') {
    where.status = 'draft';
  } else if (status === 'published') {
    where.status = 'published';
    where.publishedAt = { lte: new Date() };
  } else if (status === 'scheduled') {
    where.status = 'published';
    where.publishedAt = { gt: new Date() };
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
    prisma.blogPost.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      skip,
      take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  sendSuccess(res, items, {
    page: Number(page),
    pageSize: take,
    total,
  });
});

/**
 * Tạo bài viết blog mới.
 * - Kiểm tra slug có bị trùng lặp hay không.
 * - Làm sạch mã HTML độc hại bằng hàm `sanitizeContent` trước khi lưu vào DB.
 * - Tự động gán authorId theo tài khoản admin đang đăng nhập.
 * - Xác định ngày xuất bản (nếu xuất bản ngay thì gán ngày hiện tại, hoặc ngày hẹn giờ do client gửi).
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Chưa đăng nhập'
    );
  }

  const {
    title,
    slug,
    excerpt,
    content,
    coverImageUrl,
    categoryId,
    seoTitle,
    seoDescription,
    status,
    publishedAt,
  } = req.body;

  if (slug) {
    const existingSlug = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ApiError(
        409,
        'SLUG_TAKEN',
        'Slug đã tồn tại, vui lòng chọn slug khác'
      );
    }
  }

  let finalPublishedAt: Date | null = null;

  if (status === 'published') {
    finalPublishedAt = publishedAt ? new Date(publishedAt) : new Date();
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt,
      content: sanitizeContent(content),
      coverImageUrl,
      categoryId: categoryId || null,
      seoTitle,
      seoDescription,
      authorId: req.user.id,
      status: status || 'draft',
      publishedAt: finalPublishedAt,
    },
  });

  sendSuccess(res, post, null, 201);
});

/**
 * Cập nhật thông tin bài viết blog.
 * - Cho phép cập nhật từng phần (partial update).
 * - Kiểm tra trùng lặp slug nếu slug bị thay đổi.
 * - Làm sạch nội dung HTML nếu có cập nhật nội dung.
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'POST_NOT_FOUND',
      'Không tìm thấy bài viết'
    );
  }

  const {
    title,
    slug,
    excerpt,
    content,
    coverImageUrl,
    categoryId,
    seoTitle,
    seoDescription,
    status,
    publishedAt,
  } = req.body;

  if (slug && slug !== existing.slug) {
    const existingSlug = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ApiError(
        409,
        'SLUG_TAKEN',
        'Slug đã tồn tại, vui lòng chọn slug khác'
      );
    }
  }

  const data: Prisma.BlogPostUpdateInput = {
    title,
    slug,
    excerpt,
    content: sanitizeContent(content),
    coverImageUrl,
    category:
      categoryId !== undefined
        ? categoryId
          ? { connect: { id: categoryId } }
          : { disconnect: true }
        : undefined,
    seoTitle,
    seoDescription,
    status,
  };

  if (publishedAt) {
    data.publishedAt = new Date(publishedAt);
  } else if (status === 'published' && existing.status !== 'published') {
    data.publishedAt = new Date();
  } else if (status === 'draft') {
    data.publishedAt = null;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data,
  });

  sendSuccess(res, post);
});

/**
 * Xóa vĩnh viễn một bài viết blog.
 * - Kiểm tra bài viết có tồn tại trong hệ thống trước khi xóa.
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'POST_NOT_FOUND',
      'Không tìm thấy bài viết'
    );
  }

  await prisma.blogPost.delete({
    where: { id },
  });

  sendSuccess(res, {
    message: 'Đã xoá bài viết',
  });
});

export default {
  list,
  getBySlug,
  adminList,
  create,
  update,
  remove,
};
