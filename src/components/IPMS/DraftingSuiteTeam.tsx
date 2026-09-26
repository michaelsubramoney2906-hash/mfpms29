import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Upload, Download, FileText, CheckCircle2, ChevronRight, Check, Save, Plus, Trash2, X, 
  Printer, FileDown, FileSpreadsheet, Loader2, Briefcase, GraduationCap, Award, TrendingUp, 
  Sparkles, PenTool, Search, Users, RefreshCw, Edit3, Shield, Info, CheckSquare,
  Table2, ClipboardList, ArrowRight, Scale, Bell, Send, CheckCheck, ShieldCheck
} from 'lucide-react';
import type { User } from '../../types';
import { NKANGALA_LOGO_BASE64 } from './nkangala_logo_base64';
import { TEAM_MODULE_CONFIGS, TeamPreset } from './teamPADefaults';
import { TeamAzureSearchInput, AzureUser } from './TeamAzureSearchInput';
import { BulkAddDirectoryModal } from './BulkAddDirectoryModal';
import { 
  DualSectionExtras, SectionExtraBlock, CustomTableBlock,
  createDefaultDualExtras, createDefaultExtraBlock, normalizeSectionExtras,
  SectionCustomBlockEditor, SectionCustomBlockViewer,
  KPATableEditor, KPATableViewer
} from './PADraftingCustomBlock';

export interface TeamMemberSignatory {
  id: string;
  name: string;
  designation: string;
  title: string;
  email: string;
  signatureData: string;
  date: string;
}

export interface InstitutionalSignatory {
  id: string;
  name: string;
  designation: string;
  title: string;
  email: string;
  signatureData: string;
  date: string;
}

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


