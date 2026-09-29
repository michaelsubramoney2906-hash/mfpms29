import React, { useState } from 'react';
import { Landmark, Users, Calendar, FileText, CheckCircle2, ShieldCheck, ChevronRight, Download, Search } from 'lucide-react';
import type { User } from '../../types';

interface CouncilCommitteesProps {
  currentUser?: User;
  activeTenantId?: string;
  [key: string]: any;
}

export function CouncilCommittees({ currentUser, activeTenantId }: CouncilCommitteesProps) {
  const [selectedCommittee, setSelectedCommittee] = useState<string>('mpac');
  const [search, setSearch] = useState('');

  const committees = [
    {
      id: 'mpac',
      name: 'Municipal Public Accounts Committee (MPAC)',
      chairperson: 'Cllr. T. Mokoena',
      membersCount: 9,
      type: 'Section 79',
      schedule: 'Monthly / Oversight',
      description: 'Oversight over annual report, Auditor-General findings, and irregular/fruitless expenditure investigations.'
    },
    {
      id: 'mayco',
      name: 'Executive Mayoral Committee (MAYCO)',
      chairperson: 'Executive Mayor Cllr. L. Dube',
      membersCount: 10,
      type: 'Executive',
      schedule: 'Bi-Weekly',
      description: 'Coordinates administrative proposals, strategic policy direction, and quarterly municipal SDBIP reviews.'
    },
    {
      id: 'rules',
      name: 'Rules & Ethics Committee',
      chairperson: 'Speaker of Council Cllr. S. Sithole',
      membersCount: 7,
      type: 'Section 79',
      schedule: 'Quarterly',
      description: 'Enforces code of conduct for councillors, standing rules of order, and decorum during council sittings.'
    },
    {
      id: 'tech_sec80',
      name: 'Technical Services Portfolio Committee',
      chairperson: 'MMC Cllr. P. Khumalo',
      membersCount: 8,
      type: 'Section 80',
      schedule: 'Monthly',
      description: 'Assists Executive Mayor with oversight over water, electricity, roads, and civil infrastructure delivery.'
    },
    {
      id: 'finance_sec80',
      name: 'Finance & Treasury Portfolio Committee',
      chairperson: 'MMC Cllr. N. Mahlangu',
      membersCount: 8,
      type: 'Section 80',
      schedule: 'Monthly',
      description: 'Monitors Section 71 monthly budget statements, revenue collection, and procurement compliance.'
    },
    {
      id: 'audit_comm',
      name: 'Audit and Performance Committee (APAC)',
      chairperson: 'Adv. K. Naidoo (Independent Chairperson)',
      membersCount: 5,
      type: 'Statutory Independent',
      schedule: 'Quarterly',
      description: 'Independent advisory body advising Municipal Council on internal audit, risk management, and performance management.'
    }
  ];

  const filteredCommittees = committees.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Council Committees & Portfolios</h2>
            <p className="text-xs text-slate-500 font-medium">Statutory Section 79 & 80 Committees and Oversight Bodies (Structures Act)</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search committees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommittees.map(comm => (
            <div
              key={comm.id}
              onClick={() => setSelectedCommittee(comm.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
                selectedCommittee === comm.id
                  ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                  {comm.type}
                </span>
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> {comm.membersCount} Members
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{comm.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{comm.description}</p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Chair: {comm.chairperson}</span>
                <span className="text-slate-400 font-mono">{comm.schedule}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
