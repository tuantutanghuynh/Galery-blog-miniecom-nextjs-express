'use client';

import { useState } from 'react';

export default function ProductSpecifications({ product }) {
  const [activeTab, setActiveTab] = useState('specs');

  const specs = [
    { label: 'Tên tác phẩm', value: product.name },
    { label: 'Danh mục', value: product.category?.name || 'Gốm nghệ thuật' },
    { label: 'Thương hiệu', value: product.brand || 'Nghĩa Phái Art & Design' },
    { label: 'Chất liệu đất', value: 'Đất sét cao lanh Bát Tràng tơ mịn' },
    { label: 'Chất liệu men', value: 'Men gia truyền nung hỏa biến nhiệt độ cao' },
    { label: 'Quy chuẩn độc tố', value: 'Đã nung 1300°C loại bỏ hoàn toàn chì & cadium' },
  ];

  return (
    <section className="border-t border-gomsu-border py-16 px-6 md:px-12 bg-[#111111]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl md:text-3xl text-white font-medium mb-3">Thông số Kỹ thuật & Bảo quản</h2>
          <p className="text-xs uppercase tracking-widest text-gomsu-text-muted">Cung cấp dữ liệu chi tiết minh bạch cho quyết định mua hàng</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-gomsu-border mb-8">
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-6 py-3 text-xs uppercase tracking-[0.2em] font-medium border-b-2 transition-colors ${
              activeTab === 'specs'
                ? 'border-gomsu-primary text-gomsu-primary'
                : 'border-transparent text-gomsu-text-muted hover:text-white'
            }`}
          >
            Thông số sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('placement')}
            className={`px-6 py-3 text-xs uppercase tracking-[0.2em] font-medium border-b-2 transition-colors ${
              activeTab === 'placement'
                ? 'border-gomsu-primary text-gomsu-primary'
                : 'border-transparent text-gomsu-text-muted hover:text-white'
            }`}
          >
            Bài trí không gian
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`px-6 py-3 text-xs uppercase tracking-[0.2em] font-medium border-b-2 transition-colors ${
              activeTab === 'care'
                ? 'border-gomsu-primary text-gomsu-primary'
                : 'border-transparent text-gomsu-text-muted hover:text-white'
            }`}
          >
            Vệ sinh & Bảo quản
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-6 md:p-8">
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specs.map((item, idx) => (
                <div key={idx} className="flex justify-between py-3 border-b border-[#2a2a2a] text-xs">
                  <span className="text-gomsu-text-muted uppercase tracking-wider">{item.label}:</span>
                  <span className="text-white font-medium text-right">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'placement' && (
            <div className="space-y-4 text-xs text-gomsu-text-muted leading-relaxed">
              <p className="text-white font-medium text-sm">Gợi ý bài trí tôn vinh tác phẩm:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-gomsu-primary font-normal">Phòng khách & Kệ Tivi:</strong> Đặt ở nơi có ánh sáng rọi nhẹ (Warm Light 3000K) để tôn vinh vệt men lấp lánh.</li>
                <li><strong className="text-gomsu-primary font-normal">Trà thất & Không gian Thiền:</strong> Kết hợp cùng bàn gỗ trầm, mây bối hoặc hoa sen khô tạo không gian thanh tịnh.</li>
                <li><strong className="text-gomsu-primary font-normal">Bàn làm việc Chủ tịch:</strong> Tác phẩm mang năng lượng thủy thổ hòa hợp, giúp tĩnh tâm và nâng tầm đẳng cấp không gian làm việc.</li>
              </ul>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-4 text-xs text-gomsu-text-muted leading-relaxed">
              <p className="text-white font-medium text-sm">Quy trình chăm sóc men gốm gia truyền:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Lau chùi bằng khăn mềm ẩm hoặc chổi lông thỏ mịn. Không dùng búi sắt hoặc chất tẩy rửa có tính axit mạnh.</li>
                <li>Sản phẩm đã qua xử lý nung cao độ, bề mặt men kháng nước tuyệt đối, không bám ố dơ theo thời gian.</li>
                <li>Tránh va đập trực tiếp với các vật sắc nhọn kim loại nặng.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
