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
import { FinancialYearProvider } from './context/FinancialYearContext';
import { ThemeProvider } from './context/ThemeContext';
import { performanceLogger } from './utils/performanceLogger';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState<string | null>(null);

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

  // 2. Graceful Background Version Checker: Informs user non-disruptively instead of hard-reloading
  useEffect(() => {
    let activeVersion: string | null = null;
    let isChecking = false;

    const runCheck = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await fetch('/api/version');
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            if (!activeVersion) {
              activeVersion = data.version;
            } else if (activeVersion !== data.version) {
              console.log("[Graceful Auto-Updater]: New deployment available:", data.version);
              setNewVersionAvailable(data.version);
            }
          }
        }
      } catch (err) {
        // Silently capture failures (e.g. offline) to prevent breaking active workspace sessions
      } finally {
        isChecking = false;
      }
    };

    runCheck();
    const checkerInterval = setInterval(runCheck, 60000);

    const handleFocusCheck = () => {
      if (!document.hidden && navigator.onLine) {
        runCheck();
      }
    };
    window.addEventListener('visibilitychange', handleFocusCheck);
    window.addEventListener('focus', handleFocusCheck);

    return () => {
      clearInterval(checkerInterval);
      window.removeEventListener('visibilitychange', handleFocusCheck);
      window.removeEventListener('focus', handleFocusCheck);
    };
  }, []);

  // 3. High-Concurrency Zero-Kickout Session Keep-Alive Heartbeat
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
            handleSetUser({
              ...user,
              loginTime: new Date().toISOString()
            });
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

  const handleImpersonate = (targetUser: User | null) => {
    if (targetUser) {
      const originalAdminStr = localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser');
      if (!originalAdminStr && user) {
        const userStr = JSON.stringify(user);
        localStorage.setItem('originalAdminUser', userStr);
        sessionStorage.setItem('originalAdminUser', userStr);
      }
      let resolvedTenantId = targetUser.tenantId;
      if (resolvedTenantId === 'nkangala_auto' || targetUser.email?.toLowerCase().includes('nkangala')) {
        resolvedTenantId = 'tenant-229';
      }
      handleSetUser({
        ...targetUser,
        tenantId: resolvedTenantId
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

  if (!user) {
    return <LandingPage onLogin={handleSetUser} />;
  }

  const isImpersonating = !!(localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser'));

  return (
    <ThemeProvider>
      <FinancialYearProvider>
        <DataLossPreventionWrapper user={user}>
          <div className="flex flex-col min-h-screen">
            {/* Non-intrusive Live System Update Notification */}
            {newVersionAvailable && (
              <div className="fixed bottom-4 right-4 z-[999999] bg-slate-900/95 border-2 border-indigo-500/70 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in font-sans">
                <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                </div>
                <div className="pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white uppercase tracking-wider">System Update Ready</span>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                      {newVersionAvailable}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    A fresh system update is deployed. Refresh when ready without interrupting active drafts.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Refresh Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVersionAvailable(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                    title="Dismiss notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
                    onImpersonate={handleImpersonate} 
                  />
                ) : (
                  <Dashboard 
                    user={user} 
                    onLogout={handleLogout} 
                    onImpersonate={handleImpersonate} 
                  />
                )}
              </SecurityShield>
            </div>
          </div>
        </DataLossPreventionWrapper>
      </FinancialYearProvider>
    </ThemeProvider>
  );
}
