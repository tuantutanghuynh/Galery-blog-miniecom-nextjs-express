export type UserRole = 'admin' | 'customer' | string;

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}
