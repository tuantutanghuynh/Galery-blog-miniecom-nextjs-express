import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full h-[80vh] min-h-[600px] flex items-center border-b border-gomsu-border overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/hero-khong-gian-nghe-thuat.png"
        alt="Không gian trưng bày nghệ thuật gốm sứ đương đại Nghĩa Phái"
        fill
        priority
        className="object-cover object-center scale-[1.02]"
      />
      
      {/* Lớp mờ thật nhẹ (20%) để ảnh hơi tối lại một chút xíu */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

      {/* Nội dung Text */}
      <div className="relative z-10 px-6 w-full max-w-7xl mx-auto">
        <h3 className="font-sans font-bold text-xs uppercase tracking-[0.2em] text-gomsu-primary brightness-125 drop-shadow-md mb-6">
          Bát Tràng Art Atelier
        </h3>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-medium leading-tight max-w-3xl text-white">
          Hơi thở đất
          <br />
          Dáng hình thời gian
        </h1>
        <p className="font-bold text-gray-300 mt-6 max-w-md">
          Nghĩa Phái kết nối tinh hoa gốm sứ Bát Tràng với ngôn ngữ nghệ thuật đương đại, tạo
          nên những giá trị vượt thời gian.
        </p>
        <div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 border border-gomsu-primary/50 text-gomsu-primary hover:bg-gomsu-primary hover:text-black transition-colors uppercase text-xs tracking-widest bg-black/30 backdrop-blur-sm"
          >
            Khám phá nghệ thuật <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
