import { Playfair_Display, Montserrat } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/lib/useAuth';
import { QuoteListProvider } from '@/lib/useQuoteList';

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://galery-blog-miniecom-nextjs-express.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nghĩa Phái Art & Design',
    description: 'Gốm sứ nghệ thuật Bát Tràng',
    url: '/',
    siteName: 'Nghĩa Phái',
    locale: 'vi_VN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }) {
  // Tổ chức (LocalBusiness Schema - Tối ưu cho AI-SEO)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Nghĩa Phái Art & Design',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://galery-blog-miniecom-nextjs-express.vercel.app',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://galery-blog-miniecom-nextjs-express.vercel.app'}/images/logo-nghia-phai-gom-su-bat-trang-v2.png`,
    image: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://galery-blog-miniecom-nextjs-express.vercel.app'}/images/about/nghia-profile.jpg`,
    description: 'Không gian gốm sứ nghệ thuật Bát Tràng thủ công cao cấp. Khám phá vẻ đẹp truyền thống và đương đại.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Bát Tràng',
      addressLocality: 'Gia Lâm',
      addressRegion: 'Hà Nội',
      postalCode: '100000',
      addressCountry: 'VN'
    },
    telephone: '+84-334-626-393',
    priceRange: '$$$',
    areaServed: ['Hà Nội', 'Vietnam'],
    knowsAbout: ['Pottery', 'Ceramics', 'Handmade Art', 'Gốm sứ', 'Nghệ thuật Bát Tràng'],
  };

  return (
    <html lang="vi" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className="font-sans bg-gomsu-background text-gomsu-text antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <QuoteListProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </QuoteListProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
