'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/lib/useCart';
import { useAuth } from '@/lib/useAuth';
import { formatPrice } from '@/lib/utils';
import TrustBadgesModal from './TrustBadgesModal';

export default function ProductPurchasePanel({ product }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { addItem } = useCart();

  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSticky, setShowSticky] = useState(false);

  // Stock calculation for selected variant
  const availableStock = selectedVariant ? selectedVariant.stockQuantity - selectedVariant.reservedQuantity : 0;
  const isOutOfStock = availableStock <= 0;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = async (e, isBuyNow = false) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      // Unauthenticated -> redirect to login with safe return url
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!selectedVariant) {
      setErrorMsg('Vui lòng chọn phiên bản sản phẩm');
      return;
    }

    try {
      setIsAdding(true);
      await addItem(selectedVariant.id, quantity);
      if (isBuyNow) {
        router.push('/gio-hang');
      } else {
        setSuccessMsg('Đã thêm tác phẩm vào giỏ hàng!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi thêm vào giỏ hàng');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Variant Selector */}
      {variants.length > 1 && (
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted">
            Chọn phiên bản / Kích thước:
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const stockLeft = v.stockQuantity - v.reservedQuantity;
              const isSelected = selectedVariant?.id === v.id;
              const label = v.variantAttributes?.label || v.sku;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariant(v);
                    if (quantity > (v.stockQuantity - v.reservedQuantity)) {
                      setQuantity(Math.max(1, v.stockQuantity - v.reservedQuantity));
                    }
                  }}
                  className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider border transition-all ${
                    isSelected
                      ? 'border-gomsu-primary bg-gomsu-primary/10 text-gomsu-primary font-bold'
                      : 'border-gomsu-border text-gomsu-text hover:border-gray-500'
                  } ${stockLeft <= 0 ? 'opacity-40 line-through' : ''}`}
                >
                  {label} — {formatPrice(v.price)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Price Display */}
      {selectedVariant && (
        <div className="flex items-baseline gap-4 pt-2">
          <span className="font-serif text-3xl md:text-4xl text-gomsu-primary font-medium">
            {formatPrice(selectedVariant.price)}
          </span>
          {selectedVariant.compareAtPrice > selectedVariant.price && (
            <span className="text-gomsu-text-muted line-through text-lg">
              {formatPrice(selectedVariant.compareAtPrice)}
            </span>
          )}
        </div>
      )}

      {/* Stock status indicator */}
      <p className={`text-xs uppercase tracking-widest font-medium ${availableStock > 0 ? 'text-gomsu-primary' : 'text-red-400'}`}>
        {availableStock > 0 ? `Còn hàng — ${availableStock} tác phẩm có sẵn` : 'Tạm hết hàng'}
      </p>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs tracking-wide">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs tracking-wide">
          {successMsg}
        </div>
      )}

      {/* Action panel: Quantity + Add / Buy buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {/* Quantity Stepper */}
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

        {/* Add to Cart button */}
        <button
          type="button"
          onClick={(e) => handleAddToCart(e, false)}
          disabled={isAdding || isOutOfStock}
          className="flex-1 px-6 py-3.5 border border-gomsu-primary text-gomsu-primary hover:bg-gomsu-primary hover:text-black transition-colors uppercase text-xs tracking-[0.2em] font-medium disabled:opacity-40"
        >
          {isAdding ? 'Đang xử lý...' : isOutOfStock ? 'TẠM HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
        </button>

        {/* Buy Now button */}
        <button
          type="button"
          onClick={(e) => handleAddToCart(e, true)}
          disabled={isAdding || isOutOfStock}
          className="flex-1 px-6 py-3.5 bg-gomsu-primary text-black hover:bg-white transition-colors uppercase text-xs tracking-[0.2em] font-bold disabled:opacity-40"
        >
          MUA NGAY
        </button>
      </div>

      {/* Interactive Trust Badges */}
      <TrustBadgesModal />

      {/* Mobile Sticky Bar */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111111]/95 border-t border-gomsu-border p-4 backdrop-blur-md flex items-center justify-between sm:hidden shadow-2xl">
          <div>
            <p className="text-[10px] text-gomsu-text-muted uppercase tracking-wider truncate max-w-[140px]">{product.name}</p>
            <p className="font-serif text-base text-gomsu-primary font-bold">
              {selectedVariant ? formatPrice(selectedVariant.price) : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => handleAddToCart(e, true)}
            disabled={isAdding || isOutOfStock}
            className="px-6 py-3 bg-gomsu-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
          >
            MUA NGAY
          </button>
        </div>
      )}
    </div>
  );
}
