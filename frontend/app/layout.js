import './globals.css';

export const metadata = {
  title: { default: 'Miniecom Blog', template: '%s | Miniecom Blog' },
  description: 'Chia sẻ kiến thức chăm sóc thú cưng, làm đẹp và đồ gia dụng.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <nav className="p-4 flex gap-4 flex-wrap border-b border-gray-200">
          <a href="/blog" className="hover:underline">Blog</a>
          <a href="/gallery" className="hover:underline">Gallery</a>
        </nav>
        <main className="p-4 max-w-3xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
