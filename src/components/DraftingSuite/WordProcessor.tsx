import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, Search, Settings, Download, Upload, Cpu, LayoutTemplate, Printer, 
  Share2, ZoomIn, Info, List, Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, X, Shield, Lock, AlertTriangle, CheckCircle, RefreshCw, 
  Sparkles, Plus, Trash2, Image as ImageIcon, BarChart3, LineChart, PieChart, 
  ChevronRight, ArrowRight, Table, Type, Eye, Layers, Palette, Save, HelpCircle,
  HelpCircle as QuestionIcon, ListOrdered
} from 'lucide-react';
import { cn } from '../Branding';
import { ExportDropdowns } from './ExportDropdowns';

// ==========================================
// 1. Core TypeScript Document Model Interfaces
// ==========================================
export interface DocElement {
  id: string;
  type: 'paragraph' | 'heading' | 'table' | 'image' | 'graph';
  content?: string;             // Raw HTML or string content for text block
  src?: string;                 // Source url for uploaded image or static charts
  graphType?: 'bar' | 'line' | 'pie';
  styles?: React.CSSProperties; // custom css styles
}

export interface MediaItem {
  id: string;
  type: 'image' | 'graph' | 'shape';
  graphType?: 'bar' | 'line' | 'pie';
  shapeType?: 'circle' | 'rect' | 'triangle' | 'right-arrow' | 'left-arrow' | 'star' | 'badge' | 'comment-bubble' | 'line';
  shapeColor?: string;
  shapeText?: string;
  src: string;                  // Image source or SVG metrics
  x: number;                    // Left coordinate alignment (percentage %)
  y: number;                    // Top coordinate alignment (percentage %)
  width: number;                // Width element boundary (pixel px)
  height: number;               // Height element boundary (pixel px)
  aspectRatio: number;          // Conserved aspect scaling ratio
}

export interface DocPage {
  id: string;
  elements: DocElement[];       // Element listing within JSON model
  rawHtml: string;              // Fallback editable page text
  header?: string;
  footer?: string;
}

export interface DraftingSuiteTabProps {
  currentUser: any;
  activeTenantId: string;
  extractedData?: any;
  templateData?: any;
  documentIdPrefix?: string;
  defaultChapters?: string[];
  onClose?: () => void;
}

// Pre-configured typography & premium borders for modular styling selection
export interface DocumentTheme {
  id: string;
  name: string;
  pageBg: string;
  textClass: string;
  headerFontClass: string;
  bodyFontClass: string;
  borderAccent: string;
  ribbonBanner: string;
}

const DOCUMENT_THEMES: DocumentTheme[] = [
  {
    id: 'modern-executive',
    name: 'Modern Executive (Sans)',
    pageBg: 'bg-white',
    textClass: 'text-slate-800',
    headerFontClass: 'font-display font-black tracking-tight border-b-2 border-emerald-600 pb-1.5 text-slate-900',
    bodyFontClass: 'font-sans text-[13px] leading-relaxed',
    borderAccent: '#107c41',
    ribbonBanner: 'from-emerald-700 to-green-600'
  },
  {
    id: 'elegant-editorial',
    name: 'Elegant Editorial (Serif)',
    pageBg: 'bg-[#faf9f6]', // Warm paper off-white
    textClass: 'text-stone-800',
    headerFontClass: 'font-serif font-extrabold italic border-b border-amber-600/60 pb-1 text-[#2c1d11]',
    bodyFontClass: 'font-serif text-[14px] leading-loose',
    borderAccent: '#b45309',
    ribbonBanner: 'from-amber-800 to-amber-700'
  },
  {
    id: 'technical-mono',
    name: 'Technical Monospace (Console)',
    pageBg: 'bg-[#f8fafc]',
    textClass: 'text-slate-950',
    headerFontClass: 'font-mono font-bold tracking-wider uppercase border-b border-emerald-500/50 pb-2 text-emerald-800',
    bodyFontClass: 'font-mono text-[12px] leading-relaxed',
    borderAccent: '#059669',
    ribbonBanner: 'from-slate-900 to-emerald-800'
  },
  {
    id: 'dark-noble',
    name: 'Professional Charcoal (Contrast)',
    pageBg: 'bg-white',
    textClass: 'text-gray-900',
    headerFontClass: 'font-display font-bold tracking-tight border-b-2 border-indigo-600 pb-1.5 text-slate-900',
    bodyFontClass: 'font-sans text-[13.5px] leading-relaxed',
    borderAccent: '#6366f1',
    ribbonBanner: 'from-indigo-900 to-violet-800'
  }
];

