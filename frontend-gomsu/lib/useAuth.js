'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Kiểm tra token có hợp lệ không bằng cách gọi GET /auth/me
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setUser(d.data);
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email, password) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.data) throw new Error(json.error?.message || 'Login failed');

    localStorage.setItem('accessToken', json.data.accessToken);
    localStorage.setItem('refreshToken', json.data.refreshToken);
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
    if (!json.data) throw new Error(json.error?.message || 'Register failed');

    localStorage.setItem('accessToken', json.data.accessToken);
    localStorage.setItem('refreshToken', json.data.refreshToken);
    setUser(json.data.user);
    return json.data;
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/');
  }

  return { user, isLoading, login, register, logout, isAuthenticated: !!user };
}
