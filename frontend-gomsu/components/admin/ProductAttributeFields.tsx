'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/adminAuth';
import type { CategoryAttribute } from '@/types/category';

interface ProductAttributeFieldsProps {
  categoryId?: string | null;
  values?: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

// Ô nhập thông số riêng của sản phẩm. Danh sách ô phụ thuộc danh mục đang chọn, nên đổi
// danh mục là bộ ô đổi theo. Giá trị lưu vào cột JSON `attributes` theo attributeKey.
export default function ProductAttributeFields({
  categoryId,
  values = {},
  onChange,
}: ProductAttributeFieldsProps) {
  const [defs, setDefs] = useState<CategoryAttribute[]>([]);

  useEffect(() => {
    if (!categoryId) {
      setDefs([]);
      return;
    }
    authFetch<CategoryAttribute[]>(`/categories/${categoryId}/attributes`)
      .then((res) => setDefs(res.data || []))
      .catch(() => setDefs([]));
  }, [categoryId]);

  if (!categoryId) return null;

  if (defs.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded p-4 text-sm text-gray-500">
        Danh mục này chưa khai thông số nào. Vào <strong>Danh mục</strong> để thêm (vd: Chiều
        cao, Khối lượng, Nhiệt độ nung) — khai xong thì các ô nhập sẽ hiện ở đây.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {defs.map((def) => (
        <div key={def.id} className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-gray-500">
            {def.attributeLabel}
          </label>
          <input
            type={def.attributeType === 'number' ? 'number' : 'text'}
            value={(values[def.attributeKey] as string | number) ?? ''}
            onChange={(e) => onChange({ ...values, [def.attributeKey]: e.target.value })}
            placeholder="Để trống thì không hiện trên trang"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
