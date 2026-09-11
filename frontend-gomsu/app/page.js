import { apiFetch } from '../lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '../lib/brand';
import Hero from '../components/home/Hero';
import ArtistIntro from '../components/home/ArtistIntro';
import Quote from '../components/home/Quote';
import FeaturedWorks from '../components/home/FeatureWorks';
import LatestNews from '../components/home/LatestNews';
import ContactSection from '../components/home/ContactSection';
import Footer from '../components/home/Footer';

export const metadata = {
  title: 'Trang chủ',
  description: 'Hơi thở đất - Dáng hình thời gian. Gốm sứ nghệ thuật thủ công Bát Tràng.',
};

export default async function HomePage() {
  const [{ data: galleryItems }, { data: posts }] = await Promise.all([
    apiFetch(`/gallery?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=4`, { cache: 'no-store' }),
    apiFetch(`/blog?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=3`, { cache: 'no-store' }),
  ]);

  return (
    <div>
      <Hero />
      <ArtistIntro />
      <Quote />
      <FeaturedWorks items={galleryItems} />
      <LatestNews posts={posts} />
      <ContactSection />
      <Footer />
    </div>
  );
}
