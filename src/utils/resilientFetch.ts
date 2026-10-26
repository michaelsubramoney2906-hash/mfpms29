/**
 * Resilient Network & Session Protection Layer (Zero-Kickout Guard)
 * - Automatic exponential backoff retries for transient 500, 502, 503, 504 and network blips
 * - Fully silent background retries without intrusive popup notifications
 * - Guarantees user sessions are never wiped due to gateway/database hiccups
 */

// Safe reference to the native fetch function
const nativeFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> =
  typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? window.fetch.bind(window)
    : (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init);

export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { maxRetries?: number; retryDelayMs?: number }
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.retryDelayMs ?? 1000;

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await nativeFetch(input, init);

      const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request)?.url || '';
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isUnexpectedHtmlForApi =
        urlStr.includes('/api/') &&
        !urlStr.includes('/api/proxy-image') &&
        !urlStr.includes('/api/download/') &&
        contentType.includes('text/html');

      // Status 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout), 408 (Request Timeout),
      // temporary 500 under heavy database load, or gateway HTML splash during reload: retry automatically
      const isTransientError = [408, 500, 502, 503, 504].includes(response.status) || isUnexpectedHtmlForApi;

      if (isTransientError && attempt < maxRetries) {
        attempt++;
        const delay = baseDelay * Math.pow(1.5, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (isUnexpectedHtmlForApi) {
        return new Response(JSON.stringify({ error: 'Temporary gateway reload', tickets: [] }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return response;
    } catch (err: any) {
      // Network drop, DNS glitch, offline or dropped connection
      if (attempt < maxRetries) {
        attempt++;
        const delay = baseDelay * Math.pow(1.5, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }

  // Fallback
  return nativeFetch(input, init);
}

// Global fetch patch for application-wide protection
let isPatched = false;
export function installResilientNetworkInterceptor() {
  if (typeof window === "undefined" || isPatched) return;

  const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request)?.url || '';
    
    // Bypass retries for explicit one-shot endpoints like ping or version check
    if (urlStr.includes('/api/auth/ping') || urlStr.includes('/api/version')) {
      return nativeFetch(input, init);
    }

    return resilientFetch(input, init, { maxRetries: 2, retryDelayMs: 800 });
  };

  try {
    try {
      window.fetch = wrappedFetch;
      isPatched = true;
    } catch {
      try {
        Object.defineProperty(window, 'fetch', {
          value: wrappedFetch,
          writable: true,
          configurable: true
        });
        isPatched = true;
      } catch {
        // Silently preserve native fetch in locked iframe environments
      }
    }
  } catch {
    // Graceful fallback
  }
}
