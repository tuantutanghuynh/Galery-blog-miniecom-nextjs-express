const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Gọi API backend bằng fetch gốc (không dùng axios) để tận dụng cơ chế cache/revalidate
// tích hợp sẵn của Next.js (`next: { revalidate, tags }`) — axios không tham gia được
// cơ chế này vì nó không chạy qua hàm fetch mà Next.js đã "độ" lại.
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  const json = await res.json();

  if (!res.ok) {
    const error = new Error(json.error?.message || 'Yêu cầu thất bại');
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }

  return json; // { data, meta, error: null }
}
