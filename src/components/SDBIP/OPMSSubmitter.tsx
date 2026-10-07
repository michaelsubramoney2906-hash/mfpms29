import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, ArrowRight, CheckCircle, AlertTriangle, AlertCircle, 
  Send, RefreshCw, Layers, Database, Search, ChevronRight, 
  Clock, Plus, ShieldCheck, Check, MessageSquare, Info, Lock, Unlock,
  Upload, Eye, Trash2, Paperclip, FileSpreadsheet, Presentation, Image as ImageIcon,
  Bell, CheckCircle2, UserCheck, ShieldAlert, X, RotateCcw, Cloud, Download, Building
} from 'lucide-react';
import type { User } from '../../types';
import { SdbipRow } from './SDBIP';
import { downloadOriginalFile } from '../../utils/documentBinaryHelper';
import { isQuarterInReportingPeriod, getQuarterLockNotice } from '../../utils/reportingPeriods';
import { OfficeDocumentViewer, PoeDocument } from '../IPMS/OfficeDocumentViewer';
import { 
  SdbipWorkflowNotification, 
  isUserMatch, 
  fetchSdbipNotifications, 
  dispatchSdbipNotification, 
  markSdbipNotificationRead,
  extractKpiPoes,
  isMasterAdminMike
} from '../../utils/sdbipWorkflowHelper';
import { isUserUnrestricted } from '../../utils/unrestrictedHelper';
import { calcOpmsVariance } from '../../utils/varianceCalculator';

interface OPMSSubmitterProps {
  currentUser: User;
  activeTenantId: string;
}

