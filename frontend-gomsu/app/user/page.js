'use client';

import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UserDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen">
      <h1 className="text-3xl font-serif text-gomsu-primary mb-8">Xin chào, {user.fullName || user.email}</h1>
      
      <div className="bg-[#1a1a1a] border border-[#333] p-8 space-y-6">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-2">Thông tin tài khoản</h2>
          <p className="text-lg">{user.fullName}</p>
          <p className="text-gray-500">{user.email}</p>
          <p className="text-xs text-gomsu-primary uppercase tracking-widest mt-2 bg-white/5 inline-block px-2 py-1">
            Vai trò: {user.role}
          </p>
        </div>

        <div className="pt-6 border-t border-[#333]">
          <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-4">Quản lý</h2>
          <p className="text-gray-500 text-sm mb-6">Các tính năng Lịch sử đơn hàng, Đổi mật khẩu sẽ được cập nhật sớm.</p>
          <button 
            onClick={logout}
            className="border border-red-900/50 text-red-500 hover:bg-red-950/30 px-6 py-3 uppercase tracking-widest text-xs transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
