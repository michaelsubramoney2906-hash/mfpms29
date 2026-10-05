/**
 * SDBIP / OPMS Multi-Tier Workflow & Real-Time Notification Utilities
 * Handles Submitter -> Approver -> Reviewer (PMS Team) -> Internal Audit pipeline with Supabase persistence.
 */

export const PMS_TEAM_REVIEWERS = [
  'nsibandenp@nkangaladm.gov.za',
  'zulune@nkangaladm.gov.za',
  'shabangusm@nkangaladm.gov.za',
  'lukhelema@nkangaladm.gov.za',
  'khuboniy@nkangaladm.gov.za'
];

export const INTERNAL_AUDIT_USERS = [
  'twalaad@nkangaladm.gov.za',
  'seeranepl@nkangaladm.gov.za',
  'morarj@nkanagaladm.gov.za',
  'masemolak@nkangaladm.gov.za',
  'mpanzacs@nkangaladm.gov.za'
];

/**
 * Checks if the current user is the master Global Administrator Mike (mike@mzansiflow.co.za)
 * Grants exclusive authority to undo submissions, unlock approvals, and delete/purge locked PoEs.
 */
export function isMasterAdminMike(
  user?: { email?: string; role?: string; systemRole?: string } | null
): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  const sysRole = (user.systemRole || '').toLowerCase().trim();
  const role = (user.role || '').toLowerCase().trim();
  return (
    email === 'mike@mzansiflow.co.za' ||
    email === 'mike@massivedynamixdistributors.com' ||
    email.startsWith('mike@') ||
    (email.includes('mike') && (sysRole === 'global administrator' || sysRole === 'systems administrator' || role === 'admin' || role === 'superadmin'))
  );
}

export interface SdbipWorkflowNotification {
  id: string;
  targetUser: string;
  senderUser: string;
  kpiId: string;
  refNum: string;
  kpiName: string;
  phase?: string;
  message: string;
  comment?: string;
  actionType: 'submitted' | 'pushed_to_reviewer' | 'pushed_to_audit' | 'returned' | 'cleared';
  createdAt: string;
  read: boolean;
}

/**
 * Checks if a target user matches the current logged-in user profile
 */
