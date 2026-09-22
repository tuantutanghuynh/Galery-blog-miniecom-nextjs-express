'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteList } from '@/lib/useQuoteList';
import { formatPrice } from '@/lib/utils';
import TrustBadgesModal from './TrustBadgesModal';
import type { Product, ProductVariant } from '@/types/product';

interface ProductPurchasePanelProps {
  product: Product;
}

// Tầng 1 của trang sản phẩm: chọn phiên bản, giá đổi theo lựa chọn, cộng trừ số lượng.
// Tách khỏi trang để trang giữ nguyên Server Component — nó đang sinh generateMetadata và
// JSON-LD, chuyển sang client là mất toàn bộ rich result của sản phẩm trên Google.
//
// Khác bản bên nhánh giỏ hàng ở hai chỗ: không cần đăng nhập (luồng tư vấn không có tài
// khoản), và "mua ngay" trở thành "gửi yêu cầu tư vấn" vì không có thanh toán nào ở đây.
export default function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const router = useRouter();
  const { add } = useQuoteList();

  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(variants[0] || null);
  const [quantity, setQuantity] = useState<number>(1);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showSticky, setShowSticky] = useState<boolean>(false);

  const availableStock = selectedVariant
    ? selectedVariant.stockQuantity - selectedVariant.reservedQuantity
    : 0;
  const isOutOfStock = availableStock <= 0;

  // Thanh mua hàng dính đáy màn hình trên mobile, chỉ hiện sau khi khách đã cuộn qua khối
  // giá — hiện ngay từ đầu thì nó che mất chính thông tin khách đang đọc.
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function addToList(goToForm = false) {
    if (!selectedVariant) return;

    add(
      {
        variantId: selectedVariant.id,
        productName: product.name,
        productSlug: product.slug,
        variantLabel: (selectedVariant.variantAttributes?.label as string) || selectedVariant.sku,
        unitPrice: selectedVariant.price,
        imageUrl: selectedVariant.imageUrl || product.images?.[0]?.url || null,
      },
      quantity
    );

    if (goToForm) {
      router.push('/yeu-cau-tu-van');
      return;
    }
    setSuccessMsg('Đã thêm vào danh sách tư vấn.');
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      {variants.length > 1 && (
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted">
            Chọn phiên bản / Kích thước:
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const stockLeft = v.stockQuantity - v.reservedQuantity;
              const isSelected = selectedVariant?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariant(v);
                    if (quantity > stockLeft) setQuantity(Math.max(1, stockLeft));
                  }}
                  className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider border transition-all ${
                    isSelected
                      ? 'border-gomsu-primary bg-gomsu-primary/10 text-gomsu-primary font-bold'
                      : 'border-gomsu-border text-gomsu-text hover:border-gray-500'
                  } ${stockLeft <= 0 ? 'opacity-40 line-through' : ''}`}
                >
                  {(v.variantAttributes?.label as string) || v.sku} — {formatPrice(v.price)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedVariant && (
        <div className="flex items-baseline gap-4 pt-2">
          <span className="font-serif text-3xl md:text-4xl text-gomsu-primary font-medium">
            {formatPrice(selectedVariant.price)}
          </span>
          {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
            <span className="text-gomsu-text-muted line-through text-lg">
              {formatPrice(selectedVariant.compareAtPrice)}
            </span>
          )}
        </div>
      )}

      <p
        className={`text-xs uppercase tracking-widest font-medium ${
          availableStock > 0 ? 'text-gomsu-primary' : 'text-red-400'
        }`}
      >
        {availableStock > 0 ? `Còn hàng — ${availableStock} tác phẩm có sẵn` : 'Tạm hết hàng'}
      </p>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs tracking-wide">
          {successMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <div className="flex items-center border border-gomsu-border bg-[#1a1a1a] w-32 justify-between">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || isOutOfStock}
            className="px-3 py-3 text-gray-400 hover:text-white disabled:opacity-30 text-sm font-bold"
          >
            -
          </button>
          <span className="text-xs font-medium text-white tracking-widest">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
            disabled={quantity >= availableStock || isOutOfStock}
            className="px-3 py-3 text-gray-400 hover:text-white disabled:opacity-30 text-sm font-bold"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => addToList(false)}
          disabled={isOutOfStock}
          className="flex-1 px-6 py-3.5 border border-gomsu-primary text-gomsu-primary hover:bg-gomsu-primary hover:text-black transition-colors uppercase text-xs tracking-[0.2em] font-medium disabled:opacity-40"
        >
          {isOutOfStock ? 'TẠM HẾT HÀNG' : 'THÊM VÀO DANH SÁCH'}
        </button>

        <button
          type="button"
          onClick={() => addToList(true)}
          disabled={isOutOfStock}
          className="flex-1 px-6 py-3.5 bg-gomsu-primary text-black hover:bg-white transition-colors uppercase text-xs tracking-[0.2em] font-bold disabled:opacity-40"
        >
          GỬI YÊU CẦU TƯ VẤN
        </button>
      </div>

      <p className="text-xs text-gomsu-text-muted leading-relaxed">
        Nhân viên sẽ gọi lại tư vấn, báo phí vận chuyển và xác nhận trước khi giao. Chưa phát
        sinh thanh toán nào ở bước này.
      </p>

      <TrustBadgesModal />

      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111111]/95 border-t border-gomsu-border p-4 backdrop-blur-md flex items-center justify-between sm:hidden shadow-2xl">
          <div>
            <p className="text-[10px] text-gomsu-text-muted uppercase tracking-wider truncate max-w-[140px]">
              {product.name}
            </p>
            <p className="font-serif text-base text-gomsu-primary font-bold">
              {selectedVariant ? formatPrice(selectedVariant.price) : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => addToList(true)}
            disabled={isOutOfStock}
            className="px-6 py-3 bg-gomsu-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-40"
          >
            GỬI YÊU CẦU
          </button>
        </div>
      )}
    </div>
  );
}
