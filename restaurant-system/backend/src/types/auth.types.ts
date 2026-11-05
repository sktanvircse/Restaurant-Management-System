export interface JwtUserPayload {
  userId: number;
  email: string;
  role: string;
  roleId: number;
  branchId: number;
}

export interface JwtCustomerPayload {
  customerId: number;
  email?: string | null;
  phone?: string | null;
  isGuest?: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  roleId: number;
  branchId: number;
  permissions: string[]; // e.g. ["orders:view", "orders:create"]
}

export interface AuthCustomer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  isGuest: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
