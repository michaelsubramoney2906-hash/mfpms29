import React, { useState, useEffect } from 'react';
import { 
  FileBarChart, Download, Send, CheckCircle, Clock, AlertCircle, 
  Share2, ShieldCheck, UserCheck, CornerDownRight, Printer, FileText, Layers
} from 'lucide-react';
import type { User } from '../../types';
import { JSCAnalyticalReportingSection } from './JSCModules';
import { calculateProgressPercentage } from '../../utils/varianceCalculator';

interface ReportsProps {
  currentUser: User;
  activeTenantId: string;
}

interface ReportItem {
  id: string;
  title: string;
  type: 'PDP' | 'JSC' | 'Performance Plan';
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Mid Term' | 'Annual';
  status: 'Pending Review' | 'Supervisor Approved' | 'Internal Audit Approved' | 'Rejected' | 'Draft';
  createdAt: string;
}

interface SharedReport {
  id: string;
  title: string;
  type: string;
  period: string;
  auditorEmail: string;
  auditorComments: string;
  auditorRating: 'Compliant' | 'Non-Compliant' | 'With Reservations';
  status: 'Dispatched to Managers' | 'Forwarded to Subordinates' | 'Signed-Off by Subordinate';
  managerComments?: string;
  managerEmail?: string;
  subordinateEmail?: string;
  subordinateSignature?: string;
  signedOffAt?: string;
  createdAt: string;
}

