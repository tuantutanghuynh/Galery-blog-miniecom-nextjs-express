import Image from 'next/image';
import { apiFetch } from '../../lib/apiClient';

export const metadata = { title: 'Gallery' };

export default async function GalleryPage() {
  const { data: items } = await apiFetch('/gallery', { next: { revalidate: 60 } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gallery</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <Image
            key={item.id}
            src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${item.imageUrl}`}
            alt={item.altText}
            width={300}
            height={300}
            className="w-full h-auto object-cover rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
