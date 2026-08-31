// ==========================================
// 1. IMPORT DEPENDENCIES
// ==========================================
// IMPORT the custom 'ApiError' utility class (for standardized error handling)
const ApiError = require('../utils/ApiError');

// ==========================================
// 2. DEFINE NOT-FOUND MIDDLEWARE
// ==========================================
// FUNCTION notFound(req, res, next):
// Purpose: Catch-all middleware mounted AFTER every real route. If a request
// reaches this point, it means no route above matched the URL/method.
module.exports = function notFound(req, res, next) {
  // CREATE a new ApiError (Status: 404, Code: 'NOT_FOUND') including the
  // original requested URL (req.originalUrl) in the message for easier debugging
  // PASS the error to 'next' so it flows into the centralized errorHandler
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.originalUrl} không tồn tại`));
};
