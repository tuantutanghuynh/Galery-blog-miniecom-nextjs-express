'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

function isValidRedirect(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const validRedirect = isValidRedirect(rawRedirect) ? rawRedirect : null;

  const { user, login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (validRedirect) {
        router.push(validRedirect);
      } else if (user.role === 'admin') {
        router.push('/admin/posts');
      } else {
        router.push('/');
      }
    }
  }, [user, isLoading, router, validRedirect]);

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
      const result = await login(email, password);
      if (validRedirect) {
        router.push(validRedirect);
      } else if (result.user.role === 'admin') {
        router.push('/admin/posts');
      } else {
        router.push('/');
      }
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
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black transition-colors mb-6 uppercase tracking-widest">
            <span>&larr;</span> Về trang chủ
          </Link>
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none text-xs"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gomsu-background">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
