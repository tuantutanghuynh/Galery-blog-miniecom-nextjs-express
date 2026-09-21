'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/useCart';
import { useAuth } from '@/lib/useAuth';
import { authFetch } from '@/lib/adminAuth';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, isLoading: isCartLoading, fetchCart } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  if (isCartLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gomsu-background text-gomsu-text">Đang tải...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gomsu-background text-gomsu-text flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gomsu-primary mb-4">Yêu cầu đăng nhập</h1>
        <p className="text-sm text-gomsu-text-muted mb-8">Vui lòng đăng nhập để hoàn tất đơn hàng.</p>
        <Link href="/auth/login?redirect=/thanh-toan" className="px-8 py-3.5 bg-gomsu-primary text-black font-bold uppercase tracking-widest text-xs">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const items = cart.items || [];
  if (items.length === 0 || cart.hasIssues) {
    return (
      <div className="min-h-screen bg-gomsu-background text-gomsu-text flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gomsu-primary mb-4">Giỏ hàng không khả thi</h1>
        <p className="text-sm text-gomsu-text-muted mb-8">Giỏ hàng của bạn đang trống hoặc chứa tác phẩm bị kẹt kho. Vui lòng kiểm tra lại.</p>
        <Link href="/gio-hang" className="px-8 py-3.5 border border-gomsu-primary text-gomsu-primary uppercase tracking-widest text-xs">
          Về giỏ hàng
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !phone.trim() || !streetAddress.trim() || !city.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ 4 trường địa chỉ giao hàng.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            streetAddress: streetAddress.trim(),
            city: city.trim(),
          },
          paymentMethod,
          note: note.trim() || undefined,
        }),
      });

      if (res.error || !res.data) {
        throw new Error(res.error?.message || 'Không thể tạo đơn hàng');
      }

      // Refresh global cart context state (which is now empty)
      await fetchCart();

      // Redirect to success page with order code
      router.push(`/dat-hang-thanh-cong/${res.data.code}`);
    } catch (err) {
      setErrorMsg(err.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gomsu-background text-gomsu-text px-6 py-12 md:px-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gomsu-border pb-6 mb-10 flex justify-between items-end">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gomsu-primary block mb-2 font-medium">Nghĩa Phái Art & Design</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white">Thanh toán đơn hàng</h1>
        </div>
        <Link href="/gio-hang" className="text-xs uppercase tracking-widest text-gomsu-text-muted hover:text-gomsu-primary transition-colors">
          &larr; Sửa giỏ hàng
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-950/40 border border-red-800 text-red-300 text-xs tracking-wide">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Form Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Shipping Address (4 fields) */}
          <div className="bg-[#181818] border border-gomsu-border p-6 md:p-8 space-y-5">
            <h2 className="font-serif text-xl text-white font-medium border-b border-gomsu-border/60 pb-3 flex items-center gap-2">
              <span className="text-gomsu-primary">1.</span> Thông tin giao hàng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">
                  Họ và tên người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-[#111111] border border-gomsu-border px-4 py-3 text-sm text-white focus:outline-none focus:border-gomsu-primary"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0987654321"
                  className="w-full bg-[#111111] border border-gomsu-border px-4 py-3 text-sm text-white focus:outline-none focus:border-gomsu-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">
                  Địa chỉ chi tiết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Số 123 đường Bát Tràng, Phường/Xã..."
                  className="w-full bg-[#111111] border border-gomsu-border px-4 py-3 text-sm text-white focus:outline-none focus:border-gomsu-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">
                  Tỉnh / Thành phố <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Hà Nội, TP. Hồ Chí Minh,..."
                  className="w-full bg-[#111111] border border-gomsu-border px-4 py-3 text-sm text-white focus:outline-none focus:border-gomsu-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-[#181818] border border-gomsu-border p-6 md:p-8 space-y-5">
            <h2 className="font-serif text-xl text-white font-medium border-b border-gomsu-border/60 pb-3 flex items-center gap-2">
              <span className="text-gomsu-primary">2.</span> Phương thức thanh toán
            </h2>

            <div className="space-y-3">
              <label className={`flex items-start gap-4 p-4 border transition-all cursor-pointer ${paymentMethod === 'COD' ? 'border-gomsu-primary bg-gomsu-primary/5' : 'border-gomsu-border bg-[#111111]'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 accent-gomsu-primary"
                />
                <div>
                  <span className="font-medium text-white text-sm block mb-1">Thanh toán khi nhận hàng (COD)</span>
                  <span className="text-xs text-gomsu-text-muted leading-relaxed block">Quý khách nhận hàng, kiểm tra độ nguyên vẹn của gốm rồi mới gửi tiền cho nhân viên giao hàng.</span>
                </div>
              </label>

              <label className={`flex items-start gap-4 p-4 border transition-all cursor-pointer ${paymentMethod === 'BANK_TRANSFER' ? 'border-gomsu-primary bg-gomsu-primary/5' : 'border-gomsu-border bg-[#111111]'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="mt-1 accent-gomsu-primary"
                />
                <div>
                  <span className="font-medium text-white text-sm block mb-1">Chuyển khoản Ngân hàng (Mã QR VietQR)</span>
                  <span className="text-xs text-gomsu-text-muted leading-relaxed block">Quét mã QR ngân hàng có sẵn số tiền & nội dung đơn hàng. Đơn hàng được giữ trong 24 giờ.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Note */}
          <div className="bg-[#181818] border border-gomsu-border p-6 md:p-8 space-y-3">
            <h2 className="font-serif text-lg text-white font-medium">Ghi chú đơn hàng (Tuỳ chọn)</h2>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú về thời gian giao hàng hoặc yêu cầu đóng gói quà tặng đặc biệt..."
              className="w-full bg-[#111111] border border-gomsu-border p-4 text-sm text-white focus:outline-none focus:border-gomsu-primary"
            />
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="bg-[#181818] border border-gomsu-border p-6 md:p-8 h-fit space-y-6">
          <h2 className="font-serif text-xl text-white font-medium border-b border-gomsu-border pb-4">Tác phẩm mua ({items.length})</h2>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 border-b border-gomsu-border pb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <div>
                  <p className="text-white font-medium line-clamp-1">{item.product.name}</p>
                  <p className="text-gomsu-text-muted text-[10px]">x{item.quantity} ({item.variant.variantAttributes?.label || item.variant.sku})</p>
                </div>
                <span className="text-gomsu-primary font-serif font-medium">{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-xs border-b border-gomsu-border pb-4">
            <div className="flex justify-between text-gomsu-text-muted">
              <span>Tạm tính:</span>
              <span className="text-white font-medium">{formatPrice(cart.subtotal)}</span>
            </div>
            {/* Backend trả shippingFee = 0 qua hằng số SHIPPING_FEE_NOT_CALCULATED, nghĩa là
                "chưa tính" chứ không phải "miễn phí". Hiện "miễn phí" ở đây là hứa với khách
                một điều cửa hàng chưa hề cam kết. */}
            <div className="flex justify-between text-gomsu-text-muted">
              <span>Phí vận chuyển:</span>
              <span className="text-xs">Báo sau khi xác nhận đơn</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-widest text-gomsu-text-muted">Tổng thanh toán:</span>
            <span className="font-serif text-2xl text-gomsu-primary font-bold">{formatPrice(cart.subtotal)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gomsu-primary text-black font-bold text-xs uppercase tracking-[0.2em] text-center hover:bg-white transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'ĐANG KHỞI TẠO ĐƠN...' : 'XÁC NHẬN ĐẶT HÀNG'}
          </button>
        </div>
      </form>
    </div>
  );
}
