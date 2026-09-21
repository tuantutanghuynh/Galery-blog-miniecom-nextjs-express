'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (attemptedSubmit && !error) {
      setAttemptedSubmit(false);
    }
  }, [error, attemptedSubmit]);

  async function handleSubmit(e) {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  if (user) return null;

  return (
    <div className="min-h-screen bg-gomsu-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h1 className="font-serif text-3xl text-gray-900 mb-2">Đăng nhập</h1>
          <p className="text-sm text-gray-500 mb-8">Nhập email và mật khẩu để tiếp tục mua hàng.</p>

          {attemptedSubmit && error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 text-sm rounded">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">
                Mật khẩu <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-3 rounded text-sm uppercase tracking-widest font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">Chưa có tài khoản?</p>
            <Link href="/auth/register" className="text-sm text-gomsu-primary hover:underline font-medium">
              Đăng ký tại đây
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/auth/request-password-reset" className="text-xs text-gray-500 hover:text-gray-700">
              Quên mật khẩu?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
