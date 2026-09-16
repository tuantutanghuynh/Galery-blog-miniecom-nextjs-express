import { getImageUrl } from '@/lib/utils';
import { apiFetch } from '@/lib/apiClient';
import { renderHtml, excerptFromContent } from '@/lib/markdown';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params; // Next.js 16: params là Promise, bắt buộc phải await

  try {
    const { data: post } = await apiFetch(`/blog/${slug}`, { cache: 'no-store' });
    // Luôn phải có description — nếu cả seoDescription lẫn excerpt đều trống, description
    // trả về null sẽ XOÁ hẳn thẻ <meta name="description">, không phải kế thừa từ layout.
    const description = post.seoDescription || post.excerpt || excerptFromContent(post.content);
    return {
      title: post.seoTitle || post.title,
      description,
      alternates: {
        canonical: `/blog/${slug}`,
      },
      openGraph: {
        title: post.seoTitle || post.title,
        description,
        images: post.coverImageUrl ? [getImageUrl(post.coverImageUrl)] : [],
        type: 'article',
      },
    };
  } catch (error) {
    return {
      title: 'Không tìm thấy bài viết',
    };
  }
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params; // Next.js 16: params là Promise, bắt buộc phải await

  let post;
  try {
    const { data } = await apiFetch(`/blog/${slug}`, { cache: 'no-store' });
    post = data;
  } catch (error) {
    notFound();
  }

  const html = renderHtml(post.content);

  const authorName = post.author?.fullName;

  // Thiếu tên tác giả thì bỏ hẳn field author khỏi structured data — không bịa tên thay thế,
  // vì Google đọc đúng những gì khai ở đây (khai sai còn hại hơn không khai).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    ...(post.author?.fullName && { author: { '@type': 'Person', name: post.author.fullName } }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title }
    ]
  };

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
        Nghĩa Phái Art &amp; Design
      </h3>
      <h1 className="font-serif text-4xl md:text-5xl font-medium leading-tight mb-8">{post.title}</h1>
      <div
        className="font-light leading-relaxed space-y-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-2 [&_a]:text-gomsu-primary"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      {/* Khối tác giả — tín hiệu E-E-A-T cho SEO. Không có tên tác giả thì ẩn cả khối,
          không hiện bio chung chung gắn với một cái tên không có thật. */}
      {authorName && (
        <>
          <hr className="my-12 border-gomsu-border" />
          <div className="bg-gomsu-surface p-8">
            <h3 className="font-serif text-xl font-medium mb-3">Về Tác giả</h3>
            <p className="text-sm leading-relaxed text-gomsu-text-muted">
              <strong className="text-gomsu-text">{authorName}</strong> là nghệ nhân và chuyên gia về Gốm sứ mỹ nghệ với nhiều năm kinh nghiệm nghiên cứu, sáng tác tại làng nghề Bát Tràng. Những bài viết của tác giả mang góc nhìn chuyên sâu về văn hóa, lịch sử và nghệ thuật chế tác gốm sứ truyền thống Việt Nam.
            </p>
          </div>
        </>
      )}
    </article>
  );
}
