// Đừng thêm `| string` vào union này: TypeScript sẽ nuốt ba literal ở trên và rút gọn
// cả type thành `string`, làm mọi phép so sánh status === 'NEW' mất sạch khả năng
// bắt lỗi gõ nhầm.
export type QuoteStatus = 'NEW' | 'CONTACTED' | 'CLOSED';

export interface LocalQuoteItem {
  variantId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  unitPrice: number;
  imageUrl?: string | null;
  quantity: number;
}

export interface QuoteRequestItem {
  id: string;
  quoteRequestId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  snapshot?: Record<string, unknown> | null;
  productName?: string;
  productSlug?: string;
  variantLabel?: string;
  imageUrl?: string | null;
  lineTotal?: number;
}

export interface QuoteRequest {
  id: string;
  brandSlug: string;
  customerName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  status: QuoteStatus;
  finalAmount?: number | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuoteRequestItem[];
}
