'use client';
import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/adminAuth';

const formatPrice = (v) => v.toLocaleString('vi-VN') + 'đ';

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

  const changeStatus = async (id, status, e) => {
    e.stopPropagation();
    try {
      await authFetch(`/quote-requests/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    } catch (error) {
      alert('Lỗi cập nhật trạng thái: ' + error.message);
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
      <p className="text-sm text-gray-500 mb-8">
        Khách để lại thông tin từ website. Gọi lại để tư vấn và chốt đơn — hệ thống không tự
        trừ kho hay thu tiền.
      </p>

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
                    <button onClick={(e) => handleDelete(r.id, e)} className="text-xs text-gray-400 hover:text-red-600">
                      Xoá
                    </button>
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
                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.variantLabel} · SKU {item.sku}</p>
                      </div>
                      <div className="text-right">
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

              <div className="flex gap-2 pt-2 border-t">
                {['NEW', 'CONTACTED', 'CLOSED'].map((s) => (
                  <button
                    key={s}
                    onClick={(e) => changeStatus(selected.id, s, e)}
                    className={`px-4 py-2 text-xs rounded border ${
                      selected.status === s ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
