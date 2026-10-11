// Địa chỉ gốc của site, dùng cho canonical, sitemap, robots, llms.txt và JSON-LD. Một nguồn duy
// nhất: trước đây mỗi file tự đặt giá trị dự phòng riêng (chỗ localhost, chỗ .vercel.app), nên
// chỉ cần thiếu biến môi trường là các trang khai báo những tên miền khác nhau với Google.
//
// Trên Vercel phải đặt NEXT_PUBLIC_SITE_URL=https://www.nghiaphai.com. Biến NEXT_PUBLIC_* được
// gắn cứng lúc build, nên đổi biến xong phải deploy lại mới có hiệu lực.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nghiaphai.com').replace(/\/+$/, '');
