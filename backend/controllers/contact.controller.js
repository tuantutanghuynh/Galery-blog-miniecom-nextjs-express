const prisma = require('../services/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

// Khách gửi tin nhắn
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message, website_url } = req.body;

  // Honeypot check (Nếu website_url được điền => Là Bot spam)
  if (website_url) {
    // Trả về 200 OK giả để đánh lừa bot
    return sendSuccess(res, { message: 'Tin nhắn đã được gửi.' }, null, 200);
  }

  if (!name || !email || !message) {
    throw new ApiError(400, 'MISSING_FIELDS', 'Vui lòng điền họ tên, email và nội dung.');
  }

  await prisma.contactMessage.create({
    data: { name, email, phone, subject, message }
  });

  sendSuccess(res, { message: 'Tin nhắn đã được gửi.' }, null, 201);
});

// Admin lấy danh sách tin nhắn
const adminList = asyncHandler(async (req, res) => {
  const { page = '1', pageSize = '20', isRead } = req.query;
  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {};
  if (isRead !== undefined && isRead !== '') {
    where.isRead = isRead === 'true';
  }

  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  sendSuccess(res, items, { page: Number(page), pageSize: take, total });
});

// Admin đánh dấu đã đọc
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Không tìm thấy tin nhắn');

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { isRead: true }
  });

  sendSuccess(res, updated);
});

// Admin xoá tin nhắn
const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Không tìm thấy tin nhắn');

  await prisma.contactMessage.delete({ where: { id } });
  sendSuccess(res, { message: 'Đã xoá tin nhắn' });
});

module.exports = { submitContact, adminList, markAsRead, remove };
