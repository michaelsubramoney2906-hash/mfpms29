import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, Lock, CheckCircle2, ShieldAlert, BellRing } from 'lucide-react';
import type { User } from '../../types';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000; // 900,000 ms (15 minutes)

export const CUTOFF_LOCKED_MODULE_IDS = new Set([
  'ipms',
  'opms-admin',
  'opms-political',
  'sharepoint',
  'more',
]);

export function isCutoffControlledModule(moduleId?: string | null): boolean {
  if (!moduleId) return false;
  return CUTOFF_LOCKED_MODULE_IDS.has(moduleId.toLowerCase().trim());
}

export function isNkangalaDomainUser(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean.endsWith('@nkangaladm.gov.za') || clean.endsWith('@nkangaldm.gov.za');
}

export function getTodaySastDateString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

export function getTodayCutoffTimestampMs(): number {
  try {
    const dateStr = getTodaySastDateString();
    const targetSast = new Date(`${dateStr}T23:59:59.999+02:00`).getTime();
    if (!Number.isNaN(targetSast)) {
      return targetSast;
    }
  } catch {
    // Fallback to local 23:59:59.999
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
}

export interface CutoffCountdownState {
  isNkangalaUser: boolean;
  cutoffTimestampMs: number;
  remainingMs: number;
  isLocked: boolean;
  hours: string;
  minutes: string;
  seconds: string;
  nextAckRemainingMs: number;
  nextAckMinutes: string;
  nextAckSeconds: string;
  showAckModal: boolean;
  acknowledgeNow: () => void;
  openModalManually: () => void;
}

export function useIPMSReportingCutoff(userEmail?: string | null, activeTenantId: string = 'tenant-229'): CutoffCountdownState {
  const cleanEmail = (userEmail || '').toLowerCase().trim();
  const isNkangalaUser = isNkangalaDomainUser(cleanEmail);
  const dateKey = getTodaySastDateString();
  const ackStorageKey = `ipms_cutoff_15m_ack_${cleanEmail}_${dateKey}`;

  const [cutoffTimestampMs, setCutoffTimestampMs] = useState<number>(() => getTodayCutoffTimestampMs());
  const [forceLocked, setForceLocked] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [lastAckMs, setLastAckMs] = useState<number>(() => {
    if (typeof window === 'undefined' || !cleanEmail) return 0;
    const saved = localStorage.getItem(`ipms_cutoff_15m_ack_${cleanEmail}_${dateKey}`);
    const parsed = saved ? parseInt(saved, 10) : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);

  // Sync user email change
  useEffect(() => {
    if (typeof window === 'undefined' || !cleanEmail) return;
    const saved = localStorage.getItem(ackStorageKey);
    const parsed = saved ? parseInt(saved, 10) : 0;
    setLastAckMs(Number.isNaN(parsed) ? 0 : parsed);
  }, [cleanEmail, ackStorageKey]);

  // Fetch authoritative cutoff config from server
  useEffect(() => {
    if (!isNkangalaUser) return;
    let isMounted = true;
    fetch(`/api/tenant/${activeTenantId || 'tenant-229'}/ipms-reporting-cutoff`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        if (typeof data.cutoffTimestampMs === 'number' && data.cutoffTimestampMs > 0) {
          setCutoffTimestampMs(data.cutoffTimestampMs);
        }
        if (typeof data.forceLocked === 'boolean') {
          setForceLocked(data.forceLocked);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isNkangalaUser, activeTenantId]);

  // 1-second precision ticker
  useEffect(() => {
    if (!isNkangalaUser) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isNkangalaUser]);

  const remainingMs = Math.max(0, cutoffTimestampMs - nowMs);
  const isLocked = isNkangalaUser && (forceLocked || remainingMs <= 0);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const hours = String(hrs).padStart(2, '0');
  const minutes = String(mins).padStart(2, '0');
  const seconds = String(secs).padStart(2, '0');

  const elapsedSinceAck = lastAckMs > 0 ? Math.max(0, nowMs - lastAckMs) : FIFTEEN_MINUTES_MS;
  const isAckDue = isNkangalaUser && !isLocked && (lastAckMs === 0 || elapsedSinceAck >= FIFTEEN_MINUTES_MS);
  const nextAckRemainingMs = lastAckMs > 0 ? Math.max(0, FIFTEEN_MINUTES_MS - elapsedSinceAck) : 0;
  const nextAckTotalSecs = Math.floor(nextAckRemainingMs / 1000);
  const nextAckMinutes = String(Math.floor(nextAckTotalSecs / 60)).padStart(2, '0');
  const nextAckSeconds = String(nextAckTotalSecs % 60).padStart(2, '0');

  const acknowledgeNow = useCallback(() => {
    const current = Date.now();
    setLastAckMs(current);
    setNowMs(current);
    setManualModalOpen(false);
    if (typeof window !== 'undefined' && cleanEmail) {
      localStorage.setItem(ackStorageKey, String(current));
    }
  }, [cleanEmail, ackStorageKey]);

  const openModalManually = useCallback(() => {
    setManualModalOpen(true);
  }, []);

  return {
    isNkangalaUser,
    cutoffTimestampMs,
    remainingMs,
    isLocked,
    hours,
    minutes,
    seconds,
    nextAckRemainingMs,
    nextAckMinutes,
    nextAckSeconds,
    showAckModal: !isLocked && (isAckDue || manualModalOpen),
    acknowledgeNow,
    openModalManually,
  };
}

interface IPMSReportingCutoffBannerAndModalProps {
  currentUser: User;
  activeTenantId?: string;
  cutoffState: CutoffCountdownState;
  moduleName?: string;
}

export const IPMSReportingCutoffBannerAndModal: React.FC<IPMSReportingCutoffBannerAndModalProps> = ({
  currentUser,
  cutoffState,
  moduleName = 'IPMS',
}) => {
  const {
    isNkangalaUser,
    isLocked,
    hours,
    minutes,
    seconds,
    nextAckMinutes,
    nextAckSeconds,
    showAckModal,
    acknowledgeNow,
    openModalManually,
  } = cutoffState;

  if (!isNkangalaUser) return null;

  return (
    <>
      {/* TOP BANNER: Red Closure Banner after 11:59:59 PM OR Live Countdown Banner prior to 11:59:59 PM */}
      {isLocked ? (
        <div className="w-full rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-2 border-red-500 shadow-2xl shadow-red-950/60 p-4 sm:p-5 text-white relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-600/30 border border-red-400/60 flex items-center justify-center shrink-0 shadow-inner">
                <Lock className="w-6 h-6 text-red-200 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-widest border border-red-300/40">
                    {moduleName.toUpperCase()} LOCKED • 11:59:59 PM CUTOFF REACHED
                  </span>
                  <span className="text-[11px] font-mono text-red-200 font-bold">
                    @nkangaladm.gov.za Official Lock
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white mt-1 leading-snug">
                  Reporting for the quarter of the 2026/2027 financial year has now been closed by order of the PMS Divisional Head
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-black/40 px-4 py-2.5 rounded-xl border border-red-400/40">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">Countdown Expired</div>
                <div className="text-sm font-mono font-black text-white">00h : 00m : 00s</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/90 border border-red-500/60 shadow-xl p-3.5 sm:p-4 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-red-400 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                    MANDATORY DEADLINE TODAY AT 11:59:59 PM ({moduleName.toUpperCase()})
                  </span>
                  <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                    <BellRing className="w-3.5 h-3.5" />
                    15-Min Pop-up Reminder Active (Next in {nextAckMinutes}m {nextAckSeconds}s)
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-100 mt-1">
                  At <span className="text-red-300 font-black">11:59:59 PM today</span>, IPMS, OPMS Admin, OPMS Political, Share Point &amp; More for all <span className="font-mono text-emerald-300">@nkangaladm.gov.za</span> users will automatically lock by order of the <span className="text-amber-300 font-black">PMS Divisional Head</span>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end">
              <div className="flex items-center gap-1.5 bg-black/60 px-3.5 py-2 rounded-xl border border-red-500/40 shadow-inner">
                <div className="text-center px-1.5">
                  <div className="text-base sm:text-lg font-mono font-black text-red-400 leading-none">{hours}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Hours</div>
                </div>
                <span className="text-red-400 font-black text-base">:</span>
                <div className="text-center px-1.5">
                  <div className="text-base sm:text-lg font-mono font-black text-amber-300 leading-none">{minutes}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Minutes</div>
                </div>
                <span className="text-amber-300 font-black text-base">:</span>
                <div className="text-center px-1.5">
                  <div className="text-base sm:text-lg font-mono font-black text-emerald-300 leading-none">{seconds}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Seconds</div>
                </div>
              </div>

              <button
                type="button"
                onClick={openModalManually}
                className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-200 text-[11px] font-black uppercase tracking-wider transition cursor-pointer shrink-0"
              >
                View Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15-MINUTE MANDATORY ACKNOWLEDGEMENT POPUP MODAL */}
      {showAckModal && (
        <div className="fixed inset-0 z-[10050] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-slate-950 border-2 border-red-500/80 shadow-2xl shadow-red-950/70 overflow-hidden text-white">
            {/* Red Alert Header */}
            <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 px-6 py-4 border-b border-red-500/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-400/50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-300 animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-200 block">
                    MANDATORY 15-MINUTE OFFICIAL REMINDER
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                    Quarter Reporting Cutoff Countdown
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-red-400/40 text-[11px] font-mono font-bold text-red-200">
                11:59:59 PM Today
              </span>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Live Countdown Tiles */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Time Remaining Until Automatic System Lock (11:59:59 PM Today)
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  <div className="bg-slate-950 border border-red-500/40 rounded-2xl p-3.5 shadow-inner">
                    <div className="text-3xl sm:text-4xl font-mono font-black text-red-400">{hours}</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                      Hours
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3.5 shadow-inner">
                    <div className="text-3xl sm:text-4xl font-mono font-black text-amber-300">{minutes}</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                      Minutes
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-3.5 shadow-inner">
                    <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400">{seconds}</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                      Seconds
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Directive Box */}
              <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-red-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Directive from the PMS Divisional Head</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Please take note that at exactly <strong className="text-white">11:59:59 PM today</strong>,{' '}
                  <strong className="text-white">IPMS, OPMS Admin, OPMS Political, Share Point, and More</strong> for all{' '}
                  <strong className="text-emerald-300 font-mono">@nkangaladm.gov.za</strong> officials will automatically lock with the official notice:
                </p>
                <div className="p-3 rounded-xl bg-red-900/50 border border-red-400/50 text-white font-black text-xs sm:text-sm text-center">
                  "Reporting for the quarter of the 2026/2027 financial year has now been closed by order of the PMS Divisional Head"
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  Ensure all KPI actuals, self-evaluation scores, Job Specific Competencies (JSCs), Core Competencies, SDBIP submissions, and Portfolios of Evidence (POEs) are saved and submitted prior to <strong className="text-white">11:59:59 PM</strong>. This reminder pops up every <strong className="text-amber-300">15 minutes</strong> and requires your acknowledgement.
                </p>
              </div>

              {/* Official User Context */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800">
                <span>
                  Official: <strong className="text-white">{currentUser.fullName || currentUser.email}</strong>
                </span>
                <span className="font-mono text-emerald-400">{currentUser.email}</span>
              </div>

              {/* Acknowledge Button */}
              <button
                type="button"
                onClick={acknowledgeNow}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>I Acknowledge This Notice — Continue Working (Remind Me in 15 Mins)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const IPMSLockedClosureScreen: React.FC<{ currentUser?: User; moduleName?: string }> = ({
  currentUser,
  moduleName = 'IPMS',
}) => {
  return (
    <div className="min-h-[65vh] w-full flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-slate-950 border-2 border-red-600 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-red-950/60 text-center relative overflow-hidden">
        {/* Top Red Banner Inside Lock Screen */}
        <div className="w-full bg-gradient-to-r from-red-800 via-red-600 to-red-800 border border-red-400/60 text-white px-5 py-4 rounded-2xl mb-8 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-red-100 mb-1">
            <Lock className="w-4 h-4" />
            <span>OFFICIAL PMS DIVISIONAL HEAD DIRECTIVE • 11:59:59 PM CUTOFF</span>
          </div>
          <p className="text-base sm:text-lg font-black text-white leading-snug">
            Reporting for the quarter of the 2026/2027 financial year has now been closed by order of the PMS Divisional Head
          </p>
        </div>

        <div className="w-20 h-20 rounded-2xl bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Lock className="w-10 h-10 text-red-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-3">
          {moduleName} Module Locked
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mb-6">
          The quarterly reporting window for the <strong className="text-white">2026/2027 financial year</strong> closed at{' '}
          <strong className="text-red-400">11:59:59 PM</strong> for all{' '}
          <strong className="text-emerald-400 font-mono">@nkangaladm.gov.za</strong> users across{' '}
          <strong className="text-white">IPMS, OPMS Admin, OPMS Political, Share Point, and More</strong>. All submitted actuals, self-evaluations, SDBIP records, and uploaded Portfolios of Evidence (POEs) have been securely preserved in the database with zero data loss.
        </p>

        {currentUser?.email && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span>Logged in as:</span>
            <strong className="text-white font-mono">{currentUser.email}</strong>
          </div>
        )}
      </div>
    </div>
  );
};
