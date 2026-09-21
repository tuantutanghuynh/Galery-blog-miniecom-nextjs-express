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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Password validation state
  const [pwdFocus, setPwdFocus] = useState(false);
  const rules = [
    { id: 'length', label: 'Ít nhất 8 ký tự', isValid: password.length >= 8 },
    { id: 'upper', label: 'Ít nhất 1 chữ hoa', isValid: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Ít nhất 1 chữ thường', isValid: /[a-z]/.test(password) },
    { id: 'num', label: 'Ít nhất 1 chữ số', isValid: /[0-9]/.test(password) },
    { id: 'spec', label: 'Ít nhất 1 ký tự đặc biệt', isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const isPasswordValid = rules.every(r => r.isValid);

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

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (!isPasswordValid) {
      setError('Mật khẩu chưa đạt yêu cầu bảo mật');
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

          {attemptedSubmit && error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 text-sm rounded">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">
                Họ và tên <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
              />
            </div>

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
                onFocus={() => setPwdFocus(true)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
              />
              {(pwdFocus || password.length > 0) && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Yêu cầu mật khẩu:</p>
                  <ul className="space-y-1.5">
                    {rules.map((rule) => (
                      <li key={rule.id} className={`text-xs flex items-center gap-2 ${rule.isValid ? 'text-green-600' : 'text-gray-500'}`}>
                        {rule.isValid ? '✓' : '○'} {rule.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">
                Xác nhận mật khẩu <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
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
