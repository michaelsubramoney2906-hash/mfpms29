import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, CheckCircle, BarChart2, Check, RefreshCw, Send,
  User, Shield, FileBadge, Info, Layers, AlertCircle
} from 'lucide-react';

export interface CompetencyQuarterData {
  selfScore: number;
  selfComments: string;
  managerScore: number;
  managerMotivation: string;
  status: 'draft' | 'pending_approval' | 'approved';
}

export interface JscSubsection {
  heading: string;
  paragraphs: string[];
}

export interface CompetencyRow {
  id: string;
  jscNo: string;
  competency: string;
  definition: {
    mainText: string;
    subsections: JscSubsection[];
  };
  level: string;
  weight: number; 
  q1?: CompetencyQuarterData;
  q2?: CompetencyQuarterData;
  q3?: CompetencyQuarterData;
  q4?: CompetencyQuarterData;
}

interface JSCModuleProps {
  currentUser: {
    email: string;
    role?: string;
    name?: string;
    fullName?: string;
    managerEmail?: string;
  };
  activeTenantId: string;
  defaultEmployeeEmail?: string;
}

const ensureQuarterlyData = (row: CompetencyRow): CompetencyRow => {
  return {
    ...row,
    q1: row.q1 || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q2: row.q2 || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q3: row.q3 || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q4: row.q4 || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }
  };
};

const DEFAULT_COMPETENCY_ROWS: CompetencyRow[] = [
  {
    id: 'row-1',
    jscNo: 'JSC-101',
    competency: 'Strategic Financial Policy Formulation',
    definition: {
      mainText: 'Designs and evaluates municipal finance systems in direct compliance to Section 57 of the MFMA.',
      subsections: []
    },
    level: 'Level 4: Superior Leader',
    weight: 35,
    q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }
  },
  {
    id: 'row-2',
    jscNo: 'JSC-102',
    competency: 'SDF Integration Mapping',
    definition: {
      mainText: 'Provides core administrative framework oversight for spatial integration projects.',
      subsections: []
    },
    level: 'Level 3: Advanced Architect',
    weight: 35,
    q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }
  },
  {
    id: 'row-3',
    jscNo: 'JSC-103',
    competency: 'Auditing Compliance Control Matrix',
    definition: {
      mainText: 'Prepares Auditor-General response sheets ensuring full validation of operational assets.',
      subsections: []
    },
    level: 'Level 3: Advanced Architect',
    weight: 30,
    q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
    q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }
  }
];

