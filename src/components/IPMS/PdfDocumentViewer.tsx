import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, 
  ChevronUp, ChevronDown, RefreshCw, AlertCircle, Eye, Download, ShieldCheck
} from 'lucide-react';

// Configure worker using Vite asset URL or fallback
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  }
} catch (e) {
  console.warn("PDF.js worker URL setup fallback:", e);
}

interface PdfDocumentViewerProps {
  arrayBuffer?: ArrayBuffer | null;
  dataUrl?: string;
  fileName?: string;
  onDownload?: () => void;
}

export function PdfDocumentViewer({ arrayBuffer, dataUrl, fileName = 'Document.pdf', onDownload }: PdfDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<{ [pageNum: number]: boolean }>({});

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);

    const loadPdf = async () => {
      try {
        let sourceData: any = null;
        if (arrayBuffer && arrayBuffer.byteLength > 0) {
          sourceData = { data: new Uint8Array(arrayBuffer) };
        } else if (dataUrl) {
          if (dataUrl.startsWith('data:')) {
            const base64 = dataUrl.split(',')[1] || '';
            const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
            const binary = window.atob(clean);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            sourceData = { data: bytes };
          } else {
            sourceData = { url: dataUrl };
          }
        }

        if (!sourceData) {
          throw new Error("No PDF binary source available.");
        }

        const loadingTask = pdfjsLib.getDocument(sourceData);
        const doc = await loadingTask.promise;
        if (isCancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error("PDF.js load error:", err);
        if (!isCancelled) {
          setError(err?.message || "Failed to parse PDF binary.");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [arrayBuffer, dataUrl]);

  // Track scroll position to update current page indicator
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

  const scrollToPage = (pageNum: number) => {
    if (!containerRef.current) return;
    const targetEl = containerRef.current.querySelector<HTMLElement>(`[data-page-number="${pageNum}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.6));
  const zoomReset = () => setScale(1.2);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden text-slate-100 select-none">
      {/* PDF Action & Navigation Toolbar */}
      <div className="px-4 py-2 bg-slate-800/90 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Pages: <strong className="text-white">{currentPage}</strong> / {numPages || '-'}
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => scrollToPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 text-slate-200 transition cursor-pointer border-0"
              title="Previous Page"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToPage(Math.min(currentPage + 1, numPages))}
              disabled={currentPage >= numPages}
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 text-slate-200 transition cursor-pointer border-0"
              title="Next Page"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.6}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition cursor-pointer border-0"
            title="Zoom Out (-)"
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
            className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition cursor-pointer border-0"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={zoomReset}
            className="px-2 py-0.5 text-[9px] font-bold rounded hover:bg-slate-800 text-indigo-300 transition cursor-pointer border-0"
            title="Reset Zoom (Fit)"
          >
            Fit
          </button>
        </div>

        {/* Download original button */}
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 transition cursor-pointer border-0 shadow-sm"
            title="Save file to local laptop"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save Copy</span>
          </button>
        )}
      </div>

      {/* Main Continuous Scroll Viewport */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center gap-6 select-text scroll-smooth"
      >
        {loading ? (
          <div className="my-auto py-16 flex flex-col items-center justify-center gap-3 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Rendering High-Definition Document Pages...
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Extracting vector paths and compliance layout for seamless in-browser scrolling.
            </p>
          </div>
        ) : error ? (
          <div className="my-auto py-12 flex flex-col items-center justify-center gap-4 text-center max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Inline Canvas Rendering Note</h4>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
            {dataUrl && (
              <div className="w-full">
                <p className="text-[10px] text-slate-500 mb-2">You can review via the integrated browser PDF stream below:</p>
                <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-700 bg-white">
                  <object 
                    data={`${dataUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`} 
                    type="application/pdf" 
                    className="w-full h-full"
                  >
                    <iframe src={`${dataUrl}#toolbar=1`} title={fileName} className="w-full h-full border-0" />
                  </object>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => (
              <PdfPageCanvas
                key={pageNum}
                pdfDoc={pdfDoc}
                pageNum={pageNum}
                scale={scale}
                onRendered={() => setRenderedPages(prev => ({ ...prev, [pageNum]: true }))}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

interface PdfPageCanvasProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  onRendered?: () => void;
}

function PdfPageCanvas({ pdfDoc, pageNum, scale, onRendered }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderLoading, setRenderLoading] = useState(true);

  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        setRenderLoading(true);
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Support high-DPI displays
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        if (!isCancelled) {
          setRenderLoading(false);
          if (onRendered) onRendered();
        }
      } catch (e: any) {
        if (!String(e?.message).includes('cancelled') && !isCancelled) {
          console.warn(`Error rendering page ${pageNum}:`, e);
          setRenderLoading(false);
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
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/70 text-slate-300 text-[9px] font-mono font-bold rounded-md pointer-events-none backdrop-blur-xs">
        Page {pageNum}
      </div>
    </div>
  );
}
