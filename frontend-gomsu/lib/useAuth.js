'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, setTokens, clearTokens, refreshAccessToken } from '@/lib/adminAuth';

const AuthContext = createContext();

// express-validator trả lỗi cụ thể trong error.details[], còn error.message chỉ là câu chung
// "Dữ liệu không hợp lệ". Ưu tiên câu cụ thể để người dùng biết mình sai ở đâu.
function readError(json, fallback) {
  const err = json.error;
  if (!err) return fallback;
  return err.details?.[0]?.msg || err.message || fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchMe(token) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    }

    // Access token chỉ sống 15 phút, còn refresh token sống 7 ngày. Hết hạn access token
    // thì phải đổi lấy cái mới rồi thử lại — nếu xoá token ngay ở đây thì cứ 15 phút một
    // lần người dùng bị đăng xuất oan dù phiên vẫn còn hiệu lực.
    async function restoreSession() {
      const token = getToken();
      if (!token) return;

      try {
        let json = await fetchMe(token);
        if (!json.data) json = await fetchMe(await refreshAccessToken());
        if (!json.data) throw new Error('Phiên đăng nhập không còn hiệu lực');
        setUser(json.data);
      } catch {
        clearTokens();
      }
    }

    restoreSession().finally(() => setIsLoading(false));
  }, []);

  async function login(email, password) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.data) throw new Error(readError(json, 'Đăng nhập thất bại'));

    setTokens(json.data.accessToken, json.data.refreshToken);
    setUser(json.data.user);
    return json.data;
  }

  async function register(email, password, fullName) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, confirmPassword: password, fullName }),
    });
    const json = await res.json();
    if (!json.data) throw new Error(readError(json, 'Đăng ký thất bại'));

    setTokens(json.data.accessToken, json.data.refreshToken);
    setUser(json.data.user);
    return json.data;
  }

  function logout() {
    clearTokens();
    setUser(null);
    router.push('/');
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
