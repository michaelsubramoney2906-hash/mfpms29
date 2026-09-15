import React, { useState, useEffect, useRef } from 'react';
import { 
  JSCSelfEvaluationSection, 
  JSCManagerApprovalSection, 
  JSCAnalyticalReportingSection 
} from './JSCModules';
import { 
  FileBadge, Shield, Info, BookOpen, Clock, CheckCircle, Plus, Trash2, 
  Edit2, Check, ArrowRight, Save, Layout, HelpCircle, FileText, 
  ChevronRight, BarChart2, TrendingUp, Calculator, Settings, Keyboard,
  ArrowUp, ArrowDown, Sparkles, RefreshCw, AlertTriangle
} from 'lucide-react';
import { diagnosePillarDiscrepancy } from '../../utils/diagnosticLogger';

interface JobSpecificCompetenciesProps {
  currentUser: {
    email: string;
    role: string;
    name?: string;
  };
  activeTenantId: string;
}

// Master Schema Interfaces
interface JSCMaster {
  id: string;
  code: string;
  description: string;
}

interface CompetencyMaster {
  id: string;
  name: string;
  category: string;
}

interface JscSubsection {
  heading: string;
  paragraphs: string[];
}

interface DefinitionMaster {
  id: string;
  title: string;
  mainText: string;
  subsections: JscSubsection[];
}

interface LevelMaster {
  id: string;
  name: string;
  description: string;
}

interface WeightMaster {
  id: string;
  value: number;
}

interface CompetencyQuarterData {
  selfScore: number;            // 1-5 or 0 (unrated)
  selfComments: string;         // Self comments
  managerScore: number;         // 1-5 or 0 (unrated)
  managerMotivation: string;    // Manager motivation
  status: 'draft' | 'pending_approval' | 'approved';
}

// Table Row Schema
interface CompetencyRow {
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


const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getIsDualLayerTeamLeader(email) {
  if (!email) return false;
  return DUAL_LAYER_USERS.includes(email.toLowerCase().trim());
}

export function JobSpecificCompetencies({ currentUser, activeTenantId }: JobSpecificCompetenciesProps) {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'legislation' | 'templates' | 'self_evaluation' | 'manager_approval' | 'reporting'>('templates');

  // Database / API Loading Sync states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'cached' | 'saved' | 'saving' | 'error'>('cached');

  // Active Highlight State for Table Cells
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<'jscNo' | 'competency' | 'definition' | 'level' | 'weight' | null>(null);

  // 1. Left Side Master Registries State
  const [jscMasters, setJscMasters] = useState<JSCMaster[]>([
    { id: 'jsc-1', code: 'JSC-101', description: 'Financial Soundness' },
    { id: 'jsc-2', code: 'JSC-102', description: 'Spatial Strategic Alignment' },
    { id: 'jsc-3', code: 'JSC-103', description: 'Technical Infrastructure Planning' },
    { id: 'jsc-4', code: 'JSC-104', description: 'Supply Chain Management Ethics' }
  ]);
  const [newJscCode, setNewJscCode] = useState('');
  const [newJscDesc, setNewJscDesc] = useState('');
  const [editingJscId, setEditingJscId] = useState<string | null>(null);

  const [competencyMasters, setCompetencyMasters] = useState<CompetencyMaster[]>([
    { id: 'comp-1', name: 'Strategic Financial Policy Formulation', category: 'Financial' },
    { id: 'comp-2', name: 'SDF Integration Mapping', category: 'Technical' },
    { id: 'comp-3', name: 'Water Backlog Engineering Controls', category: 'Operational' },
    { id: 'comp-4', name: 'Auditing Compliance Control Matrix', category: 'Governance' }
  ]);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCat, setNewCompCat] = useState('Technical');
  const [editingCompId, setEditingCompId] = useState<string | null>(null);

  // Definition Builder State (With Subheadings and Subparagraphs)
  const [definitionMasters, setDefinitionMasters] = useState<DefinitionMaster[]>([
    {
      id: 'def-1',
      title: 'Strategic Finance Compliance Standard',
      mainText: 'Designs and evaluates municipal finance systems in direct compliance to Section 57 of the MFMA.',
      subsections: [
        { heading: 'Key Knowledge Core', paragraphs: ['Advanced municipal budgeting standards', 'GRAP-17 accounting standards compliance frameworks'] },
        { heading: 'Operational Standards', paragraphs: ['Drafting audit response recovery charts within 14 days of Auditor-General queries.'] }
      ]
    },
    {
      id: 'def-2',
      title: 'SDF Technical Spatial Integration Standard',
      mainText: 'Provides core administrative framework oversight for spatial integration projects matching National DPSA directives.',
      subsections: [
        { heading: 'Key Technical Focus', paragraphs: ['GIS spatial mapping overlay validation', 'Integration indexing for SDBIP operations.'] }
      ]
    }
  ]);
  const [defTitle, setDefTitle] = useState('');
  const [defMainText, setDefMainText] = useState('');
  const [defSubsections, setDefSubsections] = useState<JscSubsection[]>([
    { heading: '', paragraphs: [''] }
  ]);
  const [editingDefId, setEditingDefId] = useState<string | null>(null);

  const [levelMasters, setLevelMasters] = useState<LevelMaster[]>([
    { id: 'lvl-1', name: 'Level 1: Basic Awareness', description: 'Requires close operational guidance and baseline administrative monitoring and supervision' },
    { id: 'lvl-2', name: 'Level 2: Competent Operator', description: 'Performs standard routine operational duties under moderate strategic guidance' },
    { id: 'lvl-3', name: 'Level 3: Advanced Architect', description: 'Formulates policies, designs internal templates, and audits frameworks independently' },
    { id: 'lvl-4', name: 'Level 4: Superior Leader', description: 'Sets high sectoral standards, holds ultimate accountability, and drives major changes' }
  ]);
  const [newLvlName, setNewLvlName] = useState('');
  const [newLvlDesc, setNewLvlDesc] = useState('');
  const [editingLvlId, setEditingLvlId] = useState<string | null>(null);

