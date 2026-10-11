/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // Địa chỉ .vercel.app cũ vẫn trả nguyên site, thành bản sao cạnh tranh với tên miền thật trên
  // Google. Chuyển hẳn (308) về www.nghiaphai.com, giữ nguyên đường dẫn. Chỉ khớp đúng tên miền
  // production này: các bản preview của Vercel (tên khác) vẫn mở được để duyệt trước khi merge.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'galery-blog-miniecom-nextjs-express.vercel.app' }],
        destination: 'https://www.nghiaphai.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
