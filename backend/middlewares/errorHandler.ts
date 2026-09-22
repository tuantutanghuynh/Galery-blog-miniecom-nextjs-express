import type { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

// The last middleware in the chain and the only place that formats error responses. Every
// failure in the app — thrown by a controller, forwarded by asyncHandler, or raised by
// Express itself — ends up here and leaves as the standard `{ data, meta, error }` envelope.

// Turns any error into an HTTP response. Errors that are instances of ApiError were raised
// deliberately, so their status, code and message are trusted and sent to the client as-is.
// Anything else is an unexpected bug (a Prisma failure, a typo, a bad payload) — it gets
// logged to the server and answered with a generic 500, because raw error text and stack
// traces can leak table names, file paths and query structure to an attacker. Express only
// treats a middleware as an error handler if it declares exactly four parameters, so `next`
// must stay in the signature even though it is never called.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
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
}

export default errorHandler;
