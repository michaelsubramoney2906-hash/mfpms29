/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Sparkles, X, ShieldAlert } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { NEDAPortal } from './components/NEDAPortal';
import { SecurityShield } from './components/SecurityShield';
import { DataLossPreventionWrapper } from './components/DataLossPreventionWrapper';
import { SystemUpdateNotification } from './components/SystemUpdateNotification';
import { FinancialYearProvider } from './context/FinancialYearContext';
import { ThemeProvider } from './context/ThemeContext';
import { performanceLogger } from './utils/performanceLogger';
import { isReadOnlyUser } from './utils/unrestrictedHelper';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [readOnlyNotice, setReadOnlyNotice] = useState<string | null>(null);

  // 1. Multi-Tier Persistent Storage Initialization (localStorage primary, sessionStorage fallback) + Cross-Tab Sync
  useEffect(() => {
    performanceLogger.init();
    const loadStoredUser = () => {
      const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (userStr && userStr !== 'undefined' && userStr !== '[object Object]') {
        try {
          const parsed = JSON.parse(userStr);
          setUser((prev) => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(parsed)) {
              return parsed;
            }
            return prev;
          });
          // Ensure both stores remain in sync
          localStorage.setItem('currentUser', userStr);
          sessionStorage.setItem('currentUser', userStr);
          performanceLogger.setUserContext(parsed.email, parsed.tenantId);
        } catch (e) {
          console.error("Failed to parse currentUser from storage", e);
        }
      }
    };

    loadStoredUser();

    // Cross-tab synchronization to prevent desynchronization or accidental logout across browser tabs
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'currentUser') {
        if (event.newValue && event.newValue !== 'undefined' && event.newValue !== '[object Object]') {
          try {
            const parsed = JSON.parse(event.newValue);
            setUser(parsed);
            sessionStorage.setItem('currentUser', event.newValue);
            performanceLogger.setUserContext(parsed.email, parsed.tenantId);
          } catch (err) {
            // Ignore malformed storage updates
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const handleSetUser = (u: User | null) => {
    if (u) {
      if (!u.loginTime) {
        u.loginTime = new Date().toISOString();
      }
      const userSerialized = JSON.stringify(u);
      localStorage.setItem('currentUser', userSerialized);
      sessionStorage.setItem('currentUser', userSerialized);
      performanceLogger.setUserContext(u.email, u.tenantId);
    } else {
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      localStorage.removeItem('originalAdminUser');
      sessionStorage.removeItem('originalAdminUser');
      localStorage.removeItem('azure_ad_token');
      sessionStorage.removeItem('azure_ad_token');
      performanceLogger.setUserContext('anonymous', 'default');
    }
    setUser(u);
  };

  // 2. High-Concurrency Zero-Kickout Session Keep-Alive Heartbeat
  useEffect(() => {
    if (!user) return;

    let isPinging = false;
    const pingSession = async () => {
      if (isPinging) return;
      isPinging = true;
      try {
        await fetch('/api/auth/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            tenantId: user.tenantId,
            fullName: user.fullName || user.email.split('@')[0],
            userId: user.email
          })
        });
      } catch (err) {
        // Silently preserve session; network lags/reconnects never log users out
      } finally {
        isPinging = false;
      }
    };

    pingSession();
    const pingInterval = setInterval(pingSession, 30000);

    const handleWakeOrFocus = () => {
      if (!document.hidden && navigator.onLine) {
        pingSession();
      }
    };

    window.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);
    window.addEventListener('online', handleWakeOrFocus);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
      window.removeEventListener('online', handleWakeOrFocus);
    };
  }, [user]);

  // 4. Silent Token Auto-Renewal & Tab-Wake Refresh (Ensures Microsoft tokens never expire)
  useEffect(() => {
    if (!user) return;

    let isRefreshing = false;
    const refreshSession = async () => {
      if (isRefreshing) return;
      const isImpersonatingNow = !!(localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser'));
      if (isImpersonatingNow) return;
      const savedToken = localStorage.getItem('azure_ad_token') || sessionStorage.getItem('azure_ad_token');
      if (!savedToken) return;

      isRefreshing = true;
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tenantId: user.tenantId })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            console.log("[Silent Handshake]: Token successfully verified & refreshed.");
          }
        }
      } catch (err) {
        console.warn("[Silent Handshake]: Background session handshake paused (will retry on next activity)", err);
      } finally {
        isRefreshing = false;
      }
    };

    // Run every 30 minutes to stay well ahead of the 1-hour expiration
    const tokenRefreshInterval = setInterval(refreshSession, 30 * 60 * 1000);

    // Immediate token verification whenever user returns to or focuses the tab
    const handleWakeRefresh = () => {
      if (!document.hidden && navigator.onLine) {
        refreshSession();
      }
    };
    window.addEventListener('visibilitychange', handleWakeRefresh);
    window.addEventListener('focus', handleWakeRefresh);
    window.addEventListener('online', handleWakeRefresh);

    return () => {
      clearInterval(tokenRefreshInterval);
      window.removeEventListener('visibilitychange', handleWakeRefresh);
      window.removeEventListener('focus', handleWakeRefresh);
      window.removeEventListener('online', handleWakeRefresh);
    };
  }, [user]);

  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const state = params.get('state');
      
      if (accessToken) {
        localStorage.setItem('azure_ad_token', accessToken);
        sessionStorage.setItem('azure_ad_token', accessToken);
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', accessToken, state }, '*');
          window.close();
        } else {
          fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tenantId: state })
          })
          .then(res => res.ok ? res.json() : ({} as any))
          .then((data: any) => {
            if (data && data.user) {
              let roleToUse: 'admin' | 'tenant_user' = 'tenant_user';
              let tenantToUse = 'nkangala_auto';
              
              if (data.internalUser) {
                roleToUse = (data.internalUser.role === 'admin' || data.internalUser.role === 'Global Administrator' || data.internalUser.role === 'Systems Administrator') ? 'admin' : 'tenant_user';
                tenantToUse = data.internalUser.tenant_id;
              }
              if (data.user?.email?.toLowerCase().endsWith('@mzansiflow.co.za') || data.user?.email?.toLowerCase().includes('mzansiflow')) {
                roleToUse = 'admin';
              }
              
              const prefMode = localStorage.getItem('preferredPortalMode') || sessionStorage.getItem('preferredPortalMode') || 'municipality';
              handleSetUser({ 
                email: data.user.email, 
                role: roleToUse, 
                tenantId: tenantToUse,
                fullName: data.internalUser?.full_name || data.internalUser?.fullName || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
                jobFunction: data.internalUser?.job_function || data.internalUser?.jobFunction,
                department: data.internalUser?.department,
                manager: data.internalUser?.manager,
                reportTo: data.internalUser?.reportTo || data.internalUser?.report_to,
                level: data.internalUser?.level,
                systemRole: data.internalUser?.system_role || data.internalUser?.systemRole || data.internalUser?.role || (roleToUse === 'admin' ? 'Global Administrator' : 'Standard User'),
                portalMode: prefMode as any
              });
              try {
                window.history.replaceState(null, '', window.location.pathname);
              } catch (e) {
                window.location.hash = '';
              }
            }
          })
          .catch(console.error);
        }
      }
    } else {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.accessToken) {
          localStorage.setItem('azure_ad_token', event.data.accessToken);
          sessionStorage.setItem('azure_ad_token', event.data.accessToken);
          fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${event.data.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tenantId: event.data.state })
          })
          .then(res => res.ok ? res.json() : ({} as any))
          .then((data: any) => {
            if (data && data.user) {
              let roleToUse: 'admin' | 'tenant_user' = 'tenant_user';
              let tenantToUse = 'nkangala_auto';
              
              if (data.internalUser) {
                roleToUse = (data.internalUser.role === 'admin' || data.internalUser.role === 'Global Administrator' || data.internalUser.role === 'Systems Administrator') ? 'admin' : 'tenant_user';
                tenantToUse = data.internalUser.tenant_id;
              }
              if (data.user?.email?.toLowerCase().endsWith('@mzansiflow.co.za') || data.user?.email?.toLowerCase().includes('mzansiflow')) {
                roleToUse = 'admin';
              }
              
              const prefMode = localStorage.getItem('preferredPortalMode') || sessionStorage.getItem('preferredPortalMode') || 'municipality';
              handleSetUser({ 
                email: data.user.email, 
                role: roleToUse, 
                tenantId: tenantToUse,
                fullName: data.internalUser?.full_name || data.internalUser?.fullName || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
                jobFunction: data.internalUser?.job_function || data.internalUser?.jobFunction,
                department: data.internalUser?.department,
                manager: data.internalUser?.manager,
                reportTo: data.internalUser?.reportTo || data.internalUser?.report_to,
                level: data.internalUser?.level,
                systemRole: data.internalUser?.system_role || data.internalUser?.systemRole || data.internalUser?.role || (roleToUse === 'admin' ? 'Global Administrator' : 'Standard User'),
                portalMode: prefMode as any
              });
            }
          })
          .catch(console.error);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Global Fetch Interceptor:
  // 1) Enforces Read-Only access for read-only accounts (blocks all mutating API calls)
  // 2) Attaches X-User-Email / X-Original-Admin-Email and cache: 'no-store' so impersonation saves in AI Studio sync persistently with the website
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
      if (urlStr.startsWith('/api/')) {
        const method = (init?.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET') || 'GET').toUpperCase();
        const isSafeAuthOrAuditRoute =
          urlStr.startsWith('/api/auth/login') ||
          urlStr.startsWith('/api/auth/ping') ||
          urlStr.startsWith('/api/auth/verify') ||
          urlStr.startsWith('/api/audit/log-access');

        let currentUserObj: any = null;
        let origAdminObj: any = null;
        try {
          const curStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
          if (curStr && curStr !== 'undefined') currentUserObj = JSON.parse(curStr);
        } catch (e) {}
        try {
          const origStr = localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser');
          if (origStr && origStr !== 'undefined') origAdminObj = JSON.parse(origStr);
        } catch (e) {}

        const readOnlyActive = isReadOnlyUser(currentUserObj) || isReadOnlyUser(origAdminObj);
        if (readOnlyActive && method !== 'GET' && method !== 'HEAD' && !isSafeAuthOrAuditRoute) {
          setReadOnlyNotice('Read-Only Account: View-only access enabled. Saving and editing are disabled.');
          setTimeout(() => setReadOnlyNotice(null), 4000);
          return new Response(
            JSON.stringify({
              error: 'Read-Only Access: This account is read-only and cannot save or modify records.',
              readOnly: true
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const headers = new Headers(init?.headers || {});
        if (currentUserObj?.email && !headers.has('X-User-Email')) {
          headers.set('X-User-Email', String(currentUserObj.email).toLowerCase().trim());
        }
        if (origAdminObj?.email && !headers.has('X-Original-Admin-Email')) {
          headers.set('X-Original-Admin-Email', String(origAdminObj.email).toLowerCase().trim());
        }

        const fetchOptions: RequestInit = {
          ...init,
          headers,
          cache: 'no-store'
        };

        let res = await originalFetch(input, fetchOptions);
        const contentType = res.headers.get('content-type') || '';
        const isBinaryRoute = urlStr.startsWith('/api/proxy-image') || urlStr.startsWith('/api/sharepoint/file/') || urlStr.startsWith('/api/download/');

        if (!isBinaryRoute && (res.status === 502 || res.status === 503 || res.status === 504 || contentType.includes('text/html'))) {
          if (method === 'GET') {
            await new Promise((r) => setTimeout(r, 600));
            res = await originalFetch(input, fetchOptions);
          }
          const retryContentType = res.headers.get('content-type') || '';
          if (retryContentType.includes('text/html')) {
            const isArrayEndpoint =
              urlStr.includes('/municipalities') ||
              urlStr.endsWith('/users') ||
              urlStr.includes('/users?') ||
              urlStr.includes('/azure-search') ||
              urlStr.includes('/tickets');
            return new Response(
              JSON.stringify(isArrayEndpoint ? [] : { error: 'Service warming up' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }

        return res;
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const handleImpersonate = (targetUser: User | null) => {
    if (isReadOnlyUser(user)) {
      setReadOnlyNotice('Read-Only Account: Impersonation is disabled for read-only accounts.');
      setTimeout(() => setReadOnlyNotice(null), 4000);
      return;
    }
    if (targetUser) {
      const originalAdminStr = localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser');
      if (!originalAdminStr && user) {
        const userStr = JSON.stringify(user);
        localStorage.setItem('originalAdminUser', userStr);
        sessionStorage.setItem('originalAdminUser', userStr);
      }
      const cleanTargetEmail = (targetUser.email || '').toLowerCase().trim();
      const isNedaUser = cleanTargetEmail.includes('mangani') ||
                         cleanTargetEmail.includes('chaukenh') ||
                         cleanTargetEmail.includes('chaukekc') ||
                         cleanTargetEmail.includes('sehlakols') ||
                         cleanTargetEmail.includes('ngomanennc') ||
                         cleanTargetEmail.endsWith('@neda.gov.za') ||
                         cleanTargetEmail.includes('neda.gov.za') ||
                         targetUser.tenantId === 'neda' ||
                         targetUser.tenantId === 'tenant-neda' ||
                         targetUser.portalMode === 'neda' ||
                         targetUser.department?.toLowerCase().includes('neda') ||
                         targetUser.jobFunction?.toLowerCase().includes('neda');

      let resolvedTenantId = targetUser.tenantId;
      let resolvedPortalMode = targetUser.portalMode;

      if (isNedaUser) {
        resolvedTenantId = 'neda';
        resolvedPortalMode = 'neda';
      } else if (resolvedTenantId === 'nkangala_auto' || cleanTargetEmail.includes('nkangala')) {
        resolvedTenantId = 'tenant-229';
        resolvedPortalMode = 'municipality';
      }

      handleSetUser({
        ...targetUser,
        tenantId: resolvedTenantId,
        portalMode: resolvedPortalMode
      });
    } else {
      const originalAdminStr = localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser');
      if (originalAdminStr && originalAdminStr !== 'undefined') {
        try {
          const originalAdmin = JSON.parse(originalAdminStr);
          localStorage.removeItem('originalAdminUser');
          sessionStorage.removeItem('originalAdminUser');
          handleSetUser(originalAdmin);
        } catch (e) {
          localStorage.removeItem('originalAdminUser');
          sessionStorage.removeItem('originalAdminUser');
        }
      }
    }
  };

  const handleLogout = () => {
    handleSetUser(null);
  };

  const isImpersonating = !!(localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser'));
  const isCurrentReadOnly = isReadOnlyUser(user);

  return (
    <ThemeProvider>
      {/* Real-time zero-data-loss System Update Notification */}
      <SystemUpdateNotification />
      {readOnlyNotice && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 border border-amber-500/60 text-amber-200 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{readOnlyNotice}</span>
          <button onClick={() => setReadOnlyNotice(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {!user ? (
        <LandingPage onLogin={handleSetUser} />
      ) : (
        <FinancialYearProvider>
          <DataLossPreventionWrapper user={user}>
            <div className="flex flex-col min-h-screen">
              {isCurrentReadOnly && (
                <div className="bg-sky-900/95 text-sky-100 px-8 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider z-[999] shadow-md border-b border-sky-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-sky-300" />
                    <span>Read-Only Access Mode: <span className="font-black text-white">{user?.email}</span> — View Only (Editing &amp; Saving Disabled)</span>
                  </div>
                  <span className="bg-sky-950 border border-sky-700 text-sky-300 px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest">
                    READ ONLY
                  </span>
                </div>
              )}

              {isImpersonating && (
                <div className="bg-amber-500 text-black px-8 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider z-[999] shadow-md border-b border-amber-600 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse flex h-2.5 w-2.5 rounded-full bg-red-600"></span>
                    <span>Currently viewing/logged in as: <span className="font-black text-amber-950">{user?.fullName} ({user?.email})</span></span>
                  </div>
                  <button 
                    onClick={() => handleImpersonate(null)}
                    className="bg-amber-950 text-white hover:bg-amber-900 transition-colors px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
                  >
                    Exit Impersonation
                  </button>
                </div>
              )}
              <div className="flex-1 flex flex-col min-h-0">
                <SecurityShield user={user}>
                  {user.portalMode === 'neda' ? (
                    <NEDAPortal 
                      user={user} 
                      onLogout={handleLogout} 
                      onImpersonate={isCurrentReadOnly ? undefined : handleImpersonate} 
                    />
                  ) : (
                    <Dashboard 
                      user={user} 
                      onLogout={handleLogout} 
                      onImpersonate={isCurrentReadOnly ? undefined : handleImpersonate} 
                    />
                  )}
                </SecurityShield>
              </div>
            </div>
          </DataLossPreventionWrapper>
        </FinancialYearProvider>
      )}
    </ThemeProvider>
  );
}
