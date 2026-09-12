'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '../../../../lib/adminAuth';
import { BRAND_CATEGORY_SLUG } from '../../../../lib/brand';
import RichTextEditor from '../../../../components/admin/RichTextEditor';
import { slugify } from '../../../../lib/slugify';


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
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', status: 'published' });
  const [submitting, setSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
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
          onChange={(e) => {
            const title = e.target.value;
            setForm((f) => ({
              ...f,
              title,
              slug: slugTouched ? f.slug : slugify(title),
            }));
          }}
          className="border border-gray-300 rounded px-3 py-2"
        />

        <input
          required placeholder="Slug (vd: cach-chon-gom-theo-phong-thuy)" value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((f) => ({ ...f, slug: e.target.value }));
          }}
          className="border border-gray-300 rounded px-3 py-2"
        />

        <input
          placeholder="Tóm tắt" value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="published">Xuất bản ngay</option>
          <option value="draft">Lưu nháp</option>
        </select>
        <input type="file" accept="image/*" onChange={handleCoverUpload} />
        {form.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${form.coverImageUrl}`}
            alt="preview"
            className="max-w-[200px] rounded"
          />
        )}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Nội dung bài viết</label>
          <RichTextEditor
            value={form.content}
            onChange={(content) => setForm({ ...form, content })}
          />
        </div>
        <button
          type="submit" disabled={submitting}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50 mt-4"
        >
          {submitting ? 'Đang lưu...' : 'Lưu bài viết'}
        </button>
      </form>
    </div>
  );
}
