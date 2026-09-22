import type { MetadataRoute } from 'next';
import { apiFetch } from '@/lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';
import type { BlogPost } from '@/types/blog';
import type { Product } from '@/types/product';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Các trang tĩnh
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/san-pham',
    '/gallery',
    '/blog',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Lấy danh sách bài viết từ Backend
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await apiFetch<BlogPost[]>(
      `/blog?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=1000`
    );
    if (res.data) {
      blogRoutes = res.data.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || post.publishedAt || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Lỗi tạo sitemap cho blog', error);
  }

  // Chỉ sản phẩm `active` được liệt kê, vì endpoint công khai không trả về hàng nháp hay đã
  // ngừng bán. Đưa một URL trả 404 vào sitemap là cách nhanh nhất để mất tín nhiệm với Google.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await apiFetch<Product[]>(
      `/products?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=1000`
    );
    if (res.data) {
      productRoutes = res.data.map((product) => ({
        url: `${baseUrl}/san-pham/${product.slug}`,
        lastModified: new Date(product.updatedAt || product.createdAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.9, // cao hơn bài viết: đây là trang sinh ra doanh thu
      }));
    }
  } catch (error) {
    console.error('Lỗi tạo sitemap cho sản phẩm', error);
  }

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
