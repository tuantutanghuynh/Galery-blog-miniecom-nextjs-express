import { BRAND_CATEGORY_SLUG } from '@/lib/brand';
import type { ApiResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiFetchError extends Error {
  status?: number;
  code?: string;
}

// Gọi API backend bằng fetch gốc (không dùng axios) để tận dụng cơ chế cache/revalidate
// tích hợp sẵn của Next.js (`next: { revalidate, tags }`) — axios không tham gia được
// cơ chế này vì nó không chạy qua hàm fetch mà Next.js đã "độ" lại.
export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  // Gắn ở một chỗ thay vì rắc ở từng lời gọi: route /quote-requests bắt buộc có header này,
  // thiếu là 400. Route khác nhận thừa cũng không sao.
  const headers = new Headers(options.headers);
  if (!headers.has('X-Brand-Slug')) {
    headers.set('X-Brand-Slug', BRAND_CATEGORY_SLUG);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Không phải phản hồi nào cũng là JSON: rate limiter trả chữ "Too many requests" dạng
  // text, proxy hỏng trả trang HTML 502. Gọi thẳng res.json() sẽ ném lỗi cú pháp khó hiểu
  // che mất nguyên nhân thật, nên bắt ở đây và báo theo mã HTTP.
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    const error: ApiFetchError = new Error(
      res.status === 429
        ? 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.'
        : `Máy chủ trả về phản hồi không hợp lệ (${res.status})`
    );
    error.status = res.status;
    throw error;
  }

  if (!res.ok) {
    const error: ApiFetchError = new Error(json.error?.message || 'Yêu cầu thất bại');
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }

  return json; // { data, meta, error: null }
}
