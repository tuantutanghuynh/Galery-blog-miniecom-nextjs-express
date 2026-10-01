import type { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from '../services/jwt.service';

/**
 * Middleware nhận diện người dùng tùy chọn (Optional Authentication).
 * - Nếu có Access Token hợp lệ trong header Authorization: Gắn `{ id, role }` vào `req.user`.
 * - Nếu không có token, token hỏng hoặc hết hạn: Không báo lỗi, cho phép tiếp tục với tư cách khách vãng lai.
 * - Dùng cho các endpoint như gửi Yêu cầu tư vấn (khách vãng lai gửi được, ai đã đăng nhập thì tự liên kết vào tài khoản).
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization || '';

  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token);

      req.user = {
        id: payload.sub,
        role: payload.role,
      };
    } catch {
      // Bỏ qua lỗi token hết hạn/không hợp lệ để coi như khách vãng lai
    }
  }

  next();
}

export default optionalAuthenticate;
