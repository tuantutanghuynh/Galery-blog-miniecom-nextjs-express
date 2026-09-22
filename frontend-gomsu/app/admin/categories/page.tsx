'use client';
import React, { useEffect, useState } from 'react';
import CategoryAttributes from '@/components/admin/CategoryAttributes';
import { authFetch } from '@/lib/adminAuth';
import { apiFetch } from '@/lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';
import { slugify } from '@/lib/slugify';
import { Category } from '@/types/category';

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
}

export default function AdminCategoriesPage() {
  const [brand, setBrand] = useState<Category | null>(null);
  const [children, setChildren] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>({ name: '', slug: '', description: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function loadCategories() {
    apiFetch<Category[]>('/categories').then((res) => {
      const categories = res.data || [];
      const brandCategory = categories.find((c) => c.slug === BRAND_CATEGORY_SLUG);
      setBrand(brandCategory || null);
      setChildren(categories.filter((c) => c.parentId === brandCategory?.id));
    });
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!brand) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await authFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({ ...form, parentId: brand.id }),
      });
      setForm({ name: '', slug: '', description: '' });
      setSlugTouched(false);
      loadCategories();
    } catch {
      setErrorMsg('Lỗi khi tạo danh mục (có thể trùng slug).');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Danh mục</h1>
      <p className="text-sm text-gray-500 mb-6">
        Thuộc thương hiệu: <strong>{brand?.name || 'Đang tải...'}</strong>
      </p>

      <ul className="divide-y divide-gray-200 border border-gray-200 rounded mb-8 bg-white">
        {children.map((c) => (
          <li key={c.id} className="px-4 py-3">
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-gray-500">/{c.slug}</p>
            {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
            <CategoryAttributes categoryId={c.id} />
          </li>
        ))}
        {children.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-500">Chưa có danh mục con nào.</li>
        )}
      </ul>

      <h2 className="text-lg font-semibold mb-3">+ Thêm danh mục con</h2>
      {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required placeholder="Tên danh mục (vd: Chén trà)" value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
          }}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          required placeholder="Slug (vd: chen-tra)" value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((f) => ({ ...f, slug: e.target.value }));
          }}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          placeholder="Mô tả (không bắt buộc)" value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit" disabled={submitting || !brand}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50 self-start"
        >
          {submitting ? 'Đang lưu...' : 'Tạo danh mục'}
        </button>
      </form>
    </div>
  );
}
