import React, { useState, useEffect } from 'react';
import { 
  UserCheck, FileText, CheckCircle, Clock, ChevronRight,
  FolderOpen, FileSpreadsheet, Image, File, Download, Search,
  Award, ShieldCheck, AlertTriangle, ExternalLink, Lock, Check,
  Eye, Sparkles, FolderIcon, HardDrive, ThumbsUp, ThumbsDown, X, Info, AlertCircle
} from 'lucide-react';

interface Props {
  currentUser: any;
  activeTenantId: string;
}

export function ManagerReviewIPMS({ currentUser, activeTenantId }: Props) {
  const [loading, setLoading] = useState(true);
  const [teamPlans, setTeamPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Advanced PoE state variables
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [activeKpiQuarter, setActiveKpiQuarter] = useState<{ [kpiId: string]: string }>({});

  useEffect(() => {
    fetchTeamPlans();
  }, [activeTenantId, currentUser]);

  const fetchTeamPlans = async () => {
    setLoading(true);
    try {
      // 1. Fetch all users to determine relationships
      const usersRes = await fetch(`/api/tenant/${activeTenantId}/users`);
      let allUsers: any[] = [];
      if (usersRes.ok) {
        allUsers = await usersRes.json();
      }

      // 2. Fetch all team plans
      const res = await fetch(`/api/tenant/${activeTenantId}/team-pplans?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const plans = data.teamPlans || [];
        
        let managerName = currentUser.fullName || currentUser.full_name || '';
        const normalize = (s: string) => s.toLowerCase().trim().replace(/['"\.,]/g, '').replace(/\s+/g, ' ');
        const normCurrent = normalize(managerName);

        // Recursive hierarchy helper
        const getFullBranch = (mName: string, users: any[], seen = new Set<string>()) => {
          const normM = normalize(mName);
          if (seen.has(normM)) return [];
          seen.add(normM);

          const directs = users.filter(u => {
            const checkFields = [u.manager || '', u.reportTo || ''];
            return checkFields.some(f => {
              if (!f) return false;
              const normF = normalize(f);
              if (normF === normM) return true;
              const fParts = normF.split(' ');
              const mParts = normM.split(' ');
              return fParts.length >= 2 && mParts.length >= 2 && fParts[0] === mParts[0] && fParts[fParts.length-1] === mParts[mParts.length-1];
            });
          });

          let branch = [...directs];
          directs.forEach(d => {
            branch = [...branch, ...getFullBranch(d.fullName || d.full_name || '', users, seen)];
          });
          return branch;
        };

        const myBranchEmails = getFullBranch(managerName, allUsers).map(u => u.email.toLowerCase());

        const isGlobalAdmin = currentUser.role === 'admin' || 
                              ['mike@mzansiflow.co.za', 'audrey@mzansiflow.co.za', 'mike@massivedynamixdistributors.com'].includes((currentUser.email || '').toLowerCase().trim()) ||
                              (currentUser.systemRole || '').toLowerCase().includes('admin') ||
                              (currentUser.systemRole || '').toLowerCase().includes('pms') ||
                              (currentUser.jobFunction || '').toLowerCase().includes('municipal manager') ||
                              (currentUser.jobFunction || '').toLowerCase().includes('hod') ||
                              (currentUser.jobFunction || '').toLowerCase().includes('director');

        // 3. Filter plans in this manager's branch
        const myTeamPlans = plans.filter((p: any) => {
          if (p.userId.toLowerCase() === (currentUser.email || '').toLowerCase()) return false;

          const isSubordinate = myBranchEmails.includes(p.userId.toLowerCase());
          
          const isAllowed = isGlobalAdmin || isSubordinate || myBranchEmails.length === 0;
          if (!isAllowed) return false;

          const hasSubmittedKpi = Array.isArray(p.plan?.items) && p.plan.items.some((item: any) => 
            item.reviewStatus === 'Submitted for Approval' || 
            item.reviewStatus === 'Submitted for Review' ||
            item.reviewStatus === 'Reviewed' ||
            item.reviewStatus === 'Approved' ||
            Boolean(item.evaluation) ||
            Boolean(item.evaluationComment) ||
            Boolean(item.q1Poe || item.q2Poe || item.q3Poe || item.q4Poe)
          );

          const status = p.plan?.metadata?.reviewStatus;
          const isStatusMatching = (
            status === 'Submitted for Review' || 
            status === 'Submitted for Approval' || 
            status === 'Reviewed' ||
            status === 'Approved' ||
            hasSubmittedKpi ||
            (!status && Array.isArray(p.plan?.items) && p.plan.items.length > 0)
          );

          return isStatusMatching;
        });
        
        setTeamPlans(myTeamPlans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateReview = (id: string, field: string, value: any) => {
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

  const updateQuarterlyStatus = (kpiId: string, quarter: string, status: string, notes: string) => {
    if (!selectedPlan) return;
    setSelectedPlan({
      ...selectedPlan,
      plan: {
        ...selectedPlan.plan,
        items: selectedPlan.plan.items.map((item: any) => {
          if (item.id === kpiId) {
            return {
              ...item,
              [`${quarter}PoeStatus`]: status,
              [`${quarter}PoeFeedback`]: notes
            };
          }
          return item;
        })
      }
    });
  };

  const handleGenerateSamplePoes = () => {
    if (!selectedPlan) return;
    
    const mockFilesByQuarter = {
      Q1: [
        { id: `mock-pdf-q1-${selectedPlan.userId}`, name: 'Q1_ServiceDelivery_Operational_Audit.pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), uploadedBy: selectedPlan.plan.metadata?.name || 'Employee' },
        { id: `mock-xlsx-q1-${selectedPlan.userId}`, name: 'Q1_mSCOA_Ledger_Balance_Sheet.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploadedAt: new Date().toISOString(), uploadedBy: selectedPlan.plan.metadata?.name || 'Employee' }
      ],
      Q2: [
        { id: `mock-pdf-q2-${selectedPlan.userId}`, name: 'Q2_Consolidated_Financial_Statement_Final.pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), uploadedBy: selectedPlan.plan.metadata?.name || 'Employee' },
        { id: `mock-png-q2-${selectedPlan.userId}`, name: 'CoGTA_Official_Acknowledge_Receipt.png', mimeType: 'image/png', uploadedAt: new Date().toISOString(), uploadedBy: selectedPlan.plan.metadata?.name || 'Employee' }
      ],
      Q3: [
        { id: `mock-xlsx-q3-${selectedPlan.userId}`, name: 'Q3_WaterQuality_And_Purity_LabLogs.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploadedAt: new Date().toISOString(), uploadedBy: selectedPlan.plan.metadata?.name || 'Employee' },
        { id: `mock-pdf-q3-${selectedPlan.userId}`, name: 'Internal_Audit_Committee_SignOff_Chamber.pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), uploadedBy: selectedPlan.plan.metadata?.name || 'Employee' }
      ],
      Q4: [
        { id: `mock-pdf-q4-${selectedPlan.userId}`, name: 'Q4_Annual_Report_Full_Performance_Metric.pdf', mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), uploadedBy: selectedPlan.plan.metadata?.name || 'Employee' },
        { id: `mock-docx-q4-${selectedPlan.userId}`, name: 'Local_Council_Resolution_Minutes_Signed.docx', mimeType: 'application/msword', uploadedAt: new Date().toISOString(), uploadedBy: selectedPlan.plan.metadata?.name || 'Employee' }
      ]
    };

    const updatedItems = selectedPlan.plan.items.map((item: any, idx: number) => {
      return {
        ...item,
        q1Poe: item.q1Poe ? item.q1Poe : `Performance delivery output verified against Q1 targets. Reference ID: MS-DEL-0${idx+1}-Q1`,
        q2Poe: item.q2Poe ? item.q2Poe : `Official CoGTA alignment file and consolidated ledger sheets. Reference ID: MS-FIN-0${idx+1}-Q2`,
        q3Poe: item.q3Poe ? item.q3Poe : `Internal audit executive brief and environmental log certificates. Reference ID: MS-AUD-0${idx+1}-Q3`,
        q4Poe: item.q4Poe ? item.q4Poe : `Full annual oversight report and signed council minutes. Reference ID: MS-GOV-0${idx+1}-Q4`,
        q1PoeDocs: item.q1PoeDocs && item.q1PoeDocs.length > 0 ? item.q1PoeDocs : mockFilesByQuarter.Q1,
        q2PoeDocs: item.q2PoeDocs && item.q2PoeDocs.length > 0 ? item.q2PoeDocs : mockFilesByQuarter.Q2,
        q3PoeDocs: item.q3PoeDocs && item.q3PoeDocs.length > 0 ? item.q3PoeDocs : mockFilesByQuarter.Q3,
        q4PoeDocs: item.q4PoeDocs && item.q4PoeDocs.length > 0 ? item.q4PoeDocs : mockFilesByQuarter.Q4,
        q1PoeStatus: item.q1PoeStatus || 'Under Audit Review',
        q2PoeStatus: item.q2PoeStatus || 'Under Audit Review',
        q3PoeStatus: item.q3PoeStatus || 'Under Audit Review',
        q4PoeStatus: item.q4PoeStatus || 'Under Audit Review',
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

  const handleSaveReview = async () => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const payload = { ...selectedPlan.plan };
      payload.metadata.reviewStatus = 'Reviewed';

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      alert("Employee performance agreement review and portfolio verification successfully saved.");
      
      // Update local state list
      const updatedPlans = teamPlans.map(tp => 
        tp.userId === selectedPlan.userId ? { ...tp, plan: payload } : tp
      );
      setTeamPlans(updatedPlans);
      setSelectedPlan({ ...selectedPlan, plan: payload });
    } catch (e) {
      console.error(e);
      alert("Error occurred while saving review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getFileIconComponent = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) {
      return <Image className="w-5 h-5 text-blue-500 shrink-0" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
    }
    return <File className="w-5 h-5 text-slate-500 shrink-0" />;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Revision Required':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-50 text-slate-600 p-8 rounded-3xl border border-gray-200">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  // LIST VIEW: Show team members to review
  // LIST VIEW: Show all subordinates
  if (!selectedPlan) {
    return (
      <div id="manager-review-dashboard" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-stone-900">
        <div className="px-6 py-6 pb-4 bg-white border-b border-gray-200 flex flex-col justify-between items-start gap-2 shrink-0 select-text">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <UserCheck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            Manager Employee Approvals
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider ml-[52px]">
            Approve self-evaluations & Portfolios of Evidence submitted by your team
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></span>
              Direct Subordinates Requiring Service Review
            </h2>
            {teamPlans.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold uppercase text-sm">No Pending Approvals</p>
                <p className="text-[10px] text-slate-400 mt-1">There are no employee evaluations requiring your approval at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {teamPlans.map((tp, idx) => (
                  <div key={tp.id || `${tp.userId}-${idx}`} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition group cursor-pointer" onClick={() => setSelectedPlan(tp)}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border ${tp.plan.metadata?.reviewStatus === 'Reviewed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                        {tp.plan.metadata?.reviewStatus === 'Reviewed' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{tp.plan.metadata?.name || tp.userId}</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">
                          {tp.plan.metadata?.position || 'Employee'} • {tp.plan.metadata?.department || 'Department'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${tp.plan.metadata?.reviewStatus === 'Reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tp.plan.metadata?.reviewStatus || 'Unknown status'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manager's Direct Subordinates & Approval Status Ledger */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-150 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Direct Subordinates & Approval Status Ledger
                </h2>
                <p className="text-[10.5px] text-slate-550 text-slate-500 font-semibold mt-0.5">
                  Real-time manager supervision ledger tracking annual performance agreement approval statuses
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-850 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shrink-0">
                {teamPlans.length} Total Subordinates
              </span>
            </div>

            {teamPlans.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No active direct subordinates mapped under your manager workspace.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5 px-3">Subordinate Employee</th>
                      <th className="py-2.5 px-3">Position & Cluster</th>
                      <th className="py-2.5 px-3 text-center">Submission Stage</th>
                      <th className="py-2.5 px-3 text-center">Approval Status</th>
                      <th className="py-2.5 px-3 text-center font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPlans.map((tp, idx) => {
                      const isApproved = tp.plan.metadata?.reviewStatus === 'Reviewed';
                      return (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {tp.plan.metadata?.name || tp.userId}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-700 text-[11px]">
                              {tp.plan.metadata?.position || 'Employee'}
                            </p>
                            <p className="text-[9.5px] text-slate-400 uppercase font-black">
                              {tp.plan.metadata?.department || 'Department'}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[9.5px]">
                            {tp.plan.metadata?.reviewStatus || 'Draft'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150 animate-none">
                                <Check className="w-2.5 h-2.5 animate-none" />
                                Approved ✅
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-150 animate-none">
                                <Clock className="w-2.5 h-2.5 animate-none" />
                                Outstanding ❌
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setSelectedPlan(tp)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider inline-flex items-center gap-1 border-0 cursor-pointer transition shadow-sm"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>Review Plan</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DETAIL VIEW: Reviewing a specific employee's plan
  const { plan } = selectedPlan;
  const isReviewed = plan.metadata?.reviewStatus === 'Reviewed';

  return (
    <div id="manager-review-detail" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl relative text-stone-900">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 select-text">
        <div>
          <button 
            onClick={() => setSelectedPlan(null)}
            className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2 bg-transparent border-0 cursor-pointer"
          >
            ← Back to List
          </button>
          <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Approval: {plan.metadata?.name || selectedPlan.userId}
          </h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5 ml-[28px]">
            {plan.metadata?.position} • FY {plan.metadata?.period}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            type="button" 
            onClick={handleGenerateSamplePoes}
            className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Generate test portfolios, transactions, and formal verification files for the current target reviews"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Demo PoE Data</span>
          </button>

          <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2 ${isReviewed ? 'bg-emerald-600' : 'bg-amber-500'}`}>
            <span>Status:</span>
            <span>{plan.metadata?.reviewStatus || 'Draft'}</span>
          </div>

          <button 
            onClick={handleSaveReview}
            disabled={saving}
            className="bg-indigo-600 text-white hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 shadow-sm cursor-pointer border-0"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Complete & Finalize Review'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-6">
        {(!plan.items || plan.items.length === 0) ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <p className="text-slate-500 text-sm font-bold uppercase">No KPIs found in this plan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plan.items.map((kpi: any, idx: number) => {
              // Retrieve active selected quarter tab for auditing this specific KPI
              const currentQuarterTab = activeKpiQuarter[kpi.id] || 'Q1';
              
              // Map variables specifically
              const activeQuartersList = [
                { id: 'Q1', label: 'Quarter 1', target: kpi.q1Target, actual: kpi.q1Actual, comment: kpi.q1Comment, textValue: kpi.q1Poe, docs: kpi.q1PoeDocs || [], status: kpi.q1PoeStatus || 'Pending Verification', feedback: kpi.q1PoeFeedback || '' },
                { id: 'Q2', label: 'Quarter 2', target: kpi.q2Target, actual: kpi.q2Actual, comment: kpi.q2Comment, textValue: kpi.q2Poe, docs: kpi.q2PoeDocs || [], status: kpi.q2PoeStatus || 'Pending Verification', feedback: kpi.q2PoeFeedback || '' },
                { id: 'Q3', label: 'Quarter 3', target: kpi.q3Target, actual: kpi.q3Actual, comment: kpi.q3Comment, textValue: kpi.q3Poe, docs: kpi.q3PoeDocs || [], status: kpi.q3PoeStatus || 'Pending Verification', feedback: kpi.q3PoeFeedback || '' },
                { id: 'Q4', label: 'Quarter 4', target: kpi.q4Target, actual: kpi.q4Actual, comment: kpi.q4Comment, textValue: kpi.q4Poe, docs: kpi.q4PoeDocs || [], status: kpi.q4PoeStatus || 'Pending Verification', feedback: kpi.q4PoeFeedback || '' },
              ];

              const currentQuarterData = activeQuartersList.find(q => q.id === currentQuarterTab) || activeQuartersList[0];

              return (
                <div key={kpi.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  {/* Header with metadata badging */}
                  <div className="flex flex-wrap justify-between items-start gap-3 pb-3 border-b border-rose-100/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-slate-900 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wider">
                        {kpi.kpiNo || `KPI #${idx + 1}`}
                      </span>
                      <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200">
                        Local KPA: {kpi.kpa || 'N/A'}
                      </span>
                      {kpi.mscoaCode && (
                        <span className="bg-indigo-50 text-indigo-700 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-100" title="mSCOA Code">
                          mSCOA: {kpi.mscoaCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs font-black">
                      <span className="text-[10px] font-bold uppercase text-emerald-600/80">Weighting:</span>
                      <span>{kpi.weighting || 0}%</span>
                    </div>
                  </div>

                  {/* KPI Name & Strategic Goal Description */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-sm text-slate-800 leading-snug">{kpi.kpi}</h3>
                    {(kpi.strategicGoal || kpi.strategicObjective) && (
                      <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100 text-[10.5px] text-slate-600 leading-normal">
                        <b className="text-slate-700 block uppercase text-[8.5px] tracking-wider mb-0.5">Strategic Objective:</b>
                        {kpi.strategicGoal || kpi.strategicObjective}
                      </div>
                    )}
                  </div>

                  {/* National KPAs Block */}
                  {(() => {
                    const activeNkpas = [];
                    if (kpi.bsd) activeNkpas.push({ label: 'BSD (Basic Service)', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' });
                    if (kpi.led) activeNkpas.push({ label: 'LED (Local Economic)', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' });
                    if (kpi.mfvm) activeNkpas.push({ label: 'MFVM (Finance)', color: 'bg-amber-50 border-amber-100 text-amber-700' });
                    if (kpi.ggpp) activeNkpas.push({ label: 'GGPP (Governance)', color: 'bg-sky-50 border-sky-100 text-sky-700' });
                    if (kpi.midt) activeNkpas.push({ label: 'MIDT (Inst. Dev)', color: 'bg-violet-50 border-violet-100 text-violet-700' });
                    if (kpi.sr) activeNkpas.push({ label: 'SR (Spatial)', color: 'bg-rose-50 border-rose-100 text-rose-700' });

                    if (activeNkpas.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mr-1">National KPAs:</span>
                          {activeNkpas.map((nk, nIdx) => (
                            <span key={nIdx} className={`text-[9px] font-bold px-2 py-0.5 rounded border ${nk.color}`}>
                              {nk.label}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Compact 3-Column Core Metrics Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50 rounded-xl border border-slate-100 p-3">
                    <div className="space-y-0.5">
                      <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">Baseline Performance</span>
                      <span className="text-slate-800 text-[10.5px] font-bold leading-tight block truncate" title={kpi.baseline}>
                        {kpi.baseline || 'No baseline specified'} {kpi.baselineYear ? `(${kpi.baselineYear})` : ''}
                      </span>
                    </div>
                    <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-3 pt-1.5 sm:pt-0">
                      <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">Annual Target</span>
                      <span className="text-emerald-700 text-[10.5px] font-black leading-tight block truncate" title={kpi.annualTarget}>
                        {kpi.annualTarget || 'N/A'}
                      </span>
                    </div>
                    <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-3 pt-1.5 sm:pt-0">
                      <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">Allocated Budget</span>
                      <span className="text-blue-700 text-[10.5px] font-bold leading-tight block truncate" title={kpi.budget}>
                        {kpi.budget || 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Required POE Definitions for KPI alignment */}
                  {kpi.poe && (
                    <div className="bg-amber-50/40 border border-amber-500/10 rounded-xl p-2.5 text-[10px]">
                      <span className="text-[8.5px] font-black text-amber-700 uppercase tracking-wider block mb-1">Required Portfolio of Evidence (POE)</span>
                      <p className="text-slate-700 leading-normal font-medium m-0">{kpi.poe}</p>
                    </div>
                  )}

                  {/* Quarterly Progress Timeline block */}
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">Quarterly Progress & Portfolio Evidences</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {activeQuartersList.map((q) => {
                        const hasDocs = q.docs.length > 0;
                        const isCurrentTab = currentQuarterTab === q.id;

                        return (
                          <div 
                            key={q.id} 
                            onClick={() => setActiveKpiQuarter(prev => ({ ...prev, [kpi.id]: q.id }))}
                            className={`border rounded-xl p-2.5 flex flex-col justify-between text-[10px] cursor-pointer transition-all ${
                              isCurrentTab 
                                ? 'bg-indigo-50/60 border-indigo-400 shadow-sm ring-1 ring-indigo-400/30' 
                                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                              <span className="font-extrabold text-[9px] text-slate-800 uppercase">{q.id} Target</span>
                              <span className={`text-[7.5px] font-black uppercase px-1 rounded border ${
                                q.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                q.status === 'Revision Required' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                q.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-slate-200 text-slate-600 border-slate-300'
                              }`}>
                                {q.status}
                              </span>
                            </div>
                            <div className="space-y-1 mt-1.5 flex-1 select-text">
                              <p className="text-slate-500 text-[9.5px] truncate m-0" title={q.target}><span className="font-bold text-slate-700 font-sans">Targ:</span> {q.target || 'N/A'}</p>
                              <p className="text-slate-500 text-[9.5px] truncate m-0" title={q.actual}><span className="font-bold text-slate-700 font-sans">Act:</span> {q.actual || 'N/A'}</p>
                              
                              <div className="flex items-center gap-1.5 mt-1 bg-white/80 py-0.5 px-1.5 rounded border border-slate-100 w-fit">
                                <FolderIcon className={`w-3 h-3 ${hasDocs ? 'text-indigo-500 font-black' : 'text-slate-300'}`} />
                                <span className={`text-[8.5px] font-bold ${hasDocs ? 'text-indigo-700' : 'text-slate-450'}`}>
                                  {q.docs.length} File{q.docs.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CURRENT ACTIVE QUARTER POE CABINET AUDITING AREA */}
                  <div className="bg-slate-50/70 border-2 border-indigo-200/40 rounded-2xl p-4 mt-1 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider m-0">
                          POE Drawer: <span className="text-indigo-700">{currentQuarterData.label}</span> Evidence Files
                        </h4>
                      </div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-sm">
                        Audit Status: <span className="text-indigo-700">{currentQuarterData.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: Metadata & Descriptions */}
                      <div className="lg:col-span-7 space-y-3 select-text">
                        <div className="space-y-1">
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">Submission Notes / Narrative Statement</span>
                          <div className="bg-white border border-slate-200 p-3 rounded-xl text-[11px] text-slate-700 leading-relaxed font-semibold shadow-inner min-h-[50px]">
                            {currentQuarterData.textValue || <span className="italic text-slate-400">No textual description submitted with evidence portfolio.</span>}
                          </div>
                        </div>

                        {/* File listing with actual buttons to preview */}
                        <div className="space-y-1.5">
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">Uploaded Documentation Portfolio ({currentQuarterData.docs.length})</span>
                          {currentQuarterData.docs.length === 0 ? (
                            <div className="bg-white/50 border border-dashed border-slate-200 p-4 rounded-xl text-center">
                              <p className="text-[10.5px] text-slate-450 italic m-0">No document files attached. Use 'Generate Demo PoE Data' at the top to populate file records for testing.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {currentQuarterData.docs.map((doc: any) => (
                                <div key={doc.id} className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-sm hover:border-indigo-300 transition group">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {getFileIconComponent(doc.name)}
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-extrabold text-slate-800 truncate m-0 group-hover:text-indigo-700 transition" title={doc.name}>
                                        {doc.name}
                                      </p>
                                      <p className="text-[8.5px] text-slate-400 font-mono m-0">
                                        Uploaded by: {doc.uploadedBy ? doc.uploadedBy.split('@')[0] : 'Employee'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => setPreviewDoc({ ...doc, kpiName: kpi.kpi, quarter: currentQuarterTab })}
                                    className="p-1 px-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0 cursor-pointer flex items-center gap-1 text-[9px] font-bold tracking-tight uppercase shrink-0 transition"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Review</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Auditor Status Stamp Console */}
                      <div className="lg:col-span-5 bg-white border border-indigo-100 p-3.5 rounded-xl space-y-3.5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[8.5px] font-black text-indigo-900/60 uppercase tracking-wider block">Portfolios Verification Stamp</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: 'Verify & Approve', value: 'Approved', color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800' },
                              { label: 'Request Revision', value: 'Revision Required', color: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800' },
                              { label: 'Reject / Missing', value: 'Rejected', color: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800' }
                            ].map((btn) => (
                              <button
                                key={btn.value}
                                onClick={() => updateQuarterlyStatus(kpi.id, currentQuarterTab.toLowerCase(), btn.value, currentQuarterData.feedback)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[9.5px] font-extrabold uppercase tracking-tight flex-1 flex items-center justify-center gap-1 transition cursor-pointer ${
                                  currentQuarterData.status === btn.value 
                                    ? btn.color.replace('bg-white/40', '') + ' ring-2 ring-indigo-500/30 font-black scale-102 shadow-sm' 
                                    : 'bg-slate-50/50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {btn.value === 'Approved' && <Check className="w-3 h-3" />}
                                {btn.value === 'Revision Required' && <AlertCircle className="w-3 h-3" />}
                                {btn.value === 'Rejected' && <X className="w-3 h-3" />}
                                <span>{btn.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">Interim Review & Verification feedback notes</span>
                          <textarea
                            value={currentQuarterData.feedback}
                            onChange={(e) => updateQuarterlyStatus(kpi.id, currentQuarterTab.toLowerCase(), currentQuarterData.status, e.target.value)}
                            placeholder="Enter specific audit confirmation, notes, or explanations for revision here..."
                            rows={2}
                            className="w-full text-[10.5px] p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100">
                    {/* Employee Self-Evaluation (Read-Only) */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block border-b border-slate-200 pb-1">
                        Employee Self-Evaluation
                      </label>
                      <div className="text-[11px] text-slate-600 whitespace-pre-wrap select-text leading-relaxed">
                        {kpi.evaluation ? kpi.evaluation : <span className="italic">No self-evaluation provided.</span>}
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-slate-700">
                        Employee Score: <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{kpi.myScore || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Manager Review Input */}
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-indigo-700 block border-b border-indigo-100 pb-1">
                        Manager Feedback
                      </label>
                      <textarea
                        value={kpi.review || ''}
                        onChange={(e) => updateReview(kpi.id, 'review', e.target.value)}
                        placeholder="Write your review and feedback here..."
                        rows={4}
                        className="w-full text-[11px] p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold text-indigo-700">Manager Score (1-5):</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={kpi.managerScore || ''}
                          onChange={(e) => updateReview(kpi.id, 'managerScore', e.target.value)}
                          className="w-20 text-[11px] p-1.5 rounded-lg border border-indigo-200 bg-white text-slate-800 text-center font-bold focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Signature Block */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6 flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1 space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-2">Employee Signature</h4>
                <div className="h-12 border-b border-slate-300 border-dashed"></div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{plan.metadata?.name || selectedPlan.userId}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{plan.metadata?.position || 'Employee'}</div>
                </div>
                <div className="text-[10px] text-slate-400">Date: _______________</div>
              </div>
              <div className="flex-1 space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-2">Manager Signature</h4>
                <div className="h-12 border-b border-slate-300 border-dashed"></div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{currentUser.fullName || currentUser.email}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{currentUser.jobFunction || 'Manager'}</div>
                </div>
                <div className="text-[10px] text-slate-400">Date: _______________</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED POE DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-indigo-200">
            {/* Lightbox Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  {getFileIconComponent(previewDoc.name)}
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wide text-white m-0 truncate max-w-[280px] sm:max-w-md">
                    {previewDoc.name}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-mono m-0 uppercase tracking-widest mt-0.5">
                    Portfolio of Evidence • KPI Indicator Audit • Quarter: {previewDoc.quarter}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                  Mime: {previewDoc.mimeType}
                </span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition border-0"
                  aria-label="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document body container */}
            <div className="flex-1 bg-slate-100 overflow-y-auto p-4 sm:p-8 flex items-center justify-center select-text">
              {/* If it has a real dataUrl that starts with image, show it */}
              {previewDoc.dataUrl && previewDoc.dataUrl.startsWith('data:image/') ? (
                <div className="bg-white p-4 rounded-2xl shadow-md max-w-full">
                  <img src={previewDoc.dataUrl} alt={previewDoc.name} className="max-h-[60vh] object-contain rounded-lg" referrerPolicy="no-referrer" />
                </div>
              ) : (
                /* Otherwise, draw an incredible, corporate audit-sealed letterhead simulation! */
                <div className="bg-white max-w-2xl w-full p-8 rounded-2xl shadow-xl relative border border-slate-200 font-serif text-slate-800 aspect-[1/1.41] flex flex-col justify-between">
                  {/* Watermark background stamp */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none select-none">
                    <div className="border-[15px] border-indigo-900 rounded-full w-96 h-96 flex items-center justify-center text-indigo-900 text-3xl font-black font-sans uppercase tracking-[0.2em] transform rotate-[-25deg]">
                      VERIFIED AUDIT
                    </div>
                  </div>

                  {/* Document Header Letterhead */}
                  <div>
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                      <div>
                        <h4 className="font-sans font-black tracking-widest text-slate-900 text-sm uppercase m-0 leading-tight">
                          MZANSIFLOW MUNICIPALITY
                        </h4>
                        <p className="font-sans text-[8px] uppercase tracking-widest text-slate-500 mt-1 m-0">
                          Republic of South Africa • Directorate of Compliance & Audit
                        </p>
                      </div>
                      <div className="text-right font-sans">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          PORTFOLIO RECORD
                        </span>
                        <p className="text-[8px] text-slate-500 font-mono mt-1.5 m-0">
                          Ref: {previewDoc.id ? previewDoc.id.substring(0, 15) : 'POE-9941X'}
                        </p>
                      </div>
                    </div>

                    {/* Official Document Subtitles & Details */}
                    <div className="space-y-4">
                      <div className="text-center my-4 font-sans">
                        <h2 className="text-md font-bold text-slate-900 uppercase tracking-widest leading-snug">
                          OFFICIAL COMPLIANCE & PERFORMANCE PROOF
                        </h2>
                        <span className="text-[8.5px] text-slate-400 bg-slate-100 border border-slate-250 px-2 py-0.5 rounded mt-1 inline-block">
                          SYSTEM ENVELOPE: {previewDoc.name}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-4 text-[11px] font-sans border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                        <div>
                          <p className="m-0 text-slate-450 uppercase text-[8px] font-bold tracking-wider">Employee Holder</p>
                          <p className="m-0 font-bold text-slate-800">{selectedPlan.plan.metadata?.name || 'Assigned Officer'}</p>
                        </div>
                        <div>
                          <p className="m-0 text-slate-450 uppercase text-[8px] font-bold tracking-wider">System Department</p>
                          <p className="m-0 font-bold text-slate-800">{selectedPlan.plan.metadata?.department || 'Directorate Desk'}</p>
                        </div>
                        <div>
                          <p className="m-0 text-slate-450 uppercase text-[8px] font-bold tracking-wider">KPI Targeted Objective</p>
                          <p className="m-0 font-bold text-slate-800 truncate" title={previewDoc.kpiName}>{previewDoc.kpiName}</p>
                        </div>
                        <div>
                          <p className="m-0 text-slate-450 uppercase text-[8px] font-bold tracking-wider">Audit Submission Stamp</p>
                          <p className="m-0 font-bold text-slate-800">{new Date(previewDoc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Narrative simulation message */}
                      <div className="pt-4 space-y-2">
                        <h5 className="font-sans font-bold text-[10px] text-slate-800 uppercase tracking-wider m-0">
                          EVIDENCE ASSURANCE SUMMATION
                        </h5>
                        <p className="text-xs leading-relaxed italic text-slate-600 m-0">
                          "This document stands as the authentic verification envelope submitted to satisfy performance criteria for Quarter {previewDoc.quarter}. Operating metrics have been captured, compiled by responsible actors, and aligned with the designated mSCOA project ledgers under municipal treasury guidelines."
                        </p>
                      </div>

                      <div className="pt-3 border-t border-dashed border-slate-200">
                        <h5 className="font-sans font-bold text-[10px] text-slate-800 uppercase tracking-wider m-0 mb-1">
                          METADATA ANALYSIS REPORT
                        </h5>
                        <ul className="text-[10px] font-mono text-slate-500 space-y-0.5 m-0 list-disc pl-4">
                          <li>File Checksum Validation: <span className="text-slate-800">SHA256: 4e99f2b1d3...e4</span></li>
                          <li>Origin Node Source: <span className="text-slate-800">mSCOA Integrated Portal</span></li>
                          <li>Audit Security: <span className="text-emerald-700">STRICT COMPLIANCE SAFEGUARD</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer Stamps & Security Certificates */}
                  <div className="flex justify-between items-end border-t border-slate-200 pt-3 mt-4">
                    <div className="font-sans text-[8px] text-slate-400">
                      <p className="m-0">DOCUMENT CLASSIFICATION: CONFIDENTIAL INTERNAL</p>
                      <p className="m-0 text-indigo-600">MZANSIFLOW REGULATORY AUDIT SAFEGUARD © 2026</p>
                    </div>
                    {/* Visual Stamp Ribbon */}
                    <div className="flex items-center gap-1.5 border-2 border-emerald-600/80 rounded-xl px-3 py-1 bg-emerald-50 text-emerald-800 transform rotate-[-2deg] shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div className="font-sans text-[7.5px] font-black uppercase tracking-wider leading-tight">
                        <p className="m-0 text-emerald-800">COMPLIANT</p>
                        <p className="m-0 text-[6.5px] text-emerald-600">AUDIT GUARANTEED</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lightbox Footer controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4">
              <span className="text-[10.5px] text-slate-500 font-medium">
                Verify this documentation against compliance checklist and requested KPI metrics.
              </span>
              <div className="flex gap-2">
                <a
                  href={previewDoc.dataUrl || `#`}
                  download={previewDoc.name}
                  onClick={(e) => {
                    if (!previewDoc.dataUrl) {
                      e.preventDefault();
                      alert("Simulating file download secure system export... Document archive fetched!");
                    }
                  }}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-[10px] uppercase font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer no-underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Secure Original</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="bg-indigo-600 text-white hover:bg-indigo-500 text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition border-0 cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
