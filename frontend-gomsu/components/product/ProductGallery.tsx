'use client';

import { useState, useEffect, useCallback } from 'react';
import { getImageUrl } from '@/lib/utils';
import type { ProductImage } from '@/types/product';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

// Thư viện ảnh sản phẩm. Với đồ thủ công thì bề mặt men và vết tay nghệ nhân chính là thứ
// thuyết phục khách, nên phải xem được ảnh cỡ lớn — lưới thumbnail nhỏ trước đây không cho
// phóng to, khách muốn nhìn kỹ thì không còn cách nào.
export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [index, setIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const count = images.length;
  const go = useCallback((next: number) => setIndex((i) => (next + count) % count), [count]);

  // Phím tắt chỉ gắn khi lightbox đang mở, nếu không thì mũi tên trái/phải của trang sẽ bị
  // chiếm trong lúc khách đang đọc mô tả.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      else if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
    };
    window.addEventListener('keydown', onKey);

    // Khoá cuộn nền để cuộn chuột không làm trang chạy phía sau lớp phủ.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, index, go]);

  if (count === 0) {
    return (
      <div className="aspect-square flex items-center justify-center bg-black/20 text-xs uppercase tracking-widest text-gomsu-text-muted">
        Chưa có ảnh
      </div>
    );
  }

  const current = images[index];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      <div className="relative aspect-square overflow-hidden bg-black/20 group">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full h-full cursor-zoom-in"
          aria-label={`Phóng to ảnh ${index + 1} của ${productName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageUrl(current.url)}
            alt={current.altText || productName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </button>

        <span className="absolute bottom-4 right-4 text-[11px] tracking-[0.2em] text-white/80 bg-black/50 px-3 py-1.5 backdrop-blur-sm pointer-events-none">
          {pad(index + 1)} / {pad(count)}
        </span>

        <span className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.2em] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Bấm để phóng to
        </span>
      </div>

      {count > 1 && (
        <div className="grid grid-cols-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              aria-current={i === index}
              className={`aspect-square overflow-hidden border-r border-t transition-colors ${
                i === index ? 'border-gomsu-primary' : 'border-gomsu-border hover:border-gray-500'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(img.url)}
                alt={img.altText || `${productName} — ảnh ${i + 1}`}
                className={`w-full h-full object-cover transition-opacity ${
                  i === index ? '' : 'opacity-60 hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 md:p-10"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Ảnh phóng to của ${productName}`}
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-6 text-white/70 hover:text-white text-3xl leading-none"
            aria-label="Đóng"
          >
            ×
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index - 1);
                }}
                className="absolute left-4 md:left-8 text-white/60 hover:text-white text-4xl leading-none px-3 py-6"
                aria-label="Ảnh trước"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index + 1);
                }}
                className="absolute right-4 md:right-8 text-white/60 hover:text-white text-4xl leading-none px-3 py-6"
                aria-label="Ảnh sau"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageUrl(current.url)}
            alt={current.altText || productName}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain cursor-default"
          />

          <span className="absolute bottom-6 text-[11px] tracking-[0.2em] text-white/70">
            {pad(index + 1)} / {pad(count)}
          </span>
        </div>
      )}
    </>
  );
}
