'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, getToken } from '../../../../../lib/adminAuth';
import { BRAND_CATEGORY_SLUG } from '../../../../../lib/brand';

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const json = await authFetch('/uploads/image', { method: 'POST', body: formData });
  return json.data.url;
}

export default function EditPostPage({ params }) {
  const { id } = use(params); // Next.js 16: params là Promise ngay cả ở Client Component
  const router = useRouter();
  const [form, setForm] = useState(null); // null = đang tải dữ liệu cũ
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/admin/login');
      return;
    }
    authFetch(`/blog/admin/list?categorySlug=${BRAND_CATEGORY_SLUG}`).then((res) => {
      const post = res.data.find((p) => p.id === id);
      if (!post) {
        setErrorMsg('Không tìm thấy bài viết.');
        return;
      }
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content,
        coverImageUrl: post.coverImageUrl || '',
        status: post.status,
      });
    });
  }, [id, router]);

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
      await authFetch(`/blog/${id}`, { method: 'PATCH', body: JSON.stringify(form) });
      router.push('/admin/posts');
    } catch (err) {
      setErrorMsg('Lỗi khi cập nhật bài viết. Vui lòng kiểm tra lại (có thể trùng slug).');
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) return <p className="text-center mt-8">{errorMsg || 'Đang tải...'}</p>;

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Sửa bài viết</h1>
      {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required placeholder="Tiêu đề" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          required placeholder="Slug" value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
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
          <option value="published">Xuất bản</option>
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
        <textarea
          required rows={12} placeholder="Nội dung (Markdown)" value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2 font-mono text-sm"
        />
        <button
          type="submit" disabled={submitting}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : 'Cập nhật'}
        </button>
      </form>
    </div>
  );
}
