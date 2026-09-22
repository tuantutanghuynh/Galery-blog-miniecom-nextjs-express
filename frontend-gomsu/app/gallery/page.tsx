import { Metadata } from 'next';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '@/lib/brand';
import { Category } from '@/types/category';
import { GalleryItem } from '@/types/gallery';

export const metadata: Metadata = { 
  title: 'Bộ sưu tập',
  alternates: {
    canonical: '/gallery',
  },
};

interface GalleryPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const { category: selectedSlug } = await searchParams;

  let categories: Category[] = [];
  let items: GalleryItem[] = [];
  let subCategories: Category[] = [];

  try {
    const catRes = await apiFetch<Category[]>('/categories', { cache: 'no-store' });
    categories = catRes.data || [];
    const brand = categories.find((c) => c.slug === BRAND_CATEGORY_SLUG);
    subCategories = categories.filter((c) => c.parentId === brand?.id);

    const activeSlug = selectedSlug || BRAND_CATEGORY_SLUG;
    const itemsRes = await apiFetch<GalleryItem[]>(`/gallery?categorySlug=${activeSlug}`, { cache: 'no-store' });
    items = itemsRes.data || [];
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Lỗi tải gallery:', msg);
  }

  return (
    <div>
      <div className="page-shell py-16 border-b border-gomsu-border">
        <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
          Tác phẩm nổi bật
        </h3>
        <h1 className="font-serif text-4xl md:text-6xl font-medium leading-tight">
          Bộ sưu tập
        </h1>
      </div>

      <div className="page-shell flex gap-6 py-6 border-b border-gomsu-border overflow-x-auto">
        <Link
          href="/gallery"
          className={`text-xs uppercase tracking-widest whitespace-nowrap ${
            !selectedSlug ? 'text-gomsu-primary' : 'text-gomsu-text-muted hover:text-gomsu-primary'
          }`}
        >
          Tất cả
        </Link>
        {subCategories.map((c) => (
          <Link
            key={c.id}
            href={`/gallery?category=${c.slug}`}
            className={`text-xs uppercase tracking-widest whitespace-nowrap ${
              selectedSlug === c.slug ? 'text-gomsu-primary' : 'text-gomsu-text-muted hover:text-gomsu-primary'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="page-shell grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="border-r border-b border-gomsu-border aspect-square overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(item.imageUrl)}
              alt={item.altText || ''}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
