import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nghệ Thuật',
  alternates: { canonical: '/art' },
};

export default function PlaceholderPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-gomsu-primary to-transparent opacity-50 mb-8"></div>
      
      <h1 className="text-4xl md:text-6xl font-serif text-white tracking-widest uppercase mb-6">
        Nghệ Thuật
      </h1>
      
      <p className="text-gomsu-text-muted font-light tracking-widest uppercase text-sm md:text-base max-w-lg leading-relaxed mb-12">
        Khu vực này đang trong quá trình hoàn thiện. <br className="hidden md:block" />
        Vui lòng quay lại sau để thưởng thức những tác phẩm mới nhất.
      </p>

      <Link 
        href="/"
        className="px-8 py-3 border border-white/20 text-white text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500"
      >
        Trở về Trang chủ
      </Link>
    </div>
  );
}
