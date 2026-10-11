import rateLimit from 'express-rate-limit';
import ApiError from './ApiError';

// Tạo bộ giới hạn tốc độ theo IP mà khi chặn thì trả lỗi qua errorHandler như mọi lỗi khác.
// Option `message` của thư viện tự gửi body riêng, lệch khỏi phong bì `{ data, meta, error }`, nên
// frontend đọc `error.message` không thấy gì. Chuyển thành ApiError thì định dạng chỉ nằm một chỗ.
//
// `skipSuccessfulRequests`: chỉ đếm request thất bại. Dùng cho đăng nhập, để người nhập đúng mật
// khẩu không bị khoá oan, còn kẻ dò mật khẩu thì bị chặn sau vài lần sai.
export function createLimiter(opts: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
    handler: (req, res, next) => {
      next(new ApiError(429, 'RATE_LIMIT_EXCEEDED', opts.message));
    },
  });
}

export default createLimiter;
