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
  expirationDate?: string;  // ← Adicionado expirationDate
  createdAt?: string;
  totalPurchases?: number;
  [key: string]: unknown;
}