import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Upload, Download, FileText, CheckCircle2, ChevronRight, Check, Save, Plus, Trash2, X, Printer, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import type { User } from '../../types';
import { NKANGALA_LOGO_BASE64 } from './nkangala_logo_base64';

interface PADraftingSuiteProps {
  currentUser: User;
  activeTenantId: string;
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

export function LeadFireFighterPADraftingSuite({ currentUser, activeTenantId }: PADraftingSuiteProps) {
  const [logoUrl, setLogoUrl] = useState<string>(NKANGALA_LOGO_BASE64);

  // Fetch system customized logo and ensure it is shared across all user accounts
  React.useEffect(() => {
    const fetchSystemLogo = async () => {
      if (!activeTenantId) return;
      try {
        let foundLogo = '';

        // 0. Fetch high-priority shared tenant logo first!
        const sharedLogoRes = await fetch(`/api/tenant/${activeTenantId}/logo?t=${Date.now()}`);
        if (sharedLogoRes.ok) {
          const sLogo = await sharedLogoRes.json();
          if (sLogo && sLogo.logoUrl) {
            foundLogo = sLogo.logoUrl;
          }
        }

        if (!foundLogo) {
          // 1. Fetch coverpages setup
          const coverRes = await fetch(`/api/tenant/${activeTenantId}/coverpages`);
          if (coverRes.ok) {
            const coverList = await coverRes.json();
            for (const item of coverList) {
              if (item.config && item.config.selectedLogo) {
                const logo = item.config.selectedLogo;
                // A real custom logo is a long base64 string or an image URL (not just a short preset name)
                if (typeof logo === 'string' && logo.length > 50 && (logo.startsWith('data:image') || logo.startsWith('http') || logo.startsWith('/api/'))) {
                  foundLogo = logo;
                  break;
                }
              }
            }
          }
        }

        // 2. Fetch direct custom graphics or backgrounds uploaded
        if (!foundLogo) {
          const imgRes = await fetch(`/api/tenant/${activeTenantId}/coverpages/images`);
          if (imgRes.ok) {
            const imgList = await imgRes.json();
            if (Array.isArray(imgList) && imgList.length > 0) {
              // Prefer images containing "logo" in name
              const logoImg = imgList.find((img: any) => img.name && img.name.toLowerCase().includes('logo')) || imgList[0];
              if (logoImg && logoImg.url) {
                foundLogo = logoImg.url;
              }
            }
          }
        }

        if (foundLogo) {
          console.log("System-wide custom logo loaded:", foundLogo.substring(0, 80));
          setLogoUrl(foundLogo);
          (window as any).__systemCustomLogo = foundLogo;
        }
      } catch (e) {
        console.error("Failed to fetch system logo automatically:", e);
      }
    };
    fetchSystemLogo();
  }, [activeTenantId]);

  const [coverPage, setCoverPage] = useState('PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n[Employee Name]\n\nFOR THE FINANCIAL YEAR: 2025/2026');
  const [purpose, setPurpose] = useState('The purpose of this agreement is to...');
  const [validity, setValidity] = useState('This agreement will be valid for...');
  const [reporting, setReporting] = useState('The Employee will report to...');
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
    pmu: ''
  });

  const [annexureA, setAnnexureA] = useState(true);
  const [annexureB, setAnnexureB] = useState(true);
  const [annexureC, setAnnexureC] = useState('Disclosure of interest form...\n\nOther Interests:\nI hereby certify that the above information is complete and correct to the best of my knowledge.');

  const [includeJSC, setIncludeJSC] = useState(true);

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

  React.useEffect(() => {
    if (currentUser) {
      setCoverPage(`PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n${currentUser.fullName || '[Employee Name]'}\n\nFOR THE FINANCIAL YEAR: 2025/2026`);
      setUserSignatures({
        employee: currentUser.fullName || '',
        manager: currentUser.manager || '',
        hod: 'Mr. Jacob Chief Financial Officer',
        pmu: 'Corporate Performance Unit'
      });
    }
  }, [currentUser]);

  const fetchAllAgreementSources = async () => {
    if (!activeTenantId || !currentUser?.email) return;
    setLoadingRealData(true);
    try {
      // 1. Fetch performance plan
      const planRes = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${currentUser.email}&t=${Date.now()}`);
      if (planRes.ok) {
        const planJson = await planRes.json();
        if (planJson && Array.isArray(planJson.items)) {
          setRealPlanItems(planJson.items);
        }
      }

      // 2. Fetch PDP matrix
      const pdpRes = await fetch(`/api/tenant/${activeTenantId}/pdp?userId=${currentUser.email}&t=${Date.now()}`);
      if (pdpRes.ok) {
        const pdpJson = await pdpRes.json();
        if (pdpJson && Array.isArray(pdpJson.items)) {
          setRealPdpItems(pdpJson.items);
        }
      }

      // 3. Fetch Job Specific Competencies
      const jscRes = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${currentUser.email}&t=${Date.now()}`);
      if (jscRes.ok) {
        const jscJson = await jscRes.json();
        if (jscJson && Array.isArray(jscJson.competencies)) {
          setRealJobCompetencies(jscJson.competencies);
        }
      }

      // 4. Fetch dynamic custom KPA table
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
      return { employee: '', manager: '', hod: '', pmu: '' };
    }
    if (typeof val === 'string') {
      return {
        employee: val,
        manager: '',
        hod: '',
        pmu: ''
      };
    }
    return {
      employee: val.employee || '',
      manager: val.manager || '',
      hod: val.hod || '',
      pmu: val.pmu || ''
    };
  };

  const loadFromTemplateObj = (tpl: any) => {
    if (!tpl) return;
    setCoverPage(tpl.coverPage !== undefined ? tpl.coverPage : 'PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n' + (currentUser?.fullName || '[Employee Name]') + '\n\nFOR THE FINANCIAL YEAR: 2025/2026');
    setPurpose(tpl.purpose !== undefined ? tpl.purpose : 'The purpose of this agreement is to...');
    setValidity(tpl.validity !== undefined ? tpl.validity : 'This agreement will be valid for...');
    setReporting(tpl.reporting !== undefined ? tpl.reporting : 'The Employee will report to...');
    setFramework(tpl.framework !== undefined ? tpl.framework : '4.1 The Employee agrees to participate in the performance assessment and development system of the Municipality.\n\n4.2 The Employee participates in the performance assessment framework as follows:');
    setFrameworkBelowKpa(tpl.frameworkBelowKpa !== undefined ? tpl.frameworkBelowKpa : "4.3 The Employee's assessment will further be based on the following Job Specific Competencies Matrix. Each competency has been weighted as indicated below:");
    setFrameworkBelowJsc(tpl.frameworkBelowJsc !== undefined ? tpl.frameworkBelowJsc : "4.4 The personal development plan (PDP) will address any developmental needs identified during the competency assessment process.");
    setConditions(tpl.conditions !== undefined ? tpl.conditions : 'Conditions of performance...');
    setKpaText(tpl.kpaText !== undefined ? tpl.kpaText : 'The list of tasks/ duties and responsibilities contained in this document is not necessarily exhaustive...');
    setAssessmentText(tpl.assessmentText !== undefined ? tpl.assessmentText : 'The performance assessment of the Employee will be based on the following rating scale:\n\nrating scale tabled as follows:');
    setFeedback(tpl.feedback !== undefined ? tpl.feedback : 'Feedback will be provided...');
    setTimetable(tpl.timetable !== undefined ? tpl.timetable : 'Timetable for review...');
    setPoorPerformance(tpl.poorPerformance !== undefined ? tpl.poorPerformance : 'Management of poor performance outcomes...');
    setDispute(tpl.dispute !== undefined ? tpl.dispute : 'Dispute resolution mechanism...');
    setAmendment(tpl.amendment !== undefined ? tpl.amendment : 'Amendment of agreement...');
    setEvaluation(tpl.evaluation !== undefined ? tpl.evaluation : 'Evaluation criteria...');
    setSignatures(tpl.signatures !== undefined ? tpl.signatures : '');
    setUserSignatures(getSafeUserSignatures(tpl.userSignatures !== undefined ? tpl.userSignatures : {
      employee: currentUser?.fullName || '',
      manager: currentUser?.manager || '',
      hod: 'Mr. Jacob Chief Financial Officer',
      pmu: 'Corporate Performance Unit'
    }));
    setAnnexureA(tpl.annexureA !== undefined ? tpl.annexureA : true);
    setAnnexureB(tpl.annexureB !== undefined ? tpl.annexureB : true);
    setAnnexureC(tpl.annexureC !== undefined ? tpl.annexureC : 'Disclosure of interest form...\n\nOther Interests:\nI hereby certify that the above information is complete and correct to the best of my knowledge.');
    setIncludeJSC(tpl.includeJSC !== undefined ? tpl.includeJSC : true);
    setReviewRows(tpl.reviewRows !== undefined ? tpl.reviewRows : [
      { term: '1st Quarter', desc: 'July - September', type: 'Informal', activities: 'Review', date: 'October', responsible: 'Manager' },
      { term: '2nd Quarter', desc: 'October - December', type: 'Formal', activities: 'Review', date: 'January', responsible: 'Manager' },
      { term: '3rd Quarter', desc: 'January - March', type: 'Informal', activities: 'Review', date: 'April', responsible: 'Manager' },
      { term: '4th Quarter', desc: 'April - June', type: 'Formal', activities: 'Annual Assessment', date: 'August', responsible: 'Manager' }
    ]);
  };

  const saveAsTemplateOne = async () => {
    if (!activeTenantId) return;
    setSaving(true);
    setTemplateSaveStatus('idle');
    try {
      const stateObj = {
        logoUrl,
        coverPage,
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
        reviewRows
      };

      // 1. Fetch current templates
      const templatesRes = await fetch(`/api/tenant/${activeTenantId}/pa-templates`);
      let templatesList: any[] = [];
      if (templatesRes.ok) {
        const tdata = await templatesRes.json();
        templatesList = tdata.templates || [];
      }

      // Convert our realJobCompetencies and dynTableRows to expected templates properties
      const mappedKpas = dynTableRows.map((row, idx) => ({
        id: `tpl-kpa-${idx}`,
        title: row[1] || row[2] || 'Key Performance Area',
        weight: parseInt(row[3]) || 0
      }));

      const mappedCompetencies = realJobCompetencies.map((comp, idx) => ({
        id: comp.id || `tpl-comp-${idx}`,
        title: comp.competency || 'Competency',
        type: comp.type || 'Core Managerial',
        weight: parseInt(comp.weight || comp.weighting) || 0
      }));

      const newTpl1 = {
        id: 'template-1',
        name: 'Template 1',
        department: currentUser?.department || 'Administration',
        level: '1',
        description: `Autosaved "Template 1" configuration of current performance agreement. Saved at ${new Date().toLocaleTimeString()}.`,
        kpas: mappedKpas,
        kpis: [],
        competencies: mappedCompetencies,
        createdAt: new Date().toISOString(),
        // Full drafting document state fields
        ...stateObj
      };

      // Remove any existing "template-1" as we are overwriting it
      const filtered = templatesList.filter((t: any) => t.id !== 'template-1');
      const updatedList = [newTpl1, ...filtered];

      // 2. Save back
      const saveRes = await fetch(`/api/tenant/${activeTenantId}/pa-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: updatedList })
      });

      if (saveRes.ok) {
        setTemplateSaveStatus('success');
        setTimeout(() => setTemplateSaveStatus('idle'), 3000);
        // Refresh local list
        setAvailableTemplates(updatedList);
      } else {
        throw new Error("Failed to save template 1 to database");
      }
    } catch (err) {
      console.error("Save Template 1 Error:", err);
      setTemplateSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const [subordinateFireFighters, setSubordinateFireFighters] = useState<User[]>([]);

  React.useEffect(() => {
    if (tenantUsers.length > 0 && currentUser.fullName) {
      const reportingToMe = tenantUsers.filter(u => 
        u.reportTo === currentUser.fullName || 
        u.manager === currentUser.fullName || 
        (u.reportTo && u.reportTo.includes(currentUser.fullName))
      ).filter(u => (u.jobFunction || '').toLowerCase().includes('fire') || (u.department || '').toLowerCase().includes('fire') || (u.systemRole || '').toLowerCase().includes('fire'));
      setSubordinateFireFighters(reportingToMe);
    }
  }, [tenantUsers, currentUser]);

  const saveToProfile = async () => {
    if (!activeTenantId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const stateObj = {
        logoUrl,
        coverPage,
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
        reviewRows
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser?.email || 'default'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: stateObj,
          htmlDocumentId: `draft_doc_${activeTenantId}`
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

  const fetchSavedDraft = async () => {
    if (!activeTenantId || !currentUser?.email) return;
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.html) {
          let state: any = null;
          if (typeof data.html === 'string') {
            try {
              state = JSON.parse(data.html);
            } catch (e) {
              // Not a JSON string after all
            }
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
            setCoverPage(state.coverPage !== undefined ? state.coverPage : 'PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nThe Municipality herein represented by the Municipal Manager\n\n&\n\n' + (currentUser?.fullName || '[Employee Name]') + '\n\nFOR THE FINANCIAL YEAR: 2025/2026');
            setPurpose(state.purpose !== undefined ? state.purpose : 'The purpose of this agreement is to...');
            setValidity(state.validity !== undefined ? state.validity : 'This agreement will be valid for...');
            setReporting(state.reporting !== undefined ? state.reporting : 'The Employee will report to...');
            setFramework(state.framework !== undefined ? state.framework : '4.1 The Employee agrees to participate in the performance assessment and development system of the Municipality.\n\n4.2 The Employee participates in the performance assessment framework as follows:');
            setFrameworkBelowKpa(state.frameworkBelowKpa !== undefined ? state.frameworkBelowKpa : "4.3 The Employee's assessment will further be based on the following Job Specific Competencies Matrix. Each competency has been weighted as indicated below:");
            setFrameworkBelowJsc(state.frameworkBelowJsc !== undefined ? state.frameworkBelowJsc : "4.4 The personal development plan (PDP) will address any developmental needs identified during the competency assessment process.");
            setConditions(state.conditions !== undefined ? state.conditions : 'Conditions of performance...');
            setKpaText(state.kpaText !== undefined ? state.kpaText : 'The list of tasks/ duties and responsibilities contained in this document is not necessarily exhaustive...');
            setAssessmentText(state.assessmentText !== undefined ? state.assessmentText : 'The performance assessment of the Employee will be based on the following rating scale:\n\nrating scale tabled as follows:');
            setFeedback(state.feedback !== undefined ? state.feedback : 'Feedback will be provided...');
            setTimetable(state.timetable !== undefined ? state.timetable : 'Timetable for review...');
            setPoorPerformance(state.poorPerformance !== undefined ? state.poorPerformance : 'Management of poor performance outcomes...');
            setDispute(state.dispute !== undefined ? state.dispute : 'Dispute resolution mechanism...');
            setAmendment(state.amendment !== undefined ? state.amendment : 'Amendment of agreement...');
            setEvaluation(state.evaluation !== undefined ? state.evaluation : 'Evaluation criteria...');
            setSignatures(state.signatures !== undefined ? state.signatures : '');
            setUserSignatures(getSafeUserSignatures(state.userSignatures !== undefined ? state.userSignatures : {
              employee: currentUser?.fullName || '',
              manager: currentUser?.manager || '',
              hod: 'Mr. Jacob Chief Financial Officer',
              pmu: 'Corporate Performance Unit'
            }));
            setAnnexureA(state.annexureA !== undefined ? state.annexureA : true);
            setAnnexureB(state.annexureB !== undefined ? state.annexureB : true);
            setAnnexureC(state.annexureC !== undefined ? state.annexureC : 'Disclosure of interest form...\n\nOther Interests:\nI hereby certify that the above information is complete and correct to the best of my knowledge.');
            setIncludeJSC(state.includeJSC !== undefined ? state.includeJSC : true);
            setReviewRows(state.reviewRows !== undefined ? state.reviewRows : [
              { term: '1st Quarter', desc: 'July - September', type: 'Informal', activities: 'Review', date: 'October', responsible: 'Manager' },
              { term: '2nd Quarter', desc: 'October - December', type: 'Formal', activities: 'Review', date: 'January', responsible: 'Manager' },
              { term: '3rd Quarter', desc: 'January - March', type: 'Informal', activities: 'Review', date: 'April', responsible: 'Manager' },
              { term: '4th Quarter', desc: 'April - June', type: 'Formal', activities: 'Annual Assessment', date: 'August', responsible: 'Manager' }
            ]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch saved draft:", err);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const element = document.getElementById('pa-printable-area');
      if (!element) {
        alert('Printable content not found.');
        return;
      }
      
      const originalTransition = element.style.transition;
      element.style.transition = 'none';
      
      await document.fonts.ready;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      element.style.transition = originalTransition;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
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
      
      // Stamp clean, dynamic, professional page numbers and footer on each page of firefighter PDF
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        if (i === 1) continue; // Skip Cover page for clean styling
        pdf.setPage(i);
        
        // Horizontal divider line
        pdf.setDrawColor(200, 205, 210);
        pdf.setLineWidth(0.2);
        pdf.line(10, pdfHeight - 15, pdfWidth - 10, pdfHeight - 15);
        
        // Left footer label
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 100);
        pdf.text("NKANGALA DISTRICT MUNICIPALITY - LEAD FIREFIGHTER PA", 10, pdfHeight - 10);
        
        // Right page number
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(110, 110, 110);
        pdf.text(`Page ${i} of ${pageCount}`, pdfWidth - 35, pdfHeight - 10);
      }
      
      pdf.save(`Performance_Agreement_Lead_FF_${(currentUser?.fullName || 'Draft').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
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
      size: 297mm 210mm; /* A4 Landscape */
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
    .portrait-section, .landscape-section {
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
      a.download = `Performance_Agreement_Lead_FF_${currentUser?.fullName?.replace(/\s+/g, '_') || 'Draft'}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Word:', error);
      alert('Failed to export Word document.');
    } finally {
      setIsExportingWord(false);
    }
  };

  React.useEffect(() => {
    fetchAllAgreementSources();
    fetchSavedDraft();
    fetchTenantUsers();
    fetchTemplatesList();
  }, [activeTenantId, currentUser]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setLogoUrl(base64);
        (window as any).__systemCustomLogo = base64;

        // Persist to the tenant level so that it pops up on every single user account!
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
    { level: 2, description: 'Not fully effective', score: '67 - 99', ratios: '0%' },
    { level: 1, description: 'Unacceptable performance', score: '0 - 66', ratios: '0%' }
  ];



  const employeeUser = tenantUsers.find(u => 
    (u.email && currentUser?.email && u.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
    (u.fullName && currentUser?.fullName && u.fullName.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim())
  ) || currentUser;

  const managerUser = tenantUsers.find(u => {
    const mgrName = employeeUser?.manager || currentUser?.manager || '';
    if (!mgrName) return false;
    return (u.fullName && u.fullName.toLowerCase().trim() === mgrName.toLowerCase().trim()) ||
           (u.email && u.email.toLowerCase().trim() === mgrName.toLowerCase().trim());
  });

  const pmsOfficial = tenantUsers.find(u => {
    const dept = (u.department || '').toLowerCase();
    const role = (u.systemRole || u.jobFunction || '').toLowerCase();
    return dept.includes('pms') || dept.includes('performance') || role.includes('pms') || role.includes('performance');
  });

  return (
    <div className="flex flex-1 min-h-0 w-full h-[calc(100vh-270px)] bg-slate-50 overflow-hidden divide-x divide-slate-200">
      <style>{`
        /* Force dashboard's main container to fit the viewport and hide outer overflow when PADraftingSuite is loaded */
        main > div.overflow-auto,
        main > div.hide-scrollbar,
        div.max-w-\[1600px\].overflow-auto {
          overflow: hidden !important;
          height: calc(100vh - 110px) !important;
          padding-bottom: 0 !important;
        }

        /* Fully hide scrollbar for Chrome, Safari and Opera across the column panes */
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        /* Fully hide scrollbar for IE, Edge and Firefox across the column panes */
        .hide-scrollbar {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
        }
      `}</style>
      {/* Left Pane - Editor */}
      <div className="w-1/2 h-full overflow-y-auto hide-scrollbar p-6 space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-slate-800 mr-2">Drafting Suite Tools</h2>
            <button
              onClick={saveToProfile}
              disabled={saving}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                saveStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                saveStatus === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Save className="w-3.5 h-3.5 animate-bounce-once" />
              {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved to Profile' : 'Save To Profile'}
            </button>
            <button
              onClick={saveAsTemplateOne}
              disabled={saving}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                templateSaveStatus === 'success' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                templateSaveStatus === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : templateSaveStatus === 'success' ? 'Template 1 Saved' : 'Save as Template 1'}
            </button>
            {availableTemplates.length > 0 && (
              <select
                onChange={(e) => {
                  const sel = availableTemplates.find(t => t.id === e.target.value);
                  if (sel) loadFromTemplateObj(sel);
                }}
                className="text-xs p-1.5 border border-slate-300 rounded-lg outline-none bg-slate-50 font-semibold text-slate-700 max-w-[180px] cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>Load from Template...</option>
                {availableTemplates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name || 'Untitled'} {t.id === 'template-1' ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition">
              <Upload className="w-4 h-4" />
              Upload Logo
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">Cover Page</label>
          <textarea value={coverPage} onChange={e => setCoverPage(e.target.value)} rows={6} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">1. Purpose</label>
          <textarea value={purpose} onChange={e => setPurpose(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">2. Validity of Agreement</label>
          <textarea value={validity} onChange={e => setValidity(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">3. Reporting Requirements/ Line & Line Assessment lines</label>
          <textarea value={reporting} onChange={e => setReporting(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase block">4. Performance Assessment Framework</label>
          <textarea value={framework} onChange={e => setFramework(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <div className="text-[10px] text-slate-500 italic font-medium !mt-2">Note: The KPA No Table sits directly between the text above and the text below.</div>
          <label className="text-xs font-bold text-slate-700 uppercase block !mt-3">4.3 Competencies Text (Below KPA Table)</label>
          <textarea value={frameworkBelowKpa} onChange={e => setFrameworkBelowKpa(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <div className="text-[10px] text-slate-500 italic font-medium !mt-2">Note: The Job Specific Competencies Matrix Table sits directly between the text above and the text below.</div>
          <label className="text-xs font-bold text-slate-700 uppercase block !mt-3">4.4 Framework Footer Text (Below Competencies Table)</label>
          <textarea value={frameworkBelowJsc} onChange={e => setFrameworkBelowJsc(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">5. Conditions of performance</label>
          <textarea value={conditions} onChange={e => setConditions(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">6. Performance Assessment (KPAs)</label>
          <div className="text-[10px] text-slate-500 italic mb-2">Table will be generated with 5 predefined KPAs as requested.</div>
          <textarea value={kpaText} onChange={e => setKpaText(e.target.value)} rows={6} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
          <div className="pt-2">
            <button onClick={() => setIncludeJSC(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition">
              <CheckCircle2 className={`w-4 h-4 ${includeJSC ? 'text-emerald-600' : 'text-slate-400'}`} />
              Adopt JSC (Job Specific Competencies)
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">6. Performance Assessment (Bonus)</label>
          <div className="text-[10px] text-slate-500 italic mb-2">Table will be generated with Bonus Ratios.</div>
          <textarea value={assessmentText} onChange={e => setAssessmentText(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">7. Feedback</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">8. Timetable and records of review discussions</label>
          <div className="text-[10px] text-slate-500 italic mb-2">Configure, edit, and add/remove key review quarters in the interactive table below. Changes will sync dynamically to section 8 of the generated Performance Agreement.</div>
          
          <div className="overflow-x-auto min-w-0 border border-slate-200 rounded-xl bg-slate-50 shadow-inner">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-2.5 font-bold text-slate-800 text-[10px] uppercase font-mono tracking-wider border-r border-slate-200 resize-x overflow-auto min-w-[110px] w-1/6" style={{ resize: 'horizontal' }}>Review Term</th>
                  <th className="p-2.5 font-bold text-slate-800 text-[10px] uppercase font-mono tracking-wider border-r border-slate-200 resize-x overflow-auto min-w-[140px] w-1/4" style={{ resize: 'horizontal' }}>Term Description</th>
                  <th className="p-2.5 font-bold text-slate-800 text-[10px] uppercase font-mono tracking-wider border-r border-slate-200 min-w-[100px] w-1/8">Type</th>
                  <th className="p-2.5 font-bold text-slate-800 text-[10px] uppercase font-mono tracking-wider border-r border-slate-200 resize-x overflow-auto min-w-[130px] w-1/5" style={{ resize: 'horizontal' }}>Activities</th>
                  <th className="p-2.5 font-bold text-slate-800 text-[10px] uppercase font-mono tracking-wider border-r border-slate-200 resize-x overflow-auto min-w-[110px] w-1/6" style={{ resize: 'horizontal' }}>Due Date</th>
                  <th className="p-2.5 font-bold text-slate-800 text-[10px] uppercase font-mono tracking-wider border-r border-slate-200 resize-x overflow-auto min-w-[110px] w-1/6" style={{ resize: 'horizontal' }}>Responsible</th>
                  <th className="p-2.5 w-12 text-center font-bold text-slate-800 text-[10px] uppercase font-mono">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviewRows.map((r, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-slate-200 hover:bg-slate-100/30 transition">
                    <td className="p-1 border-r border-slate-200 align-top">
                      <textarea
                        rows={1}
                        value={r.term || ''}
                        onChange={(e) => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], term: e.target.value };
                          setReviewRows(updated);
                        }}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                          }
                        }}
                        className="w-full bg-transparent p-1 border-0 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:rounded font-semibold text-slate-900 outline-none resize-none overflow-hidden text-xs leading-normal min-h-[28px]"
                        placeholder="Term..."
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 align-top">
                      <textarea
                        rows={1}
                        value={r.desc || ''}
                        onChange={(e) => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], desc: e.target.value };
                          setReviewRows(updated);
                        }}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                          }
                        }}
                        className="w-full bg-transparent p-1 border-0 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:rounded font-semibold text-slate-900 outline-none resize-none overflow-hidden text-xs leading-normal min-h-[28px]"
                        placeholder="Description..."
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 align-top">
                      <select
                        value={r.type || 'Informal'}
                        onChange={(e) => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], type: e.target.value };
                          setReviewRows(updated);
                        }}
                        className="w-full bg-transparent p-1 border border-transparent focus:bg-white focus:ring-1 focus:ring-slate-400 focus:rounded font-semibold text-slate-900 outline-none cursor-pointer text-xs h-7"
                      >
                        <option value="Informal">Informal</option>
                        <option value="Formal">Formal</option>
                      </select>
                    </td>
                    <td className="p-1 border-r border-slate-200 align-top">
                      <textarea
                        rows={1}
                        value={r.activities || ''}
                        onChange={(e) => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], activities: e.target.value };
                          setReviewRows(updated);
                        }}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                          }
                        }}
                        className="w-full bg-transparent p-1 border-0 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:rounded font-semibold text-slate-900 outline-none resize-none overflow-hidden text-xs leading-normal min-h-[28px]"
                        placeholder="Activities..."
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 align-top">
                      <textarea
                        rows={1}
                        value={r.date || ''}
                        onChange={(e) => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], date: e.target.value };
                          setReviewRows(updated);
                        }}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                          }
                        }}
                        className="w-full bg-transparent p-1 border-0 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:rounded font-semibold text-slate-900 outline-none resize-none overflow-hidden text-xs leading-normal min-h-[28px]"
                        placeholder="Due Date..."
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 align-top">
                      <textarea
                        rows={1}
                        value={r.responsible || ''}
                        onChange={(e) => {
                          const updated = [...reviewRows];
                          updated[rowIdx] = { ...updated[rowIdx], responsible: e.target.value };
                          setReviewRows(updated);
                        }}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                          }
                        }}
                        className="w-full bg-transparent p-1 border-0 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:rounded font-semibold text-slate-900 outline-none resize-none overflow-hidden text-xs leading-normal min-h-[28px]"
                        placeholder="Responsible..."
                      />
                    </td>
                    <td className="p-1 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => {
                          if (reviewRows.length <= 1) {
                            alert("At least one review row is required.");
                            return;
                          }
                          setReviewRows(reviewRows.filter((_, idx) => idx !== rowIdx));
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition"
                        title="Remove Review Quarter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const nextNum = reviewRows.length + 1;
                setReviewRows([
                  ...reviewRows,
                  { term: `${nextNum}th Quarter`, desc: 'Month - Month', type: 'Formal', activities: 'Review', date: 'Month', responsible: 'Manager' }
                ]);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-slate-250 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Review Term
            </button>
          </div>

          <label className="text-[10px] font-bold text-slate-700 uppercase block !mt-4">8.1 Additional / Footer Instruction Notes & NB Remarks</label>
          <textarea value={timetable} onChange={e => setTimetable(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">9. Management of poor performance outcomes</label>
          <textarea value={poorPerformance} onChange={e => setPoorPerformance(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">10. Dispute Resolution</label>
          <textarea value={dispute} onChange={e => setDispute(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">11. Amendment of agreement</label>
          <textarea value={amendment} onChange={e => setAmendment(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">12. Evaluation</label>
          <textarea value={evaluation} onChange={e => setEvaluation(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">16. Signature of parties to the agreement</label>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Employee Name (Search/Type)" value={userSignatures.employee} onChange={e => setUserSignatures({...userSignatures, employee: e.target.value})} className="text-xs p-2 border border-slate-300 rounded" />
            <input type="text" placeholder="Manager Name" value={userSignatures.manager} onChange={e => setUserSignatures({...userSignatures, manager: e.target.value})} className="text-xs p-2 border border-slate-300 rounded" />
            <input type="text" placeholder="Head of Department" value={userSignatures.hod} onChange={e => setUserSignatures({...userSignatures, hod: e.target.value})} className="text-xs p-2 border border-slate-300 rounded" />
            <input type="text" placeholder="Performance Management Unit" value={userSignatures.pmu} onChange={e => setUserSignatures({...userSignatures, pmu: e.target.value})} className="text-xs p-2 border border-slate-300 rounded" />
          </div>
          <textarea value={signatures} onChange={e => setSignatures(e.target.value)} rows={2} className="w-full text-xs p-3 mt-2 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" placeholder="Additional details..." />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 uppercase">Annexures Inclusion</label>
            <button
              onClick={fetchAllAgreementSources}
              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition"
            >
              {loadingRealData ? 'Refreshing...' : 'Force Refresh Live Data'}
            </button>
          </div>
          <div className="flex gap-4">
            <button onClick={() => { setAnnexureA(!annexureA); fetchAllAgreementSources(); }} className="flex-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-2 transition">
              {annexureA ? 'Remove Performance Plan' : 'Pull Performance Plan (Annexure A)'}
              {annexureA && <Check className="w-4 h-4 text-emerald-600 animate-pulse" />}
            </button>
            <button onClick={() => { setAnnexureB(!annexureB); fetchAllAgreementSources(); }} className="flex-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-2 transition">
              {annexureB ? 'Remove PDP' : 'Pull PDP (Annexure B)'}
              {annexureB && <Check className="w-4 h-4 text-emerald-600 animate-pulse" />}
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase">Annexure C: Disclosure of Interest</label>
          <textarea value={annexureC} onChange={e => setAnnexureC(e.target.value)} rows={4} className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:border-emerald-500 outline-none" />
        </div>
      </div>

      {/* Right Pane - Compiler */}
      <div className="w-1/2 h-full overflow-y-auto hide-scrollbar bg-slate-200 p-8">
        <div className="bg-white w-full max-w-3xl mx-auto shadow-2xl min-h-[1100px] border border-slate-300 relative">
          {/* Printable Area */}
          <div id="pa-printable-area" className="p-12 space-y-8 text-black font-serif print:p-0">
            
            {/* Logo */}
            {logoUrl && (
              <div className="flex justify-center mb-8">
                <img src={logoUrl} alt="Logo" className="max-h-24 object-contain" />
              </div>
            )}

            {/* Cover Page */}
            <div className="portrait-section text-center font-bold whitespace-pre-wrap leading-relaxed border-b-2 border-black pb-12 mb-12">
              {coverPage}
              {subordinateFireFighters.length > 0 && (
                <div className="mt-8 font-sans text-left break-after-page">
                  <h4 className="text-sm font-black text-amber-800 uppercase text-center mb-4">Reporting Subordinate Fire Fighters</h4>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2 text-left w-1/3">Name</th>
                        <th className="border border-slate-300 p-2 text-left w-1/3">Designation</th>
                        <th className="border border-slate-300 p-2 text-left w-1/3">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subordinateFireFighters.map((ff, index) => (
                        <tr key={index}>
                          <td className="border border-slate-300 p-2 align-middle">{ff.fullName || ff.email}</td>
                          <td className="border border-slate-300 p-2 align-middle">{ff.jobFunction || 'Fire Fighter'}</td>
                          <td className="border border-slate-300 p-2 align-middle h-16"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="space-y-8 text-[13px] leading-relaxed">
              
              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">1. Purpose</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(purpose)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">2. Validity of Agreement</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(validity)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">3. Reporting Requirements</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(reporting)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">4. Performance Assessment Framework</span>
                </h3>
                <div className="text-justify mb-4">{renderFormattedContent(framework)}</div>
                <div className="text-justify">{renderFormattedContent(frameworkBelowKpa)}</div>
              </div>

              <div className="landscape-section page-break-before pt-6">
                <h4 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">4.1 Key Performance Areas (KPAs) Table</span>
                </h4>
                <table className="w-full border-collapse border border-black mt-2 mb-4 text-xs font-sans">
                  <thead>
                    <tr className="bg-gray-100">
                      {dynTableHeaders.map((header, hIdx) => (
                        <th key={hIdx} className={`border border-black p-2 font-bold ${hIdx === 0 ? 'w-16 text-center' : hIdx === dynTableHeaders.length - 1 ? 'w-24 text-center' : 'text-left'}`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dynTableRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={`border border-black p-2 ${cIdx === 0 ? 'text-center font-bold w-16' : cIdx === row.length - 1 ? 'text-center font-semibold w-24' : 'font-medium text-justify'}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(() => {
                  const kpaWeightColIdx = dynTableHeaders.findIndex(h => h.toLowerCase().includes('weight'));
                  let totalKpaWeight = 0;
                  if (kpaWeightColIdx !== -1) {
                    dynTableRows.forEach(row => {
                      if (row[kpaWeightColIdx]) {
                        const cleanVal = row[kpaWeightColIdx].replace(/[^\d.-]/g, '').trim();
                        const parsed = parseFloat(cleanVal);
                        if (!isNaN(parsed)) {
                          totalKpaWeight += parsed;
                        }
                      }
                    });
                  }

                  if (totalKpaWeight !== 100) {
                    return (
                      <div className="p-3 mb-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                        <span>⚠️ Compliance Alert: The current accumulated KPA weighting is {totalKpaWeight}%. Under section 4.1 state regulations, Key Performance Area (KPA) weight allocations must sum to exactly 100% in the municipal scorecard. However, they do not need to be equally divisible (e.g., 33%, 33%, 34% or 40%, 35%, 25% are fully compliant).</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                        <span>🎉 Compliance Success: All Key Performance Area (KPA) weight allocations correctly sum up to exactly 100% (Non-equal distributions are valid).</span>
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="landscape-section page-break-before pt-6">
                <h4 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">4.2 Job Specific Competencies Standards Weight Table</span>
                </h4>
                {realJobCompetencies.length > 0 ? (
                  <table className="w-full border-collapse border border-black mt-2 mb-4 text-xs font-sans">
                    <thead>
                      <tr className="bg-gray-100 font-bold">
                        <th className="border border-black p-1.5 w-20 text-center">JSC No</th>
                        <th className="border border-black p-1.5 text-left">Competency</th>
                        <th className="border border-black p-1.5 text-left">Competency Definition</th>
                        <th className="border border-black p-1.5 w-28 text-center">Level of Capability</th>
                        <th className="border border-black p-1.5 w-20 text-center">Weighting</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realJobCompetencies.map((comp, idx) => {
                        const compTitle = comp.competency || '';
                        let defText = '';
                        if (comp.definition) {
                          if (typeof comp.definition === 'string') {
                            defText = comp.definition;
                          } else if (comp.definition.mainText) {
                            defText = comp.definition.mainText;
                          }
                        }
                        return (
                          <tr key={comp.id || idx}>
                            <td className="border border-black p-1.5 text-center font-mono">{comp.jscNo || `JSC-${idx + 1}`}</td>
                            <td className="border border-black p-1.5 font-bold text-slate-950 text-left">{compTitle}</td>
                            <td className="border border-black p-1.5 text-justify font-medium">
                              {defText && (
                                <div className="text-slate-800 text-[10.5px] leading-relaxed font-normal">
                                  {defText}
                                </div>
                              )}
                              {comp.definition && typeof comp.definition !== 'string' && comp.definition.subsections && comp.definition.subsections.length > 0 && (
                                <div className="space-y-1.5 mt-2 pl-2 border-l border-slate-300">
                                  {comp.definition.subsections.map((sub: any, sIdx: number) => (
                                    <div key={sIdx} className="text-[10px]">
                                      {sub.heading && <div className="font-bold text-slate-800 uppercase text-[9px] mt-1">{sub.heading}</div>}
                                      {sub.paragraphs && sub.paragraphs.map((p: string, pIdx: number) => (
                                        <div key={pIdx} className="text-slate-600 pl-3 leading-normal relative before:content-['•'] before:absolute before:left-1 before:text-slate-450 text-[9.5px]">
                                          {p}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-center">{comp.level || 'Advanced'}</td>
                            <td className="border border-black p-1.5 text-center font-semibold">{comp.weight || comp.weighting || 0}%</td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold bg-slate-50">
                        <td colSpan={4} className="border border-black p-1.5 text-right uppercase font-bold text-slate-900">Total Assessment Weight</td>
                        <td className="border border-black p-1.5 text-center">
                          {realJobCompetencies.reduce((acc, curr) => acc + (Number(curr.weight || curr.weighting) || 0), 0)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs italic mb-4">
                    No competencies recorded yet. Make sure to define and save competencies in the Job Specific Competencies module.
                  </div>
                )}

                {realJobCompetencies.length > 0 && realJobCompetencies.reduce((acc, curr) => acc + (Number(curr.weight || curr.weighting) || 0), 0) !== 100 && (
                  <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-100 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                    <span>⚠️ Compliance Alert: The current accumulated competency weighting is {realJobCompetencies.reduce((acc, curr) => acc + (Number(curr.weight || curr.weighting) || 0), 0)}%. Under state regulation guidelines, all professional/performance specific competency weightings must collectively equal exactly 100%.</span>
                  </div>
                )}

                <div className="text-justify mt-4 mb-4">{renderFormattedContent(frameworkBelowJsc)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">5. Conditions of performance</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(conditions)}</div>
              </div>

              <div className="landscape-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">6. Performance Assessment (KPAs)</span>
                </h3>
                {(() => {
                  const trigger = "rating scale tabled as follows:";
                  
                  // Case-insensitive search
                  const kpaIdx = kpaText.toLowerCase().indexOf(trigger);
                  const hasInKpa = kpaIdx !== -1;
                  
                  const assIdx = assessmentText.toLowerCase().indexOf(trigger);
                  const hasInAss = assIdx !== -1;

                  const ratingSystemTable = (
                    <div className="my-6">
                      <h4 className="font-bold text-xs uppercase mb-3 tracking-wide text-emerald-800">Performance Assessment Rating System & Bonus Criteria</h4>
                      <table className="w-full border-collapse border border-black text-xs font-sans" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                          <tr className="text-white font-bold" style={{ backgroundColor: '#22c55e' }}>
                            <th className="border border-black p-2 text-center" style={{ backgroundColor: '#22c55e', color: '#ffffff', width: '50px', minWidth: '50px' }}>Level</th>
                            <th className="border border-black p-2 text-left" style={{ backgroundColor: '#22c55e', color: '#ffffff', width: '130px', minWidth: '130px' }}>Terminology</th>
                            <th className="border border-black p-2 text-left" style={{ backgroundColor: '#22c55e', color: '#ffffff', width: 'auto' }}>Description</th>
                            <th className="border border-black p-2 text-center" style={{ backgroundColor: '#22c55e', color: '#ffffff', width: '80px', minWidth: '80px' }}>Assessment Score</th>
                            <th className="border border-black p-2 text-left" style={{ backgroundColor: '#22c55e', color: '#ffffff', width: '180px', minWidth: '180px' }}>Performance Bonus Ratios</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Level 5 */}
                          <tr>
                            <td className="border border-black p-2 text-center font-bold bg-emerald-50/20" style={{ color: '#0f172a' }}>5</td>
                            <td className="border border-black p-2 font-bold text-emerald-800" style={{ color: '#065f46' }}>Outstanding performance</td>
                            <td className="border border-black p-2 text-justify text-[11px] leading-relaxed" style={{ color: '#0f172a', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              Performance far exceeds the standard expected of a staff member at this level. The appraisal indicates that the staff member has achieved above fully effective results against all performance criteria and indicators as specified in the Performance Agreement and Performance Plan and maintained this in all areas of responsibility throughout the year. The appraisal indicates that the staff member has achieved above fully effective results against more than 100% of the performance criteria and indicators and fully achieved all others throughout the year. <strong>(Should the municipality obtain clean audit, all employees who have the KPI and report on it shall be awarded a rating of 5).</strong>
                            </td>
                            <td className="border border-black p-2 text-center font-semibold bg-emerald-50/10" style={{ color: '#0f172a' }}>75-100</td>
                            <td className="border border-black p-2 text-[11px] leading-relaxed" style={{ color: '#0f172a', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              Maximum bonus allowed into. Regulations is between 10% and 14% of person's inclusive annual remuneration package. The % are as follows:
                              <div className="mt-1 font-mono text-[9px] p-1.5 border border-emerald-300 rounded leading-tight font-bold" style={{ backgroundColor: '#f0fdf4', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                75-76% = 10%<br />
                                77-78% = 11%<br />
                                79-80% = 12%<br />
                                81-84% = 13%<br />
                                85-100% = 14%
                              </div>
                            </td>
                          </tr>
                          {/* Level 4 */}
                          <tr>
                            <td className="border border-black p-2 text-center font-bold bg-emerald-50/10" style={{ color: '#0f172a' }}>4</td>
                            <td className="border border-black p-2 font-bold text-emerald-700" style={{ color: '#047857' }}>Performance significantly above expectations</td>
                            <td className="border border-black p-2 text-justify text-[11px] leading-relaxed" style={{ color: '#0f172a', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              Performance is significantly higher than the standard expected in the job. The appraisal indicates that the staff member has achieved above fully effective results against more than half of the performance criteria and indicators and fully achieved all others throughout the year.
                            </td>
                            <td className="border border-black p-2 text-center font-semibold bg-emerald-50/10" style={{ color: '#0f172a' }}>65-74</td>
                            <td className="border border-black p-2 text-[11px] leading-relaxed" style={{ color: '#0f172a', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              Maximum bonus allowed into. Regulations is between 5% and 9% of person's inclusive annual remuneration package. The % are as follows:
                              <div className="mt-1 font-mono text-[9px] p-1.5 border border-slate-300 rounded leading-tight font-bold" style={{ backgroundColor: '#f8fafc', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                65-66% = 5%<br />
                                67-68% = 6%<br />
                                69-70% = 7%<br />
                                71-72% = 8%<br />
                                73-74% = 9%
                              </div>
                            </td>
                          </tr>
                          {/* Level 3 */}
                          <tr>
                            <td className="border border-black p-2 text-center font-bold" style={{ color: '#0f172a' }}>3</td>
                            <td className="border border-black p-2 font-bold text-slate-800" style={{ color: '#1e293b' }}>Fully effective</td>
                            <td className="border border-black p-2 text-justify text-[11px] leading-relaxed" style={{ color: '#0f172a', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              Performance fully meets the standards expected in all areas of the job. The appraisal indicates that the staff member has fully achieved effective results against all significant performance criteria and indicators as specified in the Performance Agreement and Performance Plan. <strong>(All rollover projects, the policies KPIs, compliance KPIs, awareness campaigns/ workshop/ training must be scored 3. The official attendance registers must have the Municipal logo.)</strong>
                            </td>
                            <td className="border border-black p-2 text-center font-semibold" style={{ color: '#0f172a' }}>51-64</td>
                            <td className="border border-black p-2 font-medium text-slate-600" style={{ color: '#475569' }}>No bonus</td>
                          </tr>
                          {/* Level 2 */}
                          <tr>
                            <td className="border border-black p-2 text-center font-bold" style={{ color: '#0f172a' }}>2</td>
                            <td className="border border-black p-2 font-bold text-slate-700" style={{ color: '#334155' }}>Not fully effective</td>
                            <td className="border border-black p-2 text-justify text-[11px] leading-relaxed" style={{ color: '#0f172a', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              Performance is below the standard required for the job in key areas. Performance meets some of the standards expected for the job. The review/assessment indicates that the staff member has achieved below fully effective results against <strong>more than half the key performance criteria</strong> and indicators as specified in the Performance Agreement and Performance Plan. <strong>(Performance must at least be 51% and above)</strong>
                            </td>
                            <td className="border border-black p-2 text-center font-semibold" style={{ color: '#0f172a' }}>31-50</td>
                            <td className="border border-black p-2 font-medium text-slate-600" style={{ color: '#475569' }}>No bonus</td>
                          </tr>
                          {/* Level 1 */}
                          <tr>
                            <td className="border border-black p-2 text-center font-bold" style={{ color: '#0f172a' }}>1</td>
                            <td className="border border-black p-2 font-bold text-rose-800 bg-rose-50/10" style={{ color: '#9f1239' }}>Unacceptable performance</td>
                            <td className="border border-black p-2 text-justify text-[11px] leading-relaxed bg-rose-50/5" style={{ color: '#0f172a', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              Performance does not meet the standard expected for the job. The review/ assessment indicates that the staff member has achieved below fully effective results against almost all of the performance criteria and indicators as specified in the Performance Agreement and Performance Plan. The staff member has failed to demonstrate the commitment or ability to bring performance up to the level expected in the job despite management efforts to encourage improvement. <strong>(All the KPIs or JSCs which are not reported must be rated 1. KPIs with no means of verification (POE), including POEs that are not opening, and repeated JSCs motivations from the previous financial year will be rated a 1.)</strong>
                            </td>
                            <td className="border border-black p-2 text-center font-semibold bg-rose-50/10" style={{ color: '#0f172a' }}>Less than 30</td>
                            <td className="border border-black p-2 font-medium text-slate-600" style={{ color: '#475569' }}>No bonus</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );

                  if (hasInKpa) {
                    const before = kpaText.substring(0, kpaIdx + trigger.length);
                    const after = kpaText.substring(kpaIdx + trigger.length);
                    return (
                      <div>
                        <div className="text-justify">{renderFormattedContent(before)}</div>
                        {ratingSystemTable}
                        <div className="text-justify mt-4 mb-4">{renderFormattedContent(after)}</div>
                        <div className="text-justify mt-4">{renderFormattedContent(assessmentText)}</div>
                      </div>
                    );
                  } else if (hasInAss) {
                    const before = assessmentText.substring(0, assIdx + trigger.length);
                    const after = assessmentText.substring(assIdx + trigger.length);
                    return (
                      <div>
                        <div className="mb-4 text-justify">{renderFormattedContent(kpaText)}</div>
                        <div className="text-justify">{renderFormattedContent(before)}</div>
                        {ratingSystemTable}
                        <div className="text-justify mt-4">{renderFormattedContent(after)}</div>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <div className="mb-4 text-justify">{renderFormattedContent(kpaText)}</div>
                        <div className="text-justify">{renderFormattedContent(assessmentText)}</div>
                        {ratingSystemTable}
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">7. Feedback</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(feedback)}</div>
              </div>

              <div className="landscape-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">8. Timetable and records of review discussions</span>
                </h3>
                <div className="text-xs mb-3 font-sans text-justify mt-1">
                  The Individual must complete the Quarter Review before the due date.  The due dates will be as follows:
                </div>
                <table className="w-full border-collapse border border-black mt-2 mb-4 text-xs font-sans text-center">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1.5">Review Term</th>
                      <th className="border border-black p-1.5">Term Description</th>
                      <th className="border border-black p-1.5">Type of Review</th>
                      <th className="border border-black p-1.5">Activities</th>
                      <th className="border border-black p-1.5">Due Date</th>
                      <th className="border border-black p-1.5">Responsible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewRows.map((r, i) => (
                      <tr key={i}>
                        <td className="border border-black p-1.5 font-bold">{r.term}</td>
                        <td className="border border-black p-1.5">{r.desc}</td>
                        <td className="border border-black p-1.5">{r.type}</td>
                        <td className="border border-black p-1.5 font-medium">{r.activities}</td>
                        <td className="border border-black p-1.5 text-emerald-800 font-semibold">{r.date}</td>
                        <td className="border border-black p-1.5">{r.responsible}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="font-bold mb-1 font-sans">NB:</div>
                <div className="text-justify">{renderFormattedContent(timetable)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">9. Management of poor performance outcomes</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(poorPerformance)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">10. Dispute Resolution</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(dispute)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">11. Amendment of agreement</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(amendment)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">12. Evaluation</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(evaluation)}</div>
              </div>

              <div className="portrait-section page-break-before pt-6">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">16. Signature of parties to the agreement</span>
                </h3>
                <div className="text-justify">{renderFormattedContent(signatures)}</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 mx-4 text-sm font-sans">
                      {/* Employee Box */}
                      <div className="border border-emerald-800/30 bg-emerald-50/5 rounded-2xl p-5 space-y-3 shadow-sm">
                        <span className="text-[10px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100">Officer / Employee Representative</span>
                        <p className="font-bold text-slate-900">Name: {userSignatures.employee || '[Name]'}</p>
                        <p className="text-xs text-slate-500">Designation: Officer Representative</p>
                        <div className="pt-2">
                          <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-20 rounded-xl flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic">
                            [ Place Employee Signature Inside This Box ]
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">Date Signed: ________________________</p>
                      </div>

                      {/* Manager Box */}
                      <div className="border border-emerald-800/30 bg-emerald-50/5 rounded-2xl p-5 space-y-3 shadow-sm">
                        <span className="text-[10px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100">Supervisor / Line Manager Approval</span>
                        <p className="font-bold text-slate-900">Name: {userSignatures.manager || '[Name]'}</p>
                        <p className="text-xs text-slate-500">Designation: Line Manager Representative</p>
                        <div className="pt-2">
                          <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-20 rounded-xl flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic">
                            [ Place Manager Signature Inside This Box ]
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">Date Approved: ________________________</p>
                      </div>

                      {/* HOD Box */}
                      <div className="border border-emerald-800/30 bg-emerald-50/5 rounded-2xl p-5 space-y-3 shadow-sm">
                        <span className="text-[10px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100">Head of Department (HOD)</span>
                        <p className="font-bold text-slate-900">Name: {userSignatures.hod || '[Name]'}</p>
                        <p className="text-xs text-slate-500">Designation: Head of Department</p>
                        <div className="pt-2">
                          <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-20 rounded-xl flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic">
                            [ Place HOD Signature Inside This Box ]
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">Date Cleared: ________________________</p>
                      </div>

                      {/* PMU Box */}
                      <div className="border border-emerald-800/30 bg-emerald-50/5 rounded-2xl p-5 space-y-3 shadow-sm">
                        <span className="text-[10px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100">Performance Management Unit (PMU)</span>
                        <p className="font-bold text-slate-900">Name: {userSignatures.pmu || '[Name]'}</p>
                        <p className="text-xs text-slate-500">Designation: PMU Officer</p>
                        <div className="pt-2">
                          <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-20 rounded-xl flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic">
                            [ Place PMU Stamp / Signature Inside This Box ]
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">Date Captured: ________________________</p>
                      </div>

                      {/* Municipal Manager (MM) Full Span Box */}
                      <div className="col-span-1 md:col-span-2 border border-emerald-800/30 bg-emerald-50/5 rounded-2xl p-5 space-y-3 shadow-sm">
                        <span className="text-[10px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100 text-center">Municipal Manager (MM) Oversight</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="font-bold text-slate-900">Municipal Manager: Cllr. Mike Mzansi (MM Office)</p>
                            <p className="text-xs text-slate-500 mt-1">Designation: Accounting Officer / Municipal Manager</p>
                            <p className="text-[11px] text-slate-650 font-medium mt-4">Date Countersigned: ________________________</p>
                          </div>
                          <div>
                            <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-20 rounded-xl flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic">
                              [ Accounting Officer Executive Signature / Stamp ]
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Subordinate Fire Fighters Signatures */}
                      {subordinateFireFighters.length > 0 && (
                        <div className="col-span-1 md:col-span-2 mt-8">
                          <h3 className="font-extrabold text-amber-800 text-center block mb-6 text-sm uppercase tracking-wide font-sans">
                            <span className="border-b-2 border-amber-800 pb-0.5 px-4 font-black">Subordinate Fire Fighters Reporting to Lead Fire Fighter</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {subordinateFireFighters.map((ff, index) => (
                              <div key={index} className="border border-amber-800/30 bg-amber-50/10 rounded-2xl p-5 space-y-3 shadow-sm">
                                <span className="text-[10px] uppercase font-black text-amber-800 block pb-1 border-b border-amber-100">Subordinate Fire Fighter ({index + 1})</span>
                                <p className="font-bold text-slate-900">Name: {ff.fullName || ff.email || '[Name]'}</p>
                                <p className="text-xs text-slate-500">Designation: {ff.jobFunction || 'Fire Fighter'}</p>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                  <div>
                                    <div className="border-2 border-dashed border-amber-800/15 bg-white h-20 rounded-xl flex items-center justify-center text-[9px] text-amber-700/60 font-mono italic text-center p-2">
                                      [ Initial Signature of {ff.fullName?.split(' ')[0] || 'Subordinate'} ]
                                    </div>
                                    <p className="text-[10px] text-slate-600 font-medium mt-1">Date Signed: _______________</p>
                                  </div>
                                  <div>
                                    <div className="border-2 border-dashed border-emerald-800/15 bg-white h-20 rounded-xl flex items-center justify-center text-[9px] text-emerald-700/60 font-mono italic text-center p-2">
                                      [ Review by Lead Fire Fighter ]
                                    </div>
                                    <p className="text-[10px] text-slate-600 font-medium mt-1">Date Reviewed: _______________</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

              {annexureA && (
                <div className="landscape-section page-break-before">
                  <h2 className="text-lg font-black text-emerald-800 text-center mb-6 uppercase tracking-wider font-sans">
                    <span className="border-b-2 border-emerald-800 pb-0.5 px-4">Annexure A: Performance Plan</span>
                  </h2>
                  {realPlanItems.length > 0 ? (
                    <table className="w-full border-collapse border border-black mt-2 mb-4 text-[10px] font-sans">
                      <thead>
                        <tr className="bg-gray-100 font-bold text-center">
                          <th className="border border-black p-1 w-10">No</th>
                          <th className="border border-black p-1 text-left w-32">Strategic Goal</th>
                          <th className="border border-black p-1 text-left w-48">KPI Description</th>
                          <th className="border border-black p-1 w-20">KPA</th>
                          <th className="border border-black p-1 w-20">Baseline</th>
                          <th className="border border-black p-1 w-20">Budget</th>
                          <th className="border border-black p-1 w-24">Annual Target</th>
                          <th className="border border-black p-1 w-12">Q1 Target</th>
                          <th className="border border-black p-1 w-12">Q2 Target</th>
                          <th className="border border-black p-1 w-12">Midterm Review</th>
                          <th className="border border-black p-1 w-12">Q3 Target</th>
                          <th className="border border-black p-1 w-12">Q4 Target</th>
                          <th className="border border-black p-1 w-28">POE (Evidence)</th>
                          <th className="border border-black p-1 w-10">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {realPlanItems.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="border border-black p-1 text-center font-bold">{item.kpiNo || idx + 1}</td>
                            <td className="border border-black p-1">{item.strategicGoal}</td>
                            <td className="border border-black p-1">{item.kpi}</td>
                            <td className="border border-black p-1 text-center text-slate-500">{item.kpa || 'N/A'}</td>
                            <td className="border border-black p-1 text-center">{item.baseline}</td>
                            <td className="border border-black p-1 text-center font-bold text-emerald-800 bg-emerald-50/10">{item.budget || 'N/A'}</td>
                            <td className="border border-black p-1 text-center font-bold text-emerald-900 bg-emerald-50/20">{item.annualTarget || 'N/A'}</td>
                            <td className="border border-black p-1 text-center">{item.q1Target}</td>
                            <td className="border border-black p-1 text-center">{item.q2Target}</td>
                            <td className="border border-black p-1 text-center font-bold bg-indigo-50/40">{item.midtermTarget}</td>
                            <td className="border border-black p-1 text-center">{item.q3Target}</td>
                            <td className="border border-black p-1 text-center">{item.q4Target}</td>
                            <td className="border border-black p-1 text-slate-700">{item.annualRequiredPoe || item.poe || 'N/A'}</td>
                            <td className="border border-black p-1 text-center font-bold">{item.weighting}%</td>
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td colSpan={13} className="border border-black p-1 text-right uppercase">Total Performance Weight</td>
                          <td className="border border-black p-1 text-center">{realPlanItems.reduce((acc, curr) => acc + (Number(curr.weighting) || 0), 0)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-400 text-center text-gray-500 italic">
                      There are no active targets in your Performance Plan. Please add and record plans in the Performance Plan module.
                    </div>
                  )}
                </div>
              )}

              {annexureB && (
                <div className="landscape-section page-break-before">
                  <h2 className="text-lg font-black text-emerald-800 text-center mb-6 uppercase tracking-wider font-sans">
                    <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">Annexure B: Personal Development Plan (PDP)</span>
                  </h2>
                  <div className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-tight">Statutory PDP Competency & Learning Matrix Table</div>
                  <table className="w-full border-collapse border border-black mt-2 mb-4 text-xs font-sans">
                    <thead>
                      <tr className="bg-gray-100 font-bold">
                        <th className="border border-black p-1.5 text-left">Core Skills Gap</th>
                        <th className="border border-black p-1.5 text-left">Expected Outcomes</th>
                        <th className="border border-black p-1.5 text-left">Suggested Training</th>
                        <th className="border border-black p-1.5 text-left">Delivery Mode</th>
                        <th className="border border-black p-1.5 w-20 text-center">Timeframe</th>
                        <th className="border border-black p-1.5 text-left">Work Opportunity</th>
                        <th className="border border-black p-1.5 text-left">Support Person</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realPdpItems.length > 0 ? (
                        realPdpItems.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="border border-black p-1.5 font-bold">{item.skillsGap}</td>
                            <td className="border border-black p-1.5 text-slate-705">{item.outcomes}</td>
                            <td className="border border-black p-1.5 italic text-slate-800">{item.suggestedTraining}</td>
                            <td className="border border-black p-1.5">{item.modeOfDelivery}</td>
                            <td className="border border-black p-1.5 text-center">{item.timeFrame}</td>
                            <td className="border border-black p-1.5 text-slate-650">{item.workOpportunity}</td>
                            <td className="border border-black p-1.5 font-semibold text-slate-900">{item.supportPerson}</td>
                          </tr>
                        ))
                      ) : (
                        // If no items exist, render a clean structural empty skeleton matrix as requested
                        Array.from({ length: 3 }).map((_, idx) => (
                          <tr key={`pdp-empty-row-${idx}`}>
                            <td className="border border-black p-3 text-slate-400 italic">No custom competence gaps recorded yet</td>
                            <td className="border border-black p-3">-</td>
                            <td className="border border-black p-3">-</td>
                            <td className="border border-black p-3">-</td>
                            <td className="border border-black p-3 text-center">-</td>
                            <td className="border border-black p-3">-</td>
                            <td className="border border-black p-3">-</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="landscape-section page-break-before">
                <h3 className="font-extrabold text-emerald-800 text-center block mb-4 text-sm uppercase tracking-wide font-sans">
                  <span className="border-b-2 border-emerald-800 pb-0.5 px-4 font-black">Annexure C: Disclosure of Interest</span>
                </h3>
                <table className="w-full border-collapse border border-black mt-2 mb-4 text-xs font-sans">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-left">Name of Business</th>
                      <th className="border border-black p-2 w-32">CK Number</th>
                      <th className="border border-black p-2 w-24">% Owned</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-black p-3"></td><td className="border border-black p-3"></td><td className="border border-black p-3"></td></tr>
                    <tr><td className="border border-black p-3"></td><td className="border border-black p-3"></td><td className="border border-black p-3"></td></tr>
                    <tr><td className="border border-black p-3"></td><td className="border border-black p-3"></td><td className="border border-black p-3"></td></tr>
                  </tbody>
                </table>
                <div className="whitespace-pre-wrap text-justify mb-6">{annexureC}</div>

                <div className="mt-8 pt-6 border-t border-dashed border-gray-300">
                  <h4 className="font-bold text-xs uppercase mb-4 tracking-wider text-emerald-800">Signing and Authorization</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    {/* Employee Signature Box */}
                    <div className="border border-black p-4 flex flex-col justify-between bg-slate-50/50 rounded-lg min-h-[160px]">
                      <div>
                        <span className="font-bold block text-[11px] text-gray-900 border-b border-gray-200 pb-1 mb-2">1. Employee Signature</span>
                        <div className="text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Name: {employeeUser?.fullName || currentUser?.fullName || 'N/A'}</div>
                        <div className="text-gray-500 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">Email: {employeeUser?.email || currentUser?.email || 'N/A'}</div>
                      </div>
                      <div className="mt-4 flex flex-col items-center justify-center min-h-[60px]">
                        {employeeUser?.signatureData ? (
                          <img 
                            src={employeeUser.signatureData} 
                            alt="Employee Signature" 
                            className="max-h-12 object-contain py-1" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full flex flex-col items-center">
                            <div className="w-full border-t border-black border-dotted my-1"></div>
                            <span className="text-[9px] text-slate-400 text-center italic leading-tight block">No signature uploaded. System automatically displays here once uploaded in User Management.</span>
                          </div>
                        )}
                        <div className="text-[10px] font-bold text-gray-600 mt-1 uppercase">Date: 29 July 2026</div>
                      </div>
                    </div>

                    {/* Manager Signature Box */}
                    <div className="border border-black p-4 flex flex-col justify-between bg-slate-50/50 rounded-lg min-h-[160px]">
                      <div>
                        <span className="font-bold block text-[11px] text-gray-900 border-b border-gray-200 pb-1 mb-2">2. Manager Signature</span>
                        <div className="text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Name: {managerUser?.fullName || employeeUser?.manager || currentUser?.manager || 'Supervisor/Manager'}</div>
                        <div className="text-gray-500 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">Email: {managerUser?.email || 'Pending identification'}</div>
                      </div>
                      <div className="mt-4 flex flex-col items-center justify-center min-h-[60px]">
                        {managerUser?.signatureData ? (
                          <img 
                            src={managerUser.signatureData} 
                            alt="Manager Signature" 
                            className="max-h-12 object-contain py-1" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full flex flex-col items-center">
                            <div className="w-full border-t border-black border-dotted my-1"></div>
                            <span className="text-[9px] text-slate-400 text-center italic leading-tight block">No signature uploaded. System automatically displays here once uploaded in User Management.</span>
                          </div>
                        )}
                        <div className="text-[10px] font-bold text-gray-600 mt-1 uppercase">Date: 29 July 2026</div>
                      </div>
                    </div>

                    {/* PMS Official Signature Box */}
                    <div className="border border-black p-4 flex flex-col justify-between bg-slate-50/50 rounded-lg min-h-[160px]">
                      <div>
                        <span className="font-bold block text-[11px] text-gray-900 border-b border-gray-200 pb-1 mb-2">3. PMS Official Signature</span>
                        <div className="text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Name: {pmsOfficial?.fullName || 'Mrs. Annelize van Dyk'}</div>
                        <div className="text-gray-500 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">Role: {pmsOfficial?.jobFunction || 'PMS Coordinator'}</div>
                      </div>
                      <div className="mt-4 flex flex-col items-center justify-center min-h-[60px]">
                        {pmsOfficial?.signatureData ? (
                          <img 
                            src={pmsOfficial.signatureData} 
                            alt="PMS Official Signature" 
                            className="max-h-12 object-contain py-1" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full flex flex-col items-center">
                            <div className="w-full border-t border-black border-dotted my-1"></div>
                            <span className="text-[9px] text-slate-400 text-center italic leading-tight block">No signature uploaded. System automatically displays here once uploaded in User Management.</span>
                          </div>
                        )}
                        <div className="text-[10px] font-bold text-gray-600 mt-1 uppercase">Date: 29 July 2026</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          {/* Print/Export Bar */}
          <div className="absolute top-4 right-4 print:hidden flex gap-2 z-10">
            <button
              onClick={saveToProfile}
              disabled={saving}
              className={`text-white px-3 py-2 text-xs font-bold rounded-lg shadow-lg transition flex items-center gap-1.5 ${
                saveStatus === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                saveStatus === 'error' ? 'bg-rose-600 hover:bg-rose-700' :
                'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Save className="w-4 h-4" /> 
              {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved to Profile!' : 'Save to Profile'}
            </button>
            <button
              onClick={saveAsTemplateOne}
              disabled={saving}
              className={`text-white px-3 py-2 text-xs font-bold rounded-lg shadow-lg transition flex items-center gap-1.5 ${
                templateSaveStatus === 'success' ? 'bg-amber-600 hover:bg-amber-700' :
                templateSaveStatus === 'error' ? 'bg-rose-600 hover:bg-rose-700' :
                'bg-amber-500 hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Save className="w-4 h-4" /> 
              {saving ? 'Saving...' : templateSaveStatus === 'success' ? 'Template 1 Saved!' : 'Save as Template 1'}
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="bg-rose-600 text-white px-3 py-2 text-xs font-bold rounded-lg shadow-lg hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {isExportingPDF ? 'Exporting PDF...' : 'Export to PDF'}
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExportingWord}
              className="bg-blue-600 text-white px-3 py-2 text-xs font-bold rounded-lg shadow-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExportingWord ? 'Exporting Word...' : 'Export to Word'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-800 text-white px-3 py-2 text-xs font-bold rounded-lg shadow-lg hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Direct Print
            </button>
          </div>

            <style>{`
            @media print {
              @page { 
                size: landscape;
                margin: 1cm;
                margin-bottom: 2.2cm; 
              }
              .portrait-section, .landscape-section {
                width: 100% !important;
                max-width: 100% !important;
                display: block;
                box-sizing: border-box;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
              }
              .page-break-before {
                page-break-before: always !important;
                break-before: page !important;
              }
              table {
                width: 100% !important;
                table-layout: auto !important;
                border-collapse: collapse !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
              }
              th, td {
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                font-size: 10px !important;
                padding: 4px !important;
              }
              body {
                counter-reset: page 0 !important;
              }
              #fixed-footer {
                display: flex !important;
                position: fixed !important;
                bottom: 0px !important;
                left: 0 !important;
                right: 0 !important;
                justify-content: space-between !important;
                font-size: 9px !important;
                border-top: 1px dashed #cbd5e1 !important;
                padding-top: 6px !important;
                padding-bottom: 4px !important;
                background-color: transparent !important;
                width: 100% !important;
                box-sizing: border-box !important;
                flex-wrap: wrap !important;
                column-gap: 1.5rem !important;
                row-gap: 0.5rem !important;
              }
              #fixed-footer .counter::after {
                counter-increment: page !important;
                content: " " counter(page) !important;
              }
            }
          `}</style>
          
          <div id="fixed-footer" className="hidden text-gray-500 w-full px-8 flex-wrap justify-center gap-x-6 gap-y-2">
            <div className="whitespace-nowrap">Lead FF ({currentUser.fullName?.split(' ')[0] || 'Lead'}): ________</div>
            {subordinateFireFighters.map((ff, index) => (
              <div key={index} className="whitespace-nowrap">
                {ff.fullName?.split(' ')[0] || ff.email?.split('@')[0]}: ________
              </div>
            ))}
