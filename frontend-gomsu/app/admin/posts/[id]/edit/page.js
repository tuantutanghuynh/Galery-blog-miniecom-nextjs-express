'use client';
import { getImageUrl } from '@/lib/utils';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/adminAuth';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';
import RichTextEditor from '@/components/admin/RichTextEditor';

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
        publishedAt: post.publishedAt || null,
      });
    });
  }, [id]);

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
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-3xl font-serif text-gray-900 tracking-wide mb-8">Sửa bài viết</h1>
      {errorMsg && <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded">{errorMsg}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Tiêu đề bài viết</label>
          <input
            required placeholder="Nhập tiêu đề..." value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors font-serif text-lg"
          />
        </div>

        {/* Slug & Excerpt */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Đường dẫn (Slug)</label>
            <input
              required placeholder="vd: cach-chon-gom..." value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Tóm tắt ngắn</label>
            <input
              placeholder="Nhập tóm tắt..." value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
            />
          </div>
        </div>

        {/* Status & Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-gray-200 bg-gray-50 rounded">
          <div className="flex flex-col gap-2">
            <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
            >
              <option value="published">Xuất bản</option>
              <option value="draft">Lưu nháp</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Hẹn giờ đăng</label>
            <input
              type="datetime-local"
              value={form.publishedAt ? new Date(new Date(form.publishedAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
              onChange={(e) => setForm({ ...form, publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
              disabled={form.status !== 'published'}
            />
          </div>
        </div>

        {/* Cover Image */}
        <div className="flex flex-col gap-2">
          <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Ảnh đại diện (Thumbnail)</label>
          <div className="flex items-center gap-6">
            {form.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(form.coverImageUrl)}
                alt="preview"
                className="w-32 h-32 object-cover border border-gray-200 rounded"
              />
            )}
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:transition-colors file:cursor-pointer" />
          </div>
        </div>

        {/* Content Editor */}
        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Nội dung bài viết</label>
          <div className="admin-light-editor-wrapper">
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm((f) => ({ ...f, content }))}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button
            type="submit" disabled={submitting}
            className="bg-black text-white px-8 py-3 text-sm uppercase tracking-widest font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang xử lý...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </div>
  );
}
