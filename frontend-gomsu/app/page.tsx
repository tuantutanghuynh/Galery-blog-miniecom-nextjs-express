import type { Metadata } from 'next';
import { apiFetch } from '@/lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';
import Hero from '@/components/home/Hero';
import ArtistIntro from '@/components/home/ArtistIntro';
import Quote from '@/components/home/Quote';
import FeaturedWorks from '@/components/home/FeatureWorks';
import LatestNews from '@/components/home/LatestNews';
import ContactSection from '@/components/home/ContactSection';
import Footer from '@/components/home/Footer';
import type { GalleryItem } from '@/types/gallery';
import type { BlogPost } from '@/types/blog';
import type { ShopSettings } from '@/types/setting';

export const metadata: Metadata = {
  title: 'Trang chủ',
  description: 'Hơi thở đất - Dáng hình thời gian. Gốm sứ nghệ thuật thủ công Bát Tràng.',
};

export default async function HomePage() {
  let galleryItems: GalleryItem[] = [];
  let posts: BlogPost[] = [];
  let settings: ShopSettings = {};

  try {
    const [galleryRes, postsRes, settingsRes] = await Promise.all([
      apiFetch<GalleryItem[]>(`/gallery?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=8`, {
        cache: 'no-store',
      }),
      apiFetch<BlogPost[]>(`/blog?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=6`, {
        cache: 'no-store',
      }),
      apiFetch<ShopSettings>(
        `/settings?keys=homepage_hero,homepage_artist,homepage_quote`,
        { cache: 'no-store' }
      ),
    ]);
    galleryItems = galleryRes.data || [];
    posts = postsRes.data || [];
    settings = settingsRes?.data || {};
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Lỗi khi tải dữ liệu trang chủ:', msg);
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
