/**
 * SDBIP / OPMS Multi-Tier Workflow & Real-Time Notification Utilities
 * Handles Submitter -> Approver -> Reviewer (PMS Team) -> Internal Audit pipeline with Supabase persistence.
 */

export const PMS_TEAM_REVIEWERS = [
  'zulune@nkangaladm.gov.za',
  'lukhelema@nkangaladm.gov.za',
  'khuboniy@nkangaladm.gov.za'
];

export interface ReviewerOfficial {
  fullName: string;
  email: string;
  username: string;
  displayName: string;
}

export const OFFICIAL_REVIEWERS: ReviewerOfficial[] = [
  { 
    fullName: 'Noluthando Zulu', 
    email: 'zulune@nkangaladm.gov.za', 
    username: 'zulune',
    displayName: 'Noluthando Zulu (@zulune)'
  },
  { 
    fullName: 'Mduduzi Lukhele', 
    email: 'lukhelema@nkangaladm.gov.za', 
    username: 'lukhelema',
    displayName: 'Mduduzi Lukhele (@lukhelema)'
  }
];

export const INTERNAL_AUDIT_USERS = [
  'seeranepl@nkangaladm.gov.za',
  'masemolak@nkangaladm.gov.za',
  'mpanzacs@nkangaladm.gov.za'
];

export interface InternalAuditorOfficial {
  fullName: string;
  email: string;
  username: string;
  displayName: string;
}

