'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/adminAuth';
import { getImageUrl, formatPrice } from '@/lib/utils';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';

const STATUS_LABELS = {
  draft: { label: 'Nháp', cls: 'border-amber-300 text-amber-700 bg-amber-50' },
  active: { label: 'Đang bán', cls: 'border-green-300 text-green-700 bg-green-50' },
  archived: { label: 'Ngừng bán', cls: 'border-gray-300 text-gray-600 bg-gray-50' },
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Danh sách luôn kèm categorySlug của thương hiệu này. Bỏ nó đi thì backend trả về cả
  // sản phẩm của petshop, vì hai storefront dùng chung một database.
  function loadProducts() {
    let url = `/products/admin/list?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=100`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${status}`;

    authFetch(url)
      .then((res) => setProducts(res.data || []))
      .finally(() => setLoading(false));
  }

  // Hoãn 300ms sau lần gõ cuối để không bắn một request cho mỗi ký tự người dùng nhập.
  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [search, status]);

  async function handleDelete(product) {
    if (!confirm(`Xoá vĩnh viễn "${product.name}"?\n\nSản phẩm sẽ biến mất khỏi giỏ hàng của khách. Nếu chỉ muốn ngừng bán, hãy đổi trạng thái sang "Ngừng bán".`)) return;
    await authFetch(`/products/${product.id}`, { method: 'DELETE' });
    loadProducts();
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-gray-900 tracking-wide">Quản lý Sản phẩm</h1>
        <Link
          href="/admin/products/new"
          className="bg-black text-white px-6 py-2.5 text-sm uppercase tracking-wider font-medium hover:bg-gray-800 transition-colors rounded"
        >
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Tìm theo tên sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-black"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-black bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="draft">Nháp</option>
          <option value="archived">Ngừng bán</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-lg">
        <ul className="divide-y divide-gray-200">
          {products.map((product) => {
            const st = STATUS_LABELS[product.status] || STATUS_LABELS.draft;
            const prices = product.variants.map((v) => v.price);
            const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
            const totalReserved = product.variants.reduce((sum, v) => sum + v.reservedQuantity, 0);

            return (
              <li key={product.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition-colors">
                <div className="w-24 h-24 shrink-0 bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center rounded">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(product.images[0].url)} alt={product.images[0].altText || product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">Chưa có ảnh</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-serif text-gray-900 truncate mb-2">{product.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-light">
                    <span className={`px-2 py-0.5 border text-xs tracking-widest uppercase rounded ${st.cls}`}>{st.label}</span>
                    <span>•</span>
                    <span>
                      {prices.length === 0
                        ? 'Chưa có biến thể'
                        : Math.min(...prices) === Math.max(...prices)
                          ? formatPrice(prices[0])
                          : `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`}
                    </span>
                    <span>•</span>
                    <span>{product.variants.length} biến thể</span>
                    <span>•</span>
                    {/* Hàng đang giữ cho đơn chờ thanh toán không còn bán được, nên hiện riêng
                        thay vì gộp vào tồn kho — nếu không, admin sẽ tưởng còn hàng để bán. */}
                    <span className={totalStock - totalReserved <= 0 ? 'text-red-600 font-medium' : ''}>
                      Còn bán {totalStock - totalReserved}
                      {totalReserved > 0 && <span className="text-gray-400"> (giữ {totalReserved})</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 px-4">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-sm uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors font-medium"
                  >
                    Sửa
                  </Link>
                  <button
                    onClick={() => handleDelete(product)}
                    className="text-sm uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors font-medium"
                  >
                    Xoá
                  </button>
                </div>
              </li>
            );
          })}

          {!loading && products.length === 0 && (
            <li className="p-12 text-center text-gray-500 font-light">
              Chưa có sản phẩm nào.{' '}
              <Link href="/admin/products/new" className="text-blue-600 hover:underline">
                Thêm sản phẩm đầu tiên
              </Link>
            </li>
          )}
          {loading && <li className="p-12 text-center text-gray-400 font-light">Đang tải...</li>}
        </ul>
      </div>
    </div>
  );
}
