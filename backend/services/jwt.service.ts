import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

import { jwtAccessSecret, jwtRefreshSecret } from '../config/env';

export type AccessPayload = {
  sub: string;
  role: string;
};

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: string;
}

const ACCESS_TOKEN_TTL: SignOptions['expiresIn'] = '15m';

const REFRESH_TOKEN_TTL: SignOptions['expiresIn'] = '7d';

/**
 * Ký và sinh Access Token (JWT) ngắn hạn (15 phút).
 * - Chứa payload { sub: userId, role: userRole }.
 * - Dùng để xác thực các request API cần đăng nhập mà không cần truy vấn DB liên tục.
 */
export function signAccessToken(payload: AccessPayload): string {
  if (!jwtAccessSecret) {
    throw new Error('Thiếu JWT_ACCESS_SECRET');
  }

  return jwt.sign(payload, jwtAccessSecret, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

/**
 * Xác thực tính hợp lệ và giải mã Access Token.
 * - Trả về payload dạng `AccessTokenPayload` chứa sub (userId) và role.
 * - Ném lỗi nếu token bị hết hạn hoặc chữ ký bị sửa đổi.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  if (!jwtAccessSecret) {
    throw new Error('Thiếu JWT_ACCESS_SECRET');
  }

  return jwt.verify(token, jwtAccessSecret) as AccessTokenPayload;
}

/**
 * Ký và sinh Refresh Token dạng JWT (nếu dùng cơ chế JWT refresh).
 */
export function signRefreshToken(payload: AccessPayload): string {
  if (!jwtRefreshSecret) {
    throw new Error('Thiếu JWT_REFRESH_SALT');
  }

  return jwt.sign(payload, jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

/**
 * Xác thực tính hợp lệ của Refresh Token.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  if (!jwtRefreshSecret) {
    throw new Error('Thiếu JWT_REFRESH_SALT');
  }

  return jwt.verify(token, jwtRefreshSecret) as JwtPayload;
}

export default {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
