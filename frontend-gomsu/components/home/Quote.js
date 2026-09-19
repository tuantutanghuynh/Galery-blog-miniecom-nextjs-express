import VisualEditorImage from '@/components/ui/VisualEditorImage';

export default function Quote({ imageUrl }) {
  return (
    <section className="relative px-6 py-32 md:py-40 border-b border-gomsu-border text-center overflow-hidden">
      {/* Background Image managed via Visual Editor */}
      <VisualEditorImage
        settingKey="homepage_quote"
        src={imageUrl}
        alt="Quote pattern background"
        fill
        className="absolute inset-0 w-full h-full"
        imageClassName="object-cover object-center opacity-30 grayscale" // Tweak opacity/filter to match original background style
      />
      
      {/* Lớp phủ làm mờ pattern để texture chìm hẳn xuống nền đen */}
      <div className="absolute inset-0 bg-[#111111]/70 z-[5] pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 text-left pointer-events-none">
        <div className="text-[120px] md:text-[180px] font-serif text-gomsu-text-muted/40 leading-none pt-8 hidden md:block">
          &ldquo;
        </div>
        <div className="flex-1">
          <p className="font-serif text-xl md:text-3xl italic leading-relaxed text-gray-200">
            Đất có ký ức riêng của nó. <br className="hidden md:block" />
            Vai trò của tôi là lắng nghe và tạo hình.
          </p>
          <p className="mt-6 font-serif italic text-2xl md:text-4xl text-gomsu-text-muted text-right pr-8">
            Nguyễn Đức Nghĩa
          </p>
        </div>
      </div>
    </section>
  );
}
