/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { NEDAPortal } from './components/NEDAPortal';
import { SecurityShield } from './components/SecurityShield';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleSetUser = (u: User | null) => {
    if (u && !u.loginTime) {
      u.loginTime = new Date().toISOString();
    }
    setUser(u);
  };

  useEffect(() => {
    if (!user) return;

    let currentRef = user.loginKickoffRef;

    const checkKickoff = async () => {
      try {
        const res = await fetch('/api/auth/kickoff-status');
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.toLowerCase().includes("application/json")) {
            try {
              const data = await res.json();
              if (data && data.kickoffTime) {
                if (!currentRef) {
                  // Initialize the reference kickoff time with the active kickoff value at login time
                  currentRef = data.kickoffTime;
                  setUser(prev => prev ? { ...prev, loginKickoffRef: data.kickoffTime } : null);
                } else if (data.kickoffTime !== currentRef) {
                  console.log("Automatically kicking off user session - new server kickoff event detected.");
                  setUser(null);
                }
              }
            } catch (jsonErr) {
              console.warn("Unable to parse kickoff response as JSON:", jsonErr);
            }
          }
        }
      } catch (err) {
        // Log as warning rather than error to prevent environment failures during transient network drops or server restarts
        console.warn("Failed to verify active kickoff status:", err);
      }
    };

    const pingSession = async () => {
      try {
        await fetch('/api/auth/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            tenantId: user.tenantId,
            fullName: user.email.split('@')[0],
            userId: user.email
          })
        });
      } catch (err) {}
    };

    checkKickoff();
    pingSession();

    const interval = setInterval(checkKickoff, 3000);
    const pingInterval = setInterval(pingSession, 15000);
    window.addEventListener('focus', checkKickoff);

    return () => {
      clearInterval(interval);
      clearInterval(pingInterval);
      window.removeEventListener('focus', checkKickoff);
    };
  }, [user]);

  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const state = params.get('state');
      
      if (accessToken) {
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
      if (originalAdminStr) {
        const originalAdmin = JSON.parse(originalAdminStr);
        sessionStorage.removeItem('originalAdminUser');
        handleSetUser(originalAdmin);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('originalAdminUser');
    handleSetUser(null);
  };

  if (!user) {
    return <LandingPage onLogin={handleSetUser} />;
  }

  const isImpersonating = !!sessionStorage.getItem('originalAdminUser');

  return (
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
  );
}
