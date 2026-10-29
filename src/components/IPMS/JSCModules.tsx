import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, CheckCircle, BarChart2, Check, RefreshCw, Send,
  User, Shield, FileBadge, Info, Layers, AlertCircle, ShieldAlert,
  Search, Eye, Edit3, MessageSquare, Award, RotateCcw, Upload, FileText, X,
  Paperclip
} from 'lucide-react';
import { PoeDocument, QuarterPoeSelector } from './Evaluation_IPMS';
import { viewOriginalFile } from '../../utils/documentBinaryHelper';
import { TeamAzureSearchInput } from './TeamAzureSearchInput';
import { isUserUnrestricted } from '../../utils/unrestrictedHelper';

export interface CompetencyQuarterData {
  selfScore: number;
  selfComments: string;
  managerScore: number;
  managerMotivation: string;
  internalAuditorScore?: number;
  internalAuditorComments?: string;
  dpmcScore?: number;
  dpmcComments?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'audited' | 'moderated';
  poeDocs?: PoeDocument[];
  poeText?: string;
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
  poeDocs?: PoeDocument[];
  q1?: CompetencyQuarterData;
  q2?: CompetencyQuarterData;
  q3?: CompetencyQuarterData;
  q4?: CompetencyQuarterData;
}

export const NIRISHA_DIRECT_SUBORDINATES = [
  { email: 'rachidimb@nkangaladm.gov.za', name: 'Mr. M.B. Rachidi (Senior Manager: Legal Services)' },
  { email: 'mokhabelagg@nkangaladm.gov.za', name: 'Ms. G.G. Mokhabela (Manager: Administration)' },
  { email: 'marxc@nkangaladm.gov.za', name: 'Ms. Chanel Marx (Chief Committee Officer)' },
  { email: 'nakapm@nkangaladm.gov.za', name: 'Ms. P.M. Naka (Manager: Records & Archives)' }
];

export const getTargetManagerForUser = (userEmail: string, fallbackManager?: string): string => {
  const norm = (userEmail || '').toLowerCase().trim();
  if (norm.includes('shabangusm') || norm.includes('shabangugm')) return 'mahlanguml@nkangaladm.gov.za';
  if (['rachidimb', 'mokhabelagg', 'marxc', 'nakapm'].some(id => norm.includes(id))) {
    return 'singhn@nkangaladm.gov.za';
  }
  if (['matsebulan', 'mathenjwabh'].some(id => norm.includes(id))) {
    return 'joubertm@nkangaladm.gov.za';
  }
  if (['joubertm', 'tloujmt', 'singhn'].some(id => norm.includes(id))) {
    return 'linkss@nkangaladm.gov.za';
  }
  if (['giyasi-affulph', 'sibanyonimj', 'singorl'].some(id => norm.includes(id))) {
    return 'magampeas@nkangaladm.gov.za';
  }
  if (['zulune', 'nsibandenp', 'lukhelema', 'sakisd'].some(id => norm.includes(id))) {
    return 'khuboniy@nkangaladm.gov.za';
  }
  if (norm.includes('myenispl')) {
    return 'nkosije@nkangaladm.gov.za';
  }
  return fallbackManager || 'singhn@nkangaladm.gov.za';
};

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
  isTeamJSC?: boolean;
  isTeamJSC2?: boolean;
}

export const ensureQuarterlyData = (row: CompetencyRow): CompetencyRow => {
  const defaultQuarter = (qData?: Partial<CompetencyQuarterData>): CompetencyQuarterData => ({
    selfScore: qData?.selfScore || 0,
    selfComments: qData?.selfComments || '',
    managerScore: qData?.managerScore || 0,
    managerMotivation: qData?.managerMotivation || '',
    internalAuditorScore: qData?.internalAuditorScore || 0,
    internalAuditorComments: qData?.internalAuditorComments || '',
    dpmcScore: qData?.dpmcScore || 0,
    dpmcComments: qData?.dpmcComments || '',
    status: qData?.status || 'draft',
    poeDocs: qData?.poeDocs || [],
    poeText: qData?.poeText || ''
  });

  return {
    ...row,
    poeDocs: row.poeDocs || [],
    q1: defaultQuarter(row.q1),
    q2: defaultQuarter(row.q2),
    q3: defaultQuarter(row.q3),
    q4: defaultQuarter(row.q4)
  };
};

export const DEFAULT_COMPETENCY_ROWS: CompetencyRow[] = [
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
    q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }
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
    q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }
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
    q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' },
    q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }
  }
];

