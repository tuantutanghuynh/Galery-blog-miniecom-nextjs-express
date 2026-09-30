import type { Request, Response } from 'express';

import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

import { v2 as cloudinary } from 'cloudinary';

import streamifier from 'streamifier';

import config from '../config/env';

import ApiError from '../utils/ApiError';

import asyncHandler from '../utils/asyncHandler';

import { sendSuccess } from '../utils/ApiResponse';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Hàm tiện ích: Đẩy buffer file ảnh từ bộ nhớ RAM trực tiếp lên Cloudinary bằng Stream.
 * - Tránh ghi file tạm xuống ổ cứng server (giữ server stateless, phù hợp với Render/Docker).
 */
function uploadBufferToCloudinary(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'miniecom-gomsu' },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Tiếp nhận file ảnh tải lên từ form dữ liệu và lưu trữ trên Cloudinary.
 * - Nhận file buffer đã được kiểm tra định dạng và dung lượng qua middleware upload.
 * - Trả về đường dẫn HTTPS an toàn (secure_url).
 */
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(
      422,
      'FILE_REQUIRED',
      'Thiếu file ảnh'
    );
  }

  const result = await uploadBufferToCloudinary(req.file.buffer);

  sendSuccess(
    res,
    {
      url: result.secure_url,
    },
    null,
    201
  );
});

export default {
  uploadImage,
};
