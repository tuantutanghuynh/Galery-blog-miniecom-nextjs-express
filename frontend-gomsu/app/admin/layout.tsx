'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

const NAV_ITEMS = [
  { name: 'Yêu cầu tư vấn', path: '/admin/quote-requests' },
  { name: 'Sản phẩm', path: '/admin/products' },
  { name: 'Bài viết', path: '/admin/posts' },
  { name: 'Gallery', path: '/admin/gallery' },
  { name: 'Danh mục', path: '/admin/categories' },
  { name: 'Khách liên hệ', path: '/admin/contacts' },
  { name: 'Cài đặt', path: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.push('/auth/login');
    else if (!isAdmin) router.push('/');
  }, [user, isAdmin, isLoading, router]);

  // Chờ xác thực xong mới render UI để tránh hiện tượng "nháy" (flicker) giao diện
  if (isLoading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#111111] border-r border-[#222] flex flex-col text-white">
        <div className="px-8 py-8 border-b border-[#222]">
          <h2 className="font-serif text-2xl font-medium tracking-wide">Nghĩa Phái</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-gomsu-primary mt-2">Workspace</p>
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-4 py-3 text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-white/5 font-medium text-gomsu-primary border-l-2 border-gomsu-primary'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#222]">
          <button
            onClick={logout}
            className="w-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 text-left px-4 py-3 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto text-gray-900">{children}</main>
    </div>
  );
}
