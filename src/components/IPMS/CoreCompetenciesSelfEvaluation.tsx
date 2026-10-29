import React, { useState, useEffect } from 'react';
import { 
  Award, ShieldCheck, CheckCircle2, AlertTriangle, FileSpreadsheet, 
  Send, RotateCcw, Save, Eye, Download, Upload, X, FileText, 
  Briefcase, Compass, File, Presentation, Image, Lock, Unlock,
  HelpCircle, ChevronRight, Layers, UserCheck, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { OfficeDocumentViewer, PoeDocument } from './OfficeDocumentViewer';
import { downloadOriginalFile, getMimeTypeForFile } from '../../utils/documentBinaryHelper';

interface CoreCompetenciesSelfEvaluationProps {
  currentUser: {
    email: string;
    role?: string;
    name?: string;
    fullName?: string;
    managerEmail?: string;
    manager?: string;
  };
  activeTenantId: string;
  isTeamEvaluation?: boolean;
}

export interface CompetencyEvaluationQuarterData {
  selfScore: number; // 0 to 5
  selfComments: string;
  poeDescription: string;
  poeDocs: PoeDocument[];
  managerScore?: number;
  managerMotivation?: string;
  internalAuditorScore?: number;
  internalAuditorComments?: string;
  dpmcScore?: number;
  dpmcComments?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'audited' | 'moderated';
}

export interface CoreCompetencyEvalItem {
  id: string;
  competency: string;
  components: string;
  definition: string;
  weighting: string;
  q1: CompetencyEvaluationQuarterData;
  q2: CompetencyEvaluationQuarterData;
  q3: CompetencyEvaluationQuarterData;
  q4: CompetencyEvaluationQuarterData;
}

const createDefaultQuarterData = (initialPoeDesc = ''): CompetencyEvaluationQuarterData => ({
  selfScore: 0,
  selfComments: '',
  poeDescription: initialPoeDesc,
  poeDocs: [],
  managerScore: 0,
  managerMotivation: '',
  internalAuditorScore: 0,
  internalAuditorComments: '',
  dpmcScore: 0,
  dpmcComments: '',
  status: 'draft'
});

const DEFAULT_DIRECTORS_COMPETENCIES = [
  {
    id: 'dir-row-1',
    competency: 'Strategic Direction & Leadership',
    components: 'Vision translation, institutional alignment, operational strategy execution, IDP alignment',
    definition: 'Guides departmental strategy and aligns resources to institutional key performance areas and municipal priorities.',
    weighting: '25'
  },
  {
    id: 'dir-row-2',
    competency: 'Operational Governance & Compliance',
    components: 'Statutory compliance, audit action plans, risk registers, internal controls enforcement',
    definition: 'Enforces statutory compliance and risk mitigation frameworks across all departmental activities.',
    weighting: '25'
  },
  {
    id: 'dir-row-3',
    competency: 'Financial & Budgetary Management',
    components: 'Departmental budget oversight, expenditure controls, procurement alignment, variance tracking',
    definition: 'Manages departmental financial resources prudently in strict compliance with the MFMA and SCM regulations.',
    weighting: '20'
  },
  {
    id: 'dir-row-4',
    competency: 'People & Performance Management',
    components: 'Staff development, performance appraisals, labor harmony, consequence management',
    definition: 'Develops human capital, oversees performance metrics, and maintains productive workplace culture.',
    weighting: '15'
  },
  {
    id: 'dir-row-5',
    competency: 'Programme & Project Governance',
    components: 'Project milestone tracking, contractor oversight, capital project delivery, service delivery monitoring',
    definition: 'Oversees the effective execution of municipal projects and quality assurance of service delivery outputs.',
    weighting: '15'
  }
];

const DEFAULT_CFO_COMPETENCIES = [
  {
    id: 'cfo-row-1',
    competency: 'Strategic Financial Management',
    components: 'Financial planning, forecasting, policy formulation, capital program management',
    definition: 'Ability to align financial resources with strategic institutional goals and SDF/IDP priorities.',
    weighting: '25'
  },
  {
    id: 'cfo-row-2',
    competency: 'Operational Financial Management',
    components: 'Budget preparation, cash-flow monitoring, expenditure control, in-year reporting',
    definition: 'Directs and monitors all operational budget parameters to maintain solvency and clean audit outcomes.',
    weighting: '25'
  },
  {
    id: 'cfo-row-3',
    competency: 'Governance, Risk & Compliance (GRC)',
    components: 'Internal controls, MFMA compliance, risk registers, audit action plans, Treasury guidelines',
    definition: 'Formulates and enforces compliance with the Municipal Finance Management Act (MFMA) and municipal regulations.',
    weighting: '20'
  },
  {
    id: 'cfo-row-4',
    competency: 'Supply Chain Management (SCM)',
    components: 'Procurement policy, bid committee oversight, demand planning, supplier monitoring',
    definition: 'Guides procurement structures to ensure fair, equitable, transparent, competitive, and cost-effective acquisition.',
    weighting: '15'
  },
  {
    id: 'cfo-row-5',
    competency: 'Financial Reporting & Auditing',
    components: 'Annual Financial Statements (AFS), liaison with Auditor-General, mSCOA alignment',
    definition: 'Directs timeous preparation and submission of accurate statutory financial reports.',
    weighting: '15'
  }
];

const DEFAULT_MM_COMPETENCIES = [
  {
    id: 'mm-row-1',
    competency: 'Strategic Capability & Institutional Leadership',
    components: 'Executive governance, IDP integration, Council directive execution, organizational strategy',
    definition: 'Provides authoritative administrative leadership, translates political vision into institutional strategy, and coordinates overall municipal administration.',
    weighting: '25'
  },
  {
    id: 'mm-row-2',
    competency: 'Financial Governance & Fiscal Sustainability',
    components: 'Accounting officer responsibilities, clean audit oversight, resource allocation, budget approval',
    definition: 'Fulfills accounting officer responsibilities under the MFMA, ensuring fiscal prudence, financial viability, and transparent public expenditure.',
    weighting: '25'
  },
  {
    id: 'mm-row-3',
    competency: 'Service Delivery & Infrastructure Oversight',
    components: 'SDBIP Top Layer accountability, bulk infrastructure governance, community impact tracking',
    definition: 'Directs institutional service delivery performance to ensure equitable, efficient, and uninterrupted municipal services to all communities.',
    weighting: '20'
  },
  {
    id: 'mm-row-4',
    competency: 'People & Institutional Transformation',
    components: 'Section 56/57 performance contracts, workforce stability, organizational transformation, labor harmony',
    definition: 'Steers organizational development, holds executive directors accountable to statutory scorecards, and fosters an ethical, high-performance culture.',
    weighting: '15'
  },
  {
    id: 'mm-row-5',
    competency: 'Governance, Ethics & Intergovernmental Relations',
    components: 'Council reporting, IGR forums, community consultation, statutory compliance, anti-corruption frameworks',
    definition: 'Champions moral competence, institutional integrity, risk mitigation, and proactive intergovernmental collaboration.',
    weighting: '15'
  }
];

const DEFAULT_PED_COMPETENCIES = [
  {
    id: 'ped-row-1',
    competency: 'Strategic Land Use & Spatial Planning',
    components: 'Spatial Development Framework (SDF), Land Use Management Scheme (LUMS), GIS Alignment',
    definition: 'Formulates and implements integrated spatial strategies and land-use policies aligned with municipal development goals.',
    weighting: '25'
  },
  {
    id: 'ped-row-2',
    competency: 'Local Economic Development (LED)',
    components: 'LED Strategy, SMME support, job creation programs, investment promotion, tourism coordination',
    definition: 'Designs and executes programs that stimulate sustainable local economic growth, competitiveness, and enterprise support.',
    weighting: '25'
  },
  {
    id: 'ped-row-3',
    competency: 'Integrated Human Settlements',
    components: 'Housing needs assessment, informal settlement upgrading, social housing oversight',
    definition: 'Coordinates housing development strategies to deliver sustainable and well-located human settlements.',
    weighting: '20'
  },
  {
    id: 'ped-row-4',
    competency: 'Project Portfolio Management (PED)',
    components: 'MIG projects, economic infrastructure projects, development progress tracking, CapEx control',
    definition: 'Directs the execution of human settlements, land use, and LED capital projects effectively.',
    weighting: '15'
  },
  {
    id: 'ped-row-5',
    competency: 'Intergovernmental Relations & Funding Alignment',
    components: 'Community consultation, public-private partnerships, MIG & grant fund utilization',
    definition: 'Leverages inter-governmental programs and funding models to implement economic growth policies.',
    weighting: '15'
  }
];

const DEFAULT_CORP_COMPETENCIES = [
  {
    id: 'corp-row-1',
    competency: 'Human Capital & Workforce Strategy',
    components: 'Workplace Skills Plan (WSP), Employment Equity, talent acquisition, performance coaching',
    definition: 'Formulates and guides the institutional talent framework and human resources development systems.',
    weighting: '25'
  },
  {
    id: 'corp-row-2',
    competency: 'Labor Relations & Dispute Resolution',
    components: 'Local Labour Forum (LLF), disciplinary hearings, grievance management, SALGBC compliance',
    definition: 'Maintains healthy collective bargaining relations and statutory municipal labor harmony.',
    weighting: '25'
  },
  {
    id: 'corp-row-3',
    competency: 'ICT Governance & Digital Transformation',
    components: 'Corporate ICT governance policy, cybersecurity safeguards, network continuity, digital archiving',
    definition: 'Directs information systems modernization and information security safeguarding.',
    weighting: '20'
  },
  {
    id: 'corp-row-4',
    competency: 'Records & Statutory Document Archives',
    components: 'Registry management, National Archives Act compliance, PAIA compliance, electronic document tracking',
    definition: 'Directs timeous archival preservation and access control to institutional municipal records.',
    weighting: '15'
  },
  {
    id: 'corp-row-5',
    competency: 'Council Support & Auxiliary Administration',
    components: 'Council agendas, mayoral committee secretariat, fleet management, facilities security',
    definition: 'Directs reliable municipal secretariat support and facilities management services.',
    weighting: '15'
  }
];

export function CoreCompetenciesSelfEvaluation({ currentUser, activeTenantId, isTeamEvaluation }: CoreCompetenciesSelfEvaluationProps) {
  const userEmail = (currentUser?.email || 'default').toLowerCase().trim();
  const isNeda = (activeTenantId || '').toLowerCase().includes('neda') || 
    userEmail.includes('neda.gov.za') || 
    userEmail.includes('manganijp') || 
    userEmail.includes('chaukekc') || 
    userEmail.includes('chaukenh') || 
    userEmail.includes('sehlakols') || 
    userEmail.includes('ngomanennc');

  const defaultScope = isNeda
    ? (userEmail.includes('manganijp') ? 'mm' : userEmail.includes('chaukekc') ? 'cfo' : 'corp')
    : 'directors';

  const [activeScope, setActiveScope] = useState<'directors' | 'cfo' | 'mm' | 'ped' | 'corp'>(defaultScope);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Separate evaluation rows for each scope
  const [directorsRows, setDirectorsRows] = useState<CoreCompetencyEvalItem[]>([]);
  const [cfoRows, setCfoRows] = useState<CoreCompetencyEvalItem[]>([]);
  const [mmRows, setMmRows] = useState<CoreCompetencyEvalItem[]>([]);
  const [pedRows, setPedRows] = useState<CoreCompetencyEvalItem[]>([]);
  const [corpRows, setCorpRows] = useState<CoreCompetencyEvalItem[]>([]);

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);

  // Keep activeScope locked to NEDA official's true profile
  useEffect(() => {
    if (isNeda) {
      const scope = userEmail.includes('manganijp') ? 'mm' : userEmail.includes('chaukekc') ? 'cfo' : 'corp';
      setActiveScope(scope);
    }
  }, [userEmail, isNeda]);

  // Helper to get active rows array and setter
  const getActiveRowsAndSetter = () => {
    switch (activeScope) {
      case 'directors':
        return { rows: directorsRows, setRows: setDirectorsRows };
      case 'cfo':
        return { rows: cfoRows, setRows: setCfoRows };
      case 'mm':
        return { rows: mmRows, setRows: setMmRows };
      case 'ped':
        return { rows: pedRows, setRows: setPedRows };
      case 'corp':
        return { rows: corpRows, setRows: setCorpRows };
    }
  };

  const { rows: currentRows, setRows: setCurrentRows } = getActiveRowsAndSetter();

  // Load competencies and existing evaluation data
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch competencies defined in CoreCompetencies module
        const [compRes, evalRes] = await Promise.all([
          fetch(`/api/tenant/${activeTenantId}/core-competencies?userId=${encodeURIComponent(userEmail)}`),
          fetch(`/api/tenant/${activeTenantId}/core-competencies-evaluation?userId=${encodeURIComponent(userEmail)}`)
        ]);

        let compData: any = {};
        if (compRes.ok) {
          try { compData = await compRes.json(); } catch (e) {}
        }

        let evalData: any = {};
        if (evalRes.ok) {
          try {
            const parsed = await evalRes.json();
            evalData = parsed.evaluation || {};
          } catch (e) {}
        }

        if (!active) return;

        // Helper to merge rows with evaluation
        const mergeWithEval = (rawList: any[], categoryKey: 'directors' | 'cfo' | 'mm' | 'ped' | 'corp', defaultPrefix: string) => {
          return rawList.map((item: any, idx: number) => {
            const id = item.id || `${defaultPrefix}-row-${idx + 1}`;
            const savedEval = evalData[categoryKey]?.[id] || (evalData[`${categoryKey}Rows`]?.find((r: any) => r.id === id)) || {};
            return {
              id,
              competency: item.competency || `${categoryKey.toUpperCase()} Competency ${idx + 1}`,
              components: item.components || '',
              definition: item.definition || '',
              weighting: item.weighting || '20',
              q1: savedEval.q1 || (item.poeFile ? { ...createDefaultQuarterData(item.poeDescription), poeDocs: [item.poeFile] } : createDefaultQuarterData(item.poeDescription)),
              q2: savedEval.q2 || createDefaultQuarterData(item.poeDescription),
              q3: savedEval.q3 || createDefaultQuarterData(item.poeDescription),
              q4: savedEval.q4 || createDefaultQuarterData(item.poeDescription),
            };
          });
        };

        const isCleared = Boolean(compData.isCleared || compData.cleared);

        // Initialize Directors rows
        const rawDirectors = isCleared 
          ? (compData.directorItems || [])
          : ((compData.directorItems && Array.isArray(compData.directorItems) && compData.directorItems.length > 0)
            ? compData.directorItems
            : DEFAULT_DIRECTORS_COMPETENCIES);
        setDirectorsRows(mergeWithEval(rawDirectors, 'directors', 'dir'));

        // Initialize CFO rows
        const rawCfo = isCleared 
          ? (compData.cfoItems || [])
          : ((compData.cfoItems && Array.isArray(compData.cfoItems) && compData.cfoItems.length > 0)
            ? compData.cfoItems
            : DEFAULT_CFO_COMPETENCIES);
        setCfoRows(mergeWithEval(rawCfo, 'cfo', 'cfo'));

        // Initialize Municipal Managers (MM) rows
        const rawMm = isCleared 
          ? (compData.mmItems || [])
          : ((compData.mmItems && Array.isArray(compData.mmItems) && compData.mmItems.length > 0)
            ? compData.mmItems
            : DEFAULT_MM_COMPETENCIES);
        setMmRows(mergeWithEval(rawMm, 'mm', 'mm'));

        // Initialize PED rows
        const rawPed = isCleared 
          ? (compData.pedItems || [])
          : ((compData.pedItems && Array.isArray(compData.pedItems) && compData.pedItems.length > 0)
            ? compData.pedItems
            : DEFAULT_PED_COMPETENCIES);
        setPedRows(mergeWithEval(rawPed, 'ped', 'ped'));

        // Initialize Corporate Services rows
        const rawCorp = isCleared 
          ? (compData.corporateServicesItems || [])
          : ((compData.corporateServicesItems && Array.isArray(compData.corporateServicesItems) && compData.corporateServicesItems.length > 0)
            ? compData.corporateServicesItems
            : DEFAULT_CORP_COMPETENCIES);
        setCorpRows(mergeWithEval(rawCorp, 'corp', 'corp'));

      } catch (err) {
        console.error("Error loading Core Competencies Self Evaluation data:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [activeTenantId, userEmail]);

  // Persist evaluation state to server/Supabase
  const handleSaveToDatabase = async (overrideState?: {
    directors?: CoreCompetencyEvalItem[];
    cfo?: CoreCompetencyEvalItem[];
    mm?: CoreCompetencyEvalItem[];
    ped?: CoreCompetencyEvalItem[];
    corp?: CoreCompetencyEvalItem[];
  }) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const dirToSave = overrideState?.directors || directorsRows;
      const cfoToSave = overrideState?.cfo || cfoRows;
      const mmToSave = overrideState?.mm || mmRows;
      const pedToSave = overrideState?.ped || pedRows;
      const corpToSave = overrideState?.corp || corpRows;

      const serializeCategory = (items: CoreCompetencyEvalItem[]) => {
        const obj: Record<string, any> = {};
        items.forEach(it => {
          obj[it.id] = {
            q1: it.q1,
            q2: it.q2,
            q3: it.q3,
            q4: it.q4
          };
        });
        return obj;
      };

      const payload = {
        evaluation: {
          directors: serializeCategory(dirToSave),
          cfo: serializeCategory(cfoToSave),
          mm: serializeCategory(mmToSave),
          ped: serializeCategory(pedToSave),
          corp: serializeCategory(corpToSave),
          directorsRows: dirToSave,
          cfoRows: cfoToSave,
          mmRows: mmToSave,
          pedRows: pedToSave,
          corpRows: corpToSave,
          lastUpdated: new Date().toISOString()
        }
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies-evaluation?userId=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Server error saving evaluation");
      setSaveMessage({ text: "✓ Core Competencies Evaluation saved successfully to Supabase!", type: 'success' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (e: any) {
      console.error("Error saving core competencies evaluation:", e);
      setSaveMessage({ text: `Failed to save: ${e.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Update a field in the current row's active quarter
  const updateQuarterField = (rowId: string, field: keyof CompetencyEvaluationQuarterData, value: any) => {
    const updated = currentRows.map(r => {
      if (r.id !== rowId) return r;
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          [field]: value
        }
      };
    });

    setCurrentRows(updated);
    
    // Auto-save debounce state
    const override = { [activeScope]: updated };
    handleSaveToDatabase(override);
  };

  // Upload PoE Document handler
  const handlePoeFileUpload = (rowId: string, filesList: FileList | File[]) => {
    const filesArray = Array.from(filesList);
    if (filesArray.length === 0) return;

    const file = filesArray[0];
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newDoc: PoeDocument = {
        id: `poe-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        mimeType: file.type || getMimeTypeForFile(file.name),
        size: file.size,
        dataUrl: dataUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.name || currentUser?.email || 'Self Evaluator'
      };

      const targetRow = currentRows.find(r => r.id === rowId);
      const existingDocs = targetRow?.[selectedQuarter]?.poeDocs || [];
      const updatedDocs = [...existingDocs, newDoc];

      updateQuarterField(rowId, 'poeDocs', updatedDocs);
    };

    reader.readAsDataURL(file);
  };

  // Remove PoE Document
  const handleRemovePoeDoc = (rowId: string, docId?: string) => {
    const targetRow = currentRows.find(r => r.id === rowId);
    const existingDocs = targetRow?.[selectedQuarter]?.poeDocs || [];
    const updatedDocs = existingDocs.filter(d => d.id !== docId);
    updateQuarterField(rowId, 'poeDocs', updatedDocs);
  };

  // View Document in OfficeDocumentViewer
  const handleViewDoc = (doc: PoeDocument, row: CoreCompetencyEvalItem) => {
    setPreviewDoc({
      ...doc,
      kpiName: `${row.competency} (${activeScope.toUpperCase()} Core Competency)`,
      quarter: selectedQuarter.toUpperCase()
    });
  };

  // Download Document in exact original file format
  const handleDownloadDoc = async (doc: PoeDocument, row: CoreCompetencyEvalItem) => {
    await downloadOriginalFile(doc.name, doc.dataUrl, {
      mimeType: doc.mimeType,
      kpiName: row.competency,
      quarter: selectedQuarter.toUpperCase()
    });
  };

  // Push all to Line Manager for Approval
  const handlePushToManager = async () => {
    const unrated = currentRows.some(r => {
      const score = r[selectedQuarter]?.selfScore;
      return !score || score < 1 || score > 5;
    });

    if (unrated) {
      alert(`Please ensure all ${activeScope.toUpperCase()} Core Competencies have a self score between 1 and 5 before submitting for ${selectedQuarter.toUpperCase()}.`);
      return;
    }

    const updated = currentRows.map(r => {
      const qData = r[selectedQuarter];
      return {
        ...r,
        [selectedQuarter]: {
          ...qData,
          status: 'pending_approval' as const
        }
      };
    });

    setCurrentRows(updated);
    await handleSaveToDatabase({ [activeScope]: updated });

    // Send notification to manager
    try {
      const isShabanguUser = (currentUser.email || '').toLowerCase().includes('shabangusm');
      const targetManager = isShabanguUser ? 'mahlanguml@nkangaladm.gov.za' : (currentUser.managerEmail || 'khuboniy@nkangaladm.gov.za');
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            id: `notif_cc_${Date.now()}`,
            userEmail: targetManager,
            recipientEmail: targetManager,
            recipientName: targetManager.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.fullName || currentUser.email,
            type: 'core_competencies_submission',
            title: `${activeScope.toUpperCase()} Core Competencies Self-Evaluation Submitted (${selectedQuarter.toUpperCase()})`,
            message: `${currentUser.name || currentUser.email} has completed and submitted their ${activeScope.toUpperCase()} Core Competencies Self Evaluation for ${selectedQuarter.toUpperCase()} with all supporting portfolios of evidence.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) {
      console.warn("Failed to dispatch manager notification:", e);
    }

    alert(`Successfully pushed ${activeScope.toUpperCase()} Core Competencies for ${selectedQuarter.toUpperCase()} to Line Manager for approval!`);
  };

  // Push single competency to manager
  const handlePushSingleToManager = async (rowId: string) => {
    const target = currentRows.find(r => r.id === rowId);
    const score = target?.[selectedQuarter]?.selfScore;
    if (!score || score < 1 || score > 5) {
      alert(`Please select a self score between 1 and 5 for ${target?.competency || 'this competency'} first.`);
      return;
    }

    const updated = currentRows.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        [selectedQuarter]: {
          ...r[selectedQuarter],
          status: 'pending_approval' as const
        }
      };
    });

    setCurrentRows(updated);
    await handleSaveToDatabase({ [activeScope]: updated });
    alert(`Competency "${target?.competency}" pushed to Line Manager for approval!`);
  };

  // Redo evaluation (unlocks draft status)
  const handleRedoEvaluation = async () => {
    const updated = currentRows.map(r => ({
      ...r,
      [selectedQuarter]: {
        ...r[selectedQuarter],
        status: 'draft' as const
      }
    }));

    setCurrentRows(updated);
    await handleSaveToDatabase({ [activeScope]: updated });
    alert(`${activeScope.toUpperCase()} Core Competencies evaluation for ${selectedQuarter.toUpperCase()} unlocked for revision!`);
  };

  // Export Core Competencies Evaluation to Excel
  const handleExportExcel = () => {
    const headers = [
      "No.",
      "Scope",
      "Competency Title",
      "Components / Sub-competencies",
      "Competency Definition",
      "Weighting %",
      `${selectedQuarter.toUpperCase()} Self Score (1-5)`,
      `${selectedQuarter.toUpperCase()} Self Comments / Motivation`,
      `${selectedQuarter.toUpperCase()} PoE Description`,
      `${selectedQuarter.toUpperCase()} Attached Evidence Files`,
      `${selectedQuarter.toUpperCase()} Line Manager Score`,
      `${selectedQuarter.toUpperCase()} Line Manager Motivation`,
      `${selectedQuarter.toUpperCase()} Audit Verification`,
      `${selectedQuarter.toUpperCase()} Status`
    ];

    const dataRows = currentRows.map((r, idx) => {
      const q = r[selectedQuarter];
      const filesStr = (q.poeDocs || []).map(f => f.name).join('; ');
      return [
        idx + 1,
        activeScope.toUpperCase(),
        r.competency,
        r.components,
        r.definition,
        r.weighting,
        q.selfScore || '',
        q.selfComments || '',
        q.poeDescription || '',
        filesStr || 'None attached',
        q.managerScore || '',
        q.managerMotivation || '',
        q.internalAuditorScore ? `${q.internalAuditorScore}/5 (${q.internalAuditorComments || 'Audited'})` : 'Pending',
        q.status.toUpperCase()
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([
      [`Nkangala District Municipality - ${activeScope.toUpperCase()} Core Competencies Self-Evaluation`],
      [`Official: ${currentUser.name || currentUser.fullName || currentUser.email} | Quarter: ${selectedQuarter.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`],
      [],
      headers,
      ...dataRows
    ]);

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 32 },
      { wch: 40 },
      { wch: 50 },
      { wch: 14 },
      { wch: 18 },
      { wch: 35 },
      { wch: 35 },
      { wch: 30 },
      { wch: 18 },
      { wch: 35 },
      { wch: 25 },
      { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${activeScope.toUpperCase()} Competencies`);
    XLSX.writeFile(workbook, `Core_Competencies_Evaluation_${activeScope}_${selectedQuarter.toUpperCase()}_${activeTenantId}.xlsx`);
  };

  // Helper icon for attached files
  const getFileIcon = (mimeType: string, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['ppt', 'pptx', 'pps'].includes(ext) || mimeType.includes('presentation')) {
      return <Presentation className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
    }
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      return <Image className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    }
    if (['doc', 'docx', 'rtf', 'txt'].includes(ext) || mimeType.includes('word') || mimeType.includes('text')) {
      return <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  };

  // Calculation Metrics
  const ratedCount = currentRows.filter(r => (r[selectedQuarter]?.selfScore || 0) > 0).length;
  const totalCount = currentRows.length;
  const avgScore = totalCount > 0 
    ? (currentRows.reduce((sum, r) => sum + (r[selectedQuarter]?.selfScore || 0), 0) / (ratedCount || 1)).toFixed(1) 
    : '0.0';

  const totalWeight = currentRows.reduce((sum, r) => sum + (parseFloat(r.weighting) || 0), 0);

  const weightedScore = currentRows.reduce((sum, r) => {
    const w = parseFloat(r.weighting) || 0;
    const score = r[selectedQuarter]?.selfScore || 0;
    return sum + ((score / 5) * w);
  }, 0).toFixed(1);

  const isScopeLocked = currentRows.some(r => r[selectedQuarter]?.status === 'pending_approval' || r[selectedQuarter]?.status === 'approved');

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Core Competencies Evaluation Grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Statutory IPMS Assessment
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              Cycle: 2025/2026
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Core Competencies Self-Evaluation
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Evaluate your core competencies across Directors, CFO, Municipal Manager, PED, and Corporate Services. Provide detailed ratings, motivations, and upload multi-format Portfolios of Evidence (Word, Excel, PowerPoint, Notepad, PDF, Images).
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-300"
            title="Download Excel Spreadsheet of Core Competencies Evaluation"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export to Excel</span>
          </button>

          {isScopeLocked ? (
            <button
              type="button"
              onClick={handleRedoEvaluation}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              title="Unlock evaluation to update self scores and evidence"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Redo Evaluation</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePushToManager}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Push all rated competencies to Line Manager for approval"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Push to Manager for Approval</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveToDatabase()}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save to Supabase'}</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{saveMessage.text}</span>
          <button onClick={() => setSaveMessage(null)} className="font-extrabold text-sm px-2 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Scope Navigation Switcher (Directors, CFO, Municipal Manager, PED, Corporate Services) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {isNeda ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
              {currentUser.fullName || currentUser.name || userEmail} — NEDA Core Competencies Self-Evaluation
            </span>
            <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              {currentRows.length} Competencies Active
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap">
            <button
              type="button"
              onClick={() => setActiveScope('directors')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                activeScope === 'directors' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Directors Core Competencies ({directorsRows.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScope('cfo')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                activeScope === 'cfo' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>CFOs Core Competencies ({cfoRows.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScope('mm')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                activeScope === 'mm' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Municipal Managers Core Competencies ({mmRows.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScope('ped')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                activeScope === 'ped' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>PED Core Competencies ({pedRows.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScope('corp')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                activeScope === 'corp' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Corporate Services Core Competencies ({corpRows.length})</span>
            </button>
          </div>
        )}

        {/* Quarter Switcher */}
        <div className="flex items-center gap-1">
          {(['q1', 'q2', 'q3', 'q4'] as const).map(q => (
            <button
              key={q}
              type="button"
              onClick={() => setSelectedQuarter(q)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                selectedQuarter === q
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {q.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics & Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Weight</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalWeight}%</div>
            <span className={`text-[10px] font-bold ${totalWeight === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {totalWeight === 100 ? '✓ Balanced (100%)' : '⚠ Must equal 100%'}
            </span>
          </div>
          <ShieldCheck className={`w-8 h-8 ${totalWeight === 100 ? 'text-emerald-500' : 'text-amber-500'}`} />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{selectedQuarter.toUpperCase()} Rated Progress</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{ratedCount} / {totalCount}</div>
            <span className="text-[10px] font-bold text-indigo-600">
              {totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0}% Evaluated
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-indigo-500" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Average Rating</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{avgScore} / 5.0</div>
            <span className="text-[10px] font-bold text-slate-500">
              Across rated competencies
            </span>
          </div>
          <Award className="w-8 h-8 text-amber-500" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Weighted Performance</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{weightedScore}%</div>
            <span className="text-[10px] font-bold text-purple-600">
              Out of 100% potential
            </span>
          </div>
          <Sparkles className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      {/* Main Competency Evaluation Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {isNeda 
                ? `${currentUser.fullName || currentUser.name || userEmail} — NEDA Core Competencies Self-Evaluation (${selectedQuarter.toUpperCase()})`
                : (activeScope === 'directors' ? 'Directors Specific Core Competencies Matrix' :
                   activeScope === 'cfo' ? 'Chief Financial Officer (CFO) Specific Core Competencies Matrix' :
                   activeScope === 'mm' ? 'Municipal Manager (MM) Specific Core Competencies Matrix' :
                   activeScope === 'ped' ? 'PED Specific Core Competencies Matrix' :
                   'Corporate Services Specific Core Competencies Matrix') + ` (${selectedQuarter.toUpperCase()})`}
            </h3>
          </div>
          <div className="text-[10px] font-bold text-slate-500">
            Click score to rate (1 - 5) • Attach PoE documents for audit compliance
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-100/70 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-3 border-r border-slate-200 w-12 text-center">No.</th>
                <th className="p-3 border-r border-slate-200 w-1/5">Competency &amp; Components</th>
                <th className="p-3 border-r border-slate-200 w-1/4">Definition</th>
                <th className="p-3 border-r border-slate-200 w-20 text-center">Weight %</th>
                <th className="p-3 border-r border-slate-200 w-36 text-center">Self Score (1-5)</th>
                <th className="p-3 border-r border-slate-200 w-1/5">Self Evaluation Comments</th>
                <th className="p-3 border-r border-slate-200 w-72">Portfolio of Evidence (PoE)</th>
                <th className="p-3 border-r border-slate-200 w-36 text-center">Audit Status</th>
                <th className="p-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, idx) => {
                const qData = row[selectedQuarter] || createDefaultQuarterData();
                const isItemLocked = qData.status === 'pending_approval' || qData.status === 'approved';

                return (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition group">
                    <td className="p-3 border-r border-slate-100 text-center font-mono font-bold text-slate-400 text-xs align-top">
                      {idx + 1}
                    </td>

                    {/* Competency & Components */}
                    <td className="p-3 border-r border-slate-100 align-top">
                      <div className="font-extrabold text-xs text-slate-900 leading-snug">
                        {row.competency}
                      </div>
                      {row.components && (
                        <div className="text-[10px] text-slate-500 mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <strong className="text-slate-700">Components:</strong> {row.components}
                        </div>
                      )}
                    </td>

                    {/* Definition */}
                    <td className="p-3 border-r border-slate-100 align-top text-xs text-slate-600 leading-relaxed">
                      {row.definition || <span className="text-slate-400 italic">No definition specified</span>}
                    </td>

                    {/* Weighting */}
                    <td className="p-3 border-r border-slate-100 text-center align-top font-mono font-black text-xs text-indigo-700 bg-indigo-50/20">
                      {row.weighting}%
                    </td>

                    {/* Self Score (1-5) */}
                    <td className="p-3 border-r border-slate-100 align-top text-center">
                      <select
                        value={qData.selfScore || ''}
                        disabled={isItemLocked}
                        onChange={(e) => updateQuarterField(row.id, 'selfScore', parseInt(e.target.value) || 0)}
                        className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs font-black outline-none transition cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed ${
                          qData.selfScore >= 4 ? 'border-emerald-500 text-emerald-800' :
                          qData.selfScore >= 3 ? 'border-blue-500 text-blue-800' :
                          qData.selfScore >= 1 ? 'border-amber-500 text-amber-800' :
                          'border-slate-300 text-slate-500'
                        }`}
                      >
                        <option value="">Select Score</option>
                        <option value="1">1 - Unsatisfactory</option>
                        <option value="2">2 - Basic Competence</option>
                        <option value="3">3 - Fully Competent</option>
                        <option value="4">4 - Highly Effective</option>
                        <option value="5">5 - Outstanding</option>
                      </select>
                      {qData.selfScore > 0 && (
                        <span className="text-[9.5px] font-bold text-slate-400 block mt-1">
                          Rating: {qData.selfScore}/5 ({(qData.selfScore * 20)}%)
                        </span>
                      )}
                    </td>

                    {/* Self Evaluation Comments */}
                    <td className="p-3 border-r border-slate-100 align-top">
                      <textarea
                        value={qData.selfComments || ''}
                        disabled={isItemLocked}
                        onChange={(e) => updateQuarterField(row.id, 'selfComments', e.target.value)}
                        placeholder={isItemLocked ? "No comment added." : "Enter self evaluation comments & motivation..."}
                        className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 outline-none resize-y min-h-[60px] disabled:bg-slate-100 transition"
                      />
                    </td>

                    {/* Portfolio of Evidence (PoE) */}
                    <td className="p-3 border-r border-slate-100 align-top">
                      <div className="space-y-2">
                        {/* PoE Description */}
                        <input
                          type="text"
                          value={qData.poeDescription || ''}
                          disabled={isItemLocked}
                          onChange={(e) => updateQuarterField(row.id, 'poeDescription', e.target.value)}
                          placeholder="Describe supporting proof of competency..."
                          className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 outline-none transition disabled:bg-slate-100"
                        />

                        {/* Drag / Upload Button */}
                        {!isItemLocked && (
                          <div>
                            <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-lg cursor-pointer transition text-[11px] font-bold text-slate-600">
                              <Upload className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Upload PoE Document</span>
                              <input
                                type="file"
                                className="hidden"
                                accept=".doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.pdf,.txt,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handlePoeFileUpload(row.id, e.target.files);
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <span className="text-[8px] text-slate-400 block text-center mt-0.5">
                              Word, Excel, PowerPoint, Notepad, PDF, Images
                            </span>
                          </div>
                        )}

                        {/* Uploaded Documents List */}
                        {qData.poeDocs && qData.poeDocs.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {qData.poeDocs.map((doc, docIdx) => (
                              <div
                                key={doc.id || `doc-${docIdx}`}
                                className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs hover:bg-slate-100 transition"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  {getFileIcon(doc.mimeType, doc.name)}
                                  <span className="font-semibold text-slate-700 truncate block max-w-[130px]" title={doc.name}>
                                    {doc.name}
                                  </span>
                                  <span className="text-[8.5px] font-mono uppercase bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-bold">
                                    {doc.name.split('.').pop()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleViewDoc(doc, row)}
                                    className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition cursor-pointer"
                                    title="View Document (Word, Excel, PPT, Notepad, PDF, Images)"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDoc(doc, row)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition cursor-pointer"
                                    title="Download Document in Exact Format"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  {!isItemLocked && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePoeDoc(row.id, doc.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-100 rounded transition cursor-pointer"
                                      title="Remove Document"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Audit Status */}
                    <td className="p-3 border-r border-slate-100 align-top text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        qData.status === 'approved' || qData.status === 'audited' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        qData.status === 'pending_approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {qData.status === 'pending_approval' ? 'Pending Approval' : qData.status}
                      </span>

                      {qData.managerScore ? (
                        <div className="mt-1 text-[9px] text-slate-500">
                          Manager Score: <strong className="text-slate-800">{qData.managerScore}/5</strong>
                        </div>
                      ) : null}
                    </td>

                    {/* Action Column */}
                    <td className="p-3 align-middle text-center">
                      {!isItemLocked ? (
                        <button
                          type="button"
                          onClick={() => handlePushSingleToManager(row.id)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-200 transition cursor-pointer"
                          title="Submit this single competency to manager"
                        >
                          Submit
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Office Document Viewer Modal */}
      {previewDoc && (
        <OfficeDocumentViewer
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Core Competencies Manager Approval Section
// ----------------------------------------------------------------------
export function CoreCompetenciesManagerApprovalSection({
  currentUser,
  activeTenantId,
  defaultEmployeeEmail
}: {
  currentUser: any;
  activeTenantId: string;
  defaultEmployeeEmail?: string;
}) {
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [reviewScope, setReviewScope] = useState<'directors' | 'cfo' | 'mm' | 'ped' | 'corp'>('directors');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(defaultEmployeeEmail || '');
  const [subordinates, setSubordinates] = useState<Array<{ email: string; name: string }>>([]);
  const [rows, setRows] = useState<CoreCompetencyEvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

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
            const sub = list.find((s) => s.email !== currentUser.email?.toLowerCase().trim()) || list[0];
            if (sub) setSelectedUserEmail(sub.email);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch team for manager core competency review:", err);
      }
    };
    if (activeTenantId) fetchTeam();
    return () => { active = false; };
  }, [activeTenantId, defaultEmployeeEmail, currentUser.email]);

  useEffect(() => {
    let active = true;
    const fetchEval = async () => {
      const emailToFetch = selectedUserEmail || defaultEmployeeEmail || currentUser.email || '';
      if (!emailToFetch) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies-evaluation?userId=${encodeURIComponent(emailToFetch)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          const evalData = data.evaluation || {};
          let rawLoaded: any[] = [];
          if (reviewScope === 'directors') rawLoaded = evalData.directorsRows || (evalData.directors ? Object.values(evalData.directors) : []);
          else if (reviewScope === 'cfo') rawLoaded = evalData.cfoRows || (evalData.cfo ? Object.values(evalData.cfo) : []);
          else if (reviewScope === 'mm') rawLoaded = evalData.mmRows || (evalData.mm ? Object.values(evalData.mm) : []);
          else if (reviewScope === 'ped') rawLoaded = evalData.pedRows || (evalData.ped ? Object.values(evalData.ped) : []);
          else if (reviewScope === 'corp') rawLoaded = evalData.corpRows || (evalData.corp ? Object.values(evalData.corp) : []);

          const fallbackDefault = 
            reviewScope === 'directors' ? DEFAULT_DIRECTORS_COMPETENCIES :
            reviewScope === 'cfo' ? DEFAULT_CFO_COMPETENCIES :
            reviewScope === 'mm' ? DEFAULT_MM_COMPETENCIES :
            reviewScope === 'ped' ? DEFAULT_PED_COMPETENCIES : DEFAULT_CORP_COMPETENCIES;

          const loadedRows = (rawLoaded && rawLoaded.length > 0)
            ? rawLoaded
            : fallbackDefault.map((c, idx) => ({
                ...c,
                q1: createDefaultQuarterData(),
                q2: createDefaultQuarterData(),
                q3: createDefaultQuarterData(),
                q4: createDefaultQuarterData()
              }));
          setRows(loadedRows);
        }
      } catch (err) {
        console.warn("Using default competencies for manager core competency review:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchEval();
    return () => { active = false; };
  }, [activeTenantId, selectedUserEmail, currentUser.email, defaultEmployeeEmail, reviewScope]);

  const handleSaveToDatabase = async (updatedRows: CoreCompetencyEvalItem[]) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/core-competencies-evaluation?userId=${encodeURIComponent(emailToSave)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation: {
            [`${reviewScope}Rows`]: updatedRows,
            lastUpdatedBy: currentUser.email,
            updatedAt: new Date().toISOString()
          }
        })
      });
    } catch (err) {
      console.error("Error saving manager core competency review to Supabase:", err);
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
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: { ...qData, status: 'draft' as const }
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
            id: `notif_cc_redo_${Date.now()}`,
            userEmail: emailToSave,
            recipientEmail: emailToSave,
            recipientName: emailToSave.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'cc_redo_request',
            actionType: 'redo_request',
            title: `Core Competency Returned for Redo (${selectedQuarter.toUpperCase()})`,
            message: `Your Line Manager (${currentUser.name || currentUser.email}) has returned your Core Competencies evaluation for ${selectedQuarter.toUpperCase()} for redo and resubmission.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) { console.error("Failed notification:", e); }
    alert(`Successfully returned ${selectedQuarter.toUpperCase()} Core Competencies evaluation to ${emailToSave} for redo!`);
  };

  const handleManagerApprove = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    const unrated = rows.some(r => {
      const mScore = r[selectedQuarter]?.managerScore;
      return !mScore || mScore < 1 || mScore > 5;
    });
    if (unrated) {
      alert(`Please assign a manager score between 1 and 5 for all core competency rows for ${selectedQuarter.toUpperCase()}.`);
      return;
    }
    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: { ...qData, status: 'approved' as const }
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
            id: `notif_cc_approved_${Date.now()}`,
            userEmail: emailToSave,
            recipientEmail: emailToSave,
            recipientName: emailToSave.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'cc_approval',
            actionType: 'approval',
            title: `Core Competencies Approved (${selectedQuarter.toUpperCase()})`,
            message: `Your Line Manager (${currentUser.name || currentUser.email}) has reviewed and approved your Core Competencies evaluation for ${selectedQuarter.toUpperCase()}.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) { console.error("Failed notification:", e); }
    alert(`Successfully approved ${selectedQuarter.toUpperCase()} Core Competencies appraisal for ${emailToSave}!`);
  };

  const handlePushToInternalAudit = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    if (!emailToSave) {
      alert("Please select an employee first.");
      return;
    }
    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: { ...qData, status: 'approved' as const }
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
            id: `notif_cc_audit_dispatch_${Date.now()}`,
            userEmail: 'internal_audit',
            recipientEmail: 'internal_audit',
            recipientName: 'Internal Audit Committee',
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'cc_audit_dispatch',
            actionType: 'audit_request',
            title: `🛡️ Core Competencies Dispatched to Internal Audit (${selectedQuarter.toUpperCase()})`,
            message: `Line Manager (${currentUser.name || currentUser.email}) approved and dispatched Core Competencies for ${emailToSave} (${selectedQuarter.toUpperCase()}) to Internal Audit Committee.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) { console.error(e); }
    alert(`Core Competencies for ${emailToSave} successfully pushed to Internal Audit Review!`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fadeIn">
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Manager Review & Score Verification (Core Competencies)</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Select Subordinate:</span>
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
              placeholder="Or type employee email..."
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
                type="button"
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition ${
                  selectedQuarter === q ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReturnForRedo}
            disabled={saving}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return for Redo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveToDatabase(rows)}
            disabled={saving}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleManagerApprove}
            disabled={saving}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Core Competencies</span>
          </button>

          <button
            type="button"
            onClick={handlePushToInternalAudit}
            disabled={saving}
            className="px-3 py-1.5 bg-indigo-900 hover:bg-slate-900 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-indigo-300" />
            <span>Push to Internal Audit</span>
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl flex-wrap">
          <button
            type="button"
            onClick={() => setReviewScope('directors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'directors' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Directors</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('cfo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'cfo' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>CFO</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('mm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'mm' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Municipal Manager</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('ped')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'ped' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>PED</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('corp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'corp' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Corporate Services</span>
          </button>
        </div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">
          Reviewing: <span className="text-indigo-600 font-extrabold">{reviewScope.toUpperCase()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Loading employee core competencies...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-3 border-r border-slate-800 w-12 text-center">#</th>
                  <th className="p-3 border-r border-slate-800 min-w-[180px]">Core Competency</th>
                  <th className="p-3 border-r border-slate-800 min-w-[220px]">Employee Self Score & Comments</th>
                  <th className="p-3 border-r border-slate-800 w-32 text-center">Manager Score (1-5)</th>
                  <th className="p-3 border-r border-slate-800 min-w-[220px]">Manager Motivation & Comments</th>
                  <th className="p-3 border-r border-slate-800 w-28 text-center">PoE Documents</th>
                  <th className="p-3 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-200">
                {rows.map((row, idx) => {
                  const qData = row[selectedQuarter] || createDefaultQuarterData();
                  return (
                    <tr key={row.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 text-center font-bold text-gray-500 border-r border-gray-100">{idx + 1}</td>
                      <td className="p-3 border-r border-gray-100">
                        <div className="font-bold text-gray-900">{row.competency}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{row.definition}</div>
                        <span className="inline-block mt-1 text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Weight: {row.weighting}%</span>
                      </td>
                      <td className="p-3 border-r border-gray-100">
                        <div className="font-bold text-indigo-900">Self Rating: {qData.selfScore || 0} / 5</div>
                        <div className="text-[11px] text-gray-700 mt-1 italic">{qData.selfComments || 'No self comments provided.'}</div>
                      </td>
                      <td className="p-3 border-r border-gray-100 text-center">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          value={qData.managerScore || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = rows.map(r => r.id === row.id ? { ...r, [selectedQuarter]: { ...r[selectedQuarter], managerScore: val } } : r);
                            setRows(updated);
                          }}
                          className="w-16 p-1.5 border border-gray-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="p-3 border-r border-gray-100">
                        <textarea
                          rows={2}
                          placeholder="Provide manager motivation / audit comments..."
                          value={qData.managerMotivation || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = rows.map(r => r.id === row.id ? { ...r, [selectedQuarter]: { ...r[selectedQuarter], managerMotivation: val } } : r);
                            setRows(updated);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="p-3 border-r border-gray-100 text-center">
                        {qData.poeDocs && qData.poeDocs.length > 0 ? (
                          <div className="space-y-1">
                            {qData.poeDocs.map((doc: any, dIdx: number) => (
                              <button
                                key={dIdx}
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="text-[10px] text-indigo-600 hover:underline block truncate max-w-[100px] mx-auto font-medium"
                              >
                                {doc.name || `Doc ${dIdx + 1}`}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No PoE</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          qData.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          qData.status === 'audited' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {qData.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewDoc && (
        <OfficeDocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Core Competencies Internal Auditor Review Section
// ----------------------------------------------------------------------
export function CoreCompetenciesAuditorReviewSection({
  currentUser,
  activeTenantId,
  defaultEmployeeEmail
}: {
  currentUser: any;
  activeTenantId: string;
  defaultEmployeeEmail?: string;
}) {
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [reviewScope, setReviewScope] = useState<'directors' | 'cfo' | 'mm' | 'ped' | 'corp'>('directors');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(defaultEmployeeEmail || '');
  const [subordinates, setSubordinates] = useState<Array<{ email: string; name: string }>>([]);
  const [rows, setRows] = useState<CoreCompetencyEvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

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
            const sub = list.find((s) => s.email !== currentUser.email?.toLowerCase().trim()) || list[0];
            if (sub) setSelectedUserEmail(sub.email);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch team for internal audit core competency review:", err);
      }
    };
    if (activeTenantId) fetchTeam();
    return () => { active = false; };
  }, [activeTenantId, defaultEmployeeEmail, currentUser.email]);

  useEffect(() => {
    let active = true;
    const fetchEval = async () => {
      const emailToFetch = selectedUserEmail || defaultEmployeeEmail || currentUser.email || '';
      if (!emailToFetch) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies-evaluation?userId=${encodeURIComponent(emailToFetch)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          const evalData = data.evaluation || {};
          let rawLoaded: any[] = [];
          if (reviewScope === 'directors') rawLoaded = evalData.directorsRows || (evalData.directors ? Object.values(evalData.directors) : []);
          else if (reviewScope === 'cfo') rawLoaded = evalData.cfoRows || (evalData.cfo ? Object.values(evalData.cfo) : []);
          else if (reviewScope === 'mm') rawLoaded = evalData.mmRows || (evalData.mm ? Object.values(evalData.mm) : []);
          else if (reviewScope === 'ped') rawLoaded = evalData.pedRows || (evalData.ped ? Object.values(evalData.ped) : []);
          else if (reviewScope === 'corp') rawLoaded = evalData.corpRows || (evalData.corp ? Object.values(evalData.corp) : []);

          const fallbackDefault = 
            reviewScope === 'directors' ? DEFAULT_DIRECTORS_COMPETENCIES :
            reviewScope === 'cfo' ? DEFAULT_CFO_COMPETENCIES :
            reviewScope === 'mm' ? DEFAULT_MM_COMPETENCIES :
            reviewScope === 'ped' ? DEFAULT_PED_COMPETENCIES : DEFAULT_CORP_COMPETENCIES;

          const loadedRows = (rawLoaded && rawLoaded.length > 0)
            ? rawLoaded
            : fallbackDefault.map((c, idx) => ({
                ...c,
                q1: createDefaultQuarterData(),
                q2: createDefaultQuarterData(),
                q3: createDefaultQuarterData(),
                q4: createDefaultQuarterData()
              }));
          setRows(loadedRows);
        }
      } catch (err) {
        console.warn("Using default competencies for auditor core competency review:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchEval();
    return () => { active = false; };
  }, [activeTenantId, selectedUserEmail, currentUser.email, defaultEmployeeEmail, reviewScope]);

  const handleSaveToDatabase = async (updatedRows: CoreCompetencyEvalItem[]) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/core-competencies-evaluation?userId=${encodeURIComponent(emailToSave)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation: {
            [`${reviewScope}Rows`]: updatedRows,
            lastUpdatedBy: currentUser.email,
            updatedAt: new Date().toISOString()
          }
        })
      });
    } catch (err) {
      console.error("Error saving auditor core competency review to Supabase:", err);
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
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: { ...qData, status: 'draft' as const }
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
            id: `notif_cc_audit_redo_${Date.now()}`,
            userEmail: emailToSave,
            recipientEmail: emailToSave,
            recipientName: emailToSave.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'cc_redo_request',
            actionType: 'redo_request',
            title: `Core Competencies Returned by Internal Audit (${selectedQuarter.toUpperCase()})`,
            message: `Internal Auditor (${currentUser.name || currentUser.email}) has returned your Core Competencies evaluation for ${selectedQuarter.toUpperCase()} for redo.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) { console.error("Failed notification:", e); }
    alert(`Successfully returned ${selectedQuarter.toUpperCase()} Core Competencies to ${emailToSave} for redo!`);
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
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: { ...qData, status: 'audited' as const }
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
            id: `notif_cc_audited_${Date.now()}`,
            userEmail: emailToSave,
            recipientEmail: emailToSave,
            recipientName: emailToSave.split('@')[0],
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'cc_audit_completed',
            actionType: 'audit',
            title: `Core Competencies Audited by Internal Audit (${selectedQuarter.toUpperCase()})`,
            message: `Internal Auditor (${currentUser.name || currentUser.email}) has completed audit review on Core Competencies for ${selectedQuarter.toUpperCase()}.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) { console.error("Failed notification:", e); }
    alert(`Successfully recorded Internal Audit review for Core Competencies (${emailToSave})!`);
  };

  const handlePushToDpmc = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    if (!emailToSave) {
      alert("Please select an employee first.");
      return;
    }
    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: { ...qData, status: 'audited' as const }
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
            id: `notif_cc_dpmc_dispatch_${Date.now()}`,
            userEmail: 'dpmc',
            recipientEmail: 'dpmc',
            recipientName: 'Department Performance Moderation Committee (DPMC)',
            senderEmail: currentUser.email,
            senderName: currentUser.name || currentUser.email,
            type: 'cc_dpmc_dispatch',
            actionType: 'dpmc_request',
            title: `🛡️ Core Competencies Dispatched to DPMC (${selectedQuarter.toUpperCase()})`,
            message: `Internal Auditor (${currentUser.name || currentUser.email}) audited and pushed Core Competencies for ${emailToSave} (${selectedQuarter.toUpperCase()}) to DPMC.`,
            read: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    } catch (e) { console.error(e); }
    alert(`Core Competencies for ${emailToSave} successfully pushed to DPMC Moderation Review!`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fadeIn">
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Internal Audit Quality Assurance Review (Core Competencies)</h3>
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
              placeholder="Or type employee email..."
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
                type="button"
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition ${
                  selectedQuarter === q ? 'bg-slate-900 text-white shadow-xs' : 'text-gray-600 hover:text-slate-900'
                }`}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReturnForRedo}
            disabled={saving}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return for Redo</span>
          </button>

          <button
            type="button"
            onClick={handleAuditorSubmit}
            disabled={saving}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Audited</span>
          </button>

          <button
            type="button"
            onClick={handlePushToDpmc}
            disabled={saving}
            className="px-3 py-1.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-purple-300" />
            <span>Push to DPMC</span>
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl flex-wrap">
          <button
            type="button"
            onClick={() => setReviewScope('directors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'directors' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Directors</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('cfo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'cfo' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>CFO</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('mm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'mm' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Municipal Manager</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('ped')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'ped' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>PED</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('corp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'corp' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Corporate Services</span>
          </button>
        </div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">
          Auditing: <span className="text-indigo-600 font-extrabold">{reviewScope.toUpperCase()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Loading core competencies for audit...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-3 border-r border-slate-800 w-12 text-center">#</th>
                  <th className="p-3 border-r border-slate-800 min-w-[180px]">Core Competency</th>
                  <th className="p-3 border-r border-slate-800 min-w-[180px]">Self & Manager Score</th>
                  <th className="p-3 border-r border-slate-800 w-36 text-center">Internal Auditor Score (1-5)</th>
                  <th className="p-3 border-r border-slate-800 min-w-[220px]">Audit Findings & Comments</th>
                  <th className="p-3 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-200">
                {rows.map((row, idx) => {
                  const qData = row[selectedQuarter] || createDefaultQuarterData();
                  return (
                    <tr key={row.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 text-center font-bold text-gray-500 border-r border-gray-100">{idx + 1}</td>
                      <td className="p-3 border-r border-gray-100">
                        <div className="font-bold text-gray-900">{row.competency}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{row.definition}</div>
                      </td>
                      <td className="p-3 border-r border-gray-100">
                        <div className="font-bold text-slate-800">Self Rating: {qData.selfScore || 0} / 5</div>
                        <div className="font-bold text-indigo-700 mt-0.5">Manager Rating: {qData.managerScore || 0} / 5</div>
                      </td>
                      <td className="p-3 border-r border-gray-100 text-center">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          value={qData.internalAuditorScore || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = rows.map(r => r.id === row.id ? { ...r, [selectedQuarter]: { ...r[selectedQuarter], internalAuditorScore: val } } : r);
                            setRows(updated);
                          }}
                          className="w-20 p-1.5 border border-gray-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                      </td>
                      <td className="p-3 border-r border-gray-100">
                        <textarea
                          rows={2}
                          placeholder="Log audit findings & comments..."
                          value={qData.internalAuditorComments || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = rows.map(r => r.id === row.id ? { ...r, [selectedQuarter]: { ...r[selectedQuarter], internalAuditorComments: val } } : r);
                            setRows(updated);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-slate-800"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          qData.status === 'audited' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {qData.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewDoc && (
        <OfficeDocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Core Competencies DPMC Moderation Review Section
// ----------------------------------------------------------------------
export function CoreCompetenciesDpmcReviewSection({
  currentUser,
  activeTenantId,
  defaultEmployeeEmail
}: {
  currentUser: any;
  activeTenantId: string;
  defaultEmployeeEmail?: string;
}) {
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [reviewScope, setReviewScope] = useState<'directors' | 'cfo' | 'mm' | 'ped' | 'corp'>('directors');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(defaultEmployeeEmail || '');
  const [subordinates, setSubordinates] = useState<Array<{ email: string; name: string }>>([]);
  const [rows, setRows] = useState<CoreCompetencyEvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

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
            const sub = list.find((s) => s.email !== currentUser.email?.toLowerCase().trim()) || list[0];
            if (sub) setSelectedUserEmail(sub.email);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch team for DPMC core competency review:", err);
      }
    };
    if (activeTenantId) fetchTeam();
    return () => { active = false; };
  }, [activeTenantId, defaultEmployeeEmail, currentUser.email]);

  useEffect(() => {
    let active = true;
    const fetchEval = async () => {
      const emailToFetch = selectedUserEmail || defaultEmployeeEmail || currentUser.email || '';
      if (!emailToFetch) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies-evaluation?userId=${encodeURIComponent(emailToFetch)}`);
        if (!res.ok) throw new Error("Failed to load server state");
        const data = await res.json();
        if (active && data) {
          const evalData = data.evaluation || {};
          let rawLoaded: any[] = [];
          if (reviewScope === 'directors') rawLoaded = evalData.directorsRows || (evalData.directors ? Object.values(evalData.directors) : []);
          else if (reviewScope === 'cfo') rawLoaded = evalData.cfoRows || (evalData.cfo ? Object.values(evalData.cfo) : []);
          else if (reviewScope === 'mm') rawLoaded = evalData.mmRows || (evalData.mm ? Object.values(evalData.mm) : []);
          else if (reviewScope === 'ped') rawLoaded = evalData.pedRows || (evalData.ped ? Object.values(evalData.ped) : []);
          else if (reviewScope === 'corp') rawLoaded = evalData.corpRows || (evalData.corp ? Object.values(evalData.corp) : []);

          const fallbackDefault = 
            reviewScope === 'directors' ? DEFAULT_DIRECTORS_COMPETENCIES :
            reviewScope === 'cfo' ? DEFAULT_CFO_COMPETENCIES :
            reviewScope === 'mm' ? DEFAULT_MM_COMPETENCIES :
            reviewScope === 'ped' ? DEFAULT_PED_COMPETENCIES : DEFAULT_CORP_COMPETENCIES;

          const loadedRows = (rawLoaded && rawLoaded.length > 0)
            ? rawLoaded
            : fallbackDefault.map((c, idx) => ({
                ...c,
                q1: createDefaultQuarterData(),
                q2: createDefaultQuarterData(),
                q3: createDefaultQuarterData(),
                q4: createDefaultQuarterData()
              }));
          setRows(loadedRows);
        }
      } catch (err) {
        console.warn("Using default competencies for DPMC core competency review:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchEval();
    return () => { active = false; };
  }, [activeTenantId, selectedUserEmail, currentUser.email, defaultEmployeeEmail, reviewScope]);

  const handleSaveToDatabase = async (updatedRows: CoreCompetencyEvalItem[]) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    try {
      setSaving(true);
      await fetch(`/api/tenant/${activeTenantId}/core-competencies-evaluation?userId=${encodeURIComponent(emailToSave)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation: {
            [`${reviewScope}Rows`]: updatedRows,
            lastUpdatedBy: currentUser.email,
            updatedAt: new Date().toISOString()
          }
        })
      });
    } catch (err) {
      console.error("Error saving DPMC core competency review to Supabase:", err);
    } finally {
      setSaving(false);
    }
  };

  const notifyAllThreeParties = async (actionType: 'redo_request' | 'moderation', title: string, message: string) => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    const recipients = [
      { email: emailToSave, name: emailToSave.split('@')[0], role: 'Self Evaluator' },
      { email: 'manager@domain.com', name: 'Line Manager', role: 'Manager' },
      { email: 'internal_audit', name: 'Internal Audit Committee', role: 'Internal Audit' }
    ];

    try {
      await Promise.all(recipients.map(r => 
        fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              id: `notif_dpmc_cc_${r.role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
              userEmail: r.email,
              recipientEmail: r.email,
              recipientName: r.name,
              senderEmail: currentUser.email,
              senderName: currentUser.name || currentUser.email,
              type: 'cc_dpmc_notification',
              actionType,
              title,
              message,
              read: false,
              createdAt: new Date().toISOString()
            }
          })
        })
      ));
    } catch (e) {
      console.error("Error sending DPMC notifications to 3 parties:", e);
    }
  };

  const handleReturnForRedo = async () => {
    const emailToSave = selectedUserEmail || currentUser.email || '';
    if (!emailToSave) {
      alert("Please select an employee first.");
      return;
    }
    const updated = rows.map(r => {
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: { ...qData, status: 'draft' as const }
      };
    });
    setRows(updated);
    await handleSaveToDatabase(updated);

    await notifyAllThreeParties(
      'redo_request',
      `🏛️ Core Competencies Returned for Redo by DPMC (${selectedQuarter.toUpperCase()})`,
      `DPMC Committee returned Core Competencies evaluation for ${emailToSave} (${selectedQuarter.toUpperCase()}) for redo & resubmission. Self Evaluator, Line Manager, and Internal Audit have been notified.`
    );

    alert(`Successfully returned ${selectedQuarter.toUpperCase()} Core Competencies to ${emailToSave} for redo! Self Evaluator, Manager, and Internal Audit notified.`);
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
      const qData = r[selectedQuarter] || createDefaultQuarterData();
      return {
        ...r,
        [selectedQuarter]: { ...qData, status: 'moderated' as const }
      };
    });
    setRows(updated);
    await handleSaveToDatabase(updated);

    await notifyAllThreeParties(
      'moderation',
      `🏛️ Core Competencies Moderated by DPMC Committee (${selectedQuarter.toUpperCase()})`,
      `DPMC Committee finalized moderation review & scoring for ${emailToSave} Core Competencies (${selectedQuarter.toUpperCase()}). Self Evaluator, Line Manager, and Internal Audit have been notified.`
    );

    alert(`Successfully submitted DPMC Moderation on Core Competencies for ${emailToSave} (${selectedQuarter.toUpperCase()})! All 3 parties notified.`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fadeIn">
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">DPMC Committee Moderation Review (Core Competencies)</h3>
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
              placeholder="Or type employee email..."
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
                type="button"
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition ${
                  selectedQuarter === q ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReturnForRedo}
            disabled={saving}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return for Redo</span>
          </button>

          <button
            type="button"
            onClick={handleDpmcSubmit}
            disabled={saving}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve / Moderate</span>
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl flex-wrap">
          <button
            type="button"
            onClick={() => setReviewScope('directors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'directors' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Directors</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('cfo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'cfo' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>CFO</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('mm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'mm' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Municipal Manager</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('ped')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'ped' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>PED</span>
          </button>
          <button
            type="button"
            onClick={() => setReviewScope('corp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              reviewScope === 'corp' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Corporate Services</span>
          </button>
        </div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">
          Moderating: <span className="text-purple-600 font-extrabold">{reviewScope.toUpperCase()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Loading core competencies for DPMC moderation...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-purple-950 text-white text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-3 border-r border-purple-900 w-12 text-center">#</th>
                  <th className="p-3 border-r border-purple-900 min-w-[180px]">Core Competency</th>
                  <th className="p-3 border-r border-purple-900 min-w-[180px]">Previous Ratings (Self/Mgr/Audit)</th>
                  <th className="p-3 border-r border-purple-900 w-36 text-center">DPMC Score (1-5)</th>
                  <th className="p-3 border-r border-purple-900 min-w-[220px]">DPMC Moderation Findings & Comments</th>
                  <th className="p-3 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-200">
                {rows.map((row, idx) => {
                  const qData = row[selectedQuarter] || createDefaultQuarterData();
                  return (
                    <tr key={row.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/20'}>
                      <td className="p-3 text-center font-bold text-gray-500 border-r border-gray-100">{idx + 1}</td>
                      <td className="p-3 border-r border-gray-100">
                        <div className="font-bold text-gray-900">{row.competency}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{row.definition}</div>
                      </td>
                      <td className="p-3 border-r border-gray-100">
                        <div className="font-bold text-slate-800">Self: {qData.selfScore || 0} / 5</div>
                        <div className="font-bold text-indigo-700 mt-0.5">Manager: {qData.managerScore || 0} / 5</div>
                        <div className="font-bold text-purple-700 mt-0.5">Auditor: {qData.internalAuditorScore || 0} / 5</div>
                      </td>
                      <td className="p-3 border-r border-gray-100 text-center">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          value={qData.dpmcScore || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = rows.map(r => r.id === row.id ? { ...r, [selectedQuarter]: { ...r[selectedQuarter], dpmcScore: val } } : r);
                            setRows(updated);
                          }}
                          className="w-20 p-1.5 border border-purple-300 rounded-lg text-center font-bold text-purple-900 focus:outline-none focus:border-purple-600"
                        />
                      </td>
                      <td className="p-3 border-r border-gray-100">
                        <textarea
                          rows={2}
                          placeholder="Log DPMC moderation findings & comments..."
                          value={qData.dpmcComments || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = rows.map(r => r.id === row.id ? { ...r, [selectedQuarter]: { ...r[selectedQuarter], dpmcComments: val } } : r);
                            setRows(updated);
                          }}
                          className="w-full p-2 border border-purple-300 rounded-lg text-xs focus:outline-none focus:border-purple-600"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          qData.status === 'moderated' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {qData.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewDoc && (
        <OfficeDocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

