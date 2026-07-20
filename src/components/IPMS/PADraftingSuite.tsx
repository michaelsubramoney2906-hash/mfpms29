import React, { useState, useEffect } from 'react';
import { 
  FileText, Shield, Info, Plus, Trash2, Save, Send, Loader2,
  HelpCircle, ClipboardList, Briefcase, FileDown, CheckCircle,
  Check, Edit3, Sparkles, CheckCircle2, ShieldCheck, X, Eye, 
  Layers, Search, Users, Settings2, LayoutTemplate, Sliders,
  ArrowRight, FileSpreadsheet, Lock, AlertTriangle, Settings, Table2
} from 'lucide-react';

interface PADraftingSuiteProps {
  currentUser: {
    email: string;
    role: string;
    fullName?: string;
    jobFunction?: string;
    department?: string;
    manager?: string;
    systemRole?: string;
  };
  activeTenantId: string;
}

interface CustomTable {
  id: string;
  sectionId: string;
  title: string;
  headers: string[];
  rows: string[][];
}

interface DynamicSection {
  id: string;
  title: string;
  heading: string;
  content1: string;
  content2: string;
}

interface PATemplate {
  id: string;
  name: string;
  // Customizable Headings
  headingCover: string;
  headingRegulatoryInfo?: string;
  dynamicSections?: DynamicSection[];
  headingPurpose: string;
  headingValidity: string;
  headingReporting: string;
  headingFramework: string;
  headingKpaTable: string;
  headingJscTable: string;
  headingConditions: string;
  headingAssessmentKpas: string;
  headingFeedback: string;
  headingTimetable: string;
  headingPoorPerformance: string;
  headingDispute: string;
  headingAmendment: string;
  headingEvaluation: string;
  headingSignatures: string;
  headingAnnexA: string;
  headingAnnexB: string;
  headingAnnexC: string;
  headingNationalKpas?: string;
  heading4_4?: string;
  heading4_5?: string;
  // Content values
  coverPage: string;
  regulatoryInfoText?: string;
  purpose: string;
  validity: string;
  reporting: string;
  framework: string;
  frameworkBelowKpa: string;
  frameworkBelowJsc: string;
  nationalKpasText?: string;
  text4_4?: string;
  text4_5?: string;
  conditions: string;
  kpaText: string;
  feedback: string;
  timetableText: string;
  timetableTextBelowTable?: string;
  poorPerformance: string;
  dispute: string;
  amendment: string;
  evaluation: string;
  annexureC: string;
  municipalityName?: string;
  templateSubHeader?: string;
  muniFontFamily?: string;
  muniFontSize?: string;
  muniColor?: string;
  subHeaderFontSize?: string;
  subHeaderColor?: string;
  muniLogo?: string | null;
  customTables?: CustomTable[];
  textColor?: string;
  headingColor?: string;
  borderColor?: string;
  borderStyle?: string;
  borderWidth?: string;
  documentFontFamily?: string;
  documentTextAlign?: string;
  showPageNumbers?: boolean;
  footerText?: string;
  createdAt?: string;
  pulledPplanItems?: any[] | null;
  pulledFilteredPplanItems?: any[] | null;
  pulledPdpItems?: any[] | null;
  pulledCompetencyRows?: any[] | null;
  pulledCfoCompetencyRows?: any[] | null;
  pulledPedCompetencyRows?: any[] | null;
  pulledCorpCompetencyRows?: any[] | null;
  employeeSignature?: string | null;
  employeeName?: string | null;
  employeePosition?: string | null;
  employeeDate?: string | null;
  supervisorSignature?: string | null;
  supervisorName?: string | null;
  supervisorPosition?: string | null;
  supervisorDate?: string | null;
  sigDay?: string;
  sigMonth?: string;
  sigYear?: string;
}

