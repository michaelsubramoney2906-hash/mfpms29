import type { User } from '../types';

/**
 * Official Designated Global Administrators:
 * - marlan@mzansiflow / marlan@mzansiflow.co.za
 * - bonganim@mzansiflow.co.za / bongani@mzansiflow.co.za
 * - audrey@mzansiflow.co.za
 * - delphine@mzansiflow.co.za
 * - ryanw@mzansiflow.co.za
 * - qiniso@mzansiflow.co.za
 * - mike@mzansiflow.co.za / mike@massivedynamixdistributors.com
 */
export const GLOBAL_ADMIN_EMAILS = [
  'mike@mzansiflow.co.za',
  'mike@massivedynamixdistributors.com',
  'delphine@mzansiflow.co.za',
  'delpjhine@mzansiflow.co.za',
  'audrey@mzansiflow.co.za',
  'qiniso@mzansiflow.co.za',
  'bonganim@mzansiflow.co.za',
  'bongani@mzansiflow.co.za',
  'ryanw@mzansiflow.co.za',
  'marlan@mzansiflow.co.za',
  'marlan@mzansiflow'
];

export const READ_ONLY_USER_EMAILS: string[] = [];

export function isReadOnlyEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return READ_ONLY_USER_EMAILS.includes(clean);
}

export function isReadOnlyUser(user?: User | { email?: string; role?: string; systemRole?: string; isReadOnly?: boolean } | null): boolean {
  try {
    if (typeof window !== 'undefined') {
      const origStr = localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser');
      if (origStr && origStr !== 'undefined' && origStr !== 'null') {
        const parsed = JSON.parse(origStr);
        if (isReadOnlyEmail(parsed?.email) || parsed?.isReadOnly === true || String(parsed?.systemRole || '').toLowerCase().includes('read-only')) {
          return true;
        }
      }
    }
  } catch (e) {}

  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const role = String(user.role || '').toLowerCase().trim();
  const sysRole = String(user.systemRole || '').toLowerCase().trim();
  return (
    isReadOnlyEmail(email) ||
    Boolean((user as any).isReadOnly) ||
    role.includes('read-only') ||
    role.includes('readonly') ||
    sysRole.includes('read-only') ||
    sysRole.includes('readonly')
  );
}

export function isGlobalAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  if (isReadOnlyEmail(clean)) return false;
  return GLOBAL_ADMIN_EMAILS.some(adm => clean === adm || clean.startsWith(adm));
}

/**
 * Checks if a user is completely unrestricted.
 * When impersonating, strictly NO dual-role admin bleed:
 * The impersonated session adopts only the target user's true operational persona.
 */
export function isUserUnrestricted(user?: User | { email?: string; role?: string; systemRole?: string; jobFunction?: string; isReadOnly?: boolean } | null): boolean {
  if (!user || !user.email) return false;
  const email = (user.email || '').toLowerCase().trim();
  if (isReadOnlyEmail(email)) return true;

  if (email.includes('mahlanguen@nkangaladm.gov.za') || email.includes('mahlanguen')) {
    return true;
  }

  // If currently impersonating, allow @mzansiflow.co.za administrators to recapture performance agreements freely
  try {
    if (typeof window !== 'undefined') {
      const origStr = localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser');
      if (origStr && origStr !== 'undefined' && origStr !== 'null') {
        let origEmail = '';
        try {
          const parsed = JSON.parse(origStr);
          origEmail = (parsed?.email || '').toLowerCase().trim();
        } catch (e) {
          origEmail = String(origStr).toLowerCase().trim();
        }
        if (isGlobalAdminEmail(origEmail) || origEmail.endsWith('@mzansiflow.co.za') || origEmail.includes('mzansiflow.co.za')) {
          return true;
        }
        return isGlobalAdminEmail(email);
      }
    }
  } catch (e) {
    // ignore parse errors
  }
  
  if (isGlobalAdminEmail(email)) {
    return true;
  }

  return (
    email.endsWith('@mzansiflow.co.za') ||
    user.role === 'admin' ||
    user.systemRole === 'Global Administrator' ||
    user.systemRole === 'Systems Administrator'
  );
}

/**
 * Checks if a user should have copying allowed.
 * All @mzansiflow.co.za users have copying allowed.
 */
export function isCopyAllowed(user?: { email?: string } | null): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  return (
    email.endsWith('@mzansiflow.co.za') ||
    email.includes('mzansiflow.co.za') ||
    email === 'delphine@mzansiflow.co.za' ||
    email.includes('massivedynamixdistributors.com')
  );
}

/**
 * Checks if workspace watermark should be hidden.
 * Hidden for all @nkangaladm.gov.za and mzansiflow.co.za users.
 */
export function shouldHideWatermark(user?: { email?: string } | null): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  return (
    email.endsWith('@nkangaladm.gov.za') ||
    email.includes('nkangaladm.gov.za') ||
    email.endsWith('@mzansiflow.co.za') ||
    email.includes('mzansiflow.co.za') ||
    email.includes('massivedynamixdistributors.com')
  );
}
