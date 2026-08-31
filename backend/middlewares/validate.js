const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ApiError(422, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors.array())
    );
  }
  next();
}

module.exports = validate;
