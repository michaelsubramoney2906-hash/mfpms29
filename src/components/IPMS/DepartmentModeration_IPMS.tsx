import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileSearch, 
  FileText, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  ShieldAlert,
  FolderOpen, 
  Eye, 
  Folder, 
  AlertCircle, 
  X, 
  Check, 
  Save, 
  Download, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileImage, 
  FileCode,
  Send
} from 'lucide-react';
import { OfficeDocumentViewer } from './OfficeDocumentViewer';
import { JSCDpmcReviewSection } from './JSCModules';
import { CoreCompetenciesDpmcReviewSection } from './CoreCompetenciesSelfEvaluation';

interface Props {
  currentUser: any;
  activeTenantId: string;
}

export function DepartmentModerationIPMS({ currentUser, activeTenantId }: Props) {
  const [dpmcSubTab, setDpmcSubTab] = useState<'kpi' | 'jsc' | 'competencies'>('kpi');
  const [loading, setLoading] = useState(true);
  const [teamPlans, setTeamPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeKPIId, setActiveKPIId] = useState<string | null>(null);
  const [activeQuarterTab, setActiveQuarterTab] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [dpmcLedger, setDpmcLedger] = useState<any[]>([]);
  const [ccrItems, setCcrItems] = useState<any[]>([]);

  // Load and merge user-specific Core Competency Requirements (CCRs)
  useEffect(() => {
    if (!selectedPlan?.userId) {
      setCcrItems([]);
      return;
    }

    const loadCcrItems = async () => {
      try {
        const res = await fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${selectedPlan.userId}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedComps = data.competencies || [];

          // Merge with selectedPlan.plan.ccrItems if it exists
          const existingCcrs = selectedPlan.plan?.ccrItems || selectedPlan.plan?.competencies || [];
          
          const merged = fetchedComps.map((fc: any, index: number) => {
            const matched = existingCcrs.find((ec: any) => ec.id === fc.id || ec.jscNo === fc.jscNo || ec.competency === fc.competency);
            return {
              id: fc.id || `ccr-${index}`,
              jscNo: fc.jscNo || `JSC-${index + 1}`,
              competency: fc.competency,
              definition: fc.definition,
              level: fc.level,
              weight: fc.weight || fc.weighting || 0,
              myScore: matched?.myScore || fc.myScore || fc.score || '-',
              motivation: matched?.motivation || fc.motivation || '-',
              supervisorRating: matched?.supervisorRating || fc.supervisorRating || fc.supervisorScore || '-',
              supervisorComment: matched?.supervisorComment || fc.supervisorComment || fc.supervisorReview || '-',
              panelMembersScore: matched?.panelMembersScore || fc.panelMembersScore || '-',
              panelMembersComment: matched?.panelMembersComment || fc.panelMembersComment || '-',
              dpmcRating: matched?.dpmcRating || '',
              dpmcRecommendation: matched?.dpmcRecommendation || '',
              mpmcFinalScore: matched?.mpmcFinalScore || '',
              mpmcResolution: matched?.mpmcResolution || ''
            };
          });

          setCcrItems(merged);
        } else {
          setCcrItems(selectedPlan.plan?.ccrItems || selectedPlan.plan?.competencies || []);
        }
      } catch (e) {
        console.error("Error loading ccr items", e);
        setCcrItems(selectedPlan.plan?.ccrItems || selectedPlan.plan?.competencies || []);
      }
    };

    loadCcrItems();
  }, [selectedPlan?.userId, activeTenantId]);

  const updateCcrReview = (id: string, field: string, value: string) => {
    setCcrItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, [field]: value } : item);
      // Sync straight to selectedPlan.plan's content so any save picks it up
      if (selectedPlan && selectedPlan.plan) {
        selectedPlan.plan.ccrItems = updated;
      }
      return updated;
    });
  };

  // Check authorization
  const isAuthorized = 
    (currentUser.email === 'dpmc@mzansiflow.co.za' ||
    currentUser.email === 'test.dpmc@local' ||
    currentUser.role === 'admin' || 
    currentUser.systemRole === 'Global Administrator' ||
    (currentUser.systemRole && currentUser.systemRole.toLowerCase().includes('admin')) ||
    (currentUser.role && currentUser.role.toLowerCase().includes('admin')) ||
    currentUser.email === 'mike@mzansiflow.co.za' ||
    (currentUser.jobFunction && currentUser.jobFunction.toLowerCase().includes('committee')) ||
    (currentUser.department && currentUser.department.toLowerCase().includes('moderation')) ||
    (currentUser.jobFunction && currentUser.jobFunction.toLowerCase().includes('manager'))) &&
    currentUser.email !== 'user@mzansiflow.co.za';

  useEffect(() => {
    if (isAuthorized) {
      fetchTeamPlans();
      fetchDpmcLedger();
    } else {
      setLoading(false);
    }
  }, [activeTenantId, currentUser, isAuthorized]);

  const fetchDpmcLedger = async () => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/dpmc-ledger?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setDpmcLedger(data.logs || []);
      }
    } catch (e) {
      console.error("fetchDpmcLedger err", e);
    }
  };

  const fetchTeamPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/team-pplans?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const plans = data.teamPlans || [];
        setTeamPlans(plans.filter((p: any) => 
          p.plan.metadata?.internalAuditStatus === 'Audited' || 
          p.plan.metadata?.internalAuditStatus === 'Pushed to DPMC' ||
          p.plan.metadata?.internalAuditStatus === 'Pushed to Moderation' ||
          p.plan.metadata?.dpmcStatus === 'Moderated' ||
          p.plan.metadata?.dpmcStatus === 'Pushed to Stakeholders'
        ));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (tp: any, onLoaded?: () => void) => {
    // We must fetch the individual plan to get the full documents (including dataUrl)
    // because dataUrl is stripped from the team-pplans endpoint.
    setSelectedPlan(tp); 
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${tp.userId}`);
      if (res.ok) {
        const fullPlan = await res.json();
        if (fullPlan && fullPlan.items) {
          setSelectedPlan({ userId: tp.userId, plan: fullPlan });
        }
      }
    } catch (e) {
      console.error("Failed to load full plan", e);
    } finally {
      if (onLoaded) {
        setTimeout(onLoaded, 100);
      }
    }
  };

  useEffect(() => {
    if (selectedPlan && selectedPlan.plan && Array.isArray(selectedPlan.plan.items) && selectedPlan.plan.items.length > 0) {
      if (!activeKPIId || !selectedPlan.plan.items.find((x: any) => x.id === activeKPIId)) {
        setActiveKPIId(selectedPlan.plan.items[0].id);
      }
    } else {
      setActiveKPIId(null);
    }
  }, [selectedPlan]);

  const createMockFileUrl = (name: string, mimeType: string, holderName: string) => {
    const ext = name.split('.').pop()?.toUpperCase() || 'PDF';
    
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="100%" height="100%">
    <rect width="100%" height="100%" fill="#f8fafc" />
    <rect x="30" y="30" width="740" height="1040" fill="white" stroke="#334155" stroke-width="4" rx="8" />
    <rect x="40" y="40" width="720" height="1020" fill="none" stroke="#cbd5e1" stroke-width="1" rx="6" />
    
    <path d="M 40 40 L 760 40 L 760 180 L 40 180 Z" fill="#0f172a" />
    
    <text x="80" y="100" font-family="sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="1">MZANSIFLOW MUNICIPALITY</text>
    <text x="80" y="130" font-family="sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="2">DIRECTORATE OF PERFORMANCE AND COMPLIANCE AUDIT</text>
    <text x="80" y="155" font-family="sans-serif" font-size="9" font-weight="500" fill="#64748b">SECURE TRANSACTION BLOCK ID: POE-VERIFIED</text>
    
    <text x="80" y="240" font-family="sans-serif" font-size="18" font-weight="800" fill="#1e293b">PORTFOLIO OF EVIDENCE (PoE) VERIFICATION REPORT</text>
    <line x1="80" y1="255" x2="720" y2="255" stroke="#cbd5e1" stroke-width="2" />
    
    <g transform="translate(80, 280)">
      <rect x="0" y="0" width="640" height="150" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="8" />
      
      <text x="20" y="30" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748b">DOCUMENT FILENAME</text>
      <text x="20" y="50" font-family="sans-serif" font-size="13" font-weight="800" fill="#0f172a">${name}</text>
      
      <text x="340" y="30" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748b">ASSIGNED HOLDER</text>
      <text x="340" y="50" font-family="sans-serif" font-size="13" font-weight="800" fill="#0f172a">${holderName}</text>
      
      <text x="20" y="95" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748b">FILE EXTENSION</text>
      <text x="20" y="115" font-family="sans-serif" font-size="13" font-weight="800" fill="#4f46e5">${ext}</text>
      
      <text x="340" y="95" font-family="sans-serif" font-size="11" font-weight="700" fill="#64748b">VERIFICATION TIMESTAMP</text>
      <text x="340" y="115" font-family="sans-serif" font-size="12" font-weight="800" fill="#0f172a">${new Date().toLocaleString()}</text>
    </g>
    
    <text x="80" y="475" font-family="sans-serif" font-size="14" font-weight="800" fill="#0f172a">1. AUDIT EVIDENCE INTEGRITY DECLARATION</text>
    <text x="80" y="505" font-family="serif" font-size="13" font-style="italic" fill="#334155">"We hereby submit and verify that the performance objectives outlined in the target municipal ledger</text>
    <text x="80" y="525" font-family="serif" font-size="13" font-style="italic" fill="#334155">for this quarter have been fully realized. The files attached are verified outputs of our operational</text>
    <text x="80" y="545" font-family="serif" font-size="13" font-style="italic" fill="#334155">duties, aligning with legislated mSCOA frameworks and South African Local Government rules."</text>
    
    <text x="80" y="600" font-family="sans-serif" font-size="14" font-weight="800" fill="#0f172a">2. COMPLIANCE STAMP AND VERIFICATION SIGN-OFF</text>
    
    <g transform="translate(480, 640)">
      <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="8,4" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="#10b981" stroke-width="1.5" />
      <rect x="40" y="85" width="120" height="30" fill="#10b981" rx="4" />
      <text x="100" y="105" font-family="sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">APPROVED</text>
      <text x="100" y="145" font-family="sans-serif" font-size="9" font-weight="700" fill="#10b981" text-anchor="middle">AUDITED SYSTEM</text>
    </g>
    
    <g transform="translate(80, 640)">
      <line x1="0" y1="80" x2="250" y2="80" stroke="#475569" stroke-width="1.5" stroke-dasharray="4,4" />
      <text x="0" y="100" font-family="sans-serif" font-size="11" font-weight="700" fill="#475569">MUNICIPAL COMPLIANCE DESK</text>
      <text x="0" y="115" font-family="sans-serif" font-size="9" font-weight="500" fill="#94a3b8">AUTHORIZED SIGN-OFF ENVELOPE</text>
    </g>
    
    <line x1="80" y1="960" x2="720" y2="960" stroke="#cbd5e1" stroke-width="2" />
    <text x="80" y="990" font-family="sans-serif" font-size="10" font-weight="700" fill="#64748b">DOCUMENT CLASS: SECURE REGULATORY PROOF (CLASS-A)</text>
    <text x="80" y="1010" font-family="sans-serif" font-size="9" font-weight="500" fill="#94a3b8">This document is electronically signed and secured under South African Municipal Systems guidelines.</text>
    
    <text x="720" y="990" font-family="sans-serif" font-size="10" font-weight="900" fill="#4f46e5" text-anchor="end">MZANSIFLOW COMPLIANCE PORTAL</text>
  </svg>`;

    try {
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    } catch (e) {
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
    }
  };

  const handleGenerateSamplePoes = () => {
    if (!selectedPlan) return;
    
    const holder = selectedPlan.plan.metadata?.name || 'Employee';
    const mockFilesByQuarter = {
      Q1: [
        { id: `mock-pdf-q1-${selectedPlan.userId}`, name: 'Q1_ServiceDelivery_Operational_Audit.pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), uploadedBy: holder, size: 1420500, dataUrl: createMockFileUrl('Q1_ServiceDelivery_Operational_Audit.pdf', 'application/pdf', holder) },
        { id: `mock-xlsx-q1-${selectedPlan.userId}`, name: 'Q1_mSCOA_Ledger_Balance_Sheet.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploadedAt: new Date().toISOString(), uploadedBy: holder, size: 840200, dataUrl: createMockFileUrl('Q1_mSCOA_Ledger_Balance_Sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', holder) }
      ],
      Q2: [
        { id: `mock-pdf-q2-${selectedPlan.userId}`, name: 'Q2_Consolidated_Financial_Statement_Final.pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), uploadedBy: holder, size: 2100400, dataUrl: createMockFileUrl('Q2_Consolidated_Financial_Statement_Final.pdf', 'application/pdf', holder) },
        { id: `mock-png-q2-${selectedPlan.userId}`, name: 'CoGTA_Official_Acknowledge_Receipt.png', mimeType: 'image/png', uploadedAt: new Date().toISOString(), uploadedBy: holder, size: 520100, dataUrl: createMockFileUrl('CoGTA_Official_Acknowledge_Receipt.png', 'image/png', holder) }
      ],
      Q3: [
        { id: `mock-xlsx-q3-${selectedPlan.userId}`, name: 'Q3_WaterQuality_And_Purity_LabLogs.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploadedAt: new Date().toISOString(), uploadedBy: holder, size: 950600, dataUrl: createMockFileUrl('Q3_WaterQuality_And_Purity_LabLogs.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', holder) },
        { id: `mock-pdf-q3-${selectedPlan.userId}`, name: 'Internal_Audit_Committee_SignOff_Chamber.pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), uploadedBy: holder, size: 1250100, dataUrl: createMockFileUrl('Internal_Audit_Committee_SignOff_Chamber.pdf', 'application/pdf', holder) }
      ],
      Q4: [
        { id: `mock-pdf-q4-${selectedPlan.userId}`, name: 'Q4_Annual_Report_Full_Performance_Metric.pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), uploadedBy: holder, size: 3400200, dataUrl: createMockFileUrl('Q4_Annual_Report_Full_Performance_Metric.pdf', 'application/pdf', holder) },
        { id: `mock-docx-q4-${selectedPlan.userId}`, name: 'Local_Council_Resolution_Minutes_Signed.docx', mimeType: 'application/msword', uploadedAt: new Date().toISOString(), uploadedBy: holder, size: 680400, dataUrl: createMockFileUrl('Local_Council_Resolution_Minutes_Signed.docx', 'application/msword', holder) }
      ]
    };

    const updatedItems = selectedPlan.plan.items.map((item: any, idx: number) => {
      return {
        ...item,
        q1Poe: item.q1Poe ? item.q1Poe : `Performance delivery output verified against Q1 targets. Reference ID: DPMC-DEL-0${idx+1}-Q1`,
        q2Poe: item.q2Poe ? item.q2Poe : `Official CoGTA alignment file and consolidated ledger sheets. Reference ID: DPMC-FIN-0${idx+1}-Q2`,
        q3Poe: item.q3Poe ? item.q3Poe : `Internal audit executive brief and environmental log certificates. Reference ID: DPMC-AUD-0${idx+1}-Q3`,
        q4Poe: item.q4Poe ? item.q4Poe : `Full annual oversight report and signed council minutes. Reference ID: DPMC-GOV-0${idx+1}-Q4`,
        q1PoeDocs: item.q1PoeDocs && item.q1PoeDocs.length > 0 ? item.q1PoeDocs : mockFilesByQuarter.Q1,
        q2PoeDocs: item.q2PoeDocs && item.q2PoeDocs.length > 0 ? item.q2PoeDocs : mockFilesByQuarter.Q2,
        q3PoeDocs: item.q3PoeDocs && item.q3PoeDocs.length > 0 ? item.q3PoeDocs : mockFilesByQuarter.Q3,
        q4PoeDocs: item.q4PoeDocs && item.q4PoeDocs.length > 0 ? item.q4PoeDocs : mockFilesByQuarter.Q4,
        q1PoeStatus: item.q1PoeStatus || 'Verified',
        q2PoeStatus: item.q2PoeStatus || 'Verified',
        q3PoeStatus: item.q3PoeStatus || 'Verified',
        q4PoeStatus: item.q4PoeStatus || 'Verified',
      };
    });

    setSelectedPlan({
      ...selectedPlan,
      plan: {
        ...selectedPlan.plan,
        items: updatedItems
      }
    });

    alert("Prism Verification Material Generated! Simulated portfolios, files, and transaction audits are now available for all KPIs. Open any quarter's PoE folder to inspect.");
  };

  const getFileIconComponent = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (ext === 'xls' || ext === 'xlsx') return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <FileImage className="w-5 h-5 text-blue-500" />;
    return <FileCode className="w-5 h-5 text-indigo-500" />;
  };

  const updateReview = (id: string, field: string, value: string) => {
    if (!selectedPlan) return;
    setSelectedPlan({
      ...selectedPlan,
      plan: {
        ...selectedPlan.plan,
        items: selectedPlan.plan.items.map((item: any) => 
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    });
  };

  const handleSaveReview = async () => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const payload = { 
        ...selectedPlan.plan,
        ccrItems: ccrItems
      };
      payload.metadata.dpmcStatus = 'Moderated';

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Calculate true blended score: KPI (80%) + CCR (20%)
      const totalKpiCalculated = payload.items?.reduce((sum: number, k: any) => sum + ((parseFloat(k.mpmcFinalScore || k.dpmcRating || k.managerScore || '0') * parseFloat(k.weighting || '0')) / 5), 0) || 0;
      const totalKpiWeightTimes5 = (payload.items?.reduce((sum: number, k: any) => sum + (parseFloat(k.weighting || '0')), 0) || 0) * 5;
      const kpiFinalWeightedScore = totalKpiWeightTimes5 > 0 ? ((totalKpiCalculated / totalKpiWeightTimes5) * 80) : 0;

      const totalCcrCalculatedNum = ccrItems.reduce((sum, item) => {
        const rating = parseFloat(item.mpmcFinalScore || item.dpmcRating || item.supervisorRating || item.myScore || '0');
        const wt = parseFloat(item.weight || '0');
        return sum + ((rating * wt) / 5);
      }, 0);
      const totalCcrWeight = ccrItems.reduce((sum, item) => sum + parseFloat(item.weight || '0'), 0);
      const ccrFinalWeightedScoreNum = totalCcrWeight > 0 ? ((totalCcrCalculatedNum / (totalCcrWeight * 5)) * 20) : 0;

      const trueCombinedScore = (kpiFinalWeightedScore + ccrFinalWeightedScoreNum).toFixed(2);

      const newLedgerItem = {
        userId: selectedPlan.userId,
        name: payload.metadata?.name || selectedPlan.userId,
        position: payload.metadata?.position || 'Employee',
        department: payload.metadata?.department || 'Department',
        totalScore: trueCombinedScore,
        status: 'Moderated',
        updatedAt: new Date().toISOString(),
        isPushed: false, 
        pushedToUser: false,
        pushedToManager: false,
        pushedToAuditor: false,
      };

      const updatedLedger = [
        newLedgerItem,
        ...dpmcLedger.filter((item: any) => item.userId !== selectedPlan.userId)
      ];

      await fetch(`/api/tenant/${activeTenantId}/dpmc-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: updatedLedger })
      });

      setDpmcLedger(updatedLedger);
      alert("DPMC Review successfully saved and logged to the Moderation Ledger with true blended rating!");
      
      const updatedPlans = teamPlans.map(tp => 
        tp.userId === selectedPlan.userId ? { ...tp, plan: payload } : tp
      );
      setTeamPlans(updatedPlans);
      setSelectedPlan({ ...selectedPlan, plan: payload });
    } catch (e) {
      console.error(e);
      alert("Error saving moderation review.");
    } finally {
      setSaving(false);
    }
  };

  const handlePushModeration = async () => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const payload = { 
        ...selectedPlan.plan,
        ccrItems: ccrItems
      };
      payload.metadata.dpmcStatus = 'Pushed to Stakeholders';

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Calculate true blended score for ledger
      const totalKpiCalculated = payload.items?.reduce((sum: number, k: any) => sum + ((parseFloat(k.mpmcFinalScore || k.dpmcRating || k.managerScore || '0') * parseFloat(k.weighting || '0')) / 5), 0) || 0;
      const totalKpiWeightTimes5 = (payload.items?.reduce((sum: number, k: any) => sum + (parseFloat(k.weighting || '0')), 0) || 0) * 5;
      const kpiFinalWeightedScore = totalKpiWeightTimes5 > 0 ? ((totalKpiCalculated / totalKpiWeightTimes5) * 80) : 0;

      const totalCcrCalculatedNum = ccrItems.reduce((sum, item) => {
        const rating = parseFloat(item.mpmcFinalScore || item.dpmcRating || item.supervisorRating || item.myScore || '0');
        const wt = parseFloat(item.weight || '0');
        return sum + ((rating * wt) / 5);
      }, 0);
      const totalCcrWeight = ccrItems.reduce((sum, item) => sum + parseFloat(item.weight || '0'), 0);
      const ccrFinalWeightedScoreNum = totalCcrWeight > 0 ? ((totalCcrCalculatedNum / (totalCcrWeight * 5)) * 20) : 0;

      const trueCombinedScore = (kpiFinalWeightedScore + ccrFinalWeightedScoreNum).toFixed(2);

      // Update Ledger Status to Pushed
      const updatedLedger = dpmcLedger.map((item: any) => {
        if (item.userId === selectedPlan.userId) {
          return {
            ...item,
            totalScore: trueCombinedScore,
            status: 'Pushed to Stakeholders',
            isPushed: true,
            pushedToUser: true,
            pushedToManager: true,
            pushedToAuditor: true,
            pushedAt: new Date().toISOString()
          };
        }
        return item;
      });

      await fetch(`/api/tenant/${activeTenantId}/dpmc-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: updatedLedger })
      });

      setDpmcLedger(updatedLedger);

      // Dispatch notifications to all 4 stakeholders: Submitter, Manager, Internal Auditor, DPMC
      const employeeEmail = selectedPlan.userId;
      const employeeName = payload.metadata?.name || employeeEmail;
      let managerEmail = payload.metadata?.manager;
      if (!managerEmail && Array.isArray(payload.metadata?.history)) {
        const mgrLog = payload.metadata.history.find((h: any) => h.role?.toLowerCase().includes('manager') || h.userEmail?.includes('khuboni'));
        if (mgrLog) managerEmail = mgrLog.userEmail;
      }
      if (employeeEmail.toLowerCase().includes('shabangusm')) {
        managerEmail = 'mahlanguml@nkangaladm.gov.za';
      } else if (!managerEmail) {
        managerEmail = 'khuboniy@nkangaladm.gov.za';
      }

      const dpmcRecipients = [
        { email: employeeEmail, name: employeeName },
        { email: managerEmail, name: 'Line Manager' },
        { email: 'internal_audit', name: 'Internal Audit Committee' },
        { email: 'dpmc', name: 'DPMC Moderation Committee' }
      ];

      for (const rec of dpmcRecipients) {
        await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              senderEmail: currentUser.email || 'dpmc@nkangaladm.gov.za',
              senderName: currentUser.fullName || currentUser.full_name || 'DPMC Moderation Committee',
              recipientEmail: rec.email,
              recipientName: rec.name,
              title: `⚖️ DPMC Moderation Outcome: Final Blended Rating ${trueCombinedScore}/100% for ${employeeName}`,
              message: `Departmental Performance Moderation Committee (DPMC) has finalized performance moderation for ${employeeName} (${employeeEmail}).\n\n` +
                       `Final Blended Score: ${trueCombinedScore}/100%\n` +
                       `Status: Pushed to Stakeholders\n\n` +
                       `Moderated scores have been recorded and synchronized in all stakeholder inboxes.`,
              actionType: 'approval',
              senderCapacity: 'dpmc_committee',
              employeeEmail: employeeEmail
            }
          })
        });
      }

      alert("Moderated Plan successfully pushed and distributed back to Subordinate/User, Manager, Internal Auditor, and DPMC!");
      
      const updatedPlans = teamPlans.map(tp => 
        tp.userId === selectedPlan.userId ? { ...tp, plan: payload } : tp
      );
      setTeamPlans(updatedPlans);
      setSelectedPlan({ ...selectedPlan, plan: payload });
    } catch (e) {
      console.error(e);
      alert("Error pushing moderated plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleActionPushDirect = async (planToPush: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${planToPush.userId}`);
      let fullPlan: any = null;
      if (res.ok) {
        fullPlan = await res.json();
      }
      const updatedPPlan = fullPlan && fullPlan.metadata ? fullPlan : { metadata: {}, items: [] };
      updatedPPlan.metadata.dpmcStatus = 'Pushed to Stakeholders';

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${planToPush.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPPlan)
      });

      const updatedLedger = dpmcLedger.map((item: any) => {
        if (item.userId === planToPush.userId) {
          return {
            ...item,
            status: 'Pushed to Stakeholders',
            isPushed: true,
            pushedToUser: true,
            pushedToManager: true,
            pushedToAuditor: true,
            pushedAt: new Date().toISOString()
          };
        }
        return item;
      });

      await fetch(`/api/tenant/${activeTenantId}/dpmc-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: updatedLedger })
      });

      setDpmcLedger(updatedLedger);

      // Dispatch notifications to all 4 stakeholders: Submitter, Manager, Internal Auditor, DPMC
      const employeeEmail = planToPush.userId;
      const employeeName = updatedPPlan.metadata?.name || planToPush.name || employeeEmail;
      let managerEmail = updatedPPlan.metadata?.manager;
      if (!managerEmail && Array.isArray(updatedPPlan.metadata?.history)) {
        const mgrLog = updatedPPlan.metadata.history.find((h: any) => h.role?.toLowerCase().includes('manager') || h.userEmail?.includes('khuboni'));
        if (mgrLog) managerEmail = mgrLog.userEmail;
      }
      if (employeeEmail.toLowerCase().includes('shabangusm')) {
        managerEmail = 'mahlanguml@nkangaladm.gov.za';
      } else if (!managerEmail) {
        managerEmail = 'khuboniy@nkangaladm.gov.za';
      }

      const dpmcRecipients = [
        { email: employeeEmail, name: employeeName },
        { email: managerEmail, name: 'Line Manager' },
        { email: 'internal_audit', name: 'Internal Audit Committee' },
        { email: 'dpmc', name: 'DPMC Moderation Committee' }
      ];

      for (const rec of dpmcRecipients) {
        await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              senderEmail: currentUser.email || 'dpmc@nkangaladm.gov.za',
              senderName: currentUser.fullName || currentUser.full_name || 'DPMC Moderation Committee',
              recipientEmail: rec.email,
              recipientName: rec.name,
              title: `⚖️ DPMC Moderation Outcome: Final Score ${planToPush.totalScore || 'Moderated'}/100% for ${employeeName}`,
              message: `Departmental Performance Moderation Committee (DPMC) has pushed finalized moderation results for ${employeeName} (${employeeEmail}).\n\n` +
                       `Final Blended Score: ${planToPush.totalScore || 'Moderated'}/100%\n` +
                       `Status: Pushed to Stakeholders\n\n` +
                       `Moderated scores have been recorded and synchronized across all stakeholder inboxes.`,
              actionType: 'approval',
              senderCapacity: 'dpmc_committee',
              employeeEmail: employeeEmail
            }
          })
        });
      }

      alert("Moderated Plan successfully pushed and distributed back to Subordinate/User, Manager, Internal Auditor, and DPMC!");
      
      // Update local teamPlans status if loaded
      setTeamPlans(prev => prev.map(tp => tp.userId === planToPush.userId ? { ...tp, plan: { ...tp.plan, metadata: { ...tp.plan.metadata, dpmcStatus: 'Pushed to Stakeholders' } } } : tp));
    } catch (e) {
      console.error(e);
      alert("Error pushing moderated plan.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50 text-slate-600 p-8 rounded-3xl border border-gray-200">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-800 uppercase">Unauthorized Access</h2>
        <p className="text-sm font-medium mt-2 text-center text-slate-500">
          This module is restricted to Departmental Performance Moderation Committee members and Global Administrators.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-50 text-slate-600 p-8 rounded-3xl border border-gray-200">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  // LIST VIEW: Show all audited plans
  if (!selectedPlan) {
    return (
      <div id="dpmc-dashboard" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-stone-900">
        <div className="px-6 py-6 pb-4 bg-white border-b border-gray-200 flex flex-col justify-between items-start gap-2 shrink-0 select-text">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            DPMC: Annual Performance Agreements
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider ml-[52px]">
            Review Audited Performance Plans & Moderate
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Audited Plans Pending DPMC Moderation
            </h2>
            {teamPlans.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold uppercase text-sm">No Audited Plans</p>
                <p className="text-[10px] text-slate-400 mt-1">There are no employee performance plans that have completed internal audit.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {teamPlans.map((tp, idx) => (
                  <div key={tp.id || `${tp.userId}-${idx}`} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition group cursor-pointer" onClick={() => handleSelectPlan(tp)}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border ${tp.plan.metadata?.dpmcStatus === 'Pushed to Stakeholders' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : tp.plan.metadata?.dpmcStatus === 'Moderated' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {tp.plan.metadata?.dpmcStatus === 'Pushed to Stakeholders' ? <Send className="w-6 h-6" /> : tp.plan.metadata?.dpmcStatus === 'Moderated' ? <CheckCircle className="w-6 h-6" /> : <FileSearch className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{tp.plan.metadata?.name || tp.userId}</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">
                          {tp.plan.metadata?.position || 'Employee'} • {tp.plan.metadata?.department || 'Department'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${tp.plan.metadata?.dpmcStatus === 'Pushed to Stakeholders' ? 'bg-emerald-100 text-emerald-700' : tp.plan.metadata?.dpmcStatus === 'Moderated' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {tp.plan.metadata?.dpmcStatus || 'Pending Moderation'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DPMC Moderation Done Ledger */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-150 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  DPMC Moderation & Stakeholder Distribution Ledger
                </h2>
                <p className="text-[10.5px] text-slate-550 text-slate-500 font-semibold mt-0.5">
                  Durable log of completed employee performance agreement moderations, tracking stakeholder distribution status
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-850 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shrink-0">
                {dpmcLedger.length} Records Saved
              </span>
            </div>

            {dpmcLedger.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No users have been moderated yet. Complete a performance agreement moderation to see ledger entries.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5 px-3">Subordinate Subject</th>
                      <th className="py-2.5 px-3">Position & Cluster</th>
                      <th className="py-2.5 px-2 text-center">Avg Rating</th>
                      <th className="py-2.5 px-3 text-center">Stakeholder Push Matrix</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dpmcLedger.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/55 transition">
                        <td className="py-3 px-3 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-700 text-[11px]">{item.position}</p>
                          <p className="text-[9.5px] text-slate-400 uppercase font-black">{item.department}</p>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-mono font-bold bg-indigo-50 text-indigo-700 text-[11px] border border-indigo-100 px-2.5 py-1 rounded-lg">
                            {item.totalScore || '0.00'}/5.0
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-wrap justify-center items-center gap-1.5 font-black text-[8px] uppercase tracking-wider">
                            <span className={`px-2 py-0.5 rounded-full border ${item.pushedToUser ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              User: {item.pushedToUser ? '✅ OK' : '⏳ Pending'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border ${item.pushedToManager ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              Manager: {item.pushedToManager ? '✅ OK' : '⏳ Pending'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border ${item.pushedToAuditor ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              Auditor: {item.pushedToAuditor ? '✅ OK' : '⏳ Pending'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${item.isPushed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {!item.isPushed ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionPushDirect(item);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 mx-auto border-0 cursor-pointer transition shadow-sm"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Push Now</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-md">
                              ✓ Dispatched
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  const { plan } = selectedPlan;

  return (
    <div id="dpmc-detail" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-stone-900">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 select-text">
        <div>
          <button 
            onClick={() => setSelectedPlan(null)}
            className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2 bg-transparent border-0 cursor-pointer"
          >
            ← Back to List
          </button>
          <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            DPMC Moderation: {plan.metadata?.name || selectedPlan.userId}
          </h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5 ml-[28px]">
            {plan.metadata?.position} • FY {plan.metadata?.period}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={handleSaveReview}
            disabled={saving}
            className="bg-indigo-600 text-white hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 shadow-sm border-0 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save Moderation</span>
          </button>

          {plan.metadata?.dpmcStatus === 'Moderated' ? (
            <button 
              onClick={handlePushModeration}
              disabled={saving}
              className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 shadow-sm border-0 cursor-pointer"
              title="Push this moderated plan to Subordinate, Manager, and Auditor"
            >
              <Send className="w-4 h-4" />
              <span>Push Moderated Plan</span>
            </button>
          ) : plan.metadata?.dpmcStatus === 'Pushed to Stakeholders' ? (
            <span className="bg-emerald-100 text-emerald-700 border border-emerald-250 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <Check className="w-4 h-4" />
              <span>Dispatched to Stakeholders</span>
            </span>
          ) : (
            <button 
              disabled={true}
              className="bg-slate-200 text-slate-400 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 cursor-not-allowed border-0"
              title="Moderation must be saved first to enable pushing"
            >
              <Send className="w-4 h-4 text-slate-300" />
              <span>Push Moderated Plan (Locked)</span>
            </button>
          )}
        </div>
      </div>

      {/* DPMC Sub-Tab Navigation Bar */}
      <div className="bg-slate-200/80 px-6 py-2 border-b border-slate-300 flex items-center justify-between gap-4 shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => setDpmcSubTab('kpi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
              dpmcSubTab === 'kpi'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Individual KPIs Moderation
          </button>
          <button
            type="button"
            onClick={() => setDpmcSubTab('jsc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
              dpmcSubTab === 'jsc'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 JSCs DPMC Review
          </button>
          <button
            type="button"
            onClick={() => setDpmcSubTab('competencies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
              dpmcSubTab === 'competencies'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛡️ Core Competencies DPMC Review
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
        {dpmcSubTab === 'jsc' ? (
          <JSCDpmcReviewSection
            currentUser={currentUser}
            activeTenantId={activeTenantId}
            defaultEmployeeEmail={selectedPlan?.userId || ''}
          />
        ) : dpmcSubTab === 'competencies' ? (
          <CoreCompetenciesDpmcReviewSection
            currentUser={currentUser}
            activeTenantId={activeTenantId}
            defaultEmployeeEmail={selectedPlan?.userId || ''}
          />
        ) : (!plan.items || plan.items.length === 0) ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <p className="text-slate-500 text-sm font-bold uppercase">No KPIs found in this plan</p>
          </div>
        ) : (
          <div className="space-y-6 w-full lg:flex lg:gap-6 lg:space-y-0">
            {/* Left Sidebar: DPMC Verification Material & Quarterly PoE */}
            <div className="w-full lg:w-[480px] bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-5 shrink-0 align-top">
              
              <div className="border-b border-slate-150 pb-3 flex justify-between items-center text-left">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <FolderOpen className="w-4 h-4" />
                    </span>
                    Moderation PoE Drawer
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">
                    Audit Verification & Portfolio of Evidence
                  </p>
                </div>
                {/* Lazy proof file generator */}
                <button
                  type="button"
                  onClick={handleGenerateSamplePoes}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-black uppercase py-1 px-2.5 rounded-lg transition"
                >
                  Generate Proof
                </button>
              </div>

              {/* KPI Picker */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Targeted KPI to Moderate
                </label>
                <select
                  value={activeKPIId || ''}
                  onChange={(e) => setActiveKPIId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:border-amber-500 focus:bg-white outline-none cursor-pointer"
                >
                  {plan.items.map((item: any, idx: number) => (
                    <option key={item.id} value={item.id}>
                      {item.kpiNo || `KPI-${idx + 1}`}: {item.kpi?.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* KPI highlight details & audit summary reviews */}
              {(() => {
                const activeKPI = plan.items.find((x: any) => x.id === activeKPIId);
                if (!activeKPI) return null;

                const activeQuartersList = [
                  { label: 'Q1', text: activeKPI.q1Poe, status: activeKPI.q1PoeStatus, docs: activeKPI.q1PoeDocs || [] },
                  { label: 'Q2', text: activeKPI.q2Poe, status: activeKPI.q2PoeStatus, docs: activeKPI.q2PoeDocs || [] },
                  { label: 'Q3', text: activeKPI.q3Poe, status: activeKPI.q3PoeStatus, docs: activeKPI.q3PoeDocs || [] },
                  { label: 'Q4', text: activeKPI.q4Poe, status: activeKPI.q4PoeStatus, docs: activeKPI.q4PoeDocs || [] },
                ];

                return (
                  <div className="space-y-4">
                    {/* Selected KPI Content Snippet */}
                    <div className="p-3 bg-amber-50/65 rounded-xl border border-amber-100 text-[11px] text-slate-705 leading-relaxed font-medium">
                      <span className="font-extrabold text-amber-800 uppercase tracking-wide block mb-1">SELECTED KPI DESCRIPTION</span>
                      {activeKPI.kpi}
                    </div>

                    {/* DPMC Summary of Internal Audit Review per person */}
                    <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] space-y-2 text-left">
                      <div className="flex items-center gap-1.5 text-indigo-950 font-extrabold uppercase tracking-wide">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>INTERNAL AUDIT REPORT SUMMARY</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pb-1 border-b border-indigo-100 font-medium">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Audit Status</span>
                          <span className="text-slate-800 font-bold uppercase">{plan.metadata?.internalAuditStatus || 'Reviewed'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Assigned Rating</span>
                          <span className="text-indigo-700 font-extrabold">{activeKPI.internalAuditRating || 'Not Rated'} / 5</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] text-[#4d5382] uppercase tracking-widest block font-bold">Auditor Verification Remarks</span>
                        <p className="text-slate-600 italic m-0 text-[10.5px] leading-relaxed">
                          "{activeKPI.internalAuditComment || 'Verified against core portfolio checklist.'}"
                        </p>
                      </div>
                    </div>

                    {/* Quarter Selector Tabs */}
                    <div className="space-y-2.5 text-left">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Quarterly Evidence Files Shelf</span>
                      
                      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setActiveQuarterTab(q as any)}
                            className={`py-2 text-[10px] font-extrabold rounded-lg uppercase transition-all ${
                              activeQuarterTab === q 
                                ? 'bg-white text-slate-950 shadow-sm border border-slate-200' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 bg-transparent border-0 cursor-pointer'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>

                      {/* Folder Content Frame */}
                      {(() => {
                        const currentTabObj = activeQuartersList.find(x => x.label === activeQuarterTab) || activeQuartersList[0];
                        return (
                          <div className="border border-slate-150 rounded-2xl bg-white p-3.5 space-y-3 shadow-inner text-left animate-none">
                            {/* Folder Banner info */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="text-[10px] text-slate-800 font-black uppercase tracking-wide">
                                  {activeQuarterTab} Evidence Folder
                                </span>
                              </div>
                              <span className="text-[8px] bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 text-emerald-700 font-mono font-black uppercase">
                                {currentTabObj.status || 'Verified'}
                              </span>
                            </div>

                            {/* PoE descriptive text */}
                            <div className="text-[10px] leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-150 italic break-words">
                              {currentTabObj.text || 'No self-evaluation overview notes loaded for this quarter.'}
                            </div>

                            {/* Document Proof Files List */}
                            <div className="space-y-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">SECURED SYSTEM FILES</span>
                              
                              {(!currentTabObj.docs || currentTabObj.docs.length === 0) ? (
                                <div className="text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                  <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1 animate-none" />
                                  <p className="text-[9px] text-slate-400 font-bold uppercase m-0 leading-normal animate-none">No documents uploaded</p>
                                  <p className="text-[8px] text-slate-400 m-0 leading-normal">Generate simulated material using the top-right button</p>
                                </div>
                              ) : (
                                <div className="space-y-1.5 animate-none">
                                  {currentTabObj.docs.map((doc: any, keyIdx: number) => (
                                    <div 
                                      key={doc.id || keyIdx} 
                                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition group"
                                    >
                                      <div className="flex items-center gap-2 max-w-[240px]">
                                        {getFileIconComponent(doc.name)}
                                        <div className="truncate text-left font-semibold">
                                          <p className="text-[10px] font-bold text-slate-800 truncate m-0">{doc.name}</p>
                                          <p className="text-[8px] text-slate-400 font-mono m-0 font-bold">Uploaded by {doc.uploadedBy || 'Officer'}</p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDoc({ ...doc, quarter: activeQuarterTab, kpiName: activeKPI.kpi })}
                                        className="p-1 px-2.5 hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 bg-white text-indigo-600 text-[8px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Preview Proof</span>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Panel: The Interactive Annual Performance Table sheet */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-md p-6 overflow-hidden">
              <div className="space-y-6">
                
                {/* MODERN COMBINED MODERATION SUMMARY SCORECARD */}
                {(() => {
                  const totalKpiCalculated = plan.items?.reduce((sum: number, k: any) => sum + ((parseFloat(k.mpmcFinalScore || k.dpmcRating || k.managerScore || '0') * parseFloat(k.weighting || '0')) / 5), 0) || 0;
                  const totalKpiWeightTimes5 = (plan.items?.reduce((sum: number, k: any) => sum + (parseFloat(k.weighting || '0')), 0) || 0) * 5;
                  const kpiWeightScore80 = totalKpiWeightTimes5 > 0 ? ((totalKpiCalculated / totalKpiWeightTimes5) * 80) : 0;

                  const totalCcrCalculated = ccrItems.reduce((sum, item) => {
                    const rating = parseFloat(item.mpmcFinalScore || item.dpmcRating || item.supervisorRating || item.myScore || '0');
                    const wt = parseFloat(item.weight || '0');
                    return sum + ((rating * wt) / 5);
                  }, 0);
                  const totalCcrWeight = ccrItems.reduce((sum, item) => sum + parseFloat(item.weight || '0'), 0);
                  const ccrWeightScore20 = totalCcrWeight > 0 ? ((totalCcrCalculated / (totalCcrWeight * 5)) * 20) : 0;

                  const overallScoreVal = (kpiWeightScore80 + ccrWeightScore20).toFixed(2);
                  const overallScoreNum = parseFloat(overallScoreVal);

                  let gradingText = "Not Initiated";
                  let gradingBadgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                  if (overallScoreNum > 0) {
                    if (overallScoreNum < 50) {
                      gradingText = "Unsatisfactory Performance";
                      gradingBadgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                    } else if (overallScoreNum < 70) {
                      gradingText = "Developing Parity";
                      gradingBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                    } else if (overallScoreNum < 90) {
                      gradingText = "Fully Competent";
                      gradingBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    } else {
                      gradingText = "Outstanding Performance";
                      gradingBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    }
                  }

                  return (
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/30">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                          <span className="bg-indigo-550 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest block w-fit mb-2">
                            DPMC Live Moderation Dashboard
                          </span>
                          <h2 className="text-xl font-bold tracking-tight">
                            Performance Assessment of {plan.metadata?.name || selectedPlan.userId}
                          </h2>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xl leading-relaxed">
                            Formulated under Municipal Performance Regulations. This live scorecard dynamically blends Section 1: KPI Areas (80%) and Section 2: Core Competencies Requirements (20%) in real-time.
                          </p>
                        </div>

                        {/* Combined Dial Badge */}
                        <div className="bg-white/5 border border-white/15 p-4 rounded-2xl flex items-center gap-4 shadow-inner text-center md:text-left shrink-0">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Combined Moderated Score</span>
                            <div className="font-mono text-3xl font-black text-indigo-400 tracking-tight">
                              {overallScoreVal}%
                            </div>
                            <span className={`inline-block text-[9.5px] font-bold px-2 py-0.5 mt-1 rounded-lg border uppercase tracking-wider ${gradingBadgeColor}`}>
                              {gradingText}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown Slider Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/10 text-xs">
                        {/* KPI Part */}
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">SECTION 1: KPIs Rating (80% Weight)</p>
                            <p className="text-sm font-semibold text-white/90 mt-1">Weighted Contribution</p>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-base font-bold text-white">{kpiWeightScore80.toFixed(2)}%</div>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">out of 80</span>
                          </div>
                        </div>

                        {/* CCR Part */}
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">SECTION 2: CCR Competencies (20% Weight)</p>
                            <p className="text-sm font-semibold text-white/90 mt-1">Weighted Contribution</p>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-base font-bold text-amber-400">{ccrWeightScore20.toFixed(2)}%</div>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">out of 20</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Table 1: Annual Performance Assessment (KPIs) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
                      SECTION 1: KEY PERFORMANCE INDES AREAS (80% Total Weight)
                    </h3>
                    <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold px-2.5 py-1 rounded-lg">
                      {plan.items?.length || 0} Key Performance Indicators Loaded
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-[10px] text-left border-collapse min-w-[2000px]">
                      <thead>
                        <tr className="bg-slate-900 text-white text-center font-bold">
                          <th className="p-3 border-r border-[#1e293b] min-w-[250px] whitespace-normal">KPI Objective Details</th>
                          <th className="p-3 border-r border-[#1e293b] w-24">Baseline</th>
                          <th className="p-3 border-r border-[#1e293b] w-24">Annual Target</th>
                          <th className="p-3 border-r border-[#1e293b] w-24">Annual Actual</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[150px] whitespace-normal">Evaluation / Achievement</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[150px] whitespace-normal">Variance / Correction</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[150px] whitespace-normal">Portfolio proof</th>
                          <th className="p-3 border-r border-[#1e293b] text-center w-20">Weight (%)</th>
                          <th className="p-3 border-r border-[#1e293b] text-center w-20">My Score</th>
                          <th className="p-3 border-r border-[#1e293b] text-center w-20">Supervisor Rating</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[150px]">Supervisor Remarks</th>
                          <th className="p-3 border-r border-[#1e293b] text-center w-20">Audit Rating</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[150px]">Auditor Remarks</th>
                          <th colSpan={2} className="p-2 border-r border-[#1e293b] bg-amber-900 border-b border-amber-800 text-amber-100 text-[9px] uppercase tracking-wider">Departmental Committee (DPMC)</th>
                          <th colSpan={2} className="p-2 border-r border-[#1e293b] bg-indigo-900 border-b border-indigo-800 text-indigo-100 text-[9px] uppercase tracking-wider">Municipal Committee (MPMC)</th>
                          <th className="p-3 bg-emerald-900 text-emerald-100 w-24">Final Score</th>
                        </tr>
                        <tr className="bg-slate-800 text-[#94a3b8] text-center text-[9px]">
                          <th colSpan={13} className="border-r border-[#1e293b] py-1 bg-slate-900"></th>
                          <th className="p-1 px-2 border-r border-[#573510] bg-amber-850 font-bold text-amber-200">Rating</th>
                          <th className="p-1 px-2 border-r border-[#573510] bg-amber-850 font-bold text-amber-200">Recommendation</th>
                          <th className="p-1 px-2 border-r border-[#1e2456] bg-indigo-850 font-bold text-indigo-200">Final Score</th>
                          <th className="p-1 px-2 border-r border-[#1e2456] bg-indigo-850 font-bold text-indigo-200">Resolution</th>
                          <th className="p-1 py-1 bg-emerald-850">Calculated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.items.map((kpi: any, idx: number) => (
                          <tr key={kpi.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-indigo-50/30 transition`}>
                            <td className="p-3 border-r border-slate-150 align-top font-semibold text-slate-900 text-[11px] whitespace-normal leading-relaxed">{kpi.kpi}</td>
                            <td className="p-3 border-r border-slate-150 align-top text-center text-slate-600 font-medium font-mono">{kpi.baseline || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top text-center text-slate-800 font-bold font-mono">{kpi.annualTarget || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top text-center text-indigo-700 font-bold font-mono">{kpi.q4Target || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top whitespace-normal text-slate-600 italic break-words">{kpi.evaluation || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top whitespace-normal text-slate-500 leading-normal">
                              {kpi.varianceReason ? <div className="text-[9.5px]"><span className="font-extrabold text-[#7f1d1d] uppercase text-[7.5px] block">Variance</span>{kpi.varianceReason}</div> : null}
                              {kpi.correctiveMeasure ? <div className="text-[9.5px] mt-1"><span className="font-extrabold text-[#065f46] uppercase text-[7.5px] block">Fix</span>{kpi.correctiveMeasure}</div> : null}
                              {!kpi.varianceReason && !kpi.correctiveMeasure && <span className="text-slate-300 italic">None logged</span>}
                            </td>
                            <td className="p-3 border-r border-slate-150 align-top text-slate-550 break-words font-mono text-[9px] text-[#4f46e5] font-bold">{kpi.poe || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top text-center font-bold text-slate-800 bg-slate-50/20">{kpi.weighting || 0}%</td>
                            <td className="p-3 border-r border-slate-150 align-top text-center text-slate-700 font-bold">{kpi.myScore || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top text-center text-indigo-700 bg-indigo-50/10 font-bold">{kpi.managerScore || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top text-slate-600 italic whitespace-normal leading-normal">{kpi.review || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top text-center text-indigo-850 font-black">{kpi.internalAuditRating || '-'}</td>
                            <td className="p-3 border-r border-slate-150 align-top text-slate-600 italic whitespace-normal leading-normal">{kpi.internalAuditComment || '-'}</td>
                            
                            {/* DPMC Input Columns */}
                            <td className="p-2 border-r border-amber-200 bg-amber-50/15 align-top text-center">
                              <input
                                 type="number"
                                 min="1" max="5" step="0.1"
                                 value={kpi.dpmcRating || ''}
                                 onChange={(e) => updateReview(kpi.id, 'dpmcRating', e.target.value)}
                                 placeholder="1..5"
                                 className="w-full bg-white border border-amber-200 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-250 hover:bg-white outline-none w-14 shadow-sm"
                              />
                            </td>
                            <td className="p-2 border-r border-amber-200 bg-amber-50/15 align-top">
                              <textarea
                                 value={kpi.dpmcRecommendation || ''}
                                 onChange={(e) => updateReview(kpi.id, 'dpmcRecommendation', e.target.value)}
                                 rows={2}
                                 placeholder="Enter recommendation..."
                                 className="w-full bg-white border border-amber-200 rounded-lg p-1.5 text-[10.5px] font-medium leading-normal text-slate-800 hover:bg-white focus:ring-2 focus:ring-amber-250 outline-none resize-y shadow-sm"
                              />
                            </td>
                            
                            {/* MPMC Input Columns */}
                            <td className="p-2 border-r border-indigo-200 bg-indigo-50/10 align-top text-center">
                              <input
                                 type="number"
                                 min="1" max="5" step="0.1"
                                 value={kpi.mpmcFinalScore || ''}
                                 onChange={(e) => updateReview(kpi.id, 'mpmcFinalScore', e.target.value)}
                                 placeholder="1..5"
                                 className="w-full bg-white border border-indigo-200 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-250 hover:bg-white outline-none w-14 shadow-sm"
                              />
                            </td>
                            <td className="p-2 border-r border-indigo-200 bg-indigo-50/10 align-top">
                              <textarea
                                 value={kpi.mpmcResolution || ''}
                                 onChange={(e) => updateReview(kpi.id, 'mpmcResolution', e.target.value)}
                                 rows={2}
                                 placeholder="Enter resolution..."
                                 className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 text-[10.5px] font-medium leading-normal text-slate-800 hover:bg-white focus:ring-2 focus:ring-indigo-250 outline-none resize-y shadow-sm"
                              />
                            </td>

                            {/* Row Final Score */}
                            <td className="p-3 align-top text-center font-bold text-emerald-800 bg-emerald-50/30 font-mono text-[11px]">
                              {((parseFloat(kpi.mpmcFinalScore || kpi.dpmcRating || kpi.managerScore || '0') * parseFloat(kpi.weighting || '0')) / 5).toFixed(2)}
                            </td>
                          </tr>
                        ))}

                        {/* SUM TOTALS SLATE */}
                        <tr className="bg-slate-900 text-white font-extrabold text-[11px]">
                          <td colSpan={13} className="border-r border-slate-800 text-right uppercase py-3 px-4 tracking-wider">TOTAL COMBINED KPI RATING</td>
                          <td colSpan={4} className="border-r border-slate-800 py-3 bg-amber-50/10 text-right px-4">Sum of Scores:</td>
                          <td className="p-3 text-center bg-emerald-950 text-emerald-300 font-mono text-xs border-0">
                            {plan.items.reduce((sum: number, k: any) => sum + ((parseFloat(k.mpmcFinalScore || k.dpmcRating || k.managerScore || '0') * parseFloat(k.weighting || '0')) / 5), 0).toFixed(2)}
                          </td>
                        </tr>
                        <tr className="bg-slate-850 text-slate-300 font-extrabold text-[11px]">
                          <td colSpan={13} className="border-r border-slate-800 text-right uppercase py-2 px-4">TOTAL KPI WEIGHT x5 REFERENCE</td>
                          <td colSpan={4} className="border-r border-slate-800 py-2 text-right px-4">Weight Max:</td>
                          <td className="p-2.5 text-center bg-slate-900 border-0 font-mono text-xs text-slate-400">
                            {plan.items.reduce((sum: number, k: any) => sum + (parseFloat(k.weighting || '0')), 0) * 5}
                          </td>
                        </tr>
                        <tr className="bg-indigo-950 text-indigo-100 font-extrabold text-[11px]">
                          <td colSpan={13} className="border-r border-indigo-900 text-right uppercase py-3.5 px-4 tracking-tight text-[#c7d2fe]">
                            SECTION 1 FINAL WEIGHTED CONTRIBUTION SCORE (OUT OF 80)
                          </td>
                          <td colSpan={4} className="border-r border-indigo-900 py-3.5 text-right px-4 bg-[#1e1b4b] text-[#a5b4fc]">
                            Calculated Ratio Score (Max 80.00):
                          </td>
                          <td className="p-3.5 text-center bg-[#4338ca] text-white font-mono text-[13px] border-0">
                            {(() => {
                               const totalScore = plan.items.reduce((sum: number, k: any) => sum + ((parseFloat(k.mpmcFinalScore || k.dpmcRating || k.managerScore || '0') * parseFloat(k.weighting || '0')) / 5), 0);
                               const totalWeightTimes5 = plan.items.reduce((sum: number, k: any) => sum + (parseFloat(k.weighting || '0')), 0) * 5;
                               return totalWeightTimes5 > 0 ? ((totalScore / totalWeightTimes5) * 80).toFixed(2) : '0';
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 2: CCRs Details (Core Competency Requirements) */}
                <div className="space-y-3 pt-6 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                        SECTION 2: CORE COMPETENCY REQUIREMENTS (20% Total Weight)
                      </h3>
                      <p className="text-[10.5px] text-slate-500 font-medium mt-1 leading-relaxed">
                        Automatic sync loaded with employee-specific job capabilities, tracking individual performance indices.
                      </p>
                    </div>

                    {/* NEW ACTION DISPATCH BUTTON */}
                    <button
                      type="button"
                      onClick={handlePushModeration}
                      disabled={saving}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50 select-none shadow-md border-0 shrink-0 cursor-pointer animate-none self-end"
                      title="Sends the current list of audited ratings and resolutions back to employee manager and auditor"
                    >
                      <Send className="w-4 h-4" />
                      <span>Dispatch back to Manager & Auditor</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm mt-2">
                    <table className="w-full text-[10px] text-left border-collapse min-w-[1600px]">
                      <thead>
                        <tr className="bg-slate-900 text-white text-center font-bold">
                          <th className="p-3 border-r border-[#1e293b] text-center w-20">CCR No</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[280px]">Competency Profile</th>
                          <th className="p-3 border-r border-[#1e293b] w-24 text-center">Weight (%)</th>
                          <th className="p-3 border-r border-[#1e293b] w-24 text-center">My Score</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[200px]">Self Evaluation Comment</th>
                          <th className="p-3 border-r border-[#1e293b] w-24 text-center">Supervisor Rating</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[200px]">Supervisor Comment</th>
                          <th className="p-3 border-r border-[#1e293b] w-24 text-center">Auditor Rating</th>
                          <th className="p-3 border-r border-[#1e293b] min-w-[200px]">Auditor Comment</th>
                          <th colSpan={2} className="p-2 border-r border-[#1e293b] bg-amber-900 border-b border-amber-800 text-amber-100 text-[9px] uppercase tracking-wider">Departmental Committee (DPMC)</th>
                          <th colSpan={2} className="p-2 border-r border-[#1e293b] bg-indigo-900 border-b border-indigo-800 text-indigo-100 text-[9px] uppercase tracking-wider">Municipal Committee (MPMC)</th>
                          <th className="p-3 bg-emerald-900 text-emerald-100 w-28">Calculated</th>
                        </tr>
                        <tr className="bg-slate-800 text-[#94a3b8] text-center text-[9px]">
                          <th colSpan={9} className="border-r border-[#1e293b] py-1 bg-slate-900"></th>
                          <th className="p-1 px-2 border-r border-[#573510] bg-amber-850 font-bold text-amber-200 w-24">Rating</th>
                          <th className="p-1 px-2 border-r border-[#573510] bg-amber-850 font-bold text-amber-200">Recommendation</th>
                          <th className="p-1 px-2 border-r border-[#1e2456] bg-indigo-850 font-bold text-indigo-200 w-24">Final Score</th>
                          <th className="p-1 px-2 border-r border-[#1e2456] bg-indigo-850 font-bold text-indigo-200">Resolution</th>
                          <th className="p-1 py-1 bg-emerald-850">Calculated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ccrItems.length === 0 ? (
                          <tr>
                            <td colSpan={14} className="p-8 text-center text-slate-400 italic">
                              No Core Competency Requirements (CCRs) mapped for this employee's position.
                            </td>
                          </tr>
                        ) : (
                          ccrItems.map((item: any, idx: number) => {
                            const calculates = ((parseFloat(item.mpmcFinalScore || item.dpmcRating || item.supervisorRating || item.myScore || '0') * parseFloat(item.weight || '0')) / 5).toFixed(2);
                            return (
                              <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 hover:bg-amber-50/10 transition`}>
                                <td className="p-3 border-r border-slate-150 align-top text-center font-bold text-slate-500 font-mono">{item.jscNo || `CCR-${idx+1}`}</td>
                                <td className="p-3 border-r border-slate-150 align-top whitespace-normal">
                                  <p className="font-extrabold text-slate-900 text-[11px] leading-tight">{item.competency}</p>
                                  {item.definition && (
                                    <div className="text-[10px] text-slate-500 mt-1 leading-relaxed font-normal">
                                      {typeof item.definition === 'string' ? (
                                        item.definition
                                      ) : (
                                        <>
                                          <p>{item.definition.mainText || 'No custom baseline statement recorded.'}</p>
                                          {item.definition.subsections && item.definition.subsections.length > 0 && (
                                            <div className="space-y-1 mt-1 pl-2 border-l border-slate-200 text-[9px] text-slate-450">
                                              {item.definition.subsections.map((sub: any, sIdx: number) => (
                                                <div key={sIdx}>
                                                  {sub.heading && <strong className="block text-slate-600 uppercase text-[8px] mt-0.5">{sub.heading}</strong>}
                                                  {sub.paragraphs && sub.paragraphs.map((p: string, pIdx: number) => (
                                                    <p key={pIdx} className="pl-2 relative before:content-['•'] before:absolute before:left-0 text-slate-500">
                                                      {p}
                                                    </p>
                                                  ))}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {item.level && (
                                    <span className="text-[7.5px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 mt-2 inline-block font-mono font-bold uppercase text-slate-600">
                                      Competency Level: {item.level}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 border-r border-slate-150 align-top text-center text-slate-700 font-bold font-mono">{item.weight}%</td>
                                <td className="p-3 border-r border-slate-150 align-top text-center text-slate-600 font-bold">{item.myScore || '-'}</td>
                                <td className="p-3 border-r border-slate-150 align-top text-slate-500 italic whitespace-normal max-w-xs">{item.motivation || '-'}</td>
                                <td className="p-3 border-r border-slate-150 align-top text-center text-indigo-700 bg-indigo-50/10 font-bold">{item.supervisorRating || item.score || '-'}</td>
                                <td className="p-3 border-r border-slate-150 align-top text-slate-600">{item.supervisorComment || item.supervisorReview || '-'}</td>
                                <td className="p-3 border-r border-slate-150 align-top text-center text-indigo-850 font-extrabold">{item.panelMembersScore || '-'}</td>
                                <td className="p-3 border-r border-slate-150 align-top text-slate-600 italic whitespace-normal">{item.panelMembersComment || '-'}</td>
                                
                                {/* Departmental Review (DPMC) */}
                                <td className="p-2 border-r border-amber-200 bg-amber-50/15 align-top text-center">
                                  <input
                                    type="number"
                                    min="1" max="5" step="0.1"
                                    value={item.dpmcRating || ''}
                                    onChange={(e) => updateCcrReview(item.id, 'dpmcRating', e.target.value)}
                                    placeholder="1..5"
                                    className="w-full bg-white border border-amber-200 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-250 outline-none w-14 shadow-sm"
                                  />
                                </td>
                                <td className="p-2 border-r border-amber-200 bg-amber-50/15 align-top">
                                  <textarea
                                    value={item.dpmcRecommendation || ''}
                                    onChange={(e) => updateCcrReview(item.id, 'dpmcRecommendation', e.target.value)}
                                    rows={2}
                                    placeholder="Enter recommendation..."
                                    className="w-full bg-white border border-amber-200 rounded-lg p-1.5 text-[10.5px] font-medium leading-normal text-slate-800 focus:ring-2 focus:ring-amber-250 outline-none resize-y shadow-sm"
                                  />
                                </td>

                                {/* Municipal Review (MPMC) */}
                                <td className="p-2 border-r border-indigo-200 bg-indigo-50/10 align-top text-center">
                                  <input
                                    type="number"
                                    min="1" max="5" step="0.1"
                                    value={item.mpmcFinalScore || ''}
                                    onChange={(e) => updateCcrReview(item.id, 'mpmcFinalScore', e.target.value)}
                                    placeholder="1..5"
                                    className="w-full bg-white border border-indigo-200 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-250 outline-none w-14 shadow-sm"
                                  />
                                </td>
                                <td className="p-2 border-r border-indigo-200 bg-indigo-50/10 align-top">
                                  <textarea
                                    value={item.mpmcResolution || ''}
                                    onChange={(e) => updateCcrReview(item.id, 'mpmcResolution', e.target.value)}
                                    rows={2}
                                    placeholder="Enter resolution..."
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 text-[10.5px] font-medium leading-normal text-slate-800 focus:ring-2 focus:ring-indigo-250 outline-none resize-y shadow-sm"
                                  />
                                </td>

                                {/* Calculated Score */}
                                <td className="p-3 align-top text-center font-bold text-emerald-800 bg-emerald-50/30 font-mono text-[11px]">
                                  {calculates}
                                </td>
                              </tr>
                            );
                          })
                        )}

                        {/* CCR SUM TOTALS */}
                        {ccrItems.length > 0 && (
                          <>
                            <tr className="bg-slate-900 text-white font-extrabold text-[11px]">
                              <td colSpan={9} className="border-r border-slate-800 text-right uppercase py-3 px-4 tracking-wider">TOTAL CCR RATING</td>
                              <td colSpan={4} className="border-r border-slate-800 py-3 bg-amber-50/10 text-right px-4">Sum of Scores:</td>
                              <td className="p-3 text-center bg-emerald-950 text-emerald-300 font-mono text-xs border-0">
                                {ccrItems.reduce((sum, item) => {
                                  const rating = parseFloat(item.mpmcFinalScore || item.dpmcRating || item.supervisorRating || item.myScore || '0');
                                  const wt = parseFloat(item.weight || '0');
                                  return sum + ((rating * wt) / 5);
                                }, 0).toFixed(2)}
                              </td>
                            </tr>
                            <tr className="bg-slate-850 text-slate-300 font-extrabold text-[11px]">
                              <td colSpan={9} className="border-r border-slate-800 text-right uppercase py-2 px-4">TOTAL CCR WEIGHT x5 REFERENCE</td>
                              <td colSpan={4} className="border-r border-slate-800 py-2 text-right px-4">Weight Max:</td>
                              <td className="p-2.5 text-center bg-slate-900 border-0 font-mono text-xs text-slate-400">
                                {ccrItems.reduce((sum, item) => sum + parseFloat(item.weight || '0'), 0) * 5}
                              </td>
                            </tr>
                            <tr className="bg-amber-950 text-amber-100 font-extrabold text-[11px]">
                              <td colSpan={9} className="border-r border-amber-900 text-right uppercase py-3.5 px-4 tracking-tight text-[#fde68a]">
                                SECTION 2 FINAL WEIGHTED CONTRIBUTION SCORE (OUT OF 20)
                              </td>
                              <td colSpan={4} className="border-r border-amber-900 py-3.5 text-right px-4 bg-[#451a03] text-[#fcd34d]">
                                Calculated Ratio Score (Max 20.00):
                              </td>
                              <td className="p-3.5 text-center bg-[#b45309] text-white font-mono text-[13px] border-0">
                                {(() => {
                                   const totalCalculated = ccrItems.reduce((sum, item) => {
                                     const rating = parseFloat(item.mpmcFinalScore || item.dpmcRating || item.supervisorRating || item.myScore || '0');
                                     const wt = parseFloat(item.weight || '0');
                                     return sum + ((rating * wt) / 5);
                                   }, 0);
                                   const totalWeight = ccrItems.reduce((sum, item) => sum + parseFloat(item.weight || '0'), 0);
                                   const ratio = totalWeight > 0 ? ((totalCalculated / (totalWeight * 5)) * 20).toFixed(2) : '0';
                                   return ratio;
                                })()}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* HISTORICAL WORKFLOW SIGNATURE CERTIFICATE BLOCK */}
                <div className="pt-8 border-t border-slate-200 mt-8">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest block mb-4">
                    OFFICIAL SIGN-OFFS & RECOMMENDATIONS STAMPS
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Employee Comments & Signature */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">OFFICER SUBJECT</span>
                        <span className="text-[8px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">Candidate</span>
                      </div>
                      <div className="h-20 bg-white border border-slate-150 rounded-xl p-3 text-[10px] text-slate-500 italic overflow-y-auto leading-relaxed">
                        "The information supplied represents my complete target achievements as per evidence folders."
                      </div>
                      <div className="flex justify-between items-end pt-2 text-[10px] font-semibold text-slate-800">
                        <div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase m-0 leading-none">Signature</p>
                          <p className="font-family-['Brush Script MT',cursive] text-lg text-indigo-700 m-0 mt-1 select-none">
                            {plan.metadata?.name || selectedPlan.userId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-400 font-bold uppercase m-0 leading-none">Date Sign-off</p>
                          <p className="font-mono text-slate-700 mt-1 m-0">2026-06-18</p>
                        </div>
                      </div>
                    </div>

                    {/* Supervisor Audit & Comments */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">SUPERVISOR MANAGER REVIEW</span>
                        <span className="text-[8px] bg-[#fef3c7] text-[#92400e] px-2 py-0.5 rounded font-bold uppercase">Evaluator</span>
                      </div>
                      <div className="h-20 bg-white border border-slate-150 rounded-xl p-3 text-[10px] text-slate-500 italic overflow-y-auto leading-relaxed">
                        "KPI achievements have been audited. Standard performance goals are successfully attained, indicating good functional compliance under regulatory targets."
                      </div>
                      <div className="flex justify-between items-end pt-2 text-[10px] font-semibold text-slate-800">
                        <div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase m-0 leading-none">Signature</p>
                          <p className="font-family-['Brush Script MT',cursive] text-lg text-amber-700 m-0 mt-1 select-none">
                            ML Mahlangu
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-400 font-bold uppercase m-0 leading-none">Date Sign-off</p>
                          <p className="font-mono text-slate-700 mt-1 m-0">2026-06-19</p>
                        </div>
                      </div>
                    </div>

                    {/* Auditor Signature */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">INTERNAL AUDITOR VERIFICATION</span>
                        <span className="text-[8px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold uppercase">Auditor Stamp</span>
                      </div>
                      <div className="h-20 bg-white border border-slate-150 rounded-xl p-3 text-[10px] text-slate-500 italic overflow-y-auto leading-relaxed">
                        "Evaluations checked against verified quarterly PoE checklists. Parity confirmed."
                      </div>
                      <div className="flex justify-between items-end pt-2 text-[10px] font-semibold text-slate-800">
                        <div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase m-0 leading-none">Auditor Signature</p>
                          <p className="font-family-['Brush Script MT',cursive] text-lg text-rose-700 m-0 mt-1 select-none">
                            Internal Auditor Stamp
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-400 font-bold uppercase m-0 leading-none">Stamp Date</p>
                          <p className="font-mono text-slate-700 mt-1 m-0">2026-06-20</p>
                        </div>
                      </div>
                    </div>

                    {/* General Manager Recommendations */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">GENERAL MANAGER SIGN-OFF</span>
                        <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">Final Stamp</span>
                      </div>
                      <div className="h-20 bg-white border border-slate-150 rounded-xl p-3 text-[10px] text-slate-500 italic overflow-y-auto leading-relaxed">
                        "Formally approved under Section 57 compliance framework. All metrics moderated by DPMC reflect standard executive performance policies."
                      </div>
                      <div className="flex justify-between items-end pt-2 text-[10px] font-semibold text-slate-800">
                        <div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase m-0 leading-none">GM Signature</p>
                          <p className="font-family-['Brush Script MT',cursive] text-lg text-emerald-700 m-0 mt-1 select-none">
                            GM Executive stamp
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-400 font-bold uppercase m-0 leading-none">Date Approved</p>
                          <p className="font-mono text-slate-700 mt-1 m-0">2026-06-20</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

  {/* DPMC SECURE DOCUMENT PREVIEW LIGHTBOX/MODAL */}
  {previewDoc && (
    <OfficeDocumentViewer 
      doc={{
        ...previewDoc,
        uploadedBy: plan?.metadata?.name || selectedPlan?.metadata?.name || 'Assigned Officer'
      }} 
      onClose={() => setPreviewDoc(null)} 
    />
  )}
  </div>
  );
}
