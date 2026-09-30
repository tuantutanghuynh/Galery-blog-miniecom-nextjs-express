import prisma from '../services/prisma';
import { REFRESH_TOKEN_TTL_MS, REUSE_DETECTION_WINDOW_MS } from '../services/token.service';

// Dọn bảng RefreshToken. Mỗi lần đăng nhập hay xoay token đều sinh thêm một dòng, và dòng cũ
// chỉ được đánh dấu `revokedAt` chứ không bị xoá — nên bảng này chỉ tăng chứ không bao giờ
// giảm nếu không có ai dọn.
//
// Việc dọn nằm ở worker định kỳ chứ KHÔNG gắn vào issueRefreshToken. Gắn vào đó thì mỗi lượt
// đăng nhập kéo theo một lệnh xoá quét toàn bảng — bảng này chỉ có index trên `tokenHash` và
// `userId`, không index nào phục vụ điều kiện lọc theo thời gian. Nghĩa là cách đó đổi một
// vấn đề quy mô (bảng phình to) lấy một vấn đề quy mô khác (mỗi lần đăng nhập quét cả bảng),
// và đúng ở quy mô lớn thì nó hỏng.
const PRUNE_INTERVAL_HOURS = 6;

// Xoá hai nhóm, và cố ý tách riêng thay vì gộp thành một điều kiện `expiresAt < now`:
//
//   1. Token chưa bị thu hồi mà đã hết hạn — rác thuần tuý, không ai dùng được nữa.
//   2. Token đã thu hồi quá REUSE_DETECTION_WINDOW_MS.
//
// Nhóm 2 phải giữ lâu hơn hạn dùng của chính nó. `rotateRefreshToken` phát hiện token bị đánh
// cắp bằng cách tra thấy một bản ghi có `revokedAt` khác null rồi thu hồi toàn bộ phiên của
// người đó. Xoá sớm những dòng đã thu hồi là xoá luôn dấu vết đó: kẻ trộm đem token cũ ra
// dùng sẽ chỉ nhận "token không hợp lệ", còn chủ tài khoản không hề được cảnh báo.
export async function pruneRefreshTokens(): Promise<number> {
  const now = new Date();
  const hetHanCanhBao = new Date(now.getTime() - REUSE_DETECTION_WINDOW_MS);

  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { revokedAt: null, expiresAt: { lt: now } },
        { revokedAt: { lt: hetHanCanhBao } },
      ],
    },
  });

  return count;
}

// Chạy ngay một lần lúc khởi động rồi lặp lại theo chu kỳ. `unref()` để timer này không tự nó
// giữ tiến trình sống, và `.catch()` để một lỗi database thoáng qua không biến thành unhandled
// rejection — ở Node hiện đại thì unhandled rejection trong callback của timer giết cả tiến
// trình, tức là biến một trục trặc nhỏ thành chết server.
export function startRefreshTokenPruner(): NodeJS.Timeout {
  const run = () => {
    pruneRefreshTokens()
      .then((n) => {
        if (n > 0) console.log(`[pruner] Đã xoá ${n} refresh token hết hạn hoặc đã thu hồi`);
      })
      .catch((err: Error) => console.error('[pruner] Lỗi khi dọn refresh token:', err.message));
  };

  run();
  const timer = setInterval(run, PRUNE_INTERVAL_HOURS * 3600 * 1000);
  timer.unref();
  return timer;
}

export default { pruneRefreshTokens, startRefreshTokenPruner };
