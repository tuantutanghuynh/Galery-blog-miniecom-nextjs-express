# Bản Đồ Học Tập (Learning Index) - Dự Án Mini Ecom

Tài liệu này được thiết kế như một "bản đồ kho báu", hướng dẫn bạn thứ tự đọc các file trong dự án từ cơ bản đến nâng cao để nắm vững toàn bộ những gì chúng ta đã xây dựng.

---

## Giai đoạn 1: Lõi Dữ Liệu & Kiến trúc (Database & Architecture)
*Hãy bắt đầu từ đây để hiểu cách dữ liệu được lưu trữ và vì sao 1 backend phục vụ được nhiều business.*

1. **[backend/prisma/schema.prisma](../backend/prisma/schema.prisma)**
   - **Trọng tâm:** Toàn bộ mô hình dữ liệu. Chú ý `Category` có `parentId` tự tham chiếu (cây danh mục cha/con) và `CategoryAttribute` (mô hình EAV) — đây là lý do 1 schema dùng chung được cho cả Petshop lẫn Gốm sứ mà không cần sửa bảng. `Product`/`ProductVariant`/`ProductImage` đã có sẵn khung, để dành cho Giai đoạn 2 (Ecommerce core).
2. **[project-docs/auth-architecture.md](auth-architecture.md)**
   - **Trọng tâm:** Đặc tả luồng bảo mật. Cơ chế Access Token (ngắn hạn) + Refresh Token (dài hạn, lưu hash trong bảng `RefreshToken`, có rotation và chống đánh cắp token qua reuse detection).
3. **`Category.parentId` + `BRAND_CATEGORY_SLUG`** *(xem lại ở mục 11)*
   - **Trọng tâm:** Vì sao chọn kiến trúc "White-label clone" (1 backend, nhiều frontend riêng theo từng business) thay vì multi-tenant SaaS: mỗi business là 1 `Category` gốc, mỗi frontend chỉ lọc đúng cây danh mục của mình qua 1 hằng số duy nhất — không cần bảng "tenant" riêng.

## Giai đoạn 2: API & Backend (Express.js)
*Cách Backend xử lý yêu cầu từ Client và giao tiếp với Database.*

4. **[backend/app.js](../backend/app.js)** & **[backend/bin/www](../backend/bin/www)**
   - **Trọng tâm:** Entry point server. Cấu hình CORS theo danh sách nhiều origin (`FRONTEND_URLS`, vì có 2 frontend chạy 2 port khác nhau), Helmet, Rate Limit, và thứ tự middleware quan trọng: `/uploads` static phải đứng trước `notFound`.
5. **[backend/routes/auth.route.js](../backend/routes/auth.route.js)** & **[backend/controllers/auth.controller.js](../backend/controllers/auth.controller.js)**
   - **Trọng tâm:** Luồng Đăng ký/Đăng nhập/Refresh/Logout, cấp Access Token + Refresh Token theo cơ chế ở mục 2.
6. **[backend/controllers/category.controller.js](../backend/controllers/category.controller.js)** & **[backend/routes/category.route.js](../backend/routes/category.route.js)**
   - **Trọng tâm:** CRUD Category, hỗ trợ tạo danh mục con qua `parentId`. Đây là API mà mọi content (blog, gallery, sau này là product) đều phải gắn `categoryId` vào.
7. **[backend/controllers/blog.controller.js](../backend/controllers/blog.controller.js)** & **[backend/routes/blog.route.js](../backend/routes/blog.route.js)**
   - **Trọng tâm:** CRUD bài viết chuẩn RESTful. Chú ý `adminList` lọc được theo `categorySlug` + `status` (để tách nội dung 2 business ngay trong trang quản trị), và `publishedAt` chỉ được set đúng 1 lần lúc chuyển draft → published.
8. **[backend/controllers/gallery.controller.js](../backend/controllers/gallery.controller.js)** & **[backend/routes/gallery.route.js](../backend/routes/gallery.route.js)**
   - **Trọng tâm:** Phân trang (`skip`/`take`) kết hợp lọc theo `categorySlug`.
9. **[backend/middlewares/upload.js](../backend/middlewares/upload.js)**, **[backend/controllers/upload.controller.js](../backend/controllers/upload.controller.js)**
   - **Trọng tâm:** Upload ảnh bằng `multer` (diskStorage), giới hạn dung lượng/mime type, đổi tên file bằng chuỗi hex ngẫu nhiên (không giữ tên gốc). Ảnh lưu tại `backend/public/uploads/`, phục vụ qua route static `/uploads` — lưu ý đây là ổ đĩa local, sẽ mất dữ liệu khi deploy (cần đổi sang Cloudinary/S3 ở Buổi 16).

## Giai đoạn 3: Frontend Lõi & Bảo mật (Next.js 16)
*Cách Frontend bảo mật và giao tiếp với Backend không cần axios.*

10. **[frontend-gomsu/lib/apiClient.js](../frontend-gomsu/lib/apiClient.js)**
    - **Trọng tâm:** Hàm `apiFetch` cho API public, dùng `fetch` gốc để tận dụng Data Cache của Next.js (axios không làm được điều này).
11. **[frontend-gomsu/lib/brand.js](../frontend-gomsu/lib/brand.js)**
    - **Trọng tâm:** Chỉ 1 dòng (`BRAND_CATEGORY_SLUG`) nhưng là chốt chặn quan trọng nhất của kiến trúc white-label — mọi query gallery/blog ở frontend này đều lọc qua hằng số này để không hiện nội dung của business khác.
