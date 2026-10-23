import React, { useState, useEffect } from 'react';
import { resilientFetch } from '../../utils/resilientFetch';
import { 
  FileSignature, Send, User, Target, ClipboardList,
  Upload, X, File, FileSpreadsheet, Image, FileText, Check, AlertCircle, Info, CalendarCheck, HelpCircle, Presentation,
  Bell, AlertTriangle, CheckCircle, Eye, Download, CheckSquare, Square, Trash2, FileBadge, UserCheck, FileBarChart, Award
} from 'lucide-react';
import { IPMSWorkflowInbox } from './IPMSWorkflowInbox';
import { OfficeDocumentViewer } from './OfficeDocumentViewer';
import { downloadOriginalFile, viewOriginalFile } from '../../utils/documentBinaryHelper';
import { isUserUnrestricted } from '../../utils/unrestrictedHelper';
import { 
  JSCSelfEvaluationSection, 
  JSCManagerApprovalSection, 
  JSCAnalyticalReportingSection 
} from './JSCModules';
import { CoreCompetenciesSelfEvaluation } from './CoreCompetenciesSelfEvaluation';
import { applyOfficialKpiRules, resolveUserEmailAlias } from '../../utils/officialKpiFixes';

export interface PoeDocument {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  dataUrl?: string;
  fileData?: string;
  url?: string;
  fileType?: string;
  uploadedAt: string;
  uploadedBy: string;
  kpiName?: string;
  quarter?: string;
}

import { 
  isCellNA, 
  extractNumericValue, 
  calculateProgressPercentage, 
  hasVariance, 
  calculateVariance 
} from '../../utils/varianceCalculator';

