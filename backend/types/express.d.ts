import type { Request } from 'express';

// Mở rộng kiểu Request của Express để TypeScript biết về hai trường mà middleware tự gắn
// vào. Không khai ở đây thì mọi controller đọc req.user sẽ báo lỗi "property does not exist".
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
      brand?: { slug: string; categoryIds: string[] };
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  role: string;
}

export interface ResolvedBrand {
  slug: string;
  categoryIds: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface BrandRequest extends Request {
  brand: ResolvedBrand;
}

export interface AuthenticatedBrandRequest extends Request {
  user: AuthenticatedUser;
  brand: ResolvedBrand;
}

export {};
