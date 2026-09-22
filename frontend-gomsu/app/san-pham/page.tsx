import type { Metadata } from 'next';
import Link from 'next/link';
import { getImageUrl, formatPrice } from '@/lib/utils';
import { apiFetch } from '@/lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

export const metadata: Metadata = {
  title: 'Sản phẩm gốm sứ Bát Tràng',
  description:
    'Bình gốm, tượng và đồ trang trí gốm sứ Bát Tràng thủ công. Mỗi sản phẩm được tạo hình và nung thủ công tại làng nghề.',
  alternates: { canonical: '/san-pham' },
};

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Next 16: `searchParams` là Promise, phải await trước khi đọc.
  const { category: selectedSlug } = await searchParams;

  let subCategories: Category[] = [];
  let products: Product[] = [];

  // Bọc try/catch để trang vẫn dựng được khi backend chết hoặc chưa có dữ liệu. Không có nó,
  // một lỗi API sẽ thành trang lỗi trắng thay vì một trang rỗng có bố cục đầy đủ.
  try {
    const catRes = await apiFetch<Category[]>('/categories', { cache: 'no-store' });
    const categories = catRes.data || [];
    const brand = categories.find((c) => c.slug === BRAND_CATEGORY_SLUG);
    subCategories = categories.filter((c) => c.parentId === brand?.id);

    const activeSlug = selectedSlug || BRAND_CATEGORY_SLUG;
    const res = await apiFetch<Product[]>(
      `/products?categorySlug=${activeSlug}&pageSize=50`,
      { cache: 'no-store' }
    );
    products = res.data || [];
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Lỗi tải sản phẩm:', msg);
  }

  return (
    <div>
      <div className="page-shell py-16 border-b border-gomsu-border">
        <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
          Gốm sứ thủ công Bát Tràng
        </h3>
        <h1 className="font-serif text-4xl md:text-6xl font-medium leading-tight">Sản phẩm</h1>
      </div>

      {subCategories.length > 0 && (
        <div className="page-shell flex gap-6 py-6 border-b border-gomsu-border overflow-x-auto">
          <Link
            href="/san-pham"
            className={`text-xs uppercase tracking-widest whitespace-nowrap ${
              !selectedSlug ? 'text-gomsu-primary' : 'text-gomsu-text-muted hover:text-gomsu-primary'
            }`}
          >
            Tất cả
          </Link>
          {subCategories.map((c) => (
            <Link
              key={c.id}
              href={`/san-pham?category=${c.slug}`}
              className={`text-xs uppercase tracking-widest whitespace-nowrap ${
                selectedSlug === c.slug
                  ? 'text-gomsu-primary'
                  : 'text-gomsu-text-muted hover:text-gomsu-primary'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="page-shell py-24 text-center">
          <p className="font-serif text-2xl text-gomsu-text-muted">
            Chưa có sản phẩm nào được trưng bày.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-6 text-xs uppercase tracking-widest text-gomsu-primary hover:underline"
          >
            Liên hệ để đặt riêng
          </Link>
        </div>
      ) : (
        <div className="page-shell grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const prices = product.variants.map((v) => v.price);
            const available = product.variants.reduce(
              (sum, v) => sum + (v.stockQuantity - v.reservedQuantity),
              0
            );
            const cover = product.images[0];

            return (
              <Link
                key={product.id}
                href={`/san-pham/${product.slug}`}
                className="group border-r border-b border-gomsu-border flex flex-col"
              >
                <div className="aspect-square overflow-hidden bg-black/20 relative">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(cover.url)}
                      alt={cover.altText || product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-gomsu-text-muted">
                      Chưa có ảnh
                    </div>
                  )}
                  {available <= 0 && (
                    <span className="absolute top-4 left-4 bg-black/80 text-white text-[10px] uppercase tracking-widest px-3 py-1.5">
                      Tạm hết hàng
                    </span>
                  )}
                </div>

                <div className="p-6 flex flex-col gap-2">
                  <h2 className="font-serif text-xl leading-snug group-hover:text-gomsu-primary transition-colors">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gomsu-text-muted">
                    {prices.length === 0
                      ? 'Liên hệ'
                      : Math.min(...prices) === Math.max(...prices)
                        ? formatPrice(prices[0])
                        : `từ ${formatPrice(Math.min(...prices))}`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
