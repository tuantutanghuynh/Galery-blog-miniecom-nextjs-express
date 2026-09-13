export default function ContactSection() {
  return (
    <section className="px-6 py-20 lg:py-32 border-b border-gomsu-border bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Cột 1: Thông điệp chính (Chiếm 5/12) */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-primary mb-6">
              Liên hệ hợp tác
            </h3>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight text-white mb-8">
              Chúng tôi đồng hành cùng bạn kiến tạo những giá trị bền vững từ gốm sứ Bát Tràng.
            </h2>
          </div>
        </div>

        {/* Spacer */}
        <div className="hidden lg:block lg:col-span-1"></div>

        {/* Cột 2: Thông tin liên hệ (Chiếm 3/12) */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-10">
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">Trụ sở</h4>
            <p className="text-sm font-light leading-loose text-gray-300">
              Làng nghề Bát Tràng<br />
              Gia Lâm, Hà Nội<br />
              Việt Nam
            </p>
          </div>
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">Liên lạc</h4>
            <div className="text-sm font-light leading-loose text-gray-300 flex flex-col">
              <a href="mailto:info@nghiaphai.vn" className="hover:text-gomsu-primary transition-colors">info@nghiaphai.vn</a>
              <a href="tel:+84123456789" className="hover:text-gomsu-primary transition-colors">+84 xxx xxx xxx</a>
            </div>
          </div>
        </div>

        {/* Cột 3: Liên kết nhanh (Chiếm 3/12) */}
        <div className="md:col-span-3 lg:col-span-3 flex flex-col gap-10">
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">Khám phá</h4>
            <ul className="text-sm font-light leading-loose text-gray-300 flex flex-col">
              <li><a href="/art" className="hover:text-gomsu-primary transition-colors">Nghệ thuật</a></li>
              <li><a href="/gallery" className="hover:text-gomsu-primary transition-colors">Bộ sưu tập</a></li>
              <li><a href="/projects" className="hover:text-gomsu-primary transition-colors">Dự án tiêu biểu</a></li>
              <li><a href="/blog" className="hover:text-gomsu-primary transition-colors">Tin tức &amp; Sự kiện</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted mb-4">Mạng xã hội</h4>
            <ul className="text-sm font-light leading-loose text-gray-300 flex flex-col">
              <li><a href="#" className="hover:text-gomsu-primary transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-gomsu-primary transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-gomsu-primary transition-colors">Behance</a></li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
