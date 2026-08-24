import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Upload, Download, FileText, CheckCircle2, ChevronRight, Check, Save, Plus, Trash2, X, 
  Printer, FileDown, FileSpreadsheet, Loader2, Briefcase, GraduationCap, Award, TrendingUp, 
  Sparkles, PenTool, Search, Users, RefreshCw, Edit3, Shield, Info, CheckSquare
} from 'lucide-react';
import type { User } from '../../types';
import { NKANGALA_LOGO_BASE64 } from './nkangala_logo_base64';
import { TEAM_MODULE_CONFIGS, TeamPreset } from './teamPADefaults';
import { TeamAzureSearchInput, AzureUser } from './TeamAzureSearchInput';
import { BulkAddDirectoryModal } from './BulkAddDirectoryModal';

interface PADraftingSuiteTeamProps {
  currentUser: User;
  activeTenantId: string;
  teamTitle: string; // e.g. "Firefighters Team", "Technical Services Team", "Corporate Services Team", "PMS Team"
  documentIdSuffix: string; // e.g. "firefighters", "technical_services", "corporate_services", "pms_team"
  defaultRows: string[][];
  defaultHeaders?: string[];
}

const renderFormattedContent = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 print:space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2 print:h-1" />;
        const isSubpoint = /^(?:\d+\.\d+|\d+\)|[a-zA-Z]\)|•|-|\*)/.test(trimmed);
        return (
          <p 
            key={idx} 
            className={`text-justify tracking-normal leading-relaxed text-slate-800 text-[11px] print:text-[10px] ${
              isSubpoint ? 'pl-4 font-medium text-slate-900 border-l border-emerald-500/20' : ''
            }`}
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

export function DraftingSuiteTeam({ 
  currentUser, 
  activeTenantId, 
  teamTitle, 
  documentIdSuffix, 
  defaultRows, 
  defaultHeaders = ['No.', 'Full Name (Team Members)', 'Employee Number / Designation'] 
}: PADraftingSuiteTeamProps) {
  const [logoUrl, setLogoUrl] = useState<string>(NKANGALA_LOGO_BASE64);

  // Initialize 10 Teams Configuration from module defaults
  const moduleConfig = TEAM_MODULE_CONFIGS[documentIdSuffix];
  const initialTeams: TeamPreset[] = moduleConfig?.teams || Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `${teamTitle} - Team ${i + 1}`,
    description: `Operational unit ${i + 1} for ${teamTitle}`,
    defaultRows: defaultRows
  }));

  // Active Team Management (10 Teams support: 0 to 9)
  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0);
  const [teamList, setTeamList] = useState<TeamPreset[]>(initialTeams);
  const [editingTeamNameIdx, setEditingTeamNameIdx] = useState<number | null>(null);
  const [tempTeamName, setTempTeamName] = useState<string>('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const currentTeam = teamList[activeTeamIndex] || initialTeams[0];

  // Core Document State
  const [coverPage, setCoverPage] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [validity, setValidity] = useState<string>('This agreement will be valid for the 2025/2026 financial year or until superseded by a revised team agreement.');
  const [reporting, setReporting] = useState<string>('');
  const [framework, setFramework] = useState<string>('4.1 The Employee agrees to participate in the performance assessment and development system of the Municipality.\n\n4.2 The Employee participates in the performance assessment framework as follows:');
  const [frameworkBelowKpa, setFrameworkBelowKpa] = useState<string>('4.3 The Employee\'s assessment will further be based on the following Job Specific Competencies Matrix. Each competency has been weighted as indicated below:');
  const [frameworkBelowJsc, setFrameworkBelowJsc] = useState<string>('4.4 The personal development plan (PDP) will address any developmental needs identified during the competency assessment process.');
  const [conditions, setConditions] = useState<string>('Conditions of performance apply in accordance with municipal collective agreements and occupational safety standards.');
  const [kpaText, setKpaText] = useState<string>('The list of tasks/ duties and responsibilities contained in this document is not necessarily exhaustive and may be adjusted based on operational requirements.');
  const [assessmentText, setAssessmentText] = useState<string>('The performance assessment of the Employee will be based on the following rating scale:\n\nRating scale tabled as follows:');
  const [feedback, setFeedback] = useState<string>('Feedback will be provided through quarterly formal reviews and ongoing operational debriefs.');
  const [timetable, setTimetable] = useState<string>('Timetable for quarterly performance reviews aligned with the institutional calendar.');
  const [poorPerformance, setPoorPerformance] = useState<string>('Management of poor performance will follow the municipal Disciplinary Code and corrective support interventions.');
  const [dispute, setDispute] = useState<string>('Disputes arising from this agreement will be resolved through internal grievance procedures and SALGBC mechanisms.');
  const [amendment, setAmendment] = useState<string>('Any amendment to this agreement must be in writing and signed by both parties.');
  const [evaluation, setEvaluation] = useState<string>('Evaluation will be conducted by the designated supervisors and performance moderation committee.');
  const [signatures, setSignatures] = useState<string>('');

  // Table State
  const [headers, setHeaders] = useState<string[]>(moduleConfig?.defaultHeaders || defaultHeaders);
  const [tableRows, setTableRows] = useState<string[][]>(currentTeam.defaultRows || defaultRows);

  // Review quarters table
  const [reviewRows, setReviewRows] = useState<any[]>([
    { term: '1st Quarter', desc: 'July - September', type: 'Informal', activities: 'Review', date: 'October', responsible: 'Manager' },
    { term: '2nd Quarter', desc: 'October - December', type: 'Formal', activities: 'Review', date: 'January', responsible: 'Manager' },
    { term: '3rd Quarter', desc: 'January - March', type: 'Informal', activities: 'Review', date: 'April', responsible: 'Manager' },
    { term: '4th Quarter', desc: 'April - June', type: 'Formal', activities: 'Annual Assessment', date: 'August', responsible: 'Manager' }
  ]);

  // Signatures configuration: 5 comprehensive signatory roles
  const [userSignatures, setUserSignatures] = useState({
    // Signatory 1: Employee / Team Lead
    employeeTitle: 'Signed by Employee / Team Lead:',
    employee: currentUser?.fullName || '',
    employeeEmail: currentUser?.email || '',
    employeeSig: currentUser?.signatureData || '',
    
    // Signatory 2: Line Manager / Supervisor
    managerTitle: 'Signed by Direct Manager / Supervisor:',
    manager: 'M.L. Mahlangu',
    managerEmail: '',
    managerSig: '',

    // Signatory 3: Municipal Manager / Accounting Officer
    mmTitle: 'Signed on behalf of Municipality (Municipal Manager):',
    mm: 'M.L. Mahlangu (Municipal Manager)',
    mmEmail: '',
    mmSig: '',

    // Signatory 4: Head of Department / Director
    hodTitle: 'Signed by Head of Department / Director:',
    hod: 'Audrey Mpanza',
    hodEmail: '',
    hodSig: '',

    // Signatory 5: PMS Official / Witness
    witnessTitle: 'Signed by Performance Management Unit / Witness:',
    witness: 'Yena Khuboni',
    witnessEmail: '',
    witnessSig: ''
  });

  // Annexures & Extras
  const [annexureA, setAnnexureA] = useState(true);
  const [annexureB, setAnnexureB] = useState(true);
  const [annexureC, setAnnexureC] = useState('Disclosure of interest form...\n\nOther Interests:\nI hereby certify that the above information is complete and correct to the best of my knowledge.');
  const [includeJSC, setIncludeJSC] = useState(true);
  const [isPdpAdopted, setIsPdpAdopted] = useState<boolean>(false);
  const [isJscAdopted, setIsJscAdopted] = useState<boolean>(false);
  const [isPPlanAdopted, setIsPPlanAdopted] = useState<boolean>(false);
  const [teamRosterNotes, setTeamRosterNotes] = useState<string>('Operational notes and descriptions regarding the roster assignments above.');

  // Custom additional section text boxes & tables
  const [sectionExtras, setSectionExtras] = useState<Record<string, { text: string; table: { enabled: boolean; headers: string[]; rows: string[][] } }>>({
    purpose: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    validity: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    reporting: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    framework: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    timetable: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    poorPerformance: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    dispute: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    signatures: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
  });

  // Dynamic KPA & Competencies Table states
  const [dynTableHeaders, setDynTableHeaders] = useState<string[]>(['KPA No', 'National KPA', 'Functional Area KPA', 'Weighting']);
  const [dynTableRows, setDynTableRows] = useState<string[][]>([
    ['1', 'Good Governance & Institutional Transformation', 'Core Team Deliverables & Operational Governance', '25%'],
    ['2', 'Municipal Financial viability and management', 'Budget Control, Asset Care & Resource Efficiency', '35%'],
    ['3', 'Basic Service Delivery & Infrastructure', 'Service Continuity & Rapid Response SLA Targets', '40%']
  ]);

  const [realPlanItems, setRealPlanItems] = useState<any[]>([]);
  const [realPdpItems, setRealPdpItems] = useState<any[]>([]);
  const [realJobCompetencies, setRealJobCompetencies] = useState<any[]>([]);
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);
  const [isRefreshingSignatures, setIsRefreshingSignatures] = useState(false);

  // Status & Export States
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Fetch Tenant System Logo
  useEffect(() => {
    const fetchSystemLogo = async () => {
      if (!activeTenantId) return;
      try {
        const sharedLogoRes = await fetch(`/api/tenant/${activeTenantId}/logo?t=${Date.now()}`);
        if (sharedLogoRes.ok) {
          const sLogo = await sharedLogoRes.json();
          if (sLogo && sLogo.logoUrl) {
            setLogoUrl(sLogo.logoUrl);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch system logo:", e);
      }
    };
    fetchSystemLogo();
  }, [activeTenantId]);

  // Fetch Tenant Users
  const fetchTenantUsers = async () => {
    if (!activeTenantId) return;
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTenantUsers(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch tenant users:", e);
    }
  };

  useEffect(() => {
    fetchTenantUsers();
  }, [activeTenantId]);

  // Live Auto-Update Signatures from User Base / User Management
  const syncSignaturesFromDirectory = async (usersList?: User[]) => {
    setIsRefreshingSignatures(true);
    try {
      // Query Consolidated User List to get freshly uploaded signatures
      const res = await fetch(`/api/azure-search?q=`);
      let allUsers: AzureUser[] = [];
      if (res.ok) {
        allUsers = await res.json();
      }
      const combined = [...allUsers, ...(usersList || tenantUsers)];

      setUserSignatures(prev => {
        const next = { ...prev };
        let changed = false;

        const findSig = (name: string, email: string) => {
          const match = combined.find(u => 
            (email && u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim()) ||
            (name && u.fullName && u.fullName.toLowerCase().trim() === name.toLowerCase().trim())
          );
          return match?.signatureData || '';
        };

        const empSig = findSig(next.employee, next.employeeEmail);
        if (empSig && empSig !== next.employeeSig) {
          next.employeeSig = empSig;
          changed = true;
        }

        const mgrSig = findSig(next.manager, next.managerEmail);
        if (mgrSig && mgrSig !== next.managerSig) {
          next.managerSig = mgrSig;
          changed = true;
        }

        const mmSig = findSig(next.mm, next.mmEmail);
        if (mmSig && mmSig !== next.mmSig) {
          next.mmSig = mmSig;
          changed = true;
        }

        const hodSig = findSig(next.hod, next.hodEmail);
        if (hodSig && hodSig !== next.hodSig) {
          next.hodSig = hodSig;
          changed = true;
        }

        const witSig = findSig(next.witness, next.witnessEmail);
        if (witSig && witSig !== next.witnessSig) {
          next.witnessSig = witSig;
          changed = true;
        }

        return changed ? next : prev;
      });
    } catch (err) {
      console.error("Error syncing signatures from directory:", err);
    } finally {
      setIsRefreshingSignatures(false);
    }
  };

  // Sync signatures automatically on tenantUsers update
  useEffect(() => {
    if (tenantUsers.length > 0) {
      syncSignaturesFromDirectory(tenantUsers);
    }
  }, [tenantUsers]);

  // Document ID generator per team
  const getDocumentIdForTeam = (teamIdx: number) => {
    const teamNum = teamIdx + 1;
    return `draft_doc_${documentIdSuffix}_team_${teamNum}_${activeTenantId}`;
  };

  // Load Saved Draft for Selected Team from Supabase
  const loadDraftForTeam = async (teamIdx: number) => {
    if (!activeTenantId) return;
    try {
      const docId = getDocumentIdForTeam(teamIdx);
      // For Team 1 (idx 0), also check fallback legacy doc ID
      let res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser?.email || 'default'}&documentId=${docId}&t=${Date.now()}`);
      let data = res.ok ? await res.json() : null;

      if ((!data || !data.html) && teamIdx === 0) {
        const legacyDocId = `draft_doc_${documentIdSuffix}_${activeTenantId}`;
        const legacyRes = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser?.email || 'default'}&documentId=${legacyDocId}&t=${Date.now()}`);
        if (legacyRes.ok) {
          data = await legacyRes.json();
        }
      }

      if (data && data.html) {
        let state: any = null;
        if (typeof data.html === 'string') {
          try { state = JSON.parse(data.html); } catch (e) {}
        } else if (typeof data.html === 'object') {
          state = data.html;
        }

        if (state) {
          if (state.coverPage !== undefined) setCoverPage(state.coverPage);
          if (Array.isArray(state.headers) && state.headers.length > 0) setHeaders(state.headers);
          if (Array.isArray(state.tableRows) && state.tableRows.length > 0) setTableRows(state.tableRows);
          if (state.purpose !== undefined) setPurpose(state.purpose);
          if (state.validity !== undefined) setValidity(state.validity);
          if (state.reporting !== undefined) setReporting(state.reporting);
          if (state.framework !== undefined) setFramework(state.framework);
          if (state.frameworkBelowKpa !== undefined) setFrameworkBelowKpa(state.frameworkBelowKpa);
          if (state.frameworkBelowJsc !== undefined) setFrameworkBelowJsc(state.frameworkBelowJsc);
          if (state.conditions !== undefined) setConditions(state.conditions);
          if (state.kpaText !== undefined) setKpaText(state.kpaText);
          if (state.assessmentText !== undefined) setAssessmentText(state.assessmentText);
          if (state.feedback !== undefined) setFeedback(state.feedback);
          if (state.timetable !== undefined) setTimetable(state.timetable);
          if (state.poorPerformance !== undefined) setPoorPerformance(state.poorPerformance);
          if (state.dispute !== undefined) setDispute(state.dispute);
          if (state.amendment !== undefined) setAmendment(state.amendment);
          if (state.evaluation !== undefined) setEvaluation(state.evaluation);
          if (state.signatures !== undefined) setSignatures(state.signatures);
          if (state.userSignatures !== undefined) {
            setUserSignatures(prev => ({ ...prev, ...state.userSignatures }));
          }
          if (state.annexureA !== undefined) setAnnexureA(state.annexureA);
          if (state.annexureB !== undefined) setAnnexureB(state.annexureB);
          if (state.annexureC !== undefined) setAnnexureC(state.annexureC);
          if (state.includeJSC !== undefined) setIncludeJSC(state.includeJSC);
          if (Array.isArray(state.reviewRows)) setReviewRows(state.reviewRows);
          if (state.teamRosterNotes !== undefined) setTeamRosterNotes(state.teamRosterNotes);
          if (Array.isArray(state.dynTableHeaders)) setDynTableHeaders(state.dynTableHeaders);
          if (Array.isArray(state.dynTableRows)) setDynTableRows(state.dynTableRows);
          if (state.sectionExtras !== undefined) setSectionExtras(state.sectionExtras);
          if (state.customTeamName) {
            setTeamList(prev => {
              const updated = [...prev];
              if (updated[teamIdx]) {
                updated[teamIdx] = { ...updated[teamIdx], name: state.customTeamName };
              }
              return updated;
            });
          }
          return;
        }
      }

      // If no saved draft, set fresh team default
      const teamPreset = teamList[teamIdx] || initialTeams[teamIdx] || initialTeams[0];
      const defaultTeamName = teamPreset.name.toUpperCase();
      setCoverPage(`PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n${currentUser?.fullName || '[Employee / Team Representative]'}\n\n${teamTitle.toUpperCase()} — ${defaultTeamName}\n\nFOR THE FINANCIAL YEAR: 2025/2026`);
      setPurpose(`The purpose of this agreement is to specify performance expectations and operational standards for members of the ${teamTitle} (${teamPreset.name}), aligning operational deliverables with municipal strategic goals.`);
      setReporting(`Members of the ${teamTitle} (${teamPreset.name}) will report directly through their designated team leaders and line managers to the Municipal Manager and Executive Leadership.`);
      setTableRows(teamPreset.defaultRows || defaultRows);
    } catch (e) {
      console.error("Error loading team draft:", e);
    }
  };

  // Load draft on team switch
  useEffect(() => {
    loadDraftForTeam(activeTeamIndex);
  }, [activeTeamIndex, documentIdSuffix, activeTenantId]);

  // Save Current Team to Supabase
  const saveToProfile = async () => {
    if (!activeTenantId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const activeTeamName = teamList[activeTeamIndex]?.name || `Team ${activeTeamIndex + 1}`;
      const stateObj = {
        logoUrl,
        customTeamName: activeTeamName,
        teamIndex: activeTeamIndex,
        coverPage,
        headers,
        tableRows,
        purpose,
        validity,
        reporting,
        framework,
        frameworkBelowKpa,
        frameworkBelowJsc,
        conditions,
        kpaText,
        assessmentText,
        feedback,
        timetable,
        poorPerformance,
        dispute,
        amendment,
        evaluation,
        signatures,
        userSignatures,
        annexureA,
        annexureB,
        annexureC,
        includeJSC,
        reviewRows,
        sectionExtras,
        isPdpAdopted,
        isJscAdopted,
        isPPlanAdopted,
        teamRosterNotes,
        dynTableHeaders,
        dynTableRows,
        updatedAt: new Date().toISOString()
      };

      const docId = getDocumentIdForTeam(activeTeamIndex);
      const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser?.email || 'default'}&documentId=${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: stateObj,
          htmlDocumentId: docId
        })
      });

      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error("Failed to save team draft");
      }
    } catch (err) {
      console.error("Save Draft Error:", err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Switch Team Handler
  const handleSelectTeam = async (idx: number) => {
    if (idx === activeTeamIndex) return;
    // Auto-save current before switching
    try {
      const activeTeamName = teamList[activeTeamIndex]?.name || `Team ${activeTeamIndex + 1}`;
      const stateObj = {
        logoUrl,
        customTeamName: activeTeamName,
        teamIndex: activeTeamIndex,
        coverPage,
        headers,
        tableRows,
        purpose,
        validity,
        reporting,
        framework,
        frameworkBelowKpa,
        frameworkBelowJsc,
        conditions,
        kpaText,
        assessmentText,
        feedback,
        timetable,
        poorPerformance,
        dispute,
        amendment,
        evaluation,
        signatures,
        userSignatures,
        annexureA,
        annexureB,
        annexureC,
        includeJSC,
        reviewRows,
        sectionExtras,
        teamRosterNotes,
        dynTableHeaders,
        dynTableRows,
        updatedAt: new Date().toISOString()
      };
      const docId = getDocumentIdForTeam(activeTeamIndex);
      await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser?.email || 'default'}&documentId=${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: stateObj, htmlDocumentId: docId })
      });
    } catch (e) {
      console.warn("Auto-save on switch warning:", e);
    }
    setActiveTeamIndex(idx);
  };

  // Rename team title
  const handleSaveTeamName = (idx: number) => {
    if (!tempTeamName.trim()) {
      setEditingTeamNameIdx(null);
      return;
    }
    const updated = [...teamList];
    updated[idx] = { ...updated[idx], name: tempTeamName.trim() };
    setTeamList(updated);
    setEditingTeamNameIdx(null);
    // Update cover page & purpose text
    setCoverPage(`PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n${currentUser?.fullName || '[Employee / Team Representative]'}\n\n${teamTitle.toUpperCase()} — ${tempTeamName.trim().toUpperCase()}\n\nFOR THE FINANCIAL YEAR: 2025/2026`);
  };

  // Add Directory Members from Bulk Modal
  const handleBulkAddMembers = (newMembers: { name: string; designation: string }[]) => {
    const startIdx = tableRows.length + 1;
    const addedRows: string[][] = newMembers.map((m, i) => [
      String(startIdx + i),
      m.name,
      m.designation
    ]);
    setTableRows(prev => [...prev, ...addedRows]);
  };

  // Export PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const element = document.getElementById('pa-printable-area');
      if (!element) return;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const teamNameSafe = (teamList[activeTeamIndex]?.name || `Team_${activeTeamIndex + 1}`).replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Performance_Agreement_${documentIdSuffix}_${teamNameSafe}_2025_2026.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Export Word (.doc)
  const handleExportWord = () => {
    setIsExportingWord(true);
    try {
      const element = document.getElementById('pa-printable-area');
      if (!element) return;
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>${teamTitle} Performance Agreement</title>
        <style>
          body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6pt; text-align: left; font-size: 10pt; }
          th { background-color: #f1f5f9; font-weight: bold; }
          h1, h2, h3, h4 { color: #065f46; font-family: 'Arial', sans-serif; }
          .page-break { page-break-before: always; }
        </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const teamNameSafe = (teamList[activeTeamIndex]?.name || `Team_${activeTeamIndex + 1}`).replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Performance_Agreement_${documentIdSuffix}_${teamNameSafe}_2025_2026.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Word export error:", e);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 w-full h-[calc(100vh-270px)] bg-slate-50 overflow-hidden divide-x divide-slate-200">
      <style>{`
        /* Fit viewport and hide outer scrolling */
        main > div.overflow-auto,
        main > div.hide-scrollbar,
        div.max-w-\[1600px\].overflow-auto {
          overflow: hidden !important;
          height: calc(100vh - 110px) !important;
          padding-bottom: 0 !important;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none !important; }
        .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      {/* LEFT PANE - Team Management & Section Editors */}
      <div className="w-1/2 h-full overflow-y-auto hide-scrollbar p-6 space-y-6">
        
        {/* Top Header Bar with Save & Actions */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {teamTitle} Drafting Suite
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                  10 Teams Supported
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure team rosters, Azure AD members, quarterly reviews & live signatures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveToProfile}
              disabled={saving}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                saveStatus === 'success' ? 'bg-emerald-600 text-white' :
                saveStatus === 'error' ? 'bg-rose-600 text-white' :
                'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved to Supabase!' : 'Save Team Draft'}
            </button>
            <button
              onClick={() => syncSignaturesFromDirectory()}
              disabled={isRefreshingSignatures}
              title="Refresh and auto-pull latest signatures from User Management"
              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingSignatures ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 10-TEAMS SWITCHER TAB STRIP */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Select Team Agreement (Up to 10 Teams)
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              Currently Editing: <strong className="text-emerald-700">{currentTeam.name}</strong>
            </span>
          </div>

          {/* 10 Team Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {teamList.map((team, idx) => {
              const isSelected = idx === activeTeamIndex;
              return (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(idx)}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition relative group ${
                    isSelected 
                      ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' 
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-emerald-800' : 'text-slate-500'}`}>
                      Team {team.id}
                    </span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                  </div>
                  <div className={`text-[11px] font-bold truncate mt-0.5 ${isSelected ? 'text-emerald-950' : 'text-slate-700'}`} title={team.name}>
                    {team.name.replace(`${teamTitle} - `, '')}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 flex justify-between items-center">
                    <span>{idx === activeTeamIndex ? `${tableRows.length} members` : 'Saved'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team Name Customizer */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            {editingTeamNameIdx === activeTeamIndex ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={tempTeamName}
                  onChange={e => setTempTeamName(e.target.value)}
                  placeholder="Enter custom team name / shift / division..."
                  className="flex-1 text-xs p-1.5 border border-emerald-500 rounded-lg outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveTeamName(activeTeamIndex)}
                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTeamNameIdx(null)}
                  className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <span className="text-xs text-slate-600 font-medium">
                  Team Title: <strong className="text-slate-900">{currentTeam.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempTeamName(currentTeam.name);
                    setEditingTeamNameIdx(activeTeamIndex);
                  }}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Rename Team
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COVER PAGE EDITOR */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">Cover Page Text</label>
          <textarea 
            value={coverPage} 
            onChange={e => setCoverPage(e.target.value)} 
            rows={5} 
            className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-mono" 
          />
        </div>

        {/* TEAM MEMBERS ROSTER TABLE WITH AZURE AD AUTOCOMPLETE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Team Roster ({tableRows.length} Members in {currentTeam.name})
              </label>
              <p className="text-[11px] text-slate-500">
                Type in the name cell to search Azure AD directory or click Bulk Add
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" /> Bulk Add from Azure AD
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextNo = tableRows.length + 1;
                  setTableRows([...tableRows, [String(nextNo), '', '']]);
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 border border-slate-100 rounded-lg p-2 bg-slate-50">
            {tableRows.map((row, rIdx) => (
              <div key={rIdx} className="border border-slate-200 p-3 rounded-lg bg-white space-y-2 relative group hover:border-emerald-300 transition">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                    Member #{rIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = tableRows.filter((_, idx) => idx !== rIdx);
                      // Re-index row numbers
                      const reindexed = updated.map((r, i) => [String(i + 1), r[1] || '', r[2] || '']);
                      setTableRows(reindexed);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                    title="Delete member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-2">
                    <label className="text-[9px] text-slate-400 block font-semibold">No.</label>
                    <input 
                      type="text" 
                      value={row[0] || String(rIdx + 1)} 
                      onChange={e => {
                        const newTable = [...tableRows];
                        newTable[rIdx] = [e.target.value, row[1] || '', row[2] || ''];
                        setTableRows(newTable);
                      }} 
                      className="w-full text-xs p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500 text-center font-bold"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="text-[9px] text-slate-400 block font-semibold flex items-center justify-between">
                      <span>Full Name (Azure AD Searchable)</span>
                      <span className="text-emerald-700 font-bold text-[8.5px]">Type to search</span>
                    </label>
                    <TeamAzureSearchInput
                      value={row[1] || ''}
                      placeholder="Search Azure AD Directory..."
                      compact={true}
                      onChange={(val) => {
                        const newTable = [...tableRows];
                        newTable[rIdx] = [row[0] || String(rIdx + 1), val, row[2] || ''];
                        setTableRows(newTable);
                      }}
                      onSelectUser={(user) => {
                        const newTable = [...tableRows];
                        const designation = user.jobFunction || user.department || user.email || 'Municipal Official';
                        newTable[rIdx] = [row[0] || String(rIdx + 1), user.fullName, designation];
                        setTableRows(newTable);
                      }}
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-[9px] text-slate-400 block font-semibold">Employee No / Designation</label>
                    <input 
                      type="text" 
                      value={row[2] || ''} 
                      placeholder="e.g. TS-0419 (Technician)"
                      onChange={e => {
                        const newTable = [...tableRows];
                        newTable[rIdx] = [row[0] || String(rIdx + 1), row[1] || '', e.target.value];
                        setTableRows(newTable);
                      }} 
                      className="w-full text-xs p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setTableRows(currentTeam.defaultRows || defaultRows)}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Reset to default team rows
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Total roster count: <strong className="text-slate-800">{tableRows.length}</strong>
            </span>
          </div>
        </div>

        {/* SECTION 1: PURPOSE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">1. Purpose</label>
          <textarea value={purpose} onChange={e => setPurpose(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        {/* SECTION 2: VALIDITY */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">2. Validity of Agreement</label>
          <textarea value={validity} onChange={e => setValidity(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        {/* SECTION 3: REPORTING */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">3. Reporting Requirements & Lines</label>
          <textarea value={reporting} onChange={e => setReporting(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        {/* SECTION 4: ASSESSMENT FRAMEWORK */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase block">4. Performance Assessment Framework</label>
          <textarea value={framework} onChange={e => setFramework(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          
          <label className="text-xs font-bold text-slate-700 uppercase block !mt-3">4.3 Competencies Text (Below KPA Table)</label>
          <textarea value={frameworkBelowKpa} onChange={e => setFrameworkBelowKpa(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />

          <label className="text-xs font-bold text-slate-700 uppercase block !mt-3">4.4 Framework Footer Text (Below Competencies Table)</label>
          <textarea value={frameworkBelowJsc} onChange={e => setFrameworkBelowJsc(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        {/* SECTION 5: CONDITIONS */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">5. Conditions of Performance</label>
          <textarea value={conditions} onChange={e => setConditions(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        {/* SECTION 8: TIMETABLE FOR REVIEW */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 uppercase">8. Timetable for Performance Reviews</label>
            <button
              type="button"
              onClick={() => {
                const nextNum = reviewRows.length + 1;
                setReviewRows([
                  ...reviewRows,
                  { term: `${nextNum}th Quarter`, desc: 'Month - Month', type: 'Formal', activities: 'Review', date: 'Month', responsible: 'Manager' }
                ]);
              }}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Review Quarter
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2">Review Term</th>
                  <th className="p-2">Period</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Activities</th>
                  <th className="p-2">Due Date</th>
                  <th className="p-2">Responsible</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reviewRows.map((r, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={r.term || ''}
                        onChange={e => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], term: e.target.value };
                          setReviewRows(updated);
                        }}
                        className="w-full text-xs p-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={r.desc || ''}
                        onChange={e => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], desc: e.target.value };
                          setReviewRows(updated);
                        }}
                        className="w-full text-xs p-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={r.type || 'Informal'}
                        onChange={e => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], type: e.target.value };
                          setReviewRows(updated);
                        }}
                        className="w-full text-xs p-1 border border-slate-200 rounded bg-white"
                      >
                        <option value="Informal">Informal</option>
                        <option value="Formal">Formal</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={r.activities || ''}
                        onChange={e => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], activities: e.target.value };
                          setReviewRows(updated);
                        }}
                        className="w-full text-xs p-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={r.date || ''}
                        onChange={e => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], date: e.target.value };
                          setReviewRows(updated);
                        }}
                        className="w-full text-xs p-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={r.responsible || 'Manager'}
                        onChange={e => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], responsible: e.target.value };
                          setReviewRows(updated);
                        }}
                        className="w-full text-xs p-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => setReviewRows(reviewRows.filter((_, i) => i !== rowIdx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 13: SIGNATURES OF PARTIES WITH AZURE AD SELECTION & LIVE PROFILE AUTO-UPDATE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-emerald-600" />
                13. Signatures of Parties to the Agreement
              </label>
              <p className="text-[11px] text-slate-500">
                Search names in Azure AD. Uploaded signatures from User Management auto-render live.
              </p>
            </div>
            <button
              type="button"
              onClick={() => syncSignaturesFromDirectory()}
              disabled={isRefreshingSignatures}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSignatures ? 'animate-spin text-emerald-600' : ''}`} />
              {isRefreshingSignatures ? 'Syncing Profiles...' : 'Sync Signatures'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Employee / Team Lead */}
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase block">
                1. Employee / Team Representative
              </label>
              <TeamAzureSearchInput
                value={userSignatures.employee}
                placeholder="Search Employee in Azure AD..."
                onChange={val => setUserSignatures({ ...userSignatures, employee: val })}
                onSelectUser={u => {
                  setUserSignatures({
                    ...userSignatures,
                    employee: u.fullName,
                    employeeEmail: u.email,
                    employeeSig: u.signatureData || userSignatures.employeeSig
                  });
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Signature Status:</span>
                {userSignatures.employeeSig ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Signature Loaded
                  </span>
                ) : (
                  <span className="text-amber-600 italic">No signature on file</span>
                )}
              </div>
              {userSignatures.employeeSig && (
                <div className="h-10 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                  <img src={userSignatures.employeeSig} alt="Employee Sig" className="max-h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            {/* 2. Direct Manager / Supervisor */}
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase block">
                2. Direct Manager / Supervisor
              </label>
              <TeamAzureSearchInput
                value={userSignatures.manager}
                placeholder="Search Manager in Azure AD..."
                onChange={val => setUserSignatures({ ...userSignatures, manager: val })}
                onSelectUser={u => {
                  setUserSignatures({
                    ...userSignatures,
                    manager: u.fullName,
                    managerEmail: u.email,
                    managerSig: u.signatureData || userSignatures.managerSig
                  });
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Signature Status:</span>
                {userSignatures.managerSig ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Signature Loaded
                  </span>
                ) : (
                  <span className="text-amber-600 italic">No signature on file</span>
                )}
              </div>
              {userSignatures.managerSig && (
                <div className="h-10 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                  <img src={userSignatures.managerSig} alt="Manager Sig" className="max-h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            {/* 3. Municipal Manager / Accounting Officer */}
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase block">
                3. Municipal Manager (Accounting Officer)
              </label>
              <TeamAzureSearchInput
                value={userSignatures.mm}
                placeholder="Search Municipal Manager in Azure AD..."
                onChange={val => setUserSignatures({ ...userSignatures, mm: val })}
                onSelectUser={u => {
                  setUserSignatures({
                    ...userSignatures,
                    mm: u.fullName,
                    mmEmail: u.email,
                    mmSig: u.signatureData || userSignatures.mmSig
                  });
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Signature Status:</span>
                {userSignatures.mmSig ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Signature Loaded
                  </span>
                ) : (
                  <span className="text-amber-600 italic">No signature on file</span>
                )}
              </div>
              {userSignatures.mmSig && (
                <div className="h-10 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                  <img src={userSignatures.mmSig} alt="MM Sig" className="max-h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            {/* 4. Head of Department / Director */}
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase block">
                4. Head of Department / Director
              </label>
              <TeamAzureSearchInput
                value={userSignatures.hod}
                placeholder="Search HOD / Director in Azure AD..."
                onChange={val => setUserSignatures({ ...userSignatures, hod: val })}
                onSelectUser={u => {
                  setUserSignatures({
                    ...userSignatures,
                    hod: u.fullName,
                    hodEmail: u.email,
                    hodSig: u.signatureData || userSignatures.hodSig
                  });
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Signature Status:</span>
                {userSignatures.hodSig ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Signature Loaded
                  </span>
                ) : (
                  <span className="text-amber-600 italic">No signature on file</span>
                )}
              </div>
              {userSignatures.hodSig && (
                <div className="h-10 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                  <img src={userSignatures.hodSig} alt="HOD Sig" className="max-h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            {/* 5. Performance Management Unit (PMU) / Witness */}
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase block">
                5. Performance Management Unit (PMU) / Direct Witness
              </label>
              <TeamAzureSearchInput
                value={userSignatures.witness}
                placeholder="Search PMS Official / Witness in Azure AD..."
                onChange={val => setUserSignatures({ ...userSignatures, witness: val })}
                onSelectUser={u => {
                  setUserSignatures({
                    ...userSignatures,
                    witness: u.fullName,
                    witnessEmail: u.email,
                    witnessSig: u.signatureData || userSignatures.witnessSig
                  });
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Signature Status:</span>
                {userSignatures.witnessSig ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Signature Loaded
                  </span>
                ) : (
                  <span className="text-amber-600 italic">No signature on file</span>
                )}
              </div>
              {userSignatures.witnessSig && (
                <div className="h-10 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                  <img src={userSignatures.witnessSig} alt="Witness Sig" className="max-h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ANNEXURES */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">Annexure C - Disclosure of Financial Interest</label>
          <textarea value={annexureC} onChange={e => setAnnexureC(e.target.value)} rows={4} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

      </div>

      {/* RIGHT PANE - Live Document Preview & Export Controls */}
      <div className="w-1/2 h-full overflow-y-auto hide-scrollbar p-6 bg-slate-200/60 relative">
        
        {/* Floating Export & Print Bar */}
        <div className="sticky top-0 z-20 mb-4 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-md border border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Live Contract Preview
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {teamList[activeTeamIndex]?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              {isExportingPDF ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExportingWord}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              {isExportingWord ? 'Exporting...' : 'Word (.doc)'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A4 Document Frame) */}
        <div 
          id="pa-printable-area" 
          className="bg-white mx-auto shadow-2xl p-10 max-w-[820px] rounded-xs border border-slate-300 min-h-[1100px] text-slate-900 font-sans leading-relaxed select-text"
        >
          {/* Header & Logo */}
          <div className="text-center pb-8 border-b-2 border-emerald-800/80 mb-8 space-y-3">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Municipal Logo" 
                className="max-h-20 max-w-[200px] mx-auto object-contain mb-3" 
                referrerPolicy="no-referrer"
              />
            )}
            <h1 className="text-lg font-black text-emerald-900 tracking-tight uppercase">
              {teamTitle} Performance Agreement
            </h1>
            <div className="inline-block px-4 py-1 bg-emerald-50 border border-emerald-300 rounded-full text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              {teamList[activeTeamIndex]?.name || `Team ${activeTeamIndex + 1}`}
            </div>
            <p className="text-xs font-semibold text-slate-600">
              Financial Year: 2025/2026
            </p>
          </div>

          {/* Cover Page Body */}
          <div className="whitespace-pre-wrap text-xs text-slate-800 leading-relaxed font-sans text-center max-w-lg mx-auto py-6 border-b border-slate-200 mb-8 bg-slate-50/50 p-6 rounded-lg">
            {coverPage}
          </div>

          {/* Team Members Roster Deployment Table */}
          <div className="mb-8">
            <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              Team Members Deployment Roster ({teamList[activeTeamIndex]?.name})
            </h3>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100 text-slate-800 uppercase font-black text-[10px]">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="border border-slate-300 p-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tableRows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="border border-slate-300 p-2 text-center font-bold text-slate-600 w-12">
                      {row[0] || idx + 1}
                    </td>
                    <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                      {row[1] || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="border border-slate-300 p-2 text-slate-600">
                      {row[2] || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Document Clauses */}
          <div className="space-y-6 text-xs text-slate-800">
            {/* 1. Purpose */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                1. Purpose of Agreement
              </h3>
              {renderFormattedContent(purpose)}
            </div>

            {/* 2. Validity */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                2. Validity of Agreement
              </h3>
              {renderFormattedContent(validity)}
            </div>

            {/* 3. Reporting */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                3. Reporting Requirements & Governance
              </h3>
              {renderFormattedContent(reporting)}
            </div>

            {/* 4. Assessment Framework */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                4. Performance Assessment Framework
              </h3>
              {renderFormattedContent(framework)}

              {/* Dynamic KPA Table */}
              <div className="my-4">
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                  <thead className="bg-emerald-50 text-emerald-900 font-bold uppercase text-[9.5px]">
                    <tr>
                      {dynTableHeaders.map((h, i) => (
                        <th key={i} className="border border-slate-300 p-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dynTableRows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-200">
                        {r.map((c, ci) => (
                          <td key={ci} className={`border border-slate-300 p-2 ${ci === 0 ? 'text-center font-bold' : ''}`}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {renderFormattedContent(frameworkBelowKpa)}
              {renderFormattedContent(frameworkBelowJsc)}
            </div>

            {/* 5. Conditions */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                5. Conditions of Performance
              </h3>
              {renderFormattedContent(conditions)}
            </div>

            {/* 8. Timetable */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                8. Timetable for Performance Reviews
              </h3>
              <table className="w-full text-left border-collapse border border-slate-300 text-[11px] my-3">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[9.5px]">
                  <tr>
                    <th className="border border-slate-300 p-2">Term</th>
                    <th className="border border-slate-300 p-2">Period</th>
                    <th className="border border-slate-300 p-2">Type</th>
                    <th className="border border-slate-300 p-2">Activities</th>
                    <th className="border border-slate-300 p-2">Due Date</th>
                    <th className="border border-slate-300 p-2">Responsible</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewRows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-2 font-bold">{r.term}</td>
                      <td className="border border-slate-300 p-2">{r.desc}</td>
                      <td className="border border-slate-300 p-2">{r.type}</td>
                      <td className="border border-slate-300 p-2">{r.activities}</td>
                      <td className="border border-slate-300 p-2">{r.date}</td>
                      <td className="border border-slate-300 p-2">{r.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderFormattedContent(timetable)}
            </div>

            {/* 9. Poor Performance */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                9. Management of Poor Performance Outcomes
              </h3>
              {renderFormattedContent(poorPerformance)}
            </div>

            {/* 10. Dispute Resolution */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                10. Dispute Resolution Mechanism
              </h3>
              {renderFormattedContent(dispute)}
            </div>

            {/* 13. Signatures of Parties Block */}
            <div className="pt-8 border-t-2 border-emerald-900/80 mt-10">
              <h3 className="text-xs font-black uppercase text-emerald-900 tracking-wider text-center mb-6">
                13. Signatures of Parties to the Performance Agreement
              </h3>

              <div className="grid grid-cols-2 gap-6 my-6">
                
                {/* Employee / Team Lead Signature */}
                <div className="border border-slate-300 p-4 rounded-lg bg-slate-50/60 space-y-3">
                  <p className="font-bold text-[11px] uppercase text-slate-700 border-b border-slate-200 pb-1">
                    Signed by Employee / Team Lead:
                  </p>
                  <div className="h-14 border-b border-black flex flex-col justify-end items-center relative pb-1">
                    {userSignatures.employeeSig ? (
                      <img 
                        src={userSignatures.employeeSig} 
                        alt="Employee Sig" 
                        className="max-h-12 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="font-serif italic text-xs text-slate-500">
                        {userSignatures.employee || 'Employee Signature Placeholder'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600 flex justify-between">
                    <span>Name: <strong>{userSignatures.employee || 'N/A'}</strong></span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Direct Manager Signature */}
                <div className="border border-slate-300 p-4 rounded-lg bg-slate-50/60 space-y-3">
                  <p className="font-bold text-[11px] uppercase text-slate-700 border-b border-slate-200 pb-1">
                    Signed by Direct Manager / Supervisor:
                  </p>
                  <div className="h-14 border-b border-black flex flex-col justify-end items-center relative pb-1">
                    {userSignatures.managerSig ? (
                      <img 
                        src={userSignatures.managerSig} 
                        alt="Manager Sig" 
                        className="max-h-12 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="font-serif italic text-xs text-slate-500">
                        {userSignatures.manager || 'Manager Signature Placeholder'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600 flex justify-between">
                    <span>Name: <strong>{userSignatures.manager || 'Supervisor'}</strong></span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Municipal Manager Signature */}
                <div className="border border-slate-300 p-4 rounded-lg bg-slate-50/60 space-y-3">
                  <p className="font-bold text-[11px] uppercase text-slate-700 border-b border-slate-200 pb-1">
                    Signed on behalf of Municipality (Municipal Manager):
                  </p>
                  <div className="h-14 border-b border-black flex flex-col justify-end items-center relative pb-1">
                    {userSignatures.mmSig ? (
                      <img 
                        src={userSignatures.mmSig} 
                        alt="MM Sig" 
                        className="max-h-12 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="font-serif italic text-xs text-slate-500">
                        {userSignatures.mm || 'Municipal Manager'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600 flex justify-between">
                    <span>Name: <strong>{userSignatures.mm || 'Accounting Officer'}</strong></span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Performance Management Unit / Witness Signature */}
                <div className="border border-slate-300 p-4 rounded-lg bg-slate-50/60 space-y-3">
                  <p className="font-bold text-[11px] uppercase text-slate-700 border-b border-slate-200 pb-1">
                    Signed by Performance Management Unit / Witness:
                  </p>
                  <div className="h-14 border-b border-black flex flex-col justify-end items-center relative pb-1">
                    {userSignatures.witnessSig ? (
                      <img 
                        src={userSignatures.witnessSig} 
                        alt="Witness Sig" 
                        className="max-h-12 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="font-serif italic text-xs text-slate-500">
                        {userSignatures.witness || 'PMS Witness'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600 flex justify-between">
                    <span>Name: <strong>{userSignatures.witness || 'PMS Official'}</strong></span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Annexure C Preview */}
            <div className="pt-6 border-t border-slate-200 text-xs">
              <h4 className="font-bold uppercase text-emerald-900 mb-2">Annexure C: Financial Disclosure</h4>
              <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 p-4 rounded border border-slate-200">
                {annexureC}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bulk Add Directory Modal */}
      <BulkAddDirectoryModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onAddMembers={handleBulkAddMembers}
        currentMembers={tableRows}
      />
    </div>
  );
}
export default DraftingSuiteTeam;
