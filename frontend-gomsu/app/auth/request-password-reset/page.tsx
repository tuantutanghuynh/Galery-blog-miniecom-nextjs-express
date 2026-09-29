'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiFetch('/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  }

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

          {sent ? (
            <>
              <h1 className="font-serif text-3xl text-gray-900 mb-2">Đã gửi yêu cầu</h1>
              {/* Luôn báo cùng một câu dù email có tồn tại hay không: nếu phân biệt hai trường
                  hợp thì trang này thành công cụ để dò xem ai đã có tài khoản trên site. */}
              <p className="text-sm text-gray-600 leading-relaxed">
                Nếu email <strong className="text-gray-900">{email}</strong> có tài khoản, chúng tôi đã tạo
                một liên kết đặt lại mật khẩu. Liên kết chỉ có hiệu lực trong 1 giờ.
              </p>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                Chưa nhận được thư? Tính năng gửi email đang được hoàn thiện — trong lúc chờ, vui lòng
                liên hệ trực tiếp với chúng tôi để được hỗ trợ đặt lại mật khẩu.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-block text-sm text-gomsu-primary hover:underline font-medium"
              >
                Tới trang liên hệ
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-gray-900 mb-2">Quên mật khẩu</h1>
              <p className="text-sm text-gray-500 mb-8">
                Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
                  {error}
                </div>
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-3 rounded text-sm uppercase tracking-widest font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Gửi liên kết'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