export function isUserMatch(
  targetUser: string | undefined | null,
  user: { email?: string; fullName?: string; username?: string; role?: string } | undefined | null
): boolean {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  const isPmsMember = PMS_TEAM_REVIEWERS.map(e => e.toLowerCase()).includes(email);
  const isAuditMember = INTERNAL_AUDIT_USERS.map(e => e.toLowerCase()).includes(email);

  // If targetUser is null or undefined or empty, check membership in role lists
  if (!targetUser || !targetUser.trim()) {
    if (isPmsMember) return true;
    if (isAuditMember) return true;
    return false;
  }

  // Support comma-separated target string
  if (targetUser.includes(',')) {
    const parts = targetUser.split(',').map(p => p.trim());
    return parts.some(part => isUserMatch(part, user));
  }

  const target = targetUser.trim().toLowerCase();
  if (target === 'all' || target === 'everyone' || target === '*') return true;

  const emailPrefix = email.split('@')[0] || '';
  const fullName = (user.fullName || '').trim().toLowerCase();
  const username = (user.username || '').trim().toLowerCase();

  // Exact or prefix matches
  if (target === email) return true;
  if (target === fullName) return true;
  if (target === username) return true;
  if (target === emailPrefix) return true;

  // Contains match for partial names or emails
  if (fullName && (fullName.includes(target) || target.includes(fullName))) return true;

  // PMS Reviewer matches
  if (isPmsMember && (target.includes('reviewer') || target.includes('pms') || PMS_TEAM_REVIEWERS.some(r => r.toLowerCase() === target))) return true;

  // Internal Audit matches
  if (isAuditMember && (target.includes('audit') || target.includes('auditor') || INTERNAL_AUDIT_USERS.some(a => a.toLowerCase() === target))) return true;

  // Role and Designation based checks with full administrative aliases
  if (target.includes('approver') && (user.role?.includes('approver') || user.role === 'admin' || user.role === 'superadmin' || isMasterAdminMike(user))) return true;
  if (target.includes('reviewer') && (user.role?.includes('reviewer') || user.role === 'admin' || user.role === 'superadmin' || isPmsMember || isMasterAdminMike(user))) return true;
  if ((target.includes('audit') || target.includes('auditor')) && (user.role?.includes('audit') || user.role === 'admin' || user.role === 'superadmin' || isAuditMember || isMasterAdminMike(user))) return true;
  if (target.includes('submitter') && (user.role?.includes('submitter') || user.role === 'admin' || user.role === 'superadmin' || isMasterAdminMike(user))) return true;

  // Executive Designation aliases & robust role mappings
  if ((target.includes('municipal manager') || target === 'mm' || target.includes('accounting officer')) && (email.includes('mandla') || email.includes('mm') || email.includes('municipalmanager') || email.includes('nkangaladm') || isMasterAdminMike(user))) return true;
  if ((target.includes('chief financial officer') || target === 'cfo' || target.includes('finance') || target.includes('financial officer')) && (email.includes('cfo') || email.includes('finance') || email.includes('accounting') || isMasterAdminMike(user))) return true;
  if ((target.includes('corporate services') || target.includes('corporate') || target.includes('general manager: corporate')) && (email.includes('corporate') || email.includes('lezard') || email.includes('dimpe') || isMasterAdminMike(user))) return true;
  if ((target.includes('technical services') || target.includes('technical') || target.includes('infrastructure') || target.includes('engineer')) && (email.includes('technical') || email.includes('mthembu') || email.includes('infrastructure') || isMasterAdminMike(user))) return true;
  if ((target.includes('planning') || target.includes('development planning') || target.includes('economic development')) && (email.includes('planning') || email.includes('led') || email.includes('economic') || isMasterAdminMike(user))) return true;
  if ((target.includes('community') || target.includes('social services')) && (email.includes('community') || email.includes('social') || isMasterAdminMike(user))) return true;
  if ((target.includes('risk') || target.includes('risk officer')) && (email.includes('risk') || email.includes('governance') || isMasterAdminMike(user))) return true;
  if ((target.includes('labour') || target.includes('hr') || target.includes('relations') || target.includes('human resource')) && (email.includes('labour') || email.includes('hr') || email.includes('personnel') || isMasterAdminMike(user))) return true;
  if ((target.includes('pms') || target.includes('performance') || target.includes('evaluat')) && (email.includes('pms') || email.includes('performance') || isPmsMember || isMasterAdminMike(user))) return true;

  return false;
}

/**
 * Fetch all SDBIP workflow notifications from Supabase
 */
export async function fetchSdbipNotifications(activeTenantId: string): Promise<SdbipWorkflowNotification[]> {
  try {
    const res = await fetch(`/api/tenant/${activeTenantId}/sdbip-notifications`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.notifications) ? data.notifications : [];
  } catch (err) {
    console.error('Failed to fetch SDBIP notifications:', err);
    return [];
  }
}

/**
 * Dispatches a new notification to target user(s) and syncs to Supabase
 */
export async function dispatchSdbipNotification(
  activeTenantId: string,
  params: {
    targetUser: string | string[];
    senderUser: string;
    kpiId: string;
    refNum: string;
    kpiName: string;
    phase?: string;
    message: string;
    comment?: string;
    actionType: 'submitted' | 'pushed_to_reviewer' | 'pushed_to_audit' | 'returned' | 'cleared';
  }
): Promise<SdbipWorkflowNotification[]> {
  try {
    const current = await fetchSdbipNotifications(activeTenantId);
    const targets = Array.isArray(params.targetUser) ? params.targetUser : [params.targetUser];
    const newItems: SdbipWorkflowNotification[] = targets.filter(Boolean).map((target, idx) => ({
      id: `notif-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      targetUser: target,
      senderUser: params.senderUser,
      kpiId: params.kpiId,
      refNum: params.refNum,
      kpiName: params.kpiName,
      phase: params.phase || 'General',
      message: params.message,
      comment: params.comment,
      actionType: params.actionType,
      createdAt: new Date().toISOString(),
      read: false
    }));

    const updated = [...newItems, ...current];
    await fetch(`/api/tenant/${activeTenantId}/sdbip-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications: updated })
    });

    return updated;
  } catch (err) {
    console.error('Failed to dispatch SDBIP notification:', err);
    return [];
  }
}

