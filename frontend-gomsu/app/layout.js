import { Playfair_Display, Montserrat } from 'next/font/google';
import './globals.css';
import Navbar from '../components/layout/Navbar';

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
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
