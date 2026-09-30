import type { User } from '../types';

/**
 * Checks if a user is completely unrestricted.
 * Completely unrestricted users include:
 * - delphine@mzansiflow.co.za (and any email containing delphine)
 * - mike@mzansiflow.co.za / mike@massivedynamixdistributors.com
 * - Any user whose original logged in admin account in sessionStorage was delphine@mzansiflow.co.za or an admin
 * - Any user who is an admin or Global Administrator
 */
export function isUserUnrestricted(user?: User | { email?: string; role?: string; systemRole?: string; jobFunction?: string } | null): boolean {
  // Check if original logged-in admin in sessionStorage is unrestricted
  try {
    if (typeof window !== 'undefined') {
      const origStr = sessionStorage.getItem('originalAdminUser');
      if (origStr && origStr !== 'undefined' && origStr !== 'null') {
        const orig = JSON.parse(origStr);
        const origEmail = (orig?.email || '').toLowerCase().trim();
        if (
          origEmail === 'delphine@mzansiflow.co.za' ||
          origEmail.includes('delphine') ||
          origEmail === 'mike@massivedynamixdistributors.com' ||
          origEmail === 'mike@mzansiflow.co.za' ||
          origEmail.endsWith('@mzansiflow.co.za') ||
          orig?.role === 'admin' ||
          orig?.systemRole === 'Global Administrator'
        ) {
          return true;
        }
      }
    }
  } catch (e) {
    // ignore parse errors
  }

  if (!user || !user.email) return false;
  const email = (user.email || '').toLowerCase().trim();
  
  return (
    email === 'delphine@mzansiflow.co.za' ||
    email.includes('delphine') ||
    email === 'mike@massivedynamixdistributors.com' ||
    email === 'mike@mzansiflow.co.za' ||
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
