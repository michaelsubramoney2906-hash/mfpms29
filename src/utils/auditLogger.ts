// Client-side Audit Logger for tracking module/submodule accesses and user interactions in real-time
// Persists directly to Supabase via server-side /api/audit/log-access

export interface LogAccessPayload {
  email: string;
  fullName?: string;
  tenantId?: string;
  role?: string;
  department?: string;
  action?: string;
  moduleId: string;
  moduleName?: string;
  subModuleId?: string;
  subModuleName?: string;
  details?: string;
}

let lastLogKey = '';
let lastLogTime = 0;

export async function logUserAccess(payload: LogAccessPayload): Promise<void> {
  try {
    const email = (payload.email || '').toLowerCase().trim();
    // Rule: Exclude mike@mzansiflow.co.za
    if (!email || email === 'mike@mzansiflow.co.za') {
      return;
    }

    // Debounce duplicate events within 3 seconds
    const key = `${email}:${payload.moduleId}:${payload.subModuleId || ''}:${payload.action || 'access'}`;
    const now = Date.now();
    if (key === lastLogKey && now - lastLogTime < 3000) {
      return;
    }
    lastLogKey = key;
    lastLogTime = now;

    await fetch('/api/audit/log-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Non-blocking telemetry
  }
}
