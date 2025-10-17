export interface User {
  id: string;
  name?: string;
  avatar?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  plan?: 'VIP' | 'LITE' | 'RENDA_PASSIVA' | 'FIIS' | 'AMERICA' | 'ADMIN';  // ← Adicionado ADMIN
  customPermissions?: string[];  // ← Adicionado customPermissions
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';  // ← Adicionado status
  expirationDate?: string | null;  // ← Adicionado expirationDate
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
