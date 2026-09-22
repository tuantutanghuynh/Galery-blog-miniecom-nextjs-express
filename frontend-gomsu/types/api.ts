export interface PaginationMeta {
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface ApiErrorDetail {
  field?: string;
  msg?: string;
  [key: string]: unknown;
}

export interface ApiErrorObject {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: PaginationMeta | null;
  error?: ApiErrorObject | null;
}
