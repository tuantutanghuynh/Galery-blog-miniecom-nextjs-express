const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Bridge between express-validator and this project's error envelope. Route files declare
// their validation rules inline and end the array with this middleware, which is what stops
// an invalid request before it ever reaches a controller.

// Collects whatever the preceding express-validator rules recorded on the request and, if
// anything failed, raises a 422 `VALIDATION_ERROR` carrying the full list of field errors
// in `details` so the frontend can show which input was wrong. If nothing failed it simply
// calls `next`. Rules alone do not reject anything — they only record results — so leaving
// this middleware out means invalid data silently reaches the controller and usually
// surfaces much later as a confusing Prisma error instead of a clean 422.
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
