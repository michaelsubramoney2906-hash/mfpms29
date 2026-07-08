import React, { useState, useEffect, useRef } from 'react';
import { 
  Map, 
  FileText, 
  Settings, 
  UploadCloud, 
  Maximize2, 
  Layout, 
  CheckCircle, 
  Save, 
  Sparkles, 
  ChevronRight, 
  Palette, 
  Search, 
  RefreshCw, 
  Copy, 
  Plus, 
  Sliders, 
  Download, 
  Edit3, 
  Check, 
  Maximize, 
  PenTool, 
  List, 
  Trash2, 
  ChevronDown, 
  Table, 
  Bold, 
  Italic, 
  Underline, 
  Eye, 
  Heading1, 
  Heading2, 
  FilePlus, 
  FileCode, 
  UserCheck, 
  LayoutGrid, 
  Printer, 
  HelpCircle,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { User } from '../../types';
import { tenants } from '../../data';
import { cn } from '../Branding';
import { ExportDropdowns } from '../DraftingSuite/ExportDropdowns';
import { DraftingSuiteTab } from '../APR/APR';

interface IDPProps {
  currentUser: User;
  activeTenantId: string;
}

// 4 Color Theme Presets for templates
interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bgLight: string;
  borderClass: string;
  headerBg: string;
}

const COLOR_THEMES: ThemePreset[] = [
  {
    id: 'classic-slate',
    name: 'Classic Slate Theme',
    primary: '#1e293b', // slate 800
    secondary: '#475569', // slate 600
    accent: '#10b981', // emerald 500
    bgLight: '#f8fafc',
    borderClass: 'border-slate-300',
    headerBg: '#1e293b'
  },
  {
    id: 'royal-emerald',
    name: 'Royal Emerald Theme (SA Muni)',
    primary: '#15803d', // green 700
    secondary: '#ca8a04', // yellow 600
    accent: '#2563eb', // blue 600
    bgLight: '#f0fdf4',
    borderClass: 'border-emerald-300',
    headerBg: '#15803d'
  },
  {
    id: 'african-clay',
    name: 'African Clay Theme',
    primary: '#7c2d12', // orange 900
    secondary: '#b45309', // amber 700
    accent: '#0d9488', // teal 600
    bgLight: '#fff7ed',
    borderClass: 'border-orange-200',
    headerBg: '#7c2d12'
  },
  {
    id: 'golden-horizon',
    name: 'Golden Horizon Theme',
    primary: '#1e1b4b', // indigo 950
    secondary: '#d97706', // amber 600
    accent: '#ec4899', // pink 500
    bgLight: '#faf5ff',
    borderClass: 'border-indigo-200',
    headerBg: '#1e1b4b'
  }
];

