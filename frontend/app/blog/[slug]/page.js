import apiClient from '../../../lib/apiClient';
import { renderMarkdown } from '../../../lib/markdown';

export async function generateMetadata({ params }) {
  const { slug } = await params; // Next.js 16: params là Promise, bắt buộc phải await
  const { data } = await apiClient.get(`/blog/${slug}`);
  const post = data.data;
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.coverImageUrl ? [`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${post.coverImageUrl}`] : [],
      type: 'article',
    },
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params; // Next.js 16: params là Promise, bắt buộc phải await
  const { data } = await apiClient.get(`/blog/${slug}`);
  const post = data.data;
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
    <article className="prose max-w-none">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
