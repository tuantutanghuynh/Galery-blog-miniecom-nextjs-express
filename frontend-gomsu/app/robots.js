export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Trang cá nhân hoá và riêng tư, không có gì đáng lên kết quả tìm kiếm.
      disallow: ['/admin/', '/admin/*', '/auth/', '/auth/*', '/user', '/yeu-cau-tu-van'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
  }
}
