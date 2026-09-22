'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, setTokens, clearTokens, refreshAccessToken } from '@/lib/adminAuth';
import type { User, AuthResponseData } from '@/types/auth';
import type { ApiResponse } from '@/types/api';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponseData>;
  register: (email: string, password: string, fullName?: string) => Promise<AuthResponseData>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// express-validator trả lỗi cụ thể trong error.details[], còn error.message chỉ là câu chung
// "Dữ liệu không hợp lệ". Ưu tiên câu cụ thể để người dùng biết mình sai ở đâu.
function readError(json: ApiResponse<unknown>, fallback: string): string {
  const err = json.error;
  if (!err) return fallback;
  return err.details?.[0]?.msg || err.message || fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchMe(token: string): Promise<ApiResponse<User>> {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json() as Promise<ApiResponse<User>>;
    }

    // Access token chỉ sống 15 phút, còn refresh token sống 7 ngày. Hết hạn access token
    // thì phải đổi lấy cái mới rồi thử lại — nếu xoá token ngay ở đây thì cứ 15 phút một
    // lần người dùng bị đăng xuất oan dù phiên vẫn còn hiệu lực.
    async function restoreSession() {
      const token = getToken();
      if (!token) return;

      try {
        let json = await fetchMe(token);
        if (!json.data) {
          const newToken = await refreshAccessToken();
          json = await fetchMe(newToken);
        }
        if (!json.data) throw new Error('Phiên đăng nhập không còn hiệu lực');
        setUser(json.data);
      } catch {
        clearTokens();
      }
    }

    restoreSession().finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<AuthResponseData> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = (await res.json()) as ApiResponse<AuthResponseData>;
    if (!json.data) throw new Error(readError(json, 'Đăng nhập thất bại'));

    setTokens(json.data.accessToken, json.data.refreshToken);
    setUser(json.data.user);
    return json.data;
  }

  async function register(email: string, password: string, fullName?: string): Promise<AuthResponseData> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, confirmPassword: password, fullName }),
    });
    const json = (await res.json()) as ApiResponse<AuthResponseData>;
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
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
