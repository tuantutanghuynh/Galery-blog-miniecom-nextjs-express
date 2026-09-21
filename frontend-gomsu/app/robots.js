export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Trang cá nhân hoá và riêng tư. Nặng nhất là /dat-hang-thanh-cong — nó hiển thị họ
      // tên, số điện thoại và địa chỉ khách, lọt lên Google là rò rỉ dữ liệu cá nhân.
      disallow: [
        '/admin/', '/admin/*',
        '/auth/', '/auth/*',
        '/user',
        '/gio-hang',
        '/thanh-toan',
        '/dat-hang-thanh-cong/', '/dat-hang-thanh-cong/*',
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
  }
}
