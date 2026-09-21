'use client';

import Link from 'next/link';
import { useCart } from '@/lib/useCart';
import { useAuth } from '@/lib/useAuth';
import { formatPrice, getImageUrl } from '@/lib/utils';
import { useState } from 'react';

const WARNING_TEXTS = {
  OUT_OF_STOCK: 'Tác phẩm này hiện đã hết hàng',
  INSUFFICIENT_STOCK: 'Số lượng trong kho không đủ',
  UNAVAILABLE: 'Tác phẩm này đã ngừng kinh doanh',
};

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = useState(null);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gomsu-background text-gomsu-text">Đang tải giỏ hàng...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gomsu-background text-gomsu-text flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gomsu-primary mb-4">Vui lòng đăng nhập</h1>
        <p className="text-sm text-gomsu-text-muted mb-8 max-w-md">Bạn cần đăng nhập tài khoản để xem và quản lý giỏ hàng của mình.</p>
        <Link
          href="/auth/login?redirect=/gio-hang"
          className="px-8 py-3.5 bg-gomsu-primary text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const items = cart.items || [];
  const isEmpty = items.length === 0;

  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      setUpdatingId(itemId);
      await updateItem(itemId, newQty);
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật số lượng');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    if (!confirm('Bạn có chắc muốn bỏ tác phẩm này khỏi giỏ hàng?')) return;
    try {
      setUpdatingId(itemId);
      await removeItem(itemId);
    } catch (err) {
      alert(err.message || 'Lỗi xoá sản phẩm');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gomsu-background text-gomsu-text px-6 py-12 md:px-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gomsu-border pb-6 mb-8 gap-4">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gomsu-primary block mb-2 font-medium">Nghĩa Phái Art & Design</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white">Giỏ hàng của bạn</h1>
        </div>
        <Link href="/san-pham" className="text-xs uppercase tracking-widest text-gomsu-text-muted hover:text-gomsu-primary transition-colors flex items-center gap-2">
          <span>&larr;</span> Tiếp tục xem gốm
        </Link>
      </div>

      {isEmpty ? (
        <div className="text-center py-20 bg-[#161616] border border-gomsu-border">
          <p className="font-serif text-2xl text-gomsu-primary mb-3">Giỏ hàng đang trống</p>
          <p className="text-xs text-gomsu-text-muted mb-8 uppercase tracking-widest">Hãy chọn cho mình những tác phẩm gốm sứ ưng ý nhất</p>
          <Link
            href="/san-pham"
            className="inline-block px-8 py-3.5 border border-gomsu-primary text-gomsu-primary hover:bg-gomsu-primary hover:text-black transition-colors uppercase tracking-[0.2em] text-xs font-medium"
          >
            Khám phá bộ sưu tập <span>&rarr;</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cart.hasIssues && (
              <div className="p-4 bg-red-950/40 border border-red-800 text-red-300 text-xs tracking-wide leading-relaxed">
                ⚠️ Trong giỏ hàng có tác phẩm bị hết hàng hoặc không đủ số lượng tồn kho. Vui lòng điều chỉnh lại trước khi tiến hành thanh toán.
              </div>
            )}

            {items.map((item) => {
              const hasLineWarnings = item.warnings && item.warnings.length > 0;
              return (
                <div
                  key={item.id}
                  className={`p-6 bg-[#181818] border transition-all flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between ${
                    hasLineWarnings ? 'border-red-800/80 bg-red-950/10' : 'border-gomsu-border'
                  }`}
                >
                  {/* Thumbnail & Product Info */}
                  <div className="flex gap-4 items-center flex-1">
                    <div className="w-20 h-20 bg-black/40 border border-gomsu-border shrink-0 overflow-hidden relative">
                      {item.variant.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getImageUrl(item.variant.imageUrl)} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gomsu-text-muted">Chưa có ảnh</div>
                      )}
                    </div>
                    <div>
                      <Link href={`/san-pham/${item.product.slug}`} className="font-serif text-lg text-white hover:text-gomsu-primary transition-colors block mb-1">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gomsu-text-muted mb-2">
                        Phiên bản: {item.variant.variantAttributes?.label || item.variant.sku}
                      </p>
                      <p className="font-serif text-sm text-gomsu-primary font-medium">{formatPrice(item.unitPrice)}</p>

                      {/* Warnings display */}
                      {hasLineWarnings && (
                        <div className="mt-2 space-y-1">
                          {item.warnings.map((w, idx) => (
                            <p key={idx} className="text-[11px] text-red-400 font-medium">
                              ⚠️ {WARNING_TEXTS[w] || w} {w === 'INSUFFICIENT_STOCK' ? `(Kho còn ${item.available})` : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Line Total & Actions */}
                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-4 border-t sm:border-t-0 border-gomsu-border/40 pt-4 sm:pt-0">
                    <div className="flex items-center gap-4">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-gomsu-border bg-black/40">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={updatingId === item.id || item.quantity <= 1}
                          className="px-2.5 py-1 text-gray-400 hover:text-white text-xs font-bold disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-medium text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={updatingId === item.id || (item.available > 0 && item.quantity >= item.available)}
                          className="px-2.5 py-1 text-gray-400 hover:text-white text-xs font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={updatingId === item.id}
                        className="text-xs text-gomsu-text-muted hover:text-red-400 uppercase tracking-wider transition-colors"
                      >
                        Xoá
                      </button>
                    </div>

                    <p className="font-serif text-base text-white font-medium">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Panel */}
          <div className="bg-[#181818] border border-gomsu-border p-6 h-fit space-y-6">
            <h2 className="font-serif text-xl text-white font-medium border-b border-gomsu-border pb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gomsu-text-muted">
                <span>Tạm tính ({items.length} món):</span>
                <span className="text-white font-medium">{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gomsu-text-muted">
                <span>Phí vận chuyển:</span>
                <span className="text-gomsu-primary">Tính khi thanh toán</span>
              </div>
            </div>

            <div className="border-t border-gomsu-border pt-4 flex justify-between items-baseline">
              <span className="text-xs uppercase tracking-widest text-gomsu-text-muted">Tổng cộng:</span>
              <span className="font-serif text-2xl text-gomsu-primary font-medium">{formatPrice(cart.subtotal)}</span>
            </div>

            {cart.hasIssues ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-4 bg-gray-800 text-gray-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed border border-gray-700"
                >
                  THANH TOÁN BỊ KHÓA
                </button>
                <p className="text-[10px] text-red-400 text-center">Vui lòng khắc phục các dòng cảnh báo trước khi tiếp tục.</p>
              </div>
            ) : (
              <Link
                href="/thanh-toan"
                className="block w-full py-4 bg-gomsu-primary text-black font-bold text-xs uppercase tracking-[0.2em] text-center hover:bg-white transition-colors"
              >
                TIẾN HÀNH THANH TOÁN <span>&rarr;</span>
              </Link>
            )}

            <div className="text-[11px] text-gomsu-text-muted space-y-2 pt-2 border-t border-gomsu-border/40">
              <p>🛡 Bọc 5 lớp xốp chuyên dụng chống vỡ toàn quốc</p>
              <p>📜 Đi kèm chứng nhận gốm nghệ nhân Bát Tràng</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
