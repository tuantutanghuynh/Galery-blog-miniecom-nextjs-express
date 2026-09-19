'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getToken, authFetch } from '@/lib/adminAuth';

export default function VisualEditorImage({
  settingKey,
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  className = '',
  imageClassName = '',
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (token) setIsAdmin(true);
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadRes = await authFetch('/uploads', {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.success) {
        await authFetch('/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: { [settingKey]: uploadRes.data.url }
          })
        });
        router.refresh();
      }
    } catch (err) {
      alert('Lỗi cập nhật ảnh: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Nếu className truyền vào có absolute, fixed, block... thì không tự ép relative
  const wrapperClass = className.includes('absolute') || className.includes('fixed') 
    ? `group ${className}` 
    : `relative group ${className}`;

  return (
    <div className={wrapperClass}>
      <Image 
        src={src} 
        alt={alt} 
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={imageClassName} 
      />

      {isAdmin && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto z-50">
          <button
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="px-4 py-2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-md rounded-md uppercase tracking-widest text-xs font-bold transition-all shadow-xl"
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
      )}
    </div>
  );
}
