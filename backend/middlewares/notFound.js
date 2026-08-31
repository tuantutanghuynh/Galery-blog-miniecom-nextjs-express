// middlewares/notFound.js
const ApiError = require('../utils/ApiError');

module.exports = function notFound(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.originalUrl} không tồn tại`));
};
