export interface UserEntitlement {
  id: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  expiresAt?: string | null;
  origin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name?: string;
  avatar?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  plan?: 'VIP' | 'LITE' | 'LITE_V2' | 'RENDA_PASSIVA' | 'FIIS' | 'AMERICA' | 'ADMIN';
  customPermissions?: string[];
  entitlements?: UserEntitlement[];
  activeEntitlements?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  expirationDate?: string | null;
  mustChangePassword?: boolean;
  createdAt?: string;
  totalPurchases?: number;
  recentPurchases?: Array<{
    id: string;
    amount?: number;
    productName?: string | null;
    status?: string | null;
    createdAt?: string;
  }>;
  [key: string]: unknown;
}
