'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải ít nhất 8 ký tự');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password, fullName);
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
          <h1 className="font-serif text-3xl text-gray-900 mb-2">Đăng ký</h1>
          <p className="text-sm text-gray-500 mb-8">Tạo tài khoản để mua sắm tại Nghĩa Phái.</p>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 text-sm rounded">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">Họ và tên</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">Mật khẩu (ít nhất 8 ký tự)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-3 rounded text-sm uppercase tracking-widest font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">Đã có tài khoản?</p>
            <Link href="/auth/login" className="text-sm text-gomsu-primary hover:underline font-medium">
              Đăng nhập tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
