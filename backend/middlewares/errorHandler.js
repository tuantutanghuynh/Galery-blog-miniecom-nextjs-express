// ==========================================
// 1. IMPORT DEPENDENCIES
// ==========================================
// IMPORT the custom 'ApiError' utility class (used to distinguish "known"
// application errors from unexpected/unhandled ones)
const ApiError = require('../utils/ApiError');

// ==========================================
// 2. DEFINE ERROR-HANDLING MIDDLEWARE
// ==========================================
// FUNCTION errorHandler(err, req, res, next):
// Purpose: Centralized error handler — the LAST middleware in the chain.
// Note: Express only treats a middleware as an error handler if it declares
// EXACTLY 4 parameters (err, req, res, next). Any error passed to next(err)
// anywhere in the app (via ApiError or an uncaught exception forwarded by
// asyncHandler) ends up here instead of crashing the request.
module.exports = function errorHandler(err, req, res, next) {
  // Step 1: Handle KNOWN errors (instances of our own ApiError class)
  // IF 'err' is an instance of ApiError:
  //   RETURN a JSON response using the status/code/message/details already
  //   attached to the error object when it was thrown
  //   Format: { data: null, meta: null, error: { code, message, details } }
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      data: null,
      meta: null,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Step 2: Handle UNKNOWN/UNEXPECTED errors (bugs, driver errors, etc.)
  // LOG the full error to the console/server logs for debugging
  // RETURN a generic 500 response — NEVER leak the raw error/stack trace to
  // the client (could expose internal implementation details)
  console.error(err);
  return res.status(500).json({
    data: null,
    meta: null,
    error: { code: 'INTERNAL_ERROR', message: 'Đã có lỗi xảy ra', details: null },
  });
};
