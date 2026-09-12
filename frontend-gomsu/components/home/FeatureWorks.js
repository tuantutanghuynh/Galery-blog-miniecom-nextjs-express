import Link from 'next/link';

export default function FeaturedWorks({ items }) {
  return (
    <section className="border-b border-gomsu-border">
      <div className="px-6 py-10 flex items-center justify-between">
        <h2 className="font-serif text-2xl md:text-3xl">Tác phẩm nổi bật</h2>
        <Link href="/gallery" className="text-xs uppercase tracking-widest text-gomsu-primary">
          Xem tất cả &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gomsu-border bg-[#111111]">
        {items.map((item) => (
          <div key={item.id} className="relative border-r border-b border-gomsu-border aspect-square overflow-hidden group bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${item.imageUrl}`}
              alt={item.altText}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
