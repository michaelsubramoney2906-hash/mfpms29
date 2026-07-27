import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Upload, Download, FileText, CheckCircle2, ChevronRight, Check, Save, Plus, Trash2, X, Printer, FileDown, FileSpreadsheet, Loader2, Briefcase, GraduationCap, Award, TrendingUp, Sparkles } from 'lucide-react';
import type { User } from '../../types';
import { NKANGALA_LOGO_BASE64 } from './nkangala_logo_base64';

interface PADraftingSuiteTeamProps {
  currentUser: User;
  activeTenantId: string;
  teamTitle: string; // e.g. "Corporate Services Team" or "PMS Team"
  documentIdSuffix: string; // e.g. "corporate_services" or "pms_team"
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
        
        // Match numbers, subpoint lists (e.g. 1.1, a), •, -, etc.)
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
  const isZulunePMS = (currentUser?.email?.toLowerCase() === 'zulune@nkangaladm.gov.za' || currentUser?.email?.toLowerCase() === 'nsibandenp@nkangaladm.gov.za') && documentIdSuffix === 'pms_team';
  const [logoUrl, setLogoUrl] = useState<string>(NKANGALA_LOGO_BASE64);

  // Fetch system customized logo and ensure it is shared across all user accounts
  useEffect(() => {
    const fetchSystemLogo = async () => {
      if (!activeTenantId) return;
      try {
        let foundLogo = '';

        const sharedLogoRes = await fetch(`/api/tenant/${activeTenantId}/logo?t=${Date.now()}`);
        if (sharedLogoRes.ok) {
          const sLogo = await sharedLogoRes.json();
          if (sLogo && sLogo.logoUrl) {
            foundLogo = sLogo.logoUrl;
          }
        }

        if (!foundLogo) {
          const coverRes = await fetch(`/api/tenant/${activeTenantId}/coverpages`);
          if (coverRes.ok) {
            const coverList = await coverRes.json();
            for (const item of coverList) {
              if (item.config && item.config.selectedLogo) {
                const logo = item.config.selectedLogo;
                if (typeof logo === 'string' && logo.length > 50 && (logo.startsWith('data:image') || logo.startsWith('http') || logo.startsWith('/api/'))) {
                  foundLogo = logo;
                  break;
                }
              }
            }
          }
        }

        if (!foundLogo) {
          const imgRes = await fetch(`/api/tenant/${activeTenantId}/coverpages/images`);
          if (imgRes.ok) {
            const imgList = await imgRes.json();
            if (Array.isArray(imgList) && imgList.length > 0) {
              const logoImg = imgList.find((img: any) => img.name && img.name.toLowerCase().includes('logo')) || imgList[0];
              if (logoImg && logoImg.url) {
                foundLogo = logoImg.url;
              }
            }
          }
        }

        if (foundLogo) {
          setLogoUrl(foundLogo);
          (window as any).__systemCustomLogo = foundLogo;
        }
      } catch (e) {
        console.error("Failed to fetch system logo automatically:", e);
      }
    };
    fetchSystemLogo();
  }, [activeTenantId]);

  const [coverPage, setCoverPage] = useState(`PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n${currentUser?.fullName || '[Employee Name]'}\n\n${teamTitle.toUpperCase()} TEAM\n\nFOR THE FINANCIAL YEAR: 2025/2026`);
  const [purpose, setPurpose] = useState(`The purpose of this agreement is to specify performance expectations and standards for members of the ${teamTitle}, aligning operational deliverables with municipal strategic goals.`);
  const [validity, setValidity] = useState('This agreement will be valid for the 2025/2026 financial year or until superseded by a revised team agreement.');
  const [reporting, setReporting] = useState(`Members of the ${teamTitle} will report directly through their respective line managers to the Municipal Manager and Executive Leadership.`);
  const [framework, setFramework] = useState('4.1 The Employee agrees to participate in the performance assessment and development system of the Municipality.\n\n4.2 The Employee participates in the performance assessment framework as follows:');
  const [frameworkBelowKpa, setFrameworkBelowKpa] = useState('4.3 The Employee\'s assessment will further be based on the following Job Specific Competencies Matrix. Each competency has been weighted as indicated below:');
  const [frameworkBelowJsc, setFrameworkBelowJsc] = useState('4.4 The personal development plan (PDP) will address any developmental needs identified during the competency assessment process.');
  const [conditions, setConditions] = useState('Conditions of performance...');
  const [kpaText, setKpaText] = useState('The list of tasks/ duties and responsibilities contained in this document is not necessarily exhaustive...');
  const [assessmentText, setAssessmentText] = useState('The performance assessment of the Employee will be based on the following rating scale:\n\nrating scale tabled as follows:');
  const [feedback, setFeedback] = useState('Feedback will be provided...');
  const [timetable, setTimetable] = useState('Timetable for review...');
  const [poorPerformance, setPoorPerformance] = useState('Management of poor performance outcomes...');
  const [dispute, setDispute] = useState('Dispute resolution mechanism...');
  const [amendment, setAmendment] = useState('Amendment of agreement...');
  const [evaluation, setEvaluation] = useState('Evaluation criteria...');
  const [signatures, setSignatures] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  
  const [userSignatures, setUserSignatures] = useState({
    employee: '',
    manager: '',
    hod: '',
    pmu: '',
    witness: 'Yena Khuboni'
  });

  const [annexureA, setAnnexureA] = useState(true);
  const [annexureB, setAnnexureB] = useState(true);
  const [annexureC, setAnnexureC] = useState('Disclosure of interest form...\n\nOther Interests:\nI hereby certify that the above information is complete and correct to the best of my knowledge.');

  const [includeJSC, setIncludeJSC] = useState(true);

  const [isPdpAdopted, setIsPdpAdopted] = useState<boolean>(false);
  const [isJscAdopted, setIsJscAdopted] = useState<boolean>(false);
  const [isPPlanAdopted, setIsPPlanAdopted] = useState<boolean>(false);
  const [teamRosterNotes, setTeamRosterNotes] = useState<string>('Operational notes and descriptions regarding the roster assignments above.');
  const [zuluneKpaText, setZuluneKpaText] = useState<string>('Additional performance observations and strategic alignment details below the KPA Matrix.');
  const [zulunePPlanAboveText, setZulunePPlanAboveText] = useState<string>('Performance objectives and key targets to be achieved during the cycle.');
  const [zulunePPlanBelowText, setZulunePPlanBelowText] = useState<string>('Performance notes and operational remarks for the core plan.');
  const [zulunePdpAboveText, setZulunePdpAboveText] = useState<string>('Development plan and identified skill enhancement needs.');
  const [zulunePdpBelowText, setZulunePdpBelowText] = useState<string>('Personal development feedback and mentor guidelines.');

