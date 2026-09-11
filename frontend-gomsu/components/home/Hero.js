import Link from 'next/link';

export default function Hero() {
  return (
    <section className="px-6 py-20 md:py-32 border-b border-gomsu-border">
      <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-primary mb-6">
        Bát Tràng Art Atelier
      </h3>
      <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-medium leading-tight max-w-3xl">
        Hơi thở đất
        <br />
        Dáng hình thời gian
      </h1>
      <p className="font-light text-gomsu-text-muted mt-6 max-w-md">
        Nghĩa Phái kết nối tinh hoa gốm sứ Bát Tràng với ngôn ngữ nghệ thuật đương đại, tạo
        nên những giá trị vượt thời gian.
      </p>
      <Link
        href="/gallery"
        className="inline-flex items-center gap-2 mt-8 px-6 py-3 border border-gomsu-primary/50 text-gomsu-primary hover:bg-gomsu-primary hover:text-black transition-colors uppercase text-xs tracking-widest"
      >
        Khám phá nghệ thuật <span>&rarr;</span>
      </Link>
    </section>
  );
}
