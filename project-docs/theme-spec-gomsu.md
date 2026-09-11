---
name: GomSuThemeSpec
description: Hướng dẫn thiết kế, Typography, Color Palette và cấu hình giao diện (Theme Spec) dành riêng cho nhánh dự án Gốm Sứ (frontend-gomsu) theo phong cách Dark Museum.
---

# Design System Spec: Nhánh Gốm Sứ (Ceramics) - Dark Museum Style

Tài liệu này đóng vai trò như một **Design System Specification** (Đặc tả thiết kế) để đảm bảo tính nhất quán về mặt thị giác (Visual Consistency) khi phát triển nhánh Gốm Sứ. 

> Tham khảo ảnh gốc thiết kế tại: `project-docs/gomsu-reference-design.jpg`

## 1. Định hướng Thẩm mỹ (Art Direction)
- **Concept:** Bảo tàng Nghệ thuật (Art Museum / Gallery), Bóng tối (Dark Mode), Huyền bí và Sang trọng (Luxury).
- **Cảm giác mang lại:** Cao cấp, tĩnh lặng, tập trung thị giác tối đa vào các tác phẩm nghệ thuật gốm sứ. Không gian lưới (Grid) thẳng tắp, nghiêm túc.

## 2. Bảng màu (Color Palette)
Hệ thống sử dụng tông nền đen/xám cực tối kết hợp với các điểm nhấn màu vàng đồng (Bronze/Gold).

- **Primary (`gomsu-primary`): `#C8A97E`** (Vàng đồng / Muted Gold)
  - *Sử dụng:* Nút bấm Outline (viền và chữ), Icon mũi tên, Đường gạch dưới, Nhấn mạnh chữ quan trọng.
- **Background (`gomsu-background`): `#111111`** (Đen Xám / Off-black)
  - *Sử dụng:* Màu nền tổng thể của toàn bộ Website.
- **Surface (`gomsu-surface`): `#1A1A1A`** (Xám tối)
  - *Sử dụng:* Nền của một số khu vực nổi bật hoặc Footer.
- **Text (`gomsu-text`): `#E0E0E0`** (Trắng ngà / Light Gray)
  - *Sử dụng:* Màu chữ đọc đoạn văn mặc định. Đủ sáng nhưng không gắt như `#FFFFFF`.
- **Text Muted (`gomsu-text-muted`): `#888888`** (Xám trung tính)
  - *Sử dụng:* Chữ phụ, caption, ngày tháng.
- **Border (`gomsu-border`): `#2A2A2A`** (Xám tro đậm)
  - *Sử dụng:* Các đường line chia vách, chia lưới (Grid), viền khung ảnh. Đây là yếu tố cực kỳ quan trọng tạo nên phong cách thiết kế này.

## 3. Nghệ thuật chữ (Typography)
- **Tiêu đề chính (Headings) - Font Serif:** `Playfair Display` hoặc `Lora`
  - *Sử dụng:* Thẻ `H1`, `H2`. Chữ thường (Capitalize). Thể hiện sự tinh tế, lịch sử.
- **Tiêu đề phụ / Điều hướng (Nav) - Font Sans-serif:** `Montserrat` hoặc `Inter`
  - *Sử dụng:* Menu, Label. **Bắt buộc viết Hoa (Uppercase) và dãn chữ rộng (tracking-widest / letter-spacing)**.
- **Nội dung đọc (Body):** Sans-serif mỏng (`font-light` hoặc `font-normal`).
- **Chữ ký (Signature/Accent):** `Great Vibes` (Tùy chọn cho các đoạn trích dẫn quote).

## 4. Hình khối & Component (UI Elements)
Tuyệt đối tuân thủ sự sắc sảo, vuông vắn.
- **Border Radius:** `0px` (`rounded-none`). **KHÔNG BO GÓC** bất kỳ thành phần nào (Nút bấm, Khung ảnh đều vuông góc).
- **Nút bấm (Buttons):** Không dùng nút nền đặc (Solid). Dùng nút rỗng (Outline): nền trong suốt `bg-transparent`, viền mỏng 1px `border border-gomsu-border`, chữ màu vàng đồng `text-gomsu-primary`. Thường đi kèm icon mũi tên `->`.
- **Lưới (Grid):** Các thành phần thường được ngăn cách rõ ràng bằng các đường viền 1px (`border-r`, `border-b`) chạy dài đến hết màn hình.

---

## 5. Áp dụng Cấu hình (Code Implementation)

### 5.1. File `tailwind.config.mjs`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gomsu: {
          primary: '#C8A97E',
          background: '#111111',
          surface: '#1A1A1A',
          text: '#E0E0E0',
          'text-muted': '#888888',
          border: '#2A2A2A'
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-montserrat)', 'sans-serif'],
      },
      borderRadius: {
        // Tắt toàn bộ bo góc (Ghi đè mặc định)
        'sm': '0px',
        DEFAULT: '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
      }
    },
  },
  plugins: [],
};
```

### 5.2. File `app/layout.js`
```javascript
import { Playfair_Display, Montserrat } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({ 
  subsets: ['vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const montserrat = Montserrat({ 
  subsets: ['vietnamese'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  title: 'Tiệm Gốm Sứ Nghệ Thuật',
  description: 'Hơi thở đất - Dáng hình thời gian.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className="font-sans bg-gomsu-background text-gomsu-text antialiased selection:bg-gomsu-primary selection:text-black">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
```

## 6. Hướng dẫn sử dụng (Cheatsheet)
- **Menu / Đề mục:** `<h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gomsu-text-muted">Bộ sưu tập</h3>`
- **Nút Outline Mũi tên:** `<button className="px-6 py-2 border border-gomsu-primary/50 text-gomsu-primary hover:bg-gomsu-primary hover:text-black transition-colors flex items-center gap-2 uppercase text-xs tracking-widest">Khám phá nghệ thuật <span>&rarr;</span></button>`
- **Tiêu đề Chính:** `<h1 className="font-serif text-5xl md:text-7xl font-medium leading-tight">Hơi thở đất<br/>Dáng hình thời gian</h1>`
