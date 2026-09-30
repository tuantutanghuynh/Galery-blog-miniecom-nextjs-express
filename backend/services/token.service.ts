import crypto from 'crypto';

import prisma from './prisma';

// Thời gian sống của một Refresh Token: 7 ngày (tính bằng mili-giây)
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Giữ lại bản ghi đã thu hồi thêm 30 ngày sau khi nó hết hạn, phục vụ phát hiện token bị đánh
// cắp (xem rotateRefreshToken). Dài hơn hẳn TTL là có chủ đích: kẻ trộm thường đem token ra
// dùng sau khi chủ tài khoản đã đăng nhập lại và vô tình thu hồi nó.
export const REUSE_DETECTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Hàm tiện ích: Mã hóa bản băm SHA-256 cho Refresh Token.
 * - Chỉ lưu hash vào database, không lưu raw token dạng plain text để chống lộ phiên đăng nhập khi rò rỉ DB.
 */
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Phát hành một Refresh Token mới cho người dùng.
 * - Sinh chuỗi ngẫu nhiên bảo mật 40 bytes dạng hex.
 * - Lưu bản băm SHA-256 kèm thời hạn 7 ngày vào database.
 * - Trả về token gốc chưa băm (raw token) cho client.
 *
 * Không dọn bảng ở đây: việc đó nằm ở workers/pruneRefreshTokens.ts, chạy theo chu kỳ. Xem
 * ghi chú trong file đó để biết vì sao gắn vào đường đăng nhập là sai.
 */
export async function issueRefreshToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(40).toString('hex');

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

/**
 * Đổi Refresh Token cũ lấy một Refresh Token mới (Refresh Token Rotation).
 * - Kiểm tra tính hợp lệ của token.
 * - Cơ chế phát hiện tái sử dụng token (Reuse Detection): Nếu token gửi lên ĐÃ BỊ THU HỒI từ trước,
 *   nghĩa là token có thể đã bị rò rỉ/đánh cắp -> Thu hồi toàn bộ phiên đăng nhập của user này ngay lập tức.
 * - Nếu token hợp lệ: Đánh dấu đã thu hồi token hiện tại và cấp phát một token mới.
 */
export async function rotateRefreshToken(
  rawToken: string
): Promise<{ userId: string; rawToken: string } | null> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.refreshToken.findFirst({
    where: { tokenHash },
  });

  if (!record) {
    return null;
  }

  // Phát hiện tấn công đánh cắp token: Token đã bị revoke trước đó mà vẫn đem ra dùng lại
  if (record.revokedAt !== null) {
    await prisma.refreshToken.updateMany({
      where: {
        userId: record.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return null;
  }

  // Kiểm tra thời hạn token
  if (new Date() > record.expiresAt) {
    return null;
  }

  // Thu hồi token cũ
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: {
      revokedAt: new Date(),
    },
  });

  // Phát hành token mới thay thế
  const newRawToken = await issueRefreshToken(record.userId);

  return {
    userId: record.userId,
    rawToken: newRawToken,
  };
}

/**
 * Thu hồi một Refresh Token cụ thể (dùng khi người dùng đăng xuất).
 * - Cập nhật trường `revokedAt` bằng thời điểm hiện tại.
 */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export default {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
};
