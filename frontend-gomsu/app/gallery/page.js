import Image from 'next/image';
import { apiFetch } from '../../lib/apiClient';
import { BRAND_CATEGORY_SLUG } from '../../lib/brand';

export const metadata = { title: 'Bộ sưu tập' };

export default async function GalleryPage() {
  // cache: 'no-store' vì chưa có cơ chế revalidate on-demand khi admin thêm/xoá ảnh —
  // dùng next.revalidate ở đây sẽ khiến ảnh mới "biến mất tạm thời" tới 60s sau khi thêm
  // (đã tự gặp bug này, xem log buổi 11). Sẽ đổi lại thành ISR đúng khi xây revalidate
  // on-demand (gọi revalidatePath từ 1 Route Handler ngay sau khi admin tạo/xoá thành công).
  const { data: items } = await apiFetch(`/gallery?categorySlug=${BRAND_CATEGORY_SLUG}`, { cache: 'no-store' });

  return (
    <div>
      <div className="px-6 py-16 border-b border-gomsu-border">
        <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
          Tác phẩm nổi bật
        </h3>
        <h1 className="font-serif text-4xl md:text-6xl font-medium leading-tight">
          Bộ sưu tập
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="border-r border-b border-gomsu-border aspect-square">
            <Image
              src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${item.imageUrl}`}
              alt={item.altText}
              width={400}
              height={400}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
