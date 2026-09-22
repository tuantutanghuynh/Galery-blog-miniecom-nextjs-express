'use client';
import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/adminAuth';
import { getImageUrl, formatPrice } from '@/lib/utils';


const STATUS_LABEL = {
  NEW: 'Chưa gọi',
  CONTACTED: 'Đã gọi',
  CLOSED: 'Đã chốt',
};

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export default function AdminQuoteRequestsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [closingAmount, setClosingAmount] = useState('');

  const load = async (status) => {
    setLoading(true);
    try {
      const qs = status ? `&status=${status}` : '';
      const res = await authFetch(`/quote-requests/admin/list?pageSize=50${qs}`);
      setRows(res.data || []);
    } catch (error) {
      alert('Không tải được danh sách yêu cầu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  // Thống kê tính trên toàn bộ lịch sử, không theo bộ lọc đang chọn — con số doanh thu phải
  // ổn định dù nhân viên đang xem danh sách nào.
  useEffect(() => {
    authFetch('/quote-requests/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, [rows.length]);

  const changeStatus = async (id, status, finalAmount) => {
    try {
      const res = await authFetch(`/quote-requests/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, finalAmount }),
      });
      const patch = {
        status,
        finalAmount: res.data?.finalAmount ?? null,
        closedAt: res.data?.closedAt ?? null,
      };
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
      setClosingAmount('');
      return true;
    } catch (error) {
      alert('Lỗi cập nhật trạng thái: ' + error.message);
      return false;
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Xoá hẳn yêu cầu này? Không hoàn tác được.')) return;
    try {
      await authFetch(`/quote-requests/admin/${id}`, { method: 'DELETE' });
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (error) {
      alert('Lỗi khi xoá: ' + error.message);
    }
  };

  const total = (items) => items.reduce((sum, i) => sum + i.lineTotal, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold font-serif">Yêu cầu tư vấn</h1>
        <div className="flex gap-2">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'NEW', label: 'Chưa gọi' },
            { value: 'CONTACTED', label: 'Đã gọi' },
            { value: 'CLOSED', label: 'Đã chốt' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded border ${
                filter === f.value ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Khách để lại thông tin từ website. Gọi lại để tư vấn và chốt đơn — hệ thống không tự
        trừ kho hay thu tiền.
      </p>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng yêu cầu', value: stats.totalRequests },
            { label: 'Đã chốt', value: stats.closedCount },
            { label: 'Doanh thu', value: formatPrice(stats.revenue), accent: true },
            { label: 'Tỉ lệ chốt', value: `${stats.conversionRate}%` },
          ].map((s) => (
            <div key={s.label} className="bg-white border rounded-lg px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.accent ? 'text-green-700' : ''}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div>Đang tải...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
          Chưa có yêu cầu nào.
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-5 py-4 font-medium">Trạng thái</th>
                <th className="px-5 py-4 font-medium">Khách hàng</th>
                <th className="px-5 py-4 font-medium">Điện thoại</th>
                <th className="px-5 py-4 font-medium">Sản phẩm</th>
                <th className="px-5 py-4 font-medium text-right">Tạm tính</th>
                <th className="px-5 py-4 font-medium">Gửi lúc</th>
                <th className="px-5 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium">{r.customerName}</td>
                  <td className="px-5 py-4">
                    <a href={`tel:${r.phone}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">
                      {r.phone}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{r.items.length} sản phẩm</td>
                  <td className="px-5 py-4 text-right font-medium">{formatPrice(total(r.items))}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(r.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {/* Chỉ xoá được đơn chưa gọi. Đơn đã gọi là đã có người thật nói chuyện,
                        đơn đã chốt là một lần bán hàng — xoá là mất sổ sách. */}
                    {r.status === 'NEW' ? (
                      <button onClick={(e) => handleDelete(r.id, e)} className="text-xs text-gray-400 hover:text-red-600">
                        Xoá
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300" title="Đơn đã gọi hoặc đã chốt là dữ liệu bán hàng, không xoá được">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chi tiết: nhân viên cần đủ thông tin trên một màn để vừa gọi vừa đọc */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold font-serif">{selected.customerName}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selected.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-black text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Điện thoại</p>
                  <a href={`tel:${selected.phone}`} className="text-blue-600 hover:underline font-medium">{selected.phone}</a>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Email</p>
                  <p>{selected.email || <span className="text-gray-400">Không có</span>}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Địa chỉ</p>
                  <p>{selected.address}</p>
                </div>
                {selected.note && (
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Ghi chú</p>
                    <p className="whitespace-pre-line">{selected.note}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Sản phẩm khách quan tâm</p>
                <div className="border rounded divide-y">
                  {selected.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex gap-3 justify-between items-center text-sm">
                      {/* Ảnh giúp nhân viên nhận ra món khách hỏi ngay khi đang nghe điện
                          thoại, không phải mở thêm tab tra tên sản phẩm. */}
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getImageUrl(item.imageUrl)}
                          alt={item.productName}
                          className="w-14 h-14 object-cover rounded border shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded border bg-gray-50 shrink-0 flex items-center justify-center text-[10px] text-gray-400 text-center leading-tight">
                          Chưa<br />có ảnh
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.variantLabel} · SKU {item.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p>{formatPrice(item.unitPrice)} × {item.quantity}</p>
                        <p className="font-medium">{formatPrice(item.lineTotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-sm font-medium">
                  <span>Tạm tính (chưa gồm phí vận chuyển)</span>
                  <span>{formatPrice(total(selected.items))}</span>
                </div>
              </div>

              {selected.status === 'CLOSED' && selected.finalAmount != null && (
                <div className="bg-green-50 border border-green-200 rounded p-3 flex justify-between text-sm">
                  <span className="text-green-800">Đã chốt thật</span>
                  <span className="font-bold text-green-900">{formatPrice(selected.finalAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t space-y-3">
                <div className="flex gap-2">
                  {['NEW', 'CONTACTED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(selected.id, s)}
                      className={`px-4 py-2 text-xs rounded border ${
                        selected.status === s ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                  <span className="px-4 py-2 text-xs text-gray-400">
                    {selected.status === 'CLOSED' ? '← đổi lại sẽ xoá số tiền đã chốt' : ''}
                  </span>
                </div>

                {/* Chốt đơn phải kèm số tiền thật đã thoả thuận qua điện thoại. Giá trong
                    danh sách trên là giá khách xem trên web — nhân viên mặc cả, cộng phí ship,
                    giảm cho khách quen nên con số cuối gần như luôn khác. Thống kê doanh thu
                    dựng trên giá web sẽ sai ngay từ đơn đầu tiên. */}
                <div className="bg-gray-50 border rounded p-3">
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Chốt đơn — nhập số tiền thật đã thoả thuận
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={closingAmount}
                      onChange={(e) => setClosingAmount(e.target.value)}
                      placeholder={String(total(selected.items))}
                      className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                    />
                    <button
                      onClick={() => {
                        const amount = Number(closingAmount);
                        if (!Number.isInteger(amount) || amount < 0) {
                          alert('Vui lòng nhập số tiền đã chốt (số nguyên, không âm).');
                          return;
                        }
                        changeStatus(selected.id, 'CLOSED', amount);
                      }}
                      className="px-5 py-2 text-xs rounded bg-green-700 text-white hover:bg-green-800 whitespace-nowrap"
                    >
                      Đánh dấu đã chốt
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Gồm cả phí vận chuyển và giảm giá nếu có. Đây là con số dùng để thống kê doanh thu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
