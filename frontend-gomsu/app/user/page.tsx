'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { authFetch } from '@/lib/adminAuth';
import { getImageUrl, formatPrice } from '@/lib/utils';
import { QuoteRequest, QuoteRequestItem } from '@/types/quote';

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS: Record<string, StatusConfig> = {
  NEW: { label: 'Chờ tư vấn', className: 'border-amber-500/40 text-amber-400' },
  CONTACTED: { label: 'Đã liên hệ', className: 'border-blue-500/40 text-blue-400' },
  CLOSED: { label: 'Đã chốt', className: 'border-emerald-500/40 text-emerald-400' },
};

export default function UserDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<QuoteRequest[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login?redirect=/user');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    authFetch<QuoteRequest[]>('/quote-requests/mine')
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [user]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  const total = (items: QuoteRequestItem[]) =>
    items.reduce((sum, i) => sum + (i.lineTotal ?? (i.unitPrice * i.quantity)), 0);

  return (
    <div className="page-shell py-12 min-h-screen">
      <h1 className="font-serif text-3xl md:text-4xl text-gomsu-primary mb-10">
        Xin chào, {user.fullName || user.email}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <h2 className="text-xs uppercase tracking-widest text-gomsu-text-muted mb-4">
            Yêu cầu tư vấn của bạn
          </h2>

          {loadingOrders ? (
            <p className="text-sm text-gomsu-text-muted">Đang tải...</p>
          ) : orders.length === 0 ? (
            <div className="border border-gomsu-border p-8 text-center space-y-3">
              <p className="text-sm text-gomsu-text-muted">Bạn chưa gửi yêu cầu tư vấn nào.</p>
              {/* Yêu cầu gửi lúc chưa đăng nhập không gắn được vào tài khoản, nên phải nói
                  trước để khách khỏi tưởng đơn của mình bị mất. */}
              <p className="text-xs text-gomsu-text-muted">
                Yêu cầu gửi khi chưa đăng nhập sẽ không hiện ở đây, nhưng nhân viên vẫn nhận
                được và sẽ gọi lại theo số điện thoại bạn để lại.
              </p>
              <Link href="/san-pham" className="inline-block text-sm text-gomsu-primary hover:underline pt-2">
                Xem sản phẩm
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((o) => {
                const st = STATUS[o.status] || { label: o.status, className: 'border-gomsu-border text-gomsu-text-muted' };
                return (
                  <div key={o.id} className="border border-gomsu-border p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <span className="text-xs text-gomsu-text-muted">
                        {new Date(o.createdAt).toLocaleString('vi-VN')}
                      </span>
                      <span className={`text-[10px] uppercase tracking-widest border px-2.5 py-1 ${st.className}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          {item.imageUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={getImageUrl(item.imageUrl)} alt={item.productName || ''} className="w-14 h-14 object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <Link href={`/san-pham/${item.productSlug}`} className="text-sm hover:text-gomsu-primary">
                              {item.productName}
                            </Link>
                            <p className="text-xs text-gomsu-text-muted">{item.variantLabel} × {item.quantity}</p>
                          </div>
                          <span className="text-sm text-gomsu-primary shrink-0">
                            {formatPrice(item.lineTotal ?? (item.unitPrice * item.quantity))}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-baseline border-t border-gomsu-border mt-4 pt-3">
                      <span className="text-xs uppercase tracking-widest text-gomsu-text-muted">Tạm tính</span>
                      <span className="font-serif text-lg text-gomsu-primary">{formatPrice(total(o.items))}</span>
                    </div>
                    <p className="text-xs text-gomsu-text-muted mt-1">Chưa gồm phí vận chuyển.</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="text-xs uppercase tracking-widest text-gomsu-text-muted mb-4">Tài khoản</h2>
          <div className="border border-gomsu-border p-5 space-y-4">
            <div>
              <p className="text-base">{user.fullName}</p>
              <p className="text-sm text-gomsu-text-muted">{user.email}</p>
            </div>

            {user.role === 'admin' && (
              <Link href="/admin/quote-requests" className="block text-sm text-gomsu-primary hover:underline">
                Vào trang quản trị &rarr;
              </Link>
            )}

            <button
              onClick={logout}
              className="w-full border border-gomsu-border text-gomsu-text-muted hover:border-red-500/50 hover:text-red-400 px-6 py-3 uppercase tracking-widest text-xs transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
