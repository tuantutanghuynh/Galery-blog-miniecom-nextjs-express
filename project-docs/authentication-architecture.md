# KIẾN TRÚC XÁC THỰC (AUTHENTICATION) & BẢO MẬT

Tài liệu này giải thích chi tiết toàn bộ cơ chế Authentication (Xác thực) và Authorization (Phân quyền) đang được sử dụng trong dự án Miniecom (Next.js + Express).

---

## 1. CÔNG NGHỆ & THƯ VIỆN ĐƯỢC SỬ DỤNG

### Backend (Node.js / Express)
- **`jsonwebtoken`**: Tạo và xác thực **Access Token** (JWT). Access Token không được lưu trong DB, chỉ dùng để chứa danh tính (`sub`) và quyền (`role`), có tuổi thọ rất ngắn.
- **`bcrypt`**: Mã hóa mật khẩu một chiều. Tránh việc lộ mật khẩu ngay cả khi hacker lấy được toàn bộ Database. Cost factor được cấu hình là 10.
- **`crypto` (Native Node.js)**: Sinh chuỗi ngẫu nhiên an toàn để làm **Refresh Token**. Đồng thời dùng `sha256` để mã hóa Refresh Token trước khi lưu vào DB.
- **Prisma ORM**: Tương tác với PostgreSQL Supabase (qua 2 bảng `User` và `RefreshToken`).

### Frontend (Next.js)
- **`localStorage`**: Lưu trữ tạm thời Access Token và Refresh Token của Admin trên trình duyệt.
- **Tự bọc Fetch API (`authFetch`)**: Tự động chèn Access Token vào mọi request gọi lên API. Đồng thời lắng nghe mã lỗi `401 Unauthorized` để tự động kích hoạt tiến trình làm mới token (Refresh Token Rotation).

---

## 2. CHIẾN LƯỢC TOKEN KÉP (DUAL-TOKEN ARCHITECTURE)

Dự án áp dụng mô hình bảo mật cấp cao bằng cách tách Token thành 2 loại:

1. **Access Token (JWT - Stateless)**
   - **Tuổi thọ:** Rất ngắn (15 phút).
   - **Nhiệm vụ:** Vé thông hành gắn vào mỗi request. Gọn nhẹ, server giải mã thẳng không cần gọi Database.
   - **Nhược điểm:** Đã phát hành là không thể thu hồi. Vì vậy tuổi thọ 15 phút là để giới hạn rủi ro nếu token bị đánh cắp.
2. **Refresh Token (Opaque String - Stateful)**
   - **Tuổi thọ:** Dài (7 ngày).
   - **Nhiệm vụ:** Nằm im dưới máy client, chỉ mang ra dùng 15 phút/lần khi Access Token hết hạn để "đổi" lấy Access Token mới.
   - **Cơ chế:** Lưu Hash (`sha256`) trong Database. Bị thu hồi bất cứ lúc nào (khi Logout hoặc khi đổi mật khẩu). 
   - **Đặc biệt (Reuse Detection):** Mỗi Refresh Token chỉ được xài ĐÚNG 1 LẦN. Khi bạn dùng nó để đổi token mới, token cũ bị hủy. Nếu có ai đó cố tình dùng lại một Refresh Token cũ, Server sẽ đánh dấu đó là hành vi trộm token -> Lập tức hủy bỏ toàn bộ phiên đăng nhập của người dùng đó (Logout toàn diện).

---

## 3. DANH MỤC CÁC FILE CODE QUAN TRỌNG (INDEX)

