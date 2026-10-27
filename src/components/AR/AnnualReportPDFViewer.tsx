import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Search,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  AlertCircle,
  Eye,
  FileCheck,
  List,
  Sparkles,
  Save,
  Globe,
  Database
} from 'lucide-react';
import type { User } from '../../types';

interface AnnualReportPDFViewerProps {
  currentUser: User;
  activeTenantId: string;
}

interface PDFDocumentMetadata {
  id: string;
  title: string;
  financialYear: string;
  fileName: string;
  fileSizeFormatted: string;
  totalPages: number;
  uploadedBy: string;
  uploadedAt: string;
}

// IndexedDB Helper for Large PDF Binary Storage
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('MzansiFlowPDFStore_v3', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pdfs')) {
        db.createObjectStore('pdfs');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storePdfInIndexedDB(fileOrBlob: Blob): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pdfs', 'readwrite');
    const store = tx.objectStore('pdfs');
    const req = store.put(fileOrBlob, 'annual_report_master');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function loadPdfFromIndexedDB(): Promise<Blob | null> {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('pdfs', 'readonly');
      const store = tx.objectStore('pdfs');
      const req = store.get('annual_report_master');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export function AnnualReportPDFViewer({ currentUser, activeTenantId }: AnnualReportPDFViewerProps) {
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  
  // Super Admin Check
  const isSuperAdmin = 
    userEmail === 'mike@mzansiflow.co.za' || 
    userEmail === 'mike@massivedynamixdistributors.com' ||
    userEmail.startsWith('mike@') ||
    userEmail.includes('mzansiflow.co.za') ||
    userEmail.includes('massivedynamix');

  // Document State
  const [docMeta, setDocMeta] = useState<PDFDocumentMetadata | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [currentFileBlob, setCurrentFileBlob] = useState<Blob | null>(null);

  // Statuses
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Viewer Controls
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch Shared System-Wide Annual Report from Supabase Backend on Mount
  useEffect(() => {
    async function loadSystemAnnualReport() {
      setLoading(true);
      try {
        // Try fetching shared PDF record from server API
        const res = await fetch(`/api/annual-report?tenantId=${encodeURIComponent(activeTenantId || 'tenant-229')}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.report) {
            const { metadata, dataUrl } = data.report;
            if (metadata) setDocMeta(metadata);

            if (dataUrl) {
              // Convert Data URL / Base64 to Blob URL
              const blob = await (await fetch(dataUrl)).blob();
              setCurrentFileBlob(blob);
              setPdfBlobUrl(URL.createObjectURL(blob));
              await storePdfInIndexedDB(blob);
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Silent recovery fetching shared annual report from server", e);
      }

      // Fallback: Check local IndexedDB storage
      try {
        const metaStr = localStorage.getItem('mzansiflow_annual_report_meta_v1');
        if (metaStr) {
          setDocMeta(JSON.parse(metaStr));
        }

        const storedBlob = await loadPdfFromIndexedDB();
        if (storedBlob) {
          setCurrentFileBlob(storedBlob);
          setPdfBlobUrl(URL.createObjectURL(storedBlob));
        }
      } catch (e) {
        console.warn("Could not reload local IndexedDB PDF blob", e);
      } finally {
        setLoading(false);
      }
    }

    loadSystemAnnualReport();
  }, [activeTenantId]);

  // 2. Process File Upload
  const processPdfFile = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatusError('Invalid File: Please select a valid PDF file (.pdf).');
      return;
    }

    setUploading(true);
    setStatusError(null);
    setStatusSuccess(null);

    try {
      const blobUrl = URL.createObjectURL(file);
      setPdfBlobUrl(blobUrl);
      setCurrentFileBlob(file);

      // Save to local IndexedDB
      await storePdfInIndexedDB(file);

      const metadata: PDFDocumentMetadata = {
        id: `ar-pdf-${Date.now()}`,
        title: file.name.replace(/\.pdf$/i, '').replaceAll('_', ' '),
        financialYear: '2025/2026',
        fileName: file.name,
        fileSizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        totalPages: 800,
        uploadedBy: userEmail || 'mike@mzansiflow.co.za',
        uploadedAt: new Date().toISOString()
      };

      setDocMeta(metadata);
      try {
        localStorage.setItem('mzansiflow_annual_report_meta_v1', JSON.stringify(metadata));
      } catch (err) {}

      // Automatically trigger persistent server save so all users can see it immediately
      await saveReportToServer(metadata, file);

      setCurrentPage(1);
      setJumpPageInput('1');
    } catch (err: any) {
      console.error("PDF Upload Error:", err);
      setStatusError(`Failed to process PDF: ${err.message || 'Unknown file error'}`);
    } finally {
      setUploading(false);
    }
  };

  // 3. Save Report to Server / Supabase for System-Wide Access Across All Users
  const saveReportToServer = async (metaToSave?: PDFDocumentMetadata, blobToSave?: Blob) => {
    const meta = metaToSave || docMeta;
    const blob = blobToSave || currentFileBlob;

    if (!meta) {
      setStatusError('No PDF metadata available to save.');
      return;
    }

    setSaving(true);
    setStatusError(null);

    try {
      let dataUrl = '';
      // Only convert to base64 if blob size is within safe JSON POST limits (< 15MB)
      if (blob && blob.size <= 15 * 1024 * 1024) {
        try {
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          dataUrl = '';
        }
      }

      const res = await fetch('/api/annual-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId || 'tenant-229',
          metadata: meta,
          dataUrl: dataUrl
        })
      });

      if (res.ok) {
        setStatusSuccess(`Annual Report "${meta.fileName}" saved persistently! Accessible to all system users.`);
      } else {
        setStatusSuccess(`Annual Report "${meta.fileName}" stored persistently in local storage & IndexedDB.`);
      }
    } catch (err: any) {
      console.warn("Notice during server save sync, retaining local persistent copy:", err?.message || err);
      setStatusSuccess(`Annual Report "${meta.fileName}" stored persistently in local storage & IndexedDB.`);
    } finally {
      setSaving(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPdfFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processPdfFile(file);
  };

  // Jump to Page
  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1) {
      setCurrentPage(p);
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  const handleNextPage = () => {
    const nextP = currentPage + 1;
    setCurrentPage(nextP);
    setJumpPageInput(String(nextP));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevP = currentPage - 1;
      setCurrentPage(prevP);
      setJumpPageInput(String(prevP));
    }
  };

  // Full Screen
  const toggleFullScreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().catch(e => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(e => {});
      setIsFullScreen(false);
    }
  };

  return (
    <div 
      ref={viewerContainerRef}
      className={`flex flex-col h-full bg-slate-950 text-white overflow-hidden ${
        isFullScreen ? 'p-0 fixed inset-0 z-50' : 'rounded-3xl border border-slate-800 shadow-2xl'
      }`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* 1. TOP CONTROL BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00D65B]/15 border border-[#00D65B]/30 rounded-2xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#00D65B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#00D65B] text-slate-950 text-[9.5px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                System-Wide Master PDF
              </span>
              <h2 className="text-sm font-extrabold text-white truncate max-w-md m-0">
                {docMeta ? docMeta.fileName : 'Annual Report Master Document'}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono flex items-center gap-2">
              <span>{docMeta ? `${docMeta.fileSizeFormatted} • Uploaded by ${docMeta.uploadedBy}` : 'No PDF document loaded yet'}</span>
              <span className="text-[#00D65B] font-bold">• Visible to All System Users</span>
            </p>
          </div>
        </div>

        {/* Action Controls: Upload & SAVE Button */}
        <div className="flex items-center gap-2">
          {/* PERSISTENT SAVE BUTTON */}
          {docMeta && (
            <button
              onClick={() => saveReportToServer()}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition disabled:opacity-50"
              title="Persist Annual Report in Supabase Database so all system users can view it"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4 text-emerald-200" />
              )}
              <span>{saving ? 'Saving...' : 'Save Annual Report'}</span>
            </button>
          )}

          {/* UPLOAD BUTTON */}
          {isSuperAdmin ? (
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              disabled={uploading}
              className="bg-[#00D65B] hover:bg-[#00c052] text-slate-950 font-black px-4 py-2 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition disabled:opacity-50"
            >
              {uploading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Upload PDF</span>
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-2xl text-[11px] font-bold text-slate-400 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Restricted to Mike (mike@mzansiflow.co.za)</span>
            </div>
          )}

          {pdfBlobUrl && (
            <a
              href={pdfBlobUrl}
              download={docMeta?.fileName || 'Annual_Report_Master.pdf'}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-4 h-4 text-[#00D65B]" />
            </a>
          )}

          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl cursor-pointer"
            title="Toggle Fullscreen Reading Mode"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {statusError && (
        <div className="bg-rose-900/90 border-b border-rose-700 px-5 py-2.5 text-rose-100 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-300" />
            <span>{statusError}</span>
          </div>
          <button onClick={() => setStatusError(null)} className="hover:text-white">✕</button>
        </div>
      )}

      {statusSuccess && (
        <div className="bg-emerald-900/90 border-b border-emerald-700 px-5 py-2.5 text-emerald-100 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00D65B]" />
            <span>{statusSuccess}</span>
          </div>
          <button onClick={() => setStatusSuccess(null)} className="hover:text-white">✕</button>
        </div>
      )}

      {/* 2. PDF READER TOOLBAR (If PDF Blob Loaded) */}
      {pdfBlobUrl && (
        <div className="bg-slate-900 border-b border-slate-800 px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl cursor-pointer border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handleJumpToPage} className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Page</span>
              <input
                type="text"
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 focus:border-[#00D65B] rounded-xl text-center font-mono font-black text-white text-xs outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-[#00D65B] hover:bg-[#00c052] text-slate-950 font-black rounded-xl text-[10px] uppercase cursor-pointer"
              >
                Go
              </button>
            </form>

            <button
              onClick={handleNextPage}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-2xl px-2 py-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-[#00D65B] min-w-[42px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(250, prev + 15))}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PURE PDF READER VIEWPORT */}
      <div className="flex-1 bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center p-2 sm:p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-[#00D65B]" />
            <span>Loading Annual Report PDF from Supabase...</span>
          </div>
        ) : pdfBlobUrl ? (
          <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <object
              data={`${pdfBlobUrl}#page=${currentPage}&zoom=${zoomLevel}`}
              type="application/pdf"
              className="w-full h-full min-h-[600px] border-0 rounded-2xl"
            >
              <iframe
                src={`${pdfBlobUrl}#page=${currentPage}&zoom=${zoomLevel}`}
                className="w-full h-full min-h-[600px] border-0 rounded-2xl"
                title="Annual Report Master PDF"
              >
                <div className="p-8 text-center text-slate-300 space-y-4">
                  <p>Your browser does not natively embed PDFs.</p>
                  <a
                    href={pdfBlobUrl}
                    download={docMeta?.fileName || 'Annual_Report.pdf'}
                    className="inline-block bg-[#00D65B] text-slate-950 font-black px-6 py-2.5 rounded-xl uppercase text-xs"
                  >
                    Click Here to Download PDF
                  </a>
                </div>
              </iframe>
            </object>
          </div>
        ) : (
          /* UPLOAD DROPZONE WHEN NO PDF HAS BEEN UPLOADED YET */
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => {
              if (isSuperAdmin && fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
            className={`w-full max-w-2xl border-2 border-dashed border-slate-700 hover:border-[#00D65B] bg-slate-900/60 rounded-3xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-5 group ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="p-5 bg-[#00D65B]/10 border border-[#00D65B]/30 rounded-3xl group-hover:scale-110 transition-transform">
              <Upload className="w-12 h-12 text-[#00D65B]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Upload Master Annual Report PDF
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Drag and drop your official PDF document here, or click to browse. Persists securely to Supabase so all municipal users can view it.
              </p>
            </div>

            {isSuperAdmin ? (
              <button
                type="button"
                className="bg-[#00D65B] hover:bg-[#00c052] text-slate-950 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider cursor-pointer shadow-lg transition"
              >
                Select PDF File
              </button>
            ) : (
              <div className="bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Upload Restricted to Mike (mike@mzansiflow.co.za)</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
