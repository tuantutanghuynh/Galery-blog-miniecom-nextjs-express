import type { Request, Response } from 'express';

import prisma from '../services/prisma';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

/**
 * Lấy các thiết lập giao diện trang web (SiteSetting).
 * - Endpoint công khai phục vụ frontend load cấu hình động trang chủ (Hero, Banner, Slogan...).
 * - Hỗ trợ lọc theo danh sách các keys qua query params (ví dụ: ?keys=hero_image,intro_text).
 * - Trả về dưới dạng đối tượng key-value để frontend dễ sử dụng.
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const rawKeys = req.query.keys as string | undefined;

  const keys = rawKeys ? rawKeys.split(',') : [];

  const where = keys.length > 0 ? { key: { in: keys } } : {};

  const settings = await prisma.siteSetting.findMany({ where });

  // Chuyển danh sách mảng thành object { [key]: value } cho Frontend thuận tiện binding
  const configMap = settings.reduce(
    (
      acc: Record<string, string>,
      curr: { key: string; value: string }
    ) => {
      acc[curr.key] = curr.value;
      return acc;
    },
    {}
  );

  sendSuccess(res, configMap);
});

/**
 * Quản trị viên cập nhật hoặc thêm mới một hoặc nhiều cấu hình cùng lúc.
 * - Nhận payload dạng object { [key]: value }.
 * - Dùng transaction để chạy đồng thời các lệnh upsert cho từng cặp cấu hình.
 */
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
    });
  }

  const upsertPromises = Object.entries(settings).map(([key, value]) => {
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  });

  await prisma.$transaction(upsertPromises);

  sendSuccess(res, {
    message: 'Cập nhật cấu hình thành công',
  });
});

export default {
  getSettings,
  updateSettings,
};