export const renderVarianceBadge = (targetVal: any, actualVal: any) => {
  const v = calculateVariance(targetVal, actualVal);
  const isPos = String(v).startsWith('+') || (parseFloat(v) > 0);
  const isZero = String(v) === '0' || String(v) === '0.00' || String(v) === '0%' || String(v) === 'N/A';
  return (
    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
      isZero ? 'bg-slate-100 text-slate-600' :
      isPos ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
      'bg-rose-100 text-rose-700 border border-rose-200'
    }`}>
      {v}
    </span>
  );
};

export { 
  isCellNA, 
  extractNumericValue, 
  calculateProgressPercentage, 
  hasVariance, 
  calculateVariance 
};

interface QuarterPoeSelectorProps {
  label: string;
  placeholderRef: string;
  quarterName: string; // "Q1", "Q2", "Q3", "Q4"
  requiredPoeDescription?: string;
  textValue: string;
  setTextValue: (v: string) => void;
  files: PoeDocument[];
  setFiles: (files: PoeDocument[]) => void;
  currentUser: any;
  disabled?: boolean;
  poeStatus?: string;
  poeFeedback?: string;
  onAutoSave?: (docs: PoeDocument[]) => void;
}

export function QuarterPoeSelector({
  label,
  placeholderRef,
  quarterName,
  requiredPoeDescription,
  textValue,
  setTextValue,
  files,
  setFiles,
  currentUser,
  disabled,
  poeStatus,
  poeFeedback,
  onAutoSave
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
    if (!fileListParam || disabled) return;

    const fileList = Array.from(fileListParam);
    if (fileList.length === 0) return;

    if (fileList.length > 20) {
      alert(`File Upload Limits Notice:\n\n• You can upload at most 20 files at a time. Please select fewer files.`);
      return;
    }

    if (files.length + fileList.length > 20) {
      alert(`File Upload Limits Notice:\n\n• You can have a maximum of 20 PoE files per KPI.`);
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
      const updatedFiles = [...files, ...newDocs];
      setFiles(updatedFiles);
      if (onAutoSave) {
        onAutoSave(updatedFiles);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
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
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    if (disabled) return;
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    if (onAutoSave) {
      onAutoSave(updatedFiles);
    }
  };

  const getFileIcon = (mimeType: string, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['ppt', 'pptx', 'pps', 'key', 'odp'].includes(ext) || mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Presentation className="w-4 h-4 text-orange-500 shrink-0" />;
    }
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image className="w-4 h-4 text-sky-500 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || mimeType.includes('word') || mimeType.includes('wordprocessingml')) {
      return <FileText className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
    if (['pdf'].includes(ext) || mimeType.includes('pdf')) {
      return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 matches-label mb-0">
          <span className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-black text-[9px] shrink-0">
            {quarterName}
          </span>
          <span className="truncate">{label}</span>
        </label>
        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded shrink-0">
          {files.length} attached {totalBytes > 0 ? `(${formatFileSize(totalBytes)})` : ''}
        </span>
      </div>

      {requiredPoeDescription && (
        <div className="px-2 py-1.5 bg-yellow-50 border border-yellow-200 rounded text-[10px] font-semibold text-yellow-800 flex items-start gap-1">
          <span className="font-extrabold shrink-0 mt-0.5">Required PoE:</span> 
          <span>{requiredPoeDescription}</span>
        </div>
      )}

      {((poeStatus && poeStatus !== 'Pending Verification') || poeFeedback) && (
        <div className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 shadow-sm ${
          poeStatus === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
          poeStatus === 'Revision Required' ? 'bg-amber-50 border-amber-300 text-amber-900' :
          poeStatus === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-900' :
          'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex justify-between items-center font-bold">
            <span className="text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
              <span>Manager PoE Audit Status:</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
              poeStatus === 'Approved' ? 'bg-emerald-600 text-white' :
              poeStatus === 'Revision Required' ? 'bg-amber-600 text-white' :
              poeStatus === 'Rejected' ? 'bg-rose-600 text-white' :
              'bg-indigo-600 text-white'
            }`}>
              {poeStatus || 'Reviewed'}
            </span>
          </div>
          {poeFeedback && (
            <p className="text-[11px] font-semibold m-0 leading-snug select-text">
              <span className="font-black text-slate-800">Manager Note:</span> "{poeFeedback}"
            </p>
          )}
        </div>
      )}

      {/* Description text input */}
      <input
        type="text"
        placeholder={placeholderRef}
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        disabled={disabled}
        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-lg text-xs font-semibold text-slate-900 shadow-inner outline-none transition disabled:bg-slate-100 disabled:opacity-75"
      />

      {/* Drag & Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border border-dashed p-3 rounded-lg text-center cursor-pointer transition ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-slate-300 bg-white hover:bg-slate-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <label className={`block m-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <Upload className="w-5 h-5 mx-auto text-slate-450 mb-1" />
          <p className="text-[10px] font-bold text-slate-700 mb-0">
            Drag &amp; drop multiple files or <span className="text-emerald-700 underline">browse</span>
          </p>
          <p className="text-[8px] text-slate-500 mt-0.5 mb-0 leading-tight">
            All file formats supported (Word, Excel, PDF, PowerPoint, Images, Zip, Audio/Video, Emails, etc.) • 200MB limit per KPI
          </p>
          {!disabled && (
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
          )}
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
                className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition group text-xs text-stone-900 shadow-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {getFileIcon(file.mimeType, file.name)}
                  <span className="font-semibold text-slate-700 truncate block max-w-[170px]" title={file.name}>
                    {file.name}
                  </span>
                  <span className="font-mono text-[9px] font-bold text-slate-400">
                    ({ext}{file.size ? ` • ${formatFileSize(file.size)}` : ''})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewDoc({
                        ...file,
                        kpiName: requiredPoeDescription || label,
                        quarter: quarterName
                      });
                    }}
                    className="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-650 transition cursor-pointer"
                    title="View Document in High-Fidelity Office Viewer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {file.dataUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadOriginalFile(file.name, file.dataUrl, {
                          mimeType: file.mimeType,
                          kpiName: requiredPoeDescription || label,
                          quarter: quarterName
                        });
                      }}
                      className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-650 transition cursor-pointer"
                      title="Download Document in Original Upload Format"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-red-650 transition"
                      title="Remove File"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <OfficeDocumentViewer doc={{...previewDoc, quarter: quarterName}} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

interface Props {
  currentUser: any;
  activeTenantId: string;
  isTeamEvaluation?: boolean;
  readOnly?: boolean;
  readOnlyOwnerLabel?: string;
}

export function EvaluationIPMS({ currentUser, activeTenantId, isTeamEvaluation, readOnly = false, readOnlyOwnerLabel }: Props) {
  const sourceApiEndpoint = isTeamEvaluation ? 'team-pplan' : 'pplan';
  const saveApiEndpoint = isTeamEvaluation ? 'team-evaluation' : 'pplan';
  const headingTitle = readOnly
    ? (readOnlyOwnerLabel || `${currentUser?.fullName || currentUser?.email}'s Team Self-Evaluation (Live Read-Only)`)
    : (isTeamEvaluation ? 'Team Evaluation' : 'Employee Self-Evaluation');
  const subTitle = readOnly
    ? 'Live read-only mirror — automatically updates as Nompumelelo Nsibande captures actual deliverables, scores, & Portfolios of Evidence (PoE)'
    : (isTeamEvaluation 
      ? 'Capture actual team quarterly deliverables, portfolios of evidence (POE), & collective assessments'
      : 'Capture actual quarterly deliverables, portfolios of evidence (POE), & assessments');
  const currentMonth = new Date().getMonth(); // 0-11
  const isUnrestrictedUser = true; // Fully unlocked reporting for all users
  const isQ1TimeLocked = false;
  const q1ActivePeriod = "July - September (Active & Unlocked)";
  const isQ2TimeLocked = false;
  const q2ActivePeriod = "October - December (Active & Unlocked)";
  const isMidtermTimeLocked = false;
  const midtermActivePeriod = "January - June (Post-Q2) (Active & Unlocked)";
  const isQ3TimeLocked = false;
  const q3ActivePeriod = "January - March (Active & Unlocked)";
  const isQ4TimeLocked = false;
  const q4ActivePeriod = "April - June (Active & Unlocked)";
  const isAnnualTimeLocked = false;
  const annualActivePeriod = "July - September (Post-Q4) (Active & Unlocked)";

  const renderTimeLockBanner = (isLocked: boolean, periodName: string) => {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium mb-3">
        <span className="text-base">✅</span>
        <span>This evaluation section is currently active and unlocked ({periodName}).</span>
      </div>
    );
  };
  const [evalPhase, setEvalPhase] = useState<'kpi_self' | 'jsc_self' | 'cc_self' | 'jsc_manager' | 'jsc_reporting'>('kpi_self');
  const [loading, setLoading] = useState(true);
  const [pplanData, setPplanData] = useState<{ metadata: any, items: any[] }>({ metadata: {}, items: [] });
  const [saving, setSaving] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'info' | 'warning' } | null>(null);
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>([]);
  const [selectedKpiIdFilter, setSelectedKpiIdFilter] = useState<string | null>(null);

  const toggleSelectKpi = (id: string) => {
    setSelectedKpiIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllKpis = () => {
    if (selectedKpiIds.length === (pplanData.items?.length || 0)) {
      setSelectedKpiIds([]);
    } else {
      setSelectedKpiIds((pplanData.items || []).map(i => i.id));
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isManagerOfAnyone, setIsManagerOfAnyone] = useState(false);
  const [showClearKpiModal, setShowClearKpiModal] = useState(false);

  useEffect(() => {
    fetchMyPlan();
    fetchNotifications();

    const checkManagerStatus = async () => {
      try {
        const res = await fetch(`/api/tenant/${activeTenantId}/users`);
        if (true) {
          const data = await res.json();
          const usersList = data.users || [];
          const myEmail = (currentUser?.email || '').toLowerCase().trim();
          const isMgr = usersList.some((u: any) => {
            const mEmail = (u.managerEmail || u.reportToEmail || '').toLowerCase().trim();
            const mName = (u.manager || u.reportTo || '').toLowerCase().trim();
            return mEmail === myEmail || myEmail.includes('khuboni') || mName.includes(myEmail);
          });
          setIsManagerOfAnyone(isMgr || myEmail.includes('khuboni') || myEmail === 'mike@mzansiflow.co.za');
        }
      } catch (e) {
        console.error("Error checking manager status", e);
      }
    };
    checkManagerStatus();

    const handlePplanRefresh = (e: any) => {
      const myEmail = (currentUser?.email || '').toLowerCase().trim();
      const updatedEmail = (e?.detail?.userId || '').toLowerCase().trim();
      if (!updatedEmail || updatedEmail === myEmail) {
        fetchMyPlan();
      }
    };
    window.addEventListener('pplan-updated', handlePplanRefresh);
    return () => window.removeEventListener('pplan-updated', handlePplanRefresh);
  }, [activeTenantId, currentUser]);

  const fetchNotifications = async () => {
    try {
      const res = await resilientFetch(`/api/tenant/${activeTenantId}/ipms-notifications?userEmail=${encodeURIComponent(currentUser.email || '')}&t=${Date.now()}`);
      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.warn("Silent recovery during notifications fetch:", e);
    }
  };

  const [lastSyncedAt, setLastSyncedAt] = useState<string>(new Date().toLocaleTimeString());

  const fetchMyPlan = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const primaryEmail = currentUser?.email || '';
      const resolvedEmail = resolveUserEmailAlias(primaryEmail);
      let res = await fetch(`/api/tenant/${activeTenantId}/${sourceApiEndpoint}?userId=${encodeURIComponent(primaryEmail)}&t=${Date.now()}`);
      let data = res.ok ? await res.json() : null;

      if ((!data || !Array.isArray(data.items) || data.items.length === 0) && resolvedEmail !== primaryEmail) {
        const fallbackRes = await fetch(`/api/tenant/${activeTenantId}/${sourceApiEndpoint}?userId=${encodeURIComponent(resolvedEmail)}&t=${Date.now()}`);
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      }

      if (data) {
        if (data && data.metadata) {
          const uEmail = (currentUser?.email || '').toLowerCase().trim();
          const currMgrEmail = (currentUser?.managerEmail || '').toLowerCase().trim();
          const metaMgrEmail = (data.metadata.managerEmail || '').toLowerCase().trim();
          
          if (uEmail === 'joubertm@nkangaladm.gov.za' || uEmail === 'tloujmt@nkangaladm.gov.za') {
            data.metadata.managerEmail = 'linkss@nkangaladm.gov.za';
            data.metadata.manager = 'Solly Links';
            data.metadata.reportTo = 'Solly Links';
          } else if (currMgrEmail && currMgrEmail !== uEmail) {
            data.metadata.managerEmail = currentUser.managerEmail;
          } else if (!metaMgrEmail || metaMgrEmail === uEmail) {
            if (uEmail.includes('khuboni')) {
              data.metadata.managerEmail = 'ShabanguSM@nkangaladm.gov.za';
              data.metadata.manager = 'Sibusiso M. Shabangu';
            } else if (uEmail.includes('shabangusm') || uEmail.includes('shabangugm')) {
              data.metadata.managerEmail = 'mahlanguml@nkangaladm.gov.za';
              data.metadata.manager = 'Mandla L. Mahlangu';
            } else {
              data.metadata.managerEmail = 'KhuboniY@nkangaladm.gov.za';
              data.metadata.manager = 'Yena Khuboni';
            }
          }
          if (data && Array.isArray(data.items)) {
            const uEmail = (currentUser?.email || '').toLowerCase().trim();
            const metaEmail = (data.metadata?.email || '').toLowerCase().trim();
            const isJoubert = uEmail.includes('joubert') || uEmail.includes('marianne') || metaEmail.includes('joubert') || metaEmail.includes('marianne');
            const isMadihlaba = uEmail.includes('madihlaba') || uEmail.includes('madhilaba') || metaEmail.includes('madihlaba') || metaEmail.includes('madhilaba');
            const isMasekoFm = uEmail.includes('masekofm') || metaEmail.includes('masekofm');
            const isMotauAm = uEmail.includes('motauam') || metaEmail.includes('motauam');
            const isXabaNg = uEmail.includes('xabang') || metaEmail.includes('xabang');

            if (isJoubert) {
              data.items = data.items.map((it: any) => {
                const kpiDesc = (it.kpi || it.description || it.kpiDescription || '').toLowerCase();
                if (kpiDesc.includes('clean audit')) {
                  return {
                    ...it,
                    q1Target: 'N/A',
                    q1Locked: true,
                    q3Target: (!it.q3Target || it.q3Target === 'N/A') ? '1 (Clean audit)' : it.q3Target
                  };
                }
                return it;
              });
            }
            if (isMadihlaba) {
              data.items = data.items.map((it: any) => {
                const kpiNoStr = String(it.kpiNo || '').toUpperCase().trim();
                const kpiDesc = String(it.kpi || it.description || it.kpiDescription || '').toLowerCase();
                if (kpiNoStr === 'M_21' || kpiNoStr === 'M-21' || kpiDesc.includes('clean audit')) {
                  return {
                    ...it,
                    kpiNo: 'M_21',
                    q1Target: 'N/A',
                    q1Locked: true,
                    q2Target: (!it.q2Target || it.q2Target === 'N/A') ? '1 (Clean audit)' : it.q2Target,
                    q2Locked: false,
                    q3Target: 'N/A',
                    q3Locked: true,
                    q4Target: 'N/A',
                    q4Locked: true,
                    lockedQuarters: { q1: true, q2: false, q3: true, q4: true }
                  };
                }
                return it;
              });
            }
            if (isMasekoFm) {
              data.items = data.items.map((it: any) => {
                const kpiNoStr = String(it.kpiNo || '').toUpperCase().trim();
                const kpiDesc = String(it.kpi || it.description || it.kpiDescription || '').toLowerCase();
                if (kpiNoStr === 'M_49' || kpiNoStr === 'M-49' || kpiDesc.includes('tourism expo')) {
                  return {
                    ...it,
                    kpiNo: 'M_49',
                    q1Target: 'N/A',
                    q1Locked: true,
                    q2Target: 'N/A',
                    q2Locked: true,
                    q3Target: 'N/A',
                    q3Locked: true,
                    q4Target: (!it.q4Target || it.q4Target === 'N/A') ? '1' : it.q4Target,
                    q4Locked: false,
                    lockedQuarters: { q1: true, q2: true, q3: true, q4: false }
                  };
                }
                return it;
              });
            }
            if (isMotauAm) {
              data.items = data.items.map((it: any) => {
                const kpiNoStr = String(it.kpiNo || '').trim();
                const kpiDesc = String(it.kpi || it.description || it.kpiDescription || '').toLowerCase();
                if (kpiNoStr === '3' || kpiDesc.includes('performance agreements signed with subordinates')) {
                  return {
                    ...it,
                    annualTarget: '2',
                    target: '2',
                    q1Target: (String(it.q1Target || '').toLowerCase().includes('subordinate') || !it.q1Target) ? '2' : it.q1Target
                  };
                }
                return it;
              });
            }
            if (isXabaNg) {
              data.items = data.items.filter((it: any) => {
                const kpiDesc = String(it.kpi || it.description || it.kpiDescription || '').toLowerCase();
                return !kpiDesc.includes('staff vacancy rate');
              });
            }
          }
        }
        if (data && Array.isArray(data.items)) {
          data.items = applyOfficialKpiRules(currentUser?.email || '', data.items);
          setPplanData(data);
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!readOnly) return;
    const pollTimer = setInterval(() => {
      fetchMyPlan(true);
    }, 6000);
    return () => clearInterval(pollTimer);
  }, [readOnly, activeTenantId, currentUser?.email, sourceApiEndpoint]);

  const updateItem = (id: string, field: string, value: any) => {
    if (readOnly) return;
    setPplanData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleAutoSavePoeDocs = (kpiId: string, quarterField: string, updatedDocs: PoeDocument[]) => {
    if (readOnly) return;
    setPplanData(prev => {
      const updatedItems = (prev.items || []).map(item => {
        if (item.id === kpiId) {
          const nextItem = {
            ...item,
            [quarterField]: updatedDocs
          };
          const allDocs = [
            ...(nextItem.q1PoeDocs || []),
            ...(nextItem.q2PoeDocs || []),
            ...(nextItem.q3PoeDocs || []),
            ...(nextItem.q4PoeDocs || []),
            ...(nextItem.annualPoeDocs || []),
            ...(nextItem.midtermPoeDocs || [])
          ];
          const firstDoc = allDocs[0];
          return {
            ...nextItem,
            poeFileBase64: undefined,
            poeFileName: firstDoc ? firstDoc.name : ''
          };
        }
        return item;
      });

      const updatedPayload = {
        ...prev,
        metadata: {
          ...(prev.metadata || {}),
          _authoritativePoeUpdate: true
        },
        items: updatedItems
      };

      // Persistently save to server in background without triggering a self-refresh race condition
      fetch(`/api/tenant/${activeTenantId}/${saveApiEndpoint}?userId=${encodeURIComponent(currentUser.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      }).catch(err => {
        console.error("Auto-save PoE error:", err);
      });

      return updatedPayload;
    });
  };

  const handleSaveKpi = async (kpiId: string, submitForReview = false) => {
    setSaving(true);
    try {
      const isDemoUser = (currentUser.email || '').toLowerCase() === 'user@mzansiflow.co.za';
      const userEmailForMgr = (pplanData.metadata?.email || currentUser.email || '').toLowerCase().trim();
      let resolvedMgr = {
        manager: pplanData.metadata?.manager || currentUser.manager || (isDemoUser ? 'Demo Line Manager' : 'Yena Khuboni'),
        managerEmail: pplanData.metadata?.managerEmail || currentUser.managerEmail || (isDemoUser ? 'manager@mzansiflow.co.za' : 'KhuboniY@nkangaladm.gov.za'),
        reportTo: pplanData.metadata?.reportTo || currentUser.reportTo || (isDemoUser ? 'Demo Line Manager' : '')
      };
      if (['marxc@nkangaladm.gov.za', 'nakapm@nkangaladm.gov.za', 'rachidimb@nkangaladm.gov.za', 'mokhabelagg@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('marxc') || userEmailForMgr.includes('nakapm') || userEmailForMgr.includes('rachidimb') || userEmailForMgr.includes('mokhabelagg')) {
        resolvedMgr = { manager: 'Nirisha Singh', managerEmail: 'singhn@nkangaladm.gov.za', reportTo: 'Nirisha Singh' };
      } else if (['matsebulan@nkangaladm.gov.za', 'mathenjwabh@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('matsebulan') || userEmailForMgr.includes('mathenjwabh')) {
        resolvedMgr = { manager: 'Marianne Joubert', managerEmail: 'joubertm@nkangaladm.gov.za', reportTo: 'Marianne Joubert' };
      } else if (['giyasi-affulph@nkangaladm.gov.za', 'sibanyonimj@nkangaladm.gov.za', 'singorl@nkangaladm.gov.za', 'mangenart@nkangaladm.gov.za', 'mbulawan@nkangaladm.gov.za', 'mkhabelanc@nkangaladm.gov.za', 'mpanzal@nkangaladm.gov.za', 'mtswenism@nkangaladm.gov.za'].includes(userEmailForMgr)) {
        resolvedMgr = { manager: 'Alfred S. Magampe', managerEmail: 'magampeas@nkangaladm.gov.za', reportTo: 'Alfred S. Magampe' };
      } else if (['nkosiwm@nkangaladm.gov.za', 'mochitelaso@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('nkosiwm') || userEmailForMgr.includes('mochitelaso')) {
        resolvedMgr = { manager: 'Yolanda Segami', managerEmail: 'segamiy@nkangaladm.gov.za', reportTo: 'Yolanda Segami' };
      } else if (['rakauj@nkangaladm.gov.za', 'gakwamf@nkangaladm.gov.za', 'mahlangude@nkangaladm.gov.za', 'mankopanamm@nkangaladm.gov.za', 'moepis@nkangaladm.gov.za', 'molefeki@nkangaladm.gov.za', 'mthimunyepm@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('rakauj') || userEmailForMgr.includes('gakwamf') || userEmailForMgr.includes('mahlangude') || userEmailForMgr.includes('mankopanamm') || userEmailForMgr.includes('moepis') || userEmailForMgr.includes('molefeki') || userEmailForMgr.includes('mthimunye')) {
        resolvedMgr = { manager: 'Johannes MT. Tlou', managerEmail: 'tloujmt@nkangaladm.gov.za', reportTo: 'Johannes MT. Tlou' };
      } else if (['dlaminiss@nkangaladm.gov.za', 'khozahf@nkangaladm.gov.za', 'mafodim@nkangaladm.gov.za', 'mashilesm@nkangaladm.gov.za', 'moreroaml@nkangaladm.gov.za', 'thumbathiamd@nkangaladm.gov.za', 'mthethwanm@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('dlaminiss') || userEmailForMgr.includes('khozahf') || userEmailForMgr.includes('mafodim') || userEmailForMgr.includes('mashilesm') || userEmailForMgr.includes('moreroaml') || userEmailForMgr.includes('thumbathi') || userEmailForMgr.includes('mthethwa')) {
        resolvedMgr = { manager: 'Priscilla Fenyane', managerEmail: 'fenyanep@nkangaladm.gov.za', reportTo: 'Priscilla Fenyane' };
      } else if (userEmailForMgr === 'joubertm@nkangaladm.gov.za' || userEmailForMgr === 'tloujmt@nkangaladm.gov.za') {
        resolvedMgr = { manager: 'Solly Links', managerEmail: 'linkss@nkangaladm.gov.za', reportTo: 'Solly Links' };
      } else if (userEmailForMgr.includes('shabangusm') || userEmailForMgr.includes('shabangugm')) {
        resolvedMgr = { manager: 'Mandla L. Mahlangu', managerEmail: 'mahlanguml@nkangaladm.gov.za', reportTo: 'Mandla L. Mahlangu' };
      }

      const metadata = { 
        ...pplanData.metadata,
        email: pplanData.metadata?.email || currentUser.email,
        manager: resolvedMgr.manager,
        managerEmail: resolvedMgr.managerEmail,
        reportTo: resolvedMgr.reportTo
      };
      if (submitForReview) {
        const targetItem = pplanData.items.find(i => i.id === kpiId);
        const docsCount = targetItem ? ((targetItem.q1PoeDocs?.length || 0) + (targetItem.q2PoeDocs?.length || 0) + (targetItem.q3PoeDocs?.length || 0) + (targetItem.q4PoeDocs?.length || 0) + (targetItem.annualPoeDocs?.length || 0) + (targetItem.midtermPoeDocs?.length || 0)) : 0;
        const hasTextPoe = targetItem && (targetItem.poe || targetItem.q1Poe || targetItem.q2Poe || targetItem.q3Poe || targetItem.q4Poe || targetItem.poeFileName);
        if (docsCount === 0 && !hasTextPoe) {
          alert("Portfolio of Evidence (PoE) is MANDATORY prior to submitting KPI for manager review! Please attach a PoE document or description.");
          setSaving(false);
          return;
        }
        metadata.reviewStatus = 'Submitted for Approval';
      } else if (!metadata.reviewStatus) {
        metadata.reviewStatus = 'Draft';
      }

      const updatedItems = pplanData.items.map(item => {
        const cleanVal = (val: string) => {
          if (!val) return '';
          const tokens = val.split(/(?:Q1:|Q2:|Q3:|Q4:|midterm:|annual:|\n|\r)/gi);
          const cleanPieces = tokens
            .map(t => t.trim())
            .filter(t => t.length > 0 && !t.match(/^(?:Q\d|midterm|annual)$/i));
          return cleanPieces.length > 0 ? cleanPieces[0] : '';
        };
        const q1Text = cleanVal(item.q1Poe);
        const q2Text = cleanVal(item.q2Poe);
        const q3Text = cleanVal(item.q3Poe);
        const q4Text = cleanVal(item.q4Poe);
        const aggregatePoe = [
          q1Text ? `Q1: ${q1Text}` : '',
          q2Text ? `Q2: ${q2Text}` : '',
          q3Text ? `Q3: ${q3Text}` : '',
          q4Text ? `Q4: ${q4Text}` : ''
        ].filter(Boolean).join('\n');

        const docs = [...(item.q1PoeDocs || []), ...(item.q2PoeDocs || []), ...(item.q3PoeDocs || []), ...(item.q4PoeDocs || []), ...(item.annualPoeDocs || []), ...(item.midtermPoeDocs || [])];
        const firstDoc = docs[0];

        const qScores = [item.q1Score, item.q2Score, item.midtermScore, item.q3Score, item.q4Score]
          .map(s => parseFloat(s))
          .filter(s => !isNaN(s) && s > 0);
        const resolvedMyScore = (item.myScore && item.myScore !== 'N/A' && item.myScore !== '')
          ? item.myScore
          : (qScores.length > 0 ? (qScores.reduce((a, b) => a + b, 0) / qScores.length).toFixed(1) : '');

        const existingSubmittedIds = new Set(pplanData.metadata?.submittedKpiIds || []);
        let updatedItem = {
          ...item,
          myScore: resolvedMyScore,
          poe: aggregatePoe || item.poe,
          poeFileBase64: undefined,
          poeFileName: firstDoc ? firstDoc.name : ''
        };

        if ((item.id === kpiId && submitForReview) || item.reviewStatus === 'Submitted for Approval' || existingSubmittedIds.has(item.id)) {
          updatedItem.reviewStatus = 'Submitted for Approval';
        }
        return updatedItem;
      });

      const updatedMetadata = {
        ...metadata,
        email: metadata.email || currentUser.email,
        manager: metadata.manager || currentUser.manager || '',
        managerEmail: metadata.managerEmail || currentUser.managerEmail || '',
        reportTo: metadata.reportTo || currentUser.reportTo || currentUser.manager || '',
        _isFredExtracted: true,
        _authoritativePoeUpdate: true,
        submittedKpiIds: Array.from(new Set([
          ...(pplanData.metadata?.submittedKpiIds || []),
          ...(submitForReview ? [kpiId] : [])
        ])),
        ...(submitForReview ? {
          reviewStatus: 'Submitted for Approval',
          lastSubmittedKpiId: undefined
        } : {})
      };

      const payload = {
        metadata: updatedMetadata,
        items: updatedItems
      };

      const pplanRes = await fetch(`/api/tenant/${activeTenantId}/${saveApiEndpoint}?userId=${encodeURIComponent(currentUser.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!pplanRes.ok) {
        throw new Error("Failed to save. Status: " + pplanRes.status + " " + pplanRes.statusText);
      }

      if (submitForReview) {
        const isShabanguUser = (currentUser.email || '').toLowerCase().includes('shabangusm');
        const managerEmail = isShabanguUser ? 'mahlanguml@nkangaladm.gov.za' : (updatedMetadata.managerEmail || currentUser.managerEmail || metadata.managerEmail || 'KhuboniY@nkangaladm.gov.za');
        const managerName = isShabanguUser ? 'Mandla L. Mahlangu' : (updatedMetadata.manager || currentUser.manager || metadata.manager || 'Line Manager');
        const submitterEmail = currentUser.email;
        const submitterName = currentUser.fullName || currentUser.full_name || currentUser.email?.split('@')[0] || 'Official';

        let poeCount = 0;
        const targetItem = updatedItems.find(i => i.id === kpiId);
        if (targetItem) {
          poeCount = (targetItem.q1PoeDocs?.length || 0) + (targetItem.q2PoeDocs?.length || 0) + (targetItem.q3PoeDocs?.length || 0) + (targetItem.q4PoeDocs?.length || 0) + (targetItem.annualPoeDocs?.length || 0) + (targetItem.midtermPoeDocs?.length || 0);
        }

        const submissionRecipients = [
          { email: managerEmail, name: managerName },
          { email: submitterEmail, name: submitterName }
        ];

        for (const rec of submissionRecipients) {
          await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notification: {
                senderEmail: submitterEmail,
                senderName: submitterName,
                recipientEmail: rec.email,
                recipientName: rec.name,
                title: `⚡ PoE Submitted for KPI #${targetItem?.kpiNo || kpiId} by ${submitterName}`,
                message: `${submitterName} (${submitterEmail}) submitted KPI #${targetItem?.kpiNo || ''}: "${targetItem?.kpi || ''}" with ${poeCount} attached PoE document(s) for manager review (${managerName}).`,
                actionType: 'submission',
                senderCapacity: isManagerOfAnyone ? (isTeamEvaluation ? 'team_lead' : 'manager_as_self') : 'standard_user',
                kpiId,
                kpiIds: [kpiId],
                kpiNo: targetItem?.kpiNo || '',
                poeDocsCount: poeCount,
                employeeEmail: submitterEmail
              }
            })
          });
        }

        // When team leader reports on team evaluation, notify each team member as per the performance agreement
        if (isTeamEvaluation) {
          try {
            const teamRepRes = await fetch(`/api/tenant/${activeTenantId}/team-reporting?documentIdSuffix=all`);
            if (teamRepRes.ok) {
              const repData = await teamRepRes.json();
              const membersMap = new Map<string, { name: string; email: string }>();
              (repData.reports || []).forEach((r: any) => {
                (r.notifiedMembers || []).forEach((m: any) => {
                  if (m && m.email && m.email.includes('@') && m.email.toLowerCase() !== submitterEmail.toLowerCase()) {
                    membersMap.set(m.email.toLowerCase(), { name: m.name || m.email, email: m.email.toLowerCase() });
                  }
                });
              });

              for (const member of Array.from(membersMap.values())) {
                await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    notification: {
                      senderEmail: submitterEmail,
                      senderName: submitterName,
                      recipientEmail: member.email,
                      recipientName: member.name,
                      title: `⚡ Team Deliverables Reported: KPI #${targetItem?.kpiNo || kpiId}`,
                      message: `Team Leader ${submitterName} has reported quarterly deliverables and submitted PoE for Team KPI #${targetItem?.kpiNo || ''}: "${targetItem?.kpi || ''}". As a member of this team performance agreement, this update is registered to your profile.`,
                      actionType: 'team_reporting',
                      kpiId,
                      kpiNo: targetItem?.kpiNo || '',
                      poeDocsCount: poeCount
                    }
                  })
                });
              }
            }
          } catch (teamNotifErr) {
            console.warn("Failed to notify team members for evaluation reporting:", teamNotifErr);
          }
        }
      }
      
      setPplanData(payload);
      setSelectedKpiIdFilter(null);
      window.dispatchEvent(new CustomEvent(isTeamEvaluation ? 'team-pplan-updated' : 'pplan-updated', { detail: { tenantId: activeTenantId, userId: currentUser.email } }));
      if (submitForReview) {
        alert(`KPI evaluation and uploaded PoE documents successfully submitted to manager (${metadata.manager || 'Yena Khuboni'})! Notification sent.`);
      } else {
        alert(`Fields pushed to ${isTeamEvaluation ? 'Team Performance Planner Grid' : 'Annual Performance Planner Grid'} successfully! Notification sent.`);
      }
    } catch (e) {
      console.error(e);
      alert("Error saving: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleBatchSubmitSelectedKpis = async (targetIds: string[], submitForReview = true) => {
    if (!targetIds || targetIds.length === 0) {
      alert("Please select at least one KPI to submit.");
      return;
    }
    if (submitForReview) {
      for (const kId of targetIds) {
        const item = pplanData.items.find((i: any) => i.id === kId);
        const docsCount = item ? ((item.q1PoeDocs?.length || 0) + (item.q2PoeDocs?.length || 0) + (item.q3PoeDocs?.length || 0) + (item.q4PoeDocs?.length || 0) + (item.annualPoeDocs?.length || 0) + (item.midtermPoeDocs?.length || 0)) : 0;
        const hasActualOrScore = item && (
          (item.q1Actual && String(item.q1Actual).trim() !== '' && String(item.q1Actual).trim().toUpperCase() !== 'N/A') ||
          (item.q2Actual && String(item.q2Actual).trim() !== '' && String(item.q2Actual).trim().toUpperCase() !== 'N/A') ||
          (item.q3Actual && String(item.q3Actual).trim() !== '' && String(item.q3Actual).trim().toUpperCase() !== 'N/A') ||
          (item.q4Actual && String(item.q4Actual).trim() !== '' && String(item.q4Actual).trim().toUpperCase() !== 'N/A') ||
          (item.midtermActual && String(item.midtermActual).trim() !== '' && String(item.midtermActual).trim().toUpperCase() !== 'N/A') ||
          (item.annualActual && String(item.annualActual).trim() !== '' && String(item.annualActual).trim().toUpperCase() !== 'N/A') ||
          item.poeFileName ||
          item.poeFileBase64
        );
        if (docsCount === 0 && !hasActualOrScore) {
          alert(`Portfolio of Evidence (PoE) and/or quarterly actuals are MANDATORY prior to submitting KPI #${item?.kpiNo || kId} for manager review! Please attach a PoE document or capture your actual performance first.`);
          return;
        }
      }
    }
    setSaving(true);
    try {
      const isDemoUser = (currentUser.email || '').toLowerCase() === 'user@mzansiflow.co.za';
      const userEmailForBatch = (pplanData.metadata?.email || currentUser.email || '').toLowerCase().trim();
      const isShabanguUser = userEmailForBatch.includes('shabangusm');
      const isLinksReportUser = userEmailForBatch === 'joubertm@nkangaladm.gov.za' || userEmailForBatch === 'tloujmt@nkangaladm.gov.za';
      const isSinghSubUser = ['marxc@nkangaladm.gov.za', 'nakapm@nkangaladm.gov.za', 'rachidimb@nkangaladm.gov.za', 'mokhabelagg@nkangaladm.gov.za'].includes(userEmailForBatch) || userEmailForBatch.includes('marxc') || userEmailForBatch.includes('nakapm') || userEmailForBatch.includes('rachidimb') || userEmailForBatch.includes('mokhabelagg');
      const defaultMgrName = isSinghSubUser ? 'Nirisha Singh' : (isLinksReportUser ? 'Solly Links' : (isShabanguUser ? 'Mandla L. Mahlangu' : (isDemoUser ? 'Demo Line Manager' : 'Yena Khuboni')));
      const defaultMgrEmail = isSinghSubUser ? 'singhn@nkangaladm.gov.za' : (isLinksReportUser ? 'linkss@nkangaladm.gov.za' : (isShabanguUser ? 'mahlanguml@nkangaladm.gov.za' : (isDemoUser ? 'manager@mzansiflow.co.za' : 'KhuboniY@nkangaladm.gov.za')));
      const metadata = { 
        ...pplanData.metadata,
        email: pplanData.metadata?.email || currentUser.email,
        manager: isSinghSubUser ? 'Nirisha Singh' : (isLinksReportUser ? 'Solly Links' : (isShabanguUser ? 'Mandla L. Mahlangu' : (currentUser.manager || pplanData.metadata?.manager || defaultMgrName))),
        managerEmail: isSinghSubUser ? 'singhn@nkangaladm.gov.za' : (isLinksReportUser ? 'linkss@nkangaladm.gov.za' : (isShabanguUser ? 'mahlanguml@nkangaladm.gov.za' : (currentUser.managerEmail || pplanData.metadata?.managerEmail || defaultMgrEmail))),
        reportTo: isSinghSubUser ? 'Nirisha Singh' : (isLinksReportUser ? 'Solly Links' : (isShabanguUser ? 'Mandla L. Mahlangu' : (currentUser.reportTo || pplanData.metadata?.reportTo || currentUser.manager || (isDemoUser ? 'Demo Line Manager' : '')))),
        reviewStatus: submitForReview ? 'Submitted for Approval' : (pplanData.metadata?.reviewStatus || 'Draft'),
        _isFredExtracted: true,
        _authoritativePoeUpdate: true,
        ...(submitForReview ? {
          submittedKpiIds: Array.from(new Set([...(pplanData.metadata?.submittedKpiIds || []), ...targetIds])),
          lastSubmittedKpiId: undefined
        } : {})
      };

      const submittedItems = pplanData.items.filter(it => targetIds.includes(it.id));
      const kpiNosText = submittedItems.map(i => `#${i.kpiNo || i.id}`).join(', ');

      const updatedItems = pplanData.items.map(item => {
        if (targetIds.includes(item.id)) {
          const cleanVal = (val: string) => {
            if (!val) return '';
            const tokens = val.split(/(?:Q1:|Q2:|Q3:|Q4:|midterm:|annual:|\n|\r)/gi);
            const cleanPieces = tokens
              .map(t => t.trim())
              .filter(t => t.length > 0 && !t.match(/^(?:Q\d|midterm|annual)$/i));
            return cleanPieces.length > 0 ? cleanPieces[0] : '';
          };
          const q1Text = cleanVal(item.q1Poe);
          const q2Text = cleanVal(item.q2Poe);
          const q3Text = cleanVal(item.q3Poe);
          const q4Text = cleanVal(item.q4Poe);
          const aggregatePoe = [
            q1Text ? `Q1: ${q1Text}` : '',
            q2Text ? `Q2: ${q2Text}` : '',
            q3Text ? `Q3: ${q3Text}` : '',
            q4Text ? `Q4: ${q4Text}` : ''
          ].filter(Boolean).join('\n');

          const docs = [...(item.q1PoeDocs || []), ...(item.q2PoeDocs || []), ...(item.q3PoeDocs || []), ...(item.q4PoeDocs || []), ...(item.annualPoeDocs || []), ...(item.midtermPoeDocs || [])];
          const firstDoc = docs[0];

          return {
            ...item,
            reviewStatus: submitForReview ? 'Submitted for Approval' : (item.reviewStatus || 'Draft'),
            poe: aggregatePoe || item.poe,
            poeFileBase64: undefined,
            poeFileName: firstDoc ? firstDoc.name : ''
          };
        }
        return item;
      });

      const payload = {
        metadata,
        items: updatedItems
      };

      const pplanRes = await fetch(`/api/tenant/${activeTenantId}/${saveApiEndpoint}?userId=${encodeURIComponent(currentUser.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!pplanRes.ok) {
        throw new Error("Failed to save. Status: " + pplanRes.status + " " + pplanRes.statusText);
      }

      setPplanData(payload);
      setSelectedKpiIds([]);
      window.dispatchEvent(new CustomEvent(isTeamEvaluation ? 'team-pplan-updated' : 'pplan-updated', { detail: { tenantId: activeTenantId, userId: currentUser.email } }));

      if (submitForReview) {
        try {
          const isShabanguUser = (currentUser.email || '').toLowerCase().includes('shabangusm');
          const managerEmail = isShabanguUser ? 'mahlanguml@nkangaladm.gov.za' : (metadata.managerEmail || 'KhuboniY@nkangaladm.gov.za');
          const managerName = isShabanguUser ? 'Mandla L. Mahlangu' : (metadata.manager || 'Manager');
          const submitterEmail = currentUser.email;
          const submitterName = currentUser.fullName || currentUser.email.split('@')[0] || 'Employee';

          const batchRecipients = [
            { email: managerEmail, name: managerName },
            { email: submitterEmail, name: submitterName }
          ];

          for (const rec of batchRecipients) {
            await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                notification: {
                  senderEmail: submitterEmail,
                  senderName: submitterName,
                  recipientEmail: rec.email,
                  recipientName: rec.name,
                  title: targetIds.length === 1 ? `⚡ PoE Submitted for KPI ${kpiNosText} by ${submitterName}` : `⚡ PoE Submitted for ${targetIds.length} KPIs (${kpiNosText}) by ${submitterName}`,
                  message: targetIds.length === 1 
                    ? `${submitterName} (${submitterEmail}) submitted KPI ${kpiNosText} and associated Portfolio of Evidence for manager review (${managerName}).`
                    : `${submitterName} (${submitterEmail}) submitted ${targetIds.length} KPIs (${kpiNosText}) and associated Portfolios of Evidence for manager review (${managerName}).`,
                  actionType: 'submission',
                  kpiId: targetIds[0],
                  kpiIds: targetIds,
                  kpiNo: kpiNosText,
                  senderCapacity: 'standard_user',
                  employeeEmail: submitterEmail
                }
              })
            });
          }
        } catch(e) {
          console.warn("Failed to dispatch workflow notification", e);
        }
      }

      alert(targetIds.length === 1 
        ? `Single KPI (${kpiNosText}) successfully submitted to manager (${metadata.manager})! Notification sent.` 
        : `Selected ${targetIds.length} KPIs (${kpiNosText}) successfully submitted to manager (${metadata.manager})! Notification sent.`
      );
    } catch (e) {
      console.error(e);
      alert("Error submitting KPIs: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleClearAllKpis = async () => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently clear all KPIs in this performance plan? This action CANNOT be undone and will be saved persistently to the database.")) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        metadata: {
          ...pplanData.metadata,
          reviewStatus: 'Draft'
        },
        items: []
      };
      const pplanRes = await fetch(`/api/tenant/${activeTenantId}/${saveApiEndpoint}?userId=${encodeURIComponent(currentUser.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!pplanRes.ok) {
        throw new Error("Failed to save. Status: " + pplanRes.status + " " + pplanRes.statusText);
      }
      if (true) {
        setPplanData(payload);
        window.dispatchEvent(new CustomEvent(isTeamEvaluation ? 'team-pplan-updated' : 'pplan-updated', { detail: { tenantId: activeTenantId, userId: currentUser.email } }));
        setToastMessage({
          text: `All KPIs have been successfully and persistently cleared from this ${isTeamEvaluation ? 'team performance plan' : 'performance plan'}.`,
          type: "success"
        });
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

  const handleRedoSelfEvaluation = async () => {
    setSaving(true);
    try {
      const metadata = { 
        ...pplanData.metadata,
        reviewStatus: 'Draft',
        submittedKpiIds: [],
        lastSubmittedKpiId: undefined
      };

      const updatedItems = pplanData.items.map(item => ({
        ...item,
        reviewStatus: 'Draft',
        q1PoeStatus: 'Draft',
        q2PoeStatus: 'Draft',
        q3PoeStatus: 'Draft',
        q4PoeStatus: 'Draft',
        annualPoeStatus: 'Draft',
        midtermPoeStatus: 'Draft'
      }));

      const payload = {
        metadata,
        items: updatedItems
      };

      const pplanRes = await fetch(`/api/tenant/${activeTenantId}/${saveApiEndpoint}?userId=${encodeURIComponent(currentUser.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!pplanRes.ok) {
        throw new Error("Failed to save. Status: " + pplanRes.status + " " + pplanRes.statusText);
      }

      setPplanData(payload);
      window.dispatchEvent(new CustomEvent(isTeamEvaluation ? 'team-pplan-updated' : 'pplan-updated', { detail: { tenantId: activeTenantId, userId: currentUser.email } }));
      setToastMessage({
        text: isTeamEvaluation
          ? "Team evaluation unlocked! You can now edit quarterly actuals, upload or replace Portfolios of Evidence (PoE), and click 'Push to Manager for Approval' when ready."
          : "Self-evaluation unlocked! You can now edit quarterly actuals, upload or replace Portfolios of Evidence (PoE), and click 'Push to Manager for Approval' when ready.",
        type: "success"
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
      setToastMessage({ text: "Error unlocking evaluation: " + String(e), type: "warning" });
    } finally {
      setSaving(false);
    }
  };

  const handleRedoKpi = async (kpiId: string) => {
    setSaving(true);
    try {
      const remainingSubmitted = Array.isArray(pplanData.metadata?.submittedKpiIds)
        ? pplanData.metadata.submittedKpiIds.filter((id: string) => id !== kpiId)
        : [];
      const metadata = { 
        ...pplanData.metadata,
        reviewStatus: remainingSubmitted.length > 0 ? pplanData.metadata?.reviewStatus : 'Draft',
        submittedKpiIds: remainingSubmitted
      };

      const targetItem = pplanData.items.find(i => i.id === kpiId);

      const updatedItems = pplanData.items.map(item => {
        if (item.id === kpiId) {
          return {
            ...item,
            reviewStatus: 'Draft',
            q1PoeStatus: 'Draft',
            q2PoeStatus: 'Draft',
            q3PoeStatus: 'Draft',
            q4PoeStatus: 'Draft',
            annualPoeStatus: 'Draft',
            midtermPoeStatus: 'Draft'
          };
        }
        return item;
      });

      const payload = {
        metadata,
        items: updatedItems
      };

      const pplanRes = await fetch(`/api/tenant/${activeTenantId}/${saveApiEndpoint}?userId=${encodeURIComponent(currentUser.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!pplanRes.ok) {
        throw new Error("Failed to save. Status: " + pplanRes.status + " " + pplanRes.statusText);
      }

      setPplanData(payload);
      window.dispatchEvent(new CustomEvent(isTeamEvaluation ? 'team-pplan-updated' : 'pplan-updated', { detail: { tenantId: activeTenantId, userId: currentUser.email } }));
      setToastMessage({
        text: `KPI #${targetItem?.kpiNo || kpiId} unlocked for resubmission! You can now update actuals, upload/replace PoE files, and click 'Push to Manager for Approval'.`,
        type: "success"
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
      setToastMessage({ text: "Error unlocking KPI: " + String(e), type: "warning" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (submitForReview = false) => {
    if (submitForReview && selectedKpiIds.length === 0) {
      alert("Please select at least one KPI using the checkboxes next to each KPI to submit for review.");
      return;
    }
    setSaving(true);
    try {
      const isDemoUser = (currentUser.email || '').toLowerCase() === 'user@mzansiflow.co.za';
      const userEmailForMgr = (pplanData.metadata?.email || currentUser.email || '').toLowerCase().trim();
      let resolvedMgr = {
        manager: pplanData.metadata?.manager || currentUser.manager || currentUser.reportTo || (isDemoUser ? 'Demo Line Manager' : 'Yena Khuboni'),
        managerEmail: pplanData.metadata?.managerEmail || currentUser.managerEmail || (isDemoUser ? 'manager@mzansiflow.co.za' : 'KhuboniY@nkangaladm.gov.za'),
        reportTo: pplanData.metadata?.reportTo || currentUser.reportTo || currentUser.manager || (isDemoUser ? 'Demo Line Manager' : '')
      };
      if (['marxc@nkangaladm.gov.za', 'nakapm@nkangaladm.gov.za', 'rachidimb@nkangaladm.gov.za', 'mokhabelagg@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('marxc') || userEmailForMgr.includes('nakapm') || userEmailForMgr.includes('rachidimb') || userEmailForMgr.includes('mokhabelagg')) {
        resolvedMgr = { manager: 'Nirisha Singh', managerEmail: 'singhn@nkangaladm.gov.za', reportTo: 'Nirisha Singh' };
      } else if (['matsebulan@nkangaladm.gov.za', 'mathenjwabh@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('matsebulan') || userEmailForMgr.includes('mathenjwabh')) {
        resolvedMgr = { manager: 'Marianne Joubert', managerEmail: 'joubertm@nkangaladm.gov.za', reportTo: 'Marianne Joubert' };
      } else if (['giyasi-affulph@nkangaladm.gov.za', 'sibanyonimj@nkangaladm.gov.za', 'singorl@nkangaladm.gov.za', 'mangenart@nkangaladm.gov.za', 'mbulawan@nkangaladm.gov.za', 'mkhabelanc@nkangaladm.gov.za', 'mpanzal@nkangaladm.gov.za', 'mtswenism@nkangaladm.gov.za'].includes(userEmailForMgr)) {
        resolvedMgr = { manager: 'Alfred S. Magampe', managerEmail: 'magampeas@nkangaladm.gov.za', reportTo: 'Alfred S. Magampe' };
      } else if (['nkosiwm@nkangaladm.gov.za', 'mochitelaso@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('nkosiwm') || userEmailForMgr.includes('mochitelaso')) {
        resolvedMgr = { manager: 'Yolanda Segami', managerEmail: 'segamiy@nkangaladm.gov.za', reportTo: 'Yolanda Segami' };
      } else if (['rakauj@nkangaladm.gov.za', 'gakwamf@nkangaladm.gov.za', 'mahlangude@nkangaladm.gov.za', 'mankopanamm@nkangaladm.gov.za', 'moepis@nkangaladm.gov.za', 'molefeki@nkangaladm.gov.za', 'mthimunyepm@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('rakauj') || userEmailForMgr.includes('gakwamf') || userEmailForMgr.includes('mahlangude') || userEmailForMgr.includes('mankopanamm') || userEmailForMgr.includes('moepis') || userEmailForMgr.includes('molefeki') || userEmailForMgr.includes('mthimunye')) {
        resolvedMgr = { manager: 'Johannes MT. Tlou', managerEmail: 'tloujmt@nkangaladm.gov.za', reportTo: 'Johannes MT. Tlou' };
      } else if (['dlaminiss@nkangaladm.gov.za', 'khozahf@nkangaladm.gov.za', 'mafodim@nkangaladm.gov.za', 'mashilesm@nkangaladm.gov.za', 'moreroaml@nkangaladm.gov.za', 'thumbathiamd@nkangaladm.gov.za', 'mthethwanm@nkangaladm.gov.za'].includes(userEmailForMgr) || userEmailForMgr.includes('dlaminiss') || userEmailForMgr.includes('khozahf') || userEmailForMgr.includes('mafodim') || userEmailForMgr.includes('mashilesm') || userEmailForMgr.includes('moreroaml') || userEmailForMgr.includes('thumbathi') || userEmailForMgr.includes('mthethwa')) {
        resolvedMgr = { manager: 'Priscilla Fenyane', managerEmail: 'fenyanep@nkangaladm.gov.za', reportTo: 'Priscilla Fenyane' };
      } else if (userEmailForMgr.includes('shabangusm') || userEmailForMgr.includes('shabangugm')) {
        resolvedMgr = { manager: 'Mandla L. Mahlangu', managerEmail: 'mahlanguml@nkangaladm.gov.za', reportTo: 'Mandla L. Mahlangu' };
      }

      const metadata = { 
        ...pplanData.metadata,
        email: pplanData.metadata?.email || currentUser.email,
        manager: resolvedMgr.manager,
        managerEmail: resolvedMgr.managerEmail,
        reportTo: resolvedMgr.reportTo
      };
      if (submitForReview) {
        for (const kId of selectedKpiIds) {
          const item = pplanData.items.find((i: any) => i.id === kId);
          const docsCount = item ? ((item.q1PoeDocs?.length || 0) + (item.q2PoeDocs?.length || 0) + (item.q3PoeDocs?.length || 0) + (item.q4PoeDocs?.length || 0) + (item.annualPoeDocs?.length || 0) + (item.midtermPoeDocs?.length || 0)) : 0;
          const hasActualOrScore = item && (
            (item.q1Actual && String(item.q1Actual).trim() !== '' && String(item.q1Actual).trim().toUpperCase() !== 'N/A') ||
            (item.q2Actual && String(item.q2Actual).trim() !== '' && String(item.q2Actual).trim().toUpperCase() !== 'N/A') ||
            (item.q3Actual && String(item.q3Actual).trim() !== '' && String(item.q3Actual).trim().toUpperCase() !== 'N/A') ||
            (item.q4Actual && String(item.q4Actual).trim() !== '' && String(item.q4Actual).trim().toUpperCase() !== 'N/A') ||
            (item.midtermActual && String(item.midtermActual).trim() !== '' && String(item.midtermActual).trim().toUpperCase() !== 'N/A') ||
            (item.annualActual && String(item.annualActual).trim() !== '' && String(item.annualActual).trim().toUpperCase() !== 'N/A') ||
            item.poeFileName ||
            item.poeFileBase64
          );
          if (docsCount === 0 && !hasActualOrScore) {
            alert(`Portfolio of Evidence (PoE) and/or quarterly actuals are MANDATORY prior to submitting KPI #${item?.kpiNo || kId} for manager review! Please attach a PoE document or capture your actual performance first.`);
            setSaving(false);
            return;
          }
        }
        metadata.reviewStatus = 'Submitted for Approval';
      } else if (!metadata.reviewStatus) {
        metadata.reviewStatus = 'Draft';
      }

      let submittedIds: string[] = [];

      // Automatically construct the aggregated 'poe' string based on quarterly portfolios
      const updatedItems = pplanData.items.map(item => {
        const cleanVal = (val: string) => {
          if (!val) return '';
          const tokens = val.split(/(?:Q1:|Q2:|Q3:|Q4:|midterm:|annual:|\n|\r)/gi);
          const cleanPieces = tokens
            .map(t => t.trim())
            .filter(t => t.length > 0 && !t.match(/^(?:Q\d|midterm|annual)$/i));
          return cleanPieces.length > 0 ? cleanPieces[0] : '';
        };
        const q1Text = cleanVal(item.q1Poe);
        const q2Text = cleanVal(item.q2Poe);
        const q3Text = cleanVal(item.q3Poe);
        const q4Text = cleanVal(item.q4Poe);
        const aggregatePoe = [
          q1Text ? `Q1: ${q1Text}` : '',
          q2Text ? `Q2: ${q2Text}` : '',
          q3Text ? `Q3: ${q3Text}` : '',
          q4Text ? `Q4: ${q4Text}` : ''
        ].filter(Boolean).join('\n');

        const docs = [...(item.q1PoeDocs || []), ...(item.q2PoeDocs || []), ...(item.q3PoeDocs || []), ...(item.q4PoeDocs || []), ...(item.annualPoeDocs || []), ...(item.midtermPoeDocs || [])];
        const firstDoc = docs[0];

        const qScores = [item.q1Score, item.q2Score, item.midtermScore, item.q3Score, item.q4Score]
          .map(s => parseFloat(s))
          .filter(s => !isNaN(s) && s > 0);
        const resolvedMyScore = (item.myScore && item.myScore !== 'N/A' && item.myScore !== '')
          ? item.myScore
          : (qScores.length > 0 ? (qScores.reduce((a, b) => a + b, 0) / qScores.length).toFixed(1) : '');

        const shouldSubmitItem = submitForReview && selectedKpiIds.includes(item.id);
        const nextStatus = shouldSubmitItem ? 'Submitted for Approval' : (item.reviewStatus || 'Draft');

        if (nextStatus === 'Submitted for Approval' || nextStatus === 'Approved' || nextStatus === 'Reviewed') {
          submittedIds.push(item.id);
        }

        return {
          ...item,
          myScore: resolvedMyScore,
          reviewStatus: nextStatus,
          poe: aggregatePoe || item.poe,
          poeFileBase64: undefined,
          poeFileName: firstDoc ? firstDoc.name : ''
        };
      });

      metadata._authoritativePoeUpdate = true;
      if (submitForReview) {
        metadata.submittedKpiIds = Array.from(new Set(submittedIds));
        metadata.lastSubmittedKpiId = submittedIds.length === 1 ? submittedIds[0] : undefined;
      } else if (submittedIds.length === 0) {
        metadata.submittedKpiIds = [];
        metadata.reviewStatus = 'Draft';
      }

      const payload = {
        metadata,
        items: updatedItems
      };

      const pplanRes = await fetch(`/api/tenant/${activeTenantId}/${saveApiEndpoint}?userId=${encodeURIComponent(currentUser.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!pplanRes.ok) {
        throw new Error("Failed to save. Status: " + pplanRes.status + " " + pplanRes.statusText);
      }

      setPplanData(payload);
      setSelectedKpiIds([]);
      window.dispatchEvent(new CustomEvent(isTeamEvaluation ? 'team-pplan-updated' : 'pplan-updated', { detail: { tenantId: activeTenantId, userId: currentUser.email } }));
      
      if (submitForReview) {
        try {
          const notifPayload = {
            action: 'send_notification',
            notification: {
              senderEmail: currentUser.email,
              senderName: currentUser.fullName || currentUser.email.split('@')[0] || 'Employee',
              recipientEmail: (currentUser.email || '').toLowerCase().includes('shabangusm') ? 'mahlanguml@nkangaladm.gov.za' : (metadata.managerEmail || 'KhuboniY@nkangaladm.gov.za'),
              recipientName: (currentUser.email || '').toLowerCase().includes('shabangusm') ? 'Mandla L. Mahlangu' : (metadata.manager || 'Manager'),
              title: isTeamEvaluation ? `Complete Team Performance Plan Submitted for Review` : `Complete Performance Plan Submitted for Review`,
              message: isTeamEvaluation
                ? `I have submitted the complete Team Performance Plan and associated Portfolios of Evidence for your review and approval.`
                : `I have submitted my complete Performance Plan and associated Portfolios of Evidence for your review and approval.`,
              actionType: 'submission',
              senderCapacity: isTeamEvaluation ? 'team_lead' : 'standard_user'
            }
          };
          await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifPayload)
          });
        } catch(e) {
          console.warn("Failed to dispatch workflow notification", e);
        }
      }

      if (submitForReview) {
        alert(`${isTeamEvaluation ? 'Team evaluation' : 'Evaluation'} successfully committed and submitted to your manager (${metadata.manager || 'Yena Khuboni'})! High-priority review notification sent.`);
      } else {
        alert(`${isTeamEvaluation ? 'Team evaluation' : 'Evaluation'} draft saved successfully! All quarterly metrics, actuals, comments, and portfolios of evidence are updated in the ${isTeamEvaluation ? 'Team Performance Planner Grid' : 'Annual Performance Planner Grid'}. Notification sent.`);
      }
    } catch (e) {
      console.error(e);
      alert("Error saving evaluation: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-50 text-slate-600 p-8 rounded-3xl border border-gray-200">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
      </div>
    );
  }

  const { items, metadata } = pplanData;
  const isReadOnly = Boolean(readOnly);

  return (
    <div id="self-evaluation-dashboard" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-stone-900">
      {isReadOnly && (
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-indigo-700 shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
              🔒 Read-Only Live Mirror
            </span>
            <span className="text-xs font-bold text-indigo-100">
              Viewing <strong className="text-white">{currentUser?.fullName || 'Nompumelelo Nsibande'} ({currentUser?.email})</strong> — PMS Team Performance Plan & Self-Evaluation. Your own profile records remain 100% separate.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-indigo-200 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-700">
              Last Synced: {lastSyncedAt} (Auto-Refreshes Live)
            </span>
            <button
              type="button"
              onClick={() => fetchMyPlan(false)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider border border-white/20 transition cursor-pointer"
            >
              ↻ Sync Now
            </button>
          </div>
        </div>
      )}
      <div className="px-6 py-6 pb-4 bg-white border-b border-gray-250 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 relative z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileSignature className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            {headingTitle}
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1.5 ml-[52px]">
            {subTitle}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2 ${metadata.reviewStatus === 'Reviewed' ? 'bg-emerald-600' : metadata.reviewStatus === 'Submitted for Approval' ? 'bg-amber-500' : 'bg-slate-500'}`}>
            <span>Global PA Status:</span>
            <span>{metadata.reviewStatus || 'Draft'}</span>
          </div>

          {!isReadOnly && (
            <>
              <button 
                type="button"
                onClick={() => setShowClearKpiModal(true)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>📋 See / Clear KPIs</span>
              </button>

              <button 
                type="button"
                onClick={handleRedoSelfEvaluation}
                disabled={saving}
                className="bg-amber-600 text-white hover:bg-amber-500 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 shadow-sm cursor-pointer"
                title="Re-open evaluation to update quarterly actuals, upload new/additional Portfolios of Evidence (PoE), and resubmit to manager"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{isTeamEvaluation ? 'Redo & Resubmit Team Evaluation' : 'Redo & Resubmit Self-Evaluation'}</span>
              </button>

              <button 
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>{isTeamEvaluation ? 'Push to Team Performance Planner Grid' : 'Push to Annual Performance Planner Grid'}</span>
              </button>
              <button 
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Push to Manager for Approval</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Phase Navigation Bar for Evaluation Module */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 shadow-xs">
        <button
          type="button"
          onClick={() => setEvalPhase('kpi_self')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
            evalPhase === 'kpi_self' 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{isTeamEvaluation ? '1. KPI Team Evaluation' : '1. KPI Self Evaluation'}</span>
        </button>

        <button
          type="button"
          onClick={() => setEvalPhase('jsc_self')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
            evalPhase === 'jsc_self' 
              ? 'bg-orange-600 text-white shadow-sm' 
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          <FileBadge className="w-4 h-4" />
          <span>{isTeamEvaluation ? '2. JSC Team Evaluation' : '2. JSC Self Evaluation'}</span>
        </button>

        <button
          type="button"
          onClick={() => setEvalPhase('cc_self')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
            evalPhase === 'cc_self' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>3. Core Competencies Self Evaluation</span>
        </button>

        <button
          type="button"
          onClick={() => setEvalPhase('jsc_reporting')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
            evalPhase === 'jsc_reporting' 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileBarChart className="w-4 h-4" />
          <span>4. JSC Analytical Reporting</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-6">
        {/* Toast confirmation banner */}
        {toastMessage && (
          <div className={`p-4 rounded-2xl shadow-lg border flex items-start justify-between gap-3 transition ${
            toastMessage.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-amber-900 text-white border-amber-700'
          }`}>
            <div className="flex items-center gap-3">
              {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
              <p className="text-xs font-bold leading-relaxed">{toastMessage.text}</p>
            </div>
            <button 
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-white/70 hover:text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {evalPhase === 'jsc_self' ? (
          <div className="max-w-5xl mx-auto">
            <JSCSelfEvaluationSection currentUser={currentUser} activeTenantId={activeTenantId} isTeamJSC={isTeamEvaluation} />
          </div>
        ) : evalPhase === 'cc_self' ? (
          <div className="max-w-6xl mx-auto">
            <CoreCompetenciesSelfEvaluation currentUser={currentUser} activeTenantId={activeTenantId} isTeamEvaluation={isTeamEvaluation} />
          </div>
        ) : evalPhase === 'jsc_reporting' ? (
          <div className="max-w-5xl mx-auto">
            <JSCAnalyticalReportingSection currentUser={currentUser} activeTenantId={activeTenantId} isTeamJSC={isTeamEvaluation} />
          </div>
        ) : (
          <>

        {/* Employee Performance & Review Inbox */}
        <div className="max-w-5xl mx-auto">
          <IPMSWorkflowInbox
            role="employee"
            currentUser={currentUser}
            activeTenantId={activeTenantId}
            onSelectUserPlan={(targetUserEmail, kpiId, quarter) => {
              if (kpiId) {
                setSelectedKpiIdFilter(kpiId);
                if (quarter) {
                  setActiveTabs(prev => ({ ...prev, [kpiId]: quarter.toLowerCase() }));
                }
                setTimeout(() => {
                  const el = document.getElementById(`kpi-card-${kpiId}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-4', 'ring-indigo-500', 'transition-all');
                    setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-500'), 3000);
                  }
                }, 150);
              }
            }}
          />
        </div>

        {(!items || items.length === 0) ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-bold uppercase">{isTeamEvaluation ? 'No KPIs found in your Team Performance Plan' : 'No KPIs found in your Performance Plan'}</p>
            <p className="text-slate-400 text-[10px] mt-1">{isTeamEvaluation ? 'Visit the Team Performance Plan module to setup your active plan list first.' : 'Visit the Performance Agreement module to setup your active plan list first.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Progress Tracking */}
            {(() => {
              let q1Total = 0, q2Total = 0, q3Total = 0, q4Total = 0, midtermTotal = 0, annualTotal = 0;
              let count = items.length;
              if (count > 0) {
                items.forEach(kpi => {
                  q1Total += calculateProgressPercentage(kpi.q1Target, kpi.q1Actual);
                  q2Total += calculateProgressPercentage(kpi.q2Target, kpi.q2Actual);
                  q3Total += calculateProgressPercentage(kpi.q3Target, kpi.q3Actual);
                  q4Total += calculateProgressPercentage(kpi.q4Target, kpi.q4Actual);
                  midtermTotal += calculateProgressPercentage(kpi.midtermTarget, kpi.midtermActual);
                  annualTotal += calculateProgressPercentage(kpi.annualTarget, kpi.annualActual);
                });
              }

              const renderProgress = (label: string, percentage: number, colorText: string, colorBg: string) => (
                <div className="flex-1 min-w-[150px] bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-center gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{label}</span>
                    <span className={`text-[10px] font-black ${colorText}`}>{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${colorBg}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );

              return (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Overall Progress Tracking</h3>
                  <div className="flex flex-wrap gap-3">
                    {renderProgress("Q1 Progress", count > 0 ? Math.round(q1Total / count) : 0, "text-sky-600", "bg-sky-500")}
                    {renderProgress("Q2 Progress", count > 0 ? Math.round(q2Total / count) : 0, "text-indigo-600", "bg-indigo-500")}
                    {renderProgress("Midterm Progress", count > 0 ? Math.round(midtermTotal / count) : 0, "text-amber-600", "bg-amber-500")}
                    {renderProgress("Q3 Progress", count > 0 ? Math.round(q3Total / count) : 0, "text-fuchsia-600", "bg-fuchsia-500")}
                    {renderProgress("Q4 Progress", count > 0 ? Math.round(q4Total / count) : 0, "text-rose-600", "bg-rose-500")}
                    {renderProgress("Annual Progress", count > 0 ? Math.round(annualTotal / count) : 0, "text-emerald-600", "bg-emerald-500")}
                  </div>
                </div>
              );
            })()}

            {/* Selection & Multi-KPI Submission Toolbar */}
            {!isReadOnly && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAllKpis}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 font-bold text-xs cursor-pointer transition"
                  >
                    {selectedKpiIds.length === items.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{selectedKpiIds.length === items.length ? 'Deselect All' : 'Select All KPIs'}</span>
                  </button>

                  <span className="text-xs text-slate-500 font-bold">
                    {selectedKpiIds.length} of {items.length} KPI(s) selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedKpiIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleBatchSubmitSelectedKpis(selectedKpiIds, true)}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit {selectedKpiIds.length} Selected KPI(s) to Manager</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert("Please check the checkbox next to the KPI card(s) you wish to submit.")}
                      className="bg-slate-300 text-slate-500 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 border border-slate-200 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-slate-400" />
                      <span>Select KPIs via Checkbox to Submit</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedKpiIdFilter && (
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between text-xs text-indigo-900 shadow-sm animate-fade-in mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping shrink-0" />
                  <span>Currently filtered to active KPI submission:</span>
                  <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded text-indigo-700 font-extrabold text-[10px]">
                    KPI #{items.find(i => String(i.id) === String(selectedKpiIdFilter))?.kpiNo || selectedKpiIdFilter}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedKpiIdFilter(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-3 py-1.5 rounded-xl text-[9px] uppercase tracking-wider transition cursor-pointer border-0"
                >
                  Show Complete Performance Plan
                </button>
              </div>
            )}

            {(() => {
              const visibleItems = selectedKpiIdFilter 
                ? items.filter(kpi => String(kpi.id) === String(selectedKpiIdFilter))
                : items;
              const renderList = visibleItems.length > 0 ? visibleItems : items;

              return renderList.map((kpi, idx) => {
                const currentTab = activeTabs[kpi.id] || 'q1';
                const setTab = (tab: string) => {
                  setActiveTabs(prev => ({ ...prev, [kpi.id]: tab }));
                };
                const isUnrestricted = isUserUnrestricted(currentUser);
                const kpiDocsCount = (kpi.q1PoeDocs?.length || 0) + (kpi.q2PoeDocs?.length || 0) + (kpi.q3PoeDocs?.length || 0) + (kpi.q4PoeDocs?.length || 0) + (kpi.annualPoeDocs?.length || 0) + (kpi.midtermPoeDocs?.length || 0);
                const kpiHasEvidence = kpiDocsCount > 0 || Boolean(
                  kpi.poeFileBase64 ||
                  kpi.poeFileName ||
                  (kpi.q1Actual && String(kpi.q1Actual).trim() !== '' && String(kpi.q1Actual).trim().toUpperCase() !== 'N/A') ||
                  (kpi.q2Actual && String(kpi.q2Actual).trim() !== '' && String(kpi.q2Actual).trim().toUpperCase() !== 'N/A') ||
                  (kpi.q3Actual && String(kpi.q3Actual).trim() !== '' && String(kpi.q3Actual).trim().toUpperCase() !== 'N/A') ||
                  (kpi.q4Actual && String(kpi.q4Actual).trim() !== '' && String(kpi.q4Actual).trim().toUpperCase() !== 'N/A') ||
                  (kpi.midtermActual && String(kpi.midtermActual).trim() !== '' && String(kpi.midtermActual).trim().toUpperCase() !== 'N/A') ||
                  (kpi.annualActual && String(kpi.annualActual).trim() !== '' && String(kpi.annualActual).trim().toUpperCase() !== 'N/A')
                );
                const kpiIsReadOnly = isReadOnly || (!isUnrestricted && (
                  kpi.reviewStatus === 'Submitted for Approval' || 
                  kpi.reviewStatus === 'Reviewed' || 
                  kpi.reviewStatus === 'Approved'
                ));
                const isSelected = selectedKpiIds.includes(kpi.id);

                return (
                <div key={kpi.id} id={`kpi-card-${kpi.id}`} className={`bg-white p-5 rounded-2xl border ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'} shadow-sm flex flex-col gap-5 transition-all duration-300`}>
                  {/* Header metadata layout */}
                  <div className="flex flex-wrap justify-between items-start gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectKpi(kpi.id)}
                        className="p-1 rounded text-slate-600 hover:text-emerald-600 cursor-pointer"
                        title={isSelected ? 'Deselect KPI' : 'Select KPI for batch submission'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
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
                        <span className="bg-indigo-50 text-indigo-700 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                          mSCOA: {kpi.mscoaCode}
                        </span>
                      )}
                      
                      {/* Review Status Badging */}
                      {kpi.reviewStatus === 'Submitted for Approval' && kpiHasEvidence && (
                        <span className="bg-amber-500 text-white font-black text-[9.5px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          ⚡ Submitted to Manager
                        </span>
                      )}
                      {(kpi.reviewStatus === 'Revision Required' || kpi.q1PoeStatus === 'Revision Required' || kpi.q2PoeStatus === 'Revision Required' || kpi.q3PoeStatus === 'Revision Required' || kpi.q4PoeStatus === 'Revision Required') && (
                        <span className="bg-rose-600 text-white font-black text-[9.5px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
                          ⚠️ Revision Requested
                        </span>
                      )}
                      {(kpi.reviewStatus === 'Reviewed' || kpi.reviewStatus === 'Approved') && (
                        <span className="bg-emerald-600 text-white font-black text-[9.5px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          ✅ Verified & Approved
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isReadOnly && kpiIsReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleRedoKpi(kpi.id)}
                          disabled={saving}
                          className="font-bold px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 transition shadow-2xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                          title="Unlock this KPI to edit actuals or attach/replace PoE and resubmit"
                        >
                          <span>Unlock / Redo</span>
                        </button>
                      )}
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleBatchSubmitSelectedKpis([kpi.id], true)}
                          disabled={saving || kpiIsReadOnly}
                          className={`font-bold px-3 py-1 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition shadow-2xs ${
                            kpiIsReadOnly
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer'
                          }`}
                          title={kpiIsReadOnly ? "Already submitted or approved" : "Submit ONLY this single KPI and its attached PoE files for Manager approval"}
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>{kpiIsReadOnly ? 'Already Submitted' : `Submit Single KPI #${kpi.kpiNo || idx + 1}`}</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs font-black">
                        <span className="text-[10px] font-bold uppercase text-emerald-600/80">Weighting:</span>
                        <span>{kpi.weighting || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-sm text-slate-800 leading-snug">{kpi.kpi}</h3>
                    {kpi.strategicGoal && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[10.5px] text-slate-600 leading-normal">
                        <b className="text-slate-700 block uppercase text-[8.5px] tracking-wider mb-0.5">Strategic Alignment Objective:</b>
                        {kpi.strategicGoal}
                      </div>
                    )}
                  </div>

                  {/* Core targets info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 rounded-xl border border-slate-100 p-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Baseline</span>
                      <span className="text-slate-850 text-[10.5px] font-bold block truncate" title={kpi.baseline}>
                        {kpi.baseline || 'No baseline specified'} {kpi.baselineYear ? `(${kpi.baselineYear})` : ''}
                      </span>
                    </div>
                    <div className="border-t sm:border-t-0 sm:border-l border-slate-150 sm:pl-3 pt-1.5 sm:pt-0">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Annual Goal Target</span>
                      <span className="text-emerald-700 text-[11px] font-black block truncate" title={kpi.annualTarget}>
                        {kpi.annualTarget || 'N/A'}
                      </span>
                    </div>
                    <div className="border-t sm:border-t-0 sm:border-l border-slate-150 sm:pl-3 pt-1.5 sm:pt-0">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Budget Allocation</span>
                      <span className="text-blue-700 text-[10.5px] font-bold block truncate">
                        {kpi.budget || 'None'}
                      </span>
                    </div>
                  </div>

                  {/* KPI Progress Tracking */}
                  {(() => {
                    let qTarget = '', qActual = '', qLabel = '';
                    let quarterProgress = 0;
                    if (currentTab === 'q1') { qTarget = kpi.q1Target; qActual = kpi.q1Actual; qLabel = 'Q1'; }
                    else if (currentTab === 'q2') { qTarget = kpi.q2Target; qActual = kpi.q2Actual; qLabel = 'Q2'; }
                    else if (currentTab === 'midterm') { qTarget = kpi.midtermTarget; qActual = kpi.midtermActual; qLabel = 'Midterm'; }
                    else if (currentTab === 'q3') { qTarget = kpi.q3Target; qActual = kpi.q3Actual; qLabel = 'Q3'; }
                    else if (currentTab === 'q4') { qTarget = kpi.q4Target; qActual = kpi.q4Actual; qLabel = 'Q4'; }
                    else if (currentTab === 'annual') { qTarget = kpi.annualTarget; qActual = kpi.annualActual; qLabel = 'Annual'; }
                    
                    if (currentTab !== 'annual') {
                      quarterProgress = calculateProgressPercentage(qTarget, qActual);
                    }
                    const annualProgress = calculateProgressPercentage(kpi.annualTarget, kpi.annualActual);
                    
                    return (
                      <div className="flex flex-col sm:flex-row gap-4 bg-white border border-slate-150 rounded-xl p-3.5 shadow-sm">
                        {currentTab !== 'annual' && (
                          <div className="flex-1 space-y-2 border-b sm:border-b-0 sm:border-r border-slate-150 pb-3 sm:pb-0 sm:pr-4">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                              <span className="text-slate-600">Current Tab ({qLabel}) Progress</span>
                              <span className="text-indigo-600">{quarterProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-indigo-500 transition-all duration-700 ease-out" style={{ width: `${quarterProgress}%` }} />
                            </div>
                            <div className="text-[9px] font-bold text-slate-500">
                              Target: <span className="text-slate-700">{qTarget || 'None'}</span> | Actual: <span className="text-indigo-700">{qActual || 'None'}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                            <span className="text-slate-600">Annual YTD Progress</span>
                            <span className="text-emerald-600">{annualProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${annualProgress}%` }} />
                          </div>
                          <div className="text-[9px] font-bold text-slate-500">
                            Target: <span className="text-slate-700">{kpi.annualTarget || 'None'}</span> | Actual: <span className="text-emerald-700">{kpi.annualActual || 'None'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* LINE MANAGER REVIEW & PERFORMANCE FEEDBACK CARD FOR THIS KPI */}
                  {(kpi.review || kpi.managerScore || kpi.q1PoeFeedback || kpi.q2PoeFeedback || kpi.q3PoeFeedback || kpi.q4PoeFeedback || kpi.annualPoeFeedback || kpi.midtermPoeFeedback || (kpi.q1PoeStatus && kpi.q1PoeStatus !== 'Pending Verification')) && (
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-indigo-700/80 space-y-3">
                      <div className="flex flex-wrap items-center justify-between border-b border-indigo-700/60 pb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <h4 className="font-black text-xs uppercase tracking-wider text-indigo-100 m-0">
                            Line Manager Review & Assessment Feedback
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {pplanData.metadata?.manager && (
                            <span className="text-[10px] font-semibold bg-indigo-900 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-700">
                              Manager: {pplanData.metadata.manager}
                            </span>
                          )}
                          {kpi.managerScore && (
                            <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                              Manager Score: {kpi.managerScore} / 5.0
                            </span>
                          )}
                        </div>
                      </div>

                      {kpi.review && (
                        <div className="bg-indigo-950/90 border border-indigo-800 p-3 rounded-xl space-y-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-300 block">
                            Manager Review Remarks & Guidance
                          </span>
                          <p className="text-xs text-indigo-50 font-medium leading-relaxed m-0 whitespace-pre-wrap select-text">
                            {kpi.review}
                          </p>
                        </div>
                      )}

                      {/* Quarterly Audit Status & Feedback Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                        {[
                          { label: 'Q1', status: kpi.q1PoeStatus, feedback: kpi.q1PoeFeedback },
                          { label: 'Q2', status: kpi.q2PoeStatus, feedback: kpi.q2PoeFeedback },
                          { label: 'Midterm', status: kpi.midtermPoeStatus, feedback: kpi.midtermPoeFeedback },
                          { label: 'Q3', status: kpi.q3PoeStatus, feedback: kpi.q3PoeFeedback },
                          { label: 'Q4', status: kpi.q4PoeStatus, feedback: kpi.q4PoeFeedback },
                          { label: 'Annual', status: kpi.annualPoeStatus, feedback: kpi.annualPoeFeedback },
                        ].map((qItem, qIdx) => {
                          if (!qItem.status && !qItem.feedback) return null;
                          const isApproved = qItem.status === 'Approved';
                          const isRevision = qItem.status === 'Revision Required';
                          const isRejected = qItem.status === 'Rejected';

                          return (
                            <div key={qIdx} className="bg-indigo-950/70 border border-indigo-800/80 p-2 rounded-xl text-[9.5px] space-y-1">
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-indigo-200">{qItem.label}:</span>
                                <span className={`px-1 rounded text-[8px] font-black uppercase ${
                                  isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                  isRevision ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  isRejected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                  'bg-indigo-800 text-indigo-200'
                                }`}>
                                  {qItem.status || 'Pending'}
                                </span>
                              </div>
                              {qItem.feedback && (
                                <p className="text-[9px] text-indigo-100 font-sans line-clamp-2 m-0 select-text" title={qItem.feedback}>
                                  "{qItem.feedback}"
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB CONTROLLERS */}
                  <div className="flex border-b border-slate-200 overflow-x-auto gap-0.5 scrollbar-thin">
                    {[
                      { id: 'q1', label: 'Q1' },
                      { id: 'q2', label: 'Q2' },
                      { id: 'midtermjs', label: 'Midterm' },
                      { id: 'q3', label: 'Q3' },
                      { id: 'q4', label: 'Q4' },
                      { id: 'annual', label: 'Annual Totals' },
                      { id: 'overall', label: isTeamEvaluation ? 'Team Evaluation Assessment & Scores' : 'Self Evaluation Assessment & Scores' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition duration-75 shrink-0 outline-none ${
                          currentTab === t.id
                            ? 'border-emerald-600 text-emerald-600 font-extrabold bg-emerald-50/20'
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-350'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* ACTIVE TAB DISPLAY CARD */}
                  <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-150/70">
                    {currentTab === 'q1' && (() => {
                      const uEmail = (currentUser?.email || '').toLowerCase().trim();
                      const metaEmail = (pplanData.metadata?.email || '').toLowerCase().trim();
                      const isJoubertUser = uEmail.includes('joubert') || uEmail.includes('marianne') || metaEmail.includes('joubert') || metaEmail.includes('marianne');
                      const isCleanAuditKpi = (kpi.kpi || kpi.kpiDescription || kpi.description || '').toLowerCase().includes('clean audit');
                      const isJoubertCleanAuditLocked = isJoubertUser && isCleanAuditKpi;

                      const isQ1NA = isCellNA(kpi.q1Target) || isJoubertCleanAuditLocked;
                      const isEffectiveQ1Locked = kpi.q1Locked || isQ1NA || isJoubertCleanAuditLocked;
                      return (
                      <div className="space-y-4">
                        {renderTimeLockBanner(isQ1TimeLocked, q1ActivePeriod)}
                        {isEffectiveQ1Locked && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium">
                            <span className="text-base">🔒</span>
                            <span>{isJoubertCleanAuditLocked ? "Marianne Joubert's 'Attain clean audit' KPI is only applicable in Quarter 3 and is locked as N/A for Quarter 1." : (isQ1NA ? "This quarter is marked as N/A and is locked for reporting." : "This quarter is locked for reporting as it was not scheduled in the imported Performance Agreement.")}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Q1 Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.q1Target || 'Not specified'}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q1 Score (1-5)</label>
                              <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Whole numbers: 1, 2, 3, 4, 5
                              </span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="1"
                              value={kpi.q1Score ? (kpi.q1Score.includes('.') ? String(Math.round(parseFloat(kpi.q1Score))) : kpi.q1Score) : ''}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                if (raw === '') {
                                  updateItem(kpi.id, 'q1Score', '');
                                } else {
                                  const num = parseInt(raw, 10);
                                  if (num >= 1 && num <= 5) {
                                    updateItem(kpi.id, 'q1Score', String(num));
                                  } else if (num > 5) {
                                    updateItem(kpi.id, 'q1Score', '5');
                                  } else if (num < 1) {
                                    updateItem(kpi.id, 'q1Score', '1');
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                  e.preventDefault();
                                }
                              }}
                              disabled={kpiIsReadOnly || isEffectiveQ1Locked || isQ1TimeLocked}
                              placeholder="1, 2, 3, 4, 5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-bold text-stone-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                            {/* Whole Number Quick-Select Buttons */}
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((scoreVal) => {
                                const currentScore = kpi.q1Score ? parseInt(kpi.q1Score, 10) : null;
                                const isSelected = currentScore === scoreVal;
                                return (
                                  <button
                                    key={scoreVal}
                                    type="button"
                                    disabled={kpiIsReadOnly || isEffectiveQ1Locked || isQ1TimeLocked}
                                    onClick={() => updateItem(kpi.id, 'q1Score', String(scoreVal))}
                                    className={`flex-1 py-1 rounded text-[10px] font-black transition border cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                  >
                                    {scoreVal}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">1st Qtr Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.q1Actual || ''}
                              onChange={(e) => updateItem(kpi.id, 'q1Actual', e.target.value)}
                              disabled={kpiIsReadOnly || isEffectiveQ1Locked || isQ1TimeLocked}
                              placeholder="Describe actual results achieved in Q1..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">1st Qtr Actual Expense</label>
                            <input
                              type="text"
                              value={kpi.q1ActualExpense || ''}
                              onChange={(e) => updateItem(kpi.id, 'q1ActualExpense', e.target.value)}
                              disabled={kpiIsReadOnly || isEffectiveQ1Locked || isQ1TimeLocked}
                              placeholder="e.g. R 45,000"
                              className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-200 focus:border-emerald-600 rounded-lg text-xs font-bold text-emerald-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">1st Qtr Variance (Auto: Target - Actual)</label>
                              {(() => {
                                const varVal = calculateVariance(kpi.q1Target, kpi.q1Actual);
                                return (
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${varVal !== '0' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {varVal}
                                  </span>
                                );
                              })()}
                            </div>
                            <textarea
                              rows={2}
                              value={kpi.q1Comment || ''}
                              onChange={(e) => updateItem(kpi.id, 'q1Comment', e.target.value)}
                              disabled={kpiIsReadOnly || isEffectiveQ1Locked || isQ1TimeLocked || calculateVariance(kpi.q1Target, kpi.q1Actual) === '0'}
                              placeholder={calculateVariance(kpi.q1Target, kpi.q1Actual) === '0' ? "No variance - locked for comments" : "Provide variance explanation commentary..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${calculateVariance(kpi.q1Target, kpi.q1Actual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">1st Qtr Corrective Action / Measure</label>
                            <textarea
                              rows={2}
                              value={kpi.q1Corrective || ''}
                              onChange={(e) => updateItem(kpi.id, 'q1Corrective', e.target.value)}
                              disabled={kpiIsReadOnly || isEffectiveQ1Locked || isQ1TimeLocked || calculateVariance(kpi.q1Target, kpi.q1Actual) === '0'}
                              placeholder={calculateVariance(kpi.q1Target, kpi.q1Actual) === '0' ? "No variance - locked for corrective measures" : "Provide corrective action details..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${calculateVariance(kpi.q1Target, kpi.q1Actual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>
                        </div>

                        {/* Portfolio of Evidence block for Quarter 1 */}
                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                             label="1st Qtr Portfolio of Evidence"
                             placeholderRef="Evidence Reference: e.g. SCM signoff sheet, business model notes..."
                             quarterName="Q1"
                             requiredPoeDescription={kpi.q1RequiredPoe || kpi.q1Poe || kpi.annualRequiredPoe || kpi.poe}
                             textValue={kpi.q1Poe || ''}
                             setTextValue={(v) => updateItem(kpi.id, 'q1Poe', v)}
                             files={kpi.q1PoeDocs || []}
                             setFiles={(docs) => updateItem(kpi.id, 'q1PoeDocs', docs)}
                             currentUser={currentUser}
                             disabled={kpiIsReadOnly || isEffectiveQ1Locked}
                             poeStatus={kpi.q1PoeStatus}
                             poeFeedback={kpi.q1PoeFeedback}
                             onAutoSave={(docs) => handleAutoSavePoeDocs(kpi.id, 'q1PoeDocs', docs)}
                          />
                        </div>
                      </div>
                      );
                    })()}
                    

                    {currentTab === 'q2' && (
                      <div className="space-y-4">
                        {renderTimeLockBanner(isQ2TimeLocked, q2ActivePeriod)}
                        {kpi.q2Locked && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium">
                            <span className="text-base">🔒</span>
                            <span>This quarter is locked for reporting as it was not scheduled in the imported Performance Agreement.</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Q2 Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.q2Target || 'Not specified'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q2 Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.q2Score || ''}
                              onChange={(e) => updateItem(kpi.id, 'q2Score', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q2Locked || isQ2TimeLocked}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">2nd Qtr Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.q2Actual || ''}
                              onChange={(e) => updateItem(kpi.id, 'q2Actual', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q2Locked || isQ2TimeLocked}
                              placeholder="Describe actual results achieved in Q2..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">2nd Qtr Actual Expense</label>
                            <input
                              type="text"
                              value={kpi.q2ActualExpense || ''}
                              onChange={(e) => updateItem(kpi.id, 'q2ActualExpense', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q2Locked || isQ2TimeLocked}
                              placeholder="e.g. R 45,000"
                              className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-200 focus:border-emerald-600 rounded-lg text-xs font-bold text-emerald-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">2nd Qtr Variance (Auto: Actual - Target)</label>
                              {renderVarianceBadge(kpi.q2Target, kpi.q2Actual)}
                            </div>
                            <textarea
                              rows={2}
                              value={kpi.q2Comment || ''}
                              onChange={(e) => updateItem(kpi.id, 'q2Comment', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q2Locked || isQ2TimeLocked || calculateVariance(kpi.q2Target, kpi.q2Actual) === '0'}
                              placeholder={calculateVariance(kpi.q2Target, kpi.q2Actual) === '0' ? "No variance - locked for comments" : "Provide variance explanation commentary..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${calculateVariance(kpi.q2Target, kpi.q2Actual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">2nd Qtr Corrective Action / Measure</label>
                            <textarea
                              rows={2}
                              value={kpi.q2Corrective || ''}
                              onChange={(e) => updateItem(kpi.id, 'q2Corrective', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q2Locked || isQ2TimeLocked || calculateVariance(kpi.q2Target, kpi.q2Actual) === '0'}
                              placeholder={calculateVariance(kpi.q2Target, kpi.q2Actual) === '0' ? "No variance - locked for corrective measures" : "Provide corrective action details..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${calculateVariance(kpi.q2Target, kpi.q2Actual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="2nd Qtr Portfolio of Evidence"
                            placeholderRef="Evidence Reference: e.g. Attendance register, technical approval..."
                            quarterName="Q2"
                            requiredPoeDescription={kpi.q2RequiredPoe || kpi.q2Poe || kpi.annualRequiredPoe || kpi.poe}
                            textValue={kpi.q2Poe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'q2Poe', val)}
                            files={kpi.q2PoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'q2PoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly || kpi.q2Locked || isQ2TimeLocked}
                            poeStatus={kpi.q2PoeStatus}
                            poeFeedback={kpi.q2PoeFeedback}
                            onAutoSave={(docs) => handleAutoSavePoeDocs(kpi.id, 'q2PoeDocs', docs)}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'midtermjs' && (
                      <div className="space-y-4">
                        {renderTimeLockBanner(isMidtermTimeLocked, midtermActivePeriod)}
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Midterm Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.midtermTarget || 'No Midterm Target Specified'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider font-sans">Midterm Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.midtermScore || ''}
                              onChange={(e) => updateItem(kpi.id, 'midtermScore', e.target.value)}
                              disabled={kpiIsReadOnly || isMidtermTimeLocked}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider font-sans">Midterm Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.midtermActual || ''}
                              onChange={(e) => updateItem(kpi.id, 'midtermActual', e.target.value)}
                              disabled={kpiIsReadOnly || isMidtermTimeLocked}
                              placeholder="Describe actual results achieved for midterm review..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-emerald-800 uppercase tracking-wider font-sans">Midterm Actual Expense</label>
                            <input
                              type="text"
                              value={kpi.midtermActualExpense || ''}
                              onChange={(e) => updateItem(kpi.id, 'midtermActualExpense', e.target.value)}
                              disabled={kpiIsReadOnly || isMidtermTimeLocked}
                              placeholder="e.g. R 45,000"
                              className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-200 focus:border-emerald-600 rounded-lg text-xs font-bold text-emerald-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider font-sans">Midterm Variance (Auto: Actual - Target)</label>
                              {renderVarianceBadge(kpi.midtermTarget, kpi.midtermActual)}
                            </div>
                            <textarea
                              rows={2}
                              value={kpi.midtermComment || ''}
                              onChange={(e) => updateItem(kpi.id, 'midtermComment', e.target.value)}
                              disabled={kpiIsReadOnly || calculateVariance(kpi.midtermTarget, kpi.midtermActual) === '0'}
                              placeholder={calculateVariance(kpi.midtermTarget, kpi.midtermActual) === '0' ? "No variance - locked for comments" : "Provide midterm variance explanation commentary..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none ${calculateVariance(kpi.midtermTarget, kpi.midtermActual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider font-sans">Midterm Corrective Action / Measure</label>
                            <textarea
                              rows={2}
                              value={kpi.midtermCorrective || ''}
                              onChange={(e) => updateItem(kpi.id, 'midtermCorrective', e.target.value)}
                              disabled={kpiIsReadOnly || calculateVariance(kpi.midtermTarget, kpi.midtermActual) === '0'}
                              placeholder={calculateVariance(kpi.midtermTarget, kpi.midtermActual) === '0' ? "No variance - locked for corrective measures" : "Provide corrective action details..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none ${calculateVariance(kpi.midtermTarget, kpi.midtermActual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="Midterm Portfolio of Evidence"
                            placeholderRef="Evidence Reference: e.g. Midterm audit report..."
                            quarterName="MID"
                            requiredPoeDescription={kpi.midtermRequiredPoe}
                            textValue={kpi.midtermPoe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'midtermPoe', val)}
                            files={kpi.midtermPoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'midtermPoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly || isMidtermTimeLocked}
                            poeStatus={kpi.midtermPoeStatus}
                            poeFeedback={kpi.midtermPoeFeedback}
                            onAutoSave={(docs) => handleAutoSavePoeDocs(kpi.id, 'midtermPoeDocs', docs)}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'q3' && (
                      <div className="space-y-4">
                        {renderTimeLockBanner(isQ3TimeLocked, q3ActivePeriod)}
                        {kpi.q3Locked && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium">
                            <span className="text-base">🔒</span>
                            <span>This quarter is locked for reporting as it was not scheduled in the imported Performance Agreement.</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Q3 Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.q3Target || 'Not specified'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q3 Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.q3Score || ''}
                              onChange={(e) => updateItem(kpi.id, 'q3Score', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q3Locked || isQ3TimeLocked}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">3rd Qtr Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.q3Actual || ''}
                              onChange={(e) => updateItem(kpi.id, 'q3Actual', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q3Locked || isQ3TimeLocked}
                              placeholder="Describe actual results achieved in Q3..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">3rd Qtr Actual Expense</label>
                            <input
                              type="text"
                              value={kpi.q3ActualExpense || ''}
                              onChange={(e) => updateItem(kpi.id, 'q3ActualExpense', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q3Locked || isQ3TimeLocked}
                              placeholder="e.g. R 45,000"
                              className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-200 focus:border-emerald-600 rounded-lg text-xs font-bold text-emerald-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">3rd Qtr Variance (Auto: Actual - Target)</label>
                              {renderVarianceBadge(kpi.q3Target, kpi.q3Actual)}
                            </div>
                            <textarea
                              rows={2}
                              value={kpi.q3Comment || ''}
                              onChange={(e) => updateItem(kpi.id, 'q3Comment', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q3Locked || isQ3TimeLocked || calculateVariance(kpi.q3Target, kpi.q3Actual) === '0'}
                              placeholder={calculateVariance(kpi.q3Target, kpi.q3Actual) === '0' ? "No variance - locked for comments" : "Provide variance explanation commentary..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${calculateVariance(kpi.q3Target, kpi.q3Actual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">3rd Qtr Corrective Action / Measure</label>
                            <textarea
                              rows={2}
                              value={kpi.q3Corrective || ''}
                              onChange={(e) => updateItem(kpi.id, 'q3Corrective', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q3Locked || isQ3TimeLocked || calculateVariance(kpi.q3Target, kpi.q3Actual) === '0'}
                              placeholder={calculateVariance(kpi.q3Target, kpi.q3Actual) === '0' ? "No variance - locked for corrective measures" : "Provide corrective action details..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${calculateVariance(kpi.q3Target, kpi.q3Actual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="3rd Qtr Portfolio of Evidence"
                            placeholderRef="Evidence Reference: e.g. Audit ledger extract, completion certificate..."
                            quarterName="Q3"
                            requiredPoeDescription={kpi.q3RequiredPoe || kpi.q3Poe || kpi.annualRequiredPoe || kpi.poe}
                            textValue={kpi.q3Poe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'q3Poe', val)}
                            files={kpi.q3PoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'q3PoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly || kpi.q3Locked || isQ3TimeLocked}
                            poeStatus={kpi.q3PoeStatus}
                            poeFeedback={kpi.q3PoeFeedback}
                            onAutoSave={(docs) => handleAutoSavePoeDocs(kpi.id, 'q3PoeDocs', docs)}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'q4' && (
                      <div className="space-y-4">
                        {renderTimeLockBanner(isQ4TimeLocked, q4ActivePeriod)}
                        {kpi.q4Locked && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium">
                            <span className="text-base">🔒</span>
                            <span>This quarter is locked for reporting as it was not scheduled in the imported Performance Agreement.</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Q4 Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.q4Target || 'Not specified'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q4 Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.q4Score || ''}
                              onChange={(e) => updateItem(kpi.id, 'q4Score', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q4Locked || isQ4TimeLocked}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">4th Qtr Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.q4Actual || ''}
                              onChange={(e) => updateItem(kpi.id, 'q4Actual', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q4Locked || isQ4TimeLocked}
                              placeholder="Describe actual results achieved in Q4..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">4th Qtr Actual Expense</label>
                            <input
                              type="text"
                              value={kpi.q4ActualExpense || ''}
                              onChange={(e) => updateItem(kpi.id, 'q4ActualExpense', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q4Locked || isQ4TimeLocked}
                              placeholder="e.g. R 45,000"
                              className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-200 focus:border-emerald-600 rounded-lg text-xs font-bold text-emerald-900 shadow-xs outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">4th Qtr Variance (Auto: Actual - Target)</label>
                              {renderVarianceBadge(kpi.q4Target, kpi.q4Actual)}
                            </div>
                            <textarea
                              rows={2}
                              value={kpi.q4Comment || ''}
                              onChange={(e) => updateItem(kpi.id, 'q4Comment', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q4Locked || isQ4TimeLocked || calculateVariance(kpi.q4Target, kpi.q4Actual) === '0'}
                              placeholder={calculateVariance(kpi.q4Target, kpi.q4Actual) === '0' ? "No variance - locked for comments" : "Provide variance explanation commentary..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${calculateVariance(kpi.q4Target, kpi.q4Actual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">4th Qtr Corrective Action / Measure</label>
                            <textarea
                              rows={2}
                              value={kpi.q4Corrective || ''}
                              onChange={(e) => updateItem(kpi.id, 'q4Corrective', e.target.value)}
                              disabled={kpiIsReadOnly || kpi.q4Locked || isQ4TimeLocked || calculateVariance(kpi.q4Target, kpi.q4Actual) === '0'}
                              placeholder={calculateVariance(kpi.q4Target, kpi.q4Actual) === '0' ? "No variance - locked for corrective measures" : "Provide corrective action details..."}
                              className={`w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${calculateVariance(kpi.q4Target, kpi.q4Actual) === '0' ? 'opacity-60' : ''}`}
                            />
                          </div>
                        </div>

                        {/* Annual Summary Metrics inside Q4 View */}
                        <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200/80 space-y-3">
                          <span className="text-[10px] font-black uppercase text-sky-900 tracking-wider block border-b border-sky-200 pb-1">
                            Annual Cumulative Performance Metrics
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-sky-900 uppercase tracking-wider">Annual Actual Reached</label>
                              <input
                                type="text"
                                value={kpi.annualActual || ''}
                                onChange={(e) => updateItem(kpi.id, 'annualActual', e.target.value)}
                                disabled={kpiIsReadOnly}
                                placeholder="Describe total annual actual results achieved..."
                                className="w-full px-2.5 py-1.5 bg-white border border-sky-200 focus:border-sky-600 rounded-lg text-xs font-bold text-sky-950 shadow-xs outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Annual Actual Expense</label>
                              <input
                                type="text"
                                value={kpi.annualActualExpense || kpi.annualActualExp || ''}
                                onChange={(e) => {
                                  updateItem(kpi.id, 'annualActualExpense', e.target.value);
                                  updateItem(kpi.id, 'annualActualExp', e.target.value);
                                }}
                                disabled={kpiIsReadOnly}
                                placeholder="e.g. R 180,000"
                                className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 focus:border-emerald-600 rounded-lg text-xs font-bold text-emerald-950 shadow-xs outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-amber-800 uppercase tracking-wider">Annual Variance (Auto: Actual - Target)</label>
                                {renderVarianceBadge(kpi.annualTarget, kpi.annualActual || kpi.q4Actual)}
                              </div>
                              <textarea
                                rows={1}
                                value={kpi.annualVariance || ''}
                                onChange={(e) => updateItem(kpi.id, 'annualVariance', e.target.value)}
                                disabled={kpiIsReadOnly}
                                placeholder="Annual variance explanation..."
                                className="w-full px-2.5 py-1 bg-white border border-sky-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-amber-800 uppercase tracking-wider">Annual Corrective Action</label>
                              <textarea
                                rows={1}
                                value={kpi.annualCorrective || ''}
                                onChange={(e) => updateItem(kpi.id, 'annualCorrective', e.target.value)}
                                disabled={kpiIsReadOnly}
                                placeholder="Annual corrective measure..."
                                className="w-full px-2.5 py-1 bg-white border border-sky-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="4th Qtr Portfolio of Evidence"
                            placeholderRef="Evidence Reference: e.g. Closeout signoff reports, service verification..."
                            quarterName="Q4"
                            requiredPoeDescription={kpi.q4RequiredPoe || kpi.q4Poe || kpi.annualRequiredPoe || kpi.poe}
                            textValue={kpi.q4Poe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'q4Poe', val)}
                            files={kpi.q4PoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'q4PoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly || kpi.q4Locked || isQ4TimeLocked}
                            poeStatus={kpi.q4PoeStatus}
                            poeFeedback={kpi.q4PoeFeedback}
                            onAutoSave={(docs) => handleAutoSavePoeDocs(kpi.id, 'q4PoeDocs', docs)}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'annual' && (
                      <div className="space-y-4">
                        {renderTimeLockBanner(isAnnualTimeLocked, annualActivePeriod)}
                        <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-3 text-xs flex items-center justify-between font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-base">📅</span>
                            <span>Annual Cumulative Performance & Execution Totals</span>
                          </div>
                          <span className="text-[10px] text-sky-800 font-black uppercase bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-xs">
                            Annual Target: {kpi.annualTarget || 'Not Specified'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-sky-900 uppercase tracking-wider">Annual Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.annualActual || ''}
                              onChange={(e) => updateItem(kpi.id, 'annualActual', e.target.value)}
                              disabled={kpiIsReadOnly || isAnnualTimeLocked}
                              placeholder="Describe total annual actual results achieved..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-sky-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Annual Actual Expense</label>
                            <input
                              type="text"
                              value={kpi.annualActualExpense || kpi.annualActualExp || ''}
                              onChange={(e) => {
                                updateItem(kpi.id, 'annualActualExpense', e.target.value);
                                updateItem(kpi.id, 'annualActualExp', e.target.value);
                              }}
                              disabled={kpiIsReadOnly || isAnnualTimeLocked}
                              placeholder="e.g. R 180,000"
                              className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-200 focus:border-emerald-600 rounded-lg text-xs font-bold text-emerald-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-amber-800 uppercase tracking-wider">Annual Variance (Auto: Actual - Target)</label>
                              {renderVarianceBadge(kpi.annualTarget, kpi.annualActual || kpi.q4Actual)}
                            </div>
                            <textarea
                              rows={2}
                              value={kpi.annualVariance || ''}
                              onChange={(e) => updateItem(kpi.id, 'annualVariance', e.target.value)}
                              disabled={kpiIsReadOnly || isAnnualTimeLocked}
                              placeholder="Provide annual variance explanation commentary..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-sky-600 rounded-lg text-xs font-medium text-stone-900 outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-amber-800 uppercase tracking-wider">Annual Corrective Action / Measure</label>
                            <textarea
                              rows={2}
                              value={kpi.annualCorrective || ''}
                              onChange={(e) => updateItem(kpi.id, 'annualCorrective', e.target.value)}
                              disabled={kpiIsReadOnly || isAnnualTimeLocked}
                              placeholder="Provide annual corrective action details..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-sky-600 rounded-lg text-xs font-medium text-stone-900 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {currentTab === 'overall' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold text-emerald-700 block border-b border-emerald-100 pb-1">
                              <User className="w-3.5 h-3.5 inline mr-1 mb-0.5 align-middle" />
                              {isTeamEvaluation ? 'Overall Team Evaluation' : 'Overall Self-Evaluation'}
                            </label>
                            <div className="space-y-3 text-stone-900">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{isTeamEvaluation ? 'Team Evaluation Score (1-5):' : 'Self-Evaluation Score (1-5):'}</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="5"
                                  step="0.1"
                                  disabled={kpiIsReadOnly}
                                  value={kpi.myScore || ''}
                                  onChange={(e) => updateItem(kpi.id, 'myScore', e.target.value)}
                                  className="w-20 text-[11px] p-1.5 rounded-lg border border-slate-250 bg-white text-slate-800 text-center font-bold focus:border-emerald-500 outline-none shadow-inner"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Executive Assessment Remarks</span>
                                <textarea
                                  disabled={kpiIsReadOnly}
                                  value={kpi.evaluation || ''}
                                  onChange={(e) => updateItem(kpi.id, 'evaluation', e.target.value)}
                                  placeholder="Summarize your annual strategic execution performance for this KPI target..."
                                  rows={3}
                                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-800 disabled:opacity-75 disabled:bg-slate-100 focus:border-emerald-500 outline-none shadow-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Manager Feedback */}
                          <div className="space-y-2 bg-indigo-50/60 p-4 rounded-xl border border-indigo-200/70">
                            <div className="flex justify-between items-center border-b border-indigo-200 pb-1">
                              <label className="text-[10px] uppercase font-black text-indigo-900 block">
                                Manager Review & Score
                              </label>
                              {kpi.managerScore && (
                                <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded">
                                  Score: {kpi.managerScore} / 5
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-800 whitespace-pre-wrap select-text leading-relaxed font-semibold">
                              {kpi.review ? kpi.review : <span className="text-slate-400 italic font-normal">No manager approval notes committed yet.</span>}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="Annual Portfolio of Evidence Documentation"
                            placeholderRef="Evidence Reference: e.g. Final Annual Audit Report..."
                            quarterName="ANNUAL"
                            requiredPoeDescription={kpi.annualRequiredPoe}
                            textValue={kpi.annualPoe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'annualPoe', val)}
                            files={kpi.annualPoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'annualPoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly}
                            poeStatus={kpi.annualPoeStatus}
                            poeFeedback={kpi.annualPoeFeedback}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions per KPI */}
                  {!isReadOnly && (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 mt-2 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => handleSaveKpi(kpi.id, false)}
                        disabled={saving}
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm cursor-pointer"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Push to Annual Performance Planner Grid</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleSaveKpi(kpi.id, true)}
                        disabled={saving}
                        className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Push to Manager for Approval</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleRedoKpi(kpi.id)}
                        disabled={saving}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        title="Unlock this KPI to edit actuals, upload/replace Portfolios of Evidence (PoE), and resubmit to manager"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Redo & Resubmit KPI</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })})()}
          </div>
        )}
        </>
        )}
      </div>

      {showClearKpiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in" id="evaluation-clear-kpis-modal">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-800 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Registered Performance KPIs Overview</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Official clear-view listing of active performance targets</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowClearKpiModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {pplanData.items && pplanData.items.length > 0 ? (
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
                      {pplanData.items.map((kpi: any) => (
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
                    <ClipboardList className="w-6 h-6" />
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
                disabled={saving || !pplanData.items || pplanData.items.length === 0}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑️ Clear All KPIs</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowClearKpiModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition shadow-sm cursor-pointer"
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
