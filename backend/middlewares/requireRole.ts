import type { RequestHandler } from 'express';

const ApiError = require('../utils/ApiError');

// Role check that runs after `authenticate` and keeps admin-only endpoints closed to
// ordinary accounts. This is the whole authorisation layer of the project — there is no
// per-permission table, only the `role` column on User.

// Takes the roles allowed to proceed and returns the actual middleware, so a route can read
// as `requireRole('admin')`. The returned middleware answers 401 when `req.user` is missing
// and 403 when the caller is authenticated but holds the wrong role — keeping those two
// apart matters because 401 means "log in", while 403 means "logging in again will not
// help". It relies entirely on `authenticate` having run first; mounting it alone leaves the
// endpoint open to anonymous callers, so the two always appear together on a route.
function requireRole(...allowedRoles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHENTICATED', 'Chưa đăng nhập'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Không đủ quyền truy cập'));
    }

    next();
  };
}

module.exports = requireRole;
