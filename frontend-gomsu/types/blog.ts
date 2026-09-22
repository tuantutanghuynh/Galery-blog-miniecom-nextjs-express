export type PostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  categoryId?: string | null;
  authorId?: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  status: PostStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id: string;
    fullName?: string | null;
    email: string;
  } | null;
}