const DUAL_LAYER_USERS_DST = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getEmailScope(email) {
  if (!email) return 'default';
  const norm = email.toLowerCase().trim();
  if (DUAL_LAYER_USERS_DST.includes(norm)) {
    return norm + '_team';
  }
  return norm;
}

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

  // Helper to clean duplicate 4.2 framework text
  const cleanFrameworkText = (text: string) => {
    if (!text) return '4.1 The Employee agrees to participate in the performance assessment and development system of the Municipality.';
    return text.replace(/\n*4\.2\s+The Employee participates in the performance assessment framework as follows:?/gi, '').trim();
  };

  // Editable Headings State for CDS, Technical Services, Corporate Services & PMS Team PAs
  const [headingMainTitle, setHeadingMainTitle] = useState<string>(`${teamTitle} Performance Agreement`);
  const [headingRoster, setHeadingRoster] = useState<string>('Team Members Deployment Roster');
  const [headingPurpose, setHeadingPurpose] = useState<string>('1. Purpose of Agreement');
  const [headingValidity, setHeadingValidity] = useState<string>('2. Validity of Agreement');
  const [headingReporting, setHeadingReporting] = useState<string>('3. Reporting Requirements & Governance');
  const [headingFramework, setHeadingFramework] = useState<string>('4. Performance Assessment Framework');
  const [headingKpaTable, setHeadingKpaTable] = useState<string>('4.2 Key Performance Areas (KPA) Matrix Table');
  const [headingPplanTable, setHeadingPplanTable] = useState<string>('Annexure A: Annual Performance Plan (KPA & KPI Matrix)');
  const [headingCompetencies, setHeadingCompetencies] = useState<string>('4.3 Job Specific Competencies Framework');
  const [headingFramework44, setHeadingFramework44] = useState<string>('4.4 Developmental Framework & Personal Development Plan');
  const [headingJscTable, setHeadingJscTable] = useState<string>('Adopted Profile Job Specific Competencies (JSC) Matrix');
  const [headingConditions, setHeadingConditions] = useState<string>('5. Conditions of Performance');
  const [headingKpaDuties, setHeadingKpaDuties] = useState<string>('6. Key Performance Areas / Duties');
  const [headingRatingScale, setHeadingRatingScale] = useState<string>('7. Performance Assessment Rating Scale');
  const [headingTimetable, setHeadingTimetable] = useState<string>('8. Timetable for Performance Reviews');
  const [headingPoorPerformance, setHeadingPoorPerformance] = useState<string>('9. Management of Poor Performance');
  const [headingDispute, setHeadingDispute] = useState<string>('10. Dispute Resolution');
  const [headingAmendment, setHeadingAmendment] = useState<string>('11. General & Amendments');
  const [headingEvaluation, setHeadingEvaluation] = useState<string>('12. Evaluation & Moderation');
  const [headingSignatures, setHeadingSignatures] = useState<string>('13. Signatures of Contracting Parties');
  const [headingAnnexureC, setHeadingAnnexureC] = useState<string>('Annexure C - Disclosure of Financial Interest');

  // Core Document State
  const [coverPage, setCoverPage] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [validity, setValidity] = useState<string>('This agreement will be valid for the 2025/2026 financial year or until superseded by a revised team agreement.');
  const [reporting, setReporting] = useState<string>('');
  const [framework, setFramework] = useState<string>('4.1 The Employee agrees to participate in the performance assessment and development system of the Municipality.');
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

  // Institutional / Supervisory Signatories (Fully dynamic: Add / Delete / Edit Titles, without PMU witness)
  const [institutionalSignatures, setInstitutionalSignatures] = useState<InstitutionalSignatory[]>([
    {
      id: 'inst_sig_manager',
      title: 'Signed by Direct Manager / Supervisor:',
      name: 'M.L. Mahlangu',
      designation: 'Direct Manager / Supervisor',
      email: '',
      signatureData: '',
      date: new Date().toLocaleDateString()
    },
    {
      id: 'inst_sig_mm',
      title: 'Signed on behalf of Municipality (Municipal Manager):',
      name: 'M.L. Mahlangu (Municipal Manager)',
      designation: 'Municipal Manager (Accounting Officer)',
      email: '',
      signatureData: '',
      date: new Date().toLocaleDateString()
    },
    {
      id: 'inst_sig_hod',
      title: 'Signed by Head of Department / Director:',
      name: 'Audrey Mpanza',
      designation: 'Head of Department / Director',
      email: '',
      signatureData: '',
      date: new Date().toLocaleDateString()
    }
  ]);

  const handleAddInstitutionalSignatory = () => {
    const newSignatory: InstitutionalSignatory = {
      id: `inst_sig_${Date.now()}`,
      title: 'Signed by Supervisory Official / Authority:',
      name: '',
      designation: '',
      email: '',
      signatureData: '',
      date: new Date().toLocaleDateString()
    };
    setInstitutionalSignatures(prev => [...prev, newSignatory]);
    triggerNotification("Added new Supervisory / Institutional Signatory", "success");
  };

  const handleDeleteInstitutionalSignatory = (index: number) => {
    setInstitutionalSignatures(prev => {
      const target = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      triggerNotification(`Removed "${target?.title || 'Signatory'}"`, "success");
      return updated;
    });
  };

  const handleUpdateInstitutionalSignatory = (index: number, field: keyof InstitutionalSignatory, value: string) => {
    setInstitutionalSignatures(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  // Signatures configuration: backwards-compatible fallback object
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

    // Signatory 5: PMS Official / Witness (Optional fallback)
    witnessTitle: 'Signed by Performance Management Unit / Witness:',
    witness: 'Yena Khuboni',
    witnessEmail: '',
    witnessSig: ''
  });

  // Team Member Signatories dynamically synchronized from the top Deployment Roster
  const [teamMemberSignatures, setTeamMemberSignatures] = useState<TeamMemberSignatory[]>(() => {
    const initRows = currentTeam.defaultRows || defaultRows || [];
    return initRows.map((r, idx) => ({
      id: `member_sig_${idx}`,
      name: r[1] || '',
      designation: r[2] || '',
      title: idx === 0 
        ? `Signed by Team Lead / Director (${r[1] || 'Lead'}):` 
        : `Signed by Team Member (${r[1] || `Member #${idx + 1}`}):`,
      email: '',
      signatureData: '',
      date: new Date().toLocaleDateString()
    }));
  });

  // Automatically keep teamMemberSignatures in sync with tableRows (roster)
  useEffect(() => {
    setTeamMemberSignatures(prev => {
      return tableRows.map((row, idx) => {
        const rawName = row[1] || '';
        const rawDesig = row[2] || '';
        const existing = prev[idx];

        const defaultTitle = idx === 0 
          ? `Signed by Team Lead / Director (${rawName || 'Lead'}):` 
          : `Signed by Team Member (${rawName || `Member #${idx + 1}`}):`;

        // If title matches auto-generated pattern or was empty, keep it updated with current name
        let title = existing?.title;
        if (!title || title.startsWith('Signed by Team Member') || title.startsWith('Signed by Team Lead')) {
          title = defaultTitle;
        }

        return {
          id: existing?.id || `member_sig_${idx}_${Date.now()}`,
          name: rawName,
          designation: rawDesig,
          title: title || defaultTitle,
          email: existing?.email || '',
          signatureData: existing?.signatureData || '',
          date: existing?.date || new Date().toLocaleDateString()
        };
      });
    });
  }, [tableRows]);

  // Explicit sync handler
  const handleSyncRosterToSignatures = () => {
    const synced = tableRows.map((row, idx) => {
      const rawName = row[1] || '';
      const rawDesig = row[2] || '';
      const existing = teamMemberSignatures[idx];
      return {
        id: existing?.id || `member_sig_${idx}_${Date.now()}`,
        name: rawName,
        designation: rawDesig,
        title: idx === 0 
          ? `Signed by Team Lead / Director (${rawName || 'Lead'}):` 
          : `Signed by Team Member (${rawName || `Member #${idx + 1}`}):`,
        email: existing?.email || '',
        signatureData: existing?.signatureData || '',
        date: existing?.date || new Date().toLocaleDateString()
      };
    });
    setTeamMemberSignatures(synced);
    triggerNotification(`Synchronized ${synced.length} team members from roster into Section 13 Signatures`, "success");
  };

  const handleUpdateMemberSignature = (index: number, field: keyof TeamMemberSignatory, value: string) => {
    setTeamMemberSignatures(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });

    // If name or designation is updated in Section 13, also reflect back to the top roster table!
    if (field === 'name' || field === 'designation') {
      setTableRows(prev => {
        const newRows = [...prev];
        if (newRows[index]) {
          newRows[index] = [
            newRows[index][0] || String(index + 1),
            field === 'name' ? value : newRows[index][1] || '',
            field === 'designation' ? value : newRows[index][2] || ''
          ];
        }
        return newRows;
      });
    }
  };

  // Annexures & Extras
  const [annexureA, setAnnexureA] = useState(true);
  const [annexureB, setAnnexureB] = useState(true);
  const [annexureC, setAnnexureC] = useState('Disclosure of interest form...\n\nOther Interests:\nI hereby certify that the above information is complete and correct to the best of my knowledge.');
  const [includeJSC, setIncludeJSC] = useState(true);
  const [isPdpAdopted, setIsPdpAdopted] = useState<boolean>(false);
  const [isJscAdopted, setIsJscAdopted] = useState<boolean>(false);
  const [isPPlanAdopted, setIsPPlanAdopted] = useState<boolean>(false);
  const [teamRosterNotes, setTeamRosterNotes] = useState<string>('Operational notes and descriptions regarding the roster assignments above.');

  // Custom additional section text boxes & tables (Dual: Above & Below for every section)
  const [sectionExtras, setSectionExtras] = useState<Record<string, DualSectionExtras>>({
    coverPage: createDefaultDualExtras(),
    roster: createDefaultDualExtras(),
    purpose: createDefaultDualExtras(),
    validity: createDefaultDualExtras(),
    reporting: createDefaultDualExtras(),
    framework: createDefaultDualExtras(),
    kpa_4_2: createDefaultDualExtras(),
    competencies_4_3: createDefaultDualExtras(),
    framework_4_4: createDefaultDualExtras(),
    conditions: createDefaultDualExtras(),
    kpaDuties: createDefaultDualExtras(),
    ratingScale: createDefaultDualExtras(),
    timetable: createDefaultDualExtras(),
    poorPerformance: createDefaultDualExtras(),
    dispute: createDefaultDualExtras(),
    amendment: createDefaultDualExtras(),
    evaluation: createDefaultDualExtras(),
    signatures: createDefaultDualExtras(),
    annexureC: createDefaultDualExtras(),
  });

  const updateSectionExtra = (sectionKey: string, position: 'above' | 'below', updated: SectionExtraBlock) => {
    setSectionExtras(prev => {
      const existing = normalizeSectionExtras(prev, sectionKey);
      return {
        ...prev,
        [sectionKey]: {
          ...existing,
          [position]: updated
        }
      };
    });
  };

  const getSectionExtra = (sectionKey: string): DualSectionExtras => {
    return normalizeSectionExtras(sectionExtras, sectionKey);
  };

  // Dynamic KPA & Competencies Table states
  const [dynTableHeaders, setDynTableHeaders] = useState<string[]>(['KPA No', 'National KPA', 'Functional Area KPA', 'Weighting']);
  const [dynTableRows, setDynTableRows] = useState<string[][]>([
    ['1', 'Good Governance & Institutional Transformation', 'Core Team Deliverables & Operational Governance', '25%'],
    ['2', 'Municipal Financial viability and management', 'Budget Control, Asset Care & Resource Efficiency', '35%'],
    ['3', 'Basic Service Delivery & Infrastructure', 'Service Continuity & Rapid Response SLA Targets', '40%']
  ]);

  // Pulled / Adopted Tables States
  const [pulledFilteredPplanItems, setPulledFilteredPplanItems] = useState<any[] | null>(null);
  const [pullingFilteredPplan, setPullingFilteredPplan] = useState(false);
  const [pullingFilteredTeamPA, setPullingFilteredTeamPA] = useState(false);
  const [pulledPdpItems, setPulledPdpItems] = useState<any[] | null>(null);
  const [pullingPdp, setPullingPdp] = useState(false);
  const [pullingTeamPdp, setPullingTeamPdp] = useState(false);
  const [pulledJscRows, setPulledJscRows] = useState<any[] | null>(null);
  const [pullingJsc, setPullingJsc] = useState(false);
  const [pullingTeamJsc, setPullingTeamJsc] = useState(false);
  const [khuboniJscNotes, setKhuboniJscNotes] = useState<string>('Notes / Developmental Framework Commentary: Employees shall be assessed against the adopted Job Specific Competencies quarterly.');
  const [jscBelowText, setJscBelowText] = useState<string>('The Job Specific Competencies detailed above represent the core operational standards and behavioral requirements for effective service delivery under this agreement.');

  // Performance Assessment Table States
  const [pulledPerfAssessmentRows, setPulledPerfAssessmentRows] = useState<string[][] | null>(null);
  const [pulledPerfAssessmentHeaders, setPulledPerfAssessmentHeaders] = useState<string[]>([
    "Level", "Terminology", "Description", "% Score Range", "Performance Allocation & Consequences"
  ]);
  const [pulledPerfAssessmentTitle, setPulledPerfAssessmentTitle] = useState<string>("Performance Assessment Framework (5-Point Rating Scale)");
  const [pulledPerfAssessmentNotes, setPulledPerfAssessmentNotes] = useState<string>(
    "6.2 The personal development plan (PDP) will address any developmental needs identified during the performance assessment process.\n6.3 Performance evaluation results are subject to institutional moderation by the Departmental Performance Management Committee (DPMC) and Internal Audit verification."
  );
  const [pullingPerfAssessment, setPullingPerfAssessment] = useState(false);
  const [isPerfAssessmentAdopted, setIsPerfAssessmentAdopted] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const triggerNotification = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Team Leader Reporting & Member Notifications State
  const [reportingPeriod, setReportingPeriod] = useState<string>('Q1');
  const [reportingHeadline, setReportingHeadline] = useState<string>('Quarterly Team Performance Deliverables & POE Verification');
  const [reportingProgress, setReportingProgress] = useState<string>('');
  const [isDispatchingReport, setIsDispatchingReport] = useState<boolean>(false);
  const [dispatchedReports, setDispatchedReports] = useState<any[]>([]);
  const [reportingSuccessNotice, setReportingSuccessNotice] = useState<{ message: string; count: number; members: any[] } | null>(null);

  // Dynamically resolve Azure AD Team Members linked to this Team Performance Agreement
  const getTeamAzureMembers = (): { name: string; email: string; designation: string }[] => {
    const map = new Map<string, { name: string; email: string; designation: string }>();
    const leaderEmail = (currentUser?.email || '').toLowerCase().trim();

    // 1. Members from Deployment Roster tableRows
    tableRows.forEach(r => {
      const name = r[1]?.trim();
      const desig = r[2]?.trim() || 'Team Member';
      const email = r[3]?.trim();
      if (email && email.includes('@')) {
        const norm = email.toLowerCase();
        if (norm !== leaderEmail) {
          map.set(norm, { name: name || norm.split('@')[0], email: norm, designation: desig });
        }
      } else if (name) {
        // Fallback match against tenant users or directory
        const match = tenantUsers.find(u => 
          (u.fullName && u.fullName.toLowerCase().trim() === name.toLowerCase()) ||
          ((u as any).name && String((u as any).name).toLowerCase().trim() === name.toLowerCase())
        );
        if (match && match.email && match.email.includes('@') && match.email.toLowerCase() !== leaderEmail) {
          map.set(match.email.toLowerCase(), { 
            name: match.fullName || (match as any).name || name, 
            email: match.email.toLowerCase(), 
            designation: desig || match.jobFunction || match.department || 'Team Member' 
          });
        }
      }
    });

    // 2. Members from teamMemberSignatures
    teamMemberSignatures.forEach(s => {
      const email = s.email?.trim();
      const name = s.name?.trim();
      if (email && email.includes('@')) {
        const norm = email.toLowerCase();
        if (norm !== leaderEmail) {
          map.set(norm, { name: name || norm.split('@')[0], email: norm, designation: s.designation || s.title || 'Team Signatory' });
        }
      } else if (name) {
        const match = tenantUsers.find(u => 
          (u.fullName && u.fullName.toLowerCase().trim() === name.toLowerCase()) ||
          ((u as any).name && String((u as any).name).toLowerCase().trim() === name.toLowerCase())
        );
        if (match && match.email && match.email.includes('@') && match.email.toLowerCase() !== leaderEmail) {
          map.set(match.email.toLowerCase(), { 
            name: match.fullName || (match as any).name || name, 
            email: match.email.toLowerCase(), 
            designation: s.designation || s.title || match.jobFunction || 'Team Signatory' 
          });
        }
      }
    });

    return Array.from(map.values());
  };

  // Fetch historical dispatched team reports from Supabase
  const loadDispatchedReports = async () => {
    if (!activeTenantId) return;
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/team-reporting?documentIdSuffix=${documentIdSuffix}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.reports)) {
          const teamReps = data.reports.filter((r: any) => r.teamIndex === activeTeamIndex || r.teamName === currentTeam.name);
          setDispatchedReports(teamReps);
        }
      }
    } catch (e) {
      console.warn("Failed to load team reports:", e);
    }
  };

  useEffect(() => {
    loadDispatchedReports();
  }, [activeTenantId, activeTeamIndex, documentIdSuffix]);

  // Dispatch Team Reporting & Notify All Azure AD Team Members on their individual profiles
  const handleDispatchTeamReport = async () => {
    const azureMembers = getTeamAzureMembers();
    if (azureMembers.length === 0) {
      alert("No Azure AD team members were detected for this team. Please select team members from Azure AD in Section 1 (Deployment Roster) or Section 13 (Signatories) first.");
      return;
    }

    const summaryText = reportingProgress.trim() || reporting.trim() || `Quarterly operational targets for ${currentTeam.name} (${reportingPeriod}) have been fulfilled in accordance with performance agreement standards.`;
    const headlineText = reportingHeadline.trim() || `Team Performance Report: ${currentTeam.name} (${reportingPeriod})`;

    setIsDispatchingReport(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/team-reporting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamTitle,
          teamName: currentTeam.name,
          teamIndex: activeTeamIndex,
          documentIdSuffix,
          leaderEmail: currentUser.email,
          leaderName: currentUser.fullName || currentUser.email,
          period: reportingPeriod,
          reportTitle: headlineText,
          reportSummary: summaryText,
          teamMembers: azureMembers
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReportingSuccessNotice({
          message: `Successfully reported and notified ${data.notifiedMembersCount} team member(s) directly on their individual IPMS profiles!`,
          count: data.notifiedMembersCount,
          members: data.notifiedMembers || azureMembers
        });
        triggerNotification(`Team report dispatched! ${data.notifiedMembersCount} team member(s) notified on their individual profiles.`, 'success');
        loadDispatchedReports();
        // Also auto-save draft
        saveToProfile();
      } else {
        throw new Error("Failed to dispatch team report");
      }
    } catch (err: any) {
      console.error("Team report dispatch error:", err);
      triggerNotification("Failed to dispatch team report. Check network connection.", 'error');
    } finally {
      setIsDispatchingReport(false);
    }
  };

  const DEFAULT_FILTERED_PPLAN_ITEMS = [
    {
      id: 'pplan-team-1',
      kpa: 'Basic Service Delivery & Infrastructure Development',
      kpi: 'Percentage adherence to operational service delivery turnaround times and standard SLAs',
      baseline: '92%',
      annualTarget: '100% SLA Adherence',
      q1: '100%',
      q2: '100%',
      q3: '100%',
      q4: '100%',
      poe: 'Quarterly Incident & Service Delivery Response Logs, SLA Compliance Reports',
      weighting: '40%'
    },
    {
      id: 'pplan-team-2',
      kpa: 'Good Governance & Institutional Transformation',
      kpi: 'Submission of 100% compliant Portfolio of Evidence (POE) for all quarterly performance reviews',
      baseline: '100%',
      annualTarget: '100% Compliant POE',
      q1: '100%',
      q2: '100%',
      q3: '100%',
      q4: '100%',
      poe: 'Approved Quarterly Performance Review Reports, Verified POE Matrices',
      weighting: '30%'
    },
    {
      id: 'pplan-team-3',
      kpa: 'Municipal Financial Viability & Management',
      kpi: 'Adherence to departmental operational budget allocation, zero unauthorized expenditure & asset care',
      baseline: '0 Unauthorized Exp',
      annualTarget: '100% Budget & Asset Compliance',
      q1: '100%',
      q2: '100%',
      q3: '100%',
      q4: '100%',
      poe: 'Monthly Budget Variance Reports, Asset Verification Registers',
      weighting: '30%'
    }
  ];

  const KHUBONI_Y_DEFAULT_PDP_TABLE = [
    {
      id: 'pdp-team-1',
      skillsGap: 'Operational SLA Delivery & Performance Standard Monitoring',
      outcomes: 'Achieve 100% adherence to district municipal operational response SLAs.',
      suggestedTraining: 'Advanced Municipal Operations & Technical Quality Assurance',
      modeOfDelivery: 'Workplace Coaching & Guided Specialized Module',
      timeFrame: '6 Months (Q1 - Q2)',
      workOpportunity: 'Assigned to lead operational inspection & compliance auditing',
      supportPerson: 'Head of Department / Director'
    },
    {
      id: 'pdp-team-2',
      skillsGap: 'MFMA Asset Management & Portfolio of Evidence (POE) Standard Compliance',
      outcomes: 'Maintain 100% POE compliance for all institutional quarterly performance reviews.',
      suggestedTraining: 'Municipal Performance Management & POE Compliance Frameworks',
      modeOfDelivery: 'Formal Executive Workshop & Peer Moderation',
      timeFrame: '3 Months (Q1)',
      workOpportunity: 'Direct quarterly team review moderation & evidence verification',
      supportPerson: 'PMS Official / Supervisor'
    }
  ];

  const KHUBONI_Y_DEFAULT_JSC_TABLE = [
    {
      id: 'jsc-team-1',
      jscNo: 'JSC-101',
      competency: 'Strategic Operational Execution & Service Delivery Standards',
      definition: {
        mainText: 'Directs, executes, and oversees high-quality service delivery standards in direct alignment with Municipal Systems Act (Act 32 of 2000) and SDBIP key operational targets.',
        subsections: [
          { heading: 'Key Technical Focus', paragraphs: ['Operational efficiency benchmarks and turnaround timelines', 'Risk mitigation and service continuity management'] },
          { heading: 'Operational Standards', paragraphs: ['Maintains zero backlog SLA targets across all quarterly operational indicators.'] }
        ]
      },
      level: 'Level 4: Superior Leader',
      weight: 35
    },
    {
      id: 'jsc-team-2',
      jscNo: 'JSC-102',
      competency: 'Institutional Performance Management System (IPMS) & SDBIP Alignment',
      definition: {
        mainText: 'Aligns institutional scorecards, operational logs, and quarterly deliverables to District SDBIP priorities.',
        subsections: [
          { heading: 'Regulatory Framework', paragraphs: ['Municipal Systems Act Performance Regulations compliance'] },
          { heading: 'Verification Protocol', paragraphs: ['Audits Portfolio of Evidence (POE) compliance across all team deliverables.'] }
        ]
      },
      level: 'Level 4: Superior Leader',
      weight: 35
    },
    {
      id: 'jsc-team-3',
      jscNo: 'JSC-103',
      competency: 'Risk Governance, Compliance & Internal Control Moderation',
      definition: {
        mainText: 'Executes statutory governance, risk control frameworks, and compliance reporting across all municipal engagements.',
        subsections: [
          { heading: 'Compliance Focus', paragraphs: ['National Treasury MFMA statutory compliance & standard operating procedures'] }
        ]
      },
      level: 'Level 3: Advanced Architect',
      weight: 30
    }
  ];

  const handlePullFilteredPerformancePlan = async () => {
    setPullingFilteredPplan(true);
    try {
      const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(emailToUse)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setPulledFilteredPplanItems(data.items);
          setIsPPlanAdopted(true);
          triggerNotification(`Successfully adopted ${data.items.length} Filtered Performance Plan items into Annexure A!`, "success");
        } else {
          setPulledFilteredPplanItems(DEFAULT_FILTERED_PPLAN_ITEMS);
          setIsPPlanAdopted(true);
          triggerNotification("Adopted Filtered Annual Performance Plan (KPA & KPI matrix) into Annexure A!", "success");
        }
      } else {
        setPulledFilteredPplanItems(DEFAULT_FILTERED_PPLAN_ITEMS);
        setIsPPlanAdopted(true);
        triggerNotification("Adopted Filtered Annual Performance Plan (KPA & KPI matrix) into Annexure A!", "success");
      }
    } catch (err: any) {
      console.error(err);
      setPulledFilteredPplanItems(DEFAULT_FILTERED_PPLAN_ITEMS);
      setIsPPlanAdopted(true);
      triggerNotification("Adopted Filtered Annual Performance Plan (KPA & KPI matrix) into Annexure A!", "success");
    } finally {
      setPullingFilteredPplan(false);
    }
  };

  const handlePullFilteredTeamPA = async () => {
    setPullingFilteredTeamPA(true);
    try {
      const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');
      const res = await fetch(`/api/tenant/${activeTenantId}/team-pplan?userId=${encodeURIComponent(emailToUse)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setPulledFilteredPplanItems(data.items);
          setIsPPlanAdopted(true);
          triggerNotification(`Successfully adopted ${data.items.length} Filtered Team Performance Plan items into Annexure A!`, "success");
          return;
        }
      }
      // Try tenant all fallback
      const allRes = await fetch(`/api/tenant/${activeTenantId}/team-pplan?userId=all&t=${Date.now()}`);
      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData && Array.isArray(allData.items) && allData.items.length > 0) {
          setPulledFilteredPplanItems(allData.items);
          setIsPPlanAdopted(true);
          triggerNotification(`Successfully adopted ${allData.items.length} Filtered Team Performance Plan items into Annexure A!`, "success");
          return;
        }
      }
      setPulledFilteredPplanItems(DEFAULT_FILTERED_PPLAN_ITEMS);
      setIsPPlanAdopted(true);
      triggerNotification("Adopted Filtered Team Performance Plan (KPA & KPI matrix) into Annexure A!", "success");
    } catch (err: any) {
      console.error(err);
      setPulledFilteredPplanItems(DEFAULT_FILTERED_PPLAN_ITEMS);
      setIsPPlanAdopted(true);
      triggerNotification("Adopted Filtered Team Performance Plan (KPA & KPI matrix) into Annexure A!", "success");
    } finally {
      setPullingFilteredTeamPA(false);
    }
  };

  const handlePullPDP = async () => {
    setPullingPdp(true);
    try {
      const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');
      const res = await fetch(`/api/tenant/${activeTenantId}/pdp?userId=${encodeURIComponent(emailToUse)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setPulledPdpItems(data.items);
          setIsPdpAdopted(true);
          triggerNotification(`Successfully pulled ${data.items.length} PDP items for ${emailToUse}!`, "success");
        } else {
          setPulledPdpItems(KHUBONI_Y_DEFAULT_PDP_TABLE);
          setIsPdpAdopted(true);
          triggerNotification("Adopted Personal Development Plan (PDP) table matrix!", "success");
        }
      } else {
        setPulledPdpItems(KHUBONI_Y_DEFAULT_PDP_TABLE);
        setIsPdpAdopted(true);
        triggerNotification("Adopted Personal Development Plan (PDP) table matrix!", "success");
      }
    } catch (err: any) {
      console.error(err);
      setPulledPdpItems(KHUBONI_Y_DEFAULT_PDP_TABLE);
      setIsPdpAdopted(true);
      triggerNotification("Adopted Personal Development Plan (PDP) table matrix!", "success");
    } finally {
      setPullingPdp(false);
    }
  };

  const handlePullProfileJscTable = async () => {
    setPullingJsc(true);
    try {
      const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');
      const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(emailToUse)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.competencies) && data.competencies.length > 0) {
          setPulledJscRows(data.competencies);
          setIsJscAdopted(true);
          triggerNotification(`Successfully pulled entire Profile JSC Table (${data.competencies.length} items) from profile ${emailToUse}!`, "success");
        } else {
          setPulledJscRows(KHUBONI_Y_DEFAULT_JSC_TABLE);
          setIsJscAdopted(true);
          triggerNotification(`Adopted Profile JSC Table from profile ${emailToUse}!`, "success");
        }
      } else {
        setPulledJscRows(KHUBONI_Y_DEFAULT_JSC_TABLE);
        setIsJscAdopted(true);
        triggerNotification(`Adopted Profile JSC Table from profile ${emailToUse}!`, "success");
      }
    } catch (err: any) {
      console.error(err);
      setPulledJscRows(KHUBONI_Y_DEFAULT_JSC_TABLE);
      setIsJscAdopted(true);
      triggerNotification(`Adopted Profile JSC Table from profile ${(currentUser?.email || 'khuboniy@nkangaladm.gov.za').toLowerCase().trim()}!`, "success");
    } finally {
      setPullingJsc(false);
    }
  };

  const handleAdoptTeamPdp = async () => {
    setPullingTeamPdp(true);
    try {
      const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');
      const res = await fetch(`/api/tenant/${activeTenantId}/team-pdp?userId=${encodeURIComponent(emailToUse)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setPulledPdpItems(data.items);
          setIsPdpAdopted(true);
          triggerNotification(`Successfully adopted ${data.items.length} items from Team PDP table!`, "success");
        } else {
          const genericRes = await fetch(`/api/tenant/${activeTenantId}/team-pdp?userId=default&t=${Date.now()}`);
          const genericData = genericRes.ok ? await genericRes.json() : null;
          if (genericData && Array.isArray(genericData.items) && genericData.items.length > 0) {
            setPulledPdpItems(genericData.items);
            setIsPdpAdopted(true);
            triggerNotification(`Successfully adopted ${genericData.items.length} items from Team PDP table!`, "success");
          } else {
            setPulledPdpItems(KHUBONI_Y_DEFAULT_PDP_TABLE);
            setIsPdpAdopted(true);
            triggerNotification("Adopted Team Personal Development Plan (Team PDP) table matrix!", "success");
          }
        }
      } else {
        setPulledPdpItems(KHUBONI_Y_DEFAULT_PDP_TABLE);
        setIsPdpAdopted(true);
        triggerNotification("Adopted Team Personal Development Plan (Team PDP) table matrix!", "success");
      }
    } catch (err: any) {
      console.error("Error adopting Team PDP:", err);
      setPulledPdpItems(KHUBONI_Y_DEFAULT_PDP_TABLE);
      setIsPdpAdopted(true);
      triggerNotification("Adopted Team PDP table matrix!", "success");
    } finally {
      setPullingTeamPdp(false);
    }
  };

  const handleAdoptTeamJsc = async () => {
    setPullingTeamJsc(true);
    try {
      const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');
      const res = await fetch(`/api/tenant/${activeTenantId}/team-job-competencies?userId=${encodeURIComponent(emailToUse)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.competencies) && data.competencies.length > 0) {
          setPulledJscRows(data.competencies);
          setIsJscAdopted(true);
          triggerNotification(`Successfully adopted ${data.competencies.length} competencies from Team JSC table!`, "success");
        } else {
          const genericRes = await fetch(`/api/tenant/${activeTenantId}/team-job-competencies?userId=default&t=${Date.now()}`);
          const genericData = genericRes.ok ? await genericRes.json() : null;
          if (genericData && Array.isArray(genericData.competencies) && genericData.competencies.length > 0) {
            setPulledJscRows(genericData.competencies);
            setIsJscAdopted(true);
            triggerNotification(`Successfully adopted ${genericData.competencies.length} competencies from Team JSC table!`, "success");
          } else {
            setPulledJscRows(KHUBONI_Y_DEFAULT_JSC_TABLE);
            setIsJscAdopted(true);
            triggerNotification("Adopted Team Job Specific Competencies (Team JSC) table matrix!", "success");
          }
        }
      } else {
        setPulledJscRows(KHUBONI_Y_DEFAULT_JSC_TABLE);
        setIsJscAdopted(true);
        triggerNotification("Adopted Team Job Specific Competencies (Team JSC) table matrix!", "success");
      }
    } catch (err: any) {
      console.error("Error adopting Team JSC:", err);
      setPulledJscRows(KHUBONI_Y_DEFAULT_JSC_TABLE);
      setIsJscAdopted(true);
      triggerNotification("Adopted Team JSC table matrix!", "success");
    } finally {
      setPullingTeamJsc(false);
    }
  };

  const DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG = {
    title: "Performance Assessment Framework (5-Point Rating Scale)",
    headers: ["Level", "Terminology", "Description", "% Score Range", "Performance Allocation & Consequences"],
    rows: [
      [
        "5",
        "Outstanding Performance",
        "Performance far exceeds the standard expected of an employee at this level. The appraisal indicates that the Employee has achieved exceptional results against all performance criteria and specifications throughout the year.",
        "130% - 160%",
        "Eligible for maximum Performance Bonus and recognition awards in terms of municipal policy."
      ],
      [
        "4",
        "Performance Significantly Above Expectations",
        "Performance is significantly higher than the standard expected in the position with respect to quality, quantity, and timeliness of deliverables.",
        "100% - 129%",
        "Eligible for Merit Performance Bonus consideration in accordance with performance moderation rules."
      ],
      [
        "3",
        "Fully Effective",
        "Performance fully meets the standard expected in all areas of the position. The employee has achieved 100% of agreed quarterly objectives and key performance indicators satisfactorily.",
        "100%",
        "Standard compliant delivery; maintains normal salary progression and good performance standing."
      ],
      [
        "2",
        "Performance Not Fully Effective",
        "Performance is below the standard required for the job in key areas. Corrective action and structured personal development plan (PDP) intervention required.",
        "60% - 99%",
        "Mandatory PDP targeted training; remedial action timeline established; ineligible for performance bonus."
      ],
      [
        "1",
        "Unacceptable Performance",
        "Performance does not meet the standard expected for the job. The employee has failed to demonstrate the minimum required output despite prior counseling and guidance.",
        "< 60%",
        "Formal capability / incapacity proceedings initiated in terms of applicable municipal regulations."
      ]
    ],
    notesBelow: "6.2 The personal development plan (PDP) will address any developmental needs identified during the performance assessment process.\n6.3 Performance evaluation results are subject to institutional moderation by the Departmental Performance Management Committee (DPMC) and Internal Audit verification."
  };

  const handlePullPerformanceAssessment = async () => {
    setPullingPerfAssessment(true);
    try {
      const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');
      const res = await fetch(`/api/tenant/${activeTenantId}/performance-assessment-config?userId=${encodeURIComponent(emailToUse)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.rows) && data.rows.length > 0) {
          setPulledPerfAssessmentRows(data.rows);
          if (Array.isArray(data.headers) && data.headers.length > 0) {
            setPulledPerfAssessmentHeaders(data.headers);
          }
          if (data.title) {
            setPulledPerfAssessmentTitle(data.title);
          }
          if (data.notesBelow) {
            setPulledPerfAssessmentNotes(data.notesBelow);
          }
          setIsPerfAssessmentAdopted(true);
          triggerNotification(`Successfully adopted Performance Assessment Table (${data.rows.length} levels) below Point 6.1!`, "success");
        } else {
          setPulledPerfAssessmentRows(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.rows);
          setPulledPerfAssessmentHeaders(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.headers);
          setPulledPerfAssessmentTitle(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.title);
          setPulledPerfAssessmentNotes(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.notesBelow);
          setIsPerfAssessmentAdopted(true);
          triggerNotification("Adopted statutory Performance Assessment Table (5-point rating scale) below Point 6.1!", "success");
        }
      } else {
        setPulledPerfAssessmentRows(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.rows);
        setPulledPerfAssessmentHeaders(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.headers);
        setPulledPerfAssessmentTitle(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.title);
        setPulledPerfAssessmentNotes(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.notesBelow);
        setIsPerfAssessmentAdopted(true);
        triggerNotification("Adopted statutory Performance Assessment Table (5-point rating scale) below Point 6.1!", "success");
      }
    } catch (err: any) {
      console.error("Error adopting performance assessment table:", err);
      setPulledPerfAssessmentRows(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.rows);
      setPulledPerfAssessmentHeaders(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.headers);
      setPulledPerfAssessmentTitle(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.title);
      setPulledPerfAssessmentNotes(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.notesBelow);
      setIsPerfAssessmentAdopted(true);
      triggerNotification("Adopted statutory Performance Assessment Table (5-point rating scale) below Point 6.1!", "success");
    } finally {
      setPullingPerfAssessment(false);
    }
  };

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

      const findSig = (name?: string, email?: string) => {
        const match = combined.find(u => 
          (email && u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim()) ||
          (name && u.fullName && u.fullName.toLowerCase().trim() === name.toLowerCase().trim())
        );
        return match?.signatureData || '';
      };

      // Sync Institutional Signatures
      setInstitutionalSignatures(prev => {
        return prev.map(inst => {
          const sig = findSig(inst.name, inst.email);
          if (sig && sig !== inst.signatureData) {
            return { ...inst, signatureData: sig };
          }
          return inst;
        });
      });

      // Sync Team Member Signatures
      setTeamMemberSignatures(prev => {
        return prev.map(m => {
          const sig = findSig(m.name, m.email);
          if (sig && sig !== m.signatureData) {
            return { ...m, signatureData: sig };
          }
          return m;
        });
      });

      // Backwards-compatible userSignatures sync
      setUserSignatures(prev => {
        const next = { ...prev };
        let changed = false;

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
          if (state.framework !== undefined) setFramework(cleanFrameworkText(state.framework));
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
          if (Array.isArray(state.institutionalSignatures) && state.institutionalSignatures.length > 0) {
            setInstitutionalSignatures(state.institutionalSignatures);
          } else if (state.userSignatures) {
            // Fallback from legacy userSignatures (excluding witness by default)
            const legacyInst: InstitutionalSignatory[] = [
              {
                id: 'inst_sig_manager',
                title: state.userSignatures.managerTitle || 'Signed by Direct Manager / Supervisor:',
                name: state.userSignatures.manager || 'M.L. Mahlangu',
                designation: 'Direct Manager / Supervisor',
                email: state.userSignatures.managerEmail || '',
                signatureData: state.userSignatures.managerSig || '',
                date: new Date().toLocaleDateString()
              },
              {
                id: 'inst_sig_mm',
                title: state.userSignatures.mmTitle || 'Signed on behalf of Municipality (Municipal Manager):',
                name: state.userSignatures.mm || 'M.L. Mahlangu (Municipal Manager)',
                designation: 'Municipal Manager (Accounting Officer)',
                email: state.userSignatures.mmEmail || '',
                signatureData: state.userSignatures.mmSig || '',
                date: new Date().toLocaleDateString()
              },
              {
                id: 'inst_sig_hod',
                title: state.userSignatures.hodTitle || 'Signed by Head of Department / Director:',
                name: state.userSignatures.hod || 'Audrey Mpanza',
                designation: 'Head of Department / Director',
                email: state.userSignatures.hodEmail || '',
                signatureData: state.userSignatures.hodSig || '',
                date: new Date().toLocaleDateString()
              }
            ];
            setInstitutionalSignatures(legacyInst);
          }
          if (Array.isArray(state.teamMemberSignatures) && state.teamMemberSignatures.length > 0) {
            setTeamMemberSignatures(state.teamMemberSignatures);
          }
          if (state.annexureA !== undefined) setAnnexureA(state.annexureA);
          if (state.annexureB !== undefined) setAnnexureB(state.annexureB);
          if (state.annexureC !== undefined) setAnnexureC(state.annexureC);
          if (state.includeJSC !== undefined) setIncludeJSC(state.includeJSC);
          if (Array.isArray(state.reviewRows)) setReviewRows(state.reviewRows);
          if (state.teamRosterNotes !== undefined) setTeamRosterNotes(state.teamRosterNotes);
          if (Array.isArray(state.dynTableHeaders)) setDynTableHeaders(state.dynTableHeaders);
          if (Array.isArray(state.dynTableRows)) setDynTableRows(state.dynTableRows);
          if (state.pulledFilteredPplanItems !== undefined) setPulledFilteredPplanItems(state.pulledFilteredPplanItems);
          if (state.pulledPdpItems !== undefined) setPulledPdpItems(state.pulledPdpItems);
          if (state.pulledJscRows !== undefined) setPulledJscRows(state.pulledJscRows);
          if (state.khuboniJscNotes !== undefined) setKhuboniJscNotes(state.khuboniJscNotes);
          if (state.jscBelowText !== undefined) {
            setJscBelowText(state.jscBelowText);
          } else if (state.khuboniJscNotes !== undefined) {
            setJscBelowText(state.khuboniJscNotes);
          }
          if (state.isPdpAdopted !== undefined) setIsPdpAdopted(state.isPdpAdopted);
          if (state.isJscAdopted !== undefined) setIsJscAdopted(state.isJscAdopted);
          if (state.isPPlanAdopted !== undefined) setIsPPlanAdopted(state.isPPlanAdopted);
          if (state.pulledPerfAssessmentRows !== undefined) setPulledPerfAssessmentRows(state.pulledPerfAssessmentRows);
          if (state.pulledPerfAssessmentHeaders !== undefined) setPulledPerfAssessmentHeaders(state.pulledPerfAssessmentHeaders);
          if (state.pulledPerfAssessmentTitle !== undefined) setPulledPerfAssessmentTitle(state.pulledPerfAssessmentTitle);
          if (state.pulledPerfAssessmentNotes !== undefined) setPulledPerfAssessmentNotes(state.pulledPerfAssessmentNotes);
          if (state.isPerfAssessmentAdopted !== undefined) setIsPerfAssessmentAdopted(state.isPerfAssessmentAdopted);

          // Restore Headings
          if (state.headingMainTitle !== undefined) setHeadingMainTitle(state.headingMainTitle);
          if (state.headingRoster !== undefined) setHeadingRoster(state.headingRoster);
          if (state.headingPurpose !== undefined) setHeadingPurpose(state.headingPurpose);
          if (state.headingValidity !== undefined) setHeadingValidity(state.headingValidity);
          if (state.headingReporting !== undefined) setHeadingReporting(state.headingReporting);
          if (state.headingFramework !== undefined) setHeadingFramework(state.headingFramework);
          if (state.headingKpaTable !== undefined) setHeadingKpaTable(state.headingKpaTable);
          if (state.headingPplanTable !== undefined) setHeadingPplanTable(state.headingPplanTable);
          if (state.headingCompetencies !== undefined) setHeadingCompetencies(state.headingCompetencies);
          if (state.headingFramework44 !== undefined) setHeadingFramework44(state.headingFramework44);
          if (state.headingJscTable !== undefined) setHeadingJscTable(state.headingJscTable);
          if (state.headingConditions !== undefined) setHeadingConditions(state.headingConditions);
          if (state.headingKpaDuties !== undefined) setHeadingKpaDuties(state.headingKpaDuties);
          if (state.headingRatingScale !== undefined) setHeadingRatingScale(state.headingRatingScale);
          if (state.headingTimetable !== undefined) setHeadingTimetable(state.headingTimetable);
          if (state.headingPoorPerformance !== undefined) setHeadingPoorPerformance(state.headingPoorPerformance);
          if (state.headingDispute !== undefined) setHeadingDispute(state.headingDispute);
          if (state.headingAmendment !== undefined) setHeadingAmendment(state.headingAmendment);
          if (state.headingEvaluation !== undefined) setHeadingEvaluation(state.headingEvaluation);
          if (state.headingSignatures !== undefined) setHeadingSignatures(state.headingSignatures);
          if (state.headingAnnexureC !== undefined) setHeadingAnnexureC(state.headingAnnexureC);

          if (state.sectionExtras !== undefined) {
            const normalized: Record<string, DualSectionExtras> = {};
            const allKeys = [
              'coverPage', 'roster', 'purpose', 'validity', 'reporting', 'framework',
              'kpa_4_2', 'competencies_4_3', 'framework_4_4', 'jsc_table', 'conditions', 'kpaDuties',
              'ratingScale', 'timetable', 'poorPerformance', 'dispute', 'amendment',
              'evaluation', 'signatures', 'annexureA', 'annexureC'
            ];
            allKeys.forEach(k => {
              normalized[k] = normalizeSectionExtras(state.sectionExtras, k);
            });
            setSectionExtras(normalized);
          }
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
        headingMainTitle,
        headingRoster,
        headingPurpose,
        headingValidity,
        headingReporting,
        headingFramework,
        headingKpaTable,
        headingPplanTable,
        headingCompetencies,
        headingFramework44,
        headingJscTable,
        headingConditions,
        headingKpaDuties,
        headingRatingScale,
        headingTimetable,
        headingPoorPerformance,
        headingDispute,
        headingAmendment,
        headingEvaluation,
        headingSignatures,
        headingAnnexureC,
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
        institutionalSignatures,
        teamMemberSignatures,
        annexureA,
        annexureB,
        annexureC,
        includeJSC,
        reviewRows,
        sectionExtras,
        isPdpAdopted,
        isJscAdopted,
        isPPlanAdopted,
        isPerfAssessmentAdopted,
        pulledFilteredPplanItems,
        pulledPdpItems,
        pulledJscRows,
        pulledPerfAssessmentRows,
        pulledPerfAssessmentHeaders,
        pulledPerfAssessmentTitle,
        pulledPerfAssessmentNotes,
        khuboniJscNotes,
        jscBelowText,
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
        headingMainTitle,
        headingRoster,
        headingPurpose,
        headingValidity,
        headingReporting,
        headingFramework,
        headingKpaTable,
        headingPplanTable,
        headingCompetencies,
        headingFramework44,
        headingJscTable,
        headingConditions,
        headingKpaDuties,
        headingRatingScale,
        headingTimetable,
        headingPoorPerformance,
        headingDispute,
        headingAmendment,
        headingEvaluation,
        headingSignatures,
        headingAnnexureC,
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
        institutionalSignatures,
        teamMemberSignatures,
        annexureA,
        annexureB,
        annexureC,
        includeJSC,
        reviewRows,
        sectionExtras,
        isPdpAdopted,
        isJscAdopted,
        isPPlanAdopted,
        isPerfAssessmentAdopted,
        pulledFilteredPplanItems,
        pulledPdpItems,
        pulledJscRows,
        pulledPerfAssessmentRows,
        pulledPerfAssessmentHeaders,
        pulledPerfAssessmentTitle,
        pulledPerfAssessmentNotes,
        khuboniJscNotes,
        jscBelowText,
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
  const handleBulkAddMembers = (newMembers: { name: string; designation: string; email?: string }[]) => {
    const startIdx = tableRows.length + 1;
    const addedRows: string[][] = newMembers.map((m, i) => [
      String(startIdx + i),
      m.name,
      m.designation,
      m.email || ''
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
        
        {/* Notification Toast */}
        {notification && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {notification.text}
            </span>
            <button 
              type="button" 
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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

        {/* SYSTEM INTEGRATION & ADOPTION CARD */}
        <div className="bg-linear-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-xl shadow-md border border-emerald-800/60 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Institutional Data Integration &amp; Table Adoption
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Pull and adopt institutional frameworks directly into the team agreement
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 pt-1">
            {/* Button 1: Pull Filtered Performance Planner Table */}
            <div className="flex flex-col gap-1.5 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Table2 className="w-3.5 h-3.5 text-emerald-400" />
                  Performance Planner
                </span>
                {pulledFilteredPplanItems && pulledFilteredPplanItems.length > 0 && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    {pulledFilteredPplanItems.length} Loaded
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handlePullFilteredPerformancePlan}
                disabled={pullingFilteredPplan}
                className="w-full px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {pullingFilteredPplan ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Pulling...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Pull Filtered Performance Planner</span>
                  </>
                )}
              </button>
              {pulledFilteredPplanItems && pulledFilteredPplanItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPulledFilteredPplanItems(null);
                    setIsPPlanAdopted(false);
                  }}
                  className="text-[9.5px] text-slate-400 hover:text-rose-400 text-center underline cursor-pointer"
                >
                  Clear Adopted Table
                </button>
              )}
            </div>

            {/* Button 1B: Pull Filtered Team PA */}
            <div className="flex flex-col gap-1.5 bg-slate-800/80 p-2.5 rounded-lg border border-teal-700/60">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-teal-300 uppercase flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  Team PA Plan
                </span>
                {pulledFilteredPplanItems && pulledFilteredPplanItems.length > 0 && (
                  <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">
                    {pulledFilteredPplanItems.length} Loaded
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handlePullFilteredTeamPA}
                disabled={pullingFilteredTeamPA}
                className="w-full px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {pullingFilteredTeamPA ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Pulling...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    <span>Pull Filtered Team PA</span>
                  </>
                )}
              </button>
              {pulledFilteredPplanItems && pulledFilteredPplanItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPulledFilteredPplanItems(null);
                    setIsPPlanAdopted(false);
                  }}
                  className="text-[9.5px] text-slate-400 hover:text-rose-400 text-center underline cursor-pointer"
                >
                  Clear Adopted Table
                </button>
              )}
            </div>

            {/* Button: Adopt Team PDP */}
            <div className="flex flex-col gap-1.5 bg-slate-800/80 p-2.5 rounded-lg border border-amber-500/60">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  Team PDP
                </span>
                {pulledPdpItems && pulledPdpItems.length > 0 && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                    {pulledPdpItems.length} Adopted
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAdoptTeamPdp}
                disabled={pullingTeamPdp}
                className="w-full px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {pullingTeamPdp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adopting...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Adopt Team PDP</span>
                  </>
                )}
              </button>
              {pulledPdpItems && pulledPdpItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPulledPdpItems(null);
                    setIsPdpAdopted(false);
                  }}
                  className="text-[9.5px] text-slate-400 hover:text-rose-400 text-center underline cursor-pointer"
                >
                  Clear Adopted Table
                </button>
              )}
            </div>

            {/* Button 2: Adopt Personal Development Plan */}
            <div className="flex flex-col gap-1.5 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                  Individual PDP
                </span>
                {pulledPdpItems && pulledPdpItems.length > 0 && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                    {pulledPdpItems.length} Adopted
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handlePullPDP}
                disabled={pullingPdp}
                className="w-full px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {pullingPdp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adopting...</span>
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Adopt PDP</span>
                  </>
                )}
              </button>
              {pulledPdpItems && pulledPdpItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPulledPdpItems(null);
                    setIsPdpAdopted(false);
                  }}
                  className="text-[9.5px] text-slate-400 hover:text-rose-400 text-center underline cursor-pointer"
                >
                  Clear Adopted Table
                </button>
              )}
            </div>

            {/* Button: Adopt Team JSC */}
            <div className="flex flex-col gap-1.5 bg-slate-800/80 p-2.5 rounded-lg border border-indigo-500/60">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-indigo-300 uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  Team JSC
                </span>
                {pulledJscRows && pulledJscRows.length > 0 && (
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                    {pulledJscRows.length} Adopted
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAdoptTeamJsc}
                disabled={pullingTeamJsc}
                className="w-full px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {pullingTeamJsc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adopting...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    <span>Adopt Team JSC</span>
                  </>
                )}
              </button>
              {pulledJscRows && pulledJscRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPulledJscRows(null);
                    setIsJscAdopted(false);
                  }}
                  className="text-[9.5px] text-slate-400 hover:text-rose-400 text-center underline cursor-pointer"
                >
                  Clear Adopted Table
                </button>
              )}
            </div>

            {/* Button 3: Adopt Profile JSC Table */}
            <div className="flex flex-col gap-1.5 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  Profile JSC
                </span>
                {pulledJscRows && pulledJscRows.length > 0 && (
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                    {pulledJscRows.length} Adopted
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handlePullProfileJscTable}
                disabled={pullingJsc}
                className="w-full px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {pullingJsc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adopting...</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Adopt Profile JSC</span>
                  </>
                )}
              </button>
              {pulledJscRows && pulledJscRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPulledJscRows(null);
                    setIsJscAdopted(false);
                  }}
                  className="text-[9.5px] text-slate-400 hover:text-rose-400 text-center underline cursor-pointer"
                >
                  Clear Adopted Table
                </button>
              )}
            </div>

            {/* Button 4: Adopt Performance Assessment Table */}
            <div className="flex flex-col gap-1.5 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-purple-400" />
                  Performance Assessment
                </span>
                {pulledPerfAssessmentRows && pulledPerfAssessmentRows.length > 0 && (
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">
                    {pulledPerfAssessmentRows.length} Levels
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handlePullPerformanceAssessment}
                disabled={pullingPerfAssessment}
                className="w-full px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {pullingPerfAssessment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adopting Assessment...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-3.5 h-3.5" />
                    <span>Adopt Performance Assessment Table</span>
                  </>
                )}
              </button>
              {pulledPerfAssessmentRows && pulledPerfAssessmentRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPulledPerfAssessmentRows(null);
                    setIsPerfAssessmentAdopted(false);
                  }}
                  className="text-[9.5px] text-slate-400 hover:text-rose-400 text-center underline cursor-pointer"
                >
                  Clear Adopted Table
                </button>
              )}
            </div>
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
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above Cover Page)"
            position="above"
            extra={getSectionExtra('coverPage').above}
            onChange={val => updateSectionExtra('coverPage', 'above', val)}
          />
          <textarea 
            value={coverPage} 
            onChange={e => setCoverPage(e.target.value)} 
            rows={5} 
            className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-mono" 
          />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below Cover Page)"
            position="below"
            extra={getSectionExtra('coverPage').below}
            onChange={val => updateSectionExtra('coverPage', 'below', val)}
          />
        </div>

        {/* TEAM MEMBERS ROSTER TABLE WITH AZURE AD AUTOCOMPLETE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingRoster}
              onChange={e => setHeadingRoster(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="Team Members Deployment Roster"
            />
          </div>

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

          <SectionCustomBlockEditor
            label="Additional Table & Text (Above Team Roster)"
            position="above"
            extra={getSectionExtra('roster').above}
            onChange={val => updateSectionExtra('roster', 'above', val)}
          />

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
                        newTable[rIdx] = [row[0] || String(rIdx + 1), user.fullName, designation, user.email || ''];
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

          <SectionCustomBlockEditor
            label="Additional Table & Text (Below Team Roster)"
            position="below"
            extra={getSectionExtra('roster').below}
            onChange={val => updateSectionExtra('roster', 'below', val)}
          />
        </div>

        {/* SECTION 1: PURPOSE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingPurpose}
              onChange={e => setHeadingPurpose(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="1. Purpose of Agreement"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 1. Purpose)"
            position="above"
            extra={getSectionExtra('purpose').above}
            onChange={val => updateSectionExtra('purpose', 'above', val)}
          />
          <textarea value={purpose} onChange={e => setPurpose(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 1. Purpose)"
            position="below"
            extra={getSectionExtra('purpose').below}
            onChange={val => updateSectionExtra('purpose', 'below', val)}
          />
        </div>

        {/* SECTION 2: VALIDITY */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingValidity}
              onChange={e => setHeadingValidity(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="2. Validity of Agreement"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 2. Validity)"
            position="above"
            extra={getSectionExtra('validity').above}
            onChange={val => updateSectionExtra('validity', 'above', val)}
          />
          <textarea value={validity} onChange={e => setValidity(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 2. Validity)"
            position="below"
            extra={getSectionExtra('validity').below}
            onChange={val => updateSectionExtra('validity', 'below', val)}
          />
        </div>

        {/* SECTION 3: REPORTING & MEMBER NOTIFICATIONS */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingReporting}
              onChange={e => setHeadingReporting(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="3. Reporting Requirements & Lines"
            />
          </div>

          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 3. Reporting)"
            position="above"
            extra={getSectionExtra('reporting').above}
            onChange={val => updateSectionExtra('reporting', 'above', val)}
          />
          <textarea value={reporting} onChange={e => setReporting(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 3. Reporting)"
            position="below"
            extra={getSectionExtra('reporting').below}
            onChange={val => updateSectionExtra('reporting', 'below', val)}
          />

          {/* TEAM LEADER REPORTING CONSOLE & PROFILE NOTIFICATIONS HUB */}
          <div className="mt-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Team Leader Reporting Console
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Individual Profile Notifications
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    When the team leader reports, all users selected from Azure AD as team members receive instant notifications on their individual profiles.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Active Team Unit</span>
                <span className="text-xs font-black text-indigo-200">{currentTeam.name || teamTitle}</span>
              </div>
            </div>

            {/* Detected Azure AD Team Members List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 font-mono">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Azure AD Team Members Linked to this Agreement ({getTeamAzureMembers().length})
                </label>
                <span className="text-[9px] text-slate-400">
                  Selected via Azure AD Search in Deployment Roster / Signatories
                </span>
              </div>

              {getTeamAzureMembers().length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950/70 border border-indigo-900/60 rounded-xl">
                  {getTeamAzureMembers().map((mem, mIdx) => (
                    <div 
                      key={mIdx} 
                      className="flex items-center gap-1.5 bg-indigo-950/90 border border-indigo-700/60 px-2.5 py-1 rounded-lg text-xs"
                      title={`${mem.name} (${mem.email}) - Will receive individual profile notifications`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span className="font-bold text-slate-100">{mem.name}</span>
                      <span className="text-[10px] text-indigo-300 font-mono">({mem.email})</span>
                      {mem.designation && (
                        <span className="text-[9px] text-slate-400 ml-1 border-l border-indigo-800 pl-1">
                          {mem.designation}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>No Azure AD team members selected yet. Search and select users from Azure AD in Section 1 (Deployment Roster) to link team profiles.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(true)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold transition shrink-0 cursor-pointer"
                  >
                    Add from Azure AD
                  </button>
                </div>
              )}
            </div>

            {/* Reporting Form Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-indigo-900/40">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase block font-mono">Reporting Period</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Q1', 'Q2', 'Mid-Term', 'Q3', 'Q4', 'Annual'] as const).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setReportingPeriod(q)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition text-center cursor-pointer ${
                        reportingPeriod === q 
                          ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase block font-mono">Report Title / Milestone Headline</label>
                <input
                  type="text"
                  value={reportingHeadline}
                  onChange={e => setReportingHeadline(e.target.value)}
                  placeholder="e.g. Q1 Operational Targets 100% Met, Deliverables Recorded"
                  className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-indigo-400 outline-none"
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase block font-mono">
                  Team Leader Reporting Narrative &amp; Actual Deliverables Summary
                </label>
                <textarea
                  value={reportingProgress}
                  onChange={e => setReportingProgress(e.target.value)}
                  placeholder={reporting || "Detail the actual quarterly deliverables, achievements, SLA turnaround times, and verified performance metrics for this reporting period..."}
                  rows={3}
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-indigo-400 outline-none"
                />
              </div>
            </div>

            {/* Success Notice Card */}
            {reportingSuccessNotice && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{reportingSuccessNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReportingSuccessNotice(null)}
                  className="text-slate-400 hover:text-white text-[10px] underline ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <span className="text-[10px] text-slate-400">
                Dispatches real-time IPMS notifications &amp; inbox communiques to each member's verified email.
              </span>

              <button
                type="button"
                onClick={handleDispatchTeamReport}
                disabled={isDispatchingReport || getTeamAzureMembers().length === 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
              >
                {isDispatchingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Notifications...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Team Report &amp; Notify Members ({getTeamAzureMembers().length})</span>
                  </>
                )}
              </button>
            </div>

            {/* Historical Dispatched Reports Log */}
            {dispatchedReports.length > 0 && (
              <div className="border-t border-indigo-900/60 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  Previously Dispatched Team Reports ({dispatchedReports.length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {dispatchedReports.map((rep, rIdx) => (
                    <div key={rIdx} className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold text-[9px] font-mono">
                            {rep.period}
                          </span>
                          <span className="font-bold text-slate-200 text-[11px]">{rep.reportTitle}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{rep.reportSummary}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-emerald-400 font-bold block">
                          ✓ {rep.notifiedMembersCount || (rep.notifiedMembers?.length || 0)} members notified
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono">
                          {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: ASSESSMENT FRAMEWORK & 4.2 KPA TABLE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section 4 Heading:</label>
            <input
              type="text"
              value={headingFramework}
              onChange={e => setHeadingFramework(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="4. Performance Assessment Framework"
            />
          </div>

          <label className="text-xs font-bold text-slate-700 uppercase block">4.1 Framework Introduction Text</label>
          
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 4.1 Framework Intro)"
            position="above"
            extra={getSectionExtra('framework').above}
            onChange={val => updateSectionExtra('framework', 'above', val)}
          />
          <textarea value={framework} onChange={e => setFramework(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 4.1 Framework Intro)"
            position="below"
            extra={getSectionExtra('framework').below}
            onChange={val => updateSectionExtra('framework', 'below', val)}
          />

          {/* 4.2 KPA Table Heading & Editor with full Column & Row addition/deletion */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 !mt-4">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">4.2 Heading:</label>
            <input
              type="text"
              value={headingKpaTable}
              onChange={e => setHeadingKpaTable(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="4.2 Key Performance Areas (KPAs) Matrix Table"
            />
          </div>

          <KPATableEditor
            headers={dynTableHeaders}
            rows={dynTableRows}
            onChangeHeaders={setDynTableHeaders}
            onChangeRows={setDynTableRows}
          />
          
          {/* Below Point 4.2 KPA Table Custom Block */}
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 4.2 KPA Table)"
            position="below"
            extra={getSectionExtra('kpa_4_2').below}
            onChange={val => updateSectionExtra('kpa_4_2', 'below', val)}
          />

          {/* 4.3 Competencies Heading & Text */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 !mt-4">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">4.3 Heading:</label>
            <input
              type="text"
              value={headingCompetencies}
              onChange={e => setHeadingCompetencies(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="4.3 Competencies Assessment Matrix Criteria"
            />
          </div>

          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 4.3 Competencies)"
            position="above"
            extra={getSectionExtra('competencies_4_3').above}
            onChange={val => updateSectionExtra('competencies_4_3', 'above', val)}
          />
          <textarea value={frameworkBelowKpa} onChange={e => setFrameworkBelowKpa(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 4.3 Competencies)"
            position="below"
            extra={getSectionExtra('competencies_4_3').below}
            onChange={val => updateSectionExtra('competencies_4_3', 'below', val)}
          />

          {/* 4.4 Framework Footer Heading & Text */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 !mt-4">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">4.4 Heading:</label>
            <input
              type="text"
              value={headingFramework44}
              onChange={e => setHeadingFramework44(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="4.4 Performance Weightings & Core Assessment Principles"
            />
          </div>

          <div className="flex justify-between items-center flex-wrap gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase block">4.4 Framework Footer Text &amp; PDP</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAdoptTeamPdp}
                disabled={pullingTeamPdp}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                title="Adopt Team Personal Development Plan (Team PDP) table into Performance Agreement"
              >
                {pullingTeamPdp ? <Loader2 className="w-3 h-3 animate-spin" /> : <GraduationCap className="w-3 h-3 text-amber-200" />}
                <span>Adopt Team PDP</span>
              </button>
              <button
                type="button"
                onClick={handlePullPDP}
                disabled={pullingPdp}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <GraduationCap className="w-3 h-3 text-amber-600" />
                <span>{pulledPdpItems && pulledPdpItems.length > 0 ? `Re-adopt PDP (${pulledPdpItems.length})` : 'Adopt Personal Development Plan'}</span>
              </button>
            </div>
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 4.4 Framework Footer)"
            position="above"
            extra={getSectionExtra('framework_4_4').above}
            onChange={val => updateSectionExtra('framework_4_4', 'above', val)}
          />
          <textarea value={frameworkBelowJsc} onChange={e => setFrameworkBelowJsc(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 4.4 Framework Footer)"
            position="below"
            extra={getSectionExtra('framework_4_4').below}
            onChange={val => updateSectionExtra('framework_4_4', 'below', val)}
          />

          {/* ADOPT PROFILE JSC TABLE BLOCK - PLACED DIRECTLY BELOW POINT NUMBER 4.4 */}
          <div className="mt-6 border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50/40 space-y-3">
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-indigo-200">
              <Edit3 className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <label className="text-[10px] font-bold text-indigo-800 uppercase shrink-0">JSC Table Heading (Below 4.4):</label>
              <input
                type="text"
                value={headingJscTable}
                onChange={e => setHeadingJscTable(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-indigo-200 rounded px-2 py-1 focus:border-indigo-500 focus:bg-white outline-none"
                placeholder="4.5 Adopted Profile Job Specific Competencies (JSC) Matrix"
              />
            </div>

            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-700" />
                  Adopt Profile JSC Table (Imported below point 4.4)
                </span>
                <p className="text-[10.5px] text-indigo-700/80">
                  Imports the official Job Specific Competencies table for this position below clause 4.4.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAdoptTeamJsc}
                  disabled={pullingTeamJsc}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Adopt Team Job Specific Competencies (Team JSC) table into Performance Agreement"
                >
                  {pullingTeamJsc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5 text-indigo-200" />}
                  <span>Adopt Team JSC</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullProfileJscTable}
                  disabled={pullingJsc}
                  className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Adopt full Profile JSC table below point 4.4"
                >
                  {pullingJsc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5 text-indigo-200" />}
                  <span>{pulledJscRows && pulledJscRows.length > 0 ? `Re-adopt Profile JSC (${pulledJscRows.length} Rows)` : 'Adopt Profile JSC Table'}</span>
                </button>

                {pulledJscRows && pulledJscRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPulledJscRows(null);
                      setIsJscAdopted(false);
                    }}
                    className="px-2 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-semibold cursor-pointer"
                    title="Remove adopted JSC Table"
                  >
                    Clear JSC
                  </button>
                )}
              </div>
            </div>

            {pulledJscRows && pulledJscRows.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-indigo-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-indigo-900 border-b border-indigo-100 pb-1">
                  <span>✓ {pulledJscRows.length} Competencies Adopted</span>
                  <span>Total Weight: {pulledJscRows.reduce((acc, curr) => acc + Number(curr.weight || 0), 0)}%</span>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-[11px] text-slate-700">
                  {pulledJscRows.map((jsc, idx) => (
                    <div key={idx} className="py-1 flex justify-between items-center">
                      <span className="font-semibold">{jsc.jscNo || `JSC-0${idx+1}`}: {jsc.competency}</span>
                      <span className="font-bold text-indigo-700">{jsc.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated Textbox Below Adopted JSC Table */}
            <div className="pt-3 border-t border-indigo-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-indigo-950 uppercase flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-700" />
                  Textbox Below Adopted JSC Table:
                </label>
                <span className="text-[10px] text-indigo-700 font-medium">Rendered directly beneath the adopted JSC table</span>
              </div>
              <SectionCustomBlockEditor
                label="Additional Table & Text (Above JSC Textbox)"
                position="above"
                extra={getSectionExtra('jsc_table').above}
                onChange={val => updateSectionExtra('jsc_table', 'above', val)}
              />
              <textarea
                value={jscBelowText}
                onChange={e => setJscBelowText(e.target.value)}
                rows={3}
                placeholder="Enter notes, operational criteria, or narrative text to display directly below the adopted Job Specific Competence table..."
                className="w-full text-xs p-3 bg-white border border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 transition"
              />
              <SectionCustomBlockEditor
                label="Additional Table & Text (Below JSC Textbox)"
                position="below"
                extra={getSectionExtra('jsc_table').below}
                onChange={val => updateSectionExtra('jsc_table', 'below', val)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: CONDITIONS */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingConditions}
              onChange={e => setHeadingConditions(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="5. Conditions of Performance"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 5. Conditions)"
            position="above"
            extra={getSectionExtra('conditions').above}
            onChange={val => updateSectionExtra('conditions', 'above', val)}
          />
          <textarea value={conditions} onChange={e => setConditions(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 5. Conditions)"
            position="below"
            extra={getSectionExtra('conditions').below}
            onChange={val => updateSectionExtra('conditions', 'below', val)}
          />
        </div>

        {/* SECTION 6: KEY PERFORMANCE AREAS / DUTIES & PERFORMANCE ASSESSMENT TABLE (BELOW POINT 6.1) */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingKpaDuties}
              onChange={e => setHeadingKpaDuties(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="6. Key Performance Areas / Duties Description"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 6. KPA Duties)"
            position="above"
            extra={getSectionExtra('kpaDuties').above}
            onChange={val => updateSectionExtra('kpaDuties', 'above', val)}
          />
          <textarea value={kpaText} onChange={e => setKpaText(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />

          {/* Performance Assessment Table Adoption (Positioned Below Point 6.1) */}
          <div className="pt-3 border-t border-purple-200 space-y-3 bg-purple-50/20 p-3 rounded-lg">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <label className="text-xs font-bold text-purple-950 uppercase flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-purple-700" />
                Performance Assessment Table (Below Point 6.1)
              </label>
              <button
                type="button"
                onClick={handlePullPerformanceAssessment}
                disabled={pullingPerfAssessment}
                className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                {pullingPerfAssessment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5 text-purple-600" />}
                <span>{pulledPerfAssessmentRows && pulledPerfAssessmentRows.length > 0 ? `Re-adopt Assessment (${pulledPerfAssessmentRows.length})` : 'Adopt Performance Assessment Table'}</span>
              </button>
            </div>
            {pulledPerfAssessmentRows && pulledPerfAssessmentRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-purple-900">
                  <span className="font-semibold">Table Heading:</span>
                  <input
                    type="text"
                    value={pulledPerfAssessmentTitle}
                    onChange={e => setPulledPerfAssessmentTitle(e.target.value)}
                    className="text-[11px] font-bold p-1 border border-purple-200 rounded w-2/3 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-purple-900">Notes Below 6.1 Table (Points 6.2, 6.3, etc.):</label>
                  <textarea
                    value={pulledPerfAssessmentNotes}
                    onChange={e => setPulledPerfAssessmentNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2 border border-purple-200 rounded bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 6. KPA Duties)"
            position="below"
            extra={getSectionExtra('kpaDuties').below}
            onChange={val => updateSectionExtra('kpaDuties', 'below', val)}
          />
        </div>

        {/* SECTION 7: RATING SCALE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingRatingScale}
              onChange={e => setHeadingRatingScale(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="7. Performance Assessment Rating Scale"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 7. Rating Scale)"
            position="above"
            extra={getSectionExtra('ratingScale').above}
            onChange={val => updateSectionExtra('ratingScale', 'above', val)}
          />
          <textarea value={assessmentText} onChange={e => setAssessmentText(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 7. Rating Scale)"
            position="below"
            extra={getSectionExtra('ratingScale').below}
            onChange={val => updateSectionExtra('ratingScale', 'below', val)}
          />
        </div>

        {/* SECTION 8: TIMETABLE FOR REVIEW */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingTimetable}
              onChange={e => setHeadingTimetable(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="8. Timetable for Performance Reviews"
            />
          </div>

          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 uppercase">Review Quarters Schedule</label>
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

          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 8. Timetable)"
            position="above"
            extra={getSectionExtra('timetable').above}
            onChange={val => updateSectionExtra('timetable', 'above', val)}
          />

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

          <textarea value={timetable} onChange={e => setTimetable(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />

          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 8. Timetable)"
            position="below"
            extra={getSectionExtra('timetable').below}
            onChange={val => updateSectionExtra('timetable', 'below', val)}
          />
        </div>

        {/* SECTION 9: POOR PERFORMANCE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingPoorPerformance}
              onChange={e => setHeadingPoorPerformance(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="9. Management of Poor Performance Outcomes"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 9. Poor Performance)"
            position="above"
            extra={getSectionExtra('poorPerformance').above}
            onChange={val => updateSectionExtra('poorPerformance', 'above', val)}
          />
          <textarea value={poorPerformance} onChange={e => setPoorPerformance(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 9. Poor Performance)"
            position="below"
            extra={getSectionExtra('poorPerformance').below}
            onChange={val => updateSectionExtra('poorPerformance', 'below', val)}
          />
        </div>

        {/* SECTION 10: DISPUTE RESOLUTION */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingDispute}
              onChange={e => setHeadingDispute(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="10. Dispute Resolution Mechanism"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 10. Dispute Resolution)"
            position="above"
            extra={getSectionExtra('dispute').above}
            onChange={val => updateSectionExtra('dispute', 'above', val)}
          />
          <textarea value={dispute} onChange={e => setDispute(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 10. Dispute Resolution)"
            position="below"
            extra={getSectionExtra('dispute').below}
            onChange={val => updateSectionExtra('dispute', 'below', val)}
          />
        </div>

        {/* SECTION 11: AMENDMENTS */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingAmendment}
              onChange={e => setHeadingAmendment(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="11. General & Amendments"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 11. Amendments)"
            position="above"
            extra={getSectionExtra('amendment').above}
            onChange={val => updateSectionExtra('amendment', 'above', val)}
          />
          <textarea value={amendment} onChange={e => setAmendment(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 11. Amendments)"
            position="below"
            extra={getSectionExtra('amendment').below}
            onChange={val => updateSectionExtra('amendment', 'below', val)}
          />
        </div>

        {/* SECTION 12: EVALUATION */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingEvaluation}
              onChange={e => setHeadingEvaluation(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="12. Evaluation & Consultation"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 12. Evaluation)"
            position="above"
            extra={getSectionExtra('evaluation').above}
            onChange={val => updateSectionExtra('evaluation', 'above', val)}
          />
          <textarea value={evaluation} onChange={e => setEvaluation(e.target.value)} rows={2} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 12. Evaluation)"
            position="below"
            extra={getSectionExtra('evaluation').below}
            onChange={val => updateSectionExtra('evaluation', 'below', val)}
          />
        </div>

        {/* SECTION 13: SIGNATURES OF PARTIES WITH AZURE AD SELECTION & LIVE PROFILE AUTO-UPDATE */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Section Heading:</label>
            <input
              type="text"
              value={headingSignatures}
              onChange={e => setHeadingSignatures(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="13. Signatures of Parties to the Agreement"
            />
          </div>

          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-emerald-600" />
                Signatories & Signatures Configuration
              </label>
              <p className="text-[11px] text-slate-500">
                Team member names & roles update automatically from the top deployment roster. Signatory titles are fully editable, and all names can be searched in Azure AD or added manually.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncRosterToSignatures}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Sync all names and designations from top deployment roster"
              >
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sync from Roster ({tableRows.length})</span>
              </button>
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
          </div>

          <SectionCustomBlockEditor
            label="Additional Table & Text (Above 13. Signatures)"
            position="above"
            extra={getSectionExtra('signatures').above}
            onChange={val => updateSectionExtra('signatures', 'above', val)}
          />

          {/* Sub-Section 1: Team Members from Deployment Roster */}
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-100/80 px-3 py-2 rounded-lg border border-slate-200">
              <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                1. Team Members Signatures ({teamMemberSignatures.length} Roster Members)
              </span>
              <span className="text-[10px] text-slate-500 italic">
                Names sync with top roster table • Titles and details editable
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMemberSignatures.map((member, idx) => (
                <div 
                  key={member.id || idx}
                  className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[11px] font-extrabold uppercase text-emerald-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-black">
                        {idx + 1}
                      </span>
                      {idx === 0 ? 'Team Lead / Director' : `Team Member #${idx + 1}`}
                    </span>
                    {member.signatureData ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        ✓ Signature Loaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 italic">
                        Pending signature
                      </span>
                    )}
                  </div>

                  {/* Editable Title */}
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Editable Title / Role Heading:
                    </label>
                    <input
                      type="text"
                      value={member.title}
                      onChange={e => handleUpdateMemberSignature(idx, 'title', e.target.value)}
                      placeholder={`Signed by Team Member (${member.name || `Member #${idx + 1}`}):`}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Name with Azure AD Search & Manual Add */}
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                      Full Name (Azure AD Search / Manual):
                    </label>
                    <TeamAzureSearchInput
                      value={member.name}
                      placeholder="Search Azure AD directory or enter manually..."
                      onChange={val => handleUpdateMemberSignature(idx, 'name', val)}
                      onSelectUser={u => {
                        handleUpdateMemberSignature(idx, 'name', u.fullName);
                        if (u.jobFunction || u.department) {
                          handleUpdateMemberSignature(idx, 'designation', u.jobFunction || u.department || '');
                        }
                        if (u.email) {
                          handleUpdateMemberSignature(idx, 'email', u.email);
                        }
                        if (u.signatureData) {
                          handleUpdateMemberSignature(idx, 'signatureData', u.signatureData);
                        }
                      }}
                    />
                  </div>

                  {/* Designation / Employee No. */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        Designation / Role:
                      </label>
                      <input
                        type="text"
                        value={member.designation}
                        onChange={e => handleUpdateMemberSignature(idx, 'designation', e.target.value)}
                        placeholder="e.g. Director: Corporate Services"
                        className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        Date:
                      </label>
                      <input
                        type="text"
                        value={member.date || new Date().toLocaleDateString()}
                        onChange={e => handleUpdateMemberSignature(idx, 'date', e.target.value)}
                        placeholder="e.g. 2025/07/01"
                        className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Signature preview if exists */}
                  {member.signatureData && (
                    <div className="h-9 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                      <img src={member.signatureData} alt="Sig" className="max-h-7 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Section 2: Supervisory & Institutional Signatories */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap justify-between items-center bg-slate-100/90 px-3 py-2 rounded-lg border border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  2. Supervisory & Institutional Signatories ({institutionalSignatures.length} Signatories)
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {institutionalSignatures.length} Configured
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddInstitutionalSignatory}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Institutional Signatory
                </button>
              </div>
            </div>

            {institutionalSignatures.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
                <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No Institutional Signatories configured</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click &quot;Add Institutional Signatory&quot; above to add municipal managers, directors, or oversight authorities.</p>
                <button
                  type="button"
                  onClick={handleAddInstitutionalSignatory}
                  className="mt-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Institutional Signatory
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {institutionalSignatures.map((inst, idx) => (
                  <div key={inst.id || `inst_sig_${idx}`} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5 shadow-2xs relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {inst.designation || `Signatory #${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {inst.signatureData ? (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            ✓ Signature Loaded
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 italic">
                            Pending signature
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteInstitutionalSignatory(idx)}
                          title="Delete this institutional signatory"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Editable Title */}
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        Editable Title / Role Heading:
                      </label>
                      <input
                        type="text"
                        value={inst.title}
                        onChange={e => handleUpdateInstitutionalSignatory(idx, 'title', e.target.value)}
                        placeholder="Signed by Direct Manager / Supervisor:"
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Full Name with Azure AD Search + Manual Fallback */}
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        Full Name (Azure AD Search / Manual):
                      </label>
                      <TeamAzureSearchInput
                        value={inst.name}
                        placeholder="Search signatory in Azure AD or enter manually..."
                        onChange={val => handleUpdateInstitutionalSignatory(idx, 'name', val)}
                        onSelectUser={u => {
                          handleUpdateInstitutionalSignatory(idx, 'name', u.fullName);
                          if (u.jobFunction || u.department) {
                            handleUpdateInstitutionalSignatory(idx, 'designation', u.jobFunction || u.department || '');
                          }
                          if (u.email) {
                            handleUpdateInstitutionalSignatory(idx, 'email', u.email);
                          }
                          if (u.signatureData) {
                            handleUpdateInstitutionalSignatory(idx, 'signatureData', u.signatureData);
                          }
                        }}
                      />
                    </div>

                    {/* Designation / Role & Date */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                          Designation / Role:
                        </label>
                        <input
                          type="text"
                          value={inst.designation || ''}
                          onChange={e => handleUpdateInstitutionalSignatory(idx, 'designation', e.target.value)}
                          placeholder="e.g. Municipal Manager"
                          className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                          Date:
                        </label>
                        <input
                          type="text"
                          value={inst.date || new Date().toLocaleDateString()}
                          onChange={e => handleUpdateInstitutionalSignatory(idx, 'date', e.target.value)}
                          placeholder="e.g. 2025/07/01"
                          className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Signature Preview */}
                    {inst.signatureData && (
                      <div className="h-9 bg-white border border-slate-200 rounded p-1 flex items-center justify-between px-2">
                        <span className="text-[9px] text-slate-400 italic">Signature on file:</span>
                        <img src={inst.signatureData} alt="Sig" className="max-h-7 object-contain" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => handleUpdateInstitutionalSignatory(idx, 'signatureData', '')}
                          title="Clear loaded signature"
                          className="text-[9px] text-slate-400 hover:text-red-500"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <SectionCustomBlockEditor
            label="Additional Table & Text (Below 13. Signatures)"
            position="below"
            extra={getSectionExtra('signatures').below}
            onChange={val => updateSectionExtra('signatures', 'below', val)}
          />
        </div>

        {/* ANNEXURE A: PERFORMANCE PLAN (KPA & KPI TABLE) */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Annexure Heading:</label>
            <input
              type="text"
              value={headingPplanTable}
              onChange={e => setHeadingPplanTable(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="Annexure A: Annual Performance Plan (KPA & KPI Matrix)"
            />
          </div>

          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Table2 className="w-4 h-4 text-emerald-600" />
                Annexure A: Performance Plan (KPA &amp; KPI Matrix)
              </label>
              <p className="text-[11px] text-slate-500">
                Adopt filtered Annual Performance Plan (KPA &amp; KPI matrix) table directly into Annexure A below Section 13.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePullFilteredPerformancePlan}
                disabled={pullingFilteredPplan}
                className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                {pullingFilteredPplan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Table2 className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{pulledFilteredPplanItems && pulledFilteredPplanItems.length > 0 ? `Re-adopt Plan (${pulledFilteredPplanItems.length})` : 'Adopt Filtered Performance Plan'}</span>
              </button>
              {pulledFilteredPplanItems && pulledFilteredPplanItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPulledFilteredPplanItems(null);
                    setIsPPlanAdopted(false);
                    triggerNotification("Removed adopted Annexure A Performance Plan", "success");
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold transition cursor-pointer"
                >
                  Clear Plan
                </button>
              )}
            </div>
          </div>

          <SectionCustomBlockEditor
            label="Additional Table & Text (Above Annexure A)"
            position="above"
            extra={getSectionExtra('annexureA').above}
            onChange={val => updateSectionExtra('annexureA', 'above', val)}
          />

          {pulledFilteredPplanItems && pulledFilteredPplanItems.length > 0 ? (
            <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-emerald-900 font-bold">
                <span>{pulledFilteredPplanItems.length} KPIs / KPAs Active in Annexure A</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono">
                  Ready for Contract Output
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-emerald-200 rounded bg-white">
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-1.5 w-6 text-center">#</th>
                      <th className="p-1.5">KPA</th>
                      <th className="p-1.5">KPI Description</th>
                      <th className="p-1.5 text-center">Target</th>
                      <th className="p-1.5 text-center">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pulledFilteredPplanItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-1 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-1 font-semibold text-slate-800">{item.kpa || item.strategicGoal || 'KPA'}</td>
                        <td className="p-1 text-slate-600">{item.kpi || item.description}</td>
                        <td className="p-1 text-center font-bold text-emerald-700">{item.annualTarget || '—'}</td>
                        <td className="p-1 text-center text-slate-700">{item.weighting || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
              Click &ldquo;Adopt Filtered Performance Plan&rdquo; to load and embed the full KPA &amp; KPI matrix into Annexure A.
            </div>
          )}

          <SectionCustomBlockEditor
            label="Additional Table & Text (Below Annexure A)"
            position="below"
            extra={getSectionExtra('annexureA').below}
            onChange={val => updateSectionExtra('annexureA', 'below', val)}
          />
        </div>

        {/* ANNEXURES */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Annexure Heading:</label>
            <input
              type="text"
              value={headingAnnexureC}
              onChange={e => setHeadingAnnexureC(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:border-emerald-500 outline-none"
              placeholder="Annexure C - Disclosure of Financial Interest"
            />
          </div>
          <SectionCustomBlockEditor
            label="Additional Table & Text (Above Annexure C)"
            position="above"
            extra={getSectionExtra('annexureC').above}
            onChange={val => updateSectionExtra('annexureC', 'above', val)}
          />
          <textarea value={annexureC} onChange={e => setAnnexureC(e.target.value)} rows={4} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <SectionCustomBlockEditor
            label="Additional Table & Text (Below Annexure C)"
            position="below"
            extra={getSectionExtra('annexureC').below}
            onChange={val => updateSectionExtra('annexureC', 'below', val)}
          />
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
          <SectionCustomBlockViewer extra={getSectionExtra('coverPage').above} />
          <div className="whitespace-pre-wrap text-xs text-slate-800 leading-relaxed font-sans text-center max-w-lg mx-auto py-6 border-b border-slate-200 mb-8 bg-slate-50/50 p-6 rounded-lg">
            {coverPage}
          </div>
          <SectionCustomBlockViewer extra={getSectionExtra('coverPage').below} />

          {/* Team Members Roster Deployment Table */}
          <div className="mb-8">
            <SectionCustomBlockViewer extra={getSectionExtra('roster').above} />
            <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              {headingRoster || `Team Members Deployment Roster (${teamList[activeTeamIndex]?.name})`}
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
            <SectionCustomBlockViewer extra={getSectionExtra('roster').below} />
          </div>

          {/* Document Clauses */}
          <div className="space-y-6 text-xs text-slate-800">
            {/* 1. Purpose */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('purpose').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingPurpose || "1. Purpose of Agreement"}
              </h3>
              {renderFormattedContent(purpose)}
              <SectionCustomBlockViewer extra={getSectionExtra('purpose').below} />
            </div>

            {/* 2. Validity */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('validity').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingValidity || "2. Validity of Agreement"}
              </h3>
              {renderFormattedContent(validity)}
              <SectionCustomBlockViewer extra={getSectionExtra('validity').below} />
            </div>

            {/* 3. Reporting */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('reporting').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingReporting || "3. Reporting Requirements & Governance"}
              </h3>
              {renderFormattedContent(reporting)}
              <SectionCustomBlockViewer extra={getSectionExtra('reporting').below} />
            </div>

            {/* 4. Assessment Framework */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('framework').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingFramework || "4. Performance Assessment Framework"}
              </h3>
              {renderFormattedContent(framework)}
              <SectionCustomBlockViewer extra={getSectionExtra('framework').below} />

              {/* Dynamic KPA Table (Viewer) */}
              <div className="my-4">
                <h4 className="text-[11px] font-bold text-slate-900 mb-2 uppercase">
                  {headingKpaTable || "4.2 Key Performance Areas (KPAs) Matrix Table"}
                </h4>
                <KPATableViewer headers={dynTableHeaders} rows={dynTableRows} />
              </div>

              <SectionCustomBlockViewer extra={getSectionExtra('kpa_4_2').below} />

              {/* 4.3 Competencies Text */}
              <div className="my-3">
                <h4 className="text-[11px] font-bold text-slate-900 mb-1 uppercase">
                  {headingCompetencies || "4.3 Competencies Assessment Matrix Criteria"}
                </h4>
                <SectionCustomBlockViewer extra={getSectionExtra('competencies_4_3').above} />
                {renderFormattedContent(frameworkBelowKpa)}
                <SectionCustomBlockViewer extra={getSectionExtra('competencies_4_3').below} />
              </div>

              {/* 4.4 Framework Footer Text */}
              <div className="my-3">
                <h4 className="text-[11px] font-bold text-slate-900 mb-1 uppercase">
                  {headingFramework44 || "4.4 Performance Weightings & Core Assessment Principles"}
                </h4>
                <SectionCustomBlockViewer extra={getSectionExtra('framework_4_4').above} />
                {renderFormattedContent(frameworkBelowJsc)}
                <SectionCustomBlockViewer extra={getSectionExtra('framework_4_4').below} />
              </div>

              {/* ADOPTED PROFILE JSC TABLE - RENDERED DIRECTLY BELOW POINT NUMBER 4.4 */}
              {pulledJscRows && pulledJscRows.length > 0 && (
                <div className="my-6 border-2 border-indigo-300 rounded-lg p-3 bg-indigo-50/25">
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-indigo-200">
                    <span className="text-[11px] font-extrabold uppercase text-indigo-950 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-700" />
                      {headingJscTable || "4.5 Adopted Profile Job Specific Competencies (JSC) Matrix"}
                    </span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      {pulledJscRows.length} Competencies Adopted Below 4.4
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                    <thead className="bg-slate-100 text-slate-800 font-black uppercase text-[9px]">
                      <tr>
                        <th className="border border-slate-300 p-1.5 text-center w-14">JSC No</th>
                        <th className="border border-slate-300 p-1.5 min-w-[130px]">Core Competency</th>
                        <th className="border border-slate-300 p-1.5 min-w-[220px]">Competency Definition &amp; Standard Requirements</th>
                        <th className="border border-slate-300 p-1.5 text-center min-w-[110px]">Level of Capability</th>
                        <th className="border border-slate-300 p-1.5 text-center w-14">Weight %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pulledJscRows.map((jsc, idx) => (
                        <tr key={jsc.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-indigo-800">{jsc.jscNo || `JSC-0${idx + 1}`}</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{jsc.competency}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-700 space-y-1">
                            {typeof jsc.definition === 'string' ? (
                              <p>{jsc.definition}</p>
                            ) : (
                              <>
                                <p className="font-semibold text-slate-800">{jsc.definition?.mainText}</p>
                                {jsc.definition?.subsections?.map((sub: any, sIdx: number) => (
                                  <div key={sIdx} className="text-[9px] text-slate-600 pl-1.5 border-l border-indigo-200">
                                    <span className="font-bold text-slate-800">{sub.heading}:</span> {sub.paragraphs?.join(' ')}
                                  </div>
                                ))}
                              </>
                            )}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-semibold text-slate-700">{jsc.level || 'Level 4: Superior Leader'}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-indigo-900">{jsc.weight || 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-extrabold text-[10px] text-slate-900">
                      <tr>
                        <td colSpan={4} className="border border-slate-300 p-1.5 text-right uppercase">Total JSC Weighting:</td>
                        <td className="border border-slate-300 p-1.5 text-center font-black text-indigo-900">
                          {pulledJscRows.reduce((acc, curr) => acc + Number(curr.weight || 0), 0)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Textbox rendered below adopted JSC Table */}
                  <div className="mt-3 pt-2.5 border-t border-indigo-200 text-xs text-slate-800">
                    <SectionCustomBlockViewer extra={getSectionExtra('jsc_table').above} />
                    {jscBelowText && renderFormattedContent(jscBelowText)}
                    <SectionCustomBlockViewer extra={getSectionExtra('jsc_table').below} />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Conditions */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('conditions').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingConditions || "5. Conditions of Performance"}
              </h3>
              {renderFormattedContent(conditions)}
              <SectionCustomBlockViewer extra={getSectionExtra('conditions').below} />
            </div>

            {/* 6. Duties / KPAs & Performance Assessment Table (Below Point 6.1) */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('kpaDuties').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingKpaDuties || "6. Key Performance Areas / Duties"}
              </h3>
              {renderFormattedContent(kpaText)}

              {/* Adopted Statutory Performance Assessment 5-Point Rating Scale Table (Below Point 6.1) */}
              {pulledPerfAssessmentRows && pulledPerfAssessmentRows.length > 0 && (
                <div className="my-5 border border-purple-300 rounded-lg p-3 bg-purple-50/20">
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-purple-200">
                    <span className="text-[11px] font-extrabold uppercase text-purple-950 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-purple-700" />
                      6.1 {pulledPerfAssessmentTitle || "Adopted Performance Assessment Table (5-Point Rating Scale)"}
                    </span>
                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                      {pulledPerfAssessmentRows.length} Rating Levels Adopted
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead className="bg-slate-100 text-slate-800 font-black uppercase text-[9px]">
                        <tr>
                          {pulledPerfAssessmentHeaders.map((h, hIdx) => (
                            <th 
                              key={hIdx} 
                              className={`border border-slate-300 p-1.5 ${
                                hIdx === 0 ? 'text-center w-12' : 
                                hIdx === 1 ? 'min-w-[130px]' : 
                                hIdx === 2 ? 'min-w-[240px]' : 
                                hIdx === 3 ? 'text-center min-w-[90px]' : 
                                'min-w-[180px]'
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pulledPerfAssessmentRows.map((row, rIdx) => {
                          const levelNum = row[0]?.trim();
                          const levelBadgeColor = 
                            levelNum === '5' ? 'bg-emerald-700 text-white' :
                            levelNum === '4' ? 'bg-blue-600 text-white' :
                            levelNum === '3' ? 'bg-teal-600 text-white' :
                            levelNum === '2' ? 'bg-amber-500 text-white' :
                            'bg-rose-600 text-white';

                          return (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                              <td className="border border-slate-300 p-1.5 text-center font-bold">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-black ${levelBadgeColor}`}>
                                  Level {row[0]}
                                </span>
                              </td>
                              <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{row[1]}</td>
                              <td className="border border-slate-300 p-1.5 text-slate-700 leading-relaxed text-[9.5px]">{row[2]}</td>
                              <td className="border border-slate-300 p-1.5 text-center font-extrabold text-purple-900">{row[3]}</td>
                              <td className="border border-slate-300 p-1.5 text-slate-700 text-[9.5px]">{row[4]}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {pulledPerfAssessmentNotes && (
                    <div className="mt-2 text-[9px] text-slate-600 italic bg-purple-50/60 p-2 rounded border border-purple-100">
                      {renderFormattedContent(pulledPerfAssessmentNotes)}
                    </div>
                  )}
                </div>
              )}

              <SectionCustomBlockViewer extra={getSectionExtra('kpaDuties').below} />
            </div>

            {/* 7. Rating Scale */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('ratingScale').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingRatingScale || "7. Performance Assessment Rating Scale"}
              </h3>
              {renderFormattedContent(assessmentText)}
              <SectionCustomBlockViewer extra={getSectionExtra('ratingScale').below} />
            </div>

            {/* 8. Timetable */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('timetable').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingTimetable || "8. Timetable for Performance Reviews"}
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
              <SectionCustomBlockViewer extra={getSectionExtra('timetable').below} />
            </div>

            {/* 9. Poor Performance */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('poorPerformance').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingPoorPerformance || "9. Management of Poor Performance Outcomes"}
              </h3>
              {renderFormattedContent(poorPerformance)}
              <SectionCustomBlockViewer extra={getSectionExtra('poorPerformance').below} />
            </div>

            {/* 10. Dispute Resolution */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('dispute').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingDispute || "10. Dispute Resolution Mechanism"}
              </h3>
              {renderFormattedContent(dispute)}
              <SectionCustomBlockViewer extra={getSectionExtra('dispute').below} />
            </div>

            {/* 11. Amendments */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('amendment').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingAmendment || "11. General & Amendments"}
              </h3>
              {renderFormattedContent(amendment)}
              <SectionCustomBlockViewer extra={getSectionExtra('amendment').below} />
            </div>

            {/* 12. Evaluation */}
            <div>
              <SectionCustomBlockViewer extra={getSectionExtra('evaluation').above} />
              <h3 className="text-xs font-extrabold uppercase text-emerald-900 tracking-wide border-b border-emerald-800/40 pb-1 mb-2">
                {headingEvaluation || "12. Evaluation & Consultation"}
              </h3>
              {renderFormattedContent(evaluation)}
              <SectionCustomBlockViewer extra={getSectionExtra('evaluation').below} />
            </div>

            {/* 13. Signatures of Parties Block */}
            <div className="pt-8 border-t-2 border-emerald-900/80 mt-10">
              <SectionCustomBlockViewer extra={getSectionExtra('signatures').above} />
              <h3 className="text-xs font-black uppercase text-emerald-900 tracking-wider text-center mb-6">
                {headingSignatures || "13. Signatures of Parties to the Performance Agreement"}
              </h3>

              {/* Sub-block A: Team Members Signatures */}
              <div className="mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-950 mb-3 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200/80 flex items-center justify-between">
                  <span>A. Team Member Signatories ({teamMemberSignatures.length} Members from Deployment Roster)</span>
                  <span className="text-[9px] text-emerald-800 font-bold">Roster Synchronized</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {teamMemberSignatures.map((member, idx) => (
                    <div 
                      key={member.id || idx}
                      className="border border-slate-300 p-3.5 rounded-lg bg-slate-50/60 space-y-2.5 shadow-2xs"
                    >
                      <p className="font-bold text-[10px] uppercase text-slate-800 border-b border-slate-200 pb-1">
                        {member.title || `Signed by ${idx === 0 ? 'Team Lead / Director' : 'Team Member'} (${member.name || `Member #${idx + 1}`}):`}
                      </p>
                      <div className="h-12 border-b border-black flex flex-col justify-end items-center relative pb-1">
                        {member.signatureData ? (
                          <img 
                            src={member.signatureData} 
                            alt={`${member.name} Sig`} 
                            className="max-h-11 object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="font-serif italic text-xs text-slate-500">
                            {member.name ? `${member.name} (Signature)` : 'Signature Placeholder'}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Name: <strong className="text-slate-800">{member.name || 'N/A'}</strong></span>
                          <span>Date: <strong className="text-slate-800">{member.date || new Date().toLocaleDateString()}</strong></span>
                        </div>
                        {member.designation && (
                          <div className="truncate">
                            Role: <span className="text-slate-700 font-semibold">{member.designation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-block B: Institutional & Supervisory Signatures */}
              {institutionalSignatures && institutionalSignatures.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 mb-3 bg-slate-100 px-3 py-1.5 rounded border border-slate-200 flex items-center justify-between">
                    <span>B. Supervisory & Institutional Authorities ({institutionalSignatures.length})</span>
                    <span className="text-[9px] text-slate-600 font-bold">Institutional Oversight</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {institutionalSignatures.map((inst, idx) => (
                      <div key={inst.id || `preview_inst_${idx}`} className="border border-slate-300 p-3.5 rounded-lg bg-slate-50/60 space-y-2.5 shadow-2xs">
                        <p className="font-bold text-[10px] uppercase text-slate-800 border-b border-slate-200 pb-1 truncate" title={inst.title || `Signed by ${inst.name || 'Signatory'}:`}>
                          {inst.title || `Signed by ${inst.designation || 'Institutional Signatory'}:`}
                        </p>
                        <div className="h-12 border-b border-black flex flex-col justify-end items-center relative pb-1">
                          {inst.signatureData ? (
                            <img 
                              src={inst.signatureData} 
                              alt={`${inst.name} Sig`} 
                              className="max-h-11 object-contain" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-serif italic text-xs text-slate-500">
                              {inst.name ? `${inst.name} (Signature)` : 'Signature Placeholder'}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-600 space-y-0.5">
                          <div className="flex justify-between">
                            <span>Name: <strong className="text-slate-800">{inst.name || 'N/A'}</strong></span>
                            <span>Date: <strong className="text-slate-800">{inst.date || new Date().toLocaleDateString()}</strong></span>
                          </div>
                          {inst.designation && (
                            <div className="truncate">
                              Role: <span className="text-slate-700 font-semibold">{inst.designation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <SectionCustomBlockViewer extra={getSectionExtra('signatures').below} />
            </div>

            {/* Annexure A: Performance Plan (KPA & KPI Matrix) Preview */}
            {pulledFilteredPplanItems && pulledFilteredPplanItems.length > 0 && (
              <div className="pt-6 border-t-2 border-emerald-900/80 text-xs">
                <SectionCustomBlockViewer extra={getSectionExtra('annexureA').above} />
                <div className="my-3 border border-emerald-300 rounded-lg p-3 bg-emerald-50/20">
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-emerald-200">
                    <span className="text-[11px] font-extrabold uppercase text-emerald-950 flex items-center gap-1.5">
                      <Table2 className="w-3.5 h-3.5 text-emerald-700" />
                      {headingPplanTable || "Annexure A: Annual Performance Plan (KPA & KPI Matrix)"}
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      {pulledFilteredPplanItems.length} KPIs Adopted
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                    <thead className="bg-slate-100 text-slate-800 font-black uppercase text-[9px]">
                      <tr>
                        <th className="border border-slate-300 p-1.5 text-center w-8">No.</th>
                        <th className="border border-slate-300 p-1.5">Key Performance Area (KPA)</th>
                        <th className="border border-slate-300 p-1.5">KPI Description</th>
                        <th className="border border-slate-300 p-1.5 text-center">Baseline</th>
                        <th className="border border-slate-300 p-1.5 text-center">Annual Target</th>
                        <th className="border border-slate-300 p-1.5 text-center">Q1</th>
                        <th className="border border-slate-300 p-1.5 text-center">Q2</th>
                        <th className="border border-slate-300 p-1.5 text-center">Q3</th>
                        <th className="border border-slate-300 p-1.5 text-center">Q4</th>
                        <th className="border border-slate-300 p-1.5">Portfolio of Evidence (POE)</th>
                        <th className="border border-slate-300 p-1.5 text-center">Wt%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pulledFilteredPplanItems.map((item, idx) => (
                        <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{item.kpa || item.strategicGoal || 'Operational KPA'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-700">{item.kpi || item.description}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{item.baseline || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-800">{item.annualTarget || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{item.q1Target || item.q1 || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{item.q2Target || item.q2 || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{item.q3Target || item.q3 || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{item.q4Target || item.q4 || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-600 text-[9px]">{item.poe || item.annualRequiredPoe || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-700">{item.weighting || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <SectionCustomBlockViewer extra={getSectionExtra('annexureA').below} />
              </div>
            )}

            {/* Annexure B: Personal Development Plan (PDP) Preview */}
            {pulledPdpItems && pulledPdpItems.length > 0 && (
              <div className="pt-6 border-t border-slate-200 text-xs">
                <div className="my-3 border border-amber-300 rounded-lg p-3 bg-amber-50/20">
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-amber-200">
                    <span className="text-[11px] font-extrabold uppercase text-amber-950 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                      Annexure B: Adopted Personal Development Plan (PDP) Matrix
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      {pulledPdpItems.length} PDP Items Adopted
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                    <thead className="bg-slate-100 text-slate-800 font-black uppercase text-[9px]">
                      <tr>
                        <th className="border border-slate-300 p-1.5 text-center w-8">No.</th>
                        <th className="border border-slate-300 p-1.5 min-w-[130px]">Identified Skills Gap</th>
                        <th className="border border-slate-300 p-1.5 min-w-[130px]">Desired Outcomes</th>
                        <th className="border border-slate-300 p-1.5 min-w-[120px]">Suggested Training / Intervention</th>
                        <th className="border border-slate-300 p-1.5 text-center">Mode of Delivery</th>
                        <th className="border border-slate-300 p-1.5 text-center">Time Frame</th>
                        <th className="border border-slate-300 p-1.5">Work Opportunity / Practice</th>
                        <th className="border border-slate-300 p-1.5 text-center">Support Person</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pulledPdpItems.map((pdp, idx) => (
                        <tr key={pdp.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{pdp.skillsGap || pdp.need || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-700">{pdp.outcomes || pdp.outcome || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-700">{pdp.suggestedTraining || pdp.training || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{pdp.modeOfDelivery || pdp.mode || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-semibold text-amber-900">{pdp.timeFrame || pdp.timing || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-700">{pdp.workOpportunity || pdp.workExperience || '—'}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-semibold text-slate-800">{pdp.supportPerson || pdp.support || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Annexure C Preview */}
            <div className="pt-6 border-t border-slate-200 text-xs">
              <SectionCustomBlockViewer extra={getSectionExtra('annexureC').above} />
              <h4 className="font-bold uppercase text-emerald-900 mb-2">
                {headingAnnexureC || "Annexure C: Financial Disclosure"}
              </h4>
              <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 p-4 rounded border border-slate-200">
                {annexureC}
              </div>
              <SectionCustomBlockViewer extra={getSectionExtra('annexureC').below} />
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
