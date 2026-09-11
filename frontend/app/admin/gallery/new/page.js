'use client';
import { useState } from 'react';
import { authFetch, getToken } from '../../../../lib/adminAuth';

export default function NewGalleryItemPage() {
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const json = await res.json();
    setImageUrl(json.data.url);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await authFetch('/gallery', { method: 'POST', body: JSON.stringify({ title, altText, imageUrl }) });
    // Điều hướng "cứng" (hard navigation) thay vì router.push(): /gallery là Server
    // Component fetch qua backend Express (ngoài Next.js), router.push() dùng Router
    // Cache phía client nên có thể không thấy dữ liệu vừa tạo. window.location.href ép
    // trình duyệt load lại trang đích hoàn toàn mới, luôn thấy dữ liệu mới nhất.
    window.location.href = '/gallery';
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Thêm ảnh Gallery</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="file" accept="image/*" required onChange={handleUpload} />
        <input
          placeholder="Tiêu đề (tuỳ chọn)" value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          required placeholder="Mô tả ảnh (alt text — bắt buộc cho SEO)" value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit" disabled={!imageUrl}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          Lưu
        </button>
      </form>
    </div>
  );
}
