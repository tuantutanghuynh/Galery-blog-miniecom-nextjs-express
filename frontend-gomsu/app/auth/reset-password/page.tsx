'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';

// Đúng các quy tắc mà route /auth/reset-password ở backend đang kiểm. Hiển thị ngay dưới ô
// nhập để người dùng biết trước, thay vì bấm gửi rồi mới nhận lỗi.
const RULES: { test: (v: string) => boolean; label: string }[] = [
  { test: (v) => v.length >= 8, label: 'Ít nhất 8 ký tự' },
  { test: (v) => /[A-Z]/.test(v), label: 'Một chữ hoa' },
  { test: (v) => /[a-z]/.test(v), label: 'Một chữ thường' },
  { test: (v) => /[0-9]/.test(v), label: 'Một chữ số' },
  { test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v), label: 'Một ký tự đặc biệt' },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const allRulesPass = RULES.every((r) => r.test(password));
  const matches = password.length > 0 && password === confirm;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!matches) {
      setError('Hai ô mật khẩu chưa khớp nhau.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });
      setDone(true);
      // Chờ một nhịp để người dùng kịp đọc thông báo rồi mới chuyển trang.
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Vào thẳng đường dẫn mà không có token thì không có gì để làm — nói rõ thay vì hiện một
  // biểu mẫu chắc chắn sẽ lỗi khi bấm gửi.
  if (!token || !email) {
    return (
      <>
        <h1 className="font-serif text-3xl text-gray-900 mb-2">Liên kết không hợp lệ</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Đường dẫn này thiếu thông tin xác thực. Vui lòng mở lại liên kết đặt lại mật khẩu được
          gửi cho bạn, hoặc yêu cầu một liên kết mới.
        </p>
        <Link
          href="/auth/request-password-reset"
          className="mt-6 inline-block text-sm text-gomsu-primary hover:underline font-medium"
        >
          Yêu cầu liên kết mới
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="font-serif text-3xl text-gray-900 mb-2">Đổi mật khẩu thành công</h1>
        <p className="text-sm text-gray-600">Đang chuyển bạn về trang đăng nhập...</p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-serif text-3xl text-gray-900 mb-2">Đặt mật khẩu mới</h1>
      <p className="text-sm text-gray-500 mb-8">
        Cho tài khoản <strong className="text-gray-900">{email}</strong>
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 text-sm rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">
            Mật khẩu mới <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
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

          <ul className="mt-3 space-y-1">
            {RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={`text-xs flex items-center gap-2 ${ok ? 'text-green-700' : 'text-gray-500'}`}
                >
                  <span aria-hidden="true">{ok ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2">
            Nhập lại mật khẩu <span className="text-red-600">*</span>
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
          />
          {confirm.length > 0 && !matches && (
            <p className="mt-2 text-xs text-red-600">Hai ô mật khẩu chưa khớp nhau.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !allRulesPass || !matches}
          className="w-full bg-black text-white py-3 rounded text-sm uppercase tracking-widest font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gomsu-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black transition-colors mb-6 uppercase tracking-widest"
          >
            <span>&larr;</span> Về trang đăng nhập
          </Link>
          {/* useSearchParams cần Suspense bao ngoài, nếu không phần cây Client Component phía
              trên nó sẽ bị loại khỏi prerender — theo tài liệu Next.js 16. */}
          <Suspense fallback={<p className="text-sm text-gray-500">Đang tải...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
