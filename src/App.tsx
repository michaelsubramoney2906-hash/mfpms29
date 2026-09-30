/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { NEDAPortal } from './components/NEDAPortal';
import { SecurityShield } from './components/SecurityShield';
import { FinancialYearProvider } from './context/FinancialYearContext';
import { performanceLogger } from './utils/performanceLogger';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    performanceLogger.init();
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr && !user && userStr !== 'undefined' && userStr !== '[object Object]') {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        performanceLogger.setUserContext(parsed.email, parsed.tenantId);
      } catch (e) {
        console.error("Failed to parse currentUser from sessionStorage", e);
        sessionStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleSetUser = (u: User | null) => {
    if (u) {
      if (!u.loginTime) {
        u.loginTime = new Date().toISOString();
      }
      sessionStorage.setItem('currentUser', JSON.stringify(u));
      performanceLogger.setUserContext(u.email, u.tenantId);
    } else {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('originalAdminUser');
      performanceLogger.setUserContext('anonymous', 'default');
    }
    setUser(u);
  };

  // Background Version Checker & Auto-Updater to deploy new updates immediately in real-time
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
              console.log("[Auto-Updater]: New app deployment version detected!", data.version);
              window.location.reload();
            }
          }
        }
      } catch (err) {
        // Silently capture failures (e.g. offline) to prevent breaking workspace sessions
      } finally {
        isChecking = false;
      }
    };

    // Run version poll check immediately
    runCheck();

    // Check every 60 seconds
    const checkerInterval = setInterval(runCheck, 60000);

    // Also run immediate check when user focuses or wakes up the tab
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

  // High-concurrency zero-kickout session keep-alive ping
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
        // Silently preserve session; never kick user out on temporary ping lag
      } finally {
        isPinging = false;
      }
    };

    // Immediate ping on mount
    pingSession();

    // Regular 30s heartbeat interval
    const pingInterval = setInterval(pingSession, 30000);

    // Immediate ping on tab focus, visibility return, and network reconnection
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

  // Automated background OAuth refresh handshake (every 45 minutes to beat Microsoft's 1-hour expiration)
  useEffect(() => {
    if (!user) return;

    const refreshSession = async () => {
      const savedToken = sessionStorage.getItem('azure_ad_token');
      if (!savedToken) return;

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
            console.log("[Silent Handshake]: Token successfully refreshed with identity provider.");
            // Softly update session state to extend token lease
            handleSetUser({
              ...user,
              loginTime: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn("[Silent Handshake]: Background session handshake paused", err);
      }
    };

    // Run every 45 minutes
    const tokenRefreshInterval = setInterval(refreshSession, 45 * 60 * 1000);

    return () => clearInterval(tokenRefreshInterval);
  }, [user]);

  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const state = params.get('state');
      
      if (accessToken) {
        sessionStorage.setItem('azure_ad_token', accessToken); // Save for background handshake!
        // If opened as a popup, post message to parent and close
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', accessToken, state }, '*');
          window.close();
        } else {
          // Fallback if opened directly
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
                systemRole: data.internalUser?.system_role || data.internalUser?.systemRole || data.internalUser?.role || 'Standard User',
                portalMode: (sessionStorage.getItem('preferredPortalMode') || 'municipality') as any
              });
              try {
                window.history.replaceState(null, '', window.location.pathname);
              } catch (e) {
                window.location.hash = ''; // Fallback for sandboxed iframes
              }
            }
          })
          .catch(console.error);
        }
      }
    } else {
      // Listen for popup messages in the main window
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.accessToken) {
          sessionStorage.setItem('azure_ad_token', event.data.accessToken); // Save for background handshake!
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
                systemRole: data.internalUser?.system_role || data.internalUser?.systemRole || data.internalUser?.role || 'Standard User',
                portalMode: (sessionStorage.getItem('preferredPortalMode') || 'municipality') as any
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
      // Storing current user (the admin) as originalAdminUser before switching
      const originalAdminStr = sessionStorage.getItem('originalAdminUser');
      if (!originalAdminStr && user) {
        sessionStorage.setItem('originalAdminUser', JSON.stringify(user));
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
      // Restore original admin
      const originalAdminStr = sessionStorage.getItem('originalAdminUser');
      if (originalAdminStr && originalAdminStr !== 'undefined') {
        try {
          const originalAdmin = JSON.parse(originalAdminStr);
          sessionStorage.removeItem('originalAdminUser');
          handleSetUser(originalAdmin);
        } catch (e) {
          sessionStorage.removeItem('originalAdminUser');
        }
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('azure_ad_token');
    sessionStorage.removeItem('originalAdminUser');
    handleSetUser(null);
  };

  if (!user) {
    return <LandingPage onLogin={handleSetUser} />;
  }

  const isImpersonating = !!sessionStorage.getItem('originalAdminUser');

  return (
    <FinancialYearProvider>
      <div className="flex flex-col min-h-screen">
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
                key={`${user.email}_neda`}
                user={user} 
                onLogout={handleLogout} 
                onImpersonate={handleImpersonate} 
              />
            ) : (
              <Dashboard 
                key={user.email} 
                user={user} 
                onLogout={handleLogout} 
                onImpersonate={handleImpersonate} 
              />
            )}
          </SecurityShield>
        </div>
      </div>
    </FinancialYearProvider>
  );
}
