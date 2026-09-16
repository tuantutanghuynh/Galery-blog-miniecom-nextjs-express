import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';

export const metadata = { 
  title: 'Blog Kiến thức',
  alternates: {
    canonical: '/blog',
  },
};

export default async function BlogListPage() {
  // cache: 'no-store' vì chưa có cơ chế revalidate on-demand khi admin publish bài —
  // dùng next.revalidate sẽ khiến bài mới publish "biến mất tạm thời" tới 60s (đã tự
  // gặp bug này với /gallery, xem log buổi 11). Đổi lại thành ISR đúng khi xây revalidate
  // on-demand (gọi revalidatePath từ 1 Route Handler ngay sau khi admin publish).
  let posts = [];
  try {
    const res = await apiFetch(`/blog?categorySlug=${BRAND_CATEGORY_SLUG}`, { cache: 'no-store' });
    posts = res.data || [];
  } catch (error) {
    console.error('Lỗi tải blog:', error.message);
  }

  return (
    <div>
      <div className="px-6 py-16 border-b border-gomsu-border">
        <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
          Tin tức &amp; Câu chuyện
        </h3>
        <h1 className="font-serif text-4xl md:text-6xl font-medium leading-tight">
          Ghi chép từ xưởng gốm
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="border-r border-b border-gomsu-border p-8 flex flex-col gap-4"
          >
            {post.coverImageUrl && (
              <Link href={`/blog/${post.slug}`} className="relative w-full aspect-[4/3] mb-2 overflow-hidden group block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(post.coverImageUrl)}
                  alt={post.title}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
              </Link>
            )}
            <div>
              <h2 className="font-serif text-2xl">
                <Link href={`/blog/${post.slug}`} className="hover:text-gomsu-primary transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gomsu-text-muted mt-2 font-light">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 mt-4 text-xs uppercase tracking-widest text-gomsu-primary"
              >
                Xem chi tiết <span>&rarr;</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
