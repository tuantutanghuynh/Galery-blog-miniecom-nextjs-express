import type { Request, Response, NextFunction } from 'express';

import ApiError from '../utils/ApiError';

import { verifyAccessToken } from '../services/jwt.service';

/**
 * Middleware bảo vệ các route yêu cầu đăng nhập (Authenticated Routes).
 * - Đọc token từ header `Authorization: Bearer <token>`.
 * - Xác thực token và gắn thông tin người dùng `{ id, role }` vào `req.user`.
 * - Trả về mã lỗi 401 UNAUTHENTICATED nếu thiếu token, sai định dạng hoặc token hết hạn.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization || '';

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(
      new ApiError(
        401,
        'UNAUTHENTICATED',
        'Missing access token'
      )
    );
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    next(
      new ApiError(
        401,
        'UNAUTHENTICATED',
        'Access token is invalid or expired'
      )
    );
  }
}

export default authenticate;
