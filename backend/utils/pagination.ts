// Ép kiểu tham số phân trang cho mọi endpoint danh sách.
//
// Thay cho phép tính `Math.min(Number(pageSize) || d, max)` từng lặp lại ở 9 controller. Cách cũ
// lọt số âm, số lẻ và NaN: `pageSize=-2` cho ra take âm (Prisma đảo chiều kết quả), `page=abc` làm
// meta trả `page: null`. Chọn tự sửa về giá trị hợp lệ thay vì trả 400, để link cũ hay bot gửi
// tham số lạ vẫn nhận trang đầu như trước.

interface PaginationQuery {
  page?: unknown;
  pageSize?: unknown;
}

interface PaginationOptions {
  defaultSize: number;
  maxSize: number;
}

export interface Pagination {
  page: number;
  take: number;
  skip: number;
}

// Số nguyên dương từ chuỗi query, hoặc null nếu không dùng được. Mảng (`?page=1&page=2`) bị coi
// là không hợp lệ thay vì lấy phần tử đầu, vì Express trả mảng khi tham số lặp lại.
function toPositiveInt(raw: unknown): number | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export function parsePagination(query: PaginationQuery, opts: PaginationOptions): Pagination {
  const page = toPositiveInt(query.page) ?? 1;
  const take = Math.min(toPositiveInt(query.pageSize) ?? opts.defaultSize, opts.maxSize);
  return { page, take, skip: (page - 1) * take };
}
