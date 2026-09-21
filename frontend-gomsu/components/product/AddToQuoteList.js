'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuoteList } from '@/lib/useQuoteList';

const formatPrice = (v) => v.toLocaleString('vi-VN') + 'đ';

// Khối chọn phiên bản và thêm vào danh sách tư vấn. Tách khỏi trang sản phẩm để trang đó
// vẫn là Server Component — nó đang sinh generateMetadata và JSON-LD, chuyển sang client là
// mất toàn bộ rich result của sản phẩm trên Google.
export default function AddToQuoteList({ product }) {
  const { add } = useQuoteList();
  const variants = product.variants || [];

  const [variantId, setVariantId] = useState(variants[0]?.id || null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const selected = variants.find((v) => v.id === variantId);

  if (!selected) {
    return (
      <Link
        href="/contact"
        className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gomsu-primary/50 text-gomsu-primary hover:bg-gomsu-primary hover:text-black transition-colors uppercase text-xs tracking-widest"
      >
        Liên hệ tư vấn <span>&rarr;</span>
      </Link>
    );
  }

  function handleAdd() {
    add(
      {
        variantId: selected.id,
        productName: product.name,
        productSlug: product.slug,
        variantLabel: selected.variantAttributes?.label || selected.sku,
        unitPrice: selected.price,
        imageUrl: selected.imageUrl || product.images?.[0]?.url || null,
      },
      quantity
    );
    setJustAdded(true);
  }

  return (
    <div className="space-y-5 border-t border-gomsu-border pt-6">
      {variants.length > 1 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-gomsu-text-muted mb-3">Chọn phiên bản</p>
          <div className="space-y-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => { setVariantId(v.id); setJustAdded(false); }}
                className={`w-full flex justify-between items-center px-4 py-3 border text-sm transition-colors ${
                  v.id === variantId
                    ? 'border-gomsu-primary text-gomsu-primary'
                    : 'border-gomsu-border text-gomsu-text hover:border-gomsu-primary'
                }`}
              >
                <span>{v.variantAttributes?.label || v.sku}</span>
                <span>{formatPrice(v.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="text-xs uppercase tracking-widest text-gomsu-text-muted">Số lượng</span>
        <div className="flex items-center border border-gomsu-border">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-2 hover:text-gomsu-primary">−</button>
          <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} className="px-4 py-2 hover:text-gomsu-primary">+</button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="w-full bg-gomsu-primary text-black py-4 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
      >
        Thêm vào danh sách tư vấn
      </button>

      {justAdded && (
        <div className="border border-gomsu-primary/40 px-4 py-3 text-sm flex items-center justify-between gap-4">
          <span className="text-gomsu-text-muted">Đã thêm vào danh sách.</span>
          <Link href="/yeu-cau-tu-van" className="text-gomsu-primary hover:underline whitespace-nowrap">
            Gửi yêu cầu &rarr;
          </Link>
        </div>
      )}

      <p className="text-xs text-gomsu-text-muted leading-relaxed">
        Chúng tôi sẽ gọi lại để tư vấn, báo phí vận chuyển và xác nhận trước khi giao. Chưa
        phát sinh thanh toán ở bước này.
      </p>
    </div>
  );
}