  const [weightMasters, setWeightMasters] = useState<WeightMaster[]>([
    { id: 'w-1', value: 10 },
    { id: 'w-2', value: 15 },
    { id: 'w-3', value: 20 },
    { id: 'w-4', value: 25 },
    { id: 'w-5', value: 30 }
  ]);
  const [newWeightVal, setNewWeightVal] = useState<number>(20);
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);

  // 2. Main Live Grid Columns & Rows State
  const [rows, setRows] = useState<CompetencyRow[]>([
    {
      id: 'row-1',
      jscNo: 'JSC-101',
      competency: 'Strategic Financial Policy Formulation',
      definition: {
        mainText: 'Designs and evaluates municipal finance systems in direct compliance to Section 57 of the MFMA.',
        subsections: [
          { heading: 'Key Knowledge Core', paragraphs: ['Advanced municipal budgeting standards', 'GRAP-17 accounting standards compliance frameworks'] }
        ]
      },
      level: 'Level 3: Advanced Architect',
      weight: 30,
      q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }
    },
    {
      id: 'row-2',
      jscNo: 'JSC-103',
      competency: 'Water Backlog Engineering Controls',
      definition: {
        mainText: 'Standard pipeline commissioning process with high capacity filter operations alignment.',
        subsections: [
          { heading: 'Regulatory Codes', paragraphs: ['SANS standards for sanitations and water delivery indices.'] }
        ]
      },
      level: 'Level 2: Competent Operator',
      weight: 40,
      q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }
    },
    {
      id: 'row-3',
      jscNo: 'JSC-104',
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
  ]);

  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [selectedUserEmailState, setSelectedUserEmailState] = useState<string>('');
  
  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');

  const userTargetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;
  const selectedUserEmail = selectedUserEmailState || userTargetEmail;
  


  useEffect(() => {
    if (currentUser.email) {
      setSelectedUserEmailState(currentUser.email);
    }
  }, [currentUser.email]);

  // Helper to ensure quarterly data structures are not null or undefined
  const ensureQuarterlyData = (row: CompetencyRow): CompetencyRow => {
    return {
      ...row,
      q1: row.q1 || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q2: row.q2 || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q3: row.q3 || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q4: row.q4 || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }
    };
  };

  const sendIpmsNotification = async (notifPayload: any) => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification: notifPayload })
      });
    } catch (e) {
      console.error("Failed to post IPMS notification:", e);
    }
  };

  // Load from Supabase on mount/tenant changes
  useEffect(() => {
    let active = true;
    const fetchCompetencies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(selectedUserEmail)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }
        const data = await res.json();
        if (active && data) {
          let loadedJscsList: any[] = [];
          if (Array.isArray(data.competencies)) {
            loadedJscsList = data.competencies;
            setRows(data.competencies.map(ensureQuarterlyData));
          }
          if (Array.isArray(data.jscMasters)) {
            setJscMasters(data.jscMasters);
          }
          if (Array.isArray(data.competencyMasters)) {
            setCompetencyMasters(data.competencyMasters);
          }
          if (Array.isArray(data.definitionMasters)) {
            setDefinitionMasters(data.definitionMasters);
          }
          if (Array.isArray(data.levelMasters)) {
            setLevelMasters(data.levelMasters);
          }
          if (Array.isArray(data.weightMasters)) {
            setWeightMasters(data.weightMasters);
          }

          diagnosePillarDiscrepancy('JSCs', loadedJscsList, loadedJscsList.length, {
            userEmail: selectedUserEmail,
            tenantId: activeTenantId,
            caller: 'JobSpecificCompetencies.tsx'
          });
        }
      } catch (err) {
        console.warn("Could not find previous competencies or table failed to load, keeping system defaults:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCompetencies();
    return () => { active = false; };
  }, [activeTenantId, selectedUserEmail]);

  // Save changes to Supabase
  const handleSaveToDatabase = async (
    currentRowsList = rows,
    cmJsc = jscMasters,
    cmComp = competencyMasters,
    cmDef = definitionMasters,
    cmLvl = levelMasters,
    cmWt = weightMasters,
    explicitTargetEmail?: string
  ) => {
    try {
      setSyncStatus('saving');
      setSaving(true);
      
      const payload = { 
        competencies: currentRowsList,
        jscMasters: cmJsc,
        competencyMasters: cmComp,
        definitionMasters: cmDef,
        levelMasters: cmLvl,
        weightMasters: cmWt
      };
      
      const emailToSave = explicitTargetEmail || selectedUserEmail;
      const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(emailToSave)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Unsuccessful status response save");
      setSyncStatus('saved');
    } catch (err: any) {
      console.error("Error saving competencies to Supabase database:", err);
      setSyncStatus('error');
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

    const summaryMsg = rows.map(r => {
      const score = r[selectedQuarter]?.selfScore || 0;
      const comment = r[selectedQuarter]?.selfComments || 'No comment';
      return `[${r.jscNo}] Score: ${score}/5 | Comment: ${comment}`;
    }).join('\n');

    await sendIpmsNotification({
      senderEmail: currentUser.email,
      senderName: currentUser.name || currentUser.email,
      recipientEmail: 'managers',
      recipientName: 'Line Manager',
      title: `JSC Evaluation Pushed - ${selectedQuarter.toUpperCase()}`,
      message: `Employee ${currentUser.name || currentUser.email} has pushed self-evaluation scores for ${selectedQuarter.toUpperCase()} for manager's approval:\n\n${summaryMsg}`,
      actionType: 'submission',
      quarter: selectedQuarter.toUpperCase(),
      kpiNo: 'JSC'
    });

    alert(`Self-evaluation for ${selectedQuarter.toUpperCase()} successfully pushed to manager! Notification sent.`);
  };

  const handleManagerApprove = async () => {
    const incomplete = rows.some(r => {
      const score = r[selectedQuarter]?.managerScore;
      return !score || score < 1 || score > 5;
    });
    if (incomplete) {
      alert(`Please ensure all competencies have a manager score between 1 and 5 and appropriate motivation before submitting approval for ${selectedQuarter.toUpperCase()}.`);
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

    // Send individual notifications as requested by user
    for (const r of rows) {
      const qData = r[selectedQuarter];
      const mScore = qData?.managerScore || 0;
      const mMotivation = qData?.managerMotivation || '';
      
      await sendIpmsNotification({
        senderEmail: currentUser.email,
        senderName: currentUser.name || currentUser.email,
        recipientEmail: selectedUserEmail,
        recipientName: selectedUserEmail,
        title: `JSC Approved - ${r.jscNo} (${selectedQuarter.toUpperCase()})`,
        message: `Manager approved ${r.jscNo}. Manager Score: ${mScore}/5. Motivation: ${mMotivation}`,
        actionType: 'approval',
        quarter: selectedQuarter.toUpperCase(),
        kpiNo: r.jscNo
      });
    }

    alert(`Manager review for ${selectedQuarter.toUpperCase()} submitted successfully! Individual JSC notifications sent to the officer.`);
  };

  // Live Auto Weight Calculator Total
  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  // Smart mathematical calculator distribution behaviors
  const handleDistributeEvenly = () => {
    if (rows.length === 0) return;
    const baseWeight = Math.floor(100 / rows.length);
    const remainder = 100 % rows.length;

    const updated = rows.map((r, i) => ({
      ...r,
      weight: baseWeight + (i < remainder ? 1 : 0)
    }));
    setRows(updated);
    handleSaveToDatabase(updated);
  };

  const handleScaleTo100 = () => {
    if (rows.length === 0) return;
    if (totalWeight === 0) {
      handleDistributeEvenly();
      return;
    }
    const ratio = 100 / totalWeight;
    let distributedSum = 0;
    const updated = rows.map((r, i) => {
      if (i === rows.length - 1) {
        return { ...r, weight: Math.max(0, 100 - distributedSum) };
      }
      const proportional = Math.round(r.weight * ratio);
      distributedSum += proportional;
      return { ...r, weight: proportional };
    });
    setRows(updated);
    handleSaveToDatabase(updated);
  };

  const handleExportToWord = () => {
    // 1. Metadata and KPIs
    const pmsCompetenciesCount = rows.length;
    const totalAllocatedComposition = totalWeight;
    const targetCapabilityText = "Level 3: Advanced Architect";

    // 2. Relative Weighting Matrix helper
    const weightMatrixBody = rows.map((r, i) => {
      const pct = r.weight || 0;
      const barFilled = Math.min(100, Math.round((pct / (totalAllocatedComposition || 100)) * 100));
      return `<tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; font-weight: bold; background: #fafafa;">${r.jscNo || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11px;">${r.competency || ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; text-align: right; font-weight: bold;">${pct}%</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11px;">
          <div style="background: #e2e8f0; border-radius: 4px; overflow: hidden; width: 120px;">
            <div style="background: #4f46e5; height: 10px; width: ${barFilled}%;"></div>
          </div>
        </td>
      </tr>`;
    }).join('');

    // 3. Master Annexure Directory helper
    const directoryBody = rows.map((r, i) => {
      const defText = r.definition?.mainText || 'No custom baseline statement recorded.';
      const subsMarkup = (r.definition?.subsections || []).map(s => {
        const paras = (s.paragraphs || []).map(p => `<li>${p}</li>`).join('');
        return `<div style="margin-top: 6px; padding-left: 10px; border-left: 2px solid #f97316;">
          <strong style="font-size: 10px; color: #b45309; text-transform: uppercase;">${s.heading || ''}</strong>
          <ul style="margin: 3px 0; padding-left: 15px; font-size: 10px; color: #475569;">${paras}</ul>
        </div>`;
      }).join('');

      return `<div style="margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 11px;"><strong>[${r.jscNo || ''}] ${r.competency || ''}</strong> <span style="font-style: italic; color: #64748b;">(${r.level || ''})</span></p>
        <p style="margin: 5px 0 0 0; font-size: 11px; color: #334155;">${defText}</p>
        ${subsMarkup}
      </div>`;
    }).join('');

    // 4. Job Specific Competencies Formal Ledger table body
    const ledgerTableBody = rows.map(r => {
      return `<tr>
        <td style="border: 1px solid #94a3b8; padding: 10px; font-size: 11px; font-weight: bold;">${r.jscNo || ''}</td>
        <td style="border: 1px solid #94a3b8; padding: 10px; font-size: 11px;">${r.competency || ''}</td>
        <td style="border: 1px solid #94a3b8; padding: 10px; font-size: 11px; font-style: italic;">${r.level || ''}</td>
        <td style="border: 1px solid #94a3b8; padding: 10px; font-size: 11px; text-align: right; font-weight: bold;">${r.weight || 0}%</td>
      </tr>`;
    }).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>SDBIP Job Specific Competency Analytical Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 40px; }
          h1 { color: #0f171d; border-bottom: 3px solid #4f46e5; padding-bottom: 8px; font-size: 24px; font-weight: bold; text-transform: uppercase; }
          h2 { color: #0f172a; margin-top: 30px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-size: 11px; font-weight: bold; border: 1px solid #0f172a; text-transform: uppercase; }
          td { border: 1px solid #cbd5e1; padding: 10px; font-size: 11px; vertical-align: top; }
          .summary-card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .footer { margin-top: 50px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          .kpi-container { display: table; width: 100%; margin-bottom: 20px; }
          .kpi-card { display: table-cell; width: 33%; background: #f1f5f9; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Consolidated SDBIP / IPMS Analytical Compliance Report</h1>
        <div class="summary-card">
          <p style="margin:2px 0;"><strong>Workspace Tenant ID:</strong> ${activeTenantId || 'Global'}</p>
          <p style="margin:2px 0;"><strong>Report Compiler Authority:</strong> ${currentUser?.email || 'System User'} (${currentUser?.role || 'Administrator'})</p>
          <p style="margin:2px 0;"><strong>Report Compilation Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="margin:2px 0;"><strong>Compliance Evaluation Status:</strong> <span style="color:${totalAllocatedComposition === 100 ? '#059669' : '#d97706'}; font-weight:bold;">${totalAllocatedComposition === 100 ? 'COMPLIANT (100% Correct Balance)' : 'ACTION REQUIRED (Unbalanced Weighting)'}</span></p>
        </div>

        <h2>I. PMS Competencies Defined (Key Summary)</h2>
        <div class="kpi-container">
          <div class="kpi-card">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b;">PMS Competencies Defined</span>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${pmsCompetenciesCount} Roles Registered</p>
          </div>
          <div class="kpi-card" style="border-left:none; border-right:none;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b;">Total Evaluated Composition</span>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0; color: ${totalAllocatedComposition === 100 ? '#059669' : '#ef4444'};">${totalAllocatedComposition}%</p>
          </div>
          <div class="kpi-card">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b;">Target Capability Level</span>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${targetCapabilityText}</p>
          </div>
        </div>

        <h2>II. Relative Weighting Composition Matrix (%)</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">JSC Code</th>
              <th style="width: 45%;">Competency Title</th>
              <th style="width: 15%;">Weighting</th>
              <th style="width: 25%;">Relative Scale Composition</th>
            </tr>
          </thead>
          <tbody>
            ${weightMatrixBody}
          </tbody>
        </table>

        <h2>III. Master Annexure Definition Directory</h2>
        <div style="background: #ffffff; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
          ${directoryBody || '<p style="font-size:11px; color:#64748b;">No competency data available.</p>'}
        </div>

        <h2>IV. Job Specific Competencies (Annexure B Formal Ledger)</h2>
        <table>
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="width: 15%;">JSC Code</th>
              <th style="width: 45%;">Competency Title</th>
              <th style="width: 25%;">Target Capability Level</th>
              <th style="width: 15%; text-align: right;">Weighting (%)</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerTableBody}
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="3" style="text-align: right; border: 1px solid #94a3b8; padding: 10px;">ACCUMULATED SUM TOTAL:</td>
              <td style="border: 1px solid #94a3b8; padding: 10px; text-align: right; color: ${totalAllocatedComposition === 100 ? '#10b981' : '#ef4444'}; font-weight: bold;">${totalAllocatedComposition}%</td>
            </tr>
          </tbody>
        </table>

        <h2>V. Quarterly Self-Evaluation & Manager Approval Ledgers</h2>
        <div style="background: #ffffff; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
          ${(() => {
            return ['q1', 'q2', 'q3', 'q4'].map(q => {
              const qUpper = q.toUpperCase();
              const status = rows[0]?.[q as 'q1'|'q2'|'q3'|'q4']?.status || 'draft';
              const rowsMarkup = rows.map(r => {
                const qData = r[q as 'q1'|'q2'|'q3'|'q4'] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' };
                return `<tr>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 10px; font-weight: bold; background: #fafafa;">${r.jscNo || ''}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 10px; font-weight: bold;">${r.competency || ''}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-align: center;">${qData.selfScore || '-'}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 10px; font-style: italic; color: #475569;">${qData.selfComments || '-'}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-align: center; font-weight: bold; background: #f0fdf4;">${qData.managerScore || '-'}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 10px; font-style: italic; color: #15803d; background: #f0fdf4;">${qData.managerMotivation || '-'}</td>
                </tr>`;
              }).join('');

              return `
                <h3 style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-top: 15px; margin-bottom: 5px;">${qUpper} Performance Evaluation Ledger (Status: ${status.toUpperCase()})</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                  <thead>
                    <tr style="background-color: #1e293b; color: #ffffff;">
                      <th style="width: 15%; font-size: 9px; padding: 6px;">JSC Code</th>
                      <th style="width: 25%; font-size: 9px; padding: 6px;">Competency</th>
                      <th style="width: 10%; font-size: 9px; padding: 6px; text-align: center;">Self Score</th>
                      <th style="width: 20%; font-size: 9px; padding: 6px;">Self Comments</th>
                      <th style="width: 10%; font-size: 9px; padding: 6px; text-align: center;">Mgr Score</th>
                      <th style="width: 20%; font-size: 9px; padding: 6px;">Mgr Motivation</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsMarkup}
                  </tbody>
                </table>
              `;
            }).join('');
          })()}
        </div>

        <!-- empty signature blocks in MS Word output footer -->
        <div style="margin-top: 40px; border-top: 2px solid #cbd5e1; padding-top: 20px;">
          <h3 style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #1e3a8a; margin-bottom: 15px; margin-top: 0;">Formal Declaration &amp; Sign-off</h3>
          <table style="width: 100%; border: none; font-size: 9px; font-family: 'Segoe UI', Arial, sans-serif;">
            <tr style="border: none;">
              <td style="border: none; width: 45%; vertical-align: top; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Officer / Employee Representative</strong>
                <div style="margin-bottom: 4px;"><strong>Name &amp; Surname:</strong> ${currentUser.name || currentUser.email || 'Representative'}</div>
                <div style="margin-bottom: 4px;"><strong>Role/Designation:</strong> ${currentUser.role || 'Officer Representative'}</div>
                <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
                <div><strong>Signature:</strong> ____________________________________</div>
                <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
              </td>
              <td style="border: none; width: 10%;"></td>
              <td style="border: none; width: 45%; vertical-align: top; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Supervisor / manager approval</strong>
                <div style="margin-bottom: 4px;"><strong>Name:</strong> Line Manager / Approved Supervisor</div>
                <div style="margin-bottom: 4px;"><strong>Role:</strong> Municipal Representative</div>
                <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
                <div><strong>Signature:</strong> ____________________________________</div>
                <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 30px; font-size: 11px; color: #475569; background: #fafafa; border: 1px dashed #cbd5e1; padding: 12px; border-radius: 6px;">
          <strong>Compliance Notes:</strong> This report verifies legislative compliance structured under Gazette No. 37731 municipal systems frameworks for Job Specific Technical Competencies.
        </div>

        <div class="footer">
          <p>South African National Local Government Competency Directory Alignment checked on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JSC_Statutory_Analytical_Report_${activeTenantId || 'Global'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportToExcel = () => {
    const csvLines = [
      'SDBIP & IPMS STATUTORY PERFORMANCE AUDIT REPORT',
      `Workspace Tenant ID,${activeTenantId || 'Global'}`,
      `Report Compiler Email,${currentUser?.email || 'System User'}`,
      `Compilation Date,${new Date().toLocaleDateString()}`,
      `Compliance Balance Status,${totalWeight === 100 ? 'FULLY COMPLIANT' : 'CORRECTION REQUIRED'}`,
      '',
      '=== SECTION 1: REPORT KPI INDICATORS ===',
      `PMS Competencies Defined,${rows.length} Roles`,
      `Total Evaluated Composition,${totalWeight}%`,
      'Target Capability Level,Level 3: Advanced Architect',
      '',
      '=== SECTION 2: RELATIVE WEIGHTING COMPOSITION MATRIX ===',
      'JSC Code,Competency Title,Distribution Weight (%)',
      ...rows.map(r => `"${r.jscNo || ''}","${r.competency || ''}",${r.weight || 0}%`),
      '',
      '=== SECTION 3: MASTER ANNEXURE DEFINITION DIRECTORY ===',
      'JSC Code,Competency Title,Capability Level,Baseline Definition,Sub-sections Structure',
      ...rows.map(r => {
        const mainText = (r.definition?.mainText || '').replace(/"/g, '""');
        const subs = (r.definition?.subsections || [])
          .map(s => `${s.heading}: ${s.paragraphs.join('; ')}`)
          .join(' | ')
          .replace(/"/g, '""');
        return `"${r.jscNo || ''}","${r.competency || ''}","${r.level || ''}","${mainText}","${subs}"`;
      }),
      '',
      '=== SECTION 4: JOB SPECIFIC COMPETENCIES (ANNEXURE B FORMAL LEDGER) ===',
      'JSC Code,Competency Title,Target Capability Level,Weighting Percentage',
      ...rows.map(r => `"${r.jscNo || ''}","${r.competency || ''}","${r.level || ''}",${r.weight || 0}%`),
      `ACCUMULATED SUM TOTAL,,,${totalWeight}%`,
      '',
      '=== SECTION 5: QUARTERLY PERFORMANCE APPRAISAL LEDGER ===',
      'Quarter,JSC Code,Competency Title,Self Score,Self Comments,Manager Score,Manager Motivation,Status',
      ...['q1', 'q2', 'q3', 'q4'].flatMap(q => {
        const qUpper = q.toUpperCase();
        return rows.map(r => {
          const qData = r[q as 'q1'|'q2'|'q3'|'q4'] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' };
          const selfCommentsEscaped = (qData.selfComments || '').replace(/"/g, '""');
          const managerMotivationEscaped = (qData.managerMotivation || '').replace(/"/g, '""');
          return `"${qUpper}","${r.jscNo || ''}","${r.competency || ''}",${qData.selfScore || ''},"${selfCommentsEscaped}",${qData.managerScore || ''},"${managerMotivationEscaped}","${qData.status || 'draft'}"`;
        });
      })
    ];

    const csvContent = csvLines.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JSC_Statutory_Metrics_Export_${activeTenantId || 'Global'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportToPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocker prevented opening the print report window. Please allow popups or download Word/Excel instead.");
      return;
    }

    const weightMatrixLines = rows.map(row => {
      const ratio = Math.min(100, Math.round((row.weight / (totalWeight || 100)) * 100));
      return `
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
            <span><strong style="font-family: monospace; color:#4f46e5;">[${row.jscNo}]</strong> ${row.competency}</span>
            <span>${row.weight}%</span>
          </div>
          <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden; display: flex;">
            <div style="background: #4f46e5; height: 100%; width: ${ratio}%; border-radius: 6px;"></div>
          </div>
        </div>
      `;
    }).join('');

    const directoryLines = rows.map(row => {
      const subSectionsMarkup = (row.definition?.subsections || []).map(s => {
        const bullets = (s.paragraphs || []).map(p => `<li style="font-size: 10px; color: #475569; margin-bottom:2px;">${p}</li>`).join('');
        return `
          <div style="margin-top: 6px; border-left: 2px solid #f97316; padding-left: 10px;">
            <strong style="font-size: 10px; color: #b45309; text-transform: uppercase; display: block; margin-bottom:2px;">${s.heading}</strong>
            <ul style="margin: 0; padding-left: 15px;">${bullets}</ul>
          </div>
        `;
      }).join('');

      return `
        <div style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="display: flex; align-items: center; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
            <span style="font-family: monospace; background: #fff7ed; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-size: 9px; margin-right: 8px;">${row.jscNo}</span>
            <span style="color:#1e293b; margin-right:6px;">${row.competency}</span>
            <span style="font-size: 10px; color: #64748b; font-weight: normal; font-style: italic;">(${row.level})</span>
          </div>
          <p style="margin: 4px 0; font-size: 11px; color: #475569; line-height: 1.5; font-weight: 500;">
            ${row.definition?.mainText || 'No custom primary definition written.'}
          </p>
          ${subSectionsMarkup}
        </div>
      `;
    }).join('');

    const ledgerRows = rows.map(r => {
      return `
        <tr>
          <td style="font-family: monospace; font-weight: bold; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size:11px;">${r.jscNo || ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size:11px; font-weight:600;">${r.competency || ''}</td>
          <td style="font-style: italic; color: #475569; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size:11px;">${r.level || ''}</td>
          <td style="text-align: right; font-weight: bold; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size:11px;">${r.weight || 0}%</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html>
      <head>
        <title>SDBIP / IPMS Consolidated Compliance Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px; margin: 0; }
          .container { max-width: 850px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 25px; }
          .title-group { display: flex; flex-direction: column; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; }
          .subtitle { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #4f46e5; font-weight: 900; margin-bottom: 2px; }
          .tenant { text-align: right; }
          .metadata { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 11px; }
          .metadata-item { display: flex; flex-direction: column; }
          .metadata-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
          .metadata-value { font-weight: bold; color: #1e293b; }
          .section-block { margin-top: 30px; }
          .section-title { font-size: 12px; text-transform: uppercase; font-weight: 900; tracking-widest; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; color: #0f172a; margin-bottom: 15px; display: flex; align-items: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
          th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-size: 10px; text-transform: uppercase; font-weight: 800; }
          .sum-row { font-weight: bold; background-color: #f8fafc; }
          .no-print-btn { background-color: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer; text-transform: uppercase; }
          .close-btn { background-color: #e2e8f0; color: #475569; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer; text-transform: uppercase; margin-left: 10px; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; background: white; }
            .container { box-shadow: none; border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          
          <div class="header">
            <div class="title-group">
              <span class="subtitle">SDBIP Implementation Framework Report</span>
              <h1 class="title">Consolidated Performance Assessment</h1>
            </div>
            <div class="tenant">
              <span class="metadata-label" style="display:block; font-size:8px; text-transform:uppercase; color:#64748b; font-weight:bold; margin-bottom:2px;">Workspace Tenant ID</span>
              <div style="font-size: 14px; font-weight: bold; color: #4f46e5; font-family: monospace;">${activeTenantId}</div>
            </div>
          </div>

          <div class="metadata">
            <div class="metadata-item">
              <span class="metadata-label">Report Compiler</span>
              <span class="metadata-value">${currentUser?.email || 'N/A'}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Legislative Status</span>
              <span class="metadata-value" style="color: ${totalWeight === 100 ? '#10b981' : '#b45309'};">${totalWeight === 100 ? 'FULLY COMPLIANT' : 'CORRECTION REQUIRED'}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Report Compiled Date</span>
              <span class="metadata-value">${new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <!-- Section 1: PMS Competencies Defined -->
          <div class="section-block">
            <div class="section-title">1. PMS Competencies Defined</div>
            <div style="background: #fafafa; border: 1px solid #e2e8f0; padding:15px; border-radius: 8px; font-size:11px; font-weight: 600;">
              There are currently <strong style="color:#4f46e5; font-family:monospace; font-size:13px;">${rows.length}</strong> active roles and horizontal competencies defined as technical guidelines inside this appraisal scope. All records map directly to workspace constraints.
            </div>
          </div>

          <!-- Section 2: Total Evaluated Composition -->
          <div class="section-block">
            <div class="section-title">2. Total Evaluated Composition</div>
            <div style="background: #fafafa; border: 1px solid #e2e8f0; padding:15px; border-radius: 8px; font-size:11px; font-weight: 600;">
              The accumulated weight total allocated within the competency system indexes represents <strong style="color:${totalWeight === 100 ? '#10b981' : '#b45309'}; font-family:monospace; font-size:13px;">${totalWeight}%</strong>. Under state regulation templates, a balanced appraisal registry mandates a strict 100% boundary score.
            </div>
          </div>

          <!-- Section 3: Target Capability Level -->
          <div class="section-block">
            <div class="section-title">3. Target Capability Level</div>
            <div style="background: #fafafa; border: 1px solid #e2e8f0; padding:15px; border-radius: 8px; font-size:11px; font-weight: 600;">
              Performance Appraisal baseline parameters set high-level Target Capability Requirements at <strong style="color: #c2410c; font-size:12px;">Level 3 (Advanced)</strong>. Each individual role targets a specific competency proficiency level.
            </div>
          </div>

          <!-- Section 4: Relative Weighting Composition Matrix (%) -->
          <div class="section-block">
            <div class="section-title">4. Relative Weighting Composition Matrix (%)</div>
            <div style="background: white; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px;">
              ${weightMatrixLines || '<p style="font-size:11px; color:#64748b;">No active competency scores.</p>'}
            </div>
          </div>

          <!-- Section 5: Master Annexure Definition Directory -->
          <div class="section-block" style="page-break-before: always;">
            <div class="section-title">5. Master Annexure Definition Directory</div>
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px;">
              ${directoryLines || '<div style="padding:15px; font-size:11px; color:#64748b;">No registry nodes defined.</div>'}
            </div>
          </div>

          <!-- Section 6: Job Specific Competency (Annexure B Formal Ledger) -->
          <div class="section-block" style="page-break-before: always;">
            <div class="section-title">6. Job Specific Competencies (Annexure B Formal Ledger)</div>
            <table>
              <thead>
                <tr>
                  <th style="padding: 10px; width:15%;">JSC Code</th>
                  <th style="padding: 10px; width:45%;">Competency Title</th>
                  <th style="padding: 10px; width:25%;">Target Capability Level</th>
                  <th style="text-align: right; padding: 10px; width:15%;">Weighting (%)</th>
                </tr>
              </thead>
              <tbody>
                ${ledgerRows}
                <tr class="sum-row">
                  <td colspan="3" style="text-align: right; text-transform: uppercase; font-size:10px; padding: 10px; border-top:2px solid #000;">Accumulated Sum Total:</td>
                  <td style="text-align: right; color: ${totalWeight === 100 ? '#10b981' : '#ef4444'}; font-weight: bold; padding: 10px; border-top:2px solid #000; font-family:monospace; font-size:11px;">${totalWeight}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 7: Quarterly Performance Appraisal Ledgers -->
          <div class="section-block" style="page-break-before: always;">
            <div class="section-title">7. Quarterly Performance Appraisal Ledgers</div>
            ${(() => {
              return ['q1', 'q2', 'q3', 'q4'].map(q => {
                const qUpper = q.toUpperCase();
                const status = rows[0]?.[q as 'q1'|'q2'|'q3'|'q4']?.status || 'draft';
                const rowsMarkup = rows.map(r => {
                  const qData = r[q as 'q1'|'q2'|'q3'|'q4'] || { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' };
                  return `
                    <tr>
                      <td style="font-family: monospace; font-weight: bold; padding: 6px; border-bottom: 1px solid #e2e8f0; font-size:10px;">${r.jscNo || ''}</td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size:10px; font-weight:600;">${r.competency || ''}</td>
                      <td style="text-align: center; padding: 6px; border-bottom: 1px solid #e2e8f0; font-size:10px; font-weight: bold;">${qData.selfScore || '-'}</td>
                      <td style="font-style: italic; color: #475569; padding: 6px; border-bottom: 1px solid #e2e8f0; font-size:10px;">${qData.selfComments || '-'}</td>
                      <td style="text-align: center; font-weight: bold; padding: 6px; border-bottom: 1px solid #e2e8f0; font-size:10px; background: #f0fdf4; color: #15803d;">${qData.managerScore || '-'}</td>
                      <td style="font-style: italic; color: #15803d; padding: 6px; border-bottom: 1px solid #e2e8f0; font-size:10px; background: #f0fdf4;">${qData.managerMotivation || '-'}</td>
                    </tr>
                  `;
                }).join('');

                return `
                  <h3 style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #1e3a8a; margin-top: 20px; margin-bottom: 8px; text-align: left;">
                    ${qUpper} Evaluation Ledger (Status: ${status.toUpperCase()})
                  </h3>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #1e293b; color: #ffffff;">
                        <th style="padding: 6px; font-size: 9px; text-align: left;">JSC Code</th>
                        <th style="padding: 6px; font-size: 9px; text-align: left;">Competency</th>
                        <th style="padding: 6px; font-size: 9px; text-align: center;">Self Score</th>
                        <th style="padding: 6px; font-size: 9px; text-align: left;">Self Comments</th>
                        <th style="padding: 6px; font-size: 9px; text-align: center;">Mgr Score</th>
                        <th style="padding: 6px; font-size: 9px; text-align: left;">Mgr Motivation</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsMarkup}
                    </tbody>
                  </table>
                `;
              }).join('');
            })()}
          </div>

          <!-- empty signature block in print layout -->
            <div style="margin-top: 40px; border-top: 2px solid #cbd5e1; padding-top: 20px;">
              <h3 style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #1e3a8a; margin-bottom: 15px; margin-top: 0; text-align: left;">Formal Declaration &amp; Sign-off</h3>
              <table style="width: 100%; border: none; font-size: 9px; font-family: 'Segoe UI', Arial, sans-serif;">
                <tr style="border: none;">
                  <td style="border: none; width: 45%; vertical-align: top; padding: 12px; background: #f8fafc; border-radius: 8px; text-align: left;">
                    <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Officer / Employee Representative</strong>
                    <div style="margin-bottom: 4px;"><strong>Name &amp; Surname:</strong> ${currentUser.name || currentUser.email || 'Representative'}</div>
                    <div style="margin-bottom: 4px;"><strong>Role/Designation:</strong> ${currentUser.role || 'Officer Representative'}</div>
                    <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
                    <div><strong>Signature:</strong> ____________________________________</div>
                    <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
                  </td>
                  <td style="border: none; width: 10%;"></td>
                  <td style="border: none; width: 45%; vertical-align: top; padding: 12px; background: #f8fafc; border-radius: 8px; text-align: left;">
                    <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Supervisor / manager approval</strong>
                    <div style="margin-bottom: 4px;"><strong>Name:</strong> Line Manager / Approved Supervisor</div>
                    <div style="margin-bottom: 4px;"><strong>Role:</strong> Municipal Representative</div>
                    <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
                    <div><strong>Signature:</strong> ____________________________________</div>
                    <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <div class="no-print" style="margin-top: 40px; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 20px;">
            <button onclick="window.print()" class="no-print-btn">Print Report / Export PDF</button>
            <button onclick="window.close()" class="close-btn">Close Preview</button>
          </div>

        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Keyboard Event Handlers for Laptop Standard Tab Keypress Auto-expansion
  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, columnKey: string) => {
    // If user presses "Tab" key on the weight field of the very last row, auto-expand the table
    if (e.key === 'Tab' && !e.shiftKey && rowIndex === rows.length - 1 && columnKey === 'weight') {
      e.preventDefault(); // Intercept browser flow
      appendBlankRow();
    }
  };

  // Row operations
  const appendBlankRow = () => {
    const nextIndex = rows.length + 1;
    const newId = `row-${Date.now()}-${nextIndex}`;
    const newRow: CompetencyRow = {
      id: newId,
      jscNo: `JSC-${100 + nextIndex}`,
      competency: 'New Mandatory Competency Name',
      definition: {
        mainText: 'Mandatory proficiency standard description.',
        subsections: []
      },
      level: 'Level 2: Competent Operator',
      weight: 10,
      q1: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q2: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q3: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' },
      q4: { selfScore: 0, selfComments: '', managerScore: 0, managerMotivation: '', status: 'draft' }
    };
    const updated = [...rows, newRow];
    setRows(updated);
    // Auto-select focused cell in the newly expanded row
    setSelectedRowId(newId);
    setSelectedField('competency');
    handleSaveToDatabase(updated);
  };

  const handleDeleteRow = (id: string) => {
    const updated = rows.filter(r => r.id !== id);
    setRows(updated);
    if (selectedRowId === id) {
      setSelectedRowId(null);
    }
    handleSaveToDatabase(updated);
  };

  const handleMoveRow = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === rows.length - 1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    const list = [...rows];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    setRows(list);
    handleSaveToDatabase(list);
  };

  const handleRowInputChange = (rowId: string, field: keyof CompetencyRow, value: any) => {
    const updated = rows.map(r => {
      if (r.id === rowId) {
        return { ...r, [field]: value };
      }
      return r;
    });
    setRows(updated);
  };

  // Left Sidebar Master Operations

  // A. JSC Masters
  const addJscMaster = () => {
    if (!newJscCode.trim()) return;
    const item: JSCMaster = {
      id: editingJscId || `jsc-master-${Date.now()}`,
      code: newJscCode.trim().toUpperCase(),
      description: newJscDesc.trim() || 'Custom technical qualification category'
    };

    let updatedList;
    if (editingJscId) {
      updatedList = jscMasters.map(x => x.id === editingJscId ? item : x);
      setEditingJscId(null);
    } else {
      updatedList = [...jscMasters, item];
    }
    setJscMasters(updatedList);
    setNewJscCode('');
    setNewJscDesc('');
    handleSaveToDatabase(rows, updatedList);
  };

  const deleteJscMaster = (id: string) => {
    const updatedList = jscMasters.filter(x => x.id !== id);
    setJscMasters(updatedList);
    handleSaveToDatabase(rows, updatedList);
  };

  const postJscToActiveCell = (code: string) => {
    if (!selectedRowId) {
      alert("Please select a cell or row in the table first by clicking inside its inputs.");
      return;
    }
    handleRowInputChange(selectedRowId, 'jscNo', code);
    handleSaveToDatabase();
  };

  // B. Competency Masters
  const addCompMaster = () => {
    if (!newCompName.trim()) return;
    const item: CompetencyMaster = {
      id: editingCompId || `comp-master-${Date.now()}`,
      name: newCompName.trim(),
      category: newCompCat
    };

    let updatedList;
    if (editingCompId) {
      updatedList = competencyMasters.map(x => x.id === editingCompId ? item : x);
      setEditingCompId(null);
    } else {
      updatedList = [...competencyMasters, item];
    }
    setCompetencyMasters(updatedList);
    setNewCompName('');
    handleSaveToDatabase(rows, jscMasters, updatedList);
  };

  const deleteCompMaster = (id: string) => {
    const updatedList = competencyMasters.filter(x => x.id !== id);
    setCompetencyMasters(updatedList);
    handleSaveToDatabase(rows, jscMasters, updatedList);
  };

  const postCompToActiveCell = (name: string) => {
    if (!selectedRowId) {
      alert("Please select a cell or row in the table first by clicking inside its inputs.");
      return;
    }
    handleRowInputChange(selectedRowId, 'competency', name);
    handleSaveToDatabase();
  };

  // C. Definition Builder Masters (With Subheadings & Paragraphs)
  const addDefSubsectionField = () => {
    setDefSubsections([...defSubsections, { heading: '', paragraphs: [''] }]);
  };

  const removeDefSubsectionField = (subIndex: number) => {
    setDefSubsections(defSubsections.filter((_, i) => i !== subIndex));
  };

  const handleSubheadingChange = (subIndex: number, text: string) => {
    const updated = [...defSubsections];
    updated[subIndex] = { ...updated[subIndex], heading: text };
    setDefSubsections(updated);
  };

  const handleSubparagraphChange = (subIndex: number, pIndex: number, text: string) => {
    const updated = [...defSubsections];
    const paragraphs = [...updated[subIndex].paragraphs];
    paragraphs[pIndex] = text;
    updated[subIndex] = { ...updated[subIndex], paragraphs };
    setDefSubsections(updated);
  };

  const addSubparagraphField = (subIndex: number) => {
    const updated = [...defSubsections];
    updated[subIndex] = {
      ...updated[subIndex],
      paragraphs: [...updated[subIndex].paragraphs, '']
    };
    setDefSubsections(updated);
  };

  const removeSubparagraphField = (subIndex: number, pIndex: number) => {
    const updated = [...defSubsections];
    updated[subIndex] = {
      ...updated[subIndex],
      paragraphs: updated[subIndex].paragraphs.filter((_, i) => i !== pIndex)
    };
    setDefSubsections(updated);
  };

  const addDefinitionMaster = () => {
    if (!defTitle.trim() || !defMainText.trim()) return;
    
    // Filter out completely empty subheadings
    const validSections = defSubsections
      .map(sub => ({
        heading: sub.heading.trim(),
        paragraphs: sub.paragraphs.map(p => p.trim()).filter(p => p.length > 0)
      }))
      .filter(sub => sub.heading.length > 0 || sub.paragraphs.length > 0);

    const item: DefinitionMaster = {
      id: editingDefId || `def-master-${Date.now()}`,
      title: defTitle.trim(),
      mainText: defMainText.trim(),
      subsections: validSections
    };

    let updatedList;
    if (editingDefId) {
      updatedList = definitionMasters.map(x => x.id === editingDefId ? item : x);
      setEditingDefId(null);
    } else {
      updatedList = [...definitionMasters, item];
    }
    setDefinitionMasters(updatedList);

    setDefTitle('');
    setDefMainText('');
    setDefSubsections([{ heading: '', paragraphs: [''] }]);
    handleSaveToDatabase(rows, jscMasters, competencyMasters, updatedList);
  };

  const deleteDefMaster = (id: string) => {
    const updatedList = definitionMasters.filter(x => x.id !== id);
    setDefinitionMasters(updatedList);
    handleSaveToDatabase(rows, jscMasters, competencyMasters, updatedList);
  };

  const postDefToActiveCell = (def: DefinitionMaster) => {
    if (!selectedRowId) {
      alert("Please select a cell or row in the table first by clicking inside its inputs.");
      return;
    }
    handleRowInputChange(selectedRowId, 'definition', {
      mainText: def.mainText,
      subsections: def.subsections
    });
    handleSaveToDatabase();
  };

  // D. Level Masters
  const addLvlMaster = () => {
    if (!newLvlName.trim()) return;
    const item: LevelMaster = {
      id: editingLvlId || `lvl-master-${Date.now()}`,
      name: newLvlName.trim(),
      description: newLvlDesc.trim() || 'Required rating performance indicators'
    };

    let updatedList;
    if (editingLvlId) {
      updatedList = levelMasters.map(x => x.id === editingLvlId ? item : x);
      setEditingLvlId(null);
    } else {
      updatedList = [...levelMasters, item];
    }
    setLevelMasters(updatedList);
    setNewLvlName('');
    setNewLvlDesc('');
    handleSaveToDatabase(rows, jscMasters, competencyMasters, definitionMasters, updatedList);
  };

  const deleteLvlMaster = (id: string) => {
    const updatedList = levelMasters.filter(x => x.id !== id);
    setLevelMasters(updatedList);
    handleSaveToDatabase(rows, jscMasters, competencyMasters, definitionMasters, updatedList);
  };

  const postLvlToActiveCell = (lvlName: string) => {
    if (!selectedRowId) {
      alert("Please select a cell or row in the table first by clicking inside its inputs.");
      return;
    }
    handleRowInputChange(selectedRowId, 'level', lvlName);
    handleSaveToDatabase();
  };

  // E. Weight Masters
  const addWeightMaster = () => {
    if (newWeightVal <= 0 || newWeightVal > 100) return;
    const item: WeightMaster = {
      id: editingWeightId || `weight-master-${Date.now()}`,
      value: newWeightVal
    };

    let updatedList;
    if (editingWeightId) {
      updatedList = weightMasters.map(x => x.id === editingWeightId ? item : x);
      setEditingWeightId(null);
    } else {
      updatedList = [...weightMasters, item];
    }
    setWeightMasters(updatedList);
    handleSaveToDatabase(rows, jscMasters, competencyMasters, definitionMasters, levelMasters, updatedList);
  };

  const deleteWeightMaster = (id: string) => {
    const updatedList = weightMasters.filter(x => x.id !== id);
    setWeightMasters(updatedList);
    handleSaveToDatabase(rows, jscMasters, competencyMasters, definitionMasters, levelMasters, updatedList);
  };

  const postWeightToActiveCell = (val: number) => {
    if (!selectedRowId) {
      alert("Please select a cell or row in the table first by clicking inside its inputs.");
      return;
    }
    handleRowInputChange(selectedRowId, 'weight', val);
    handleSaveToDatabase();
  };

  return (
    <div id="jsc-system-workspace" className="flex flex-col h-full bg-[#FAF9F8] text-gray-800 font-sans select-none overflow-hidden rounded-3xl border border-gray-200">
      
      {/* 1. Header Navigation System */}
      <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-white border-b border-slate-950 shrink-0 select-text gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center border border-orange-400 font-black shrink-0 shadow-md">
            <FileBadge className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] bg-slate-800 text-orange-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">PMS National Framework Annexure B</span>
            <h1 className="text-sm font-black text-white hover:text-orange-300 transition duration-150 tracking-tight uppercase">Job Specific Competencies (JSC) Planner</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">

          {isDualLayerTeamLeader && (
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl shrink-0 mr-4">
              <button
                onClick={() => setAgreementScope('individual')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  agreementScope === 'individual' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                My Personal JSC
              </button>
              <button
                onClick={() => setAgreementScope('team')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  agreementScope === 'team' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Team JSC
              </button>
            </div>
          )}
          <span className="text-xs bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">

            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Tenant Workspace: <span className="text-orange-300 font-bold font-mono">{activeTenantId}</span>
          </span>
          {isDualLayerTeamLeader ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveToDatabase(undefined, undefined, undefined, undefined, undefined, undefined, currentUser.email)}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Syncing..." : "Commit Personal DB"}</span>
              </button>
              <button
                onClick={() => handleSaveToDatabase(undefined, undefined, undefined, undefined, undefined, undefined, currentUser.email + '_team')}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Syncing..." : "Commit Team DB"}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleSaveToDatabase()}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Syncing..." : "Database Commit"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Banner Alert */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            <button 
              onClick={() => setActiveTab('legislation')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition duration-150 ${activeTab === 'legislation' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Legislation Map</span>
            </button>
            <button 
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition duration-150 ${activeTab === 'templates' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>2. Expandable Master Planner</span>
            </button>
            <button 
              onClick={() => setActiveTab('self_evaluation')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition duration-150 ${activeTab === 'self_evaluation' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Self Evaluation</span>
            </button>
            <button 
              onClick={() => setActiveTab('manager_approval')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition duration-150 ${activeTab === 'manager_approval' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>4. Manager Approval</span>
            </button>
            <button 
              onClick={() => setActiveTab('reporting')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition duration-150 ${activeTab === 'reporting' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>5. Analytical Reporting</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 flex items-center gap-1.5 font-mono">
            <Keyboard className="w-3.5 h-3.5 text-gray-400" /> Use laptop [TAB] key on weights to expand rows
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            syncStatus === 'saving' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            syncStatus === 'saved' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
            syncStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-slate-50 text-slate-700 border-slate-205'
          }`}>
            {syncStatus === 'saving' ? '☁️ Saving to Supabase...' :
             syncStatus === 'saved' ? '✔️ Sync Complete' :
             syncStatus === 'error' ? '❌ Sync Failed' :
             'Offline Cache Saved'}
          </span>
        </div>
      </div>

      {/* 3. Main Body Split Workspace */}
      <div className="flex-1 overflow-hidden p-6 select-text">

        {/* TAB 1: Detailed Legislation Overview */}
        {activeTab === 'legislation' && (
          <div className="h-full overflow-y-auto max-w-4xl mx-auto space-y-6 pr-2">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl flex items-start gap-4 shadow-md border border-slate-800 animate-slide-in">
              <div className="p-3 bg-white/10 text-orange-400 border border-white/10 rounded-xl">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-black text-white uppercase tracking-tight">Legislatory Mandate & Framework Review</h2>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Job-specific competencies in South African municipalities define the technical, occupational, and professional technical qualifications. They consist of specialized technical knowledge, trade-specific skills, and operational expertise necessary to perform municipal functions, aligned directly under local government compliance mandates.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] bg-slate-800 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-750">Section 57 of the MFMA</span>
                  <span className="text-[10px] bg-slate-800 text-yellow-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-750">DPSA Framework Matrix</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white border border-gray-255 p-5 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
                <h3 className="text-xs font-black text-orange-600 uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">1</span>
                  What Information is Contained?
                </h3>
                <ul className="space-y-3 text-[11px] text-gray-500 leading-relaxed">
                  <li><b className="text-gray-800 block">Occupational & Technical Competencies:</b> The core, hands-on knowledge and abilities required to execute the job. For example, a Town Planner needs spatial analysis and GIS proficiency, while a CFO requires SCM and GRAP audit knowledge.</li>
                  <li><b className="text-gray-800 block">Leading & Core Managerial:</b> Competencies expected of senior and middle managers, including strategic capability, people management, and financial or change management.</li>
                  <li><b className="text-gray-850 block">Personal Values & Attributes:</b> Standards including honesty, integrity, and ethical governance.</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-255 p-5 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
                <h3 className="text-xs font-black text-orange-600 uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">2</span>
                  What are They Aligned To?
                </h3>
                <ul className="space-y-3 text-[11px] text-gray-500 leading-relaxed">
                  <li><b className="text-gray-800 block">National Strategic Goals:</b> Complete horizontal integrations with Integrated Development Plans (IDP) and Service Delivery and Budget Implementation Plans (SDBIP).</li>
                  <li><b className="text-gray-800 block">Performance Targets:</b> Form the foundational baseline for an official's Performance Agreement contract and regular performance appraisals.</li>
                  <li><b className="text-gray-850 block">Sector Legislation:</b> Explicitly designed to align with constitutional mandates and municipal legislation (e.g. Local Government: Municipal Systems Act).</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-255 p-5 rounded-xl space-y-3 shadow-sm hover:shadow-md transition">
                <h3 className="text-xs font-black text-orange-600 uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">3</span>
                  Source of Information
                </h3>
                <ul className="space-y-3 text-[11px] text-gray-400 leading-relaxed">
                  <li><b className="text-gray-800 block">National Treasury:</b> Provides the specific competency frameworks for municipal finance, budgeting, and SCM under the Municipal Finance Management Act (MFMA).</li>
                  <li><b className="text-gray-800 block">DPSA Frameworks:</b> Overarching public service competency framework for leadership and senior management.</li>
                  <li><b className="text-gray-850 block">NSG Programs:</b> Endorses mandatory pre-entry and municipal management courses.</li>
                  <li><b className="text-gray-850 block">Professional Bodies:</b> Statutory requirements dictating technical qualifications.</li>
                </ul>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: Infinite Expandable Master Planner Workspace */}
        {activeTab === 'templates' && (
          <div className="h-full grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Hand Reference registries builder panel */}
            <div className="col-span-1 xl:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 space-y-6 overflow-y-auto max-h-[82vh] shadow-sm select-text">
              
              <div className="border-b border-gray-150 pb-3">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Settings className="w-4 h-4 text-orange-500" /> References Master Registers
                </h2>
                <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                  Define reference codes, technical competencies, definitions, and levels. Press "Post" to inject selected data into the active table row.
                </p>
              </div>

              {/* SECTION A: JSC Code Master Register */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1">
                  🔍 A. JSC Masters
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newJscCode} 
                    onChange={(e) => setNewJscCode(e.target.value)} 
                    placeholder="e.g. JSC-105" 
                    className="flex-1 bg-white border border-gray-200 px-3 py-1.5 text-xs rounded-lg uppercase font-mono outline-none focus:ring-1 focus:ring-orange-200 focus:border-orange-400"
                  />
                  <button 
                    onClick={addJscMaster}
                    className="bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    {editingJscId ? "OK" : "Add"}
                  </button>
                </div>
                <input 
                  type="text" 
                  value={newJscDesc} 
                  onChange={(e) => setNewJscDesc(e.target.value)} 
                  placeholder="Optional categorization / description" 
                  className="w-full bg-white border border-gray-200 px-3 py-1 text-[10px] rounded-lg outline-none focus:ring-1 hover:border-gray-300"
                />

                <div className="max-h-[140px] overflow-y-auto space-y-2 pt-1 border-t border-gray-150">
                  {jscMasters.map((x) => (
                    <div key={x.id} className="bg-white p-2.5 rounded-lg border border-gray-150 flex items-center justify-between text-xs hover:border-orange-200 transition">
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="font-mono font-black text-gray-800 block text-[10px]">{x.code}</span>
                        <span className="text-[10px] text-gray-500 block truncate">{x.description}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => postJscToActiveCell(x.code)}
                          className="bg-sky-55 text-sky-800 border border-sky-100 hover:bg-sky-100 px-2 py-1 rounded text-[10px] font-bold uppercase transition"
                          title="Post to active row"
                        >
                          Post
                        </button>
                        <button 
                          onClick={() => {
                            setNewJscCode(x.code);
                            setNewJscDesc(x.description);
                            setEditingJscId(x.id);
                          }}
                          className="text-gray-500 hover:text-gray-900 p-0.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteJscMaster(x.id)}
                          className="text-dashed text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION B: Competency Title Register */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1">
                  🎯 B. Competencies Registry
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCompName} 
                    onChange={(e) => setNewCompName(e.target.value)} 
                    placeholder="e.g. Asset Life Cycle Management" 
                    className="flex-1 bg-white border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-orange-200"
                  />
                  <button 
                    onClick={addCompMaster}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    {editingCompId ? "OK" : "Add"}
                  </button>
                </div>

                <div className="max-h-[140px] overflow-y-auto space-y-2 pt-1 border-t border-gray-150">
                  {competencyMasters.map((x) => (
                    <div key={x.id} className="bg-white p-2.5 rounded-lg border border-gray-150 flex items-center justify-between text-xs hover:border-orange-250 transition animate-fade-in">
                      <span className="font-semibold text-gray-800 max-w-[70%] leading-tight text-[10px]">{x.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => postCompToActiveCell(x.name)}
                          className="bg-sky-55 text-sky-800 border border-sky-100 hover:bg-sky-100 px-2 py-1 rounded text-[10px] font-bold uppercase transition"
                        >
                          Post
                        </button>
                        <button 
                          onClick={() => {
                            setNewCompName(x.name);
                            setNewCompCat(x.category || 'Technical');
                            setEditingCompId(x.id);
                          }}
                          className="text-gray-500 hover:text-gray-900 p-0.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteCompMaster(x.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION C: Competency Definition nested structure builder */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1">
                  📝 C. Structured Definition Builder
                </span>
                
                <div className="space-y-2.5">
                  <input 
                    type="text" 
                    value={defTitle} 
                    onChange={(e) => setDefTitle(e.target.value)} 
                    placeholder="Def Title (e.g. SCM Expert)" 
                    className="w-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-bold rounded-lg outline-none focus:ring-1 focus:ring-orange-200"
                  />
                  <textarea 
                    value={defMainText} 
                    onChange={(e) => setDefMainText(e.target.value)} 
                    placeholder="Primary baseline definition Statement..." 
                    className="w-full h-15 bg-white border border-gray-200 p-2.5 text-[11px] rounded-lg outline-none focus:ring-1 focus:ring-orange-200 resize-none"
                  />

                  {/* Subheadings and sub-paragraphs wrapper */}
                  <div className="space-y-3 pt-2 border-t border-dashed border-gray-250">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-gray-500 uppercase">Subheadings & Subparagraphs</span>
                      <button 
                        onClick={addDefSubsectionField}
                        className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 font-bold rounded hover:bg-indigo-100 transition"
                      >
                        + Sub Heading
                      </button>
                    </div>

                    {defSubsections.map((sub, sIdx) => (
                      <div key={sIdx} className="bg-orange-50/40 p-2.5 rounded-lg border border-orange-105-sub border-dashed space-y-2">
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            value={sub.heading || ''} 
                            onChange={(e) => handleSubheadingChange(sIdx, e.target.value)} 
                            placeholder="Heading (e.g. Specific Skills)" 
                            className="flex-1 bg-white border border-gray-200 px-2 py-1 text-[10px] font-bold rounded outline-none"
                          />
                          <button 
                            onClick={() => removeDefSubsectionField(sIdx)}
                            className="text-red-500 hover:text-red-700 text-[9px]"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Subparagraph items */}
                        <div className="space-y-1.5 pl-3 border-l border-orange-150">
                          {sub.paragraphs.map((p, pIdx) => (
                            <div key={pIdx} className="flex gap-1 items-center">
                              <span className="text-[9px] text-orange-400 font-mono">•</span>
                              <input 
                                type="text" 
                                value={p || ''} 
                                onChange={(e) => handleSubparagraphChange(sIdx, pIdx, e.target.value)} 
                                placeholder="Subparagraph clause statement" 
                                className="flex-1 bg-white border border-gray-200 px-2 py-0.5 text-[9px] rounded outline-none"
                              />
                              <button 
                                onClick={() => removeSubparagraphField(sIdx, pIdx)}
                                className="text-gray-400 hover:text-gray-700 text-[9px]"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => addSubparagraphField(sIdx)}
                            className="text-[9px] text-blue-600 font-semibold block pt-0.5 hover:underline"
                          >
                            + Add Paragraph
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={addDefinitionMaster}
                    className="w-full py-2 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingDefId ? "Confirm Definition Update" : "Register Definition"}</span>
                  </button>
                </div>

                <div className="max-h-[160px] overflow-y-auto space-y-2 pt-2 border-t border-gray-150">
                  {definitionMasters.map((x) => (
                    <div key={x.id} className="bg-white p-2.5 rounded-lg border border-gray-150 hover:border-orange-250 transition space-y-2 block">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 block text-[10px]">{x.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => postDefToActiveCell(x)}
                            className="bg-sky-55 text-sky-800 border border-sky-100 hover:bg-sky-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase transition"
                          >
                            Post
                          </button>
                          <button 
                            onClick={() => {
                              setDefTitle(x.title);
                              setDefMainText(x.mainText);
                              setDefSubsections(x.subsections.length > 0 ? x.subsections : [{ heading: '', paragraphs: [''] }]);
                              setEditingDefId(x.id);
                            }}
                            className="text-gray-500 hover:text-gray-900 p-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => deleteDefMaster(x.id)}
                            className="text-red-500 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <blockquote className="border-l-2 border-orange-200 pl-2 text-[9px] text-gray-500 leading-normal italic truncate">
                        {x.mainText}
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION D: Levels Master */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1">
                  🛡️ D. Capability Level Options
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newLvlName} 
                    onChange={(e) => setNewLvlName(e.target.value)} 
                    placeholder="e.g. Level 3: Professional Planner" 
                    className="flex-1 bg-white border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none focus:ring-1 focus:ring-orange-200"
                  />
                  <button 
                    onClick={addLvlMaster}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    {editingLvlId ? "OK" : "Add"}
                  </button>
                </div>
                <input 
                  type="text" 
                  value={newLvlDesc} 
                  onChange={(e) => setNewLvlDesc(e.target.value)} 
                  placeholder="Optional description / required index performance rating" 
                  className="w-full bg-white border border-gray-200 px-3 py-1 text-[10px] rounded-lg outline-none"
                />

                <div className="max-h-[140px] overflow-y-auto space-y-2 pt-1 border-t border-gray-150">
                  {levelMasters.map((x) => (
                    <div key={x.id} className="bg-white p-2.5 rounded-lg border border-gray-150 flex items-center justify-between text-xs hover:border-orange-250 transition-all">
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="font-bold text-gray-800 block text-[10px]">{x.name}</span>
                        <p className="text-[9px] text-gray-400 block truncate">{x.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => postLvlToActiveCell(x.name)}
                          className="bg-sky-55 text-sky-800 border border-sky-100 hover:bg-sky-100 px-2 py-1 rounded text-[10px] font-bold uppercase transition"
                        >
                          Post
                        </button>
                        <button 
                          onClick={() => {
                            setNewLvlName(x.name);
                            setNewLvlDesc(x.description);
                            setEditingLvlId(x.id);
                          }}
                          className="text-gray-500 hover:text-gray-900 p-0.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteLvlMaster(x.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION E: Weights Master */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1">
                    ⚖️ E. Weights Presets
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] bg-sky-100 text-[#0078D4] px-1.5 py-0.5 rounded font-black font-mono">Total {totalWeight}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={newWeightVal} 
                    onChange={(e) => setNewWeightVal(Number(e.target.value) || 0)} 
                    placeholder="Weight (e.g. 20)" 
                    className="flex-1 bg-white border border-gray-200 px-3 py-1.5 text-xs rounded-lg outline-none"
                  />
                  <button 
                    onClick={addWeightMaster}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    {editingWeightId ? "OK" : "Add"}
                  </button>
                </div>

                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pt-1 border-t border-gray-150">
                  {weightMasters.map((x) => (
                    <div key={x.id} className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-150 flex items-center justify-between text-xs hover:border-orange-250 transition-all">
                      <span className="font-mono font-bold text-gray-800 text-[10px]">{x.value}% Weight</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => postWeightToActiveCell(x.value)}
                          className="bg-sky-55 text-sky-800 border border-sky-100 hover:bg-sky-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase transition"
                        >
                          Post
                        </button>
                        <button 
                          onClick={() => deleteWeightMaster(x.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Hand: Primary Live Laptop Interactive Table Grid */}
            <div className="col-span-1 xl:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm select-text overflow-hidden">
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden min-h-0">
                
                {/* Table Control and quick calculator helpers */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-150 pb-3 gap-3 shrink-0 select-none">
                  <div>
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Keyboard className="w-4 h-4 text-orange-500" /> Competency Grid Planner (Active Rows: {rows.length})
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Click into any cell input to active focal selection. Post from Left masters instantly injects values.</p>
                  </div>

                  {/* Calculator Widget total */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-bold">Sum of Weights: </span>
                    <span className={`px-2.5 py-1 text-xs font-mono font-black border rounded-lg ${
                      totalWeight === 100 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    }`}>
                      {totalWeight}% {totalWeight === 100 ? '✔️ Perfectly Balanced' : '⚠️ Must sum to 100%'}
                    </span>
                    
                    {/* Distribute Weights math trigger buttons */}
                    <button 
                      onClick={handleDistributeEvenly}
                      className="bg-gray-100 hover:bg-gray-200 border border-gray-250 text-gray-700 font-bold px-2 py-1 rounded-lg text-[10px] transition"
                      title="Set weight evenly to total exactly 100%"
                    >
                      Equal Weights
                    </button>
                    <button 
                      onClick={handleScaleTo100}
                      className="bg-gray-100 hover:bg-gray-200 border border-gray-250 text-gray-700 font-bold px-2 py-1 rounded-lg text-[10px] transition"
                      title="Proportionally scale current values to add up to exactly 100%"
                    >
                      Scale 100%
                    </button>
                  </div>
                </div>

                {/* Main Table Scrolling Element Wrapper */}
                <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-gray-50/50">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-xs text-gray-500">Querying Supabase registry database...</p>
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                      <AlertTriangle className="w-9 h-9 text-amber-500" />
                      <p className="text-xs font-bold text-gray-700">No active competencies defined in database.</p>
                      <button 
                        onClick={appendBlankRow} 
                        className="bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
                      >
                        Create Initial Row
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs min-w-[750px]">
                      <thead className="bg-[#FAF9F8] border-b border-gray-200 text-slate-700 font-bold uppercase tracking-wider select-none sticky top-0 z-10 text-[9px] text-center">
                        <tr>
                          <th className="py-3 px-4 text-left w-12">#</th>
                          <th className="py-3 px-3 text-left w-24">JSC NO</th>
                          <th className="py-3 px-3 text-left w-[25%]">COMPETENCY</th>
                          <th className="py-3 px-4 text-left w-[35%]">COMPETENCY DEFINITION (NESTED)</th>
                          <th className="py-3 px-3 text-left w-28">LEVEL OF CAPABILITY</th>
                          <th className="py-3 px-3 text-left w-24">WEIGHTING</th>
                          <th className="py-3 px-3 text-center w-20">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rIdx) => {
                          const isRowFocused = selectedRowId === row.id;
                          return (
                            <tr 
                              key={row.id} 
                              className={`border-b border-gray-150 transition-colors ${
                                isRowFocused 
                                  ? 'bg-[#0078D4]/[0.05] hover:bg-[#0078D4]/[0.08]' 
                                  : 'bg-white hover:bg-[#FAF9F8]'
                              }`}
                            >
                              {/* Index Indicators */}
                              <td className="py-4 px-4 text-center font-bold text-gray-400 select-none">
                                {rIdx + 1}
                              </td>

                              {/* JSC NO input cell */}
                              <td className="py-3 px-3">
                                <input 
                                  type="text" 
                                  value={row.jscNo || ''} 
                                  onChange={(e) => handleRowInputChange(row.id, 'jscNo', e.target.value)}
                                  onBlur={() => handleSaveToDatabase()}
                                  onFocus={() => {
                                    setSelectedRowId(row.id);
                                    setSelectedField('jscNo');
                                  }}
                                  onKeyDown={(e) => handleCellKeyDown(e, rIdx, 'jscNo')}
                                  placeholder="e.g. JSC-101" 
                                  className={`w-full bg-transparent border-0 px-1 py-1 font-mono font-bold uppercase text-[11px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 ${
                                    isRowFocused && selectedField === 'jscNo' ? 'text-blue-700 ring-1 ring-blue-300' : 'text-gray-800'
                                  }`}
                                />
                              </td>

                              {/* COMPETENCY Name Input cell */}
                              <td className="py-3 px-3">
                                <input 
                                  type="text" 
                                  value={row.competency || ''} 
                                  onChange={(e) => handleRowInputChange(row.id, 'competency', e.target.value)}
                                  onBlur={() => handleSaveToDatabase()}
                                  onFocus={() => {
                                    setSelectedRowId(row.id);
                                    setSelectedField('competency');
                                  }}
                                  onKeyDown={(e) => handleCellKeyDown(e, rIdx, 'competency')}
                                  placeholder="Mandatory Competency Name" 
                                  className={`w-full bg-transparent border-0 px-1 py-1 text-[11px] rounded font-bold outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 ${
                                    isRowFocused && selectedField === 'competency' ? 'text-blue-700 ring-1 ring-blue-300' : 'text-gray-800'
                                  }`}
                                />
                              </td>

                              {/* COMPETENCY DEFINITION Cell (Shows core statement + structured headings/subparagraphs) */}
                              <td className="py-3 px-4">
                                <div 
                                  className="space-y-2 p-2 rounded bg-slate-50/50 hover:bg-slate-100 transition border border-gray-150 cursor-pointer text-[10px]"
                                  onClick={() => {
                                    setSelectedRowId(row.id);
                                    setSelectedField('definition');
                                  }}
                                >
                                  {/* Main Description statement */}
                                  <textarea 
                                    value={row.definition?.mainText || ''} 
                                    onChange={(e) => {
                                      const oldDef = row.definition || { mainText: '', subsections: [] };
                                      handleRowInputChange(row.id, 'definition', { ...oldDef, mainText: e.target.value });
                                    }}
                                    onBlur={() => handleSaveToDatabase()}
                                    placeholder="Enter baseline descriptions..."
                                    className="w-full bg-transparent border-0 text-[10px] font-medium leading-relaxed resize-none outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded p-1"
                                    rows={2}
                                  />

                                  {/* Render Structured Nested headings and list paragraphs */}
                                  {row.definition?.subsections && row.definition.subsections.length > 0 && (
                                    <div className="space-y-2 pt-1 border-t border-dashed border-gray-200 select-text">
                                      {row.definition.subsections.map((sub, sIdx) => (
                                        <div key={sIdx} className="space-y-1 pl-1">
                                          <div className="flex gap-2">
                                            <input 
                                              type="text" 
                                              value={sub.heading || ''} 
                                              onChange={(e) => {
                                                const subsections = [...row.definition.subsections];
                                                subsections[sIdx] = { ...subsections[sIdx], heading: e.target.value };
                                                handleRowInputChange(row.id, 'definition', { ...row.definition, subsections });
                                              }}
                                              onBlur={() => handleSaveToDatabase()}
                                              placeholder="Subheading..." 
                                              className="bg-transparent font-bold text-[9px] text-orange-650 uppercase border-0 outline-none w-full"
                                            />
                                          </div>
                                          
                                          {sub.paragraphs && sub.paragraphs.map((p, pIdx) => (
                                            <div key={pIdx} className="flex gap-1.5 pl-2 items-center text-[9px] text-gray-500">
                                              <span className="text-orange-400 shrink-0">•</span>
                                              <textarea 
                                                value={p || ''} 
                                                onChange={(e) => {
                                                  const subsections = [...row.definition.subsections];
                                                  const pList = [...subsections[sIdx].paragraphs];
                                                  pList[pIdx] = e.target.value;
                                                  subsections[sIdx] = { ...subsections[sIdx], paragraphs: pList };
                                                  handleRowInputChange(row.id, 'definition', { ...row.definition, subsections });
                                                }}
                                                onBlur={() => handleSaveToDatabase()}
                                                placeholder="Sub-paragraph description"
                                                className="w-full bg-transparent border-0 text-[9px] resize-none outline-none"
                                                rows={1}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* LEVEL OF CAPABILITY cell */}
                              <td className="py-3 px-3">
                                <input 
                                  type="text" 
                                  value={row.level || ''} 
                                  onChange={(e) => handleRowInputChange(row.id, 'level', e.target.value)}
                                  onBlur={() => handleSaveToDatabase()}
                                  onFocus={() => {
                                    setSelectedRowId(row.id);
                                    setSelectedField('level');
                                  }}
                                  onKeyDown={(e) => handleCellKeyDown(e, rIdx, 'level')}
                                  placeholder="e.g. Level 3: Advanced Architect" 
                                  className={`w-full bg-transparent border-0 px-1 py-1 text-[11px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 ${
                                    isRowFocused && selectedField === 'level' ? 'text-blue-700 ring-1 ring-blue-300' : 'text-gray-800'
                                  }`}
                                />
                              </td>

                              {/* WEIGHTING numerical input cell */}
                              <td className="py-3 px-3 font-mono">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="number" 
                                    value={row.weight ?? ''} 
                                    onChange={(e) => handleRowInputChange(row.id, 'weight', e.target.value === '' ? '' : Number(e.target.value))}
                                    onBlur={() => handleSaveToDatabase()}
                                    onFocus={() => {
                                      setSelectedRowId(row.id);
                                      setSelectedField('weight');
                                    }}
                                    onKeyDown={(e) => handleCellKeyDown(e, rIdx, 'weight')}
                                    placeholder="20" 
                                    className={`w-14 text-right bg-transparent border-0 px-1 py-1 font-bold text-[11px] rounded outline-none transition focus:bg-white focus:ring-1 focus:ring-blue-400 ${
                                      isRowFocused && selectedField === 'weight' ? 'text-blue-700 ring-1 ring-blue-300 font-black' : 'text-gray-800'
                                    }`}
                                  />
                                  <span className="text-gray-400 font-bold">%</span>
                                </div>
                              </td>

                              {/* Row Movement and Deletion Controls */}
                              <td className="py-3 px-3 text-center shrink-0">
                                <div className="flex items-center justify-center gap-1 select-none">
                                  <button
                                    onClick={() => handleMoveRow(rIdx, 'up')}
                                    disabled={rIdx === 0}
                                    className="p-1 text-gray-450 hover:text-gray-800 disabled:opacity-30 cursor-pointer"
                                    title="Move row up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveRow(rIdx, 'down')}
                                    disabled={rIdx === rows.length - 1}
                                    className="p-1 text-gray-450 hover:text-gray-800 disabled:opacity-30 cursor-pointer"
                                    title="Move row down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRow(row.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition cursor-pointer"
                                    title="Delete line row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Bottom expand action triggers */}
                <div className="flex items-center justify-between pt-2 select-none shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold bg-gray-50 border border-gray-150 px-2.5 py-1.5 rounded-lg">
                    <Keyboard className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Focus on last Weighting cell & press [TAB] to expand columns.</span>
                  </div>

                  <button 
                    onClick={appendBlankRow}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition border border-orange-455 cursor-pointer uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Insert New Planner Row (+ Tab)</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 3: Employee Self Evaluation */}
        {activeTab === 'self_evaluation' && (
          <JSCSelfEvaluationSection currentUser={currentUser} activeTenantId={activeTenantId} />
        )}

        {/* TAB 4: Supervisor & Line Manager Approval */}
        {activeTab === 'manager_approval' && (
          <JSCManagerApprovalSection currentUser={currentUser} activeTenantId={activeTenantId} defaultEmployeeEmail={selectedUserEmail} />
        )}

        {/* TAB 5: Analytical Reporting Statistics and Visualizations */}
        {activeTab === 'reporting' && (
          <JSCAnalyticalReportingSection currentUser={currentUser} activeTenantId={activeTenantId} />
        )}
      </div>

      {/* 4. Compliance footer layout */}
      <div id="jsc-legal-footer" className="p-4 bg-gray-50/80 border-t border-gray-200 text-[9px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-2 shrink-0 select-none">
        <span className="flex items-center gap-1 font-semibold"><Info className="w-3.5 h-3.5 text-gray-500 shrink-0" /> South African National Local Government Competency Directory (Gazette No. 37731) Horizontal Alignment Checked</span>
        <b className="uppercase text-gray-600 font-bold select-text text-[10px]">Mzansi Flow SDBIP/IPMS S57/56 Suite</b>
      </div>

    </div>
  );
}
