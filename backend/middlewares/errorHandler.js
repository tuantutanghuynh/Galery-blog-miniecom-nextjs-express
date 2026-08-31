// middlewares/errorHandler.js
const ApiError = require('../utils/ApiError');

module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      data: null,
      meta: null,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  console.error(err);
  return res.status(500).json({
    data: null,
    meta: null,
    error: { code: 'INTERNAL_ERROR', message: 'Đã có lỗi xảy ra', details: null },
  });
};
