// Chuyển chuỗi tiếng Việt có dấu thành slug URL hợp lệ
export function slugify(str) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu (huyền, sắc, hỏi...)
    .replace(/đ/g, 'd').replace(/Đ/g, 'D') // đ/Đ không phải ký tự có dấu thường, xử lý riêng
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // bỏ ký tự đặc biệt còn sót
    .trim()
    .replace(/[\s_-]+/g, '-') // khoảng trắng/gạch dưới liên tiếp -> 1 dấu gạch ngang
    .replace(/^-+|-+$/g, ''); // bỏ gạch ngang thừa ở đầu/cuối
}