  // Custom additional section text boxes and optional tables state
  const [sectionExtras, setSectionExtras] = useState<Record<string, { text: string; table: { enabled: boolean; headers: string[]; rows: string[][] } }>>({
    purpose: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    validity: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    reporting: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    framework: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    kpaMatrix: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    jscMatrix: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    kpaText: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    evaluating: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    feedback: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    timetable: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    poorPerformance: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    dispute: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    amendment: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    evaluation: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
    signatures: { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } },
  });

  // Dynamic Table Headers & Rows state
  const [headers, setHeaders] = useState<string[]>(defaultHeaders);
  const [tableRows, setTableRows] = useState<string[][]>(defaultRows);

  // Editable review term rows for Section 8 Timetable
  const [reviewRows, setReviewRows] = useState<any[]>([
    { term: '1st Quarter', desc: 'July - September', type: 'Informal', activities: 'Review', date: 'October', responsible: 'Manager' },
    { term: '2nd Quarter', desc: 'October - December', type: 'Formal', activities: 'Review', date: 'January', responsible: 'Manager' },
    { term: '3rd Quarter', desc: 'January - March', type: 'Informal', activities: 'Review', date: 'April', responsible: 'Manager' },
    { term: '4th Quarter', desc: 'April - June', type: 'Formal', activities: 'Annual Assessment', date: 'August', responsible: 'Manager' }
  ]);

  // States for dynamic custom KPA table synced from KPA module
  const [dynTableHeaders, setDynTableHeaders] = useState<string[]>(['KPA No', 'National KPA', 'Functional Area KPA', 'Weighting']);
  const [dynTableRows, setDynTableRows] = useState<string[][]>([
    ['1', 'Good Governance & Institutional Transformation', 'Clean Ward Committees & Public Participation', '25%'],
    ['2', 'Municipal Financial viability and management', 'AG Unqualified Audit & mSCOA Integration', '35%'],
    ['3', 'Basic Service Delivery', 'Infrastructure Operations & Core Grid Stability', '40%']
  ]);

  const [realPlanItems, setRealPlanItems] = useState<any[]>([]);
  const [realPdpItems, setRealPdpItems] = useState<any[]>([]);
  const [realJobCompetencies, setRealJobCompetencies] = useState<any[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);

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
      console.error("Failed to fetch tenant users for signatures:", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setCoverPage(`PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n${currentUser.fullName || '[Employee Name]'}\n\n${teamTitle.toUpperCase()} TEAM\n\nFOR THE FINANCIAL YEAR: 2025/2026`);
      setUserSignatures({
        employee: currentUser.fullName || '',
        manager: currentUser.manager || '',
        hod: 'Mr. Jacob Chief Financial Officer',
        pmu: 'Corporate Performance Unit',
        witness: 'Yena Khuboni'
      });
    }
  }, [currentUser, teamTitle]);

  const fetchAllAgreementSources = async () => {
    if (!activeTenantId || !currentUser?.email) return;
    setLoadingRealData(true);
    try {
      const planRes = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${currentUser.email}&t=${Date.now()}`);
      if (planRes.ok) {
        const planJson = await planRes.json();
        if (planJson && Array.isArray(planJson.items)) {
          setRealPlanItems(planJson.items);
        }
      }

      const pdpRes = await fetch(`/api/tenant/${activeTenantId}/pdp?userId=${currentUser.email}&t=${Date.now()}`);
      if (pdpRes.ok) {
        const pdpJson = await pdpRes.json();
        if (pdpJson && Array.isArray(pdpJson.items)) {
          setRealPdpItems(pdpJson.items);
        }
      }

      const jscRes = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${currentUser.email}&t=${Date.now()}`);
      if (jscRes.ok) {
        const jscJson = await jscRes.json();
        if (jscJson && Array.isArray(jscJson.competencies)) {
          setRealJobCompetencies(jscJson.competencies);
        }
      }

      const kpaRes = await fetch(`/api/tenant/${activeTenantId}/kpas?userId=${currentUser?.email || 'default'}&t=${Date.now()}`);
      if (kpaRes.ok) {
        const kpaJson = await kpaRes.json();
        if (kpaJson && kpaJson.customKpaTable) {
          if (kpaJson.customKpaTable.headers) {
            setDynTableHeaders(kpaJson.customKpaTable.headers);
          }
          if (kpaJson.customKpaTable.rows) {
            setDynTableRows(kpaJson.customKpaTable.rows);
          }
        }
      }
    } catch (err) {
      console.error("Failed to automatically retrieve agreement details:", err);
    } finally {
      setLoadingRealData(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [templateSaveStatus, setTemplateSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

  const fetchTemplatesList = async () => {
    if (!activeTenantId) return;
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pa-templates`);
      if (res.ok) {
        const data = await res.json();
        setAvailableTemplates(data.templates || []);
      }
    } catch (e) {
      console.error("Error fetching templates config:", e);
    }
  };

  const getSafeUserSignatures = (val: any) => {
    if (!val) {
      return { employee: '', manager: '', hod: '', pmu: '', witness: 'Yena Khuboni' };
    }
    if (typeof val === 'string') {
      return { employee: val, manager: '', hod: '', pmu: '', witness: 'Yena Khuboni' };
    }
    return {
      employee: val.employee || '',
      manager: val.manager || '',
      hod: val.hod || '',
      pmu: val.pmu || '',
      witness: val.witness || 'Yena Khuboni'
    };
  };

  const saveToProfile = async () => {
    if (!activeTenantId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const stateObj = {
        logoUrl,
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
        zuluneKpaText,
        zulunePPlanAboveText,
        zulunePPlanBelowText,
        zulunePdpAboveText,
        zulunePdpBelowText
      };

      const docId = `draft_doc_${documentIdSuffix}_${activeTenantId}`;
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
        throw new Error("Failed to save draft document");
      }
    } catch (err) {
      console.error("Save Draft Error:", err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const [pushing, setPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const pushDraftToCounterpart = async () => {
    if (!activeTenantId || !currentUser?.email) return;
    setPushing(true);
    setPushStatus('idle');
    try {
      const isZulune = currentUser.email.toLowerCase() === 'zulune@nkangaladm.gov.za';
      const targetUser = isZulune ? 'nsibandenp@nkangaladm.gov.za' : 'zulune@nkangaladm.gov.za';

      const stateObj = {
        logoUrl,
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
        userSignatures: {
          employee: 'Noluthando Zulu',
          manager: 'Nsibande NP',
          hod: 'Mr. Jacob Chief Financial Officer',
          pmu: 'Corporate Performance Unit',
          witness: 'Yena Khuboni'
        },
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
        zuluneKpaText,
        zulunePPlanAboveText,
        zulunePPlanBelowText,
        zulunePdpAboveText,
        zulunePdpBelowText
      };

      const docId = `draft_doc_${documentIdSuffix}_${activeTenantId}`;
      const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${targetUser}&documentId=${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: stateObj,
          htmlDocumentId: docId
        })
      });

      if (res.ok) {
        setPushStatus('success');
        setTimeout(() => setPushStatus('idle'), 4000);
      } else {
        throw new Error("Failed to push draft document");
      }
    } catch (err) {
      console.error("Push draft error:", err);
      setPushStatus('error');
    } finally {
      setPushing(false);
    }
  };

  const fetchSavedDraft = async () => {
    if (!activeTenantId || !currentUser?.email) return;
    try {
      const docId = `draft_doc_${documentIdSuffix}_${activeTenantId}`;
      const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser.email}&documentId=${docId}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.html) {
          let state: any = null;
          if (typeof data.html === 'string') {
            try {
              state = JSON.parse(data.html);
            } catch (e) {}
          } else if (typeof data.html === 'object') {
            state = data.html;
          }
          
          if (state && typeof state === 'object') {
            const systemLogo = (window as any).__systemCustomLogo;
            if (systemLogo) {
              setLogoUrl(systemLogo);
            } else {
              setLogoUrl(state.logoUrl || NKANGALA_LOGO_BASE64);
            }
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
            if (state.userSignatures !== undefined) setUserSignatures(getSafeUserSignatures(state.userSignatures));
            if (state.annexureA !== undefined) setAnnexureA(state.annexureA);
            if (state.annexureB !== undefined) setAnnexureB(state.annexureB);
            if (state.annexureC !== undefined) setAnnexureC(state.annexureC);
            if (state.includeJSC !== undefined) setIncludeJSC(state.includeJSC);
            if (Array.isArray(state.reviewRows)) setReviewRows(state.reviewRows);
            if (state.isPdpAdopted !== undefined) setIsPdpAdopted(state.isPdpAdopted);
            if (state.isJscAdopted !== undefined) setIsJscAdopted(state.isJscAdopted);
            if (state.isPPlanAdopted !== undefined) setIsPPlanAdopted(state.isPPlanAdopted);
            if (state.teamRosterNotes !== undefined) setTeamRosterNotes(state.teamRosterNotes);
            if (state.zuluneKpaText !== undefined) setZuluneKpaText(state.zuluneKpaText);
            if (state.zulunePPlanAboveText !== undefined) setZulunePPlanAboveText(state.zulunePPlanAboveText);
            if (state.zulunePPlanBelowText !== undefined) setZulunePPlanBelowText(state.zulunePPlanBelowText);
            if (state.zulunePdpAboveText !== undefined) setZulunePdpAboveText(state.zulunePdpAboveText);
            if (state.zulunePdpBelowText !== undefined) setZulunePdpBelowText(state.zulunePdpBelowText);
            if (Array.isArray(state.dynTableHeaders) && state.dynTableHeaders.length > 0) setDynTableHeaders(state.dynTableHeaders);
            if (Array.isArray(state.dynTableRows) && state.dynTableRows.length > 0) setDynTableRows(state.dynTableRows);
            if (state.sectionExtras !== undefined) {
              setSectionExtras(prev => ({
                ...prev,
                ...state.sectionExtras
              }));
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load saved draft document:", e);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const element = document.getElementById('pa-printable-area');
      if (!element) {
        alert('Error: Printable content container not found.');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const pageHeightPixels = (imgWidth * pdfHeight) / pdfWidth;
      let remainingHeight = imgHeight;
      let position = 0;
      
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.min(imgHeight, pageHeightPixels);
      const ctx = pageCanvas.getContext('2d');
      
      let isFirstPage = true;
      while (remainingHeight > 0) {
        const chunkHeight = Math.min(remainingHeight, pageHeightPixels);
        pageCanvas.height = chunkHeight;
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, imgWidth, chunkHeight);
          ctx.drawImage(
            canvas,
            0, position,
            imgWidth, chunkHeight,
            0, 0,
            imgWidth, chunkHeight
          );
        }
        
        const chunkImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        
        if (!isFirstPage) {
          pdf.addPage();
        }
        
        const pageRenderHeight = (chunkHeight * pdfWidth) / imgWidth;
        pdf.addImage(chunkImgData, 'JPEG', 0, 0, pdfWidth, pageRenderHeight);
        
        remainingHeight -= chunkHeight;
        position += chunkHeight;
        isFirstPage = false;
      }
      
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        if (i === 1) continue;
        pdf.setPage(i);
        
        pdf.setDrawColor(200, 205, 210);
        pdf.setLineWidth(0.2);
        pdf.line(10, pdfHeight - 15, pdfWidth - 10, pdfHeight - 15);
        
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 100);
        pdf.text(`NKANGALA DISTRICT MUNICIPALITY - ${teamTitle.toUpperCase()} PA`, 10, pdfHeight - 10);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(110, 110, 110);
        pdf.text(`Page ${i} of ${pageCount}`, pdfWidth - 35, pdfHeight - 10);
      }
      
      const cleanName = (currentUser?.fullName || 'Draft').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Performance_Agreement_${teamTitle.replace(/\s+/g, '_')}_${cleanName}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF document.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportWord = () => {
    setIsExportingWord(true);
    try {
      const documentBodyObj = document.getElementById("pa-printable-area");
      if (!documentBodyObj) {
        alert("Error: Preview container not found. Please wait until the page has loaded completely.");
        return;
      }

      const documentHtml = documentBodyObj.innerHTML;
      const fullHtml = `<!DOCTYPE html>
  <html>
  <head>
  <meta charset="utf-8">
  <style>
    @page Section1 {
      size: 210mm 297mm; /* A4 Portrait */
      margin: 1cm;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'Arial', sans-serif;
      color: #111827;
      margin: 0;
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    th {
      border: 1px solid #111827 !important;
      background-color: #f3f4f6 !important;
      font-weight: bold;
      padding: 6px;
      text-align: left;
      font-size: 11px;
      color: #000;
    }
    td {
      border: 1px solid #111827 !important;
      padding: 6px;
      font-size: 11px;
      vertical-align: top;
      color: #000;
    }
    .text-justify {
      text-align: justify;
    }
    .portrait-section {
      page-break-after: always;
    }
    .font-bold {
      font-weight: bold;
    }
  </style>
  </head>
  <body>
    <div class="Section1">
      ${documentHtml}
    </div>
  </body>
  </html>`;

      const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Performance_Agreement_${teamTitle.replace(/\s+/g, '_')}_${currentUser?.fullName?.replace(/\s+/g, '_') || 'Draft'}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Word:', error);
      alert('Failed to export Word document.');
    } finally {
      setIsExportingWord(false);
    }
  };

  useEffect(() => {
    fetchAllAgreementSources();
    fetchSavedDraft();
    fetchTenantUsers();
    fetchTemplatesList();
  }, [activeTenantId, currentUser, documentIdSuffix]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setLogoUrl(base64);
        (window as any).__systemCustomLogo = base64;

        try {
          await fetch(`/api/tenant/${activeTenantId}/logo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoUrl: base64 })
          });
        } catch (uploadErr) {
          console.error("Instant shared tenant logo upload failed:", uploadErr);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Helper functions to manage dynamic columns & rows
  const handleAddColumn = () => {
    const newColName = prompt("Enter new column name:", `Column ${headers.length + 1}`);
    if (!newColName) return;
    setHeaders([...headers, newColName]);
    setTableRows(tableRows.map(row => [...row, '']));
  };

  const handleDeleteColumn = (colIdx: number) => {
    if (headers.length <= 1) {
      alert("At least one column must remain in the team table.");
      return;
    }
    if (!confirm(`Are you sure you want to delete column "${headers[colIdx]}"?`)) return;
    setHeaders(headers.filter((_, idx) => idx !== colIdx));
    setTableRows(tableRows.map(row => row.filter((_, idx) => idx !== colIdx)));
  };

  const handleHeaderChange = (colIdx: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[colIdx] = val;
    setHeaders(newHeaders);
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = [...tableRows];
    const row = [...(newRows[rowIdx] || [])];
    row[colIdx] = val;
    newRows[rowIdx] = row;
    setTableRows(newRows);
  };

  const handleAddRow = () => {
    const nextNo = (tableRows.length + 1).toString();
    const newRow = headers.map((_, idx) => idx === 0 ? nextNo : '');
    setTableRows([...tableRows, newRow]);
  };

  const handleDeleteRow = (rowIdx: number) => {
    setTableRows(tableRows.filter((_, idx) => idx !== rowIdx));
  };

  const handleAutoNumber = () => {
    setTableRows(tableRows.map((row, idx) => {
      const updated = [...row];
      updated[0] = (idx + 1).toString();
      return updated;
    }));
  };

  // Helper functions to manage dynamic columns & rows for KPAs Matrix (dynTable)
  const handleDynAddColumn = () => {
    const newColName = prompt("Enter new KPA Matrix column name:", `Column ${dynTableHeaders.length + 1}`);
    if (!newColName) return;
    setDynTableHeaders([...dynTableHeaders, newColName]);
    setDynTableRows(dynTableRows.map(row => [...row, '']));
  };

  const handleDynDeleteColumn = (colIdx: number) => {
    if (dynTableHeaders.length <= 1) {
      alert("At least one column must remain in the KPAs Matrix table.");
      return;
    }
    if (!confirm(`Are you sure you want to delete column "${dynTableHeaders[colIdx]}"?`)) return;
    setDynTableHeaders(dynTableHeaders.filter((_, idx) => idx !== colIdx));
    setDynTableRows(dynTableRows.map(row => row.filter((_, idx) => idx !== colIdx)));
  };

  const handleDynHeaderChange = (colIdx: number, val: string) => {
    const newHeaders = [...dynTableHeaders];
    newHeaders[colIdx] = val;
    setDynTableHeaders(newHeaders);
  };

  const handleDynCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = [...dynTableRows];
    const row = [...(newRows[rowIdx] || [])];
    row[colIdx] = val;
    newRows[rowIdx] = row;
    setDynTableRows(newRows);
  };

  const handleDynAddRow = () => {
    const nextNo = (dynTableRows.length + 1).toString();
    const newRow = dynTableHeaders.map((_, idx) => idx === 0 ? nextNo : '');
    setDynTableRows([...dynTableRows, newRow]);
  };

  const handleDynDeleteRow = (rowIdx: number) => {
    setDynTableRows(dynTableRows.filter((_, idx) => idx !== rowIdx));
  };

  const handleDynAutoNumber = () => {
    setDynTableRows(dynTableRows.map((row, idx) => {
      const updated = [...row];
      updated[0] = (idx + 1).toString();
      return updated;
    }));
  };

  const kpaRows = [
    { no: '1', kpa: 'Good Governance & Institutional Transformation', weight: '25' },
    { no: '2', kpa: 'Financial Viability', weight: '10' },
    { no: '3', kpa: 'Organisational Performance Management', weight: '30' },
    { no: '4', kpa: 'Individual Performance Management', weight: '10' },
    { no: '5', kpa: 'Performance Monitoring and Evaluation', weight: '25' }
  ];

  const bonusRows = [
    { level: 5, description: 'Outstanding performance', score: '130 - 167', ratios: '10% - 14%' },
    { level: 4, description: 'Performance significantly above expectations', score: '115 - 129', ratios: '5% - 9%' },
    { level: 3, description: 'Fully effective', score: '100 - 114', ratios: '0%' },
    { level: 2, description: 'Not fully effective', score: '50 - 99', ratios: '0%' },
    { level: 1, description: 'Unacceptable performance', score: '0 - 49', ratios: '0%' }
  ];

  const renderSectionExtraEditor = (sectionKey: string, title: string) => {
    const extra = sectionExtras[sectionKey] || { text: '', table: { enabled: false, headers: ['Action Item', 'Target Date', 'Status'], rows: [['', '', '']] } };
    
    const updateText = (val: string) => {
      setSectionExtras(prev => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          text: val
        }
      }));
    };

    const toggleTable = (enabled: boolean) => {
      setSectionExtras(prev => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          table: {
            ...prev[sectionKey].table,
            enabled
          }
        }
      }));
    };

    const addRow = () => {
      setSectionExtras(prev => {
        const table = prev[sectionKey].table;
        const newRows = [...table.rows, new Array(table.headers.length).fill('')];
        return {
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            table: {
              ...table,
              rows: newRows
            }
          }
        };
      });
    };

    const removeRow = (rIdx: number) => {
      setSectionExtras(prev => {
        const table = prev[sectionKey].table;
        if (table.rows.length <= 1) return prev; // Keep at least 1 row
        const newRows = table.rows.filter((_, idx) => idx !== rIdx);
        return {
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            table: {
              ...table,
              rows: newRows
            }
          }
        };
      });
    };

    const addCol = () => {
      setSectionExtras(prev => {
        const table = prev[sectionKey].table;
        const newHeaders = [...table.headers, `Heading ${table.headers.length + 1}`];
        const newRows = table.rows.map(row => [...row, '']);
        return {
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            table: {
              ...table,
              headers: newHeaders,
              rows: newRows
            }
          }
        };
      });
    };

    const removeCol = (cIdx: number) => {
      setSectionExtras(prev => {
        const table = prev[sectionKey].table;
        if (table.headers.length <= 1) return prev; // Keep at least 1 column
        const newHeaders = table.headers.filter((_, idx) => idx !== cIdx);
        const newRows = table.rows.map(row => row.filter((_, idx) => idx !== cIdx));
        return {
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            table: {
              ...table,
              headers: newHeaders,
              rows: newRows
            }
          }
        };
      });
    };

    const updateHeader = (cIdx: number, val: string) => {
      setSectionExtras(prev => {
        const table = prev[sectionKey].table;
        const newHeaders = [...table.headers];
        newHeaders[cIdx] = val;
        return {
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            table: {
              ...table,
              headers: newHeaders
            }
          }
        };
      });
    };

    const updateCell = (rIdx: number, cIdx: number, val: string) => {
      setSectionExtras(prev => {
        const table = prev[sectionKey].table;
        const newRows = table.rows.map((row, idx) => {
          if (idx !== rIdx) return row;
          const newRow = [...row];
          newRow[cIdx] = val;
          return newRow;
        });
        return {
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            table: {
              ...table,
              rows: newRows
            }
          }
        };
      });
    };

    return (
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
        <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">Additional {title} Content</span>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={extra.table.enabled} 
                onChange={(e) => toggleTable(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
              />
              Add Custom Table
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 block font-bold">Custom Text Box below heading/sub-heading</label>
            <textarea 
              value={extra.text} 
              onChange={e => updateText(e.target.value)} 
              rows={2} 
              placeholder={`Enter optional custom text block for ${title}...`}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none shadow-sm transition" 
            />
          </div>

          {extra.table.enabled && (
            <div className="space-y-2 pt-2.5 border-t border-slate-200/60">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-600 font-extrabold uppercase">Custom Table Editor</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addCol}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-700 rounded font-semibold transition flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5 text-slate-500" /> +Col
                  </button>
                  <button
                    type="button"
                    onClick={addRow}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded font-semibold transition flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5" /> +Row
                  </button>
                </div>
              </div>

              {/* Table Column Header Editors */}
              <div className="space-y-1 bg-white p-2 rounded border border-slate-200 shadow-inner">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Column Headings</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {extra.table.headers.map((h, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-1 border border-slate-200 rounded bg-slate-50 p-1">
                      <input
                        type="text"
                        value={h}
                        onChange={e => updateHeader(cIdx, e.target.value)}
                        className="w-full text-[10px] bg-transparent outline-none font-bold text-slate-700"
                        placeholder={`Col ${cIdx + 1}`}
                      />
                      {extra.table.headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCol(cIdx)}
                          className="text-slate-400 hover:text-red-500 p-0.5"
                          title="Delete Column"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Row Cell Editors */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {extra.table.rows.map((row, rIdx) => (
                  <div key={rIdx} className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1.5 relative group/row">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 font-bold">Row {rIdx + 1}</span>
                      {extra.table.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(rIdx)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded transition"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(extra.table.headers.length, 3)}, minmax(0, 1fr))` }}>
                      {extra.table.headers.map((h, cIdx) => (
                        <div key={cIdx} className="space-y-0.5">
                          <label className="text-[8px] text-slate-500 font-semibold block truncate">{h}</label>
                          <input
                            type="text"
                            value={row[cIdx] || ''}
                            onChange={e => updateCell(rIdx, cIdx, e.target.value)}
                            className="w-full text-[10px] p-1 bg-white border border-slate-200 rounded outline-none focus:border-emerald-500"
                            placeholder={`Enter ${h}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionExtraPreview = (sectionKey: string) => {
    const extra = sectionExtras[sectionKey];
    if (!extra) return null;

    return (
      <div className="mt-4 space-y-4 font-sans print:space-y-3">
        {extra.text && (
          <div className="text-justify font-serif text-[11px] print:text-[10px] leading-relaxed text-slate-800">
            {renderFormattedContent(extra.text)}
          </div>
        )}
        {extra.table && extra.table.enabled && extra.table.headers.length > 0 && (
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[11px] print:text-[10px] font-sans">
              <thead>
                <tr className="bg-slate-100 border border-black">
                  {extra.table.headers.map((h, i) => (
                    <th key={i} className="border border-black p-2 font-bold text-left bg-slate-100/90">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {extra.table.rows.map((r, i) => (
                  <tr key={i} className="border border-black">
                    {extra.table.headers.map((_, j) => (
                      <td key={j} className="border border-black p-2 font-medium">{r[j] || ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden text-xs">
      {/* Sidebar Editor */}
      <div className="w-1/3 min-w-[380px] max-w-[480px] bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-emerald-400" />
              {teamTitle} Drafting Suite
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Customize cover page, team roster, sections & signatures</p>
          </div>
          
          <div className="flex items-center gap-2">
            {isZulunePMS && (
              <button
                onClick={pushDraftToCounterpart}
                disabled={pushing}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                title={currentUser?.email?.toLowerCase() === 'zulune@nkangaladm.gov.za' ? "Push agreement to Nsibande NP" : "Push agreement to Noluthando Zulu"}
              >
                {pushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {currentUser?.email?.toLowerCase() === 'zulune@nkangaladm.gov.za' ? "Push to Nsibande NP" : "Push to Noluthando Zulu"}
              </button>
            )}
            <button
              onClick={saveToProfile}
              disabled={saving}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Save changes to database draft profile"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Draft
            </button>
          </div>
        </div>

        {saveStatus === 'success' && (
          <div className="p-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2 px-4 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {teamTitle} draft document saved securely to database!
          </div>
        )}

        {pushStatus === 'success' && (
          <div className="p-2 bg-blue-50 border-b border-blue-200 text-blue-800 text-[11px] font-medium flex items-center gap-2 px-4 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            Performance agreement successfully shared & synchronized with {currentUser?.email?.toLowerCase() === 'zulune@nkangaladm.gov.za' ? 'Nsibande NP' : 'Noluthando Zulu'}!
          </div>
        )}

        {pushStatus === 'error' && (
          <div className="p-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-2 px-4 animate-in fade-in">
            <X className="w-4 h-4 text-rose-600 shrink-0" />
            Failed to push document. Please try again.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Logo Upload Section */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
              <span>Official Municipal Logo</span>
              <span className="text-[10px] text-slate-400 font-normal">Shared Across App</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border border-slate-200 rounded-lg flex items-center justify-center p-1 bg-slate-50 shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Municipality Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400">No logo</span>
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition">
                  <Upload className="w-3.5 h-3.5" />
                  Change Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-[10px] text-slate-400">Upload high-res PNG or JPG logo</p>
              </div>
            </div>
          </div>

          {/* PMS Core Module Adoption Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                PMS Core Module Adoption
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5">Adopt entire modules' tables and contents directly into this agreement</p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Adopt PDP Button */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    Personal Development Plan (PDP)
                  </span>
                  {isPdpAdopted ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Adopted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded-full">
                      Not Adopted
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {realPdpItems.length > 0 
                    ? `Found ${realPdpItems.length} active PDP training items for this user.` 
                    : 'No items found in PDP module.'}
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsPdpAdopted(!isPdpAdopted);
                      await fetchAllAgreementSources();
                    }}
                    className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      isPdpAdopted 
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    {isPdpAdopted ? 'Remove Adopted PDP' : 'Adopt Entire PDP Table'}
                  </button>
                </div>
              </div>

              {/* Adopt JSC Button */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" />
                    Job Specific Competencies (JSC)
                  </span>
                  {isJscAdopted ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Adopted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded-full">
                      Not Adopted
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {realJobCompetencies.length > 0 
                    ? `Found ${realJobCompetencies.length} job-specific competencies.` 
                    : 'No competencies found in JSC module.'}
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsJscAdopted(!isJscAdopted);
                      await fetchAllAgreementSources();
                    }}
                    className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      isJscAdopted 
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    {isJscAdopted ? 'Remove Adopted JSC' : 'Adopt Entire JSC Table'}
                  </button>
                </div>
              </div>

              {/* Adopt Performance Plan Button */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Core Performance Plan (KPIs)
                  </span>
                  {isPPlanAdopted ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Adopted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded-full">
                      Not Adopted
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {realPlanItems.length > 0 
                    ? `Found ${realPlanItems.length} Key Performance Indicators (KPIs).` 
                    : 'No items found in Performance Plan module.'}
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsPPlanAdopted(!isPPlanAdopted);
                      await fetchAllAgreementSources();
                    }}
                    className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                      isPPlanAdopted 
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    {isPPlanAdopted ? 'Remove Adopted Plan' : 'Adopt Performance Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Page Editor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">Cover Page Text</label>
            <textarea
              value={coverPage}
              onChange={e => setCoverPage(e.target.value)}
              rows={5}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-mono"
            />
          </div>

          {/* TEAM MEMBERS TABLE EDITOR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {teamTitle} Roster
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoNumber}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition"
                  title="Auto-sequence numbers in column 1"
                >
                  Auto #
                </button>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-semibold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Col
                </button>
              </div>
            </div>

            {/* Column Headers Config */}
            <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Table Column Headers
              </label>
              <div className="space-y-1.5">
                {headers.map((h, colIdx) => (
                  <div key={colIdx} className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 w-5">C{colIdx + 1}</span>
                    <input
                      type="text"
                      value={h}
                      onChange={e => handleHeaderChange(colIdx, e.target.value)}
                      className="flex-1 text-[11px] p-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    />
                    {headers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(colIdx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        title="Delete column"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Table Rows Config */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 border border-slate-100 rounded p-2 bg-slate-50">
              {tableRows.map((row, rIdx) => (
                <div key={rIdx} className="border border-slate-200 p-2.5 rounded bg-white space-y-2 relative group hover:border-slate-300 transition">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-100 pb-1">
                    <span>Row {rIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rIdx)}
                      className="text-slate-400 hover:text-red-600 p-0.5 rounded transition flex items-center gap-1 text-[10px]"
                      title="Delete this team member row"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {headers.map((h, colIdx) => (
                      <div key={colIdx}>
                        <label className="text-[9px] text-slate-400 block font-semibold truncate">{h}</label>
                        <input
                          type="text"
                          value={row[colIdx] || ''}
                          onChange={e => handleCellChange(rIdx, colIdx, e.target.value)}
                          className="w-full text-[11px] p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500"
                          placeholder={`Enter ${h}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddRow}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              Add {teamTitle} Member / Row
            </button>

            <div className="border-t border-slate-100 pt-3 mt-1.5 space-y-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Roster Description & Notes
              </label>
              <textarea
                value={teamRosterNotes}
                onChange={e => setTeamRosterNotes(e.target.value)}
                placeholder="Enter custom roster descriptions or notes to display directly under the table..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-sans"
              />
            </div>
          </div>

          {/* KPAs MATRIX TABLE EDITOR */}
          {(documentIdSuffix !== 'pms_team' || isZulunePMS) && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  {isZulunePMS ? 'KPA Section Editor' : 'KPAs Matrix Table Editor'}
                </label>
                {!isZulunePMS && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDynAutoNumber}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition"
                      title="Auto-sequence numbers in column 1"
                    >
                      Auto #
                    </button>
                    <button
                      type="button"
                      onClick={handleDynAddColumn}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-semibold transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Col
                    </button>
                  </div>
                )}
              </div>

              {!isZulunePMS ? (
                <>
                  {/* Column Headers Config */}
                  <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Matrix Column Headers
                    </label>
                    <div className="space-y-1.5">
                      {dynTableHeaders.map((h, colIdx) => (
                        <div key={colIdx} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 w-5">C{colIdx + 1}</span>
                          <input
                            type="text"
                            value={h}
                            onChange={e => handleDynHeaderChange(colIdx, e.target.value)}
                            className="flex-1 text-[11px] p-1.5 border border-slate-300 rounded bg-white font-semibold text-slate-800 outline-none focus:border-emerald-500"
                          />
                          {dynTableHeaders.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDynDeleteColumn(colIdx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                              title="Delete column"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table Rows Config */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1 border border-slate-100 rounded p-2 bg-slate-50">
                    {dynTableRows.map((row, rIdx) => (
                      <div key={rIdx} className="border border-slate-200 p-2.5 rounded bg-white space-y-2 relative group hover:border-slate-300 transition">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-100 pb-1">
                          <span>Row {rIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleDynDeleteRow(rIdx)}
                            className="text-slate-400 hover:text-red-600 p-0.5 rounded transition flex items-center gap-1 text-[10px]"
                            title="Delete this KPA row"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {dynTableHeaders.map((h, colIdx) => (
                            <div key={colIdx}>
                              <label className="text-[9px] text-slate-400 block font-semibold truncate">{h}</label>
                              <input
                                type="text"
                                value={row[colIdx] || ''}
                                onChange={e => handleDynCellChange(rIdx, colIdx, e.target.value)}
                                className="w-full text-[11px] p-1.5 border border-slate-300 rounded outline-none focus:border-emerald-500"
                                placeholder={`Enter ${h}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleDynAddRow}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    Add KPA Row
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    KPA Section Custom Remarks / Notes (Zulune)
                  </label>
                  <textarea
                    value={zuluneKpaText}
                    onChange={e => setZuluneKpaText(e.target.value)}
                    placeholder="Enter additional remarks or notes to display directly under section 4.1..."
                    rows={8}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-sans"
                  />
                </div>
              )}
            </div>
          )}

          {/* Section Editors */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">1. Purpose</label>
            <textarea value={purpose} onChange={e => setPurpose(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('purpose', '1. Purpose')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">2. Validity of Agreement</label>
            <textarea value={validity} onChange={e => setValidity(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('validity', '2. Validity of Agreement')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">3. Reporting Requirements</label>
            <textarea value={reporting} onChange={e => setReporting(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('reporting', '3. Reporting Requirements')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">4. Performance Assessment Framework</label>
            <textarea value={framework} onChange={e => setFramework(e.target.value)} rows={4} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('framework', '4. Performance Assessment Framework')}
            {(documentIdSuffix !== 'pms_team' || isZulunePMS) && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Sub-Headings:</span>
                {!isZulunePMS && renderSectionExtraEditor('kpaMatrix', '4.1 Key Performance Areas (KPAs) Matrix')}
                {(documentIdSuffix !== 'pms_team' || isZulunePMS) && renderSectionExtraEditor('jscMatrix', '4.2 Job Specific Competencies Matrix')}
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">5. Key Performance Areas (KPAs)</label>
            <textarea value={kpaText} onChange={e => setKpaText(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('kpaText', '5. Key Performance Areas (KPAs)')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">6. Evaluating Performance</label>
            <textarea value={assessmentText} onChange={e => setAssessmentText(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('evaluating', '6. Evaluating Performance')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">7. Feedback</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('feedback', '7. Feedback')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">8. Timetable for Review</label>
            <textarea value={timetable} onChange={e => setTimetable(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('timetable', '8. Timetable for Review')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">9. Management of Poor Performance</label>
            <textarea value={poorPerformance} onChange={e => setPoorPerformance(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('poorPerformance', '9. Management of Poor Performance')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">10. Dispute Resolution</label>
            <textarea value={dispute} onChange={e => setDispute(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('dispute', '10. Dispute Resolution')}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase">11. General / Amendments</label>
            <textarea value={amendment} onChange={e => setAmendment(e.target.value)} rows={3} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
            {renderSectionExtraEditor('amendment', '11. General / Amendments')}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Sub-Headings:</span>
              {isZulunePMS ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">12. Evaluation</label>
                    <textarea
                      value={evaluation}
                      onChange={e => setEvaluation(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none"
                    />
                    {renderSectionExtraEditor('evaluation', '12. Evaluation')}
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">13. Signatures of Parties to the Agreement</label>
                    {renderSectionExtraEditor('signatures', '13. Signatures of Parties to the Agreement')}
                  </div>
                  <div className="border-t border-slate-200 pt-3 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">14. Appended Core Performance Plan (Text Above)</label>
                      <textarea
                        value={zulunePPlanAboveText}
                        onChange={e => setZulunePPlanAboveText(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-sans"
                        placeholder="Optional text to display above the performance plan table..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">14. Appended Core Performance Plan (Text Below)</label>
                      <textarea
                        value={zulunePPlanBelowText}
                        onChange={e => setZulunePPlanBelowText(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-sans"
                        placeholder="Optional text to display below the performance plan table..."
                      />
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-3 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">15. Appended Personal Development Plan (Text Above)</label>
                      <textarea
                        value={zulunePdpAboveText}
                        onChange={e => setZulunePdpAboveText(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-sans"
                        placeholder="Optional text to display above the PDP table..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">15. Appended Personal Development Plan (Text Below)</label>
                      <textarea
                        value={zulunePdpBelowText}
                        onChange={e => setZulunePdpBelowText(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none font-sans"
                        placeholder="Optional text to display below the PDP table..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                renderSectionExtraEditor('signatures', '12. Signatures & Affirmation')
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Printable Document Preview Panel */}
      <div className="flex-1 flex flex-col h-full bg-slate-200 overflow-hidden">
        {/* Document Action Toolbar */}
        <div className="p-3 bg-white border-b border-slate-300 flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-xs px-2.5 py-1 bg-slate-100 rounded border border-slate-200">
              {teamTitle} Performance Agreement Document
            </span>
            {loadingRealData && (
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Syncing items...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleExportWord}
              disabled={isExportingWord}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isExportingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Word (.doc)
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isExportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export PDF
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div
            id="pa-printable-area"
            className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-12 shadow-2xl rounded-sm font-serif relative"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Logo Header */}
            {logoUrl && (
              <div className="flex justify-center mb-8">
                <img src={logoUrl} alt="Logo" className="max-h-24 object-contain" />
              </div>
            )}

            {/* Cover Page */}
            <div className="portrait-section text-center font-bold whitespace-pre-wrap leading-relaxed border-b-2 border-black pb-12 mb-12">
              {coverPage}
            </div>

            {/* Team Roster Table */}
            <div className="portrait-section page-break-before pt-6 pb-6">
              <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">{teamTitle.toUpperCase()} MEMBERS</span>
              </h3>
              <table className="w-full border-collapse border border-black my-4 text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-100 border border-black">
                    {headers.map((h, idx) => (
                      <th key={idx} className="border border-black p-2 font-bold text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, idx) => (
                    <tr key={idx} className="border border-black">
                      {headers.map((_, colIdx) => (
                        <td key={colIdx} className={`border border-black p-2 ${colIdx === 0 ? 'font-bold bg-slate-50/80 w-[10%]' : 'font-medium'}`}>
                          {row[colIdx] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {teamRosterNotes && (
                <div className="text-[11px] text-slate-700 font-sans mt-2.5 text-justify bg-slate-50/50 p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                  {renderFormattedContent(teamRosterNotes)}
                </div>
              )}
            </div>

            {/* Document Sections */}
            <div className="space-y-8 text-[13px] leading-relaxed">
              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">1. Purpose</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(purpose)}</div>
                {renderSectionExtraPreview('purpose')}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">2. Validity of Agreement</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(validity)}</div>
                {renderSectionExtraPreview('validity')}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">3. Reporting Requirements</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(reporting)}</div>
                {renderSectionExtraPreview('reporting')}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">4. Performance Assessment Framework</span>
                </h3>
                <div className="text-justify mb-4">{renderFormattedContent(framework)}</div>
                {renderSectionExtraPreview('framework')}

                {/* KPA Dynamic Summary Table */}
                {(documentIdSuffix !== 'pms_team' || isZulunePMS) && (
                  <div className="my-4">
                    {!isZulunePMS && (
                      <h4 className="font-bold text-xs text-slate-800 mb-2 font-sans">4.1 Key Performance Areas (KPAs) Matrix</h4>
                    )}
                    {!isZulunePMS && (
                      <table className="w-full border-collapse border border-black text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-100 border border-black">
                            {dynTableHeaders.map((h, i) => (
                              <th key={i} className="border border-black p-2 font-bold text-left">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dynTableRows.map((r, i) => (
                            <tr key={i} className="border border-black">
                              {r.map((c, j) => (
                                <td key={j} className="border border-black p-2">{c}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {renderSectionExtraPreview('kpaMatrix')}
                    
                    {isZulunePMS && (
                      <>
                        <div className="my-4 font-sans print:hidden">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Additional KPA Notes (Editable directly):</p>
                          <textarea
                            value={zuluneKpaText}
                            onChange={e => setZuluneKpaText(e.target.value)}
                            rows={4}
                            className="w-full text-xs p-2.5 border border-emerald-300 rounded-lg focus:border-emerald-500 outline-none font-sans bg-emerald-50/30"
                            placeholder="Type custom notes under section 4.1..."
                          />
                        </div>
                        <div className="my-4 hidden print:block font-sans text-[11px] print:text-[10px] text-justify text-slate-800">
                          {renderFormattedContent(zuluneKpaText)}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!isZulunePMS && (
                  <div className="text-justify my-4">{renderFormattedContent(frameworkBelowKpa)}</div>
                )}

                {/* Job Specific Competencies Matrix */}
                {(includeJSC && (documentIdSuffix !== 'pms_team' || isZulunePMS)) && (
                  <div className="my-4 font-sans">
                     <h4 className="font-bold text-xs text-slate-800 mb-2 font-sans flex items-center justify-between">
                       <span>4.2 Job Specific Competencies Matrix</span>
                       {isJscAdopted && <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Adopted From Module</span>}
                     </h4>
                     {isJscAdopted ? (
                       <table className="w-full border-collapse border border-black text-[10px] font-sans">
                         <thead>
                           <tr className="bg-slate-100 border border-black">
                             <th className="border border-black p-2 font-bold text-left w-[5%]">No.</th>
                             <th className="border border-black p-2 font-bold text-left w-[25%]">Competency Code & Name</th>
                             <th className="border border-black p-2 font-bold text-left w-[45%]">Core Definition & Actionable Scope</th>
                             <th className="border border-black p-2 font-bold text-left w-[15%]">Required Level</th>
                             <th className="border border-black p-2 font-bold text-center w-[10%]">Weighting</th>
                           </tr>
                         </thead>
                         <tbody>
                           {realJobCompetencies.length > 0 ? (
                             realJobCompetencies.map((comp, idx) => (
                               <tr key={idx} className="border border-black">
                                 <td className="border border-black p-2 font-bold text-center">{idx + 1}</td>
                                 <td className="border border-black p-2 font-semibold text-slate-900">
                                   {comp.jscNo ? `[${comp.jscNo}] ` : ''}{comp.competency || comp.name || 'Competency Item'}
                                 </td>
                                 <td className="border border-black p-2 text-justify">
                                   <div className="font-medium text-slate-800">{comp.definition?.mainText || comp.description || 'Core service competency'}</div>
                                   {comp.definition?.subsections && comp.definition.subsections.length > 0 && (
                                     <div className="mt-1.5 space-y-1 text-[9px] text-slate-600 border-l-2 border-slate-200 pl-1.5">
                                       {comp.definition.subsections.map((sub: any, subIdx: number) => (
                                         <div key={subIdx}>
                                           <span className="font-bold">{sub.heading}:</span> {sub.paragraphs?.join('; ')}
                                         </div>
                                       ))}
                                     </div>
                                   )}
                                 </td>
                                 <td className="border border-black p-2 font-medium text-slate-700">
                                   {comp.level || 'Level 3'}
                                 </td>
                                 <td className="border border-black p-2 font-bold text-emerald-800 text-center">
                                   {comp.weight || comp.weighting || '25'}%
                                 </td>
                               </tr>
                             ))
                           ) : (
                             <tr className="border border-black">
                               <td colSpan={5} className="border border-black p-4 text-center text-slate-500 italic">
                                 No active Job Specific Competencies found in database.
                               </td>
                               </tr>
                           )}
                         </tbody>
                       </table>
                     ) : (
                       <table className="w-full border-collapse border border-black text-[11px] font-sans">
                         <thead>
                           <tr className="bg-slate-100 border border-black">
                             <th className="border border-black p-2 font-bold text-left w-[10%]">No.</th>
                             <th className="border border-black p-2 font-bold text-left w-[60%]">Competency Name</th>
                             <th className="border border-black p-2 font-bold text-left w-[30%]">Weighting</th>
                           </tr>
                         </thead>
                         <tbody>
                           {realJobCompetencies.length > 0 ? (
                             realJobCompetencies.map((comp, idx) => (
                               <tr key={idx} className="border border-black">
                                 <td className="border border-black p-2 font-bold">{idx + 1}</td>
                                 <td className="border border-black p-2 font-medium">{comp.name || comp.competency || 'Competency Item'}</td>
                                 <td className="border border-black p-2 font-semibold text-emerald-800">{comp.weight || comp.weighting || '10'}%</td>
                               </tr>
                             ))
                           ) : (
                             <>
                               <tr className="border border-black">
                                 <td className="border border-black p-2 font-bold">1</td>
                                 <td className="border border-black p-2">Core Leadership & Governance Excellence</td>
                                 <td className="border border-black p-2 font-semibold text-emerald-800">20%</td>
                               </tr>
                               <tr className="border border-black">
                                 <td className="border border-black p-2 font-bold">2</td>
                                 <td className="border border-black p-2">Financial & Risk Management Compliance</td>
                                 <td className="border border-black p-2 font-semibold text-emerald-800">20%</td>
                               </tr>
                               <tr className="border border-black">
                                 <td className="border border-black p-2 font-bold">3</td>
                                 <td className="border border-black p-2">Service Delivery & Project Execution</td>
                                 <td className="border border-black p-2 font-semibold text-emerald-800">30%</td>
                               </tr>
                               <tr className="border border-black">
                                 <td className="border border-black p-2 font-bold">4</td>
                                 <td className="border border-black p-2">People & Team Management</td>
                                 <td className="border border-black p-2 font-semibold text-emerald-800">30%</td>
                               </tr>
                             </>
                           )}
                         </tbody>
                       </table>
                     )}
                     {renderSectionExtraPreview('jscMatrix')}
                   </div>
                 )}

                {documentIdSuffix !== 'pms_team' && (
                  <div className="text-justify">{renderFormattedContent(frameworkBelowJsc)}</div>
                )}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">5. Key Performance Areas (KPAs)</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(kpaText)}</div>
                {renderSectionExtraPreview('kpaText')}

                {isPPlanAdopted && (
                  <div className="mt-6 border-t border-slate-300 pt-6">
                    <h4 className="font-bold text-xs text-slate-800 mb-2 font-sans flex items-center justify-between">
                      <span>Adopted Core Performance Plan (KPIs)</span>
                      <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Synchronized</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mb-4 font-sans text-justify leading-relaxed">
                      The detailed Key Performance Indicators (KPIs), baseline values, weights, annual targets, and quarterly breakdowns for the employee are adopted below from the Performance Plan Module:
                    </p>
                    <div className="overflow-x-auto w-full border border-black">
                      <table className="w-full border-collapse text-[9px] font-sans min-w-[1000px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-black text-slate-800">
                            <th className="border-r border-black p-2 font-bold text-center w-[6%]">KPI No.</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[20%]">Key Performance Indicators</th>
                            <th className="border-r border-black p-2 font-bold text-center w-[6%]">Weight</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">Baseline</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[10%]">Annual Target</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">1st Quarter</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">2nd Quarter</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">3rd Quarter</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">4th Quarter</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[10%]">POE</th>
                            <th className="p-2 font-bold text-left w-[8%]">Total Budget</th>
                          </tr>
                        </thead>
                        <tbody>
                          {realPlanItems.length > 0 ? (
                            realPlanItems.map((item, idx) => (
                              <tr key={idx} className="border-b border-black last:border-b-0">
                                <td className="border-r border-black p-2 font-bold text-center bg-slate-50">{item.kpiNo || (idx + 1)}</td>
                                <td className="border-r border-black p-2 font-medium text-slate-900">{item.kpi || 'N/A'}</td>
                                <td className="border-r border-black p-2 font-bold text-center text-emerald-800">{item.weighting || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.baseline || 'N/A'}</td>
                                <td className="border-r border-black p-2 font-semibold text-indigo-950">{item.annualTarget || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.q1Target || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.q2Target || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.q3Target || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.q4Target || 'N/A'}</td>
                                <td className="border-r border-black p-2 font-medium text-slate-600">{item.annualRequiredPoe || item.q1RequiredPoe || 'N/A'}</td>
                                <td className="p-2 font-bold text-emerald-950">{item.budget || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={11} className="p-4 text-center text-slate-500 italic">
                                No performance plan records found for this user.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">6. Evaluating Performance</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(assessmentText)}</div>
                {renderSectionExtraPreview('evaluating')}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">7. Feedback</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(feedback)}</div>
                {renderSectionExtraPreview('feedback')}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">8. Timetable for Review</span>
                </h3>
                <div className="text-justify mb-4">{renderFormattedContent(timetable)}</div>

                {!isZulunePMS && (
                  <table className="w-full border-collapse border border-black my-4 text-[11px] font-sans">
                    <thead>
                      <tr className="bg-slate-100 border border-black">
                        <th className="border border-black p-2 font-bold text-left">Term</th>
                        <th className="border border-black p-2 font-bold text-left">Period</th>
                        <th className="border border-black p-2 font-bold text-left">Type</th>
                        <th className="border border-black p-2 font-bold text-left">Date</th>
                        <th className="border border-black p-2 font-bold text-left">Responsible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewRows.map((r, i) => (
                        <tr key={i} className="border border-black">
                          <td className="border border-black p-2 font-bold">{r.term}</td>
                          <td className="border border-black p-2">{r.desc}</td>
                          <td className="border border-black p-2 font-medium">{r.type}</td>
                          <td className="border border-black p-2">{r.date}</td>
                          <td className="border border-black p-2">{r.responsible}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {renderSectionExtraPreview('timetable')}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">9. Management of Poor Performance</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(poorPerformance)}</div>
                {renderSectionExtraPreview('poorPerformance')}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">10. Dispute Resolution</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(dispute)}</div>
                {renderSectionExtraPreview('dispute')}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">11. General / Amendments</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(amendment)}</div>
                {renderSectionExtraPreview('amendment')}
              </div>

              {isPdpAdopted && (
                <div className="portrait-section page-break-before pt-6 font-sans">
                  <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                    <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">Annexure B: Personal Development Plan (PDP)</span>
                  </h3>
                  <p className="text-[11px] text-slate-700 mb-4 font-sans text-justify leading-relaxed">
                    The following Personal Development Plan (PDP) has been adopted directly from the employee's active development profile. It constitutes an integral part of this agreement for identifying and addressing targeted developmental actions and competence enhancements:
                  </p>
                  <table className="w-full border-collapse border border-black my-4 text-[10px] font-sans">
                    <thead>
                      <tr className="bg-slate-100 border border-black text-slate-800">
                        <th className="border border-black p-2 font-bold text-center w-[5%]">No.</th>
                        <th className="border border-black p-2 font-bold text-left w-[20%]">Skills Gap</th>
                        <th className="border border-black p-2 font-bold text-left w-[20%]">Expected Outcomes</th>
                        <th className="border border-black p-2 font-bold text-left w-[20%]">Suggested Training Interventions</th>
                        <th className="border border-black p-2 font-bold text-left w-[15%]">Mode of Delivery</th>
                        <th className="border border-black p-2 font-bold text-left w-[10%]">Timeframe</th>
                        <th className="border border-black p-2 font-bold text-left w-[10%]">Support Person</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realPdpItems.length > 0 ? (
                        realPdpItems.map((item, idx) => (
                          <tr key={idx} className="border border-black">
                            <td className="border border-black p-2 font-bold text-center bg-slate-50">{idx + 1}</td>
                            <td className="border border-black p-2 font-semibold text-slate-900">{item.skillsGap || 'N/A'}</td>
                            <td className="border border-black p-2 text-slate-700">{item.outcomes || 'N/A'}</td>
                            <td className="border border-black p-2 font-medium text-emerald-900">{item.suggestedTraining || 'N/A'}</td>
                            <td className="border border-black p-2 text-slate-700">{item.modeOfDelivery || 'N/A'}</td>
                            <td className="border border-black p-2 text-slate-700">{item.timeFrame || 'N/A'}</td>
                            <td className="border border-black p-2 font-semibold text-slate-800">{item.supportPerson || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border border-black">
                          <td colSpan={7} className="border border-black p-4 text-center text-slate-500 italic">
                            No active items found in the Personal Development Plan module.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {isZulunePMS ? (
                <>
                  <div className="portrait-section page-break-before pt-6">
                    <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                      <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">12. Evaluation</span>
                    </h3>
                    <div className="text-justify font-sans text-[13px] leading-relaxed text-slate-800">
                      {renderFormattedContent(evaluation)}
                    </div>
                    {renderSectionExtraPreview('evaluation')}
                  </div>

                  <div className="portrait-section page-break-before pt-6">
                    <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                      <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">13. Signatures of Parties to the Agreement</span>
                    </h3>
                    {renderSectionExtraPreview('signatures')}
                    
                    <div className="flex flex-col gap-6 my-8 font-sans max-w-lg mx-auto">
                      {currentUser?.email?.toLowerCase() === 'nsibandenp@nkangaladm.gov.za' ? (
                        <>
                          {/* Nsibande NP Signature first */}
                          <div className="border border-emerald-300 p-4 rounded-lg bg-emerald-50/20 space-y-4 shadow-sm">
                            <p className="font-extrabold text-xs uppercase text-emerald-800 tracking-wider">Signed on behalf of Municipality (Manager):</p>
                            <div className="h-12 border-b border-black flex items-end font-serif italic text-sm text-emerald-950 font-bold">
                              {userSignatures.manager || 'Nsibande NP'}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Date: ________________</span>
                              <span>Place: Nkangala</span>
                            </div>
                          </div>

                          {/* Noluthando Zulu Signature second */}
                          <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 space-y-4 shadow-sm">
                            <p className="font-bold text-xs uppercase text-slate-700 tracking-wide">Signed by Employee:</p>
                            <div className="h-12 border-b border-black flex items-end font-serif italic text-sm text-slate-800 font-medium">
                              {userSignatures.employee || 'Noluthando Zulu'}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Date: ________________</span>
                              <span>Place: Nkangala</span>
                            </div>
                          </div>

                          {/* Yena Khuboni Witness Signature */}
                          <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 space-y-4 shadow-sm">
                            <p className="font-bold text-xs uppercase text-slate-700 tracking-wide">Witnessed by (PMS Coordinator):</p>
                            <div className="h-12 border-b border-black flex items-end font-serif italic text-sm text-indigo-950 font-semibold">
                              {userSignatures.witness || 'Yena Khuboni'}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Date: ________________</span>
                              <span>Place: Nkangala</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Noluthando Zulu Signature first */}
                          <div className="border border-emerald-300 p-4 rounded-lg bg-emerald-50/20 space-y-4 shadow-sm">
                            <p className="font-extrabold text-xs uppercase text-emerald-800 tracking-wider">Signed by Employee:</p>
                            <div className="h-12 border-b border-black flex items-end font-serif italic text-sm text-emerald-950 font-bold">
                              {userSignatures.employee || 'Noluthando Zulu'}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Date: ________________</span>
                              <span>Place: Nkangala</span>
                            </div>
                          </div>

                          {/* Nsibande NP Signature second */}
                          <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 space-y-4 shadow-sm">
                            <p className="font-bold text-xs uppercase text-slate-700 tracking-wide">Signed on behalf of Municipality (Manager):</p>
                            <div className="h-12 border-b border-black flex items-end font-serif italic text-sm text-slate-800 font-medium">
                              {userSignatures.manager || 'Nsibande NP'}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Date: ________________</span>
                              <span>Place: Nkangala</span>
                            </div>
                          </div>

                          {/* Yena Khuboni Witness Signature */}
                          <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 space-y-4 shadow-sm">
                            <p className="font-bold text-xs uppercase text-slate-700 tracking-wide">Witnessed by (PMS Coordinator):</p>
                            <div className="h-12 border-b border-black flex items-end font-serif italic text-sm text-indigo-950 font-semibold">
                              {userSignatures.witness || 'Yena Khuboni'}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Date: ________________</span>
                              <span>Place: Nkangala</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 14. Appended Core Performance Plan */}
                  <div className="portrait-section page-break-before pt-6">
                    <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                      <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">14. Appended Core Performance Plan (KPIs)</span>
                    </h3>
                    {zulunePPlanAboveText && (
                      <div className="text-justify font-sans text-[12px] leading-relaxed text-slate-800 mb-4 whitespace-pre-wrap">
                        {renderFormattedContent(zulunePPlanAboveText)}
                      </div>
                    )}

                    <div className="overflow-x-auto w-full border border-black my-4">
                      <table className="w-full border-collapse text-[9px] font-sans min-w-[1000px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-black text-slate-800">
                            <th className="border-r border-black p-2 font-bold text-center w-[6%]">KPI No.</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[20%]">Key Performance Indicators</th>
                            <th className="border-r border-black p-2 font-bold text-center w-[6%]">Weight</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">Baseline</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[10%]">Annual Target</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">1st Quarter</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">2nd Quarter</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">3rd Quarter</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[8%]">4th Quarter</th>
                            <th className="border-r border-black p-2 font-bold text-left w-[10%]">POE</th>
                            <th className="p-2 font-bold text-left w-[8%]">Total Budget</th>
                          </tr>
                        </thead>
                        <tbody>
                          {realPlanItems.length > 0 ? (
                            realPlanItems.map((item, idx) => (
                              <tr key={idx} className="border-b border-black last:border-b-0">
                                <td className="border-r border-black p-2 font-bold text-center bg-slate-50">{item.kpiNo || (idx + 1)}</td>
                                <td className="border-r border-black p-2 font-medium text-slate-900">{item.kpi || 'N/A'}</td>
                                <td className="border-r border-black p-2 font-bold text-center text-emerald-800">{item.weighting || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.baseline || 'N/A'}</td>
                                <td className="border-r border-black p-2 font-semibold text-indigo-950">{item.annualTarget || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.q1Target || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.q2Target || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.q3Target || 'N/A'}</td>
                                <td className="border-r border-black p-2">{item.q4Target || 'N/A'}</td>
                                <td className="border-r border-black p-2 font-medium text-slate-600">{item.annualRequiredPoe || item.q1RequiredPoe || 'N/A'}</td>
                                <td className="p-2 font-bold text-emerald-950">{item.budget || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={11} className="p-4 text-center text-slate-500 italic">
                                No performance plan records found for this user.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {zulunePPlanBelowText && (
                      <div className="text-justify font-sans text-[12px] leading-relaxed text-slate-800 mt-4 whitespace-pre-wrap">
                        {renderFormattedContent(zulunePPlanBelowText)}
                      </div>
                    )}
                  </div>

                  {/* 15. Appended Personal Development Plan (PDP) */}
                  <div className="portrait-section page-break-before pt-6">
                    <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                      <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">15. Appended Personal Development Plan (PDP)</span>
                    </h3>
                    {zulunePdpAboveText && (
                      <div className="text-justify font-sans text-[12px] leading-relaxed text-slate-800 mb-4 whitespace-pre-wrap">
                        {renderFormattedContent(zulunePdpAboveText)}
                      </div>
                    )}

                    <table className="w-full border-collapse border border-black my-4 text-[10px] font-sans">
                      <thead>
                        <tr className="bg-slate-100 border border-black text-slate-800 font-bold">
                          <th className="border border-black p-2 font-bold text-center w-[5%]">No.</th>
                          <th className="border border-black p-2 font-bold text-left w-[20%]">Skills Gap</th>
                          <th className="border border-black p-2 font-bold text-left w-[20%]">Expected Outcomes</th>
                          <th className="border border-black p-2 font-bold text-left w-[20%]">Suggested Training Interventions</th>
                          <th className="border border-black p-2 font-bold text-left w-[15%]">Mode of Delivery</th>
                          <th className="border border-black p-2 font-bold text-left w-[10%]">Timeframe</th>
                          <th className="border border-black p-2 font-bold text-left w-[10%]">Support Person</th>
                        </tr>
                      </thead>
                      <tbody>
                        {realPdpItems.length > 0 ? (
                          realPdpItems.map((item, idx) => (
                            <tr key={idx} className="border border-black">
                              <td className="border border-black p-2 font-bold text-center bg-slate-50">{idx + 1}</td>
                              <td className="border border-black p-2 font-semibold text-slate-900">{item.skillsGap || 'N/A'}</td>
                              <td className="border border-black p-2 text-slate-700">{item.outcomes || 'N/A'}</td>
                              <td className="border border-black p-2 font-medium text-emerald-900">{item.suggestedTraining || 'N/A'}</td>
                              <td className="border border-black p-2 text-slate-700">{item.modeOfDelivery || 'N/A'}</td>
                              <td className="border border-black p-2 text-slate-700">{item.timeFrame || 'N/A'}</td>
                              <td className="border border-black p-2 font-semibold text-slate-800">{item.supportPerson || 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border border-black">
                            <td colSpan={7} className="border border-black p-4 text-center text-slate-500 italic">
                              No active items found in the Personal Development Plan module.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {zulunePdpBelowText && (
                      <div className="text-justify font-sans text-[12px] leading-relaxed text-slate-800 mt-4 whitespace-pre-wrap">
                        {renderFormattedContent(zulunePdpBelowText)}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="portrait-section page-break-before pt-6">
                  <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                    <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">12. Signatures & Affirmation</span>
                  </h3>
                  {renderSectionExtraPreview('signatures')}
                  
                  <div className="grid grid-cols-2 gap-8 my-8 font-sans">
                    <div className="border border-slate-300 p-4 rounded bg-slate-50 space-y-4">
                      <p className="font-bold text-xs uppercase text-slate-700">Signed by Employee:</p>
                      <div className="h-12 border-b border-black flex items-end font-serif italic text-sm text-slate-800">
                        {userSignatures.employee}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Date: ________________</span>
                        <span>Place: Nkangala</span>
                      </div>
                    </div>

                    <div className="border border-slate-300 p-4 rounded bg-slate-50 space-y-4">
                      <p className="font-bold text-xs uppercase text-slate-700">Signed on behalf of Municipality:</p>
                      <div className="h-12 border-b border-black flex items-end font-serif italic text-sm text-slate-800">
                        {userSignatures.manager}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Date: ________________</span>
                        <span>Place: Nkangala</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Miniature Footer Table for Print/PDF */}
            <div id="fixed-footer" className="hidden text-gray-500 w-full px-8">
              <div className="flex justify-between w-full font-sans text-[8px] pb-1 border-b border-slate-200">
                <div>Employee Initial: ________</div>
                <div>Manager Initial: ________</div>
                <div>MM Initial: ________</div>
                <div>Page <span className="counter"></span></div>
              </div>
              
              <div className="flex justify-between items-end w-full mt-1 font-sans">
                <span className="text-[6.5px] italic font-semibold text-slate-500 uppercase tracking-wider">
                  {teamTitle} Deployments
                </span>
                <div style={{ maxWidth: '420px', width: '100%' }}>
                  <table className="mini-foot-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <tbody>
                      {tableRows.map((row, idx) => (
                        <tr key={idx} style={{ height: '7px' }}>
                          {headers.map((_, colIdx) => (
                            <td key={colIdx} style={{ border: '0.5px solid #94a3b8', padding: '0px 2px', fontSize: '5px', fontWeight: colIdx === 0 ? 'bold' : 'normal' }}>
                              {row[colIdx]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
