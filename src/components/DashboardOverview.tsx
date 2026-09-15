import React from 'react';
import { Shield, Lock } from 'lucide-react';
import type { User } from '../types';
import { MikeCommandCenter } from './CommandCenter/MikeCommandCenter';

interface DashboardOverviewProps {
  currentUser: User;
  activeTenantId: string;
}

export const COMMAND_CENTER_AUTHORIZED_PROFILES = [
  'audrey@mzansiflow.co.za',
  'qiniso@mzansiflow.co.za',
  'delphine@mzansiflow.co.za',
  'ryanw@mzansiflow.co.za',
  'mike@mzansiflow.co.za',
  'marlan@mzansiflow.co.za',
  'mike@massivedynamixdistributors.com'
];

export function isCommandCenterAuthorizedUser(email?: string): boolean {
  if (!email) return false;
  return COMMAND_CENTER_AUTHORIZED_PROFILES.includes(email.toLowerCase().trim());
}

export function DashboardOverview({ currentUser, activeTenantId }: DashboardOverviewProps) {
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const isAuthorized = isCommandCenterAuthorizedUser(userEmail);

  if (isAuthorized) {
    return <MikeCommandCenter currentUser={currentUser} activeTenantId={activeTenantId} />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 relative z-10 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
        <Lock className="w-8 h-8 text-amber-400" />
      </div>

      <div className="relative z-10 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 font-mono">
          <Shield className="w-3.5 h-3.5" />
          Restricted Command Access
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          Municipality Command Center
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
          The full live dashboard and Municipality Command Center is viewable on authorized governance profiles only:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {[
            { email: 'audrey@mzansiflow.co.za', role: 'Operations / Audit' },
            { email: 'qiniso@mzansiflow.co.za', role: 'Solutions Architecture' },
            { email: 'delphine@mzansiflow.co.za', role: 'Executive Services' },
            { email: 'mike@mzansiflow.co.za', role: 'Executive Director' },
            { email: 'marlan@mzansiflow.co.za', role: 'Project Operations' }
          ].map(u => (
            <div key={u.email} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left flex flex-col">
              <span className="text-xs font-mono font-bold text-slate-200">{u.email}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{u.role}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 font-mono">
          Current session: <span className="text-amber-400 font-semibold">{currentUser?.email || 'Unauthorized Profile'}</span>
        </p>
      </div>
    </div>
  );
}

