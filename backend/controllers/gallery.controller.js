const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const fs = require('fs').promises;
const path = require('path');

// CRUD for gallery images. Image files themselves are uploaded separately through
// upload.controller.js and reach this file as a URL string. Rows created before the move to
// Cloudinary still point at local `/uploads/...` paths, which is why the write paths below
// carry extra logic to clean up files on disk.

// Returns a page of gallery items ordered by their `position` field, optionally narrowed to
// one brand through `categorySlug`. The filter expands to include child categories so the
// brand's landing page shows everything underneath it, not only items pinned directly to the
// root category. `pageSize` is capped at 50 to keep a single request from pulling the whole
// gallery. Ordering by `position` leaves room for manual curation; nothing sets it yet, so
// in practice every item currently shares position 0 and ties fall back to database order.
const list = asyncHandler(async (req, res) => {
  const { categorySlug, page = '1', pageSize = '10' } = req.query;
  const take = Math.min(Number(pageSize) || 10, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {};
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục');

    // Tìm thêm các danh mục con (ví dụ: Bình Gốm, Lọ Hoa...)
    const children = await prisma.category.findMany({ where: { parentId: category.id } });
    const categoryIds = [category.id, ...children.map(c => c.id)];

    where.categoryId = { in: categoryIds };
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

// Stores a new gallery item pointing at an already-uploaded image URL and answers 201.
// `position` defaults to 0 rather than being left null so the ordering in `list` never has
// to deal with nulls. `altText` matters more than it looks: it is the text screen readers
// announce and the main signal Google Images has about the photo, which is why the admin
// form marks it required.
const create = asyncHandler(async (req, res) => {
  const { title, imageUrl, altText, categoryId, position } = req.body;
  const item = await prisma.galleryItem.create({
    data: { title, imageUrl, altText, categoryId: categoryId || null, position: position ?? 0 },
  });
  sendSuccess(res, item, null, 201);
});

// Fetches a single item by id, used by the admin edit form to prefill its fields. A missing
// id answers 404. There is no visibility rule to apply here — unlike blog posts, gallery
// items have no draft state, so anything in the table is live.
const getById = asyncHandler(async (req, res) => {
  const item = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
  if (!item) throw new ApiError(404, 'GALLERY_ITEM_NOT_FOUND', 'Không tìm thấy ảnh');
  sendSuccess(res, item);
});

// Updates an item, falling back to the stored value for every field the request omits so a
// partial form submission cannot blank out the rest of the row. When the image is replaced
// and the previous one was a local `/uploads/` file, that file is deleted from disk to stop
// orphaned images accumulating; Cloudinary URLs are skipped because they are not ours to
// unlink here. The deletion is wrapped in try/catch and only logged on failure — a file that
// is already gone must not abort an otherwise valid update.
const update = asyncHandler(async (req, res) => {
  const { title, imageUrl, altText, categoryId, position } = req.body;
  const existing = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'GALLERY_ITEM_NOT_FOUND', 'Không tìm thấy ảnh');

  // Nêu đổi ảnh, xoá ảnh cũ
  if (imageUrl && existing.imageUrl !== imageUrl && existing.imageUrl.startsWith('/uploads/')) {
    const filename = existing.imageUrl.replace('/uploads/', '');
    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Lỗi khi xoá file ảnh cũ: ${filePath}`, err);
    }
  }

  const updated = await prisma.galleryItem.update({
    where: { id: req.params.id },
    data: {
      title: title !== undefined ? title : existing.title,
      imageUrl: imageUrl || existing.imageUrl,
      altText: altText || existing.altText,
      categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
      position: position !== undefined ? position : existing.position
    },
  });
  sendSuccess(res, updated);
});

// Deletes an item and, for legacy local images, the file behind it. The file is removed
// before the database row, which means a crash in between leaves a row pointing at a missing
// file — a broken thumbnail. The opposite order would leave an unreferenced file on disk
// instead. Neither is ideal; this order was chosen because a visible broken image gets
// noticed and fixed, whereas an orphaned file silently eats storage forever.
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

module.exports = { list, create, getById, update, remove };
