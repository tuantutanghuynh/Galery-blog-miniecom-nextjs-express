'use client';
import React, { useState, useEffect } from 'react';
import { authFetch, clearTokens } from '@/lib/adminAuth';
import { useRouter } from 'next/navigation';
import { ApiResponse } from '@/types/api';

interface SpecsState {
  [key: string]: string;
  product_spec_clay: string;
  product_spec_glaze: string;
  product_spec_safety: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Thông số chung của xưởng, hiện trên bảng thông số của MỌI trang sản phẩm.
  const [specs, setSpecs] = useState<SpecsState>({
    product_spec_clay: '',
    product_spec_glaze: '',
    product_spec_safety: ''
  });
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [specsMsg, setSpecsMsg] = useState<string | null>(null);

  useEffect(() => {
    authFetch<Record<string, string>>('/settings?keys=product_spec_clay,product_spec_glaze,product_spec_safety')
      .then((res) => setSpecs((prev) => ({ ...prev, ...(res.data || {}) })))
      .catch(() => {});
  }, []);

  async function saveSpecs(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingSpecs(true);
    setSpecsMsg(null);
    try {
      await authFetch('/settings', { method: 'PATCH', body: JSON.stringify({ settings: specs }) });
      setSpecsMsg('Đã lưu thông số chung.');
      setTimeout(() => setSpecsMsg(null), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu';
      setSpecsMsg('Lỗi khi lưu: ' + msg);
    } finally {
      setSavingSpecs(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      type ChangePasswordResult = {
        status?: string;
        message?: string;
        errors?: Array<{ msg: string }>;
      };
      const res = await authFetch<ChangePasswordResult>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      
      if (res.error) {
        let msg = res.error.message;
        if (res.error.details && res.error.details.length > 0) {
          msg = res.error.details.map((d) => d.msg || String(d)).join(', ');
        }
        setErrorMsg(msg || 'Lỗi đổi mật khẩu.');
      } else if (res.data?.status === 'error') {
        let msg = res.data.message;
        if (res.data.errors && res.data.errors.length > 0) {
          msg = res.data.errors.map((err) => err.msg).join(', ');
        }
        setErrorMsg(msg || 'Lỗi đổi mật khẩu.');
      } else {
        setMessage('Đổi mật khẩu thành công. Đang chuyển hướng về trang đăng nhập...');
        setTimeout(() => {
          clearTokens();
          router.push('/admin/login');
        }, 2000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-serif text-gray-900 tracking-wide mb-8">Cài đặt</h1>

      {message && <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-800 rounded">{message}</div>}
      {errorMsg && <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded">{errorMsg}</div>}

      <div className="bg-white border border-gray-200 p-8 rounded shadow-sm mb-8">
        <h2 className="text-lg font-serif text-gray-900 mb-2 border-b border-gray-100 pb-2">Thông số chung của sản phẩm</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Ba dòng này hiện ở bảng thông số của <strong>mọi</strong> trang sản phẩm. Chỉ điền
          những gì đúng với toàn bộ hàng của bạn — khách đọc đây để quyết định mua, nhất là
          dòng về độ an toàn. <strong>Để trống thì dòng đó không hiện ra.</strong>
        </p>

        {specsMsg && <div className="mb-5 p-3 bg-gray-100 border text-gray-800 rounded text-sm">{specsMsg}</div>}

        <form onSubmit={saveSpecs} className="flex flex-col gap-5">
          {[
            { key: 'product_spec_clay', label: 'Chất liệu đất', hint: 'VD: Đất sét cao lanh Bát Tràng' },
            { key: 'product_spec_glaze', label: 'Chất liệu men', hint: 'VD: Men gia truyền nung hỏa biến' },
            { key: 'product_spec_safety', label: 'Quy chuẩn độc tố', hint: 'Chỉ điền nếu bạn có kiểm định thật' },
          ].map((f) => (
            <div key={f.key} className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-medium">{f.label}</label>
              <input
                type="text"
                value={specs[f.key] || ''}
                onChange={(e) => setSpecs({ ...specs, [f.key]: e.target.value })}
                placeholder={f.hint}
                className="bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
              />
            </div>
          ))}

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={savingSpecs}
              className="bg-black text-white px-8 py-3 text-sm uppercase tracking-widest font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {savingSpecs ? 'Đang lưu...' : 'Lưu thông số'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 p-8 rounded shadow-sm">
        <h2 className="text-lg font-serif text-gray-900 mb-6 border-b border-gray-100 pb-2">Đổi mật khẩu</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-medium">
              Mật khẩu hiện tại<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-medium">
              Mật khẩu mới<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
              placeholder="Ít nhất 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-medium">
              Nhập lại mật khẩu mới<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting || message !== null}
              className="bg-black text-white px-8 py-3 text-sm uppercase tracking-widest font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
