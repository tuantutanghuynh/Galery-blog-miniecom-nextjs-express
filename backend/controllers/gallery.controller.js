const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const fs = require('fs').promises;
const path = require('path');

const list = asyncHandler(async (req, res) => {
  const { categorySlug, page = '1', pageSize = '10' } = req.query;
  const take = Math.min(Number(pageSize) || 10, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {};
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');
    where.categoryId = category.id;
  }

  const [items, total] = await Promise.all([
    prisma.galleryItem.findMany({
      where,
      orderBy: { position: 'asc' },
      include: { category: true },
      skip,
      take,
    }),
    prisma.galleryItem.count({ where }),
  ]);

  sendSuccess(res, items, { page: Number(page), pageSize: take, total });
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

  // Xoá file vật lý trên ổ cứng nếu imageUrl là đường dẫn cục bộ
  if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
    const filename = existing.imageUrl.replace('/uploads/', '');
    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Chỉ log ra console nếu file không tồn tại, tránh crash server
      console.error(`Lỗi khi xoá file ảnh: ${filePath}`, err);
    }
  }

  // Xoá record trong Database
  await prisma.galleryItem.delete({ where: { id: req.params.id } });

  sendSuccess(res, { message: 'Đã xoá ảnh' });
});

module.exports = { list, create, remove };
