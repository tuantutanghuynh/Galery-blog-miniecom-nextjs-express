'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken, getRefreshToken, clearTokens } from '../../lib/adminAuth';

const NAV_ITEMS = [
  { name: 'Bài viết', path: '/admin/posts' },
  { name: 'Gallery', path: '/admin/gallery' },
  { name: 'Danh mục', path: '/admin/categories' },
  { name: 'Khách liên hệ', path: '/admin/contacts' },
  { name: 'Cài đặt', path: '/admin/settings' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const hasToken = getToken();
    
    if (!hasToken && !isLoginPage) {
      // Chưa đăng nhập mà ráng vô admin -> Đuổi về login
      router.push('/admin/login');
    } else if (hasToken && isLoginPage) {
      // Đã đăng nhập rồi mà lỡ vô nhầm trang login -> Bê vô admin luôn
      router.push('/admin/posts');
    } else {
      // Hợp lệ (Đã login và ở admin, hoặc chưa login và ở trang login)
      setIsChecking(false);
    }
  }, [isLoginPage, router]);

  async function handleLogout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch (err) {
        console.error('Lỗi khi gọi API logout', err);
      }
    }
    clearTokens();
    router.push('/admin/login');
  }

  // Chờ kiểm tra token xong mới render UI để tránh hiện tượng "nháy" (flicker) giao diện
  if (isChecking && !isLoginPage) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải...</div>;
  }

  if (isLoginPage) return children; // không bọc sidebar cho trang login

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
            onClick={handleLogout} 
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
