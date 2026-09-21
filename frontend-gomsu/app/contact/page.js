import Image from 'next/image';
import { apiFetch } from '@/lib/apiClient';
import ContactForm from '@/components/contact/ContactForm';
import VisualEditorOverlay from '@/components/ui/VisualEditorOverlay';

export default async function ContactPage() {
  let settings = {};

  try {
    const res = await apiFetch('/settings?keys=contact_image', { cache: 'no-store' });
    settings = res?.data || {};
  } catch (error) {
    console.error('Lỗi khi tải cấu hình trang Liên hệ:', error.message);
  }

  const imageUrl = settings.contact_image || '/images/contact-art.jpg';

  return (
    <div className="min-h-screen bg-gomsu-background flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Cột trái: Hình ảnh nghệ thuật với viền mờ */}
          {/* Nút đổi ảnh đặt ngoài lớp edge-fade-mask, nếu không nó bị mask làm mờ theo */}
          <div className="group relative w-full h-[50vh] lg:h-[75vh] flex items-center justify-center">
            <VisualEditorOverlay settingKey="contact_image" />
            <div className="relative w-full h-full edge-fade-mask">
              <Image
                src={imageUrl}
                alt="Nghệ thuật gốm sứ Bát Tràng"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Cột phải: Form liên hệ (Căn chỉnh cân đối) */}
          <ContactForm />

        </div>
      </div>
    </div>
  );
}
