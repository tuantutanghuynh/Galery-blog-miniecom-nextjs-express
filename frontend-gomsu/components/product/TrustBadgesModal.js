'use client';

import { useState } from 'react';

const BADGES = [
  {
    id: 'insurance',
    icon: '🛡️',
    title: 'BẢO HIỂM VỠ HỎNG 100%',
    shortDesc: 'Đổi mới tức thì nếu hư hỏng khi vận chuyển',
    fullDetail: 'Nghĩa Phái bảo hiểm 100% rủi ro gãy vỡ trong quá trình vận chuyển toàn quốc. Khi nhận hàng, quý khách chỉ cần quay video khui hộp. Nếu sản phẩm bị sứt mẻ hoặc nứt vỡ, chúng tôi sẽ lập tức chế tác và gửi bản thay thế mới hoàn toàn miễn phí.'
  },
  {
    id: 'certificate',
    icon: '📜',
    title: 'CHỨNG NHẬN BÁT TRÀNG',
    shortDesc: 'Tác phẩm chế tác thủ công từ làng nghề',
    fullDetail: 'Mỗi tác phẩm đều được chế tác thủ công bởi các nghệ nhân Bát Tràng, nung ở nhiệt độ tiêu chuẩn 1300°C loại bỏ hoàn toàn độc tố kim loại nặng. Tác phẩm đi kèm giấy chứng nhận nguồn gốc và chất liệu độc bản.'
  },
  {
    id: 'packing',
    icon: '📦',
    title: 'ĐÓNG GÓI CHUYÊN DỤNG',
    shortDesc: 'Hộp quà tặng bọc xốp chống xóc 5 lớp',
    fullDetail: 'Sản phẩm gốm được bọc trong 5 lớp chống xóc chuyên dụng, đóng gói trong hộp quà bọc lót nhung tơ sang trọng, sẵn sàng để trao tặng hoặc trưng bày ngay khi mở hộp.'
  }
];

export default function TrustBadgesModal() {
  const [activeBadge, setActiveBadge] = useState(null);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gomsu-border">
        {BADGES.map((b) => (
          <button
            key={b.id}
            onClick={() => setActiveBadge(b)}
            className="text-left p-4 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-gomsu-primary/50 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{b.icon}</span>
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-gomsu-primary group-hover:underline">
                {b.title}
              </span>
            </div>
            <p className="text-[11px] text-gomsu-text-muted leading-relaxed">
              {b.shortDesc}
            </p>
          </button>
        ))}
      </div>

      {/* Modal / Drawer */}
      {activeBadge && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-gomsu-primary max-w-lg w-full p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveBadge(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl p-2"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{activeBadge.icon}</span>
              <h3 className="font-serif text-xl text-gomsu-primary font-medium">{activeBadge.title}</h3>
            </div>
            <p className="text-sm text-gomsu-text leading-relaxed whitespace-pre-line border-t border-[#333] pt-4 mb-6">
              {activeBadge.fullDetail}
            </p>
            <button
              onClick={() => setActiveBadge(null)}
              className="w-full py-3 bg-gomsu-primary text-black uppercase text-xs tracking-widest font-bold hover:bg-white transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