// ==========================================
// 1. JSC Self / Team Evaluation Section
// ==========================================
export function JSCSelfEvaluationSection({ currentUser, activeTenantId, defaultEmployeeEmail, isTeamJSC, isTeamJSC2 }: JSCModuleProps) {
  const apiEndpoint = isTeamJSC2 ? 'team-job-competencies-2' : isTeamJSC ? 'team-job-competencies' : 'job-competencies';
  const isTeam = isTeamJSC || isTeamJSC2;
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [targetEmailState, setTargetEmailState] = useState<string>(
    defaultEmployeeEmail || currentUser?.email || ''
  );

  useEffect(() => {
    if (defaultEmployeeEmail) {
      setTargetEmailState(defaultEmployeeEmail);
    }
  }, [defaultEmployeeEmail]);

  const userEmail = (targetEmailState || currentUser?.email || '').toLowerCase().trim();

  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.competencies)) {
            setRows(data.competencies.map(ensureQuarterlyData));
          } else if (data.isCleared) {
            setRows([]);
          }
        }
      } catch (err) {
        console.warn("Using default JSC competencies for evaluation:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (userEmail) fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, userEmail, apiEndpoint]);

  const currentMonth = new Date().getMonth(); // 0-11
  const isTimeLocked = false; // Reporting and evaluation unlocked for all users
  const activePeriodStr = selectedQuarter.toUpperCase() + " Evaluation Period (Unlocked)";

  const handleSaveToDatabase = async (updatedRows: CompetencyRow[]) => {
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencies: updatedRows })
      });
    } catch (err) {
      console.error("Error saving JSC evaluation to Supabase:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRedoEvaluation = async () => {
    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          status: 'draft' as const
        }
      };
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    alert(`Job Specific Competencies evaluation for ${selectedQuarter.toUpperCase()} unlocked for redo! You can now update your self scores and comments, then click "Resubmit to Manager".`);
  };

  const handleRedoSingleCompetency = async (rowId: string) => {
    const updated = rows.map(r => {
      if (r.id === rowId) {
        const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
        return {
          ...r,
          [selectedQuarter]: {
            ...qData,
            status: 'draft' as const
          }
        };
      }
      return r;
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    const target = rows.find(r => r.id === rowId);
    alert(`Competency ${target?.jscNo || rowId} unlocked for redo! Update your self score & comments, then push to manager.`);
  };

  const handlePushSingleToManager = async (rowId: string) => {
    const target = rows.find(r => r.id === rowId);
    const score = target?.[selectedQuarter]?.selfScore;
    if (!score || score < 1 || score > 5) {
      alert(`Please assign a self score between 1 and 5 for ${target?.jscNo || 'this competency'} before pushing to manager.`);
      return;
    }

    const updated = rows.map(r => {
      if (r.id === rowId) {
        const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
        return {
          ...r,
          [selectedQuarter]: {
            ...qData,
            status: 'pending_approval' as const
          }
        };
      }
      return r;
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    try {
      const targetManager = getTargetManagerForUser(currentUser.email, currentUser.managerEmail);
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_${Date.now()}`,
            userEmail: targetManager,
            recipientEmail: targetManager,
            recipientName: targetManager.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.fullName || currentUser.email,
            employeeEmail: currentUser.email,
            type: 'jsc_submission',
            actionType: 'submission',
            quarter: selectedQuarter.toUpperCase(),
            title: `Single JSC ${target?.jscNo || ''} Submitted (${selectedQuarter.toUpperCase()})`,
            message: `${currentUser.name || currentUser.fullName || currentUser.email} (${currentUser.email}) submitted competency ${target?.jscNo || ''} (${target?.competency || ''}) with Self Score ${score}/5 for ${selectedQuarter.toUpperCase()}.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error(e);
    }

    alert(`Competency ${target?.jscNo || ''} pushed to Line Manager for approval!`);
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
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
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

    try {
      const summaryMsg = rows.map(r => {
        const score = r[selectedQuarter]?.selfScore || 0;
        return `${r.jscNo || 'JSC'}: Score ${score}/5`;
      }).join(' | ');

      const targetManager = getTargetManagerForUser(currentUser.email, currentUser.managerEmail);
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_${Date.now()}`,
            userEmail: targetManager,
            recipientEmail: targetManager,
            recipientName: targetManager.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.fullName || currentUser.email,
            employeeEmail: currentUser.email,
            type: 'jsc_submission',
            actionType: 'submission',
            quarter: selectedQuarter.toUpperCase(),
            title: `Job Specific Competency Self Evaluation Submitted (${selectedQuarter.toUpperCase()})`,
            message: `${currentUser.name || currentUser.fullName || currentUser.email} (${currentUser.email}) has submitted JSC self evaluations and evidence for ${selectedQuarter.toUpperCase()}.\nSummary: ${summaryMsg}`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error("Failed notification sending:", e);
    }

    alert(`Successfully submitted / resubmitted ${selectedQuarter.toUpperCase()} Job Specific Competencies self evaluation to Line Manager for approval!`);
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
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">{isTeamJSC ? 'JSC Team Evaluation' : 'JSC Employee Self Evaluation'}</h3>
            <p className="text-[10px] text-gray-400 font-medium">Rate {isTeamJSC ? 'team' : 'your'} performance score (1-5) and provide comments per competency row per quarter.</p>
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleRedoEvaluation}
              disabled={saving || loading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-black px-3.5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-amber-600 disabled:opacity-50"
              title="Unlock evaluation for edits and redo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Redo Evaluation</span>
            </button>

            <button
              onClick={handlePushToManager}
              disabled={saving || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-blue-700 disabled:opacity-50"
              title="Submit or resubmit evaluation to Line Manager for approval"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Resubmit to Manager</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}

      {isTimeLocked ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium mb-4 mx-4">
          <span className="text-base">🔒</span>
          <span>This evaluation section is strictly time-locked. It is only active during its reporting period: <strong>{activePeriodStr}</strong>.</span>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium mb-4 mx-4">
          <span className="text-base">✅</span>
          <span>This evaluation section is currently active ({activePeriodStr}).</span>
        </div>
      )}

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
                  <th className="px-4 py-3 font-black text-center w-40">{isTeamJSC ? 'Team Score (1-5)' : 'Self Score (1-5)'}</th>
                  <th className="px-4 py-3 font-black">{isTeamJSC ? 'Team Comments' : 'Self Comments'}</th>
                  <th className="px-4 py-3 font-black text-center w-72 bg-emerald-950 text-white">Portfolio of Evidence (PoE)</th>
                  <th className="px-4 py-3 font-black text-center w-48">Audit & DPMC Reviews</th>
                  <th className="px-4 py-3 font-black text-center w-24">Status</th>
                  <th className="px-4 py-3 font-black text-center w-36 bg-slate-800 text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-xs text-gray-400 font-semibold italic">
                      No competencies defined yet.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => {
                    const qData = row[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
                    const isLocked = qData.status === 'pending_approval' || qData.status === 'approved' || qData.status === 'audited' || qData.status === 'moderated' || isTimeLocked;

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
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
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
                            placeholder={isLocked ? "No comment added." : (isTeamJSC ? "Enter team evaluation comments..." : "Enter self evaluation comments...")}
                            value={qData.selfComments || ''}
                            disabled={isLocked}
                            onChange={(e) => {
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
                                  selfComments: e.target.value
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-w-sm">
                            <QuarterPoeSelector
                              label="Competency Evidence"
                              placeholderRef="Describe supporting proof of competency..."
                              quarterName={selectedQuarter.toUpperCase()}
                              requiredPoeDescription="Upload certificates, project files, or reports backing up your evaluation rating"
                              textValue={qData.poeText || ''}
                              setTextValue={(val) => {
                                const updated = rows.map(r => r.id === row.id ? {
                                  ...r,
                                  [selectedQuarter]: {
                                    ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
                                    poeText: val
                                  }
                                } : r);
                                setRows(updated);
                                handleSaveToDatabase(updated);
                              }}
                              files={qData.poeDocs || []}
                              setFiles={(newFiles) => {
                                const updated = rows.map(r => r.id === row.id ? {
                                  ...r,
                                  [selectedQuarter]: {
                                    ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
                                    poeDocs: newFiles
                                  }
                                } : r);
                                setRows(updated);
                                handleSaveToDatabase(updated);
                              }}
                              currentUser={currentUser}
                              disabled={isLocked}
                              poeStatus={qData.status === 'approved' ? 'Approved' : undefined}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs space-y-1">
                          {qData.internalAuditorScore ? (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-1.5 text-[9.5px]">
                              <span className="font-extrabold text-indigo-900 block">
                                Internal Audit: {qData.internalAuditorScore}/5
                              </span>
                              <p className="text-indigo-700 italic truncate" title={qData.internalAuditorComments}>
                                "{qData.internalAuditorComments || 'Audited'}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[9.5px] italic block">Audit pending</span>
                          )}

                          {qData.dpmcScore ? (
                            <div className="bg-purple-50 border border-purple-200 rounded-md p-1.5 text-[9.5px]">
                              <span className="font-extrabold text-purple-900 block">
                                DPMC Review: {qData.dpmcScore}/5
                              </span>
                              <p className="text-purple-700 italic truncate" title={qData.dpmcComments}>
                                "{qData.dpmcComments || 'Moderated'}"
                              </p>
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            qData.status === 'approved' || qData.status === 'audited' || qData.status === 'moderated' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            qData.status === 'pending_approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {qData.status === 'moderated' ? 'Moderated' :
                             qData.status === 'audited' ? 'Audited' :
                             qData.status === 'approved' ? 'Approved' :
                             qData.status === 'pending_approval' ? 'Awaiting Mgr' :
                             'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col gap-1.5 items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handlePushSingleToManager(row.id)}
                              disabled={saving || loading}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-1 rounded-md text-[9px] uppercase tracking-tight flex items-center gap-1 transition shadow-2xs cursor-pointer w-full justify-center disabled:opacity-50"
                              title="Push this single competency to manager"
                            >
                              <Send className="w-3 h-3" />
                              <span>Push to Mgr</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRedoSingleCompetency(row.id)}
                              disabled={saving || loading}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-1 rounded-md text-[9px] uppercase tracking-tight flex items-center gap-1 transition cursor-pointer w-full justify-center"
                              title="Unlock this single competency to redo rating & PoE"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              <span>Redo</span>
                            </button>
                          </div>
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
export function JSCManagerApprovalSection({ currentUser, activeTenantId, defaultEmployeeEmail, isTeamJSC, isTeamJSC2 }: JSCModuleProps) {
  const apiEndpoint = isTeamJSC2 ? 'team-job-competencies-2' : isTeamJSC ? 'team-job-competencies' : 'job-competencies';
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const isNirisha = (currentUser.email || '').toLowerCase().includes('singhn');
  const initialSubordinate = isNirisha 
    ? 'rachidimb@nkangaladm.gov.za' 
    : (defaultEmployeeEmail && defaultEmployeeEmail.toLowerCase().trim() !== (currentUser.email || '').toLowerCase().trim()
        ? defaultEmployeeEmail.toLowerCase().trim()
        : '');

  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(initialSubordinate);
  const [subordinates, setSubordinates] = useState<Array<{ email: string; name: string }>>(
    isNirisha ? NIRISHA_DIRECT_SUBORDINATES : []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (defaultEmployeeEmail) {
      const norm = defaultEmployeeEmail.toLowerCase().trim();
      const currNorm = (currentUser.email || '').toLowerCase().trim();
      if (norm && norm !== currNorm) {
        setSelectedUserEmail(norm);
      } else if (currNorm.includes('singhn')) {
        setSelectedUserEmail('rachidimb@nkangaladm.gov.za');
      }
    }
  }, [defaultEmployeeEmail, currentUser.email]);

  useEffect(() => {
    let active = true;
    const fetchTeam = async () => {
      try {
        const [teamRes, usersRes] = await Promise.all([
          fetch(`/api/tenant/${activeTenantId}/team-plans`),
          fetch(`/api/tenant/${activeTenantId}/users`)
        ]);

        const emailMap = new Map<string, string>();
        const userObjMap = new Map<string, any>();

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData)) {
            usersData.forEach((u: any) => {
              const em = (u.email || '').toLowerCase().trim();
              if (em && !em.endsWith('@mzansiflow.co.za') && !em.endsWith('@massivedynamixdistributors.com')) {
                userObjMap.set(em, u);
                emailMap.set(em, u.fullName || u.full_name || u.name || em);
              }
            });
          }
        }

        if (teamRes.ok) {
          const data = await teamRes.json();
          if (data && Array.isArray(data.teamPlans)) {
            data.teamPlans.forEach((tp: any) => {
              const em = (tp.userId || '').toLowerCase().trim();
              if (em && !em.endsWith('@mzansiflow.co.za') && !em.endsWith('@massivedynamixdistributors.com')) {
                if (!emailMap.has(em) || emailMap.get(em) === em) {
                  emailMap.set(em, tp.plan?.metadata?.name || tp.plan?.metadata?.email || em);
                }
              }
            });
          }
        }

        const currNorm = (currentUser.email || '').toLowerCase().trim();
        const defNorm = (defaultEmployeeEmail || '').toLowerCase().trim();

        const isUnrestrictedAdmin = 
          isUserUnrestricted(currentUser) ||
          currNorm.endsWith('@mzansiflow.co.za') ||
          currNorm.endsWith('@massivedynamixdistributors.com') ||
          ['mike@', 'delphine@', 'delpjhine@', 'audrey@', 'ryanw@', 'bongani@', 'marlan@', 'qiniso@'].some(a => currNorm.includes(a));

        // Helper to verify if an official is a direct reporting subordinate of the current manager
        const isDirectSubordinate = (employeeEmail: string) => {
          const empNorm = employeeEmail.toLowerCase().trim();
          if (empNorm === currNorm) return false; // Exclude self
          if (isUnrestrictedAdmin) return true; // Global admins & Delphine can view/approve all municipal officials
          if (defNorm && empNorm === defNorm) return true; // Allow explicitly requested subordinate from inbox/deep-link

          // 1. Nirisha's direct reporting team override
          if (isNirisha && NIRISHA_DIRECT_SUBORDINATES.some(s => s.email.toLowerCase().trim() === empNorm)) {
            return true;
          }

          // 2. Check getTargetManagerForUser mapping
          const mappedManager = getTargetManagerForUser(empNorm).toLowerCase().trim();
          if (mappedManager === currNorm) return true;

          // 3. Check user object manager attributes from DB
          const uObj = userObjMap.get(empNorm);
          if (uObj) {
            const objMgr = (uObj.managerEmail || uObj.manager || uObj.reportTo || uObj.supervisorName || '').toLowerCase().trim();
            if (objMgr && (objMgr === currNorm || objMgr.includes(currNorm.split('@')[0]))) {
              return true;
            }
          }

          // 4. Municipal Manager / System Admin departmental director oversight
          if (currNorm.includes('mahlanguml') || currNorm.includes('mahlangulm')) {
            const isDirectorOrHOD = [
              'shabangusm', 'standeral', 'joubertm', 'linkss', 'magampeas', 'khuboniy', 'nkosije', 'singhn', 'vanniekerkt', 'masilelasi'
            ].some(d => empNorm.includes(d));
            if (isDirectorOrHOD) return true;
          }

          return false;
        };

        const list = Array.from(emailMap.entries())
          .filter(([email]) => isDirectSubordinate(email))
          .map(([email, name]) => ({ email, name }));

        if (isNirisha) {
          list.sort((a, b) => {
            const aIsDirect = NIRISHA_DIRECT_SUBORDINATES.some(s => s.email === a.email);
            const bIsDirect = NIRISHA_DIRECT_SUBORDINATES.some(s => s.email === b.email);
            if (aIsDirect && !bIsDirect) return -1;
            if (!aIsDirect && bIsDirect) return 1;
            return a.name.localeCompare(b.name);
          });
        }

        if (active) {
          setSubordinates(list);

          if (isNirisha && (!selectedUserEmail || selectedUserEmail === currNorm)) {
            setSelectedUserEmail('rachidimb@nkangaladm.gov.za');
          } else if (defaultEmployeeEmail && defaultEmployeeEmail.toLowerCase().trim() !== currNorm) {
            setSelectedUserEmail(defaultEmployeeEmail.toLowerCase().trim());
          } else if (list.length > 0) {
            const currentInList = list.some(s => s.email === selectedUserEmail);
            if (!currentInList) {
              setSelectedUserEmail(list[0].email);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch team for manager review:", err);
      }
    };
    if (activeTenantId) fetchTeam();
    return () => { active = false; };
  }, [activeTenantId, defaultEmployeeEmail, currentUser.email, isNirisha]);

  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      const emailToFetch = selectedUserEmail || defaultEmployeeEmail || currentUser.email || '';
      if (!emailToFetch) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(emailToFetch)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.competencies)) {
            setRows(data.competencies.map(ensureQuarterlyData));
          } else if (data.isCleared) {
            setRows([]);
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
    fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, selectedUserEmail, currentUser.email, defaultEmployeeEmail, apiEndpoint]);

  const handleSaveToDatabase = async (updatedRows: CompetencyRow[]) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(emailToSave)}`, {
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

  const handleReturnForRedo = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    if (!emailToSave) {
      alert("Please select an employee first.");
      return;
    }

    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          status: 'draft' as const
        }
      };
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_redo_${Date.now()}`,
            userEmail: emailToSave,
            recipientEmail: emailToSave,
            recipientName: emailToSave.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'jsc_redo_request',
            actionType: 'redo_request',
            title: `Job Specific Competency Returned for Redo (${selectedQuarter.toUpperCase()})`,
            message: `Your Line Manager (${currentUser.name || currentUser.email}) has returned your Job Specific Competency evaluation for ${selectedQuarter.toUpperCase()} for redo and resubmission.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error("Failed notification sending:", e);
    }

    alert(`Successfully returned ${selectedQuarter.toUpperCase()} Job Specific Competencies evaluation to ${emailToSave} for redo and resubmission!`);
  };

  const handleManagerApprove = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    const unrated = rows.some(r => {
      const mScore = r[selectedQuarter]?.managerScore;
      return !mScore || mScore < 1 || mScore > 5;
    });
    if (unrated) {
      alert(`Please assign a manager score between 1 and 5 for all competency rows for ${selectedQuarter.toUpperCase()}.`);
      return;
    }

    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
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

    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_approved_${Date.now()}`,
            userEmail: emailToSave,
            recipientEmail: emailToSave,
            recipientName: emailToSave.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'jsc_approval',
            actionType: 'approval',
            title: `Job Specific Competencies Approved (${selectedQuarter.toUpperCase()})`,
            message: `Your Line Manager (${currentUser.name || currentUser.email}) has reviewed and approved your Job Specific Competencies evaluation for ${selectedQuarter.toUpperCase()}.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error("Failed notification sending:", e);
    }

    alert(`Successfully submitted and approved ${selectedQuarter.toUpperCase()} Job Specific Competencies appraisal for ${emailToSave}!`);
  };

  const handlePushToInternalAudit = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    if (!emailToSave) {
      alert("Please select an employee first.");
      return;
    }

    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
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

    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_audit_dispatch_${Date.now()}`,
            userEmail: 'internal_audit',
            recipientEmail: 'internal_audit',
            recipientName: 'Internal Audit Committee',
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'jsc_audit_dispatch',
            actionType: 'audit_request',
            title: `🛡️ JSC Appraisal Dispatched to Internal Audit (${selectedQuarter.toUpperCase()})`,
            message: `Line Manager (${currentUser.name || currentUser.email}) approved and dispatched JSC appraisals for ${emailToSave} (${selectedQuarter.toUpperCase()}) to Internal Audit Committee.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error(e);
    }

    alert(`Job Specific Competencies for ${emailToSave} successfully pushed to Internal Audit Review!`);
  };

  const handleManagerApproveSingle = async (rowId: string) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    const target = rows.find(r => r.id === rowId);
    const mScore = target?.[selectedQuarter]?.managerScore || target?.[selectedQuarter]?.selfScore || 3;

    const updated = rows.map(r => {
      if (r.id === rowId) {
        const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
        return {
          ...r,
          [selectedQuarter]: {
            ...qData,
            managerScore: mScore,
            status: 'approved' as const
          }
        };
      }
      return r;
    });

    setRows(updated);
    await handleSaveToDatabase(updated);
    alert(`Competency ${target?.jscNo || ''} approved by manager!`);
  };

  const handleReturnSingleForRedo = async (rowId: string) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    const updated = rows.map(r => {
      if (r.id === rowId) {
        const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
        return {
          ...r,
          [selectedQuarter]: {
            ...qData,
            status: 'draft' as const
          }
        };
      }
      return r;
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    const target = rows.find(r => r.id === rowId);
    alert(`Competency ${target?.jscNo || ''} returned for redo and revision!`);
  };

  const handlePushSingleToAudit = async (rowId: string) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    const target = rows.find(r => r.id === rowId);

    const updated = rows.map(r => {
      if (r.id === rowId) {
        const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
        return {
          ...r,
          [selectedQuarter]: {
            ...qData,
            status: 'approved' as const
          }
        };
      }
      return r;
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_single_audit_${Date.now()}`,
            userEmail: 'internal_audit',
            recipientEmail: 'internal_audit',
            recipientName: 'Internal Audit Committee',
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'jsc_audit_dispatch',
            actionType: 'audit_request',
            title: `🛡️ Single JSC ${target?.jscNo || ''} Dispatched to Internal Audit`,
            message: `Line Manager dispatched competency ${target?.jscNo || ''} (${target?.competency || ''}) for ${emailToSave} to Internal Audit.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error(e);
    }

    alert(`Competency ${target?.jscNo || ''} pushed to Internal Audit Review!`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fadeIn">
      {/* Top Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Line Manager JSC Subordinate Appraisal</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Subordinate / Employee to Review:</span>
            {subordinates.length > 0 && (
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value.toLowerCase().trim())}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
              >
                {subordinates.map((sub, idx) => (
                  <option key={idx} value={sub.email}>
                    {sub.name ? `${sub.name} (${sub.email})` : sub.email}
                  </option>
                ))}
              </select>
            )}
            <input
              type="email"
              placeholder="Or enter employee email..."
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value.toLowerCase().trim())}
              className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 w-52 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
            {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition duration-150 ${selectedQuarter === q ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReturnForRedo}
              disabled={saving || loading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-black px-3.5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-amber-600 disabled:opacity-50"
              title="Return evaluation to employee for redo and revision"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Redo / Return</span>
            </button>

            <button
              onClick={handleManagerApprove}
              disabled={saving || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-emerald-700 disabled:opacity-50"
              title="Submit manager appraisal and approve"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve Review</span>
            </button>

            <button
              onClick={handlePushToInternalAudit}
              disabled={saving || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3.5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-indigo-700 disabled:opacity-50"
              title="Push approved review to Internal Audit"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Push to Internal Audit</span>
            </button>
          </div>
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
                  <th className="px-4 py-3 font-black text-center w-36 bg-slate-800 text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-xs text-gray-400 font-semibold italic">
                      No competencies found for target employee.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => {
                    const qData = row[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
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
                          {(() => {
                            const qPoeDocs = Array.isArray(qData.poeDocs) ? qData.poeDocs : [];
                            const rowPoeDocs = Array.isArray(row.poeDocs) ? row.poeDocs : [];
                            const seenDocIds = new Set<string>();
                            const combinedPoeDocs: PoeDocument[] = [];
                            [...qPoeDocs, ...rowPoeDocs].forEach(d => {
                              if (d && (d.id || d.name)) {
                                const key = d.id || d.name;
                                if (!seenDocIds.has(key)) {
                                  seenDocIds.add(key);
                                  combinedPoeDocs.push(d);
                                }
                              }
                            });

                            return (
                              <div className="space-y-1.5">
                                {qData.selfScore ? (
                                  <span className="inline-block bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black text-[10px]">
                                    Score: {qData.selfScore}/5
                                  </span>
                                ) : (
                                  <span className="inline-block bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold text-[10px] italic">
                                    Score: Pending ({qData.selfScore || 0}/5)
                                  </span>
                                )}
                                {qData.selfComments && (
                                  <p className="text-[10px] text-gray-500 leading-tight italic break-words">
                                    "{qData.selfComments}"
                                  </p>
                                )}
                                {qData.poeText && (
                                  <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[9.5px] mt-1 text-slate-700">
                                    <span className="font-extrabold text-slate-800 block">PoE Note:</span>
                                    {qData.poeText}
                                  </div>
                                )}
                                {combinedPoeDocs.length > 0 ? (
                                  <div className="space-y-1 mt-1">
                                    <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-tight block flex items-center gap-1">
                                      <Paperclip className="w-2.5 h-2.5 text-emerald-600" />
                                      PoE Attachments ({combinedPoeDocs.length}):
                                    </span>
                                    <div className="flex flex-col gap-1 max-h-[90px] overflow-y-auto">
                                      {combinedPoeDocs.map((file) => (
                                        <div key={file.id || file.name} className="flex items-center justify-between gap-1 bg-white border border-emerald-200 rounded p-1 text-[9px] hover:bg-emerald-50 transition duration-75">
                                          <button
                                            type="button"
                                            onClick={() => viewOriginalFile(file.name, file.dataUrl)}
                                            className="font-bold text-slate-800 hover:text-emerald-700 truncate max-w-[120px] flex items-center gap-1 cursor-pointer text-left border-none bg-transparent p-0"
                                            title={`Click to view ${file.name} in a new window`}
                                          >
                                            <FileText className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                          </button>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => viewOriginalFile(file.name, file.dataUrl)}
                                              className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer text-[8px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200"
                                              title="View in browser"
                                            >
                                              View
                                            </button>
                                            <a
                                              href={file.dataUrl}
                                              download={file.name}
                                              className="text-blue-700 hover:text-blue-900 font-black text-[8px] bg-blue-50 px-1 py-0.5 rounded border border-blue-200"
                                              title="Download original file"
                                            >
                                              Down
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[9.5px] text-gray-400 italic block mt-0.5">No PoE attached</span>
                                )}
                              </div>
                            );
                          })()}
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
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
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
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
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
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleManagerApproveSingle(row.id)}
                              disabled={saving || loading}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded-md text-[9px] uppercase tracking-tight flex items-center gap-1 transition shadow-2xs cursor-pointer w-full justify-center disabled:opacity-50"
                              title="Approve this single competency"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePushSingleToAudit(row.id)}
                              disabled={saving || loading}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded-md text-[9px] uppercase tracking-tight flex items-center gap-1 transition shadow-2xs cursor-pointer w-full justify-center disabled:opacity-50"
                              title="Push this single competency to Internal Audit"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Push Audit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReturnSingleForRedo(row.id)}
                              disabled={saving || loading}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded-md text-[8.5px] uppercase tracking-tight flex items-center gap-1 transition cursor-pointer w-full justify-center"
                              title="Return this single competency for redo"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              <span>Redo</span>
                            </button>
                          </div>
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
// 3. JSC Internal Auditor Review Section
// ==========================================
export function JSCInternalAuditorReviewSection({ currentUser, activeTenantId, defaultEmployeeEmail }: JSCModuleProps) {
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(defaultEmployeeEmail || '');
  const [subordinates, setSubordinates] = useState<Array<{ email: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (defaultEmployeeEmail) {
      setSelectedUserEmail(defaultEmployeeEmail.toLowerCase().trim());
    }
  }, [defaultEmployeeEmail]);

  useEffect(() => {
    let active = true;
    const fetchTeam = async () => {
      try {
        const [teamRes, usersRes] = await Promise.all([
          fetch(`/api/tenant/${activeTenantId}/team-plans`),
          fetch(`/api/tenant/${activeTenantId}/users`)
        ]);

        const emailMap = new Map<string, string>();

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData)) {
            usersData.forEach((u: any) => {
              const em = (u.email || '').toLowerCase().trim();
              if (em && !em.endsWith('@mzansiflow.co.za') && !em.endsWith('@massivedynamixdistributors.com')) {
                emailMap.set(em, u.fullName || u.full_name || u.name || em);
              }
            });
          }
        }

        if (teamRes.ok) {
          const data = await teamRes.json();
          if (data && Array.isArray(data.teamPlans)) {
            data.teamPlans.forEach((tp: any) => {
              const em = (tp.userId || '').toLowerCase().trim();
              if (em && !em.endsWith('@mzansiflow.co.za') && !em.endsWith('@massivedynamixdistributors.com')) {
                if (!emailMap.has(em) || emailMap.get(em) === em) {
                  emailMap.set(em, tp.plan?.metadata?.name || tp.plan?.metadata?.email || em);
                }
              }
            });
          }
        }

        const list = Array.from(emailMap.entries()).map(([email, name]) => ({ email, name }));
        if (active) {
          setSubordinates(list);

          if (defaultEmployeeEmail) {
            setSelectedUserEmail(defaultEmployeeEmail.toLowerCase().trim());
          } else if (list.length > 0 && !selectedUserEmail) {
            const sub = list.find((s: any) => s.email !== currentUser.email?.toLowerCase().trim()) || list[0];
            if (sub) {
              setSelectedUserEmail(sub.email);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch team for internal auditor review:", err);
      }
    };
    if (activeTenantId) fetchTeam();
    return () => { active = false; };
  }, [activeTenantId, defaultEmployeeEmail, currentUser.email]);

  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      const emailToFetch = selectedUserEmail || defaultEmployeeEmail || currentUser.email || '';
      if (!emailToFetch) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(emailToFetch)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.competencies)) {
            setRows(data.competencies.map(ensureQuarterlyData));
          } else if (data.isCleared) {
            setRows([]);
          } else {
            setRows(DEFAULT_COMPETENCY_ROWS);
          }
        }
      } catch (err) {
        console.warn("Using default competencies for internal auditor review:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, selectedUserEmail, currentUser.email, defaultEmployeeEmail]);

  const handleSaveToDatabase = async (updatedRows: CompetencyRow[]) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(emailToSave)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencies: updatedRows })
      });
    } catch (err) {
      console.error("Error saving auditor review to Supabase:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAuditorSubmit = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    const unrated = rows.some(r => {
      const aScore = r[selectedQuarter]?.internalAuditorScore;
      return !aScore || aScore < 1 || aScore > 5;
    });
    if (unrated) {
      alert(`Please assign an Internal Auditor score between 1 and 5 for all core competency rows for ${selectedQuarter.toUpperCase()}.`);
      return;
    }

    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          status: 'audited' as const
        }
      };
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_audited_${Date.now()}`,
            userEmail: emailToSave,
            recipientEmail: emailToSave,
            recipientName: emailToSave.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'jsc_audit_completed',
            actionType: 'audit',
            title: `Core Competencies Audited by Internal Audit (${selectedQuarter.toUpperCase()})`,
            message: `Internal Auditor (${currentUser.name || currentUser.email}) has completed review on your Core Competencies self score & comments for ${selectedQuarter.toUpperCase()}.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error("Failed notification sending:", e);
    }

    alert(`Successfully submitted Internal Audit review on Core Competencies self scores for ${emailToSave} (${selectedQuarter.toUpperCase()})!`);
  };

  const handleRedoAudit = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    if (!emailToSave) {
      alert("Please select an employee first.");
      return;
    }

    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          internalAuditorScore: 0,
          internalAuditorComments: '',
          status: 'approved' as const
        }
      };
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    alert(`Core competencies for ${selectedQuarter.toUpperCase()} reset to redo achieved / not achieved audit assessment!`);
  };

  const handlePushAuditToManager = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    if (!emailToSave) {
      alert("Please select an employee first.");
      return;
    }

    try {
      const managerEmail = getTargetManagerForUser(emailToSave, currentUser.managerEmail);
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_jsc_audit_to_mgr_${Date.now()}`,
            userEmail: managerEmail,
            recipientEmail: managerEmail,
            recipientName: managerEmail.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'jsc_audit_returned_to_manager',
            actionType: 'audit',
            title: `🛡️ Internal Audit Findings for Subordinate ${emailToSave} (${selectedQuarter.toUpperCase()})`,
            message: `Internal Auditor (${currentUser.name || currentUser.email}) has reviewed Core Competencies for ${emailToSave} (${selectedQuarter.toUpperCase()}) and pushed the findings to Line Manager.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.error(e);
    }

    alert(`Audit findings for ${emailToSave} successfully pushed to Line Manager!`);
  };

  const handleAuditScoreSingle = async (rowId: string, score: number, comment?: string) => {
    const target = rows.find(r => r.id === rowId);
    const updated = rows.map(r => {
      if (r.id === rowId) {
        const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
        return {
          ...r,
          [selectedQuarter]: {
            ...qData,
            internalAuditorScore: score,
            internalAuditorComments: comment || (score >= 4 ? 'Target achieved; verified.' : 'Not achieved; revision needed.'),
            status: 'audited' as const
          }
        };
      }
      return r;
    });

    setRows(updated);
    await handleSaveToDatabase(updated);
    alert(`Competency ${target?.jscNo || ''} marked as ${score >= 4 ? 'Achieved (Score ' + score + ')' : 'Not Achieved (Score ' + score + ')'}!`);
  };

  const handleRedoAuditSingle = async (rowId: string) => {
    const target = rows.find(r => r.id === rowId);
    const updated = rows.map(r => {
      if (r.id === rowId) {
        const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
        return {
          ...r,
          [selectedQuarter]: {
            ...qData,
            internalAuditorScore: 0,
            internalAuditorComments: '',
            status: 'approved' as const
          }
        };
      }
      return r;
    });

    setRows(updated);
    await handleSaveToDatabase(updated);
    alert(`Competency ${target?.jscNo || ''} audit assessment reset for redo!`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fadeIn">
      {/* Top Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Internal Auditor Review on Core Competencies Self Scores</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Employee to Audit:</span>
            {subordinates.length > 0 && (
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value.toLowerCase().trim())}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              >
                {subordinates.map((sub, idx) => (
                  <option key={idx} value={sub.email}>
                    {sub.name ? `${sub.name} (${sub.email})` : sub.email}
                  </option>
                ))}
              </select>
            )}
            <input
              type="email"
              placeholder="Or enter employee email..."
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value.toLowerCase().trim())}
              className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 w-52 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
            {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition duration-150 ${selectedQuarter === q ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={handleRedoAudit}
            disabled={saving || loading}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black px-3.5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-amber-600 disabled:opacity-50"
            title="Redo achieved and not achieved audit assessments"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Redo Achieved & Not Achieved</span>
          </button>

          <button
            onClick={handlePushAuditToManager}
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-blue-700 disabled:opacity-50"
            title="Push audit findings back to Line Manager"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Push to Manager</span>
          </button>

          <button
            onClick={handleAuditorSubmit}
            disabled={saving || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-indigo-700 disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Submit Audit Review</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
            Loading employee core competencies...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider select-none">
                  <th className="px-4 py-3 font-black text-center w-24">JSC Code</th>
                  <th className="px-4 py-3 font-black">Competency Title</th>
                  <th className="px-4 py-3 font-black text-center w-20">Weight (%)</th>
                  <th className="px-4 py-3 font-black w-48">Employee Self Score & Comments</th>
                  <th className="px-4 py-3 font-black text-center w-40">Internal Auditor Score (1-5)</th>
                  <th className="px-4 py-3 font-black">Internal Auditor Review Comments</th>
                  <th className="px-4 py-3 font-black text-center w-24">Status</th>
                  <th className="px-4 py-3 font-black text-center w-44 bg-slate-800 text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-xs text-gray-400 font-semibold italic">
                      No core competencies found for target employee.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => {
                    const qData = row[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };

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
                          {(() => {
                            const qPoeDocs = Array.isArray(qData.poeDocs) ? qData.poeDocs : [];
                            const rowPoeDocs = Array.isArray(row.poeDocs) ? row.poeDocs : [];
                            const seenDocIds = new Set<string>();
                            const combinedPoeDocs: PoeDocument[] = [];
                            [...qPoeDocs, ...rowPoeDocs].forEach(d => {
                              if (d && (d.id || d.name)) {
                                const key = d.id || d.name;
                                if (!seenDocIds.has(key)) {
                                  seenDocIds.add(key);
                                  combinedPoeDocs.push(d);
                                }
                              }
                            });

                            return (
                              <div className="space-y-1.5">
                                {qData.selfScore ? (
                                  <span className="inline-block bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black text-[10px]">
                                    Self Score: {qData.selfScore}/5
                                  </span>
                                ) : (
                                  <span className="inline-block bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold text-[10px] italic">
                                    Score: Pending ({qData.selfScore || 0}/5)
                                  </span>
                                )}
                                {qData.selfComments && (
                                  <p className="text-[10px] text-gray-500 leading-tight italic break-words">
                                    "{qData.selfComments}"
                                  </p>
                                )}
                                {qData.poeText && (
                                  <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[9.5px] mt-1 text-slate-700">
                                    <span className="font-extrabold text-slate-800 block">PoE Note:</span>
                                    {qData.poeText}
                                  </div>
                                )}
                                {combinedPoeDocs.length > 0 ? (
                                  <div className="space-y-1 mt-1">
                                    <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-tight block flex items-center gap-1">
                                      <Paperclip className="w-2.5 h-2.5 text-indigo-600" />
                                      PoE Attachments ({combinedPoeDocs.length}):
                                    </span>
                                    <div className="flex flex-col gap-1 max-h-[90px] overflow-y-auto">
                                      {combinedPoeDocs.map((file) => (
                                        <div key={file.id || file.name} className="flex items-center justify-between gap-1 bg-white border border-indigo-200 rounded p-1 text-[9px] hover:bg-indigo-50 transition duration-75">
                                          <button
                                            type="button"
                                            onClick={() => viewOriginalFile(file.name, file.dataUrl)}
                                            className="font-bold text-slate-800 hover:text-indigo-700 truncate max-w-[120px] flex items-center gap-1 cursor-pointer text-left border-none bg-transparent p-0"
                                            title={`Click to view ${file.name} in a new window`}
                                          >
                                            <FileText className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                          </button>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => viewOriginalFile(file.name, file.dataUrl)}
                                              className="text-indigo-700 hover:text-indigo-900 font-black cursor-pointer text-[8px] bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200"
                                              title="View in browser"
                                            >
                                              View
                                            </button>
                                            <a
                                              href={file.dataUrl}
                                              download={file.name}
                                              className="text-blue-700 hover:text-blue-900 font-black text-[8px] bg-blue-50 px-1 py-0.5 rounded border border-blue-200"
                                              title="Download original file"
                                            >
                                              Down
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[9.5px] text-gray-400 italic block mt-0.5">No PoE attached</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={qData.internalAuditorScore || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
                                  internalAuditorScore: val
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">Select Audit Score</option>
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
                            placeholder="Enter Internal Auditor review comments on self score..."
                            value={qData.internalAuditorComments || ''}
                            onChange={(e) => {
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
                                  internalAuditorComments: e.target.value
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            qData.status === 'audited' || qData.status === 'moderated' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {qData.status === 'moderated' ? 'Moderated' :
                             qData.status === 'audited' ? 'Audited' :
                             'Pending Audit'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="grid grid-cols-2 gap-1 items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleAuditScoreSingle(row.id, 5, 'Target achieved; PoE verified by Internal Audit.')}
                              disabled={saving || loading}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-1.5 py-1 rounded text-[8.5px] uppercase tracking-tight flex items-center justify-center gap-0.5 transition cursor-pointer"
                              title="Mark this single competency as Achieved (5/5)"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>Achieved</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAuditScoreSingle(row.id, 1, 'Not achieved; non-compliant PoE evidence.')}
                              disabled={saving || loading}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-1.5 py-1 rounded text-[8.5px] uppercase tracking-tight flex items-center justify-center gap-0.5 transition cursor-pointer"
                              title="Mark this single competency as Not Achieved (1/5)"
                            >
                              <X className="w-2.5 h-2.5" />
                              <span>Not Ach</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRedoAuditSingle(row.id)}
                              disabled={saving || loading}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-tight flex items-center justify-center gap-0.5 transition cursor-pointer"
                              title="Reset audit rating to redo assessment"
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-amber-600" />
                              <span>Redo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePushAuditToManager()}
                              disabled={saving || loading}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-tight flex items-center justify-center gap-0.5 transition cursor-pointer"
                              title="Push audit findings to Line Manager"
                            >
                              <Send className="w-2.5 h-2.5 text-blue-600" />
                              <span>Push Mgr</span>
                            </button>
                          </div>
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
// 4. JSC DPMC Review Section
// ==========================================
export function JSCDpmcReviewSection({ currentUser, activeTenantId, defaultEmployeeEmail }: JSCModuleProps) {
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(defaultEmployeeEmail || '');
  const [subordinates, setSubordinates] = useState<Array<{ email: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (defaultEmployeeEmail) {
      setSelectedUserEmail(defaultEmployeeEmail.toLowerCase().trim());
    }
  }, [defaultEmployeeEmail]);

  useEffect(() => {
    let active = true;
    const fetchTeam = async () => {
      try {
        const [teamRes, usersRes] = await Promise.all([
          fetch(`/api/tenant/${activeTenantId}/team-plans`),
          fetch(`/api/tenant/${activeTenantId}/users`)
        ]);

        const emailMap = new Map<string, string>();

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData)) {
            usersData.forEach((u: any) => {
              const em = (u.email || '').toLowerCase().trim();
              if (em && !em.endsWith('@mzansiflow.co.za') && !em.endsWith('@massivedynamixdistributors.com')) {
                emailMap.set(em, u.fullName || u.full_name || u.name || em);
              }
            });
          }
        }

        if (teamRes.ok) {
          const data = await teamRes.json();
          if (data && Array.isArray(data.teamPlans)) {
            data.teamPlans.forEach((tp: any) => {
              const em = (tp.userId || '').toLowerCase().trim();
              if (em && !em.endsWith('@mzansiflow.co.za') && !em.endsWith('@massivedynamixdistributors.com')) {
                if (!emailMap.has(em) || emailMap.get(em) === em) {
                  emailMap.set(em, tp.plan?.metadata?.name || tp.plan?.metadata?.email || em);
                }
              }
            });
          }
        }

        const list = Array.from(emailMap.entries()).map(([email, name]) => ({ email, name }));
        if (active) {
          setSubordinates(list);

          if (defaultEmployeeEmail) {
            setSelectedUserEmail(defaultEmployeeEmail.toLowerCase().trim());
          } else if (list.length > 0 && !selectedUserEmail) {
            const sub = list.find((s: any) => s.email !== currentUser.email?.toLowerCase().trim()) || list[0];
            if (sub) {
              setSelectedUserEmail(sub.email);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch team for DPMC review:", err);
      }
    };
    if (activeTenantId) fetchTeam();
    return () => { active = false; };
  }, [activeTenantId, defaultEmployeeEmail, currentUser.email]);

  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      const emailToFetch = selectedUserEmail || defaultEmployeeEmail || currentUser.email || '';
      if (!emailToFetch) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(emailToFetch)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.competencies)) {
            setRows(data.competencies.map(ensureQuarterlyData));
          } else if (data.isCleared) {
            setRows([]);
          } else {
            setRows(DEFAULT_COMPETENCY_ROWS);
          }
        }
      } catch (err) {
        console.warn("Using default competencies for DPMC review:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, selectedUserEmail, currentUser.email, defaultEmployeeEmail]);

  const handleSaveToDatabase = async (updatedRows: CompetencyRow[]) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(emailToSave)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencies: updatedRows })
      });
    } catch (err) {
      console.error("Error saving DPMC review to Supabase:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDpmcSubmit = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    const unrated = rows.some(r => {
      const dScore = r[selectedQuarter]?.dpmcScore;
      return !dScore || dScore < 1 || dScore > 5;
    });
    if (unrated) {
      alert(`Please assign a DPMC score between 1 and 5 for all core competency rows for ${selectedQuarter.toUpperCase()}.`);
      return;
    }

    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          status: 'moderated' as const
        }
      };
    });

    setRows(updated);
    await handleSaveToDatabase(updated);

    const dpmcRecipients = [
      { email: emailToSave, name: emailToSave.split('@')[0], role: 'Self Evaluator' },
      { email: 'manager@domain.com', name: 'Line Manager', role: 'Manager' },
      { email: 'internal_audit', name: 'Internal Audit Committee', role: 'Internal Audit' }
    ];

    try {
      await Promise.all(dpmcRecipients.map(r => 
        fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              id: `notif_jsc_dpmc_${r.role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
              userEmail: r.email,
              recipientEmail: r.email,
              recipientName: r.name,
              senderEmail: currentUser.email,
              senderName: currentUser.name || currentUser.email,
              type: 'jsc_dpmc_completed',
              actionType: 'moderation',
              title: `🎯 Job Specific Competency (JSC) Moderated by DPMC (${selectedQuarter.toUpperCase()})`,
              message: `Department Performance Moderation Committee (DPMC) has finalized moderation review & scoring of JSCs for ${emailToSave} (${selectedQuarter.toUpperCase()}). Self Evaluator, Line Manager, and Internal Audit have been notified.`,
              read: false,
              createdAt: new Date().toISOString()
            }
          })
        })
      ));
    } catch (e) {
      console.error("Failed notification sending:", e);
    }

    alert(`Successfully submitted DPMC Committee Moderation on JSCs for ${emailToSave} (${selectedQuarter.toUpperCase()})! All parties (Self Evaluator, Manager, Internal Audit) notified.`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fadeIn">
      {/* Top Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">DPMC Committee Moderation Review of Internal Auditor Scores</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Employee to Moderate:</span>
            {subordinates.length > 0 && (
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value.toLowerCase().trim())}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
              >
                {subordinates.map((sub, idx) => (
                  <option key={idx} value={sub.email}>
                    {sub.name ? `${sub.name} (${sub.email})` : sub.email}
                  </option>
                ))}
              </select>
            )}
            <input
              type="email"
              placeholder="Or enter employee email..."
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value.toLowerCase().trim())}
              className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-purple-500 w-52 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
            {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition duration-150 ${selectedQuarter === q ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={handleDpmcSubmit}
            disabled={saving || loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition uppercase tracking-wide cursor-pointer shadow-sm border border-purple-700 disabled:opacity-50"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Submit DPMC Moderation</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
            Loading employee core competencies...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider select-none">
                  <th className="px-4 py-3 font-black text-center w-24">JSC Code</th>
                  <th className="px-4 py-3 font-black">Competency Title</th>
                  <th className="px-4 py-3 font-black text-center w-20">Weight (%)</th>
                  <th className="px-4 py-3 font-black w-48">Employee Self Score & Comments</th>
                  <th className="px-4 py-3 font-black w-48">Internal Auditor Review (Score & Comments)</th>
                  <th className="px-4 py-3 font-black text-center w-40">DPMC Score (1-5)</th>
                  <th className="px-4 py-3 font-black">DPMC Comments & Resolution</th>
                  <th className="px-4 py-3 font-black text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-xs text-gray-400 font-semibold italic">
                      No core competencies found for target employee.
                    </td>
                  </tr>
                ) : (
                  rows.map(row => {
                    const qData = row[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };

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
                            <div className="space-y-1.5">
                              <span className="inline-block bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black text-[10px]">
                                Self: {qData.selfScore}/5
                              </span>
                              <p className="text-[10px] text-gray-500 leading-tight italic break-words">
                                "{qData.selfComments || 'No self comment'}"
                              </p>
                              {qData.poeText && (
                                <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[9.5px] mt-1 text-slate-700">
                                  <span className="font-extrabold text-slate-800 block">PoE Note:</span>
                                  {qData.poeText}
                                </div>
                              )}
                              {qData.poeDocs && qData.poeDocs.length > 0 && (
                                <div className="space-y-1 mt-1">
                                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-tight block">PoE Files:</span>
                                  <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                                    {qData.poeDocs.map((file) => (
                                      <div key={file.id} className="flex items-center justify-between gap-1 bg-white border border-slate-200 rounded p-1 text-[9px] hover:bg-slate-50 transition duration-75">
                                        <button
                                          type="button"
                                          onClick={() => viewOriginalFile(file.name, file.dataUrl)}
                                          className="font-bold text-slate-800 hover:text-indigo-600 truncate max-w-[120px] flex items-center gap-1 cursor-pointer text-left border-none bg-transparent p-0"
                                          title={`Click to view ${file.name} in a new window`}
                                        >
                                          <FileText className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                          <span className="truncate">{file.name}</span>
                                        </button>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => viewOriginalFile(file.name, file.dataUrl)}
                                            className="text-indigo-600 hover:text-indigo-800 font-black cursor-pointer text-[8px] bg-indigo-50 px-1 py-0.2 rounded border-none"
                                            title="View in browser"
                                          >
                                            View
                                          </button>
                                          <a
                                            href={file.dataUrl}
                                            download={file.name}
                                            className="text-emerald-600 hover:text-emerald-800 font-black text-[8px] bg-emerald-50 px-1 py-0.2 rounded"
                                            title="Download original file"
                                          >
                                            Down
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic font-medium text-[10px]">Not evaluated</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {qData.internalAuditorScore ? (
                            <div className="space-y-0.5">
                              <span className="inline-block bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-black text-[10px]">
                                Auditor: {qData.internalAuditorScore}/5
                              </span>
                              <p className="text-[10px] text-indigo-800 leading-tight italic break-words">
                                "{qData.internalAuditorComments || 'Audited'}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic font-medium text-[10px]">Audit pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={qData.dpmcScore || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
                                  dpmcScore: val
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:border-purple-500"
                          >
                            <option value="">Select DPMC Score</option>
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
                            placeholder="Enter DPMC moderation comments on auditor review..."
                            value={qData.dpmcComments || ''}
                            onChange={(e) => {
                              const updated = rows.map(r => r.id === row.id ? {
                                ...r,
                                [selectedQuarter]: {
                                  ...(r[selectedQuarter] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' }),
                                  dpmcComments: e.target.value
                                }
                              } : r);
                              setRows(updated);
                              handleSaveToDatabase(updated);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            qData.status === 'moderated' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {qData.status === 'moderated' ? 'Moderated' :
                             'Pending DPMC'}
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
// 5. All-in-One Core Competencies Table
// ==========================================
export function JSCAllInOneCompetenciesTable({ currentUser, activeTenantId }: JSCModuleProps) {
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4' | 'all'>('q1');
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
          if (Array.isArray(data.competencies)) {
            setRows(data.competencies.map(ensureQuarterlyData));
          } else if (data.isCleared) {
            setRows([]);
          }
        }
      } catch (err) {
        console.warn("Using default competencies for all-in-one table:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (userEmail) fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, userEmail]);

  const quartersList: ('q1' | 'q2' | 'q3' | 'q4')[] = selectedQuarter === 'all' ? ['q1', 'q2', 'q3', 'q4'] : [selectedQuarter];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col space-y-4 p-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            Core Competencies 3-Tier Quarterly Evaluation & Review Grid
          </h3>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
            Complete transparent view of Self Score/Comments, Internal Auditor Review, and DPMC Moderation per quarter.
          </p>
        </div>

        <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
          {(['q1', 'q2', 'q3', 'q4', 'all'] as const).map(q => (
            <button
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition duration-150 ${selectedQuarter === q ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {q === 'all' ? 'All Quarters' : q}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          Loading Core Competencies Grid...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider select-none">
                <th className="px-3 py-2.5 font-black text-center w-20">Code</th>
                <th className="px-3 py-2.5 font-black">Competency Title</th>
                <th className="px-3 py-2.5 font-black text-center w-16">Weight</th>
                <th className="px-3 py-2.5 font-black text-center w-16">Quarter</th>
                <th className="px-3 py-2.5 font-black w-48">1. Self Score & Comments</th>
                <th className="px-3 py-2.5 font-black w-48">2. Internal Auditor Review</th>
                <th className="px-3 py-2.5 font-black w-48">3. DPMC Review</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-gray-400 font-semibold italic">
                    No core competencies defined.
                  </td>
                </tr>
              ) : (
                rows.flatMap(row => 
                  quartersList.map(qKey => {
                    const qData = row[qKey] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', internalAuditorScore: 0, internalAuditorComments: '', dpmcScore: 0, dpmcComments: '', status: 'draft' };

                    return (
                      <tr key={`${row.id}-${qKey}`} className="border-b border-gray-150 hover:bg-gray-50 transition duration-100">
                        <td className="px-3 py-2 text-center font-bold font-mono text-slate-800 text-[10px]">
                          {row.jscNo || 'N/A'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800 text-xs">
                          {row.competency}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-gray-500 text-[10px]">
                          {row.weight}%
                        </td>
                        <td className="px-3 py-2 text-center font-black uppercase text-indigo-700 text-[10px]">
                          {qKey}
                        </td>
                        <td className="px-3 py-2">
                          {qData.selfScore ? (
                            <div className="bg-blue-50 border border-blue-200 rounded p-1.5 text-[9.5px]">
                              <span className="font-extrabold text-blue-900 block">Self: {qData.selfScore}/5</span>
                              <p className="text-blue-800 italic truncate" title={qData.selfComments}>"{qData.selfComments || 'No comment'}"</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[9.5px] italic">Not rated</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {qData.internalAuditorScore ? (
                            <div className="bg-indigo-50 border border-indigo-200 rounded p-1.5 text-[9.5px]">
                              <span className="font-extrabold text-indigo-900 block">Audit Score: {qData.internalAuditorScore}/5</span>
                              <p className="text-indigo-800 italic truncate" title={qData.internalAuditorComments}>"{qData.internalAuditorComments || 'Audited'}"</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[9.5px] italic">Audit pending</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {qData.dpmcScore ? (
                            <div className="bg-purple-50 border border-purple-200 rounded p-1.5 text-[9.5px]">
                              <span className="font-extrabold text-purple-900 block">DPMC Score: {qData.dpmcScore}/5</span>
                              <p className="text-purple-800 italic truncate" title={qData.dpmcComments}>"{qData.dpmcComments || 'Moderated'}"</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[9.5px] italic">DPMC pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. JSC Analytical Reporting Section
// ==========================================
export function JSCAnalyticalReportingSection({ currentUser, activeTenantId, isTeamJSC, isTeamJSC2 }: JSCModuleProps) {
  const apiEndpoint = isTeamJSC2 ? 'team-job-competencies-2' : isTeamJSC ? 'team-job-competencies' : 'job-competencies';
  const [rows, setRows] = useState<CompetencyRow[]>(DEFAULT_COMPETENCY_ROWS);
  const [loading, setLoading] = useState<boolean>(true);
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          if (Array.isArray(data.competencies)) {
            setRows(data.competencies.map(ensureQuarterlyData));
          } else if (data.isCleared) {
            setRows([]);
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
  }, [activeTenantId, userEmail, apiEndpoint]);

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
