'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/adminAuth';
import { useAuth } from '@/lib/useAuth';

interface VisualEditorOverlayProps {
  settingKey: string;
}

export default function VisualEditorOverlay({ settingKey }: VisualEditorOverlayProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await authFetch<{ url: string }>('/uploads/image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.error && uploadRes.data?.url) {
        const patchRes = await authFetch('/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: { [settingKey]: uploadRes.data.url },
          }),
        });
        if (patchRes.error) throw new Error(patchRes.error.message);
        router.refresh();
      } else {
        throw new Error(uploadRes.error?.message || 'Tải ảnh thất bại');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi cập nhật ảnh';
      alert('Lỗi cập nhật ảnh: ' + errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          fileInputRef.current?.click();
        }}
        disabled={isUploading}
        className="px-4 py-2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-md rounded-md uppercase tracking-widest text-xs font-bold transition-all shadow-xl border border-white/20"
      >
        {isUploading ? 'ĐANG TẢI...' : '✏️ ĐỔI ẢNH'}
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
