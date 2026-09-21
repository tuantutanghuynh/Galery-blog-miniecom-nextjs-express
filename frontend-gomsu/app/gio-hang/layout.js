// Trang là Client Component nên không export được metadata; đặt ở layout.
// Chặn hai lớp cùng robots.txt: robots.txt ngăn bot bò vào, thẻ meta ngăn lập chỉ mục —
// URL bị chặn bởi robots.txt mà có trang khác trỏ link tới vẫn lọt vào kết quả tìm kiếm.
export const metadata = {
  title: 'Giỏ hàng',
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }) {
  return children;
}
