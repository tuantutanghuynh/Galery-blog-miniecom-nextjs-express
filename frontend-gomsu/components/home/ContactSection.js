export default function ContactSection() {
  return (
    <section className="px-6 py-16 border-b border-gomsu-border">
      <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">
        Liên hệ hợp tác
      </h3>
      <h2 className="font-serif text-2xl md:text-3xl max-w-lg">
        Chúng tôi đồng hành cùng bạn kiến tạo những giá trị bền vững từ gốm sứ Bát Tràng.
      </h2>
      <div className="mt-6 flex flex-col gap-2 text-gomsu-text-muted font-light text-sm">
        <p>&#9993; info@nghiaphai.vn</p>
        <p>&#9742; +84 xxx xxx xxx</p>
        <p>&#128205; Bát Tràng, Gia Lâm, Hà Nội</p>
      </div>
    </section>
  );
}
