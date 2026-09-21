'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuoteList } from '@/lib/useQuoteList';
import { apiFetch } from '@/lib/apiClient';
import { getImageUrl } from '@/lib/utils';

const formatPrice = (v) => v.toLocaleString('vi-VN') + 'đ';

export default function QuoteRequestPage() {
  const { items, subtotal, isReady, updateQuantity, remove, clear } = useQuoteList();

  const [form, setForm] = useState({ customerName: '', phone: '', email: '', address: '', note: '' });
  const [website, setWebsite] = useState(''); // honeypot, người thật không thấy trường này
  const [status, setStatus] = useState({ busy: false, error: '', sent: false });

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ busy: true, error: '', sent: false });

    try {
      await apiFetch('/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          website_url: website,
          // Chỉ gửi variantId và số lượng. Server tự đọc lại tên và giá từ database, nên giá
          // hiển thị trong trình duyệt không thể biến thành giá nhân viên báo cho khách.
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      clear();
      setStatus({ busy: false, error: '', sent: true });
    } catch (err) {
      setStatus({ busy: false, error: err.message || 'Gửi yêu cầu thất bại', sent: false });
    }
  }

  if (status.sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-16 h-16 border border-gomsu-primary text-gomsu-primary rounded-full flex items-center justify-center text-2xl">✓</div>
        <h1 className="font-serif text-3xl md:text-4xl">Đã nhận yêu cầu của bạn</h1>
        <p className="text-sm text-gomsu-text-muted max-w-md leading-relaxed">
          Nhân viên Nghĩa Phái sẽ gọi lại trong thời gian sớm nhất để tư vấn, báo phí vận
          chuyển và xác nhận đơn hàng. Chưa phát sinh thanh toán nào ở bước này.
        </p>
        <Link href="/san-pham" className="text-sm text-gomsu-primary hover:underline">
          Tiếp tục xem sản phẩm
        </Link>
      </div>
    );
  }

  // Chờ đọc xong localStorage mới vẽ, nếu không sẽ chớp qua màn "danh sách trống" một nhịp.
  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-5">
        <h1 className="font-serif text-3xl">Chưa có sản phẩm nào</h1>
        <p className="text-sm text-gomsu-text-muted">Chọn sản phẩm bạn quan tâm, chúng tôi sẽ gọi lại tư vấn.</p>
        <Link href="/san-pham" className="text-sm text-gomsu-primary hover:underline">Xem sản phẩm</Link>
      </div>
    );
  }

  const field =
    'w-full bg-transparent border border-gray-600 px-4 py-3 text-sm text-gomsu-text placeholder:text-gray-500 focus:outline-none focus:border-gomsu-primary transition-colors';

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-12">
      <nav className="text-xs uppercase tracking-widest text-gomsu-text-muted mb-8">
        <Link href="/" className="hover:text-gomsu-primary">Trang chủ</Link>
        <span className="mx-3">/</span>
        <span className="text-gomsu-text">Yêu cầu tư vấn</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl mb-8">Sản phẩm bạn quan tâm</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Danh sách sản phẩm */}
        <div className="lg:col-span-2">
          <div className="border border-gomsu-border divide-y divide-gomsu-border">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-4 p-4 items-center">
                {item.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={getImageUrl(item.imageUrl)} alt={item.productName} className="w-20 h-20 object-cover shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <Link href={`/san-pham/${item.productSlug}`} className="font-serif text-base hover:text-gomsu-primary">
                    {item.productName}
                  </Link>
                  <p className="text-xs text-gomsu-text-muted mt-1">{item.variantLabel}</p>
                  <p className="text-sm text-gomsu-primary mt-1">{formatPrice(item.unitPrice)}</p>
                </div>

                <div className="flex items-center border border-gomsu-border shrink-0">
                  <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-3 py-1 hover:text-gomsu-primary">−</button>
                  <span className="px-3 py-1 min-w-[2.5rem] text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-3 py-1 hover:text-gomsu-primary">+</button>
                </div>

                <div className="w-28 text-right font-serif text-gomsu-primary shrink-0 hidden sm:block">
                  {formatPrice(item.unitPrice * item.quantity)}
                </div>

                <button
                  onClick={() => remove(item.variantId)}
                  className="text-xs uppercase tracking-widest text-gomsu-text-muted hover:text-red-400 shrink-0"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end items-baseline gap-6 mt-5">
            <span className="text-xs uppercase tracking-widest text-gomsu-text-muted">Tạm tính</span>
            <span className="font-serif text-2xl text-gomsu-primary">{formatPrice(subtotal)}</span>
          </div>

          <p className="text-xs text-gomsu-text-muted italic mt-3 leading-relaxed text-right">
            Giá trị trên CHƯA BAO GỒM phí vận chuyển.<br />
            Nhân viên sẽ báo phí cụ thể khi gọi xác nhận đơn hàng.
          </p>

          <Link href="/san-pham" className="inline-block mt-6 text-sm text-gomsu-primary hover:underline">
            &larr; Chọn thêm sản phẩm khác
          </Link>
        </div>

        {/* Form thông tin */}
        <div className="border border-gomsu-border p-6 h-fit">
          <h2 className="font-serif text-xl mb-2">Thông tin liên hệ</h2>
          <p className="text-xs text-gomsu-text-muted mb-6 leading-relaxed">
            Để lại thông tin, nhân viên sẽ gọi lại tư vấn và chốt đơn cùng bạn.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot: ẩn với người thật, bot điền vào thì yêu cầu bị bỏ đi âm thầm */}
            <div className="hidden" aria-hidden="true">
              <input type="text" name="website_url" tabIndex="-1" autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input name="customerName" value={form.customerName} onChange={change} required placeholder="Họ tên người nhận hàng" className={field} />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input name="phone" type="tel" value={form.phone} onChange={change} required placeholder="Dùng để liên lạc khi giao hàng" className={field} />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">Email</label>
              <input name="email" type="email" value={form.email} onChange={change} placeholder="Không bắt buộc" className={field} />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <input name="address" value={form.address} onChange={change} required placeholder="Địa chỉ nhận hàng" className={field} />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gomsu-text-muted mb-2">Ghi chú</label>
              <textarea name="note" value={form.note} onChange={change} rows="3" maxLength={500} placeholder="Thời gian tiện gọi, yêu cầu riêng..." className={`${field} resize-none`} />
            </div>

            {status.error && <p className="text-sm text-red-400">{status.error}</p>}

            <button
              type="submit"
              disabled={status.busy}
              className="w-full bg-gomsu-primary text-black py-4 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              {status.busy ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
            </button>

            <p className="text-xs text-gomsu-text-muted text-center leading-relaxed">
              Nhân viên sẽ gọi điện xác nhận. Không mua cũng không sao.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
