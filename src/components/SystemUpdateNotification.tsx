import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles, ShieldCheck, X, ArrowRight, Clock } from 'lucide-react';

interface VersionResponse {
  version: string;
  buildTime?: string;
  env?: string;
  serverTime?: string;
}

export function SystemUpdateNotification() {
  const [currentClientVersion, setCurrentClientVersion] = useState<string>('');
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [serverBuildTime, setServerBuildTime] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [snoozedUntil, setSnoozedUntil] = useState<number>(0);

  // Initialize client build id from Vite define or runtime fallback
  useEffect(() => {
    let clientVer = '';
    try {
      if (typeof __APP_BUILD_ID__ !== 'undefined' && __APP_BUILD_ID__) {
        clientVer = __APP_BUILD_ID__;
      }
    } catch (e) {}

    if (!clientVer && typeof window !== 'undefined' && (window as any).__APP_BUILD_ID__) {
      clientVer = (window as any).__APP_BUILD_ID__;
    }

    if (!clientVer) {
      // Look in sessionStorage for initial loaded version to ensure stable baseline
      const stored = sessionStorage.getItem('app_loaded_client_version');
      if (stored) {
        clientVer = stored;
      }
    }

    if (clientVer) {
      setCurrentClientVersion(clientVer);
      sessionStorage.setItem('app_loaded_client_version', clientVer);
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    // If user snoozed the update notification, don't show until timer expires
    if (Date.now() < snoozedUntil) {
      return;
    }

    try {
      const response = await fetch(`/api/version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) return;

      const data: VersionResponse = await response.json();
      if (!data || !data.version) return;

      // If client version is not set yet, store first received version as baseline
      setCurrentClientVersion((prev) => {
        if (!prev) {
          sessionStorage.setItem('app_loaded_client_version', data.version);
          return data.version;
        }
        
        // If versions differ and neither is generic dev, prompt update
        if (
          data.version !== prev &&
          data.version !== 'development' &&
          prev !== 'development'
        ) {
          setServerVersion(data.version);
          if (data.buildTime) {
            setServerBuildTime(data.buildTime);
          }
        }
        return prev;
      });
    } catch (err) {
      // Silently ignore offline or transient network drops to avoid disruption
    }
  }, [snoozedUntil]);

  // Periodic polling every 30 seconds + trigger on window focus and tab return
  useEffect(() => {
    // Immediate check after short delay
    const initialTimer = setTimeout(checkForUpdate, 3000);

    // Periodic check every 30 seconds
    const interval = setInterval(checkForUpdate, 30000);

    const handleFocusCheck = () => {
      if (!document.hidden && navigator.onLine) {
        checkForUpdate();
      }
    };

    window.addEventListener('visibilitychange', handleFocusCheck);
    window.addEventListener('focus', handleFocusCheck);
    window.addEventListener('online', handleFocusCheck);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleFocusCheck);
      window.removeEventListener('focus', handleFocusCheck);
      window.removeEventListener('online', handleFocusCheck);
    };
  }, [checkForUpdate]);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);

    try {
      // 1. Unregister any service workers that might intercept network requests
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 2. Clear browser cache storage if available
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            await caches.delete(name);
          }
        } catch (e) {}
      }

      // 3. Update session storage to reflect new version
      if (serverVersion) {
        sessionStorage.setItem('app_loaded_client_version', serverVersion);
      }
    } catch (e) {
      console.warn("Pre-update cleanup completed with notices:", e);
    }

    // 4. Force browser to reload from server with timestamp query param to bypass proxy/disk cache
    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('_upd', String(Date.now()));
      window.location.replace(url.toString());
    }, 400);
  };

  const handleSnooze = () => {
    // Snooze for 15 minutes (900,000 ms)
    setSnoozedUntil(Date.now() + 15 * 60 * 1000);
    setServerVersion(null);
  };

  // If no new version detected or currently snoozed, render nothing
  if (!serverVersion || Date.now() < snoozedUntil) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999999] max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border-2 border-emerald-500/70 text-slate-100 rounded-2xl shadow-2xl backdrop-blur-xl p-5 overflow-hidden relative">
        {/* Top ambient highlight line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin text-emerald-300' : ''}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  System Update Ready
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded-full font-mono font-bold tracking-tight">
                  LIVE
                </span>
              </div>
              <button
                type="button"
                onClick={handleSnooze}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition hover:bg-slate-800"
                title="Dismiss for 15 minutes"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
              A fresh update has been deployed to the live system. Accept update to load the latest features.
            </p>

            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400/90 font-medium bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-900/40">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero data loss: Current session and cloud records stay intact.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-1">
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleApplyUpdate}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-lg transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating System...</span>
                  </>
                ) : (
                  <>
                    <span>Accept & Update Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSnooze}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold py-2 px-3 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
                title="Remind me later"
              >
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Later</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
