import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, X, AlertTriangle } from 'lucide-react';
import type { User } from '../types';

interface RestrictedModuleWrapperProps {
  currentUser: User;
  item: { id: string; name: string };
  unlockedModules: string[];
  onUnlock: (moduleId: string) => void;
  onClose: () => void;
  children?: React.ReactNode;
}

const SUBMODULE_TO_PARENT_MAP: Record<string, string> = {
  // OPMS Admin
  'apr': 'opms-admin', 'ar': 'opms-admin', 'ba': 'opms-admin', 'bi': 'opms-admin',
  'cm': 'opms-admin', 'ct': 'opms-admin', 'cp': 'opms-admin', 'gl': 'opms-admin',
  'idp': 'opms-admin', 'kpa': 'opms-admin', 'kpi': 'opms-admin', 'led': 'opms-admin',
  'mtas': 'opms-admin', 'omm': 'opms-admin', 'rep': 'opms-admin', 'rm': 'opms-admin',
  'sdbip-tl': 'opms-admin', 'so': 'opms-admin',
  'opms-submitter': 'opms-admin', 'opms-reviewer': 'opms-admin', 'opms-approver': 'opms-admin',

  // OPMS Political
  'cc': 'opms-political', 'cr': 'opms-political', 'mpac': 'opms-political',
  'om': 'opms-political', 'cmem': 'opms-political', 'pp': 'opms-political',
  'ss': 'opms-political', 'wc': 'opms-political',

  // IPMS
  'jsc': 'ipms', 'pdp': 'ipms', 'pplan': 'ipms', 'ipms-kpi': 'ipms',
  'pa': 'ipms', 'ipms-kpa': 'ipms', 'sdbip-23': 'ipms', 'ipms-evaluation': 'ipms',
  'ipms-manager-review': 'ipms', 'ipms-internal-audit': 'ipms', 'ipms-dpmc': 'ipms',
  'ipms-reports': 'ipms', 'pa-templates': 'ipms', 'organogram': 'ipms', 'ipms-organogram': 'ipms',

  // MF Connect
  'ca': 'mf-connect', 'chat': 'mf-connect', 'hds': 'mf-connect',

  // More
  'extraction-engine': 'more', 'ce': 'more', 'ear': 'more', 'fbi': 'more', 'fea': 'more',
  'ia': 'more', 'psa': 'more', 'mfa': 'more', 'slat': 'more'
};

