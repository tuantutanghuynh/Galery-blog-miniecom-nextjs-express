import 'dotenv/config';
import * as Sentry from '@sentry/node';

// Phải chạy TRƯỚC mọi import khác thì Sentry mới chèn được vào http, express và prisma.
// Vì vậy file này được import ở dòng đầu tiên của bin/www.ts.
//
// Không có DSN thì im lặng bỏ qua: ở máy local ta không muốn gửi lỗi đi đâu cả, và cũng
// không muốn server từ chối khởi động chỉ vì thiếu một biến môi trường tuỳ chọn.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',

    // Xoá thẳng dữ liệu cá nhân khỏi mỗi sự kiện trước khi gửi đi.
    //
    // Bản 11 của SDK đã bỏ tuỳ chọn `sendDefaultPii`, nên không còn một công tắc để tắt. Thay
    // vì tin vào một mặc định không kiểm chứng được, ở đây ta chủ động gỡ: cách này đúng bất
    // kể SDK mặc định làm gì, và nếu bản sau đổi hành vi thì nó vẫn đúng.
    //
    // Lý do phải làm: form yêu cầu tư vấn nhận TÊN, SỐ ĐIỆN THOẠI và ĐỊA CHỈ của khách hàng
    // thật. Khi một request lỗi, toàn bộ body đó nằm trong `event.request.data`. Không có lý
    // do gì để dữ liệu ấy rời khỏi máy chủ của mình.
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;      // chứa refresh token
        delete event.request.headers;      // chứa Authorization và IP
        delete event.request.data;         // chứa body: tên, số điện thoại, địa chỉ
        delete event.request.query_string; // chứa token reset mật khẩu
      }
      delete event.user;
      return event;
    },

    integrations: [
      Sentry.expressIntegration({
        // Chỉ báo động lỗi từ 500 trở lên. ApiError mà controller chủ động ném ra đều mang
        // status 4xx (sai mật khẩu, hết hàng, thiếu quyền) — đó là hệ thống chạy ĐÚNG, không
        // phải sự cố. Gửi cả chúng lên sẽ làm ngập hộp cảnh báo và bạn sẽ tắt thông báo,
        // lúc đó Sentry thành vô dụng.
        //
        // Đây cũng là mặc định của SDK; viết ra tường minh để người đọc sau biết ranh giới
        // này là cố ý chứ không phải tình cờ.
        shouldHandleError: (error) => ((error as { statusCode?: number }).statusCode ?? 500) >= 500,
      }),
    ],
  });

  console.log('[sentry] Đã bật giám sát lỗi');
} else {
  console.warn('[sentry] Thiếu SENTRY_DSN — lỗi sẽ KHÔNG được báo về Sentry');
}
