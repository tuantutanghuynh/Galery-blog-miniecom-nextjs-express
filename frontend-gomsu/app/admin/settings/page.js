'use client';
import { useState } from 'react';
import { authFetch, clearTokens } from '@/lib/adminAuth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      
      if (res.status === 'error') {
        // Backend throw errors
        let msg = res.message;
        if (res.errors && res.errors.length > 0) {
           msg = res.errors.map(err => err.msg).join(', ');
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
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-serif text-gray-900 tracking-wide mb-8">Cài đặt tài khoản</h1>

      {message && <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-800 rounded">{message}</div>}
      {errorMsg && <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded">{errorMsg}</div>}

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
