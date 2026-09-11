'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, getToken } from '../../../../lib/adminAuth';

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const json = await res.json();
  return json.data.url;
}

export default function NewPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', coverImageUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadImage(file);
    setForm((f) => ({ ...f, coverImageUrl: url }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await authFetch('/blog', { method: 'POST', body: JSON.stringify(form) });
    setSubmitting(false);
    router.push('/admin/posts');
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Viết bài mới</h1>
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
          {submitting ? 'Đang lưu...' : 'Lưu nháp'}
        </button>
      </form>
    </div>
  );
}
