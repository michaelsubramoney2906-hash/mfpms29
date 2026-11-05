import React, { useState, useEffect } from 'react';
import { 
  Activity, Trash2, Plus, Info, CheckCircle2, Database, HelpCircle, Save, Sparkles, 
  FileText, ClipboardList, TrendingUp, Upload, X, File, FileSpreadsheet, Image, Paperclip, Search, Presentation,
  Eye, Download, AlertCircle, Flag, Lock
} from 'lucide-react';
import type { User } from '../../types';
import { OfficeDocumentViewer } from './OfficeDocumentViewer';
import { downloadOriginalFile, viewOriginalFile } from '../../utils/documentBinaryHelper';

export const isCellNA = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toUpperCase();
  return s === 'N/A' || s === 'NA' || s === 'N / A' || s === 'NOT APPLICABLE' || s.startsWith('N/A') || s.startsWith('NOT APPLICABLE') || s.includes('LOCKED (NOT REPORTABLE)');
};

export interface PoeDocument {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  dataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface KPIIPMSProps {
  currentUser: User;
  activeTenantId: string;
}

export interface KpiItem {
  id: string;
  kpiNo: string;
  kpi: string; // Description
  baseline: string;
  baselineYear: string;
  annualTarget: string;
  annualRequiredPoe?: string;
  budget?: string;
  q1Target: string;
  q1Actual?: string;
  q2Target: string;
  q2Actual?: string;
  midtermTarget?: string;
  midtermActual?: string;
  midtermComment?: string;
  midtermRequiredPoe?: string;
  q3Target: string;
  q3Actual?: string;
  q4Target: string;
  q4Actual?: string;
  q1Poe: string;
  q2Poe: string;
  q3Poe: string;
  q4Poe: string;
  midtermPoe?: string;
  annualPoe?: string;
  q1RequiredPoe?: string;
  q2RequiredPoe?: string;
  q3RequiredPoe?: string;
  q4RequiredPoe?: string;
  q1PoeDocs?: PoeDocument[];
  q2PoeDocs?: PoeDocument[];
  q3PoeDocs?: PoeDocument[];
  q4PoeDocs?: PoeDocument[];
  midtermPoeDocs?: PoeDocument[];
  annualPoeDocs?: PoeDocument[];
  weighting: string;
  myScore: string;
  createdAt: string;
  kpa?: string;
  q1Comment?: string;
  q2Comment?: string;
  q3Comment?: string;
  q4Comment?: string;
  q1PoeComment?: string;
  q2PoeComment?: string;
  q3PoeComment?: string;
  q4PoeComment?: string;
  evaluationComment?: string;
  reviewComment?: string;
  reviewApprovalStatus?: string;
}

interface QuarterPoeSelectorProps {
  label: string;
  placeholderRef: string;
  quarterName: string; // "Q1", "Q2", "Q3", "Q4"
  textValue: string;
  setTextValue: (v: string) => void;
  files: PoeDocument[];
  setFiles: (files: PoeDocument[]) => void;
  currentUser: User;
}

export function QuarterPoeSelector({
  label,
  placeholderRef,
  quarterName,
  textValue,
  setTextValue,
  files,
  setFiles,
  currentUser
}: QuarterPoeSelectorProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);

  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB limit per file / per upload

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesSelected = async (fileListParam: FileList | File[] | null) => {
    if (!fileListParam) return;

    const fileList = Array.from(fileListParam);
    if (fileList.length === 0) return;

    if (fileList.length > 100) {
      alert(`File Upload Limits Notice:\n\n• You can upload at most 100 files at a time. Please select fewer files.`);
      return;
    }

    if (files.length + fileList.length > 100) {
      alert(`File Upload Limits Notice:\n\n• You can have a maximum of 100 PoE files per KPI.`);
      return;
    }

    const currentTotalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    let runningTotalSize = currentTotalSize;

    const errors: string[] = [];

    const promises = fileList.map((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 200MB maximum file size limit.`);
        return Promise.resolve(null);
      }

      if (runningTotalSize + file.size > MAX_FILE_SIZE) {
        errors.push(`Adding "${file.name}" would cause total PoE files for this KPI section to exceed 200MB.`);
        return Promise.resolve(null);
      }

      runningTotalSize += file.size;

      return new Promise<PoeDocument | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `poe_doc_${quarterName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl: reader.result as string,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser?.email || 'System'
          });
        };
        reader.onerror = () => {
          errors.push(`Failed to read "${file.name}".`);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(promises);
    const newDocs = results.filter((doc): doc is PoeDocument => doc !== null);

    if (errors.length > 0) {
      alert(`File Upload Limits Notice:\n\n` + errors.map(e => `• ${e}`).join('\n'));
    }

    if (newDocs.length > 0) {
      setFiles([...files, ...newDocs]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const getFileIcon = (mimeType: string, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['ppt', 'pptx', 'pps', 'key', 'odp'].includes(ext) || mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Presentation className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
    }
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    }
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || mimeType.includes('word') || mimeType.includes('wordprocessingml')) {
      return <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    }
    if (['pdf'].includes(ext) || mimeType.includes('pdf')) {
      return <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  };

  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-slate-900">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 matches-label mb-0">
          <span className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-black text-[9px] shrink-0">
            {quarterName}
          </span>
          <span className="truncate">{label}</span>
        </label>
        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
          {files.length} attached {totalBytes > 0 ? `(${formatFileSize(totalBytes)})` : ''}
        </span>
      </div>

      {/* Description text input */}
      <input
        type="text"
        placeholder={placeholderRef}
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        required
        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-lg text-xs font-semibold text-slate-900 shadow-inner outline-none transition"
      />

      {/* Drag & Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border border-dashed p-2.5 rounded-lg text-center cursor-pointer transition ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-slate-300 bg-slate-50/30 hover:bg-slate-50'
        }`}
      >
        <label className="cursor-pointer block m-0">
          <Upload className="w-4 h-4 mx-auto text-slate-400 mb-0.5" />
          <p className="text-[9px] font-bold text-slate-650 mb-0">
            Drag &amp; drop multiple files or <span className="text-emerald-700 underline">browse</span>
          </p>
          <p className="text-[7.5px] text-slate-500 mt-0.5 mb-0 leading-tight">
            All file formats supported (Word, Excel, PDF, PowerPoint, Images, Zip, Audio/Video, Emails, etc.) • 200MB limit per KPI
          </p>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files ? Array.from(e.target.files) : null;
              e.target.value = '';
              if (selected && selected.length > 0) {
                handleFilesSelected(selected);
              }
            }}
          />
        </label>
      </div>

      {/* Uploaded file items */}
      {files.length > 0 && (
        <div className="space-y-1 mt-1 max-h-[140px] overflow-y-auto pr-1">
          {files.map((file) => {
            const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-1.5 bg-slate-100/75 border border-slate-200 rounded-md hover:bg-slate-100 transition group text-[10px]"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {getFileIcon(file.mimeType, file.name)}
                  <span className="font-semibold text-slate-700 truncate block max-w-[150px]" title={file.name}>
                    {file.name}
                  </span>
                  <span className="font-mono text-[8px] font-bold text-slate-400">
                    ({ext}{file.size ? ` • ${formatFileSize(file.size)}` : ''})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setPreviewDoc(file); }}
                    className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-650 transition"
                    title="View Document"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  {file.dataUrl && (
                    <a
                      href={file.dataUrl}
                      download={file.name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-650 transition"
                      title="Download Document"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="p-1 hover:bg-rose-105 rounded text-slate-400 hover:text-red-650 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <OfficeDocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}


const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getIsDualLayerTeamLeader(email) {
  if (!email) return false;
  return DUAL_LAYER_USERS.includes(email.toLowerCase().trim());
}

export function KPIIPMS({ currentUser, activeTenantId }: KPIIPMSProps) {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
  const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;



  const manualCommitToDatabase = async (scope: 'individual' | 'team') => {
    const saveEmail = scope === 'team' ? currentUser.email + '_team' : currentUser.email;
    setSaving(true);
    try {
      // 1. Commit KPIs
      await fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(saveEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis })
      });
      // 2. Commit Performance Plan
      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(saveEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pplanData.items })
      });
      setNotification(`Successfully committed KPIs and Performance Plan to ${scope === 'team' ? 'Team' : 'Personal'} Database.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification('Failed to commit database.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Form states
  const [kpa, setKpa] = useState('');
  const [kpiNo, setKpiNo] = useState('');
  const [description, setDescription] = useState('');
  const [baseline, setBaseline] = useState('');
  const [baselineYear, setBaselineYear] = useState('2025/2026');
  const [annualTarget, setAnnualTarget] = useState('');
  const [q1Target, setQ1Target] = useState('');
  const [q1Actual, setQ1Actual] = useState('');
  const [q2Target, setQ2Target] = useState('');
  const [q2Actual, setQ2Actual] = useState('');
  const [midtermTarget, setMidtermTarget] = useState('');
  const [midtermActual, setMidtermActual] = useState('');
  const [midtermComment, setMidtermComment] = useState('');
  const [q3Target, setQ3Target] = useState('');
  const [q3Actual, setQ3Actual] = useState('');
  const [q4Target, setQ4Target] = useState('');
  const [q4Actual, setQ4Actual] = useState('');
  
  // Portfolios of evidence per quarter descriptions
  const [annualRequiredPoe, setAnnualRequiredPoe] = useState('');
  const [q1RequiredPoe, setQ1RequiredPoe] = useState('');
  const [q2RequiredPoe, setQ2RequiredPoe] = useState('');
  const [midtermRequiredPoe, setMidtermRequiredPoe] = useState('');
  const [q3RequiredPoe, setQ3RequiredPoe] = useState('');
  const [q4RequiredPoe, setQ4RequiredPoe] = useState('');

  const [q1Poe, setQ1Poe] = useState('');
  const [q2Poe, setQ2Poe] = useState('');
  const [q3Poe, setQ3Poe] = useState('');
  const [q4Poe, setQ4Poe] = useState('');

  // Portfolios of evidence per quarter documents
  const [q1Docs, setQ1Docs] = useState<PoeDocument[]>([]);
  const [q2Docs, setQ2Docs] = useState<PoeDocument[]>([]);
  const [q3Docs, setQ3Docs] = useState<PoeDocument[]>([]);
  const [q4Docs, setQ4Docs] = useState<PoeDocument[]>([]);
  
  const [q1Comment, setQ1Comment] = useState('');
  const [q2Comment, setQ2Comment] = useState('');
  const [q3Comment, setQ3Comment] = useState('');
  const [q4Comment, setQ4Comment] = useState('');

  const [weighting, setWeighting] = useState('');
  const [myScore, setMyScore] = useState('');
  const [budget, setBudget] = useState('');

  // Browse POE Modal state
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [browseModalKpiId, setBrowseModalKpiId] = useState('');
  const [browseModalQuarter, setBrowseModalQuarter] = useState<'Q1'|'Q2'|'Q3'|'Q4'>('Q1');
  const [poeCommentInput, setPoeCommentInput] = useState('');
  const [browseModalPoeDocs, setBrowseModalPoeDocs] = useState<PoeDocument[]>([]);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const openBrowseModal = (kpiId: string, quarter: 'Q1'|'Q2'|'Q3'|'Q4') => {
    const k = kpis.find(item => item.id === kpiId);
    if (k) {
      setBrowseModalQuarter(quarter);
      setBrowseModalKpiId(kpiId);
      setPoeCommentInput((k as any)[`${quarter.toLowerCase()}PoeComment`] || '');
      setBrowseModalPoeDocs((k as any)[`${quarter.toLowerCase()}PoeDocs`] || []);
      setBrowseModalOpen(true);
    }
  };

  // Performance plan buffer to enable live sync
  const [pplanData, setPplanData] = useState<{ metadata: any; items: any[] }>({ metadata: {}, items: [] });
  const [showReviewOptionsKpiId, setShowReviewOptionsKpiId] = useState<string | null>(null);
  const [availableKpas, setAvailableKpas] = useState<any[]>([]);

  useEffect(() => {
    loadKpiAndPlanData();
    const handlePplanSync = () => {
      loadKpiAndPlanData();
    };
    window.addEventListener('pplan-updated', handlePplanSync);
    return () => window.removeEventListener('pplan-updated', handlePplanSync);
  }, [activeTenantId, targetEmail]);

  const loadKpiAndPlanData = async () => {
    setLoading(true);
    try {
      const kpaRes = await fetch(`/api/tenant/${activeTenantId}/kpas?t=${Date.now()}`);
      if (kpaRes.ok) {
        const kpaJson = await kpaRes.json();
        if (kpaJson && Array.isArray(kpaJson.kpas)) {
          setAvailableKpas(kpaJson.kpas);
        }
      }

      // 1. Fetch KPI register and Performance Plan in parallel
      const [kpiRes, planRes] = await Promise.all([
        fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`),
        fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`)
      ]);

      let loadedKpis: any[] = [];
      let loadedPlanData: { metadata: any; items: any[] } = { metadata: {}, items: [] };

      if (kpiRes.ok) {
        const data = await kpiRes.json();
        if (data && Array.isArray(data.kpis)) {
          loadedKpis = data.kpis;
        }
      }

      if (planRes.ok) {
        const data = await planRes.json();
        if (data && Array.isArray(data.items)) {
          loadedPlanData = data;
        } else {
          loadedPlanData = { metadata: data?.metadata || {}, items: [] };
        }
        setPplanData(loadedPlanData);
      }

      // Merge latest reviewStatus / reviewApprovalStatus / managerScore / reviewComment from pplan into kpis
      if (loadedPlanData.items.length > 0) {
        if (loadedKpis.length === 0) {
          loadedKpis = loadedPlanData.items;
        } else {
          loadedKpis = loadedKpis.map((k: any) => {
            const kId = String(k.id || '').toLowerCase().trim();
            const kNo = String(k.kpiNo || '').toLowerCase().trim();
            const matchedPlanItem = loadedPlanData.items.find((pIt: any) => {
              const pId = String(pIt.id || '').toLowerCase().trim();
              const pNo = String(pIt.kpiNo || '').toLowerCase().trim();
              return (kId && pId === kId) || (kNo && pNo === kNo);
            });
            if (matchedPlanItem) {
              const revStatus = matchedPlanItem.reviewStatus || k.reviewStatus;
              const revApproval = matchedPlanItem.reviewApprovalStatus || (revStatus === 'Approved' ? 'Approved' : (revStatus === 'Revision Required' || revStatus === 'Rejected' ? 'Rejected' : k.reviewApprovalStatus));
              return {
                ...k,
                ...(revStatus ? { reviewStatus: revStatus } : {}),
                ...(revApproval ? { reviewApprovalStatus: revApproval } : {}),
                ...(matchedPlanItem.managerScore ? { managerScore: matchedPlanItem.managerScore } : {}),
                ...(matchedPlanItem.reviewComment || matchedPlanItem.review ? { reviewComment: matchedPlanItem.reviewComment || matchedPlanItem.review } : {})
              };
            }
            return k;
          });
        }
      }

      setKpis(loadedKpis);
    } catch (err) {
      console.error("Failed to load KPI page data:", err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const downloadDoc = (doc: PoeDocument) => {
    if (!doc.dataUrl) return;
    downloadOriginalFile(doc.name, doc.dataUrl, { mimeType: doc.mimeType });
  };

  const updateKpiField = async (id: string, field: string, value: any) => {
    // 1. Update list of KPIs in memory
    const updatedKpis = kpis.map(k => {
      if (k.id === id) {
        const extra: any = {};
        if (field === 'reviewApprovalStatus') {
          extra.reviewStatus = value === 'Approved' ? 'Approved' : (value === 'Rejected' ? 'Revision Required' : (k as any).reviewStatus);
        }
        return { ...k, [field]: value, ...extra };
      }
      return k;
    });
    setKpis(updatedKpis);

    // Save to /kpis endpoint as well
    fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kpis: updatedKpis })
    }).catch(() => {});

    // 2. Synchronize to performance agreements / pplan only if pplanData has loaded
    const targetKpi = updatedKpis.find(k => k.id === id);
    if (targetKpi && !loading && Array.isArray(pplanData.items) && pplanData.items.length > 0) {
      const existingPlanItems = [...pplanData.items];
      let matchIndex = existingPlanItems.findIndex(item =>
        item.id && targetKpi.id && String(item.id).toLowerCase().trim() === String(targetKpi.id).toLowerCase().trim()
      );
      if (matchIndex < 0) {
        matchIndex = existingPlanItems.findIndex(item => {
          const itemDesc = String(item.kpi || item.kpiDescription || item.description || '').toLowerCase().trim();
          const targetDesc = String(targetKpi.description || (targetKpi as any).kpi || '').toLowerCase().trim();
          if (itemDesc && targetDesc && itemDesc.length > 8 && itemDesc === targetDesc) return true;
          const sameNo = item.kpiNo && targetKpi.kpiNo && String(item.kpiNo).toLowerCase().trim() === String(targetKpi.kpiNo).toLowerCase().trim();
          const sameKpa = !item.kpa || !targetKpi.kpa || String(item.kpa).toLowerCase().trim() === String(targetKpi.kpa).toLowerCase().trim();
          return Boolean(sameNo && sameKpa && (!itemDesc || !targetDesc || itemDesc === targetDesc));
        });
      }
      
      const selectedKpaObj = availableKpas.find(k => k.title === targetKpi.kpa);
      const fallbackStrategicGoal = selectedKpaObj?.parentObjective || targetKpi.kpa || '';

      const rawReviewStatus = (targetKpi as any).reviewStatus || (matchIndex >= 0 ? existingPlanItems[matchIndex].reviewStatus : 'Draft') || 'Draft';
      const isSubmittedOrResubmitting =
        rawReviewStatus === 'Submitted for Approval' ||
        rawReviewStatus === 'Submitted for Review' ||
        rawReviewStatus === 'Submitted' ||
        rawReviewStatus === 'Draft / Resubmitting';
      const resolvedApprovalStatus = isSubmittedOrResubmitting
        ? ''
        : (targetKpi.reviewApprovalStatus || (matchIndex >= 0 ? existingPlanItems[matchIndex].reviewApprovalStatus : 'Pending') || 'Pending');
      const resolvedReviewStatus = isSubmittedOrResubmitting
        ? rawReviewStatus
        : resolvedApprovalStatus === 'Approved'
          ? 'Approved'
          : resolvedApprovalStatus === 'Rejected'
            ? 'Revision Required'
            : rawReviewStatus;

      const existingRow = matchIndex >= 0 ? existingPlanItems[matchIndex] : ({} as any);
      const planRowData = {
        ...existingRow,
        id: matchIndex >= 0 ? existingRow.id : (targetKpi.id || `kpi-${Date.now()}`),
        strategicGoal: matchIndex >= 0 ? (existingRow.strategicGoal || fallbackStrategicGoal) : fallbackStrategicGoal,
        priorityIssue: matchIndex >= 0 ? (existingRow.priorityIssue || '') : '',
        kpiNo: targetKpi.kpiNo || existingRow.kpiNo,
        kpi: targetKpi.kpi || existingRow.kpi,
        baseline: targetKpi.baseline ?? existingRow.baseline,
        baselineYear: targetKpi.baselineYear ?? existingRow.baselineYear,
        annualTarget: targetKpi.annualTarget ?? existingRow.annualTarget,
        q1Target: targetKpi.q1Target ?? existingRow.q1Target,
        q2Target: targetKpi.q2Target ?? existingRow.q2Target,
        q3Target: targetKpi.q3Target ?? existingRow.q3Target,
        q4Target: targetKpi.q4Target ?? existingRow.q4Target,
        q1Actual: targetKpi.q1Actual ?? existingRow.q1Actual ?? '',
        q2Actual: targetKpi.q2Actual ?? existingRow.q2Actual ?? '',
        q3Actual: targetKpi.q3Actual ?? existingRow.q3Actual ?? '',
        q4Actual: targetKpi.q4Actual ?? existingRow.q4Actual ?? '',
        q1Status: targetKpi.q1Status ?? existingRow.q1Status ?? '',
        q2Status: targetKpi.q2Status ?? existingRow.q2Status ?? '',
        q3Status: targetKpi.q3Status ?? existingRow.q3Status ?? '',
        q4Status: targetKpi.q4Status ?? existingRow.q4Status ?? '',
        q1Comment: targetKpi.q1Comment ?? existingRow.q1Comment ?? '',
        q2Comment: targetKpi.q2Comment ?? existingRow.q2Comment ?? '',
        q3Comment: targetKpi.q3Comment ?? existingRow.q3Comment ?? '',
        q4Comment: targetKpi.q4Comment ?? existingRow.q4Comment ?? '',
        q1Poe: targetKpi.q1Poe ?? existingRow.q1Poe,
        q2Poe: targetKpi.q2Poe ?? existingRow.q2Poe,
        q3Poe: targetKpi.q3Poe ?? existingRow.q3Poe,
        q4Poe: targetKpi.q4Poe ?? existingRow.q4Poe,
        q1PoeDocs: Array.isArray(targetKpi.q1PoeDocs) ? targetKpi.q1PoeDocs : (existingRow.q1PoeDocs || []),
        q2PoeDocs: Array.isArray(targetKpi.q2PoeDocs) ? targetKpi.q2PoeDocs : (existingRow.q2PoeDocs || []),
        q3PoeDocs: Array.isArray(targetKpi.q3PoeDocs) ? targetKpi.q3PoeDocs : (existingRow.q3PoeDocs || []),
        q4PoeDocs: Array.isArray(targetKpi.q4PoeDocs) ? targetKpi.q4PoeDocs : (existingRow.q4PoeDocs || []),
        annualPoeDocs: Array.isArray((targetKpi as any).annualPoeDocs) ? (targetKpi as any).annualPoeDocs : (existingRow.annualPoeDocs || []),
        midtermPoeDocs: Array.isArray((targetKpi as any).midtermPoeDocs) ? (targetKpi as any).midtermPoeDocs : (existingRow.midtermPoeDocs || []),
        poeFileBase64: undefined,
        poeFileName: (targetKpi as any).poeFileName ?? existingRow.poeFileName ?? '',
        evaluationComment: targetKpi.q1Comment || targetKpi.q2Comment || targetKpi.q3Comment || targetKpi.q4Comment || existingRow.evaluationComment || '',
        reviewComment: targetKpi.reviewComment || existingRow.reviewComment || '',
        reviewApprovalStatus: resolvedApprovalStatus,
        reviewStatus: resolvedReviewStatus,
        evaluationUsername: targetEmail,
        reviewManagerName: currentUser.manager || 'Line Manager',
        poe: existingRow.poe || `Q1: ${targetKpi.q1Poe}\nQ2: ${targetKpi.q2Poe}\nQ3: ${targetKpi.q3Poe}\nQ4: ${targetKpi.q4Poe}`,
        weighting: targetKpi.weighting ?? existingRow.weighting,
        kpa: targetKpi.kpa || (matchIndex >= 0 ? existingRow.kpa : ''),
        bsd: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Basic Service Delivery' : (matchIndex >= 0 ? !!existingRow.bsd : true),
        led: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Local Economic Development' : (matchIndex >= 0 ? !!existingRow.led : false),
        mfvm: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Municipal Financial viability and management' : (matchIndex >= 0 ? !!existingRow.mfvm : false),
        ggpp: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Good Governance and public participation' : (matchIndex >= 0 ? !!existingRow.ggpp : false),
        midt: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Municipal Institutional Development and Transformation' : (matchIndex >= 0 ? !!existingRow.midt : false),
        sr: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Spatial Rationale' : (matchIndex >= 0 ? !!existingRow.sr : false),
      };

      if (matchIndex >= 0) {
        existingPlanItems[matchIndex] = { ...existingPlanItems[matchIndex], ...planRowData };
      } else {
        existingPlanItems.push(planRowData);
      }

      const updatedPlanData = {
        ...pplanData,
        metadata: {
          ...(pplanData.metadata || {}),
          _isFredExtracted: true,
          _authoritativePoeUpdate: true
        },
        items: existingPlanItems
      };
      setPplanData(updatedPlanData);

      // Save updated Plan array
      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlanData)
      });
      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: targetEmail } }));
    }

    // 3. Save to database
    try {
      await fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis: updatedKpis })
      });
    } catch (err) {
      console.error("Failed to sync KPI in real-time:", err);
    }
  };

  const generateQuarterlyReport = (kpi: any, quarter: string) => {
    const qName = quarter === 'Annual' ? 'Annual Performance Goal' : `${quarter} Performance Review`;
    const targetVal = quarter === 'Annual' ? kpi.annualTarget : kpi[`${quarter.toLowerCase()}Target` as keyof KpiItem];
    const commentVal = quarter === 'Annual' ? '' : kpi[`${quarter.toLowerCase()}Comment` as keyof KpiItem];
    const poeVal = quarter === 'Annual' ? '' : kpi[`${quarter.toLowerCase()}Poe` as keyof KpiItem];

    const htmlContent = `
      <html>
        <head>
          <title>${qName} - ${currentUser.fullName || targetEmail}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: white; line-height: 1.6; }
            .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 5px; font-weight: 600; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .meta-table td { padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
            .meta-table td.label { font-weight: bold; background-color: #f8fafc; color: #475569; width: 25%; }
            .content-header { background-color: #0f172a; color: white; padding: 10px 15px; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 25px; border-radius: 6px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; margin-top: 15px; }
            .field-title { font-weight: 800; font-size: 11px; text-transform: uppercase; color: #10b981; margin-bottom: 5px; }
            .field-value { font-size: 14px; color: #0f172a; margin-bottom: 15px; font-weight: 500; }
            .footer { margin-top: 50px; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Official SDBIP & IPMS Review Statement</div>
            <div class="subtitle">MUNICIPAL PERFORMANCE MONITORING SYSTEM (COUNCIL ACT 79)</div>
          </div>

          <table class="meta-table">
            <tr>
              <td class="label">Azure AD Username</td>
              <td>${targetEmail}</td>
              <td class="label">Employee Name</td>
              <td>${currentUser.fullName || 'Municipal Professional'}</td>
            </tr>
            <tr>
              <td class="label">Responsible Division</td>
              <td>${currentUser.department || 'Corporate Services'}</td>
              <td class="label">Review Quarter</td>
              <td><strong>${qName}</strong></td>
            </tr>
            <tr>
              <td class="label">Appointed Line Manager</td>
              <td>${currentUser.manager || 'Executive Director / Panel head'}</td>
              <td class="label">Report Timestamp</td>
              <td>${new Date().toLocaleString()}</td>
            </tr>
          </table>

          <div class="content-header">Captured Performance Target Details</div>
          <div class="card">
            <div class="field-title">KPI Reference Code</div>
            <div class="field-value" style="font-family: monospace; font-weight: bold; font-size: 16px;">${kpi.kpiNo}</div>
            
            <div class="field-title">KPI Definition</div>
            <div class="field-value">${kpi.kpi}</div>

            <div class="field-title">Quarter Target Goal</div>
            <div class="field-value">${targetVal || 'N/A'}</div>

            <div class="field-title">Quarterly Comments/Targets</div>
            <div class="field-value">${commentVal || 'N/A'}</div>

            <div class="field-title">Portfolio of Evidence Description</div>
            <div class="field-value">${poeVal || 'No files attached'}</div>
          </div>

          <div class="content-header">Professional Evaluations & Signoffs</div>
          <div class="card">
            <div class="field-title">Employee Self-Evaluation Statement</div>
            <div class="field-value" style="font-style: italic;">${kpi.evaluationComment || 'No self-evaluation remark documented.'}</div>

            <div class="field-title">Manager Approval Statement</div>
            <div class="field-value" style="font-style: italic;">${kpi.reviewComment || 'Waiting for Manager comment.'}</div>

            <div class="field-title">Evaluation Approval Status</div>
            <div class="field-value" style="font-weight: bold; color: ${kpi.reviewApprovalStatus === 'Approved' ? '#10b981' : kpi.reviewApprovalStatus === 'Rejected' ? '#ef4444' : '#f59e0b'};">
              ${(kpi.reviewApprovalStatus || 'PENDING REVIEW').toUpperCase()}
            </div>
          </div>

          <div class="footer">
            Nkangala Strategic SDBIP IPMS Tracker • Confidential Internal Audit Statement • Generated by Azure AD User ${targetEmail}
          </div>
        </body>
      </html>
    `;

    // Create document download trigger
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = `${kpi.kpiNo}_${quarter}_Performance_Review_Report.doc`;
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiNo.trim() || !description.trim() || !annualTarget.trim()) {
      alert("Please fill in at least the KPI No, KPI Description, and Annual Target.");
      return;
    }

    const q1Ready = q1RequiredPoe.trim().length > 0;
    const q2Ready = q2RequiredPoe.trim().length > 0;
    const q3Ready = q3RequiredPoe.trim().length > 0;
    const q4Ready = q4RequiredPoe.trim().length > 0;

    if (!q1Ready || !q2Ready || !q3Ready || !q4Ready) {
      alert("Missing portfolio of evidence! Every KPI that's captured must have a portfolio of evidence descriptive text accompanying it per quarter.");
      return;
    }

    setSaving(true);

    const existingPlanItems = [...pplanData.items];
    const matchIndex = existingPlanItems.findIndex(item => item.kpiNo && item.kpiNo.toLowerCase().trim() === kpiNo.toLowerCase().trim());
    const inheritedScore = matchIndex >= 0 ? (existingPlanItems[matchIndex].myScore || '') : '';

    const newKpi: KpiItem = {
      id: `kpi-metric-${Date.now()}`,
      kpiNo: kpiNo.trim(),
      kpi: description.trim(),
      baseline: baseline.trim(),
      baselineYear,
      annualTarget: annualTarget.trim(),
      annualRequiredPoe: annualRequiredPoe.trim(),
      budget: budget.trim(),
      q1Target: q1Target.trim(),
      q1Actual: q1Actual.trim(),
      q2Target: q2Target.trim(),
      q2Actual: q2Actual.trim(),
      midtermTarget: midtermTarget.trim(),
      midtermActual: midtermActual.trim(),
      midtermComment: midtermComment.trim(),
      midtermRequiredPoe: midtermRequiredPoe.trim(),
      q3Target: q3Target.trim(),
      q3Actual: q3Actual.trim(),
      q4Target: q4Target.trim(),
      q4Actual: q4Actual.trim(),
      q1RequiredPoe: q1RequiredPoe.trim(),
      q2RequiredPoe: q2RequiredPoe.trim(),
      q3RequiredPoe: q3RequiredPoe.trim(),
      q4RequiredPoe: q4RequiredPoe.trim(),
      q1Poe: q1Poe.trim() || (q1Docs.length > 0 ? `${q1Docs.length} file(s) uploaded` : ''),
      q2Poe: q2Poe.trim() || (q2Docs.length > 0 ? `${q2Docs.length} file(s) uploaded` : ''),
      q3Poe: q3Poe.trim() || (q3Docs.length > 0 ? `${q3Docs.length} file(s) uploaded` : ''),
      q4Poe: q4Poe.trim() || (q4Docs.length > 0 ? `${q4Docs.length} file(s) uploaded` : ''),
      midtermPoe: '',
      annualPoe: '',
      q1PoeDocs: q1Docs,
      q2PoeDocs: q2Docs,
      q3PoeDocs: q3Docs,
      q4PoeDocs: q4Docs,
      midtermPoeDocs: [],
      annualPoeDocs: [],
      q1Comment: q1Comment.trim(),
      q2Comment: q2Comment.trim(),
      q3Comment: q3Comment.trim(),
      q4Comment: q4Comment.trim(),
      q1PoeComment: '',
      q2PoeComment: '',
      q3PoeComment: '',
      q4PoeComment: '',
      weighting: weighting.trim(),
      myScore: inheritedScore,
      kpa: kpa,
      createdAt: new Date().toISOString()
    };

    // 1. Add to local KPI array
    const updatedKpis = [newKpi, ...kpis];
    setKpis(updatedKpis);
    
    // Find KPA details if valid KPA is selected
    const selectedKpaObj = availableKpas.find(k => k.title === kpa);
    const fallbackStrategicGoal = selectedKpaObj?.parentObjective || "Aspirant Local Municipal Aligned Performance objective";

    const planRowData = {
      id: matchIndex >= 0 ? existingPlanItems[matchIndex].id : `kpi-${Date.now()}`,
      strategicGoal: matchIndex >= 0 ? existingPlanItems[matchIndex].strategicGoal : fallbackStrategicGoal,
      priorityIssue: matchIndex >= 0 ? existingPlanItems[matchIndex].priorityIssue : "Local Statutory Priority Target",
      kpiNo: kpiNo.trim(),
      kpi: description.trim(),
      baseline: baseline.trim(),
      budget: budget.trim(),
      baselineYear,
      annualTarget: annualTarget.trim(),
      annualRequiredPoe: annualRequiredPoe.trim(),
      q1Target: q1Target.trim(),
      q1Actual: q1Actual.trim(),
      q2Target: q2Target.trim(),
      q2Actual: q2Actual.trim(),
      midtermTarget: midtermTarget.trim(),
      midtermActual: midtermActual.trim(),
      midtermComment: midtermComment.trim(),
      midtermRequiredPoe: midtermRequiredPoe.trim(),
      q3Target: q3Target.trim(),
      q3Actual: q3Actual.trim(),
      q4Target: q4Target.trim(),
      q4Actual: q4Actual.trim(),
      q1RequiredPoe: q1RequiredPoe.trim(),
      q2RequiredPoe: q2RequiredPoe.trim(),
      q3RequiredPoe: q3RequiredPoe.trim(),
      q4RequiredPoe: q4RequiredPoe.trim(),
      q1Poe: newKpi.q1Poe,
      q2Poe: newKpi.q2Poe,
      q3Poe: newKpi.q3Poe,
      q4Poe: newKpi.q4Poe,
      q1PoeDocs: q1Docs,
      q2PoeDocs: q2Docs,
      q3PoeDocs: q3Docs,
      q4PoeDocs: q4Docs,
      // Combined POE with newlines
      poe: annualRequiredPoe.trim() || `Q1: ${newKpi.q1Poe}\nQ2: ${newKpi.q2Poe}\nQ3: ${newKpi.q3Poe}\nQ4: ${newKpi.q4Poe}`,
      weighting: weighting.trim(),
      myScore: inheritedScore,
      kpa: kpa || (matchIndex >= 0 ? existingPlanItems[matchIndex].kpa : ''),
      bsd: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Basic Service Delivery' : (matchIndex >= 0 ? !!existingPlanItems[matchIndex].bsd : true),
      led: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Local Economic Development' : (matchIndex >= 0 ? !!existingPlanItems[matchIndex].led : false),
      mfvm: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Municipal Financial viability and management' : (matchIndex >= 0 ? !!existingPlanItems[matchIndex].mfvm : false),
      ggpp: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Good Governance and public participation' : (matchIndex >= 0 ? !!existingPlanItems[matchIndex].ggpp : false),
      midt: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Municipal Institutional Development and Transformation' : (matchIndex >= 0 ? !!existingPlanItems[matchIndex].midt : false),
      sr: selectedKpaObj ? selectedKpaObj.nationalKpa === 'Spatial Rationale' : (matchIndex >= 0 ? !!existingPlanItems[matchIndex].sr : false),
      internalAuditRating: matchIndex >= 0 ? existingPlanItems[matchIndex].internalAuditRating || '' : '',
      internalAuditComment: matchIndex >= 0 ? existingPlanItems[matchIndex].internalAuditComment || '' : '',
      panelMembersScore: matchIndex >= 0 ? existingPlanItems[matchIndex].panelMembersScore || '' : '',
      panelMembersFinalComment: matchIndex >= 0 ? existingPlanItems[matchIndex].panelMembersFinalComment || '' : '',
    };

    if (matchIndex >= 0) {
      existingPlanItems[matchIndex] = planRowData;
    } else {
      existingPlanItems.push(planRowData);
    }

    const updatedPlanData = {
      ...pplanData,
      items: existingPlanItems
    };
    setPplanData(updatedPlanData);

    try {
      // Post updated KPIs to database
      await fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis: updatedKpis })
      });

      // Post updated Plan array to database
      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${targetEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlanData)
      });
      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: targetEmail } }));

      // Synchronize to 2nd & 3rd layer SDBIP
      try {
        const sdbipRes = await fetch(`/api/tenant/${activeTenantId}/sdbip23?t=${Date.now()}`);
        let sdbipData: any[] = [];
        if (sdbipRes.ok) {
          const db = await sdbipRes.json();
          if (db && Array.isArray(db.items)) sdbipData = db.items;
        }

        const sdbMatchIdx = sdbipData.findIndex((item: any) => item.refNum && item.refNum.toLowerCase().trim() === kpiNo.toLowerCase().trim() && item.evaluationUser === targetEmail);
        
        const sdbipRow = {
          id: sdbMatchIdx >= 0 ? sdbipData[sdbMatchIdx].id : `sdbip23_${Date.now()}_auto`,
          refNum: newKpi.kpiNo,
          strategicObj: sdbMatchIdx >= 0 ? sdbipData[sdbMatchIdx].strategicObj : fallbackStrategicGoal,
          bsd: planRowData.bsd ? 'Y' : 'N',
          led: planRowData.led ? 'Y' : 'N',
          mfvm: planRowData.mfvm ? 'Y' : 'N',
          ggpp: planRowData.ggpp ? 'Y' : 'N',
          midt: planRowData.midt ? 'Y' : 'N',
          sr: planRowData.sr ? 'Y' : 'N',
          kpas: planRowData.kpa,
          operationalActivity: sdbMatchIdx >= 0 ? sdbipData[sdbMatchIdx].operationalActivity : "Generated from Performance Plan",
          kpi: newKpi.kpi,
          compliance: 'compliant',
          uom: '',
          mscoaTracking: sdbMatchIdx >= 0 ? sdbipData[sdbMatchIdx].mscoaTracking : '',
          baseline: newKpi.baseline,
          annualTarget: newKpi.annualTarget,
          budgetAllocation: newKpi.budget || (sdbMatchIdx >= 0 ? sdbipData[sdbMatchIdx].budgetAllocation : ''),
          q1: newKpi.q1Target,
          q2: newKpi.q2Target,
          q3: newKpi.q3Target,
          q4: newKpi.q4Target,
          weight: newKpi.weighting,
          poe: planRowData.poe,
          q1PoeDocs: q1Docs,
          q2PoeDocs: q2Docs,
          q3PoeDocs: q3Docs,
          q4PoeDocs: q4Docs,
          responsibleUnit: currentUser.department || '',
          evaluationUser: targetEmail,
          reviewManager: currentUser.manager || 'Line Manager',
          poeStatus: 'Local Draft / IPMS Synchronized'
        };

        if (sdbMatchIdx >= 0) {
          sdbipData[sdbMatchIdx] = { ...sdbipData[sdbMatchIdx], ...sdbipRow };
        } else {
          sdbipData.push(sdbipRow);
        }

        await fetch(`/api/tenant/${activeTenantId}/sdbip23`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: sdbipData })
        });
      } catch(syncErr) {
        console.error("SDBIP23 Sync error:", syncErr);
      }

      showNotification(`KPI ${newKpi.kpiNo} committed successfully! Automatically synced into respective rows of your Performance Plan and 2nd/3rd Layer SDBIP.`);
      
      // Clear inputs
      setKpa('');
      setKpiNo('');
      setDescription('');
      setBaseline('');
      setAnnualTarget('');
      setBudget('');
      setQ1Target('');
      setQ1Actual('');
      setQ2Target('');
      setQ2Actual('');
      setMidtermTarget('');
      setMidtermActual('');
      setMidtermComment('');
      setQ3Target('');
      setQ3Actual('');
      setQ4Target('');
      setQ4Actual('');
      setAnnualRequiredPoe('');
      setQ1RequiredPoe('');
      setQ2RequiredPoe('');
      setMidtermRequiredPoe('');
      setQ3RequiredPoe('');
      setQ4RequiredPoe('');
      setQ1Comment('');
      setQ2Comment('');
      setQ3Comment('');
      setQ4Comment('');
      setQ1Docs([]);
      setQ2Docs([]);
      setQ3Docs([]);
      setQ4Docs([]);
      setWeighting('');
      setMyScore('');

    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKpiItem = async (id: string, codeStr: string) => {
    if (confirm(`Remove KPI target ${codeStr}?`)) {
      const remainingKpis = kpis.filter(k => k.id !== id);
      setKpis(remainingKpis);

      // Remove from plan too if matching
      const remainingPlanItems = pplanData.items.filter(item => (item.kpiNo || '').toLowerCase() !== codeStr.toLowerCase());
      const updatedPlanData = {
        ...pplanData,
        metadata: {
          ...(pplanData.metadata || {}),
          _allowItemDeletion: true,
          _replacePlan: true,
          _isCleared: remainingPlanItems.length === 0
        },
        items: remainingPlanItems
      };
      setPplanData(updatedPlanData);

      try {
        await fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(targetEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kpis: remainingKpis })
        });

        await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${targetEmail}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPlanData)
        });
        window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: activeTenantId, userId: targetEmail } }));

        showNotification(`KPI target ${codeStr} removed from list and Performance Plan.`);
      } catch (err) {
        console.error("Delete sync error:", err);
      }
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col gap-6 p-6 min-h-0 text-slate-100">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/45 p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-400" />
            IPMS KPI Captured Core
          </h2>
          <p className="text-gray-450 text-xs mt-1">
            Capture Municipal Key Performance Indicators (KPIs) with mandatory quarterly Portfolio of Evidence (POE). Syncs directly with Performance Plan boxes.
          </p>
        </div>
        

        <div className="flex items-center gap-2">
          {isDualLayerTeamLeader && (
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl shrink-0 mr-2 border border-white/10">
              <button
                onClick={() => setAgreementScope('individual')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  agreementScope === 'individual' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                My Personal Module
              </button>
              <button
                onClick={() => setAgreementScope('team')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  agreementScope === 'team' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Team Module
              </button>
            </div>
          )}
          {isDualLayerTeamLeader ? (

            <div className="flex gap-2">
              <button
                onClick={() => manualCommitToDatabase('individual')}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Commit Personal DB
              </button>
              <button
                onClick={() => manualCommitToDatabase('team')}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Commit Team DB
              </button>
            </div>
          ) : (
            <button
                onClick={() => manualCommitToDatabase('individual')}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Commit to Database
              </button>
          )}
          <div className="bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-500/10 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Sync Status: Actively Linked to Performance Plan</span>
          </div>
        </div>

      </div>

      {notification && (
        <div className="bg-emerald-950/85 border border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 text-emerald-300 text-xs shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form panel */}
        <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl border-2 border-slate-950 shadow-2xl p-6 flex flex-col gap-5">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold italic text-lg uppercase tracking-wider text-slate-950 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              Capture KPI Terminal
            </h3>
            <span className="font-mono text-[9px] bg-slate-100 px-2 py-1 text-slate-500 rounded border font-bold uppercase">
              Form 4-B FY: 1 Jul - 30 Jun
            </span>
          </div>

          <form onSubmit={handleCommit} className="space-y-4">
            
            {/* Row 1: KPI NO & Baseline Year & Weighting */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">KPI NO.</label>
                <input
                  type="text"
                  placeholder="e.g. KPI-1.1.2"
                  value={kpiNo}
                  onChange={(e) => setKpiNo(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl font-bold font-mono outline-none text-slate-900 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Baseline Year</label>
                <input
                  type="text"
                  placeholder="2025/2026"
                  value={baselineYear}
                  onChange={(e) => setBaselineYear(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl font-bold outline-none text-slate-900 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Weight %</label>
                <input
                  type="number"
                  placeholder="20"
                  value={weighting}
                  onChange={(e) => setWeighting(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl font-bold outline-none text-slate-900 transition"
                />
              </div>
            </div>

            {/* Functional Area KPA Selector */}
            <div className="flex flex-col gap-1 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
              <div className="flex justify-between items-center">
                <label className="text-[9.5px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Functional Area KPA</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className="text-[9px] font-bold font-mono text-emerald-700 uppercase">
                  Municipal Functional KPA
                </span>
              </div>

              <select
                value={availableKpas.some(k => k.title === kpa) ? kpa : (kpa ? "__CUSTOM__" : "")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== "__CUSTOM__") {
                    setKpa(val);
                  } else {
                    setKpa("");
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-emerald-300 focus:border-emerald-700 rounded-lg font-bold text-xs text-slate-900 outline-none transition cursor-pointer"
              >
                <option value="">-- Select Functional Area KPA --</option>
                {availableKpas.map((k) => (
                  <option key={k.id || k.title} value={k.title}>
                    {k.title}
                  </option>
                ))}
                <option value="__CUSTOM__">✍️ [Type Custom Functional Area KPA...]</option>
              </select>

              {(!availableKpas.some(k => k.title === kpa) || kpa === "") && (
                <input
                  type="text"
                  placeholder="Type Functional Area KPA (e.g. Water and Sanitation Infrastructure, Financial Governance)..."
                  value={kpa}
                  onChange={(e) => setKpa(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-white border-2 border-dashed border-emerald-400 focus:border-emerald-600 rounded-lg text-xs font-bold text-slate-900 outline-none"
                />
              )}
            </div>

            {/* Row 2: KPI Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">KPI Description</label>
              <textarea
                rows={2}
                placeholder="Details of what is being measured and evaluated..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl font-medium outline-none text-slate-900 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Baseline */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Baseline</label>
                <input
                  type="text"
                  placeholder="Current status metrics"
                  value={baseline}
                  onChange={(e) => setBaseline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl font-bold outline-none text-slate-900 transition"
                />
              </div>

              {/* Budget Allocation */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-505 uppercase tracking-wider">Budget Allocation</label>
                <input
                  type="text"
                  placeholder="e.g. R450 000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl font-bold font-mono outline-none text-emerald-700 transition animate-pulse-subtle"
                />
              </div>

              {/* Annual Target */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Annual Target</label>
                <input
                  type="text"
                  placeholder="Unified year performance goal"
                  value={annualTarget}
                  onChange={(e) => setAnnualTarget(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl font-bold outline-none text-slate-900 transition"
                />
              </div>

              {/* Annual POE Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Annual POE Description</label>
                <input
                  type="text"
                  placeholder="E.g. Approved Annual Report, Final Audit"
                  value={annualRequiredPoe}
                  onChange={(e) => setAnnualRequiredPoe(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-xl italic outline-none text-[10px] text-slate-700 transition"
                />
              </div>
            </div>

            {/* Quarterly targets inputs and PoE Required descriptions */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Quarterly Targets & Objectives Matrix</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="flex flex-col gap-1.5 p-2 bg-slate-100 rounded-lg">
                  <label className="text-[8.5px] font-black text-slate-600">1ST QUARTER TARGET</label>
                  <input
                    type="text"
                    placeholder="Q1 Goal"
                    value={q1Target}
                    onChange={(e) => setQ1Target(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-slate-750 font-bold rounded text-[10px] mb-1"
                  />
                  <label className="text-[8.5px] font-black text-slate-600 mt-1">Q1 POE DESCRIPTION</label>
                  <input
                    type="text"
                    placeholder="E.g. SCM signoff sheet"
                    value={q1RequiredPoe}
                    onChange={(e) => setQ1RequiredPoe(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-emerald-600 rounded text-[10px] italic text-slate-700"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-2 bg-slate-100 rounded-lg">
                  <label className="text-[8.5px] font-black text-slate-600">2ND QUARTER TARGET</label>
                  <input
                    type="text"
                    placeholder="Q2 Goal"
                    value={q2Target}
                    onChange={(e) => setQ2Target(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-slate-750 font-bold rounded text-[10px] mb-1"
                  />
                  <label className="text-[8.5px] font-black text-slate-600 mt-1">Q2 POE DESCRIPTION</label>
                  <input
                    type="text"
                    placeholder="E.g. Attendance register"
                    value={q2RequiredPoe}
                    onChange={(e) => setQ2RequiredPoe(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-emerald-600 rounded text-[10px] italic text-slate-700"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                  <label className="text-[8.5px] font-black text-indigo-750">MIDTERM TARGET</label>
                  <input
                    type="text"
                    placeholder="Midterm Goal"
                    value={midtermTarget}
                    onChange={(e) => setMidtermTarget(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-indigo-200 focus:border-indigo-500 font-bold rounded text-[10px] text-indigo-900 mb-1"
                  />
                  <label className="text-[8.5px] font-black text-indigo-750 mt-1">MIDTERM POE DESCRIPTION</label>
                  <input
                    type="text"
                    placeholder="E.g. Midterm audit report"
                    value={midtermRequiredPoe}
                    onChange={(e) => setMidtermRequiredPoe(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-indigo-200 focus:border-emerald-600 rounded text-[10px] italic text-indigo-900"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-2 bg-slate-100 rounded-lg">
                  <label className="text-[8.5px] font-black text-slate-600">3RD QUARTER TARGET</label>
                  <input
                    type="text"
                    placeholder="Q3 Goal"
                    value={q3Target}
                    onChange={(e) => setQ3Target(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-slate-750 font-bold rounded text-[10px] mb-1"
                  />
                  <label className="text-[8.5px] font-black text-slate-600 mt-1">Q3 POE DESCRIPTION</label>
                  <input
                    type="text"
                    placeholder="E.g. Ledger extract"
                    value={q3RequiredPoe}
                    onChange={(e) => setQ3RequiredPoe(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-emerald-600 rounded text-[10px] italic text-slate-700"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-2 bg-slate-100 rounded-lg">
                  <label className="text-[8.5px] font-black text-slate-600">4TH QUARTER TARGET</label>
                  <input
                    type="text"
                    placeholder="Q4 Goal"
                    value={q4Target}
                    onChange={(e) => setQ4Target(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-slate-750 font-bold rounded text-[10px] mb-1"
                  />
                  <label className="text-[8.5px] font-black text-slate-600 mt-1">Q4 POE DESCRIPTION</label>
                  <input
                    type="text"
                    placeholder="E.g. Closeout reports"
                    value={q4RequiredPoe}
                    onChange={(e) => setQ4RequiredPoe(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 focus:border-emerald-600 rounded text-[10px] italic text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-slate-950 font-black uppercase text-xs tracking-wider text-white hover:bg-emerald-600 focus:bg-emerald-700 rounded-xl transition duration-150 transform hover:scale-[1.01] active:scale-95 cursor-pointer shadow-lg inline-flex items-center gap-2"
              >
                {saving ? "COMMITTING & SYNCING KPI..." : "COMMIT KPI TARGET"}
                <Save className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

          </form>

        </div>

        {/* List Overview panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>ACTIVE KPI REGISTER ({kpis.length})</span>
              <span className="text-[9px] text-gray-500 font-mono">SUPABASE PIPELINE</span>
            </h3>

            {loading ? (
              <p className="text-slate-400 text-xs animate-pulse">Loading KPI register from database...</p>
            ) : kpis.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-xl text-center bg-black/30 text-slate-400">
                <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                <p className="text-xs uppercase font-bold tracking-wider">No KPI targets captured yet.</p>
                <p className="text-[10px] text-gray-500 mt-1">Submit via the terminal on the left to sync with the Performance Plan table.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
                {kpis.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 transition relative group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/40 px-2.5 py-1 border border-emerald-500/20 rounded">
                            {k.kpiNo}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded">
                            FY {k.baselineYear}
                          </span>
                        </div>
                        
                        <h4 className="text-slate-200 text-xs font-bold leading-relaxed">{k.kpi}</h4>
                        
                        {k.kpa && (
                          <div className="text-[10.5px] text-slate-300 font-sans flex items-center gap-1.5 flex-wrap">
                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/30">
                              Functional Area KPA
                            </span>
                            <span className="text-emerald-200 font-bold">{k.kpa}</span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] bg-black/20 p-2.5 rounded-lg border border-white/5 font-mono">
                          <div>
                            <span className="text-slate-500">Baseline:</span> <span className="text-white font-bold">{k.baseline || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Budget:</span> <span className="text-emerald-350 font-bold">{k.budget || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Annual Goal:</span> <span className="text-emerald-400 font-bold">{k.annualTarget}</span>
                          </div>
                        </div>

                        {/* POE Quarter Indicators */}
                        <div className="pt-2 border-t border-white/5 space-y-2">
                          {(k.annualRequiredPoe || k.annualPoe) && (
                            <div className="bg-indigo-950/40 p-2 rounded-lg border border-indigo-500/20 text-[10.5px] font-sans">
                              <span className="font-extrabold text-[9px] text-indigo-400 uppercase tracking-wide block">Annual POE Description:</span>
                              <span className="text-slate-200 leading-normal">{k.annualRequiredPoe || k.annualPoe}</span>
                            </div>
                          )}
                          <span className="text-[10px] font-black text-slate-350 uppercase block tracking-wider">Quarterly Portfolios of Evidence (POE):</span>
                          <div className="grid grid-cols-1 gap-2 text-[10px] font-sans">
                            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/10 flex flex-col gap-1 text-[10.5px]">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-[9px] text-emerald-400 uppercase tracking-wide">Q1 Portfolio:</span>
                                <button type="button" onClick={() => openBrowseModal(k.id, 'Q1')} className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[8px] rounded uppercase tracking-wider transition">Browse & Comment</button>
                              </div>
                              <span className="text-slate-200 leading-normal" title={k.q1Poe}>{k.q1Poe || 'No text/description captured'}</span>
                              <span className="text-emerald-200/70 text-[9px] italic block mt-1">Comments: {k.q1Comment || 'N/A'}</span>
                              {k.q1PoeDocs && k.q1PoeDocs.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1 border-t border-white/5 pt-1">
                                  {k.q1PoeDocs.map(doc => (
                                    <button
                                      key={doc.id}
                                      type="button"
                                      onClick={() => setPreviewDoc({ ...doc, kpiName: k.kpi, quarter: 'Q1' })}
                                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 active:bg-white/15 text-[8.5px] font-bold text-slate-200 px-2 py-0.5 rounded border border-white/5 truncate max-w-full cursor-pointer hover:text-emerald-300"
                                      title={`Click to view: ${doc.name}`}
                                    >
                                      <Paperclip className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{doc.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/10 flex flex-col gap-1 text-[10.5px]">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-[9px] text-emerald-400 uppercase tracking-wide">Q2 Portfolio:</span>
                                <button type="button" onClick={() => openBrowseModal(k.id, 'Q2')} className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[8px] rounded uppercase tracking-wider transition">Browse & Comment</button>
                              </div>
                              <span className="text-slate-200 leading-normal" title={k.q2Poe}>{k.q2Poe || 'No text/description captured'}</span>
                              <span className="text-emerald-200/70 text-[9px] italic block mt-1">Comments: {k.q2Comment || 'N/A'}</span>
                              {k.q2PoeDocs && k.q2PoeDocs.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1 border-t border-white/5 pt-1">
                                  {k.q2PoeDocs.map(doc => (
                                    <button
                                      key={doc.id}
                                      type="button"
                                      onClick={() => setPreviewDoc({ ...doc, kpiName: k.kpi, quarter: 'Q2' })}
                                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 active:bg-white/15 text-[8.5px] font-bold text-slate-200 px-2 py-0.5 rounded border border-white/5 truncate max-w-full cursor-pointer hover:text-emerald-300"
                                      title={`Click to view: ${doc.name}`}
                                    >
                                      <Paperclip className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{doc.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/10 flex flex-col gap-1 text-[10.5px]">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-[9px] text-emerald-400 uppercase tracking-wide">Q3 Portfolio:</span>
                                <button type="button" onClick={() => openBrowseModal(k.id, 'Q3')} className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[8px] rounded uppercase tracking-wider transition">Browse & Comment</button>
                              </div>
                              <span className="text-slate-200 leading-normal" title={k.q3Poe}>{k.q3Poe || 'No text/description captured'}</span>
                              <span className="text-emerald-200/70 text-[9px] italic block mt-1">Comments: {k.q3Comment || 'N/A'}</span>
                              {k.q3PoeDocs && k.q3PoeDocs.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1 border-t border-white/5 pt-1">
                                  {k.q3PoeDocs.map(doc => (
                                    <button
                                      key={doc.id}
                                      type="button"
                                      onClick={() => setPreviewDoc({ ...doc, kpiName: k.kpi, quarter: 'Q3' })}
                                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 active:bg-white/15 text-[8.5px] font-bold text-slate-200 px-2 py-0.5 rounded border border-white/5 truncate max-w-full cursor-pointer hover:text-emerald-300"
                                      title={`Click to view: ${doc.name}`}
                                    >
                                      <Paperclip className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{doc.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/10 flex flex-col gap-1 text-[10.5px]">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-[9px] text-emerald-400 uppercase tracking-wide">Q4 Portfolio:</span>
                                <button type="button" onClick={() => openBrowseModal(k.id, 'Q4')} className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[8px] rounded uppercase tracking-wider transition">Browse & Comment</button>
                              </div>
                              <span className="text-slate-200 leading-normal" title={k.q4Poe}>{k.q4Poe || 'No text/description captured'}</span>
                              <span className="text-emerald-200/70 text-[9px] italic block mt-1">Comments: {k.q4Comment || 'N/A'}</span>
                              {k.q4PoeDocs && k.q4PoeDocs.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1 border-t border-white/5 pt-1">
                                  {k.q4PoeDocs.map(doc => (
                                    <button
                                      key={doc.id}
                                      type="button"
                                      onClick={() => setPreviewDoc({ ...doc, kpiName: k.kpi, quarter: 'Q4' })}
                                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 active:bg-white/15 text-[8.5px] font-bold text-slate-200 px-2 py-0.5 rounded border border-white/5 truncate max-w-full cursor-pointer hover:text-emerald-300"
                                      title={`Click to view: ${doc.name}`}
                                    >
                                      <Paperclip className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{doc.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Real-Time Targets Editing */}
                        <div className="bg-slate-900 border border-white/10 p-3 rounded-xl mt-3 space-y-3">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Real-Time Target Updates</span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                Annual {isCellNA(k.annualTarget) && <Lock className="w-2.5 h-2.5 text-amber-400 inline" />}
                              </span>
                              <input 
                                type="text"
                                value={k.annualTarget}
                                disabled={isCellNA(k.annualTarget)}
                                readOnly={isCellNA(k.annualTarget)}
                                onChange={(e) => updateKpiField(k.id, 'annualTarget', e.target.value)}
                                className={`w-full text-[10.5px] p-1 rounded font-bold outline-none ${
                                  isCellNA(k.annualTarget)
                                    ? 'bg-slate-950/80 border border-slate-800 text-slate-500 cursor-not-allowed font-mono text-center'
                                    : 'bg-slate-950 border border-slate-800 text-white focus:border-emerald-500'
                                }`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                Q1 {isCellNA(k.q1Target) && <Lock className="w-2.5 h-2.5 text-amber-400 inline" />}
                              </span>
                              <input 
                                type="text"
                                value={k.q1Target}
                                disabled={isCellNA(k.q1Target)}
                                readOnly={isCellNA(k.q1Target)}
                                onChange={(e) => updateKpiField(k.id, 'q1Target', e.target.value)}
                                className={`w-full text-[10.5px] p-1 rounded outline-none ${
                                  isCellNA(k.q1Target)
                                    ? 'bg-slate-950/80 border border-slate-800 text-slate-500 cursor-not-allowed font-mono text-center font-bold'
                                    : 'bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500'
                                }`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                Q2 {isCellNA(k.q2Target) && <Lock className="w-2.5 h-2.5 text-amber-400 inline" />}
                              </span>
                              <input 
                                type="text"
                                value={k.q2Target}
                                disabled={isCellNA(k.q2Target)}
                                readOnly={isCellNA(k.q2Target)}
                                onChange={(e) => updateKpiField(k.id, 'q2Target', e.target.value)}
                                className={`w-full text-[10.5px] p-1 rounded outline-none ${
                                  isCellNA(k.q2Target)
                                    ? 'bg-slate-950/80 border border-slate-800 text-slate-500 cursor-not-allowed font-mono text-center font-bold'
                                    : 'bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500'
                                }`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                Q3 {isCellNA(k.q3Target) && <Lock className="w-2.5 h-2.5 text-amber-400 inline" />}
                              </span>
                              <input 
                                type="text"
                                value={k.q3Target}
                                disabled={isCellNA(k.q3Target)}
                                readOnly={isCellNA(k.q3Target)}
                                onChange={(e) => updateKpiField(k.id, 'q3Target', e.target.value)}
                                className={`w-full text-[10.5px] p-1 rounded outline-none ${
                                  isCellNA(k.q3Target)
                                    ? 'bg-slate-950/80 border border-slate-800 text-slate-500 cursor-not-allowed font-mono text-center font-bold'
                                    : 'bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500'
                                }`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                Q4 {isCellNA(k.q4Target) && <Lock className="w-2.5 h-2.5 text-amber-400 inline" />}
                              </span>
                              <input 
                                type="text"
                                value={k.q4Target}
                                disabled={isCellNA(k.q4Target)}
                                readOnly={isCellNA(k.q4Target)}
                                onChange={(e) => updateKpiField(k.id, 'q4Target', e.target.value)}
                                className={`w-full text-[10.5px] p-1 rounded outline-none ${
                                  isCellNA(k.q4Target)
                                    ? 'bg-slate-950/80 border border-slate-800 text-slate-500 cursor-not-allowed font-mono text-center font-bold'
                                    : 'bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Evaluation & Review Live Panel */}
                        <div className="bg-slate-900 border border-white/10 p-3.5 rounded-xl mt-3 space-y-3 font-sans">
                          
                          {/* Evaluation Section */}
                          <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg space-y-2 text-left">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Evaluation Box</span>
                              <span className="text-[9.5px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 font-mono font-extrabold truncate max-w-[150px]">{targetEmail}</span>
                            </div>
                            <textarea 
                              rows={2}
                              value={k.evaluationComment || ''}
                              onChange={(e) => updateKpiField(k.id, 'evaluationComment', e.target.value)}
                              placeholder="Type Azure AD employee self-evaluation comment..."
                              className="w-full bg-slate-955 border border-slate-850 text-xs text-slate-100 p-2 rounded outline-none focus:border-amber-500 bg-slate-950 text-emerald-100"
                            />
                            
                            {/* Request for Review Block */}
                            <div>
                              <button 
                                type="button"
                                onClick={() => setShowReviewOptionsKpiId(showReviewOptionsKpiId === k.id ? null : k.id)}
                                className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 font-extrabold uppercase text-[9px] text-white tracking-widest rounded-lg shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>Request for Review</span>
                                <ClipboardList className="w-3.5 h-3.5 text-white" />
                              </button>
                              
                              {showReviewOptionsKpiId === k.id && (
                                <div className="mt-2 p-2 bg-slate-950 border border-amber-500/30 rounded-lg space-y-1.5 animate-fadeIn">
                                  <span className="text-[8.5px] text-slate-400 font-bold uppercase block tracking-wider mb-1">Select Quarter or Annual Report:</span>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {['Q1', 'Q2', 'Q3', 'Q4', 'Annual'].map((quarter) => (
                                      <button 
                                        key={quarter}
                                        type="button"
                                        onClick={() => {
                                          generateQuarterlyReport(k, quarter);
                                          showNotification(`Sent ${quarter} Performance Plan Report on behalf of ${targetEmail} to your Line Manager!`);
                                          setShowReviewOptionsKpiId(null);
                                        }}
                                        className="py-1 bg-slate-900 border border-slate-800 hover:bg-emerald-600 hover:border-emerald-500 text-white font-bold text-[8.5px] rounded transition truncate cursor-pointer"
                                      >
                                        {quarter === 'Annual' ? 'Annual Plan' : `${quarter} Report`}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Review Section */}
                          <div className="p-3 bg-teal-950/25 border border-teal-500/20 rounded-lg space-y-2 text-left">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-teal-400 tracking-wider">Manager Approval Box</span>
                              <span className="text-[9.5px] bg-teal-500/20 px-2 py-0.5 rounded text-teal-200 font-mono font-extrabold truncate max-w-[150px]">mgr: {currentUser.manager || 'No Manager Assigned'}</span>
                            </div>
                            <textarea 
                              rows={2}
                              value={k.reviewComment || ''}
                              onChange={(e) => updateKpiField(k.id, 'reviewComment', e.target.value)}
                              placeholder="Type Manager/Approver comments..."
                              className="w-full bg-slate-955 border border-slate-850 text-xs text-slate-100 p-2 rounded outline-none focus:border-teal-500 bg-slate-950"
                            />
                            
                            <div className="flex gap-2">
                              <button 
                                type="button"
                                onClick={async () => {
                                  updateKpiField(k.id, 'reviewApprovalStatus', 'Approved');
                                  showNotification(`KPI ${k.kpiNo} has been APPROVED by your Manager!`);
                                  
                                  const isShabanguUser = (currentUser?.email || '').toLowerCase().includes('shabangusm');
                                  const managerEmail = isShabanguUser ? 'mahlanguml@nkangaladm.gov.za' : (currentUser?.managerEmail || currentUser?.manager || 'khuboniy@nkangaladm.gov.za');
                                  const managerName = isShabanguUser ? 'Mandla L. Mahlangu' : 'Manager';
                                  const subordinateEmail = currentUser?.email || '';
                                  const subordinateName = currentUser?.fullName || subordinateEmail;
                                  
                                  try {
                                    await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        notification: {
                                          senderEmail: managerEmail,
                                          senderName: managerName,
                                          recipientEmail: subordinateEmail,
                                          recipientName: subordinateName,
                                          title: `✅ KPI ${k.kpiNo} has been APPROVED by your Manager!`,
                                          message: `Your Manager approved KPI #${k.kpiNo} ("${k.kpi}").`,
                                          actionType: 'approval',
                                          senderCapacity: 'manager_as_subordinate',
                                          kpiId: k.id,
                                          kpiNo: k.kpiNo
                                        }
                                      })
                                    });
                                  } catch (err) {
                                    console.error("Error sending approval notification:", err);
                                  }
                                }}
                                className={`flex-1 py-1.5 px-2.5 font-black uppercase text-[9px] tracking-widest rounded-lg transition text-white cursor-pointer ${(k.reviewApprovalStatus === 'Approved' || (k as any).reviewStatus === 'Approved') ? 'bg-emerald-600 border border-emerald-500 font-black shadow-lg' : 'bg-slate-800 border border-slate-700 hover:bg-emerald-700 hover:border-emerald-600'}`}
                              >
                                Approve
                              </button>
                              <button 
                                type="button"
                                onClick={async () => {
                                  updateKpiField(k.id, 'reviewApprovalStatus', 'Rejected');
                                  showNotification(`KPI ${k.kpiNo} has been REJECTED by your Manager!`);
                                  
                                  const isShabanguUser = (currentUser?.email || '').toLowerCase().includes('shabangusm');
                                  const managerEmail = isShabanguUser ? 'mahlanguml@nkangaladm.gov.za' : (currentUser?.managerEmail || currentUser?.manager || 'khuboniy@nkangaladm.gov.za');
                                  const managerName = isShabanguUser ? 'Mandla L. Mahlangu' : 'Manager';
                                  const subordinateEmail = currentUser?.email || '';
                                  const subordinateName = currentUser?.fullName || subordinateEmail;
                                  
                                  try {
                                    await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        notification: {
                                          senderEmail: managerEmail,
                                          senderName: managerName,
                                          recipientEmail: subordinateEmail,
                                          recipientName: subordinateName,
                                          title: `⚠️ KPI ${k.kpiNo} has been REJECTED by your Manager!`,
                                          message: `Your Manager rejected KPI #${k.kpiNo} ("${k.kpi}"). Reason: ${k.reviewComment || 'Please review and update as requested.'}`,
                                          actionType: 'revision_requested',
                                          senderCapacity: 'manager_as_subordinate',
                                          kpiId: k.id,
                                          kpiNo: k.kpiNo
                                        }
                                      })
                                    });
                                  } catch (err) {
                                    console.error("Error sending rejection notification:", err);
                                  }
                                }}
                                className={`flex-1 py-1.5 px-2.5 font-black uppercase text-[9px] tracking-widest rounded-lg transition text-white cursor-pointer ${(k.reviewApprovalStatus === 'Rejected' || (k as any).reviewStatus === 'Revision Required' || (k as any).reviewStatus === 'Rejected') ? 'bg-rose-600 border border-rose-500 font-black shadow-lg' : 'bg-slate-800 border border-slate-700 hover:bg-rose-700 hover:border-rose-600'}`}
                              >
                                Reject
                              </button>
                            </div>
                            
                            {(k.reviewApprovalStatus || (k as any).reviewStatus) && (
                              <div className="text-center pt-2 border-t border-white/5">
                                <span className={`inline-block text-[8.5px] font-black font-mono tracking-widest uppercase px-3 py-1 rounded-full ${(k.reviewApprovalStatus === 'Approved' || (k as any).reviewStatus === 'Approved') ? 'bg-green-950/80 text-green-400 border border-green-500/30' : (k.reviewApprovalStatus === 'Rejected' || (k as any).reviewStatus === 'Revision Required' || (k as any).reviewStatus === 'Rejected') ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30' : 'bg-slate-900 border border-white/5 text-gray-400'}`}>
                                  STATUS: {(k.reviewApprovalStatus === 'Approved' || (k as any).reviewStatus === 'Approved') ? 'Approved' : (k.reviewApprovalStatus === 'Rejected' || (k as any).reviewStatus === 'Revision Required' || (k as any).reviewStatus === 'Rejected') ? 'Revision Required / Rejected' : (k.reviewApprovalStatus || (k as any).reviewStatus)}
                                </span>
                              </div>
                            )}
                          </div>

                        </div>

                        <div className="flex items-center justify-between text-[10px] mt-3 border-t border-white/5 pt-2 text-slate-400">
                          <div>
                            Weighting: <b className="text-white font-mono">{k.weighting || 'N/A'}%</b>
                          </div>
                        </div>

                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteKpiItem(k.id, k.kpiNo)}
                        className="text-gray-400 hover:text-red-400 hover:bg-rose-950/40 p-1.5 rounded transition inline-flex"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/15 text-slate-350 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px] mb-1.5">
              <Sparkles className="w-4 h-4" />
              AUTOMATIC SYNC MECHANISM
            </div>
            When a KPI is committed above, it immediately searches the **Performance Plan** for a row matching the exact **KPI No**. If a matching row is located, all quarterly indicators, targets, scores, and quarterly POE definitions are updated dynamically in place. If it doesn't exist, a new planned row is fully prepared.
          </div>
        </div>

      </div>

    </div>

      {browseModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl transition">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="font-black text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-500" />
                {browseModalQuarter} POE Browse & Comments
              </h3>
              <button 
                type="button" 
                onClick={() => setBrowseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl space-y-4">
                 <div>
                   <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">POE Text / Submissions</h4>
                   <div className="text-sm font-medium leading-relaxed text-slate-200">
                     {kpis.find(k => k.id === browseModalKpiId)?.[`${browseModalQuarter.toLowerCase()}Poe` as keyof KpiItem] as string || 'No descriptive submission.'}
                   </div>
                 </div>

                 <div className="border-t border-slate-700/50 pt-3">
                   <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Attached POE Files</h4>
                   {browseModalPoeDocs.length > 0 ? (
                     <div className="flex flex-wrap gap-2 mb-3">
                       {browseModalPoeDocs.map(d => (
                          <div
                            key={d.id}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-blue-300 flex items-center justify-between gap-3 transition"
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ ...d, kpiName: kpis.find(item => item.id === browseModalKpiId)?.kpi, quarter: browseModalQuarter })}
                              className="flex items-center gap-2 hover:text-blue-200 truncate cursor-pointer text-left font-mono text-[10px]"
                              title={`Click to view: ${d.name}`}
                            >
                              <Paperclip className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{d.name}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setBrowseModalPoeDocs(prev => prev.filter(f => f.id !== d.id))}
                              className="text-red-400 hover:text-red-350 p-0.5 rounded cursor-pointer transition"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-xs text-slate-500 italic mb-3">No files uploaded yet.</p>
                   )}

                   {/* Functional upload button */}
                   <div className="relative mt-2">
                     <label className="flex items-center gap-2 justify-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 text-xs font-bold text-emerald-400 hover:text-emerald-300 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl px-4 py-3 transition">
                       <Upload className="w-4 h-4 text-emerald-500" />
                       <span>Upload POE Document</span>
                       <input
                         type="file"
                         className="hidden"
                         multiple
                         onChange={async (e) => {
                           const selected = e.target.files ? Array.from(e.target.files) : [];
                           e.target.value = '';
                           if (selected.length === 0) return;
                           const newDocs: PoeDocument[] = [];
                           for (let i = 0; i < selected.length; i++) {
                             const file = selected[i];
                             try {
                               const doc = await new Promise<PoeDocument>((resolve, reject) => {
                                 const reader = new FileReader();
                                 reader.onload = () => {
                                   resolve({
                                     id: `poe_doc_${browseModalQuarter}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                     name: file.name,
                                     mimeType: file.type || 'application/octet-stream',
                                     dataUrl: reader.result as string,
                                     uploadedAt: new Date().toISOString(),
                                     uploadedBy: currentUser?.email || 'System'
                                   });
                                 };
                                 reader.onerror = reject;
                                 reader.readAsDataURL(file);
                               });
                               newDocs.push(doc);
                             } catch (err) {
                               console.error("Error reading file", err);
                             }
                           }
                           setBrowseModalPoeDocs(prev => [...prev, ...newDocs]);
                         }}
                       />
                     </label>
                   </div>
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider flex items-center gap-2">
                   POE Name &amp; Comments
                 </label>
                 <textarea 
                   rows={4}
                   placeholder="Enter your evaluation comments for this specific POE..."
                   value={poeCommentInput}
                   onChange={e => setPoeCommentInput(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-sm text-slate-100 outline-none transition"
                 />
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end gap-3">
               <button 
                 type="button" 
                 onClick={() => setBrowseModalOpen(false)}
                 className="px-4 py-2 font-bold text-xs uppercase text-slate-400 hover:text-white transition"
               >
                 Cancel
               </button>
               <button 
                 type="button" 
                 onClick={async () => {
                   const updatedKpis = [...kpis];
                   const kpiIdx = updatedKpis.findIndex(k => k.id === browseModalKpiId);
                   if (kpiIdx >= 0) {
                     const qFieldComment = `${browseModalQuarter.toLowerCase()}PoeComment`;
                     const qFieldDocs = `${browseModalQuarter.toLowerCase()}PoeDocs`;
                     const nowIso = new Date().toISOString();
                     const currentKpi: any = updatedKpis[kpiIdx];
                     const hadRevision =
                       currentKpi.reviewStatus === 'Revision Required' ||
                       currentKpi.reviewStatus === 'Rejected' ||
                       currentKpi.reviewApprovalStatus === 'Rejected' ||
                       currentKpi.q1PoeStatus === 'Revision Required' ||
                       currentKpi.q2PoeStatus === 'Revision Required' ||
                       currentKpi.q3PoeStatus === 'Revision Required' ||
                       currentKpi.q4PoeStatus === 'Revision Required';

                     const nextKpi: any = {
                       ...currentKpi,
                       [qFieldComment]: poeCommentInput.trim(),
                       [qFieldDocs]: browseModalPoeDocs,
                       ...(browseModalPoeDocs.length > 0 && hadRevision ? {
                         reviewStatus: 'Submitted for Approval',
                         reviewApprovalStatus: '',
                         resubmittedAt: nowIso,
                         q1PoeStatus: (currentKpi.q1PoeStatus === 'Revision Required' || currentKpi.q1PoeStatus === 'Rejected' || qFieldDocs === 'q1PoeDocs') ? 'Pending Verification' : currentKpi.q1PoeStatus,
                         q2PoeStatus: (currentKpi.q2PoeStatus === 'Revision Required' || currentKpi.q2PoeStatus === 'Rejected' || qFieldDocs === 'q2PoeDocs') ? 'Pending Verification' : currentKpi.q2PoeStatus,
                         q3PoeStatus: (currentKpi.q3PoeStatus === 'Revision Required' || currentKpi.q3PoeStatus === 'Rejected' || qFieldDocs === 'q3PoeDocs') ? 'Pending Verification' : currentKpi.q3PoeStatus,
                         q4PoeStatus: (currentKpi.q4PoeStatus === 'Revision Required' || currentKpi.q4PoeStatus === 'Rejected' || qFieldDocs === 'q4PoeDocs') ? 'Pending Verification' : currentKpi.q4PoeStatus
                       } : {})
                     };
                     const allDocs = [
                       ...(nextKpi.q1PoeDocs || []),
                       ...(nextKpi.q2PoeDocs || []),
                       ...(nextKpi.q3PoeDocs || []),
                       ...(nextKpi.q4PoeDocs || []),
                       ...(nextKpi.annualPoeDocs || []),
                       ...(nextKpi.midtermPoeDocs || [])
                     ];
                     nextKpi.poeFileBase64 = undefined;
                     nextKpi.poeFileName = allDocs[0] ? allDocs[0].name : '';
                     updatedKpis[kpiIdx] = nextKpi;
                     setKpis(updatedKpis);

                     let planRevisionCleared = false;
                     const updatedPlanItems = (pplanData.items || []).map((item: any) => {
                       const matchById = item.id && nextKpi.id && String(item.id).toLowerCase().trim() === String(nextKpi.id).toLowerCase().trim();
                       const matchByNo = item.kpiNo && nextKpi.kpiNo && String(item.kpiNo).toLowerCase().trim() === String(nextKpi.kpiNo).toLowerCase().trim();
                       if (matchById || matchByNo) {
                         const itemHadRevision =
                           hadRevision ||
                           item.reviewStatus === 'Revision Required' ||
                           item.reviewStatus === 'Rejected' ||
                           item.reviewApprovalStatus === 'Rejected' ||
                           item.q1PoeStatus === 'Revision Required' ||
                           item.q2PoeStatus === 'Revision Required' ||
                           item.q3PoeStatus === 'Revision Required' ||
                           item.q4PoeStatus === 'Revision Required';
                         if (browseModalPoeDocs.length > 0 && itemHadRevision) {
                           planRevisionCleared = true;
                         }
                         return {
                           ...item,
                           [qFieldComment]: poeCommentInput.trim(),
                           [qFieldDocs]: browseModalPoeDocs,
                           ...(browseModalPoeDocs.length > 0 && itemHadRevision ? {
                             reviewStatus: 'Submitted for Approval',
                             reviewApprovalStatus: '',
                             resubmittedAt: nowIso,
                             q1PoeStatus: (item.q1PoeStatus === 'Revision Required' || item.q1PoeStatus === 'Rejected' || qFieldDocs === 'q1PoeDocs') ? 'Pending Verification' : item.q1PoeStatus,
                             q2PoeStatus: (item.q2PoeStatus === 'Revision Required' || item.q2PoeStatus === 'Rejected' || qFieldDocs === 'q2PoeDocs') ? 'Pending Verification' : item.q2PoeStatus,
                             q3PoeStatus: (item.q3PoeStatus === 'Revision Required' || item.q3PoeStatus === 'Rejected' || qFieldDocs === 'q3PoeDocs') ? 'Pending Verification' : item.q3PoeStatus,
                             q4PoeStatus: (item.q4PoeStatus === 'Revision Required' || item.q4PoeStatus === 'Rejected' || qFieldDocs === 'q4PoeDocs') ? 'Pending Verification' : item.q4PoeStatus
                           } : {}),
                           poeFileBase64: undefined,
                           poeFileName: allDocs[0] ? allDocs[0].name : ''
                         };
                       }
                       return item;
                     });
                     const prevSubmitted = Array.isArray(pplanData.metadata?.submittedKpiIds) ? pplanData.metadata.submittedKpiIds : [];
                     const updatedPlanPayload = {
                       ...pplanData,
                       metadata: {
                         ...(pplanData.metadata || {}),
                         _isFredExtracted: true,
                         _authoritativePoeUpdate: true,
                         ...(planRevisionCleared ? {
                           reviewStatus: 'Submitted for Approval',
                           submittedKpiIds: Array.from(new Set([...prevSubmitted, nextKpi.id]))
                         } : {})
                       },
                       items: updatedPlanItems
                     };
                     setPplanData(updatedPlanPayload);

                     try {
                       await Promise.all([
                         fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(targetEmail)}`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ kpis: updatedKpis })
                         }),
                         fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(targetEmail)}`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify(updatedPlanPayload)
                         })
                       ]);
                       showNotification(`Saved comments and POE documents for ${browseModalQuarter}.`);
                     } catch(e) { console.error("Error saving POE comments and documents", e); }
                   }
                   setBrowseModalOpen(false);
                 }}
                 className="px-5 py-2 font-bold text-xs uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg active:scale-95 transition"
               >
                 Save Comments &amp; POE
               </button>
            </div>
          </div>
        </div>
      )}
      {previewDoc && (
        <OfficeDocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </>
  );
}
