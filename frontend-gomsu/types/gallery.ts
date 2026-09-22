export interface GalleryItem {
  id: string;
  categoryId?: string | null;
  title: string;
  imageUrl: string;
  altText?: string | null;
  position: number;
  createdAt: string;
  updatedAt?: string;
}
