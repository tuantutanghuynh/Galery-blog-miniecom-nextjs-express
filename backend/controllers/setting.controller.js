const prisma = require('../services/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

// Lấy danh sách các cài đặt. Public endpoint để frontend load trang chủ
const getSettings = asyncHandler(async (req, res) => {
  const keys = req.query.keys ? req.query.keys.split(',') : [];
  
  const where = keys.length > 0 ? { key: { in: keys } } : {};
  const settings = await prisma.siteSetting.findMany({ where });
  
  // Chuyển array thành object { key: value } cho Frontend dễ gọi
  const configMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  sendSuccess(res, configMap);
});

// Admin cập nhật (hoặc tạo mới) một hoặc nhiều setting cùng lúc
const updateSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body; // Expect: { "homepage_hero_image": "url...", "homepage_quote": "..." }
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }

  const upsertPromises = Object.entries(settings).map(([key, value]) => {
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  });

  await prisma.$transaction(upsertPromises);

  sendSuccess(res, { message: 'Cập nhật cấu hình thành công' });
});

module.exports = { getSettings, updateSettings };
