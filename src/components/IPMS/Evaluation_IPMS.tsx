import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Save,
  Award,
  Paperclip,
  Eye,
  Trash2,
  Download,
  Send,
  RotateCcw,
  Lock,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  File,
  Users,
  RefreshCw
} from 'lucide-react';
import type { User } from '../../types';
import { OfficeDocumentViewer } from './OfficeDocumentViewer';
import { downloadOriginalFile } from '../../utils/documentBinaryHelper';
import { isUserUnrestricted } from '../../utils/unrestrictedHelper';

export interface PoeDocument {
  id: string;
  name: string;
  url?: string;
  blobId?: string;
  uploadedAt?: string;
  size?: number;
  type?: string;
  fileData?: string;
  dataUrl?: string;
  mimeType?: string;
  uploadedBy?: string;
  notes?: string;
  [key: string]: any;
}

export function calculateVariance(target?: string | number, actual?: string | number): string {
  if (target === undefined || target === null || actual === undefined || actual === null) return '0';
  const tStr = String(target).trim();
  const aStr = String(actual).trim();
  if (!tStr || !aStr) return '0';
  if (tStr.toUpperCase() === 'N/A' || aStr.toUpperCase() === 'N/A') return '0';

  const tLower = tStr.toLowerCase();
  const aLower = aStr.toLowerCase();
  if (tLower === aLower) return '0';

  // Extract primary numeric value
  const tMatch = tStr.replace(/,/g, '.').match(/-?\d+(\.\d+)?/);
  const aMatch = aStr.replace(/,/g, '.').match(/-?\d+(\.\d+)?/);

  if (!tMatch || !aMatch) {
    if (aLower.includes('achieved') && !aLower.includes('not achieved')) return '0';
    return tStr === aStr ? '0' : 'Variance noted';
  }

  const tNum = parseFloat(tMatch[0]);
  const aNum = parseFloat(aMatch[0]);
  if (isNaN(tNum) || isNaN(aNum)) return '0';

  const diff = Number((aNum - tNum).toFixed(2));
  if (diff === 0) return '0';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

export interface QuarterPoeSelectorProps {
  quarter?: 'q1' | 'q2' | 'midterm' | 'q3' | 'q4' | 'annual';
  quarterName?: string;
  label?: string;
  documents?: PoeDocument[];
  files?: PoeDocument[];
  setFiles?: (newFiles: any) => void;
  onUpload?: (files: FileList) => void;
  onRemove?: (docId: string) => void;
  disabled?: boolean;
  placeholderRef?: string;
  requiredPoeDescription?: string;
  textValue?: string;
  setTextValue?: (val: any) => void;
  currentUser?: any;
  poeStatus?: string;
  [key: string]: any;
}

export function QuarterPoeSelector({
  quarter,
  quarterName,
  label,
  documents,
  files,
  setFiles,
  onUpload,
  onRemove,
  disabled = false,
  textValue,
  setTextValue,
  currentUser
}: QuarterPoeSelectorProps) {
  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);
  const effectiveDocs: PoeDocument[] = Array.isArray(files)
    ? files
    : Array.isArray(documents)
    ? documents
    : [];
  const qLabel = quarterName || (quarter ? quarter.toUpperCase() : 'POE');

  const handleFileInput = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (onUpload) {
      onUpload(fileList);
      return;
    }
    if (setFiles) {
      const uploaded: PoeDocument[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
        let finalUrl = dataUrl;
        const docId = `poe_doc_${qLabel}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        try {
          const blobRes = await fetch('/api/poe/blob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: docId,
              name: f.name,
              mimeType: f.type || 'application/octet-stream',
              size: f.size,
              dataUrl,
              uploadedAt: new Date().toISOString(),
              uploadedBy: currentUser?.email || 'Official',
              userId: currentUser?.email || 'Official'
            })
          });
          if (blobRes.ok) {
            const bJson = await blobRes.json();
            if (bJson?.url) finalUrl = bJson.url;
          }
        } catch (_) {}
        uploaded.push({
          id: docId,
          name: f.name,
          mimeType: f.type || 'application/octet-stream',
          size: f.size,
          dataUrl: finalUrl,
          url: finalUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.email || 'Official'
        });
      }
      setFiles([...effectiveDocs, ...uploaded]);
    }
  };

  const handleRemoveDoc = (docId: string) => {
    if (onRemove) {
      onRemove(docId);
    } else if (setFiles) {
      setFiles(effectiveDocs.filter((d) => d.id !== docId));
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
      <div className="flex items-center justify-between font-bold text-slate-200">
        <span className="uppercase tracking-wider text-[10px] text-emerald-400">
          {label || `${qLabel} POE Evidence`} ({effectiveDocs.length})
        </span>
        {!disabled && (onUpload || setFiles) && (
          <label className="cursor-pointer px-2 py-0.5 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-[10px] flex items-center gap-1 font-bold transition">
            <Upload className="w-3 h-3" />
            <span>Attach File</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFileInput(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
      {setTextValue && (
        <input
          type="text"
          value={textValue || ''}
          onChange={(e) => setTextValue(e.target.value)}
          disabled={disabled}
          placeholder="Required POE description / reference..."
          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
        />
      )}
      {effectiveDocs.length === 0 ? (
        <span className="text-[10px] text-slate-500 italic">No POE document attached</span>
      ) : (
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-0.5">
          {effectiveDocs.map((doc) => {
            const fileHref = doc.dataUrl || doc.url || '';
            return (
              <div
                key={doc.id || doc.name}
                className="flex items-center justify-between bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 text-[11px] gap-2"
              >
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="flex items-center gap-1.5 min-w-0 flex-1 text-left text-slate-200 hover:text-emerald-300 transition cursor-pointer"
                  title={`Click to preview ${doc.name}`}
                >
                  <Paperclip className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate font-semibold">{doc.name}</span>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1 rounded hover:bg-slate-800 text-sky-400 hover:text-sky-300 cursor-pointer"
                    title="View POE Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {fileHref && (
                    <button
                      type="button"
                      onClick={() => downloadOriginalFile(doc.name, fileHref, { mimeType: doc.mimeType })}
                      className="p-1 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      title="Download POE Document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!disabled && (onRemove || setFiles) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-1 rounded hover:bg-slate-800 text-rose-400 hover:text-rose-300 cursor-pointer"
                      title="Remove POE Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {previewDoc && (
        <OfficeDocumentViewer
          doc={previewDoc as any}
          docList={effectiveDocs as any}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

interface EvaluationIPMSProps {
  currentUser: User;
  activeTenantId?: string;
  isTeamEvaluation?: boolean;
  readOnly?: boolean;
  readOnlyOwnerLabel?: string;
}

export function EvaluationIPMS({
  currentUser,
  activeTenantId = 'tenant-229',
  isTeamEvaluation = false,
  readOnly = false,
  readOnlyOwnerLabel
}: EvaluationIPMSProps) {
  const [items, setItems] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKpiId, setUploadingKpiId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'midterm' | 'q3' | 'q4' | 'annual'>('q1');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reported' | 'submitted' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ doc: PoeDocument; list: PoeDocument[] } | null>(null);

  // Allow unrestricted system admins/managers to inspect any official's profile
  const canSwitchProfile = useMemo(() => {
    const email = (currentUser?.email || '').toLowerCase().trim();
    const roleStr = String(currentUser?.role || '').toLowerCase();
    return (
      !readOnly &&
      (isUserUnrestricted(currentUser) ||
        roleStr === 'admin' ||
        roleStr === 'system_admin' ||
        roleStr === 'municipality_admin' ||
        email.includes('mike@') ||
        email.includes('audrey@') ||
        email.includes('delphine@') ||
        email.includes('shabangusm@') ||
        email.includes('nsibandenp@') ||
        email.includes('zulune@'))
    );
  }, [currentUser, readOnly]);

  const [directoryUsers, setDirectoryUsers] = useState<any[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(currentUser?.email || '');

  useEffect(() => {
    if (currentUser?.email) {
      setSelectedUserEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (!canSwitchProfile) return;
    const tenant = activeTenantId || 'tenant-229';
    fetch(`/api/tenant/${tenant}/users?minimal=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (Array.isArray(list)) {
          setDirectoryUsers(list);
        }
      })
      .catch(() => {});
  }, [canSwitchProfile, activeTenantId]);

  const userEmail = (selectedUserEmail || currentUser?.email || '').trim();

  const loadEvaluationData = async () => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const tenant = activeTenantId || 'tenant-229';
      const endpoint = isTeamEvaluation ? 'team-pplan' : 'pplan';
      const [primaryRes, fallbackRes] = await Promise.all([
        fetch(`/api/tenant/${tenant}/${endpoint}?userId=${encodeURIComponent(userEmail)}&t=${Date.now()}`),
        isTeamEvaluation
          ? fetch(`/api/tenant/${tenant}/pplan?userId=${encodeURIComponent(userEmail)}&t=${Date.now()}`)
          : Promise.resolve(null)
      ]);

      let primaryData: any = null;
      if (primaryRes && primaryRes.ok) {
        primaryData = await primaryRes.json();
      }
      let fallbackData: any = null;
      if (fallbackRes && fallbackRes.ok) {
        fallbackData = await fallbackRes.json();
      }

      const primaryItems = primaryData?.items || primaryData?.rows || (Array.isArray(primaryData) ? primaryData : []);
      const fallbackItems = fallbackData?.items || fallbackData?.rows || (Array.isArray(fallbackData) ? fallbackData : []);

      const chosenItems = Array.isArray(primaryItems) && primaryItems.length > 0 ? primaryItems : fallbackItems;
      const chosenMeta = primaryData?.metadata && Object.keys(primaryData.metadata).length > 0
        ? primaryData.metadata
        : (fallbackData?.metadata || {});

      setMetadata(chosenMeta);
      setItems(Array.isArray(chosenItems) ? chosenItems : []);
    } catch (err: any) {
      console.warn('Failed to load evaluation items from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluationData();
  }, [userEmail, activeTenantId, isTeamEvaluation]);

  const getQuarterKeys = (q: 'q1' | 'q2' | 'midterm' | 'q3' | 'q4' | 'annual') => {
    switch (q) {
      case 'q1':
        return {
          targetKey: 'q1Target',
          actualKey: 'q1Actual',
          scoreKey: 'q1Score',
          managerScoreKey: 'q1ManagerScore',
          poeKey: 'q1Poe',
          poeDocsKey: 'q1PoeDocs',
          commentKey: 'q1Comment',
          correctiveKey: 'q1Corrective',
          poeStatusKey: 'q1PoeStatus',
          lockedKey: 'q1Locked'
        };
      case 'q2':
        return {
          targetKey: 'q2Target',
          actualKey: 'q2Actual',
          scoreKey: 'q2Score',
          managerScoreKey: 'q2ManagerScore',
          poeKey: 'q2Poe',
          poeDocsKey: 'q2PoeDocs',
          commentKey: 'q2Comment',
          correctiveKey: 'q2Corrective',
          poeStatusKey: 'q2PoeStatus',
          lockedKey: 'q2Locked'
        };
      case 'midterm':
        return {
          targetKey: 'midtermTarget',
          actualKey: 'midtermActual',
          scoreKey: 'midtermScore',
          managerScoreKey: 'managerScore',
          poeKey: 'midtermPoe',
          poeDocsKey: 'midtermPoeDocs',
          commentKey: 'midtermComment',
          correctiveKey: 'midtermCorrective',
          poeStatusKey: 'midtermPoeStatus',
          lockedKey: 'midtermLocked'
        };
      case 'q3':
        return {
          targetKey: 'q3Target',
          actualKey: 'q3Actual',
          scoreKey: 'q3Score',
          managerScoreKey: 'q3ManagerScore',
          poeKey: 'q3Poe',
          poeDocsKey: 'q3PoeDocs',
          commentKey: 'q3Comment',
          correctiveKey: 'q3Corrective',
          poeStatusKey: 'q3PoeStatus',
          lockedKey: 'q3Locked'
        };
      case 'q4':
        return {
          targetKey: 'q4Target',
          actualKey: 'q4Actual',
          scoreKey: 'q4Score',
          managerScoreKey: 'q4ManagerScore',
          poeKey: 'q4Poe',
          poeDocsKey: 'q4PoeDocs',
          commentKey: 'q4Comment',
          correctiveKey: 'q4Corrective',
          poeStatusKey: 'q4PoeStatus',
          lockedKey: 'q4Locked'
        };
      case 'annual':
      default:
        return {
          targetKey: 'annualTarget',
          actualKey: 'annualActual',
          scoreKey: 'myScore',
          managerScoreKey: 'managerScore',
          poeKey: 'annualPoe',
          poeDocsKey: 'annualPoeDocs',
          commentKey: 'evaluationComment',
          correctiveKey: 'q4Corrective',
          poeStatusKey: 'q4PoeStatus',
          lockedKey: 'annualLocked'
        };
    }
  };

  const qKeys = getQuarterKeys(selectedQuarter);

  const isTargetNA = (it: any): boolean => {
    const tVal = String(it?.[qKeys.targetKey] || '').trim().toUpperCase();
    return Boolean(it?.[qKeys.lockedKey]) || tVal === 'N/A' || tVal === 'NA' || tVal === 'NOT APPLICABLE';
  };

  const hasItemReportedInQuarter = (it: any): boolean => {
    if (!it) return false;
    const act = String(it[qKeys.actualKey] || '').trim();
    const docs = Array.isArray(it[qKeys.poeDocsKey]) ? it[qKeys.poeDocsKey] : [];
    const score = String(it[qKeys.scoreKey] || it.myScore || '').trim();
    return Boolean((act && act.toUpperCase() !== 'N/A') || docs.length > 0 || (score && score !== 'N/A'));
  };

  const updateKpiField = (kpiIdOrNo: string, updates: Record<string, any>) => {
    if (readOnly) return;
    setItems((prev) =>
      prev.map((item) => {
        const match =
          (item.id && item.id === kpiIdOrNo) ||
          (item.kpiNo && item.kpiNo === kpiIdOrNo) ||
          (item.refNum && item.refNum === kpiIdOrNo);
        if (match) {
          return { ...item, ...updates };
        }
        return item;
      })
    );
  };

  const persistEvaluationItems = async (updatedItems: any[], customMetadata?: Record<string, any>, successMsg?: string) => {
    if (readOnly) return;
    setIsSaving(true);
    setSaveStatus({ type: 'info', message: 'Saving reported actuals, scores & POE documents to Supabase...' });
    try {
      const tenant = activeTenantId || 'tenant-229';
      const submittedIds = updatedItems
        .filter(
          (it) =>
            it.reviewStatus === 'Submitted for Approval' ||
            it.reviewStatus === 'Submitted for Review' ||
            it.reviewStatus === 'Submitted' ||
            it.reviewStatus === 'Approved'
        )
        .map((it) => String(it.id || it.kpiNo || ''))
        .filter(Boolean);

      const nextMeta = {
        ...metadata,
        email: userEmail,
        _authoritativePoeUpdate: true,
        submittedKpiIds: submittedIds,
        reviewStatus: submittedIds.length > 0 ? 'Submitted for Approval' : (metadata?.reviewStatus || 'Draft'),
        updatedAt: new Date().toISOString(),
        ...(customMetadata || {})
      };

      const endpoint = isTeamEvaluation ? 'team-pplan' : 'pplan';
      const res = await fetch(`/api/tenant/${tenant}/${endpoint}?userId=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          metadata: nextMeta,
          items: updatedItems
        })
      });

      if (isTeamEvaluation) {
        await fetch(`/api/tenant/${tenant}/pplan?userId=${encodeURIComponent(userEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userEmail,
            metadata: nextMeta,
            items: updatedItems
          })
        }).catch(() => {});
      }

      if (res.ok) {
        setMetadata(nextMeta);
        setSaveStatus({
          type: 'success',
          message: successMsg || 'Reported actuals, scores, and POE evidence saved to Supabase!'
        });
        window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: tenant, userId: userEmail } }));
      } else {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: `Save failed: ${err.message || 'Unknown network error'}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPoeFiles = async (item: any, fileList: FileList | null) => {
    if (readOnly || !fileList || fileList.length === 0) return;
    const itemKey = item.id || item.kpiNo;
    setUploadingKpiId(itemKey);
    try {
      const qUpper = selectedQuarter.toUpperCase();
      const existingDocs: PoeDocument[] = Array.isArray(item[qKeys.poeDocsKey]) ? item[qKeys.poeDocsKey] : [];
      const newDocs: PoeDocument[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const docId = `poe_doc_${qUpper}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        let finalUrl = dataUrl;
        try {
          const blobRes = await fetch('/api/poe/blob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: docId,
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              dataUrl,
              uploadedAt: new Date().toISOString(),
              uploadedBy: userEmail,
              userId: userEmail
            })
          });
          if (blobRes.ok) {
            const bJson = await blobRes.json();
            if (bJson?.url) finalUrl = bJson.url;
          }
        } catch (_) {}

        newDocs.push({
          id: docId,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: finalUrl,
          url: finalUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userEmail
        });
      }

      const mergedDocs = [...existingDocs, ...newDocs];
      const nextItems = items.map((it) => {
        if ((it.id && it.id === itemKey) || (it.kpiNo && it.kpiNo === itemKey)) {
          return {
            ...it,
            [qKeys.poeDocsKey]: mergedDocs,
            poeFileName: mergedDocs[0]?.name || it.poeFileName || '',
            [qKeys.poeStatusKey]: it[qKeys.poeStatusKey] === 'Approved' ? 'Approved' : 'Pending Verification'
          };
        }
        return it;
      });
      setItems(nextItems);
      await persistEvaluationItems(nextItems, undefined, `Attached ${newDocs.length} POE file(s) and saved to Supabase.`);
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: `POE upload failed: ${err.message || 'Error'}` });
    } finally {
      setUploadingKpiId(null);
    }
  };

  const handleRemovePoeFile = async (item: any, docId: string) => {
    if (readOnly) return;
    const itemKey = item.id || item.kpiNo;
    const existingDocs: PoeDocument[] = Array.isArray(item[qKeys.poeDocsKey]) ? item[qKeys.poeDocsKey] : [];
    const remaining = existingDocs.filter((d) => (d.id || d.name) !== docId);
    const nextItems = items.map((it) => {
      if ((it.id && it.id === itemKey) || (it.kpiNo && it.kpiNo === itemKey)) {
        return {
          ...it,
          [qKeys.poeDocsKey]: remaining,
          poeFileName: remaining[0]?.name || ''
        };
      }
      return it;
    });
    setItems(nextItems);
    await persistEvaluationItems(nextItems, undefined, 'POE document removed and updated in Supabase.');
  };

  const handleSubmitSingleKpi = async (item: any) => {
    if (readOnly) return;
    const itemKey = item.id || item.kpiNo;
    const nextItems = items.map((it) => {
      if ((it.id && it.id === itemKey) || (it.kpiNo && it.kpiNo === itemKey)) {
        return {
          ...it,
          reviewStatus: 'Submitted for Approval',
          reviewApprovalStatus: '',
          resubmissionUnlocked: false,
          resubmittedAt: new Date().toISOString(),
          [qKeys.poeStatusKey]: 'Pending Verification'
        };
      }
      return it;
    });
    setItems(nextItems);
    await persistEvaluationItems(nextItems, undefined, `KPI ${item.kpiNo || ''} submitted for line manager approval!`);
  };

  const handleUnlockSingleKpi = async (item: any) => {
    if (readOnly) return;
    const itemKey = item.id || item.kpiNo;
    const nextItems = items.map((it) => {
      if ((it.id && it.id === itemKey) || (it.kpiNo && it.kpiNo === itemKey)) {
        return {
          ...it,
          reviewStatus: 'Draft',
          reviewApprovalStatus: '',
          resubmissionUnlocked: true
        };
      }
      return it;
    });
    setItems(nextItems);
    await persistEvaluationItems(nextItems, undefined, `KPI ${item.kpiNo || ''} unlocked for editing.`);
  };

  const handleSubmitAllReported = async () => {
    if (readOnly) return;
    const nextItems = items.map((it) => {
      if (hasItemReportedInQuarter(it) && it.reviewStatus !== 'Approved') {
        return {
          ...it,
          reviewStatus: 'Submitted for Approval',
          reviewApprovalStatus: '',
          resubmissionUnlocked: false,
          resubmittedAt: new Date().toISOString(),
          [qKeys.poeStatusKey]: 'Pending Verification'
        };
      }
      return it;
    });
    setItems(nextItems);
    await persistEvaluationItems(
      nextItems,
      { reviewStatus: 'Submitted for Approval' },
      'All reported KPIs and POE evidence submitted for Line Manager approval!'
    );
  };

  // Summary metrics for active quarter
  const summaryStats = useMemo(() => {
    let reportableCount = 0;
    let reportedCount = 0;
    let totalPoeDocs = 0;
    let submittedOrApprovedCount = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    for (const it of items) {
      if (!it) continue;
      if (!isTargetNA(it)) reportableCount++;
      const docs: PoeDocument[] = Array.isArray(it[qKeys.poeDocsKey]) ? it[qKeys.poeDocsKey] : [];
      totalPoeDocs += docs.length;
      if (hasItemReportedInQuarter(it)) {
        reportedCount++;
      }
      const st = it.reviewStatus || it.reviewApprovalStatus || '';
      if (
        st === 'Submitted for Approval' ||
        st === 'Submitted for Review' ||
        st === 'Submitted' ||
        st === 'Approved' ||
        st === 'Reviewed' ||
        st === 'Dispatched to Audit'
      ) {
        submittedOrApprovedCount++;
      }
      const rawScore = parseFloat(String(it[qKeys.scoreKey] || it.myScore || ''));
      if (!isNaN(rawScore) && rawScore > 0) {
        scoreSum += rawScore;
        scoreCount++;
      }
    }

    return {
      totalKpis: items.length,
      reportableCount,
      reportedCount,
      totalPoeDocs,
      submittedOrApprovedCount,
      avgScore: scoreCount > 0 ? (scoreSum / scoreCount).toFixed(2) : '—'
    };
  }, [items, selectedQuarter]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (!it) return false;
      if (statusFilter === 'reported' && !hasItemReportedInQuarter(it)) return false;
      if (statusFilter === 'submitted') {
        const st = it.reviewStatus || it.reviewApprovalStatus || '';
        const isSub =
          st === 'Submitted for Approval' ||
          st === 'Submitted for Review' ||
          st === 'Submitted' ||
          st === 'Approved' ||
          st === 'Reviewed' ||
          st === 'Revision Required';
        if (!isSub && !hasItemReportedInQuarter(it)) return false;
      }
      if (statusFilter === 'pending') {
        if (isTargetNA(it) || hasItemReportedInQuarter(it)) return false;
      }

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(it.kpiDescription || it.kpi || it.description || '').toLowerCase().includes(q) ||
        String(it.kpiNo || it.refNum || '').toLowerCase().includes(q) ||
        String(it.kpa || it.functionalKpa || it.strategicGoal || '').toLowerCase().includes(q) ||
        String(it[qKeys.actualKey] || '').toLowerCase().includes(q) ||
        (Array.isArray(it[qKeys.poeDocsKey]) &&
          it[qKeys.poeDocsKey].some((d: any) => String(d?.name || '').toLowerCase().includes(q)))
      );
    });
  }, [items, statusFilter, searchQuery, selectedQuarter]);

  const getFileIcon = (doc: PoeDocument) => {
    const ext = (doc.name || '').split('.').pop()?.toLowerCase() || '';
    const mime = (doc.mimeType || '').toLowerCase();
    if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation')) {
      return <Presentation className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) || mime.startsWith('image/')) {
      return <Image className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
    if (ext === 'pdf' || mime.includes('pdf')) {
      return <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  };

  const displayOwnerName = metadata?.name || currentUser?.fullName || userEmail;
  const displayJobTitle = metadata?.position || metadata?.jobTitle || currentUser?.jobFunction || 'Municipal Official';
  const displayDepartment = metadata?.department || currentUser?.department || '';
  const displayManager = metadata?.manager || metadata?.reportTo || currentUser?.manager || '';

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 md:p-6 space-y-5 overflow-y-auto">
      {/* Top Header Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-white tracking-wide uppercase">
                {readOnlyOwnerLabel || (isTeamEvaluation ? 'Team IPMS Evaluation & POE Portfolio' : 'Individual Performance Evaluation & POE Portfolio')}
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                SUPABASE LIVE PROFILE
              </span>
              {metadata?.reviewStatus && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                  {metadata.reviewStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Official: <strong className="text-white">{displayOwnerName}</strong> ({userEmail})
              {displayJobTitle ? <> · <span className="text-emerald-400 font-semibold">{displayJobTitle}</span></> : null}
              {displayDepartment ? <> · <span className="text-slate-300">{displayDepartment}</span></> : null}
              {displayManager ? <> · Line Manager: <strong className="text-sky-300">{displayManager}</strong></> : null}
            </p>
          </div>
        </div>

        {/* Quarter Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canSwitchProfile && directoryUsers.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={userEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none max-w-[230px]"
                title="Switch Official Profile"
              >
                <option value={currentUser.email} className="bg-slate-900 text-white">
                  {currentUser.fullName || currentUser.email} (My Profile)
                </option>
                {directoryUsers
                  .filter((u) => u.email && u.email.toLowerCase() !== (currentUser.email || '').toLowerCase())
                  .sort((a, b) => String(a.fullName || a.email).localeCompare(String(b.fullName || b.email)))
                  .map((u) => (
                    <option key={u.email} value={u.email} className="bg-slate-900 text-white">
                      {u.fullName || u.name || u.email} ({u.email})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {(['q1', 'q2', 'midterm', 'q3', 'q4', 'annual'] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition uppercase cursor-pointer ${
                  selectedQuarter === q ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadEvaluationData()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => persistEvaluationItems(items)}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Save Actuals & POEs</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitAllReported}
                disabled={isSaving || summaryStats.reportedCount === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Reported ({summaryStats.reportedCount})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Profile KPIs</p>
            <p className="text-xl font-black text-white mt-0.5">{summaryStats.totalKpis}</p>
            <p className="text-[10px] text-slate-500">{summaryStats.reportableCount} Reportable in {selectedQuarter.toUpperCase()}</p>
          </div>
          <FileCheck className="w-7 h-7 text-slate-700" />
        </div>

        <div className="bg-slate-950 border border-emerald-900/50 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Reported Actuals ({selectedQuarter.toUpperCase()})
            </p>
            <p className="text-xl font-black text-emerald-300 mt-0.5">{summaryStats.reportedCount}</p>
            <p className="text-[10px] text-slate-400">
              {summaryStats.submittedOrApprovedCount} Submitted / Actioned
            </p>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-500/40" />
        </div>

        <div className="bg-slate-950 border border-sky-900/50 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              Uploaded POE Files ({selectedQuarter.toUpperCase()})
            </p>
            <p className="text-xl font-black text-sky-300 mt-0.5">{summaryStats.totalPoeDocs}</p>
            <p className="text-[10px] text-slate-400">Verified in Supabase Vault</p>
          </div>
          <Paperclip className="w-7 h-7 text-sky-500/40" />
        </div>

        <div className="bg-slate-950 border border-amber-900/50 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Avg Self-Score ({selectedQuarter.toUpperCase()})
            </p>
            <p className="text-xl font-black text-amber-300 mt-0.5">{summaryStats.avgScore}</p>
            <p className="text-[10px] text-slate-400">Scale 1 (Low) – 5 (Outstanding)</p>
          </div>
          <Award className="w-7 h-7 text-amber-500/40" />
        </div>
      </div>

      {saveStatus && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs font-semibold ${
            saveStatus.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : saveStatus.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
              : 'bg-slate-950 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-[10px] text-slate-400 hover:text-white uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Evaluation Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[240px] max-w-md flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search KPIs, Ref No, Actuals, or POE filenames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 pl-9 pr-3 py-1.5 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {([
                { id: 'all', label: `All (${items.length})` },
                { id: 'reported', label: `Reported & POE (${summaryStats.reportedCount})` },
                { id: 'submitted', label: `Submitted (${summaryStats.submittedOrApprovedCount})` },
                { id: 'pending', label: `Pending (${Math.max(0, summaryStats.reportableCount - summaryStats.reportedCount)})` }
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            Showing {filteredItems.length} of {items.length} KPIs
          </span>
        </div>

        <div className="overflow-x-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">
                Retrieving profile actuals, scores, and POE documents from Supabase...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-semibold text-xs">
              No performance indicators match the current filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3 w-16 text-center">Ref</th>
                  <th className="p-3 min-w-[230px]">Key Performance Indicator & KPA</th>
                  <th className="p-3 w-14 text-center">Wt%</th>
                  <th className="p-3 w-28 text-slate-300">Target ({selectedQuarter.toUpperCase()})</th>
                  <th className="p-3 w-44 text-emerald-300">Reported Actual ({selectedQuarter.toUpperCase()})</th>
                  <th className="p-3 w-20 text-center text-amber-300">Self Score</th>
                  <th className="p-3 w-24 text-center text-amber-300">Variance</th>
                  <th className="p-3 w-44">Variance / Corrective Comment</th>
                  <th className="p-3 min-w-[270px] text-sky-300">Uploaded POE Evidence ({selectedQuarter.toUpperCase()})</th>
                  <th className="p-3 w-36 text-center">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium text-slate-200 align-top">
                {filteredItems.map((item, idx) => {
                  const itemKey = item.id || item.kpiNo || `kpi_${idx}`;
                  const naQuarter = isTargetNA(item);
                  const targetVal = item[qKeys.targetKey] || item[selectedQuarter] || '';
                  const actualVal = item[qKeys.actualKey] || '';
                  const scoreVal = item[qKeys.scoreKey] || item.myScore || '';
                  const mgrScoreVal = item[qKeys.managerScoreKey] || item.managerScore || '';
                  const commentVal = item[qKeys.commentKey] || '';
                  const correctiveVal = item[qKeys.correctiveKey] || '';
                  const requiredPoeDesc = item[qKeys.poeKey] || item.poe || item.annualRequiredPoe || '';
                  const poeDocs: PoeDocument[] = Array.isArray(item[qKeys.poeDocsKey]) ? item[qKeys.poeDocsKey] : [];
                  const variance = calculateVariance(targetVal, actualVal);
                  const reviewStatus = item.reviewStatus || (hasItemReportedInQuarter(item) ? 'Draft' : 'Not Started');
                  const poeStatus = item[qKeys.poeStatusKey] || '';
                  const isSubmittedOrLocked =
                    !item.resubmissionUnlocked &&
                    (reviewStatus === 'Submitted for Approval' ||
                      reviewStatus === 'Submitted for Review' ||
                      reviewStatus === 'Approved' ||
                      reviewStatus === 'Dispatched to Audit');

                  return (
                    <tr
                      key={itemKey}
                      className={`transition ${
                        hasItemReportedInQuarter(item)
                          ? 'bg-emerald-950/10 hover:bg-emerald-950/20'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="p-3 text-center font-mono text-emerald-400 font-bold text-[11px]">
                        {item.kpiNo || item.refNum || `K_${idx + 1}`}
                      </td>

                      <td className="p-3 space-y-1">
                        {(item.kpa || item.strategicGoal || item.functionalKpa) && (
                          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-400/90">
                            {item.kpa || item.strategicGoal || item.functionalKpa}
                          </div>
                        )}
                        <div className="text-slate-100 font-medium leading-relaxed">
                          {item.kpiDescription || item.kpi || item.description}
                        </div>
                        {requiredPoeDesc && (
                          <div className="text-[10px] text-slate-400 italic">
                            Required POE: <span className="text-slate-300 not-italic">{requiredPoeDesc}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center font-bold text-slate-300">
                        {item.weighting || item.wt || item.weight || 1}%
                      </td>

                      <td className="p-3 font-semibold text-slate-300">
                        {naQuarter ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                            <Lock className="w-3 h-3" /> N/A
                          </span>
                        ) : (
                          targetVal || 'N/A'
                        )}
                      </td>

                      <td className="p-3">
                        {naQuarter ? (
                          <span className="text-[11px] text-slate-500 italic">Not applicable in {selectedQuarter.toUpperCase()}</span>
                        ) : (
                          <textarea
                            rows={2}
                            value={actualVal}
                            disabled={readOnly}
                            onChange={(e) =>
                              updateKpiField(itemKey, { [qKeys.actualKey]: e.target.value })
                            }
                            placeholder="Enter reported actual..."
                            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-bold focus:outline-none resize-y"
                          />
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {naQuarter ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <select
                              value={String(scoreVal || '')}
                              disabled={readOnly}
                              onChange={(e) =>
                                updateKpiField(itemKey, {
                                  [qKeys.scoreKey]: e.target.value,
                                  myScore: e.target.value
                                })
                              }
                              className="bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1 text-xs font-black text-amber-300 focus:outline-none"
                            >
                              <option value="">—</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                            {mgrScoreVal && (
                              <span className="text-[10px] text-sky-400 font-bold" title="Manager Evaluation Score">
                                Mgr: {mgrScoreVal}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center font-bold">
                        {naQuarter ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] inline-block ${
                              variance === '0'
                                ? 'bg-slate-800 text-slate-300'
                                : variance.startsWith('+')
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {variance}
                          </span>
                        )}
                      </td>

                      <td className="p-3 space-y-1.5">
                        {naQuarter ? (
                          <span className="text-slate-600 text-[11px]">—</span>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={commentVal}
                              disabled={readOnly}
                              onChange={(e) =>
                                updateKpiField(itemKey, { [qKeys.commentKey]: e.target.value })
                              }
                              placeholder="Employee comment..."
                              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={correctiveVal}
                              disabled={readOnly}
                              onChange={(e) =>
                                updateKpiField(itemKey, { [qKeys.correctiveKey]: e.target.value })
                              }
                              placeholder="Corrective action..."
                              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                            />
                          </>
                        )}
                      </td>

                      <td className="p-3">
                        {naQuarter ? (
                          <span className="text-[11px] text-slate-600 italic">Locked (N/A)</span>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-400">
                                {poeDocs.length} File{poeDocs.length === 1 ? '' : 's'} Attached
                              </span>
                              {!readOnly && (
                                <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition">
                                  {uploadingKpiId === itemKey ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3" />
                                  )}
                                  <span>Upload POE</span>
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      handleUploadPoeFiles(item, e.target.files);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            {poeDocs.length > 0 ? (
                              <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                                {poeDocs.map((doc, dIdx) => {
                                  const href = doc.dataUrl || doc.url || '';
                                  return (
                                    <div
                                      key={doc.id || `${doc.name}_${dIdx}`}
                                      className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-[11px]"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDoc({ doc, list: poeDocs })}
                                        className="flex items-center gap-1.5 min-w-0 flex-1 text-left text-slate-200 hover:text-sky-300 transition cursor-pointer"
                                        title={`Preview ${doc.name}`}
                                      >
                                        {getFileIcon(doc)}
                                        <span className="truncate font-semibold">{doc.name}</span>
                                      </button>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setPreviewDoc({ doc, list: poeDocs })}
                                          className="p-1 rounded hover:bg-slate-800 text-sky-400 hover:text-sky-300 cursor-pointer"
                                          title="Preview Document"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {href && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              downloadOriginalFile(doc.name, href, { mimeType: doc.mimeType })
                                            }
                                            className="p-1 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                            title="Download Original File"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        {!readOnly && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemovePoeFile(item, doc.id || doc.name)}
                                            className="p-1 rounded hover:bg-slate-800 text-rose-400 hover:text-rose-300 cursor-pointer"
                                            title="Remove POE Document"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 italic py-1">
                                No POE document uploaded for {selectedQuarter.toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center space-y-1.5">
                        {naQuarter ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px] font-bold">
                            N/A
                          </span>
                        ) : (
                          <>
                            <div
                              className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                                reviewStatus === 'Approved'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : reviewStatus === 'Revision Required' || reviewStatus === 'Rejected'
                                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                                  : reviewStatus.includes('Submitted')
                                  ? 'bg-sky-950 text-sky-300 border-sky-800'
                                  : hasItemReportedInQuarter(item)
                                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              {reviewStatus}
                            </div>
                            {poeStatus && (
                              <div className="text-[9px] text-slate-400 font-semibold">
                                POE: {poeStatus}
                              </div>
                            )}
                            {!readOnly && (
                              <div className="flex flex-col gap-1 pt-1">
                                {!isSubmittedOrLocked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSubmitSingleKpi(item)}
                                    className="w-full px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                                  >
                                    <Send className="w-2.5 h-2.5" /> Submit KPI
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUnlockSingleKpi(item)}
                                    className="w-full px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" /> Redo / Edit
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {previewDoc && (
        <OfficeDocumentViewer
          doc={previewDoc.doc as any}
          docList={previewDoc.list as any}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

export default EvaluationIPMS;
