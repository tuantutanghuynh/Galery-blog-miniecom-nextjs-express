import { apiFetch } from '../lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '../lib/brand';

const SITE_URL = 'https://miniecom-blog.vercel.app'; // TODO: thay domain thật ở Buổi 16

export default async function sitemap() {
  // Lọc theo BRAND_CATEGORY_SLUG — nếu không, sitemap của Gốm sứ sẽ lẫn cả bài viết
  // của Petshop hoặc bài không gắn category nào (backend dùng chung DB cho cả 2 clone).
  const { data: posts } = await apiFetch(
    `/blog?pageSize=50&categorySlug=${BRAND_CATEGORY_SLUG}`,
    { cache: 'no-store' }
  );

  const staticUrls = [
    { url: `${SITE_URL}/`, lastModified: new Date() },
    { url: `${SITE_URL}/blog`, lastModified: new Date() },
    { url: `${SITE_URL}/gallery`, lastModified: new Date() },
  ];

  const postUrls = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
  }));

  return [...staticUrls, ...postUrls];
}
