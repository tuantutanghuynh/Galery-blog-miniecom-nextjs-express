# Kiến trúc Authentication (Miniecom Project)

Tài liệu này tổng hợp toàn bộ luồng xác thực (Authentication & Authorization) đang được áp dụng trong dự án Miniecom (cả Backend Express.js và Frontend Next.js).

## 1. Luồng Authentication Tổng Quan

Dự án áp dụng mô hình **JWT (JSON Web Token) kết hợp Access Token và Refresh Token**, giúp tối ưu hóa hiệu suất (stateless) mà vẫn đảm bảo khả năng thu hồi (revoke) khi có rủi ro.

### Backend (Express.js)
- **Access Token (`15 phút`)**: Chứa thông tin cơ bản (`id`, `role`), được mã hóa ký bằng `jwtAccessSecret`. Cấp phát tại `[backend/services/jwt.service.js](../backend/services/jwt.service.js)`.
- **Refresh Token (`7 ngày`)**: Sinh ngẫu nhiên và **lưu mã băm (SHA-256)** vào database. Xử lý tại `[backend/services/token.service.js](../backend/services/token.service.js)`.
- **Mật khẩu**: Được băm bằng `bcrypt` trước khi tạo user tại `[backend/controllers/auth.controller.js](../backend/controllers/auth.controller.js)`.
- **Phân quyền**: Thông qua middleware `authenticate` tại `[backend/middlewares/authenticate.js](../backend/middlewares/authenticate.js)` và `requireRole`.

### Frontend (Next.js - Client Side)
- **Lưu trữ**: Token được lưu trong `localStorage` qua hàm `setTokens` tại `[frontend/lib/adminAuth.js](../frontend/lib/adminAuth.js)`.
- **Hàm `authFetch`**: Interceptor tự động đính kèm `Authorization: Bearer <Token>` vào request tại `[frontend/lib/adminAuth.js](../frontend/lib/adminAuth.js)`.

---

## 2. Những "Điểm ăn tiền" (Killer Features) của hệ thống

1. **Refresh Token Rotation (Luân chuyển Token)**:
   - Mỗi lần dùng Refresh Token, token cũ bị đánh dấu `revokedAt = now()` và token mới được cấp. 
   - 📌 *Source code*: Hàm `rotateRefreshToken` trong `[backend/services/token.service.js](../backend/services/token.service.js)`.

2. **Reuse Detection (Phát hiện Tái sử dụng - Chống Replay Attack)**:
   - Phát hiện token đã bị thu hồi nhưng vẫn được gửi lên -> Xóa sổ toàn bộ token của user đó.
   - 📌 *Source code*: Kiểm tra `record.revokedAt !== null` trong hàm `rotateRefreshToken` tại `[backend/services/token.service.js](../backend/services/token.service.js)`.

3. **Chống Race Condition ở Frontend (Promise Locking)**:
   - Giải quyết tình trạng nhiều request cùng 401 đồng thời bằng biến khóa `refreshPromise`, gom mọi lệnh refresh thành 1.
   - 📌 *Source code*: Biến `refreshPromise` và hàm `refreshAccessToken` tại `[frontend/lib/adminAuth.js](../frontend/lib/adminAuth.js)`.

4. **Security Headers & Rate Limiting**:
   - Chống Brute-force & XSS, Clickjacking.
   - 📌 *Source code*: Cấu hình `helmet` và `express-rate-limit` tại `[backend/app.js](../backend/app.js)`.

---

## 3. Các điểm cần lưu ý khi đưa lên Production (Go-Live)

Để hệ thống hoàn hảo 100% khi deploy ra môi trường thực tế, cần thực hiện:

### Chuyển đổi lưu trữ (Frontend)
Hiện tại Token lưu ở `localStorage` tại `[frontend/lib/adminAuth.js](../frontend/lib/adminAuth.js)`.
👉 **Hành động**: Nên chuyển Access Token & Refresh Token sang lưu ở **HttpOnly Cookie** để miễn nhiễm hoàn toàn với XSS.

### Rate Limiting phân tán (Backend)
Hiện tại `express-rate-limit` cấu hình tại `[backend/app.js](../backend/app.js)` lưu cache trên RAM.
👉 **Hành động**: Bổ sung `rate-limit-redis` nếu chạy cluster hoặc nhiều servers (PM2, Docker Swarm).

### Biến môi trường (Environment Variables)
👉 **Hành động**: Đổi `jwtAccessSecret` tại `[backend/config/env.js](../backend/config/env.js)` thành chuỗi siêu bảo mật và cấu hình `FRONTEND_URL` chuẩn xác cho CORS tại `[backend/app.js](../backend/app.js)`.

### HTTPS / SSL
👉 **Hành động**: Chạy chứng chỉ SSL/HTTPS. Helmet đã có `Strict-Transport-Security` tại `[backend/app.js](../backend/app.js)` nhưng cần SSL thật để kích hoạt.