12. **[frontend-gomsu/lib/adminAuth.js](../frontend-gomsu/lib/adminAuth.js)**
    - **Trọng tâm:** "Trái tim" bảo mật của Frontend. Đọc kỹ hàm `authFetch`: xử lý lỗi 401 → tự động gọi `/auth/refresh` → lấy token mới → gọi lại API cũ. Biến `refreshPromise` ở module-scope chống Race Condition khi nhiều API cùng 401 một lúc.

## Giai đoạn 4: Giao diện Gốm Sứ "Dark Museum" (UI/UX)
*Cách cấu hình Next.js App Router, Tailwind v4 và tách Component.*

13. **[frontend-gomsu/app/globals.css](../frontend-gomsu/app/globals.css)**
    - **Trọng tâm:** Theme Tailwind v4 hoàn toàn bằng CSS (`@theme`), định nghĩa màu `gomsu-*` và ép góc bo về 0px (`--radius: 0px`) cho toàn bộ site.
14. **[frontend-gomsu/app/layout.js](../frontend-gomsu/app/layout.js)**
    - **Trọng tâm:** Nhúng font Google (Playfair Display, Montserrat) qua biến CSS bằng `next/font/google`, bọc `<Navbar />` toàn cục quanh mọi trang.
15. **[frontend-gomsu/components/layout/Navbar.js](../frontend-gomsu/components/layout/Navbar.js)**
    - **Trọng tâm:** Thanh điều hướng dùng `next/link`. Có menu mobile dạng hamburger — dùng `useState` để lưu trạng thái đóng/mở, nên phải là Client Component (`'use client'`), 3 thanh gạch tự xoay thành dấu ✕ bằng `className` động theo state.
16. **[frontend-gomsu/app/page.js](../frontend-gomsu/app/page.js)**
    - **Trọng tâm:** Trang chủ giờ chỉ còn phần `await Promise.all(...)` gọi song song Gallery + Blog, phần hiển thị đã được tách hết ra `components/home/`.
17. **[frontend-gomsu/components/home/](../frontend-gomsu/components/home/)** (`Hero.js`, `ArtistIntro.js`, `Quote.js`, `FeatureWorks.js`, `LatestNews.js`, `ContactSection.js`, `Footer.js`)
    - **Trọng tâm:** Mỗi section trang chủ là 1 component riêng, chỉ nhận data qua `props` (`FeatureWorks`, `LatestNews`) — minh hoạ nguyên tắc "fetch ở gần root (`page.js`), hiển thị ở component con". `Hero.js`/`ArtistIntro.js` dùng `<Image fill>` làm ảnh nền tràn khung.
18. **[frontend-gomsu/app/gallery/page.js](../frontend-gomsu/app/gallery/page.js)**, **[frontend-gomsu/app/blog/page.js](../frontend-gomsu/app/blog/page.js)**, **[frontend-gomsu/app/blog/[slug]/page.js](../frontend-gomsu/app/blog/%5Bslug%5D/page.js)**
    - **Trọng tâm:** `gallery/page.js` đọc `searchParams` (Promise ở Next 16, phải `await`) để làm tab lọc theo danh mục con. `lib/markdown.js` dùng để render nội dung Markdown thành HTML an toàn (qua `isomorphic-dompurify`) ở trang chi tiết bài viết.
19. **[frontend-gomsu/app/sitemap.js](../frontend-gomsu/app/sitemap.js)**
    - **Trọng tâm:** Next.js tự sinh `sitemap.xml` từ file này — quan trọng cho SEO. ⚠️ Lưu ý đang fetch `/blog` không lọc theo `BRAND_CATEGORY_SLUG`, cần sửa trước khi `frontend-petshop` có bài viết riêng, nếu không sitemap của Gốm sứ sẽ lẫn cả URL bên Petshop.

## Giai đoạn 5: Quản trị (Admin CMS)
*Cách vận hành trang quản trị dành cho chủ shop.*

20. **[frontend-gomsu/app/admin/layout.js](../frontend-gomsu/app/admin/layout.js)**
    - **Trọng tâm:** Layout dùng chung cho mọi trang `/admin/*`. Gộp logic kiểm tra đăng nhập về một chỗ duy nhất (thay vì lặp lại ở từng trang), có Sidebar điều hướng. Dùng `usePathname()` để nhận biết riêng trang `/admin/login` (không cần Sidebar, không bị redirect).
21. **[frontend-gomsu/app/admin/posts/page.js](../frontend-gomsu/app/admin/posts/page.js)**, **[posts/new/page.js](../frontend-gomsu/app/admin/posts/new/page.js)**, **[posts/[id]/edit/page.js](../frontend-gomsu/app/admin/posts/%5Bid%5D/edit/page.js)**
    - **Trọng tâm:** CRUD bài viết đầy đủ (Tạo/Sửa/Xoá). `new/page.js` có hàm `slugify()` tự sinh slug từ tiêu đề tiếng Việt có dấu. `[id]/edit/page.js` minh hoạ cách dùng `use(params)` (React) để đọc `params` — vì Client Component không `async` được như Server Component.
22. **[frontend-gomsu/app/admin/gallery/page.js](../frontend-gomsu/app/admin/gallery/page.js)**, **[gallery/new/page.js](../frontend-gomsu/app/admin/gallery/new/page.js)**
    - **Trọng tâm:** Upload ảnh bằng `FormData` — mẹo *không* set `Content-Type` trong headers để trình duyệt tự tạo Boundary.

---
*Mẹo: Khi học, hãy mở 2 màn hình. Một bên là file Code, một bên là bản đồ này. Ghi chú lại bất kỳ dòng code nào bạn thấy khó hiểu để hỏi trực tiếp tôi.*
