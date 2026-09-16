'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '', website_url: ''
  });
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', type: '' });

    try {
      const { apiFetch } = await import('../../lib/apiClient');
      await apiFetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setStatus({ loading: false, message: 'Cảm ơn bạn! Tin nhắn đã được gửi thành công.', type: 'success' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', website_url: '' });
    } catch (err) {
      setStatus({ loading: false, message: err.message || 'Có lỗi xảy ra', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gomsu-background flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Cột trái: Hình ảnh nghệ thuật với viền mờ */}
          <div className="relative w-full h-[50vh] lg:h-[75vh] flex items-center justify-center">
            <div className="relative w-full h-full edge-fade-mask">
              <Image
                src="/images/contact-art.jpg"
                alt="Nghệ thuật gốm sứ Bát Tràng"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Cột phải: Form liên hệ (Căn chỉnh cân đối) */}
          <div className="flex flex-col justify-center max-w-xl mx-auto lg:mx-0 w-full">
            <div className="text-center lg:text-left mb-10">
              <h1 className="font-serif text-5xl md:text-6xl text-gomsu-text mb-4">
                Kết nối với<br className="hidden lg:block"/> chúng tôi
              </h1>
              <p className="font-sans text-gomsu-text-muted font-light leading-relaxed max-w-md mx-auto lg:mx-0 text-sm md:text-base">
                Để lại thông tin và yêu cầu của bạn, đội ngũ Nghĩa Phái sẽ liên hệ lại trong thời gian sớm nhất.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* HONEYPOT: Trường ẩn để lừa Bot. Người thật sẽ không thấy trường này */}
              <div className="hidden" aria-hidden="true">
                <input type="text" name="website_url" tabIndex="-1" autoComplete="off" value={formData.website_url} onChange={handleChange} />
              </div>

              {/* Hàng 1: Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-serif text-base text-gray-300 ml-2">Họ và tên</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="bg-transparent border border-gray-600 rounded-none px-6 py-3.5 text-gomsu-text focus:outline-none focus:border-gomsu-primary transition-colors placeholder:text-gray-500 font-light w-full"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-serif text-base text-gray-300 ml-2">Email</label>
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="example@email.com"
                    className="bg-transparent border border-gray-600 rounded-none px-6 py-3.5 text-gomsu-text focus:outline-none focus:border-gomsu-primary transition-colors placeholder:text-gray-500 font-light w-full"
                    required
                  />
                </div>
              </div>

              {/* Hàng 2: Phone & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-serif text-base text-gray-300 ml-2">Số điện thoại</label>
                  <input 
                    type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="(+84) 987 654 321"
                    className="bg-transparent border border-gray-600 rounded-none px-6 py-3.5 text-gomsu-text focus:outline-none focus:border-gomsu-primary transition-colors placeholder:text-gray-500 font-light w-full"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-serif text-base text-gray-300 ml-2">Chủ đề</label>
                  <input 
                    type="text" name="subject" value={formData.subject} onChange={handleChange}
                    placeholder="VD: Hợp tác, Đặt hàng..."
                    className="bg-transparent border border-gray-600 rounded-none px-6 py-3.5 text-gomsu-text focus:outline-none focus:border-gomsu-primary transition-colors placeholder:text-gray-500 font-light w-full"
                  />
                </div>
              </div>

              {/* Hàng 3: Message */}
              <div className="flex flex-col gap-2">
                <label className="font-serif text-base text-gray-300 ml-2">Nội dung tin nhắn</label>
                <textarea 
                  rows="4" name="message" value={formData.message} onChange={handleChange}
                  placeholder="Vui lòng nhập nội dung chi tiết tại đây..."
                  className="bg-transparent border border-gray-600 rounded-none px-6 py-4 text-gomsu-text focus:outline-none focus:border-gomsu-primary transition-colors placeholder:text-gray-500 font-light resize-none w-full"
                  required
                ></textarea>
              </div>

              {status.message && (
                <div className={`px-4 py-3 rounded text-sm ${status.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                  {status.message}
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-4 flex justify-center lg:justify-start">
                <button 
                  type="submit" disabled={status.loading}
                  className="bg-[#8b5a2b] hover:bg-[#704822] disabled:opacity-50 text-white font-sans text-xs md:text-sm uppercase tracking-widest px-10 py-4 rounded-none transition-all duration-300 hover:shadow-lg w-full md:w-auto"
                >
                  {status.loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </div>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