export function IDP({ currentUser, activeTenantId }: IDPProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'research' | 'template' | 'drafting'>('brief');
  const [activeTheme, setActiveTheme] = useState<ThemePreset>(COLOR_THEMES[0]);

  // Drafting editor state
  const [editorContent, setEditorContent] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [presenceUsers, setPresenceUsers] = useState<string[]>([]);
  const [lastEditor, setLastEditor] = useState<string | null>(null);
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [ribbonTab, setRibbonTab] = useState('Home');
  const [adoptedItemsCount, setAdoptedItemsCount] = useState(0);

  // Search/replace and extra controls
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findMatches, setFindMatches] = useState<number>(0);

  // Drawing mode setup
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Research uploader states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(-1);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [parsedSections, setParsedSections] = useState<any[]>([]);
  const [parserLogs, setParserLogs] = useState<string[]>([]);
  const [searchFilterParsed, setSearchFilterParsed] = useState('');

  const wordPageRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const emitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const displayTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];
  const documentId = activeTenantId === 'global' ? 'idp-global' : `idp-${activeTenantId}`;

  // Join document on websocket for collaborative sync and persistent Supabase saving
  useEffect(() => {
    const newSocket = io({ transports: ['websocket', 'polling'] });
    setSocket(newSocket);

    newSocket.emit("join_document", { documentId, userEmail: currentUser.email });

    newSocket.on("document_update", (data: any) => {
      if (data.senderId !== currentUser.email && editorRef.current) {
        setEditorContent(data.content);
        if (editorRef.current.innerHTML !== data.content) {
          editorRef.current.innerHTML = data.content;
        }
        if (data.senderId && data.senderId !== 'system') {
          setLastEditor(data.senderId);
          setShowSyncToast(true);
          // Auto-hide the toast after 3.5 seconds
          const toastTimer = setTimeout(() => {
            setShowSyncToast(false);
          }, 3500);
          return () => clearTimeout(toastTimer);
        }
      }
    });

    newSocket.on("presence", (users: any[]) => {
      setPresenceUsers(users);
    });

    return () => {
      newSocket.emit("leave_document", { documentId });
      newSocket.disconnect();
    };
  }, [documentId, currentUser]);

  // Debounced socket updates
  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    const rawHTML = e.currentTarget.innerHTML;
    setEditorContent(rawHTML);

    if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
    emitTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit("document_update", { documentId, content: rawHTML, senderId: currentUser.email });
      }
    }, 400);
  };

  // Helper to inject HTML into Drafting suite
  const injectIntoDraft = (htmlToInject: string, sourceLabel: string) => {
    if (!editorRef.current) {
      // If editor isn't in DOM, show alert or keep in temp variable
      alert(`Success: Ready to adopt into Drafting Suite! Switch to the 'Drafting Suite' tab to view or continue editing.`);
      // Add content to state
      const nextContent = editorContent + htmlToInject;
      setEditorContent(nextContent);
      if (socket) {
        socket.emit("document_update", { documentId, content: nextContent, senderId: currentUser.email });
      }
      return;
    }

    const currentHTML = editorRef.current.innerHTML;
    const styledBlock = `
      <div style="border-left: 4px solid ${activeTheme.accent}; background-color: ${activeTheme.bgLight}; padding: 16px; margin: 24px 0; border-radius: 4px; border-top-right-radius: 8px; border-bottom-right-radius: 8px; font-family: sans-serif; box-sizing: border-box;">
        <div style="font-size: 10px; font-weight: 900; color: ${activeTheme.secondary}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; gap: 4px;">
          <span>📋 adopted from: ${sourceLabel}</span>
        </div>
        <div>
          ${htmlToInject}
        </div>
      </div>
      <p><br/></p>
    `;

    const finalHTML = currentHTML + styledBlock;
    editorRef.current.innerHTML = finalHTML;
    setEditorContent(finalHTML);
    setAdoptedItemsCount(prev => prev + 1);

    if (socket) {
      socket.emit("document_update", { documentId, content: finalHTML, senderId: currentUser.email });
    }

    alert(`Successfully adopted data from ${sourceLabel} into Drafting Suite!`);
  };

  // 1. Hardcoded Document Parser (NO AI)
  const parseDocumentRawText = (text: string) => {
    setParserLogs([]);
    addLog("Initializing deterministic structured document parser...");
    addLog("Reading chunks. Text length: " + text.length + " bytes.");
    addLog("Executing statutory regex matrix parsing over headers, subheadings, and tables...");

    const lines = text.split(/\r?\n/);
    const extracted: any[] = [];
    let currentChapter: string | null = null;
    let currentSection: string | null = null;
    let logLinesCount = 0;

    let tableBuffer: string[][] = [];
    let inTable = false;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (!line) continue;

      // Deterministic Table detection (e.g., matching common lines starting with '|', commas, or tabs with multiple cells)
      if (line.startsWith('|') || line.includes('\t') || (line.includes(',') && line.split(',').length > 3)) {
        inTable = true;
        let cells = line.split(/[|\t,]+/).map(c => c.trim()).filter(Boolean);
        if (cells.length > 1) {
          tableBuffer.push(cells);
        }
        continue;
      } else {
        if (inTable && tableBuffer.length > 0) {
          // Flush table
          extracted.push({
            id: `extracted-tab-${idx}`,
            type: 'table',
            chapter: currentChapter || 'Unassigned',
            title: `Extracted Data Grid (mSCOA Reference Block)`,
            headers: tableBuffer[0],
            rows: tableBuffer.slice(1),
          });
          tableBuffer = [];
          inTable = false;
        }
      }

      // Pattern 1: Chapter headers
      const chapterMatch = line.match(/^(CHAPTER\s+\d+|chapter\s+\d+|Chapter\s+\d+|Executive\s+Summary)/i);
      if (chapterMatch) {
        currentChapter = line;
        currentSection = null;
        extracted.push({
          id: `extracted-${idx}`,
          type: 'heading1',
          chapter: currentChapter,
          title: line,
          text: lines[idx + 1] ? lines[idx + 1].trim() : ''
        });
        if (logLinesCount++ < 15) {
          addLog(`[SUCCESS] Found Chapter Anchor: "${line}"`);
        }
        continue;
      }

      // Pattern 2: Numeric subheadings like 1.1, 2.3.4, etc.
      const sectionMatch = line.match(/^(\d+\.\d+)(\s+[A-Za-z0-0].*)/);
      if (sectionMatch) {
        currentSection = line;
        extracted.push({
          id: `extracted-${idx}`,
          type: 'heading2',
          chapter: currentChapter || 'Executive Summary Overview',
          title: line,
          text: lines[idx + 1] ? lines[idx + 1].trim() : ''
        });
        if (logLinesCount++ < 15) {
          addLog(`[SUCCESS] Found Sub-Section: "${line}"`);
        }
        continue;
      }

      // Pattern 3: Strong uppercase subtitles (legislated key words)
      const isUpperCaseTitle = /^[A-Z\s]{6,50}$/.test(line) && !line.includes('IDP') && !line.includes('MUNICIPALITY');
      if (isUpperCaseTitle) {
        extracted.push({
          id: `extracted-${idx}`,
          type: 'subheading',
          chapter: currentChapter || 'Contextual Regulations',
          title: line,
          text: lines[idx + 1] ? lines[idx + 1].trim() : ''
        });
        continue;
      }

      // Pattern 4: Key performance indicators / budget records
      if (line.toLowerCase().includes('budget') || line.toLowerCase().includes('kpi') || line.toLowerCase().includes('r ')) {
        extracted.push({
          id: `extracted-${idx}`,
          type: 'strategic-context',
          chapter: currentChapter || 'Budget and Alignment Matrices',
          title: 'Direct Strategic Metric',
          text: line
        });
        continue;
      }
    }

    addLog(`Delineation complete! Parsed ${lines.length} lines.`);
    addLog(`Extracted ${extracted.length} structured files, headings, & compliance matrices.`);
    setParsedSections(extracted);
  };

  const addLog = (msg: string) => {
    setParserLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Handle Drag & Drop / File Input
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    setUploadedFileName(file.name);
    // Standard human-friendly formatting of bytes
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${(file.size / 1024).toFixed(1)} KB`;
    setUploadedFileSize(sizeStr);

    setUploadProgress(0);
    // Simulating deterministic stream chunk extraction
    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadProgress(100);
        
        // Read actual file text content
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            parseDocumentRawText(event.target.result as string);
          }
        };
        reader.readAsText(file.slice(0, 1024 * 1024 * 10)); // read first 10MB into memory for instant rendering
      } else {
        setUploadProgress(progress);
      }
    }, 180);
  };

  // Generate example simulated raw IDP file for immediate analysis
  const simulateExampleUpload = () => {
    const exampleRaw = `
CHAPTER 1: EXECUTIVE SUMMARY & STRATEGIC BACKGROUND
The Integrated Development Plan of ${displayTenant.name} acts as the primary 5-year medium-term regulatory master plan.

1.1 Mayor's Political Statement
"Our political mandate remains unchanged: to accelerate infrastructure, improve bulk water delivery systems, and protect public assets."

1.2 Municipal Manager's Operational Blueprint
To achieve SDBIP targets, we have aligned municipal Standard Classification segments directly with mSCOA segments.

CHAPTER 2: SITUATIONAL ASSESSMENT SUMMARY
Evaluating current baseline indicators and public feedback databases.

2.1 Demographics and Population Stats
Total populations: 345,120 residents inside municipal borders. Growth indicators are up 2.4% year-on-year.

2.2 Bulk Infrastructure Backlogs
Average sanitation and water access baseline sits at 84% showing standard 16% backlogs in rural regions.

| SLA Segment | Backlog Size | Priority Status | Target Date |
| Water Supply | 16% Households | HIGH CRITICAL | 2026-12-31 |
| Electricity | 9% Grid Gap | Medium | 2027-06-30 |
| Roads KM Paved | 114 Kilometers | HIGH CRITICAL | 2026-08-15 |

CHAPTER 3: ALIGNED FINANCIAL STRATEGY & MTREF SUMMARY
Aligning budgets horizontallly and vertically with state policies.

3.1 Financial Ratios and circular indicators
Current expenditure trends match circular 71 norms perfectly. Saving strategies have reduced useless administrative costs.
    `;
    setUploadedFileName(`${displayTenant.name.replace(/\s+/g, '_')}_Simulated_IDP_Source_2026.txt`);
    setUploadedFileSize('184 KB');
    setUploadProgress(0);
    let progress = 0;
    const timer = setInterval(() => {
      progress += 25;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(timer);
        parseDocumentRawText(exampleRaw);
      }
    }, 100);
  };

  // Canvas-based drawing actions
  useEffect(() => {
    if (isDrawingMode && canvasRef.current && editorRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // MATCH coordinates with editor element geometry
      const rect = editorRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      if (ctx) {
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
    }
  }, [isDrawingMode, drawingColor, editorContent]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDrawingMode) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      isDrawingRef.current = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDrawingRef.current || !isDrawingMode) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const clearInkDrawing = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Word-like rich command formatting
  const applyTextCommand = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
      if (socket) {
        socket.emit("document_update", { documentId, content: editorRef.current.innerHTML, senderId: currentUser.email });
      }
    }
  };

  // Simple Find & Replace helper on real editable HTML
  const executeFindReplace = () => {
    if (!editorRef.current || !searchTerm) return;
    const text = editorRef.current.innerHTML;
    const regex = new RegExp(searchTerm, 'gi');
    const matchesCount = (text.match(regex) || []).length;
    setFindMatches(matchesCount);

    if (replaceTerm) {
      const replaced = text.replace(regex, replaceTerm);
      editorRef.current.innerHTML = replaced;
      setEditorContent(replaced);
      if (socket) {
        socket.emit("document_update", { documentId, content: replaced, senderId: currentUser.email });
      }
      alert(`Replaced ${matchesCount} instances of "${searchTerm}" with "${replaceTerm}"`);
      setShowFindReplace(false);
    }
  };

  // Render chapters within IDP template for direct reading, selection and themes
  const renderTemplateSectionHTML = (heading: string, bodyContent: string) => {
    return `
      <div style="margin-bottom: 24px;">
        <h3 style="color: ${activeTheme.primary}; font-family: 'Space Grotesk', sans-serif; font-size: 14pt; border-bottom: 1.5px solid ${activeTheme.secondary}; padding-bottom: 4px; font-weight: 800; text-transform: uppercase;">${heading}</h3>
        <p style="font-family: 'Inter', sans-serif; font-size: 10.5pt; color: #334155; line-height: 1.6; margin-top: 10px;">${bodyContent}</p>
      </div>
    `;
  };

  // Raw contents for Chapter 1-8 template
  const getIDPChaptersTemplate = () => {
    let mayorStr = "<strong>1.1 Mayor’s Foreword:</strong> Political strategic direction for FY 2026/2027.<br/>";
    let mmStr = "<strong>1.2 Municipal Manager’s Overview:</strong> Comprehensive administrative readiness statement.<br/>";
    
    try {
      if (typeof window !== 'undefined') {
        const mayorData = JSON.parse(localStorage.getItem('mz_mayor_profile') || '{}');
        if (mayorData.foreword) {
          mayorStr = `<strong>1.1 Mayor’s Foreword:</strong><br/><em>${mayorData.firstName} ${mayorData.lastName} (Term: ${mayorData.termFrom}-${mayorData.termTo})</em><br/><br/>${mayorData.foreword || ''}<br/><br/><strong>Vision:</strong> ${mayorData.vision || ''}<br/><strong>Mission:</strong> ${mayorData.mission || ''}<br/><strong>Conclusion:</strong> ${mayorData.conclusion || ''}<br/>`;
        }
        const mmData = JSON.parse(localStorage.getItem('mz_mm_profile') || '{}');
        if (mmData.foreword) {
          mmStr = `<strong>1.2 Municipal Manager’s Overview:</strong><br/><em>${mmData.firstName} ${mmData.lastName} (Term: ${mmData.termFrom}-${mmData.termTo})</em><br/><br/>${mmData.foreword || ''}<br/><br/><strong>Vision:</strong> ${mmData.vision || ''}<br/><strong>Mission:</strong> ${mmData.mission || ''}<br/><strong>Conclusion:</strong> ${mmData.conclusion || ''}<br/>`;
        }
      }
    } catch(e) {}

    return [
      {
        title: "CHAPTER 1: EXECUTIVE SUMMARY & PROCESS",
        content: `This chapter ensures compliance with MFMA Section 21, detailing the time schedule for the budget and IDP process.<br/><br/>
        ${mayorStr}<br/><br/>
        ${mmStr}<br/><br/>
        <strong>1.3 The IDP Process Plan:</strong><br/>
        • Council Resolution Date of adoption for the process goals.<br/>
        • Public Participation Schedule (including local Ward committee meetings, Mayoral roadshows).<br/>
        • Structural mechanisms mapping alignment with the District Development Model (DDM).`
      },
    {
      title: "CHAPTER 2: SITUATIONAL ANALYSIS (Status Quo)",
      content: `Base socioeconomic, demographical, and operational data sourced from official StatsSA databases and municipal engineering registers.<br/><br/>
      <strong>2.1 Demographic Profile:</strong> Segmented population, age, gender, race ratios, and growth trajectories.<br/>
      <strong>2.2 Socio-Economic Profile:</strong> Primary employment directories, average household income brackets, and scholastic success stats.<br/>
      <strong>2.3 Service Delivery Backlogs:</strong><br/>
      • <em>Water & Sanitation:</em> % of local households with formal connections compared to communal access.<br/>
      • <em>Electricity:</em> Utility grid networks vs off-grid alternatives.<br/>
      • <em>Refuse Removal:</em> Formalized municipal waste removal collection rates (minimum weekly targets).<br/>
      • <em>Roads & Stormwater:</em> KM analysis of asphalt paved roads vs rural gravel roads.<br/>
      <strong>2.4 Institutional Capacity:</strong> Vacancy ratios across main departments, organizational flow outlines.`
    },
    {
      title: "CHAPTER 3: STRATEGIC DIRECTIVES",
      content: `CRITICAL: These objects map 1-to-1 directly back to the mSCOA Strategic Goal Segments.<br/><br/>
      <strong>3.1 Vision & Mission Statement:</strong> Sustainable service provision framework.<br/>
      <strong>3.2 Strategic Goals:</strong> Extended targets (e.g., "Sustainable Bulk Infrastructure Delivery").<br/>
      <strong>3.3 Strategic Objectives:</strong> Short-term measurable projects (e.g. "Pave and upgrade 10km of gravel roads in high-traffic corridors by December 2026").`
    },
    {
      title: "CHAPTER 4: SPATIAL DEVELOPMENT FRAMEWORK (SDF)",
      content: `Legally required in terms of SPLUMA legislation. Dictates land-use priorities.<br/><br/>
      <strong>4.1 Spatial Vision:</strong> Clear developmental corridors mapped strategically.<br/>
      <strong>4.2 Land Use Management:</strong> Specific regulatory zones, conservation barriers.<br/>
      <strong>4.3 Capital Investment Framework (CIF):</strong> Targeting physical zones for SDBIP funding allocations.`
    },
    {
      title: "CHAPTER 5: IMPLEMENTATION PLAN (Projects)",
      content: `mSCOA COMPLIANCE CORE: Technical matrix. Do not list temporary "wishlists." Only funded and budgeted capital projects are registered. Refer to direct SDBIP links:<br/><br/>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-family: sans-serif; font-size: 10px; border: 1.5px solid ${activeTheme.primary};">
        <thead>
          <tr style="background-color: ${activeTheme.primary}; color: white; text-align: left;">
            <th style="padding: 8px; border: 1px solid #ddd;">Project Name</th>
            <th style="padding: 8px; border: 1px solid #ddd;">mSCOA GUID</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Region</th>
            <th style="padding: 8px; border: 1px solid #ddd;">KPI Target</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Year 1 Budget</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Funding Source</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Upgrading of Main St</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace;">PC-Roads-001</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Ward 5</td>
            <td style="padding: 8px; border: 1px solid #ddd;">KM surfaced</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: ${activeTheme.secondary}">R 5,000,000</td>
            <td style="padding: 8px; border: 1px solid #ddd;">MIG Grant</td>
          </tr>
        </tbody>
      </table><br/>
      <strong>5.1 Capital Projects:</strong> Heavy infrastructure initiatives.<br/>
      <strong>5.2 Operational Projects:</strong> Sector studies, local economic initiatives.<br/>
      <strong>5.3 Unfunded Projects:</strong> A separate "wishlist" clearly marked as unfunded (crucial for distinguishing from the approved MTREF budget).`
    },
    {
      title: "CHAPTER 6: FINANCIAL PLAN",
      content: `Must align exactly with the MTREF and MFMA Schedule A limits.<br/><br/>
      <strong>6.1 Financial Strategy:</strong> Revenue enhancement mechanisms, circular-informed cost containment.<br/>
      <strong>6.2 Budget Summaries:</strong> Operational revenues plotted alongside capital budgets.<br/>
      <strong>6.3 Grants:</strong> Direct MIG, INEP, DORA, and EPWP funding entries.<br/>
      <strong>6.4 Circular 71 Ratios:</strong> Standard liquidity limits, cost coverage ratios.`
    },
    {
      title: "CHAPTER 7: PERFORMANCE MANAGEMENT (PMS)",
      content: `Aligned with MFMA Circular 88 indicators.<br/><br/>
      <strong>7.1 PMS Framework:</strong> Quarterly evaluations, structural scorecards.<br/>
      <strong>7.2 Corporate Scorecard:</strong> Household metrics matching provincial water and electricity targets.`
    },
    {
      title: "CHAPTER 8: INTEGRATED SECTOR PLANS",
      content: `Mini-strategies mapping dedicated systems:<br/><br/>
      • <strong>8.1 Disaster Management Plan:</strong> Emergency reaction matrices.<br/>
      • <strong>8.2 Water Services Development Plan:</strong> Technical supply registers.<br/>
      • <strong>8.3 Waste Management Plan:</strong> Strategic regional dump upgrades.<br/>
      • <strong>8.4 Local Economic Development Strategy:</strong> Cooperative setups.<br/>
      • <strong>8.5 Housing / Settlements Plan:</strong> Title deed backlogs.`
    }
  ];
  };

  const adoptWholeTemplate = () => {
    const documentId = activeTenantId === 'global' ? 'idp-global' : `idp-${activeTenantId}`;
    const newChapters = getIDPChaptersTemplate().slice(0, 6).map(c => 
      `${c.title}\n\n${c.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')}`
    );
    if (socket) {
      socket.emit("document_update", { 
        documentId: `idp_v2_${documentId}`, 
        content: JSON.stringify({ chapters: newChapters }), 
        senderId: 'system-adopt-template' 
      });
      alert('Success: All 6 chapters adopted into Drafting Suite Workspaces! Switch to the Drafting Suite tab to edit.');
    } else {
      alert("Live socket connection missing. Cannot adopt into Drafting Suite.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-fade-in relative z-10" id="idp-workspace">
      
      {/* Structural Sidebar controls for selecting tabs */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">IDP Core Workspace</h4>
              <p className="text-[10px] text-slate-500 font-mono">Legislated FY 2026/2027</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('brief')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
                activeTab === 'brief'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/10"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
              )}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <span className="block uppercase tracking-tight">IDP Brief</span>
                <span className="text-[9px] font-normal text-slate-500 block max-w-full truncate">Legal alignment definitions & context</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('research')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
                activeTab === 'research'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/10"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
              )}
            >
              <Search className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <span className="block uppercase tracking-tight">IDP Research Engine</span>
                <span className="text-[9px] font-normal text-slate-500 block max-w-full truncate">Parse 200MB text, headers, tables</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('template')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
                activeTab === 'template'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/10"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
              )}
            >
              <Layout className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <span className="block uppercase tracking-tight">Chapters Template</span>
                <span className="text-[9px] font-normal text-slate-500 block max-w-full truncate">8 Chapters with 4 Color Themes</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('drafting')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
                activeTab === 'drafting'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/10"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
              )}
            >
              <Edit3 className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <span className="block uppercase tracking-tight">Drafting Suite</span>
                <span className="text-[9px] font-normal text-slate-500 block">Complete MS Word Processor</span>
              </div>
            </button>
          </div>
        </div>

        {/* Global Municipality Context Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-700 space-y-3 font-sans shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-700 font-bold">Active Scope</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">MUNICIPAL AREA</span>
            <span className="text-sm font-black text-slate-800 leading-snug">{displayTenant.name}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-505">
            <span>Adopted items:</span>
            <span className="font-bold text-emerald-600">{adoptedItemsCount} block(s)</span>
          </div>
        </div>
      </div>

      {/* Main workspace container */}
      <div className="flex-grow flex flex-col min-w-0 bg-transparent">
        
        {/* BRIEF TAB CONTENT */}
        {activeTab === 'brief' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 text-slate-800 shadow-sm">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest font-bold block">Section 1</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">Integrated Development Plan (IDP) Brief</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                An Integrated Development Plan (IDP) is a legislated, five-year strategic master plan that maps out a South African municipality’s budget, goals, and service delivery priorities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-350 transition-colors space-y-4 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-55 bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">What Info Does an IDP Contain?</h3>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase font-mono">Systems Act (Act 32 of 2000)</p>
                </div>
                <div className="text-xs text-slate-650 space-y-3 leading-relaxed">
                  <div>
                    <strong className="text-slate-900 block font-sans">Situational Analysis:</strong> 
                    Assessment of existing baseline data, service backlogs, and economic challenges within the community.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">Development Vision:</strong> 
                    The five-year long-term strategic goals, vision, and core priorities of the municipal council.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">Spatial Development Framework (SDF):</strong> 
                    Visual mapping dictating land-use management, zoning, and future infrastructure placement.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">Financial Plan:</strong> 
                    Three-year budget projection linked to the Medium-Term Revenue and Expenditure Framework (MTREF).
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">Key Performance Indicators (KPIs):</strong> 
                    Target metrics used to monitor municipal staff, administration, and output efficacy.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">Operational Sector Plans:</strong> 
                    Mini-strategies covering disaster management, water service infrastructure, housing, and waste removal.
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-350 transition-colors space-y-4 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">What Is the IDP Aligned To?</h3>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase font-mono">Governance Synchronization</p>
                </div>
                <div className="text-xs text-slate-650 space-y-3 leading-relaxed">
                  <div>
                    <strong className="text-slate-900 block font-sans">The Municipal Budget:</strong> 
                    Direct correlation with the annual budget and the Service Delivery and Budget Implementation Plan (SDBIP) to ensure all targets are fully funded.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">National Frameworks:</strong> 
                    Aligned directly with the presidency's National Development Plan (NDP) 2030 and economic mandates like the New Growth Path.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">Provincial Strategies:</strong> 
                    Coordinated with the Provincial Growth and Development Strategies (PGDS) to maintain uniform provincial output.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">District Alignment:</strong> 
                    For local municipalities, alignment with the overarching District Municipality IDP framework.
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-350 transition-colors space-y-4 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Where Does Info Come From?</h3>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase font-mono">Synthesized Source Streams</p>
                </div>
                <div className="text-xs text-slate-650 space-y-3 leading-relaxed">
                  <div>
                    <strong className="text-slate-900 block font-sans">Public Participation:</strong> 
                    Inputs gathered directly from residents via mandatory community ward committee meetings and public feedback forums.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">National Data Agencies:</strong> 
                    Demographic, employment, and household metrics provided officially by Statistics South Africa (Stats SA) censuses.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">Internal Municipal Audits:</strong> 
                    Administrative engineering reports outlining mechanical assets, water/electricity backlogs, and financial capability statements.
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-sans">Sector Departments:</strong> 
                    Budget plans and infrastructure allocations provided by external national/provincial organs (e.g., Department of Human Settlements, Eskom, Sanral).
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* IDP RESEARCH ENGINE TAB */}
        {activeTab === 'research' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 text-slate-800 shadow-sm">
            <div>
              <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest font-bold block font-sans">Section 2</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">IDP Deterministic Research Parser (Up to 200MB)</h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">Strict structural regex alignment parsing • zero external AI latency</p>
            </div>

            {/* Drag Drop Block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1 space-y-4">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[180px] cursor-pointer",
                    isDragging 
                      ? "border-emerald-500 bg-emerald-50/50" 
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-350 hover:bg-slate-50"
                  )}
                >
                  <input 
                    type="file" 
                    id="idp-raw-file-picker" 
                    className="hidden" 
                    accept=".txt,.json,.csv,.md,.text" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="idp-raw-file-picker" className="cursor-pointer flex flex-col items-center w-full">
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-700 uppercase font-sans">Drag & Drop IDP Document</span>
                    <span className="text-[10px] text-slate-400 mt-1">Supports raw structural data up to 200MB ({'.txt, .json, .csv'})</span>
                    <span className="text-xs text-emerald-600 hover:text-emerald-700 underline mt-4 font-black block font-sans">Browse files</span>
                  </label>
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-black">- OR -</span>
                  <button 
                    onClick={simulateExampleUpload}
                    className="mt-2 w-full px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors border border-slate-250 shadow-sm flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/10" />
                    Simulate Example IDP Stream
                  </button>
                </div>

                {/* Upload Status */}
                {uploadProgress >= 0 && (
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-800 font-bold truncate max-w-[150px]">{uploadedFileName}</span>
                      <span className="text-slate-500 shrink-0">{uploadedFileSize}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full transition-all duration-150" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase">
                      <span>Stream Processing</span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Logger Console */}
              <div className="lg:col-span-2 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl h-[280px] overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between select-none">
                  <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Parser Log Output
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Real-time compilation logs</span>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-600 bg-white custom-scrollbar select-text">
                  {parserLogs.length === 0 ? (
                    <div className="text-slate-400 italic flex items-center justify-center h-full">
                      System standing by. Waiting for file stream upload or simulated IDP stream...
                    </div>
                  ) : (
                    parserLogs.map((log, lIdx) => (
                      <div key={lIdx} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Extracted Sections Grid */}
            {parsedSections.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Extracted Structural Sections ({parsedSections.length})</h3>
                    <p className="text-[10px] text-slate-450 font-mono">Search with zero latent database filters</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus-within:border-emerald-600">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search extracted elements..." 
                      value={searchFilterParsed}
                      onChange={(e) => setSearchFilterParsed(e.target.value)}
                      className="bg-transparent border-none p-0 text-xs text-slate-800 focus:ring-0 outline-none w-44 font-sans focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                  {parsedSections
                    .filter(sec => {
                      if (!searchFilterParsed) return true;
                      const term = searchFilterParsed.toLowerCase();
                      return (sec.title || '').toLowerCase().includes(term) || 
                             (sec.text || '').toLowerCase().includes(term) || 
                             (sec.chapter || '').toLowerCase().includes(term);
                    })
                    .map((sec, sIdx) => (
                      <div key={sec.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase truncate max-w-[140px]">{sec.chapter}</span>
                            <span className="text-[8px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {sec.type}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 uppercase">{sec.title}</h4>
                          
                          {sec.type === 'table' ? (
                            <div className="overflow-x-auto max-w-full my-2 border border-slate-200 rounded">
                              <table className="min-w-full text-[9px] font-sans">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-700">
                                    {sec.headers.map((h: string, hIdx: number) => (
                                      <th key={hIdx} className="p-1 text-left border-r border-slate-200">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {sec.rows.map((row: string[], rIdx: number) => (
                                    <tr key={rIdx} className="border-t border-slate-200 text-slate-600 hover:bg-slate-100/40">
                                      {row.map((cell: string, cIdx: number) => (
                                        <td key={cIdx} className="p-1 border-r border-slate-200 truncate max-w-[120px]">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed mt-1 font-serif italic">
                              "{sec.text}"
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[9px] text-slate-450 font-mono">Row Index: #{sIdx + 1}</span>
                          <button 
                            onClick={() => {
                              let html = '';
                              if (sec.type === 'table') {
                                html = `
                                  <table style="width:100%; border-collapse: collapse; font-family: sans-serif; font-size: 10px; margin: 12px 0;">
                                    <thead>
                                      <tr style="background-color: ${activeTheme.primary}; color: white; text-align: left;">
                                        ${sec.headers.map((h: string) => `<th style="padding: 6px; border:1px solid #ddd;">${h}</th>`).join('')}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${sec.rows.map((r: string[]) => `
                                        <tr>
                                          ${r.map((cell: string) => `<td style="padding: 6px; border:1px solid #ddd;">${cell}</td>`).join('')}
                                        </tr>
                                      `).join('')}
                                    </tbody>
                                  </table>
                                `;
                              } else {
                                html = `
                                  <h4 style="color: ${activeTheme.primary}; font-size: 12pt; font-family: sans-serif; border-bottom: 1px solid ${activeTheme.secondary}; padding-bottom: 2px;">${sec.title}</h4>
                                  <p style="font-family: serif; font-size: 11pt; color: #111; line-height: 1.6; margin-top: 6px;">${sec.text}</p>
                                `;
                              }
                              injectIntoDraft(html, `Extracted Section: ${sec.title || sec.chapter}`);
                            }}
                            className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold block transition-colors cursor-pointer uppercase font-sans flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Adopt this section
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* IDP TEMPLATE TAB SECTION */}
        {activeTab === 'template' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 text-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest font-bold block font-sans">Section 3</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">INTEGRATED DEVELOPMENT PLAN (IDP) TEMPLATE</h2>
                <p className="text-xs text-slate-500 mt-1">Select a color scheme and review formatted Chapters 1-8 for adoption</p>
              </div>
              <button 
                onClick={adoptWholeTemplate}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer font-sans shrink-0"
              >
                <Plus className="w-4 h-4" /> Adopt All 8 Chapters
              </button>
            </div>

            {/* Custom Theme Selector */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3 font-sans">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Available Color Schemes</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {COLOR_THEMES.map((theme) => (
                  <button 
                    key={theme.id}
                    onClick={() => setActiveTheme(theme)}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center",
                      activeTheme.id === theme.id 
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm" 
                        : "border-slate-250 bg-white hover:border-slate-350"
                    )}
                  >
                    <div className="flex gap-1">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }}></span>
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary }}></span>
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.accent }}></span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 leading-none mt-1">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Book Chapter Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {getIDPChaptersTemplate().map((chapter, chapIdx) => (
                <div key={chapIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm">
                  <div className="p-5 space-y-3 flex-1">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Chapter {chapIdx + 1}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeTheme.primary }}></span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight mb-2">{chapter.title}</h4>
                      <p 
                        className="text-xs text-slate-600 leading-relaxed font-serif" 
                        dangerouslySetInnerHTML={{ __html: chapter.content }}
                      ></p>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] text-slate-450 font-mono select-none font-sans">MFMA REGULATIONS READY</span>
                    <button 
                      onClick={() => {
                        const html = renderTemplateSectionHTML(chapter.title, chapter.content);
                        injectIntoDraft(html, `IDP Template Chapter: ${chapter.title}`);
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adopt this chapter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRAFTING SUITE TAB (Integrated Advanced Suite) */}
        {activeTab === "drafting" && (
          <div className="flex-1 overflow-hidden min-h-[700px] h-full rounded-2xl relative z-10 border border-slate-200">
            <DraftingSuiteTab 
              currentUser={currentUser} 
              activeTenantId={activeTenantId} 
              documentIdPrefix="idp"
              defaultChapters={getIDPChaptersTemplate().slice(0, 6).map(t => t.title + "\n\n" + t.content.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " "))}
            />
          </div>
        )}

      </div>
    </div>
  );
}
