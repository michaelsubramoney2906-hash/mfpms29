import React, { useState } from 'react';
import { User } from '../../types';
import { BookOpen, Users } from 'lucide-react';
import { cn } from '../Branding';

interface CouncilCommitteesProps {
  currentUser: User;
  activeTenantId: string;
}

export function CouncilCommittees({ currentUser, activeTenantId }: CouncilCommitteesProps) {
  const [activeTab, setActiveTab] = useState<'brief'>('brief');

  return (
    <div className="flex flex-col h-full space-y-4 font-sans">
      
      <div className="flex bg-slate-900 border border-slate-700/50 rounded-2xl p-1 shrink-0 backdrop-blur-xl shadow-lg relative z-20">
        <button
          onClick={() => setActiveTab('brief')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'brief'
              ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <BookOpen className="w-4 h-4" /> Brief
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'brief' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-10 space-y-6 text-slate-800 shadow-sm h-full overflow-y-auto custom-scrollbar">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase border-b border-slate-200 pb-4 mb-6">Council Committees</h2>
            <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
              
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                <p className="text-lg text-slate-700 font-medium leading-relaxed mb-6">
                  In South African local government, municipal councils establish different types of committees to manage the workload, ensure oversight, and political representation. Under the Local Government: Municipal Structures Act No. 117 of 1998, these committees are divided into distinct categories based on their legal mandates and powers.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">1. Section 79 Committees (Oversight and Portfolio Committees)</h3>
                    <p className="mb-3 text-slate-700">These committees are established by the full municipal council, report directly to the council, and are chaired by a non-executive councillor.</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 p-4 bg-white rounded-xl border border-slate-200">
                      <li><strong>Portfolio Oversight:</strong> They mirror municipal departments (e.g., Infrastructure, Finance, Human Settlements, Public Safety).</li>
                      <li><strong>Role:</strong> They monitor service delivery, review departmental performance, and make policy recommendations to the council.</li>
                      <li><strong>Composition:</strong> They are politically representative, meaning membership is distributed proportionally based on the political parties elected to the council.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">2. Section 80 Committees (Executive-Led Committees)</h3>
                    <p className="mb-3 text-slate-700">These committees are established to assist the Executive Mayor or the Executive Committee (MayCo/ExCo).</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 p-4 bg-white rounded-xl border border-slate-200">
                      <li><strong>Structure:</strong> They are chaired by a member of the Mayoral Committee (MMC) or Executive Committee.</li>
                      <li><strong>Role:</strong> They help the political executive execute their duties, prepare budgets, and develop strategies before they are sent to the full council for approval.</li>
                      <li><strong>Powers:</strong> Council can delegate executive decision-making powers to Section 80 committees, unlike Section 79 committees which are purely advisory and oversight-focused.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">3. Statutory & Standing Committees</h3>
                    <p className="mb-3 text-slate-700">These are permanent committees established by legislation to perform specific governance, legal, or constitutional functions.</p>
                    <ul className="list-disc list-inside space-y-3 text-slate-700 p-4 bg-white rounded-xl border border-slate-200">
                      <li><strong>Municipal Public Accounts Committee (MPAC):</strong> A critical Section 79 committee that acts as the council's "watchdog." It reviews the Auditor-General’s reports, investigates irregular, wasteful, or unauthorized expenditure, and holds the administration accountable. It is traditionally chaired by an opposition party member.</li>
                      <li><strong>Rules Committee:</strong> Formulates the standing rules and orders for council meetings, manages decorum, and develops protocols for political debates.</li>
                      <li><strong>Disciplinary / Ethics Committee:</strong> Investigates breaches of the Code of Conduct by councillors and recommends penalties or suspensions to the council or the provincial MEC.</li>
                      <li><strong>Audit Committee:</strong> An independent advisory body (made up of external professionals, not councillors) mandated by Section 166 of the MFMA to advise the council and administration on financial controls, risk management, and compliance.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">4. Ward Committees</h3>
                    <p className="mb-3 text-slate-700">While not council committees in an administrative sense, these are statutory structures established under Section 73 of the Structures Act.</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700 p-4 bg-white rounded-xl border border-slate-200">
                      <li><strong>Role:</strong> They serve as the formal link between the municipality and the community.</li>
                      <li><strong>Structure:</strong> Chaired by the elected Ward Councillor and made up of up to 10 community members representing diverse local interests (e.g., youth, business, women, civic associations).</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-6">Core Functions of the Committees</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold mb-2 text-purple-800">1. Exercising Oversight and Accountability</h4>
                    <p className="mb-2 text-slate-700">Committees serve as the primary check-and-balance mechanism over the municipal administration (the Municipal Manager, directors, and officials).</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                      <li><strong>Monitoring Performance:</strong> They review monthly departmental reports to ensure service delivery targets (like fixing water leaks or installing high-mast lights) are being met.</li>
                      <li><strong>Investigating Audit Failures:</strong> Specialized committees like the Municipal Public Accounts Committee (MPAC) interrogate unauthorized, irregular, or wasteful expenditure highlighted by the Auditor-General.</li>
                      <li><strong>Calling Officials to Account:</strong> They have the power to summon department heads (such as the CFO or Technical Director) to explain project delays, budget overruns, or operational failures.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-2 text-purple-800">2. Policy Formulation and Strategic Planning</h4>
                    <p className="mb-2 text-slate-700">Before a policy or plan goes to the full council for a vote, it is rigorously debated and refined within committees.</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                      <li><strong>Drafting By-Laws:</strong> Committees develop and review local laws (by-laws) regarding zoning, traffic, public health, and waste management.</li>
                      <li><strong>Budget and IDP Processing:</strong> Executive-led committees (Section 80) work directly with finance officials to shape the annual budget and the 5-year Integrated Development Plan (IDP).</li>
                      <li><strong>Aligning Frameworks:</strong> They ensure that local policies align with provincial and national development priorities.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-2 text-purple-800">3. Executive Support and Implementation</h4>
                    <p className="mb-2 text-slate-700">Certain committees exist specifically to assist the political leadership in running the town.</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                      <li><strong>Advising Leadership:</strong> They advise the Executive Mayor or Mayoral Committee on urgent interventions, infrastructure crises, or shifting local priorities.</li>
                      <li><strong>Executing Delegated Powers:</strong> If authorized by the full council, executive committees can make immediate operational decisions to expedite service delivery without waiting for the next monthly council sitting.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-2 text-purple-800">4. Public Participation and Grievance Management</h4>
                    <p className="mb-2 text-slate-700">Committees bridge the gap between community members and the municipal governance structure.</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                      <li><strong>Processing Petitions:</strong> Public petitions regarding service failures or community grievances are assigned to specific committees for investigation and response.</li>
                      <li><strong>Facilitating Ward Input:</strong> They process feedback from Ward Committees, ensuring grassroots community needs are integrated into municipal planning.</li>
                      <li><strong>Enforcing Councillor Ethics:</strong> The Ethics Committee investigates formal complaints from the public regarding corrupt or unprofessional behavior by elected councillors.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
