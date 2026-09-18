'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/adminAuth';
import { getImageUrl } from '@/lib/utils';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';

export default function EditProductPage({ params }) {
  // Next 16: `params` là một Promise, phải mở bằng `use()` chứ không đọc thẳng như trước.
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '', status: 'draft', categoryId: '' });
  const [variants, setVariants] = useState([]);

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingVariant, setSavingVariant] = useState(null);
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    authFetch('/categories').then((res) => {
      const all = res.data || [];
      const brand = all.find((c) => c.slug === BRAND_CATEGORY_SLUG);
      setCategories(brand ? all.filter((c) => c.id === brand.id || c.parentId === brand.id) : all);
    });

    // Không có endpoint lấy sản phẩm theo id cho admin, nên lấy từ danh sách admin rồi lọc ra.
    // Dùng endpoint công khai theo slug sẽ không thấy được sản phẩm nháp — đúng thứ ta cần sửa.
    authFetch(`/products/admin/list?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=200`).then((res) => {
      const found = (res.data || []).find((p) => p.id === id);
      if (!found) return setErrorMsg('Không tìm thấy sản phẩm.');
      setProduct(found);
      setForm({
        name: found.name,
        slug: found.slug,
        description: found.description || '',
        status: found.status,
        categoryId: found.categoryId,
      });
      setVariants(found.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        label: v.variantAttributes?.label || '',
        price: String(v.price),
        stockQuantity: String(v.stockQuantity),
        reservedQuantity: v.reservedQuantity,
      })));
    });
  }, [id]);

  function flash(text) {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  }

  async function handleSaveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    setErrorMsg(null);
    try {
      const json = await authFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(form) });
      if (json.error) throw new Error(json.error.message);
      flash('Đã lưu thông tin sản phẩm.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingInfo(false);
    }
  }

  // Mỗi biến thể lưu riêng chứ không gộp thành một nút "Lưu tất cả". Giá và tồn kho là hai
  // thứ dễ gây thiệt hại nhất nếu ghi nhầm, nên mỗi lần lưu chỉ động đến đúng một dòng mà
  // admin vừa nhìn vào.
  async function handleSaveVariant(v) {
    setSavingVariant(v.id);
    setErrorMsg(null);
    try {
      const json = await authFetch(`/products/variants/${v.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity),
          label: v.label,
        }),
      });
      if (json.error) throw new Error(json.error.message);
      flash(`Đã lưu biến thể ${v.sku}.`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingVariant(null);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black';
  const labelCls = 'block text-xs uppercase tracking-widest text-gray-500 mb-2';

  if (errorMsg && !product) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <p className="text-red-600">{errorMsg}</p>
        <Link href="/admin/products" className="text-blue-600 hover:underline text-sm">← Về danh sách sản phẩm</Link>
      </div>
    );
  }

  if (!product) return <div className="max-w-4xl mx-auto mt-8 px-4 text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-gray-900 tracking-wide">Sửa sản phẩm</h1>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900">← Danh sách</Link>
      </div>

      {message && <div className="mb-6 border border-green-300 bg-green-50 text-green-700 px-4 py-3 rounded text-sm">{message}</div>}
      {errorMsg && <div className="mb-6 border border-red-300 bg-red-50 text-red-700 px-4 py-3 rounded text-sm">{errorMsg}</div>}

      <form onSubmit={handleSaveInfo} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-5 mb-8">
        <h2 className="font-serif text-xl text-gray-900">Thông tin chung</h2>

        <div>
          <label className={labelCls}>Tên sản phẩm</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Đường dẫn (slug)</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className={inputCls + ' font-mono text-xs'} />
          <p className="text-xs text-amber-600 mt-1.5">
            Đổi slug sẽ làm hỏng mọi đường dẫn cũ đang trỏ tới sản phẩm này.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Danh mục</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls + ' bg-white'}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls + ' bg-white'}>
              <option value="draft">Nháp — chưa hiện trên web</option>
              <option value="active">Đang bán</option>
              <option value="archived">Ngừng bán</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className={inputCls} />
        </div>

        <div>
          <button type="submit" disabled={savingInfo} className="bg-black text-white px-8 py-3 text-sm uppercase tracking-wider font-medium hover:bg-gray-800 transition-colors rounded disabled:opacity-50">
            {savingInfo ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-4 mb-8">
        <h2 className="font-serif text-xl text-gray-900">Giá &amp; tồn kho</h2>

        {variants.map((v, i) => (
          <div key={v.id} className="border border-gray-200 rounded p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50/50">
            <div className="md:col-span-3">
              <label className={labelCls}>Tên phiên bản</label>
              <input
                value={v.label}
                onChange={(e) => setVariants((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>SKU</label>
              <input value={v.sku} disabled className={inputCls + ' font-mono text-xs bg-gray-100 text-gray-500'} title="SKU không đổi được sau khi tạo" />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Giá (VNĐ)</label>
              <input
                type="number" min="0" step="1000" value={v.price}
                onChange={(e) => setVariants((prev) => prev.map((x, idx) => (idx === i ? { ...x, price: e.target.value } : x)))}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Tồn kho</label>
              <input
                type="number" min={v.reservedQuantity} value={v.stockQuantity}
                onChange={(e) => setVariants((prev) => prev.map((x, idx) => (idx === i ? { ...x, stockQuantity: e.target.value } : x)))}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveVariant(v)}
                disabled={savingVariant === v.id}
                className="border border-black text-black px-4 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-black hover:text-white transition-colors rounded disabled:opacity-50"
              >
                {savingVariant === v.id ? 'Đang lưu' : 'Lưu'}
              </button>
            </div>
            {v.reservedQuantity > 0 && (
              <p className="md:col-span-12 text-xs text-amber-600 -mt-1">
                Đang giữ {v.reservedQuantity} cho đơn chờ thanh toán — không thể đặt tồn kho thấp hơn số này.
              </p>
            )}
          </div>
        ))}
      </section>

      {product.images.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl text-gray-900 mb-4">Hình ảnh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={getImageUrl(img.url)} alt={img.altText || ''} className="w-full h-32 object-cover border border-gray-200 rounded" />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Sửa ảnh chưa làm được ở bản này — cần xoá sản phẩm và tạo lại nếu muốn đổi ảnh.
          </p>
        </section>
      )}
    </div>
  );
}
