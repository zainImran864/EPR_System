export interface School {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  primaryColor?: string;
  customDomain?: string;
  phone?: string;
  email?: string;
  address?: string;
  activeYear: string;
  createdAt: number;
}

export interface SchoolBrandingUpdate {
  name?: string;
  primaryColor?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  activeYear?: string;
}