export function RestrictedModuleWrapper({ currentUser, item, unlockedModules, onUnlock, onClose, children }: RestrictedModuleWrapperProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [overridePassword, setOverridePassword] = useState('8655M9sznnes01*');

  React.useEffect(() => {
    fetch('/api/config/manager-password')
      .then(res => res.ok ? res.json() : ({} as any))
      .then((data: any) => {
        if (data && data.managerOverridePassword) {
          setOverridePassword(data.managerOverridePassword);
        }
      })
      .catch(console.error);
  }, []);

  // Lock target is the parent module ID if the item is a sublevel, or item ID itself
  const parentId = SUBMODULE_TO_PARENT_MAP[item.id] || item.id;
  const isPasswordRestricted = item.id === 'pa-templates';
  const isRoleRestricted = false;

  const targetId = item.id === 'pa-templates' ? 'pa-templates' : parentId;

  const isMikeOnlyModule = ['ipms-manager-review', 'ipms-internal-audit', 'ipms-dpmc', 'ipms-reports'].includes(item.id);
  const userEmail = (currentUser.email || '').trim().toLowerCase();
  const isAuthorizedAdmin = [
    'mike@mzansiflow.co.za',
    'audrey@mzansiflow.co.za',
    'mike@massivedynamixdistributors.com'
  ].includes(userEmail);

  const isGlobalAdmin = currentUser.role === 'admin' || currentUser.systemRole === 'Global Administrator';

  const userRoleLower = (currentUser.role || '').toLowerCase();
  const systemRoleLower = (currentUser.systemRole || '').toLowerCase();
  const jobFunctionLower = (currentUser.jobFunction || '').toLowerCase();

  const isManagerOrAuditorOrOfficial = 
    isAuthorizedAdmin ||
    isGlobalAdmin ||
    userRoleLower.includes('admin') ||
    userRoleLower.includes('manager') ||
    userRoleLower.includes('tenant') ||
    systemRoleLower.includes('admin') ||
    systemRoleLower.includes('manager') ||
    systemRoleLower.includes('supervisor') ||
    systemRoleLower.includes('hod') ||
    systemRoleLower.includes('director') ||
    systemRoleLower.includes('auditor') ||
    systemRoleLower.includes('audit') ||
    systemRoleLower.includes('pms') ||
    systemRoleLower.includes('lead') ||
    systemRoleLower.includes('officer') ||
    systemRoleLower.includes('standard') ||
    jobFunctionLower.includes('manager') ||
    jobFunctionLower.includes('supervisor') ||
    jobFunctionLower.includes('hod') ||
    jobFunctionLower.includes('director') ||
    jobFunctionLower.includes('auditor') ||
    jobFunctionLower.includes('audit') ||
    jobFunctionLower.includes('pms') ||
    jobFunctionLower.includes('head') ||
    jobFunctionLower.includes('lead') ||
    jobFunctionLower.includes('officer') ||
    Boolean(currentUser.manager) ||
    Boolean(currentUser.reportTo);

  const isAdminSubmodule = ['admin', 'al', 'scp', 'um', 'tl', 'admin-chat'].includes(item.id) || parentId === 'admin';
  const isSystemsOrGlobalAdmin = 
    currentUser.role === 'admin' || 
    currentUser.systemRole === 'Global Administrator' || 
    currentUser.systemRole === 'Systems Administrator' ||
    currentUser.systemRole === 'admin' ||
    isAuthorizedAdmin;

  if (isAdminSubmodule && !isSystemsOrGlobalAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 m-6 min-h-[500px] bg-red-950/20 backdrop-blur-md border-2 border-red-500/30 rounded-3xl relative z-10 shadow-[0_20px_50px_rgba(239,68,68,0.15)] ring-1 ring-red-500/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />

        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-red-400 hover:text-red-200 hover:bg-red-900/40 p-2.5 rounded-full transition-all cursor-pointer border border-transparent hover:border-red-500/20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-red-400 uppercase tracking-[0.2em] text-center mb-2 font-mono">
          ⚠️ Authorization Failed
        </h2>
        
        <div className="w-16 h-[2px] bg-red-500/30 mb-4" />

        <p className="text-red-300 text-xs text-center max-w-sm font-sans mb-8 leading-relaxed">
          The module <span className="font-extrabold text-white underline decoration-red-500 underline-offset-4">{`"${item.name}"`}</span> is strictly restricted to Systems and Global Administrators.
        </p>
      </div>
    );
  }

  if (isMikeOnlyModule && !isManagerOrAuditorOrOfficial) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 m-6 min-h-[500px] bg-red-950/20 backdrop-blur-md border-2 border-red-500/30 rounded-3xl relative z-10 shadow-[0_20px_50px_rgba(239,68,68,0.15)] ring-1 ring-red-500/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />

        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-red-400 hover:text-red-200 hover:bg-red-900/40 p-2.5 rounded-full transition-all cursor-pointer border border-transparent hover:border-red-500/20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-red-400 uppercase tracking-[0.2em] text-center mb-2 font-mono">
          ⚠️ Authorization Failed
        </h2>
        
        <div className="w-16 h-[2px] bg-red-500/30 mb-4" />

        <p className="text-red-300 text-xs text-center max-w-sm font-sans mb-8 leading-relaxed">
          The module <span className="font-extrabold text-white underline decoration-red-500 underline-offset-4">{`"${item.name}"`}</span> requires Line Manager, HOD, PMS Official, Auditor, or Administrator privileges.
        </p>
      </div>
    );
  }

  if (isPasswordRestricted && !unlockedModules.includes(targetId)) {
    const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (password === 'Deskjet01*' || password === overridePassword || password === overridePassword + '2906') {
        onUnlock(targetId);
        setError('');
      } else {
        setError('Incorrect security key. Access denied.');
      }
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 m-6 min-h-[500px] bg-red-950/20 backdrop-blur-md border-2 border-red-500/30 rounded-3xl relative z-10 shadow-[0_20px_50px_rgba(239,68,68,0.15)] ring-1 ring-red-500/10">
        {/* Glowing red accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />
        
        {/* Top Right Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-red-400 hover:text-red-200 hover:bg-red-900/40 p-2.5 rounded-full transition-all cursor-pointer border border-transparent hover:border-red-500/20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pulsing Lock Icon in Crimson Circle */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-red-400 uppercase tracking-[0.2em] text-center mb-2 font-mono">
          🚨 Restricted Security Access
        </h2>
        
        <div className="w-16 h-[2px] bg-red-500/30 mb-4" />

        <p className="text-red-300 text-xs text-center max-w-sm font-sans mb-8 leading-relaxed">
          The module <span className="font-extrabold text-white underline decoration-red-500 underline-offset-4">"{item.name}"</span> is locked under encrypted policy. Enter authorization key to proceed.
        </p>

        <form onSubmit={handleUnlock} className="flex flex-col items-center w-full max-w-xs gap-4">
          <div className="w-full relative">
            <input 
              type="password" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="••••••••••••••••••••"
              className="w-full bg-black/40 border-2 border-red-950 rounded-xl px-4 py-3.5 text-center text-red-100 font-mono tracking-widest text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-red-900 shadow-inner"
            />
            
            {error && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-red-400 text-xs font-black font-mono">
                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                <span>{error}</span>
              </div>
            )}
          </div>
          
          <button 
            type="submit"
            className="w-full bg-red-700 hover:bg-red-650 hover:ring-2 hover:ring-red-400 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-widest cursor-pointer shadow-[0_10px_20px_rgba(220,38,38,0.2)] border border-red-500/20"
          >
            <Unlock className="w-4 h-4" />
            Unlock Component
          </button>
        </form>
      </div>
    );
  }

  if (isRoleRestricted) {
    const isGlobalAdmin = 
      currentUser.role === 'admin' || 
      currentUser.systemRole === 'Global Administrator' ||
      (currentUser.systemRole && currentUser.systemRole.toLowerCase().includes('admin')) ||
      currentUser.email === 'mike@mzansiflow.co.za' ||
      currentUser.email?.endsWith('@mzansiflow.co.za');
    const isInternalAuditor = 
      currentUser.jobFunction?.toLowerCase().includes('audit') || 
      currentUser.systemRole?.toLowerCase().includes('audit') ||
      currentUser.department?.toLowerCase().includes('audit');
    
    if (!isGlobalAdmin && !isInternalAuditor) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 m-6 min-h-[500px] bg-red-950/20 backdrop-blur-md border-2 border-red-500/30 rounded-3xl relative z-10 shadow-[0_20px_50px_rgba(239,68,68,0.15)] ring-1 ring-red-500/10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />

          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-red-400 hover:text-red-200 hover:bg-red-900/40 p-2.5 rounded-full transition-all cursor-pointer border border-transparent hover:border-red-500/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-red-400 uppercase tracking-[0.2em] text-center mb-2 font-mono">
            ⚠️ Authorization Failed
          </h2>
          
          <div className="w-16 h-[2px] bg-red-500/30 mb-4" />

          <p className="text-red-300 text-xs text-center max-w-sm font-sans mb-8 leading-relaxed">
            You do not have the required administrative or auditor privileges to inspect the target module <span className="font-extrabold text-white underline decoration-red-500 underline-offset-4">"{item.name}"</span>.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
