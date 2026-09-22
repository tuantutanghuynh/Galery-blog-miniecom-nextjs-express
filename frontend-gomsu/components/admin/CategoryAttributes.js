'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/adminAuth';

// Khai những thông số mà sản phẩm trong danh mục này cần có. Giá trị cụ thể được điền ở
// từng sản phẩm, còn đây chỉ định nghĩa "danh mục này có những ô nào".
export default function CategoryAttributes({ categoryId }) {
  const [rows, setRows] = useState([]);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch(`/categories/${categoryId}/attributes`)
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]));
  }, [categoryId]);

  async function add(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await authFetch(`/categories/${categoryId}/attributes`, {
        method: 'POST',
        body: JSON.stringify({ attributeLabel: label, attributeType: type }),
      });
      setRows((prev) => [...prev, res.data].sort((a, b) => a.attributeLabel.localeCompare(b.attributeLabel)));
      setLabel('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id, name) {
    if (!confirm(`Xoá thông số "${name}"? Giá trị đã nhập ở các sản phẩm vẫn được giữ, chỉ thôi hiển thị.`)) return;
    try {
      await authFetch(`/categories/${categoryId}/attributes/${id}`, { method: 'DELETE' });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert('Lỗi khi xoá: ' + err.message);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Thông số của danh mục này</p>

      {rows.length > 0 ? (
        <ul className="flex flex-wrap gap-2 mb-3">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2 bg-gray-100 rounded px-2.5 py-1 text-xs">
              <span>{r.attributeLabel}</span>
              <span className="text-gray-400">{r.attributeType === 'number' ? 'số' : 'chữ'}</span>
              <button onClick={() => remove(r.id, r.attributeLabel)} className="text-gray-400 hover:text-red-600" aria-label="Xoá">
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 mb-3">
          Chưa khai thông số nào. Sản phẩm trong danh mục này sẽ không có bảng thông số riêng.
        </p>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <form onSubmit={add} className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Tên thông số (vd: Chiều cao)"
          className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
          <option value="text">Chữ</option>
          <option value="number">Số</option>
        </select>
        <button type="submit" disabled={busy} className="bg-gray-800 text-white rounded px-4 py-1.5 text-sm disabled:opacity-50">
          Thêm
        </button>
      </form>
    </div>
  );
}
