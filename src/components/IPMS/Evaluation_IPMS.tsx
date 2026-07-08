import React, { useState, useEffect } from 'react';
import { 
  FileSignature, Send, User, Target, ClipboardList,
  Upload, X, File, FileSpreadsheet, Image, FileText, Check, AlertCircle, Info, CalendarCheck, HelpCircle
} from 'lucide-react';

export interface PoeDocument {
  id: string;
  name: string;
  mimeType: string;
  dataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

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
  disabled
}: QuarterPoeSelectorProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    const newDocs: PoeDocument[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const doc = await new Promise<PoeDocument>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `poe_doc_${quarterName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    }
    setFiles([...files, ...newDocs]);
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
    setFiles(files.filter(f => f.id !== id));
  };

  const getFileIcon = (mimeType: string, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <Image className="w-4 h-4 text-blue-500 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext || '')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (['doc', 'docx', 'odt'].includes(ext || '')) {
      return <FileText className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-500 shrink-0" />;
  };

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
          {files.length} attached
        </span>
      </div>

      {requiredPoeDescription && (
        <div className="px-2 py-1.5 bg-yellow-50 border border-yellow-200 rounded text-[10px] font-semibold text-yellow-800 flex items-start gap-1">
          <span className="font-extrabold shrink-0 mt-0.5">Required PoE:</span> 
          <span>{requiredPoeDescription}</span>
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
            Drag &amp; drop files or <span className="text-emerald-700 underline">browse</span>
          </p>
          <p className="text-[8px] text-slate-400 mt-0.5 mb-0 leading-tight">
            PDFs, Excel, images, etc.
          </p>
          {!disabled && (
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
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
                  <span className="font-mono text-[9px] font-bold text-slate-400">({ext})</span>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-red-650 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Props {
  currentUser: any;
  activeTenantId: string;
}

export function EvaluationIPMS({ currentUser, activeTenantId }: Props) {
  const [loading, setLoading] = useState(true);
  const [pplanData, setPplanData] = useState<{ metadata: any, items: any[] }>({ metadata: {}, items: [] });
  const [saving, setSaving] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMyPlan();
  }, [activeTenantId, currentUser]);

  const fetchMyPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${currentUser.email}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setPplanData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (id: string, field: string, value: any) => {
    setPplanData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleSaveKpi = async (kpiId: string, submitForReview = false) => {
    setSaving(true);
    try {
      const metadata = { ...pplanData.metadata };
      if (!metadata.reviewStatus) {
        metadata.reviewStatus = 'Draft';
      }

      const updatedItems = pplanData.items.map(item => {
        const q1Text = item.q1Poe || '';
        const q2Text = item.q2Poe || '';
        const q3Text = item.q3Poe || '';
        const q4Text = item.q4Poe || '';
        const aggregatePoe = [
          q1Text ? `Q1: ${q1Text}` : '',
          q2Text ? `Q2: ${q2Text}` : '',
          q3Text ? `Q3: ${q3Text}` : '',
          q4Text ? `Q4: ${q4Text}` : ''
        ].filter(Boolean).join('\n');

        let updatedItem = {
          ...item,
          poe: aggregatePoe || item.poe
        };

        if (item.id === kpiId && submitForReview) {
          updatedItem.reviewStatus = 'Submitted for Approval';
        }
        return updatedItem;
      });

      const payload = {
        metadata,
        items: updatedItems
      };

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${currentUser.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setPplanData(payload);
      if (submitForReview) {
        alert("KPI successfully submitted for approval!");
      } else {
        alert("Fields pushed to Annual Performance Planner Grid successfully!");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving: " + String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (submitForReview = false) => {
    setSaving(true);
    try {
      const metadata = { ...pplanData.metadata };
      if (submitForReview) {
        metadata.reviewStatus = 'Submitted for Approval';
      } else if (!metadata.reviewStatus) {
        metadata.reviewStatus = 'Draft';
      }

      // Automatically construct the aggregated 'poe' string based on quarterly portfolios
      const updatedItems = pplanData.items.map(item => {
        const q1Text = item.q1Poe || '';
        const q2Text = item.q2Poe || '';
        const q3Text = item.q3Poe || '';
        const q4Text = item.q4Poe || '';
        const aggregatePoe = [
          q1Text ? `Q1: ${q1Text}` : '',
          q2Text ? `Q2: ${q2Text}` : '',
          q3Text ? `Q3: ${q3Text}` : '',
          q4Text ? `Q4: ${q4Text}` : ''
        ].filter(Boolean).join('\n');

        return {
          ...item,
          poe: aggregatePoe || item.poe
        };
      });

      const payload = {
        metadata,
        items: updatedItems
      };

      await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${currentUser.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setPplanData(payload);
      if (submitForReview) {
        alert("Evaluation successfully committed and submitted to your manager! The Annual Performance Planner Grid table has been automatically synchronized.");
      } else {
        alert("Evaluation draft saved successfully! All quarterly metrics, actuals, comments, and portfolios of evidence are updated in the Annual Performance Planner Grid.");
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
  const isReadOnly = false;

  return (
    <div id="self-evaluation-dashboard" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-stone-900">
      <div className="px-6 py-6 pb-4 bg-white border-b border-gray-250 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 relative z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileSignature className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            Employee Self-Evaluation
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1.5 ml-[52px]">
            Capture actual quarterly deliverables, portfolios of evidence (POE), & assessments
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2 ${metadata.reviewStatus === 'Reviewed' ? 'bg-emerald-600' : metadata.reviewStatus === 'Submitted for Approval' ? 'bg-amber-500' : 'bg-slate-500'}`}>
            <span>Global PA Status:</span>
            <span>{metadata.reviewStatus || 'Draft'}</span>
          </div>

          <button 
            onClick={() => handleSave(false)}
            disabled={saving}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Push to Annual Performance Planner Grid</span>
          </button>
          <button 
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Push to Manager for Approval</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-6">
        {(!items || items.length === 0) ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-bold uppercase">No KPIs found in your Performance Plan</p>
            <p className="text-slate-400 text-[10px] mt-1">Visit the Performance Agreement module to setup your active plan list first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((kpi, idx) => {
              const currentTab = activeTabs[kpi.id] || 'q1';
              const setTab = (tab: string) => {
                setActiveTabs(prev => ({ ...prev, [kpi.id]: tab }));
              };
              const kpiIsReadOnly = isReadOnly || kpi.reviewStatus === 'Submitted for Approval' || kpi.reviewStatus === 'Reviewed';

              return (
                <div key={kpi.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5">
                  {/* Header metadata layout */}
                  <div className="flex flex-wrap justify-between items-start gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
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
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs font-black">
                      <span className="text-[10px] font-bold uppercase text-emerald-600/80">Weighting:</span>
                      <span>{kpi.weighting || 0}%</span>
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

                  {/* TAB CONTROLLERS */}
                  <div className="flex border-b border-slate-200 overflow-x-auto gap-0.5 scrollbar-thin">
                    {[
                      { id: 'q1', label: 'Q1' },
                      { id: 'q2', label: 'Q2' },
                      { id: 'midtermjs', label: 'Midterm' },
                      { id: 'q3', label: 'Q3' },
                      { id: 'q4', label: 'Q4' },
                      { id: 'overall', label: 'Self Evaluation Assessment & Scores' },
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
                    {currentTab === 'q1' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Q1 Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.q1Target || 'Not specified'}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q1 Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.q1Score || ''}
                              onChange={(e) => updateItem(kpi.id, 'q1Score', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q1 Deliverables / Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.q1Actual || ''}
                              onChange={(e) => updateItem(kpi.id, 'q1Actual', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Describe actual results achieved in Q1..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q1 Assessment Comments</label>
                            <textarea
                              rows={2}
                              value={kpi.q1Comment || ''}
                              onChange={(e) => updateItem(kpi.id, 'q1Comment', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Provide commentary or challenges faced..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none"
                            />
                          </div>
                        </div>

                        {/* Portfolio of Evidence block for Quarter 1 */}
                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="Q1 Portfolio of Evidence Documentation"
                            placeholderRef="Evidence Reference: e.g. SCM signoff sheet, business model notes..."
                            quarterName="Q1"
                            requiredPoeDescription={kpi.q1RequiredPoe}
                            textValue={kpi.q1Poe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'q1Poe', val)}
                            files={kpi.q1PoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'q1PoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'q2' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Q2 Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.q2Target || 'Not specified'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q2 Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.q2Score || ''}
                              onChange={(e) => updateItem(kpi.id, 'q2Score', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q2 Deliverables / Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.q2Actual || ''}
                              onChange={(e) => updateItem(kpi.id, 'q2Actual', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Describe actual results achieved in Q2..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q2 Assessment Comments</label>
                            <textarea
                              rows={2}
                              value={kpi.q2Comment || ''}
                              onChange={(e) => updateItem(kpi.id, 'q2Comment', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Provide commentary or challenges faced..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="Q2 Portfolio of Evidence Documentation"
                            placeholderRef="Evidence Reference: e.g. Attendance register, technical approval..."
                            quarterName="Q2"
                            requiredPoeDescription={kpi.q2RequiredPoe}
                            textValue={kpi.q2Poe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'q2Poe', val)}
                            files={kpi.q2PoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'q2PoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'midtermjs' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Midterm Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.midtermTarget || 'No Midterm Target Specified'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider font-sans">Midterm Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.midtermScore || ''}
                              onChange={(e) => updateItem(kpi.id, 'midtermScore', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider font-sans">Midterm Deliverables / Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.midtermActual || ''}
                              onChange={(e) => updateItem(kpi.id, 'midtermActual', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Describe actual results achieved for midterm review..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider font-sans">Midterm Assessment Comments</label>
                            <textarea
                              rows={2}
                              value={kpi.midtermComment || ''}
                              onChange={(e) => updateItem(kpi.id, 'midtermComment', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Provide midterm assessment commentary..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="Midterm Portfolio of Evidence Documentation"
                            placeholderRef="Evidence Reference: e.g. Midterm audit report..."
                            quarterName="MID"
                            requiredPoeDescription={kpi.midtermRequiredPoe}
                            textValue={kpi.midtermPoe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'midtermPoe', val)}
                            files={kpi.midtermPoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'midtermPoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'q3' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Q3 Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.q3Target || 'Not specified'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q3 Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.q3Score || ''}
                              onChange={(e) => updateItem(kpi.id, 'q3Score', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q3 Deliverables / Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.q3Actual || ''}
                              onChange={(e) => updateItem(kpi.id, 'q3Actual', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Describe actual results achieved in Q3..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q3 Assessment Comments</label>
                            <textarea
                              rows={2}
                              value={kpi.q3Comment || ''}
                              onChange={(e) => updateItem(kpi.id, 'q3Comment', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Provide commentary or challenges faced..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="Q3 Portfolio of Evidence Documentation"
                            placeholderRef="Evidence Reference: e.g. Audit ledger extract, completion certificate..."
                            quarterName="Q3"
                            requiredPoeDescription={kpi.q3RequiredPoe}
                            textValue={kpi.q3Poe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'q3Poe', val)}
                            files={kpi.q3PoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'q3PoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'q4' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans">
                          <span className="font-extrabold text-slate-700 shrink-0 uppercase">Q4 Performance Goal Target:</span>
                          <span className="font-bold text-slate-900">{kpi.q4Target || 'Not specified'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q4 Score (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={kpi.q4Score || ''}
                              onChange={(e) => updateItem(kpi.id, 'q4Score', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q4 Deliverables / Actual Reached</label>
                            <input
                              type="text"
                              value={kpi.q4Actual || ''}
                              onChange={(e) => updateItem(kpi.id, 'q4Actual', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Describe actual results achieved in Q4..."
                              className="w-full px-3 py-2 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-semibold text-stone-900 shadow-xs outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Q4 Assessment Comments</label>
                            <textarea
                              rows={2}
                              value={kpi.q4Comment || ''}
                              onChange={(e) => updateItem(kpi.id, 'q4Comment', e.target.value)}
                              disabled={kpiIsReadOnly}
                              placeholder="Provide commentary or challenges faced..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-250 focus:border-emerald-600 rounded-lg text-xs font-medium text-stone-900 outline-none"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <QuarterPoeSelector
                            label="Q4 Portfolio of Evidence Documentation"
                            placeholderRef="Evidence Reference: e.g. Closeout signoff reports, service verification..."
                            quarterName="Q4"
                            requiredPoeDescription={kpi.q4RequiredPoe}
                            textValue={kpi.q4Poe || ''}
                            setTextValue={(val) => updateItem(kpi.id, 'q4Poe', val)}
                            files={kpi.q4PoeDocs || []}
                            setFiles={(filesVal) => updateItem(kpi.id, 'q4PoeDocs', filesVal)}
                            currentUser={currentUser}
                            disabled={kpiIsReadOnly}
                          />
                        </div>
                      </div>
                    )}

                    {currentTab === 'overall' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold text-emerald-700 block border-b border-emerald-100 pb-1">
                              <User className="w-3.5 h-3.5 inline mr-1 mb-0.5 align-middle" />
                              Overall Self-Evaluation
                            </label>
                            <div className="space-y-3 text-stone-900">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Self-Evaluation Score (1-5):</span>
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
                          <div className="space-y-2 bg-slate-100/70 p-4 rounded-xl border border-slate-150">
                            <label className="text-[10px] uppercase font-bold text-slate-600 block border-b border-slate-200 pb-1">
                              Manager Approval Comments
                            </label>
                            <div className="text-xs text-slate-700 whitespace-pre-wrap select-text leading-relaxed font-semibold">
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
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions per KPI */}
                  {!isReadOnly && kpi.reviewStatus !== 'Submitted for Approval' && kpi.reviewStatus !== 'Reviewed' && (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 mt-2 border-t border-slate-100">
                      <button 
                        onClick={() => handleSaveKpi(kpi.id, false)}
                        disabled={saving}
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Push to Annual Performance Planner Grid</span>
                      </button>
                      <button 
                        onClick={() => handleSaveKpi(kpi.id, true)}
                        disabled={saving}
                        className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Push to Manager for Approval</span>
                      </button>
                    </div>
                  )}
                  {kpi.reviewStatus && (kpi.reviewStatus === 'Submitted for Approval' || kpi.reviewStatus === 'Reviewed') && (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 mt-2 border-t border-slate-100">
                      <span className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        KPI Status: {kpi.reviewStatus}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
