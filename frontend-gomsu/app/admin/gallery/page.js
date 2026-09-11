'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, getToken } from '../../../lib/adminAuth';
import { BRAND_CATEGORY_SLUG } from '../../../lib/brand';

export default function AdminGalleryPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = '/admin/login';
      return;
    }
    authFetch(`/gallery?categorySlug=${BRAND_CATEGORY_SLUG}`).then((res) => setItems(res.data || []));
  }, []);

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
            <p className="truncate mt-1">{item.altText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
