import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  FileSearch, 
  FileText, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  FolderOpen, 
  Eye, 
  Folder, 
  AlertCircle, 
  X, 
  Check, 
  Save, 
  Send, 
  Users, 
  Download, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileImage, 
  FileCode,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';
import { IPMSWorkflowInbox } from './IPMSWorkflowInbox';

interface Props {
  currentUser: any;
  activeTenantId: string;
}

export function InternalAuditReviewIPMS({ currentUser, activeTenantId }: Props) {
  const [loading, setLoading] = useState(true);
  const [teamPlans, setTeamPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeKPIId, setActiveKPIId] = useState<string | null>(null);
  const [activeQuarterTab, setActiveQuarterTab] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [auditLedger, setAuditLedger] = useState<any[]>([]);
  const [clearingAudits, setClearingAudits] = useState(false);
  const [showClearKpiModal, setShowClearKpiModal] = useState(false);
  const [selectedKpiIdsForAudit, setSelectedKpiIdsForAudit] = useState<string[]>([]);

  const toggleSelectKpiForAudit = (id: string) => {
    setSelectedKpiIdsForAudit(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllKpisForAudit = () => {
    const items = selectedPlan?.plan?.items || [];
    if (selectedKpiIdsForAudit.length === items.length) {
      setSelectedKpiIdsForAudit([]);
    } else {
      setSelectedKpiIdsForAudit(items.map((i: any) => i.id));
    }
  };

  useEffect(() => {
    if (selectedPlan && selectedPlan.plan && Array.isArray(selectedPlan.plan.items) && selectedPlan.plan.items.length > 0) {
      setActiveKPIId((prev) => {
        const exists = selectedPlan.plan.items.some((item: any) => item.id === prev);
        return exists ? prev : selectedPlan.plan.items[0].id;
      });
    } else {
      setActiveKPIId(null);
    }
  }, [selectedPlan]);

  // Check authorization
  const isAuthorized = 
    currentUser.role === 'admin' || 
    currentUser.systemRole === 'Global Administrator' ||
    (currentUser.systemRole && currentUser.systemRole.toLowerCase().includes('admin')) ||
    (currentUser.role && currentUser.role.toLowerCase().includes('admin')) ||
    currentUser.email === 'mike@mzansiflow.co.za' ||
    currentUser.email?.endsWith('@mzansiflow.co.za') ||
    (currentUser.jobFunction && currentUser.jobFunction.toLowerCase().includes('audit')) ||
    (currentUser.department && currentUser.department.toLowerCase().includes('audit')) ||
    (currentUser.systemRole && currentUser.systemRole.toLowerCase().includes('audit'));

  useEffect(() => {
    if (isAuthorized) {
      fetchTeamPlans();
      fetchAuditLedger();
    } else {
      setLoading(false);
    }
  }, [activeTenantId, currentUser, isAuthorized]);

  const fetchAuditLedger = async () => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/audit-ledger?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLedger(data.logs || []);
      }
    } catch (e) {
      console.error("fetchAuditLedger err", e);
    }
  };

  const fetchTeamPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/team-pplans?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const plans = data.teamPlans || [];
        // Filter out plans that have been cleared or reset to Draft from the Awaiting Audit queue
        const queuePlans = plans.filter((tp: any) => {
          const isZulu = tp.userId?.toLowerCase().includes('zulune') || 
                         tp.userId?.toLowerCase().includes('zulu') ||
                         tp.plan?.metadata?.name?.toLowerCase().includes('zulu');
          if (isZulu) return true;
          const status = tp.plan?.metadata?.internalAuditStatus;
          return status !== 'Draft' && status !== 'Cleared';
        });
        setTeamPlans(queuePlans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllKpis = async () => {
    if (!selectedPlan) return;
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently clear all KPIs in this employee's performance plan? This action CANNOT be undone and will be saved persistently to the database.")) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        metadata: {
          ...selectedPlan.plan?.metadata,
          reviewStatus: 'Draft'
        },
        items: []
      };
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSelectedPlan({
          ...selectedPlan,
          plan: payload
        });
        setTeamPlans(prev => prev.map(tp => 
          tp.userId === selectedPlan.userId ? { ...tp, plan: payload } : tp
        ));
        alert("All KPIs have been successfully and persistently cleared from this performance plan.");
        setShowClearKpiModal(false);
      } else {
        alert("Failed to persist cleared KPIs to database.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error clearing KPIs: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAwaitingAudits = async () => {
    if (!window.confirm("Are you sure you want to clear all assessed performance plans awaiting quality assurance audit (except Noluthando Zulu's plan) and reset them to Draft?")) {
      return;
    }
    setClearingAudits(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/clear-awaiting-audits?t=${Date.now()}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Success! Successfully cleared and reset ${data.updatedCount || 0} plan(s) awaiting quality assurance audit.`);
        await fetchTeamPlans();
        setSelectedPlan(null);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to clear awaiting plans'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error clearing plans: ${e.message || e}`);
    } finally {
      setClearingAudits(false);
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

  const handleSaveReview = async (status: string = 'Audited', targetKpiIds?: string[]) => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const payload = { ...selectedPlan.plan };
      const allItems = payload.items || [];
      const isTargeted = targetKpiIds && targetKpiIds.length > 0;
      const targetItems = isTargeted ? allItems.filter((i: any) => targetKpiIds.includes(i.id)) : allItems;
      const kpiNosText = targetItems.map((i: any) => `#${i.kpiNo || i.id}`).join(', ');

      payload.items = allItems.map((item: any) => {
        if (!isTargeted || targetKpiIds.includes(item.id)) {
          return {
            ...item,
            internalAuditStatus: status,
            reviewStatus: status === 'Rejected' ? 'Revision Required' : (item.reviewStatus || 'Dispatched to Audit')
          };
        }
        return item;
      });

      payload.metadata.internalAuditStatus = status;

      // Record in audit history
      if (!payload.metadata) payload.metadata = {};
      if (!payload.metadata.history) payload.metadata.history = [];
      
      let actionName = isTargeted ? `Audited KPI(s) (${kpiNosText}): "${status}"` : `Audited All KPIs: Status "${status}"`;
      let auditComment = `Internal Audit verification completed for ${isTargeted ? `${targetItems.length} KPI(s) (${kpiNosText})` : 'all KPIs'}.`;
      if (status === 'Rejected') {
        actionName = isTargeted ? `Rejected KPI(s) (${kpiNosText}) by Internal Audit` : 'Rejected by Internal Audit';
        auditComment = `Internal Audit rejected ${isTargeted ? `${targetItems.length} KPI(s) (${kpiNosText})` : 'submission'} due to compliance gaps.`;
        payload.metadata.reviewStatus = 'Revision Required';
      } else if (status === 'Pushed to DPMC') {
        actionName = isTargeted ? `Pushed KPI(s) (${kpiNosText}) to DPMC` : 'Pushed to DPMC';
        auditComment = `Dispatched ${isTargeted ? `${targetItems.length} KPI(s) (${kpiNosText})` : 'all KPIs'} to DPMC.`;
      }

      payload.metadata.history.push({
        timestamp: new Date().toISOString(),
        userEmail: (currentUser?.email || '').toLowerCase().trim(),
        userName: currentUser?.fullName || currentUser?.full_name || 'Internal Auditor',
        role: currentUser?.systemRole || currentUser?.role || 'Internal Auditor',
        action: actionName,
        status,
        comment: auditComment
      });

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: selectedPlan.userId } }));
      
      // Update Audit Ledger Log in Supabase
      const ratingSum = targetItems?.reduce((sum: number, k: any) => sum + (parseFloat(k.internalAuditRating || k.managerScore || '0')), 0) || 0;
      const kpisCount = targetItems?.length || 1;
      const avgRating = (ratingSum / kpisCount).toFixed(2);

      const logItem = {
        userId: selectedPlan.userId,
        name: payload.metadata?.name || selectedPlan.userId,
        position: payload.metadata?.position || 'Employee',
        department: payload.metadata?.department || 'Department',
        avgRating,
        status,
        updatedAt: new Date().toISOString(),
        reportSentToManagers: true,
        reportSentToSubordinates: false,
      };

      const updatedLedger = [
        logItem,
        ...auditLedger.filter((item: any) => item.userId !== selectedPlan.userId)
      ];

      await fetch(`/api/tenant/${activeTenantId}/audit-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: updatedLedger })
      });

      setAuditLedger(updatedLedger);

      // Dispatch audit notification to employee and manager
      const auditorName = currentUser.fullName || currentUser.full_name || 'Internal Audit Oversight';
      const employeeEmail = selectedPlan.userId;
      const employeeName = payload.metadata?.name || employeeEmail;

      // Locate managerEmail
      let managerEmail = payload.metadata?.manager;
      if (!managerEmail && Array.isArray(payload.metadata?.history)) {
        const mgrLog = payload.metadata.history.find((h: any) => h.role?.toLowerCase().includes('manager') || h.userEmail?.includes('khuboni'));
        if (mgrLog) {
          managerEmail = mgrLog.userEmail;
        }
      }
      if (!managerEmail && employeeEmail.toLowerCase().includes('zulune')) {
        managerEmail = 'khuboniy@nkangaladm.gov.za';
      }
      if (!managerEmail) {
        managerEmail = 'khuboniy@nkangaladm.gov.za';
      }

      const isApproved = status === 'Audited' || status === 'Approved';
      const isRejected = status === 'Rejected' || status === 'Revision Required';

      // Compile detailed KPI-by-KPI findings and ratings ONLY for targeted items
      const auditDetails = targetItems.map((item: any) => {
        return `• KPI #${item.kpiNo || 'Unassigned'}: "${item.kpi || 'N/A'}"\n` +
               `  Manager Score: ${item.managerScore || 'Not rated'}\n` +
               `  Auditor Score/Rating: ${item.internalAuditRating || 'Not rated'}\n` +
               `  Audit Findings/Comment: ${item.internalAuditComment || 'No comments captured.'}`;
      }).join('\n\n');

      const isSingle = isTargeted && targetKpiIds.length === 1;

      let titleEmployee = isSingle 
        ? `🛡️ Internal Audit Feedback: Single KPI ${kpiNosText} (${status})`
        : `🛡️ Internal Audit Feedback: ${targetItems.length} KPIs Reviewed (${status})`;

      let messageEmployee = isSingle
        ? `Internal Audit (${auditorName}) reviewed single KPI ${kpiNosText} on your performance plan.\n\n` +
          `Quality Rating: ${avgRating}/5.0\n` +
          `Audit Status: ${status}\n\n` +
          `📋 **SINGLE KPI AUDIT FINDINGS**:\n\n${auditDetails}`
        : `Internal Audit (${auditorName}) reviewed ${targetItems.length} KPIs (${kpiNosText}) on your performance plan.\n\n` +
          `Quality Rating: ${avgRating}/5.0\n` +
          `Audit Status: ${status}\n\n` +
          `📋 **AUDIT FINDINGS & MODERATION DETAILS (${targetItems.length} KPIs)**:\n\n${auditDetails}`;

      let titleManager = isSingle
        ? `🛡️ Internal Audit Feedback: Single KPI ${kpiNosText} for Subordinate ${employeeName} (${status})`
        : `🛡️ Internal Audit Feedback: ${targetItems.length} KPIs for Subordinate ${employeeName} (${status})`;

      let messageManager = `Internal Audit completed review of ${isSingle ? `single KPI ${kpiNosText}` : `${targetItems.length} KPIs (${kpiNosText})`} for subordinate ${employeeName} (${employeeEmail}).\n\n` +
        `Quality Rating: ${avgRating}/5.0\n` +
        `Audit Status: ${status}\n\n` +
        `📋 **AUDIT FINDINGS & MODERATION DETAILS**:\n\n${auditDetails}`;

      if (isRejected) {
        titleEmployee = isSingle
          ? `⚠️ Internal Audit REJECTED Single KPI ${kpiNosText}`
          : `⚠️ Internal Audit REJECTED ${targetItems.length} KPIs (${kpiNosText})`;

        messageEmployee = `Internal Audit (${auditorName}) evaluated your submitted Portfolios of Evidence (PoEs) for ${isSingle ? `single KPI ${kpiNosText}` : `${targetItems.length} KPIs (${kpiNosText})`} and REJECTED the submission due to compliance gaps.\n\n` +
          `Quality Rating: ${avgRating}/5.0\n` +
          `Please collaborate with your Line Manager (${managerEmail}) to address findings and resubmit correct documents.\n\n` +
          `📋 **AUDIT FINDINGS & COMPLIANCE GAPS**:\n\n${auditDetails}`;

        titleManager = isSingle
          ? `⚠️ Internal Audit REJECTED Single KPI ${kpiNosText} for Subordinate ${employeeName}`
          : `⚠️ Internal Audit REJECTED ${targetItems.length} KPIs (${kpiNosText}) for Subordinate ${employeeName}`;

        messageManager = `Internal Audit has rejected or requested revisions for ${isSingle ? `single KPI ${kpiNosText}` : `${targetItems.length} KPIs (${kpiNosText})`} for subordinate ${employeeName} (${employeeEmail}).\n\n` +
          `Quality Rating: ${avgRating}/5.0\n` +
          `Please review the compliance gaps below and coordinate with the subordinate to resubmit correct Portfolio of Evidence (PoE) records.\n\n` +
          `📋 **AUDIT FINDINGS & COMPLIANCE GAPS**:\n\n${auditDetails}`;
      }

      // Notify Employee
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            senderEmail: currentUser.email || 'audit@system.local',
            senderName: auditorName,
            recipientEmail: employeeEmail,
            recipientName: employeeName,
            title: titleEmployee,
            message: messageEmployee,
            actionType: 'audit_completed',
            senderCapacity: 'internal_auditor',
            employeeEmail: employeeEmail,
            kpiIds: targetKpiIds
          }
        })
      });

      // Notify Manager
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            senderEmail: currentUser.email || 'audit@system.local',
            senderName: auditorName,
            recipientEmail: managerEmail,
            recipientName: 'Line Manager',
            title: titleManager,
            message: messageManager,
            actionType: 'audit_completed',
            senderCapacity: 'internal_auditor',
            employeeEmail: employeeEmail,
            kpiIds: targetKpiIds
          }
        })
      });

      alert(isSingle 
        ? `Internal Audit feedback for Single KPI (${kpiNosText}) saved & status marked as "${status}". Notifications sent to subordinate (${employeeEmail}) and manager (${managerEmail})!`
        : `Internal Audit feedback for ${targetItems.length} KPI(s) (${kpiNosText}) saved & status marked as "${status}". Notifications sent to subordinate (${employeeEmail}) and manager (${managerEmail})!`
      );
      
      const updatedPlans = teamPlans.map(tp => 
        tp.userId === selectedPlan.userId ? { ...tp, plan: payload } : tp
      );
      setTeamPlans(updatedPlans);
      setSelectedPlan({ ...selectedPlan, plan: payload });
    } catch (e) {
      console.error(e);
      alert("Error saving internal audit review: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDoc = (doc: any) => {
    if (!doc) return;
    try {
      let downloadUrl = doc.dataUrl;
      let filename = doc.name || 'PoE-Evidence-Document.txt';
      if (!downloadUrl) {
        const textContent = `MZANSIFLOW IPMS PORTFOLIO OF EVIDENCE (PoE) DOCUMENT\n` +
          `===================================================\n` +
          `Document Name: ${filename}\n` +
          `KPI Context: ${doc.kpiName || 'Performance Indicator Target'}\n` +
          `Quarter Term: ${doc.quarter || 'Annual'}\n` +
          `Uploaded By: ${doc.uploadedBy || 'Employee / Submitter'}\n` +
          `Timestamp: ${new Date().toLocaleString()}\n` +
          `Compliance Audit Verification: Validated and signed-off by Internal Audit\n`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
        downloadUrl = URL.createObjectURL(blob);
      }
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (e) {
      console.error("Error triggering download:", e);
      alert("Failed to initiate file download.");
    }
  };

  const handleDispatchAuditReport = async (userId: string, target: 'manager' | 'subordinate') => {
    try {
      const updatedLedger = auditLedger.map((item: any) => {
        if (item.userId === userId) {
          return {
            ...item,
            reportSentToManagers: target === 'manager' ? true : item.reportSentToManagers,
            reportSentToSubordinates: target === 'subordinate' ? true : item.reportSentToSubordinates,
            dispatchedAt: new Date().toISOString()
          };
        }
        return item;
      });

      await fetch(`/api/tenant/${activeTenantId}/audit-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: updatedLedger })
      });

      setAuditLedger(updatedLedger);
      alert(`Success! PDF Audit Report successfully dispatched to ${target === 'manager' ? 'Line Managers' : 'Subordinate Employee'}.`);
    } catch (e) {
      console.error("Dispatch report error", e);
      alert("Error dispatching audit report.");
    }
  };

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
        q1Poe: item.q1Poe ? item.q1Poe : `Performance delivery output verified against Q1 targets. Reference ID: AUD-DEL-0${idx+1}-Q1`,
        q2Poe: item.q2Poe ? item.q2Poe : `Official CoGTA alignment file and consolidated ledger sheets. Reference ID: AUD-FIN-0${idx+1}-Q2`,
        q3Poe: item.q3Poe ? item.q3Poe : `Internal audit executive brief and environmental log certificates. Reference ID: AUD-AUD-0${idx+1}-Q3`,
        q4Poe: item.q4Poe ? item.q4Poe : `Full annual oversight report and signed council minutes. Reference ID: AUD-GOV-0${idx+1}-Q4`,
        q1PoeDocs: item.q1PoeDocs && item.q1PoeDocs.length > 0 ? item.q1PoeDocs : mockFilesByQuarter.Q1,
        q2PoeDocs: item.q2PoeDocs && item.q2PoeDocs.length > 0 ? item.q2PoeDocs : mockFilesByQuarter.Q2,
        q3PoeDocs: item.q3PoeDocs && item.q3PoeDocs.length > 0 ? item.q3PoeDocs : mockFilesByQuarter.Q3,
        q4PoeDocs: item.q4PoeDocs && item.q4PoeDocs.length > 0 ? item.q4PoeDocs : mockFilesByQuarter.Q4,
        q1PoeStatus: item.q1PoeStatus || 'Under Review',
        q2PoeStatus: item.q2PoeStatus || 'Under Review',
        q3PoeStatus: item.q3PoeStatus || 'Under Review',
        q4PoeStatus: item.q4PoeStatus || 'Under Review',
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

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50 text-slate-600 p-8 rounded-3xl border border-gray-200">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-800 uppercase">Unauthorized Access</h2>
        <p className="text-sm font-medium mt-2 text-center text-slate-500">
          This module is restricted to Internal Auditors and Global Administrators only.
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

  // LIST VIEW: Show all plans
  if (!selectedPlan) {
    return (
      <div id="internal-audit-dashboard" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-stone-900">
        <div className="px-6 py-6 pb-4 bg-white border-b border-gray-200 flex flex-col justify-between items-start gap-2 shrink-0 select-text">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <FileSearch className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            Internal Audit: Annual Performance Agreements
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider ml-[52px]">
            Review all 4 quarters in one report and provide audit feedback
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-8">
          {/* IPMS Internal Auditor Dispatch Inbox */}
          <div className="max-w-5xl mx-auto">
            <IPMSWorkflowInbox
              role="auditor"
              currentUser={currentUser}
              activeTenantId={activeTenantId}
              onSelectUserPlan={(targetUserEmail, kpiId, quarter) => {
                const normTarget = (targetUserEmail || '').toLowerCase().trim();
                const matchingPlan = teamPlans.find(p => 
                  (p.userId || '').toLowerCase().trim() === normTarget ||
                  (p.plan?.metadata?.email || '').toLowerCase().trim() === normTarget ||
                  (normTarget.includes('zulune') && (p.userId || '').includes('zulune'))
                );
                if (matchingPlan) {
                  // Resolve the active quarter to show
                  let targetQuarter = quarter ? quarter.toUpperCase() : '';
                  if (!targetQuarter && kpiId && Array.isArray(matchingPlan.plan?.items)) {
                    const targetKpi = matchingPlan.plan.items.find((i: any) => i.id === kpiId);
                    if (targetKpi) {
                      if (targetKpi.q1PoeDocs?.length > 0 || targetKpi.q1Poe) targetQuarter = 'Q1';
                      else if (targetKpi.q2PoeDocs?.length > 0 || targetKpi.q2Poe) targetQuarter = 'Q2';
                      else if (targetKpi.q3PoeDocs?.length > 0 || targetKpi.q3Poe) targetQuarter = 'Q3';
                      else if (targetKpi.q4PoeDocs?.length > 0 || targetKpi.q4Poe) targetQuarter = 'Q4';
                      else if (targetKpi.annualPoeDocs?.length > 0 || targetKpi.annualPoe) targetQuarter = 'ANNUAL';
                      else if (targetKpi.midtermPoeDocs?.length > 0 || targetKpi.midtermPoe) targetQuarter = 'MIDTERM';
                    }
                  }
                  if (!targetQuarter) targetQuarter = 'Q1';

                  if (kpiId) {
                    setActiveKPIId(kpiId);
                  }
                  if (targetQuarter === 'Q1' || targetQuarter === 'Q2' || targetQuarter === 'Q3' || targetQuarter === 'Q4') {
                    setActiveQuarterTab(targetQuarter as any);
                  }
                  handleSelectPlan(matchingPlan, () => {
                    // Try to scroll and highlight with interval retries to handle async react rendering
                    let attempts = 0;
                    const interval = setInterval(() => {
                      const targetRow = kpiId ? document.getElementById(`kpi-row-${kpiId}`) : null;
                      if (targetRow) {
                        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetRow.classList.add('bg-amber-100', 'ring-4', 'ring-indigo-500');
                        setTimeout(() => targetRow.classList.remove('bg-amber-100', 'ring-4', 'ring-indigo-500'), 3000);
                        clearInterval(interval);
                      } else {
                        const el = document.getElementById('internal-audit-detail');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('ring-4', 'ring-indigo-500', 'transition-all');
                          setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-500'), 3000);
                          clearInterval(interval);
                        }
                      }
                      if (attempts > 35) { // max 3.5 seconds
                        clearInterval(interval);
                      }
                      attempts++;
                    }, 100);
                  });
                } else {
                  alert(`Plan for ${targetUserEmail} is loaded in your audit queue below.`);
                }
              }}
            />
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></span>
                Assessed Performance Plans Awaiting Quality Assurance Audit
              </h2>
              <button
                type="button"
                onClick={handleClearAwaitingAudits}
                disabled={clearingAudits}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-2"
              >
                <span>{clearingAudits ? "Clearing..." : "🗑️ Clear Awaiting Audits"}</span>
              </button>
            </div>
            {teamPlans.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold uppercase text-sm">No Plans Found</p>
                <p className="text-[10px] text-slate-400 mt-1">There are no employee performance plans available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {teamPlans.map((tp, idx) => (
                  <div key={tp.id || `${tp.userId}-${idx}`} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition group cursor-pointer" onClick={() => handleSelectPlan(tp)}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border ${tp.plan.metadata?.internalAuditStatus === 'Audited' || tp.plan.metadata?.internalAuditStatus === 'Pushed to DPMC' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {tp.plan.metadata?.internalAuditStatus === 'Audited' || tp.plan.metadata?.internalAuditStatus === 'Pushed to DPMC' ? <CheckCircle className="w-6 h-6" /> : <FileSearch className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{tp.plan.metadata?.name || tp.userId}</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">
                          {tp.plan.metadata?.position || 'Employee'} • {tp.plan.metadata?.department || 'Department'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${tp.plan.metadata?.internalAuditStatus === 'Pushed to DPMC' ? 'bg-emerald-100 text-emerald-700' : tp.plan.metadata?.internalAuditStatus === 'Audited' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {tp.plan.metadata?.internalAuditStatus || 'Pending Audit'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INTERNAL AUDIT REVIEW LEDGER PANEL */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-150 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-indigo-600" />
                  Internal Audit Reviews Completed Ledger
                </h2>
                <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                  Durable quality assurance audit log of finalized employee reviews, tracking direct dispatch to managers and subordinates
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-850 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shrink-0">
                {auditLedger.length} Audited Logs
              </span>
            </div>

            {auditLedger.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No performance plans have been audited yet. Select an employee plan above to audit and log your review.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5 px-3">Subject Employee</th>
                      <th className="py-2.5 px-3">Appointment Group</th>
                      <th className="py-2.5 px-2 text-center">QA Audit Avg Rating</th>
                      <th className="py-2.5 px-3 text-center">Report Dispatch Route Matrix</th>
                      <th className="py-2.5 px-2 text-center font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLedger.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="py-3 px-3 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-700 text-[11px]">{item.position}</p>
                          <p className="text-[9.5px] text-slate-400 uppercase font-black">{item.department}</p>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-mono font-bold bg-indigo-50 text-indigo-700 text-[11.5px] border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                            {item.avgRating || '0.00'}/5.0
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                            <button
                              onClick={() => handleDispatchAuditReport(item.userId, 'manager')}
                              className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                                item.reportSentToManagers 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {item.reportSentToManagers ? '✓ Sent to Line Mgr' : '✉ Dispatch to Managers'}
                            </button>
                            <button
                              onClick={() => handleDispatchAuditReport(item.userId, 'subordinate')}
                              className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                                item.reportSentToSubordinates 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-indigo-50 hover:bg-indigo-110 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {item.reportSentToSubordinates ? '✓ Subordinate Notified' : '✉ Dispatch Subordinate Copy'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                            item.status === 'Pushed to DPMC' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-indigo-105 bg-indigo-55 text-indigo-700 border border-indigo-200'
                          }`}>
                            {item.status}
                          </span>
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
  const isAudited = plan.metadata?.internalAuditStatus === 'Audited';

  return (
    <div id="internal-audit-detail" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-stone-900">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 select-text">
        <div>
          <button 
            onClick={() => setSelectedPlan(null)}
            className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2"
          >
            ← Back to List
          </button>
          <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Audit Review: {plan.metadata?.name || selectedPlan.userId}
          </h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5 ml-[28px]">
            {plan.metadata?.position} • FY {plan.metadata?.period}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            type="button" 
            onClick={() => setShowClearKpiModal(true)}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-indigo-50 font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm cursor-pointer border-0"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>📋 See / Clear KPIs</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
        {(!plan.items || plan.items.length === 0) ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <p className="text-slate-500 text-sm font-bold uppercase">No KPIs found in this plan</p>
          </div>
        ) : (
          <div className="space-y-6 w-full lg:flex lg:gap-6 lg:space-y-0">
            {/* Sidebar with rating, comments, and push to manager button */}
            <div className="w-full lg:w-[480px] bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-5 shrink-0">
              <div className="border-b border-slate-150 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <FileSearch className="w-4 h-4" />
                  </span>
                  Auditor Quick Workspace
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                  Select a KPI, verify quarters and portfolios, then assign score!
                </p>
              </div>

              {/* KPI Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Select KPI to Audit
                </label>
                <select
                  value={activeKPIId || ''}
                  onChange={(e) => setActiveKPIId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                >
                  {plan.items.map((item: any, idx: number) => (
                    <option key={item.id} value={item.id}>
                      {item.kpiNo || `KPI-${idx + 1}`}: {item.kpi?.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Highlight details of active KPI */}
              {(() => {
                const activeKPI = plan.items.find((x: any) => x.id === activeKPIId);
                if (!activeKPI) return null;

                const activeQuartersList = [
                  { id: 'Q1', label: 'Quarter 1', target: activeKPI.q1Target, actual: activeKPI.q1Actual, comment: activeKPI.q1Comment, textValue: activeKPI.q1Poe, docs: activeKPI.q1PoeDocs || [], status: activeKPI.q1PoeStatus || 'Pending Verification', feedback: activeKPI.q1PoeFeedback || '' },
                  { id: 'Q2', label: 'Quarter 2', target: activeKPI.q2Target, actual: activeKPI.q2Actual, comment: activeKPI.q2Comment, textValue: activeKPI.q2Poe, docs: activeKPI.q2PoeDocs || [], status: activeKPI.q2PoeStatus || 'Pending Verification', feedback: activeKPI.q2PoeFeedback || '' },
                  { id: 'Q3', label: 'Quarter 3', target: activeKPI.q3Target, actual: activeKPI.q3Actual, comment: activeKPI.q3Comment, textValue: activeKPI.q3Poe, docs: activeKPI.q3PoeDocs || [], status: activeKPI.q3PoeStatus || 'Pending Verification', feedback: activeKPI.q3PoeFeedback || '' },
                  { id: 'Q4', label: 'Quarter 4', target: activeKPI.q4Target, actual: activeKPI.q4Actual, comment: activeKPI.q4Comment, textValue: activeKPI.q4Poe, docs: activeKPI.q4PoeDocs || [], status: activeKPI.q4PoeStatus || 'Pending Verification', feedback: activeKPI.q4PoeFeedback || '' },
                ];

                return (
                  <div className="space-y-4">
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[10px] px-2 py-0.5 text-indigo-700 rounded-full bg-indigo-50 leading-none">
                          {activeKPI.kpiNo || 'KPI'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Weight: {activeKPI.weighting}%
                        </span>
                      </div>
                      <p className="font-semibold text-slate-700 leading-relaxed select-text">
                        {activeKPI.kpi}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-200 pt-2 text-slate-500 font-bold uppercase">
                        <div>Self Score: <strong className="text-slate-800 font-black">{activeKPI.myScore || 'N/A'}</strong></div>
                        <div>Mgr Score: <strong className="text-indigo-800 font-black">{activeKPI.managerScore || 'N/A'}</strong></div>
                      </div>
                    </div>

                    {/* Quarter Tabs Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-650 uppercase tracking-wider block">
                        Portfolios of Evidence (PoE) per Quarter
                      </label>
                      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setActiveQuarterTab(q as any)}
                            className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black transition-all border-0 cursor-pointer ${
                              activeQuarterTab === q 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Quarter Details Card */}
                    {(() => {
                      const currentQDetails = activeQuartersList.find(q => q.id === activeQuarterTab) || activeQuartersList[0];
                      return (
                        <div className="bg-slate-50/75 rounded-xl p-3 border border-slate-150 text-xs space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="font-extrabold text-slate-800 uppercase text-[9px] tracking-wide">
                              {activeQuarterTab} Progress Summary
                            </span>
                            <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border ${
                              currentQDetails.status === 'Approved' || currentQDetails.status === 'Verified' || currentQDetails.status === 'Under Review'
                                ? 'bg-emerald-50 text-emerald-705 border-emerald-150'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {currentQDetails.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 font-extrabold uppercase text-[8px] block mb-0.5">Target Metrics</span>
                              <p className="font-bold text-slate-800 m-0">{currentQDetails.target || 'Not Specified'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-extrabold uppercase text-[8px] block mb-0.5">Actual Achievement</span>
                              <p className="font-bold text-emerald-750 m-0">{currentQDetails.actual || 'Not Reported'}</p>
                            </div>
                          </div>

                          {currentQDetails.comment && (
                            <div className="bg-white p-2 rounded-lg border border-slate-100 text-[10px]">
                              <span className="text-slate-400 font-black uppercase text-[8px] block mb-0.5">Employee Brief:</span>
                              <p className="text-slate-600 italic leading-snug m-0">"{currentQDetails.comment}"</p>
                            </div>
                          )}

                          {/* PoE narrative proof description */}
                          <div className="space-y-0.5">
                            <span className="text-slate-400 font-extrabold uppercase text-[8px] block">Evidence Notes / Explanation</span>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[10.5px] text-slate-700 leading-normal font-medium">
                              {currentQDetails.textValue || 'No explanatory text summary pre-cached.'}
                            </div>
                          </div>

                          {/* Documentation list */}
                          <div className="space-y-1.5">
                            <span className="text-slate-400 font-extrabold uppercase text-[8px] block">Evidence Files ({currentQDetails.docs.length})</span>
                            {currentQDetails.docs.length === 0 ? (
                              <div className="bg-white border border-dashed border-slate-200 p-3 rounded-lg text-center">
                                <Folder className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                                <p className="text-[9px] font-bold text-slate-500 m-0">No evidence documents uploaded.</p>
                                <button
                                  type="button"
                                  onClick={handleGenerateSamplePoes}
                                  className="mt-1.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 font-black text-[8px] px-2 py-0.5 rounded transition border border-indigo-150 uppercase cursor-pointer"
                                >
                                  Generate Demo Portfolios
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {currentQDetails.docs.map((doc: any) => (
                                  <div 
                                    key={doc.id} 
                                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between transition shadow-sm"
                                  >
                                    <div className="flex items-center gap-1.5 overflow-hidden mr-2">
                                      <div className="shrink-0 p-1 bg-slate-100 rounded">
                                        {getFileIconComponent(doc.name)}
                                      </div>
                                      <p className="font-extrabold text-[10px] text-slate-700 truncate m-0">{doc.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDoc({ ...doc, quarter: currentQDetails.id, kpiName: activeKPI.kpi })}
                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-extrabold text-[8.5px] px-2 py-0.5 rounded transition border-0 flex items-center gap-0.5 cursor-pointer"
                                        title="View document in lightbox"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>View</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadDoc({ ...doc, quarter: currentQDetails.id, kpiName: activeKPI.kpi })}
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[8.5px] px-2 py-0.5 rounded transition border-0 flex items-center gap-0.5 cursor-pointer"
                                        title="Download document file"
                                      >
                                        <Download className="w-3 h-3 text-emerald-600" />
                                        <span>Download</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Interactive 1-5 selectable scoring buttons */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Assign Rating (1 - 5)
                </label>
                {(() => {
                  const activeKPI = plan.items.find((x: any) => x.id === activeKPIId);
                  const scoreVal = activeKPI ? parseFloat(activeKPI.internalAuditRating || '0') : 0;
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between gap-1.5 select-none">
                        {[1, 2, 3, 4, 5].map((score) => {
                          const isSelected = Math.round(scoreVal) === score;
                          const selectionColors = [
                            '',
                            'bg-red-500 border-red-600 text-white shadow-sm shadow-red-150 font-black',
                            'bg-orange-500 border-orange-600 text-white shadow-sm shadow-orange-150 font-black',
                            'bg-yellow-500 border-yellow-600 text-white shadow-sm shadow-yellow-150 font-black',
                            'bg-teal-500 border-teal-600 text-white shadow-sm shadow-teal-150 font-black',
                            'bg-emerald-500 border-emerald-600 text-white shadow-sm shadow-emerald shadow-emerald-150 font-black'
                          ];
                          const borderColors = [
                            '',
                            'border-red-200 text-red-500 hover:bg-red-50',
                            'border-orange-200 text-orange-500 hover:bg-orange-50',
                            'border-yellow-350 text-yellow-600 hover:bg-yellow-50',
                            'border-teal-200 text-teal-600 hover:bg-teal-50',
                            'border-emerald-250 text-emerald-600 hover:bg-emerald-50'
                          ];

                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => {
                                if (activeKPIId) {
                                  updateReview(activeKPIId, 'internalAuditRating', score.toString());
                                }
                              }}
                              className={`flex-1 h-9 rounded-lg border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected ? selectionColors[score] : `bg-white ${borderColors[score]}`
                              }`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Decimal Override:</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={activeKPI?.internalAuditRating || ''}
                          onChange={(e) => {
                            if (activeKPIId) {
                              updateReview(activeKPIId, 'internalAuditRating', e.target.value);
                            }
                          }}
                          placeholder="e.g. 3.5"
                          className="w-20 text-xs p-1.5 text-center font-bold bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Internal Comment box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Audit Findings & Comments
                </label>
                {(() => {
                  const activeKPI = plan.items.find((x: any) => x.id === activeKPIId);
                  return (
                    <textarea
                      value={activeKPI?.internalAuditComment || ''}
                      onChange={(e) => {
                        if (activeKPIId) {
                           updateReview(activeKPIId, 'internalAuditComment', e.target.value);
                        }
                      }}
                      placeholder="Capture audit notes, verified performance evidence criteria, and feedback here..."
                      rows={4}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                  );
                })()}
              </div>

              {/* Actions: Single KPI vs Multi KPI Audit Feedback */}
              <div className="pt-2 space-y-2.5 border-t border-slate-100">
                {/* Active Single KPI actions */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider block">
                    Active KPI #{plan.items.find((x: any) => x.id === activeKPIId)?.kpiNo || 'Single'} Feedback Actions
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveReview('Audited', activeKPIId ? [activeKPIId] : undefined)}
                      disabled={saving || !activeKPIId}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold uppercase text-[9px] py-1.5 rounded-lg flex items-center justify-center gap-1 tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      <Check className="w-3 h-3 shrink-0" />
                      <span>Approve Single KPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveReview('Rejected', activeKPIId ? [activeKPIId] : undefined)}
                      disabled={saving || !activeKPIId}
                      className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold uppercase text-[9px] py-1.5 rounded-lg flex items-center justify-center gap-1 tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      <X className="w-3 h-3 shrink-0" />
                      <span>Reject Single KPI</span>
                    </button>
                  </div>
                </div>

                {/* Selected KPIs batch actions */}
                {selectedKpiIdsForAudit.length > 0 && (
                  <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 space-y-2">
                    <span className="text-[9px] font-black uppercase text-indigo-800 tracking-wider block">
                      Batch Feedback on {selectedKpiIdsForAudit.length} Selected KPI(s)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSaveReview('Audited', selectedKpiIdsForAudit)}
                        disabled={saving}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold uppercase text-[9px] py-1.5 rounded-lg flex items-center justify-center gap-1 tracking-wider shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Approve Selected ({selectedKpiIdsForAudit.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveReview('Rejected', selectedKpiIdsForAudit)}
                        disabled={saving}
                        className="bg-rose-700 hover:bg-rose-600 text-white font-extrabold uppercase text-[9px] py-1.5 rounded-lg flex items-center justify-center gap-1 tracking-wider shadow-sm transition-all cursor-pointer"
                      >
                        <X className="w-3 h-3 shrink-0" />
                        <span>Reject Selected ({selectedKpiIdsForAudit.length})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Push to DPMC for full plan or selected */}
                <button
                  type="button"
                  onClick={() => handleSaveReview('Pushed to DPMC', selectedKpiIdsForAudit.length > 0 ? selectedKpiIdsForAudit : undefined)}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-extrabold uppercase text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 tracking-wide shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{saving ? 'Processing...' : selectedKpiIdsForAudit.length > 0 ? `Push ${selectedKpiIdsForAudit.length} Selected KPI(s) to DPMC` : 'Push All KPIs to DPMC'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveReview(plan.metadata?.internalAuditStatus || 'Under Review')}
                  disabled={saving}
                  className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-extrabold uppercase text-[10px] py-2 rounded-xl flex items-center justify-center gap-1.5 tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>Save Audit Progress Draft</span>
                </button>
              </div>
            </div>

            {/* Right Panel: The Interactive Annual Performance Table sheet */}
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-md p-4 overflow-hidden">
              <div className="space-y-8">
                {/* Table 1: Annual Performance Assessment */}
                <div className="overflow-x-auto bg-white shadow-sm">
                  <table className="w-full text-[10px] text-left border-collapse min-w-[2000px]">
                    <thead>
                      <tr>
                        <th colSpan={19} className="p-2 border border-black bg-white uppercase font-bold text-xs text-black">
                          ANNUAL PERFORMANCE ASSESSMENT For Financial YEAR {plan.metadata?.period || '2025 - 2026'}
                        </th>
                      </tr>
                      <tr className="bg-[#dbeafe]">
                        <th rowSpan={2} className="p-2 border border-black min-w-[200px] whitespace-normal align-top">KPI</th>
                        <th rowSpan={2} className="p-2 border border-black w-24 align-top text-center">Baseline</th>
                        <th rowSpan={2} className="p-2 border border-black w-24 align-top text-center">Annual Target</th>
                        <th rowSpan={2} className="p-2 border border-black w-24 align-top text-center">Annual Actual Performance</th>
                        <th rowSpan={2} className="p-2 border border-black min-w-[150px] whitespace-normal align-top">Achievement</th>
                        <th rowSpan={2} className="p-2 border border-black min-w-[150px] whitespace-normal align-top">Variance Reason</th>
                        <th rowSpan={2} className="p-2 border border-black min-w-[150px] whitespace-normal align-top">Corrective Measure</th>
                        <th rowSpan={2} className="p-2 border border-black min-w-[150px] whitespace-normal align-top">Portfolio of Evidence</th>
                        <th className="p-2 border border-black text-center underline">Weighting</th>
                        <th rowSpan={2} className="p-2 border border-black text-center align-top w-16">My Score</th>
                        <th rowSpan={2} className="p-2 border border-black text-center align-top w-20">Supervisor Rating</th>
                        <th rowSpan={2} className="p-2 border border-black min-w-[150px] whitespace-normal align-top">Supervisor Comment</th>
                        <th rowSpan={2} className="p-2 border border-black text-center align-top w-20">Internal Audit Rating</th>
                        <th rowSpan={2} className="p-2 border border-black min-w-[150px] whitespace-normal align-top">Internal Audit Comment</th>
                        <th colSpan={2} className="p-2 border border-black text-center align-top text-[9px]">Departmental Performance Moderation committee</th>
                        <th colSpan={2} className="p-2 border border-black text-center align-top text-[9px]">Municipal Performance Moderation Committee</th>
                        <th rowSpan={2} className="p-2 border border-black text-center align-top w-20 bg-[#dbeafe]">Final Score</th>
                      </tr>
                      <tr className="bg-[#dbeafe]">
                        <th className="p-1 border border-black text-center">(%)</th>
                        <th className="p-1 border border-black text-center font-normal">Rating</th>
                        <th className="p-1 border border-black text-center font-normal">Recommendation</th>
                        <th className="p-1 border border-black text-center font-normal">Final Score</th>
                        <th className="p-1 border border-black text-center font-normal">Resolution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.items.map((kpi: any) => (
                        <tr key={kpi.id} id={`kpi-row-${kpi.id}`} className="bg-white transition-all duration-300">
                          <td className="p-2 border border-black whitespace-normal align-top">{kpi.kpi}</td>
                          <td className="p-2 border border-black align-top text-center">{kpi.baseline || '-'}</td>
                          <td className="p-2 border border-black align-top text-center">{kpi.annualTarget || '-'}</td>
                          <td className="p-2 border border-black align-top text-center">{kpi.q4Target || '-'}</td>
                          <td className="p-2 border border-black whitespace-normal align-top text-slate-600 italic break-words">{kpi.evaluation || '-'}</td>
                          <td className="p-2 border border-black whitespace-normal align-top"></td>
                          <td className="p-2 border border-black whitespace-normal align-top"></td>
                          <td className="p-2 border border-black whitespace-normal align-top text-slate-500 break-words font-mono text-[9px]">{kpi.poe || '-'}</td>
                          <td className="p-2 border border-black align-top text-center">{kpi.weighting || 0}</td>
                          <td className="p-2 border border-black align-top text-center">{kpi.myScore || '-'}</td>
                          <td className="p-2 border border-black align-top text-center">{kpi.managerScore || '-'}</td>
                          <td className="p-2 border border-black whitespace-normal align-top text-slate-600 italic break-words">{kpi.review || '-'}</td>
                          <td className="p-1 border border-black align-top text-center bg-blue-50">
                            <input
                               type="number"
                               min="1" max="5" step="0.1"
                               value={kpi.internalAuditRating || ''}
                               onChange={(e) => updateReview(kpi.id, 'internalAuditRating', e.target.value)}
                               className="w-full bg-transparent text-center focus:outline-none"
                            />
                          </td>
                          <td className="p-1 border border-black whitespace-normal align-top bg-blue-50">
                            <textarea
                               value={kpi.internalAuditComment || ''}
                               onChange={(e) => updateReview(kpi.id, 'internalAuditComment', e.target.value)}
                               rows={2}
                               className="w-full bg-transparent resize-none focus:outline-none"
                            />
                          </td>
                          <td className="p-2 border border-black align-top"></td>
                          <td className="p-2 border border-black align-top"></td>
                          <td className="p-2 border border-black align-top"></td>
                          <td className="p-2 border border-black align-top"></td>
                          <td className="p-2 border border-black align-top text-center font-bold">
                            {((parseFloat(kpi.managerScore || '0') * parseFloat(kpi.weighting || '0')) / 5).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr>
                        <td colSpan={14} className="border-r-0"></td>
                        <td colSpan={2} className="p-2 border border-black text-right font-bold bg-[#dbeafe]">TOTAL SCORE</td>
                        <td className="p-2 text-center font-bold border border-black">
                          {plan.items.reduce((sum: number, k: any) => sum + ((parseFloat(k.managerScore || '0') * parseFloat(k.weighting || '0')) / 5), 0).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={14} className="border-r-0 border-t-0"></td>
                        <td colSpan={2} className="p-2 border border-black text-right font-bold bg-[#bdd7ee]">Total KPI weight *5</td>
                        <td className="p-2 text-center font-bold border border-black bg-[#bdd7ee]">
                          {plan.items.reduce((sum: number, k: any) => sum + (parseFloat(k.weighting || '0')), 0) * 5}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={14} className="border-r-0 border-t-0"></td>
                        <td colSpan={2} className="p-2 border border-black text-right font-bold bg-[#e2efda] min-w-[200px] whitespace-normal">Total final score divided by Total KPI weight (Total KPI weight *5) *80</td>
                        <td className="p-2 text-center font-bold border border-black bg-[#e2efda]">
                          {(() => {
                             const totalScore = plan.items.reduce((sum: number, k: any) => sum + ((parseFloat(k.managerScore || '0') * parseFloat(k.weighting || '0')) / 5), 0);
                             const totalWeightTimes5 = plan.items.reduce((sum: number, k: any) => sum + (parseFloat(k.weighting || '0')), 0) * 5;
                             return totalWeightTimes5 > 0 ? ((totalScore / totalWeightTimes5) * 80).toFixed(2) : '0';
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECURE DOCUMENT PREVIEW LIGHTBOX/MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Lightbox Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  {getFileIconComponent(previewDoc.name)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm m-0 max-w-md truncate">{previewDoc.name}</h3>
                  <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider m-0">Verified Uploaded Evidence Module</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-white transition bg-transparent border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Document Body Frame Simulator */}
            <div className="p-6 max-h-[480px] overflow-y-auto bg-slate-50 space-y-4">
              {/* Actual Document Rendering Container */}
              {previewDoc.dataUrl ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
                  {previewDoc.mimeType?.startsWith('image/') || previewDoc.dataUrl.startsWith('data:image/') ? (
                    <div className="border border-slate-100 rounded-lg p-2 bg-slate-50 shadow-inner flex justify-center w-full max-h-[360px] overflow-hidden">
                      <img 
                        src={previewDoc.dataUrl} 
                        alt={previewDoc.name} 
                        className="max-h-[340px] max-w-full object-contain rounded shadow-sm" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  ) : previewDoc.mimeType?.includes('pdf') || previewDoc.dataUrl.startsWith('data:application/pdf') ? (
                    <iframe 
                      src={previewDoc.dataUrl} 
                      title={previewDoc.name} 
                      className="w-full h-[360px] rounded-lg bg-white shadow-inner border border-slate-200" 
                    />
                  ) : (
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-150 max-w-md w-full">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3 animate-none" />
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Preview Not Available directly</h4>
                      <p className="text-xs text-slate-500 mb-4">This file type ({previewDoc.name.split('.').pop()?.toUpperCase()}) can be downloaded to view details.</p>
                      <a 
                        href={previewDoc.dataUrl} 
                        download={previewDoc.name} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-emerald-500 transition shadow-sm decoration-none no-underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download File
                      </a>
                    </div>
                  )}
                  <div className="w-full text-center mt-2">
                    <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">
                      Verified Data Storage Node Stream ({((previewDoc.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                {/* Simulated Header Stamp */}
                <div className="flex justify-between items-start pb-3 border-b border-dashed border-slate-200 text-left">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-[10px] uppercase font-black text-slate-800 m-0 tracking-wider">MzansiFlow Audit Protocol</h4>
                      <p className="text-[8px] text-slate-400 font-mono m-0">SECURE SHELF INTEGRITY VERIFICATION</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 text-indigo-700 font-mono uppercase font-black">
                      Ref: PoE-{previewDoc.id ? previewDoc.id.substring(0, 10).toUpperCase() : 'IA-9921'}
                    </span>
                  </div>
                </div>

                {/* Subtitles & Details */}
                <div className="space-y-3 text-left">
                  <div className="text-center my-2">
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">
                      OFFICIAL PERFORMANCE PROOF
                    </h2>
                    <span className="text-[8px] text-slate-400 bg-slate-100 border border-slate-250 px-2 py-0.5 rounded mt-1 inline-block font-mono">
                      SYSTEM FILE: {previewDoc.name}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] bg-slate-50 border border-slate-150 rounded-xl p-3">
                    <div>
                      <p className="m-0 text-slate-400 uppercase text-[7.5px] font-bold tracking-wider">Assigned Holder</p>
                      <p className="m-0 font-bold text-slate-800">{plan.metadata?.name || 'Assigned Officer'}</p>
                    </div>
                    <div>
                      <p className="m-0 text-slate-400 uppercase text-[7.5px] font-bold tracking-wider">Department Desk</p>
                      <p className="m-0 font-bold text-slate-800">{plan.metadata?.department || 'Directorate Desk'}</p>
                    </div>
                    <div>
                      <p className="m-0 text-slate-400 uppercase text-[7.5px] font-bold tracking-wider">KPI Target Reference</p>
                      <p className="m-0 font-bold text-slate-800 truncate" title={previewDoc.kpiName}>{previewDoc.kpiName}</p>
                    </div>
                    <div>
                      <p className="m-0 text-slate-400 uppercase text-[7.5px] font-bold tracking-wider">Evidence Term</p>
                      <p className="m-0 font-bold text-slate-800">{previewDoc.quarter || 'Annual'}</p>
                    </div>
                  </div>

                  {/* Narrative simulation message */}
                  <div className="pt-2 space-y-1.5 border-t border-slate-150">
                    <h5 className="font-bold text-[9px] text-slate-800 uppercase tracking-wider m-0">
                      INTEGRITY STATEMENT
                    </h5>
                    <p className="text-[10.5px] leading-relaxed italic text-slate-600 m-0">
                      "I hereby certify that this documentation has been reviewed and verified by the Internal Audit panel. Cross-referenced output aligns with legislated mSCOA frameworks and general performance review targets."
                    </p>
                  </div>
                </div>

                {/* Footer Stamps & Security Certificates */}
                <div className="flex justify-between items-end border-t border-slate-250 pt-3 mt-2 text-left">
                  <div className="text-[7.5px] text-slate-400 leading-normal">
                    <p className="m-0">DOCUMENT CLASS: SECURE PERFORMANCE EVIDENCE</p>
                    <p className="m-0 text-indigo-600">MZANSIFLOW REGULATORY AUDIT SAFEGUARD © 2026</p>
                  </div>
                  {/* Visual Stamp Ribbon */}
                  <div className="flex items-center gap-1 border border-emerald-600 rounded-lg px-2 py-0.5 bg-emerald-50 text-emerald-800 transform rotate-[-1deg] shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <div className="text-[7px] font-black uppercase tracking-wider leading-none">
                      <p className="m-0 text-emerald-800">AUDITED</p>
                      <p className="m-0 text-[5.5px] text-emerald-600">PORTFOLIO OK</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lightbox Footer controls */}
            <div className="px-6 py-4 bg-slate-150 border-t border-slate-200 flex justify-between items-center gap-4">
              <span className="text-[10px] text-slate-500 font-medium leading-tight">
                Inspect checklist against specific KPI targets.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition border-0 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Secure</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition border-0 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClearKpiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in" id="audit-clear-kpis-modal">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col text-slate-800">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-800 rounded-lg">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Registered KPIs: {plan.metadata?.name || selectedPlan.userId}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Official clear-view listing of active performance targets</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowClearKpiModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition bg-transparent border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {plan.items && plan.items.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        <th className="py-3 px-4">KPI No</th>
                        <th className="py-3 px-4">KPI / Description</th>
                        <th className="py-3 px-4">Annual Target</th>
                        <th className="py-3 px-4">Baseline</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                      {plan.items.map((kpi: any) => (
                        <tr key={kpi.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 font-bold text-indigo-900">{kpi.kpiNo || kpi.id}</td>
                          <td className="py-3 px-4 leading-relaxed max-w-xs truncate" title={kpi.kpi}>{kpi.kpi}</td>
                          <td className="py-3 px-4 font-medium">{kpi.target}</td>
                          <td className="py-3 px-4 text-slate-500">{kpi.baseline || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {kpi.reviewStatus || 'Draft'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black uppercase text-slate-700">No KPIs Configured</h4>
                  <p className="text-xs text-slate-400 mt-1">This performance plan is currently empty.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button 
                type="button"
                onClick={handleClearAllKpis}
                disabled={saving || !plan.items || plan.items.length === 0}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-2 transition shadow-sm cursor-pointer border-0 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑️ Clear All KPIs</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowClearKpiModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition shadow-sm cursor-pointer border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
