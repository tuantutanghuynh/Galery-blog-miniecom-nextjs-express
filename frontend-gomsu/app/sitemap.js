import { apiFetch } from '@/lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Các trang tĩnh
  const staticRoutes = [
    '',
    '/about',
    '/gallery',
    '/blog',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  // Lấy danh sách bài viết từ Backend
  let blogRoutes = [];
  try {
    const res = await apiFetch(`/blog?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=1000`);
    if (res.data) {
      blogRoutes = res.data.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || post.publishedAt || new Date()),
        changeFrequency: 'daily',
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Lỗi tạo sitemap cho blog', error);
  }

  return [...staticRoutes, ...blogRoutes];
}
