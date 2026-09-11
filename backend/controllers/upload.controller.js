const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'FILE_REQUIRED', 'Thiếu file ảnh');
  sendSuccess(res, { url: `/uploads/${req.file.filename}` }, null, 201);
});

module.exports = { uploadImage };
