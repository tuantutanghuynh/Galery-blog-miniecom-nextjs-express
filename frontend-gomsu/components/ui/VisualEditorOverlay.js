'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, authFetch } from '@/lib/adminAuth';

export default function VisualEditorOverlay({ settingKey }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Silent check to verify if token is actually valid and user is admin
    // We don't use authFetch here because we don't want to redirect public users to /admin/login if token is expired
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data?.data?.role === 'admin') {
          setIsAdmin(true);
        } else {
          // It's a customer token or invalid token, ignore
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadRes = await authFetch('/uploads/image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.error && uploadRes.data?.url) {
        const patchRes = await authFetch('/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: { [settingKey]: uploadRes.data.url }
          })
        });
        if (patchRes.error) throw new Error(patchRes.error.message);
        router.refresh();
      } else {
        throw new Error(uploadRes.error?.message || 'Tải ảnh thất bại');
      }
    } catch (err) {
      alert('Lỗi cập nhật ảnh: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
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
