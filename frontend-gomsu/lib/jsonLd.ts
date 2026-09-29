// Chuyển dữ liệu có cấu trúc thành chuỗi để nhúng vào thẻ script application/ld+json.
//
// Không dùng thẳng JSON.stringify cho việc này: nó KHÔNG thoát chuỗi đóng thẻ script. Một
// tên sản phẩm hay tiêu đề bài viết chứa thẻ đóng đó sẽ kết thúc sớm đoạn script, và phần
// còn lại chạy như mã thường — tức là ô nhập liệu của admin cũng thành đường chèn mã.
//
// Cách chặn là escape dấu nhỏ hơn thành <. JSON hiểu < đúng bằng dấu nhỏ hơn nên
// dữ liệu giữ nguyên ý nghĩa với công cụ tìm kiếm, còn trình duyệt thì không còn thẻ đóng
// nào để bám vào.
//
// U+2028 và U+2029 cũng phải escape: chúng hợp lệ trong JSON nhưng JavaScript lại coi là dấu
// xuống dòng, đủ để làm hỏng cú pháp đoạn script. Hai ký tự này được tạo bằng RegExp từ
// chuỗi thay vì viết thẳng, vì viết thẳng thì chính file nguồn này sẽ bị chúng bẻ gãy.
const LINE_SEPARATORS = new RegExp('[\\u2028\\u2029]', 'g');

export function toJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(LINE_SEPARATORS, (char) => `\\u${char.charCodeAt(0).toString(16)}`);
}
