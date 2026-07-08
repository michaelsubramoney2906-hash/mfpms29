import { LucideIcon } from 'lucide-react';

export interface SubModule {
  id: string;
  name: string;
  icon: LucideIcon;
}

export interface Module {
  id: string;
  name: string;
  icon: LucideIcon;
  subModules: SubModule[];
}

export interface Tenant {
  id: string;
  name: string;
}

export interface User {
  email: string;
  role: 'admin' | 'tenant_user';
  tenantId?: string; // If undefined, can access all (admin)
  id?: string;
  signatureType?: 'draw' | 'upload' | 'wacom';
  signatureData?: string;
  fullName?: string;
  jobFunction?: string;
  department?: string;
  directorate?: string;
  manager?: string;
  reportTo?: string;
  systemRole?: string;
  loginTime?: string;
  loginKickoffRef?: string;
  level?: string;
}

export type UserProfile = User;
