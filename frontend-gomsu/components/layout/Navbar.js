'use client';

import { useState } from 'react';
import Link from 'next/link';

const navLinks = [
  { name: 'Trang chủ', path: '/' },
  { name: 'Nghệ thuật', path: '#' },
  { name: 'Xưởng sản xuất', path: '#' },
  { name: 'Bộ sưu tập', path: '/gallery' },
  { name: 'Dự án', path: '#' },
  { name: 'Tin tức', path: '/blog' },
  { name: 'Về chúng tôi', path: '#' },
  { name: 'Liên hệ', path: '#' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative flex items-center justify-between px-6 py-5 border-b border-gomsu-border">
      {/* Logo */}
      <Link href="/" className="flex flex-col" onClick={() => setIsOpen(false)}>
        <span className="font-serif text-2xl tracking-wide text-gomsu-primary">Nghĩa Phái</span>
        <span className="font-sans text-[10px] uppercase tracking-widest text-gomsu-text-muted">Hơi thở Bát Tràng</span>
      </Link>

      {/* Main Nav (Hidden on small screens) */}
      <div className="hidden lg:flex items-center gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            className="text-[10px] uppercase tracking-[0.2em] text-gomsu-text-muted hover:text-gomsu-primary transition-colors whitespace-nowrap"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex gap-2 text-xs font-sans text-gomsu-text-muted tracking-widest">
          <span className="text-gomsu-primary">VI</span>
          <span>/</span>
          <span className="hover:text-gomsu-primary cursor-pointer transition-colors">EN</span>
        </div>

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
        <div className="lg:hidden absolute top-full left-0 right-0 bg-gomsu-background border-b border-gomsu-border flex flex-col">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              onClick={() => setIsOpen(false)}
              className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-gomsu-text-muted hover:text-gomsu-primary border-b border-gomsu-border last:border-b-0"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
