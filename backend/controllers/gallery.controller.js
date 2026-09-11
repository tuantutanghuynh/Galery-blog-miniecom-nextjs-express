const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const { categorySlug } = req.query;
  const where = {};
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
    where.categoryId = category.id;
  }

  const items = await prisma.galleryItem.findMany({
    where,
    orderBy: { position: 'asc' },
    include: { category: true },
  });
  sendSuccess(res, items);
});

const create = asyncHandler(async (req, res) => {
  const { title, imageUrl, altText, categoryId, position } = req.body;
  const item = await prisma.galleryItem.create({
    data: { title, imageUrl, altText, categoryId: categoryId || null, position: position ?? 0 },
  });
  sendSuccess(res, item, null, 201);
});

const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'GALLERY_ITEM_NOT_FOUND', 'Không tìm thấy ảnh');

  await prisma.galleryItem.delete({ where: { id: req.params.id } });
  sendSuccess(res, { message: 'Đã xoá ảnh' });
});

module.exports = { list, create, remove };
