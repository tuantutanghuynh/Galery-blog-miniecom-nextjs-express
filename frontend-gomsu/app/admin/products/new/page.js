'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/adminAuth';
import { getImageUrl } from '@/lib/utils';
import { slugify } from '@/lib/slugify';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';

const emptyVariant = () => ({ label: '', sku: '', price: '', stockQuantity: '' });

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('draft');
  const [categories, setCategories] = useState([]);

  const [variants, setVariants] = useState([emptyVariant()]);
  const [images, setImages] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Chỉ lấy danh mục thuộc thương hiệu này (gốc + các con trực tiếp), nếu không admin gốm sứ
  // có thể vô tình xếp bình gốm vào danh mục của petshop.
  //
  // Khi chỉ có đúng một lựa chọn thì chọn sẵn luôn: bắt người dùng tự tay chọn một thứ hiển
  // nhiên là cách nhanh nhất để họ bấm Lưu rồi nhận lỗi "vui lòng chọn danh mục" mà không
  // hiểu tại sao.
  useEffect(() => {
    authFetch('/categories').then((res) => {
      const all = res.data || [];
      const brand = all.find((c) => c.slug === BRAND_CATEGORY_SLUG);
      const mine = brand ? all.filter((c) => c.id === brand.id || c.parentId === brand.id) : all;
      setCategories(mine);
      if (mine.length === 1) setCategoryId(mine[0].id);
    });
  }, []);

  const hasSubCategories = categories.some((c) => c.slug !== BRAND_CATEGORY_SLUG);

  // Slug tự sinh theo tên cho tới khi người dùng tự sửa nó. Sau đó thì để yên, vì slug đã
  // gõ tay thường là có chủ đích (giữ đường dẫn cũ, rút gọn cho dễ đọc).
  function handleNameChange(value) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function updateVariant(index, field, value) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrorMsg(null);
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const json = await authFetch('/uploads/image', { method: 'POST', body: formData });
        if (!json.data?.url) throw new Error(json.error?.message || 'Tải ảnh thất bại');
        setImages((prev) => [...prev, { url: json.data.url, altText: '' }]);
      }
    } catch (err) {
      setErrorMsg('Lỗi tải ảnh lên: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // cho phép chọn lại đúng file vừa chọn nếu cần
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);

    if (!categoryId) return setErrorMsg('Vui lòng chọn danh mục.');

    // Kiểm tra trước ở đây để báo lỗi ngay cạnh chỗ nhập, thay vì để backend trả về 422 sau
    // khi đã tải ảnh xong. Backend vẫn kiểm tra lại — đây chỉ là lớp tiện lợi.
    const cleaned = variants.map((v, i) => ({
      sku: (v.sku || `${slug}-${i + 1}`).toUpperCase(),
      price: Number(v.price),
      stockQuantity: Number(v.stockQuantity || 0),
      variantAttributes: v.label ? { label: v.label } : {},
      variantKey: v.label ? slugify(v.label) : `v${i + 1}`,
    }));

    if (cleaned.some((v) => !Number.isInteger(v.price) || v.price < 0)) {
      return setErrorMsg('Giá phải là số nguyên không âm.');
    }
    if (new Set(cleaned.map((v) => v.sku)).size !== cleaned.length) {
      return setErrorMsg('Các biến thể không được trùng mã SKU.');
    }

    setSubmitting(true);
    try {
      const json = await authFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          categoryId,
          name,
          slug,
          description: description || null,
          status,
          variants: cleaned,
          images: images.map((img, i) => ({ url: img.url, altText: img.altText || name, position: i })),
        }),
      });

      if (json.error) throw new Error(json.error.message);
      router.push('/admin/products');
    } catch (err) {
      setErrorMsg(err.message);
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black';
  const labelCls = 'block text-xs uppercase tracking-widest text-gray-500 mb-2';

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-20">
      <h1 className="text-3xl font-serif text-gray-900 tracking-wide mb-8">Thêm sản phẩm</h1>

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 text-red-700 px-4 py-3 rounded text-sm">{errorMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-5">
          <h2 className="font-serif text-xl text-gray-900">Thông tin chung</h2>

          <div>
            <label className={labelCls}>Tên sản phẩm</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Đường dẫn (slug)</label>
            <input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
              required
              className={inputCls + ' font-mono text-xs'}
            />
            <p className="text-xs text-gray-400 mt-1.5">/san-pham/{slug || '...'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Danh mục</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputCls + ' bg-white'}>
                <option value="">— Chọn danh mục —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.slug === BRAND_CATEGORY_SLUG ? `${c.name} (danh mục gốc)` : c.name}
                  </option>
                ))}
              </select>
              {!hasSubCategories && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Chưa có danh mục con nào, nên tạm xếp vào danh mục gốc.{' '}
                  <Link href="/admin/categories" className="text-blue-600 hover:underline">
                    Tạo danh mục
                  </Link>{' '}
                  như Bình gốm, Tượng, Lọ hoa để phân loại sản phẩm rõ hơn.
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Trạng thái</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + ' bg-white'}>
                <option value="draft">Nháp — chưa hiện trên web</option>
                <option value="active">Đang bán</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={inputCls} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-gray-900">Biến thể &amp; tồn kho</h2>
            <button
              type="button"
              onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Thêm biến thể
            </button>
          </div>
          <p className="text-xs text-gray-500 -mt-3">
            Mỗi biến thể là một phiên bản bán riêng, có giá và tồn kho riêng (ví dụ: cỡ nhỏ, cỡ lớn).
            Sản phẩm chỉ có một loại thì để nguyên một dòng.
          </p>

          {variants.map((v, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50/50">
              <div className="md:col-span-4">
                <label className={labelCls}>Tên phiên bản</label>
                <input value={v.label} onChange={(e) => updateVariant(i, 'label', e.target.value)} placeholder="Cỡ nhỏ 20cm" className={inputCls} />
              </div>
              <div className="md:col-span-3">
                <label className={labelCls}>Mã SKU</label>
                <input
                  value={v.sku}
                  onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                  placeholder={`${slug || 'ma'}-${i + 1}`}
                  className={inputCls + ' font-mono text-xs'}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Giá (VNĐ)</label>
                <input type="number" min="0" step="1000" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} required className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Tồn kho</label>
                <input type="number" min="0" value={v.stockQuantity} onChange={(e) => updateVariant(i, 'stockQuantity', e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div className="md:col-span-1 flex justify-end">
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-2.5"
                    title="Xoá biến thể"
                  >
                    Xoá
                  </button>
                )}
              </div>
              {v.price !== '' && Number(v.price) > 0 && (
                <p className="md:col-span-12 text-xs text-gray-500 -mt-1">
                  Hiển thị cho khách: <strong>{Number(v.price).toLocaleString('vi-VN')}đ</strong>
                </p>
              )}
            </div>
          ))}
        </section>

        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-5">
          <h2 className="font-serif text-xl text-gray-900">Hình ảnh</h2>

          <div>
            <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="text-sm" />
            {uploading && <p className="text-xs text-gray-500 mt-2">Đang tải ảnh lên...</p>}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <div key={img.url} className="border border-gray-200 rounded overflow-hidden bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageUrl(img.url)} alt="" className="w-full h-32 object-cover" />
                  <div className="p-2 flex flex-col gap-2">
                    {/* Alt text là thứ trình đọc màn hình đọc lên và là tín hiệu chính Google
                        có về bức ảnh, nên để trống sẽ tự điền bằng tên sản phẩm. */}
                    <input
                      value={img.altText}
                      onChange={(e) => setImages((prev) => prev.map((x, idx) => (idx === i ? { ...x, altText: e.target.value } : x)))}
                      placeholder="Mô tả ảnh"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Xoá ảnh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="bg-black text-white px-8 py-3 text-sm uppercase tracking-wider font-medium hover:bg-gray-800 transition-colors rounded disabled:opacity-50"
          >
            {submitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </button>
          <button type="button" onClick={() => router.push('/admin/products')} className="text-sm text-gray-500 hover:text-gray-900">
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
}
