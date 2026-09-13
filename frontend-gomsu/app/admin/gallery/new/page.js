'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '../../../../lib/adminAuth';

export default function NewGalleryItemPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Load danh mục để chọn
    authFetch('/categories').then((res) => {
      if (res.data) {
        const brand = res.data.find(c => c.slug === process.env.NEXT_PUBLIC_BRAND_CATEGORY_SLUG);
        if (brand) {
          const filtered = res.data.filter(c => c.id === brand.id || c.parentId === brand.id);
          setCategories(filtered);
        } else {
          setCategories(res.data);
        }
      }
    });
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const json = await authFetch('/uploads/image', {
        method: 'POST',
        body: formData,
      });
      setImageUrl(json.data.url);
    } catch (err) {
      setErrorMsg('Lỗi tải ảnh lên.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!categoryId) {
      setErrorMsg('Vui lòng chọn danh mục.');
      return;
    }
    
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await authFetch('/gallery', {
        method: 'POST',
        body: JSON.stringify({ title, altText, imageUrl, categoryId }),
      });
      router.push('/admin/gallery');
    } catch (err) {
      setErrorMsg('Lỗi lưu ảnh Gallery.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-serif text-gray-900 tracking-wide mb-8">Thêm ảnh Gallery</h1>
      
      {errorMsg && <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded">{errorMsg}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Upload Ảnh */}
        <div className="flex flex-col gap-2 p-6 border border-gray-200 bg-gray-50 rounded">
          <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Tải ảnh lên</label>
          <div className="flex items-center gap-6 mt-2">
            <input 
              type="file" accept="image/*" required onChange={handleUpload} 
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:transition-colors file:cursor-pointer"
            />
            {uploading && <span className="text-sm text-gray-500 font-medium animate-pulse">Đang xử lý ảnh...</span>}
          </div>
          
          {/* Preview */}
          {imageUrl && (
            <div className="mt-4">
              <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">Bản xem trước</label>
              <div className="w-48 h-48 bg-white border border-gray-200 rounded p-1 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${imageUrl}`} alt="preview" className="w-full h-full object-cover rounded-sm" />
              </div>
            </div>
          )}
        </div>

        {/* Thông tin metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Tiêu đề ảnh</label>
            <input
              placeholder="VD: Bình gốm men hỏa biến..." value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Danh mục</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm uppercase tracking-widest text-gray-500 font-medium">Thẻ Alt (Tối ưu SEO)</label>
          <input
            required placeholder="Mô tả chính xác nội dung trong ảnh (dành cho Google Bot và người khiếm thị)" value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 px-4 py-3 focus:outline-none focus:border-black rounded transition-colors text-sm"
          />
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button
            type="submit" disabled={!imageUrl || submitting || uploading}
            className="bg-black text-white px-8 py-3 text-sm uppercase tracking-widest font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang xử lý...' : 'Thêm vào Gallery'}
          </button>
        </div>
      </form>
    </div>
  );
}
