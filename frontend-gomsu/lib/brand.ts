// Slug của category gốc dùng để lọc nội dung đúng thương hiệu này — vì backend/database
// hiện đang dùng CHUNG giữa frontend-gomsu và frontend-petshop (xem
// docs/superpowers/specs/2026-09-12-business-split-white-label-design.md). Không lọc
// theo category sẽ khiến trang Gốm sứ hiện lẫn nội dung Petshop và ngược lại.
export const BRAND_CATEGORY_SLUG: string = 'gom-su-trang-tri';
