// Trang là Client Component nên không export được metadata; đặt ở layout.
// noindex vì đây là trang cá nhân hoá (danh sách riêng của từng khách) và không có nội dung
// nào đáng lên kết quả tìm kiếm.
export const metadata = {
  title: 'Yêu cầu tư vấn',
  robots: { index: false, follow: false },
};

export default function QuoteRequestLayout({ children }) {
  return children;
}
