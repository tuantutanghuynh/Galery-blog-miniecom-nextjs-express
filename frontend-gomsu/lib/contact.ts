// Thông tin liên hệ công khai của site, gom về một chỗ.
//
// Trước đây số điện thoại và email được viết cứng ở ba nơi (chân trang trang chủ, trang Về
// chúng tôi, dữ liệu có cấu trúc trong layout) và đã lệch nhau: chân trang còn giữ số giả
// `+84 xxx xxx xxx` và một email đuôi `.vn` không thuộc về site. Đổi thông tin thì chỉ sửa ở
// đây.
export const CONTACT = {
  email: 'canhnhut@nghiaphai.com',

  // Dạng hiển thị cho người đọc, theo cách viết quen thuộc ở Việt Nam.
  phoneDisplay: '0768.986.986',

  // Dạng quốc tế E.164 cho link `tel:` và JSON-LD. Bỏ số 0 đầu, thêm mã nước +84: điện thoại
  // gọi được từ cả trong và ngoài nước, và Google hiểu đúng đây là số Việt Nam.
  phoneE164: '+84768986986',
} as const;
