import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '../lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '../lib/brand';

export const metadata = {
  title: 'Trang chủ',
  description: 'Hơi thở đất - Dáng hình thời gian. Gốm sứ nghệ thuật thủ công Bát Tràng.',
};

export default async function HomePage() {
  const [{ data: galleryItems }, { data: posts }] = await Promise.all([
    apiFetch(`/gallery?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=4`, { cache: 'no-store' }),
    apiFetch(`/blog?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=3`, { cache: 'no-store' }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="px-6 py-20 md:py-32 border-b border-gomsu-border">
        <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-primary mb-6">
          Bát Tràng Art Atelier
        </h3>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-medium leading-tight max-w-3xl">
          Hơi thở đất
          <br />
          Dáng hình thời gian
        </h1>
        <p className="font-light text-gomsu-text-muted mt-6 max-w-md">
          Nghĩa Phái kết nối tinh hoa gốm sứ Bát Tràng với ngôn ngữ nghệ thuật đương đại, tạo
          nên những giá trị vượt thời gian.
        </p>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 border border-gomsu-primary/50 text-gomsu-primary hover:bg-gomsu-primary hover:text-black transition-colors uppercase text-xs tracking-widest"
        >
          Khám phá nghệ thuật <span>&rarr;</span>
        </Link>
      </section>

      {/* Giới thiệu nghệ nhân */}
      <section className="px-6 py-16 border-b border-gomsu-border grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
            Nghệ sĩ
          </h3>
          <h2 className="font-serif text-2xl">Artist &ndash; Designer &ndash; Ceramicist</h2>
          <p className="font-light text-gomsu-text-muted mt-4">
            Tìm kiếm sự cân bằng giữa thủ pháp truyền thống Bát Tràng và ngôn ngữ thị giác
            đương đại.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 md:col-span-2 items-center">
          {[
            ['10+', 'Năm sáng tác'],
            ['20+', 'Triển lãm trong nước & quốc tế'],
            ['10+', 'Giải thưởng nghệ thuật'],
          ].map(([number, label]) => (
            <div key={label} className="border border-gomsu-border p-4 text-center">
              <p className="font-serif text-3xl text-gomsu-primary">{number}</p>
              <p className="text-xs text-gomsu-text-muted mt-2 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="px-6 py-16 border-b border-gomsu-border text-center">
        <p className="font-serif text-xl md:text-3xl italic max-w-2xl mx-auto leading-relaxed">
          &ldquo;Đất có ký ức riêng của nó. Vai trò của tôi là lắng nghe và tạo hình.&rdquo;
        </p>
      </section>

      {/* Tác phẩm nổi bật */}
      <section className="border-b border-gomsu-border">
        <div className="px-6 py-10 flex items-center justify-between">
          <h2 className="font-serif text-2xl md:text-3xl">Tác phẩm nổi bật</h2>
          <Link href="/gallery" className="text-xs uppercase tracking-widest text-gomsu-primary">
            Xem tất cả &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {galleryItems.map((item) => (
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

      {/* Tin tức mới nhất */}
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
              className="border-r border-b border-gomsu-border p-8 hover:text-gomsu-primary transition-colors"
            >
              <h3 className="font-serif text-lg">{post.title}</h3>
              <p className="text-gomsu-text-muted text-sm mt-2 font-light line-clamp-2">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Liên hệ hợp tác */}
      <section className="px-6 py-16 border-b border-gomsu-border">
        <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
          Liên hệ hợp tác
        </h3>
        <h2 className="font-serif text-2xl md:text-3xl max-w-lg">
          Chúng tôi đồng hành cùng bạn kiến tạo những giá trị bền vững từ gốm sứ Bát Tràng.
        </h2>
        <div className="mt-6 flex flex-col gap-2 text-gomsu-text-muted font-light text-sm">
          <p>&#9993; info@nghiaphai.vn</p>
          <p>&#9742; +84 xxx xxx xxx</p>
          <p>&#128205; Bát Tràng, Gia Lâm, Hà Nội</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-xs text-gomsu-text-muted">
        &copy; {new Date().getFullYear()} Nghĩa Phái Art &amp; Design. All rights reserved.
      </footer>
    </div>
  );
}
