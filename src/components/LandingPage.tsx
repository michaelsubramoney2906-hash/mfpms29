import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Building, ArrowRight, CheckCircle2, User, Key } from 'lucide-react';
import { User as UserType } from '../types';

interface LandingPageProps {
  onLogin: (user: UserType) => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const quickRoles = [
    {
      title: 'Employee (Self-Evaluation)',
      subtitle: 'Nompumelelo P. Nsibande',
      email: 'NsibandeNP@nkangaladm.gov.za',
      role: 'tenant_user' as const,
      department: 'Corporate Services',
      jobFunction: 'HR Officer',
      manager: 'Yena Khuboni',
      reportTo: 'KhuboniY@nkangaladm.gov.za',
      systemRole: 'Employee',
      color: 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-900'
    },
    {
      title: 'Line Manager Reviewer',
      subtitle: 'Yena Khuboni (Line Manager)',
      email: 'KhuboniY@nkangaladm.gov.za',
      role: 'tenant_user' as const,
      department: 'Office of the Municipal Manager',
      jobFunction: 'Senior Manager',
      manager: 'Sibusiso M. Shabangu',
      reportTo: 'ShabanguSM@nkangaladm.gov.za',
      systemRole: 'Line Manager',
      color: 'border-blue-500 bg-blue-50/50 hover:bg-blue-100/50 text-blue-900'
    },
    {
      title: 'Internal Audit Committee',
      subtitle: 'Kgomotso Gwangwa (Senior Internal Auditor)',
      email: 'Gwangwapk@nkangaladm.gov.za',
      role: 'tenant_user' as const,
      department: 'Internal Audit',
      jobFunction: 'Senior Internal Auditor',
      manager: 'Yena Khuboni',
      systemRole: 'Internal Auditor',
      color: 'border-indigo-500 bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-900'
    },
    {
      title: 'Demo Employee User',
      subtitle: 'Demo Officer (MzansiFlow)',
      email: 'user@mzansiflow.co.za',
      role: 'tenant_user' as const,
      department: 'Strategic Planning',
      jobFunction: 'Performance Officer',
      manager: 'Demo Line Manager',
      reportTo: 'manager@mzansiflow.co.za',
      systemRole: 'Employee',
      color: 'border-amber-500 bg-amber-50/50 hover:bg-amber-100/50 text-amber-900'
    },
    {
      title: 'System Administrator',
      subtitle: 'Admin Console & System Control',
      email: 'admin@nkangaladm.gov.za',
      role: 'admin' as const,
      department: 'ICT & Corporate Governance',
      jobFunction: 'Municipal Administrator',
      systemRole: 'Administrator',
      color: 'border-purple-500 bg-purple-50/50 hover:bg-purple-100/50 text-purple-900'
    }
  ];

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const email = emailInput.trim();
    const isAudit = email.toLowerCase().includes('audit') || email.toLowerCase().includes('gwangwa');
    const isMgr = email.toLowerCase().includes('khuboni') || email.toLowerCase().includes('manager');
    const isAdmin = email.toLowerCase().includes('admin');

    const user: UserType = {
      email,
      fullName: nameInput.trim() || email.split('@')[0],
      role: isAdmin ? 'admin' : 'tenant_user',
      tenantId: 'nkangala_auto',
      systemRole: isAdmin ? 'Administrator' : isAudit ? 'Internal Auditor' : isMgr ? 'Line Manager' : 'Employee',
      department: isAudit ? 'Internal Audit' : isMgr ? 'Management' : 'Operations',
      jobFunction: isAudit ? 'Auditor' : isMgr ? 'Manager' : 'Staff Member'
    };
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-emerald-500 selection:text-black">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-4 border-b border-emerald-800/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">Nkangala District Municipality</h1>
            <p className="text-xs text-emerald-400/90 font-semibold tracking-wider uppercase">IPMS Performance & Audit Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-900/40 border border-emerald-700/50 px-3.5 py-1.5 rounded-full text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Secured Internal Portal</span>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>IPMS Individual & Team Performance Framework</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Integrated Performance Management <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">& Audit System</span>
          </h2>

          <p className="text-slate-300 text-base leading-relaxed max-w-xl">
            Streamlined quarterly deliverable reporting, targeted KPI submission to Line Managers, and high-precision compliance verification dispatch to the Internal Audit Committee.
          </p>

          <div className="space-y-3 pt-2">
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Select Role for Instant One-Click Access:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickRoles.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => onLogin({
                    email: r.email,
                    fullName: r.subtitle,
                    role: r.role,
                    tenantId: 'nkangala_auto',
                    department: r.department,
                    jobFunction: r.jobFunction,
                    manager: r.manager,
                    reportTo: r.reportTo,
                    systemRole: r.systemRole
                  })}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] flex flex-col justify-between group ${r.color}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs uppercase tracking-wider">{r.title}</span>
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs font-black truncate">{r.subtitle}</div>
                  <div className="text-[11px] opacity-80 truncate font-mono mt-0.5">{r.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900/90 border border-emerald-800/50 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Manual Sign In</h3>
              <p className="text-xs text-slate-400">Sign in with an official municipality email</p>
            </div>
          </div>

          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="e.g. Sibusiso M. Shabangu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Official Email Address</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="username@nkangaladm.gov.za"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>Authenticate & Enter System</span>
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto py-4 border-t border-emerald-900/40 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>&copy; {new Date().getFullYear()} Nkangala District Municipality. Integrated Performance Management System.</div>
        <div className="text-emerald-400/80 font-mono text-[11px]">System v2.4.0 • MFMA Act 56 of 2003 Compliant</div>
      </div>
    </div>
  );
}
