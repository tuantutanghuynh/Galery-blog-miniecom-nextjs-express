import type { Request, Response, NextFunction } from 'express';

const { verifyAccessToken } = require('../services/jwt.service');

// Nhận diện người dùng NẾU họ tình cờ đang đăng nhập, và không cản ai cả.
//
// Khác `authenticate` ở chỗ không bao giờ trả 401: thiếu token, token hỏng hay hết hạn đều
// đi tiếp với `req.user` để trống. Dùng cho những endpoint công khai mà biết thêm danh tính
// thì tốt nhưng không biết cũng không sao — ở đây là yêu cầu tư vấn: khách vãng lai vẫn gửi
// được, còn ai đang đăng nhập thì đơn tự gắn vào tài khoản để sau xem lại trong trang cá nhân.
//
// Cố ý nuốt lỗi token: một token hết hạn không được phép biến việc gửi yêu cầu thành thất
// bại, vì khách không hề làm gì sai và họ cũng không cần tài khoản để mua hàng.
function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token) as { sub: string; role: string };
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // Token hỏng hoặc hết hạn -> coi như khách vãng lai.
    }
  }

  next();
}

module.exports = optionalAuthenticate;
