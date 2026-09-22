// Mở rộng kiểu Request của Express để TypeScript biết về hai trường mà middleware tự gắn
// vào. Không khai ở đây thì mọi controller đọc req.user sẽ báo lỗi "property does not exist".
//
// Cả hai đều để optional: cùng một kiểu Request được dùng cho cả route công khai lẫn route
// có xác thực, nên TypeScript sẽ bắt chỗ nào đọc req.user mà chưa kiểm tra tồn tại — đúng
// loại lỗi đã làm /auth/me trả 500 suốt một thời gian vì đọc nhầm req.user.sub.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
      brand?: { slug: string; categoryIds: string[] };
    }
  }
}

export {};
