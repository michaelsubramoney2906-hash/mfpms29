import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, AlertTriangle, FileText, CheckCircle2, 
  Download, Plus, Edit, Trash2, Printer, Award, FileSpreadsheet, Activity
} from 'lucide-react';

export interface PopiaCondition {
  id: number;
  name: string;
  description: string;
  mfmaSection: string;
  status: 'Compliant' | 'In Progress' | 'Non-Compliant';
  notes: string;
}

export interface PopiaIncident {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  dateReported: string;
  dataSubjectsAffected: string;
  status: 'Investigating' | 'Resolved' | 'Reported to Regulator';
  remedialAction: string;
}

export interface PopiaSystemAssessment {
  id: string;
  systemName: string;
  dataType: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  safeguards: string;
  signoffStatus: 'Approved' | 'Pending IO Signoff';
}

interface PopiaComplianceTabProps {
  conditions: PopiaCondition[];
  incidents: PopiaIncident[];
  systems: PopiaSystemAssessment[];
  onUpdateConditions: (c: PopiaCondition[]) => void;
  onUpdateIncidents: (i: PopiaIncident[]) => void;
  onUpdateSystems: (s: PopiaSystemAssessment[]) => void;
}

export function PopiaComplianceTab({
  conditions,
  incidents,
  systems,
  onUpdateConditions,
  onUpdateIncidents,
  onUpdateSystems
}: PopiaComplianceTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'conditions' | 'incidents' | 'systems'>('conditions');

  // New Incident Form State
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Medium');
  const [newIncidentAffected, setNewIncidentAffected] = useState('');
  const [newIncidentRemedial, setNewIncidentRemedial] = useState('');

  const handleToggleConditionStatus = (id: number) => {
    const updated = conditions.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Compliant' ? 'In Progress' : c.status === 'In Progress' ? 'Non-Compliant' : 'Compliant';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    onUpdateConditions(updated);
  };

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentTitle) return;

    const incident: PopiaIncident = {
      id: `INC-${Date.now()}`,
      title: newIncidentTitle,
      severity: newIncidentSeverity,
      dateReported: new Date().toISOString().split('T')[0],
      dataSubjectsAffected: newIncidentAffected || 'Under Investigation',
      status: 'Investigating',
      remedialAction: newIncidentRemedial || 'Containment measures initiated.'
    };

    onUpdateIncidents([incident, ...incidents]);
    setNewIncidentTitle('');
    setNewIncidentAffected('');
    setNewIncidentRemedial('');
  };

  const handleExportPopiaReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Municipal POPIA & MFMA Data Protection Audit Report</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #0f172a; }
          h1 { color: #1e1b4b; border-bottom: 3px solid #4f46e5; padding-bottom: 8px; font-size: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Municipal POPIA Compliance Audit & MFMA Data Protection Report</h1>
        <p><strong>Regulatory Directive:</strong> Protection of Personal Information Act No. 4 of 2013 & MFMA Section 62</p>

        <h3>1. Eight (8) POPIA Processing Conditions Status</h3>
        <table>
          <thead>
            <tr>
              <th>Condition</th>
              <th>Description</th>
              <th>MFMA Ref</th>
              <th>Compliance Status</th>
            </tr>
          </thead>
          <tbody>
            ${conditions.map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.description}</td>
                <td>${c.mfmaSection}</td>
                <td><strong>${c.status}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>2. Municipal Data Privacy Incident Log</h3>
        <table>
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Affected Data Subjects</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${incidents.map(i => `
              <tr>
                <td>${i.id}</td>
                <td>${i.title}</td>
                <td>${i.severity}</td>
                <td>${i.dataSubjectsAffected}</td>
                <td>${i.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const compliantCount = conditions.filter(c => c.status === 'Compliant').length;
  const complianceScore = Math.round((compliantCount / conditions.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                POPIA Municipal Data Compliance Directive <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase font-mono font-bold">Act 4 of 2013</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Aligned to MFMA Section 62 data protection imperatives, ratepayer privacy, & Information Regulator compliance.
              </p>
            </div>
          </div>

          <button 
            onClick={handleExportPopiaReport}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
          >
            <Printer className="w-4 h-4" /> Export Audit Package
          </button>
        </div>

        {/* Compliance Meter */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">8 Conditions Compliance Score:</span>
            <span className="text-lg font-black text-emerald-400">{complianceScore}%</span>
          </div>

          <div className="w-48 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${complianceScore}%` }} />
          </div>
        </div>
      </div>

      {/* Sub-tab Selection Bar */}
      <div className="flex bg-white p-2 rounded-2xl border border-slate-200 gap-2">
        <button 
          onClick={() => setActiveSubTab('conditions')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeSubTab === 'conditions' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          1. Eight (8) POPIA Conditions Checklist
        </button>
        <button 
          onClick={() => setActiveSubTab('incidents')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeSubTab === 'incidents' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          2. Privacy Incident Register ({incidents.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('systems')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeSubTab === 'systems' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          3. Core Municipal Systems PIA ({systems.length})
        </button>
      </div>

      {/* SUB-TAB 1: 8 POPIA CONDITIONS */}
      {activeSubTab === 'conditions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conditions.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                    {c.mfmaSection}
                  </span>
                  
                  <button 
                    onClick={() => handleToggleConditionStatus(c.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                      c.status === 'Compliant' ? 'bg-emerald-100 text-emerald-800' :
                      c.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.status} (Toggle)
                  </button>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1">{c.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{c.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-150">
                <strong className="text-slate-800">Verification Note:</strong> {c.notes}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: PRIVACY INCIDENTS */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Log New Data Privacy Breach or Incident
            </h3>

            <form onSubmit={handleAddIncident} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Incident Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Unintended Email CC Disclosure"
                  value={newIncidentTitle}
                  onChange={e => setNewIncidentTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Severity</label>
                <select 
                  value={newIncidentSeverity}
                  onChange={e => setNewIncidentSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none font-bold"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Affected Data Subjects</label>
                <input 
                  type="text" 
                  placeholder="e.g. 42 Ratepayers"
                  value={newIncidentAffected}
                  onChange={e => setNewIncidentAffected(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none"
                />
              </div>

              <button 
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Log Privacy Incident
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                  <th className="p-4">Incident ID</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Date Reported</th>
                  <th className="p-4">Data Subjects</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-900">{inc.id}</td>
                    <td className="p-4 font-bold text-slate-900">{inc.title}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{inc.dateReported}</td>
                    <td className="p-4 text-slate-700 font-medium">{inc.dataSubjectsAffected}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SYSTEMS PIA */}
      {activeSubTab === 'systems' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
            Municipal Information Systems Privacy Impact Assessment (PIA)
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                <th className="p-4">System Name</th>
                <th className="p-4">Data Type Handled</th>
                <th className="p-4">Privacy Risk</th>
                <th className="p-4">Technical Safeguards</th>
                <th className="p-4">IO Sign-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {systems.map(sys => (
                <tr key={sys.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{sys.systemName}</td>
                  <td className="p-4 text-slate-600 max-w-xs">{sys.dataType}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sys.riskLevel === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {sys.riskLevel}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700">{sys.safeguards}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded uppercase">
                      {sys.signoffStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
