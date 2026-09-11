import Image from 'next/image';
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
      <div className="grid grid-cols-2 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="border-r border-b border-gomsu-border aspect-square">
            <Image
              src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${item.imageUrl}`}
              alt={item.altText}
              width={400}
              height={400}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
