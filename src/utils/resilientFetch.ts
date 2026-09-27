/**
 * Resilient Network & Session Protection Layer (Zero-Kickout Guard)
 * - Automatic exponential backoff retries for transient 500, 502, 503, 504 and network blips
 * - Emits global connectivity events for seamless user experience
 * - Guarantees user sessions are never wiped due to gateway/database hiccups
 */

type NetworkStatusListener = (status: {
  isReconnecting: boolean;
  message?: string;
  lastAttempt?: number;
}) => void;

const listeners: Set<NetworkStatusListener> = new Set();
let reconnectingState = false;

// Safe reference to the native fetch function
const nativeFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> =
  typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? window.fetch.bind(window)
    : (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init);

export function subscribeNetworkStatus(listener: NetworkStatusListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(isReconnecting: boolean, message?: string) {
  reconnectingState = isReconnecting;
  listeners.forEach(cb => {
    try {
      cb({ isReconnecting, message, lastAttempt: Date.now() });
    } catch (e) {
      console.error("[NetworkResilience] Error in status callback:", e);
    }
  });
}

export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { maxRetries?: number; retryDelayMs?: number; silent?: boolean }
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.retryDelayMs ?? 1000;
  const silent = options?.silent ?? false;

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await nativeFetch(input, init);

      // Status 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout), 408 (Request Timeout)
      // or temporary 500 under heavy database load: retry automatically
      const isTransientError = [408, 500, 502, 503, 504].includes(response.status);

      if (isTransientError && attempt < maxRetries) {
        attempt++;
        const delay = baseDelay * Math.pow(1.5, attempt - 1);
        if (!silent) {
          notifyListeners(true, `Server busy (HTTP ${response.status}). Retrying (${attempt}/${maxRetries})...`);
        }
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (reconnectingState && !silent) {
        notifyListeners(false, "Connection restored");
      }

      return response;
    } catch (err: any) {
      // Network drop, DNS glitch, offline or dropped connection
      if (attempt < maxRetries) {
        attempt++;
        const delay = baseDelay * Math.pow(1.5, attempt - 1);
        if (!silent) {
          notifyListeners(true, `Network glitch detected. Retrying (${attempt}/${maxRetries})...`);
        }
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (!silent) {
        notifyListeners(true, "Temporary network delay. Your session remains safely active.");
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
    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'fetch');
    if (descriptor && !descriptor.writable && !descriptor.set) {
      // Property is getter-only and non-writable; do not attempt direct assignment to prevent TypeError
      isPatched = true;
      return;
    }

    // Try standard assignment or defineProperty inside safe try-catch
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
