import type { Request, Response } from 'express';

import prisma from '../services/prisma';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

/**
 * Tiếp nhận tin nhắn liên hệ từ khách hàng qua form liên hệ trên trang web.
 * - Kiểm tra trường honeypot (website_url) để lọc bot spam tự động.
 * - Yêu cầu bắt buộc phải có tên, email và nội dung tin nhắn.
 * - Lưu bản ghi vào bảng ContactMessage.
 */
export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, subject, message, website_url } = req.body;

  // Kiểm tra Honeypot: Nếu bot tự động điền trường ẩn này thì trả về 200 giả để đánh lừa bot
  if (website_url) {
    return sendSuccess(
      res,
      { message: 'Tin nhắn đã được gửi.' },
      null,
      200
    );
  }

  if (!name || !email || !message) {
    throw new ApiError(
      400,
      'MISSING_FIELDS',
      'Vui lòng điền họ tên, email và nội dung.'
    );
  }

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone,
      subject,
      message,
    },
  });

  sendSuccess(
    res,
    { message: 'Tin nhắn đã được gửi.' },
    null,
    201
  );
});

/**
 * Lấy danh sách tin nhắn liên hệ dành cho quản trị viên (Admin).
 * - Sắp xếp mới nhất lên đầu (createdAt giảm dần).
 * - Hỗ trợ lọc theo trạng thái đã đọc (isRead = true/false).
 * - Hỗ trợ phân trang chuẩn (page, pageSize tối đa 100).
 */
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', isRead } = req.query;

  const take = Math.min(Number(pageSize) || 20, 100);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: { isRead?: boolean } = {};

  if (isRead !== undefined && isRead !== '') {
    where.isRead = isRead === 'true';
  }

  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  sendSuccess(res, items, {
    page: Number(page),
    pageSize: take,
    total,
  });
});

/**
 * Đánh dấu một tin nhắn liên hệ là đã đọc.
 * - Kiểm tra tin nhắn có tồn tại hay không.
 * - Cập nhật trường isRead = true.
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'MESSAGE_NOT_FOUND',
      'Không tìm thấy tin nhắn'
    );
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: {
      isRead: true,
    },
  });

  sendSuccess(res, updated);
});

/**
 * Xóa vĩnh viễn một tin nhắn liên hệ.
 * - Kiểm tra sự tồn tại của tin nhắn trước khi xóa.
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(
      404,
      'MESSAGE_NOT_FOUND',
      'Không tìm thấy tin nhắn'
    );
  }

  await prisma.contactMessage.delete({
    where: { id },
  });

  sendSuccess(res, {
    message: 'Đã xoá tin nhắn',
  });
});

export default {
  submitContact,
  adminList,
  markAsRead,
  remove,
};