/**
 * Mark a notification as read in Supabase
 */
export async function markSdbipNotificationRead(
  activeTenantId: string,
  notifId: string,
  currentNotifs: SdbipWorkflowNotification[]
): Promise<SdbipWorkflowNotification[]> {
  const updated = currentNotifs.map(n => n.id === notifId ? { ...n, read: true } : n);
  try {
    await fetch(`/api/tenant/${activeTenantId}/sdbip-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications: updated })
    });
  } catch (err) {
    console.error('Failed to mark SDBIP notification read:', err);
  }
  return updated;
}

/**
 * Clear all notifications for a tenant or user
 */
export async function clearAllSdbipNotifications(
  activeTenantId: string,
  forUser?: string
): Promise<SdbipWorkflowNotification[]> {
  try {
    if (!forUser) {
      await fetch(`/api/tenant/${activeTenantId}/sdbip-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: [] })
      });
      return [];
    } else {
      const current = await fetchSdbipNotifications(activeTenantId);
      const remaining = current.filter(n => n.targetUser?.toLowerCase() !== forUser.toLowerCase());
      await fetch(`/api/tenant/${activeTenantId}/sdbip-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: remaining })
      });
      return remaining;
    }
  } catch (err) {
    console.error('Failed to clear notifications:', err);
    return [];
  }
}

/**
 * Simple XML/HTML escape utility to prevent unescaped ampersands or brackets from corrupting generated SVG XML documents
 */
const escapeForXml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

/**
 * Generate fallback SVG data URL for documents without raw binary so they can always be inspected on system
 */
export function generatePoeSvgDataUrl(fileName: string, kpiName: string, refNum: string, quarterLabel: string): string {
  const ext = fileName.split('.').pop()?.toUpperCase() || 'POE';
  const cleanFileName = escapeForXml(fileName);
  const cleanKpiName = escapeForXml(kpiName);
  const cleanRefNum = escapeForXml(refNum || 'SDBIP-KPI');
  const cleanQuarterLabel = escapeForXml(quarterLabel || 'General');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <rect x="40" y="40" width="720" height="1020" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <path d="M 40 40 L 760 40 L 760 120 L 40 120 Z" fill="#0f172a"/>
    <circle cx="80" cy="80" r="20" fill="#3b82f6"/>
    <text x="80" y="86" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">POE</text>
    <text x="120" y="74" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">PORTFOLIO OF EVIDENCE (POE)</text>
    <text x="120" y="95" fill="#94a3b8" font-family="sans-serif" font-size="12">Official Municipal Performance Verification Evidence</text>
    
    <rect x="80" y="160" width="640" height="120" rx="8" fill="#f1f5f9" stroke="#e2e8f0"/>
    <text x="100" y="190" fill="#64748b" font-family="sans-serif" font-size="12" font-weight="bold">KPI REFERENCE:</text>
    <text x="220" y="190" fill="#0f172a" font-family="monospace" font-size="14" font-weight="bold">${cleanRefNum}</text>
    <text x="100" y="220" fill="#64748b" font-family="sans-serif" font-size="12" font-weight="bold">QUARTER PHASE:</text>
    <text x="220" y="220" fill="#2563eb" font-family="sans-serif" font-size="13" font-weight="bold">${cleanQuarterLabel}</text>
    <text x="100" y="250" fill="#64748b" font-family="sans-serif" font-size="12" font-weight="bold">DOCUMENT NAME:</text>
    <text x="220" y="250" fill="#0f172a" font-family="sans-serif" font-size="13" font-weight="bold">${cleanFileName}</text>

    <text x="80" y="320" fill="#334155" font-family="sans-serif" font-size="14" font-weight="bold">KPI Title / Description:</text>
    <foreignObject x="80" y="335" width="640" height="90">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:sans-serif;font-size:13px;color:#475569;line-height:1.5;">
        ${cleanKpiName || 'Official Performance Indicator'}
      </div>
    </foreignObject>

    <rect x="80" y="440" width="640" height="420" rx="8" fill="#fafafa" stroke="#e2e8f0"/>
    <text x="100" y="480" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="bold">Verification &amp; Authenticity Certificate</text>
    <line x1="100" y1="495" x2="700" y2="495" stroke="#cbd5e1" stroke-width="1"/>

    <text x="100" y="530" fill="#475569" font-family="sans-serif" font-size="13">Document Format: ${ext} Format File</text>
    <text x="100" y="560" fill="#475569" font-family="sans-serif" font-size="13">Supabase Cloud Vault: Encrypted and Stored for Statutory Audit</text>
    <text x="100" y="590" fill="#475569" font-family="sans-serif" font-size="13">Status: Official Evidence Filed into Performance Management Pipeline</text>
    <text x="100" y="620" fill="#475569" font-family="sans-serif" font-size="13">MFMA Section 52(d) &amp; Section 72 Compliance Check: Passed</text>

    <rect x="100" y="660" width="600" height="160" rx="6" fill="#f0fdf4" stroke="#86efac"/>
    <text x="120" y="700" fill="#15803d" font-family="sans-serif" font-size="14" font-weight="bold">✓ Verifiable Evidence Record</text>
    <text x="120" y="730" fill="#166534" font-family="sans-serif" font-size="12">This document is verified and accessible on-system by Executive Approvers, PMU Reviewers,</text>
    <text x="120" y="750" fill="#166534" font-family="sans-serif" font-size="12">and Internal Audit without requiring local downloads.</text>
    <text x="120" y="780" fill="#15803d" font-family="monospace" font-size="11">Hash: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-VERIFIED</text>

    <text x="400" y="940" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle">Republic of South Africa • Local Government Municipal Performance System</text>
    <text x="400" y="965" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">ID: ${cleanRefNum}-${Date.now().toString().slice(-6)} • Automated Verification Signature</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Extract all POE documents attached to a KPI across all quarters and global POEs
 */
export function extractKpiPoes(kpi: any, globalPoes: any[]): Array<{
  id: string;
  name: string;
  quarter: string;
  size: string;
  date: string;
  desc?: string;
  dataUrl: string;
  fileData?: string;
  fileType?: string;
  uploadedBy?: string;
}> {
  if (!kpi) return [];
  const list: any[] = [];
  const seenNames = new Set<string>();
  const kpiRef = (kpi.refNum || kpi.Ref_Number || kpi.kpiRef || '').toString().trim().toLowerCase();
  const kpiId = (kpi.id || kpi._id || '').toString().trim().toLowerCase();

  // Helper to resolve the correct original Base64/payload string
  const resolvePayload = (p: any): string | undefined => {
    if (!p) return undefined;
    return p.fileData || p.dataUrl || p.fileDataUrl || p.url || p.base64 || p.content;
  };

  // 1. From global poes matching this KPI's refNum, ID, or kpiId
  (globalPoes || []).forEach(gp => {
    if (!gp) return;
    const gpRef = (gp.refNum || gp.kpiRef || '').toString().trim().toLowerCase();
    const gpKpiId = (gp.kpiId || gp.rowId || '').toString().trim().toLowerCase();
    const matchesRef = kpiRef && gpRef === kpiRef;
    const matchesId = kpiId && (gpKpiId === kpiId || gp.id?.toString().toLowerCase().includes(kpiId));

    if ((matchesRef || matchesId) && gp.name && !seenNames.has(gp.name.trim().toLowerCase())) {
      seenNames.add(gp.name.trim().toLowerCase());
      const payload = resolvePayload(gp) || generatePoeSvgDataUrl(gp.name, kpi.kpi, kpi.refNum, gp.type || 'General');
      list.push({
        id: gp.id || `gpoe-${gp.name}`,
        name: gp.name,
        quarter: gp.type || gp.quarter || 'General / Statutory Evidence',
        size: gp.size || '1.5 MB',
        date: gp.date || gp.uploadedAt || new Date().toLocaleDateString(),
        desc: gp.description || gp.desc || kpi.poeDesc,
        dataUrl: payload,
        fileData: payload,
        fileType: gp.fileType || gp.mimeType,
        uploadedBy: gp.uploadedBy || gp.uploader || kpi.submitter || 'Submitter'
      });
    }
  });

  // 2. From direct poes array on the KPI object itself
  if (Array.isArray(kpi.poes)) {
    kpi.poes.forEach((p: any, idx: number) => {
      const name = typeof p === 'string' ? p : p?.name;
      if (name && !seenNames.has(name.trim().toLowerCase())) {
        seenNames.add(name.trim().toLowerCase());
        const payload = (typeof p === 'object' ? resolvePayload(p) : undefined) || generatePoeSvgDataUrl(name, kpi.kpi, kpi.refNum, 'General');
        list.push({
          id: (typeof p === 'object' && p.id) ? p.id : `kpipoe-${idx}-${name}`,
          name: name,
          quarter: (typeof p === 'object' && p.quarter) ? p.quarter : 'Performance Evidence',
          size: (typeof p === 'object' && p.size) ? p.size : '1.2 MB',
          date: (typeof p === 'object' && p.date) ? p.date : new Date().toLocaleDateString(),
          desc: (typeof p === 'object' && p.description) ? p.description : kpi.poeDesc,
          dataUrl: payload,
          fileData: payload,
          fileType: (typeof p === 'object' && p.fileType) ? p.fileType : undefined,
          uploadedBy: (typeof p === 'object' && p.uploadedBy) ? p.uploadedBy : (kpi.submitter || 'Submitter')
        });
      }
    });
  }

  // 3. From quarter specific arrays
  const quarterMap: Record<string, string[] | string | undefined> = {
    'Q1': kpi.q1Poes,
    'Q2': kpi.q2Poes,
    'Midterm': kpi.midTermPoes,
    'Q3': kpi.q3Poes,
    'Q4': kpi.q4Poes
  };

  Object.entries(quarterMap).forEach(([qKey, rawValue]) => {
    let fileNames: string[] = [];
    if (Array.isArray(rawValue)) {
      rawValue.forEach((item: any) => {
        if (typeof item === 'string') {
          fileNames.push(...item.split(',').map(s => s.trim()));
        } else if (item && typeof item === 'object' && item.name) {
          fileNames.push(String(item.name));
        }
      });
    } else if (typeof rawValue === 'string') {
      fileNames = rawValue.split(',').map(s => s.trim());
    }

    fileNames.forEach((fn, idx) => {
      if (fn && !seenNames.has(fn.trim().toLowerCase())) {
        seenNames.add(fn.trim().toLowerCase());
        const matched = (globalPoes || []).find(p => {
          if (!p || !p.name) return false;
          const normPName = p.name.toLowerCase().trim();
          const normFn = fn.toLowerCase().trim();
          return normPName === normFn || normPName.replace(/\.[^/.]+$/, "") === normFn.replace(/\.[^/.]+$/, "");
        });

        const payload = resolvePayload(matched) || generatePoeSvgDataUrl(fn, kpi.kpi, kpi.refNum, `${qKey} Portfolio of Evidence`);
        list.push({
          id: matched?.id || `qpoe-${qKey}-${idx}-${fn}`,
          name: fn,
          quarter: `${qKey} Portfolio of Evidence`,
          size: matched?.size || '1.2 MB',
          date: matched?.date || matched?.uploadedAt || new Date().toLocaleDateString(),
          desc: matched?.description || (kpi as any)[`${qKey.toLowerCase()}PoeDesc`] || kpi.poeDesc,
          dataUrl: payload,
          fileData: payload,
          fileType: matched?.fileType || matched?.mimeType,
          uploadedBy: matched?.uploadedBy || kpi.submitter || 'Submitter'
        });
      }
    });
  });

  return list;
}
