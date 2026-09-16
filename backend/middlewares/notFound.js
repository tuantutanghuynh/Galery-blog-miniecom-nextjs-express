const ApiError = require('../utils/ApiError');

// Catch-all mounted after every real route in app.js. It turns "no route matched" into the
// same error envelope every other failure uses, instead of Express's default HTML page.

// Raises a 404 ApiError naming the URL that was requested, then hands it to `next` so the
// central error handler formats it. It must stay mounted after all routes but before
// errorHandler — mounting it too early swallows routes declared below it, which is exactly
// what once made every uploaded image 404 when the static `/uploads` mount sat after it.
// The requested path is included in the message because a bare "not found" gives no clue
// which URL the client actually called.
module.exports = function notFound(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.originalUrl} không tồn tại`));
};
