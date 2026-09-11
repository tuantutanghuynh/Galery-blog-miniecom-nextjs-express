# Bản Đồ Học Tập (Learning Index) - Dự Án Mini Ecom

Tài liệu này được thiết kế như một "bản đồ kho báu", hướng dẫn bạn thứ tự đọc các file trong dự án từ cơ bản đến nâng cao để nắm vững toàn bộ những gì chúng ta đã xây dựng.

---

## Giai đoạn 1: Lõi Dữ Liệu & Kiến trúc (Database & Architecture)
*Hãy bắt đầu từ đây để hiểu cách dữ liệu được lưu trữ và luồng xác thực.*

1. **[backend/prisma/schema.prisma](../backend/prisma/schema.prisma)**
   - **Trọng tâm:** Xem cách thiết kế Database. Hãy chú ý đến mô hình EAV (`CategoryAttribute`, `CategoryAttributeValue`) giúp tái sử dụng Backend cho cả Petshop và Gốm sứ mà không cần sửa bảng.
2. **[project-docs/auth-architecture.md](auth-architecture.md)**
   - **Trọng tâm:** Đọc tài liệu đặc tả luồng bảo mật. Hiểu cơ chế Access Token (ngắn hạn) và Refresh Token (dài hạn, có chống đánh cắp token).

## Giai đoạn 2: API & Backend (Express.js)
*Cách Backend xử lý yêu cầu từ Client và giao tiếp với Database.*

3. **[backend/bin/www](../backend/bin/www)** và **[backend/app.js](../backend/app.js)**
   - **Trọng tâm:** Entry point của server. Xem cách cấu hình CORS (cho phép frontend gọi API) và các Middleware bảo mật (Helmet, Rate Limit).
4. **[backend/routes/auth.route.js](../backend/routes/auth.route.js)** & **[backend/controllers/auth.controller.js](../backend/controllers/auth.controller.js)**
   - **Trọng tâm:** Đọc luồng Đăng nhập (Login), cấp phát Cookie HttpOnly chứa Refresh Token và cấp Access Token.
5. **[backend/controllers/gallery.controller.js](../backend/controllers/gallery.controller.js)** (hoặc blog)
   - **Trọng tâm:** Cách viết một Controller chuẩn RESTful. Xem cách dùng `prisma.galleryItem.findMany()` kết hợp với phân trang (`skip`, `take`) và lọc theo `categorySlug`.

## Giai đoạn 3: Frontend Lõi & Bảo mật (Next.js 15)
*Cách Frontend bảo mật và giao tiếp với Backend không cần axios.*

6. **[frontend-gomsu/lib/apiClient.js](../frontend-gomsu/lib/apiClient.js)**
   - **Trọng tâm:** Hàm `apiFetch` dùng cho Public API. Tận dụng cơ chế `fetch` mặc định của Next.js 15.
7. **[frontend-gomsu/lib/adminAuth.js](../frontend-gomsu/lib/adminAuth.js)**
   - **Trọng tâm:** Đây là "trái tim" bảo mật của Frontend. Đọc kỹ hàm `authFetch`. Xem cách chúng ta xử lý lỗi 401 (Hết hạn Access Token) -> Tự động gọi API `/auth/refresh` -> Lấy token mới -> Tự động gọi lại API cũ. Đặc biệt chú ý cơ chế biến cờ `refreshPromise` để chống kẹt (Race Condition) khi gọi nhiều API cùng lúc.

## Giai đoạn 4: Giao diện Gốm Sứ "Dark Museum" (UI/UX)
*Cách cấu hình Next.js App Router, Tailwind v4 và thiết kế Component.*

8. **[frontend-gomsu/app/globals.css](../frontend-gomsu/app/globals.css)** & **[frontend-gomsu/app/layout.js](../frontend-gomsu/app/layout.js)**
   - **Trọng tâm:** Xem cách cấu hình Theme Tailwind v4 hoàn toàn bằng CSS (`@theme`), ép góc bo 0px (`--radius: 0px`). File `layout.js` cho thấy cách nhúng font chữ Google (Playfair, Montserrat) vào biến CSS và bọc thẻ `<Navbar />` toàn cục.
9. **[frontend-gomsu/components/layout/Navbar.js](../frontend-gomsu/components/layout/Navbar.js)**
   - **Trọng tâm:** Cách xây dựng thanh điều hướng. Sử dụng `next/link` và `next/image` (với thuộc tính `priority`) để tối ưu tốc độ tải trang.
10. **[frontend-gomsu/app/page.js](../frontend-gomsu/app/page.js)**
    - **Trọng tâm:** Cấu trúc Server Components của Next.js 15. Xem cách dùng `await Promise.all(...)` để gọi song song API Gallery và Blog, tối ưu thời gian tải.
11. **[frontend-gomsu/components/home/Hero.js](../frontend-gomsu/components/home/Hero.js)**
    - **Trọng tâm:** Kỹ thuật dàn trang (Grid/Flex) và cách dùng `<Image fill />` kết hợp với thẻ bao bọc `relative w-full h-[80vh]` để làm ảnh Hero tràn màn hình, tối ưu LCP (Largest Contentful Paint).

## Giai đoạn 5: Quản trị (Admin CMS)
*Cách vận hành trang quản trị dành cho chủ shop.*

12. **[frontend-gomsu/app/admin/gallery/page.js](../frontend-gomsu/app/admin/gallery/page.js)**
    - **Trọng tâm:** Cách hiển thị bảng danh sách tác phẩm nghệ thuật, nút Xóa tác phẩm kèm cơ chế `authFetch` để đảm bảo quyền quản trị.
13. **[frontend-gomsu/app/admin/gallery/new/page.js](../frontend-gomsu/app/admin/gallery/new/page.js)**
    - **Trọng tâm:** Kỹ thuật xử lý Form có chứa Hình ảnh (`multipart/form-data`). Xem cách dùng đối tượng `FormData` và mẹo *không* set `Content-Type` trong headers để trình duyệt tự động tạo Boundary khi upload file.

---
*Mẹo: Khi học, hãy mở 2 màn hình. Một bên là file Code, một bên là bản đồ này. Ghi chú lại bất kỳ dòng code nào bạn thấy khó hiểu để hỏi trực tiếp tôi.*
