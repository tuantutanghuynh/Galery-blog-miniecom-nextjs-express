'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '../../../lib/adminAuth';
import { BRAND_CATEGORY_SLUG } from '../../../lib/brand';

export default function AdminGalleryPage() {
  const [items, setItems] = useState([]);

  function loadItems() {
    authFetch(`/gallery?categorySlug=${BRAND_CATEGORY_SLUG}`).then((res) => setItems(res.data || []));
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleDelete(id) {
    if (!confirm('Xoá ảnh này khỏi Gallery?')) return;
    await authFetch(`/gallery/${id}`, { method: 'DELETE' });
    loadItems(); // tải lại danh sách sau khi xoá thành công
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      {/* Header đồng bộ với trang Bài viết */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-gray-900 tracking-wide">Quản lý Gallery</h1>
        <Link href="/admin/gallery/new" className="bg-black text-white px-6 py-2.5 text-sm uppercase tracking-wider font-medium hover:bg-gray-800 transition-colors rounded">
          + Thêm ảnh mới
        </Link>
      </div>

      <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-lg shadow-sm">
        {/* Lưới ảnh chuyên nghiệp */}
        <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <li key={item.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              {/* Ảnh - Không bị bóp méo nhờ object-cover */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${item.imageUrl}`}
                alt={item.altText}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Lớp phủ đen mờ khi rê chuột (Hover Overlay) */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                {/* Tiêu đề */}
                <div className="text-white text-sm font-medium line-clamp-3">
                  {item.altText || 'Không có tiêu đề'}
                </div>
                
                {/* Nút hành động */}
                <div className="flex justify-end gap-3 mt-4">
                  <Link 
                    href={`/admin/gallery/${item.id}/edit`}
                    className="bg-white/90 text-black px-4 py-2 text-xs font-bold uppercase tracking-widest rounded hover:bg-white transition-colors backdrop-blur-sm shadow-sm"
                  >
                    Sửa
                  </Link>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="bg-red-600/90 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-600 transition-colors backdrop-blur-sm shadow-sm"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Trạng thái trống */}
        {items.length === 0 && (
          <div className="py-20 text-center text-gray-500 font-light border-2 border-dashed border-gray-200 rounded-lg">
            Chưa có hình ảnh nào trong Gallery.
          </div>
        )}
      </div>
    </div>
  );
}
