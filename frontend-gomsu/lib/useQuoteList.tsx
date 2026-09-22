'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { LocalQuoteItem } from '@/types/quote';

// Danh sách sản phẩm khách đang quan tâm, giữ nguyên trong trình duyệt cho tới lúc bấm gửi.
// Cố ý KHÔNG có bảng giỏ hàng phía server: luồng này không trừ kho, không giữ hàng, không
// chuyển tiền — nên không có lý do gì để chạm vào database trước khi khách thực sự để lại
// số điện thoại. Ít thứ chạy là ít thứ hỏng.
//
// Dữ liệu hiển thị (tên, giá, ảnh) được chép vào localStorage luôn để trang danh sách vẽ
// được ngay mà không cần gọi API. Giá đó chỉ để khách xem: lúc gửi, server đọc lại giá thật
// từ database theo variantId, nên giá cũ trong trình duyệt không thể thành giá báo cho khách.

const STORAGE_KEY = 'miniecom_quote_list';

export interface QuoteListContextType {
  items: LocalQuoteItem[];
  count: number;
  subtotal: number;
  isReady: boolean;
  add: (product: Omit<LocalQuoteItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const QuoteListContext = createContext<QuoteListContextType | undefined>(undefined);

// localStorage ném lỗi ở chế độ ẩn danh hoặc khi người dùng chặn site data, và trang vẫn
// phải chạy bình thường trong những trường hợp đó.
function readStorage(): LocalQuoteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LocalQuoteItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: LocalQuoteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Hết dung lượng hoặc bị chặn — danh sách vẫn sống trong bộ nhớ của phiên này.
  }
}

export function QuoteListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LocalQuoteItem[]>([]);
  // Đọc localStorage trong useEffect chứ không phải lúc render: server không có localStorage
  // nên đọc sớm sẽ làm HTML của server khác HTML của client và React báo lỗi hydrate.
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    setItems(readStorage());
    setIsReady(true);
  }, []);

  const persist = useCallback((next: LocalQuoteItem[]) => {
    setItems(next);
    writeStorage(next);
  }, []);

  const add = useCallback((product: Omit<LocalQuoteItem, 'quantity'>, quantity = 1) => {
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

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
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

  const remove = useCallback((variantId: string) => {
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

export function useQuoteList(): QuoteListContextType {
  const context = useContext(QuoteListContext);
  if (!context) {
    throw new Error('useQuoteList must be used within a QuoteListProvider');
  }
  return context;
}
