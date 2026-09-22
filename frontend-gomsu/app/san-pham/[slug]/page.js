import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImageUrl, formatPrice } from '@/lib/utils';
import { apiFetch } from '@/lib/apiClient';
import ProductPurchasePanel from '@/components/product/ProductPurchasePanel';
import ProductStory from '@/components/product/ProductStory';
import ProductSpecifications from '@/components/product/ProductSpecifications';
import ProductClosingCta from '@/components/product/ProductClosingCta';


// Lấy một sản phẩm theo slug, trả về null nếu không có thay vì để lỗi bắn lên. Trang gọi hàm
// này ở hai nơi (generateMetadata và component), nên nó phải chịu được việc sản phẩm không
// tồn tại mà không làm sập cả request.
async function getProduct(slug) {
  try {
    const res = await apiFetch(`/products/${slug}`, { cache: 'no-store' });
    return res.data;
  } catch {
    return null;
  }
}

// Next 16: `params` là Promise trong cả generateMetadata và component.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Không tìm thấy sản phẩm' };

  // Mô tả meta lấy từ phần mô tả sản phẩm, cắt ở 155 ký tự vì Google thường chỉ hiện đến
  // khoảng đó. Cắt tại khoảng trắng gần nhất để không đứt giữa một từ.
  const raw = product.description || `${product.name} — gốm sứ Bát Tràng thủ công tại Nghĩa Phái.`;
  const description = raw.length > 155 ? raw.slice(0, 155).replace(/\s+\S*$/, '') + '…' : raw;
  const cover = product.images[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: `/san-pham/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: cover ? [{ url: getImageUrl(cover.url), alt: cover.altText || product.name }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProduct(slug),
    apiFetch('/settings?keys=product_story_image,product_spec_clay,product_spec_glaze,product_spec_safety', { cache: 'no-store' })
      .then((r) => r?.data || {})
      .catch(() => ({})),
  ]);

  // Sản phẩm nháp hoặc ngừng bán cũng rơi vào đây, vì API trả 404 cho chúng — người ngoài
  // không đoán được là sản phẩm có tồn tại hay không.
  if (!product) notFound();

  const prices = product.variants.map((v) => v.price);
  const singlePrice = prices.length > 0 && Math.min(...prices) === Math.max(...prices);
  const available = product.variants.reduce((sum, v) => sum + (v.stockQuantity - v.reservedQuantity), 0);
  const inStock = available > 0;
  const cover = product.images[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  // Dữ liệu có cấu trúc cho Google và các công cụ AI. Giá và tình trạng hàng ở đây phải khớp
  // với những gì hiện trên trang — khai báo lệch là lý do phổ biến nhất khiến Google bỏ qua
  // toàn bộ đoạn markup này. Dùng AggregateOffer khi có nhiều biến thể vì mỗi biến thể một giá.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images.map((img) => getImageUrl(img.url)),
    sku: product.variants[0]?.sku,
    brand: { '@type': 'Brand', name: 'Nghĩa Phái' },
    category: product.category?.name,
    // Chỉ khai khi chủ shop đã điền trong Cài đặt. Khai bừa một chất liệu không đúng vào
    // dữ liệu có cấu trúc còn tệ hơn bỏ trống: Google đối chiếu với nội dung hiển thị, lệch
    // nhau là bỏ qua cả khối markup.
    material: [settings.product_spec_clay, settings.product_spec_glaze].filter(Boolean).join(', ') || undefined,
    offers:
      prices.length > 1
        ? {
            '@type': 'AggregateOffer',
            priceCurrency: 'VND',
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: prices.length,
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          }
        : {
            '@type': 'Offer',
            priceCurrency: 'VND',
            price: prices[0],
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${siteUrl}/san-pham/${product.slug}`,
          },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: siteUrl || '/' },
      { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: `${siteUrl}/san-pham` },
      ...(product.category
        ? [{ '@type': 'ListItem', position: 3, name: product.category.name, item: `${siteUrl}/san-pham?category=${product.category.slug}` }]
        : []),
      { '@type': 'ListItem', position: product.category ? 4 : 3, name: product.name },
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="px-6 py-5 border-b border-gomsu-border text-xs uppercase tracking-widest text-gomsu-text-muted">
        <Link href="/" className="hover:text-gomsu-primary">Trang chủ</Link>
        <span className="mx-3">/</span>
        <Link href="/san-pham" className="hover:text-gomsu-primary">Sản phẩm</Link>
        {product.category && (
          <>
            <span className="mx-3">/</span>
            <Link href={`/san-pham?category=${product.category.slug}`} className="hover:text-gomsu-primary">
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-3">/</span>
        <span className="text-gomsu-text">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gomsu-border">
        <div className="border-r border-gomsu-border">
          <div className="aspect-square overflow-hidden bg-black/20">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getImageUrl(cover.url)} alt={cover.altText || product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-gomsu-text-muted">
                Chưa có ảnh
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4">
              {product.images.slice(1).map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden border-r border-t border-gomsu-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageUrl(img.url)} alt={img.altText || product.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 lg:p-12 flex flex-col gap-8">
          <div>
            {product.category && (
              <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
                {product.category.name}
              </h3>
            )}
            <h1 className="font-serif text-3xl md:text-5xl font-medium leading-tight">{product.name}</h1>
          </div>


          {product.description && (
            <div className="text-gomsu-text-muted leading-relaxed whitespace-pre-line">{product.description}</div>
          )}

          {/* Thông số để dạng bảng thay vì nhồi vào đoạn mô tả: người đọc quét mắt nhanh hơn,
              và đây cũng là dạng mà công cụ tìm kiếm bóc tách được thành dữ liệu. */}
          {product.variants.length > 1 && (
            <div>
              <h2 className="font-serif text-xl mb-4">Các phiên bản</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gomsu-border text-xs uppercase tracking-widest text-gomsu-text-muted">
                    <th className="text-left py-3 font-normal">Phiên bản</th>
                    <th className="text-right py-3 font-normal">Giá</th>
                    <th className="text-right py-3 font-normal">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => {
                    const left = v.stockQuantity - v.reservedQuantity;
                    return (
                      <tr key={v.id} className="border-b border-gomsu-border/50">
                        <td className="py-3">{v.variantAttributes?.label || v.sku}</td>
                        <td className="py-3 text-right">
                          {formatPrice(v.price)}
                          {v.compareAtPrice > v.price && (
                            <span className="text-gomsu-text-muted line-through ml-2 text-xs">
                              {formatPrice(v.compareAtPrice)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right text-gomsu-text-muted">
                          {left > 0 ? `Còn ${left}` : 'Hết'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <ProductPurchasePanel product={product} />
        </div>
      </div>

      {/* Hai khối này chạy hết chiều ngang nên nằm ngoài lưới hai cột ở trên. Thông số đặt
          trước câu chuyện: khách đang cân nhắc mua cần số liệu trước, phần kể chuyện là để
          thuyết phục thêm sau khi đã xem dữ liệu. */}
      <ProductSpecifications
        product={product}
        shopSpecs={{
          clay: settings.product_spec_clay,
          glaze: settings.product_spec_glaze,
          safety: settings.product_spec_safety,
        }}
      />
      <ProductStory product={product} imageUrl={settings.product_story_image || '/images/about/nghia-profile.jpg'} />
      <ProductClosingCta productName={product.name} />
    </article>
  );
}
