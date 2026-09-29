/**
 * SDBIP Workflow & Notification Helper
 */

export interface SdbipWorkflowNotification {
  id: string;
  senderEmail: string;
  senderName: string;
  targetUser?: string;
  targetRole?: string;
  recipientEmail?: string;
  recipientName?: string;
  title: string;
  message: string;
  actionType?: string;
  kpiId?: string;
  refNum?: string;
  quarter?: string;
  createdAt: string;
  read?: boolean;
  poeCount?: number;
}

export const PMS_TEAM_REVIEWERS = [
  'KhuboniY@nkangaladm.gov.za',
  'ShabanguSM@nkangaladm.gov.za',
  'manager@mzansiflow.co.za'
];

export const INTERNAL_AUDIT_USERS = [
  'Gwangwapk@nkangaladm.gov.za',
  'audit@nkangaladm.gov.za',
  'internal_audit'
];

export function isUserMatch(targetUser: any, currentUser: any): boolean {
  if (!targetUser || !currentUser) return false;
  const target = String(targetUser).toLowerCase().trim();
  const currentEmail = String(currentUser.email || '').toLowerCase().trim();
  const currentName = String(currentUser.fullName || currentUser.full_name || '').toLowerCase().trim();
  
  if (target === currentEmail) return true;
  if (target === currentName) return true;
  if (currentEmail && target.includes(currentEmail.split('@')[0])) return true;
  if (currentUser.systemRole && target.toLowerCase().includes(currentUser.systemRole.toLowerCase())) return true;
  if (currentUser.role === 'admin') return true;
  return false;
}

export async function fetchSdbipNotifications(tenantId: string): Promise<SdbipWorkflowNotification[]> {
  try {
    const res = await fetch(`/api/tenant/${tenantId}/sdbip-notifications?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return data.notifications || [];
    }
  } catch (e) {
    console.warn("fetchSdbipNotifications fallback:", e);
  }
  return [];
}

export async function dispatchSdbipNotification(tenantId: string, payload: any): Promise<boolean> {
  try {
    const res = await fetch(`/api/tenant/${tenantId}/sdbip-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn("dispatchSdbipNotification error:", e);
    return false;
  }
}

export async function markSdbipNotificationRead(tenantId: string, notifId: string, currentList: SdbipWorkflowNotification[]): Promise<SdbipWorkflowNotification[]> {
  try {
    await fetch(`/api/tenant/${tenantId}/sdbip-notifications/${notifId}/read`, {
      method: 'POST'
    });
  } catch (e) {}
  return currentList.map(n => n.id === notifId ? { ...n, read: true } : n);
}

export function extractKpiPoes(kpi: any, poes: any): any[] {
  if (!kpi) return [];
  if (Array.isArray(poes)) {
    return poes.filter(p => 
      p.kpiId === kpi.id || 
      p.kpiNo === kpi.kpiNo || 
      p.refNum === kpi.refNum ||
      (p.kpi && p.kpi === kpi.kpi)
    );
  }
  if (poes && typeof poes === 'object') {
    // Check if keyed by KPI id or refNum
    if (Array.isArray(poes[kpi.id])) return poes[kpi.id];
    if (Array.isArray(poes[kpi.refNum])) return poes[kpi.refNum];
    if (Array.isArray(poes[kpi.kpiNo])) return poes[kpi.kpiNo];
    
    // Flat map all values if they are arrays
    const all = Object.values(poes).flat() as any[];
    return all.filter((p: any) => 
      p && (p.kpiId === kpi.id || p.refNum === kpi.refNum || p.kpiNo === kpi.kpiNo)
    );
  }
  return [];
}
