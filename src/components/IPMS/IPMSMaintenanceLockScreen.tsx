import React from 'react';
import { Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import type { User } from '../../types';

interface IPMSMaintenanceLockScreenProps {
  currentUser?: User;
  onBack?: () => void;
  reason?: string;
}

export function IPMSMaintenanceLockScreen({
  currentUser,
  onBack,
  reason = 'System maintenance window active. Performance agreements and evaluations are temporarily locked.'
}: IPMSMaintenanceLockScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-6 shadow-xl">
        <Lock className="w-8 h-8 animate-pulse" />
      </div>
      <h2 className="text-xl font-black text-white tracking-wide uppercase mb-2">
        IPMS Module Temporarily Locked
      </h2>
      <p className="text-sm text-slate-400 max-w-md text-center mb-6 font-medium">
        {reason}
      </p>
      {currentUser && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono mb-6">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>User: {currentUser.email} ({currentUser.role || 'Official'})</span>
        </div>
      )}
      {onBack && (
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      )}
    </div>
  );
}

export default IPMSMaintenanceLockScreen;
