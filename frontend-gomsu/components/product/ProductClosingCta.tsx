import Link from 'next/link';

interface ProductClosingCtaProps {
  productName: string;
}

// Khối kết ở cuối trang. Trước đây khách cuộn hết phần kể chuyện là rơi thẳng xuống footer,
// không có lối nào dẫn tiếp — người đọc hết cả trang chính là người quan tâm nhất, để họ
// rơi ra ngoài là lãng phí.
export default function ProductClosingCta({ productName }: ProductClosingCtaProps) {
  return (
    <section className="border-t border-gomsu-border py-20 text-center">
      <div className="page-shell max-w-2xl space-y-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gomsu-primary">Nghĩa Phái</p>

        <h2 className="font-serif text-2xl md:text-4xl text-white leading-tight">
          Một tác phẩm chỉ thuộc về một không gian
        </h2>

        <p className="text-sm text-gomsu-text-muted leading-relaxed">
          Mỗi tác phẩm được tạo hình thủ công nên không bao giờ lặp lại. Để lại thông tin,
          chúng tôi sẽ gọi lại tư vấn về <span className="text-gomsu-text">{productName}</span> và
          báo phí vận chuyển trước khi giao.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/yeu-cau-tu-van"
            className="px-10 py-4 bg-gomsu-primary text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-white transition-colors"
          >
            Yêu cầu tư vấn
          </Link>
          <Link
            href="/san-pham"
            className="px-10 py-4 border border-gomsu-border text-gomsu-text-muted text-xs uppercase tracking-[0.2em] hover:border-gomsu-primary hover:text-gomsu-primary transition-colors"
          >
            Xem tác phẩm khác
          </Link>
        </div>

        <p className="text-xs text-gomsu-text-muted pt-2">
          Miễn phí tư vấn · Xác nhận trước khi giao · Chưa phát sinh thanh toán
        </p>
      </div>
    </section>
  );
}
