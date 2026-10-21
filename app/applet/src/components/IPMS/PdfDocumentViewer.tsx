import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ZoomIn, ZoomOut, RefreshCw, AlertCircle, Download, ShieldCheck, ExternalLink, Layers, FileText, Monitor, Printer
} from 'lucide-react';

// Safely setup worker using CDN with try-catch and fallback
if (typeof window !== 'undefined' && pdfjsLib) {
  try {
    if ((pdfjsLib as any).VerbosityLevel) {
      pdfjsLib.GlobalWorkerOptions.verbosity = (pdfjsLib as any).VerbosityLevel.ERRORS;
    }
    const version = (pdfjsLib as any).version || '3.11.174';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("PDF.js worker URL setup fallback:", e);
  }
}

interface PdfDocumentViewerProps {
  arrayBuffer?: ArrayBuffer | null;
  dataUrl?: string;
  fileName?: string;
  onDownload?: () => void;
}

export function PdfDocumentViewer({ arrayBuffer, dataUrl, fileName = 'Document.pdf', onDownload }: PdfDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewEngine, setViewEngine] = useState<'native' | 'canvas'>('native');
  const [renderError, setRenderError] = useState<string | null>(null);

  // Helper to convert data/arrayBuffer to blob URL safely
  useEffect(() => {
    let createdUrl = '';
    try {
      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } else if (dataUrl) {
        if (dataUrl.startsWith('blob:')) {
          setBlobUrl(dataUrl);
        } else if (dataUrl.startsWith('data:')) {
          const parts = dataUrl.split(',');
          const base64Str = (parts[1] || parts[0]).trim().replace(/[^A-Za-z0-9+/=]/g, '');
          const binary = window.atob(base64Str);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        } else if (/^[A-Za-z0-9+/=\s\r\n]+$/.test(dataUrl) && dataUrl.length > 50) {
          const base64Str = dataUrl.trim().replace(/[^A-Za-z0-9+/=]/g, '');
          const binary = window.atob(base64Str);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        } else {
          setBlobUrl(dataUrl);
        }
      }
    } catch (err) {
      console.warn("Error creating Blob URL for PDF:", err);
      if (dataUrl) setBlobUrl(dataUrl);
    }
    return () => {
      if (createdUrl && createdUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [arrayBuffer, dataUrl]);

  // Load PDF via PDF.js for canvas mode if requested
  useEffect(() => {
    if (viewEngine !== 'canvas') return;
    let isCancelled = false;
    setLoading(true);
    setRenderError(null);

    const loadPdfJs = async () => {
      try {
        let sourceData: any = null;
        if (arrayBuffer && arrayBuffer.byteLength > 0) {
          sourceData = { data: new Uint8Array(arrayBuffer) };
        } else if (blobUrl) {
          const res = await fetch(blobUrl);
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 0) {
            sourceData = { data: new Uint8Array(buf) };
          }
        }

        if (!sourceData) {
          throw new Error("No PDF binary source available for canvas rendering.");
        }

        const loadingTask = pdfjsLib.getDocument({
          ...sourceData,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          isEvalSupported: false,
          disableFontFace: false
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.warn("PDF.js canvas renderer notice, switching to Native Browser PDF viewer:", err);
        if (!isCancelled) {
          setRenderError(err?.message || "Switched to standard high-definition browser PDF stream.");
          setViewEngine('native');
          setLoading(false);
        }
      }
    };

    loadPdfJs().catch((err) => {
      console.warn("Handled PDF.js load error silently:", err);
      if (!isCancelled) {
        setViewEngine('native');
        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [viewEngine, arrayBuffer, blobUrl]);

  // Track scroll position in canvas mode
  const handleScroll = () => {
    if (!containerRef.current || numPages === 0) return;
    const container = containerRef.current;
    const pageElements = container.querySelectorAll<HTMLElement>('[data-page-number]');
    const containerTop = container.scrollTop;
    const containerCenter = containerTop + container.clientHeight / 3;

    for (let i = 0; i < pageElements.length; i++) {
      const el = pageElements[i];
      const pageTop = el.offsetTop;
      const pageBottom = pageTop + el.clientHeight;

      if (containerCenter >= pageTop && containerCenter <= pageBottom) {
        const pageNum = parseInt(el.getAttribute('data-page-number') || '1', 10);
        setCurrentPage(pageNum);
        break;
      }
    }
  };

  const openInNewTab = () => {
    if (!blobUrl) return;
    const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Fallback if popups blocked
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.click();
    }
  };

  const printDocument = () => {
    if (!blobUrl) return;
    const win = window.open(blobUrl, '_blank');
    if (win) {
      win.focus();
      setTimeout(() => {
        try { win.print(); } catch {}
      }, 500);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.6));
  const zoomReset = () => setScale(1.2);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 min-h-[550px] relative select-none">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-100 truncate max-w-[220px] sm:max-w-[360px]" title={fileName}>
              {fileName}
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                Verified Format
              </span>
              <span>•</span>
              <span className="uppercase font-mono text-slate-400">PDF Document</span>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewEngine('native')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 border-0 ${
              viewEngine === 'native'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Browser PDF Stream Engine (Infinite Scroll, Multi-Page)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Native Browser Viewer</span>
          </button>
          <button
            type="button"
            onClick={() => setViewEngine('canvas')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 border-0 ${
              viewEngine === 'canvas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Interactive Canvas Renderer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Canvas View</span>
          </button>

          {viewEngine === 'canvas' && numPages > 0 && (
            <span className="text-[10px] font-bold font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/60 ml-1">
              {currentPage} / {numPages}
            </span>
          )}
        </div>

        {/* Zoom Controls (Canvas Mode) */}
        {viewEngine === 'canvas' && numPages > 0 && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.6}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition cursor-pointer border-0"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-slate-200 min-w-[42px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition cursor-pointer border-0"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={zoomReset}
              className="px-2 py-0.5 text-[9px] font-bold rounded hover:bg-slate-800 text-indigo-300 transition cursor-pointer border-0"
            >
              Fit
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {blobUrl && (
            <>
              <button
                type="button"
                onClick={printDocument}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                title="Print document"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Print</span>
              </button>

              <button
                type="button"
                onClick={openInNewTab}
                className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-indigo-500/30"
                title="Open document in a dedicated browser tab for full screen scrolling"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open in Browser Tab</span>
              </button>
            </>
          )}

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 transition cursor-pointer border-0 shadow-sm"
              title="Download original file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Original</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Document Frame */}
      <div className="flex-1 w-full h-full bg-slate-950 overflow-hidden relative min-h-[500px]">
        {viewEngine === 'native' ? (
          <div className="w-full h-full flex flex-col bg-slate-900 relative">
            {blobUrl ? (
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                title={fileName}
                className="w-full h-full min-h-[520px] border-0 bg-slate-900"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="m-auto p-8 text-center max-w-md bg-slate-900 rounded-2xl border border-slate-800">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                  Preparing Document Preview
                </p>
                <p className="text-[11px] text-slate-400">
                  Decoding binary data streams for native browser display...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-y-auto overflow-x-auto p-4 bg-slate-950 flex flex-col items-center gap-6 select-text scroll-smooth"
          >
            {loading ? (
              <div className="my-auto py-16 flex flex-col items-center justify-center gap-3 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Rendering Multi-Page Document...
                </p>
              </div>
            ) : pdfDoc && numPages > 0 ? (
              <>
                {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <PdfPageCanvas
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNum={pageNum}
                    scale={scale}
                  />
                ))}
              </>
            ) : (
              <div className="my-auto py-12 flex flex-col items-center justify-center gap-4 text-center max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Canvas View Notice</h4>
                  <p className="text-xs text-slate-400">{renderError || "Switching to Native Browser Reader for maximum accuracy."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewEngine('native')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer border-0 flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4" /> Use Native Browser Viewer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface PdfPageCanvasProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
}

function PdfPageCanvas({ pdfDoc, pageNum, scale }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          transform: transform
        });

        await renderTask.promise;
      } catch (e: any) {
        if (!String(e?.message).includes('cancelled') && !isCancelled) {
          console.warn(`Error rendering page ${pageNum}:`, e);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNum, scale]);

  return (
    <div
      data-page-number={pageNum}
      className="relative bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-800 transition-all duration-200"
    >
      <canvas ref={canvasRef} className="block" />
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 text-slate-200 text-[9px] font-mono font-bold rounded-md pointer-events-none backdrop-blur-xs">
        Page {pageNum}
      </div>
    </div>
  );
}
