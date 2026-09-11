'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '../../../../lib/adminAuth';
import { BRAND_CATEGORY_SLUG } from '../../../../lib/brand';

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const json = await authFetch('/uploads/image', {
    method: 'POST',
    body: formData,
  });
  return json.data.url;
}

export default function NewPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', coverImageUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (err) {
      setErrorMsg('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // Gán categoryId đúng thương hiệu — bắt buộc vì backend dùng chung DB cho cả 2 clone
      // (xem lib/brand.js), thiếu bước này bài viết sẽ không hiện trên trang public.
      const { data: categories } = await authFetch('/categories');
      const category = categories.find((c) => c.slug === BRAND_CATEGORY_SLUG);
      if (!category) throw new Error('CATEGORY_NOT_FOUND');

      await authFetch('/blog', { method: 'POST', body: JSON.stringify({ ...form, categoryId: category.id }) });
      router.push('/admin/posts');
    } catch (err) {
      setErrorMsg('Lỗi khi lưu bài viết. Vui lòng kiểm tra lại (có thể trùng slug).');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Viết bài mới</h1>
      {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required placeholder="Tiêu đề" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          required placeholder="Slug (vd: cach-chon-hat-cho-cho)" value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          placeholder="Tóm tắt" value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input type="file" accept="image/*" onChange={handleCoverUpload} />
        {form.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${form.coverImageUrl}`}
            alt="preview"
            className="max-w-[200px] rounded"
          />
        )}
        <textarea
          required rows={12} placeholder="Nội dung (Markdown)" value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2 font-mono text-sm"
        />
        <button
          type="submit" disabled={submitting}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : 'Lưu bài viết'}
        </button>
      </form>
    </div>
  );
}
