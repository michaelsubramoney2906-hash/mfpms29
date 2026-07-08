import React from 'react';
import { User } from '../types';
import { Search, Shield, AlertTriangle } from 'lucide-react';

interface MPACProps {
  currentUser: User;
  activeTenantId: string;
}

export function MPAC({ currentUser, activeTenantId }: MPACProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center justify-center gap-2">
             <Search className="w-8 h-8 text-indigo-600" /> Municipal Public Accounts Committee (MPAC)
          </h1>
          <p className="text-slate-500 font-medium">Internal Watchdog & Ex-Post Oversight Function (Section 79 MSA)</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 prose prose-sm max-w-none prose-indigo">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-900 text-sm">
            <strong>Brief:</strong> In South African local government, MPAC stands for the Municipal Public Accounts Committee. It is a highly critical oversight committee established by a municipal council under Section 79 of the Municipal Structures Act. Often described as the municipality’s internal "watchdog" or its local version of Parliament’s SCOPA (Standing Committee on Public Accounts), MPAC’s primary role is to protect public funds and hold the executive and administrative wings of the municipality accountable.
          </div>

          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800 border-b pb-2">1. What Does MPAC Do?</h2>
          <p>MPAC does not run day-to-day operations or execute service delivery. Instead, it performs ex-post (after-the-fact) oversight. Its core responsibilities include:</p>
          
          <h3 className="font-bold text-slate-700">Interrogating the Auditor-General’s Report</h3>
          <ul>
            <li><strong>Reviewing Audit Outcomes:</strong> When the Auditor-General (AG) releases the annual audit report for a municipality, MPAC thoroughly reviews it to identify financial failures.</li>
            <li><strong>Drafting Oversight Reports:</strong> MPAC compiles the official Oversight Report on the municipality’s Annual Report. It advises the full council on whether to approve, reject, or request revisions to the annual performance statements.</li>
          </ul>

          <h3 className="font-bold text-slate-700">Investigating Financial Misconduct & Leakages</h3>
          <ul>
            <li><strong>Unpacking Irregular Expenditure:</strong> MPAC is legally mandated to investigate all instances of Unauthorized, Irregular, Fruitless, and Wasteful (UIFW) expenditure (under MFMA Section 32).</li>
            <li><strong>Recommending Action:</strong> After investigating an unapproved contract or wasted money, MPAC recommends to council whether the money should be legally written off or recovered from the responsible official/politician.</li>
          </ul>

          <h3 className="font-bold text-slate-700">Holding Officials and Politicians Accountable</h3>
          <ul>
            <li><strong>Summoning Power:</strong> MPAC has the legal authority to summon the Municipal Manager (Accounting Officer), CFO, or any departmental head to answer for project failures, missing funds, or broken internal controls.</li>
            <li><strong>Initiating Forensic Interventions:</strong> If criminal activity or severe financial misconduct is suspected during their review, MPAC will recommend that council initiate formal forensic investigations or disciplinary steps.</li>
          </ul>

          <h3 className="font-bold text-slate-700">Monitoring Implementation of Remedial Plans</h3>
          <ul>
            <li><strong>Tracking Audit Action Plans:</strong> MPAC continuously tracks whether the administration is actually implementing the corrective strategies promised to the AG to clean up municipal governance.</li>
          </ul>

          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800 border-b pb-2 mt-8">2. Key Operational Rules of MPAC</h2>
          <p>To ensure that MPAC remains unbiased and effective, South African legislative frameworks enforce strict rules regarding its composition:</p>
          <ul>
            <li><strong>Separation of Powers:</strong> Members of the executive team—such as the Executive Mayor, Deputy Mayor, Speaker, and members of the Mayoral Committee (MMCs)—are strictly legally barred from serving on MPAC.</li>
            <li><strong>Opposition Leadership:</strong> While it includes representation from various political parties proportional to the council, national guidelines strongly encourage that the Chairperson of MPAC be appointed from an opposition party to ensure independent, aggressive oversight.</li>
            <li><strong>Public Nature:</strong> MPAC meetings are generally open to the public and the media, promoting transparency in how municipal finances are scrutinized.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
