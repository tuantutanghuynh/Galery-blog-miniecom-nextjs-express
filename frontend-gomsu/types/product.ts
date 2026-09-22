import type { Category } from './category';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  reservedQuantity: number;
  variantAttributes?: { label?: string; [key: string]: unknown } | null;
  variantKey?: string | null;
  imageUrl?: string | null;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  status: ProductStatus;
  attributes?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}
