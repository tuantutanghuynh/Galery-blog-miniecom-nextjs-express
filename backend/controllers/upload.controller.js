const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Bọc upload_stream (kiểu callback) thành Promise để dùng await cho gọn
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'miniecom-gomsu' }, // gom ảnh vào 1 thư mục riêng trên Cloudinary
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'FILE_REQUIRED', 'Thiếu file ảnh');

  const result = await uploadBufferToCloudinary(req.file.buffer);
  sendSuccess(res, { url: result.secure_url }, null, 201);
});

module.exports = { uploadImage };
