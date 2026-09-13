import Image from 'next/image';

export const metadata = {
  title: 'Về Chúng Tôi | Nghĩa Phái Art',
  description: 'Tiểu sử nghệ sĩ Nguyễn Đức Nghĩa',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gomsu-background pb-32">
      {/* Header Héro */}
      <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/about/nghia-profile.jpg"
            alt="Nguyễn Đức Nghĩa"
            fill
            className="object-cover object-center opacity-30 scale-105"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gomsu-background/40 via-transparent to-gomsu-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 mt-20">
          <p className="font-sans text-gomsu-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-4">Nghệ sĩ Điêu khắc & Gốm</p>
          <h1 className="font-serif text-5xl md:text-8xl text-white tracking-widest mb-6">
            NGUYỄN ĐỨC NGHĨA
          </h1>
          <p className="font-sans text-gray-400 font-light tracking-widest text-lg md:text-xl">
            SINH NĂM 2001
          </p>
        </div>
      </div>

      {/* Thông tin cơ bản */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 -mt-12 relative z-20">
        
        <div className="md:col-span-5 relative">
          <div className="sticky top-32">
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="/images/about/nghia-profile.jpg"
                alt="Chân dung Nguyễn Đức Nghĩa"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
            
            <div className="mt-8 space-y-4 font-sans text-sm font-light text-gray-400 border-l border-gomsu-primary/30 pl-6">
              <p><strong className="text-white font-medium">Năm sinh:</strong> 2001</p>
              <p><strong className="text-white font-medium">Học vấn:</strong> Tốt nghiệp Đại học Mỹ thuật Việt Nam (2020–2025)</p>
              <p><strong className="text-white font-medium">Đoàn thể:</strong> Hội viên Hội Mỹ thuật Việt Nam</p>
              <p><strong className="text-white font-medium">Điện thoại:</strong> 0334.626.393</p>
              <p><strong className="text-white font-medium">Địa chỉ:</strong> Bát Tràng, Gia Lâm, Hà Nội</p>
            </div>
          </div>
        </div>

        {/* Cột Timeline Triển lãm & Giải thưởng */}
        <div className="md:col-span-7 md:pl-10 mt-12 md:mt-0">
          
          <div className="mb-20">
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-12 flex items-center gap-6">
              <span className="w-12 h-[1px] bg-gomsu-primary inline-block"></span>
              Triển lãm chung
            </h2>

            <div className="space-y-12">
              <TimelineItem year="2026">
                <p>Triển lãm festival mỹ thuật trẻ toàn quốc 2026.</p>
              </TimelineItem>

              <TimelineItem year="2025">
                <p>Triển lãm Mỹ thuật Sinh viên.</p>
                <p>Triển lãm &quot;Dăng Tay&quot; – CLB Nghệ sĩ Trẻ.</p>
                <p>Triển lãm Mỹ thuật Thủ đô.</p>
                <p>Triển lãm Tốt nghiệp – Đại học Mỹ thuật Việt Nam.</p>
              </TimelineItem>

              <TimelineItem year="2024">
                <p>Triển lãm Mỹ thuật Sinh viên.</p>
                <p>Triển lãm Workshop Gốm Bát Tràng.</p>
              </TimelineItem>

              <TimelineItem year="2023">
                <p>Triển lãm Mỹ thuật Sinh viên.</p>
                <p>Triển lãm Mỹ thuật Việt Nam.</p>
                <p>Triển lãm 5 năm Điêu khắc Toàn quốc.</p>
              </TimelineItem>

              <TimelineItem year="2022">
                <p>Triển lãm Mỹ thuật Sinh viên.</p>
              </TimelineItem>

              <TimelineItem year="2021">
                <p>Triển lãm Mỹ thuật Sinh viên.</p>
              </TimelineItem>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-12 flex items-center gap-6">
              <span className="w-12 h-[1px] bg-gomsu-primary inline-block"></span>
              Giải thưởng
            </h2>

            <div className="space-y-12">
              <TimelineItem year="2025">
                <p className="text-gomsu-primary font-medium">Giải Ba</p>
                <p className="mb-4">Triển lãm Mỹ thuật Sinh viên.</p>
                
                <p className="text-gomsu-primary font-medium">Sinh viên Tốt nghiệp Tiêu biểu</p>
                <p className="mb-4">Ngành, chuyên ngành Điêu khắc.</p>
                
                <p className="text-gomsu-primary font-medium">Giải thưởng Victor Tardieu</p>
                <p>Tại Bảo tàng Mỹ thuật Việt Nam.</p>
              </TimelineItem>

              <TimelineItem year="2024">
                <p className="text-gomsu-primary font-medium">Giải Khuyến khích</p>
                <p>Triển lãm Mỹ thuật Sinh viên.</p>
              </TimelineItem>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Component dùng chung cho Timeline để tái sử dụng
function TimelineItem({ year, children }) {
  return (
    <div className="relative pl-8 md:pl-0">
      {/* Đường kẻ dọc cho mobile */}
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/10 md:hidden"></div>
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-10 items-start">
        <div className="md:w-32 flex-shrink-0">
          <div className="font-serif text-3xl md:text-4xl text-white/50 tracking-wider">
            {year}
          </div>
        </div>
        <div className="flex-1 font-sans text-gray-300 font-light leading-loose space-y-2 relative pb-8 border-b border-white/5">
          {/* Nút tròn Timeline */}
          <div className="absolute -left-10 md:-left-[2.3rem] top-3 w-4 h-4 rounded-full border border-gomsu-primary bg-gomsu-background hidden md:block"></div>
          {children}
        </div>
      </div>
    </div>
  );
}
