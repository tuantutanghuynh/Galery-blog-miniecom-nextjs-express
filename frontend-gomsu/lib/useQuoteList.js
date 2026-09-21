'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Danh sách sản phẩm khách đang quan tâm, giữ nguyên trong trình duyệt cho tới lúc bấm gửi.
// Cố ý KHÔNG có bảng giỏ hàng phía server: luồng này không trừ kho, không giữ hàng, không
// chuyển tiền — nên không có lý do gì để chạm vào database trước khi khách thực sự để lại
// số điện thoại. Ít thứ chạy là ít thứ hỏng.
//
// Dữ liệu hiển thị (tên, giá, ảnh) được chép vào localStorage luôn để trang danh sách vẽ
// được ngay mà không cần gọi API. Giá đó chỉ để khách xem: lúc gửi, server đọc lại giá thật
// từ database theo variantId, nên giá cũ trong trình duyệt không thể thành giá báo cho khách.

const STORAGE_KEY = 'miniecom_quote_list';

const QuoteListContext = createContext();

// localStorage ném lỗi ở chế độ ẩn danh hoặc khi người dùng chặn site data, và trang vẫn
// phải chạy bình thường trong những trường hợp đó.
function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Hết dung lượng hoặc bị chặn — danh sách vẫn sống trong bộ nhớ của phiên này.
  }
}

export function QuoteListProvider({ children }) {
  const [items, setItems] = useState([]);
  // Đọc localStorage trong useEffect chứ không phải lúc render: server không có localStorage
  // nên đọc sớm sẽ làm HTML của server khác HTML của client và React báo lỗi hydrate.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setIsReady(true);
  }, []);

  const persist = useCallback((next) => {
    setItems(next);
    writeStorage(next);
  }, []);

  const add = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === product.variantId);
      const next = existing
        ? prev.map((i) =>
            i.variantId === product.variantId
              ? { ...i, quantity: Math.min(i.quantity + quantity, 99) }
              : i
          )
        : [...prev, { ...product, quantity: Math.min(Math.max(quantity, 1), 99) }];
      writeStorage(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((variantId, quantity) => {
    setItems((prev) => {
      const next =
        quantity <= 0
          ? prev.filter((i) => i.variantId !== variantId)
          : prev.map((i) =>
              i.variantId === variantId ? { ...i, quantity: Math.min(quantity, 99) } : i
            );
      writeStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((variantId) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.variantId !== variantId);
      writeStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => persist([]), [persist]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <QuoteListContext.Provider
      value={{ items, count, subtotal, isReady, add, updateQuantity, remove, clear }}
    >
      {children}
    </QuoteListContext.Provider>
  );
}

export function useQuoteList() {
  return useContext(QuoteListContext);
}
