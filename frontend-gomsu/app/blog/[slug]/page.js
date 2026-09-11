import { apiFetch } from '../../../lib/apiClient';
import { renderMarkdown, excerptFromContent } from '../../../lib/markdown';
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
      openGraph: {
        title: post.seoTitle || post.title,
        description,
        images: post.coverImageUrl ? [`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${post.coverImageUrl}`] : [],
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

  const html = renderMarkdown(post.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author?.fullName || 'Miniecom' },
  };

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
        Nghĩa Phái Art &amp; Design
      </h3>
      <h1 className="font-serif text-4xl md:text-5xl font-medium leading-tight mb-8">{post.title}</h1>
      <div
        className="font-light leading-relaxed space-y-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-2 [&_a]:text-gomsu-primary"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
