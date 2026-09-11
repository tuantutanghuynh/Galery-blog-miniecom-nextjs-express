const STATS = [
  ['10+', 'Năm sáng tác'],
  ['20+', 'Triển lãm trong nước & quốc tế'],
  ['10+', 'Giải thưởng nghệ thuật'],
];

export default function ArtistIntro() {
  return (
    <section className="px-6 py-16 border-b border-gomsu-border grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
          Nghệ sĩ
        </h3>
        <h2 className="font-serif text-2xl">Artist &ndash; Designer &ndash; Ceramicist</h2>
        <p className="font-light text-gomsu-text-muted mt-4">
          Tìm kiếm sự cân bằng giữa thủ pháp truyền thống Bát Tràng và ngôn ngữ thị giác
          đương đại.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 md:col-span-2 items-center">
        {STATS.map(([number, label]) => (
          <div key={label} className="border border-gomsu-border p-4 text-center">
            <p className="font-serif text-3xl text-gomsu-primary">{number}</p>
            <p className="text-xs text-gomsu-text-muted mt-2 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
