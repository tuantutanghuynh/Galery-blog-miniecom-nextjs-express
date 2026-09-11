const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ include: { attributes: true } });
  sendSuccess(res, categories);
});

const create = asyncHandler(async (req, res) => {
  const { name, slug, description, parentId } = req.body;

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw new ApiError(409, 'SLUG_TAKEN', 'Slug danh mục đã tồn tại');

  const category = await prisma.category.create({
    data: { name, slug, description, parentId: parentId || null },
  });
  sendSuccess(res, category, null, 201);
});

module.exports = { list, create };