export function PADraftingSuite({ currentUser, activeTenantId }: PADraftingSuiteProps) {
  const [templates, setTemplates] = useState<PATemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isMikeViewer = React.useMemo(() => {
    if (!currentUser) return false;
    const email = (currentUser.email || '').toLowerCase().trim();
    return email === 'mike@massivedynamixdistributors.com' || email === 'rampedimr@nkangaladm.gov.za';
  }, [currentUser]);

  // Checks if the logged-in user is the Municipal Manager (Mandla L. Mahlangu)
  const isMandlaMahlangu = React.useMemo(() => {
    if (!currentUser) return false;
    const email = (currentUser.email || '').toLowerCase().trim();
    return email === 'mandlaml@nkangaladm.gov.za' || email === 'mahlanguml@nkangaladm.gov.za';
  }, [currentUser]);

  // Document Headings state (editable)
  const [headingCover, setHeadingCover] = useState('COVER PAGE');
  const [headingRegulatoryInfo, setHeadingRegulatoryInfo] = useState('Regulatory Information & Definitions');
  
  const [dynamicSections, setDynamicSections] = useState<DynamicSection[]>([
    { id: 'section1', title: 'Section 1', heading: 'New Section 1', content1: '', content2: '' },
    { id: 'section2', title: 'Section 2', heading: 'New Section 2', content1: '', content2: '' },
    { id: 'section3', title: 'Section 3', heading: 'New Section 3', content1: '', content2: '' },
    { id: 'section4', title: 'Section 4', heading: 'New Section 4', content1: '', content2: '' }
  ]);

  const addDynamicSection = () => {
    setDynamicSections(prev => [
      ...prev,
      { 
        id: `section-${Date.now()}`, 
        title: `Section ${prev.length + 1}`, 
        heading: `New Section ${prev.length + 1}`, 
        content1: '', 
        content2: '' 
      }
    ]);
  };

  const updateDynamicSection = (id: string, updates: Partial<DynamicSection>) => {
    setDynamicSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  
  const removeDynamicSection = (id: string) => {
    setDynamicSections(prev => prev.filter(s => s.id !== id));
  };

  const [headingPurpose, setHeadingPurpose] = useState('1. Purpose');
  const [headingValidity, setHeadingValidity] = useState('2. Validity of Agreement');
  const [headingReporting, setHeadingReporting] = useState('3. Reporting Requirements');
  const [headingFramework, setHeadingFramework] = useState('4. Performance Assessment Framework');
  const [headingKpaTable, setHeadingKpaTable] = useState('4.1 Key Performance Areas (KPAs) Table');
  const [headingJscTable, setHeadingJscTable] = useState('4.2 Job Specific Competencies Standards Weight Table');
  const [headingNationalKpas, setHeadingNationalKpas] = useState('4.3 National KPA Categories');
  const [heading4_4, setHeading4_4] = useState('4.4 Performance Plan');
  const [heading4_5, setHeading4_5] = useState('4.5 Performance Review');
  const [headingConditions, setHeadingConditions] = useState('5. Performance Objectives');
  const [headingAssessmentKpas, setHeadingAssessmentKpas] = useState('6. Performance Management System');
  const [headingFeedback, setHeadingFeedback] = useState('7. Feedback');
  const [headingTimetable, setHeadingTimetable] = useState('8. Timetable and records of review discussions');
  const [headingPoorPerformance, setHeadingPoorPerformance] = useState('9. Management of poor performance outcomes');
  const [headingDispute, setHeadingDispute] = useState('10. Dispute Resolution');
  const [headingAmendment, setHeadingAmendment] = useState('11. Amendment of agreement');
  const [headingEvaluation, setHeadingEvaluation] = useState('12. Evaluation');

  const [text4_4, setText4_4] = useState('');
  const [text4_5, setText4_5] = useState('');

  const [headingSignatures, setHeadingSignatures] = useState('16. Signature of parties to the agreement');
  const [headingAnnexA, setHeadingAnnexA] = useState('Annexure A: Performance Plan');
  const [headingAnnexB, setHeadingAnnexB] = useState('Annexure B: Personal Development Plan (PDP)');
  const [headingAnnexC, setHeadingAnnexC] = useState('Annexure C: Disclosure of Interest');

  // Document Content state
  const [coverPage, setCoverPage] = useState('PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe {municipalityName} herein represented by the Executive Mayor\n\n&\n\nMandla L. Mahlangu\n\nMunicipal Manager\n\nFOR THE FINANCIAL YEAR: 2025/2026');
  const [regulatoryInfoText, setRegulatoryInfoText] = useState('This section defines regulatory requirements and definition of terms used throughout this document. It outlines the scope of regulatory compliance under the Municipal Systems Act.');
  const [purpose, setPurpose] = useState('This performance contract facilitates clear alignment between programmatic objectives and actual operational reviews. The Executive Mayor retains overall delegative responsibility for monitoring outputs.');
  const [validity, setValidity] = useState('This agreement is valid from 1 July 2025 to 30 June 2026. Review cycles follow designated local policy terms and regulatory constraints.');
  const [reporting, setReporting] = useState('The Municipal Manager reports directly to the Executive Mayor on all municipal governance, capital budget execution, and administrative goals.');
  const [framework, setFramework] = useState('The employee is evaluated based on performance standards outlined under municipal planning criteria. A detailed weighting registry assigns parameters.');
  const [frameworkBelowKpa, setFrameworkBelowKpa] = useState('Key goals have been mapped to specific financial administration, infrastructure delivery, and local economic plans.');
  const [nationalKpasText, setNationalKpasText] = useState('1. Basic Service Delivery\n2. Municipal Institutional Development and Transformation\n3. Local Economic Development\n4. Municipal Financial Viability and Management\n5. Good Governance and Public Participation\n6. Cross Cutting Interventions');
  const [frameworkBelowJsc, setFrameworkBelowJsc] = useState('Core managerial competencies represent professional capabilities mapped to scale indexes.');
  const [conditions, setConditions] = useState('Satisfactory performance triggers regulatory compliance bonuses, while consistent failure enforces dispute arbitration schemes.');
  const [kpaText, setKpaText] = useState('The duties outlined in this document are subject to administrative review cycles and might not represent exhausting lists.\n\nCompetency execution follows standard rating rubrics ranging from level 1 (unsatisfactory) to level 5 (exceptional).');
  const [feedback, setFeedback] = useState('Progress notifications will be delivered within 15 days of each official quarterly session.');
  const [timetableText, setTimetableText] = useState('The review timetable is synchronized with standard quarterly OPMS cycles.');
  const [timetableTextBelowTable, setTimetableTextBelowTable] = useState('This schedule is subject to revisions as needed.');
  const [poorPerformance, setPoorPerformance] = useState('Development plans will address gaps before formal administrative actions are instituted.');
  const [dispute, setDispute] = useState('Disagreements are referred to the MEC for Cooperative Governance within 30 days of initial lodging.');
  const [amendment, setAmendment] = useState('No variations to these clauses are enforceable unless committed in writing by authorized signatories.');
  const [evaluation, setEvaluation] = useState('Overall performance scores are formulated based on an 80/20 balance between objective KPAs and standard Core Competencies.');
  const [annexureC, setAnnexureC] = useState('I hereby certify that my disclosure of financial interests reflects all current directorships and assets correctly.');
  const [customTables, setCustomTables] = useState<CustomTable[]>([]);

  // Templates Selection dropdown (for MM template)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateName, setTemplateName] = useState('Custom Generated Template Agreement');

  // Styling configurations
  const [textColor, setTextColor] = useState('#334155'); // slate-700
  const [headingColor, setHeadingColor] = useState('#047857'); // emerald-700
  const [borderColor, setBorderColor] = useState('#cbd5e1'); // slate-300
  const [borderStyle, setBorderStyle] = useState('solid'); // solid, dashed, double, none
  const [borderWidth, setBorderWidth] = useState('1px'); // 1px, 2px, 4px
  const [documentFontFamily, setDocumentFontFamily] = useState('font-sans'); // font-sans, font-serif, font-mono
  const [documentTextAlign, setDocumentTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [footerText, setFooterText] = useState('Document certified by COGTA statutory compliance rules for secondary municipalities.');

  // Pulled / adopted items lists
  const [pulledPplanItems, setPulledPplanItems] = useState<any[] | null>(null);
  const [pulledFilteredPplanItems, setPulledFilteredPplanItems] = useState<any[] | null>(null);
  const [pulledPdpItems, setPulledPdpItems] = useState<any[] | null>(null);
  const [pulledCompetencyRows, setPulledCompetencyRows] = useState<any[] | null>(null);
  const [pulledCfoCompetencyRows, setPulledCfoCompetencyRows] = useState<any[] | null>(null);
  const [pulledPedCompetencyRows, setPulledPedCompetencyRows] = useState<any[] | null>(null);
  const [pulledCorpCompetencyRows, setPulledCorpCompetencyRows] = useState<any[] | null>(null);

  // Signatures State
  const [employeeSignature, setEmployeeSignature] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [employeePosition, setEmployeePosition] = useState<string | null>(null);
  const [employeeDate, setEmployeeDate] = useState<string | null>(null);
  const [supervisorSignature, setSupervisorSignature] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [supervisorPosition, setSupervisorPosition] = useState<string | null>(null);
  const [supervisorDate, setSupervisorDate] = useState<string | null>(null);

  const [sigDay, setSigDay] = useState<string>('_____');
  const [sigMonth, setSigMonth] = useState<string>('__________________');
  const [sigYear, setSigYear] = useState<string>('2026');

  // Helper for parsing chapter number and name
  const parseHeading = (fullHeading: string, defaultNo: string) => {
    if (!fullHeading) return { no: defaultNo, name: '' };
    // Try patterns like "Chapter 1: Purpose", "1. Purpose", "Annexure A: Purpose"
    const match = fullHeading.match(/^((?:Chapter|Section|Annexure|Annex)\s+[\w\d.]+|[\w\d.]+)(?:\s*[:.-]\s*|\s+)(.*)$/i);
    if (match) return { no: match[1], name: match[2] };
    const matchNum = fullHeading.match(/^([\d.]+)\s+(.*)$/);
    if (matchNum) return { no: matchNum[1], name: matchNum[2] };
    return { no: defaultNo, name: fullHeading };
  };

  // Loading states for pulling
  const [pullingPplan, setPullingPplan] = useState(false);
  const [pullingFilteredPplan, setPullingFilteredPplan] = useState(false);
  const [pullingPdp, setPullingPdp] = useState(false);
  const [pullingCompetencies, setPullingCompetencies] = useState(false);
  const [pullingCfoCompetencies, setPullingCfoCompetencies] = useState(false);
  const [pullingPedCompetencies, setPullingPedCompetencies] = useState(false);
  const [pullingCorpCompetencies, setPullingCorpCompetencies] = useState(false);

  // Targets for Pushing
  const [mmPushEmail, setMmPushEmail] = useState('mandlaml@nkangaladm.gov.za');
  const [cfoPushEmail, setCfoPushEmail] = useState('cfo@nkangaladm.gov.za');
  const [tsPushEmail, setTsPushEmail] = useState('technicaldirector@nkangaladm.gov.za');
  const [csPushEmail, setCsPushEmail] = useState('corporatedirector@nkangaladm.gov.za');
  const [ssPushEmail, setSsPushEmail] = useState('communitydirector@nkangaladm.gov.za');
  const [pePushEmail, setPePushEmail] = useState('planningdirector@nkangaladm.gov.za');

  // Push progress states
  const [pushingStates, setPushingStates] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  // User management registry search states
  const [userManagementUsers, setUserManagementUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<'MM' | 'CFO' | 'TS' | 'CS' | 'SS' | 'PE' | 'CUSTOM' | null>(null);
  const [customPushEmail, setCustomPushEmail] = useState('');
  const [customPushTitle, setCustomPushTitle] = useState('');

  const fetchUserManagementUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/users`);
      if (res.ok) {
        const data = await res.json();
        setUserManagementUsers(data);
      }
    } catch (e) {
      console.error("Error fetching user management users:", e);
    } finally {
      setFetchingUsers(false);
    }
  };

  // Signature Search Modal logic
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureModalTarget, setSignatureModalTarget] = useState<'employee' | 'supervisor'>('employee');
  const [adSearchQuery, setAdSearchQuery] = useState('');
  const [adSearchResults, setAdSearchResults] = useState<any[]>([]);
  const [isSearchingAd, setIsSearchingAd] = useState(false);

  const openSignatureModal = (target: 'employee' | 'supervisor') => {
    setSignatureModalTarget(target);
    setIsSignatureModalOpen(true);
    setAdSearchQuery('');
    setIsSearchingAd(true);
    fetch(`/api/azure-search?q=`)
      .then(res => res.json())
      .then(data => {
        setAdSearchResults(data);
        setIsSearchingAd(false);
      })
      .catch(err => {
        console.error(err);
        setIsSearchingAd(false);
      });
  };

  const handleSearchAdUsers = async (query: string) => {
    setAdSearchQuery(query);
    setIsSearchingAd(true);
    try {
      const res = await fetch(`/api/azure-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setAdSearchResults(data);
      }
    } catch (err) {
      console.error("Error searching Azure AD users:", err);
    } finally {
      setIsSearchingAd(false);
    }
  };

  const handleSelectUserForSignature = (user: any) => {
    const dateStr = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    const positionText = user.jobFunction || user.job_function || user.position || user.title || "Senior Manager";
    if (signatureModalTarget === 'employee') {
      setEmployeeSignature(user.signatureData || user.fullName);
      setEmployeeName(user.fullName);
      setEmployeePosition(positionText);
      setEmployeeDate(dateStr);
    } else {
      setSupervisorSignature(user.signatureData || user.fullName);
      setSupervisorName(user.fullName);
      setSupervisorPosition(positionText);
      setSupervisorDate(dateStr);
    }
    setIsSignatureModalOpen(false);
    setAdSearchQuery('');
    setAdSearchResults([]);
  };

  const getQueryForField = (field: 'MM' | 'CFO' | 'TS' | 'CS' | 'SS' | 'PE' | 'CUSTOM') => {
    switch (field) {
      case 'MM': return mmPushEmail;
      case 'CFO': return cfoPushEmail;
      case 'TS': return tsPushEmail;
      case 'CS': return csPushEmail;
      case 'SS': return ssPushEmail;
      case 'PE': return pePushEmail;
      case 'CUSTOM': return customPushEmail;
      default: return '';
    }
  };

  const setValForField = (field: 'MM' | 'CFO' | 'TS' | 'CS' | 'SS' | 'PE' | 'CUSTOM', val: string) => {
    switch (field) {
      case 'MM': setMmPushEmail(val); break;
      case 'CFO': setCfoPushEmail(val); break;
      case 'TS': setTsPushEmail(val); break;
      case 'CS': setCsPushEmail(val); break;
      case 'SS': setSsPushEmail(val); break;
      case 'PE': setPePushEmail(val); break;
      case 'CUSTOM': setCustomPushEmail(val); break;
    }
  };

  const getFilteredUsersForField = (field: 'MM' | 'CFO' | 'TS' | 'CS' | 'SS' | 'PE' | 'CUSTOM') => {
    const q = getQueryForField(field).toLowerCase();
    if (!q) {
      return userManagementUsers.slice(0, 5);
    }
    return userManagementUsers.filter(u => {
      const name = (u.fullName || u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const dep = (u.department || '').toLowerCase();
      const job = (u.jobFunction || u.job_function || '').toLowerCase();
      return name.includes(q) || email.includes(q) || dep.includes(q) || job.includes(q);
    });
  };

  const renderAutocompleteFor = (field: 'MM' | 'CFO' | 'TS' | 'CS' | 'SS' | 'PE') => {
    if (activeSearchField !== field) return null;
    const list = getFilteredUsersForField(field);
    return (
      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-indigo-100 rounded-md shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-100">
        <div className="p-1.5 text-[8px] font-black uppercase text-indigo-600 bg-indigo-50/50 sticky top-0 flex justify-between items-center">
          <span>Registry User Search</span>
          <button 
            type="button" 
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              setActiveSearchField(null); 
            }} 
            className="text-gray-400 hover:text-gray-600 font-bold px-1"
          >
            ✕
          </button>
        </div>
        {list.length === 0 ? (
          <div className="p-2 text-center text-gray-400 text-[8px]">No matching users</div>
        ) : (
          list.map((u, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setValForField(field, u.email);
                setActiveSearchField(null);
              }}
              className="w-full text-left p-1.5 hover:bg-indigo-50/40 transition flex flex-col gap-0.5 text-[9px]"
            >
              <span className="font-extrabold text-slate-800">{u.fullName || u.full_name || 'Unnamed User'}</span>
              <span className="text-[8px] text-gray-500 font-mono">{u.email}</span>
              {(u.jobFunction || u.job_function || u.department) && (
                <span className="text-[7.5px] text-indigo-500 font-medium">
                  {u.jobFunction || u.job_function || ''} {u.department ? `(${u.department})` : ''}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    );
  };

  // Print preview configuration states
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printFontSize, setPrintFontSize] = useState<'small' | 'standard' | 'large'>('standard');
  const [printMargin, setPrintMargin] = useState<'compact' | 'standard' | 'wide'>('standard');
  const [printTheme, setPrintTheme] = useState<string>('emerald');

  // Municipal Header Configuration States
  const [municipalityName, setMunicipalityName] = useState('NKANGALA DISTRICT MUNICIPALITY');
  const [templateSubHeader, setTemplateSubHeader] = useState('DRAFT REGULATORY DOCUMENT TEMPLATE');
  const [muniFontFamily, setMuniFontFamily] = useState('font-sans'); // font-sans, font-serif, font-mono
  const [muniFontSize, setMuniFontSize] = useState('11px');
  const [muniColor, setMuniColor] = useState('#9f1239'); // rose-800
  const [subHeaderFontSize, setSubHeaderFontSize] = useState('9px');
  const [subHeaderColor, setSubHeaderColor] = useState('#6b7280'); // gray-500
  const [muniLogo, setMuniLogo] = useState<string | null>(null);

  const triggerNotification = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const addTableToSection = (sectionId: string) => {
    const newTable: CustomTable = {
      id: `table-${Date.now()}`,
      sectionId,
      title: 'Additional Section Table',
      headers: ['Description', 'Value/Target'],
      rows: [['', '']]
    };
    setCustomTables(prev => [...prev, newTable]);
    triggerNotification("New table added to section!", "success");
  };

  const updateTable = (tableId: string, updates: Partial<CustomTable>) => {
    setCustomTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
  };

  const deleteTable = (tableId: string) => {
    setCustomTables(prev => prev.filter(t => t.id !== tableId));
    triggerNotification("Table removed.", "success");
  };

  const addTableRow = (tableId: string) => {
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, rows: [...t.rows, t.headers.map(() => '')] };
      }
      return t;
    }));
  };

  const deleteTableRow = (tableId: string, rowIndex: number) => {
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, rows: t.rows.filter((_, i) => i !== rowIndex) };
      }
      return t;
    }));
  };

  const addTableColumn = (tableId: string) => {
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          headers: [...t.headers, `Col ${t.headers.length + 1}`],
          rows: t.rows.map(row => [...row, ''])
        };
      }
      return t;
    }));
  };

  const deleteTableColumn = (tableId: string, colIndex: number) => {
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId && t.headers.length > 1) {
        return {
          ...t,
          headers: t.headers.filter((_, i) => i !== colIndex),
          rows: t.rows.map(row => row.filter((_, i) => i !== colIndex))
        };
      }
      return t;
    }));
  };

  const defaultCoreCompetenciesFallback = [
    {
      id: 'row-1',
      competency: 'Strategic Leadership',
      basic: 'Minimal ability to guide teams',
      competent: 'Can lead a team effectively',
      advanced: 'Transforms team performance and strategy',
      superior: 'Industry visionary, drives systemic changes'
    },
    {
      id: 'row-2',
      competency: 'Financial Management',
      basic: 'Basic understanding of budgets',
      competent: 'Manages departmental budgets accurately',
      advanced: 'Optimizes large scale financial operations',
      superior: 'Sets strategic financial policies for the organisation'
    },
    {
      id: 'row-3',
      competency: 'People Management',
      basic: 'Directs basic work activities',
      competent: 'Fosters team collaboration and handles disputes',
      advanced: 'Develops high-performing diverse teams and mentors future leaders',
      superior: 'Builds cross-functional talent pipelines for global organizational synergy'
    },
    {
      id: 'row-4',
      competency: 'Governance and Auditing Leadership',
      basic: 'Acknowledges compliance protocols',
      competent: 'Ensures functional areas meet regulatory parameters',
      advanced: 'Champions clean governance and leads inter-departmental audit compliance',
      superior: 'Defines institutional accountability and zero-tolerance risk management models'
    }
  ];

  const RenderCoreCompetenciesBelowKpa = () => {
    return null;
  };

  const RenderCompetenciesTable = () => {
    if (!pulledCompetencyRows || pulledCompetencyRows.length === 0) return null;

    // Do not render standard competencies table for CFO or PED templates if they have specific rows populated
    const isCfoTemplate = templateName.toLowerCase().includes('cfo');
    const isPedTemplate = templateName.toLowerCase().includes('ped');
    if (isCfoTemplate && pulledCfoCompetencyRows && pulledCfoCompetencyRows.length > 0) return null;
    if (isPedTemplate && pulledPedCompetencyRows && pulledPedCompetencyRows.length > 0) return null;

    return (
      <div className="space-y-4 mt-6 break-inside-avoid">
        <h5 className="font-bold text-[10px] uppercase tracking-tight" style={{ color: headingColor }}>
          Adopted Core Competencies Table
        </h5>
        <div className="border rounded overflow-hidden" style={{ borderColor }}>
          <table className="w-full text-left text-[9px] border-collapse bg-white">
            <thead className="bg-slate-50 uppercase text-[8px] font-black tracking-widest text-slate-500">
              <tr>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Competency</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Basic</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Competent</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Advanced</th>
                <th className="p-1.5 border-b" style={{ borderColor }}>Superior</th>
              </tr>
            </thead>
            <tbody>
              {pulledCompetencyRows.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0" style={{ borderColor }}>
                  <td className="p-1.5 border-r font-bold align-top" style={{ borderColor }}>{row.title || row.competency || row.name || 'Core Competency'}</td>
                  <td className="p-1.5 border-r align-top" style={{ borderColor }}>{row.basic || '-'}</td>
                  <td className="p-1.5 border-r align-top" style={{ borderColor }}>{row.competent || '-'}</td>
                  <td className="p-1.5 border-r align-top" style={{ borderColor }}>{row.advanced || '-'}</td>
                  <td className="p-1.5 align-top" style={{ borderColor }}>{row.superior || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const RenderCfoCompetenciesTable = () => {
    if (!pulledCfoCompetencyRows || pulledCfoCompetencyRows.length === 0) return null;
    
    // Only render for CFO template
    const isCfoTemplate = templateName.toLowerCase().includes('cfo');
    if (!isCfoTemplate) return null;

    return (
      <div className="space-y-4 mt-6 break-inside-avoid">
        <h5 className="font-bold text-[10px] uppercase tracking-tight" style={{ color: headingColor }}>
          Adopted CFO Core Competencies Table
        </h5>
        <div className="border rounded overflow-hidden" style={{ borderColor }}>
          <table className="w-full text-left text-[9px] border-collapse bg-white">
            <thead className="bg-slate-50 uppercase text-[8px] font-black tracking-widest text-slate-500">
              <tr>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Competency</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Components</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Competency Definition</th>
                <th className="p-1.5 border-b text-center w-24 font-bold" style={{ borderColor }}>Weighting % (100%)</th>
              </tr>
            </thead>
            <tbody>
              {pulledCfoCompetencyRows.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0" style={{ borderColor }}>
                  <td className="p-1.5 border-r font-bold align-top text-slate-900" style={{ borderColor }}>{row.competency || 'Core Competency'}</td>
                  <td className="p-1.5 border-r align-top text-slate-600" style={{ borderColor }}>{row.components || '-'}</td>
                  <td className="p-1.5 border-r align-top text-slate-700" style={{ borderColor }}>{row.definition || '-'}</td>
                  <td className="p-1.5 align-top font-mono text-indigo-600 font-bold text-center" style={{ borderColor }}>{row.weighting || '0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const RenderPedCompetenciesTable = () => {
    if (!pulledPedCompetencyRows || pulledPedCompetencyRows.length === 0) return null;
    
    // Only render for PED template
    const isPedTemplate = templateName.toLowerCase().includes('ped');
    if (!isPedTemplate) return null;

    return (
      <div className="space-y-4 mt-6 break-inside-avoid">
        <h5 className="font-bold text-[10px] uppercase tracking-tight" style={{ color: headingColor }}>
          Adopted PED Core Competencies Table
        </h5>
        <div className="border rounded overflow-hidden" style={{ borderColor }}>
          <table className="w-full text-left text-[9px] border-collapse bg-white">
            <thead className="bg-slate-50 uppercase text-[8px] font-black tracking-widest text-slate-500">
              <tr>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Competency</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Components</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Competency Definition</th>
                <th className="p-1.5 border-b text-center w-24 font-bold" style={{ borderColor }}>Weighting % (100%)</th>
              </tr>
            </thead>
            <tbody>
              {pulledPedCompetencyRows.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0" style={{ borderColor }}>
                  <td className="p-1.5 border-r font-bold align-top text-slate-900" style={{ borderColor }}>{row.competency || 'Core Competency'}</td>
                  <td className="p-1.5 border-r align-top text-slate-600" style={{ borderColor }}>{row.components || '-'}</td>
                  <td className="p-1.5 border-r align-top text-slate-700" style={{ borderColor }}>{row.definition || '-'}</td>
                  <td className="p-1.5 align-top font-mono text-indigo-600 font-bold text-center" style={{ borderColor }}>{row.weighting || '0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const RenderCorpCompetenciesTable = () => {
    if (!pulledCorpCompetencyRows || pulledCorpCompetencyRows.length === 0) return null;
    
    // Only render for Corporate Services template
    const isCorpTemplate = templateName.toLowerCase().includes('corporate') || templateName.toLowerCase().includes('corp');
    if (!isCorpTemplate) return null;

    return (
      <div className="space-y-4 mt-6 break-inside-avoid">
        <h5 className="font-bold text-[10px] uppercase tracking-tight" style={{ color: headingColor }}>
          Adopted Corporate Services Core Competencies Table
        </h5>
        <div className="border rounded overflow-hidden" style={{ borderColor }}>
          <table className="w-full text-left text-[9px] border-collapse bg-white">
            <thead className="bg-slate-50 uppercase text-[8px] font-black tracking-widest text-slate-500">
              <tr>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Competency</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Components</th>
                <th className="p-1.5 border-b border-r" style={{ borderColor }}>Competency Definition</th>
                <th className="p-1.5 border-b text-center w-24 font-bold" style={{ borderColor }}>Weighting % (100%)</th>
              </tr>
            </thead>
            <tbody>
              {pulledCorpCompetencyRows.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0" style={{ borderColor }}>
                  <td className="p-1.5 border-r font-bold align-top text-slate-900" style={{ borderColor }}>{row.competency || 'Core Competency'}</td>
                  <td className="p-1.5 border-r align-top text-slate-600" style={{ borderColor }}>{row.components || '-'}</td>
                  <td className="p-1.5 border-r align-top text-slate-700" style={{ borderColor }}>{row.definition || '-'}</td>
                  <td className="p-1.5 align-top font-mono text-indigo-600 font-bold text-center" style={{ borderColor }}>{row.weighting || '0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const RenderCustomTables = ({ sectionId }: { sectionId: string }) => {
    const isSection15 = sectionId === "section-1782677903090" || (() => {
      const sec = dynamicSections.find(s => s.id === sectionId);
      return sec && (sec.heading.trim().startsWith("15") || sec.heading.toLowerCase().includes("15."));
    })();
    if (isMandlaMahlangu && isSection15) {
      return null;
    }

    const tables = customTables.filter(t => t.sectionId === sectionId);
    if (tables.length === 0) return null;

    return (
      <div className="space-y-4 mt-4 break-inside-avoid">
        {tables.map((table) => (
          <div key={table.id} className="space-y-2">
            {table.title && <h5 className="font-bold text-[10px] text-slate-700 uppercase tracking-tight">{table.title}</h5>}
            <div className="border rounded overflow-hidden" style={{ borderColor }}>
              <table className="w-full text-left text-[9px] border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-800" style={{ borderColor }}>
                    {table.headers.map((h, i) => (
                      <th key={i} className="p-2 border-r last:border-r-0" style={{ borderColor }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b last:border-b-0 text-slate-600" style={{ borderColor }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-1.5 border-r last:border-r-0 whitespace-pre-wrap leading-tight" style={{ borderColor }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handlePullPerformancePlan = async () => {
    setPullingPplan(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setPulledPplanItems(data.items);
          triggerNotification("Successfully pulled Annual Performance Planner Grid items!", "success");
        } else {
          setPulledPplanItems([]);
          triggerNotification("No performance planner items found for this profile.", "error");
        }
      } else {
        throw new Error("Failed to load Performance Plan data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling performance plan: " + err.message, "error");
    } finally {
      setPullingPplan(false);
    }
  };

  const handlePullFilteredPerformancePlan = async () => {
    setPullingFilteredPplan(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setPulledFilteredPplanItems(data.items);
          triggerNotification("Successfully pulled Filtered Annual Performance Planner Grid items!", "success");
        } else {
          setPulledFilteredPplanItems([]);
          triggerNotification("No performance planner items found for this profile.", "error");
        }
      } else {
        throw new Error("Failed to load Performance Plan data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling performance plan: " + err.message, "error");
    } finally {
      setPullingFilteredPplan(false);
    }
  };

  const handlePullPDP = async () => {
    setPullingPdp(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pdp?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setPulledPdpItems(data.items);
          triggerNotification("Successfully pulled Personal Development Plan (PDP) rows!", "success");
        } else {
          setPulledPdpItems([]);
          triggerNotification("No PDP items found for this profile.", "error");
        }
      } else {
        throw new Error("Failed to load PDP data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling PDP: " + err.message, "error");
    } finally {
      setPullingPdp(false);
    }
  };

  const handlePullAllCompetencies = async () => {
    setPullingCompetencies(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setPulledCompetencyRows(data.items);
          triggerNotification(`Successfully pulled all ${data.items.length} Competencies!`, "success");
        } else {
          setPulledCompetencyRows([]);
          triggerNotification("No Competency rows found for this profile.", "error");
        }
      } else {
        throw new Error("Failed to load Competencies data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling Competencies: " + err.message, "error");
    } finally {
      setPullingCompetencies(false);
    }
  };

  const handlePullCfoCompetencies = async () => {
    setPullingCfoCompetencies(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.cfoItems)) {
          setPulledCfoCompetencyRows(data.cfoItems);
          triggerNotification(`Successfully pulled all ${data.cfoItems.length} CFO Core Competencies!`, "success");
        } else {
          setPulledCfoCompetencyRows([]);
          triggerNotification("No CFO Competency rows found. Please ensure they are populated in the Core Competencies CFO Tab.", "error");
        }
      } else {
        throw new Error("Failed to load CFO Competencies data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling CFO Competencies: " + err.message, "error");
    } finally {
      setPullingCfoCompetencies(false);
    }
  };

  const handlePullPedCompetencies = async () => {
    setPullingPedCompetencies(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const pedRowsToUse = (data && Array.isArray(data.pedItems) && data.pedItems.length > 0)
          ? data.pedItems
          : [
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

        setPulledPedCompetencyRows(pedRowsToUse);
        triggerNotification(`Successfully pulled all ${pedRowsToUse.length} PED Core Competencies!`, "success");
      } else {
        throw new Error("Failed to load PED Competencies data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling PED Competencies: " + err.message, "error");
    } finally {
      setPullingPedCompetencies(false);
    }
  };

  const handlePullCorpCompetencies = async () => {
    setPullingCorpCompetencies(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const corpRowsToUse = (data && Array.isArray(data.corporateServicesItems) && data.corporateServicesItems.length > 0)
          ? data.corporateServicesItems
          : [];
        if (corpRowsToUse.length > 0) {
          setPulledCorpCompetencyRows(corpRowsToUse);
          triggerNotification(`Successfully pulled all ${corpRowsToUse.length} Corporate Services Core Competencies!`, "success");
        } else {
          setPulledCorpCompetencyRows([]);
          triggerNotification("No Corporate Services Competency rows found. Please ensure they are populated in the Core Competencies Corporate Services Tab.", "error");
        }
      } else {
        throw new Error("Failed to load Corporate Services Competencies data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling Corporate Services Competencies: " + err.message, "error");
    } finally {
      setPullingCorpCompetencies(false);
    }
  };

  const handlePullCompetencies = async () => {
    setPullingCompetencies(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.competencies)) {
          // Only adopt core competencies, exclude job-specific ones (whose code/jscNo starts with 'JSC')
          const coreOnly = data.competencies.filter((item: any) => {
            const code = (item.jscNo || '').toUpperCase();
            return !code.startsWith('JSC');
          });
          setPulledCompetencyRows(coreOnly);
          if (coreOnly.length > 0) {
            triggerNotification(`Successfully pulled ${coreOnly.length} Core Competencies! (Job-specific ones excluded)`, "success");
          } else {
            triggerNotification("Core Competencies pulled. (Job-specific ones starting with JSC were filtered out).", "success");
          }
        } else {
          setPulledCompetencyRows([]);
          triggerNotification("No Core Competency rows found for this profile.", "error");
        }
      } else {
        throw new Error("Failed to load Competencies data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling Core Competencies: " + err.message, "error");
    } finally {
      setPullingCompetencies(false);
    }
  };

  const handlePushToProfile = async (targetTitle: string, targetEmail: string) => {
    const normalizedEmail = (targetEmail || '').toLowerCase().trim();
    setPushingStates(prev => ({ ...prev, [targetTitle]: 'loading' }));
    try {
      const stateObj = {
        id: selectedTemplateId || (isMandlaMahlangu ? 'template-mm-standard' : `template-${Date.now()}`),
        name: isMandlaMahlangu ? 'MM: Municipal Manager Premium Agreement' : templateName,
        headingCover,
        headingRegulatoryInfo,
        dynamicSections,
        headingPurpose,
        headingValidity,
        headingReporting,
        headingFramework,
        headingKpaTable,
        headingJscTable,
        headingConditions,
        headingAssessmentKpas,
        headingFeedback,
        headingTimetable,
        headingPoorPerformance,
        headingDispute,
        headingAmendment,
        headingEvaluation,
        headingNationalKpas,
        heading4_4,
        heading4_5,
        headingSignatures,
        headingAnnexA,
        headingAnnexB,
        headingAnnexC,
        coverPage,
        regulatoryInfoText,
        purpose,
        validity,
        reporting,
        framework,
        frameworkBelowKpa,
        nationalKpasText,
        text4_4,
        text4_5,
        frameworkBelowJsc,
        conditions,
        kpaText,
        feedback,
        timetableText,
        timetableTextBelowTable,
        poorPerformance,
        dispute,
        amendment,
        evaluation,
        annexureC,
        municipalityName,
        templateSubHeader,
        muniFontFamily,
        muniFontSize,
        muniColor,
        subHeaderFontSize,
        subHeaderColor,
        muniLogo,
        customTables,
        textColor,
        headingColor,
        borderColor,
        borderStyle,
        borderWidth,
        documentFontFamily,
        documentTextAlign,
        showPageNumbers,
        footerText,
        createdAt: new Date().toISOString(),
        pulledPplanItems,
        pulledFilteredPplanItems,
        pulledPdpItems,
        pulledCompetencyRows,
        pulledCfoCompetencyRows,
        pulledPedCompetencyRows,
        pulledCorpCompetencyRows,
        employeeSignature: null,
        employeeName: null,
        employeeDate: null,
        supervisorSignature: null,
        supervisorName: null,
        supervisorDate: null,
        includeJSC: true,
        userSignatures: `${targetTitle.toUpperCase()}: ${normalizedEmail}\nEXECUTIVE MAYOR`,
        pushedBy: (currentUser?.email || '').toLowerCase().trim(),
        pushedAt: new Date().toISOString()
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${normalizedEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: stateObj,
          htmlDocumentId: `draft_doc_${activeTenantId}_${normalizedEmail}`
        })
      });

      if (res.ok) {
        setPushingStates(prev => ({ ...prev, [targetTitle]: 'success' }));
        triggerNotification(`Successfully pushed template agreement to ${targetTitle} (${normalizedEmail})!`, "success");
        setTimeout(() => {
          setPushingStates(prev => ({ ...prev, [targetTitle]: 'idle' }));
        }, 3000);
      } else {
        throw new Error("Failed to sync pushed document to server.");
      }
    } catch (err: any) {
      console.error(err);
      setPushingStates(prev => ({ ...prev, [targetTitle]: 'error' }));
      triggerNotification(`Push to ${targetTitle} failed: ` + err.message, "error");
      setTimeout(() => {
        setPushingStates(prev => ({ ...prev, [targetTitle]: 'idle' }));
      }, 3000);
    }
  };

  // Pre-configured MM Template only loaded for Mandla Lucas Mahlangu
  const getMMTemplateDefault = (): PATemplate => ({
    id: 'template-mm-standard',
    name: 'MM: Municipal Manager Premium Agreement',
    headingCover: 'MUNICIPAL WORKSPACE COVER DESIGN',
    headingRegulatoryInfo: 'Regulatory Information & Definitions',
    headingPurpose: '1. Strategic Mandate & Purpose',
    headingValidity: '2. Contract Durational Alignment',
    headingReporting: '3. Institutional Hierarchy & Reporting',
    headingFramework: '4. National Local Government Performance Framework',
    headingKpaTable: '4.1 Municipal Service Delivery & Budget Implementation targets',
    headingJscTable: '4.2 Core Leadership Competency standards weight matrix',
    headingNationalKpas: '4.3 National KPA Categories',
    heading4_4: '4.4 Performance Plan',
    heading4_5: '4.5 Performance Review',
    headingConditions: '5. Performance Objectives',
    headingAssessmentKpas: '6. Performance Management System',
    headingFeedback: '7. Feedback & Operational Improvement logs',
    headingTimetable: '8. Institutional review agenda & discussion timetable',
    headingPoorPerformance: '9. Remedy of Substandard Performance outcomes',
    headingDispute: '10. Standard dispute resolutions',
    headingAmendment: '11. Regulatory Amendments protocol',
    headingEvaluation: '12. Scoring & Appraisal mathematical formulation',
    headingSignatures: '16. Official Signatures agreement verification',
    headingAnnexA: 'Annexure A: Comprehensive SDBIP Performance Plan',
    headingAnnexB: 'Annexure B: Competency Personal Development Plan',
    headingAnnexC: 'Annexure C: National Statutory Disclosure of Interest',
    // Content details matching Mun Manager
    coverPage: 'PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe {municipalityName} herein represented by the Executive Mayor\n\n&\n\nMandla L. Mahlangu\n\nMunicipal Manager\n\nFOR THE FINANCIAL YEAR: 2025/2026',
    regulatoryInfoText: 'This agreement is entered into in terms of Section 57(1)(b) of the Local Government: Municipal Systems Act, 2000 (Act No. 32 of 2000).',
    purpose: 'The purpose of this agreement is to secure administrative accountability, aligning systemic goals to public transformation parameters.',
    validity: 'This contract validity corresponds strictly to 1 July 2025 through 30 June 2026, or until a new MM contract is approved by Council.',
    reporting: 'The Municipal Manager reports to the Executive Mayor on all executive, managerial, and operational functions of the district administration.',
    framework: 'The performance framework uses structural indicators that correspond to the Municipal Systems Act guidelines.',
    frameworkBelowKpa: 'KPAs align with strategic targets set by the District Council.',
    frameworkBelowJsc: 'Competencies describe the strategic and financial direction capabilities of senior managers.',
    text4_4: 'The performance plan sets out the strategic goals for the review period.',
    text4_5: 'Performance reviews will be conducted based on the agreed performance plan.',
    conditions: 'Administrative performance reviews will outline compliance variables.',
    kpaText: 'Performance plans form the basis for determining scorecards.\n\nScores are computed using specific weights assigned to SDBIP deliverables.',
    feedback: 'Both formal and informal updates will populate the operational log.',
    timetableText: 'Formal assessments occur at the conclusion of Q2 and Q4.',
    timetableTextBelowTable: 'This schedule is subject to revisions as needed.',
    poorPerformance: 'Remediation cycles are available under provincial templates.',
    dispute: 'Unresolved disputes are referred directly to the Executive Committee.',
    amendment: 'Amendments follow rules set down under public administrative systems.',
    evaluation: 'Total performance scores are formulated under the municipal score matrix.',
    annexureC: 'I certify that the financial disclosure registry represents my assets and interests.',
    customTables: [],
    municipalityName: 'NKANGALA DISTRICT MUNICIPALITY',
    templateSubHeader: 'DRAFT REGULATORY DOCUMENT TEMPLATE',
    muniFontFamily: 'font-sans',
    muniFontSize: '11px',
    muniColor: '#9f1239',
    subHeaderFontSize: '9px',
    subHeaderColor: '#6b7280',
    muniLogo: null,
    pulledPplanItems: null,
    pulledFilteredPplanItems: null,
    pulledPdpItems: null,
    pulledCompetencyRows: null,
    pulledCfoCompetencyRows: null,
    pulledPedCompetencyRows: null,
    pulledCorpCompetencyRows: null
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser.email}`);
      if (res.ok) {
        const data = await res.json();
        const docState = data.html || data;
        
        // Wrap the single drafted state in a dummy PATemplate object so the workspace can load it
        const draftedTemplate: PATemplate = {
          id: 'drafted_doc',
          name: 'My Drafted Performance Agreement',
          ...docState,
          dynamicSections: docState.dynamicSections || [],
          headingCover: docState.headingCover || 'COVER PAGE',
          headingPurpose: docState.headingPurpose || '1. Purpose of this Agreement',
          headingValidity: docState.headingValidity || '2. Commencement and Validity',
          headingReporting: docState.headingReporting || '3. Performance Objectives',
          headingFramework: docState.headingFramework || '4. Performance Management System',
          headingKpaTable: docState.headingKpaTable || '5. Key Performance Areas (KPAs)',
          headingJscTable: docState.headingJscTable || '6. Job Specific Competencies (JSC)',
          headingEvaluation: docState.headingEvaluation || '7. Evaluating Performance',
          headingTimetable: docState.headingTimetable || '8. Schedule for Performance Reviews',
          headingFeedback: docState.headingFeedback || '9. Developmental Requirements',
          headingConditions: docState.headingConditions || '10. Obligations of the Employer',
          headingPoorPerformance: docState.headingPoorPerformance || '11. Management of Evaluation Outcomes',
          headingDispute: docState.headingDispute || '12. Dispute Resolution',
          headingAmendment: docState.headingAmendment || '13. General',
          headingSignatures: docState.headingSignatures || '14. Signatures'
        };

        setTemplates([draftedTemplate]);
        setSelectedTemplateId('drafted_doc');
        loadTemplateIntoWorkspace(draftedTemplate);
      } else {
        triggerNotification("No incoming performance agreement found.", "error");
      }
    } catch (err) {
      console.error("Error fetching drafted document:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const activeTpl: PATemplate = {
        id: selectedTemplateId || (isMandlaMahlangu ? 'template-mm-standard' : `template-${Date.now()}`),
        name: isMandlaMahlangu ? 'MM: Municipal Manager Premium Agreement' : templateName,
        headingCover,
        headingRegulatoryInfo,
        dynamicSections,
        headingPurpose,
        headingValidity,
        headingReporting,
        headingFramework,
        headingKpaTable,
        headingJscTable,
        headingConditions,
        headingAssessmentKpas,
        headingFeedback,
        headingTimetable,
        headingPoorPerformance,
        headingDispute,
        headingAmendment,
        headingEvaluation,
        headingNationalKpas,
        heading4_4,
        heading4_5,
        headingSignatures,
        headingAnnexA,
        headingAnnexB,
        headingAnnexC,
        coverPage,
        regulatoryInfoText,
        purpose,
        validity,
        reporting,
        framework,
        frameworkBelowKpa,
        nationalKpasText,
        text4_4,
        text4_5,
        frameworkBelowJsc,
        conditions,
        kpaText,
        feedback,
        timetableText,
        timetableTextBelowTable,
        poorPerformance,
        dispute,
        amendment,
        evaluation,
        annexureC,
        municipalityName,
        templateSubHeader,
        muniFontFamily,
        muniFontSize,
        muniColor,
        subHeaderFontSize,
        subHeaderColor,
        muniLogo,
        customTables,
        textColor,
        headingColor,
        borderColor,
        borderStyle,
        borderWidth,
        documentFontFamily,
        documentTextAlign,
        showPageNumbers,
        footerText,
        createdAt: new Date().toISOString(),
        pulledPplanItems,
        pulledFilteredPplanItems,
        pulledPdpItems,
        pulledCompetencyRows,
        pulledCfoCompetencyRows,
        pulledPedCompetencyRows,
        pulledCorpCompetencyRows,
        employeeSignature,
        employeeName,
        employeePosition,
        employeeDate,
        supervisorSignature,
        supervisorName,
        supervisorPosition,
        supervisorDate,
        sigDay,
        sigMonth,
        sigYear
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          html: activeTpl,
          htmlDocumentId: `draft_doc_${activeTenantId}_${currentUser.email}`
        })
      });

      if (res.ok) {
        setTemplates([activeTpl]);
        setSelectedTemplateId(activeTpl.id);
        triggerNotification("Performance Agreement draft saved successfully to your profile!", "success");
      } else {
        throw new Error("Persist operation rejected by server. Check database rules.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Supabase Synchronization Error: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const loadTemplateIntoWorkspace = (tpl: PATemplate) => {
    setTemplateName(tpl.name || 'Custom Generated Template Agreement');
    setHeadingCover(tpl.headingCover || 'COVER PAGE');
    setHeadingRegulatoryInfo(tpl.headingRegulatoryInfo || 'Regulatory Information & Definitions');
    if (tpl.dynamicSections) {
      const cleaned = tpl.dynamicSections.map(sec => {
        const isSec15 = sec.id === "section-1782677903090" || sec.heading.trim().startsWith("15") || sec.heading.toLowerCase().includes("15.");
        if (isMandlaMahlangu && isSec15) {
          const regex = /(thus,?\s*done\s*and\s*signed\s*on\s*this[\s\S]*|thus,?\s*co-signed[\s\S]*)$/gi;
          return {
            ...sec,
            content1: (sec.content1 || '').replace(regex, '').trim(),
            content2: (sec.content2 || '').replace(regex, '').trim()
          };
        }
        return sec;
      });
      setDynamicSections(cleaned);
    }
    setHeadingPurpose(tpl.headingPurpose || '1. Purpose');
    setHeadingValidity(tpl.headingValidity || '2. Validity of Agreement');
    setHeadingReporting(tpl.headingReporting || '3. Reporting Requirements');
    setHeadingFramework(tpl.headingFramework || '4. Performance Assessment Framework');
    setHeadingKpaTable(tpl.headingKpaTable || '4.1 Key Performance Areas (KPAs) Table');
    setHeadingJscTable(tpl.headingJscTable || '4.2 Job Specific Competencies Standards Weight Table');
    setHeadingConditions(tpl.headingConditions || '5. Conditions of performance');
    setHeadingAssessmentKpas(tpl.headingAssessmentKpas || '6. Performance Assessment (KPAs)');
    setHeadingFeedback(tpl.headingFeedback || '7. Feedback');
    setHeadingTimetable(tpl.headingTimetable || '8. Timetable and records of review discussions');
    setHeadingPoorPerformance(tpl.headingPoorPerformance || '9. Management of poor performance outcomes');
    setHeadingDispute(tpl.headingDispute || '10. Dispute Resolution');
    setHeadingAmendment(tpl.headingAmendment || '11. Amendment of agreement');
    setHeadingEvaluation(tpl.headingEvaluation || '12. Evaluation');
    setHeadingNationalKpas(tpl.headingNationalKpas || '4.3 National KPA Categories');
    setHeading4_4(tpl.heading4_4 || '4.4 Performance Plan');
    setHeading4_5(tpl.heading4_5 || '4.5 Performance Review');
    let hSig = tpl.headingSignatures || '16. Signature of parties to the agreement';
    if (hSig.startsWith('13.')) {
      hSig = hSig.replace(/^13\./, '16.');
    }
    setHeadingSignatures(hSig);
    setHeadingAnnexA(tpl.headingAnnexA || 'Annexure A: Performance Plan');
    setHeadingAnnexB(tpl.headingAnnexB || 'Annexure B: Personal Development Plan (PDP)');
    setHeadingAnnexC(tpl.headingAnnexC || 'Annexure C: Disclosure of Interest');

    setCoverPage(tpl.coverPage !== undefined && tpl.coverPage !== null ? tpl.coverPage : 'PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe {municipalityName} herein represented by the Executive Mayor\n\n&\n\nMandla L. Mahlangu\n\nMunicipal Manager\n\nFOR THE FINANCIAL YEAR: 2025/2026');
    setRegulatoryInfoText(tpl.regulatoryInfoText || 'This section defines regulatory requirements and definition of terms used throughout this document. It outlines the scope of regulatory compliance under the Municipal Systems Act.');
    setPurpose(tpl.purpose);
    setValidity(tpl.validity);
    setReporting(tpl.reporting);
    setFramework(tpl.framework);
    setFrameworkBelowKpa(tpl.frameworkBelowKpa);
    setNationalKpasText(tpl.nationalKpasText || '1. Basic Service Delivery\n2. Municipal Institutional Development and Transformation\n3. Local Economic Development\n4. Municipal Financial Viability and Management\n5. Good Governance and Public Participation\n6. Cross Cutting Interventions');
    setText4_4(tpl.text4_4 || '');
    setText4_5(tpl.text4_5 || '');
    setFrameworkBelowJsc(tpl.frameworkBelowJsc);
    setConditions(tpl.conditions);
    setKpaText(tpl.kpaText);
    setFeedback(tpl.feedback);
    setTimetableText(tpl.timetableText);
    if (tpl.timetableTextBelowTable) setTimetableTextBelowTable(tpl.timetableTextBelowTable);
    setPoorPerformance(tpl.poorPerformance);
    setDispute(tpl.dispute);
    setAmendment(tpl.amendment);
    setEvaluation(tpl.evaluation);
    setAnnexureC(tpl.annexureC);
    setCustomTables(tpl.customTables || []);

    setMunicipalityName(tpl.municipalityName || 'NKANGALA DISTRICT MUNICIPALITY');
    setTemplateSubHeader(tpl.templateSubHeader || 'DRAFT REGULATORY DOCUMENT TEMPLATE');
    setMuniFontFamily(tpl.muniFontFamily || 'font-sans');
    setMuniFontSize(tpl.muniFontSize || '11px');
    setMuniColor(tpl.muniColor || '#9f1239');
    setSubHeaderFontSize(tpl.subHeaderFontSize || '9px');
    setSubHeaderColor(tpl.subHeaderColor || '#6b7280');
    setMuniLogo(tpl.muniLogo || null);

    if (tpl.textColor) setTextColor(tpl.textColor);
    if (tpl.headingColor) setHeadingColor(tpl.headingColor);
    if (tpl.borderColor) setBorderColor(tpl.borderColor);
    if (tpl.borderStyle) setBorderStyle(tpl.borderStyle);
    if (tpl.borderWidth) setBorderWidth(tpl.borderWidth);
    if (tpl.documentFontFamily) setDocumentFontFamily(tpl.documentFontFamily);
    if (tpl.documentTextAlign) setDocumentTextAlign(tpl.documentTextAlign as any);
    if (tpl.showPageNumbers !== undefined) setShowPageNumbers(tpl.showPageNumbers);
    if (tpl.footerText) setFooterText(tpl.footerText);

    // Load pulled items states
    setPulledPplanItems(tpl.pulledPplanItems !== undefined ? tpl.pulledPplanItems : null);
    setPulledFilteredPplanItems(tpl.pulledFilteredPplanItems !== undefined ? tpl.pulledFilteredPplanItems : null);
    setPulledPdpItems(tpl.pulledPdpItems !== undefined ? tpl.pulledPdpItems : null);
    setPulledCompetencyRows(tpl.pulledCompetencyRows !== undefined ? tpl.pulledCompetencyRows : null);
    setPulledCfoCompetencyRows(tpl.pulledCfoCompetencyRows !== undefined ? tpl.pulledCfoCompetencyRows : null);
    setPulledPedCompetencyRows(tpl.pulledPedCompetencyRows !== undefined ? tpl.pulledPedCompetencyRows : null);
    setPulledCorpCompetencyRows(tpl.pulledCorpCompetencyRows !== undefined ? tpl.pulledCorpCompetencyRows : null);

    // Signatures Loading
    setEmployeeSignature(tpl.employeeSignature !== undefined ? tpl.employeeSignature : null);
    setEmployeeName(tpl.employeeName !== undefined ? tpl.employeeName : null);
    setEmployeePosition(tpl.employeePosition !== undefined ? tpl.employeePosition : null);
    setEmployeeDate(tpl.employeeDate !== undefined ? tpl.employeeDate : null);
    setSupervisorSignature(tpl.supervisorSignature !== undefined ? tpl.supervisorSignature : null);
    setSupervisorName(tpl.supervisorName !== undefined ? tpl.supervisorName : null);
    setSupervisorPosition(tpl.supervisorPosition !== undefined ? tpl.supervisorPosition : null);
    setSupervisorDate(tpl.supervisorDate !== undefined ? tpl.supervisorDate : null);

    setSigDay(tpl.sigDay !== undefined ? tpl.sigDay : '_____');
    setSigMonth(tpl.sigMonth !== undefined ? tpl.sigMonth : '__________________');
    setSigYear(tpl.sigYear !== undefined ? tpl.sigYear : '2026');
  };

  useEffect(() => {
    fetchTemplates();
    fetchUserManagementUsers();
  }, [activeTenantId]);

  return (
    <div id="pa-templates-workspace" className="p-0 text-slate-800 bg-slate-100 flex flex-col">
      
      {/* Dynamic Popups */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3.5 rounded-xl shadow-2xl border transition-all animate-bounce ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-250'
        }`}>
          {notification.type === 'success' ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-rose-600" />}
          <p className="text-xs font-bold">{notification.text}</p>
        </div>
      )}

      {/* Control Banner */}
      <div className="bg-white p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-emerald-600" />
            Performance Agreement Templates Workspace
          </h2>
          <p className="text-[10px] text-gray-500 font-medium">
            Remove all generic blueprints. Replicating professional Drafting Suite layout with independent column scrolling and fully editable headings.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* MM Restricted Tag */}
          {isMandlaMahlangu ? (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg border border-amber-200 text-[10px] font-black uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>MM Agreement Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-50 text-slate-500 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] font-medium italic">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Standard Template Mode</span>
            </div>
          )}

          {/* Load template selection */}
          {templates.length > 0 && (
            <select
              value={selectedTemplateId}
              onChange={e => {
                const sId = e.target.value;
                setSelectedTemplateId(sId);
                const match = templates.find(t => t.id === sId);
                if (match) loadTemplateIntoWorkspace(match);
              }}
              className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Load from Templates --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {/* Save button */}
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveTemplate}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg inline-flex items-center gap-1 shadow-sm transition"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Save className="w-3.5 h-3.5 text-white" />}
            Save Template Config
          </button>
        </div>
      </div>

      {/* Main Container with Independent scrolling */}
      <div className="flex flex-1 min-h-0 w-full h-[calc(100vh-270px)] bg-slate-100 overflow-hidden divide-x divide-slate-200">
        
        {/* Left pane: Templates Headings & Content Editor (Separate scrolling) */}
        <div id="templates-left-editor-pane" className="w-1/2 h-full overflow-y-auto p-5 space-y-5 bg-white">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Template Name</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter Template Name..."
              className="w-full text-sm font-bold text-slate-800 p-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Design & Adoption Controller Panel */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 p-4 rounded-xl border border-indigo-200/80 space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 animate-pulse" />
              Design & Data Adoption Suite
            </h4>
            <p className="text-[10px] text-indigo-700 leading-normal">
              Customize the statutory template layout styling, live-adopt data from live systems, and broadcast to designated administration profiles.
            </p>

            {/* Sub-section 1: Color Selection Palette */}
            <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-3 shadow-sm text-[10px]">
              <span className="text-[10px] uppercase font-black text-indigo-900 block border-b border-indigo-50 pb-1.5">
                🎨 Document Styling Palette
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                      className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0"
                    />
                    <span className="text-[9px] font-mono font-bold text-gray-600 uppercase">{textColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Headings Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headingColor}
                      onChange={e => setHeadingColor(e.target.value)}
                      className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0"
                    />
                    <span className="text-[9px] font-mono font-bold text-gray-600 uppercase">{headingColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Document Font</label>
                  <select
                    value={documentFontFamily}
                    onChange={e => setDocumentFontFamily(e.target.value)}
                    className="w-full text-[10px] p-1.5 border border-indigo-200 rounded outline-none"
                  >
                    <option value="font-sans">Sans-serif</option>
                    <option value="font-serif">Serif</option>
                    <option value="font-mono">Monospace</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Text Alignment</label>
                  <select
                    value={documentTextAlign}
                    onChange={e => setDocumentTextAlign(e.target.value as any)}
                    className="w-full text-[10px] p-1.5 border border-indigo-200 rounded outline-none"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Border Color</label>
                  <input
                    type="color"
                    value={borderColor}
                    onChange={e => setBorderColor(e.target.value)}
                    className="w-full h-7 rounded border border-gray-300 cursor-pointer p-0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Border Style</label>
                  <select
                    value={borderStyle}
                    onChange={e => setBorderStyle(e.target.value)}
                    className="w-full text-[9px] p-1 border border-slate-300 rounded bg-white font-bold"
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="double">Double</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Border Width</label>
                  <select
                    value={borderWidth}
                    onChange={e => setBorderWidth(e.target.value)}
                    className="w-full text-[9px] p-1 border border-slate-300 rounded bg-white font-bold"
                  >
                    <option value="1px">1px</option>
                    <option value="2px">2px</option>
                    <option value="4px">4px</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="chk-page-numbers"
                    checked={showPageNumbers}
                    onChange={e => setShowPageNumbers(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <label htmlFor="chk-page-numbers" className="text-[10px] font-bold text-gray-600 cursor-pointer">
                    Enable Page Numbers
                  </label>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[9px] uppercase font-black text-gray-500">Footer Text Customizer</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={e => setFooterText(e.target.value)}
                  className="w-full text-[10px] p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:border-indigo-500 font-semibold text-slate-700"
                />
              </div>
            </div>

            {/* Municipal Header Settings */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 shadow-sm">
              <span className="text-[10px] uppercase font-black text-rose-800 block border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-rose-600" />
                Municipal Header Settings
              </span>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Municipality Name</label>
                  <input
                    type="text"
                    value={municipalityName}
                    onChange={e => setMunicipalityName(e.target.value)}
                    className="w-full text-[10px] p-1.5 border border-slate-300 rounded bg-white font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-gray-500">Muni Font Family</label>
                    <select
                      value={muniFontFamily}
                      onChange={e => setMuniFontFamily(e.target.value)}
                      className="w-full text-[9px] p-1 border border-slate-300 rounded bg-white font-bold"
                    >
                      <option value="font-sans">Sans-serif</option>
                      <option value="font-serif">Serif</option>
                      <option value="font-mono">Monospace</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-gray-500">Muni Font Size</label>
                    <input
                      type="text"
                      value={muniFontSize}
                      onChange={e => setMuniFontSize(e.target.value)}
                      className="w-full text-[9px] p-1 border border-slate-300 rounded bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-gray-500">Muni Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={muniColor}
                      onChange={e => setMuniColor(e.target.value)}
                      className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0"
                    />
                    <span className="text-[9px] font-mono font-bold text-gray-600 uppercase">{muniColor}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <label className="text-[9px] uppercase font-black text-gray-500">Template Sub-Header</label>
                  <input
                    type="text"
                    value={templateSubHeader}
                    onChange={e => setTemplateSubHeader(e.target.value)}
                    className="w-full text-[10px] p-1.5 border border-slate-300 rounded bg-white font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-gray-500">Sub Font Size</label>
                    <input
                      type="text"
                      value={subHeaderFontSize}
                      onChange={e => setSubHeaderFontSize(e.target.value)}
                      className="w-full text-[9px] p-1 border border-slate-300 rounded bg-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-gray-500">Sub Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={subHeaderColor}
                        onChange={e => setSubHeaderColor(e.target.value)}
                        className="w-5 h-5 rounded border border-gray-300 cursor-pointer p-0"
                      />
                      <span className="text-[9px] font-mono font-bold text-gray-600 uppercase">{subHeaderColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <label className="text-[9px] uppercase font-black text-gray-500">Municipal Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setMuniLogo(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-[9px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                  {muniLogo && (
                    <button
                      type="button"
                      onClick={() => setMuniLogo(null)}
                      className="text-[9px] text-red-600 hover:underline mt-1"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-section 2: Adopt / Pull Data Grid Buttons */}
            <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-3 shadow-sm text-[10px]">
              <span className="text-[10px] uppercase font-black text-indigo-900 block border-b border-indigo-50 pb-1.5 flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
                Live Data Adoption Matrix
              </span>
              <p className="text-[9px] text-gray-500 leading-tight">
                Click any of the buttons below to pull real system-wide records directly and bind them dynamically as official annexures for this active template.
              </p>
              
              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  type="button"
                  disabled={pullingPplan}
                  onClick={handlePullPerformancePlan}
                  className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                    pulledPplanItems !== null 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    Adopt Annual Performance Planner Grid
                  </span>
                  {pullingPplan ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : pulledPplanItems !== null ? (
                    <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                      {pulledPplanItems.length} KPI Rows Loaded
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={pullingFilteredPplan}
                  onClick={handlePullFilteredPerformancePlan}
                  className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                    pulledFilteredPplanItems !== null 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5 text-indigo-600" />
                    Pull Filtered Performance Planner Table
                  </span>
                  {pullingFilteredPplan ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : pulledFilteredPplanItems !== null ? (
                    <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                      {pulledFilteredPplanItems.length} KPIs Loaded
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={pullingPdp}
                  onClick={handlePullPDP}
                  className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                    pulledPdpItems !== null 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                    Adopt Personal Development Plan (PDP)
                  </span>
                  {pullingPdp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : pulledPdpItems !== null ? (
                    <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                      {pulledPdpItems.length} PDP Rows Loaded
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </button>
                
                <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[9px] text-slate-600 mb-2 mt-2 leading-relaxed">
                  <span className="font-bold text-slate-800">Negotiation of Key Performance Areas:</span> The key performance areas related to the Employee's functional area shall be subject to negotiation between the Employer and the Employee
                </div>

                <button
                  type="button"
                  disabled={pullingCompetencies}
                  onClick={handlePullAllCompetencies}
                  className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                    pulledCompetencyRows !== null 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    Adopt Entire Core Competencies Table
                  </span>
                  {pullingCompetencies ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : pulledCompetencyRows !== null ? (
                    <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                      {pulledCompetencyRows.length} Competencies Loaded
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={pullingCompetencies}
                  onClick={handlePullCompetencies}
                  className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                    pulledCompetencyRows !== null 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    Adopt Core Competencies Only
                  </span>
                  {pullingCompetencies ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : pulledCompetencyRows !== null ? (
                    <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                      {pulledCompetencyRows.length} Competencies Loaded
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </button>

                {pulledCompetencyRows !== null && (
                  <button
                    id="btn-remove-adopted-competencies"
                    type="button"
                    onClick={() => {
                      setPulledCompetencyRows(null);
                      triggerNotification("Removed adopted core competencies table", "success");
                    }}
                    className="w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      Remove Adopted Core Competencies Table
                    </span>
                    <span className="text-[8.5px] font-bold text-rose-600 uppercase">Clear Table</span>
                  </button>
                )}

                {isMikeViewer && (
                  <>
                    <button
                      id="btn-adopt-cfo-competencies"
                      type="button"
                      disabled={pullingCfoCompetencies}
                      onClick={handlePullCfoCompetencies}
                      className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                        pulledCfoCompetencyRows !== null 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                          : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 leading-snug">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        Adopt CFO Core Competencies Table
                      </span>
                      {pullingCfoCompetencies ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 flex-shrink-0" />
                      ) : pulledCfoCompetencyRows !== null ? (
                        <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0">
                          {pulledCfoCompetencyRows.length} CFO Competencies Loaded
                        </span>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      )}
                    </button>

                    {pulledCfoCompetencyRows !== null && (
                      <button
                        id="btn-remove-adopted-cfo-competencies"
                        type="button"
                        onClick={() => {
                          setPulledCfoCompetencyRows(null);
                          triggerNotification("Removed adopted CFO core competencies table", "success");
                        }}
                        className="w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Remove Adopted CFO Core Competencies Table
                        </span>
                        <span className="text-[8.5px] font-bold text-rose-600 uppercase">Clear Table</span>
                      </button>
                    )}
                  </>
                )}

                {isMikeViewer && (
                  <>
                    <button
                      id="btn-adopt-ped-competencies"
                      type="button"
                      disabled={pullingPedCompetencies}
                      onClick={handlePullPedCompetencies}
                      className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                        pulledPedCompetencyRows !== null 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                          : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 leading-snug">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        Adopt PED Core Competencies Table
                      </span>
                      {pullingPedCompetencies ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 flex-shrink-0" />
                      ) : pulledPedCompetencyRows !== null ? (
                        <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0">
                          {pulledPedCompetencyRows.length} PED Competencies Loaded
                        </span>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      )}
                    </button>

                    {pulledPedCompetencyRows !== null && (
                      <button
                        id="btn-remove-adopted-ped-competencies"
                        type="button"
                        onClick={() => {
                          setPulledPedCompetencyRows(null);
                          triggerNotification("Removed adopted PED core competencies table", "success");
                        }}
                        className="w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Remove Adopted PED Core Competencies Table
                        </span>
                        <span className="text-[8.5px] font-bold text-rose-600 uppercase">Clear Table</span>
                      </button>
                    )}
                  </>
                )}

                {isMikeViewer && (
                  <>
                    <button
                      id="btn-adopt-corp-competencies"
                      type="button"
                      disabled={pullingCorpCompetencies}
                      onClick={handlePullCorpCompetencies}
                      className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                        pulledCorpCompetencyRows !== null 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                          : 'bg-pink-50 hover:bg-pink-100/80 border-pink-100 text-pink-900'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 leading-snug">
                        <Briefcase className={`w-3.5 h-3.5 ${pulledCorpCompetencyRows !== null ? 'text-emerald-600' : 'text-pink-600'} flex-shrink-0`} />
                        Adopt Corporate Services Core Competencies Table
                      </span>
                      {pullingCorpCompetencies ? (
                        <Loader2 className={`w-3.5 h-3.5 animate-spin ${pulledCorpCompetencyRows !== null ? 'text-emerald-600' : 'text-pink-600'} flex-shrink-0`} />
                      ) : pulledCorpCompetencyRows !== null ? (
                        <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0">
                          {pulledCorpCompetencyRows.length} Corp Competencies Loaded
                        </span>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                      )}
                    </button>

                    {pulledCorpCompetencyRows !== null && (
                      <button
                        id="btn-remove-adopted-corp-competencies"
                        type="button"
                        onClick={() => {
                          setPulledCorpCompetencyRows(null);
                          triggerNotification("Removed adopted Corporate Services core competencies table", "success");
                        }}
                        className="w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Remove Adopted Corporate Services Core Competencies Table
                        </span>
                        <span className="text-[8.5px] font-bold text-rose-600 uppercase">Clear Table</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sub-section 3: Broadcast / Push To Profiles Suite */}
            <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-3 shadow-sm text-[10px]">
              <span className="text-[10px] uppercase font-black text-indigo-900 block border-b border-indigo-50 pb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Statutory Template Push Matrix (6 Profiles)
              </span>
              <p className="text-[9px] text-gray-500 leading-tight">
                Push the currently configured, styled template document containing all custom chapters and live adopted grids directly as the active workspace draft for each officer.
              </p>

              <div className="space-y-2 pt-1 divide-y divide-gray-100">
                
                {/* MM Push */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 first:pt-0">
                  <div className="flex-1 min-w-0 relative">
                    <span className="text-[10px] font-extrabold text-slate-800 block">Municipal Manager</span>
                    <input
                      type="text"
                      value={mmPushEmail}
                      onChange={e => setMmPushEmail(e.target.value)}
                      onFocus={() => setActiveSearchField('MM')}
                      placeholder="Search or enter email..."
                      className="w-full text-[9px] px-1.5 py-1 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-indigo-400"
                    />
                    {renderAutocompleteFor('MM')}
                  </div>
                  <button
                    type="button"
                    disabled={pushingStates['Municipal Manager'] === 'loading'}
                    onClick={() => handlePushToProfile('Municipal Manager', mmPushEmail)}
                    className="sm:self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-md transition inline-flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                  >
                    {pushingStates['Municipal Manager'] === 'loading' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {pushingStates['Municipal Manager'] === 'success' ? 'Pushed ✓' : 'Push'}
                  </button>
                </div>

                {/* CFO Push */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="flex-1 min-w-0 relative">
                    <span className="text-[10px] font-extrabold text-slate-800 block">Chief Financial Officer</span>
                    <input
                      type="text"
                      value={cfoPushEmail}
                      onChange={e => setCfoPushEmail(e.target.value)}
                      onFocus={() => setActiveSearchField('CFO')}
                      placeholder="Search or enter email..."
                      className="w-full text-[9px] px-1.5 py-1 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-indigo-400"
                    />
                    {renderAutocompleteFor('CFO')}
                  </div>
                  <button
                    type="button"
                    disabled={pushingStates['Chief Financial Officer'] === 'loading'}
                    onClick={() => handlePushToProfile('Chief Financial Officer', cfoPushEmail)}
                    className="sm:self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-md transition inline-flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                  >
                    {pushingStates['Chief Financial Officer'] === 'loading' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {pushingStates['Chief Financial Officer'] === 'success' ? 'Pushed ✓' : 'Push'}
                  </button>
                </div>

                {/* TS Push */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="flex-1 min-w-0 relative">
                    <span className="text-[10px] font-extrabold text-slate-800 block">Technical Services Director</span>
                    <input
                      type="text"
                      value={tsPushEmail}
                      onChange={e => setTsPushEmail(e.target.value)}
                      onFocus={() => setActiveSearchField('TS')}
                      placeholder="Search or enter email..."
                      className="w-full text-[9px] px-1.5 py-1 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-indigo-400"
                    />
                    {renderAutocompleteFor('TS')}
                  </div>
                  <button
                    type="button"
                    disabled={pushingStates['Technical Services Director'] === 'loading'}
                    onClick={() => handlePushToProfile('Technical Services Director', tsPushEmail)}
                    className="sm:self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-md transition inline-flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                  >
                    {pushingStates['Technical Services Director'] === 'loading' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {pushingStates['Technical Services Director'] === 'success' ? 'Pushed ✓' : 'Push'}
                  </button>
                </div>

                {/* CS Push */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="flex-1 min-w-0 relative">
                    <span className="text-[10px] font-extrabold text-slate-800 block">Corporate Services Director</span>
                    <input
                      type="text"
                      value={csPushEmail}
                      onChange={e => setCsPushEmail(e.target.value)}
                      onFocus={() => setActiveSearchField('CS')}
                      placeholder="Search or enter email..."
                      className="w-full text-[9px] px-1.5 py-1 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-indigo-400"
                    />
                    {renderAutocompleteFor('CS')}
                  </div>
                  <button
                    type="button"
                    disabled={pushingStates['Corporate Services Director'] === 'loading'}
                    onClick={() => handlePushToProfile('Corporate Services Director', csPushEmail)}
                    className="sm:self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-md transition inline-flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                  >
                    {pushingStates['Corporate Services Director'] === 'loading' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {pushingStates['Corporate Services Director'] === 'success' ? 'Pushed ✓' : 'Push'}
                  </button>
                </div>

                {/* SS Push */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="flex-1 min-w-0 relative">
                    <span className="text-[10px] font-extrabold text-slate-800 block">Social Services Director</span>
                    <input
                      type="text"
                      value={ssPushEmail}
                      onChange={e => setSsPushEmail(e.target.value)}
                      onFocus={() => setActiveSearchField('SS')}
                      placeholder="Search or enter email..."
                      className="w-full text-[9px] px-1.5 py-1 border border-slate-200 rounded font-mono text-slate-600 outline-none"
                    />
                    {renderAutocompleteFor('SS')}
                  </div>
                  <button
                    type="button"
                    disabled={pushingStates['Social Services Director'] === 'loading'}
                    onClick={() => handlePushToProfile('Social Services Director', ssPushEmail)}
                    className="sm:self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-md transition inline-flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                  >
                    {pushingStates['Social Services Director'] === 'loading' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {pushingStates['Social Services Director'] === 'success' ? 'Pushed ✓' : 'Push'}
                  </button>
                </div>

                {/* PE Push */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="flex-1 min-w-0 relative">
                    <span className="text-[10px] font-extrabold text-slate-800 block">Development Planning Director</span>
                    <input
                      type="text"
                      value={pePushEmail}
                      onChange={e => setPePushEmail(e.target.value)}
                      onFocus={() => setActiveSearchField('PE')}
                      placeholder="Search or enter email..."
                      className="w-full text-[9px] px-1.5 py-1 border border-slate-200 rounded font-mono text-slate-600 outline-none"
                    />
                    {renderAutocompleteFor('PE')}
                  </div>
                  <button
                    type="button"
                    disabled={pushingStates['Development Planning Director'] === 'loading'}
                    onClick={() => handlePushToProfile('Development Planning Director', pePushEmail)}
                    className="sm:self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-md transition inline-flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                  >
                    {pushingStates['Development Planning Director'] === 'loading' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {pushingStates['Development Planning Director'] === 'success' ? 'Pushed ✓' : 'Push'}
                  </button>
                </div>

                {/* Custom User Search Push Block */}
                <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-dashed border-indigo-150">
                  <span className="text-[10px] font-black text-indigo-900 block flex items-center gap-1">
                    <Users className="w-3 h-3 text-indigo-500" />
                    Push to any other User from Registry / User Management
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-700 block">Custom Title / Role</span>
                      <input
                        type="text"
                        placeholder="e.g. Risk Manager, Audit Committee"
                        value={customPushTitle}
                        onChange={e => setCustomPushTitle(e.target.value)}
                        className="w-full text-[9px] px-1.5 py-1 border border-slate-200 rounded text-slate-700 outline-none focus:border-indigo-400"
                      />
                    </div>
                    
                    <div className="relative">
                      <span className="text-[9px] font-bold text-slate-700 block">Search Name/Email in Registry</span>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search registry or type email..."
                          value={customPushEmail}
                          onChange={e => setCustomPushEmail(e.target.value)}
                          onFocus={() => setActiveSearchField('CUSTOM')}
                          className="w-full text-[9px] px-1.5 py-1 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-indigo-400"
                        />
                        {fetchingUsers && (
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-600 absolute right-1.5 top-1.5" />
                        )}
                      </div>
                      
                      {activeSearchField === 'CUSTOM' && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                          <div className="p-1 text-[8px] font-bold text-indigo-500 bg-indigo-50/50 sticky top-0 flex justify-between items-center">
                            <span>Registry User Selector</span>
                            <button 
                              type="button" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setActiveSearchField(null); 
                              }} 
                              className="text-gray-400 hover:text-gray-600 text-[10px] font-black"
                            >
                              ✕
                            </button>
                          </div>
                          {getFilteredUsersForField('CUSTOM').length === 0 ? (
                            <div className="p-2 text-center text-gray-400 text-[8px]">No matching users found</div>
                          ) : (
                            getFilteredUsersForField('CUSTOM').map((u, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setCustomPushEmail(u.email);
                                  if (!customPushTitle) {
                                    setCustomPushTitle(u.jobFunction || u.job_function || u.role || 'Officer');
                                  }
                                  setActiveSearchField(null);
                                }}
                                className="w-full text-left p-1.5 hover:bg-indigo-50 transition flex flex-col gap-0.5 text-[9px]"
                              >
                                <span className="font-extrabold text-slate-800">{u.fullName || u.full_name || 'No Name'}</span>
                                <span className="text-[8px] text-gray-500 font-mono">{u.email}</span>
                                {(u.jobFunction || u.job_function || u.department) && (
                                  <span className="text-[7.5px] text-indigo-600 font-medium bg-indigo-50 px-1 py-0.2 rounded self-start">
                                    {u.jobFunction || u.job_function || ''} {u.department ? `(${u.department})` : ''}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    disabled={pushingStates[customPushTitle || 'Custom Officer'] === 'loading' || !customPushEmail}
                    onClick={() => handlePushToProfile(customPushTitle || 'Custom Officer', customPushEmail)}
                    className="mt-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-md transition inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {pushingStates[customPushTitle || 'Custom Officer'] === 'loading' ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Users className="w-3 h-3" />
                    )}
                    {pushingStates[customPushTitle || 'Custom Officer'] === 'success' ? 'Draft Pushed ✓' : 'Push Draft to Registry User'}
                  </button>
                </div>

              </div>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Cover Page config */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Cover Page Parameters
              </h5>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Left Header Column Text</label>
                <input
                  type="text"
                  value={headingCover}
                  onChange={e => setHeadingCover(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Main Cover Text Content</label>
                <textarea
                  value={coverPage}
                  onChange={e => setCoverPage(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* General Chapters Setup */}
            {[
              { id: 'regulatory', title: 'Regulatory Information & Definitions', headingState: headingRegulatoryInfo, headingSet: setHeadingRegulatoryInfo, contentState: regulatoryInfoText, contentSet: setRegulatoryInfoText },
            ].map(chapter => (
              <div key={chapter.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <input 
                    type="text"
                    value={chapter.headingState || chapter.title}
                    onChange={(e) => chapter.headingSet(e.target.value)}
                    placeholder="Enter Section Title..."
                    className="bg-transparent border-none focus:ring-0 w-full font-bold p-0 placeholder:text-slate-300"
                  />
                  <Settings2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </h5>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Edit Section Heading</label>
                  <input
                    type="text"
                    value={chapter.headingState}
                    onChange={e => chapter.headingSet(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Edit Section Text content</label>
                  <textarea
                    value={chapter.contentState}
                    onChange={e => {
                      chapter.contentSet(e.target.value);
                    }}
                    rows={3}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
                  />
                </div>

                {/* Custom Tables for this section */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <LayoutTemplate className="w-3 h-3" /> Section Tables
                    </label>
                    <button
                      type="button"
                      onClick={() => addTableToSection(chapter.id)}
                      className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Table
                    </button>
                  </div>

                  <div className="space-y-4">
                    {customTables.filter(t => t.sectionId === chapter.id).map((table, tIdx) => (
                      <div key={table.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-sm relative group">
                        <button
                          type="button"
                          onClick={() => deleteTable(table.id)}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Table Title</label>
                          <input
                            type="text"
                            value={table.title}
                            onChange={e => updateTable(table.id, { title: e.target.value })}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-bold text-slate-700"
                          />
                        </div>

                        <div className="overflow-x-auto border rounded-md">
                          <table className="w-full text-[10px] border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b">
                                {table.headers.map((header, hIdx) => (
                                  <th key={hIdx} className="p-1.5 border-r last:border-r-0 min-w-24">
                                    <div className="flex flex-col gap-1">
                                      <input
                                        type="text"
                                        value={header}
                                        onChange={e => {
                                          const newHeaders = [...table.headers];
                                          newHeaders[hIdx] = e.target.value;
                                          updateTable(table.id, { headers: newHeaders });
                                        }}
                                        className="w-full text-center bg-transparent font-bold border-none p-0 focus:ring-0"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => deleteTableColumn(table.id, hIdx)}
                                        className="text-[8px] text-rose-400 hover:text-rose-600 uppercase font-black"
                                      >
                                        Drop
                                      </button>
                                    </div>
                                  </th>
                                ))}
                                <th className="p-1 w-8">
                                  <button
                                    type="button"
                                    onClick={() => addTableColumn(table.id)}
                                    className="p-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-600 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="border-b last:border-b-0">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-1.5 border-r last:border-r-0">
                                      <textarea
                                        value={cell}
                                        onChange={e => {
                                          const newRows = [...table.rows];
                                          newRows[rIdx][cIdx] = e.target.value;
                                          updateTable(table.id, { rows: newRows });
                                        }}
                                        rows={1}
                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-[10px] resize-none"
                                      />
                                    </td>
                                  ))}
                                  <td className="p-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => deleteTableRow(table.id, rIdx)}
                                      className="text-rose-400 hover:text-rose-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button
                          type="button"
                          onClick={() => addTableRow(table.id)}
                          className="w-full py-1 bg-slate-50 border border-dashed border-slate-300 rounded text-slate-500 text-[9px] font-bold uppercase hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Add Row
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {chapter.id === 'timetable' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Edit Section Text content (Below Table)</label>
                    <textarea
                      value={timetableTextBelowTable}
                      onChange={e => setTimetableTextBelowTable(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Dynamic Sections */}
            {dynamicSections.map(section => (
              <div key={section.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 relative group">
                <button
                  type="button"
                  onClick={() => removeDynamicSection(section.id)}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer z-10"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <input 
                    type="text"
                    value={section.heading}
                    onChange={(e) => updateDynamicSection(section.id, { heading: e.target.value })}
                    placeholder="Enter Section Title..."
                    className="bg-transparent border-none focus:ring-0 w-full font-bold p-0 placeholder:text-slate-300"
                  />
                  <Settings2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </h5>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Edit Section Heading</label>
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => updateDynamicSection(section.id, { heading: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Edit Section Text content</label>
                  <textarea
                    value={section.content1}
                    onChange={(e) => updateDynamicSection(section.id, { content1: e.target.value })}
                    rows={3}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
                  />
                </div>

                {(section.heading.trim().startsWith('6') || section.heading.toLowerCase().includes('6.')) && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={pullingCompetencies}
                      onClick={handlePullAllCompetencies}
                      className={`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                        pulledCompetencyRows !== null 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                          : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                        Adopt Entire Core Competencies Table
                      </span>
                      {pullingCompetencies ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : pulledCompetencyRows !== null ? (
                        <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                          {pulledCompetencyRows.length} Competencies Loaded
                        </span>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </button>
                  </div>
                )}

                {/* Custom Tables for this dynamic section */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <LayoutTemplate className="w-3 h-3" /> Section Tables
                    </label>
                    <button
                      type="button"
                      onClick={() => addTableToSection(section.id)}
                      className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Table
                    </button>
                  </div>

                  <div className="space-y-4">
                    {customTables.filter(t => t.sectionId === section.id).map((table, tIdx) => (
                      <div key={table.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-sm relative group">
                        <button
                          type="button"
                          onClick={() => deleteTable(table.id)}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Table Title</label>
                          <input
                            type="text"
                            value={table.title}
                            onChange={e => updateTable(table.id, { title: e.target.value })}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-bold text-slate-700"
                          />
                        </div>

                        <div className="overflow-x-auto border rounded-md">
                          <table className="w-full text-[10px] border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b">
                                {table.headers.map((header, hIdx) => (
                                  <th key={hIdx} className="p-1.5 border-r last:border-r-0 min-w-24">
                                    <div className="flex flex-col gap-1">
                                      <input
                                        type="text"
                                        value={header}
                                        onChange={e => {
                                          const newHeaders = [...table.headers];
                                          newHeaders[hIdx] = e.target.value;
                                          updateTable(table.id, { headers: newHeaders });
                                        }}
                                        className="w-full text-center bg-transparent font-bold border-none p-0 focus:ring-0"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => deleteTableColumn(table.id, hIdx)}
                                        className="text-[8px] text-rose-400 hover:text-rose-600 uppercase font-black"
                                      >
                                        Drop
                                      </button>
                                    </div>
                                  </th>
                                ))}
                                <th className="p-1 w-8">
                                  <button
                                    type="button"
                                    onClick={() => addTableColumn(table.id)}
                                    className="p-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-600 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="border-b last:border-b-0">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-1.5 border-r last:border-r-0">
                                      <textarea
                                        value={cell}
                                        onChange={e => {
                                          const newRows = [...table.rows];
                                          newRows[rIdx][cIdx] = e.target.value;
                                          updateTable(table.id, { rows: newRows });
                                        }}
                                        rows={1}
                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-[10px] resize-none"
                                      />
                                    </td>
                                  ))}
                                  <td className="p-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => deleteTableRow(table.id, rIdx)}
                                      className="text-rose-400 hover:text-rose-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button
                          type="button"
                          onClick={() => addTableRow(table.id)}
                          className="w-full py-1 bg-slate-50 border border-dashed border-slate-300 rounded text-slate-500 text-[9px] font-bold uppercase hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Add Row
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Edit Section Text content (Below Table)</label>
                  <textarea
                    value={section.content2}
                    onChange={e => updateDynamicSection(section.id, { content2: e.target.value })}
                    rows={3}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-700"
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addDynamicSection}
              className="w-full py-3 bg-emerald-50 border-2 border-dashed border-emerald-200 text-emerald-700 font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add New Section
            </button>



          </div>
        </div>

        {/* Right pane: Standard Previewer (Separate scrolling) */}
        <div id="templates-right-preview-pane" className="w-1/2 h-full overflow-y-auto bg-slate-200 p-8 flex justify-center relative min-h-0">
          
          {/* Print & Layout Actions Toolbar */}
          <div className="absolute top-4 right-4 z-45 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintPreviewOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-md hover:scale-102 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Print Preview Mode
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-md hover:scale-102 transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              Direct Print
            </button>
          </div>

          <div 
            id="pa-template-printable-sheet"
            className={`w-[620px] bg-white p-12 shadow-2xl rounded-sm ${documentFontFamily} leading-relaxed text-xs relative`}
            style={{ 
              color: textColor, 
              borderColor: borderColor, 
              borderWidth: borderWidth, 
              borderStyle: borderStyle as any,
              textAlign: documentTextAlign
            }}
          >
            
            {/* National Coat of Arms styling top border */}
            <div className="text-center pb-8 border-b-2 border-slate-950 mb-8 space-y-1" style={{ borderColor: borderColor }}>
              <span className={`${muniFontFamily} uppercase tracking-widest font-black block`} style={{ color: muniColor, fontSize: muniFontSize }}>{municipalityName}</span>
              <span className="font-mono block" style={{ color: subHeaderColor, fontSize: subHeaderFontSize }}>{templateSubHeader}</span>
            </div>

            {/* Editable Heading: Cover page title header */}
            <div className="bg-slate-50 border border-dashed border-emerald-350 p-2 text-center text-[10px] text-emerald-800 font-bold font-mono rounded mb-4" style={{ color: headingColor, borderColor: borderColor }}>
              [Editable Heading]: {headingCover}
            </div>

            {/* Cover Page */}
            <div className="flex flex-col items-center justify-center text-center font-bold whitespace-pre-wrap leading-relaxed pb-12 mb-10 text-[13px] font-serif min-h-[400px]" style={{ borderColor: borderColor }}>
              {muniLogo && (
                <img src={muniLogo} alt="Municipality Logo" className="w-24 h-24 object-contain mb-8" />
              )}
              {(coverPage || '').replace('{municipalityName}', municipalityName)}
            </div>

            {/* Visual Page Break for Web Preview */}
            <div className="relative flex py-8 items-center justify-center" style={{ breakAfter: 'page' }}>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: borderColor }}></div>
              <span className="flex-shrink-0 mx-4 text-slate-300 text-[10px] uppercase font-bold tracking-widest">Page Break</span>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: borderColor }}></div>
            </div>

            {/* Table of Contents */}
            <div className="space-y-4" style={{ breakBefore: 'page' }}>
              <h4 className="font-extrabold border-b-2 pb-2 text-sm uppercase tracking-wider text-center" style={{ color: headingColor, borderColor: borderColor }}>
                Table of Contents
              </h4>
              <table className="w-full text-left text-xs border-collapse font-sans mt-4">
                <thead>
                  <tr className="border-b-2 uppercase text-[10px] tracking-wider" style={{ borderColor: borderColor }}>
                    <th className="py-2 w-16">NO</th>
                    <th className="py-2">Name</th>
                    <th className="py-2 w-16 text-right">Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: borderColor }}>
                  {[
                    { no: parseHeading(headingRegulatoryInfo, '-').no, name: parseHeading(headingRegulatoryInfo, '-').name, page: '3' },
                    ...dynamicSections.map((sec, i) => ({ no: parseHeading(sec.heading, String(i + 1)).no, name: parseHeading(sec.heading, String(i + 1)).name, page: String(i + 4) }))
                  ].map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 font-bold">{item.no}</td>
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 text-right">{item.page}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visual Page Break for Web Preview */}
            <div className="relative flex py-8 items-center justify-center" style={{ breakAfter: 'page' }}>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: borderColor }}></div>
              <span className="flex-shrink-0 mx-4 text-slate-300 text-[10px] uppercase font-bold tracking-widest">Page Break</span>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: borderColor }}></div>
            </div>

            {/* Regulatory Information */}
            <div className="space-y-4" style={{ breakBefore: 'page' }}>
              <h4 className="font-extrabold border-b pb-1 text-xs uppercase tracking-wider" style={{ color: headingColor, borderColor: borderColor }}>
                {headingRegulatoryInfo}
              </h4>
              <div className="leading-normal whitespace-pre-wrap text-[11px]">{regulatoryInfoText}</div>
              <RenderCustomTables sectionId="regulatory" />
            </div>

            {/* Visual Page Break for Web Preview */}
            <div className="relative flex py-8 items-center justify-center" style={{ breakAfter: 'page' }}>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: borderColor }}></div>
              <span className="flex-shrink-0 mx-4 text-slate-300 text-[10px] uppercase font-bold tracking-widest">Page Break</span>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: borderColor }}></div>
            </div>

            {/* Rest of Agreement Chapters */}
            <div className="space-y-8" style={{ breakBefore: 'page' }}>
              
              {dynamicSections.map((sec, i) => {
                const isSection6 = sec.heading.trim().startsWith('6') || sec.heading.toLowerCase().includes('6.') || sec.heading.toLowerCase().includes('competenc');
                return (
                <div key={sec.id} className="space-y-3">
                  <h4 className="font-extrabold border-b pb-1 text-xs uppercase tracking-wider" style={{ color: headingColor, borderColor: borderColor }}>
                    {sec.heading}
                  </h4>
                  <div className="leading-normal whitespace-pre-wrap text-[11px] min-h-[1.5em]">
                    {isMandlaMahlangu && (sec.id === "section-1782677903090" || sec.heading.trim().startsWith("15") || sec.heading.toLowerCase().includes("15."))
                      ? (sec.content1 || '').replace(/(thus,?\s*done\s*and\s*signed\s*on\s*this[\s\S]*|thus,?\s*co-signed[\s\S]*)$/gi, '').trim()
                      : sec.content1}
                  </div>
                  <RenderCustomTables sectionId={sec.id} />
                  {sec.content2 && <div className="leading-normal whitespace-pre-wrap text-[11px] min-h-[1.5em] mt-2">{sec.content2}</div>}
                  {isSection6 && (
                    <>
                      <RenderCompetenciesTable />
                      <RenderCfoCompetenciesTable />
                      <RenderPedCompetenciesTable />
                      <RenderCorpCompetenciesTable />
                    </>
                  )}
                </div>
              )})}
            </div>

            {/* Visual Page Break for Web Preview */}
            <div className="relative flex py-8 items-center justify-center" style={{ breakAfter: 'page' }}>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: borderColor }}></div>
              <span className="flex-shrink-0 mx-4 text-slate-300 text-[10px] uppercase font-bold tracking-widest">Page Break</span>
              <div className="flex-grow border-t border-dashed" style={{ borderColor: borderColor }}></div>
            </div>

            {/* 16. Official Signatures section */}
            <div className="space-y-4 pt-6 mt-8 border-t border-slate-200 select-text" style={{ borderColor: borderColor, breakBefore: 'page' }}>
              <h4 className="font-extrabold border-b pb-1 text-xs uppercase tracking-wider" style={{ color: headingColor, borderColor: borderColor }}>
                {headingSignatures}
              </h4>
              <div className="text-[10px] text-slate-500 leading-normal italic flex flex-wrap items-center gap-1">
                <span>Thus co-signed and authorized by the participating municipal administrative representatives on this</span>
                <input
                  type="text"
                  value={sigDay}
                  onChange={e => setSigDay(e.target.value)}
                  className="border-b border-dashed border-slate-400 outline-none text-center bg-transparent font-bold w-10 px-0.5 text-[10px] focus:border-indigo-500"
                  placeholder="day"
                />
                <span>day of</span>
                <input
                  type="text"
                  value={sigMonth}
                  onChange={e => setSigMonth(e.target.value)}
                  className="border-b border-dashed border-slate-400 outline-none text-center bg-transparent font-bold w-28 px-0.5 text-[10px] focus:border-indigo-500"
                  placeholder="month"
                />
                <input
                  type="text"
                  value={sigYear}
                  onChange={e => setSigYear(e.target.value)}
                  className="border-b border-dashed border-slate-400 outline-none text-center bg-transparent font-bold w-14 px-0.5 text-[10px] focus:border-indigo-500"
                  placeholder="year"
                />.
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-[10px] mt-4">
                {/* Employee Box */}
                <div className="border rounded-xl p-3 space-y-2 bg-slate-50/50 flex flex-col justify-between" style={{ borderColor: borderColor }}>
                  <div>
                    <span className="font-bold text-slate-800 block uppercase tracking-wider text-[8px]">
                      {isMandlaMahlangu ? "Municipal Manager (Employee)" : "Officer / Employee Representative"}
                    </span>
                    
                    {/* Slot for Name and Position above signature */}
                    <div className="mt-1.5 mb-2 space-y-1 text-[9px] text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                      <div><span className="font-bold text-slate-500">Name:</span> {employeeName || "________________________"}</div>
                      <div><span className="font-bold text-slate-500">Position:</span> {employeePosition || (isMandlaMahlangu ? "Municipal Manager" : "________________________")}</div>
                    </div>

                    <div className="h-14 border border-dashed rounded flex flex-col items-center justify-center bg-white p-1 relative group overflow-hidden">
                      {employeeSignature ? (
                        <div className="flex flex-col items-center">
                          {employeeSignature.startsWith('http') ? (
                            <img src={employeeSignature} className="max-h-10 max-w-full object-contain" referrerPolicy="no-referrer" alt="Employee Signature" />
                          ) : (
                            <span className="font-serif italic text-sm tracking-wide text-indigo-700">{employeeSignature}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[8px] text-slate-400 font-mono italic">[ Place Signature Here ]</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[9px] text-slate-600 font-medium">
                      Date: <span className="font-mono text-slate-900 font-bold">{employeeDate || "________________________"}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      {employeeSignature && (
                        <button
                          type="button"
                          onClick={() => {
                            setEmployeeSignature(null);
                            setEmployeeName(null);
                            setEmployeePosition(null);
                            setEmployeeDate(null);
                          }}
                          className="text-rose-600 hover:text-rose-700 font-bold text-[8px] cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openSignatureModal('employee')}
                        className="px-2 py-0.5 text-[8.5px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-100 rounded flex items-center gap-0.5 cursor-pointer transition"
                      >
                        <Search className="w-2.5 h-2.5" /> Sign AD
                      </button>
                    </div>
                  </div>
                </div>

                {/* Supervisor Box */}
                <div className="border rounded-xl p-3 space-y-2 bg-slate-50/50 flex flex-col justify-between" style={{ borderColor: borderColor }}>
                  <div>
                    <span className="font-bold text-slate-800 block uppercase tracking-wider text-[8px]">
                      {isMandlaMahlangu ? "Executive Mayor (on behalf of Nkangala District Municipality)" : "Supervisor / Executive Mayor Approval"}
                    </span>
                    
                    {/* Slot for Name and Position above signature */}
                    <div className="mt-1.5 mb-2 space-y-1 text-[9px] text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                      <div><span className="font-bold text-slate-500">Name:</span> {supervisorName || "________________________"}</div>
                      <div><span className="font-bold text-slate-500">Position:</span> {supervisorPosition || (isMandlaMahlangu ? "Executive Mayor" : "________________________")}</div>
                    </div>

                    <div className="h-14 border border-dashed rounded flex flex-col items-center justify-center bg-white p-1 relative group overflow-hidden">
                      {supervisorSignature ? (
                        <div className="flex flex-col items-center">
                          {supervisorSignature.startsWith('http') ? (
                            <img src={supervisorSignature} className="max-h-10 max-w-full object-contain" referrerPolicy="no-referrer" alt="Supervisor Signature" />
                          ) : (
                            <span className="font-serif italic text-sm tracking-wide text-indigo-700">{supervisorSignature}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[8px] text-slate-400 font-mono italic">[ Place Signature Here ]</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[9px] text-slate-600 font-medium">
                      Date: <span className="font-mono text-slate-900 font-bold">{supervisorDate || "________________________"}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      {supervisorSignature && (
                        <button
                          type="button"
                          onClick={() => {
                            setSupervisorSignature(null);
                            setSupervisorName(null);
                            setSupervisorPosition(null);
                            setSupervisorDate(null);
                          }}
                          className="text-rose-600 hover:text-rose-700 font-bold text-[8px] cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openSignatureModal('supervisor')}
                        className="px-2 py-0.5 text-[8.5px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-100 rounded flex items-center gap-0.5 cursor-pointer transition"
                      >
                        <Search className="w-2.5 h-2.5" /> Sign AD
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pulled Annual Performance Planner Grid Table (Grouped by KPA) */}
            {(() => {
              const activeItems = pulledPplanItems || pulledFilteredPplanItems;
              if (activeItems === null) return null;

              // Group items by KPA
              const groups: { [key: string]: any[] } = {};
              activeItems.forEach(item => {
                const kpaName = item.kpa || 'Other / General Key Performance Areas';
                if (!groups[kpaName]) {
                  groups[kpaName] = [];
                }
                groups[kpaName].push(item);
              });

              return (
                <div className="space-y-8 pt-6 mt-8 border-t border-slate-200 select-text" style={{ borderColor: borderColor, breakBefore: 'page' }}>
                  <div className="border-b pb-2 flex items-center justify-between">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: headingColor }}>
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      Adopted Annual Performance Planner Grid (Grouped by KPA)
                    </h4>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black uppercase font-mono">
                      {activeItems.length} KPI Rows Loaded
                    </span>
                  </div>

                  {Object.keys(groups).map((kpaName) => {
                    const kpis = groups[kpaName];
                    return (
                      <div key={kpaName} className="space-y-3">
                        <div className="flex items-center gap-2 bg-slate-100/70 p-2 rounded-lg border" style={{ borderColor: borderColor }}>
                          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-extrabold text-[10px] text-slate-800 uppercase tracking-tight">
                            Key Performance Area (KPA): {kpaName}
                          </span>
                        </div>

                        <div className="overflow-x-auto border rounded-xl" style={{ borderColor: borderColor }}>
                          <table className="w-full text-[9px] border-collapse text-left font-sans">
                            <thead>
                              <tr className="bg-slate-50 uppercase tracking-wider text-[8px] font-black border-b select-none" style={{ borderColor: borderColor, color: headingColor }}>
                                <th className="p-2 border-r text-center w-14" style={{ borderColor: borderColor }}>KPI IDs</th>
                                <th className="p-2 border-r min-w-[150px]" style={{ borderColor: borderColor }}>Key Performance Indicator</th>
                                <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Weight</th>
                                <th className="p-2 border-r text-center w-20" style={{ borderColor: borderColor }}>Baseline</th>
                                <th className="p-2 border-r text-center w-20" style={{ borderColor: borderColor }}>Annual</th>
                                <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Q1</th>
                                <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Q2</th>
                                <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Q3</th>
                                <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Q4</th>
                                <th className="p-2 border-r min-w-[120px] max-w-[200px]" style={{ borderColor: borderColor }}>POE</th>
                                <th className="p-2 text-center bg-emerald-50/10 text-emerald-800 w-24" style={{ borderColor: borderColor }}>Budget</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y font-medium text-slate-700" style={{ borderColor: borderColor }}>
                              {kpis.map((item, idx) => (
                                <tr key={item.id || idx} className="hover:bg-slate-50/85 transition">
                                  <td className="p-2 border-r font-mono font-bold text-slate-800 text-center" style={{ borderColor: borderColor }}>{item.kpiNo || idx + 1}</td>
                                  <td className="p-2 border-r leading-tight text-slate-900" style={{ borderColor: borderColor }}>{item.kpi || ''}</td>
                                  <td className="p-2 border-r text-center font-bold text-slate-800" style={{ borderColor: borderColor }}>{item.weighting || '0'}%</td>
                                  <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.baseline || 'N/A'}</td>
                                  <td className="p-2 border-r text-center font-bold text-slate-900" style={{ borderColor: borderColor }}>{item.annualTarget || 'N/A'}</td>
                                  <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.q1Target || 'N/A'}</td>
                                  <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.q2Target || 'N/A'}</td>
                                  <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.q3Target || 'N/A'}</td>
                                  <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.q4Target || 'N/A'}</td>
                                  <td className="p-2 border-r text-slate-600 leading-normal whitespace-pre-line" style={{ borderColor: borderColor }}>{item.poe || 'N/A'}</td>
                                  <td className="p-2 text-center bg-emerald-50/10 font-bold text-emerald-800" style={{ borderColor: borderColor }}>{item.budget || 'R0'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  <RenderCoreCompetenciesBelowKpa />
                </div>
              );
            })()}

            {/* Custom footer and Page Numbers rendering */}
            <div className="pt-8 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
              <span className="text-left font-bold">{footerText}</span>
              {showPageNumbers && (
                <span className="text-right font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  Page 1 of 1
                </span>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* FULL-SCREEN PRINT PREVIEW MODAL */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 overflow-y-auto flex flex-col font-sans print:bg-white">
          
          {/* Print settings bar - Hidden when actual printing */}
          <div className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl print:hidden">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <LayoutTemplate className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-white text-xs font-black uppercase tracking-wider block">COGTA Statutory Drafting Previewer</span>
                <span className="text-[10px] text-slate-400 font-medium font-mono">{municipalityName} • Multi-Page Printable Draft</span>
              </div>
            </div>

            {/* Print Controls Panel */}
            <div className="flex items-center gap-4 flex-wrap text-[10px]">
              
              {/* Font Size Selector */}
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="font-bold uppercase tracking-wider text-[8px] text-slate-400">Font Size:</span>
                <select
                  value={printFontSize}
                  onChange={e => setPrintFontSize(e.target.value as any)}
                  className="bg-slate-700 border border-slate-600 rounded px-2.5 py-1 text-[10px] font-bold text-white outline-none cursor-pointer"
                >
                  <option value="small">Small (9px)</option>
                  <option value="standard">Standard (11px)</option>
                  <option value="large">Large (13px)</option>
                </select>
              </div>

              {/* Page Margins Selector */}
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="font-bold uppercase tracking-wider text-[8px] text-slate-400">Margins:</span>
                <select
                  value={printMargin}
                  onChange={e => setPrintMargin(e.target.value as any)}
                  className="bg-slate-700 border border-slate-600 rounded px-2.5 py-1 text-[10px] font-bold text-white outline-none cursor-pointer"
                >
                  <option value="compact">Compact (10mm)</option>
                  <option value="standard">Standard (16mm)</option>
                  <option value="wide">Wide (24mm)</option>
                </select>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="font-bold uppercase tracking-wider text-[8px] text-slate-400">Corporate Theme:</span>
                <select
                  value={printTheme}
                  onChange={e => {
                    const val = e.target.value;
                    setPrintTheme(val);
                    if (val === 'emerald') {
                      setHeadingColor('#047857');
                      setTextColor('#334155');
                      setBorderColor('#cbd5e1');
                    } else if (val === 'navy') {
                      setHeadingColor('#1e3a8a');
                      setTextColor('#0f172a');
                      setBorderColor('#94a3b8');
                    } else if (val === 'gold') {
                      setHeadingColor('#854d0e');
                      setTextColor('#1c1917');
                      setBorderColor('#d6d3d1');
                    } else {
                      setHeadingColor('#000000');
                      setTextColor('#000000');
                      setBorderColor('#000000');
                    }
                  }}
                  className="bg-slate-700 border border-slate-600 rounded px-2.5 py-1 text-[10px] font-bold text-white outline-none cursor-pointer"
                >
                  <option value="emerald">Warm Emerald</option>
                  <option value="navy">Midnight Navy Corporate</option>
                  <option value="gold">Presidential Gold</option>
                  <option value="mono">COGTA Statutory Mono</option>
                </select>
              </div>

              <div className="h-6 w-px bg-slate-700" />

              {/* Action Buttons */}
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/20 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 animate-bounce" />
                Print / Save PDF
              </button>

              <button
                type="button"
                onClick={() => setIsPrintPreviewOpen(false)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Exit Preview
              </button>
            </div>
          </div>

          {/* Printable visual environment backdrop */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-8 bg-slate-950/70 select-text print:bg-white print:p-0 print:gap-0">
            
            {/* Embedded style element targeting absolute print formats */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body {
                  background: white !important;
                  color: ${textColor} !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                #pa-templates-workspace,
                #pa-templates-workspace *,
                .fixed,
                .sticky,
                button,
                select,
                header,
                footer {
                  display: none !important;
                }
                #print-ready-pages-container {
                  display: block !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  background: white !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                }
                .a4-print-page {
                  display: block !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  width: 100% !important;
                  min-height: 297mm !important;
                  height: auto !important;
                  box-sizing: border-box !important;
                  margin: 0 !important;
                  padding: ${printMargin === 'compact' ? '12mm' : printMargin === 'wide' ? '28mm' : '20mm'} !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  position: relative !important;
                }
                
                table {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .a4-print-page * {
                  color: inherit !important;
                }
              }
            `}} />

            <div id="print-ready-pages-container" className={`space-y-8 print:space-y-0 print:w-full ${documentFontFamily}`} style={{ textAlign: documentTextAlign }}>
              
              {/* PAGE 1: COVER PAGE */}
              <div 
                className="a4-print-page w-[210mm] h-[297mm] bg-white shadow-2xl rounded p-16 flex flex-col justify-between relative border text-slate-700 print:border-none print:shadow-none print:rounded-none"
                style={{ 
                  color: textColor, 
                  borderColor: borderColor, 
                  borderWidth: borderWidth, 
                  borderStyle: borderStyle as any,
                  padding: printMargin === 'compact' ? '12mm' : printMargin === 'wide' ? '28mm' : '20mm',
                  fontSize: printFontSize === 'small' ? '9px' : printFontSize === 'large' ? '13px' : '11px'
                }}
              >
                {/* National Coat of Arms styling top border */}
                <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1" style={{ borderColor: borderColor }}>
                  <span className={`${muniFontFamily} uppercase tracking-widest font-black block`} style={{ color: muniColor, fontSize: '12px' }}>{municipalityName}</span>
                  <span className="font-mono block" style={{ color: subHeaderColor, fontSize: '10px' }}>{templateSubHeader}</span>
                </div>

                {/* Centered Cover Contents */}
                <div className="my-auto flex flex-col items-center justify-center text-center space-y-8">
                  {muniLogo && (
                    <img src={muniLogo} alt="Municipality Logo" className="w-32 h-32 object-contain" />
                  )}
                  <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: headingColor }}>
                    {headingCover}
                  </h1>
                  <div className="h-1 w-20 bg-rose-800 mx-auto" style={{ backgroundColor: headingColor }} />
                  <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap px-8 font-serif" style={{ color: textColor }}>
                    {(coverPage || '').replace('{municipalityName}', municipalityName)}
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                  <span className="text-left font-bold">{footerText}</span>
                  {showPageNumbers && (
                    <span className="text-right font-black uppercase tracking-wider">
                      Page 1 of 7
                    </span>
                  )}
                </div>
              </div>

              {/* TABLE OF CONTENTS PAGE */}
              <div 
                className="a4-print-page w-[210mm] h-[297mm] bg-white shadow-2xl rounded p-16 flex flex-col justify-between relative border text-slate-700 print:border-none print:shadow-none print:rounded-none"
                style={{ 
                  color: textColor, 
                  borderColor: borderColor, 
                  borderWidth: borderWidth, 
                  borderStyle: borderStyle as any,
                  padding: printMargin === 'compact' ? '12mm' : printMargin === 'wide' ? '28mm' : '20mm',
                  fontSize: printFontSize === 'small' ? '9px' : printFontSize === 'large' ? '13px' : '11px'
                }}
              >
                <div className="space-y-6 overflow-hidden">
                  <div className="text-center pb-4 border-b border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                    <span>{municipalityName} - Performance Agreement Template</span>
                    <span className="font-bold">TABLE OF CONTENTS</span>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-extrabold border-b-2 pb-2 text-sm uppercase tracking-wider text-center" style={{ color: headingColor, borderColor: borderColor }}>
                      Table of Contents
                    </h4>
                    {/* ToC table removed - user will redo */}
                  </div>
                </div>
                
                <div className="border-t pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                  <span className="text-left font-bold">{footerText}</span>
                  {showPageNumbers && (
                    <span className="text-right font-black uppercase tracking-wider">
                      Page 2 of 7
                    </span>
                  )}
                </div>
              </div>

              {/* REGULATORY INFORMATION PAGE */}
              <div 
                className="a4-print-page w-[210mm] h-[297mm] bg-white shadow-2xl rounded p-16 flex flex-col justify-between relative border text-slate-700 print:border-none print:shadow-none print:rounded-none"
                style={{ 
                  color: textColor, 
                  borderColor: borderColor, 
                  borderWidth: borderWidth, 
                  borderStyle: borderStyle as any,
                  padding: printMargin === 'compact' ? '12mm' : printMargin === 'wide' ? '28mm' : '20mm',
                  fontSize: printFontSize === 'small' ? '9px' : printFontSize === 'large' ? '13px' : '11px'
                }}
              >
                <div className="space-y-6 overflow-hidden">
                  <div className="text-center pb-4 border-b border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                    <span>{municipalityName} - Performance Agreement Template</span>
                    <span className="font-bold">SECTION A: PREAMBLE</span>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <h4 className="font-extrabold border-b pb-1 text-xs uppercase tracking-wider" style={{ color: headingColor, borderColor: borderColor }}>
                        {headingRegulatoryInfo}
                      </h4>
                      <div className="leading-normal whitespace-pre-wrap text-[10px]">{regulatoryInfoText}</div>
                      <RenderCustomTables sectionId="regulatory" />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                  <span className="text-left font-bold">{footerText}</span>
                  {showPageNumbers && (
                    <span className="text-right font-black uppercase tracking-wider">
                      Page 3 of 7
                    </span>
                  )}
                </div>
              </div>

              {/* PAGE 3: CHAPTERS 1 TO 4 */}
              <div 
                className="a4-print-page w-[210mm] h-[297mm] bg-white shadow-2xl rounded p-16 flex flex-col justify-between relative border text-slate-700 print:border-none print:shadow-none print:rounded-none"
                style={{ 
                  color: textColor, 
                  borderColor: borderColor, 
                  borderWidth: borderWidth, 
                  borderStyle: borderStyle as any,
                  padding: printMargin === 'compact' ? '12mm' : printMargin === 'wide' ? '28mm' : '20mm',
                  fontSize: printFontSize === 'small' ? '9px' : printFontSize === 'large' ? '13px' : '11px'
                }}
              >
                <div className="space-y-6 overflow-hidden">
                  {/* Header */}
                  <div className="text-center pb-4 border-b border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                    <span>{municipalityName} - Performance Agreement Template</span>
                    <span className="font-bold">SECTION A: GENERAL CHAPTERS</span>
                  </div>

                  {/* Chapters Content */}
                  <div className="space-y-8">
                    {dynamicSections.map(sec => {
                      const isSection6 = sec.heading.trim().startsWith('6') || sec.heading.toLowerCase().includes('6.') || sec.heading.toLowerCase().includes('competenc');
                      return (
                      <div key={sec.id} className="space-y-3">
                        <h4 className="font-extrabold border-b pb-1 text-xs uppercase tracking-wider" style={{ color: headingColor, borderColor: borderColor }}>
                          {sec.heading}
                        </h4>
                        <div className="leading-normal whitespace-pre-wrap text-[10px] min-h-[1.5em]">
                          {isMandlaMahlangu && (sec.id === "section-1782677903090" || sec.heading.trim().startsWith("15") || sec.heading.toLowerCase().includes("15."))
                            ? (sec.content1 || '').replace(/(thus,?\s*done\s*and\s*signed\s*on\s*this[\s\S]*|thus,?\s*co-signed[\s\S]*)$/gi, '').trim()
                            : sec.content1}
                        </div>
                        <RenderCustomTables sectionId={sec.id} />
                        {sec.content2 && <div className="leading-normal whitespace-pre-wrap text-[10px] min-h-[1.5em] mt-2">{sec.content2}</div>}
                        {isSection6 && (
                          <>
                            <RenderCompetenciesTable />
                            <RenderCfoCompetenciesTable />
                            <RenderPedCompetenciesTable />
                            <RenderCorpCompetenciesTable />
                          </>
                        )}
                      </div>
                    )})}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                  <span className="text-left font-bold">{footerText}</span>
                  {showPageNumbers && (
                    <span className="text-right font-black uppercase tracking-wider">
                      Page 3 of 4
                    </span>
                  )}
                </div>
              </div>

              {/* PAGE 4: SIGNATURES & ADOPTED PLAN */}
              <div 
                className="a4-print-page w-[210mm] min-h-[297mm] h-auto bg-white shadow-2xl rounded p-16 flex flex-col justify-between relative border text-slate-700 print:border-none print:shadow-none print:rounded-none"
                style={{ 
                  color: textColor, 
                  borderColor: borderColor, 
                  borderWidth: borderWidth, 
                  borderStyle: borderStyle as any,
                  padding: printMargin === 'compact' ? '12mm' : printMargin === 'wide' ? '28mm' : '20mm',
                  fontSize: printFontSize === 'small' ? '9px' : printFontSize === 'large' ? '13px' : '11px'
                }}
              >
                <div className="space-y-6 overflow-hidden">
                  {/* Header */}
                  <div className="text-center pb-4 border-b border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                    <span>{municipalityName} - Performance Agreement Template</span>
                    <span className="font-bold">SECTION B: SIGNATURES & ADOPTED PLAN</span>
                  </div>

                  {/* Signatures Section */}
                  <div className="space-y-4 pt-4">
                    <h4 className="font-extrabold border-b pb-1 text-xs uppercase tracking-wider" style={{ color: headingColor, borderColor: borderColor }}>
                      {headingSignatures}
                    </h4>
                    <div className="text-[10px] text-slate-500 leading-normal italic flex flex-wrap items-center gap-1">
                      <span>Thus co-signed and authorized by the participating municipal administrative representatives on this</span>
                      <input
                        type="text"
                        value={sigDay}
                        onChange={e => setSigDay(e.target.value)}
                        className="border-b border-dashed border-slate-400 outline-none text-center bg-transparent font-bold w-10 px-0.5 text-[10px] focus:border-indigo-500"
                        placeholder="day"
                      />
                      <span>day of</span>
                      <input
                        type="text"
                        value={sigMonth}
                        onChange={e => setSigMonth(e.target.value)}
                        className="border-b border-dashed border-slate-400 outline-none text-center bg-transparent font-bold w-28 px-0.5 text-[10px] focus:border-indigo-500"
                        placeholder="month"
                      />
                      <input
                        type="text"
                        value={sigYear}
                        onChange={e => setSigYear(e.target.value)}
                        className="border-b border-dashed border-slate-400 outline-none text-center bg-transparent font-bold w-14 px-0.5 text-[10px] focus:border-indigo-500"
                        placeholder="year"
                      />.
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      {/* Employee Box */}
                      <div className="border rounded-xl p-3 space-y-2 bg-slate-50/50 flex flex-col justify-between" style={{ borderColor: borderColor }}>
                        <div>
                          <span className="font-bold text-slate-800 block uppercase tracking-wider text-[8px]">
                            {isMandlaMahlangu ? "Municipal Manager (Employee)" : "Officer / Employee Representative"}
                          </span>
                          
                          {/* Slot for Name and Position above signature */}
                          <div className="mt-1.5 mb-2 space-y-1 text-[9px] text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                            <div><span className="font-bold text-slate-500">Name:</span> {employeeName || "________________________"}</div>
                            <div><span className="font-bold text-slate-500">Position:</span> {employeePosition || (isMandlaMahlangu ? "Municipal Manager" : "________________________")}</div>
                          </div>

                          <div className="h-14 border border-dashed rounded flex flex-col items-center justify-center bg-white p-1 relative group overflow-hidden">
                            {employeeSignature ? (
                              <div className="flex flex-col items-center">
                                {employeeSignature.startsWith('http') ? (
                                  <img src={employeeSignature} className="max-h-10 max-w-full object-contain" referrerPolicy="no-referrer" alt="Employee Signature" />
                                ) : (
                                  <span className="font-serif italic text-sm tracking-wide text-indigo-700">{employeeSignature}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[8px] text-slate-400 font-mono italic">[ Place Signature Here ]</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <p className="text-[9px] text-slate-600 font-medium">
                            Date: <span className="font-mono text-slate-900 font-bold">{employeeDate || "________________________"}</span>
                          </p>
                          <div className="flex items-center gap-1">
                            {employeeSignature && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEmployeeSignature(null);
                                  setEmployeeName(null);
                                  setEmployeePosition(null);
                                  setEmployeeDate(null);
                                }}
                                className="text-rose-600 hover:text-rose-700 font-bold text-[8px] cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openSignatureModal('employee')}
                              className="px-2 py-0.5 text-[8.5px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-100 rounded flex items-center gap-0.5 cursor-pointer transition"
                            >
                              <Search className="w-2.5 h-2.5" /> Sign AD
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Supervisor Box */}
                      <div className="border rounded-xl p-3 space-y-2 bg-slate-50/50 flex flex-col justify-between" style={{ borderColor: borderColor }}>
                        <div>
                          <span className="font-bold text-slate-800 block uppercase tracking-wider text-[8px]">
                            {isMandlaMahlangu ? "Executive Mayor (on behalf of Nkangala District Municipality)" : "Supervisor / Executive Mayor Approval"}
                          </span>
                          
                          {/* Slot for Name and Position above signature */}
                          <div className="mt-1.5 mb-2 space-y-1 text-[9px] text-slate-700 bg-white/60 p-1.5 rounded border border-slate-100">
                            <div><span className="font-bold text-slate-500">Name:</span> {supervisorName || "________________________"}</div>
                            <div><span className="font-bold text-slate-500">Position:</span> {supervisorPosition || (isMandlaMahlangu ? "Executive Mayor" : "________________________")}</div>
                          </div>

                          <div className="h-14 border border-dashed rounded flex flex-col items-center justify-center bg-white p-1 relative group overflow-hidden">
                            {supervisorSignature ? (
                              <div className="flex flex-col items-center">
                                {supervisorSignature.startsWith('http') ? (
                                  <img src={supervisorSignature} className="max-h-10 max-w-full object-contain" referrerPolicy="no-referrer" alt="Supervisor Signature" />
                                ) : (
                                  <span className="font-serif italic text-sm tracking-wide text-indigo-700">{supervisorSignature}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[8px] text-slate-400 font-mono italic">[ Place Signature Here ]</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <p className="text-[9px] text-slate-600 font-medium">
                            Date: <span className="font-mono text-slate-900 font-bold">{supervisorDate || "________________________"}</span>
                          </p>
                          <div className="flex items-center gap-1">
                            {supervisorSignature && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSupervisorSignature(null);
                                  setSupervisorName(null);
                                  setSupervisorPosition(null);
                                  setSupervisorDate(null);
                                }}
                                className="text-rose-600 hover:text-rose-700 font-bold text-[8px] cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openSignatureModal('supervisor')}
                              className="px-2 py-0.5 text-[8.5px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-100 rounded flex items-center gap-0.5 cursor-pointer transition"
                            >
                              <Search className="w-2.5 h-2.5" /> Sign AD
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pulled Annual Performance Planner Grid Table (Grouped by KPA) */}
                  {(() => {
                    const activeItems = pulledPplanItems || pulledFilteredPplanItems;
                    if (activeItems === null) return null;

                    // Group items by KPA
                    const groups: { [key: string]: any[] } = {};
                    activeItems.forEach(item => {
                      const kpaName = item.kpa || 'Other / General Key Performance Areas';
                      if (!groups[kpaName]) {
                        groups[kpaName] = [];
                      }
                      groups[kpaName].push(item);
                    });

                    return (
                      <div className="space-y-6 pt-6 mt-8 border-t border-slate-200" style={{ borderColor: borderColor }}>
                        <div className="border-b pb-1 flex items-center justify-between">
                          <h4 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: headingColor }}>
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Adopted Annual Performance Planner Grid (Grouped by KPA)
                          </h4>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase font-mono">
                            {activeItems.length} KPIs Loaded
                          </span>
                        </div>

                        {Object.keys(groups).map((kpaName) => {
                          const kpis = groups[kpaName];
                          return (
                            <div key={kpaName} className="space-y-2">
                              <div className="flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-lg border text-[9px] font-extrabold text-slate-800 uppercase tracking-tight" style={{ borderColor: borderColor }}>
                                <Layers className="w-3 h-3 text-indigo-600 shrink-0" />
                                Key Performance Area (KPA): {kpaName}
                              </div>

                              <div className="overflow-x-auto border rounded-xl" style={{ borderColor: borderColor }}>
                                <table className="w-full text-[9px] border-collapse text-left font-sans">
                                  <thead>
                                    <tr className="bg-slate-50 uppercase tracking-wider text-[8px] font-black border-b" style={{ borderColor: borderColor, color: headingColor }}>
                                      <th className="p-2 border-r text-center w-14" style={{ borderColor: borderColor }}>KPI IDs</th>
                                      <th className="p-2 border-r min-w-[150px]" style={{ borderColor: borderColor }}>Key Performance Indicator</th>
                                      <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Weight</th>
                                      <th className="p-2 border-r text-center w-20" style={{ borderColor: borderColor }}>Baseline</th>
                                      <th className="p-2 border-r text-center w-20" style={{ borderColor: borderColor }}>Annual</th>
                                      <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Q1</th>
                                      <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Q2</th>
                                      <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Q3</th>
                                      <th className="p-2 border-r text-center w-16" style={{ borderColor: borderColor }}>Q4</th>
                                      <th className="p-2 border-r min-w-[120px] max-w-[200px]" style={{ borderColor: borderColor }}>POE</th>
                                      <th className="p-2 text-center bg-emerald-50/10 text-emerald-800 w-24" style={{ borderColor: borderColor }}>Budget</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y font-medium text-slate-700" style={{ borderColor: borderColor }}>
                                    {kpis.map((item, idx) => (
                                      <tr key={item.id || idx}>
                                        <td className="p-2 border-r font-mono font-bold text-slate-800 text-center" style={{ borderColor: borderColor }}>{item.kpiNo || idx + 1}</td>
                                        <td className="p-2 border-r leading-tight text-slate-900" style={{ borderColor: borderColor }}>{item.kpi || ''}</td>
                                        <td className="p-2 border-r text-center font-bold text-slate-800" style={{ borderColor: borderColor }}>{item.weighting || '0'}%</td>
                                        <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.baseline || 'N/A'}</td>
                                        <td className="p-2 border-r text-center font-bold text-slate-900" style={{ borderColor: borderColor }}>{item.annualTarget || 'N/A'}</td>
                                        <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.q1Target || 'N/A'}</td>
                                        <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.q2Target || 'N/A'}</td>
                                        <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.q3Target || 'N/A'}</td>
                                        <td className="p-2 border-r text-center text-slate-600" style={{ borderColor: borderColor }}>{item.q4Target || 'N/A'}</td>
                                        <td className="p-2 border-r text-slate-600 leading-normal whitespace-pre-line" style={{ borderColor: borderColor }}>{item.poe || 'N/A'}</td>
                                        <td className="p-2 text-center bg-emerald-50/10 font-bold text-emerald-800" style={{ borderColor: borderColor }}>{item.budget || 'R0'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}

                        <RenderCoreCompetenciesBelowKpa />
                      </div>
                    );
                  })()}
                </div>

                {/* Footer */}
                <div className="border-t pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono" style={{ borderColor: borderColor }}>
                  <span className="text-left font-bold">{footerText}</span>
                  {showPageNumbers && (
                    <span className="text-right font-black uppercase tracking-wider">
                      Page 4 of 4
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* AZURE AD SIGNATURE SELECTION MODAL */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Search Azure AD Directory</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Select a user to sign for {signatureModalTarget === 'employee' ? 'Officer / Employee' : 'Municipal Manager / Supervisor'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 bg-white border-b border-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, department or function..."
                  value={adSearchQuery}
                  onChange={(e) => handleSearchAdUsers(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
              {isSearchingAd ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-500 font-medium">Searching Nkangala AD directory...</span>
                </div>
              ) : adSearchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-1.5 p-6">
                  <Users className="w-8 h-8 text-slate-300 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">No matching users found</span>
                  <span className="text-[10px] text-slate-400 max-w-[240px]">We couldn't find any user profiles matching "{adSearchQuery}" in the directory.</span>
                </div>
              ) : (
                <div className="grid gap-2">
                  {adSearchResults.map((user) => (
                    <div
                      key={user.id || user.email}
                      className="p-3 bg-white hover:bg-indigo-50/30 border border-slate-100 hover:border-indigo-100 rounded-xl transition flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="min-w-0 flex-1 flex gap-2.5 items-start">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 mt-0.5 border border-slate-200">
                          {user.fullName ? user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{user.fullName}</h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.jobFunction && (
                              <span className="text-[8px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                                {user.jobFunction}
                              </span>
                            )}
                            {user.department && (
                              <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                {user.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        {user.signatureData ? (
                          <div className="flex items-center gap-1 text-[8px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            <Check className="w-2.5 h-2.5" /> Signature Saved
                          </div>
                        ) : (
                          <div className="text-[8px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            Digital text signature fallback
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSelectUserForSignature(user)}
                          className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg shadow-md hover:shadow-lg active:scale-95 transition cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
