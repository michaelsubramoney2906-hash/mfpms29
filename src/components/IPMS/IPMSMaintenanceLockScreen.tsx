import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, AlertTriangle, Clock, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import type { User } from '../../types';

interface IPMSMaintenanceLockScreenProps {
  currentUser: User;
  onUnlock: () => void;
  onNavigateHome?: () => void;
}

export function IPMSMaintenanceLockScreen({ currentUser, onUnlock, onNavigateHome }: IPMSMaintenanceLockScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const entered = password.trim();
    // Authorized password per instructions: 8655M9sznnes01*
    const validPassword = '8655M9sznnes01*';

    setTimeout(() => {
      if (entered === validPassword) {
        setSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 600);
      } else {
        setError('Incorrect authorization key. Access restricted under CFO & PMS Department instructions.');
        setLoading(false);
      }
    }, 250);
  };

  return (
    <div className="flex-1 min-h-[620px] flex items-center justify-center p-4 sm:p-8 relative z-10 animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl shadow-[0_25px_60px_-15px_rgba(245,158,11,0.25)] overflow-hidden relative">
        {/* Top Warning Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

        {/* Header Ribbon */}
        <div className="p-6 sm:p-8 border-b border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border-2 border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/50">
            <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                Compliance Directive
              </span>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> 4 Business Days Protocol
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              IPMS Module Restricted
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              NKANGALA DISTRICT MUNICIPALITY • INSTITUTIONAL PERFORMANCE MANAGEMENT SYSTEM
            </p>
          </div>
        </div>

        {/* Directive Message Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Prominent Official Message Banner */}
          <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/30 rounded-2xl p-5 shadow-inner">
            <div className="flex items-start gap-3.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-extrabold text-amber-300 uppercase tracking-wide leading-snug">
                  Restricted: Undergoing maintenance updates as per instructions from CFO &amp; PMS Department for 4 business days.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  Access to all Individual Performance Management System (IPMS) scorecards, performance agreements, drafting suites, and employee evaluation portals is temporarily locked across all <strong className="text-white">@nkangaladm.gov.za</strong> municipal accounts during scheduled compliance and moderation system updates.
                </p>
              </div>
            </div>
          </div>

          {/* User Identification Chip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span className="text-slate-400">Restricted Account:</span>
              <span className="font-mono font-bold text-white">{currentUser.email || 'Nkangala Official'}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Role: <span className="text-slate-200 font-semibold">{currentUser.role || 'Municipal Official'}</span>
            </div>
          </div>

          {/* Password Unlock Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <label htmlFor="ipms-unlock-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Administrative Override Key
                </span>
                <span className="text-[10px] text-slate-500 font-normal">CFO &amp; PMS Department Authorization</span>
              </label>

              <div className="relative">
                <input
                  id="ipms-unlock-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter authorized unlock password..."
                  disabled={loading || success}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-750 focus:border-amber-400 rounded-xl text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 pr-12 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-shake">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Authorization verified. Unlocking IPMS workspace...</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || success || !password.trim()}
                className="w-full sm:flex-1 py-3 px-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Unlock className="w-4 h-4" />
                {loading ? 'Validating Key...' : 'Unlock IPMS Module'}
              </button>

              {onNavigateHome && (
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="w-full sm:w-auto py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </form>

          {/* Official Footer Note */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
              Municipal Systems Act Compliance
            </span>
            <span>Security Protocol v4.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
