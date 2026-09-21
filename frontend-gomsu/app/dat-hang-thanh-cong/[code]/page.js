'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/adminAuth';
import { apiFetch } from '@/lib/apiClient';
import { formatPrice } from '@/lib/utils';

export default function OrderSuccessPage({ params }) {
  const { code } = use(params);
  const [order, setOrder] = useState(null);
  const [bankSettings, setBankSettings] = useState({
    bank_id: 'MB',
    bank_account_no: '0334626393',
    bank_account_name: 'NGUYEN VAN NGHIA',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadOrderAndSettings() {
      try {
        setIsLoading(true);
        // Load order details
        const orderRes = await authFetch(`/orders/my/${code}`);
        if (orderRes.data) {
          setOrder(orderRes.data);
        } else {
          throw new Error('Không tìm thấy thông tin đơn hàng');
        }

        // Load Bank settings
        try {
          const settingsRes = await apiFetch('/settings?keys=bank_id,bank_account_no,bank_account_name');
          if (settingsRes.data) {
            setBankSettings((prev) => ({
              ...prev,
              ...settingsRes.data,
            }));
          }
        } catch {
          // Fallback to default bank settings if non-existent
        }
      } catch (err) {
        setErrorMsg(err.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrderAndSettings();
  }, [code]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gomsu-background text-gomsu-text">Đang tải thông tin đơn hàng...</div>;
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-gomsu-background text-gomsu-text flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl text-gomsu-primary mb-4">Không tìm thấy đơn hàng</h1>
        <p className="text-sm text-gomsu-text-muted mb-8">{errorMsg || 'Mã đơn hàng không hợp lệ.'}</p>
        <Link href="/" className="px-8 py-3.5 bg-gomsu-primary text-black font-bold uppercase tracking-widest text-xs">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const isBankTransfer = order.paymentMethod === 'BANK_TRANSFER';
  const qrUrl = `https://img.vietqr.io/image/${bankSettings.bank_id}-${bankSettings.bank_account_no}-compact2.png?amount=${order.grandTotal}&addInfo=${order.code}&accountName=${encodeURIComponent(bankSettings.bank_account_name)}`;

  return (
    <div className="min-h-screen bg-gomsu-background text-gomsu-text px-6 py-12 md:px-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#181818] border border-gomsu-border p-8 text-center space-y-4 mb-10">
        <div className="w-16 h-16 bg-gomsu-primary/10 border border-gomsu-primary text-gomsu-primary rounded-full flex items-center justify-center text-2xl mx-auto">
          ✓
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-medium text-white">Cảm ơn bạn đã đặt hàng!</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-gomsu-primary">
          Mã đơn hàng: <strong className="font-bold underline">{order.code}</strong>
        </p>
        <p className="text-xs text-gomsu-text-muted max-w-md mx-auto leading-relaxed">
          Nghĩa Phái đã tiếp nhận yêu cầu chế tác và đóng gói riêng cho đơn hàng của bạn.
        </p>
      </div>

      {/* Bank Transfer QR Section */}
      {isBankTransfer && (
        <div className="bg-[#1a1a1a] border border-gomsu-primary p-6 md:p-8 mb-10 space-y-6 shadow-2xl">
          <div className="border-b border-gomsu-border pb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gomsu-primary block mb-1 font-bold">THÔNG TIN CHUYỂN KHOẢN VIETQR</span>
            <h2 className="font-serif text-2xl text-white font-medium">Thanh toán qua Mã QR Ngân hàng</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* VietQR Image using plain <img> tag to avoid Next.js Image Optimization quota */}
            <div className="flex flex-col items-center bg-white p-4 rounded-sm border border-gray-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt={`Mã VietQR thanh toán đơn hàng ${order.code}`}
                className="max-w-[280px] w-full h-auto object-contain"
              />
              <p className="text-[11px] text-gray-600 mt-2 font-sans text-center">Quét bằng ứng dụng Ngân hàng hoặc Mobile Banking</p>
            </div>

            {/* Bank details list */}
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#111111] border border-gomsu-border space-y-1">
                <span className="text-gomsu-text-muted uppercase text-[10px]">Ngân hàng:</span>
                <p className="text-white font-bold text-sm">{bankSettings.bank_id}</p>
              </div>

              <div className="p-3 bg-[#111111] border border-gomsu-border space-y-1">
                <span className="text-gomsu-text-muted uppercase text-[10px]">Số tài khoản:</span>
                <p className="text-gomsu-primary font-bold text-base tracking-wider">{bankSettings.bank_account_no}</p>
              </div>

              <div className="p-3 bg-[#111111] border border-gomsu-border space-y-1">
                <span className="text-gomsu-text-muted uppercase text-[10px]">Chủ tài khoản:</span>
                <p className="text-white font-bold text-sm uppercase">{bankSettings.bank_account_name}</p>
              </div>

              <div className="p-3 bg-[#111111] border border-gomsu-border space-y-1">
                <span className="text-gomsu-text-muted uppercase text-[10px]">Nội dung chuyển khoản (bắt buộc):</span>
                <p className="text-gomsu-primary font-bold text-base tracking-widest">{order.code}</p>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800 text-amber-300 text-[11px] leading-relaxed">
                ⚠️ <strong>Lưu ý quan trọng:</strong> Tác phẩm sẽ được giữ kho cho quý khách trong vòng <strong>24 giờ</strong>. Sau thời gian này nếu chưa nhận được thanh toán, hệ thống sẽ tự động nhượng lại kho cho khách hàng tiếp theo.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details & Address Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-[#181818] border border-gomsu-border p-6 space-y-4">
          <h3 className="font-serif text-lg text-white font-medium border-b border-gomsu-border pb-3">Địa chỉ nhận hàng</h3>
          <div className="text-xs text-gomsu-text-muted space-y-2">
            <p><strong className="text-white">Người nhận:</strong> {order.shippingAddress.fullName}</p>
            <p><strong className="text-white">Số điện thoại:</strong> {order.shippingAddress.phone}</p>
            <p><strong className="text-white">Địa chỉ:</strong> {order.shippingAddress.streetAddress}, {order.shippingAddress.city}</p>
            {order.note && <p><strong className="text-white">Ghi chú:</strong> {order.note}</p>}
          </div>
        </div>

        <div className="bg-[#181818] border border-gomsu-border p-6 space-y-4">
          <h3 className="font-serif text-lg text-white font-medium border-b border-gomsu-border pb-3">Thông tin đơn hàng</h3>
          <div className="text-xs text-gomsu-text-muted space-y-2">
            <p><strong className="text-white">Phương thức:</strong> {order.paymentMethod === 'COD' ? 'Thanh toán COD khi nhận hàng' : 'Chuyển khoản Ngân hàng VietQR'}</p>
            <p><strong className="text-white">Trạng thái đơn:</strong> {order.orderStatus}</p>
            <p><strong className="text-white">Trạng thái thanh toán:</strong> {order.paymentStatus}</p>
            <p><strong className="text-white">Tổng số tiền:</strong> <span className="text-gomsu-primary font-bold font-serif text-base">{formatPrice(order.grandTotal)}</span></p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/san-pham"
          className="px-8 py-4 bg-gomsu-primary text-black font-bold uppercase tracking-widest text-xs text-center hover:bg-white transition-colors"
        >
          Tiếp tục mua hàng
        </Link>
        <Link
          href="/user"
          className="px-8 py-4 border border-gomsu-border text-gomsu-text hover:text-white uppercase tracking-widest text-xs text-center hover:bg-white/5 transition-colors"
        >
          Quản lý tài khoản
        </Link>
      </div>
    </div>
  );
}
