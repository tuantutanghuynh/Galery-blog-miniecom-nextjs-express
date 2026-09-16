'use client';
import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/adminAuth';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null); // Để hiển thị modal chi tiết

  const loadContacts = async () => {
    try {
      const res = await authFetch('/contact/admin/list?pageSize=50');
      setContacts(res.data);
    } catch (error) {
      console.error(error);
      alert('Không thể tải danh sách liên hệ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await authFetch(`/contact/admin/${id}/read`, { method: 'PATCH' });
      setContacts(contacts.map(c => c.id === id ? { ...c, isRead: true } : c));
    } catch (error) {
      alert('Lỗi đánh dấu đã đọc');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xoá tin nhắn này?')) return;
    try {
      await authFetch(`/contact/admin/${id}`, { method: 'DELETE' });
      setContacts(contacts.filter(c => c.id !== id));
      if (selectedContact?.id === id) setSelectedContact(null);
    } catch (error) {
      alert('Lỗi khi xoá');
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-serif">Tin nhắn Khách hàng</h1>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium">Khách hàng</th>
              <th className="px-6 py-4 font-medium">Chủ đề</th>
              <th className="px-6 py-4 font-medium">Ngày gửi</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Chưa có tin nhắn nào.</td></tr>
            ) : contacts.map(c => (
              <tr 
                key={c.id} 
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${!c.isRead ? 'bg-blue-50/30' : ''}`}
                onClick={() => {
                  setSelectedContact(c);
                  if (!c.isRead) handleMarkAsRead(c.id, { stopPropagation: () => {} });
                }}
              >
                <td className="px-6 py-4">
                  {!c.isRead ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Mới
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Đã đọc
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className={`font-medium ${!c.isRead ? 'text-black' : 'text-gray-900'}`}>{c.name}</div>
                  <div className="text-gray-500 text-xs mt-1">{c.email}</div>
                  {c.phone && <div className="text-gray-500 text-xs">{c.phone}</div>}
                </td>
                <td className="px-6 py-4 text-gray-700 max-w-xs truncate">
                  {c.subject || 'Không có chủ đề'}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString('vi-VN', {
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={(e) => handleDelete(c.id, e)}
                    className="text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal chi tiết tin nhắn */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button 
              onClick={() => setSelectedContact(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black"
            >
              ✕
            </button>
            <h2 className="text-2xl font-serif mb-6 border-b pb-4">Chi tiết tin nhắn</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Người gửi</p>
                <p className="font-medium">{selectedContact.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Email</p>
                <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline">{selectedContact.email}</a>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Số điện thoại</p>
                <a href={`tel:${selectedContact.phone}`} className="text-blue-600 hover:underline">{selectedContact.phone || 'N/A'}</a>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Ngày gửi</p>
                <p>{new Date(selectedContact.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border">
              <p className="font-medium mb-3 pb-3 border-b">{selectedContact.subject || 'Không có chủ đề'}</p>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {selectedContact.message}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={(e) => handleDelete(selectedContact.id, e)}
                className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50"
              >
                Xóa tin nhắn này
              </button>
              <button 
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
