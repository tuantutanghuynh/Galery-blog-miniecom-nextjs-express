'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken, clearTokens } from '../../lib/adminAuth';

const NAV_ITEMS = [
  { name: 'Bài viết', path: '/admin/posts' },
  { name: 'Gallery', path: '/admin/gallery' },
  { name: 'Danh mục', path: '/admin/categories' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Nếu không phải trang login và không có token thì đuổi về login
    if (!isLoginPage && !getToken()) {
      router.push('/admin/login');
    } else {
      // Đã có token hoặc đang ở trang login thì cho phép hiển thị UI
      setIsChecking(false);
    }
  }, [isLoginPage, router]);

  function handleLogout() {
    clearTokens();
    router.push('/admin/login');
  }

  // Chờ kiểm tra token xong mới render UI để tránh hiện tượng "nháy" (flicker) giao diện
  if (isChecking && !isLoginPage) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải...</div>;
  }

  if (isLoginPage) return children; // không bọc sidebar cho trang login

  return (
    <div className="min-h-screen flex font-sans text-gray-900">
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 font-bold text-lg border-b border-gray-200">
          Nghĩa Phái Admin
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`block px-6 py-3 text-sm transition-colors ${
                pathname.startsWith(item.path)
                  ? 'bg-gray-100 font-semibold text-black border-r-2 border-black'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout} 
            className="w-full text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 text-left px-2 py-2 rounded transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">{children}</main>
    </div>
  );
}
