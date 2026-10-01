import type { Request, Response, NextFunction, RequestHandler } from 'express';

import type { ParamsDictionary } from 'express-serve-static-core';

import type { ParsedQs } from 'qs';

/**
 * Wrapper bắt lỗi cho các controller bất đồng bộ (async controllers).
 * - Tự động bắt mọi Promise Rejection và chuyển tiếp cho middleware `errorHandler` qua `next(err)`.
 * - Tránh việc server bị treo vô thời hạn (hanging request) khi xảy ra lỗi trong hàm async.
 */
export function asyncHandler<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<unknown> | unknown
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
