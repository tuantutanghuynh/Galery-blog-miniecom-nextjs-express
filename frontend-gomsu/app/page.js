import { apiFetch } from '@/lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';
import Hero from '@/components/home/Hero';
import ArtistIntro from '@/components/home/ArtistIntro';
import Quote from '@/components/home/Quote';
import FeaturedWorks from '@/components/home/FeatureWorks';
import LatestNews from '@/components/home/LatestNews';
import ContactSection from '@/components/home/ContactSection';
import Footer from '@/components/home/Footer';

export const metadata = {
  title: 'Trang chủ',
  description: 'Hơi thở đất - Dáng hình thời gian. Gốm sứ nghệ thuật thủ công Bát Tràng.',
};

export default async function HomePage() {
  let galleryItems = [];
  let posts = [];
  let settings = {};

  try {
    const [galleryRes, postsRes, settingsRes] = await Promise.all([
      apiFetch(`/gallery?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=8`, { cache: 'no-store' }),
      apiFetch(`/blog?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=6`, { cache: 'no-store' }),
      apiFetch(`/settings?keys=homepage_hero,homepage_artist,homepage_quote`, { cache: 'no-store' })
    ]);
    galleryItems = galleryRes.data || [];
    posts = postsRes.data || [];
    settings = settingsRes?.data || {};
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu trang chủ:', error.message);
  }

  return (
    <div>
      <Hero imageUrl={settings.homepage_hero || '/images/hero-khong-gian-nghe-thuat.png'} />
      <ArtistIntro imageUrl={settings.homepage_artist || '/images/artist-portrait.jpg'} />
      <Quote imageUrl={settings.homepage_quote || '/images/quote-pattern.png'} />
      <FeaturedWorks items={galleryItems} />
      <LatestNews posts={posts} />
      <ContactSection />
      <Footer />
    </div>
  );
}
