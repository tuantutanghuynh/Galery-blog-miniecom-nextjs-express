import Image from 'next/image';
import VisualEditorOverlay from '@/components/ui/VisualEditorOverlay';

const STATS = [
  ['10+', 'Năm sáng tác'],
  ['20+', 'Triển lãm quốc tế'],
  ['10+', 'Giải thưởng'],
];

export default function ArtistIntro({ imageUrl }) {
  return (
    <section className="px-6 py-20 border-b border-gomsu-border">
      <div className="page-shell grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Left: Artist Portrait */}
        <div className="relative group w-full aspect-[4/5] md:aspect-[3/4]">
          <VisualEditorOverlay settingKey="homepage_artist" />
          
          <Image
            src={imageUrl}
            alt="Chân dung nghệ sĩ Gốm Bát Tràng"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
          />
          {/* Lớp phủ mờ 4 cạnh (Dày hơn để hòa quyện sâu hơn) */}
          <div className="absolute inset-x-0 top-0 h-32 md:h-56 bg-gradient-to-b from-[#111111] via-[#111111]/70 to-transparent pointer-events-none"></div>
          <div className="absolute inset-x-0 bottom-0 h-32 md:h-56 bg-gradient-to-t from-[#111111] via-[#111111]/70 to-transparent pointer-events-none"></div>
          <div className="absolute inset-y-0 left-0 w-32 md:w-56 bg-gradient-to-r from-[#111111] via-[#111111]/70 to-transparent pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 md:w-56 bg-gradient-to-l from-[#111111] via-[#111111]/70 to-transparent pointer-events-none"></div>
        </div>

        {/* Right: Info & Stats */}
        <div className="flex flex-col justify-center">
          <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
            Nghệ sĩ
          </h3>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-6">
            Artist &ndash; Designer &ndash; Ceramicist
          </h2>
          <p className="font-light text-gomsu-text-muted text-base md:text-lg leading-relaxed mb-12">
            &quot;Sứ mệnh của tôi không chỉ là tạo ra những vật dụng vô tri, mà là thổi hồn vào đất. Tìm kiếm sự cân bằng hoàn mỹ giữa thủ pháp nhào nặn truyền thống hàng trăm năm của Bát Tràng và ngôn ngữ thị giác đương đại, để mỗi tác phẩm đều là một cuộc đối thoại với thời gian.&quot;
          </p>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gomsu-border/50">
            {STATS.map(([number, label]) => (
              <div key={label} className="flex flex-col items-center text-center">
                <p className="font-serif text-3xl md:text-4xl text-gomsu-primary mb-3">{number}</p>
                <p className="text-[10px] md:text-xs text-gomsu-text-muted uppercase tracking-widest leading-relaxed">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
