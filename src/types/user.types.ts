export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  address?: string;
  city?: string;
  country?: string;
  zipCode?: number;
  phone?: string;
  lastUpdatedIpAddress?: string;
  imageUri?: string;
  programs?: string[];
  role: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
