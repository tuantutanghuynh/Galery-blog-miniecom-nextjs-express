'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('miniecom_access_token');
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
          localStorage.removeItem('miniecom_access_token');
          localStorage.removeItem('miniecom_refresh_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('miniecom_access_token');
        localStorage.removeItem('miniecom_refresh_token');
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

    localStorage.setItem('miniecom_access_token', json.data.accessToken);
    localStorage.setItem('miniecom_refresh_token', json.data.refreshToken);
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

    localStorage.setItem('miniecom_access_token', json.data.accessToken);
    localStorage.setItem('miniecom_refresh_token', json.data.refreshToken);
    setUser(json.data.user);
    return json.data;
  }

  function logout() {
    localStorage.removeItem('miniecom_access_token');
    localStorage.removeItem('miniecom_refresh_token');
    setUser(null);
    router.push('/');
  }

  return { user, isLoading, login, register, logout, isAuthenticated: !!user };
}
