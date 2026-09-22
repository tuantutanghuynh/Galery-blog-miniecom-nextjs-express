import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import type { GalleryItem } from '@/types/gallery';

interface FeaturedWorksProps {
  items: GalleryItem[];
}

export default function FeaturedWorks({ items }: FeaturedWorksProps) {
  return (
    <section className="border-b border-gomsu-border">
      <div className="page-shell py-10 flex items-center justify-between">
        <h2 className="font-serif text-2xl md:text-3xl">Tác phẩm nổi bật</h2>
        <Link href="/gallery" className="text-xs uppercase tracking-widest text-gomsu-primary">
          Xem tất cả &rarr;
        </Link>
      </div>
      <div className="page-shell grid grid-cols-2 md:grid-cols-4 border-t border-gomsu-border bg-[#111111]">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative border-r border-b border-gomsu-border aspect-square overflow-hidden group bg-black/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(item.imageUrl)}
              alt={item.altText || item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