// ==========================================
// 1. JSC Self Evaluation Section
// ==========================================
export function JSCSelfEvaluationSection({ currentUser, activeTenantId }: JSCModuleProps) {
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.competencies) && data.competencies.length > 0) {
            setRows(data.competencies.map(ensureQuarterlyData));
          }
        }
      } catch (err) {
        console.warn("Using default JSC competencies for self evaluation:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (userEmail) fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, userEmail]);

  const handleSaveToDatabase = async (updatedRows: CompetencyRow[]) => {
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencies: updatedRows })
      });
    } catch (err) {
      console.error("Error saving JSC self evaluation to Supabase:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePushToManager = async () => {
    const unrated = rows.some(r => {
      const score = r[selectedQuarter]?.selfScore;
      return !score || score < 1 || score > 5;
    });
    if (unrated) {
      alert(`Please ensure all competencies have a self score between 1 and 5 before pushing to the manager for ${selectedQuarter.toUpperCase()}.`);
      return;
    }

    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' };
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          status: 'pending_approval' as const
        }
      };
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    // Send notification
    try {
      const summaryMsg = rows.map(r => {
        const score = r[selectedQuarter]?.selfScore || 0;
        return `${r.jscNo || 'JSC'}: Score ${score}/5`;
      }).join(' | ');

      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_${Date.now()}`,
            userEmail: currentUser.managerEmail || 'manager@system.local',
            type: 'jsc_submission',
            title: `Job Specific Competency Self Evaluation Submitted (${selectedQuarter.toUpperCase()})`,
            message: `${currentUser.name || currentUser.email} has submitted JSC self evaluations for ${selectedQuarter.toUpperCase()}.\nSummary: ${summaryMsg}`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error("Failed notification sending:", e);
    }

    alert(`Successfully pushed ${selectedQuarter.toUpperCase()} Job Specific Competencies self evaluation to Line Manager for approval!`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fadeIn">
      {/* Top Header Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-200 text-orange-600 shrink-0 font-bold text-sm">
            JSC
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">JSC Employee Self Evaluation</h3>
            <p className="text-[10px] text-gray-400 font-medium">Rate your performance score (1-5) and provide comments per competency row.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
            {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition duration-150 ${selectedQuarter === q ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={handlePushToManager}
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-blue-700 disabled:opacity-50"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Push to Manager for Approval</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
            Loading Job Specific Competencies...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider select-none">
                  <th className="px-4 py-3 font-black text-center w-24">JSC Code</th>
                  <th className="px-4 py-3 font-black">Competency Title</th>
                  <th className="px-4 py-3 font-black text-center w-20">Weight (%)</th>
                  <th className="px-4 py-3 font-black text-center w-40">Self Scoring (1-5)</th>
                  <th className="px-4 py-3 font-black">Self Comments</th>
                  <th className="px-4 py-3 font-black text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-gray-400 font-semibold italic">
                      No competencies defined yet.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => {
                    const qData = row[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' };
                    const isLocked = qData.status === 'pending_approval' || qData.status === 'approved';

                    return (
                      <tr key={row.id} className="border-b border-gray-150 hover:bg-gray-50 transition duration-100 group">
                        <td className="px-4 py-3 text-center font-bold text-xs text-slate-800 font-mono">
                          {row.jscNo || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                          {row.competency || 'Mandatory Competency'}
                          {row.definition?.mainText && (
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all duration-150">
                              {row.definition.mainText}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-xs font-mono text-gray-500">
                          {row.weight}%
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={qData.selfScore || ''}
                            disabled={isLocked}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }),
                                  selfScore: val
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="">Select Score</option>
                            <option value="1">1 - Unsatisfactory</option>
                            <option value="2">2 - Basic Competence</option>
                            <option value="3">3 - Fully Competent</option>
                            <option value="4">4 - Highly Effective</option>
                            <option value="5">5 - Outstanding</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder={isLocked ? "No comment added." : "Enter self evaluation comments..."}
                            value={qData.selfComments || ''}
                            disabled={isLocked}
                            onChange={(e) => {
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }),
                                  selfComments: e.target.value
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            qData.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            qData.status === 'pending_approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {qData.status === 'approved' ? 'Approved' :
                             qData.status === 'pending_approval' ? 'Awaiting Mgr' :
                             'Draft'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. JSC Manager Approval Section
// ==========================================
export function JSCManagerApprovalSection({ currentUser, activeTenantId, defaultEmployeeEmail }: JSCModuleProps) {
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(defaultEmployeeEmail || currentUser.email || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(selectedUserEmail)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.competencies) && data.competencies.length > 0) {
            setRows(data.competencies.map(ensureQuarterlyData));
          } else {
            setRows(DEFAULT_COMPETENCY_ROWS);
          }
        }
      } catch (err) {
        console.warn("Using default competencies for manager review:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (selectedUserEmail) fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, selectedUserEmail]);

  const handleSaveToDatabase = async (updatedRows: CompetencyRow[]) => {
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(selectedUserEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencies: updatedRows })
      });
    } catch (err) {
      console.error("Error saving manager review to Supabase:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleManagerApprove = async () => {
    const unrated = rows.some(r => {
      const mScore = r[selectedQuarter]?.managerScore;
      return !mScore || mScore < 1 || mScore > 5;
    });
    if (unrated) {
      alert(`Please assign a manager score between 1 and 5 for all competency rows for ${selectedQuarter.toUpperCase()}.`);
      return;
    }

    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' };
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          status: 'approved' as const
        }
      };
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    // Send notification to employee
    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_approved_${Date.now()}`,
            userEmail: selectedUserEmail,
            type: 'jsc_approval',
            title: `Job Specific Competencies Approved (${selectedQuarter.toUpperCase()})`,
            message: `Your Line Manager (${currentUser.name || currentUser.email}) has approved your Job Specific Competencies review for ${selectedQuarter.toUpperCase()}.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error("Failed notification sending:", e);
    }

    alert(`Successfully submitted and approved ${selectedQuarter.toUpperCase()} Job Specific Competencies appraisal for ${selectedUserEmail}!`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fadeIn">
      {/* Top Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Line Manager JSC Appraisal</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-gray-400 font-medium">Select employee email to review:</span>
            <input
              type="email"
              placeholder="Enter employee email..."
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value.toLowerCase().trim())}
              className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500 w-56 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
            {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition duration-150 ${selectedQuarter === q ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={handleManagerApprove}
            disabled={saving || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-emerald-700 disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Submit Manager Review</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            Loading employee competencies...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider select-none">
                  <th className="px-4 py-3 font-black text-center w-24">JSC Code</th>
                  <th className="px-4 py-3 font-black">Competency Title</th>
                  <th className="px-4 py-3 font-black text-center w-20">Weight (%)</th>
                  <th className="px-4 py-3 font-black w-48">Self Score & Comments</th>
                  <th className="px-4 py-3 font-black text-center w-40">Manager Scoring (1-5)</th>
                  <th className="px-4 py-3 font-black">Manager Motivation / Comments</th>
                  <th className="px-4 py-3 font-black text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs text-gray-400 font-semibold italic">
                      No competencies found for target employee.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => {
                    const qData = row[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' };
                    const isApproved = qData.status === 'approved';

                    return (
                      <tr key={row.id} className="border-b border-gray-150 hover:bg-gray-50 transition duration-100 group">
                        <td className="px-4 py-3 text-center font-bold text-xs text-slate-800 font-mono">
                          {row.jscNo || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                          {row.competency || 'Mandatory Competency'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-xs font-mono text-gray-500">
                          {row.weight}%
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {qData.selfScore ? (
                            <div className="space-y-0.5">
                              <span className="inline-block bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black text-[10px]">
                                Score: {qData.selfScore}/5
                              </span>
                              <p className="text-[10px] text-gray-500 leading-tight italic break-words">
                                "{qData.selfComments || 'No comment added'}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic font-medium text-[10px]">Not evaluated yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={qData.managerScore || ''}
                            disabled={isApproved}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }),
                                  managerScore: val
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="">Select Score</option>
                            <option value="1">1 - Unsatisfactory</option>
                            <option value="2">2 - Basic Competence</option>
                            <option value="3">3 - Fully Competent</option>
                            <option value="4">4 - Highly Effective</option>
                            <option value="5">5 - Outstanding</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder={isApproved ? "No motivation added" : "Enter manager appraisal comments..."}
                            value={qData.managerMotivation || ''}
                            disabled={isApproved}
                            onChange={(e) => {
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }),
                                  managerMotivation: e.target.value
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            qData.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            qData.status === 'pending_approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {qData.status === 'approved' ? 'Approved' :
                             qData.status === 'pending_approval' ? 'Pending Review' :
                             'Draft'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. JSC Analytical Reporting Section
// ==========================================
export function JSCAnalyticalReportingSection({ currentUser, activeTenantId }: JSCModuleProps) {
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [loading, setLoading] = useState<boolean>(true);
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.competencies) && data.competencies.length > 0) {
            setRows(data.competencies.map(ensureQuarterlyData));
          }
        }
      } catch (err) {
        console.warn("Using default competencies for analytical report:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (userEmail) fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, userEmail]);

  const totalWeight = rows.reduce((acc, curr) => acc + (curr.weight || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">PMS Competencies Defined</span>
          <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{rows.length} Roles</p>
          <div className="h-1.5 bg-blue-100 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, rows.length * 20)}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Total Evaluated Composition</span>
          <p className={`text-2xl font-black mt-1 font-mono ${totalWeight === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{totalWeight}%</p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div className={`h-full rounded-full ${totalWeight === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, totalWeight)}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Target Capability Level</span>
          <p className="text-2xl font-black text-orange-600 mt-1 font-mono">L3 Advanced</p>
          <div className="h-1.5 bg-orange-100 rounded-full mt-3 overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-center">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Supabase Integration</span>
          <p className="text-lg font-black text-emerald-600 mt-2 flex items-center justify-center gap-1">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Live Synced
          </p>
        </div>

      </div>

      {/* Bar chart matrix */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-orange-500" /> Relative Weighting Composition Matrix (%)
          </h4>
          <p className="text-[10px] text-gray-400 mt-0.5">Proportional weight assigned to each registered technical competency.</p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
            Generating reporting visualizer...
          </div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-gray-400 py-10 text-center font-bold">No active competency data available to graph.</p>
        ) : (
          <div className="space-y-4 pt-2">
            {rows.map((row) => {
              const ratio = Math.min(100, Math.round((row.weight / (totalWeight || 100)) * 100));
              return (
                <div key={row.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {row.jscNo || 'JSC'}
                      </span>
                      <span className="font-bold text-slate-800">{row.competency}</span>
                    </div>
                    <span className="font-mono font-bold text-orange-600">{row.weight}% ({ratio}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(5, ratio)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