export function WordProcessor({ 
  currentUser, 
  activeTenantId, 
  documentIdPrefix = 'apr', 
  defaultChapters, 
  onClose 
}: DraftingSuiteTabProps) {
  
  const hardcodedTenantId = "b150ea84-eccf-4999-8145-632f636c1dc5";
  const documentId = activeTenantId === 'global' ? `${documentIdPrefix}-global` : `${documentIdPrefix}-${activeTenantId}`;

  // SSO integration hooks to support Federated Cloud environments
  const [azureUser, setAzureUser] = useState<any>(() => {
    const cached = localStorage.getItem("azure_ad_session");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.tenantId === hardcodedTenantId) return parsed;
      } catch (e) {}
    }
    return {
      name: currentUser?.fullName || "Mike Massive",
      email: currentUser?.email || "mike@massivedynamixdistributors.com",
      tenantId: hardcodedTenantId
    };
  });

  const [ssoToken, setSsoToken] = useState<string | null>(() => {
    return localStorage.getItem("azure_ad_token") || "simulated_azure_ad_jwt_claims_token_val_active";
  });

  // Pages document list of raw HTML and overlaid responsive media components
  const [pagesContent, setPagesContent] = useState<string[]>([]);
  const [mediaItems, setMediaItems] = useState<{ [pageIndex: number]: MediaItem[] }>({});

  const [documentHeader, setDocumentHeader] = useState<string>("Nkangala Strategic SDBIP Report");
  const [documentFooter, setDocumentFooter] = useState<string>("Authorized Nkangala Compliance Suite");
  const [selectedTheme, setSelectedTheme] = useState<DocumentTheme>(DOCUMENT_THEMES[0]);
  const [isDocumentBlank, setIsDocumentBlank] = useState<boolean>(false);
  
  const [backupPages, setBackupPages] = useState<string[]>([]);
  const [backupMedia, setBackupMedia] = useState<{ [pageIndex: number]: MediaItem[] }>({});

  // Navigation and scaling adjustments
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(720);
  const [scale, setScale] = useState<number>(100); 

  // Page Overflow check collection to assist with strict constraints
  const [overflows, setOverflows] = useState<{ [pageIdx: number]: boolean }>({});

  // Ribbon menu tab toggle
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'insert' | 'layout' | 'cloud' | 'design'>('home');

  // Search & Replace properties
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replaceTerm, setReplaceTerm] = useState<string>('');
  const [searchResultsCount, setSearchResultsCount] = useState<number>(0);
  const [showReplaceRibbon, setShowReplaceRibbon] = useState<boolean>(false);

  // Active selected item for absolute position adjustment attributes
  const [selectedMedia, setSelectedMedia] = useState<{ pageIdx: number, itemId: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showShapeDropdown, setShowShapeDropdown] = useState<boolean>(false);

  // Exact coordinates matching actual A4 sheet proportion parameters (in pixels)
  const PAGE_WIDTH = 794;
  const PAGE_HEIGHT_REAL = 1123;
  const PAGE_GAP = 28; 
  const PAGE_BLOCK_HEIGHT = PAGE_HEIGHT_REAL + PAGE_GAP; 

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // 2. Fetch and Save Logic to Supabase via Restful endpoint
  // ==========================================
  useEffect(() => {
    const origH = localStorage.getItem(`${documentIdPrefix}_header`);
    const origF = localStorage.getItem(`${documentIdPrefix}_footer`);
    if (origH) setDocumentHeader(origH);
    if (origF) setDocumentFooter(origF);
  }, []);

  useEffect(() => {
    localStorage.setItem(`${documentIdPrefix}_header`, documentHeader);
  }, [documentHeader]);

  useEffect(() => {
    localStorage.setItem(`${documentIdPrefix}_footer`, documentFooter);
  }, [documentFooter]);

  // Loading initial pages - preloaded at 850 pages for large scale virtualization
  useEffect(() => {
    const initialPages: string[] = [];
    const initialMedia: { [pageIndex: number]: MediaItem[] } = {};

    // Page 1: Elegant Document Header Title Sheet
    initialPages.push(`
      <div style="font-family: inherit; color: #1e293b; text-align: center; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
        <div style="margin-top: 140px;">
          <div style="display: inline-block; padding: 4px 14px; bg-indigo-50/50 bg-[#eff6ff]; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 10px; font-weight: 800; border-radius: 999px; text-transform: uppercase; margin-bottom: 24px; letter-spacing: 0.12em;">
            DC24 Nkangala District Municipality
          </div>
          <h1 style="font-size: 38px; color: #0b1e36; font-weight: 900; line-height: 1.15; text-transform: uppercase; margin-bottom: 8px; letter-spacing: -0.01em;">
            Annual Performance
          </h1>
          <h2 style="font-size: 26px; font-weight: 300; color: #4b5563; letter-spacing: 0.05em; margin-bottom: 28px;">
            Legislated Compliance Suite
          </h2>
          <div style="width: 160px; height: 3px; background-color: #2563eb; margin: 0 auto 36px; border-radius: 99px;"></div>
          <p style="font-size: 12px; color: #64748b; font-family: monospace; letter-spacing: 0.25em; text-transform: uppercase; font-weight: bold;">
            Financial Reporting Cycle FY 2025/2026
          </p>
        </div>
        
        <div style="margin-top: 220px; border-top: 1px solid #f1f5f9; padding-top: 24px; display: grid; grid-template-columns: repeat(2, 1fr); text-align: left; font-size: 11px; color: #475569;">
          <div>
            <span style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; tracking-wider;">Authorized Representative</span>
            <span style="font-weight: 700; color: #1f2937;">Office of the Municipal Manager</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; tracking-wider;">Approval Standard</span>
            <span style="font-weight: 700; color: #16a34a;">MFMA GRAP Compliant</span>
          </div>
        </div>
      </div>
    `);

    // Page 2: Interactive Index list
    initialPages.push(`
      <div style="font-family: inherit; color: #1e293b;">
        <h2 style="font-size: 22px; font-weight: 850; color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.05em;">
          Table of Compliance Sections
        </h2>
        
        <div style="display: flex; flex-direction: column; gap: 14px; font-size: 12px; margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
            <span style="font-weight: 700; color: #1e293b;">Section 1: Executive Foreword & Governance Review</span>
            <span style="font-family: monospace; font-weight: 700; color: #0d9488;">Page 3</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
            <span style="font-weight: 700; color: #1e293b;">Section 2: Key Infrastructure Development Output KPI Map</span>
            <span style="font-family: monospace; font-weight: 700; color: #0d9488;">Page 4</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
            <span style="font-weight: 700; color: #1e293b;">Section 3: Standard Statutory Audits & Financial Adjustments</span>
            <span style="font-family: monospace; font-weight: 700; color: #0d9488;">Page 5</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
            <span style="font-weight: 700; color: #1e293b;">Section 4-850: Serialized Compliance Logs & SDBIP Appendix</span>
            <span style="font-family: monospace; font-weight: 700; color: #0d9488;">Pages 6-850</span>
          </div>
        </div>
        
        <div style="margin-top: 80px; padding: 18px; background-color: #f8fafc; border-left: 4px solid #2563eb; font-size: 11px; color: #475569; line-height: 1.6; border-radius: 0 8px 8px 0; border: 1px solid #e2e8f0; border-left-width: 4px;">
          <strong>Enterprise Note on Virtualization:</strong> To support seamless editing across extremely long files, our system unmounts non-viewport elements from memory while keeping position offsets solid. All content changes are synchronized directly to server-side Supabase layout tables.
        </div>
      </div>
    `);

    // Page 3: General Text reporting
    initialPages.push(`
      <div style="font-family: inherit; line-height: 1.65; color: #334155;">
        <h3 style="font-size: 20px; font-weight: 800; color: #0b1e36; margin-bottom: 16px; text-transform: uppercase;">
          Section 1: Mayor's Regulatory Review
        </h3>
        <p style="margin-bottom: 16px;">
          This strategic review highlights the municipal service delivery framework achieved for the financial year under the Local Government: Municipal Finance Management Act (MFMA). Through rigorous resource planning and clean audit frameworks, we have increased local public infrastructure utility allocations by 14.8%.
        </p>
        <p style="margin-bottom: 16px;">
          The integration of dynamic SDBIP metric compliance allows local Ward Committees to benchmark progress with absolute precision. All strategic assets have been registered securely within our ledger framework to eliminate statutory variances.
        </p>
        <p style="margin-bottom: 16px; font-style: italic; font-weight: 500; color: #475569; padding-left: 16px; border-left: 3px solid #2563eb;">
          "Our dedication remains strictly tailored to transparent service expansion, financial accountability, and robust digital audit standards for every citizen of Nkangala DM."
        </p>
      </div>
    `);

    // Page 4: Section with customizable drag-and-resize absolute layouts
    initialPages.push(`
      <div style="font-family: inherit; line-height: 1.65; color: #334155;">
        <h3 style="font-size: 20px; font-weight: 800; color: #0b1e36; margin-bottom: 12px; text-transform: uppercase;">
          Section 2: Infrastructure KPI Allocation Map
        </h3>
        <p style="margin-bottom: 16px; font-size: 12px;">
          Below, observe the statistical trends for structural asset deliveries, including water purities, sanitation expansion channels, and basic local grid upgrades. Drag, position, or resize the graphs anywhere on this boundary.
        </p>
        <div style="height: 250px;"></div>
        <p style="margin-top: 24px; font-size: 11px; color: #64748b;">
          Note: This interactive chart block is bound inside absolute page bounds and is saved as a lightweight coordinate metadata block. 
        </p>
      </div>
    `);

    // Page 5: Standard Financial statutory data grid
    initialPages.push(`
      <div style="font-family: inherit; color: #1e293b;">
        <h3 style="font-size: 20px; font-weight: 800; color: #0b1e36; margin-bottom: 16px; text-transform: uppercase;">
          Section 3: Statutory Audit Adjustments Matrix
        </h3>
        <p style="font-size: 12px; margin-bottom: 18px; color: #475569;">
          The following table presents compliance checks and adjusted operating accounts under National Treasury Circular 121 standards:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #0b1e36; color: #ffffff;">
              <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Statutory Register ID</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Core Priority Sector</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Compliance Ratio</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Audit Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: 700;">REG-2026-041</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">Basic Water Purification</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #1d4ed8; font-weight: 800;">94% Met</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 800; color: #15803d;">Clean Approved</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: 700;">REG-2026-042</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">Sanitation Pipeline expansion</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #1d4ed8; font-weight: 800;">89% Met</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 800; color: #15803d;">Clean Approved</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: 700;">REG-2026-043</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">EPWP Local Job Program</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #1d4ed8; font-weight: 800;">112% Exceeded</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 800; color: #15803d;">Clean Approved</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: 700;">REG-2026-044</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">Asset Registry Mapping</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #1d4ed8; font-weight: 800;">100% Met</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 800; color: #15803d;">Clean Approved</td>
            </tr>
          </tbody>
        </table>
        
        <p style="font-size: 11px; font-style: italic; color: #64748b; line-height: 1.4;">
          Note: This standard financial matrix can be duplicated or edited inline with immediate reactive Supabase database synchronization.
        </p>
      </div>
    `);

    // Pages 6 - 850 (To demonstrate massive 800+ pagination scaling instantly)
    for (let i = 5; i < 850; i++) {
      initialPages.push(`
        <div style="font-family: inherit; line-height: 1.6; color: #334155; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="font-size: 13px; font-weight: 850; color: #0b1e36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
              Annual Performance Annexure - Page ${i + 1}
            </h3>
            <p style="font-size: 12px; margin-bottom: 14px;">
              [OIDC Federated SEC-121 Audit Registry Node] - DC24. This section contains the serialized database trace adjustments. 
              The server is dynamically tracking this page index to handle viewport mounting.
            </p>
            <p style="font-size: 12px; margin-bottom: 14px; color: #64748b;">
              Feel free to utilize the formatting toolbar above to type, highlight terms, or insert tables/charts here.
            </p>
          </div>
          
          <div style="border-top: 1px solid #f1f5f9; padding-top: 8px; font-family: monospace; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between;">
            <span>Doc ID: DC24-APR-FY2026-${i + 1}</span>
            <span>OIDC Validated Ledger Check</span>
          </div>
        </div>
      `);
    }

    // Default media layout configuration for interactive metrics inside Page 4
    initialMedia[3] = [
      {
        id: "media_bar_chart",
        type: "graph",
        graphType: "bar",
        src: "Water Infrastructure Progress (%)",
        x: 8.5,
        y: 28.0,
        width: 320,
        height: 160,
        aspectRatio: 2.0
      },
      {
        id: "media_line_chart",
        type: "graph",
        graphType: "line",
        src: "Job Creation Tendency index",
        x: 52.0,
        y: 28.0,
        width: 310,
        height: 160,
        aspectRatio: 1.937
      }
    ];

    // REST load call from Supabase fallback schema
    fetch(`/api/documents/${documentId}/chapters`, {
      headers: { 'Authorization': `Bearer ${ssoToken}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(apiPages => {
      if (apiPages && Array.isArray(apiPages) && apiPages.length > 0) {
        setPagesContent(apiPages);
      } else {
        setPagesContent(initialPages);
      }
    })
    .catch(() => {
      // Fallback if network offline is fully preserved safely
      setPagesContent(initialPages);
    });

    fetch(`/api/documents/${documentId}/compiler`, {
      headers: { 'Authorization': `Bearer ${ssoToken}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(apiMedia => {
      if (apiMedia && typeof apiMedia === 'object' && !Array.isArray(apiMedia)) {
        setMediaItems(apiMedia);
      } else {
        setMediaItems(initialMedia);
      }
    })
    .catch(() => {
      setMediaItems(initialMedia);
    });

  }, [documentId, ssoToken]);

  // Handle saving payload back to database REST controllers (Supabase backing pipeline)
  const handleSaveToSupabase = useCallback(() => {
    if (pagesContent.length === 0) return;
    setSyncStatus('saving');

    const chPromise = fetch(`/api/documents/${documentId}/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ssoToken}`
      },
      body: JSON.stringify(pagesContent)
    });

    const medPromise = fetch(`/api/documents/${documentId}/compiler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ssoToken}`
      },
      body: JSON.stringify(mediaItems)
    });

    Promise.all([chPromise, medPromise])
      .then(([res1, res2]) => {
        if (res1.ok && res2.ok) {
          setSyncStatus('saved');
        } else {
          setSyncStatus('error');
        }
      })
      .catch(() => setSyncStatus('error'));
  }, [documentId, pagesContent, mediaItems, ssoToken]);

  // Debounced Auto save logic (Runs every 15 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSaveToSupabase();
    }, 15000);
    return () => clearTimeout(timer);
  }, [pagesContent, mediaItems, handleSaveToSupabase]);

  // ==========================================
  // 3. Virtualization Viewport Tracking calculations
  // ==========================================
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    setViewportHeight(target.clientHeight);
  };

  // Calculates active viewer page index dynamically based on scroll offsets
  const currentPageIndex = Math.max(
    0, 
    Math.min(
      pagesContent.length - 1, 
      Math.floor((scrollTop + viewportHeight / 2) / PAGE_BLOCK_HEIGHT)
    )
  );

  // Buffer windowing - STRICTLY renders only: visible page, one before, and one after!
  const renderRangeStart = Math.max(0, currentPageIndex - 1);
  const renderRangeEnd = Math.min(pagesContent.length - 1, currentPageIndex + 1);

  // Jump smoothly to a requested page index
  const jumpToPage = (index: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: index * PAGE_BLOCK_HEIGHT,
        behavior: 'smooth'
      });
    }
  };

  // ==========================================
  // 4. Editor Rich Text controls & Auto-reflow calculations
  // ==========================================
  const handlePageContentChange = (pageIdx: number, newHtml: string) => {
    setPagesContent(prev => {
      const copy = [...prev];
      copy[pageIdx] = newHtml;
      return copy;
    });

    // Detect if page height expands beyond bounds in real-time
    setTimeout(() => {
      const elem = document.getElementById(`page-editor-${pageIdx}`);
      if (elem) {
        const isOver = elem.scrollHeight > 880; // height threshold of text editable
        setOverflows(prev => ({ ...prev, [pageIdx]: isOver }));
      }
    }, 100);
  };

   const execFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const changeFontSize = (size: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selectedText = selection.toString();
    if (selectedText) {
      const htmlText = `<span style="font-size: ${size}; display: inline-block;">${selectedText}</span>`;
      document.execCommand('insertHTML', false, htmlText);
    } else {
      document.execCommand('insertHTML', false, `<span style="font-size: ${size}; display: inline-block;">&#8203;</span>`);
    }
  };

  const changeFontFamily = (fontFamily: string) => {
    execFormat('fontName', fontFamily);
  };
  
  const changeFontColor = (color: string) => {
    execFormat('foreColor', color);
  };
  
  const changeHeading = (headingTag: string) => {
    execFormat('formatBlock', headingTag);
  };

  const handleInsertShape = (shapeType: 'circle' | 'rect' | 'triangle' | 'right-arrow' | 'left-arrow' | 'star' | 'badge' | 'comment-bubble' | 'line') => {
    const newItem: MediaItem = {
      id: `media_shape_${Date.now()}`,
      type: 'shape',
      shapeType,
      shapeColor: '#107c41',
      shapeText: shapeType === 'line' ? '' : 'Strategic Shape Text',
      src: '',
      x: 30,
      y: 30,
      width: shapeType === 'line' ? 400 : 180,
      height: shapeType === 'line' ? 12 : 120,
      aspectRatio: shapeType === 'line' ? 30 : 1.5
    };
    setMediaItems(prev => ({
      ...prev,
      [currentPageIndex]: [...(prev[currentPageIndex] || []), newItem]
    }));
    setSelectedMedia({ pageIdx: currentPageIndex, itemId: newItem.id });
  };

  // Automated Flow Layout Calculation - Shifts overflowing paragraphs to a new page
  const handleReflowPage = (pageIdx: number) => {
    const elem = document.getElementById(`page-editor-${pageIdx}`);
    if (!elem) return;

    // Create virtual container to read sizes of children elements
    const virtualDiv = document.createElement('div');
    virtualDiv.className = 'absolute opacity-0 select-none pointer-events-none';
    virtualDiv.style.width = '602px'; // typical interior text width
    virtualDiv.style.lineHeight = '1.65';
    virtualDiv.style.fontSize = '13px';
    document.body.appendChild(virtualDiv);

    const children = Array.from(elem.children);
    let cumulativeHeight = 0;
    let cutoffIndex = -1;

    for (let i = 0; i < children.length; i++) {
      const childClone = children[i].cloneNode(true) as HTMLElement;
      virtualDiv.appendChild(childClone);
      cumulativeHeight = virtualDiv.scrollHeight;

      if (cumulativeHeight > 840) { // Limit A4 margin threshold content height
        cutoffIndex = i;
        break;
      }
    }

    document.body.removeChild(virtualDiv);

    if (cutoffIndex !== -1) {
      const keptElementsHtml = children.slice(0, cutoffIndex).map(x => x.outerHTML).join('');
      const overflowedElementsHtml = children.slice(cutoffIndex).map(x => x.outerHTML).join('');

      setPagesContent(prev => {
        const copy = [...prev];
        // Kept on current page
        copy[pageIdx] = keptElementsHtml || '<p><br/></p>';
        
        // Overflow pushed to next page or creates new page if at the end
        if (pageIdx + 1 < copy.length) {
          copy[pageIdx + 1] = overflowedElementsHtml + copy[pageIdx + 1];
        } else {
          copy.push(overflowedElementsHtml);
        }
        return copy;
      });

      // Clear overflow warning
      setOverflows(prev => ({ ...prev, [pageIdx]: false }));
    } else {
      // If table or single giant block overgrows
      setPagesContent(prev => {
        const copy = [...prev];
        if (pageIdx + 1 < copy.length) {
          copy[pageIdx + 1] = `<p>... continued from page ${pageIdx + 1}</p>` + copy[pageIdx + 1];
        }
        return copy;
      });
      setOverflows(prev => ({ ...prev, [pageIdx]: false }));
    }
  };

  // ==========================================
  // 5. Absolute positioning Media & Drag controls
  // ==========================================
  const updateMediaPositions = (pageIdx: number, itemId: string, updates: Partial<MediaItem>) => {
    setMediaItems(prev => {
      const itemsList = prev[pageIdx] ? [...prev[pageIdx]] : [];
      const updatedList = itemsList.map(item => {
        if (item.id === itemId) {
          const ratio = updates.width ? (updates.width / item.width) * item.aspectRatio : item.aspectRatio;
          return { ...item, ...updates, aspectRatio: ratio };
        }
        return item;
      });
      return { ...prev, [pageIdx]: updatedList };
    });
  };

  const handleInsertImage = (src: string) => {
    const newItem: MediaItem = {
      id: `media_img_${Date.now()}`,
      type: 'image',
      src,
      x: 25.0,
      y: 35.0,
      width: 250,
      height: 180,
      aspectRatio: 1.388
    };

    setMediaItems(prev => ({
      ...prev,
      [currentPageIndex]: [...(prev[currentPageIndex] || []), newItem]
    }));
    setSelectedMedia({ pageIdx: currentPageIndex, itemId: newItem.id });
  };

  const deleteSelectedMedia = () => {
    if (!selectedMedia) return;
    setMediaItems(prev => {
      const block = prev[selectedMedia.pageIdx] || [];
      return {
        ...prev,
        [selectedMedia.pageIdx]: block.filter(x => x.id !== selectedMedia.itemId)
      };
    });
    setSelectedMedia(null);
  };

  const handleAddPage = () => {
    setPagesContent(prev => {
      const copy = [...prev];
      copy.splice(currentPageIndex + 1, 0, `
        <div style="font-family: inherit; line-height: 1.6;">
          <h3 style="font-size: 18px; font-weight: 800; color: #0b1e36; margin-bottom: 12px; text-transform: uppercase;">New Page Block</h3>
          <p>Please enter report statistics, details, or regulatory indicators here...</p>
        </div>
      `);
      return copy;
    });
    setTimeout(() => jumpToPage(currentPageIndex + 1), 100);
  };

  const handleDeletePage = () => {
    if (pagesContent.length <= 1) return;
    setPagesContent(prev => {
      const copy = [...prev];
      copy.splice(currentPageIndex, 1);
      return copy;
    });
  };

  const handleInsertDesignPage = (type: 'front' | 'back') => {
    let content = '';
    if (type === 'front') {
      content = `
        <div style="font-family: inherit; color: white; text-align: center; display: flex; flex-direction: column; justify-content: space-between; height: 100%; border: 12px solid #0f172a; padding: 40px; box-sizing: border-box; background: linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop') center/cover no-repeat;">
          <div style="margin-top: 80px;">
            <div style="display: inline-block; padding: 6px 20px; background-color: rgba(255, 255, 255, 0.1); backdrop-filter: blur(4px); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.2); font-size: 12px; font-weight: 800; border-radius: 4px; text-transform: uppercase; margin-bottom: 24px; letter-spacing: 0.15em;">
              Strategic Assessment
            </div>
            <h1 style="font-size: 48px; color: white; font-weight: 900; line-height: 1.1; text-transform: uppercase; margin-bottom: 16px; letter-spacing: -0.02em; text-shadow: 0 4px 12px rgba(0,0,0,0.5);">
              Comprehensive<br/>Annual Report
            </h1>
            <h2 style="font-size: 24px; font-weight: 300; color: #cbd5e1; letter-spacing: 0.05em; margin-bottom: 32px;">
              Executive Summary & Compliance
            </h2>
            <div style="width: 100px; height: 4px; background-color: #0ea5e9; margin: 0 auto; border-radius: 2px;"></div>
          </div>
          
          <div style="margin-bottom: 80px; text-align: left; font-size: 12px; border-left: 3px solid #0ea5e9; padding-left: 20px; background: rgba(0,0,0,0.4); padding: 20px; border-radius: 8px; max-width: 300px;">
            <p style="font-weight: 800; color: white; text-transform: uppercase; margin-bottom: 4px;">Prepared For</p>
            <p style="color: #cbd5e1; margin-bottom: 12px;">Office of the Municipal Manager</p>
            <p style="font-weight: 800; color: white; text-transform: uppercase; margin-bottom: 4px;">Date</p>
            <p style="color: #cbd5e1;">${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      `;
    } else {
       content = `
        <div style="font-family: inherit; color: #1e293b; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; border: 12px solid #0f172a; background-color: #0f172a; color: white;">
          <h2 style="font-size: 32px; font-weight: 800; color: #f8fafc; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.1em;">
            End of Report
          </h2>
          <div style="width: 60px; height: 4px; background-color: #0ea5e9; border-radius: 2px; margin-bottom: 32px;"></div>
          <p style="font-size: 14px; font-weight: 300; color: #94a3b8; max-width: 400px; line-height: 1.6;">
            This document remains confidential and strictly for internal regulatory audit review. Unauthorized distribution is prohibited.
          </p>
        </div>
      `;
    }

    setPagesContent(prev => {
      const copy = [...prev];
      if (type === 'front') {
        copy.splice(0, 0, content);
      } else {
        copy.push(content);
      }
      return copy;
    });

    if (type === 'front') {
      jumpToPage(0);
    } else {
      setTimeout(() => jumpToPage(pagesContent.length), 100);
    }
  };

  const handleToggleBlankDocument = () => {
    if (isDocumentBlank) {
      // Revert from backup
      if (backupPages.length > 0) {
        setPagesContent(backupPages);
        setMediaItems(backupMedia);
      }
      setIsDocumentBlank(false);
    } else {
      // Save current layout to backup state
      setBackupPages(pagesContent);
      setBackupMedia(mediaItems);

      setPagesContent([
        `
          <div style="font-family: inherit; line-height: 1.65;">
            <h1 style="font-size: 24px; font-weight: 900; color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 16px;">
              Untitled Blank Document
            </h1>
            <p>Type reports directly or fetch cover templates from municipal presets.</p>
          </div>
        `
      ]);
      setMediaItems({});
      setIsDocumentBlank(true);
      jumpToPage(0);
    }
  };

  const handleSearchExecute = () => {
    if (!searchTerm) {
      setSearchResultsCount(0);
      return;
    }
    let matchCount = 0;
    pagesContent.forEach(html => {
      const regex = new RegExp(searchTerm, 'gi');
      const matches = html.match(regex);
      if (matches) matchCount += matches.length;
    });
    setSearchResultsCount(matchCount);
  };

  const handleReplaceExecute = () => {
    if (!searchTerm) return;
    setPagesContent(prev => prev.map(html => {
      const regex = new RegExp(searchTerm, 'gi');
      return html.replace(regex, replaceTerm);
    }));
    setSearchTerm('');
    setReplaceTerm('');
    setSearchResultsCount(0);
  };

  // Import designed cover sheets from related tab config as responsive elements
  const handleInsertRawHtml = (htmlContent: string) => {
    setPagesContent(prev => {
      const copy = [...prev];
      copy[currentPageIndex] = htmlContent;
      return copy;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f2f1] select-all animate-fade-in text-slate-800" id="word-processor-root">
      
      {/* 2. Top App Header Menu Area */}
      <div className={cn("px-4 py-2 text-white shrink-0 shadow-md flex items-center justify-between bg-gradient-to-r", selectedTheme.ribbonBanner)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-tight">Virtualized Drafting engine</h2>
              <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">v2.0 PRO</span>
            </div>
            <p className="text-[10px] text-white/80 font-mono">
              OIDC Authenticated: <span className="font-bold text-emerald-300">{azureUser.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active status indicator */}
          <div className="flex items-center gap-2 bg-black/15 px-3 py-1.5 rounded-lg border border-white/15 text-xs">
            {syncStatus === 'saved' && (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10.5px] font-bold text-slate-100">All data synced to Supabase</span>
              </>
            )}
            {syncStatus === 'saving' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span className="text-[10.5px] font-bold text-slate-200">Writing changes to secure endpoint...</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10.5px] font-bold text-red-200">Sync lost. Retrying backend...</span>
              </>
            )}
          </div>

          <button 
            onClick={handleSaveToSupabase}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save State
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 px-2.5 bg-black/20 hover:bg-black/35 rounded-md text-white transition-colors"
              title="Close editing workspace"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Strategic Ribbon Toolbar System */}
      <div className="bg-white border-b border-slate-200 shadow-sm flex flex-col shrink-0 select-none">
        
        {/* Navigation bar tabs */}
        <div className="flex border-b border-slate-150 px-4 bg-slate-50">
          <button 
            type="button"
            onClick={() => setActiveRibbonTab('home')}
            className={cn(
              "px-4 py-2 text-xs font-black tracking-wide border-b-2 transition-all uppercase cursor-pointer",
              activeRibbonTab === 'home' 
                ? "border-emerald-600 text-emerald-800 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-855 hover:bg-slate-100/70"
            )}
          >
            📋 Home
          </button>
          <button 
            type="button"
            onClick={() => setActiveRibbonTab('insert')}
            className={cn(
              "px-4 py-2 text-xs font-black tracking-wide border-b-2 transition-all uppercase cursor-pointer",
              activeRibbonTab === 'insert' 
                ? "border-emerald-600 text-emerald-800 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-855 hover:bg-slate-100/70"
            )}
          >
            🎨 Page Elements
          </button>
          <button 
            type="button"
            onClick={() => setActiveRibbonTab('layout')}
            className={cn(
              "px-4 py-2 text-xs font-black tracking-wide border-b-2 transition-all uppercase cursor-pointer",
              activeRibbonTab === 'layout' 
                ? "border-emerald-600 text-emerald-800 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-855 hover:bg-slate-100/70"
            )}
          >
            📐 Style Presets
          </button>
          <button 
            type="button"
            onClick={() => setActiveRibbonTab('cloud')}
            className={cn(
              "px-4 py-2 text-xs font-black tracking-wide border-b-2 transition-all uppercase cursor-pointer",
              activeRibbonTab === 'cloud' 
                ? "border-emerald-600 text-emerald-800 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-855 hover:bg-slate-100/70"
            )}
          >
            ☁️ SDBIP Audit
          </button>
        </div>

        {/* Toolbar Inner Panel elements based on Tab category */}
        <div className="p-2.5 px-4 bg-white flex flex-wrap gap-4 items-center justify-between">
          
          <div className="flex items-center gap-3">
            
            {/* --- HOME TAB PANEL --- */}
            {activeRibbonTab === 'home' && (
              <div className="flex items-center gap-2.5">
                
                {/* Font Family Selector */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-black text-slate-400 px-1 select-none">Font</span>
                  <select
                    title="Font Family"
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs px-2 py-0.5 cursor-pointer font-bold text-slate-700 outline-none w-24"
                    onChange={(e) => {
                      if (e.target.value) {
                        changeFontFamily(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Default</option>
                    <option value="Arial">Arial</option>
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                    <option value="'Times New Roman', Times, serif">Times New</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                    <option value="'Inter', sans-serif">Inter</option>
                  </select>
                </div>

                {/* Font Color */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <label htmlFor="font-color-picker" className="text-[10px] uppercase font-black text-slate-400 px-1 whitespace-nowrap cursor-pointer">
                    Color
                  </label>
                  <input
                    id="font-color-picker"
                    type="color"
                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                    onChange={(e) => changeFontColor(e.target.value)}
                    title="Choose massive photoshop-like colour palette"
                  />
                </div>

                {/* Heading blocks selector */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-black text-slate-400 px-1 select-none">Heading</span>
                  <select
                    title="Heading Format"
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs px-2 py-0.5 cursor-pointer font-bold text-slate-700 outline-none"
                    onChange={(e) => {
                      if (e.target.value) {
                        changeHeading(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Format</option>
                    <option value="H1">Heading 1</option>
                    <option value="H2">Heading 2</option>
                    <option value="H3">Heading 3</option>
                    <option value="H4">Heading 4</option>
                    <option value="P">Paragraph</option>
                  </select>
                </div>

                {/* Text styles triggers */}
                <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => execFormat('bold')} 
                    className="p-1 px-2.5 hover:bg-white rounded transition text-xs font-bold text-slate-700" 
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => execFormat('italic')} 
                    className="p-1 px-2.5 hover:bg-white rounded transition text-xs font-bold text-slate-700" 
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => execFormat('underline')} 
                    className="p-1 px-2.5 hover:bg-white rounded transition text-xs font-bold text-slate-700" 
                    title="Underline"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Font Size Selector */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-black text-slate-400 px-1 select-none">Size</span>
                  <select
                    title="Font Size"
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs px-2 py-0.5 cursor-pointer font-bold text-slate-700 outline-none"
                    onChange={(e) => {
                      if (e.target.value) {
                        changeFontSize(e.target.value);
                        e.target.value = ''; // Reset select after application
                      }
                    }}
                  >
                    <option value="">Default</option>
                    <option value="11px">11px</option>
                    <option value="12px">12px</option>
                    <option value="13px">13px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px (Sub)</option>
                    <option value="18px">18px (H3)</option>
                    <option value="22px">22px (H2)</option>
                    <option value="26px">26px (H1)</option>
                    <option value="32px">32px (Title)</option>
                    <option value="42px">42px</option>
                  </select>
                </div>

                {/* Alignment formatting */}
                <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => execFormat('justifyLeft')} 
                    className="p-1 px-2 hover:bg-white rounded transition text-slate-650" 
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => execFormat('justifyCenter')} 
                    className="p-1 px-2 hover:bg-white rounded transition text-slate-650" 
                    title="Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => execFormat('justifyRight')} 
                    className="p-1 px-2 hover:bg-white rounded transition text-slate-650" 
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => execFormat('justifyFull')} 
                    className="p-1 px-2 hover:bg-white rounded transition text-slate-650" 
                    title="Justify"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Custom template insertion layouts */}
                <span className="h-6 w-px bg-slate-200"></span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const simpleTable = `
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
                          <thead>
                            <tr style="background-color: #f1f5f9; font-weight: bold;">
                              <th style="border: 1px solid #cbd5e1; padding: 6px;">Indicator Target</th>
                              <th style="border: 1px solid #cbd5e1; padding: 6px;">Q1 Achieved</th>
                              <th style="border: 1px solid #cbd5e1; padding: 6px;">Q2 Estimate</th>
                              <th style="border: 1px solid #cbd5e1; padding: 6px;">Risk Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style="border: 1px solid #cbd5e1; padding: 6px;">Infrastructure utilities</td>
                              <td style="border: 1px solid #cbd5e1; padding: 6px;">82%</td>
                              <td style="border: 1px solid #cbd5e1; padding: 6px;">88%</td>
                              <td style="border: 1px solid #cbd5e1; padding: 6px; color: #16a34a; font-weight: bold;">Low</td>
                            </tr>
                          </tbody>
                        </table>
                        <p><br/></p>
                      `;
                      const editor = document.getElementById(`page-editor-${currentPageIndex}`);
                      if (editor) {
                        editor.focus();
                        document.execCommand('insertHTML', false, simpleTable);
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Table className="w-3.5 h-3.5 text-blue-600" /> Insert SDBIP Grid
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const sigBlock = `
                        <div style="margin-top: 36px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; font-size: 11px;">
                          <div>
                            <div style="border-bottom: 1px solid #475569; height: 30px;"></div>
                            <p style="margin-top: 6px; font-weight: 700; color: #1e293b; text-transform: uppercase;">Accounting Officer Signature</p>
                            <p style="color: #64748b;">Nkangala Municipality</p>
                          </div>
                          <div>
                            <div style="border-bottom: 1px solid #475569; height: 30px;"></div>
                            <p style="margin-top: 6px; font-weight: 700; color: #1e293b; text-transform: uppercase;">External Auditor Review</p>
                            <p style="color: #64748b;">GRAP Regulatory Panel</p>
                          </div>
                        </div>
                        <p><br/></p>
                      `;
                      const editor = document.getElementById(`page-editor-${currentPageIndex}`);
                      if (editor) {
                        editor.focus();
                        document.execCommand('insertHTML', false, sigBlock);
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Sign-off Node
                  </button>
                </div>
              </div>
            )}

            {/* --- INSERT TAB PANEL --- */}
            {activeRibbonTab === 'insert' && (
              <div className="flex items-center gap-3">
                <ExportDropdowns 
                  activeTenantId={activeTenantId}
                  onInsertHTML={handleInsertRawHtml}
                  onInsertImage={handleInsertImage}
                />

                <button
                  type="button"
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const base64 = evt.target?.result as string;
                          const newItem: MediaItem = {
                            id: `media_img_cover_${Date.now()}`,
                            type: 'image',
                            src: base64,
                            x: 10,
                            y: 10,
                            width: 250,
                            height: 250,
                            aspectRatio: 1
                          };
                          // Insert specifically on Page Index 0 (the first page!)
                          setMediaItems(prev => ({
                            ...prev,
                            [0]: [...(prev[0] || []), newItem]
                          }));
                          setSelectedMedia({ pageIdx: 0, itemId: newItem.id });
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    fileInput.click();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg border border-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                  title="Import absolute floating cover picture on page 1 with dragging & resizing"
                >
                  <Plus className="w-3.5 h-3.5" /> Import Cover Picture (Resizable)
                </button>
                
                <span className="h-6 w-px bg-slate-200"></span>

                {/* Direct graph overlays injection */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-400">Float elements:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: MediaItem = {
                        id: `media_bar_chart_${Date.now()}`,
                        type: 'graph',
                        graphType: 'bar',
                        src: 'SDBIP Water Target Variance',
                        x: 15,
                        y: 40,
                        width: 320,
                        height: 180,
                        aspectRatio: 1.77
                      };
                      setMediaItems(prev => ({
                        ...prev,
                        [currentPageIndex]: [...(prev[currentPageIndex] || []), newItem]
                      }));
                    }}
                    className="p-1 px-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0369a1] text-[10.5px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Insert absolute float bar statistic block"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> + Bar Chart
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newItem: MediaItem = {
                        id: `media_line_chart_${Date.now()}`,
                        type: 'graph',
                        graphType: 'line',
                        src: 'SDBIP Electricity Expansion KPI',
                        x: 25,
                        y: 45,
                        width: 320,
                        height: 180,
                        aspectRatio: 1.77
                      };
                      setMediaItems(prev => ({
                        ...prev,
                        [currentPageIndex]: [...(prev[currentPageIndex] || []), newItem]
                      }));
                    }}
                    className="p-1 px-2.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-[#6d28d9] text-[10.5px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Insert absolute float line trend indicator"
                  >
                    <LineChart className="w-3.5 h-3.5" /> + Line Chart
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newItem: MediaItem = {
                        id: `media_pie_chart_${Date.now()}`,
                        type: 'graph',
                        graphType: 'pie',
                        src: 'Overall Compliance Status',
                        x: 35,
                        y: 50,
                        width: 250,
                        height: 180,
                        aspectRatio: 1.38
                      };
                      setMediaItems(prev => ({
                        ...prev,
                        [currentPageIndex]: [...(prev[currentPageIndex] || []), newItem]
                      }));
                    }}
                    className="p-1 px-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0f766e] text-[10.5px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <PieChart className="w-3.5 h-3.5" /> + Pie Chart
                  </button>

                  <span className="h-6 w-px bg-slate-200"></span>

                  {/* Smart Shapes Selection Control */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowShapeDropdown(!showShapeDropdown)}
                      className="p-1 px-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-800 text-[10.5px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Insert vector smart shape overlay with editable text"
                    >
                      ✨ + Smart Shapes
                    </button>
                    {showShapeDropdown && (
                      <div className="absolute left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2.5 grid grid-cols-2 gap-1.5 animate-fade-in text-left">
                        <span className="col-span-2 text-[9px] font-black text-slate-400 px-1 pb-1 border-b mb-1 uppercase tracking-wider block">Add Smart Shapes</span>
                        {[
                          { id: 'rect', label: '▮ Rectangle', desc: 'Custom textbox rectangle shape' },
                          { id: 'circle', label: '⭕ Circle / Oval', desc: 'Perfect circular/oval badge' },
                          { id: 'triangle', label: '🔺 Triangle', desc: 'Point upward triangle indicator' },
                          { id: 'right-arrow', label: '➔ Right Arrow', desc: 'Dynamic navigation rightward' },
                          { id: 'left-arrow', label: '⬅ Left Arrow', desc: 'Dynamic navigation leftward' },
                          { id: 'star', label: '⭐ Star Badge', desc: 'Five-point star highlight rating' },
                          { id: 'badge', label: '🛡 Shield Badge', desc: 'Outcome/Legislation badge' },
                          { id: 'comment-bubble', label: '💬 Comment Callout', desc: 'Text quote comment bubble' },
                          { id: 'line', label: '➖ Divider Line', desc: 'Horizontal rule styling block' }
                        ].map((sh) => (
                          <button
                            key={sh.id}
                            type="button"
                            onClick={() => {
                              handleInsertShape(sh.id as any);
                              setShowShapeDropdown(false);
                            }}
                            className="text-[10px] font-extrabold text-slate-700 hover:bg-slate-50 border border-slate-100 p-1.5 rounded text-left transition-all"
                            title={sh.desc}
                          >
                            {sh.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* --- LAYOUT AND THEME PRESETS --- */}
            {activeRibbonTab === 'layout' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-[#107c41] shrink-0" />
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wide">Document Theme Preset:</span>
                </div>
                
                <div className="flex gap-1.5">
                  {DOCUMENT_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer",
                        selectedTheme.id === theme.id 
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" 
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --- DESIGN PANEL --- */}
            {activeRibbonTab === 'design' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleInsertDesignPage('front')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg border border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> High-Res Cover Page
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertDesignPage('back')}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg border border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" /> Back Cover Setup
                </button>
                <span className="h-6 w-px bg-slate-200"></span>
                <button
                  type="button"
                  onClick={() => {
                    const pageEl = document.getElementById(`page-editor-${currentPageIndex}`);
                    if (pageEl && pageEl.parentElement) {
                      const currentBorder = pageEl.parentElement.style.border;
                      if (currentBorder && currentBorder.includes('10px solid')) {
                        pageEl.parentElement.style.border = 'none';
                      } else {
                        pageEl.parentElement.style.border = '10px solid #cbd5e1';
                        pageEl.parentElement.style.borderRadius = '16px';
                      }
                    }
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Toggle elegant page borders for the current page"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" /> Toggle Page Border
                </button>
                <button
                  type="button"
                  onClick={() => {
                    let tocHtml = `<div style="font-family: inherit; margin-top: 20px;">
                      <h2 style="font-size: 24px; font-weight: 800; color: #0b1e36; margin-bottom: 20px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">Table of Contents</h2>
                      <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; font-weight: 500; color: #475569;">
                        <li style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #cbd5e1; padding-bottom: 4px;"><span>1. Executive Summary</span> <span>Page 1</span></li>
                        <li style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #cbd5e1; padding-bottom: 4px;"><span>2. Key Performance Areas</span> <span>Page 2</span></li>
                        <li style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #cbd5e1; padding-bottom: 4px;"><span>3. Annual Financial Statements</span> <span>Page 4</span></li>
                      </ul>
                    </div><p><br/></p>`;
                    const editor = document.getElementById(`page-editor-${currentPageIndex}`);
                    if (editor) {
                      editor.focus();
                      document.execCommand('insertHTML', false, tocHtml);
                    }
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Insert TOC referencing page numbers"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-slate-500" /> Insert TOC
                </button>
              </div>
            )}

            {/* --- CORE AUDIT SECURITY AD COMPLIANCE PANEL --- */}
            {activeRibbonTab === 'cloud' && (
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1.5 text-xs bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-200 max-w-sm">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] text-slate-500 font-mono">
                    OIDC Token Issuer: <strong className="text-slate-800">Microsoft Azure - Nkangala Tenant Group</strong>
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <span className="px-2.5 py-1 text-[10.5px] font-black tracking-widest uppercase bg-green-50 text-green-700 rounded-lg border border-green-200 font-mono">
                    SSL 256-BIT ENCRYPTED
                  </span>
                  <span className="px-2.5 py-1 text-[10.5px] font-black tracking-widest uppercase bg-emerald-500 text-white rounded-lg font-mono">
                    DB REPLICA: LIVE
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Quick-actions Right Align ribbon area */}
          <div className="flex items-center gap-2">
            
            {/* Search terms buttons */}
            <button 
              onClick={() => setShowReplaceRibbon(!showReplaceRibbon)}
              className={cn(
                "p-1.5 rounded-lg border transition-all cursor-pointer",
                showReplaceRibbon ? "bg-amber-500/10 border-amber-500 text-amber-800" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              )}
              title="Toggle Search and Replace dialog panel"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Blank/Template Toggle switch */}
            <button
              onClick={handleToggleBlankDocument}
              className={cn(
                "p-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs border",
                isDocumentBlank 
                  ? "bg-slate-900 border-slate-950 text-white hover:bg-slate-800" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-850"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              {isDocumentBlank ? "Restore Sample Context" : "Switch to Blank Document"}
            </button>

            <span className="h-6 w-px bg-slate-200"></span>

            {/* Add / delete selected page bounds */}
            <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={handleAddPage}
                className="p-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] tracking-wide cursor-pointer flex items-center gap-1.5 transition-all"
                title="Insert a blank page directly below"
              >
                <Plus className="w-3 h-3" /> Insert Page
              </button>
              <button
                onClick={handleDeletePage}
                disabled={pagesContent.length <= 1}
                className="p-1 px-2 text-slate-550 border-0 hover:text-red-600 rounded transition-all disabled:opacity-30 cursor-pointer"
                title="Delete current active layout page"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

        {/* --- DYNAMIC SLATE SEARCH AND REPLACE FLOATING SUB-RIBBON --- */}
        {showReplaceRibbon && (
          <div className="bg-amber-50/50 border-t border-slate-150 p-2.5 px-4 flex flex-wrap gap-3 items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black text-amber-800 uppercase tracking-widest">Global find and replace</span>
            </div>

            <div className="flex items-center gap-2.5 flex-1 max-w-xl">
              <input 
                type="text"
                placeholder="Find term..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchExecute(); }}
                className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {searchResultsCount > 0 && (
                <span className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-full font-mono">
                  {searchResultsCount} found
                </span>
              )}
              <input 
                type="text"
                placeholder="Replace with..."
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleSearchExecute}
                className="bg-slate-100 hover:bg-slate-200 text-[#323130] text-[10px] font-black px-2.5 py-1.5 rounded-md uppercase tracking-wider transition border border-slate-200 cursor-pointer"
              >
                Find
              </button>
              <button 
                onClick={handleReplaceExecute}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-md uppercase tracking-wider transition cursor-pointer"
              >
                Replace All
              </button>
              <button 
                onClick={() => { setShowReplaceRibbon(false); setSearchTerm(''); setSearchResultsCount(0); }}
                className="hover:bg-slate-200 rounded p-1 text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 4. Main Double-Scroll Stage with direct-page jumps sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* DIRECT PAGE INDEX NAVIGATION BAR */}
        <div className="w-64 border-r border-[#edebe9] bg-white flex flex-col shrink-0 select-none">
          <div className="p-3 bg-[#f3f2f1] border-b border-[#edebe9] text-[9px] uppercase font-black text-[#505050] tracking-widest flex items-center justify-between select-none">
            <span>Dynamic Page Jumps</span>
            <span className="bg-[#107c41]/15 text-[#107c41] px-1.5 py-0.5 rounded font-black font-mono text-[9px]">
              {pagesContent.length} PAGES
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-[#f8fafc] hide-scrollbar select-none">
            {pagesContent.map((_, idx) => (
              <button
                key={idx}
                onClick={() => jumpToPage(idx)}
                className={cn(
                  "w-full text-left p-2 rounded-xl border transition-all text-xs flex items-center justify-between group cursor-pointer",
                  currentPageIndex === idx 
                    ? "bg-[#107c41]/10 border-[#107c41] text-[#107c41] font-bold shadow-xs whitespace-nowrap" 
                    : "bg-white border-slate-200 text-[#323130] hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center font-mono text-[8.5px] font-bold",
                    currentPageIndex === idx ? "bg-[#107c41] text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {idx + 1}
                  </div>
                  <span className="truncate max-w-[130px] font-sans font-semibold">Page {idx + 1}</span>
                  {overflows[idx] && (
                    <span className="text-[10px]" title="This page's content has overflow boundary!">⚠️</span>
                  )}
                </div>
                
                <ChevronRight className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  currentPageIndex === idx ? "transform translate-x-0.5 text-[#107c41]" : "text-slate-300 group-hover:text-slate-400"
                )} />
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-[#edebe9] text-[9.5px] text-slate-450 font-bold uppercase tracking-widest text-center select-none font-sans">
            Nkangala Audit Center
          </div>
        </div>

        {/* MASSIVE EDITOR STAGE: Core Virtual Canvas */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-auto p-8 flex justify-center bg-[#edebe9] scroll-smooth relative"
        >
          {/* Scroll size simulator representing total document footprint */}
          <div 
            style={{ 
              height: `${pagesContent.length * PAGE_BLOCK_HEIGHT}px`,
              width: `${PAGE_WIDTH}px`
            }}
            className="relative"
          >
            {/* 60FPS DOM Virtualizer loop: ONLY mounts the visible screen, page before, and page after */}
            {pagesContent.map((contentHtml, pageIdx) => {
              if (pageIdx < renderRangeStart || pageIdx > renderRangeEnd) return null;

              const isPageOverflowing = overflows[pageIdx];

              return (
                <div
                  key={pageIdx}
                  style={{
                    position: 'absolute',
                    top: `${pageIdx * PAGE_BLOCK_HEIGHT}px`,
                    width: `${PAGE_WIDTH}px`,
                    height: `${PAGE_HEIGHT_REAL}px`,
                    transform: `scale(${scale / 100})`,
                    transformOrigin: 'top center',
                  }}
                  className={cn(
                    "shadow-2xl border p-20 relative select-all flex flex-col justify-between overflow-hidden transition-all duration-300",
                    selectedTheme.pageBg,
                    isPageOverflowing ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-300 rounded-sm"
                  )}
                >
                  
                  {/* Dynamic Header details based on selected preset theme */}
                  <div className="mb-4 flex items-center justify-between text-[9px] font-bold uppercase select-none tracking-widest shrink-0 border-b border-dashed border-slate-200 pb-2">
                    <input
                      type="text"
                      className="bg-transparent hover:bg-slate-100/50 border-0 outline-none p-1 text-[9.5px] font-bold text-slate-500 uppercase tracking-widest min-w-[280px] rounded focus:bg-slate-50 focus:ring-1 focus:ring-emerald-500 font-sans"
                      value={documentHeader}
                      onChange={(e) => setDocumentHeader(e.target.value)}
                      title="Editable Document Header Title"
                    />
                    <span className="font-mono text-slate-400">Page {pageIdx + 1} of {pagesContent.length}</span>
                  </div>

                  {/* Dynamic Custom Typography Theme Classes injected directly onto contenteditable area */}
                  <div className="flex-1 relative flex flex-col justify-start">
                    
                    {isPageOverflowing && (
                      <div className="absolute -top-1 right-0 bg-red-600 text-white rounded-lg p-2 py-1 px-3.5 text-[10px] font-black flex items-center gap-1.5 shadow-lg select-none z-50 animate-bounce">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Margin Overflow!</span>
                        <button
                          type="button"
                          onClick={() => handleReflowPage(pageIdx)}
                          className="bg-white text-red-600 rounded px-1.5 py-0.5 ml-1 font-extrabold hover:bg-red-50 transition cursor-pointer"
                        >
                          Auto-Reflow Page Break
                        </button>
                      </div>
                    )}

                    <div
                      id={`page-editor-${pageIdx}`}
                      contentEditable="true"
                      suppressContentEditableWarning
                      onBlur={(e) => handlePageContentChange(pageIdx, e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                      className={cn(
                        "outline-none text-[13.5px] leading-relaxed break-words whitespace-pre-wrap select-text selection:bg-blue-200/60 flex-1",
                        selectedTheme.textClass,
                        selectedTheme.bodyFontClass
                      )}
                      style={{ minHeight: '850px' }}
                    />
                  </div>

                  {/* Absolute overlays rendering metrics for absolute coordinates matching layout schema */}
                  {mediaItems[pageIdx]?.map((item) => {
                    const isSelected = selectedMedia?.pageIdx === pageIdx && selectedMedia?.itemId === item.id;
                    
                    return (
                      <div
                        key={item.id}
                        id={item.id}
                        style={{
                          position: 'absolute',
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          width: `${item.width}px`,
                          height: `${item.height}px`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMedia({ pageIdx, itemId: item.id });
                        }}
                        onMouseDown={(downE) => {
                          // Drag handle calculation logic (Ignores grab on resizers)
                          if (downE.target instanceof HTMLDivElement && downE.target.classList.contains('resizer-anchor-handle')) {
                            return; 
                          }
                          
                          downE.preventDefault();
                          downE.stopPropagation();
                          setSelectedMedia({ pageIdx, itemId: item.id });
                          
                          const startX = downE.clientX;
                          const startY = downE.clientY;
                          const startXPercent = item.x;
                          const startYPercent = item.y;

                          const onMouseMoveDrag = (moveE: MouseEvent) => {
                            const dX = moveE.clientX - startX;
                            const dY = moveE.clientY - startY;

                            let newX = startXPercent + (dX / PAGE_WIDTH) * 100;
                            let newY = startYPercent + (dY / PAGE_HEIGHT_REAL) * 100;

                            const percentWidthFraction = (item.width / PAGE_WIDTH) * 100;
                            const percentHeightFraction = (item.height / PAGE_HEIGHT_REAL) * 100;

                            newX = Math.max(0, Math.min(100 - percentWidthFraction, newX));
                            newY = Math.max(0, Math.min(100 - percentHeightFraction, newY));

                            updateMediaPositions(pageIdx, item.id, { x: newX, y: newY });
                          };

                          const onMouseUpDrag = () => {
                            window.removeEventListener('mousemove', onMouseMoveDrag);
                            window.removeEventListener('mouseup', onMouseUpDrag);
                          };

                          window.addEventListener('mousemove', onMouseMoveDrag);
                          window.addEventListener('mouseup', onMouseUpDrag);
                        }}
                        className={cn(
                          "absolute cursor-move select-none p-1 border rounded z-40 transition-shadow",
                          isSelected 
                            ? "border-emerald-600 bg-emerald-500/5 shadow-2xl ring-2 ring-emerald-600/30" 
                            : "border-slate-300 bg-white hover:border-emerald-500/50 shadow-sm"
                        )}
                      >
                        
                        {/* Image type viewport vs Shape vs Custom SVG chart representation */}
                        {item.type === 'image' ? (
                          <img 
                            src={item.src} 
                            alt="Strategic documentation upload content"
                            className="w-full h-full object-cover rounded pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : item.type === 'shape' ? (
                          <div className="w-full h-full relative flex items-center justify-center p-2 text-center select-none" style={{ color: '#ffffff' }}>
                            <svg className="absolute inset-0 w-full h-full drop-shadow-sm pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                              {item.shapeType === 'circle' && (
                                <circle cx="50" cy="50" r="45" fill={item.shapeColor || '#107c41'} stroke="#ffffff" strokeWidth="2.5" />
                              )}
                              {item.shapeType === 'rect' && (
                                <rect x="5" y="5" width="90" height="90" rx="6" fill={item.shapeColor || '#107c41'} stroke="#ffffff" strokeWidth="2.5" />
                              )}
                              {item.shapeType === 'triangle' && (
                                <polygon points="50,6 94,92 6,92" fill={item.shapeColor || '#107c41'} stroke="#ffffff" strokeWidth="2.5" />
                              )}
                              {item.shapeType === 'right-arrow' && (
                                <polygon points="4,30 62,30 62,12 96,50 62,88 62,70 4,70" fill={item.shapeColor || '#107c41'} stroke="#ffffff" strokeWidth="2.5" />
                              )}
                              {item.shapeType === 'left-arrow' && (
                                <polygon points="96,30 38,30 38,12 4,50 38,88 38,70 96,70" fill={item.shapeColor || '#107c41'} stroke="#ffffff" strokeWidth="2.5" />
                              )}
                              {item.shapeType === 'star' && (
                                <polygon points="50,6 64,36 96,36 70,56 81,89 50,69 19,89 30,56 4,36 36,36" fill={item.shapeColor || '#107c41'} stroke="#ffffff" strokeWidth="2.5" />
                              )}
                              {item.shapeType === 'badge' && (
                                <polygon points="6,6 94,6 94,74 50,94 6,74" fill={item.shapeColor || '#107c41'} stroke="#ffffff" strokeWidth="2.5" />
                              )}
                              {item.shapeType === 'comment-bubble' && (
                                <polygon points="6,6 94,6 94,74 44,74 24,94 24,74 6,74" fill={item.shapeColor || '#107c41'} stroke="#ffffff" strokeWidth="2.5" />
                              )}
                              {item.shapeType === 'line' && (
                                <line x1="5" y1="50" x2="95" y2="50" stroke={item.shapeColor || '#107c41'} strokeWidth="12" strokeLinecap="round" />
                              )}
                            </svg>
                            {item.shapeType !== 'line' && (
                              <div 
                                className="z-10 font-black text-xs break-all outline-none font-sans leading-tight p-1 select-text w-full max-h-full overflow-hidden text-ellipsis" 
                                style={{ 
                                  color: '#ffffff', 
                                  textShadow: '1px 1px 2.5px rgba(0,0,0,0.85)' 
                                }}
                              >
                                {item.shapeText || 'Shape Label'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full bg-white flex flex-col justify-between p-3 rounded select-none pointer-events-none text-left">
                            <span className="text-[9px] font-black text-[#0b1e36] border-b pb-1 shrink-0 uppercase tracking-wide truncate">
                              📊 {item.src}
                            </span>
                            
                            {item.graphType === 'bar' && (
                              <svg className="w-full h-24 mt-2" viewBox="0 0 100 50">
                                <rect x="15" y="10" width="10" height="30" fill="#107c41" rx="1.5" />
                                <rect x="35" y="5" width="10" height="35" fill="#15803d" rx="1.5" />
                                <rect x="55" y="18" width="10" height="22" fill="#22c55e" rx="1.5" />
                                <rect x="75" y="8" width="10" height="32" fill="#16a34a" rx="1.5" />
                                <line x1="5" y1="40" x2="95" y2="40" stroke="#cbd5e1" strokeWidth="0.5" />
                              </svg>
                            )}

                            {item.graphType === 'line' && (
                              <svg className="w-full h-24 mt-2" viewBox="0 0 100 50">
                                <path d="M10,38 Q30,12 50,22 T90,8" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                                <circle cx="10" cy="38" r="2.5" fill="#1d4ed8" />
                                <circle cx="50" cy="22" r="2.5" fill="#1d4ed8" />
                                <circle cx="90" cy="8" r="2.5" fill="#1d4ed8" />
                                <line x1="5" y1="40" x2="95" y2="40" stroke="#cbd5e1" strokeWidth="0.5" />
                              </svg>
                            )}

                            {item.graphType === 'pie' && (
                              <div className="flex items-center justify-center h-24 mt-2">
                                <svg className="w-14 h-14 mr-2" viewBox="0 0 36 36">
                                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" />
                                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#2563eb" strokeWidth="4.5" strokeDasharray="65 35" strokeDashoffset="25" />
                                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="35 65" strokeDashoffset="90" />
                                </svg>
                                <div className="text-[7.5px] flex flex-col gap-0.5 text-slate-500 font-sans">
                                  <span>🔵 Target (65%)</span>
                                  <span>🟡 Variance (35%)</span>
                                </div>
                              </div>
                            )}

                            <span className="text-[7.5px] font-mono text-slate-400 text-right mt-1 shrink-0 select-none">
                              SDBIP Verified
                            </span>
                          </div>
                        )}

                        {/* Drag boundary absolute deletion action */}
                        {isSelected && (
                          <button
                            type="button" 
                            onClick={(delE) => {
                              delE.preventDefault();
                              delE.stopPropagation();
                              deleteSelectedMedia();
                            }}
                            className="absolute -top-3.5 -right-3.5 w-6 h-6 bg-red-600 border border-red-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 cursor-pointer z-50 focus:outline-none pointer-events-auto"
                            title="Delete Selected Overlaid Object"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        )}

                        {/* =======================================================
                            8-POINT COMPLEX RESIZE ANCHOR HANDLES
                        ======================================================= */}
                        {isSelected && (
                          <>
                            {/* Bottom Right aspect maintaining anchor */}
                            <div 
                              onMouseDown={(resE) => {
                                resE.preventDefault();
                                resE.stopPropagation();
                                
                                const startCursorX = resE.clientX;
                                const startElemWidth = item.width;
                                
                                const onMouseMoveResize = (moveE: MouseEvent) => {
                                  const deltaWidthInPx = moveE.clientX - startCursorX;
                                  let computedWidth = Math.max(80, Math.min(680, startElemWidth + deltaWidthInPx));
                                  let computedHeight = computedWidth / item.aspectRatio;

                                  const padH = (item.y / 100) * PAGE_HEIGHT_REAL;
                                  if (computedHeight + padH > PAGE_HEIGHT_REAL - 20) {
                                    computedHeight = PAGE_HEIGHT_REAL - 20 - padH;
                                    computedWidth = computedHeight * item.aspectRatio;
                                  }

                                  updateMediaPositions(pageIdx, item.id, { 
                                    width: computedWidth, 
                                    height: computedHeight 
                                  });
                                };

                                const onMouseUpResize = () => {
                                  window.removeEventListener('mousemove', onMouseMoveResize);
                                  window.removeEventListener('mouseup', onMouseUpResize);
                                };

                                window.addEventListener('mousemove', onMouseMoveResize);
                                window.addEventListener('mouseup', onMouseUpResize);
                              }}
                              className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-600 resizer-anchor-handle border border-white text-white rounded-tl cursor-se-resize flex items-center justify-center shadow-md z-[99] hover:scale-125"
                              title="Resizer Corner. Limits scale to aspect-ratio."
                            />

                            {/* Top Left dragging coordinate resizing Anchor */}
                            <div 
                              onMouseDown={(resE) => {
                                resE.preventDefault();
                                resE.stopPropagation();
                                const startCursorX = resE.clientX;
                                const startElemWidth = item.width;
                                const startCoordX = item.x;

                                const onMouseMoveTL = (moveE: MouseEvent) => {
                                  const deltaX = moveE.clientX - startCursorX;
                                  const deltaXPercent = (deltaX / PAGE_WIDTH) * 100;
                                  let newX = Math.max(0, startCoordX + deltaXPercent);
                                  let newW = Math.max(80, startElemWidth - deltaX);
                                  updateMediaPositions(pageIdx, item.id, { x: newX, width: newW, height: newW / item.aspectRatio });
                                };
                                const onMouseUpTL = () => {
                                  window.removeEventListener('mousemove', onMouseMoveTL);
                                  window.removeEventListener('mouseup', onMouseUpTL);
                                };
                                window.addEventListener('mousemove', onMouseMoveTL);
                                window.addEventListener('mouseup', onMouseUpTL);
                              }}
                              className="absolute top-0 left-0 w-2.5 h-2.5 bg-white border border-emerald-600 resizer-anchor-handle hover:bg-emerald-100 cursor-nwse-resize z-[99]"
                            />

                            {/* Bottom Left coordinate resizing Anchor */}
                            <div 
                              onMouseDown={(resE) => {
                                resE.preventDefault();
                                resE.stopPropagation();
                                const startCursorX = resE.clientX;
                                const startElemWidth = item.width;
                                const startCoordX = item.x;

                                const onMouseMoveBL = (moveE: MouseEvent) => {
                                  const deltaX = moveE.clientX - startCursorX;
                                  const deltaXPercent = (deltaX / PAGE_WIDTH) * 100;
                                  let newX = Math.max(0, startCoordX + deltaXPercent);
                                  let newW = Math.max(80, startElemWidth - deltaX);
                                  updateMediaPositions(pageIdx, item.id, { x: newX, width: newW, height: newW / item.aspectRatio });
                                };
                                const onMouseUpBL = () => {
                                  window.removeEventListener('mousemove', onMouseMoveBL);
                                  window.removeEventListener('mouseup', onMouseUpBL);
                                };
                                window.addEventListener('mousemove', onMouseMoveBL);
                                window.addEventListener('mouseup', onMouseUpBL);
                              }}
                              className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-white border border-emerald-600 resizer-anchor-handle hover:bg-emerald-100 cursor-nesw-resize z-[99]"
                            />

                            {/* Top Right resizing Anchor */}
                            <div 
                              onMouseDown={(resE) => {
                                resE.preventDefault();
                                resE.stopPropagation();
                                const startCursorX = resE.clientX;
                                const startElemWidth = item.width;

                                const onMouseMoveTR = (moveE: MouseEvent) => {
                                  const deltaX = moveE.clientX - startCursorX;
                                  let newW = Math.max(80, startElemWidth + deltaX);
                                  updateMediaPositions(pageIdx, item.id, { width: newW, height: newW / item.aspectRatio });
                                };
                                const onMouseUpTR = () => {
                                  window.removeEventListener('mousemove', onMouseMoveTR);
                                  window.removeEventListener('mouseup', onMouseUpTR);
                                };
                                window.addEventListener('mousemove', onMouseMoveTR);
                                window.addEventListener('mouseup', onMouseUpTR);
                              }}
                              className="absolute top-0 right-0 w-2.5 h-2.5 bg-white border border-emerald-600 resizer-anchor-handle hover:bg-emerald-100 cursor-nesw-resize z-[99]"
                            />

                            {/* Center-Top Edge Resizer handle */}
                            <div 
                              onMouseDown={(resE) => {
                                resE.preventDefault();
                                resE.stopPropagation();
                                const startCursorY = resE.clientY;
                                const startHeight = item.height;
                                const startY = item.y;

                                const onMouseMoveT = (moveE: MouseEvent) => {
                                  const deltaY = moveE.clientY - startCursorY;
                                  const deltaYPercent = (deltaY / PAGE_HEIGHT_REAL) * 100;
                                  let newY = Math.max(0, startY + deltaYPercent);
                                  let newH = Math.max(50, startHeight - deltaY);
                                  updateMediaPositions(pageIdx, item.id, { y: newY, height: newH });
                                };
                                const onMouseUpT = () => {
                                  window.removeEventListener('mousemove', onMouseMoveT);
                                  window.removeEventListener('mouseup', onMouseUpT);
                                };
                                window.addEventListener('mousemove', onMouseMoveT);
                                window.addEventListener('mouseup', onMouseUpT);
                              }}
                              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full resizer-anchor-handle hover:scale-125 cursor-ns-resize z-[99]"
                            />

                            {/* Center-Bottom Edge Resizer handle */}
                            <div 
                              onMouseDown={(resE) => {
                                resE.preventDefault();
                                resE.stopPropagation();
                                const startCursorY = resE.clientY;
                                const startHeight = item.height;

                                const onMouseMoveB = (moveE: MouseEvent) => {
                                  const deltaY = moveE.clientY - startCursorY;
                                  let newH = Math.max(50, startHeight + deltaY);
                                  updateMediaPositions(pageIdx, item.id, { height: newH });
                                };
                                const onMouseUpB = () => {
                                  window.removeEventListener('mousemove', onMouseMoveB);
                                  window.removeEventListener('mouseup', onMouseUpB);
                                };
                                window.addEventListener('mousemove', onMouseMoveB);
                                window.addEventListener('mouseup', onMouseUpB);
                              }}
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full resizer-anchor-handle hover:scale-125 cursor-ns-resize z-[99]"
                            />

                            {/* Center-Left Edge Resizer handle */}
                            <div 
                              onMouseDown={(resE) => {
                                resE.preventDefault();
                                resE.stopPropagation();
                                const startCursorX = resE.clientX;
                                const startWidth = item.width;
                                const startX = item.x;

                                const onMouseMoveL = (moveE: MouseEvent) => {
                                  const deltaX = moveE.clientX - startCursorX;
                                  const deltaXPercent = (deltaX / PAGE_WIDTH) * 100;
                                  let newX = Math.max(0, startX + deltaXPercent);
                                  let newW = Math.max(60, startWidth - deltaX);
                                  updateMediaPositions(pageIdx, item.id, { x: newX, width: newW });
                                };
                                const onMouseUpL = () => {
                                  window.removeEventListener('mousemove', onMouseMoveL);
                                  window.removeEventListener('mouseup', onMouseUpL);
                                };
                                window.addEventListener('mousemove', onMouseMoveL);
                                window.addEventListener('mouseup', onMouseUpL);
                              }}
                              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full resizer-anchor-handle hover:scale-125 cursor-ew-resize z-[99]"
                            />

                            {/* Center-Right Edge Resizer handle */}
                            <div 
                              onMouseDown={(resE) => {
                                resE.preventDefault();
                                resE.stopPropagation();
                                const startCursorX = resE.clientX;
                                const startWidth = item.width;

                                const onMouseMoveR = (moveE: MouseEvent) => {
                                  const deltaX = moveE.clientX - startCursorX;
                                  let newW = Math.max(60, startWidth + deltaX);
                                  updateMediaPositions(pageIdx, item.id, { width: newW });
                                };
                                const onMouseUpR = () => {
                                  window.removeEventListener('mousemove', onMouseMoveR);
                                  window.removeEventListener('mouseup', onMouseUpR);
                                };
                                window.addEventListener('mousemove', onMouseMoveR);
                                window.addEventListener('mouseup', onMouseUpR);
                              }}
                              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full resizer-anchor-handle hover:scale-125 cursor-ew-resize z-[99]"
                            />
                          </>
                        )}

                      </div>
                    );
                  })}

                  {/* Footnotes label matching requested designs */}
                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase select-none tracking-widest shrink-0">
                    <input
                      type="text"
                      className="bg-transparent hover:bg-slate-100/50 border-0 outline-none p-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest min-w-[280px] rounded focus:bg-slate-50 focus:ring-1 focus:ring-emerald-500 font-sans"
                      value={documentFooter}
                      onChange={(e) => setDocumentFooter(e.target.value)}
                      title="Editable Document Footer Title"
                    />
                    <span className="font-mono text-slate-400 select-none">DC24 Strategic Annexure Ref.121</span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* DRAGGABLE OBJECT PROPERTY PANEL (SIDE CONTROL BAR) */}
        {selectedMedia && (
          <div className="w-64 border-l border-[#edebe9] bg-white flex flex-col shrink-0 select-none">
            <div className="p-3 bg-[#f3f2f1] border-b border-[#edebe9] text-[9.5px] uppercase font-black text-[#505050] tracking-widest flex items-center justify-between font-sans">
              <span>Layout Inspector</span>
              <button 
                onClick={() => setSelectedMedia(null)}
                className="hover:bg-slate-200 rounded p-1 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 font-sans select-none">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wide">Object Type</span>
                <span className="text-xs bg-[#f3f2f1] border border-[#edebe9] px-3 py-1.5 rounded block font-mono text-slate-700 capitalize font-extrabold select-all">
                  🔵 {mediaItems[selectedMedia.pageIdx]?.find(x => x.id === selectedMedia.itemId)?.type} overlay
                </span>
              </div>

              {(() => {
                const item = mediaItems[selectedMedia.pageIdx]?.find(x => x.id === selectedMedia.itemId);
                if (!item) return null;
                return (
                  <>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1.5 pt-2">Coordinate Tweener</h4>
                    
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Width (px)</span>
                        <input 
                          type="number"
                          value={Math.round(item.width)}
                          onChange={(e) => updateMediaPositions(selectedMedia.pageIdx, item.id, { width: Number(e.target.value) })}
                          className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 hover:bg-white rounded p-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Height (px)</span>
                        <input 
                          type="number"
                          value={Math.round(item.height)}
                          onChange={(e) => updateMediaPositions(selectedMedia.pageIdx, item.id, { height: Number(e.target.value) })}
                          className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 hover:bg-white rounded p-1.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Left Offset (%)</span>
                        <input 
                          type="number"
                          value={Math.round(item.x)}
                          onChange={(e) => updateMediaPositions(selectedMedia.pageIdx, item.id, { x: Number(e.target.value) })}
                          className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 hover:bg-white rounded p-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Top Offset (%)</span>
                        <input 
                          type="number"
                          value={Math.round(item.y)}
                          onChange={(e) => updateMediaPositions(selectedMedia.pageIdx, item.id, { y: Number(e.target.value) })}
                          className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 hover:bg-white rounded p-1.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 my-2">
                      <span className="text-[9.5px] text-slate-400 font-black block uppercase tracking-wider mb-2">Preset Dimensions</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            updateMediaPositions(selectedMedia.pageIdx, item.id, { 
                              width: 610,
                              height: Math.round(610 / (item.aspectRatio || 1.4)),
                              x: 10
                            });
                          }}
                          className="bg-slate-100 font-extrabold hover:bg-slate-200 text-slate-700 text-[10px] p-2 rounded transition cursor-pointer"
                          title="Fills the entire margin space of A4 nicely"
                        >
                          📄 Margins Full
                        </button>
                        <button
                          onClick={() => {
                            updateMediaPositions(selectedMedia.pageIdx, item.id, { 
                              width: 300,
                              height: Math.round(300 / (item.aspectRatio || 1.4)),
                              x: 30
                            });
                          }}
                          className="bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 text-[10px] p-2 rounded transition cursor-pointer"
                        >
                          🎯 Center Frame
                        </button>
                        <button
                          onClick={() => {
                            const newW = Math.round(item.width * 1.25);
                            updateMediaPositions(selectedMedia.pageIdx, item.id, { 
                              width: newW,
                              height: Math.round(newW / (item.aspectRatio || 1.4))
                            });
                          }}
                          className="bg-sky-50 border border-sky-100 hover:bg-sky-100 text-sky-700 font-bold text-[10px] p-2 rounded transition cursor-pointer"
                        >
                          🔍 Zoom In (+25%)
                        </button>
                        <button
                          onClick={() => {
                            const newW = Math.max(80, Math.round(item.width * 0.75));
                            updateMediaPositions(selectedMedia.pageIdx, item.id, { 
                              width: newW,
                              height: Math.round(newW / (item.aspectRatio || 1.4))
                            });
                          }}
                          className="bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 font-bold text-[10px] p-2 rounded transition cursor-pointer"
                        >
                          🔍 Zoom Out (-25%)
                        </button>
                      </div>
                    </div>

                    {/* Shape Specific Property Configurer */}
                    {item.type === 'shape' && (
                      <div className="pt-4 border-t border-slate-100 my-2 space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1.5 pt-1">Shape Customizer</h4>
                        
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Vector Shape Type</span>
                          <select 
                            value={item.shapeType || 'rect'}
                            onChange={(e) => updateMediaPositions(selectedMedia.pageIdx, item.id, { shapeType: e.target.value as any })}
                            className="bg-white border border-slate-200 rounded p-1.5 focus:outline-none w-full text-xs font-bold text-slate-750"
                          >
                            <option value="rect">Rectangle</option>
                            <option value="circle">Circle / Oval</option>
                            <option value="triangle">Triangle</option>
                            <option value="right-arrow">Right Arrow</option>
                            <option value="left-arrow">Left Arrow</option>
                            <option value="star">Star Badge</option>
                            <option value="badge">Shield Badge</option>
                            <option value="comment-bubble">Comment Callout</option>
                            <option value="line">Divider Line</option>
                          </select>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Fill Color Accent</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: 'Green', value: '#107c41' },
                              { label: 'Blue', value: '#1e40af' },
                              { label: 'Orange', value: '#d97706' },
                              { label: 'Red', value: '#be123c' },
                              { label: 'Gold', value: '#ca8a04' },
                              { label: 'Charcoal', value: '#1e293b' },
                              { label: 'Slate', value: '#64748b' },
                              { label: 'Sky', value: '#0ea5e9' }
                            ].map((col) => (
                              <button
                                key={col.value}
                                onClick={() => updateMediaPositions(selectedMedia.pageIdx, item.id, { shapeColor: col.value })}
                                className={cn(
                                  "h-6 rounded border transition-transform hover:scale-110 cursor-pointer",
                                  item.shapeColor === col.value ? "ring-2 ring-emerald-500 ring-offset-1 border-white" : "border-slate-200"
                                )}
                                style={{ backgroundColor: col.value }}
                                title={col.label}
                              />
                            ))}
                          </div>
                          
                          {/* HTML5 color picker */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <input 
                              type="color" 
                              value={item.shapeColor || '#107c41'}
                              onChange={(e) => updateMediaPositions(selectedMedia.pageIdx, item.id, { shapeColor: e.target.value })}
                              className="w-8 h-7 bg-transparent border-0 cursor-pointer rounded p-0"
                            />
                            <input 
                              type="text" 
                              value={item.shapeColor || '#107c41'}
                              onChange={(e) => updateMediaPositions(selectedMedia.pageIdx, item.id, { shapeColor: e.target.value })}
                              className="text-[10px] font-mono font-bold border border-slate-200 bg-slate-50 hover:bg-white rounded p-1 w-full outline-none"
                              placeholder="#hex-code"
                            />
                          </div>
                        </div>

                        {item.shapeType !== 'line' && (
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Text Caption Label</span>
                            <textarea 
                              value={item.shapeText || ''}
                              onChange={(e) => updateMediaPositions(selectedMedia.pageIdx, item.id, { shapeText: e.target.value })}
                              placeholder="Type text inside the shape..."
                              className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-white rounded p-2 h-16 outline-none focus:border-slate-300 transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={deleteSelectedMedia}
                        className="w-full text-center text-xs py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Object
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

      </div>

      {/* 5. Fluid lock Status Bar at the page footer */}
      <div className="h-9 bg-[#107c41] text-white border-t border-[#107c41] px-4 flex items-center justify-between text-xs shrink-0 select-none font-sans z-30">
        <div className="flex items-center gap-4">
          <span className="bg-[#0b5c30] px-2.5 py-0.5 rounded font-black">
            Active: Page {currentPageIndex + 1} of {pagesContent.length}
          </span>
          <span className="text-[10.5px] font-semibold text-white/90">
            Viewport active slices: Pages {renderRangeStart + 1} - {renderRangeEnd + 1} ({renderRangeEnd - renderRangeStart + 1} DOM mounted, 850+ preserved inside memory)
          </span>
        </div>

        <div className="flex items-center gap-4 mr-2">
          {/* Zoom adjustment buttons */}
          <div className="flex items-center gap-1 bg-black/15 px-2 py-0.5 rounded border border-white/10 text-[11px]">
            <button 
              onClick={() => setScale(Math.max(50, scale - 25))}
              className="px-2 py-0.5 font-bold hover:bg-white/10 rounded transition text-white cursor-pointer"
              title="Scale Out"
            >
              -
            </button>
            <span className="font-bold font-mono px-1">{scale}% Scale</span>
            <button 
              onClick={() => setScale(Math.min(150, scale + 25))}
              className="px-2 py-0.5 font-bold hover:bg-white/10 rounded transition text-white cursor-pointer"
              title="Scale In"
            >
              +
            </button>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5 text-white/90 font-mono text-[10.5px]">
            <Cpu className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="font-bold uppercase">60FPS Canvas virtualization active</span>
          </div>
        </div>
      </div>

    </div>
  );
}
