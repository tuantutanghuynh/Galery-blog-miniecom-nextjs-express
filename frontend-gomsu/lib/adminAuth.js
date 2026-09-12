'use client';

const ACCESS_KEY = 'miniecom_access_token';
const REFRESH_KEY = 'miniecom_refresh_token';

export function setTokens(accessToken, refreshToken) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// Gom mọi lần refresh xảy ra ĐỒNG THỜI thành 1 request duy nhất tới /auth/refresh.
// Nếu không gom, 2 request cùng 401 cùng lúc sẽ cùng dùng 1 refresh token cũ để refresh:
// request đầu thành công (token cũ bị revoke do cơ chế rotation), request thứ 2 dùng lại
// đúng token vừa bị revoke đó -> cơ chế reuse-detection (Buổi 6) hiểu nhầm là bị đánh cắp
// token -> logout oan toàn bộ session. Biến module-scope `refreshPromise` đảm bảo mọi lời
// gọi authFetch() đang chờ refresh đều dùng chung 1 Promise, không bắn nhiều request.
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('Not authenticated');

      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!refreshRes.ok) throw new Error('Session expired');

      const { data } = await refreshRes.json();
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null; // giải phóng cho lần 401 tiếp theo (không liên quan lần này)
    });
  }
  return refreshPromise;
}

export async function authFetch(path, options = {}) {
  const token = getToken();
  
  const isFormData = typeof window !== 'undefined' && options.body instanceof FormData;
  const customHeaders = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  if (!isFormData && !customHeaders['Content-Type']) {
    customHeaders['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: customHeaders,
  });

  // Xử lý tự động Refresh Token nếu Access Token hết hạn (Lỗi 401)
  if (res.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      
      const retryHeaders = {
        ...customHeaders,
        Authorization: `Bearer ${newAccessToken}`,
      };

      // Retry (gọi lại) API ban đầu vừa bị lỗi với Access Token mới
      res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        ...options,
        headers: retryHeaders,
      });
    } catch (err) {
      // Refresh thất bại (token hỏng/hết hạn/không có) -> xoá token & đuổi về login
      clearTokens();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/admin/login';
      throw err;
    }
  }

  return res.json();
}
