const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const { page = '1', pageSize = '10' } = req.query;
  const take = Math.min(Number(pageSize) || 10, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = { status: 'published' };
  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      include: { category: true },
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
  if (!post || post.status !== 'published') {
    throw new ApiError(404, 'POST_NOT_FOUND', 'Không tìm thấy bài viết');
  }
  sendSuccess(res, post);
});

const adminList = asyncHandler(async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  });
  sendSuccess(res, posts);
});

const create = asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, coverImageUrl, categoryId, seoTitle, seoDescription } = req.body;

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
      status: 'draft',
    },
  });
  sendSuccess(res, post, null, 201);
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'POST_NOT_FOUND', 'Không tìm thấy bài viết');

  const data = { ...req.body };
  // publishedAt chỉ set 1 lần, đúng lúc chuyển draft -> published
  if (data.status === 'published' && existing.status !== 'published') {
    data.publishedAt = new Date();
  }

  const post = await prisma.blogPost.update({ where: { id }, data });
  sendSuccess(res, post);
});

const remove = asyncHandler(async (req, res) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  sendSuccess(res, { message: 'Đã xoá bài viết' });
});

module.exports = { list, getBySlug, adminList, create, update, remove };
