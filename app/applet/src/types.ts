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
  managerEmail?: string;
  systemRole?: string;
  loginTime?: string;
  loginKickoffRef?: string;
  level?: string;
  portalMode?: 'municipality' | 'neda';
}

export type UserProfile = User;

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string e.g. 2026-09-12T08:14:22.000Z
  dateStr: string;   // YYYY-MM-DD e.g. 2026-09-12
  timeStr: string;   // HH:mm:ss e.g. 08:14:22
  userEmail: string;
  userName: string;
  tenantId: string;
  role: string;
  department?: string;
  action: string;
  moduleId: string;
  moduleName: string;
  subModuleId: string;
  subModuleName: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserAuditSummary {
  userEmail: string;
  userName: string;
  department: string;
  role: string;
  tenantId: string;
  firstLogin: string; // HH:mm:ss
  lastActive: string; // HH:mm:ss
  firstLoginTimestamp?: string; // ISO string
  lastActiveTimestamp?: string; // ISO string
  sessionDurationFormatted: string; // e.g. "5 hrs 24 mins 12s"
  sessionDurationMinutes: number;
  sessionDurationSeconds: number;
  isActiveNow?: boolean;
  totalActions: number;
  modulesAccessed: { id: string; name: string; count: number }[];
  subModulesAccessed: { id: string; name: string; count: number }[];
  timeline: AuditLogEntry[];
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  themeColor?: string;
}
