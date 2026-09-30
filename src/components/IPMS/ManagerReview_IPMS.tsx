import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, FileText, CheckCircle, Clock, ChevronRight,
  FolderOpen, FileSpreadsheet, Image, File, Download, Search,
  Award, ShieldCheck, AlertTriangle, ExternalLink, Lock, Check,
  Eye, Sparkles, FolderIcon, HardDrive, ThumbsUp, ThumbsDown, X, Info, AlertCircle,
  XCircle, Save, ShieldAlert, History, CheckSquare, Square, Send, Trash2
} from 'lucide-react';
import { IPMSWorkflowInbox } from './IPMSWorkflowInbox';
import { OfficeDocumentViewer } from './OfficeDocumentViewer';
import { JSCManagerApprovalSection } from './JSCModules';
import { calculateVariance } from './Evaluation_IPMS';
import { isUserUnrestricted } from '../../utils/unrestrictedHelper';

interface Props {
  currentUser: any;
  activeTenantId: string;
}

const safeJson = async (res: Response) => {
  if (!res || res.bodyUsed) return null;
  try {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
  } catch (e: any) {
    if (!String(e).includes('consumed')) {
      console.warn("Error parsing JSON:", e);
    }
  }
  return null;
};

export function ManagerReviewIPMS({ currentUser, activeTenantId }: Props) {
  const [mgrTab, setMgrTab] = useState<'kpi' | 'jsc'>('kpi');
  const [loading, setLoading] = useState(true);
  const [teamPlans, setTeamPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<'all' | 'submitted' | 'poe_attached' | 'approved' | 'revision'>('all');
  const [clearingOldReviews, setClearingOldReviews] = useState(false);
  const [showClearKpiModal, setShowClearKpiModal] = useState(false);
  const [clearingLedger, setClearingLedger] = useState(false);
  const [clearingReview, setClearingReview] = useState(false);

  // Advanced PoE state variables
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [activeKpiQuarter, setActiveKpiQuarter] = useState<{ [kpiId: string]: string }>({});
  const [incomingNotifications, setIncomingNotifications] = useState<any[]>([]);
  const [activeDetailTab, setActiveDetailTab] = useState<'kpis' | 'history'>('kpis');
  const [selectedKpiIdsForReview, setSelectedKpiIdsForReview] = useState<string[]>([]);
  const [filterSubmittedKpiIds, setFilterSubmittedKpiIds] = useState<string[] | null>(null);
  const [showAllKpis, setShowAllKpis] = useState(false);

  const matchesKpiIdentifier = (item: any, targetIdOrNo: string) => {
    if (!targetIdOrNo || !item) return false;
    const cleanTarget = String(targetIdOrNo).replace(/^#/, '').trim().toLowerCase();
    const cleanItemId = String(item.id || '').replace(/^#/, '').trim().toLowerCase();
    const cleanKpiNo = String(item.kpiNo || '').replace(/^#/, '').trim().toLowerCase();
    
    return cleanItemId === cleanTarget || 
           cleanKpiNo === cleanTarget || 
           cleanItemId === `kpi-${cleanTarget}` ||
           cleanItemId.endsWith(`-${cleanTarget}`) ||
           cleanItemId.replace(/[^a-z0-9]/g, '') === cleanTarget.replace(/[^a-z0-9]/g, '') ||
           cleanKpiNo.replace(/[^a-z0-9]/g, '') === cleanTarget.replace(/[^a-z0-9]/g, '');
  };

  const visibleManagerItems = useMemo(() => {
    const plan = selectedPlan?.plan;
    if (!plan || !Array.isArray(plan.items)) return [];

    if (showAllKpis) {
      return plan.items;
    }

    // 1. Explicitly filtered from inbox notification or select plan callback
    if (filterSubmittedKpiIds && filterSubmittedKpiIds.length > 0) {
      const filtered = plan.items.filter((item: any) => 
        filterSubmittedKpiIds.some(f => matchesKpiIdentifier(item, f))
      );
      if (filtered.length > 0) return filtered;
    }

    // 2. Metadata submittedKpiIds
    if (plan.metadata?.submittedKpiIds && Array.isArray(plan.metadata.submittedKpiIds) && plan.metadata.submittedKpiIds.length > 0) {
      const filtered = plan.items.filter((item: any) => 
        plan.metadata.submittedKpiIds.some((f: any) => matchesKpiIdentifier(item, f))
      );
      if (filtered.length > 0) return filtered;
    }

    // 3. Items currently in Submitted for Approval/Review state (and not already Approved or Dispatched)
    const submittedItems = plan.items.filter((it: any) => 
      it.reviewStatus === 'Submitted for Approval' || 
      it.reviewStatus === 'Submitted for Review' || 
      it.reviewStatus === 'Submitted'
    );
    if (submittedItems.length > 0) {
      return submittedItems;
    }

    // 4. If target KPI is explicitly selected
    if (selectedKpiIdsForReview.length === 1) {
      const targeted = plan.items.filter((item: any) => matchesKpiIdentifier(item, selectedKpiIdsForReview[0]));
      if (targeted.length > 0) return targeted;
    }

    return plan.items;
  }, [selectedPlan, filterSubmittedKpiIds, showAllKpis, selectedKpiIdsForReview]);

  const toggleSelectKpiForReview = (id: string) => {
    setSelectedKpiIdsForReview(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getSelfScore = (kpi: any) => {
    if (kpi?.myScore && kpi.myScore !== 'N/A' && kpi.myScore !== '') return String(kpi.myScore);
    if (kpi?.score && kpi.score !== 'N/A' && kpi.score !== '') return String(kpi.score);
    if (kpi?.selfScore && kpi.selfScore !== 'N/A' && kpi.selfScore !== '') return String(kpi.selfScore);
    if (kpi?.evalScore && kpi.evalScore !== 'N/A' && kpi.evalScore !== '') return String(kpi.evalScore);
    const qScores = [kpi?.q1Score, kpi?.q2Score, kpi?.midtermScore, kpi?.q3Score, kpi?.q4Score]
      .map(s => parseFloat(s))
      .filter(s => !isNaN(s) && s > 0);
    if (qScores.length > 0) {
      const avg = qScores.reduce((a, b) => a + b, 0) / qScores.length;
      return avg.toFixed(1);
    }
    return 'N/A';
  };

  const toggleSelectAllKpisForReview = () => {
    const items = visibleManagerItems.length > 0 ? visibleManagerItems : (selectedPlan?.plan?.items || []);
    if (selectedKpiIdsForReview.length === items.length) {
      setSelectedKpiIdsForReview([]);
    } else {
      setSelectedKpiIdsForReview(items.map((i: any) => i.id));
    }
  };

  const getDisplayLogs = () => {
    if (!selectedPlan || !selectedPlan.plan) return [];
    const planObj = selectedPlan.plan;
    const logs = [...(planObj.metadata?.history || [])];
    if (logs.length === 0) {
      // Inferred creation / submission events to populate timeline
      const currentStatus = planObj.metadata?.reviewStatus || 'Draft';
      const employeeName = planObj.metadata?.name || selectedPlan.userId || 'Employee';
      const userMail = selectedPlan.userId || 'employee@system.local';

      // Log 1: Plan created
      logs.push({
        timestamp: planObj.metadata?.createdAt || new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        userEmail: userMail,
        userName: employeeName,
        role: 'Employee',
        action: 'Performance Plan Created',
        status: 'Draft',
        comment: 'Performance plan agreement established, target strategic objectives mapped, and annual KPIs initialized.'
      });

      // Log 2: Plan submitted
      if (currentStatus !== 'Draft') {
        logs.push({
          timestamp: planObj.metadata?.submittedAt || new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          userEmail: userMail,
          userName: employeeName,
          role: 'Employee',
          action: 'Submitted for Line Manager Review',
          status: 'Submitted for Review',
          comment: 'Employee submitted self-evaluations and Portfolios of Evidence (PoE) for formal manager verification.'
        });
      }

      // Log 3: Manager reviewed
      if (currentStatus === 'Reviewed' || currentStatus === 'Approved' || currentStatus === 'Dispatched to Audit') {
        logs.push({
          timestamp: new Date().toISOString(),
          userEmail: 'manager@system.local',
          userName: 'Line Manager',
          role: 'Line Manager',
          action: `Status Transition: ${currentStatus}`,
          status: currentStatus,
          comment: `Performance plan status transitioned to ${currentStatus}.`
        });
      }
    }
    return logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    fetchTeamPlans();
    fetchNotifications();

    // Check for incoming target navigation from Demo or Notifications
    try {
      const storedTarget = sessionStorage.getItem('ipms_manager_review_target');
      if (storedTarget) {
        const parsed = JSON.parse(storedTarget);
        sessionStorage.removeItem('ipms_manager_review_target');
        if (parsed.userId) {
          setTimeout(async () => {
            const normTarget = parsed.userId.toLowerCase().trim();
            try {
              const fetchRes = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(normTarget)}`);
              if (fetchRes.ok) {
                const planData = await safeJson(fetchRes);
                if (planData) {
                  const matchingPlan = { userId: normTarget, plan: planData };
                  setTeamPlans(prev => {
                    const exists = prev.some(p => (p.userId || '').toLowerCase().trim() === normTarget);
                    return exists ? prev : [...prev, matchingPlan];
                  });
                  handleSelectPlan(matchingPlan, () => {
                    if (parsed.kpiId) {
                      const targetId = `kpi-card-${parsed.kpiId}`;
                      let attempts = 0;
                      const interval = setInterval(() => {
                        const el = document.getElementById(targetId);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('ring-4', 'ring-indigo-500', 'transition-all');
                          setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-500'), 3500);
                          clearInterval(interval);
                        } else if (attempts > 30) {
                          clearInterval(interval);
                        }
                        attempts++;
                      }, 100);
                    }
                  }, parsed.kpiId);
                }
              }
            } catch (err) {
              console.error("Error loading targeted plan on mount:", err);
            }
          }, 350);
        }
      }
    } catch (e) {
      console.error("Error reading manager review target from sessionStorage:", e);
    }
  }, [activeTenantId, currentUser]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/ipms-notifications?userEmail=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await safeJson(res) || {};
        setIncomingNotifications(data.notifications || []);
      }
    } catch(e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const handleClearNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all notification requests and start fresh?")) return;
    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, { method: 'DELETE' });
      setIncomingNotifications([]);
    } catch(e) {
      console.error("Error clearing notifications:", e);
    }
  };

  const handleClearAllKpis = async () => {
    if (!selectedPlan) return;
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently clear all KPIs in this subordinate's performance plan? This action CANNOT be undone and will be saved persistently to the database.")) {
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
      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: selectedPlan.userId } }));
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

  const handleResetAllOldReviews = async () => {
    if (!window.confirm("Are you sure you want to clear all old submitted, reviewed, or approved reviews (except Noluthando Zulu's KPI from today) and reset them back to In Progress?")) {
      return;
    }
    setClearingOldReviews(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/reset-old-reviews?t=${Date.now()}`);
      if (res.ok) {
        const data = await safeJson(res) || {};
        alert(`Success! Successfully cleared and reset old reviews. ${data.updatedCount || 0} plan(s) updated.`);
        await fetchTeamPlans();
        await fetchNotifications();
      } else {
        const err = await safeJson(res) || {};
        alert(`Error: ${err.error || 'Failed to reset old reviews'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error resetting old reviews: ${e.message || e}`);
    } finally {
      setClearingOldReviews(false);
    }
  };

  const handleClearSubordinatesLedger = async () => {
    const defaultSubordinates = [
      'zulune@nkangaladm.gov.za',
      'nsibandenp@nkangaladm.gov.za',
      'nsibandenp@nkangaldm.gov.za',
      'lukhelema@nkangaladm.gov.za',
      'lukhelema@nkangaladmgov.za',
      'sakisd@nkangaladm.gov.za',
      'user@mzansiflow.co.za'
    ];
    const ids = Array.from(new Set([...teamPlans.map(tp => tp.userId), ...defaultSubordinates]));
    if (!window.confirm(`Are you sure you want to clear approval status (setting overall and KPI status back to In Progress / Draft) for all ${ids.length} subordinate(s) in your ledger?`)) {
      return;
    }
    setClearingLedger(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/clear-subordinates-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: ids })
      });
      if (res.ok) {
        alert("Successfully cleared subordinate approval status ledger.");
        await fetchTeamPlans();
        await fetchNotifications();
      } else {
        alert("Failed to clear ledger status.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setClearingLedger(false);
    }
  };

  const handleClearSubordinatesReview = async () => {
    const list = teamPlans.filter(tp => {
      let submittedCount = 0;
      if (Array.isArray(tp.plan?.items)) {
        tp.plan.items.forEach((it: any) => {
          if (it.reviewStatus === 'Submitted for Approval' || it.reviewStatus === 'Submitted for Review') {
            submittedCount++;
          }
        });
      }
      return submittedCount > 0;
    });
    const ids = list.map(tp => tp.userId);
    if (ids.length === 0) {
      alert("There are currently no subordinates requiring service review to clear.");
      return;
    }
    if (!window.confirm(`Are you sure you want to clear the 'Submitted for Approval' / 'Submitted for Review' status for all ${ids.length} subordinate(s) and reset them back to In Progress?`)) {
      return;
    }
    setClearingReview(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/clear-subordinates-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: ids })
      });
      if (res.ok) {
        alert("Successfully cleared and reset subordinates requiring service review.");
        await fetchTeamPlans();
      } else {
        alert("Failed to clear subordinates requiring service review.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setClearingReview(false);
    }
  };

  const fetchTeamPlans = async () => {
    setLoading(true);
    try {
      // 1. Fetch all users to determine relationships
      const usersRes = await fetch(`/api/tenant/${activeTenantId}/users`);
      let allUsers: any[] = [];
      if (usersRes.ok) {
        allUsers = await safeJson(usersRes) || {};
      }

      // 2. Fetch all team plans
      const res = await fetch(`/api/tenant/${activeTenantId}/team-pplans?t=${Date.now()}`);
      if (res.ok) {
        const data = await safeJson(res) || {};
        const plans = data.teamPlans || [];
        
        let managerName = currentUser.fullName || currentUser.full_name || '';
        let managerEmail = (currentUser.email || '').toLowerCase().trim();
        const normalize = (s: string) => s.toLowerCase().trim().replace(/['"\.,]/g, '').replace(/\s+/g, ' ');
        const normCurrent = normalize(managerName);

        // Subordinate detection logic based on User Directory
        const mySubordinateEmails = new Set<string>();

        // Explicit list for KhuboniY@nkangaladm.gov.za
        const khuboniSubordinates = [
          'zulune@nkangaladm.gov.za',
          'nsibandenp@nkangaladm.gov.za',
          'nsibandenp@nkangaldm.gov.za',
          'lukhelema@nkangaladm.gov.za',
          'lukhelema@nkangaladmgov.za',
          'sakisd@nkangaladm.gov.za'
        ];

        if (managerEmail.includes('khuboni')) {
          khuboniSubordinates.forEach(email => mySubordinateEmails.add(email));
        }

        // Explicit list for Elmon Nkosi (nkosije@nkangaladm.gov.za)
        const nkosiSubordinates = [
          'myenispl@nkangaladm.gov.za',
          'myenispl@nkangaldm.gov.za'
        ];

        if (managerEmail.includes('nkosije') || normCurrent.includes('elmon') || normCurrent.includes('nkosi')) {
          nkosiSubordinates.forEach(email => mySubordinateEmails.add(email));
        }

        // Explicit list for Demo Line Manager (manager@mzansiflow.co.za)
        if (managerEmail === 'manager@mzansiflow.co.za' || managerEmail.includes('manager@mzansiflow')) {
          mySubordinateEmails.add('user@mzansiflow.co.za');
        }

        const isExcludedDeveloper = (email: string) => 
          ['mike@mzansiflow.co.za', 'mike@massivedynamixdistributors.com', 'audrey@mzansiflow.co.za', 'delphine@mzansiflow.co.za', 'ryanw@mzansiflow.co.za', 'bongani@mzansiflow.co.za', 'bonganim@mzansiflow.co.za'].includes(email);

        // Build list of subordinate emails from User Directory
        allUsers.forEach(u => {
          const uEmail = (u.email || '').toLowerCase().trim();
          if (!uEmail || uEmail === managerEmail) return;

          // Exclude internal dev accounts from appearing as municipal subordinates, but keep demo users
          if (isExcludedDeveloper(uEmail)) {
            return;
          }

          const uManager = normalize(u.manager || u.reportTo || '');
          const uManagerEmail = (u.managerEmail || '').toLowerCase().trim();
          const isSub = Boolean(
            (uManager && normCurrent && (uManager === normCurrent || uManager.includes(normCurrent) || normCurrent.includes(uManager))) ||
            (uManager && managerEmail && uManager.includes(managerEmail)) ||
            (uManagerEmail && managerEmail && (uManagerEmail === managerEmail || uManagerEmail.includes(managerEmail) || managerEmail.includes(uManagerEmail))) ||
            (managerEmail.includes('khuboni') && (uManager.includes('khuboni') || khuboniSubordinates.includes(uEmail))) ||
            ((managerEmail.includes('nkosije') || normCurrent.includes('elmon') || normCurrent.includes('nkosi')) && (uEmail.includes('myeni') || uManager.includes('nkosi') || uManager.includes('elmon') || nkosiSubordinates.includes(uEmail))) ||
            ((managerEmail === 'manager@mzansiflow.co.za' || managerEmail.includes('manager@mzansiflow')) && (uEmail === 'user@mzansiflow.co.za' || uManager.includes('demo line manager')))
          );

          if (isSub) {
            mySubordinateEmails.add(uEmail);
          }
        });

        // Developer override for unrestricted users (Delphine, Mike, and all admins / when impersonating)
        const isSystemDeveloper = isUserUnrestricted(currentUser) || ['mike@mzansiflow.co.za', 'mike@massivedynamixdistributors.com', 'audrey@mzansiflow.co.za', 'delphine@mzansiflow.co.za', 'ryanw@mzansiflow.co.za', 'bongani@mzansiflow.co.za', 'bonganim@mzansiflow.co.za'].includes(managerEmail);

        // Filter team plans strictly to this manager's subordinates (unrestricted users see all)
        let myTeamPlans = plans.filter((p: any) => {
          const targetEmail = (p.userId || '').toLowerCase().trim();
          if (targetEmail === managerEmail && !isSystemDeveloper) return false; // Never review oneself unless unrestricted

          // Exclude internal dev accounts unless testing or unrestricted
          if (isExcludedDeveloper(targetEmail) && !isSystemDeveloper) {
            return false;
          }

          const pManager = normalize(p.plan?.metadata?.manager || p.plan?.metadata?.reportTo || '');
          const pManagerEmail = (p.plan?.metadata?.managerEmail || '').toLowerCase().trim();
          
          const isDirectSubordinate = mySubordinateEmails.has(targetEmail) || Boolean(
            (pManager && normCurrent && (pManager.includes(normCurrent) || normCurrent.includes(pManager))) ||
            (pManager && managerEmail && pManager.includes(managerEmail)) ||
            (pManagerEmail && managerEmail && (pManagerEmail === managerEmail || pManagerEmail.includes(managerEmail) || managerEmail.includes(pManagerEmail))) ||
            (managerEmail.includes('khuboni') && khuboniSubordinates.includes(targetEmail)) ||
            ((managerEmail.includes('nkosije') || normCurrent.includes('elmon') || normCurrent.includes('nkosi')) && (targetEmail.includes('myeni') || pManager.includes('nkosi') || pManager.includes('elmon') || nkosiSubordinates.includes(targetEmail))) ||
            ((managerEmail === 'manager@mzansiflow.co.za' || managerEmail.includes('manager@mzansiflow')) && (targetEmail === 'user@mzansiflow.co.za' || pManager.includes('demo line manager')))
          );

          // Rule: Managers must ONLY see their subordinates. Unrestricted sees all.
          if (!isDirectSubordinate && !isSystemDeveloper) {
            return false;
          }

          return true;
        });

        setTeamPlans(myTeamPlans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (tp: any, onLoaded?: () => void, targetKpiId?: string, targetKpiIds?: string[]) => {
    // We must fetch the individual plan to get the full documents (including dataUrl)
    // because dataUrl is stripped from the team-pplans endpoint.
    setSelectedPlan(tp); // Set it initially for fast UI feedback
    
    const kpiIdsToFilter = targetKpiIds && targetKpiIds.length > 0 
      ? targetKpiIds 
      : (targetKpiId ? [targetKpiId] : (tp.plan?.metadata?.submittedKpiIds && Array.isArray(tp.plan.metadata.submittedKpiIds) && tp.plan.metadata.submittedKpiIds.length > 0 ? tp.plan.metadata.submittedKpiIds : null));
    setFilterSubmittedKpiIds(kpiIdsToFilter);
    setShowAllKpis(false);

    // Auto-select KPIs that are in Submitted for Approval/Review state
    let autoSelectIds: string[] = [];
    if (kpiIdsToFilter && kpiIdsToFilter.length > 0) {
      autoSelectIds = kpiIdsToFilter;
    } else if (tp.plan && Array.isArray(tp.plan.items)) {
      autoSelectIds = tp.plan.items.filter((it: any) => 
        it.reviewStatus === 'Submitted for Approval' || it.reviewStatus === 'Submitted for Review' || it.reviewStatus === 'Submitted'
      ).map((it: any) => it.id);
    }
    if (targetKpiId && !autoSelectIds.includes(targetKpiId)) {
      autoSelectIds.push(targetKpiId);
    }
    setSelectedKpiIdsForReview(autoSelectIds);

    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(tp.userId)}`);
      if (res.ok) {
        const fullPlan = await safeJson(res) || {};
        if (fullPlan && fullPlan.items) {
          setSelectedPlan({ userId: tp.userId, plan: fullPlan });
          
          let fullAutoSelectIds: string[] = [];
          const effectiveKpiFilter = kpiIdsToFilter || (fullPlan.metadata?.submittedKpiIds && Array.isArray(fullPlan.metadata.submittedKpiIds) && fullPlan.metadata.submittedKpiIds.length > 0 ? fullPlan.metadata.submittedKpiIds : null);
          if (effectiveKpiFilter && effectiveKpiFilter.length > 0) {
            fullAutoSelectIds = effectiveKpiFilter;
            setFilterSubmittedKpiIds(effectiveKpiFilter);
          } else if (Array.isArray(fullPlan.items)) {
            fullAutoSelectIds = fullPlan.items.filter((it: any) => 
              it.reviewStatus === 'Submitted for Approval' || it.reviewStatus === 'Submitted for Review' || it.reviewStatus === 'Submitted'
            ).map((it: any) => it.id);
          }
          if (targetKpiId && !fullAutoSelectIds.includes(targetKpiId)) {
            fullAutoSelectIds.push(targetKpiId);
          }
          setSelectedKpiIdsForReview(fullAutoSelectIds);
        }
      }
    } catch (e) {
      console.error("Failed to load full plan", e);
    } finally {
      if (onLoaded) {
        setTimeout(onLoaded, 100);
      } else {
        // Default scroll to target or first selected KPI if no specific callback provided
        const scrollToId = targetKpiId || autoSelectIds[0];
        setTimeout(() => {
          if (scrollToId) {
            const el = document.getElementById(`kpi-card-${scrollToId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-4', 'ring-indigo-500', 'transition-all');
              setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-500'), 3500);
            }
          }
        }, 300);
      }
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

      payload.items = (payload.items || []).map((item: any) => {
        const selfScore = getSelfScore(item);
        const mScore = item.managerScore || (selfScore !== 'N/A' ? selfScore : '3.0');
        return {
          ...item,
          myScore: item.myScore || (selfScore !== 'N/A' ? selfScore : ''),
          managerScore: mScore
        };
      });

      // Record in audit history
      if (!payload.metadata) payload.metadata = {};
      if (!payload.metadata.history) payload.metadata.history = [];
      payload.metadata.history.push({
        timestamp: new Date().toISOString(),
        userEmail: (currentUser?.email || '').toLowerCase().trim(),
        userName: currentUser?.fullName || currentUser?.full_name || 'Manager Yena Khuboni',
        role: currentUser?.systemRole || currentUser?.role || 'Line Manager',
        action: 'Review Draft Saved',
        status: 'Reviewed',
        comment: 'Manager saved review and KPI ratings as draft.'
      });

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: selectedPlan.userId } }));

      // Check if any items have revision required or rejected
      const hasRevisions = Array.isArray(payload.items) && payload.items.some((it: any) => 
        it.q1PoeStatus === 'Revision Required' || it.q2PoeStatus === 'Revision Required' ||
        it.q3PoeStatus === 'Revision Required' || it.q4PoeStatus === 'Revision Required' ||
        it.q1PoeStatus === 'Rejected' || it.q2PoeStatus === 'Rejected'
      );

      const managerEmail = currentUser.email || '';
      const managerName = currentUser.fullName || currentUser.full_name || 'Manager Yena Khuboni';
      const submitterEmail = selectedPlan.userId;
      const submitterName = selectedPlan.plan?.metadata?.name || submitterEmail;

      const title = hasRevisions 
        ? `⚠️ PoE Revision Requested by ${managerName}` 
        : `✅ Performance Evaluation & PoE Approved by ${managerName}`;

      const message = hasRevisions
        ? `Manager ${managerName} (${managerEmail}) reviewed your performance evaluations and requested revisions on one or more KPIs/PoE documents. Please check your self-evaluation dashboard to review feedback and submit missing PoE documents.`
        : `Manager ${managerName} (${managerEmail}) has verified and approved your performance evaluation and portfolios of evidence. All KPI records are updated.`;

      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            senderEmail: managerEmail,
            senderName: managerName,
            recipientEmail: submitterEmail,
            recipientName: submitterName,
            title,
            message,
            actionType: hasRevisions ? 'revision_requested' : 'approval',
            senderCapacity: 'manager_as_subordinate'
          }
        })
      });

      // Automatically push Audit Dispatch notification to Internal Auditors
      if (!hasRevisions) {
        const poeCount = payload.items?.reduce((acc: number, item: any) => 
          acc + (item.q1PoeDocs?.length || 0) + (item.q2PoeDocs?.length || 0) + (item.q3PoeDocs?.length || 0) + (item.q4PoeDocs?.length || 0), 0) || 0;

        const kpisDetail = payload.items?.map((item: any) => {
          const poeDocsList = [
            ...(item.q1PoeDocs || []),
            ...(item.q2PoeDocs || []),
            ...(item.q3PoeDocs || []),
            ...(item.q4PoeDocs || [])
          ].map((doc: any) => `${doc.name} (Uploaded by: ${doc.uploadedBy || 'Employee'})`).join(', ');

          return `• KPI #${item.kpiNo || 'Unassigned'}: "${item.kpi || 'N/A'}"\n` +
                 `  Strategic Goal: ${item.strategicGoal || 'Department Alignment'}\n` +
                 `  Weighting: ${item.weighting || 'N/A'}%\n` +
                 `  Annual Target: ${item.annualTarget || 'N/A'}\n` +
                 `  Self-Score: ${item.myScore || 'Not rated'}\n` +
                 `  Manager Score: ${item.managerScore || 'Not rated'}\n` +
                 `  Portfolios of Evidence (PoEs): ${poeDocsList || 'No documents attached'}`;
        }).join('\n\n');

        await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              senderEmail: managerEmail,
              senderName: managerName,
              recipientEmail: 'internal_audit',
              recipientName: 'Internal Audit Committee',
              title: `🛡️ Audit Dispatch: ${submitterName}'s KPIs Approved by ${managerName}`,
              message: `Line Manager ${managerName} (${managerEmail}) has verified and approved the Individual Performance Plan for Subordinate Submission.\n\n` +
                `👤 **KPI Submitter/Owner (Subordinate)**: ${submitterName} (${submitterEmail})\n` +
                `💼 **Reviewed & Dispatched By**: ${managerName} (${managerEmail})\n\n` +
                `📋 **APPROVED KPI & EVIDENCE DETAILS**:\n\n${kpisDetail}\n\n` +
                `Please access the Internal Audit module to conduct compliance verification, verify evidence documentation validity, and input auditor moderation scores.`,
              actionType: 'audit_request',
              senderCapacity: 'manager_as_subordinate',
              poeDocsCount: poeCount,
              employeeEmail: submitterEmail
            }
          })
        });
      }
      
      alert(`Employee performance review saved successfully! Notification dispatched to submitter (${submitterEmail}) and pushed to Internal Audit.`);
      
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

  const handleApproveReview = async (targetIds?: string[]) => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const payload = { ...selectedPlan.plan };
      const allItems = payload.items || [];
      const isTargeted = targetIds && targetIds.length > 0;
      const targetItems = isTargeted ? allItems.filter((i: any) => targetIds.includes(i.id)) : allItems;
      const kpiNosText = targetItems.map((i: any) => `#${i.kpiNo || i.id}`).join(', ');

      payload.items = allItems.map((item: any) => {
        if (!isTargeted || targetIds.includes(item.id)) {
          const selfScore = getSelfScore(item);
          const mScore = item.managerScore || (selfScore !== 'N/A' ? selfScore : '3.0');
          return {
            ...item,
            myScore: item.myScore || (selfScore !== 'N/A' ? selfScore : ''),
            managerScore: mScore,
            reviewStatus: 'Approved'
          };
        }
        return item;
      });

      if (!isTargeted || targetIds.length === allItems.length) {
        payload.metadata.reviewStatus = 'Approved';
      }

      if (!payload.metadata) payload.metadata = {};
      if (!payload.metadata.history) payload.metadata.history = [];
      payload.metadata.history.push({
        timestamp: new Date().toISOString(),
        userEmail: (currentUser?.email || '').toLowerCase().trim(),
        userName: currentUser?.fullName || currentUser?.full_name || 'Manager Yena Khuboni',
        role: currentUser?.systemRole || currentUser?.role || 'Line Manager',
        action: isTargeted ? `Approved KPI(s) (${kpiNosText})` : 'Approved All KPIs',
        status: 'Approved',
        comment: `Manager reviewed and approved ${isTargeted ? `${targetItems.length} KPI(s) (${kpiNosText})` : 'all KPIs'}.`
      });

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: selectedPlan.userId } }));

      const managerEmail = currentUser.email || '';
      const managerName = currentUser.fullName || currentUser.full_name || 'Manager Yena Khuboni';
      const submitterEmail = selectedPlan.userId;
      const submitterName = selectedPlan.plan?.metadata?.name || submitterEmail;

      const title = isTargeted && targetIds.length === 1
        ? `✅ Single KPI ${kpiNosText} & PoE Approved by ${managerName}`
        : `✅ ${isTargeted ? `${targetIds.length} Selected KPIs` : 'All KPIs'} & PoE Approved by ${managerName}`;

      const message = `Manager ${managerName} (${managerEmail}) has verified and approved ${isTargeted ? `${targetItems.length} KPI(s) (${kpiNosText})` : 'all KPIs'} and portfolios of evidence.`;

      const targetsList = [
        { email: submitterEmail, name: submitterName },
        { email: managerEmail, name: managerName },
        { email: 'internal_audit', name: 'Internal Audit Committee' },
        { email: 'dpmc', name: 'DPMC Moderation Committee' }
      ];

      for (const t of targetsList) {
        await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              senderEmail: managerEmail,
              senderName: managerName,
              recipientEmail: t.email,
              recipientName: t.name,
              title,
              message: `${message}\n\n• Submitter: ${submitterName} (${submitterEmail})\n• Manager: ${managerName} (${managerEmail})`,
              actionType: 'approval',
              senderCapacity: 'manager_as_subordinate',
              kpiIds: isTargeted ? targetIds : undefined,
              employeeEmail: submitterEmail
            }
          })
        });
      }

      alert(`KPI review approval saved! Notification sent to submitter (${submitterEmail}).`);
      
      const updatedPlans = teamPlans.map(tp => 
        tp.userId === selectedPlan.userId ? { ...tp, plan: payload } : tp
      );
      setTeamPlans(updatedPlans);
      setSelectedPlan({ ...selectedPlan, plan: payload });
    } catch (e) {
      console.error(e);
      alert("Error occurred while approving review: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleRejectReview = async (targetIds?: string[]) => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const payload = { ...selectedPlan.plan };
      const allItems = payload.items || [];
      const isTargeted = targetIds && targetIds.length > 0;
      const targetItems = isTargeted ? allItems.filter((i: any) => targetIds.includes(i.id)) : allItems;
      const kpiNosText = targetItems.map((i: any) => `#${i.kpiNo || i.id}`).join(', ');

      payload.items = allItems.map((item: any) => {
        if (!isTargeted || targetIds.includes(item.id)) {
          return { ...item, reviewStatus: 'Revision Required' };
        }
        return item;
      });

      payload.metadata.reviewStatus = 'Revision Required';

      if (!payload.metadata) payload.metadata = {};
      if (!payload.metadata.history) payload.metadata.history = [];
      payload.metadata.history.push({
        timestamp: new Date().toISOString(),
        userEmail: (currentUser?.email || '').toLowerCase().trim(),
        userName: currentUser?.fullName || currentUser?.full_name || 'Manager Yena Khuboni',
        role: currentUser?.systemRole || currentUser?.role || 'Line Manager',
        action: isTargeted ? `Revision Requested on KPI(s) (${kpiNosText})` : 'Revision Required / Rejected',
        status: 'Revision Required',
        comment: `Manager requested revisions for ${isTargeted ? `${targetItems.length} KPI(s) (${kpiNosText})` : 'the performance plan'}.`
      });

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: selectedPlan.userId } }));

      const managerEmail = currentUser.email || '';
      const managerName = currentUser.fullName || currentUser.full_name || 'Manager Yena Khuboni';
      const submitterEmail = selectedPlan.userId;
      const submitterName = selectedPlan.plan?.metadata?.name || submitterEmail;

      const title = isTargeted && targetIds.length === 1
        ? `⚠️ Single KPI ${kpiNosText} Revision Requested by ${managerName}`
        : `⚠️ PoE Revision Requested for ${isTargeted ? `${targetIds.length} KPIs` : 'Performance Plan'} by ${managerName}`;

      const message = `Manager ${managerName} (${managerEmail}) reviewed ${isTargeted ? `${targetItems.length} KPI(s) (${kpiNosText})` : 'your performance evaluation'} and requested revisions. Please check your self-evaluation dashboard to update requested fields and PoE files.`;

      const targetsList = [
        { email: submitterEmail, name: submitterName },
        { email: managerEmail, name: managerName },
        { email: 'internal_audit', name: 'Internal Audit Committee' },
        { email: 'dpmc', name: 'DPMC Moderation Committee' }
      ];

      for (const t of targetsList) {
        await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              senderEmail: managerEmail,
              senderName: managerName,
              recipientEmail: t.email,
              recipientName: t.name,
              title,
              message: `${message}\n\n• Submitter: ${submitterName} (${submitterEmail})\n• Manager: ${managerName} (${managerEmail})`,
              actionType: 'revision_requested',
              senderCapacity: 'manager_as_subordinate',
              kpiIds: isTargeted ? targetIds : undefined,
              employeeEmail: submitterEmail
            }
          })
        });
      }

      alert(`KPI revision request sent! Notification dispatched to submitter (${submitterEmail}).`);
      
      const updatedPlans = teamPlans.map(tp => 
        tp.userId === selectedPlan.userId ? { ...tp, plan: payload } : tp
      );
      setTeamPlans(updatedPlans);
      setSelectedPlan({ ...selectedPlan, plan: payload });
    } catch (e) {
      console.error(e);
      alert("Error occurred while requesting revisions: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handlePushToAudit = async (targetIds?: string[]) => {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const payload = { ...selectedPlan.plan };
      const allItems = payload.items || [];
      const isTargeted = targetIds && targetIds.length > 0;
      const targetItems = isTargeted ? allItems.filter((i: any) => targetIds.includes(i.id)) : allItems;
      const kpiNosText = targetItems.map((i: any) => `#${i.kpiNo || i.id}`).join(', ');

      payload.items = allItems.map((item: any) => {
        if (!isTargeted || targetIds.includes(item.id)) {
          const selfScore = getSelfScore(item);
          const mScore = item.managerScore || (selfScore !== 'N/A' ? selfScore : '3.0');
          return {
            ...item,
            myScore: item.myScore || (selfScore !== 'N/A' ? selfScore : ''),
            managerScore: mScore,
            reviewStatus: 'Dispatched to Audit',
            internalAuditStatus: 'Dispatched to Audit'
          };
        } else {
          return {
            ...item,
            reviewStatus: item.reviewStatus === 'Dispatched to Audit' ? 'Reviewed' : (item.reviewStatus || 'Draft'),
            internalAuditStatus: item.internalAuditStatus === 'Dispatched to Audit' ? '' : (item.internalAuditStatus || '')
          };
        }
      });

      if (!payload.metadata) payload.metadata = {};
      payload.metadata.reviewStatus = 'Dispatched to Audit';
      payload.metadata.internalAuditStatus = 'Dispatched to Audit';
      payload.metadata.dispatchedKpiIds = isTargeted ? targetIds : allItems.map((i: any) => i.id);
      payload.metadata.lastDispatchedKpiId = isTargeted && targetIds.length === 1 ? targetIds[0] : undefined;

      if (!payload.metadata) payload.metadata = {};
      if (!payload.metadata.history) payload.metadata.history = [];
      payload.metadata.history.push({
        timestamp: new Date().toISOString(),
        userEmail: (currentUser?.email || '').toLowerCase().trim(),
        userName: currentUser?.fullName || currentUser?.full_name || 'Manager Yena Khuboni',
        role: currentUser?.systemRole || currentUser?.role || 'Line Manager',
        action: isTargeted ? `Dispatched KPI(s) (${kpiNosText}) to Internal Audit` : 'Forwarded All to Internal Audit',
        status: 'Dispatched to Audit',
        comment: `Manager approved and dispatched ${isTargeted ? `${targetItems.length} KPI(s) (${kpiNosText})` : 'all KPIs'} to the Internal Audit Committee.`
      });

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${selectedPlan.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: selectedPlan.userId } }));

      const managerEmail = currentUser.email || '';
      const managerName = currentUser.fullName || currentUser.full_name || 'Manager Yena Khuboni';
      const submitterEmail = selectedPlan.userId;
      const submitterName = selectedPlan.plan?.metadata?.name || submitterEmail;

      const kpisDetail = targetItems.map((item: any) => {
        const poeDocsList = [
          ...(item.q1PoeDocs || []),
          ...(item.q2PoeDocs || []),
          ...(item.q3PoeDocs || []),
          ...(item.q4PoeDocs || [])
        ].map((doc: any) => `${doc.name} (Uploaded by: ${doc.uploadedBy || 'Employee'})`).join(', ');

        return `• KPI #${item.kpiNo || 'Unassigned'}: "${item.kpi || 'N/A'}"\n` +
               `  Strategic Goal: ${item.strategicGoal || 'Department Alignment'}\n` +
               `  Weighting: ${item.weighting || 'N/A'}%\n` +
               `  Annual Target: ${item.annualTarget || 'N/A'}\n` +
               `  Self-Score: ${item.myScore || 'Not rated'}\n` +
               `  Manager Score: ${item.managerScore || 'Not rated'}\n` +
               `  Portfolios of Evidence (PoEs): ${poeDocsList || 'No documents attached'}`;
      }).join('\n\n');

      const isSingle = isTargeted && targetIds.length === 1;
      const title = isSingle
        ? `🛡️ Audit Dispatch: Single KPI ${kpiNosText} (${submitterName}) Approved by ${managerName}`
        : `🛡️ Audit Dispatch: ${targetItems.length} KPIs (${kpiNosText}) (${submitterName}) Approved by ${managerName}`;

      const message = `Line Manager ${managerName} (${managerEmail}) has verified and approved ${isSingle ? `single KPI ${kpiNosText}` : `${targetItems.length} KPIs (${kpiNosText})`} for Subordinate (${submitterName}).\n\n` +
        `👤 **KPI Submitter/Owner**: ${submitterName} (${submitterEmail})\n` +
        `💼 **Reviewed & Dispatched By**: ${managerName} (${managerEmail})\n\n` +
        `📋 **APPROVED KPI & EVIDENCE DETAILS**:\n\n${kpisDetail}\n\n` +
        `Please access the Internal Audit module to conduct compliance verification and audit evaluation.`;

      const targetsList = [
        { email: submitterEmail, name: submitterName },
        { email: managerEmail, name: managerName },
        { email: 'internal_audit', name: 'Internal Audit Committee' },
        { email: 'dpmc', name: 'DPMC Moderation Committee' }
      ];

      for (const t of targetsList) {
        await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              senderEmail: managerEmail,
              senderName: managerName,
              recipientEmail: t.email,
              recipientName: t.name,
              title,
              message,
              actionType: 'audit_dispatch',
              senderCapacity: 'manager_as_subordinate',
              kpiIds: targetIds,
              kpiId: targetIds.length > 0 ? targetIds[0] : '',
              kpiNo: targetItems.length > 0 ? (targetItems[0].kpiNo || targetItems[0].id) : '',
              employeeEmail: submitterEmail
            }
          })
        });
      }

      alert(isSingle 
        ? `Single KPI (${kpiNosText}) dispatched to Internal Audit committee! Notification sent.`
        : `${targetItems.length} KPI(s) (${kpiNosText}) dispatched to Internal Audit committee! Notification sent.`
      );
      
      const updatedPlans = teamPlans.map(tp => 
        tp.userId === selectedPlan.userId ? { ...tp, plan: payload } : tp
      );
      setTeamPlans(updatedPlans);
      setSelectedPlan({ ...selectedPlan, plan: payload });
    } catch (e) {
      console.error(e);
      alert("Error occurred while pushing to audit: " + String(e));
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
        <div className="px-6 py-6 pb-4 bg-white border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 select-text">
          <div>
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
          <button
            onClick={handleResetAllOldReviews}
            disabled={clearingOldReviews}
            className="ml-[52px] md:ml-0 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-2"
          >
            <span>{clearingOldReviews ? "Clearing..." : "🗑️ Clear Old Reviews"}</span>
          </button>
        </div>

        {/* Tab Switcher for Manager Review Module */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 shadow-xs">
          <button
            type="button"
            onClick={() => setMgrTab('kpi')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              mgrTab === 'kpi' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>1. KPI Team Reviews</span>
          </button>

          <button
            type="button"
            onClick={() => setMgrTab('jsc')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              mgrTab === 'jsc' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>2. JSC Manager Approvals</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-8">
          {mgrTab === 'jsc' ? (
            <div className="max-w-5xl mx-auto">
              <JSCManagerApprovalSection 
                currentUser={currentUser} 
                activeTenantId={activeTenantId} 
                defaultEmployeeEmail={selectedPlan?.userId} 
              />
            </div>
          ) : (
            <>
          {/* IPMS Manager Workflow Inbox */}
          <div className="max-w-5xl mx-auto">
            <IPMSWorkflowInbox
              role="manager"
              currentUser={currentUser}
              activeTenantId={activeTenantId}
              onSelectUserPlan={async (targetUserEmail, kpiId, quarter, targetKpiIds) => {
                const normTarget = (targetUserEmail || '').toLowerCase().trim();
                const kpiIdsToFilter = targetKpiIds && targetKpiIds.length > 0 
                  ? targetKpiIds 
                  : (kpiId ? [kpiId] : null);
                
                setFilterSubmittedKpiIds(kpiIdsToFilter);
                setShowAllKpis(false);

                let matchingPlan = teamPlans.find(p => 
                  (p.userId || '').toLowerCase().trim() === normTarget ||
                  (p.plan?.metadata?.email || '').toLowerCase().trim() === normTarget ||
                  (normTarget.includes('zulune') && (p.userId || '').includes('zulune')) ||
                  (normTarget.includes('user@mzansiflow') && (p.userId || '').includes('user@mzansiflow'))
                );

                if (!matchingPlan) {
                  try {
                    const fetchRes = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(normTarget)}`);
                    if (fetchRes.ok) {
                      const fetchedPlanData = await safeJson(fetchRes);
                      if (fetchedPlanData && (fetchedPlanData.items || fetchedPlanData.metadata)) {
                        matchingPlan = { userId: normTarget, plan: fetchedPlanData };
                        setTeamPlans(prev => {
                          const exists = prev.some(p => (p.userId || '').toLowerCase().trim() === normTarget);
                          return exists ? prev : [...prev, matchingPlan];
                        });
                      }
                    }
                  } catch (err) {
                    console.error("Failed to load plan on demand:", err);
                  }
                }

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

                  const resolvedKpiId = kpiId || (kpiIdsToFilter && kpiIdsToFilter[0]);
                  if (resolvedKpiId) {
                    setActiveKpiQuarter(prev => ({ ...prev, [resolvedKpiId]: targetQuarter }));
                    setSelectedKpiIdsForReview(prev => prev.includes(resolvedKpiId) ? prev : [...prev, resolvedKpiId]);
                  }

                  handleSelectPlan(matchingPlan, () => {
                    if (kpiIdsToFilter) {
                      setFilterSubmittedKpiIds(kpiIdsToFilter);
                    }
                    // Try to scroll and highlight with interval retries to handle async react rendering
                    const targetId = resolvedKpiId ? `kpi-card-${resolvedKpiId}` : 'manager-review-detail';
                    let attempts = 0;
                    const interval = setInterval(() => {
                      const el = document.getElementById(targetId) || document.getElementById('manager-review-detail');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-4', 'ring-indigo-500', 'transition-all');
                        setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-500'), 3500);
                        clearInterval(interval);
                      } else if (attempts > 35) { // max 3.5 seconds
                        clearInterval(interval);
                      }
                      attempts++;
                    }, 100);
                  }, resolvedKpiId, kpiIdsToFilter || undefined);
                } else {
                  alert(`Plan for ${targetUserEmail} could not be loaded.`);
                }
              }}
            />
          </div>

          {/* Manager's Direct Subordinates & Approval Status Ledger */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-150 pb-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Direct Subordinates & Approval Status Ledger
                </h2>
                <p className="text-[10.5px] text-slate-550 text-slate-500 font-semibold mt-0.5">
                  Real-time manager supervision ledger tracking annual performance agreement approval statuses
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                <button
                  onClick={handleClearSubordinatesLedger}
                  disabled={clearingLedger}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-1 select-none"
                >
                  <span>{clearingLedger ? "Clearing..." : "🗑️ Clear Ledger Approval Statuses"}</span>
                </button>
                <span className="bg-indigo-100 text-indigo-850 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shrink-0">
                  {teamPlans.length} Total Subordinates
                </span>
              </div>
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
                      let submittedKpisCount = 0;
                      if (Array.isArray(tp.plan?.items)) {
                        tp.plan.items.forEach((it: any) => {
                          if (it.reviewStatus === 'Submitted for Approval' || it.reviewStatus === 'Submitted for Review') {
                            submittedKpisCount++;
                          }
                        });
                      }
                      
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
                            {submittedKpisCount > 0 ? (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">⚡ {submittedKpisCount} KPI(s) Submitted</span>
                            ) : (
                              tp.plan.metadata?.reviewStatus || 'Draft'
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150 animate-none">
                                <Check className="w-2.5 h-2.5 animate-none" />
                                Approved ✅
                              </span>
                            ) : submittedKpisCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-150 animate-pulse">
                                <Clock className="w-2.5 h-2.5" />
                                Action Required ⚡
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 animate-none">
                                <Clock className="w-2.5 h-2.5 animate-none" />
                                Outstanding ❌
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleSelectPlan(tp)}
                              className={`${submittedKpisCount > 0 ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'} font-extrabold px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition`}
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
        </>
        )}
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
            onClick={() => {
              setSelectedPlan(null);
              setFilterSubmittedKpiIds(null);
              setShowAllKpis(false);
              setActiveDetailTab('kpis');
            }}
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
            onClick={() => setShowClearKpiModal(true)}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-indigo-50 font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>📋 See / Clear KPIs</span>
          </button>

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
            onClick={() => handleApproveReview()}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm cursor-pointer border-0"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve Review</span>
          </button>

          <button 
            onClick={() => handleRejectReview()}
            disabled={saving}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm cursor-pointer border-0"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject / Revision</span>
          </button>

          <button 
            onClick={() => handlePushToAudit()}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm cursor-pointer border-0"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Push to Internal Audit</span>
          </button>

          <button 
            onClick={handleSaveReview}
            disabled={saving}
            className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm cursor-pointer border-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-6">
        {/* Navigation Tabs for KPIs vs History */}
        <div className="flex border border-slate-200 bg-white p-1 rounded-2xl shadow-xs max-w-sm">
          <button
            onClick={() => setActiveDetailTab('kpis')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 cursor-pointer ${
              activeDetailTab === 'kpis'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>KPIs to Approve</span>
          </button>
          <button
            onClick={() => setActiveDetailTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 cursor-pointer ${
              activeDetailTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Log / History</span>
          </button>
        </div>

        {activeDetailTab === 'kpis' ? (
          (!visibleManagerItems || visibleManagerItems.length === 0) ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
              <p className="text-slate-500 text-sm font-bold uppercase">No KPIs currently pending manager approval in this plan</p>
              {plan?.items && plan.items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllKpis(true)}
                  className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  View all {plan.items.length} plan KPIs
                </button>
              )}
            </div>
          ) : (
          <div className="space-y-4">
            {/* Banner when viewing only the pushed/submitted single KPI(s) */}
            {!showAllKpis && plan?.items && plan.items.length > visibleManagerItems.length && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs animate-fade-in">
                <div className="flex items-center gap-2.5 text-xs text-amber-900 font-extrabold">
                  <span className="p-1.5 bg-amber-200 text-amber-900 rounded-lg">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <span>Focused Manager Review: Displaying only the {visibleManagerItems.length} single KPI submitted for approval by Subordinate ({visibleManagerItems.map((i: any) => `#${i.kpiNo || i.id}`).join(', ')}).</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllKpis(true)}
                  className="text-[10.5px] font-bold text-amber-900 hover:text-indigo-700 bg-white hover:bg-amber-100/50 px-3 py-1.5 rounded-xl border border-amber-300 transition shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Show All Plan KPIs ({plan.items.length})
                </button>
              </div>
            )}

            {showAllKpis && plan?.items && plan.items.length > 1 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs animate-fade-in">
                <div className="flex items-center gap-2.5 text-xs text-indigo-900 font-extrabold">
                  <span className="p-1.5 bg-indigo-200 text-indigo-900 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span>Viewing All {plan.items.length} KPIs in Performance Plan.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllKpis(false)}
                  className="text-[10.5px] font-bold text-indigo-900 hover:text-indigo-700 bg-white hover:bg-indigo-100/50 px-3 py-1.5 rounded-xl border border-indigo-300 transition shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Focus Only on Submitted KPI(s)
                </button>
              </div>
            )}

            {/* Multi-Selection & Batch Manager Review Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAllKpisForReview}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 font-bold text-xs cursor-pointer transition"
                >
                  {selectedKpiIdsForReview.length === visibleManagerItems.length ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{selectedKpiIdsForReview.length === visibleManagerItems.length ? 'Deselect All' : 'Select All KPIs'}</span>
                </button>

                <span className="text-xs text-slate-500 font-bold">
                  {selectedKpiIdsForReview.length} of {visibleManagerItems.length} KPI(s) selected for review
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedKpiIdsForReview.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApproveReview(selectedKpiIdsForReview)}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Selected ({selectedKpiIdsForReview.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectReview(selectedKpiIdsForReview)}
                      disabled={saving}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Selected ({selectedKpiIdsForReview.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePushToAudit(selectedKpiIdsForReview)}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-50"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Dispatch Selected ({selectedKpiIdsForReview.length}) to Audit</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {visibleManagerItems
              .map((kpi: any, idx: number) => {
              // Retrieve active selected quarter tab for auditing this specific KPI
              const currentQuarterTab = activeKpiQuarter[kpi.id] || 'Q1';
              const isSelected = selectedKpiIdsForReview.includes(kpi.id);
              
              // Map variables specifically
              const activeQuartersList = [
                { id: 'Q1', label: 'Quarter 1', target: kpi.q1Target, actual: kpi.q1Actual, comment: kpi.q1Comment, textValue: kpi.q1Poe, docs: kpi.q1PoeDocs || [], status: kpi.q1PoeStatus || 'Pending Verification', feedback: kpi.q1PoeFeedback || '' },
                { id: 'Q2', label: 'Quarter 2', target: kpi.q2Target, actual: kpi.q2Actual, comment: kpi.q2Comment, textValue: kpi.q2Poe, docs: kpi.q2PoeDocs || [], status: kpi.q2PoeStatus || 'Pending Verification', feedback: kpi.q2PoeFeedback || '' },
                { id: 'Q3', label: 'Quarter 3', target: kpi.q3Target, actual: kpi.q3Actual, comment: kpi.q3Comment, textValue: kpi.q3Poe, docs: kpi.q3PoeDocs || [], status: kpi.q3PoeStatus || 'Pending Verification', feedback: kpi.q3PoeFeedback || '' },
                { id: 'Q4', label: 'Quarter 4', target: kpi.q4Target, actual: kpi.q4Actual, comment: kpi.q4Comment, textValue: kpi.q4Poe, docs: kpi.q4PoeDocs || [], status: kpi.q4PoeStatus || 'Pending Verification', feedback: kpi.q4PoeFeedback || '' },
                { id: 'ANNUAL', label: 'Annual Overview', target: kpi.annualTarget, actual: kpi.evaluation, comment: kpi.evaluationComment, textValue: kpi.annualPoe, docs: kpi.annualPoeDocs || [], status: kpi.annualPoeStatus || 'Pending Verification', feedback: kpi.annualPoeFeedback || '' },
                { id: 'MIDTERM', label: 'Mid-Year Review', target: kpi.midtermTarget, actual: kpi.midtermActual, comment: kpi.midtermComment, textValue: kpi.midtermPoe, docs: kpi.midtermPoeDocs || [], status: kpi.midtermPoeStatus || 'Pending Verification', feedback: kpi.midtermPoeFeedback || '' }
              ];

              const currentQuarterData = activeQuartersList.find(q => q.id === currentQuarterTab) || activeQuartersList[0];

              return (
                <div key={kpi.id} id={`kpi-card-${kpi.id}`} className={`p-5 rounded-2xl border ${isSelected ? 'bg-amber-50/20 border-amber-500 ring-4 ring-amber-500/30' : 'bg-white border-slate-200'} shadow-sm flex flex-col gap-4 transition-all duration-300`}>
                  {/* Header with metadata badging */}
                  <div className="flex flex-wrap justify-between items-start gap-3 pb-3 border-b border-rose-100/50">
                    <div className="flex flex-wrap items-center gap-2">
                      {isSelected && (
                        <span className="bg-amber-500 text-white font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-widest animate-pulse flex items-center shadow-sm">
                          ⚡ PENDING REVIEW
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleSelectKpiForReview(kpi.id)}
                        className={`p-1 rounded cursor-pointer ${isSelected ? 'text-amber-600 hover:text-amber-700' : 'text-slate-600 hover:text-indigo-600'}`}
                        title={isSelected ? 'Deselect KPI' : 'Select KPI for manager review actions'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

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
                      
                      {kpi.reviewStatus === 'Approved' && (
                        <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          ✅ Approved
                        </span>
                      )}
                      {kpi.reviewStatus === 'Revision Required' && (
                        <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          ⚠️ Revision Requested
                        </span>
                      )}
                      {kpi.reviewStatus === 'Dispatched to Audit' && (
                        <span className="bg-indigo-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          🛡️ In Internal Audit
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveReview([kpi.id])}
                        disabled={saving}
                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase flex items-center gap-1 cursor-pointer transition"
                        title="Approve single KPI"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Approve Single</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectReview([kpi.id])}
                        disabled={saving}
                        className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase flex items-center gap-1 cursor-pointer transition"
                        title="Reject / Request revision for single KPI"
                      >
                        <X className="w-3 h-3 text-rose-600" />
                        <span>Reject Single</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePushToAudit([kpi.id])}
                        disabled={saving}
                        className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase flex items-center gap-1 cursor-pointer transition"
                        title="Dispatch single KPI to Internal Audit Committee"
                      >
                        <ShieldAlert className="w-3 h-3 text-indigo-600" />
                        <span>Dispatch Single to Audit</span>
                      </button>

                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-xs font-black">
                        <span className="text-[9px] font-bold uppercase text-emerald-600/80">Weighting:</span>
                        <span>{kpi.weighting || 0}%</span>
                      </div>
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
                                    onClick={() => setPreviewDoc({ 
                                      ...doc, 
                                      fileData: doc.fileData || doc.url || createMockFileUrl(doc.name, doc.fileType || 'application/pdf', plan.metadata?.name || 'Employee'),
                                      kpiName: kpi.kpi, 
                                      quarter: currentQuarterTab 
                                    })}
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
                        Employee Self-Evaluation & Annual Metrics
                      </label>
                      <div className="text-[11px] text-slate-600 whitespace-pre-wrap select-text leading-relaxed">
                        {kpi.evaluation ? kpi.evaluation : <span className="italic">No self-evaluation summary provided.</span>}
                      </div>

                      {/* Annual Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2.5 rounded-lg border border-slate-200 mt-2">
                        <div>
                          <span className="font-extrabold text-slate-500 uppercase text-[8.5px] block">Annual Target:</span>
                          <span className="font-extrabold text-slate-900">{kpi.annualTarget || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-extrabold text-sky-700 uppercase text-[8.5px] block">Annual Actual:</span>
                          <span className="font-extrabold text-sky-950">{kpi.annualActual || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-extrabold text-emerald-700 uppercase text-[8.5px] block">Annual Actual Exp:</span>
                          <span className="font-extrabold text-emerald-950">{kpi.annualActualExpense || kpi.annualActualExp || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-extrabold text-amber-700 uppercase text-[8.5px] block">Annual Variance:</span>
                          <span className="font-extrabold text-rose-700">{kpi.annualVariance || calculateVariance(kpi.annualTarget, kpi.annualActual || kpi.q4Actual)}</span>
                        </div>
                        <div className="col-span-2 border-t border-slate-100 pt-1">
                          <span className="font-extrabold text-slate-600 uppercase text-[8.5px] block">Annual Corrective Measure:</span>
                          <span className="font-medium text-slate-800 italic">{kpi.annualCorrective || 'No annual corrective measure logged'}</span>
                        </div>
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
        )) : (
          /* Audit History Timeline */
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm max-w-4xl mx-auto space-y-6 select-text">
            <div>
              <h2 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Performance Agreement & PoE Audit Trail
              </h2>
              <p className="text-xs text-slate-505 text-slate-500 mt-1 font-semibold leading-normal">
                A transparent, system-guaranteed audit log capturing all workflow state updates, regulatory sign-offs, and compliance dispatches.
              </p>
            </div>

            <div className="relative pl-6 border-l-2 border-dashed border-indigo-200 space-y-8 ml-2">
              {getDisplayLogs().map((log: any, logIdx: number) => {
                const dateFormatted = new Date(log.timestamp).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                let iconBg = 'bg-slate-100 text-slate-600 border-slate-300';
                let iconElement = <Clock className="w-4 h-4" />;

                if (log.action.includes('Approved')) {
                  iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
                  iconElement = <CheckCircle className="w-4 h-4" />;
                } else if (log.action.includes('Audit') || log.action.includes('Dispatched') || log.action.includes('Forwarded')) {
                  iconBg = 'bg-indigo-50 text-indigo-700 border-indigo-300';
                  iconElement = <ShieldCheck className="w-4 h-4" />;
                } else if (log.action.includes('Revision') || log.action.includes('Rejected')) {
                  iconBg = 'bg-rose-50 text-rose-700 border-rose-300';
                  iconElement = <AlertTriangle className="w-4 h-4" />;
                } else if (log.action.includes('Created')) {
                  iconBg = 'bg-sky-50 text-sky-700 border-sky-300';
                  iconElement = <FileText className="w-4 h-4" />;
                }

                return (
                  <div key={logIdx} className="relative group">
                    <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center ${iconBg} shadow-xs z-10`}>
                      {iconElement}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-800">{log.action}</span>
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {log.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {dateFormatted}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">{log.userName}</span>
                          <span className="text-slate-400 font-mono">({log.userEmail})</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold uppercase text-indigo-600">Status Value:</span>
                          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.2 rounded font-bold">
                            {log.status}
                          </span>
                        </div>
                      </div>

                      {log.comment && (
                        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed select-text shadow-2xs">
                          {log.comment}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[9px] font-mono text-slate-400 text-center sm:text-left leading-normal">
                <p className="m-0 uppercase">CRITICAL SYSTEM AUDIT TRAIL RECORD</p>
                <p className="m-0">ALL WORKFLOW CHANGES PERMANENTLY CAPTURED AND SECURED IN CLOUD PLATFORM</p>
              </div>
              <div className="flex items-center gap-2 border-2 border-indigo-600/30 rounded-2xl px-4 py-2 bg-indigo-50/50 text-indigo-800">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div className="font-sans text-[8.5px] font-black uppercase tracking-wider leading-tight">
                  <p className="m-0 text-indigo-900">VERIFIED LOG</p>
                  <p className="m-0 text-[7px] text-indigo-600">FULLY COMPLIANT INTEGRITY</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED POE DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {previewDoc && (
        <OfficeDocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
      {previewDoc && false && (
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

                      {/* Live Document Preview Box if dataUrl exists */}
                      {previewDoc.dataUrl && (
                        <div className="my-3 border border-slate-200 rounded-xl overflow-hidden bg-slate-900 p-2 flex flex-col items-center justify-center">
                          {previewDoc.mimeType?.startsWith('image/') || previewDoc.dataUrl.startsWith('data:image/') ? (
                            <img src={previewDoc.dataUrl} alt={previewDoc.name} className="max-h-80 object-contain rounded-lg shadow-md" />
                          ) : previewDoc.mimeType?.includes('pdf') || previewDoc.dataUrl.startsWith('data:application/pdf') ? (
                            <iframe src={previewDoc.dataUrl} title={previewDoc.name} className="w-full h-80 rounded-lg bg-white" />
                          ) : (
                            <div className="p-4 text-center text-white text-xs">
                              <p className="font-bold text-amber-400 mb-1">Attached Document File ({previewDoc.name})</p>
                              <a href={previewDoc.dataUrl} download={previewDoc.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-emerald-500 mt-2">
                                Download File to View ({((previewDoc.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                              </a>
                            </div>
                          )}
                        </div>
                      )}

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

      {showClearKpiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in" id="manager-clear-kpis-modal">
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
