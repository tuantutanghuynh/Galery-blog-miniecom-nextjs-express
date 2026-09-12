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
    if (!confirm('Xoá ảnh này?')) return;
    await authFetch(`/gallery/${id}`, { method: 'DELETE' });
    loadItems(); // tải lại danh sách sau khi xoá thành công
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Gallery</h1>
      <Link href="/admin/gallery/new" className="text-blue-600 hover:underline">+ Thêm ảnh</Link>
      <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-gray-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${item.imageUrl}`}
              alt={item.altText}
              className="rounded w-full h-24 object-cover"
            />
            <div className="flex items-center justify-between mt-1 gap-2">
              <p className="truncate">{item.altText}</p>
              <button onClick={() => handleDelete(item.id)} className="text-red-600 shrink-0">✕</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
