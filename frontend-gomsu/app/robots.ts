import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Trang cá nhân hoá và riêng tư, không có gì đáng lên kết quả tìm kiếm.
      disallow: ['/admin/', '/admin/*', '/auth/', '/auth/*', '/user', '/yeu-cau-tu-van'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
