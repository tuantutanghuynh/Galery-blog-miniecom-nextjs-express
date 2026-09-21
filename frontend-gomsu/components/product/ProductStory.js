import Image from 'next/image';

export default function ProductStory({ product }) {
  return (
    <section className="border-t border-gomsu-border py-16 px-6 md:px-12 bg-[#141414]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Story Text */}
        <div className="space-y-6">
          <div className="inline-block px-3 py-1 bg-gomsu-primary/10 border border-gomsu-primary/30 text-gomsu-primary text-[10px] uppercase tracking-[0.2em] font-medium">
            Hồn Đất & Bàn Tay Nghệ Nhân
          </div>
          <h2 className="font-serif text-2xl md:text-4xl text-white font-medium leading-tight">
            Nhiệt độ 1300°C & Vệt men biến ảo tự nhiên
          </h2>
          <div className="text-gomsu-text-muted text-sm leading-relaxed space-y-4">
            <p>
              Tác phẩm <strong className="text-white font-normal">{product.name}</strong> được tác tạo từ đất sét cao lanh tinh khiết của vùng đất Bát Tràng trù phú. Trải qua chu kỳ nung liên tục 36 giờ ở nhiệt độ khắc nghiệt 1300°C, các khoáng chất quý trong men tự do phản ứng hóa học và hòa quyện.
            </p>
            <p>
              Do đặc tính hỏa biến tự nhiên trong lò nung lửa lớn, mỗi vệt men sinh ra đều mang sắc độ và hoa văn chớp sáng độc nhất. Khi sở hữu tác phẩm, quý khách đang nắm giữ một mảnh hồn gốm tinh túy không bao giờ lặp lại 100%.
            </p>
          </div>
          <div className="pt-4 border-t border-[#2a2a2a] flex items-center gap-6">
            <div>
              <p className="font-serif text-2xl text-gomsu-primary">1300°C</p>
              <p className="text-[10px] text-gomsu-text-muted uppercase tracking-widest">Nhiệt độ nung</p>
            </div>
            <div className="w-[1px] h-8 bg-[#2a2a2a]"></div>
            <div>
              <p className="font-serif text-2xl text-gomsu-primary">36 Giờ</p>
              <p className="text-[10px] text-gomsu-text-muted uppercase tracking-widest">Thời gian ủ lò</p>
            </div>
            <div className="w-[1px] h-8 bg-[#2a2a2a]"></div>
            <div>
              <p className="font-serif text-2xl text-gomsu-primary">Bát Tràng</p>
              <p className="text-[10px] text-gomsu-text-muted uppercase tracking-widest">Nguồn gốc</p>
            </div>
          </div>
        </div>

        {/* Story Visual Frame */}
        <div className="relative aspect-4/3 overflow-hidden border border-gomsu-border bg-black/40 group">
          <Image
            src="/images/about/nghia-profile.jpg"
            alt="Nghệ nhân gốm Bát Tràng - Nghĩa Phái"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-xs text-gomsu-text-muted tracking-wide font-sans">
            &ldquo;Mỗi chiếc bình là một cuộc đối thoại thầm lặng giữa lửa, đất và tâm thức của người nghệ nhân.&rdquo;
          </div>
        </div>
      </div>
    </section>
  );
}
