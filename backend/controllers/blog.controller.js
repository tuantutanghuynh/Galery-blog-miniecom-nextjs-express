const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const { page = '1', pageSize = '10', categorySlug } = req.query;
  const take = Math.min(Number(pageSize) || 10, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = { 
    status: 'published',
    publishedAt: { lte: new Date() } // Lọc đi các bài được lên lịch trong tương lai
  };
  
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
    const children = await prisma.category.findMany({ where: { parentId: category.id } });
    const categoryIds = [category.id, ...children.map(c => c.id)];
    where.categoryId = { in: categoryIds };
  }

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      include: { category: true, author: { select: { id: true, fullName: true } } },
      skip,
      take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  sendSuccess(res, items, { page: Number(page), pageSize: take, total });
});

const getBySlug = asyncHandler(async (req, res) => {
  const post = await prisma.blogPost.findUnique({
    where: { slug: req.params.slug },
    include: { category: true, author: { select: { id: true, fullName: true } } },
  });
  
  const isFutureScheduled = post && post.publishedAt && new Date(post.publishedAt) > new Date();
  
  if (!post || post.status !== 'published' || isFutureScheduled) {
    throw new ApiError(404, 'POST_NOT_FOUND', 'Không tìm thấy bài viết');
  }
  sendSuccess(res, post);
});

const adminList = asyncHandler(async (req, res) => {
  const { page = '1', pageSize = '20', status, categorySlug, search } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {};
  
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
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

  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
    const children = await prisma.category.findMany({ where: { parentId: category.id } });
    const categoryIds = [category.id, ...children.map(c => c.id)];
    where.categoryId = { in: categoryIds };
  }

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true, author: { select: { id: true, fullName: true } } },
      skip,
      take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  sendSuccess(res, items, { page: Number(page), pageSize: take, total });
});

const create = asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, coverImageUrl, categoryId, seoTitle, seoDescription, status, publishedAt } = req.body;

  // Kiểm tra trùng lặp Slug
  if (slug) {
    const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ApiError(409, 'SLUG_TAKEN', 'Slug đã tồn tại, vui lòng chọn slug khác');
    }
  }
  
  // Xác định ngày xuất bản
  let finalPublishedAt = null;
  if (status === 'published') {
    finalPublishedAt = publishedAt ? new Date(publishedAt) : new Date();
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt,
      content,
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

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'POST_NOT_FOUND', 'Không tìm thấy bài viết');

  const { title, slug, excerpt, content, coverImageUrl, categoryId, seoTitle, seoDescription, status, publishedAt } = req.body;

  // Kiểm tra trùng lặp Slug (nếu slug bị thay đổi)
  if (slug && slug !== existing.slug) {
    const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ApiError(409, 'SLUG_TAKEN', 'Slug đã tồn tại, vui lòng chọn slug khác');
    }
  }

  const data = {
    title,
    slug,
    excerpt,
    content,
    coverImageUrl,
    categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
    seoTitle,
    seoDescription,
    status
  };

  if (publishedAt) {
    data.publishedAt = new Date(publishedAt);
  } else if (status === 'published' && existing.status !== 'published') {
    data.publishedAt = new Date();
  } else if (status === 'draft') {
    data.publishedAt = null;
  }

  // Loại bỏ các key undefined
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

  const post = await prisma.blogPost.update({ where: { id }, data });
  sendSuccess(res, post);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Phải check tồn tại trước khi xoá để tránh lỗi 500 từ Prisma
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'POST_NOT_FOUND', 'Không tìm thấy bài viết');

  await prisma.blogPost.delete({ where: { id } });
  sendSuccess(res, { message: 'Đã xoá bài viết' });
});

module.exports = { list, getBySlug, adminList, create, update, remove };