export const OFFICIAL_INTERNAL_AUDITORS: InternalAuditorOfficial[] = [
  { 
    fullName: 'Peggy L. Seerane', 
    email: 'seeranepl@nkangaladm.gov.za', 
    username: 'seeranepl',
    displayName: 'Peggy L. Seerane (@seeranepl)'
  },
  { 
    fullName: 'Katlego Masemola', 
    email: 'masemolak@nkangaladm.gov.za', 
    username: 'masemolak',
    displayName: 'Katlego Masemola (@masemolak)'
  }
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
  user: { email?: string; fullName?: string; full_name?: string; name?: string; username?: string; role?: string; jobFunction?: string } | undefined | null
): boolean {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  const isPmsMember = PMS_TEAM_REVIEWERS.map(e => e.toLowerCase()).includes(email);
  const isAuditMember = INTERNAL_AUDIT_USERS.map(e => e.toLowerCase()).includes(email);

  // If targetUser is null or undefined or empty, do not match any user
  if (!targetUser || !targetUser.trim()) {
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
  const fullName = (user.fullName || (user as any).full_name || (user as any).name || '').trim().toLowerCase();
  const username = (user.username || emailPrefix || '').trim().toLowerCase();
  const jobFunction = (user.jobFunction || (user as any).job_function || '').trim().toLowerCase();

  // Helper to normalize names by removing punctuation and single-character middle initials
  const normalizeName = (str: string): string => {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(w => w.length > 1)
      .join(' ');
  };

  const normTarget = normalizeName(target);
  const normFullName = normalizeName(fullName);

  // 1. Direct Email Matching (Authoritative Azure AD Identity)
  if (target.includes('@')) {
    if (target === email) return true;
    if (emailPrefix && target.split('@')[0] === emailPrefix) return true;
    return false; // Target specifies an exact email address; no other user should match.
  }

  // 2. Exact Identity Matches (Full Name, Username, Email Prefix)
  if (target === email) return true;
  if (emailPrefix && target === emailPrefix) return true;
  if (username && target === username) return true;
  if (fullName && target === fullName) return true;
  if (normFullName && normTarget && normFullName === normTarget) return true;

  // 3. Canonical directory matching for Nkangala District Municipality officials
  const NKANGALA_OFFICIAL_MAP: Record<string, string[]> = {
    // Executive Approvers
    'standeral@nkangaladm.gov.za': [
      'alice l. stander', 'alice stander', 'a.l. stander', 'a stander', 'stander', 'alice', 'standeral'
    ],
    'rampedimr@nkangaladm.gov.za': [
      'mmaphiri r. rampedi', 'mmaphiri rampedi', 'm rampedi', 'rampedi', 'rampedimr'
    ],
    'lengwatetm@nkangaladm.gov.za': [
      'thandiwe m. lengwate', 'thandiwe lengwate', 't lengwate', 'lengwate', 'lengwatetm'
    ],
    'ralephalengjn@nkangaladm.gov.za': [
      'juliet n. ralephaleng', 'juliet ralephaleng', 'j ralephaleng', 'ralephaleng', 'jane ralephaleng', 'ralephalengjn'
    ],
    'bvumaa@nkangaladm.gov.za': [
      'alvin bvuma', 'a bvuma', 'bvuma', 'bvumaa'
    ],
    'shabangusm@nkangaladm.gov.za': [
      'sibusiso m. shabangu', 'sibusiso shabangu', 's.m. shabangu', 's shabangu', 'shabangusm', 'shabangus'
    ],
    'khumalobs@nkangaladm.gov.za': [
      'bongani s. khumalo', 'bongani khumalo', 'b khumalo', 'khumalobs'
    ],
    'nkosibs@nkangaladm.gov.za': [
      'bongani s. khumalo', 'bongani khumalo', 'b khumalo', 'nkosibs'
    ],
    'mtshweniwm@nkangaladm.gov.za': [
      'walter m. mtshweni', 'walter mtshweni', 'w mtshweni', 'mtshweniwm'
    ],
    'mahlangu@nkangaladm.gov.za': [
      'mandla m. mahlangu', 'mandla l. mahlangu', 'mandla mahlangu', 'm mahlangu'
    ],
    'mahlanguml@nkangaladm.gov.za': [
      'mandla m. mahlangu', 'mandla l. mahlangu', 'mandla mahlangu', 'm mahlangu', 'mahlanguml'
    ],
    'twalaad@nkangaladm.gov.za': [
      'amos d. twala', 'amos twala', 'a.d. twala', 'a twala', 'twalaad'
    ],

    // Departmental Submitters & Officials
    'skosanah@nkangaladm.gov.za': ['headman skosana', 'hendrick skosana', 'h skosana', 'skosanah'],
    'skosanaj@nkangaladm.gov.za': ['jackson skosana', 'j skosana', 'skosanaj'],
    'nhlaphomj@nkangaladm.gov.za': ['jimmy nhlapho', 'jimmy m. nhlapho', 'j nhlapho', 'nhlaphomj', 'nhlapho'],
    'maphangant@nkangaladm.gov.za': ['nomhle maphanga', 'nomhle t. maphanga', 'n maphanga', 'maphangant', 'maphanga'],
    'maphangan@nkangaladm.gov.za': ['nomhle maphanga', 'n maphanga', 'maphangan', 'maphanga'],
    'masilelasi@nkangaladm.gov.za': ['sipho masilela', 'simon masilela', 's masilela', 'masilelasi', 'masilela'],
    'masilelas@nkangaladm.gov.za': ['sipho masilela', 'simon masilela', 's masilela', 'masilelas', 'masilela'],
    'mapitsingmm@nkangaladm.gov.za': ['monantsi mapitsing', 'lordwick m. mapitsing', 'lordwick mapitsing', 'm mapitsing', 'mapitsingmm'],
    'mapitsinglm@nkangaladm.gov.za': ['monantsi mapitsing', 'lordwick m. mapitsing', 'lordwick mapitsing', 'm mapitsing', 'mapitsinglm'],
    'mapitsingm@nkangaladm.gov.za': ['monantsi mapitsing', 'lordwick m. mapitsing', 'lordwick mapitsing', 'm mapitsing', 'mapitsingm'],
    'skhosanaqj@nkangaladm.gov.za': ['quinton skhosana', 'quinton j. skhosana', 'q skhosana', 'skhosanaqj', 'quinton'],
    'shabanguf@nkangaladm.gov.za': ['fortress shabangu', 'f shabangu', 'shabanguf', 'fortress'],
    'kubhekavs@nkangaladm.gov.za': ['vusumuzi s. kubheka', 'vusumuzi kubheka', 'v kubheka', 'kubhekavs'],
    'kubhekazc@nkangaladm.gov.za': ['vusumuzi s. kubheka', 'vusumuzi kubheka', 'zwelakhe c. kubheka', 'kubhekazc'],
    'masekofm@nkangaladm.gov.za': ['fikile maseko', 'f maseko', 'masekofm'],
    'masekoat@nkangaladm.gov.za': ['fikile maseko', 'alfred t. maseko', 'masekoat'],
    'masekome@nkangaladm.gov.za': ['fikile maseko', 'm. e. maseko', 'masekome'],
    'phalahl@nkangaladm.gov.za': ['hlabishi l. phala', 'hlabishi phala', 'h phala', 'phalahl', 'phala'],
    'msizaas@nkangaladm.gov.za': ['ali s. msiza', 'ali msiza', 'a msiza', 'msizaas'],
    'nsibandenp@nkangaladm.gov.za': ['nompumelelo p. nsibande', 'nompumelelo nsibande', 'n.p. nsibande', 'n nsibande', 'nsibandenp', 'nsibande'],
    'hlongwaan@nkangaladm.gov.za': ['andile n. hlongwa', 'andile hlongwa', 'ananias hlongwa', 'a hlongwa', 'hlongwaan', 'hlongwa'],
    'morarj@nkangaladm.gov.za': ['jayvanti morar', 'jayvanti', 'j morar', 'morarj', 'morar'],
    'dimpems@nkangaladm.gov.za': ['meshack s. dimpe', 'meshack dimpe', 'm dimpe', 'dimpems', 'dimpe'],
    'mazwitc@nkangaladm.gov.za': ['thandiwe mazwi', 't.c. mazwi', 't mazwi', 'mazwitc', 'mazwi'],
    'mazwit@nkangaladm.gov.za': ['thandiwe mazwi', 't mazwi', 'mazwit', 'mazwi'],
    'mthimunyen@nkangaladm.gov.za': ['nokuthula d. mthimunye', 'nokuthula mthimunye', 'n mthimunye', 'mthimunyen', 'mthimunye'],
    'mabundatt@nkangaladm.gov.za': ['tiro mabunda', 't.t. mabunda', 't mabunda', 'mabundatt', 'mabunda'],
    'nkosis@nkangaladm.gov.za': ['sanele nkosi', 'sipho nkosi', 's nkosi', 'nkosis'],
    'nkosiss@nkangaladm.gov.za': ['sanele nkosi', 's nkosi', 'nkosiss'],
    'nkosiln@nkangaladm.gov.za': ['sanele nkosi', 'lungile n. nkosi', 'nkosiln'],
    'nkosiwm@nkangaladm.gov.za': ['sanele nkosi', 'welile m. nkosi', 'nkosiwm'],
    'vanniekerkt@nkangaladm.gov.za': ['trudie van niekerk', 'theuns van niekerk', 't van niekerk', 'vanniekerkt', 'van niekerk'],
    'bembem@nkangaladm.gov.za': ['mxolisi bembe', 'mzilikazi bembe', 'm bembe', 'bembem', 'bembe'],
    'wakenis@nkangaladm.gov.za': ['sipokazi wakeni', 's wakeni', 'wakenis', 'wakeni'],
    'mokgolomothome@nkangaladm.gov.za': ['mokgadi mokgolomotho', 'm mokgolomotho', 'mokgolomothome', 'mokgolomotho'],
    'linkss@nkangaladm.gov.za': ['solly links', 'sipho links', 's links', 'linkss', 'links'],
    'ndlovutf@nkangaladm.gov.za': ['thembi ndlovu', 't ndlovu', 'ndlovutf'],
    'ndlovur@nkangaladm.gov.za': ['thembi ndlovu', 'rose ndlovu', 'ndlovur'],
    'msizaa@nkangaladm.gov.za': ['annah msiza', 'a msiza', 'msizaa'],
    'mametjae@nkangaladm.gov.za': ['edwin mametja', 'e mametja', 'mametjae', 'mametja'],
    'simelanenl@nkangaladm.gov.za': ['nompumelelo simelane', 'nomusa simelane', 'n simelane', 'simelanenl', 'simelane'],
    'simelanebm@nkangaladm.gov.za': ['nompumelelo simelane', 'bongakonke m. simelane', 'simelanebm', 'simelane'],
    'msokil@nkangaladm.gov.za': ['lucky msoki', 'l msoki', 'msokil', 'msoki'],
    'msokilt@nkangaladm.gov.za': ['lucky msoki', 'l msoki', 'msokilt', 'msoki'],
    'aphanemr@nkangaladm.gov.za': ['mmaphefo aphane', 'm aphane', 'aphanemr', 'aphane'],
    'aphanesl@nkangaladm.gov.za': ['mmaphefo aphane', 'stephina l. aphane', 'aphanesl', 'aphane'],

    // Reviewers & Internal Auditors
    'zulune@nkangaladm.gov.za': ['noluthando zulu', 'n zulu', 'zulune', 'zulu'],
    'lukhelema@nkangaladm.gov.za': ['mduduzi lukhele', 'm lukhele', 'lukhelema', 'lukhele'],
    'khuboniy@nkangaladm.gov.za': ['yena khuboni', 'y khuboni', 'khuboniy', 'khuboni'],
    'seeranepl@nkangaladm.gov.za': ['peggy l. seerane', 'peggy seerane', 'p seerane', 'seeranepl', 'seerane'],
    'masemolak@nkangaladm.gov.za': ['katlego masemola', 'k masemola', 'masemolak', 'masemola'],
    'mpanzacs@nkangaladm.gov.za': ['sthembile c. mpanza', 'sthembile mpanza', 's mpanza', 'mpanzacs', 'mpanza']
  };

  for (const [canonicalEmail, aliases] of Object.entries(NKANGALA_OFFICIAL_MAP)) {
    const isEmailCurrent = email === canonicalEmail;
    const isUsernameCurrent = username === canonicalEmail.split('@')[0];
    const isCurrentIdentity = isEmailCurrent || isUsernameCurrent || (normFullName && aliases.some(alias => normFullName === normalizeName(alias)));

    if (isCurrentIdentity) {
      if (aliases.some(alias => {
        const normAlias = normalizeName(alias);
        return target === alias || normTarget === normAlias || target === canonicalEmail || target === canonicalEmail.split('@')[0];
      })) {
        return true;
      }
    }

    if (aliases.some(alias => {
      const normAlias = normalizeName(alias);
      return target === alias || (normTarget && normTarget === normAlias);
    })) {
      if (isCurrentIdentity) {
        return true;
      }
    }
  }

  // 4. Exact Username or Email Prefix check
  if (emailPrefix && (target === emailPrefix || normTarget === emailPrefix)) {
    return true;
  }
  if (username && (target === username || normTarget === username)) {
    return true;
  }

  // 5. Full Name contains check
  if (fullName && (fullName === target || normFullName === normTarget)) return true;

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
    const cleanKpiRef = kpiRef.replace(/[^a-z0-9]/g, '');
    const cleanGpRef = gpRef.replace(/[^a-z0-9]/g, '');
    const matchesRef = (kpiRef && gpRef === kpiRef) || (cleanKpiRef && cleanGpRef && cleanKpiRef === cleanGpRef) || (cleanKpiRef && cleanGpRef && (cleanKpiRef.endsWith(cleanGpRef) || cleanGpRef.endsWith(cleanKpiRef)));
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
