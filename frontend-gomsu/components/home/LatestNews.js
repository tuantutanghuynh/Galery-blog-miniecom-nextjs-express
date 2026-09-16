import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';

export default function LatestNews({ posts }) {
  return (
    <section>
      <div className="px-6 py-10 flex items-center justify-between">
        <h2 className="font-serif text-2xl md:text-3xl">Tin tức mới nhất</h2>
        <Link href="/blog" className="text-xs uppercase tracking-widest text-gomsu-primary">
          Xem tất cả &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gomsu-border">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="border-r border-b border-gomsu-border p-8 hover:text-gomsu-primary transition-colors block group"
          >
            {post.coverImageUrl && (
              <div className="relative w-full aspect-[4/3] mb-6 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(post.coverImageUrl)}
                  alt={post.title}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            )}
            <h3 className="font-serif text-lg">{post.title}</h3>
            <p className="text-gomsu-text-muted text-sm mt-2 font-light line-clamp-2">
              {post.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