### Backend
1. **[backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)**: Nơi định nghĩa 2 bảng `User` và `RefreshToken` — xem [`model User`](../../backend/prisma/schema.prisma#L20-L35) và [`model RefreshToken`](../../backend/prisma/schema.prisma#L37-L45).
2. **[backend/services/jwt.service.js](../../backend/services/jwt.service.js)**: Hàm tạo ([`signAccessToken`](../../backend/services/jwt.service.js#L1-L15)) và giải mã ([`verifyAccessToken`](../../backend/services/jwt.service.js#L17-L30)) JWT.
3. **[backend/services/token.service.js](../../backend/services/token.service.js)**: Nơi chứa logic hóc búa nhất: Sinh Refresh token ([`issueRefreshToken`](../../backend/services/token.service.js#L1-L25)), Hash & Reuse detection ([`rotateRefreshToken`](../../backend/services/token.service.js#L27-L65)), và Hủy ([`revokeRefreshToken`](../../backend/services/token.service.js#L67-L80)).
4. **[backend/controllers/auth.controller.js](../../backend/controllers/auth.controller.js)**: Nơi hứng API [`login`](../../backend/controllers/auth.controller.js#L25-L70), [`register`](../../backend/controllers/auth.controller.js#L72-L100), [`refresh`](../../backend/controllers/auth.controller.js#L102-L120), [`logout`](../../backend/controllers/auth.controller.js#L122-L135), [`changePassword`](../../backend/controllers/auth.controller.js#L137-L165).
5. **[backend/middlewares/authenticate.js](../../backend/middlewares/authenticate.js)**: Đứng gác cổng các API, giải mã Token lấy `req.user` — xem [middleware logic](../../backend/middlewares/authenticate.js#L1-L30).
6. **[backend/middlewares/requireRole.js](../../backend/middlewares/requireRole.js)**: Đứng ngay sau gác cổng, kiểm tra xem `req.user.role` có phải là `admin` không — xem [role check](../../backend/middlewares/requireRole.js#L1-L15).

### Frontend
7. **[frontend-gomsu/lib/adminAuth.js](../../frontend-gomsu/lib/adminAuth.js)**: File chứa logic cốt lõi ở Frontend: Lưu/xóa localStorage ([`login`](../../frontend-gomsu/lib/adminAuth.js#L1-L25), [`logout`](../../frontend-gomsu/lib/adminAuth.js#L27-L40)) và hàm [`authFetch`](../../frontend-gomsu/lib/adminAuth.js#L42-L90) tự động hứng lỗi `401` để làm mới phiên (Refresh).

---

## 4. LUỒNG HOẠT ĐỘNG API (API FLOWS & PSEUDOCODE)

### Luồng 1: Đăng nhập (Login)
**API:** `POST /api/v1/auth/login`  
**Code:** [auth.controller.js — login handler](../../backend/controllers/auth.controller.js#L25-L70)

**Pseudocode (Mã giả):**
```text
1. Nhận { email, password } từ Client.
2. Tìm user trong DB bằng email. Nếu không có -> Trả về lỗi 401.
3. Dùng bcrypt.compare() so sánh password với passwordHash trong DB. Nếu sai -> Lỗi 401.
4. Tạo Access Token (JWT) bằng jwt.sign({ sub: user.id, role: user.role }), hạn 15 phút.
   → Xem [jwt.service.js — signAccessToken](../../backend/services/jwt.service.js#L1-L15)
5. Tạo Refresh Token ngẫu nhiên (Opaque Token).
6. Mã hóa sha256 cái Refresh Token đó, lưu vào bảng RefreshToken trong DB.
   → Xem [token.service.js — issueRefreshToken](../../backend/services/token.service.js#L1-L25)
7. Trả về cho Client: { accessToken, refreshToken, role }
```

### Luồng 2: Cấp lại vé (Refresh Token)
**API:** `POST /api/v1/auth/refresh`  
**Code:** [auth.controller.js — refresh handler](../../backend/controllers/auth.controller.js#L102-L120) + [token.service.js — rotateRefreshToken](../../backend/services/token.service.js#L27-L65)

**Hoàn cảnh:** Client gọi API tạo bài viết, backend soi Access Token thấy đã hết hạn, trả về `401`. File `adminAuth.js` của Frontend tự động kích hoạt luồng này.

**Pseudocode:**
```text
1. Nhận { refreshToken } từ Client.
2. Mã hóa sha256 để tìm trong DB xem có tồn tại không.
3. Nếu TỒN TẠI, nhưng đã bị đánh dấu là "BỊ THU HỒI" (revokedAt != null):
   -> Nguy hiểm! Có người đang xài lại token cũ (Bị hack).
   -> Thu hồi TOÀN BỘ token khác của user này. [Xem rotateRefreshToken logic](../../backend/services/token.service.js#L50-L65)
   -> Trả về 401 (Đuổi ra ngoài bắt đăng nhập lại).
4. Nếu TỒN TẠI và HỢP LỆ (chưa hết 7 ngày, chưa bị thu hồi):
   -> Đánh dấu token này là "ĐÃ THU HỒI" (Vì đã xài rồi).
   -> Tạo ra cặp Access Token & Refresh Token hoàn toàn mới.
   -> Lưu Hash của Refresh Token mới vào DB.
   -> Trả 2 token mới về cho Client.
```

### Luồng 3: Gác cổng (Authentication Middleware)
**API:** Bất kỳ API nào cần bảo vệ (VD: `POST /api/v1/blog`)  
**Code:** [authenticate.js](../../backend/middlewares/authenticate.js) + [requireRole.js](../../backend/middlewares/requireRole.js)

**Pseudocode:**
```text
1. middleware authenticate chạy đầu tiên. [Xem authenticate.js](../../backend/middlewares/authenticate.js#L1-L30)
2. Kiểm tra req.headers.authorization có Bearer Token không.
3. Dùng jwt.verify() để kiểm tra chữ ký và Hạn sử dụng.
   - Nếu hết hạn hoặc bị sửa đổi -> Ném lỗi 401.
   - [Xem verifyAccessToken](../../backend/services/jwt.service.js#L17-L30)
4. Nếu thành công -> Lấy được { id, role } gán vào req.user.
5. middleware requireRole('admin') chạy tiếp theo. [Xem requireRole.js](../../backend/middlewares/requireRole.js#L1-L15)
6. Kiểm tra req.user.role == 'admin'?
   - Nếu không phải -> Ném lỗi 403 Forbidden.
   - Nếu phải -> Cho phép gọi tới Controller xử lý lưu bài viết.
```

### Luồng 4: Auto Refresh tại Frontend (adminAuth.js)
**File:** [frontend-gomsu/lib/adminAuth.js](../../frontend-gomsu/lib/adminAuth.js)

**Pseudocode:**
```text
1. Hàm authFetch được gọi. [Xem authFetch](../../frontend-gomsu/lib/adminAuth.js#L42-L90)
2. Lấy Access Token từ localStorage ghép vào Header. [Xem getAccessToken()](../../frontend-gomsu/lib/adminAuth.js#L1-L20)
3. Gọi API (VD: /api/v1/blog).
4. Nhận kết quả từ Backend.
5. NẾU mã lỗi là 401:
   a. Chặn đứng các request khác (dùng biến refreshPromise) để không gọi loạn lên. [Xem lock logic](../../frontend-gomsu/lib/adminAuth.js#L60-L70)
   b. Lấy Refresh Token gọi lên /api/v1/auth/refresh.
   c. Nhận Token mới -> Lưu vào localStorage. [Xem refreshAccessToken()](../../frontend-gomsu/lib/adminAuth.js#L22-L40)
   d. Đóng gói lại Request lúc nãy với Token mới và TỰ ĐỘNG GỌI LẠI lần 2.
   e. Trả dữ liệu thành công cho giao diện như chưa hề có cuộc chia ly (User không hề biết token vừa bị hết hạn).
6. Nếu kết quả trả về mã khác (200, 400, 404, 500) -> Trả thẳng về cho Giao diện xử lý.
```

---

## 5. TẠI SAO LẠI XÂY DỰNG NHƯ VẬY? (BÀI TOÁN BẢO MẬT)

1. **Tại sao không làm 1 Token sống 1 năm cho khỏe?**
   Nếu hacker chôm được JWT của bạn (qua lỗ hổng XSS), hắn có 1 năm để làm Admin. Với mô hình này, hắn chỉ có 15 phút (xem [`JWT_ACCESS_EXPIRES`](../../backend/config/env.js#L20-L25)).
   
2. **Tại sao không lưu thẳng Token vào DB mà phải Hash (SHA-256)?**
   Nếu một ông dev trong công ty dump Database ra, ông ấy sẽ lấy được toàn bộ Refresh Token của khách và giả danh khách hàng. Hash SHA-256 đảm bảo Database chỉ chứa "bóng" của Token, bản gốc chỉ nằm ở trình duyệt người dùng. [Xem crypto.createHash() trong issueRefreshToken](../../backend/services/token.service.js#L10-L15).

3. **Tại sao đổi mật khẩu phải hủy toàn bộ Token cũ?**
   Giả sử máy bạn bị hacker truy cập. Bạn phát hiện ra, lên điện thoại đổi mật khẩu. Nếu Backend không lập tức đổi `revokedAt = NOW()` cho toàn bộ Token cũ, thì cái máy đang bị hack kia vẫn tiếp tục gọi `Refresh` và lấy Token mới xài bình thường, việc bạn đổi mật khẩu trở nên vô nghĩa. [Xem changePassword — revokeAllUserTokens](../../backend/controllers/auth.controller.js#L137-L165).

## TỔNG KẾT
Kiến trúc này đạt chuẩn bảo mật hệ thống Enterprise. Nó vừa đảm bảo tốc độ cao (nhờ JWT Stateless), vừa đảm bảo khả năng kiểm soát/đóng băng tài khoản (nhờ Refresh Token Stateful), và trải nghiệm người dùng không bị gián đoạn (nhờ Auto-Refresh ở Frontend).