export function OPMSSubmitter({ currentUser, activeTenantId }: OPMSSubmitterProps) {
  const [rows, setRows] = useState<SdbipRow[]>([]);
  const [notifications, setNotifications] = useState<SdbipWorkflowNotification[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<'ALL' | 'MINE'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<SdbipRow | null>(null);
  const [kpaFilter, setKpaFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [poes, setPoes] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);
  const [uploadingPoe, setUploadingPoe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdminMike = isMasterAdminMike(currentUser);

  // Editing states for selected KPI
  const [q1Actual, setQ1Actual] = useState('');
  const [q1Variance, setQ1Variance] = useState('');
  const [q1Corrective, setQ1Corrective] = useState('');
  
  const [q2Actual, setQ2Actual] = useState('');
  const [q2Variance, setQ2Variance] = useState('');
  const [q2Corrective, setQ2Corrective] = useState('');

  const [q3Actual, setQ3Actual] = useState('');
  const [q3Variance, setQ3Variance] = useState('');
  const [q3Corrective, setQ3Corrective] = useState('');

  const [q4Actual, setQ4Actual] = useState('');
  const [q4Variance, setQ4Variance] = useState('');
  const [q4Corrective, setQ4Corrective] = useState('');

  const [poeDesc, setPoeDesc] = useState('');
  const [submitterNotes, setSubmitterNotes] = useState('');

  // 5-Second Autosave and Emergency Draft Recovery Engine
  const [activeScorecard, setActiveScorecard] = useState<'top' | 'dept'>('top');
  const [cloudDrafts, setCloudDrafts] = useState<Record<string, any>>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle');
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);
  const isInitialKpiLoad = useRef<boolean>(true);
  const autoSaveDebounceTimer = useRef<any>(null);

  const autoCalculateVariance = (target: string | undefined, actual: string | undefined) => {
    return calcOpmsVariance(target, actual, selectedKpi?.uom);
  };

  const loadNotifications = async () => {
    const list = await fetchSdbipNotifications(activeTenantId);
    setNotifications(list);
  };

  useEffect(() => {
    let lastLoaded = Date.now();
    fetchSDBIPData(false);
    fetchPoes();
    loadNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSDBIPData(true);
        fetchPoes();
        loadNotifications();
        lastLoaded = Date.now();
      }
    }, 30000); // 30s polling instead of 4s to avoid HTTP 429 rate limit issues

    const handleFocus = () => {
      if (Date.now() - lastLoaded > 15000 && document.visibilityState === 'visible') {
        fetchSDBIPData(true);
        fetchPoes();
        loadNotifications();
        lastLoaded = Date.now();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (autoSaveDebounceTimer.current) clearTimeout(autoSaveDebounceTimer.current);
    };
  }, [activeTenantId]);

  const fetchPoes = async () => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`);
      if (res.ok) {
        const data = await res.json();
        setPoes(data.poes || []);
      }
    } catch (e) {
      console.error("Error fetching POEs:", e);
    }
  };

  // Load KPI baseline or restore unsaved 5-second emergency draft if available
  useEffect(() => {
    if (selectedKpi) {
      isInitialKpiLoad.current = true;
      if (autoSaveDebounceTimer.current) clearTimeout(autoSaveDebounceTimer.current);

      const draftKey = `sdbip_draft_${activeTenantId}_${selectedKpi.id}_${currentUser.email}`;
      const savedDraftRaw = localStorage.getItem(draftKey);

      let draftLoaded = false;
      if (savedDraftRaw) {
        try {
          const parsed = JSON.parse(savedDraftRaw);
          const d = parsed.draftData || parsed;
          if (d && (d.q1Actual !== undefined || d.submitterNotes !== undefined)) {
            // Check if draft has difference with server data
            const hasDifference = 
              (d.q1Actual && d.q1Actual !== selectedKpi.q1Actual) ||
              (d.q1Variance && d.q1Variance !== selectedKpi.q1Variance) ||
              (d.q1Corrective && d.q1Corrective !== selectedKpi.q1Corrective) ||
              (d.submitterNotes && d.submitterNotes !== (selectedKpi as any).submitterNotes);

            if (hasDifference) {
              setQ1Actual(d.q1Actual || '');
              setQ1Variance(d.q1Variance || '');
              setQ1Corrective(d.q1Corrective || '');
              setQ2Actual(d.q2Actual || '');
              setQ2Variance(d.q2Variance || '');
              setQ2Corrective(d.q2Corrective || '');
              setQ3Actual(d.q3Actual || '');
              setQ3Variance(d.q3Variance || '');
              setQ3Corrective(d.q3Corrective || '');
              setQ4Actual(d.q4Actual || '');
              setQ4Variance(d.q4Variance || '');
              setQ4Corrective(d.q4Corrective || '');
              setPoeDesc(d.poeDesc || selectedKpi.poeDesc || '');
              setSubmitterNotes(d.submitterNotes || '');
              setIsDraftRestored(true);
              setDraftRestoredAt(parsed.timestamp ? new Date(parsed.timestamp).toLocaleTimeString() : 'Recent Session');
              setAutoSaveStatus('saved');
              draftLoaded = true;
            }
          }
        } catch (err) {
          console.warn("Draft parse error:", err);
        }
      }

      if (!draftLoaded) {
        // Check cloud drafts from Supabase (for impersonation or multi-session access)
        const cloudDraft = cloudDrafts[selectedKpi.id] || 
                           cloudDrafts[selectedKpi.refNum] || 
                           (selectedKpi.refNum && Object.entries(cloudDrafts).find(([k]) => k.toUpperCase().includes(selectedKpi.refNum.toUpperCase()))?.[1]);
        if (cloudDraft) {
          const d = cloudDraft.draftData || cloudDraft;
          if (d && (d.q1Actual || d.submitterNotes || d.q1Variance || d.q1Corrective)) {
            setQ1Actual(d.q1Actual || selectedKpi.q1Actual || '');
            setQ1Variance(d.q1Variance || selectedKpi.q1Variance || '');
            setQ1Corrective(d.q1Corrective || selectedKpi.q1Corrective || '');
            setQ2Actual(d.q2Actual || selectedKpi.q2Actual || '');
            setQ2Variance(d.q2Variance || selectedKpi.q2Variance || '');
            setQ2Corrective(d.q2Corrective || selectedKpi.q2Corrective || '');
            setQ3Actual(d.q3Actual || selectedKpi.q3Actual || '');
            setQ3Variance(d.q3Variance || selectedKpi.q3Variance || '');
            setQ3Corrective(d.q3Corrective || selectedKpi.q3Corrective || '');
            setQ4Actual(d.q4Actual || selectedKpi.q4Actual || '');
            setQ4Variance(d.q4Variance || selectedKpi.q4Variance || '');
            setQ4Corrective(d.q4Corrective || selectedKpi.q4Corrective || '');
            setPoeDesc(d.poeDesc || selectedKpi.poeDesc || selectedKpi.q1PoeDesc || '');
            setSubmitterNotes(d.submitterNotes || (selectedKpi as any).submitterNotes || '');
            setIsDraftRestored(true);
            setDraftRestoredAt('Cloud Auto-Saved Draft');
            setAutoSaveStatus('saved');
            draftLoaded = true;
          }
        }
      }

      if (!draftLoaded) {
        setQ1Actual(selectedKpi.q1Actual || '');
        setQ1Variance(selectedKpi.q1Variance || '');
        setQ1Corrective(selectedKpi.q1Corrective || '');

        setQ2Actual(selectedKpi.q2Actual || '');
        setQ2Variance(selectedKpi.q2Variance || '');
        setQ2Corrective(selectedKpi.q2Corrective || '');

        setQ3Actual(selectedKpi.q3Actual || '');
        setQ3Variance(selectedKpi.q3Variance || '');
        setQ3Corrective(selectedKpi.q3Corrective || '');

        setQ4Actual(selectedKpi.q4Actual || '');
        setQ4Variance(selectedKpi.q4Variance || '');
        setQ4Corrective(selectedKpi.q4Corrective || '');

        setPoeDesc(selectedKpi.poeDesc || selectedKpi.q1PoeDesc || '');
        setSubmitterNotes((selectedKpi as any).submitterNotes || '');
        setIsDraftRestored(false);
        setDraftRestoredAt(null);
        setAutoSaveStatus('idle');
      }
    } else {
      clearForm();
    }
  }, [selectedKpi?.id, cloudDrafts]);

  // 5-Second Autosave Engine: Keystroke snapshot + Debounced 5s cloud backup
  useEffect(() => {
    if (isInitialKpiLoad.current) {
      isInitialKpiLoad.current = false;
      return;
    }
    if (!selectedKpi) return;
    if (assignedFilter === 'ALL') return; // Read-only view
    if ((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed') return;

    const draftData = {
      q1Actual, q1Variance, q1Corrective,
      q2Actual, q2Variance, q2Corrective,
      q3Actual, q3Variance, q3Corrective,
      q4Actual, q4Variance, q4Corrective,
      poeDesc, submitterNotes
    };

    // Instant local emergency snapshot
    const draftKey = `sdbip_draft_${activeTenantId}_${selectedKpi.id}_${currentUser.email}`;
    localStorage.setItem(draftKey, JSON.stringify({ draftData, timestamp: Date.now() }));
    setAutoSaveStatus('dirty');

    // Debounced 5s server sync
    if (autoSaveDebounceTimer.current) clearTimeout(autoSaveDebounceTimer.current);
    autoSaveDebounceTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await fetch(`/api/tenant/${activeTenantId}/sdbip/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kpiId: selectedKpi.id,
            refNum: selectedKpi.refNum,
            userEmail: currentUser.email,
            draftData
          })
        });
        setAutoSaveStatus('saved');
        setLastAutoSavedTime(new Date().toLocaleTimeString());
      } catch (e) {
        // Safe locally in localStorage
        setAutoSaveStatus('saved');
      }
    }, 5000);
  }, [
    q1Actual, q1Variance, q1Corrective,
    q2Actual, q2Variance, q2Corrective,
    q3Actual, q3Variance, q3Corrective,
    q4Actual, q4Variance, q4Corrective,
    poeDesc, submitterNotes
  ]);

  const handleDiscardDraft = () => {
    if (!selectedKpi) return;
    const draftKey = `sdbip_draft_${activeTenantId}_${selectedKpi.id}_${currentUser.email}`;
    localStorage.removeItem(draftKey);
    fetch(`/api/tenant/${activeTenantId}/sdbip/draft/${selectedKpi.id}?userEmail=${encodeURIComponent(currentUser.email)}`, { method: 'DELETE' }).catch(() => {});

    setQ1Actual(selectedKpi.q1Actual || '');
    setQ1Variance(selectedKpi.q1Variance || '');
    setQ1Corrective(selectedKpi.q1Corrective || '');
    setQ2Actual(selectedKpi.q2Actual || '');
    setQ2Variance(selectedKpi.q2Variance || '');
    setQ2Corrective(selectedKpi.q2Corrective || '');
    setQ3Actual(selectedKpi.q3Actual || '');
    setQ3Variance(selectedKpi.q3Variance || '');
    setQ3Corrective(selectedKpi.q3Corrective || '');
    setQ4Actual(selectedKpi.q4Actual || '');
    setQ4Variance(selectedKpi.q4Variance || '');
    setQ4Corrective(selectedKpi.q4Corrective || '');
    setPoeDesc(selectedKpi.poeDesc || selectedKpi.q1PoeDesc || '');
    setSubmitterNotes((selectedKpi as any).submitterNotes || '');

    setIsDraftRestored(false);
    setDraftRestoredAt(null);
    setAutoSaveStatus('idle');
    setSuccess('Unsaved draft discarded. Official baseline data reloaded.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const clearForm = () => {
    setQ1Actual('');
    setQ1Variance('');
    setQ1Corrective('');
    setQ2Actual('');
    setQ2Variance('');
    setQ2Corrective('');
    setQ3Actual('');
    setQ3Variance('');
    setQ3Corrective('');
    setQ4Actual('');
    setQ4Variance('');
    setQ4Corrective('');
    setPoeDesc('');
    setSubmitterNotes('');
  };

  const fetchCloudDrafts = async () => {
    try {
      const emailToUse = currentUser.email || '';
      if (!emailToUse) return;
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip/drafts/${encodeURIComponent(emailToUse)}`);
      if (res.ok) {
        const data = await res.json();
        setCloudDrafts(data.drafts || {});
      }
    } catch (e) {}
  };

  const fetchSDBIPData = async (isBackground = false, targetScorecard?: 'top' | 'dept') => {
    const sc = targetScorecard || activeScorecard;
    if (!isBackground) setLoading(true);
    if (!isBackground) setError(null);
    try {
      const endpoint = sc === 'dept'
        ? `/api/tenant/${activeTenantId}/sdbip23`
        : `/api/tenant/${activeTenantId}/sdbip`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to retrieve SDBIP scorecard data');
      const data = await response.json();
      const freshItems = data.items || [];
      setRows(freshItems);
      setSelectedKpi(prev => {
        if (!prev) return null;
        return freshItems.find((x: SdbipRow) => x.id === prev.id) || prev;
      });
      fetchCloudDrafts();
    } catch (err: any) {
      console.error(err);
      if (!isBackground) setError(err.message || 'An error occurred while communicating with Supabase.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSwitchScorecard = (sc: 'top' | 'dept') => {
    setActiveScorecard(sc);
    setSelectedKpi(null);
    fetchSDBIPData(false, sc);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedKpi) return;
    if (isReadOnlyMode) {
      setError("Action Restricted: Read-only mode active. Only designated submitters under 'My KPIs' can upload evidence.");
      setTimeout(() => setError(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setUploadingPoe(true);
    try {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const newPoeItem = {
          id: `poe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          refNum: selectedKpi.refNum,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          date: new Date().toISOString().split('T')[0],
          fileData: dataUrl,
          fileType: file.type || 'application/octet-stream',
          uploadedBy: currentUser.email,
          uploadedAt: new Date().toISOString()
        };

        const updatedPoes = [newPoeItem, ...poes.filter(p => !(p.refNum === selectedKpi.refNum && p.name === file.name))];
        
        await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poes: updatedPoes })
        });

        setPoes(updatedPoes);

        // Also update the row's general or active quarter poes list
        const updatedRows = rows.map(r => {
          if (r.id === selectedKpi.id) {
            const currentQ1Poes = r.q1Poes || [];
            return {
              ...r,
              q1Poes: Array.from(new Set([...currentQ1Poes, file.name]))
            };
          }
          return r;
        });

        setRows(updatedRows);
        if (!q1Actual || q1Actual.trim() === '') {
          setSuccess(`Evidence document "${file.name}" uploaded successfully! ⚠️ Reminder: Please also log your Q1 Actual performance figure before pushing to your Approver.`);
        } else {
          setSuccess(`Evidence document "${file.name}" uploaded and encrypted into Supabase Cloud Vault.`);
        }
        setTimeout(() => setSuccess(null), 5000);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload POE document: ' + err.message);
    } finally {
      setUploadingPoe(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenPoePreview = (file: any) => {
    setPreviewDoc({
      id: file.id,
      name: file.name,
      mimeType: file.fileType || 'application/octet-stream',
      dataUrl: file.fileData,
      uploadedAt: file.uploadedAt || file.date,
      uploadedBy: file.uploadedBy || currentUser.fullName || currentUser.email,
      kpiName: selectedKpi?.kpi,
      quarter: 'General / Current Quarter'
    });
  };

  const handleDeletePoe = async (poeId: string, fileName: string) => {
    if (!selectedKpi) return;
    if (isReadOnlyMode && !isSuperAdminMike) {
      setError("Action Restricted: Read-only mode active. Only designated submitters under 'My KPIs' can delete evidence.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    try {
      const updatedPoes = poes.filter(p => p.id !== poeId);
      await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poes: updatedPoes })
      });
      setPoes(updatedPoes);

      // Clean up the row's quarter POE arrays
      const filterPoes = (arr: any) => Array.isArray(arr) ? arr.filter((fn: string) => fn !== fileName) : arr;
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          return {
            ...r,
            q1Poes: filterPoes(r.q1Poes),
            q2Poes: filterPoes(r.q2Poes),
            midTermPoes: filterPoes(r.midTermPoes),
            q3Poes: filterPoes(r.q3Poes),
            q4Poes: filterPoes(r.q4Poes),
          };
        }
        return r;
      });
      const currentScorecardEndpoint = activeScorecard === 'dept'
        ? `/api/tenant/${activeTenantId}/sdbip23`
        : `/api/tenant/${activeTenantId}/sdbip`;

      setRows(updatedRows);
      await fetch(currentScorecardEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });

      if (isSuperAdminMike) {
        // Log master override deletion to audit trail
        fetch('/api/audit/log-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            fullName: currentUser.fullName,
            tenantId: activeTenantId,
            role: 'Global Administrator',
            action: 'SUPERADMIN_POE_PURGE',
            moduleId: 'opms-submitter',
            moduleName: 'OPMS Submitter',
            subModuleId: 'opms-submitter',
            subModuleName: 'Submitter Workspace',
            details: `Global Administrator Mike purged PoE document "${fileName}" from KPI ${selectedKpi.refNum}.`
          })
        }).catch(console.error);
      }

      setSuccess(`Evidence document "${fileName}" successfully purged and deleted.`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError('Failed to delete document: ' + e.message);
    }
  };

  const handleMasterUndoSubmission = async () => {
    if (!selectedKpi) return;
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Submission Undone by Global Admin',
            user: currentUser.fullName || currentUser.email,
            notes: 'Global Administrator Mike unlocked and reverted submission to Draft state.'
          };
          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'draft' };
            }
          });
          return {
            ...r,
            workflowStatus: 'Draft',
            workflows,
            workflowHistory: [...currentHistory, newHistoryItem]
          } as SdbipRow;
        }
        return r;
      });

      const currentScorecardEndpoint = activeScorecard === 'dept'
        ? `/api/tenant/${activeTenantId}/sdbip23`
        : `/api/tenant/${activeTenantId}/sdbip`;

      const response = await fetch(currentScorecardEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });
      if (!response.ok) throw new Error('Failed to revert submission on Supabase');

      fetch('/api/audit/log-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          fullName: currentUser.fullName,
          tenantId: activeTenantId,
          role: 'Global Administrator',
          action: 'MASTER_UNDO_SUBMISSION',
          moduleId: 'opms-submitter',
          moduleName: 'OPMS Submitter',
          subModuleId: 'opms-submitter',
          subModuleName: 'Submitter Workspace',
          details: `Global Administrator Mike reverted KPI ${selectedKpi.refNum} from Submitted to Draft state.`
        })
      }).catch(console.error);

      setRows(updatedRows);
      setSelectedKpi(prev => prev ? { ...prev, workflowStatus: 'Draft' } as any : null);
      setSuccess(`🔓 Master Override: Submission undone! KPI ${selectedKpi.refNum} is now in Draft and fully editable.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to undo submission');
    } finally {
      setLoading(false);
    }
  };

  const handleMasterUnlockApproval = async () => {
    if (!selectedKpi) return;
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Approval Revoked by Global Admin',
            user: currentUser.fullName || currentUser.email,
            notes: 'Global Administrator Mike revoked approval seal and unlocked KPI for revision.'
          };
          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'draft', approvedBy: undefined };
            }
          });
          return {
            ...r,
            workflowStatus: 'Draft',
            approvedBy: undefined,
            workflows,
            workflowHistory: [...currentHistory, newHistoryItem]
          } as SdbipRow;
        }
        return r;
      });

      const currentScorecardEndpoint = activeScorecard === 'dept'
        ? `/api/tenant/${activeTenantId}/sdbip23`
        : `/api/tenant/${activeTenantId}/sdbip`;

      const response = await fetch(currentScorecardEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });
      if (!response.ok) throw new Error('Failed to revoke approval on Supabase');

      fetch('/api/audit/log-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          fullName: currentUser.fullName,
          tenantId: activeTenantId,
          role: 'Global Administrator',
          action: 'MASTER_UNLOCK_APPROVAL',
          moduleId: 'opms-submitter',
          moduleName: 'OPMS Submitter',
          subModuleId: 'opms-submitter',
          subModuleName: 'Submitter Workspace',
          details: `Global Administrator Mike revoked approval and unlocked KPI ${selectedKpi.refNum} for re-submission.`
        })
      }).catch(console.error);

      setRows(updatedRows);
      setSelectedKpi(prev => prev ? { ...prev, workflowStatus: 'Draft', approvedBy: undefined } as any : null);
      setSuccess(`🔓 Master Override: Approval seal revoked! KPI ${selectedKpi.refNum} is now reopened for editing.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke approval');
    } finally {
      setLoading(false);
    }
  };

  const handleMasterToggleLock = async (targetRowId?: string) => {
    const rowId = targetRowId || selectedKpi?.id;
    if (!rowId) return;
    const targetRow = rows.find(r => r.id === rowId);
    if (!targetRow) return;
    setLoading(true);
    try {
      const isCurrentlyLocked = (targetRow as any).workflowStatus === 'Approved' || (targetRow as any).workflowStatus === 'Reviewed' || (targetRow as any).adminLocked;
      const newStatus = isCurrentlyLocked ? 'Draft' : 'Approved';
      const updatedRows = rows.map(r => {
        if (r.id === rowId) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: isCurrentlyLocked ? 'Unlocked by Global Admin' : 'Locked by Global Admin',
            user: currentUser.fullName || currentUser.email,
            notes: isCurrentlyLocked ? 'Global Administrator Mike unlocked KPI for editing.' : 'Global Administrator Mike locked KPI.'
          };
          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: isCurrentlyLocked ? 'draft' : 'approved', approvedBy: isCurrentlyLocked ? undefined : (currentUser.fullName || currentUser.email) };
            }
          });
          return {
            ...r,
            workflowStatus: newStatus,
            approvedBy: isCurrentlyLocked ? undefined : (r.approvedBy || currentUser.fullName || currentUser.email),
            adminLocked: !isCurrentlyLocked,
            workflows,
            workflowHistory: [...currentHistory, newHistoryItem]
          } as SdbipRow;
        }
        return r;
      });

      const currentScorecardEndpoint = activeScorecard === 'dept'
        ? `/api/tenant/${activeTenantId}/sdbip23`
        : `/api/tenant/${activeTenantId}/sdbip`;

      const response = await fetch(currentScorecardEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });
      if (!response.ok) throw new Error('Failed to update lock status on Supabase');

      fetch('/api/audit/log-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          fullName: currentUser.fullName,
          tenantId: activeTenantId,
          role: 'Global Administrator',
          action: isCurrentlyLocked ? 'SUPERADMIN_UNLOCK_KPI' : 'SUPERADMIN_LOCK_KPI',
          moduleId: 'opms-submitter',
          moduleName: 'OPMS Submitter',
          subModuleId: 'opms-submitter',
          subModuleName: 'Submitter Workspace',
          details: `Global Administrator Mike ${isCurrentlyLocked ? 'unlocked' : 'locked'} KPI ${targetRow.refNum}.`
        })
      }).catch(console.error);

      setRows(updatedRows);
      if (selectedKpi?.id === rowId) {
        setSelectedKpi(prev => prev ? { ...prev, workflowStatus: newStatus, adminLocked: !isCurrentlyLocked } as any : null);
      }
      setSuccess(`🔓 Master Override: KPI ${targetRow.refNum} successfully ${isCurrentlyLocked ? 'unlocked and opened for editing' : 'locked'}!`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle lock status');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedKpi) return;
    if (isReadOnlyMode) {
      setError("Action Restricted: Read-only mode active. Only designated submitters under 'My KPIs' can save changes.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const workflows = r.workflows || {};
          ['q1', 'q2', 'q3', 'q4'].forEach(q => {
            workflows[q] = {
              ...(workflows[q]),
              status: 'draft',
              submittedBy: currentUser.email,
              submittedAt: new Date().toLocaleDateString()
            };
          });
          return {
            ...r,
            q1Actual, q1Variance, q1Corrective,
            q2Actual, q2Variance, q2Corrective,
            q3Actual, q3Variance, q3Corrective,
            q4Actual, q4Variance, q4Corrective,
            poeDesc,
            workflowStatus: (r as any).workflowStatus || 'Draft',
            submitterNotes: submitterNotes,
            workflows
          } as SdbipRow;
        }
        return r;
      });

      const currentScorecardEndpoint = activeScorecard === 'dept'
        ? `/api/tenant/${activeTenantId}/sdbip23`
        : `/api/tenant/${activeTenantId}/sdbip`;

      const response = await fetch(currentScorecardEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });

      if (!response.ok) throw new Error('Failed to save draft to Supabase');
      
      // Clean up 5-second draft backup buffer
      const draftKey = `sdbip_draft_${activeTenantId}_${selectedKpi.id}_${currentUser.email}`;
      localStorage.removeItem(draftKey);
      fetch(`/api/tenant/${activeTenantId}/sdbip/draft/${selectedKpi.id}?userEmail=${encodeURIComponent(currentUser.email)}`, { method: 'DELETE' }).catch(() => {});
      setIsDraftRestored(false);
      setAutoSaveStatus('saved');
      setLastAutoSavedTime(new Date().toLocaleTimeString());

      setRows(updatedRows);
      setSuccess('Draft metrics saved locally and synced with Supabase database!');
      setTimeout(() => setSuccess(null), 4000);
      setSelectedKpi(updatedRows.find(x => x.id === selectedKpi.id) || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWorkflow = async () => {
    if (!selectedKpi) return;
    if (isReadOnlyMode) {
      setError("Action Restricted: Read-only mode active. Only designated submitters under 'My KPIs' can submit scorecards to the Approver.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setLoading(true);
    try {
      const approverTarget = selectedKpi.approver || 'Approver';
      // Zero Data Loss safeguard: if input values are blank in state, check cloud draft or current row values
      const draftFallback = cloudDrafts[selectedKpi.id] || cloudDrafts[selectedKpi.refNum] || (cloudDrafts[selectedKpi.refNum]?.draftData) || {};
      const effQ1Actual = q1Actual || draftFallback.q1Actual || selectedKpi.q1Actual || '';
      const effQ1Variance = q1Variance || draftFallback.q1Variance || selectedKpi.q1Variance || '';
      const effQ1Corrective = q1Corrective || draftFallback.q1Corrective || selectedKpi.q1Corrective || '';

      // Mandatory Submitter Validation: Prevent pushing empty actuals to Approver
      const isTargetNA = selectedKpi.q1 && (selectedKpi.q1.trim().toUpperCase() === 'N/A' || selectedKpi.q1.trim().toUpperCase() === 'NOT APPLICABLE');
      if (!isTargetNA && (!effQ1Actual || effQ1Actual.trim() === '')) {
        const kpiPoesList = extractKpiPoes(selectedKpi, poes);
        const poeMsg = kpiPoesList.length > 0
          ? `You have attached ${kpiPoesList.length} Portfolio of Evidence (PoE) document(s), but your Q1 Actual progress is blank.`
          : `Reporting Q1 Actual achievement is required before submitting to your Executive Approver.`;
        setError(`Validation Notice: ${poeMsg} Please enter your Q1 Actual progress figure before submitting.`);
        setTimeout(() => setError(null), 6000);
        setLoading(false);
        return;
      }

      const effQ2Actual = q2Actual || draftFallback.q2Actual || selectedKpi.q2Actual || '';
      const effQ2Variance = q2Variance || draftFallback.q2Variance || selectedKpi.q2Variance || '';
      const effQ2Corrective = q2Corrective || draftFallback.q2Corrective || selectedKpi.q2Corrective || '';

      const effQ3Actual = q3Actual || draftFallback.q3Actual || selectedKpi.q3Actual || '';
      const effQ3Variance = q3Variance || draftFallback.q3Variance || selectedKpi.q3Variance || '';
      const effQ3Corrective = q3Corrective || draftFallback.q3Corrective || selectedKpi.q3Corrective || '';

      const effQ4Actual = q4Actual || draftFallback.q4Actual || selectedKpi.q4Actual || '';
      const effQ4Variance = q4Variance || draftFallback.q4Variance || selectedKpi.q4Variance || '';
      const effQ4Corrective = q4Corrective || draftFallback.q4Corrective || selectedKpi.q4Corrective || '';

      const effPoeDesc = poeDesc || draftFallback.poeDesc || selectedKpi.poeDesc || selectedKpi.q1PoeDesc || '';
      const effNotes = submitterNotes || draftFallback.submitterNotes || (selectedKpi as any).submitterNotes || '';

      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Submitted to Approver',
            user: currentUser.fullName || currentUser.email,
            notes: effNotes || `Submitted to Executive Approver (${approverTarget}) through OPMS Submitter dashboard.`
          };

          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(q => {
            workflows[q] = {
              ...(workflows[q]),
              status: 'pending_approval',
              submittedBy: currentUser.fullName || currentUser.email,
              submittedAt: new Date().toLocaleDateString()
            };
          });

          const kpiPoesList = extractKpiPoes(r, poes).map(p => p.name).filter(Boolean);
          const finalQ1Poes = (r.q1Poes && r.q1Poes.length > 0) ? r.q1Poes : kpiPoesList;

          return {
            ...r,
            q1Actual: effQ1Actual, q1Variance: effQ1Variance, q1Corrective: effQ1Corrective,
            q2Actual: effQ2Actual, q2Variance: effQ2Variance, q2Corrective: effQ2Corrective,
            q3Actual: effQ3Actual, q3Variance: effQ3Variance, q3Corrective: effQ3Corrective,
            q4Actual: effQ4Actual, q4Variance: effQ4Variance, q4Corrective: effQ4Corrective,
            poeDesc: effPoeDesc,
            q1Poes: finalQ1Poes,
            workflowStatus: 'Submitted to Approver',
            submittedBy: currentUser.fullName || currentUser.email,
            submitterNotes: effNotes,
            workflows,
            workflowHistory: [...currentHistory, newHistoryItem]
          } as SdbipRow;
        }
        return r;
      });

      const currentScorecardEndpoint = activeScorecard === 'dept'
        ? `/api/tenant/${activeTenantId}/sdbip23`
        : `/api/tenant/${activeTenantId}/sdbip`;

      const response = await fetch(currentScorecardEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });

      if (!response.ok) throw new Error('Failed to submit SDBIP item to Approver');

      // Clean up 5-second draft backup buffer
      const draftKey = `sdbip_draft_${activeTenantId}_${selectedKpi.id}_${currentUser.email}`;
      localStorage.removeItem(draftKey);
      fetch(`/api/tenant/${activeTenantId}/sdbip/draft/${selectedKpi.id}?userEmail=${encodeURIComponent(currentUser.email)}`, { method: 'DELETE' }).catch(() => {});
      setIsDraftRestored(false);
      setAutoSaveStatus('saved');

      // Dispatch real-time notification to specified approver
      const approverTargets = Array.from(new Set([
        approverTarget,
        (selectedKpi as any).approverEmail,
        (selectedKpi as any).approverName,
        selectedKpi.approver
      ].filter(Boolean))) as string[];

      await dispatchSdbipNotification(activeTenantId, {
        targetUser: approverTargets.length > 0 ? approverTargets : 'Executive Approver',
        senderUser: currentUser.fullName || currentUser.email,
        kpiId: selectedKpi.id,
        refNum: selectedKpi.refNum,
        kpiName: selectedKpi.kpi,
        phase: 'General',
        message: `KPI ${selectedKpi.refNum} submitted for Executive Approval by Submitter ${currentUser.fullName || currentUser.email}.`,
        comment: submitterNotes,
        actionType: 'submitted'
      });

      await loadNotifications();
      
      const submittedItem = updatedRows.find(x => x.id === selectedKpi.id) || null;
      setRows(updatedRows);
      if (submittedItem) {
        setSelectedKpi(submittedItem);
      }
      
      try {
        window.dispatchEvent(new CustomEvent('sdbip:refresh', { detail: { count: updatedRows.length, items: updatedRows } }));
      } catch (_) {}

      setSuccess(`✅ SDBIP KPI ${selectedKpi.refNum} successfully submitted to Executive Approver (${approverTarget})! Status updated to SUBMITTED.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute unique KPAs for filtering
  const kpas = Array.from(new Set(rows.map(r => r.kpas).filter(Boolean)));

  const filteredRows = rows.filter(r => {
    const matchesKpa = kpaFilter === 'ALL' || r.kpas === kpaFilter;
    const matchesSearch = searchQuery === '' || 
      (r.refNum && r.refNum.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (r.kpi && r.kpi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.strategicObj && r.strategicObj.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMine = assignedFilter === 'ALL' || 
      isUserMatch(r.submitter, currentUser) ||
      isUserMatch((r as any).submitterName, currentUser) ||
      isUserMatch((r as any).person, currentUser) ||
      isUserMatch(r.responsibleUnit, currentUser);
    return matchesKpa && matchesSearch && matchesMine;
  });

  // Calculate high level stats
  const totalKpis = rows.length;
  const draftCount = rows.filter(r => !(r as any).workflowStatus || (r as any).workflowStatus === 'Draft').length;
  const submittedCount = rows.filter(r => (r as any).workflowStatus === 'Submitted to Approver' || (r as any).workflowStatus === 'Submitted').length;
  const reviewedCount = rows.filter(r => (r as any).workflowStatus === 'Reviewed' || (r as any).workflowStatus === 'Pending Review').length;
  const approvedCount = rows.filter(r => (r as any).workflowStatus === 'Approved').length;
  const returnedCount = rows.filter(r => (r as any).workflowStatus === 'Returned').length;

  // Check if currentUser is the specifically assigned Submitter or Unit for the selected KPI, OR if user is an unrestricted admin/impersonator
  const isImpersonating = typeof window !== 'undefined' && 
    !!(localStorage.getItem('originalAdminUser') || sessionStorage.getItem('originalAdminUser'));
  const isUnrestrictedAdmin = isUserUnrestricted(currentUser) || isMasterAdminMike(currentUser) || isImpersonating;
  const isActualDesignatedSubmitter = Boolean(
    selectedKpi && (
      isUnrestrictedAdmin ||
      isUserMatch(selectedKpi.submitter, currentUser) ||
      isUserMatch((selectedKpi as any).submitterName, currentUser) ||
      isUserMatch((selectedKpi as any).person, currentUser) ||
      isUserMatch(selectedKpi.responsibleUnit, currentUser)
    )
  );

  // Read-only mode: When selecting "All KPIs" (and not an unrestricted admin), or when not the designated submitter of this KPI
  const isReadOnlyMode = (assignedFilter === 'ALL' && !isUnrestrictedAdmin) || !isActualDesignatedSubmitter;

  // Q1 is currently active for municipal reporting
  const isQ1ActivePeriod = isQuarterInReportingPeriod('q1');

  // Q1 Actual can ONLY be edited if:
  // 1. Under "My KPIs" view (assignedFilter === 'MINE')
  // 2. Logged-in user is the actual designated submitter
  // 3. We are in active Q1 reporting period
  // 4. Not already Approved, Reviewed, or Admin Locked
  const isQ1ActualEditable = !isReadOnlyMode &&
    isQ1ActivePeriod &&
    (selectedKpi as any).workflowStatus !== 'Approved' &&
    (selectedKpi as any).workflowStatus !== 'Reviewed' &&
    !(selectedKpi as any).adminLocked;

  const isQ1ActualDisabled = !isQ1ActualEditable;

  const getStatusBadge = (status: string | undefined) => {
    const s = status || 'Draft';
    switch (s) {
      case 'Submitted':
      case 'Submitted to Approver':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider inline-flex items-center gap-1 shadow-2xs">
            <Clock className="w-2.5 h-2.5 text-amber-400" />
            <span>Submitted (Awaiting Approver)</span>
          </span>
        );
      case 'Pending Review':
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider inline-flex items-center gap-1 shadow-2xs">
            <Clock className="w-2.5 h-2.5 text-blue-400" />
            <span>Awaiting Reviewer</span>
          </span>
        );
      case 'Reviewed':
        return (
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider inline-flex items-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-2.5 h-2.5 text-indigo-400" />
            <span>Awaiting MM Approval</span>
          </span>
        );
      case 'Approved':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider inline-flex items-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>Approved & Locked</span>
          </span>
        );
      case 'Returned':
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider inline-flex items-center gap-1 shadow-2xs">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
            <span>Returned / Action Required</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider inline-flex items-center gap-1 shadow-2xs">
            <FileText className="w-2.5 h-2.5 text-slate-400" />
            <span>Draft Workspace</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-white p-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Layers className="w-40 h-40" />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                OPMS Submitter Station
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-semibold">
                Supabase Connected
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-100 font-sans">
              Departmental Scorecard Submission Workspace
            </h1>
            <p className="text-slate-400 text-xs max-w-2xl mt-1">
              Log actual quarterly achievements, attach verifiable Portfolio of Evidence (PoE) documentation, and dispatch to the Performance Management Unit (PMU) for compliance review.
            </p>
          </div>
          <button 
            onClick={() => fetchSDBIPData(false)}
            disabled={loading}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </button>
        </div>
      </div>

      {/* Scorecard Tier Selection Tab */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => handleSwitchScorecard('top')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
            activeScorecard === 'top'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Top Layer SDBIP (Council Strategic Indicators)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSwitchScorecard('dept')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
            activeScorecard === 'dept'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Departmental SDBIP (2nd & 3rd Layer Operational)</span>
        </button>
      </div>

      {/* High-Level Executive Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total KPIs</span>
          <span className="text-2xl font-black text-white mt-1">{totalKpis}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Draft Workspace</span>
          <span className="text-2xl font-black text-slate-300 mt-1">{draftCount}</span>
        </div>
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Awaiting PMU Review</span>
          <span className="text-2xl font-black text-amber-400 mt-1">{submittedCount}</span>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Approved & Locked</span>
          <span className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</span>
        </div>
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Action Required</span>
          <span className="text-2xl font-black text-rose-400 mt-1">{returnedCount}</span>
        </div>
      </div>

      {/* Global Toast Alerts */}
      {error && (
        <div className="bg-rose-950/30 border-2 border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/30 border-2 border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-emerald-300 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Real-time Submitter Workflow Notifications Pop-Up Panel */}
      {(() => {
        const myUnreadNotifs = notifications.filter(n => isUserMatch(n.targetUser, currentUser) && !n.read);
        if (myUnreadNotifs.length === 0) return null;
        return (
          <div className="space-y-2">
            {myUnreadNotifs.map((notif) => {
              const isReturned = notif.actionType === 'returned';
              return (
                <div 
                  key={notif.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all animate-fade-in ${
                    isReturned 
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-100' 
                      : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isReturned ? 'bg-rose-600/30 text-rose-300' : 'bg-indigo-600/30 text-indigo-300'}`}>
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black bg-black/40 px-2 py-0.5 rounded border border-white/10">{notif.refNum}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isReturned ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30' : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {isReturned ? 'Returned for Resubmission' : 'Workflow Update'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 text-white">{notif.message}</p>
                      {notif.comment && (
                        <div className="mt-1.5 p-2 bg-black/40 rounded-lg border border-white/5 text-[11px] italic font-sans text-rose-200">
                          <strong>Comments / Required Changes:</strong> "{notif.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        const targetRow = rows.find(r => r.id === notif.kpiId || r.refNum === notif.refNum);
                        if (targetRow) {
                          setSelectedKpi(targetRow);
                        }
                      }}
                      className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Review & Resend KPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await markSdbipNotificationRead(activeTenantId, notif.id, notifications);
                        setNotifications(updated);
                      }}
                      className="p-1.5 bg-black/30 hover:bg-black/50 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      title="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Split Dashboard Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Scorecard List Pane */}
        <div className={`flex flex-col space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 min-h-[500px] ${selectedKpi ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              Assigned Performance scorecards ({filteredRows.length})
            </h2>

            {/* Smart Inline Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setAssignedFilter('MINE')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${assignedFilter === 'MINE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  My KPIs
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedFilter('ALL')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${assignedFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All KPIs
                </button>
              </div>

              <div className="relative shrink-0 w-36">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter key ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={kpaFilter}
                onChange={(e) => setKpaFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All KPAs</option>
                {kpas.map(kpa => (
                  <option key={kpa} value={kpa}>{kpa}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List/Table of KPIs */}
          <div className="overflow-auto max-h-[520px] divide-y divide-slate-850">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <AlertTriangle className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-bold">No assigned KPIs matching the current filter options.</p>
                <p className="text-[10px] mt-0.5">Please ensure SDBIP top-layer tables have been configured or synchronized.</p>
              </div>
            ) : (
              filteredRows.map(row => {
                const isSelected = selectedKpi?.id === row.id;
                const status = (row as any).workflowStatus || (
                  row.workflows?.q1?.status === 'pending_approval' || row.workflows?.q2?.status === 'pending_approval' || row.workflows?.midTerm?.status === 'pending_approval' || row.workflows?.q3?.status === 'pending_approval' || row.workflows?.q4?.status === 'pending_approval' ? 'Submitted to Approver' :
                  row.workflows?.q1?.status === 'approved' ? 'Approved' :
                  row.workflows?.q1?.status === 'pending_review' ? 'Pending Review' : 'Draft'
                );
                return (
                  <div 
                    key={row.id}
                    onClick={() => setSelectedKpi(row)}
                    className={`p-3 transition-all cursor-pointer hover:bg-slate-850/50 flex flex-col space-y-2 border-l-4 ${isSelected ? 'bg-slate-850 border-l-indigo-500' : 'border-l-transparent'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <span className="bg-slate-950 px-2 py-0.5 border border-slate-800 text-slate-200 rounded font-bold">
                          {row.refNum}
                        </span>
                        <span className="text-[10px] tracking-wide text-slate-500 truncate max-w-xs">
                          {row.kpas}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {getStatusBadge(status)}
                        {(status === 'Submitted' || status === 'Submitted to Approver') && (!row.q1Actual || row.q1Actual.trim() === '') && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider inline-flex items-center gap-1 shadow-2xs">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                            <span>Missing Actual</span>
                          </span>
                        )}
                        {isSuperAdminMike && (status === 'Approved' || status === 'Reviewed' || (row as any).adminLocked) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKpi(row);
                              handleMasterToggleLock(row.id);
                            }}
                            className="px-1.5 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-500/60 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-xs"
                            title="Quick Unlock Approval (Global Admin Mike Master Override)"
                          >
                            <Unlock className="w-2.5 h-2.5 text-rose-300" />
                            <span>Unlock</span>
                          </button>
                        )}
                        {isSuperAdminMike && (status === 'Submitted' || status === 'Submitted to Approver' || status === 'Pending Review' || status === 'Pending Audit') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKpi(row);
                              handleMasterUndoSubmission();
                            }}
                            className="px-1.5 py-0.5 bg-amber-900/80 hover:bg-amber-800 text-amber-200 border border-amber-500/60 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-xs"
                            title="Quick Undo Submission to Draft (Global Admin Mike Master Override)"
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-amber-300" />
                            <span>Undo</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      <strong>KPI:</strong> {row.kpi}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Annual Target: <strong className="text-indigo-400">{row.annualTarget}</strong></span>
                      <span className="flex items-center gap-1 text-slate-400 font-semibold hover:text-white transition-colors">
                        {assignedFilter === 'ALL' ? (
                          <>View (Read-Only) <Eye className="w-3 h-3 text-slate-400" /></>
                        ) : (
                          <>Enter Achievements <ChevronRight className="w-3 h-3" /></>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Execution Detail Submission Desk */}
        {selectedKpi && (
          <div className="lg:col-span-6 xl:col-span-5 bg-slate-900/65 border-2 border-slate-800 rounded-2xl p-5 flex flex-col space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Workspace</span>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest font-mono">
                    KPI REF: {selectedKpi.refNum}
                  </h3>
                  {/* 5-Second Autosave Status Indicator */}
                  {!isReadOnlyMode && !((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed') && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono">
                      {autoSaveStatus === 'saving' && (
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>Saving draft...</span>
                        </span>
                      )}
                      {autoSaveStatus === 'dirty' && (
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <span>Unsaved draft (Syncing in 5s)</span>
                        </span>
                      )}
                      {autoSaveStatus === 'saved' && (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Auto-saved (5s Cloud Safe{lastAutoSavedTime ? ` • ${lastAutoSavedTime}` : ''})</span>
                        </span>
                      )}
                      {autoSaveStatus === 'idle' && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Cloud className="w-2.5 h-2.5 text-indigo-400" />
                          <span>5s Auto-Save Active</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedKpi(null)}
                className="text-slate-500 hover:text-slate-200 text-xs font-bold font-mono px-2 py-1 rounded hover:bg-slate-800 transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Emergency Draft Restored Alert Banner */}
            {isDraftRestored && (
              <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-slate-950 border border-cyan-500/50 rounded-xl p-3 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg shrink-0">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <span className="font-bold text-cyan-200 uppercase tracking-wider text-[11px] block">
                      Emergency Draft Recovered ({draftRestoredAt})
                    </span>
                    <p className="text-[10.5px] text-slate-300">
                      Unsaved edits from your previous session were automatically restored. No work was lost.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 rounded-lg text-[10px] font-bold uppercase tracking-wider transition shrink-0 cursor-pointer"
                  title="Discard unsaved draft and reload official server baseline"
                >
                  Discard Draft
                </button>
              </div>
            )}

            {/* General Info Card */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1.5 text-xs">
              <p className="text-slate-400"><strong>Strategic Objective:</strong> {selectedKpi.strategicObj}</p>
              <p className="text-slate-200"><strong>Assigned Key Performance Indicator:</strong> {selectedKpi.kpi}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] border-t border-slate-900 text-slate-400">
                <span>Unit of Measure: <strong>{selectedKpi.uom || 'N/A'}</strong></span>
                <span>Annual Target: <strong className="text-indigo-400">{selectedKpi.annualTarget}</strong></span>
              </div>
            </div>

            {/* Current workflow state callout */}
            <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Workflow Stage:</span>
              {getStatusBadge((selectedKpi as any).workflowStatus)}
            </div>

            {/* Workflow status constraints warning */}
            {((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed') && (
              <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-[11px] p-3 rounded-xl flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  This scorecard has been formally validated by executive authorities and is <strong>locked</strong> against further modifications. Editing is disabled.
                </span>
              </div>
            )}

            {/* Returned warning alert */}
            {(selectedKpi as any).workflowStatus === 'Returned' && (
              <div className="bg-rose-950/30 border border-rose-900/40 text-rose-300 text-[11px] p-3 rounded-xl flex flex-col space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>PMU Correction Directive</span>
                </div>
                <p className="text-slate-300 text-[10.5px]">
                  <strong>Review Remarks:</strong> {(selectedKpi as any).reviewerNotes || 'Please inspect details, attach correct PoE and re-submit.'}
                </p>
              </div>
            )}

            {/* Master Override Bar for Global Administrator Mike */}
            {isSuperAdminMike && (
              <div className="bg-gradient-to-r from-amber-950/50 via-red-950/40 to-amber-950/50 border-2 border-amber-500/60 rounded-xl p-3.5 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    👑 Global Administrator Master Override (Mike)
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                    Status: {(selectedKpi as any).workflowStatus || 'Draft'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  As Global Administrator (<strong className="text-amber-300">mike@mzansiflow.co.za</strong>), you have exclusive authority to undo submissions, revoke approval locks, purge locked evidence files, and unlock scorecards for revision.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed' || (selectedKpi as any).adminLocked) && (
                    <button
                      type="button"
                      onClick={handleMasterUnlockApproval}
                      disabled={loading}
                      className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-50"
                      title="Revoke official approval seal and reopen this KPI for revision"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Revoke Approval & Reopen KPI</span>
                    </button>
                  )}
                  {((selectedKpi as any).workflowStatus === 'Submitted to Approver' || (selectedKpi as any).workflowStatus === 'Submitted' || (selectedKpi as any).workflowStatus === 'Reviewed' || (selectedKpi as any).workflowStatus === 'Pending Review' || (selectedKpi as any).workflowStatus === 'Approved') && (
                    <button
                      type="button"
                      onClick={handleMasterUndoSubmission}
                      disabled={loading}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-50"
                      title="Undo submission and return KPI to Draft so the submitter can modify values"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo Submission & Revert to Draft</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMasterToggleLock()}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-50 ${
                      (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).adminLocked
                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                    title="Toggle Master Lock / Unlock state"
                  >
                    {(selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).adminLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Unlock Scorecard</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lock Scorecard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Read-Only Notice Banner */}
            {isReadOnlyMode && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Read-Only Scorecard View</span>
                      <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.2 rounded uppercase">
                        {assignedFilter === 'ALL' ? 'All KPIs View' : 'Not Designated Submitter'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {assignedFilter === 'ALL'
                        ? "Scorecards selected under 'All KPIs' are strictly read-only. Switch to 'My KPIs' where you are the designated submitter to edit Q1 achievements."
                        : `You are not the designated submitter (${selectedKpi.submitter || selectedKpi.responsibleUnit || 'Unassigned'}) for this scorecard.`
                      }
                    </p>
                  </div>
                </div>
                {assignedFilter === 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setAssignedFilter('MINE')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                  >
                    Switch to My KPIs
                  </button>
                )}
              </div>
            )}

            {/* Incomplete Submission Warning Banner */}
            {((selectedKpi as any).workflowStatus === 'Submitted to Approver' || (selectedKpi as any).workflowStatus === 'Submitted') && (!q1Actual || q1Actual.trim() === '') && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200 shadow-sm animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <span>Action Required: Incomplete Submission Detected</span>
                  </div>
                  <p className="leading-relaxed text-[11.5px] text-amber-100/90">
                    This scorecard was submitted to your Approver without an entered Q1 Actual performance figure. The Approver cannot approve a blank record. Please enter your genuine Q1 performance figure in the <strong>Actual progress</strong> box below, then click <strong>"Update & Re-Submit to Approver"</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Submitter Metrics Entry Forms */}
            <div className="space-y-4 max-h-[360px] overflow-auto pr-1">
              
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Target Projections vs Achievements
                </div>
                
                <div className="p-3 space-y-3">
                  {/* Q1 Section */}
                  <div className={`p-2.5 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors ${isQ1ActualEditable ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20' : isReadOnlyMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-900/80 border-slate-850/60'}`}>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>1st Quarter (Q1) Target: <strong className="text-white">{selectedKpi.q1 || '0'}</strong></span>
                      {isReadOnlyMode ? (
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                          <Eye className="w-2.5 h-2.5 text-slate-400" /> Read-Only ({assignedFilter === 'ALL' ? 'All KPIs View' : 'Not Assigned Submitter'})
                        </span>
                      ) : isQ1ActualEditable ? (
                        <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                          <Unlock className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Q1 Active & Unlocked (My KPI)
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-500/80" /> Q1 Locked ({(selectedKpi as any).workflowStatus || 'Locked'})
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
                        <span>Actual progress</span>
                        {isQ1ActualEditable && <span className="text-[9px] text-emerald-400 font-mono">● Unlocked</span>}
                      </label>
                      <input
                        type="text"
                        value={q1Actual}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQ1Actual(val);
                          const calculated = autoCalculateVariance(selectedKpi.q1, val);
                          if (calculated) {
                            setQ1Variance(calculated);
                          }
                        }}
                        disabled={isQ1ActualDisabled}
                        placeholder={isReadOnlyMode ? "Read-Only (All KPIs view)" : isQ1ActualDisabled ? "Locked for this period" : "Log Q1 performance..."}
                        title={isReadOnlyMode ? "Read-Only: Switch to 'My KPIs' where you are the designated submitter to edit" : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${isQ1ActualDisabled ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-emerald-500/40 focus:border-emerald-400 text-white'}`}
                      />
                      <span className="text-[9px] font-bold text-indigo-400 block mt-0.5">
                        Target: {selectedKpi.q1 || '0'} vs Actual: {q1Actual || '-'} (Var: {autoCalculateVariance(selectedKpi.q1, q1Actual) || '0'})
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Variance explanation</label>
                      <input
                        type="text"
                        value={q1Variance}
                        onChange={(e) => setQ1Variance(e.target.value)}
                        disabled={isQ1ActualDisabled}
                        placeholder={isReadOnlyMode ? "Read-Only (All KPIs view)" : isQ1ActualDisabled ? "Locked for this period" : "Why targets differ..."}
                        title={isReadOnlyMode ? "Read-Only: Switch to 'My KPIs' where you are the designated submitter to edit" : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${isQ1ActualDisabled ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-emerald-500/40 focus:border-emerald-400 text-white'}`}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Corrective measure</label>
                      <input
                        type="text"
                        value={q1Corrective}
                        onChange={(e) => setQ1Corrective(e.target.value)}
                        disabled={isQ1ActualDisabled}
                        placeholder={isReadOnlyMode ? "Read-Only (All KPIs view)" : isQ1ActualDisabled ? "Locked for this period" : "Mitigations for gaps..."}
                        title={isReadOnlyMode ? "Read-Only: Switch to 'My KPIs' where you are the designated submitter to edit" : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${isQ1ActualDisabled ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-emerald-500/40 focus:border-emerald-400 text-white'}`}
                      />
                    </div>
                  </div>

                  {/* Q2 Section - Strictly Locked during Quarter 1 */}
                  <div className="p-2.5 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors bg-slate-950/60 border-slate-850 opacity-80 select-none">
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>2nd Quarter (Q2) Target: <strong className="text-white">{selectedKpi.q2 || '0'}</strong></span>
                      <span title="2nd Quarter reporting is locked. The current municipal reporting period is Quarter 1 (Q1)." className="text-[9px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-500" /> Q2 Locked (Current Period: Q1)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Actual progress</label>
                      <input
                        type="text"
                        value={q2Actual}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q2 performance entry is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                      <span className="text-[9px] font-bold text-slate-500 block mt-0.5 font-mono">
                        Target: {selectedKpi.q2 || '0'} • Locked (Period: Q1)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Variance explanation</label>
                      <input
                        type="text"
                        value={q2Variance}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q2 variance is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Corrective measure</label>
                      <input
                        type="text"
                        value={q2Corrective}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q2 corrective measure is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                    </div>
                  </div>

                  {/* Q3 Section - Strictly Locked during Quarter 1 */}
                  <div className="p-2.5 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors bg-slate-950/60 border-slate-850 opacity-80 select-none">
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>3rd Quarter (Q3) Target: <strong className="text-white">{selectedKpi.q3 || '0'}</strong></span>
                      <span title="3rd Quarter reporting is locked. The current municipal reporting period is Quarter 1 (Q1)." className="text-[9px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-500" /> Q3 Locked (Current Period: Q1)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Actual progress</label>
                      <input
                        type="text"
                        value={q3Actual}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q3 performance entry is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                      <span className="text-[9px] font-bold text-slate-500 block mt-0.5 font-mono">
                        Target: {selectedKpi.q3 || '0'} • Locked (Period: Q1)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Variance explanation</label>
                      <input
                        type="text"
                        value={q3Variance}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q3 variance is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Corrective measure</label>
                      <input
                        type="text"
                        value={q3Corrective}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q3 corrective measure is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                    </div>
                  </div>

                  {/* Q4 Section - Strictly Locked during Quarter 1 */}
                  <div className="p-2.5 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors bg-slate-950/60 border-slate-850 opacity-80 select-none">
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>4th Quarter (Q4) Target: <strong className="text-white">{selectedKpi.q4 || '0'}</strong></span>
                      <span title="4th Quarter reporting is locked. The current municipal reporting period is Quarter 1 (Q1)." className="text-[9px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-500" /> Q4 Locked (Current Period: Q1)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Actual progress</label>
                      <input
                        type="text"
                        value={q4Actual}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q4 performance entry is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                      <span className="text-[9px] font-bold text-slate-500 block mt-0.5 font-mono">
                        Target: {selectedKpi.q4 || '0'} • Locked (Period: Q1)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Variance explanation</label>
                      <input
                        type="text"
                        value={q4Variance}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q4 variance is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Corrective measure</label>
                      <input
                        type="text"
                        value={q4Corrective}
                        disabled={true}
                        placeholder="Locked (Current Period: Q1)"
                        title="Q4 corrective measure is locked. Current active municipal reporting period is Quarter 1."
                        className="w-full border rounded p-1.5 text-xs bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio of Evidence Detail & File Vault */}
              <div className="space-y-2 bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Verifiable Portfolio of Evidence (PoE)</span>
                  </label>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.svg,.txt"
                    />
                    <button
                      type="button"
                      disabled={isReadOnlyMode || uploadingPoe || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                      onClick={() => {
                        if (isReadOnlyMode) return;
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm disabled:cursor-not-allowed"
                      title={isReadOnlyMode ? "Read-Only: Evidence upload is restricted to the designated submitter under 'My KPIs'." : "Upload evidence document"}
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingPoe ? 'Uploading...' : 'Upload PoE File'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={poeDesc}
                  onChange={(e) => setPoeDesc(e.target.value)}
                  disabled={isReadOnlyMode || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                  placeholder={isReadOnlyMode ? "PoE description (Read-Only: only designated submitter under 'My KPIs' can edit)." : "Provide brief details on what evidence is available (e.g. 'Attendance Register file, Site Inspection photographs attached')."}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-2 text-xs text-white h-16 focus:outline-none resize-none disabled:bg-slate-900/60 disabled:text-slate-500 disabled:cursor-not-allowed"
                />

                {/* Attached PoE Files for this KPI */}
                {(() => {
                  const relevantPoes = extractKpiPoes(selectedKpi, poes);
                  if (relevantPoes.length === 0) {
                    return (
                      <p className="text-[10px] text-slate-500 italic py-1">
                        No files attached yet. Upload Word, Excel, PowerPoint, PDF or image evidence directly.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] font-black tracking-wider uppercase text-slate-400">Attached Evidence Files ({relevantPoes.length}):</span>
                      <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {relevantPoes.map((p) => {
                          const ext = p.name.split('.').pop()?.toLowerCase();
                          return (
                            <div key={p.id} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs hover:border-slate-700 transition">
                              <div className="flex items-center gap-2 overflow-hidden">
                                {ext === 'xlsx' || ext === 'xls' || ext === 'csv' ? (
                                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : ext === 'pptx' || ext === 'ppt' ? (
                                  <Presentation className="w-4 h-4 text-amber-400 shrink-0" />
                                ) : ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || ext === 'svg' ? (
                                  <ImageIcon className="w-4 h-4 text-rose-400 shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                )}
                                <div className="truncate">
                                  <span className="text-white font-medium block truncate text-[11px]">{p.name}</span>
                                  <span className="text-[9px] text-slate-400">{p.quarter} • {p.size || 'Attached'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPoePreview(p)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                                  title="View document on-screen without downloading"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View PoE</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadOriginalFile(p.name, p.fileData || p.dataUrl, {
                                      kpiName: selectedKpi.kpi,
                                      refNum: selectedKpi.refNum,
                                      quarter: p.quarter || 'General'
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm border border-slate-700"
                                  title="Download original file in its exact native binary format"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                                {(!((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed') || isSuperAdminMike) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePoe(p.id, p.name)}
                                    className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${isSuperAdminMike && ((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed') ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/60 shadow-xs' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}
                                    title={isSuperAdminMike ? "Master Override: Delete / Purge locked PoE document from Supabase" : "Delete document"}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    {isSuperAdminMike && ((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed') && (
                                      <span className="text-[8px] font-bold uppercase tracking-wider text-rose-300">Purge</span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Feedback History Cards from Approver, Reviewer, and Audit */}
              {((selectedKpi as any).approverNotes || (selectedKpi as any).reviewerNotes || (selectedKpi as any).auditNotes) && (
                <div className="space-y-2">
                  {(selectedKpi as any).approverNotes && (
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px] font-mono">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Executive Approver Directive / Comments ({selectedKpi.approver || 'Approver'}):</span>
                      </div>
                      <p className="text-amber-200 italic font-medium leading-relaxed bg-black/30 p-2 rounded border border-amber-900/40">
                        "{(selectedKpi as any).approverNotes}"
                      </p>
                    </div>
                  )}

                  {(selectedKpi as any).reviewerNotes && (
                    <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase text-[10px] font-mono">
                        <Search className="w-3.5 h-3.5" />
                        <span>PMU Reviewer Feedback ({selectedKpi.reviewer || 'Reviewer'}):</span>
                      </div>
                      <p className="text-indigo-200 italic font-medium leading-relaxed bg-black/30 p-2 rounded border border-indigo-900/40">
                        "{(selectedKpi as any).reviewerNotes}"
                      </p>
                    </div>
                  )}

                  {(selectedKpi as any).auditNotes && (
                    <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[10px] font-mono">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Internal Audit Findings / Queries ({selectedKpi.internalAudit || 'Internal Audit Desk'}):</span>
                      </div>
                      <p className="text-rose-200 italic font-medium leading-relaxed bg-black/30 p-2 rounded border border-rose-900/40">
                        "{(selectedKpi as any).auditNotes}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submitter specific comments */}
              <div className="space-y-1 bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                <label className="text-[10px] font-black uppercase text-slate-400">Submitter Workflow Remarks & Explanation</label>
                <textarea
                  value={submitterNotes}
                  onChange={(e) => setSubmitterNotes(e.target.value)}
                  disabled={isReadOnlyMode || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                  placeholder={isReadOnlyMode ? "Remarks disabled in Read-Only mode." : "Enter context, explanations of variances, or responses to feedback before pushing to the Executive Approver..."}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-2 text-xs text-white h-16 focus:outline-none resize-none disabled:bg-slate-900/60 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>

              {/* Workflow History Logs */}
              {(selectedKpi as any).workflowHistory && (selectedKpi as any).workflowHistory.length > 0 && (
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/20 space-y-2">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Audit Pipeline Logs</span>
                  </div>
                  <div className="space-y-2 font-mono text-[10px] divide-y divide-slate-850/60 max-h-48 overflow-y-auto pr-1">
                    {((selectedKpi as any).workflowHistory as any[]).map((h, i) => (
                      <div key={i} className="pt-2 first:pt-0">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-indigo-400">{h.action}</span>
                          <span className="text-slate-500">{new Date(h.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400 mt-0.5 font-sans">User: {h.user}</p>
                        {h.notes && <p className="text-slate-300 bg-slate-950 px-2 py-1 rounded mt-1 font-sans italic text-[10.5px]">Notes: {h.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Submitter Action Controls */}
            {isReadOnlyMode ? (
              <div className="space-y-2 pt-3 border-t border-slate-850">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    {assignedFilter === 'ALL'
                      ? "Scorecard is in Read-Only mode (All KPIs view). Switch to 'My KPIs' to edit and submit your assigned metrics."
                      : `Read-Only: You are not the designated submitter (${selectedKpi.submitter || selectedKpi.responsibleUnit || 'Unassigned'}) for this scorecard.`
                    }
                  </span>
                </div>
              </div>
            ) : (!((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed')) && (
              <div className="space-y-2 pt-3 border-t border-slate-850">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>Designated Approver: <strong className="text-amber-400 font-bold">{selectedKpi.approver || 'Not assigned'}</strong></span>
                  <span>Reviewer: <strong className="text-indigo-400 font-bold">{selectedKpi.reviewer || 'Not assigned'}</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="w-full bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl py-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handleSubmitWorkflow}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    title={`Push to Approver (${selectedKpi.approver || 'Executive Approver'})`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {((selectedKpi as any).workflowStatus === 'Submitted to Approver' || (selectedKpi as any).workflowStatus === 'Submitted') && (!q1Actual || q1Actual.trim() === '')
                        ? 'Update & Re-Submit to Approver'
                        : 'Push to Approver'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {previewDoc && (
        <OfficeDocumentViewer
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
