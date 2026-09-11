import { Playfair_Display, Montserrat } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['vietnamese'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  title: { default: 'Nghĩa Phái Art & Design', template: '%s | Nghĩa Phái' },
  description: 'Hơi thở đất - Dáng hình thời gian. Gốm sứ nghệ thuật Bát Tràng.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className="font-sans bg-gomsu-background text-gomsu-text antialiased">
        <nav className="flex gap-8 flex-wrap items-center px-6 py-5 border-b border-gomsu-border">
          <a
            href="/blog"
            className="text-xs uppercase tracking-[0.2em] text-gomsu-text-muted hover:text-gomsu-primary transition-colors"
          >
            Tin tức
          </a>
          <a
            href="/gallery"
            className="text-xs uppercase tracking-[0.2em] text-gomsu-text-muted hover:text-gomsu-primary transition-colors"
          >
            Bộ sưu tập
          </a>
        </nav>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
