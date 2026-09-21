// Trang này hiển thị họ tên, số điện thoại và địa chỉ khách. Bị lập chỉ mục một lần là
// dữ liệu cá nhân nằm trên Google, gỡ xuống rất mất công — nên chặn cả ở đây lẫn robots.txt.
export const metadata = {
  title: 'Đặt hàng thành công',
  robots: { index: false, follow: false },
};

export default function OrderDoneLayout({ children }) {
  return children;
}
