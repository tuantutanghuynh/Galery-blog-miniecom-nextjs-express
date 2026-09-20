'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/useAuth';

const navLinks = [
  { name: 'Trang chủ', path: '/' },
  // { name: 'Nghệ thuật', path: '/art' },
  // { name: 'Xưởng sản xuất', path: '/workshop' },
  { name: 'Sản phẩm', path: '/san-pham' },
  { name: 'Bộ sưu tập', path: '/gallery' },
  // { name: 'Dự án', path: '/projects' },
  { name: 'Tin tức', path: '/blog' },
  { name: 'Về chúng tôi', path: '/about' },
  { name: 'Liên hệ', path: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="relative z-50 bg-gomsu-background flex items-center justify-between px-6 py-5 border-b border-gomsu-border">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
        <Image
          src="/images/logo-nghia-phai-gom-su-bat-trang-v2.png"
          alt="Logo Nghĩa Phái - Gốm sứ thủ công Bát Tràng"
          width={44}
          height={44}
          className="object-contain"
          priority
        />
        <div className="flex flex-col justify-center">
          <span className="font-serif text-2xl tracking-wide text-gomsu-primary leading-none mb-1">Nghĩa Phái</span>
          <span className="font-sans text-[10px] uppercase tracking-widest text-gomsu-text-muted leading-none">Hơi thở Bát Tràng</span>
        </div>
      </Link>

      {/* Main Nav (Hidden on small screens) */}
      <div className="hidden lg:flex items-center gap-10">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            className="text-xs font-medium uppercase tracking-[0.2em] text-gomsu-text-muted hover:text-gomsu-primary transition-colors whitespace-nowrap"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 text-xs font-sans text-gomsu-text-muted tracking-widest">
          <span className="text-gomsu-primary">VI</span>
          <span>/</span>
          <span className="hover:text-gomsu-primary cursor-pointer transition-colors">EN</span>
        </div>

        {/* Auth buttons */}
        {user ? (
          <div className="hidden md:flex items-center gap-4">
            <span className="text-xs text-gomsu-text-muted">{user.fullName || user.email}</span>
            <button
              onClick={logout}
              className="text-xs uppercase tracking-widest text-gomsu-primary hover:text-gomsu-text transition-colors"
            >
              Thoát
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="text-xs uppercase tracking-widest text-gomsu-text-muted hover:text-gomsu-primary transition-colors">
              Đăng nhập
            </Link>
            <Link href="/auth/register" className="text-xs uppercase tracking-widest border border-gomsu-primary text-gomsu-primary px-3 py-1.5 hover:bg-gomsu-primary hover:text-black transition-colors">
              Đăng ký
            </Link>
          </div>
        )}

        {/* Hamburger Icon — chỉ hiện trên mobile/tablet (lg:hidden) */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex lg:hidden flex-col gap-[5px] p-2"
          aria-label="Menu"
          aria-expanded={isOpen}
        >
          <span
            className={`w-6 h-[1px] bg-gomsu-text transition-transform ${
              isOpen ? 'rotate-45 translate-y-[6px]' : ''
            }`}
          ></span>
          <span className={`w-6 h-[1px] bg-gomsu-text transition-opacity ${isOpen ? 'opacity-0' : ''}`}></span>
          <span
            className={`w-6 h-[1px] bg-gomsu-text transition-transform ${
              isOpen ? '-rotate-45 -translate-y-[6px]' : ''
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-gomsu-background border-b border-gomsu-border flex flex-col shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              onClick={() => setIsOpen(false)}
              className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-gomsu-text-muted hover:text-gomsu-primary border-b border-gomsu-border"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