export function Reports({ currentUser, activeTenantId }: ReportsProps) {
  const [reports, setReports] = useState<ReportItem[]>([
    { id: '1', title: 'Q1 Performance Plan Report', type: 'Performance Plan', period: 'Q1', status: 'Draft', createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
    { id: '2', title: 'Q2 Performance Plan Report', type: 'Performance Plan', period: 'Q2', status: 'Draft', createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
    { id: '3', title: 'Q3 Performance Plan Report', type: 'Performance Plan', period: 'Q3', status: 'Draft', createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: '4', title: 'Q4 Performance Plan Report', type: 'Performance Plan', period: 'Q4', status: 'Draft', createdAt: new Date().toISOString() },
    { id: '5', title: 'Mid Term PDP Review', type: 'PDP', period: 'Mid Term', status: 'Pending Review', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: '6', title: 'Annual JSC Assessment', type: 'JSC', period: 'Annual', status: 'Internal Audit Approved', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: '7', title: 'Performance Agreement', type: 'Performance Plan', period: 'Annual', status: 'Draft', createdAt: new Date().toISOString() },
  ]);

  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'dispatcher' | 'jsc_reporting'>('catalogue');
  const [isLoadingShared, setIsLoadingShared] = useState(false);

  // Dynamic selector states
  const [teamPlans, setTeamPlans] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'Q1' | 'Q2' | 'Mid Term' | 'Q3' | 'Q4'>('Q1');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Form states for dispatching new report (Auditor)
  const [dispatchTitle, setDispatchTitle] = useState('');
  const [dispatchType, setDispatchType] = useState('Performance Plan');
  const [dispatchPeriod, setDispatchPeriod] = useState('Q4');
  const [dispatchComments, setDispatchComments] = useState('');
  const [dispatchRating, setDispatchRating] = useState<'Compliant' | 'Non-Compliant' | 'With Reservations'>('Compliant');

  // Form states for forwarding to subordinates (Manager)
  const [forwardingReportId, setForwardingReportId] = useState<string | null>(null);
  const [managerNotes, setManagerNotes] = useState('');
  const [subordinateEmailInput, setSubordinateEmailInput] = useState('');

  // Form states for subordinate sign-off
  const [signOffName, setSignOffName] = useState('');

  useEffect(() => {
    fetchSharedReports();
    fetchTeamPlans();
  }, [activeTenantId]);

  useEffect(() => {
    const handlePplanUpdated = (e: Event) => {
      console.log("Real-time pplan-updated event received, refreshing team plans in Reports...", e);
      fetchTeamPlans();
    };
    window.addEventListener('pplan-updated', handlePplanUpdated);
    return () => {
      window.removeEventListener('pplan-updated', handlePplanUpdated);
    };
  }, [activeTenantId]);

  const fetchSharedReports = async () => {
    setIsLoadingShared(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/shared-reports?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.reports || data.reports.length === 0) {
          const defaultShared: SharedReport[] = [
            {
              id: 'shared-1',
              title: 'Annual Moderated Performance Plan Summary (FY 2025/2026)',
              type: 'Performance Plan',
              period: 'Annual',
              auditorEmail: 'chief.auditor@local',
              auditorComments: 'Following complete legislative compliance review and portfolio of evidence inspections, the general outcomes are certified compliant.',
              auditorRating: 'Compliant',
              status: 'Dispatched to Managers',
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
            }
          ];
          setSharedReports(defaultShared);
          await saveSharedReports(defaultShared);
        } else {
          setSharedReports(data.reports);
        }
      }
    } catch (e) {
      console.error("Failed to load shared reports:", e);
    } finally {
      setIsLoadingShared(false);
    }
  };

  const fetchTeamPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/team-pplans?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.teamPlans || [];
        setTeamPlans(list);
        
        const myEmail = currentUser.email?.toLowerCase().trim() || '';
        const hasMine = list.some((tp: any) => tp.userId?.toLowerCase().trim() === myEmail);
        if (hasMine) {
          setSelectedUserId(myEmail);
        } else if (list.length > 0) {
          setSelectedUserId(list[0].userId);
        } else {
          setSelectedUserId(myEmail);
        }
      }
    } catch (e) {
      console.error("Failed to load team plans:", e);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const saveSharedReports = async (updatedList: SharedReport[]) => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/shared-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: updatedList })
      });
    } catch (e) {
      console.error("Failed to persist shared reports:", e);
    }
  };

  const handleSendToReview = (reportId: string) => {
    setLoadingAction(reportId);
    setTimeout(() => {
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'Pending Review' } : r));
      setLoadingAction(null);
      alert('Report exported automatically to Supervisor and Internal Audit for review.');
    }, 1200);
  };

  const handleAuditorDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle.trim() || !dispatchComments.trim()) {
      alert("Please fill out complete report titles and audit executive commentary.");
      return;
    }

    const newShared: SharedReport = {
      id: `shared_rep_${Date.now()}`,
      title: dispatchTitle.trim(),
      type: dispatchType,
      period: dispatchPeriod,
      auditorEmail: currentUser.email || 'internal.audit@local',
      auditorComments: dispatchComments.trim(),
      auditorRating: dispatchRating,
      status: 'Dispatched to Managers',
      createdAt: new Date().toISOString()
    };

    const nextList = [newShared, ...sharedReports];
    setSharedReports(nextList);
    await saveSharedReports(nextList);

    setDispatchTitle('');
    setDispatchComments('');
    alert(`Success! Finalised audit report shared and dispatched to all Line Managers.`);
  };

  const handleManagerForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardingReportId || !subordinateEmailInput.trim() || !managerNotes.trim()) {
      alert("Please select a report, configure cover notes and recipient teammate's email.");
      return;
    }

    const nextList = sharedReports.map(rep => {
      if (rep.id === forwardingReportId) {
        return {
          ...rep,
          status: 'Forwarded to Subordinates' as const,
          managerEmail: currentUser.email,
          managerComments: managerNotes.trim(),
          subordinateEmail: subordinateEmailInput.trim().toLowerCase()
        };
      }
      return rep;
    });

    setSharedReports(nextList);
    await saveSharedReports(nextList);

    setForwardingReportId(null);
    setManagerNotes('');
    setSubordinateEmailInput('');
    alert(`Success! Governance review forwarded safely to subordinate.`);
  };

  const handleSubordinateSignOff = async (reportId: string) => {
    if (!signOffName.trim()) {
      alert("Please type your signature name to authorize the official sign-off.");
      return;
    }

    const nextList = sharedReports.map(rep => {
      if (rep.id === reportId) {
        return {
          ...rep,
          status: 'Signed-Off by Subordinate' as const,
          subordinateSignature: signOffName.trim(),
          signedOffAt: new Date().toISOString()
        };
      }
      return rep;
    });

    setSharedReports(nextList);
    await saveSharedReports(nextList);

    setSignOffName('');
    alert(`Sign-Off committed! Digital signature recorded securely.`);
  };

  // Helper to resolve clean period label
  const getPeriodLabel = (p: 'Q1' | 'Q2' | 'Mid Term' | 'Q3' | 'Q4') => {
    switch (p) {
      case 'Q1': return '1st Quarter';
      case 'Q2': return '2nd Quarter';
      case 'Mid Term': return 'Midterm Review';
      case 'Q3': return '3rd Quarter';
      case 'Q4': return '4th Quarter';
      default: return p;
    }
  };

  // Get current selected user's metadata and list items
  const selectedPlanObj = teamPlans.find(tp => tp.userId?.toLowerCase().trim() === selectedUserId.toLowerCase().trim());
  
  const planMetadata = selectedPlanObj?.plan?.metadata || {
    name: currentUser.fullName || "Noluthando Zulu",
    email: currentUser.email || "zulune@nkangaladm.gov.za",
    position: currentUser.role || "PMS Officer",
    level: "Section 56 Senior Manager (Level 1)",
    department: currentUser.department || "Performance Management Unit",
    manager: "YK Khuboni",
    managerEmail: "KhuboniY@nkangaladm.gov.za",
    period: "2025/2026 Financial Year"
  };

  const planItems = selectedPlanObj?.plan?.items || [
    {
      id: "demo-1",
      strategicGoal: "Good Governance and Public Participation",
      kpiNo: "1",
      kpi: "Develop and implement risk management strategy and submit to council by 31 August 2026",
      description: "Establish complete risk identification & mitigation profiles department-wide.",
      bsd: false,
      led: false,
      mfvm: false,
      ggpp: true,
      midt: false,
      sr: false,
      kpa: "KPA 5: Good Governance and Public Participation",
      mscoaCode: "GG-101",
      baseline: "Risk register active",
      budget: "R 150,000",
      annualTarget: "100% execution of risk protocol",
      q1Target: "Draft register compiled",
      q1Actual: "Draft list reviewed and accepted by committee",
      q1Poe: "Risk_Draft_Register_2026.pdf",
      q2Target: "Approved by municipal manager",
      q2Actual: "MM signature obtained",
      q2Poe: "MM_Signed_Risk_Reg.docx",
      midtermTarget: "Mid-year risk assessment finalized",
      midtermActual: "Mid-year assessment completed successfully",
      midtermPoe: "Midyear_Risk_Report_Final.pdf",
      q3Target: "Implement 75% mitigations",
      q3Actual: "78% progress compiled",
      q3Poe: "Mitigations_Q3_Tracking.xlsx",
      q4Target: "100% mitigation execution",
      q4Actual: "100% complete and tabled to council",
      q4Poe: "Council_Approved_Risk_Register.pdf"
    },
    {
      id: "demo-2",
      strategicGoal: "Municipal Financial Viability and Management",
      kpiNo: "2",
      kpi: "Achieve 95% spend on capital budget allocations by 30 June 2027",
      description: "Capital budget utilization oversight against treasury guidelines.",
      bsd: true,
      led: false,
      mfvm: true,
      ggpp: false,
      midt: false,
      sr: false,
      kpa: "KPA 4: Municipal Financial Viability and Management",
      mscoaCode: "FM-402",
      baseline: "92% spend in previous year",
      budget: "R 24,500,000",
      annualTarget: "95% spend of R24.5m",
      q1Target: "20% capex spent",
      q1Actual: "22.4% spend logged with Finance",
      q1Poe: "Treasury_Q1_Spend_Report.xlsx",
      q2Target: "50% capex spent",
      q2Actual: "48.9% spend achieved",
      q2Poe: "Treasury_Q2_Spend_Report.xlsx",
      midtermTarget: "Internal audit verified spend audit",
      midtermActual: "Capital expenditure audit completed with minor findings",
      midtermPoe: "IA_Capex_Opinion_Signed.pdf",
      q3Target: "75% capex spent",
      q3Actual: "76.1% capex spent and verified",
      q3Poe: "Treasury_Q3_Spend_Report.xlsx",
      q4Target: "95% capex spent",
      q4Actual: "96.5% capex spent and finalized",
      q4Poe: "Treasury_Q4_Spend_Report.xlsx"
    }
  ];

  const getPeriodData = (item: any, p: 'Q1' | 'Q2' | 'Mid Term' | 'Q3' | 'Q4') => {
    let target = 'N/A';
    let actual = 'N/A';
    let poe = 'N/A';
    switch (p) {
      case 'Q1':
        target = item.q1Target || item.q1 || 'N/A';
        actual = item.q1Actual || 'N/A';
        poe = item.q1Poe || item.poe || 'N/A';
        break;
      case 'Q2':
        target = item.q2Target || item.q2 || 'N/A';
        actual = item.q2Actual || 'N/A';
        poe = item.q2Poe || item.poe || 'N/A';
        break;
      case 'Mid Term':
        target = item.midtermTarget || item.midTermTarget || 'N/A';
        actual = item.midtermActual || item.midTermActual || 'N/A';
        poe = item.midtermPoe || item.midTermPoe || 'N/A';
        break;
      case 'Q3':
        target = item.q3Target || item.q3 || 'N/A';
        actual = item.q3Actual || 'N/A';
        poe = item.q3Poe || item.poe || 'N/A';
        break;
      case 'Q4':
        target = item.q4Target || item.q4 || 'N/A';
        actual = item.q4Actual || 'N/A';
        poe = item.q4Poe || item.poe || 'N/A';
        break;
    }
    return {
      target,
      actual,
      poe,
      progress: calculateProgressPercentage(target, actual)
    };
  };

  const handleDownloadCustomReport = (format: 'Word' | 'Excel') => {
    const termLabel = getPeriodLabel(selectedPeriod);
    const filename = `${planMetadata.name.replace(/\s+/g, '_')}_${termLabel.replace(/\s+/g, '_')}_Performance_Report.${format === 'Word' ? 'doc' : 'xls'}`;
    
    let fileContent = '';
    let mimeType = '';

    if (format === 'Word') {
      mimeType = 'application/msword';
      fileContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>Performance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e293b; font-size: 18px; text-transform: uppercase; margin-bottom: 5px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .meta-table td { padding: 6px; border: 1px solid #cbd5e1; }
          .rep-table { width: 100%; border-collapse: collapse; font-size: 9px; }
          .rep-table th { background-color: #0f172a; color: white; padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; }
          .rep-table td { padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; }
          .text-center { text-align: center; }
        </style>
        </head>
        <body>
          <h1>Performance Report: ${termLabel}</h1>
          <p style="font-size: 10px; color: #64748b; margin-bottom: 15px;">Generated on ${new Date().toLocaleString()}</p>
          
          <table class="meta-table">
            <tr>
              <td><strong>Full Name</strong></td><td>${planMetadata.name || 'N/A'}</td>
              <td><strong>Username/Email</strong></td><td>${planMetadata.email || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Position / Level</strong></td><td>${planMetadata.position || planMetadata.level || 'N/A'}</td>
              <td><strong>Department</strong></td><td>${planMetadata.department || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Manager</strong></td><td>${planMetadata.manager || 'N/A'}</td>
              <td><strong>Manager Email</strong></td><td>${planMetadata.managerEmail || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Financial Year</strong></td><td colspan="3">${planMetadata.period || '2025/2026 Financial Year'}</td>
            </tr>
          </table>

          <table class="rep-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Strategic Objective</th>
                <th>KPI No</th>
                <th>KPI</th>
                <th>Description</th>
                <th>BSD</th>
                <th>LED</th>
                <th>MFVM</th>
                <th>GGPP</th>
                <th>MIDT</th>
                <th>SR</th>
                <th>Functional Area KPA</th>
                <th>MSCOA Code</th>
                <th>Baseline</th>
                <th>Budget</th>
                <th>Annual Target</th>
                <th>${termLabel} Target</th>
                <th>${termLabel} Actual</th>
                <th style="width: 120px;">Progress (QTR & Annual)</th>
                <th>${termLabel} POE</th>
              </tr>
            </thead>
            <tbody>
              ${planItems.map((item: any, idx: number) => {
                const pd = getPeriodData(item, selectedPeriod);
                const annualProgress = calculateProgressPercentage(item.annualTarget, item.annualActual);
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.strategicGoal || item.strategicObjective || 'N/A'}</td>
                    <td>${item.kpiNo || 'N/A'}</td>
                    <td>${item.kpi || 'N/A'}</td>
                    <td>${item.description || item.kpi || 'N/A'}</td>
                    <td class="text-center">${item.bsd ? 'X' : ''}</td>
                    <td class="text-center">${item.led ? 'X' : ''}</td>
                    <td class="text-center">${item.mfvm ? 'X' : ''}</td>
                    <td class="text-center">${item.ggpp ? 'X' : ''}</td>
                    <td class="text-center">${item.midt ? 'X' : ''}</td>
                    <td class="text-center">${item.sr ? 'X' : ''}</td>
                    <td>${item.kpa || 'N/A'}</td>
                    <td>${item.mscoaCode || 'N/A'}</td>
                    <td>${item.baseline || 'N/A'}</td>
                    <td>${item.budget || 'N/A'}</td>
                    <td>${item.annualTarget || 'N/A'}</td>
                    <td>${pd.target}</td>
                    <td>${pd.actual}</td>
                    <td class="text-center">
                      <div style="font-size: 10px; text-align: left; margin-bottom: 2px;">QTR: <b>${pd.progress}%</b></div>
                      <div style="width: 100%; background: #eee; height: 6px; border-radius: 3px; margin-bottom: 6px; overflow: hidden;">
                        <div style="width: ${Math.min(pd.progress, 100)}%; height: 100%; background: ${pd.progress >= 100 ? '#10b981' : pd.progress >= 50 ? '#f59e0b' : '#f43f5e'};"></div>
                      </div>
                      <div style="font-size: 10px; text-align: left; margin-bottom: 2px;">ANNUAL: <b>${annualProgress}%</b></div>
                      <div style="width: 100%; background: #eee; height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${Math.min(annualProgress, 100)}%; height: 100%; background: ${annualProgress >= 100 ? '#10b981' : annualProgress >= 50 ? '#f59e0b' : '#f43f5e'};"></div>
                      </div>
                    </td>
                    <td>${pd.poe}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
    } else {
      mimeType = 'application/vnd.ms-excel';
      fileContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>
        <body>
          <table>
            <tr><th colspan="20" style="font-size: 14px; font-weight: bold; background-color: #1e1b4b; color: white; text-align: center;">PERFORMANCE PLAN - ${termLabel.toUpperCase()}</th></tr>
            <tr><td colspan="2"><strong>Employee Name:</strong></td><td colspan="4">${planMetadata.name || 'N/A'}</td><td colspan="2"><strong>Username/Email:</strong></td><td colspan="12">${planMetadata.email || 'N/A'}</td></tr>
            <tr><td colspan="2"><strong>Position / Level:</strong></td><td colspan="4">${planMetadata.position || planMetadata.level || 'N/A'}</td><td colspan="2"><strong>Department:</strong></td><td colspan="12">${planMetadata.department || 'N/A'}</td></tr>
            <tr><td colspan="2"><strong>Manager:</strong></td><td colspan="4">${planMetadata.manager || 'N/A'}</td><td colspan="2"><strong>Manager Email:</strong></td><td colspan="12">${planMetadata.managerEmail || 'N/A'}</td></tr>
            <tr><td colspan="2"><strong>Financial Year:</strong></td><td colspan="18">${planMetadata.period || '2025/2026 Financial Year'}</td></tr>
            <tr><td colspan="20"></td></tr>
            <thead>
              <tr>
                <th style="background-color: #0f172a; color: white;">No.</th>
                <th style="background-color: #0f172a; color: white;">Strategic Objective</th>
                <th style="background-color: #0f172a; color: white;">KPI No</th>
                <th style="background-color: #0f172a; color: white;">KPI</th>
                <th style="background-color: #0f172a; color: white;">Description</th>
                <th style="background-color: #0f172a; color: white;">BSD</th>
                <th style="background-color: #0f172a; color: white;">LED</th>
                <th style="background-color: #0f172a; color: white;">MFVM</th>
                <th style="background-color: #0f172a; color: white;">GGPP</th>
                <th style="background-color: #0f172a; color: white;">MIDT</th>
                <th style="background-color: #0f172a; color: white;">SR</th>
                <th style="background-color: #0f172a; color: white;">Functional Area KPA</th>
                <th style="background-color: #0f172a; color: white;">MSCOA Code</th>
                <th style="background-color: #0f172a; color: white;">Baseline</th>
                <th style="background-color: #0f172a; color: white;">Budget</th>
                <th style="background-color: #0f172a; color: white;">Annual Target</th>
                <th style="background-color: #0f172a; color: white;">${termLabel} Target</th>
                <th style="background-color: #0f172a; color: white;">${termLabel} Actual</th>
                <th style="background-color: #0f172a; color: white;">Progress (QTR & ANNUAL)</th>
                <th style="background-color: #0f172a; color: white;">${termLabel} POE</th>
              </tr>
            </thead>
            <tbody>
              ${planItems.map((item: any, idx: number) => {
                const pd = getPeriodData(item, selectedPeriod);
                const annualProgress = calculateProgressPercentage(item.annualTarget, item.annualActual);
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.strategicGoal || item.strategicObjective || 'N/A'}</td>
                    <td>${item.kpiNo || 'N/A'}</td>
                    <td>${item.kpi || 'N/A'}</td>
                    <td>${item.description || item.kpi || 'N/A'}</td>
                    <td align="center">${item.bsd ? 'X' : ''}</td>
                    <td align="center">${item.led ? 'X' : ''}</td>
                    <td align="center">${item.mfvm ? 'X' : ''}</td>
                    <td align="center">${item.ggpp ? 'X' : ''}</td>
                    <td align="center">${item.midt ? 'X' : ''}</td>
                    <td align="center">${item.sr ? 'X' : ''}</td>
                    <td>${item.kpa || 'N/A'}</td>
                    <td>${item.mscoaCode || 'N/A'}</td>
                    <td>${item.baseline || 'N/A'}</td>
                    <td>${item.budget || 'N/A'}</td>
                    <td>${item.annualTarget || 'N/A'}</td>
                    <td>${pd.target}</td>
                    <td>${pd.actual}</td>
                    <td align="center"><b>QTR: ${pd.progress}% | ANNUAL: ${annualProgress}%</b></td>
                    <td>${pd.poe}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShortcutClick = (period: 'Q1' | 'Q2' | 'Mid Term' | 'Q3' | 'Q4', format: 'Word' | 'Excel' | 'PDF') => {
    setSelectedPeriod(period);
    if (format === 'PDF') {
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      setTimeout(() => {
        handleDownloadCustomReport(format);
      }, 100);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2 py-0.5 bg-slate-150 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
      case 'Pending Review':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
      case 'Supervisor Approved':
      case 'Internal Audit Approved':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {status}</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {status}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-slate-900">
      <style>{`
        @media print {
          header, footer, nav, .no-print, button, select, input {
            display: none !important;
          }
          body, #root, main, .flex, .flex-col, .overflow-y-auto {
            background: white !important;
            color: black !important;
            overflow: visible !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 4mm 6mm !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .printable-table-wrapper {
            overflow: visible !important;
            width: 100% !important;
          }
          .printable-table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            font-size: 6px !important;
            line-height: 1.1 !important;
          }
          .printable-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: bold !important;
            border: 1px solid #94a3b8 !important;
            padding: 2px 3px !important;
            text-transform: uppercase !important;
          }
          .printable-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 2px 3px !important;
            word-break: break-all !important;
            word-wrap: break-word !important;
            white-space: normal !important;
            color: #334155 !important;
          }
          .printable-table .text-center {
            text-align: center !important;
          }
          .print-meta-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            padding: 10px !important;
            margin-bottom: 12px !important;
            border-radius: 6px !important;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div className="bg-slate-900 text-white p-6 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative z-20 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl relative overflow-hidden group">
            <FileBarChart className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Performance Reports & Routing Workspace
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Compile and route audited/moderated performance agreements down delegation trees securely</p>
          </div>
        </div>

        <div className="flex bg-slate-850 rounded-xl p-1 shrink-0 border border-slate-705 font-semibold text-xs text-white">
          <button 
            onClick={() => setActiveTab('catalogue')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${activeTab === 'catalogue' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            Reports Catalogue
          </button>
          <button 
            onClick={() => setActiveTab('dispatcher')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'dispatcher' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Governance Dispatches
          </button>
          <button 
            onClick={() => setActiveTab('jsc_reporting')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'jsc_reporting' ? 'bg-orange-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            JSC Analytical Reporting
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 print:p-0 print:bg-white">
        <div className="max-w-7xl mx-auto space-y-6 print:max-w-full print:space-y-4">

          {activeTab === 'jsc_reporting' ? (
            <JSCAnalyticalReportingSection currentUser={currentUser} activeTenantId={activeTenantId} />
          ) : activeTab === 'catalogue' ? (
            <div className="space-y-6 print:space-y-4">
              
              {/* Dynamic Interactive Report Selection Console */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 no-print">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-850 uppercase tracking-tight flex items-center gap-1.5">
                      <span>📊 Custom Quarter & Mid-Term Report Compiler</span>
                    </h3>
                    <p className="text-slate-500 text-xs font-semibold">
                      Select a teammate and a reporting period to compile a landscaped A4-ready high-fidelity performance review table.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Employee Selector */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teammate</label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-indigo-500 max-w-xs"
                      >
                        {teamPlans.map((tp: any) => (
                          <option key={tp.userId} value={tp.userId}>
                            {tp.plan?.metadata?.name || tp.userId} ({tp.plan?.metadata?.position || 'Employee'})
                          </option>
                        ))}
                        {!teamPlans.some((tp: any) => tp.userId?.toLowerCase() === currentUser.email?.toLowerCase()) && (
                          <option value={currentUser.email || 'myself'}>
                            {currentUser.fullName || 'Myself'} ({currentUser.role || 'Active Teammate'})
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Period Selector */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reporting Period</label>
                      <select
                        value={selectedPeriod}
                        onChange={(e: any) => setSelectedPeriod(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-indigo-500"
                      >
                        <option value="Q1">Quarter 1 (Q1)</option>
                        <option value="Q2">Quarter 2 (Q2)</option>
                        <option value="Mid Term">Mid Term (Mid-Year Review)</option>
                        <option value="Q3">Quarter 3 (Q3)</option>
                        <option value="Q4">Quarter 4 / Annual (Q4)</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4">
                      <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs select-none"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print / PDF
                      </button>
                      <button
                        onClick={() => handleDownloadCustomReport('Word')}
                        className="bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 text-xs font-extrabold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 select-none"
                      >
                        Word
                      </button>
                      <button
                        onClick={() => handleDownloadCustomReport('Excel')}
                        className="bg-slate-100 hover:bg-slate-200 text-emerald-700 border border-slate-200 text-xs font-extrabold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 select-none"
                      >
                        Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Landscape Report Card Block */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 print-container print:border-none print:shadow-none print:p-0">
                
                {/* Printable Header */}
                <div className="flex justify-between items-start border-b border-slate-150 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Individual Performance Assessment Report
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Formal performance plan assessment ledger for <span className="text-indigo-600 font-extrabold">{getPeriodLabel(selectedPeriod)}</span>
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-bold uppercase no-print">
                    Live Report Preview
                  </div>
                </div>

                {/* Person Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold print-meta-grid bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Full Name</p>
                    <p className="text-slate-800 text-sm font-black mt-0.5">{planMetadata.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Username / Email</p>
                    <p className="text-slate-800 text-sm font-black mt-0.5">{planMetadata.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Position & Level</p>
                    <p className="text-slate-800 text-sm font-black mt-0.5">{planMetadata.position || planMetadata.level || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Supervisor / Manager</p>
                    <p className="text-slate-800 text-sm font-black mt-0.5">{planMetadata.manager || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Manager Email</p>
                    <p className="text-slate-800 text-sm font-black mt-0.5">{planMetadata.managerEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Financial Year & Term</p>
                    <p className="text-slate-800 text-sm font-black mt-0.5">
                      {planMetadata.period || '2025/2026 Financial Year'} — <span className="text-indigo-600 font-extrabold">{getPeriodLabel(selectedPeriod)}</span>
                    </p>
                  </div>
                </div>

                {/* Dense 19-Column Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 printable-table-wrapper">
                  <table className="w-full text-left border-collapse printable-table text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-8 shrink-0">No.</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-28 shrink-0">Strategic Objective</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-12 shrink-0">KPI No</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-32 shrink-0">KPI</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-32 shrink-0">Description</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-8 shrink-0 text-center">BSD</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-8 shrink-0 text-center">LED</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-8 shrink-0 text-center">MFVM</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-8 shrink-0 text-center">GGPP</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-8 shrink-0 text-center">MIDT</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-8 shrink-0 text-center">SR</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-24 shrink-0">Functional Area KPA</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-16 shrink-0">MSCOA Code</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-20 shrink-0">Baseline</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-16 shrink-0">Budget</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-24 shrink-0">Annual Target</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-24 shrink-0">{getPeriodLabel(selectedPeriod)} Target</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-24 shrink-0">{getPeriodLabel(selectedPeriod)} Actual</th>
                        <th className="p-2 border-r border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-24 shrink-0 text-center">Progress (QTR & ANNUAL)</th>
                        <th className="p-2 text-slate-800 font-extrabold uppercase tracking-wider text-[8px] w-24 shrink-0">{getPeriodLabel(selectedPeriod)} POE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planItems.map((item: any, idx: number) => {
                        const pData = getPeriodData(item, selectedPeriod);
                        const annualProgress = calculateProgressPercentage(item.annualTarget, item.annualActual);
                        return (
                          <tr key={item.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                            <td className="p-2 border-r border-slate-150 font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-150 font-bold text-slate-700">{item.strategicGoal || item.strategicObjective || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 font-black text-slate-800">{item.kpiNo || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 font-medium text-slate-600 leading-snug">{item.kpi || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 font-medium text-slate-500 leading-snug">{item.description || item.kpi || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 text-center font-bold text-indigo-600">{item.bsd ? '✓' : ''}</td>
                            <td className="p-2 border-r border-slate-150 text-center font-bold text-indigo-600">{item.led ? '✓' : ''}</td>
                            <td className="p-2 border-r border-slate-150 text-center font-bold text-indigo-600">{item.mfvm ? '✓' : ''}</td>
                            <td className="p-2 border-r border-slate-150 text-center font-bold text-indigo-600">{item.ggpp ? '✓' : ''}</td>
                            <td className="p-2 border-r border-slate-150 text-center font-bold text-indigo-600">{item.midt ? '✓' : ''}</td>
                            <td className="p-2 border-r border-slate-150 text-center font-bold text-indigo-600">{item.sr ? '✓' : ''}</td>
                            <td className="p-2 border-r border-slate-150 text-slate-600">{item.kpa || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 font-mono text-[9px] text-slate-500">{item.mscoaCode || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 text-slate-600">{item.baseline || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 font-semibold text-slate-600">{item.budget || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 font-semibold text-slate-800">{item.annualTarget || 'N/A'}</td>
                            <td className="p-2 border-r border-slate-150 font-semibold text-indigo-700 bg-indigo-50/25">{pData.target}</td>
                            <td className="p-2 border-r border-slate-150 font-semibold text-emerald-700 bg-emerald-50/25">{pData.actual}</td>
                            <td className="p-2 border-r border-slate-150 text-center font-extrabold text-slate-700">
                              <div className="flex flex-col gap-1.5 min-w-[80px]">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex justify-between text-[8px] font-black uppercase">
                                    <span className="text-slate-500">QTR</span>
                                    <span className={pData.progress >= 100 ? 'text-emerald-600' : pData.progress >= 50 ? 'text-amber-600' : 'text-rose-600'}>{pData.progress}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-700 ease-out ${pData.progress >= 100 ? 'bg-emerald-500' : pData.progress >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(pData.progress, 100)}%` }} />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex justify-between text-[8px] font-black uppercase">
                                    <span className="text-slate-500">ANNUAL</span>
                                    <span className={annualProgress >= 100 ? 'text-emerald-600' : annualProgress >= 50 ? 'text-amber-600' : 'text-rose-600'}>{annualProgress}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-700 ease-out ${annualProgress >= 100 ? 'bg-emerald-500' : annualProgress >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(annualProgress, 100)}%` }} />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2 text-slate-500 italic break-all max-w-[120px]">{pData.poe}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Classic Rapid Shortcut Cards Catalogue */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm no-print">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Elected Performance Report Shortcuts Catalogue
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map(report => {
                    // map period key
                    let mappedPeriod: 'Q1' | 'Q2' | 'Mid Term' | 'Q3' | 'Q4' = 'Q1';
                    if (report.period === 'Q2') mappedPeriod = 'Q2';
                    else if (report.period === 'Mid Term') mappedPeriod = 'Mid Term';
                    else if (report.period === 'Q3') mappedPeriod = 'Q3';
                    else if (report.period === 'Q4' || report.period === 'Annual') mappedPeriod = 'Q4';

                    return (
                      <div key={report.id} className="border border-slate-250 rounded-xl bg-white shadow-xs flex flex-col hover:shadow-md transition overflow-hidden text-xs">
                        <div className="p-5 flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                               <span className="bg-slate-150 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{report.type}</span>
                               <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{report.period}</span>
                            </div>
                            {getStatusBadge(report.status)}
                          </div>
                          <h3 className="font-extrabold text-slate-800 text-sm mb-2">{report.title}</h3>
                          <p className="text-slate-500 font-medium leading-relaxed">System-generated summary aggregating metrics, narrative descriptions, and compliance audits for instant download.</p>
                        </div>
                        <div className="bg-slate-50 border-t border-slate-150 p-3 flex flex-col gap-2">
                            <div className="grid grid-cols-3 gap-1">
                              <button 
                                onClick={() => handleShortcutClick(mappedPeriod, 'Word')}
                                className="flex justify-center items-center gap-1 px-2 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 rounded-md font-bold transition-colors shadow-xs cursor-pointer"
                              >
                                Word
                              </button>
                              <button 
                                onClick={() => handleShortcutClick(mappedPeriod, 'Excel')}
                                className="flex justify-center items-center gap-1 px-2 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 text-emerald-700 rounded-md font-bold transition-colors shadow-xs cursor-pointer"
                              >
                                Excel
                              </button>
                              <button 
                                onClick={() => handleShortcutClick(mappedPeriod, 'PDF')}
                                className="flex justify-center items-center gap-1 px-2 py-1.5 bg-white hover:bg-red-50 border border-slate-200 text-red-700 rounded-md font-bold transition-colors shadow-xs cursor-pointer"
                              >
                                Print
                              </button>
                            </div>
                            <button 
                              onClick={() => handleSendToReview(report.id)}
                              disabled={report.status !== 'Draft' || loadingAction === report.id}
                              className={`w-full flex justify-center items-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${report.status === 'Draft' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs' : 'bg-slate-150 text-slate-400 cursor-not-allowed'}`}
                            >
                              {loadingAction === report.id ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Send to Review</>}
                            </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6 text-xs font-medium no-print">
              
              {/* Internal Auditor / Administrator panel: Dispatch new audit reports */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-tight">Auditor Dispatch Deck</h2>
                </div>
                
                <form onSubmit={handleAuditorDispatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Report Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. FY 25/26 Quarter 4 Moderated Final Outcome"
                      value={dispatchTitle}
                      onChange={(e) => setDispatchTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none font-semibold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Template Type</label>
                      <select 
                        value={dispatchType}
                        onChange={(e) => setDispatchType(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer font-semibold"
                      >
                        <option>Performance Plan</option>
                        <option>PDP</option>
                        <option>JSC</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Period</label>
                      <select 
                        value={dispatchPeriod}
                        onChange={(e) => setDispatchPeriod(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer font-semibold"
                      >
                        <option>Q1</option>
                        <option>Q2</option>
                        <option>Mid Term</option>
                        <option>Q3</option>
                        <option>Q4</option>
                        <option>Annual</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Audit Opinion Commentary</label>
                      <div className="flex items-center gap-3">
                        <label className="font-extrabold text-[9px] text-slate-500 uppercase flex items-center gap-1">Compliance Opinion:</label>
                        <select 
                          value={dispatchRating} 
                          onChange={(e: any) => setDispatchRating(e.target.value)}
                          className="bg-slate-100 border border-slate-200 text-[10px] font-bold rounded px-1.5 py-0.5 cursor-pointer outline-none"
                        >
                          <option>Compliant</option>
                          <option>Non-Compliant</option>
                          <option>With Reservations</option>
                        </select>
                      </div>
                    </div>
                    <textarea 
                      rows={3}
                      placeholder="Detail legislative findings, moderated portfolio adjustments, and official audit sign-off terms here..."
                      value={dispatchComments}
                      onChange={(e) => setDispatchComments(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none font-semibold leading-relaxed"
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex justify-end">
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold tracking-wide flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Compile and Dispatch Report to Line Managers
                    </button>
                  </div>
                </form>
              </div>

              {/* Line Manager Panel: Forward dispatches from internal audit */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-tight">Manager Forwarding Console</h2>
                </div>

                {sharedReports.filter(r => r.status === 'Dispatched to Managers').length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No incoming dispatched reviews pending managerial forwarding to subordinates at this moment.</p>
                ) : (
                  <form onSubmit={handleManagerForward} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Select Dispatched Audit Record</label>
                        <select 
                          value={forwardingReportId || ''} 
                          onChange={(e) => setForwardingReportId(e.target.value || null)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer font-semibold"
                        >
                          <option value="">-- Choose verified report to forward --</option>
                          {sharedReports.filter(r => r.status === 'Dispatched to Managers').map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.title} ({rep.period})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Subordinate Teammate Email Recipient</label>
                        <input 
                          type="email" 
                          placeholder="e.g. employee.john@nkangaladm.gov.za"
                          value={subordinateEmailInput}
                          onChange={(e) => setSubordinateEmailInput(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none font-semibold"
                        />
                      </div>

                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Manager Review Remarks & Cover Notes</label>
                      <textarea 
                        rows={2}
                        placeholder="Add your coaching directives, final scoring adjustments, or instructions for subordinate signoff..."
                        value={managerNotes}
                        onChange={(e) => setManagerNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none font-semibold leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={!forwardingReportId || !subordinateEmailInput.trim()}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold tracking-wide flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <CornerDownRight className="w-4 h-4" />
                        Forward Direct to Subordinate Teammate
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* LIVE DISPATCH FEED / RECEIPT LEDGER DISPLAY */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  Active Report Distribution & Sign-off Feeds
                </h2>

                <div className="space-y-4">
                  {sharedReports.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 font-bold uppercase">No reports routed yet</p>
                    </div>
                  ) : (
                    sharedReports.map(rep => {
                      const isMyIncomingReport = rep.subordinateEmail && rep.subordinateEmail.toLowerCase() === currentUser.email?.toLowerCase();
                      
                      return (
                        <div 
                          key={rep.id} 
                          className={`border rounded-xl p-5 ${
                            rep.status === 'Signed-Off by Subordinate' 
                              ? 'border-emerald-250 bg-emerald-50/20' 
                              : isMyIncomingReport 
                                ? 'border-amber-250 bg-amber-50/30 ring-2 ring-amber-450/60' 
                                : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-dashed border-slate-150">
                            <div>
                              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mr-2">
                                {rep.type}
                              </span>
                              <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                {rep.period}
                              </span>
                              <h3 className="font-extrabold text-slate-850 text-sm mt-1">{rep.title}</h3>
                            </div>
                            <div className="shrink-0">
                              {rep.status === 'Signed-Off by Subordinate' ? (
                                <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  ✓ Fully Signed-Off
                                </span>
                              ) : rep.status === 'Forwarded to Subordinates' ? (
                                <span className="px-3 py-1 bg-amber-500 text-white font-extrabold rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  ⚡ Pending Teammate Sign-Off
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-extrabold rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  ⎋ Dispatched to Line Managers
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content metrics and routing notes */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 text-xs font-semibold">
                            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/60">
                              <span className="text-[9px] font-black text-slate-450 uppercase block tracking-wider">Internal Audit Opinion</span>
                              <span className={`inline-block mt-1 mb-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                rep.auditorRating === 'Compliant' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {rep.auditorRating}
                              </span>
                              <p className="text-slate-600 leading-relaxed italic">"{rep.auditorComments}"</p>
                              <span className="text-[9px] font-bold text-slate-400 block mt-2">Certified by: {rep.auditorEmail}</span>
                            </div>

                            {rep.managerEmail && (
                              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/60">
                                <span className="text-[9px] font-black text-slate-450 uppercase block tracking-wider font-extrabold text-indigo-950">Manager Directives</span>
                                <p className="text-slate-600 leading-relaxed italic mt-2">"{rep.managerComments}"</p>
                                <span className="text-[9px] font-bold text-slate-400 block mt-2">Forwarded by: {rep.managerEmail}</span>
                                <span className="text-[9px] font-black text-indigo-600 block mt-1">Recipient: {rep.subordinateEmail}</span>
                              </div>
                            )}

                            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/60 flex flex-col justify-between">
                              <div>
                                <span className="text-[9px] font-black text-slate-450 uppercase block tracking-wider">Subordinate Sign-off</span>
                                {rep.subordinateSignature ? (
                                  <div className="mt-2.5 space-y-1">
                                    <p className="font-mono text-[11px] font-extrabold text-slate-800">
                                      Sign-off: <span className="underline italic text-indigo-700">{rep.subordinateSignature}</span>
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold">
                                      Date: {new Date(rep.signedOffAt || '').toLocaleString()}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-2.5">
                                    <p className="text-[10px] text-slate-450 leading-snug italic">Acknowledgment signature pending on this governance thread.</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1.5 mt-3 justify-end text-[10px]">
                                <button 
                                  onClick={() => handleDownloadCustomReport('Word')}
                                  className="p-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded shadow-xs cursor-pointer"
                                >
                                  Word
                                </button>
                                <button 
                                  onClick={() => handleDownloadCustomReport('Excel')}
                                  className="p-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded shadow-xs cursor-pointer"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* INCOMING ACTION BLOCK FOR RECEIVING SUBORDINATES */}
                          {isMyIncomingReport && rep.status === 'Forwarded to Subordinates' && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-250 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-amber-900">Formally Shared Assessment Awaiting Receipt Sign-Off</p>
                                <p className="text-amber-700 font-medium text-[10.5px]">Type your full name below to electronically authorize and sign off on this validated performance outline.</p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Type full name to sign"
                                  value={signOffName}
                                  onChange={(e) => setSignOffName(e.target.value)}
                                  className="px-2.5 py-1.5 bg-white border border-amber-200 focus:border-amber-500 rounded-lg outline-none font-bold placeholder:text-slate-450 text-xs shadow-inner"
                                />
                                <button 
                                  onClick={() => handleSubordinateSignOff(rep.id)}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-black tracking-wide shrink-0 transition shadow-xs cursor-pointer"
                                >
                                  Commit Sign-off
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
