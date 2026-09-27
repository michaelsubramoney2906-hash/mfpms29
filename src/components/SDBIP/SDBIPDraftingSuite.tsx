import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileText, Search, Settings, Download, Upload, Cpu, LayoutTemplate, 
  Plus, Trash2, Check, ArrowRight, Info, AlertTriangle, User,
  BarChart as BarChartIcon, TrendingUp, PieChart, FileCheck, Printer, ChevronRight, Download as DownloadIcon,
  FileSpreadsheet, Image as ImageIcon, Camera, Sparkles, X, RotateCcw, Sliders, Type, Edit3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import type { SdbipRow } from './SDBIP';
import { WordProcessor } from './WordProcessor';

const DEFAULT_COVER_IMAGE = "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80";

export interface CoverTextElement {
  id: string;
  type?: 'title' | 'subtitle' | 'organization' | 'custom';
  label: string;
  text: string;
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  customFontSizePx?: number;
  color: string;
  customColor?: string;
  uppercase: boolean;
  fontWeight: 'normal' | 'semibold' | 'bold' | 'black';
  letterSpacing?: 'normal' | 'wide' | 'widest';
  fontFamily?: 'sans' | 'serif' | 'mono';
  bgColor?: 'none' | 'dark' | 'light' | 'indigo';
}

export const DEFAULT_COVER_TEXTS: CoverTextElement[] = [
  {
    id: 'title',
    type: 'title',
    label: 'Main Report Title',
    text: 'SDBIP {QUARTER} REPORT',
    fontSize: '2xl',
    color: 'white',
    uppercase: true,
    fontWeight: 'black',
    letterSpacing: 'widest',
    fontFamily: 'sans',
    bgColor: 'none'
  },
  {
    id: 'subtitle',
    type: 'subtitle',
    label: 'Financial Year / Subtitle',
    text: '2025/2026 FINANCIAL YEAR',
    fontSize: 'lg',
    color: 'indigo-300',
    uppercase: true,
    fontWeight: 'bold',
    letterSpacing: 'widest',
    fontFamily: 'sans',
    bgColor: 'none'
  },
  {
    id: 'organization',
    type: 'organization',
    label: 'Organization / Footer Tagline',
    text: 'MZANSI FLOW AUTOMATED PMS SYSTEM',
    fontSize: 'xs',
    color: 'slate-300',
    uppercase: true,
    fontWeight: 'semibold',
    letterSpacing: 'widest',
    fontFamily: 'sans',
    bgColor: 'none'
  }
];

export function getCoverTextClasses(el: CoverTextElement) {
  const sizeClass = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  }[el.fontSize] || 'text-base';

  const colorClass = el.customColor ? '' : ({
    white: 'text-white',
    'indigo-200': 'text-indigo-200',
    'indigo-300': 'text-indigo-300',
    'amber-300': 'text-amber-300',
    'slate-300': 'text-slate-300',
    'emerald-300': 'text-emerald-300',
    'rose-300': 'text-rose-300',
    'sky-300': 'text-sky-300',
    'purple-300': 'text-purple-300',
    'yellow-400': 'text-yellow-400',
    'black': 'text-slate-900',
  }[el.color] || 'text-white');

  const weightClass = {
    normal: 'font-normal',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black'
  }[el.fontWeight] || 'font-bold';

  const caseClass = el.uppercase ? 'uppercase' : 'normal-case';

  const spacingClass = {
    normal: 'tracking-normal',
    wide: 'tracking-wide',
    widest: 'tracking-widest'
  }[el.letterSpacing || 'widest'];

  const fontFamClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  }[el.fontFamily || 'sans'];

  const bgPillClass = {
    none: '',
    dark: 'bg-slate-900/75 backdrop-blur-xs px-5 py-2 rounded-2xl border border-slate-700/60 shadow-lg',
    light: 'bg-white/85 backdrop-blur-xs px-5 py-2 rounded-2xl border border-white/60 text-slate-900 shadow-lg',
    indigo: 'bg-indigo-950/80 backdrop-blur-xs px-5 py-2 rounded-2xl border border-indigo-500/40 shadow-lg'
  }[el.bgColor || 'none'];

  return `${sizeClass} ${colorClass} ${weightClass} ${caseClass} ${spacingClass} ${fontFamClass} ${bgPillClass}`.trim();
}

export function getCoverElementStyle(el: CoverTextElement): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (el.customColor) {
    style.color = el.customColor;
  }
  if (el.customFontSizePx && el.customFontSizePx > 0) {
    style.fontSize = `${el.customFontSizePx}px`;
    style.lineHeight = '1.2';
  }
  return style;
}

const COVER_PRESETS = [
  {
    id: 'dullstroom-highlands',
    name: 'Dullstroom Highlands & Catchments (Emakhazeni)',
    url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80'
  },
  {
    id: 'middelburg-highveld',
    name: 'Middelburg Industrial & Highveld Hub (Mpumalanga)',
    url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80'
  },
  {
    id: 'sa-water-sanitation',
    name: 'Water Purification & Sanitation Service Delivery',
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80'
  },
  {
    id: 'sa-roads-transport',
    name: 'Municipal Road Construction & Civil Engineering',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80'
  },
  {
    id: 'sa-energy-grid',
    name: 'Electricity Substation & Power Grid Infrastructure',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80'
  },
  {
    id: 'sa-civic-governance',
    name: 'South African Civic Governance & Municipal HQ',
    url: 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&q=80'
  },
  {
    id: 'sa-human-settlements',
    name: 'Human Settlements & Community Infrastructure',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80'
  }
];

interface SDBIPDraftingSuiteProps {
  currentUser: any;
  activeTenantId: string;
  rows: SdbipRow[];
}

export function SDBIPDraftingSuite({ currentUser, activeTenantId, rows }: SDBIPDraftingSuiteProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'research' | 'template' | 'drafting' | 'reports'>('brief');
  const [selectedQuarter, setSelectedQuarter] = useState<'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual'>('q1');
  const [draftingContent, setDraftingContent] = useState<string | undefined>(undefined);
  const [reportPeriod, setReportPeriod] = useState<'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual'>('q1');

  // Cover Image & Sizing state with tenant persistence
  const [coverImage, setCoverImage] = useState<string>(() => {
    return localStorage.getItem(`sdbip_cover_img_${activeTenantId}`) || DEFAULT_COVER_IMAGE;
  });

  const [overlayOpacity, setOverlayOpacity] = useState<number>(() => {
    const saved = localStorage.getItem(`sdbip_cover_opacity_${activeTenantId}`);
    return saved ? parseFloat(saved) : 0.8;
  });

  const [coverFit, setCoverFit] = useState<'contain' | 'cover' | 'stretch' | 'scale'>(() => {
    return (localStorage.getItem(`sdbip_cover_fit_${activeTenantId}`) as any) || 'contain';
  });

  const [coverScale, setCoverScale] = useState<number>(() => {
    const saved = localStorage.getItem(`sdbip_cover_scale_${activeTenantId}`);
    return saved ? parseInt(saved) : 100;
  });

  const [coverBgColor, setCoverBgColor] = useState<string>(() => {
    return localStorage.getItem(`sdbip_cover_bgcolor_${activeTenantId}`) || '#0f172a';
  });

  const [coverPosition, setCoverPosition] = useState<'center' | 'top' | 'bottom'>(() => {
    return (localStorage.getItem(`sdbip_cover_pos_${activeTenantId}`) as any) || 'center';
  });

  const [coverTexts, setCoverTexts] = useState<CoverTextElement[]>(() => {
    const saved = localStorage.getItem(`sdbip_cover_texts_${activeTenantId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_COVER_TEXTS;
  });

  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  const handleUpdateCoverImage = (url: string) => {
    setCoverImage(url);
    localStorage.setItem(`sdbip_cover_img_${activeTenantId}`, url);
  };

  const handleUpdateOverlayOpacity = (op: number) => {
    setOverlayOpacity(op);
    localStorage.setItem(`sdbip_cover_opacity_${activeTenantId}`, op.toString());
  };

  const handleUpdateCoverFit = (fit: 'contain' | 'cover' | 'stretch' | 'scale') => {
    setCoverFit(fit);
    localStorage.setItem(`sdbip_cover_fit_${activeTenantId}`, fit);
  };

  const handleUpdateCoverScale = (scale: number) => {
    setCoverScale(scale);
    localStorage.setItem(`sdbip_cover_scale_${activeTenantId}`, scale.toString());
  };

  const handleUpdateCoverBgColor = (color: string) => {
    setCoverBgColor(color);
    localStorage.setItem(`sdbip_cover_bgcolor_${activeTenantId}`, color);
  };

  const handleUpdateCoverPosition = (pos: 'center' | 'top' | 'bottom') => {
    setCoverPosition(pos);
    localStorage.setItem(`sdbip_cover_pos_${activeTenantId}`, pos);
  };

  const handleUpdateCoverTexts = (newTexts: CoverTextElement[]) => {
    setCoverTexts(newTexts);
    localStorage.setItem(`sdbip_cover_texts_${activeTenantId}`, JSON.stringify(newTexts));
  };

  const handleUpdateTextElement = (id: string, updates: Partial<CoverTextElement>) => {
    const updated = coverTexts.map(item => item.id === id ? { ...item, ...updates } : item);
    handleUpdateCoverTexts(updated);
  };

  const handleDeleteCoverText = (id: string) => {
    const updated = coverTexts.filter(item => item.id !== id);
    handleUpdateCoverTexts(updated);
  };

  const handleAddCoverText = () => {
    const newEl: CoverTextElement = {
      id: `custom_${Date.now()}`,
      type: 'custom',
      label: `Custom Text Line ${coverTexts.length + 1}`,
      text: 'CONFIDENTIAL - MUNICIPAL REPORT',
      fontSize: 'sm',
      color: 'amber-300',
      uppercase: true,
      fontWeight: 'bold'
    };
    handleUpdateCoverTexts([...coverTexts, newEl]);
  };

  const handleResetCoverTexts = () => {
    handleUpdateCoverTexts(DEFAULT_COVER_TEXTS);
  };

  const handleAdoptTemplate = (html: string) => {
    setDraftingContent(html);
    setActiveTab('drafting');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800 border border-slate-200">
      
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">SDBIP Drafting Suite</h3>
            <p className="text-xs text-gray-500 font-medium tracking-tight uppercase">Operational Performance Reporting Engine</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCoverModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-all cursor-pointer mr-2 shadow-xs"
            title="Upload custom cover photo or edit text for SDBIP reports"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cover Setup</span>
          </button>

          {['brief', 'research', 'template', 'drafting', 'reports'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
            >
              {tab === 'brief' && 'Brief'}
              {tab === 'research' && 'SDBIP Research'}
              {tab === 'template' && 'Template'}
              {tab === 'drafting' && 'Drafting Suite'}
              {tab === 'reports' && 'Reports'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'brief' && <SDBIPBriefTab />}
        {activeTab === 'research' && <SDBIPResearchTab />}
        {activeTab === 'template' && (
          <SDBIPTemplateTab 
            rows={rows} 
            selectedQuarter={selectedQuarter} 
            setSelectedQuarter={setSelectedQuarter} 
            currentUser={currentUser} 
            onAdopt={handleAdoptTemplate}
            coverImage={coverImage}
            overlayOpacity={overlayOpacity}
            coverFit={coverFit}
            coverScale={coverScale}
            coverBgColor={coverBgColor}
            coverPosition={coverPosition}
            coverTexts={coverTexts}
            onOpenCoverModal={() => setIsCoverModalOpen(true)}
            onUpdateTextElement={handleUpdateTextElement}
            onDeleteCoverText={handleDeleteCoverText}
          />
        )}
        {activeTab === 'drafting' && (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 flex gap-3 bg-gray-50/50">
              <button 
                onClick={() => {
                  setActiveTab('template');
                  alert("Please select the desired quarter in the Template tab and click 'Adopt Template' to pull into the Word Processor.");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-black uppercase rounded-xl border border-indigo-100 hover:bg-indigo-100 transition shadow-sm"
              >
                <LayoutTemplate className="w-4 h-4" /> Pull from Corporate Template
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100">
              <WordProcessor currentUser={currentUser} activeTenantId={activeTenantId} initialHtml={draftingContent} />
            </div>
          </div>
        )}
        {activeTab === 'reports' && (
          <SDBIPReportsTab 
            rows={rows} 
            currentUser={currentUser} 
            activeTenantId={activeTenantId} 
            period={reportPeriod} 
            setPeriod={setReportPeriod}
            coverImage={coverImage}
            overlayOpacity={overlayOpacity}
            coverFit={coverFit}
            coverScale={coverScale}
            coverBgColor={coverBgColor}
            coverPosition={coverPosition}
            coverTexts={coverTexts}
            onOpenCoverModal={() => setIsCoverModalOpen(true)}
            onUpdateTextElement={handleUpdateTextElement}
            onDeleteCoverText={handleDeleteCoverText}
          />
        )}
      </div>

      {/* Cover Picture & Text Manager Modal */}
      {isCoverModalOpen && (
        <CoverPictureModal
          coverImage={coverImage}
          overlayOpacity={overlayOpacity}
          coverFit={coverFit}
          coverScale={coverScale}
          coverBgColor={coverBgColor}
          coverPosition={coverPosition}
          coverTexts={coverTexts}
          onUpdateCoverImage={handleUpdateCoverImage}
          onUpdateOverlayOpacity={handleUpdateOverlayOpacity}
          onUpdateCoverFit={handleUpdateCoverFit}
          onUpdateCoverScale={handleUpdateCoverScale}
          onUpdateCoverBgColor={handleUpdateCoverBgColor}
          onUpdateCoverPosition={handleUpdateCoverPosition}
          onUpdateCoverTexts={handleUpdateCoverTexts}
          onUpdateTextElement={handleUpdateTextElement}
          onDeleteCoverText={handleDeleteCoverText}
          onAddCoverText={handleAddCoverText}
          onResetCoverTexts={handleResetCoverTexts}
          onClose={() => setIsCoverModalOpen(false)}
        />
      )}
    </div>
  );
}

function SDBIPBriefTab() {
  return (
    <div className="p-8 overflow-y-auto h-full hide-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">1. SDBIP Performance Reporting Framework</h2>
          <p className="text-gray-700 leading-relaxed">
            The Service Delivery and Budget Implementation Plan (SDBIP) serves as the municipality's core operational management tool. 
            Reporting within the SDBIP framework is essential for transparency and legislative compliance.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
            <li><strong>Legislative Mandate:</strong> Guided by the MFMA Section 53 and MSA Chapter 6.</li>
            <li><strong>Performance Alignment:</strong> Every target in the SDBIP must correlate to the approved MTREF Budget.</li>
            <li><strong>Quarterly Oversight:</strong> Mandatory quarterly performance assessments provided to the Executive Mayor and Council.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 border-t border-gray-100 pt-8">2. Documenting Institutional Success</h2>
          <p className="text-gray-700 leading-relaxed text-sm">
            The SDBIP report documents how effectively the municipality is delivering on its strategic promises. Key areas of focus include infrastructure, financial viability, and governance.
          </p>
        </section>
      </div>
    </div>
  );
}

function SDBIPResearchTab() {
  return (
    <div className="flex h-full w-full bg-gray-50 animate-fade-in">
      <div className="w-80 border-r border-gray-200 bg-white p-6 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Historical Analytics</h3>
        <p className="text-[10px] text-gray-500 mb-6">Access historical performance benchmarks to compare current quarterly outcomes with previous periods.</p>
        
        <div className="space-y-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-2 cursor-pointer hover:bg-indigo-100 transition">
             <FileText className="w-4 h-4" /> 2024/2025 Annual Performance
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-2 cursor-pointer hover:bg-indigo-100 transition">
             <FileText className="w-4 h-4" /> 2023/2024 Audited Report
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-8 overflow-y-auto hide-scrollbar flex justify-center bg-gray-100">
          <div className="flex flex-col items-center justify-center text-gray-400 h-full max-w-sm text-center">
              <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium text-lg">Performance Benchmarking</p>
              <p className="text-sm mt-2 text-gray-500">Historical performance data and comparative analytics will appear here for research-driven drafting.</p>
          </div>
      </div>
    </div>
  );
}

function PageFooter({ pageNumber, title }: { pageNumber: number, title: string }) {
  return (
    <div className="pt-10 border-t border-slate-200 flex flex-col items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-auto sticky bottom-0">
      <div className="flex justify-between w-full">
        <span>{title}</span>
        <span>Page {pageNumber}</span>
      </div>
      <div className="text-center font-bold normal-case text-slate-500 pb-4">
        Prepared by Mzansi Flow Automated PMS System &copy; 2025 All Rights Reserved
      </div>
    </div>
  );
}

function getRagDetails(row: SdbipRow) {
  const quarters = [
    { target: row.q1, actual: row.q1Actual },
    { target: row.q2, actual: row.q2Actual },
    { target: row.q3, actual: row.q3Actual },
    { target: row.q4, actual: row.q4Actual },
  ];

  const parseNum = (s: string | undefined | null) => {
    if (s === undefined || s === null) return NaN;
    const cleaned = s.toString().replace(/[^0-9.-]/g, '');
    if (!cleaned) return NaN;
    return parseFloat(cleaned);
  };

  let totalTarget = 0;
  let totalActual = 0;
  let hasReportingData = false;

  quarters.forEach(q => {
    const tNum = parseNum(q.target);
    const aNum = parseNum(q.actual);
    if (!isNaN(tNum)) {
      totalTarget += tNum;
      hasReportingData = true;
    }
    if (!isNaN(aNum)) {
      totalActual += aNum;
      hasReportingData = true;
    }
  });

  if (!hasReportingData) {
    return {
      status: 'none' as const,
      face: '☹️',
      label: 'Sad',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
      textClass: 'text-slate-500',
      tooltip: 'No target/actual data entered yet.'
    };
  }

  if (totalTarget === 0) {
    if (totalActual >= 0) {
      return {
        status: 'green' as const,
        face: '😁',
        label: 'Smiling Big Grin',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        textClass: 'text-emerald-700',
        tooltip: 'No target set, performance is positive.'
      };
    } else {
      return {
        status: 'red' as const,
        face: '☹️',
        label: 'Sad',
        bgClass: 'bg-rose-50',
        borderClass: 'border-rose-200',
        textClass: 'text-rose-700',
        tooltip: 'No target set, performance is negative.'
      };
    }
  }

  const achievementRate = totalActual / totalTarget;
  const ratePercent = Math.round(achievementRate * 100);

  if (achievementRate >= 1.0) {
    return {
      status: 'green' as const,
      face: '😁',
      label: 'Smiling Big Grin',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      textClass: 'text-emerald-700',
      tooltip: `Exceeds or meets target! Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
    };
  } else if (achievementRate >= 0.70) {
    return {
      status: 'amber' as const,
      face: '🙂',
      label: 'Semi Smiling',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      textClass: 'text-amber-700',
      tooltip: `Progressing towards target. Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
    };
  } else {
    return {
      status: 'red' as const,
      face: '☹️',
      label: 'Sad',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
      textClass: 'text-rose-700',
      tooltip: `Under target / severe underperformance. Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
    };
  }
}

function getRowKpa(row: SdbipRow): string {
  if (row.bsd === 'Y' || row.bsd === 'X') return 'BSD';
  if (row.led === 'Y' || row.led === 'X') return 'LED';
  if (row.mfvm === 'Y' || row.mfvm === 'X') return 'MFVM';
  if (row.ggpp === 'Y' || row.ggpp === 'X') return 'GGPP';
  if (row.midt === 'Y' || row.midt === 'X') return 'MIDT';
  if (row.sr === 'Y' || row.sr === 'X') return 'SR';
  return 'SDBIP';
}

function sumStringValues(values: (string | undefined)[]): string {
  const activeValues = values.map(v => (v || '').trim()).filter(v => v !== '' && v !== '-');
  if (activeValues.length === 0) return '-';

  const hasNumbers = activeValues.some(v => /\d/.test(v));
  if (!hasNumbers) {
    return Array.from(new Set(activeValues)).join(' + ');
  }

  let total = 0;
  let isCurrency = false;
  let isPercent = false;

  activeValues.forEach(val => {
    if (val.toLowerCase().includes('r')) {
      isCurrency = true;
    }
    if (val.includes('%')) {
      isPercent = true;
    }
    const cleanVal = val.replace(/[R$\s%,]/gi, '');
    const num = parseFloat(cleanVal);
    if (!isNaN(num)) {
      total += num;
    }
  });

  let formattedTotal = '';
  if (Number.isInteger(total)) {
    formattedTotal = total.toLocaleString('en-ZA');
  } else {
    // If float has fractional part, display up to 2 decimals, otherwise strip trailing zeros
    const fixed = total.toFixed(2);
    if (fixed.endsWith('.00')) {
      formattedTotal = Math.round(total).toLocaleString('en-ZA');
    } else {
      formattedTotal = parseFloat(fixed).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  if (isCurrency) {
    return `R ${formattedTotal}`;
  }
  if (isPercent) {
    return `${formattedTotal}%`;
  }
  return formattedTotal;
}

function getCombinedPoesText(row: SdbipRow, quarters: number[]): string {
  return quarters.map(q => {
    const poeDesc = (row as any)[`q${q}PoeDesc`] || '';
    const poes = (row as any)[`q${q}Poes`] || [];
    if (!poeDesc && poes.length === 0) return '';
    const fileStr = poes.length > 0 ? ` (Files: ${poes.join(', ')})` : '';
    return `Q${q}: ${poeDesc || 'Submitted'}${fileStr}`;
  }).filter(Boolean).join('; ');
}

function ReportDocument({ 
  rows, 
  selectedQuarter, 
  currentUser, 
  id = "template-content",
  coverImage,
  overlayOpacity = 0.8,
  coverFit = 'contain',
  coverScale = 100,
  coverBgColor = '#0f172a',
  coverPosition = 'center',
  coverTexts,
  onOpenCoverModal,
  onUpdateTextElement,
  onDeleteCoverText
}: { 
  rows: SdbipRow[], 
  selectedQuarter: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual', 
  currentUser: any, 
  id?: string,
  coverImage?: string,
  overlayOpacity?: number,
  coverFit?: 'contain' | 'cover' | 'stretch' | 'scale',
  coverScale?: number,
  coverBgColor?: string,
  coverPosition?: 'center' | 'top' | 'bottom',
  coverTexts?: CoverTextElement[],
  onOpenCoverModal?: () => void,
  onUpdateTextElement?: (id: string, updates: Partial<CoverTextElement>) => void,
  onDeleteCoverText?: (id: string) => void
}) {
  const quarterDates: Record<string, string> = {
    q1: 'September 30, 2025',
    q2: 'December 31, 2025',
    midTerm: 'December 31, 2025',
    q3: 'March 31, 2026',
    q4: 'June 30, 2026',
    annual: 'June 30, 2026'
  };

  const currentEndDate = quarterDates[selectedQuarter];

  const kpaData = useMemo(() => {
    const kpas = ['bsd', 'led', 'mfvm', 'ggpp', 'midt', 'sr'];
    const kpaNames: Record<string, string> = {
      bsd: 'Basic Service Delivery',
      led: 'Local Economic Development',
      mfvm: 'Financial Viability',
      ggpp: 'Good Governance',
      midt: 'Institutional Dev',
      sr: 'Spatial Transformation'
    };

    return kpas.map(kpa => {
      const kpaRows = rows.filter(r => (r as any)[kpa] === 'Y' || (r as any)[kpa] === 'X');
      const total = kpaRows.length;
      const achieved = kpaRows.filter(r => {
        if (selectedQuarter === 'annual') {
          return getRagDetails(r).status === 'green';
        }
        const target = (r as any)[selectedQuarter];
        const actual = (r as any)[`${selectedQuarter}Actual`];
        return target && actual && target === actual;
      }).length;

      return {
        name: kpaNames[kpa],
        total,
        achieved,
        percentage: total > 0 ? Math.round((achieved / total) * 100) : 0
      };
    });
  }, [rows, selectedQuarter]);

  const summaryData = useMemo(() => {
    if (selectedQuarter === 'annual') {
      const total = rows.length;
      const achieved = rows.filter(r => {
        const d = getRagDetails(r);
        return d.status === 'green';
      }).length;
      return [
        { name: 'Total SDBIP KPIs Assessed', value: total },
        { name: 'KPIs Achieved (Green RAG)', value: achieved }
      ];
    }
    const total = rows.filter(r => r[selectedQuarter]).length;
    const achieved = rows.filter(r => {
      const target = r[selectedQuarter];
      const actual = (r as any)[`${selectedQuarter}Actual`];
      return target && actual && target === actual;
    }).length;
    
    return [
      { name: 'Total KPIs Assessed', value: total },
      { name: 'Targets Achieved', value: achieved }
    ];
  }, [rows, selectedQuarter]);

  const kpaPages = useMemo(() => {
    const pagesList: { kpaName: string; kpaIdx: number; kpaKey: string; chunk: SdbipRow[]; chunkIdx: number; totalChunks: number }[] = [];
    const kpas = ['bsd', 'led', 'mfvm', 'ggpp', 'midt', 'sr'];
    const kpaNames: Record<string, string> = {
      bsd: 'Basic Service Delivery',
      led: 'Local Economic Development',
      mfvm: 'Financial Viability',
      ggpp: 'Good Governance',
      midt: 'Institutional Dev',
      sr: 'Spatial Transformation'
    };
    
    kpas.forEach((kpaKey, kpaIdx) => {
      const kpaRows = rows.filter(r => (r as any)[kpaKey] === 'Y' || (r as any)[kpaKey] === 'X');
      if (kpaRows.length > 0) {
        const chunkSize = 3;
        const chunksCount = Math.ceil(kpaRows.length / chunkSize);
        for (let c = 0; c < chunksCount; c++) {
          pagesList.push({
            kpaName: kpaNames[kpaKey],
            kpaIdx,
            kpaKey,
            chunk: kpaRows.slice(c * chunkSize, (c + 1) * chunkSize),
            chunkIdx: c,
            totalChunks: chunksCount
          });
        }
      }
    });
    return pagesList;
  }, [rows]);

  const quarterLabels: Record<string, string> = {
    q1: '1st Quarter',
    q2: '2nd Quarter',
    midTerm: 'Mid-Term Review',
    q3: '3rd Quarter',
    q4: '4th Quarter',
    annual: 'Annual Consolidated'
  };

  const reportTitle = `SDBIP ${quarterLabels[selectedQuarter]} REPORT 2025/2026`;

  const renderQuarterMiniCell = (row: any, qKey: 'q1' | 'q2' | 'q3' | 'q4') => {
    const target = row[qKey] || '-';
    const actual = row[`${qKey}Actual`] || '-';
    const exp = row[`${qKey}Expenditure`] || '-';
    const poes = row[`${qKey}Poes`] || [];
    const poeDesc = row[`${qKey}PoeDesc`] || '';
    
    return (
      <div className="flex flex-col gap-0.5 text-[7px] bg-slate-50 p-1 rounded border border-slate-100 min-w-[100px] leading-tight">
        <div><span className="font-extrabold text-indigo-700">T:</span> {target}</div>
        <div><span className="font-extrabold text-emerald-700">A:</span> {actual}</div>
        <div><span className="font-extrabold text-amber-700">E:</span> {exp}</div>
        {poeDesc && <div className="text-slate-500 italic truncate" title={poeDesc}><span className="font-semibold text-slate-700">P:</span> {poeDesc}</div>}
        {poes && poes.length > 0 && (
          <div className="text-[6px] text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded truncate" title={poes.join(', ')}>
            📄 {poes[poes.length - 1]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id={id} className="bg-white w-full max-w-[297mm] justify-center mx-auto shadow-[0_0_50px_rgba(0,0,0,0.1)] text-slate-800">
      {/* Page 1: Purpose */}
      <section className="relative w-[297mm] min-h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
        <div className="flex-1 space-y-6">
          <div className="inline-block px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">1. Purpose</div>
          <p className="text-[12px] leading-relaxed text-slate-800 text-justify font-medium">
            The purpose of this report is to provide feedback on the performance of the Nkangala District Municipality, as mandated by Local Government: Municipal Systems Act No. 32 of 2000, section 41(e), and the Local Government: Municipal Finance Management Act 56 of 2003, section 52(d). The information presented in this report is founded on the Integrated Development Plan (IDP) for the fiscal year 2025/2026. The scorecard was designed to capture cumulative performance, thus indicating the overall level of performance achieved to date.
          </p>
          
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight border-b-2 border-indigo-100 pb-2">METHODOLOGY USED IN COMPILING THE REPORT</h3>
          <p className="text-[11px] leading-relaxed text-slate-800 text-justify font-medium">
            In accordance with Section 46 of the Local Government: Municipal Systems Act 32 of 2000, municipalities are obligated to prepare an annual performance report for each fiscal year. This report must encompass:<br/>
            (a) The performance of the Municipality and external service providers during the financial year.<br/>
            (b) A comparison of the performances mentioned in (a) with the targets established for and performances in the preceding financial year.<br/>
            (c) Measures taken to enhance performance.<br/>
            As stipulated by the Municipal Systems Act, municipalities must track and gauge their performance progress by producing quarterly, and annual performance reports in accordance with Chapter 6 of the MSA. These quarterly reports form the Municipality's annual performance reports (Section 46 report), which are subject to auditing by the Auditor-General, along with the Annual financial statements.<br/>
            This report is grounded in information obtained from each department, evaluating performance for the {quarterLabels[selectedQuarter]} of 2025/2026, concluding on {currentEndDate}. It is a comprehensive report that relies on scores derived from a process that compares actual information per Key Performance Area (KPA), Strategic Objective, Programme, and the corresponding Key Performance Indicators (KPIs) with the approved 2025/2026 IDP and SDBIP scorecards.<br/>
            The overall performance assessment for the Nkangala District Municipality is based on the Departmental Performance scorecard, which encompasses the IDP and SDBIP KPIs and projects relevant to each department based on their respective contributions.<br/>
            Details pertaining to the Key Performance Indicators (KPIs) are presented in individual tables within each department's performance section. The results are expressed as scores, as outlined below, and have been calculated using an automated system, adhering to the guidelines provided in Regulation 805, titled "Municipal Performance Regulations for Municipal Managers and Managers Directly Accountable to Municipal Managers" from the year 2006.
          </p>
        </div>
        <PageFooter pageNumber={1} title={reportTitle} />
      </section>

      {/* Page 2: Executive Summary Text */}
      <section className="relative w-[297mm] min-h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
        <div className="flex-1 space-y-6">
          <div className="inline-block px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">2. Executive Summary</div>
          <p className="text-[12px] leading-relaxed text-slate-800 text-justify font-medium">
            This report presents the {quarterLabels[selectedQuarter]} Institutional Performance Review for the 2025/2026 fiscal year, concluding on {currentEndDate}. It provides a thorough and insightful analysis of the Municipality’s performance against the targets set out in the Integrated Development Plan (IDP) and Service Delivery and Budget Implementation Plan (SDBIP) scorecards. Where performance has not met expectations, the report highlights areas of concern, offers contextual explanations, and outlines the remedial actions undertaken to address these challenges.<br/><br/>
            The overall performance of the Nkangala District Municipality is assessed through a consolidated Performance Scorecard, which integrates departmental outcomes, key performance indicators, and project milestones as defined in the IDP and SDBIP.<br/><br/>
            <b>Institutional Performance Overview in comparison with same period of the previous year.</b><br/>
            The 2025/2026 SDBIP was developed and approved in line with Section 53(1)(c)(ii) of the Local Government: Municipal Finance Management Act (MFMA). Performance was assessed against the planned targets set in the IDP and SDBIP scorecards across six Key Performance Areas (KPAs).
          </p>
        </div>
        <PageFooter pageNumber={2} title={reportTitle} />
      </section>

      {/* KPA Breakdown Intro */}
      <section className="relative w-[297mm] min-h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
        <div className="flex-1 space-y-6">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b-2 border-indigo-100 pb-2">KPA Performance Breakdown Graphics</h3>
          <p className="text-[12px] font-medium text-slate-800">The following pages provide graphical representations of each Key Performance Area's success rates.</p>
        </div>
        <PageFooter pageNumber={3} title={reportTitle} />
      </section>

      {/* Each KPA Graph on a separate page */}
      {kpaData.map((d, i) => (
        <section key={`kpa-graph-${i}`} className="relative w-[297mm] min-h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="border border-slate-300 p-8 rounded-2xl bg-slate-50 w-full flex flex-col" style={{ height: '500px' }}>
              <h4 className="text-[16px] font-black text-black uppercase mb-6 text-center">{d.name}</h4>
              <div style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[d]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, d.total > 0 ? d.total : 100]} width={40} tick={{fontSize: 12, fill: '#000000', fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }} />
                    <Bar isAnimationActive={false} dataKey="achieved" fill="#000000" radius={[4, 4, 0, 0]} name="Targets Achieved" label={{ position: 'top', fill: '#000', fontSize: 14, fontWeight: 'bold' }} />
                    <Bar isAnimationActive={false} dataKey="total" fill="#64748b" radius={[4, 4, 0, 0]} name="Total Assessed" label={{ position: 'top', fill: '#000', fontSize: 14, fontWeight: 'bold' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[14px] text-center font-black text-black mt-6">{d.percentage}% Success Rate</p>
            </div>
          </div>
          <PageFooter pageNumber={4 + i} title={reportTitle} />
        </section>
      ))}

      {/* Page 4: Exec Summary Charts Part 2 */}
      <section className="relative w-[297mm] min-h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
        <div className="flex-1 space-y-6">
          <div className="border border-slate-300 p-8 rounded-3xl bg-slate-50 mt-8 flex flex-col" style={{ height: '400px' }}>
            <h4 className="text-[14px] font-black text-black uppercase mb-4 text-center h-6">Institutional High-Level Summary</h4>
            <div style={{ flex: 1, minHeight: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
                  <XAxis type="number" tick={{fontSize: 12, fill: '#000000', fontWeight: 'bold'}} />
                  <YAxis dataKey="name" type="category" width={180} tick={{fontSize: 12, fill: '#000000', fontWeight: 'black'}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar isAnimationActive={false} dataKey="value" fill="#000000" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#000', fontSize: 14, fontWeight: 'bold' }}>
                    {summaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#64748b" : "#000000"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-[12px] leading-relaxed text-slate-800 font-medium text-justify pt-6 italic border-l-4 border-emerald-500 pl-4 bg-emerald-50 py-4 rounded-r-xl">
            During the period under review, the District Municipality recorded commendable performance across several key service delivery and strategic focus areas, notably municipal transformation and organisational development, infrastructure development, financial management, and spatial transformation. This positive trajectory was evident in the achievement levels recorded against both Key Performance Area (KPA) indicators and strategic project indicators. A marginal regression was, however, observed in the areas of good governance and local economic development, indicating the need for targeted corrective interventions. In particular, focused attention is required to strengthen the implementation of approved action plans aimed at mitigating fraud and corruption risks, addressing internal audit findings, implementing Audit Committee resolutions, and ensuring the effective execution of Strategic Lekgotla resolutions. Furthermore, performance in relation to work opportunities created through the Expanded Public Works Programme (EPWP) declined significantly during the quarter, primarily due to the absence of newly initiated projects within the reporting period. Management remains resolutely committed to improving overall organisational performance and enhancing the achievement of strategic performance indicators.
          </p>
        </div>
        <PageFooter pageNumber={4} title={reportTitle} />
      </section>

      {/* Page 5: Acknowledgement */}
      <section className="relative w-[297mm] min-h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
        <div className="flex-1 space-y-6">
          <div className="inline-block px-4 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">3. Acknowledgement</div>
          <p className="text-[12px] leading-relaxed text-slate-800 font-medium text-justify">
            In my capacity as the Municipal Manager, I wish to convey my profound gratitude to the Honorable Executive Mayor, Mayoral Committee, MPAC, Section 79, Section 80, Audit and Performance committee, Risk Management Committee, and Councilors for their outstanding strategic guidance and leadership that they consistently demonstrated throughout the fiscal year.
            I am deeply appreciative of the direction and foresight exhibited by the Heads of Departments and all members of staff, and I recognize their contributions with immense appreciation. I would also like to convey my heartfelt thanks to all my colleagues for their unwavering dedication and invaluable support, which have played a pivotal role in our shared accomplishments.
          </p>
          
          <div className="pt-8">
            <div className="h-20 w-40 border-b-2 border-slate-900 mb-4 flex items-center justify-center font-serif italic text-xl text-slate-400">
              {currentUser?.signature ? (
                 <img src={currentUser.signature} alt="Signature" className="h-full object-contain" />
              ) : (
                "Signature Placeholder"
              )}
            </div>
            <div className="uppercase font-black text-xs tracking-tight text-slate-900">MR. M.L. MAHLANGU</div>
            <div className="uppercase font-bold text-[10px] text-slate-600">MUNICIPAL MANAGER</div>
          </div>
        </div>
        <PageFooter pageNumber={5} title={reportTitle} />
      </section>

      {/* Page 6: Vision & Mission */}
      <section className="relative w-[297mm] min-h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
        <div className="flex-1 space-y-6">
          <div className="inline-block px-4 py-1.5 bg-indigo-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">4. Vision, Mission & Strategic Objectives</div>
          
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase">STRATEGIC LEKGOTLA AND STRATEGIC DIRECTION</h3>
            <p className="text-[11px] leading-relaxed text-slate-800 font-medium text-justify">
              The district convened its Annual Strategic Lekgotla from 31 March to 2 April 2025. In accordance with the Local Government: Municipal Systems Act, No. 32 of 2000, Chapter 5, Section 25(1), (2) and (3)(b), the purpose of the Lekgotla was to evaluate the district’s developmental achievements and challenges, and to agree on corrective actions aligned with the Vision and Mission of the Municipality. During the Lekgotla, the Vision, Mission, Values, and Strategic Goals were reviewed and recommended as follows:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
             <div className="space-y-2">
               <h4 className="text-[10px] font-black text-indigo-800 uppercase">Vision</h4>
               <p className="text-base font-black text-slate-900 italic leading-tight">"District of Excellence and Climate-Smart Innovation."</p>
             </div>
             <div className="space-y-2">
               <h4 className="text-[10px] font-black text-indigo-800 uppercase">Mission</h4>
               <p className="text-[12px] font-medium text-slate-800 leading-relaxed text-justify">
                 Nkangala District Municipality (NDM) is committed to improving the physical, socio-economic, and institutional environment in order to address social and economic infrastructure challenges through sustainable development and service excellence, with emphasis on becoming a renewable energy hub.
               </p>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VALUES</h3>
            <EditableTable 
              headers={['Value Statement', 'Focus Area']} 
              initialRows={[
                ['Promote and pursue key goals (Vision 2030)', 'Strategic Alignment'],
                ['Be an inclusive and caring organization', 'Inclusivity & Care'],
                ['Be democratic, transparent, accountable', 'Good Governance'],
                ['Be responsive to citizens/Local Municipalities', 'Responsiveness'],
                ['Cultivate a work ethic focused on results', 'Performance Orientation'],
                ['Demonstrate mutual respect and discipline', 'Ethical Conduct & Collaboration']
              ]} 
            />
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">MUNICIPAL PRIORITIES</h3>
            <ol className="list-decimal pl-6 space-y-1 text-xs font-bold text-slate-800">
              <li>Basic Services and Infrastructure Development.</li>
              <li>Economic Development, Growth, and Job Creation.</li>
              <li>Spatial Transformation and Sustainable Human Settlements.</li>
              <li>Security, Social Services, Environment, and Disaster Management.</li>
              <li>Financial Management and Systems.</li>
              <li>Governance, Administration, and ICT.</li>
            </ol>
          </div>
        </div>
        <PageFooter pageNumber={6} title={reportTitle} />
      </section>

      {/* Page 7: Intro to Performance Data */}
      <section className="relative w-[297mm] min-h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
        <div className="flex-1 space-y-8">
          <div className="inline-block px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">5. Institutional Performance Data</div>
          <p className="text-[12px] leading-relaxed text-slate-800 font-medium text-justify">
            The following tables illustrate the Institutional performance for each Key Performance Area (KPA). These tables encompass all the KPIs, and Projects outlined in the IDP and SDBIP scorecards for {quarterLabels[selectedQuarter]}. The relevant parameters per KPI are populated directly from the corresponding quarter and institutional database tables.
          </p>
        </div>
        <PageFooter pageNumber={7} title={reportTitle} />
      </section>

      {/* Pages 8+: Paginated Individual KPA Data Tables */}
      {kpaPages.map((page, pageIndex) => {
         const { kpaName, kpaIdx, chunk, chunkIdx, totalChunks } = page;
         const kpa = kpaData[kpaIdx];
         const pageNum = 14 + pageIndex;
         
         return (
          <section key={`kpa-page-chunk-${pageIndex}`} className="relative w-[297mm] h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
            <div className="flex-1 space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{kpaName}</h3>
                  <span className="text-xs text-slate-500 font-bold">
                    (Page {chunkIdx + 1} of {totalChunks})
                  </span>
                </div>
                <div className="px-3 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                  {kpa.achieved}/{kpa.total} Achieved ({kpa.percentage}%)
                </div>
              </div>
              
              <div className="overflow-hidden w-full">
                <table className="w-full table-fixed border-collapse text-[8px] border border-slate-300 shadow-sm text-black">
                  <thead className="bg-slate-900 text-white uppercase text-left break-inside-avoid">
                    {selectedQuarter === 'annual' ? (
                      <tr>
                        <th className="border border-slate-700 p-1.5 font-black w-[5%] text-white bg-slate-900 text-center">KPA</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[5%] text-white bg-slate-900 text-center">Ref</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[22%] text-white bg-slate-900">Indicators (KPI)</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[8%] text-white bg-slate-900">Total Budget</th>
                        <th className="border border-slate-700 p-1.5 font-black text-center w-[4%] text-white bg-slate-900">RAG</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-indigo-950 text-indigo-100 w-[10%] text-center">Q1-Q4 Targets</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-emerald-950 text-emerald-100 w-[10%] text-center">Q1-Q4 Actuals</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-teal-950 text-teal-100 w-[10%] text-center">Q1-Q4 Spend</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-amber-950 text-amber-100 w-[12%]">Q1-Q4 POEs</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[7%] text-white bg-slate-900">Variance</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[7%] text-white bg-slate-900">Corrective</th>
                      </tr>
                    ) : selectedQuarter === 'midTerm' ? (
                      <tr>
                        <th className="border border-slate-700 p-1.5 font-black w-[5%] text-white bg-slate-900 text-center">KPA</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[5%] text-white bg-slate-900 text-center">Ref</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[22%] text-white bg-slate-900">Indicator (KPI)</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[8%] text-white bg-slate-900">Total Budget</th>
                        <th className="border border-slate-700 p-1.5 font-black text-center w-[4%] text-white bg-slate-900">RAG</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-indigo-950 text-indigo-100 w-[10%] text-center">Q1+Q2 Targets</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-emerald-950 text-emerald-100 w-[10%] text-center">Q1+Q2 Actuals</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-teal-950 text-teal-100 w-[10%] text-center">Q1+Q2 Spend</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-amber-950 text-amber-100 w-[12%]">Q1+Q2 POEs</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[7%] text-white bg-slate-900">Variance</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[7%] text-white bg-slate-900">Corrective</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="border border-slate-700 p-1.5 font-black w-[5%] text-white bg-slate-900 text-center">KPA</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[5%] text-white bg-slate-900 text-center">Ref</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[24%] text-white bg-slate-900">Indicator (KPI)</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[8%] text-white bg-slate-900">Total Budget</th>
                        <th className="border border-slate-700 p-1.5 font-black text-center w-[4%] text-white bg-slate-900">RAG</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-indigo-900 text-white w-[9%] text-center">{selectedQuarter.toUpperCase()} Target</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-emerald-900 text-white w-[9%] text-center">{selectedQuarter.toUpperCase()} Actual</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-teal-800 text-white w-[9%] text-center">{selectedQuarter.toUpperCase()} Spend</th>
                        <th className="border border-slate-700 p-1.5 font-black bg-amber-800 text-white w-[13%]">{selectedQuarter.toUpperCase()} POE</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[7%] text-white bg-slate-900">Variance</th>
                        <th className="border border-slate-700 p-1.5 font-black w-[7%] text-white bg-slate-900">Corrective</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {chunk.map((row, rIdx) => {
                      const rag = getRagDetails(row);
                      const kpaLabel = getRowKpa(row);
                      
                      if (selectedQuarter === 'annual') {
                        const variance = row.q4Variance || row.q3Variance || row.q2Variance || row.q1Variance || '-';
                        const corrective = row.q4Corrective || row.q3Corrective || row.q2Corrective || row.q1Corrective || '-';
                        const isAchieved = rag.status === 'green';
                        const bgColor = isAchieved ? 'bg-emerald-50/70' : (rag.status === 'red' ? 'bg-rose-50/50' : 'bg-amber-50/50');
                        
                        return (
                          <tr key={rIdx} className={`border-b break-inside-avoid text-black font-medium ${bgColor}`}>
                            <td className="border border-slate-300 p-1.5 font-black text-center text-[7px] text-slate-600 bg-slate-100/50 break-words">{kpaLabel}</td>
                            <td className="border border-slate-300 p-1.5 font-bold font-mono text-center break-words">{row.refNum}</td>
                            <td className="border border-slate-300 p-1.5 font-bold leading-tight break-words">{row.kpi}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-slate-700 break-words">{row.budgetAllocation || 'Opex'}</td>
                            <td className="border border-slate-300 p-1.5 text-center">
                              <span className="text-xs" title={rag.tooltip}>{rag.face}</span>
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-indigo-800 text-xs text-center break-words">
                              {sumStringValues([row.q1, row.q2, row.q3, row.q4])}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-emerald-800 text-xs text-center break-words">
                              {sumStringValues([row.q1Actual, row.q2Actual, row.q3Actual, row.q4Actual])}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-medium text-slate-700 text-xs text-center break-words">
                              {sumStringValues([row.q1Expenditure, row.q2Expenditure, row.q3Expenditure, row.q4Expenditure])}
                            </td>
                            <td className="border border-slate-300 p-1 break-words">
                              <div className="flex flex-col gap-0.5 text-[6px] leading-tight text-slate-600">
                                {[1, 2, 3, 4].map(q => {
                                  const poeDesc = (row as any)[`q${q}PoeDesc`] || '';
                                  const poes = (row as any)[`q${q}Poes`] || [];
                                  if (!poeDesc && poes.length === 0) return null;
                                  return (
                                    <div key={q} className="border-b border-slate-100 last:border-0 pb-0.5 mb-0.5 last:pb-0 last:mb-0 break-words">
                                      <span className="font-bold text-slate-500 mr-0.5">Q{q}:</span>
                                      <span className="break-words" title={poeDesc}>{poeDesc || 'Submitted'}</span>
                                      {poes.length > 0 && <span className="text-emerald-800 ml-1">📄</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="border border-slate-300 p-1.5 italic text-rose-900 font-bold leading-tight break-words">{variance}</td>
                            <td className="border border-slate-300 p-1.5 font-medium leading-tight break-words">{corrective}</td>
                          </tr>
                        );
                      } else if (selectedQuarter === 'midTerm') {
                        const target1 = row.q1 || '-';
                        const actual1 = row.q1Actual || '-';
                        const target2 = row.q2 || '-';
                        const actual2 = row.q2Actual || '-';
                        const variance = row.midTermVariance || row.q2Variance || row.q1Variance || '-';
                        const corrective = row.midTermCorrective || row.q2Corrective || row.q1Corrective || '-';
                        
                        const isAchieved = (target1 === actual1) && (target2 === actual2);
                        const bgColor = isAchieved ? 'bg-emerald-50/50' : 'bg-amber-50/30';
                        
                        return (
                          <tr key={rIdx} className={`border-b break-inside-avoid text-black font-medium ${bgColor}`}>
                            <td className="border border-slate-300 p-1.5 font-black text-center text-[7px] text-slate-600 bg-slate-100/50 break-words">{kpaLabel}</td>
                            <td className="border border-slate-300 p-1.5 font-bold font-mono text-center break-words">{row.refNum}</td>
                            <td className="border border-slate-300 p-1.5 font-bold leading-tight break-words">{row.kpi}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-slate-700 break-words">{row.budgetAllocation || 'Opex'}</td>
                            <td className="border border-slate-300 p-1.5 text-center">
                              <span className="text-xs" title={rag.tooltip}>{rag.face}</span>
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-indigo-800 text-xs text-center break-words">
                              {sumStringValues([row.q1, row.q2])}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-emerald-800 text-xs text-center break-words">
                              {sumStringValues([row.q1Actual, row.q2Actual])}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-medium text-slate-700 text-xs text-center break-words">
                              {sumStringValues([row.q1Expenditure, row.q2Expenditure])}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-left break-words">
                              <div className="flex flex-col gap-0.5 text-[6px] leading-tight text-slate-600">
                                {[1, 2].map(q => {
                                  const poeDesc = (row as any)[`q${q}PoeDesc`] || '';
                                  const poes = (row as any)[`q${q}Poes`] || [];
                                  if (!poeDesc && poes.length === 0) return null;
                                  return (
                                    <div key={q} className="border-b border-slate-100 last:border-0 pb-0.5 mb-0.5 last:pb-0 last:mb-0 break-words">
                                      <span className="font-bold text-slate-500 mr-0.5">Q{q}:</span>
                                      <span className="break-words" title={poeDesc}>{poeDesc || 'Submitted'}</span>
                                      {poes.length > 0 && <span className="text-emerald-800 ml-1">📄</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="border border-slate-300 p-1.5 italic text-rose-900 font-bold leading-tight break-words">{variance}</td>
                            <td className="border border-slate-300 p-1.5 font-medium leading-tight break-words">{corrective}</td>
                          </tr>
                        );
                      } else {
                        // specific quarter
                        const target = (row as any)[selectedQuarter] || '-';
                        const actual = (row as any)[`${selectedQuarter}Actual`] || '-';
                        const exp = (row as any)[`${selectedQuarter}Expenditure`] || '-';
                        const variance = (row as any)[`${selectedQuarter}Variance`] || '-';
                        const corrective = (row as any)[`${selectedQuarter}Corrective`] || '-';
                        const poes = (row as any)[`${selectedQuarter}Poes`] || [];
                        const poeDesc = (row as any)[`${selectedQuarter}PoeDesc`] || '';
                        
                        const isAchieved = target && actual && target === actual;
                        const bgColor = isAchieved ? 'bg-emerald-50/70' : (actual && !isAchieved ? 'bg-rose-50/50' : '');
                        
                        return (
                          <tr key={rIdx} className={`border-b break-inside-avoid text-black font-medium ${bgColor}`}>
                            <td className="border border-slate-300 p-1.5 font-black text-center text-[7px] text-slate-600 bg-slate-100/50 break-words">{kpaLabel}</td>
                            <td className="border border-slate-300 p-1.5 font-bold font-mono text-center break-words">{row.refNum}</td>
                            <td className="border border-slate-300 p-1.5 font-bold leading-tight break-words">{row.kpi}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-slate-700 break-words">{row.budgetAllocation || 'Opex'}</td>
                            <td className="border border-slate-300 p-1.5 text-center">
                              <span className="text-xs" title={rag.tooltip}>{rag.face}</span>
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-indigo-700 text-center break-words">{target}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-emerald-700 text-center break-words">{actual}</td>
                            <td className="border border-slate-300 p-1.5 font-medium text-center break-words">{exp}</td>
                            <td className="border border-slate-300 p-1.5 break-words">
                              {poeDesc && <div className="text-[8px] text-slate-600 leading-tight mb-1 break-words">{poeDesc}</div>}
                              {poes && poes.length > 0 && (
                                <div className="text-[7px] text-emerald-850 bg-emerald-50 px-1 py-0.5 rounded truncate" title={poes.join(', ')}>
                                  📄 {poes[poes.length - 1]}
                                </div>
                              )}
                            </td>
                            <td className="border border-slate-300 p-1.5 italic text-rose-900 font-bold leading-tight break-words">{variance}</td>
                            <td className="border border-slate-300 p-1.5 font-medium leading-tight break-words">{corrective}</td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <PageFooter pageNumber={pageNum} title={reportTitle} />
          </section>
         );
      })}

      {/* Ratings Scale Page */}
      <section className="relative w-[297mm] h-[210mm] p-12 flex flex-col page-break-after border-b border-gray-100 bg-white">
        <div className="flex-1 space-y-6">
          <h3 className="text-base font-black text-black uppercase">Performance Rating Scale</h3>
          <table className="w-full border-collapse border border-slate-400 text-[11px] leading-snug">
            <thead className="bg-[#cbd5e1] text-black uppercase font-black text-left">
              <tr><th className="border border-slate-400 p-3 w-20 text-center">Rating</th><th className="border border-slate-400 p-3 w-48">Terminology</th><th className="border border-slate-400 p-3">Description</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 p-3 text-center font-black text-xl bg-emerald-100 text-black">5</td>
                <td className="border border-slate-400 p-3 font-black uppercase text-black bg-emerald-100">Outstanding Performance</td>
                <td className="border border-slate-400 p-3 text-black font-medium text-justify">Performance far exceeds the standards expected of an institution at this level.</td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-3 text-center font-black text-xl bg-blue-100 text-black">4</td>
                <td className="border border-slate-400 p-3 font-black uppercase text-black bg-blue-100">Performance Significantly Above Expectations</td>
                <td className="border border-slate-400 p-3 text-black font-medium text-justify">Performance is significantly higher than the standard expected in the job.</td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-3 text-center font-black text-xl bg-emerald-50 text-black">3</td>
                <td className="border border-slate-400 p-3 font-black uppercase text-black bg-emerald-50">Fully Effective</td>
                <td className="border border-slate-400 p-3 text-black font-medium text-justify">Performance fully meets the standards expected in all areas of the job.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <PageFooter pageNumber={14 + kpaPages.length} title={reportTitle} />
      </section>

      {/* Back Cover */}
      <section 
        className="relative w-[297mm] h-[210mm] flex flex-col justify-center items-center text-center p-12 text-white" 
        style={{ 
          backgroundColor: "#1e293b", 
          backgroundImage: coverImage ? (coverImage.startsWith('linear-gradient') ? coverImage : `url('${coverImage}')`) : `url('${DEFAULT_COVER_IMAGE}')`, 
          backgroundSize: "cover", 
          backgroundPosition: "center" 
        }}
      >
         <div className="absolute inset-0 bg-slate-900 mix-blend-multiply transition-opacity" style={{ opacity: Math.min(1, overlayOpacity + 0.1) }} />
         <div className="relative z-10 w-full flex flex-col items-center">
            <h2 
              className="text-xl font-black uppercase tracking-widest outline-none border-b-2 border-transparent focus:border-white text-center w-2/3 mx-auto"
              contentEditable 
              suppressContentEditableWarning
            >
              END OF REPORT
            </h2>
            <div className="mt-8 w-16 h-1 bg-emerald-500 rounded-full"></div>
            <p className="mt-8 text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-loose">
              Prepared by Mzansi Flow Automated PMS System<br />
              &copy; 2025 All Rights Reserved
            </p>
         </div>
      </section>
    </div>
  );
}

function SDBIPTemplateTab({ 
  rows, 
  selectedQuarter, 
  setSelectedQuarter, 
  currentUser, 
  onAdopt,
  coverImage,
  overlayOpacity,
  coverFit,
  coverScale,
  coverBgColor,
  coverPosition,
  coverTexts,
  onOpenCoverModal,
  onUpdateTextElement,
  onDeleteCoverText
}: { 
  rows: SdbipRow[], 
  selectedQuarter: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual', 
  setSelectedQuarter: (q: any) => void, 
  currentUser: any, 
  onAdopt: (html: string) => void,
  coverImage?: string,
  overlayOpacity?: number,
  coverFit?: 'contain' | 'cover' | 'stretch' | 'scale',
  coverScale?: number,
  coverBgColor?: string,
  coverPosition?: 'center' | 'top' | 'bottom',
  coverTexts?: CoverTextElement[],
  onOpenCoverModal?: () => void,
  onUpdateTextElement?: (id: string, updates: Partial<CoverTextElement>) => void,
  onDeleteCoverText?: (id: string) => void
}) {
  return (
    <div className="h-full flex overflow-hidden bg-gray-50 animate-fade-in">
      <div className="w-80 border-r border-gray-200 bg-white p-6 overflow-y-auto">
        <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Report Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Reporting Period</label>
            <select 
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value as any)}
              className="w-full px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 outline-none"
            >
              <option value="q1">1st Quarter (July - Sept)</option>
              <option value="q2">2nd Quarter (Oct - Dec)</option>
              <option value="midTerm">Mid-Term Review (July - Dec)</option>
              <option value="q3">3rd Quarter (Jan - Mar)</option>
              <option value="q4">4th Quarter (Apr - June)</option>
              <option value="annual">Annual Consolidated Report (Full Year)</option>
            </select>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onOpenCoverModal}
              className="w-full py-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[11px] font-bold rounded-xl border border-slate-200 hover:border-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4 text-indigo-600" />
              <span>Cover Setup & Text Editor</span>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <button 
              onClick={() => {
                const el = document.getElementById('template-content');
                if (el) onAdopt(el.innerHTML);
              }}
              className="w-full py-3 bg-indigo-600 text-white text-[11px] font-black rounded-xl uppercase tracking-widest mt-2 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" /> Adopt Template
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto hide-scrollbar flex justify-center bg-gray-200/50">
        <ReportDocument 
          rows={rows} 
          selectedQuarter={selectedQuarter} 
          currentUser={currentUser} 
          id="template-content" 
          coverImage={coverImage}
          overlayOpacity={overlayOpacity}
          coverFit={coverFit}
          coverScale={coverScale}
          coverBgColor={coverBgColor}
          coverPosition={coverPosition}
          coverTexts={coverTexts}
          onOpenCoverModal={onOpenCoverModal}
          onUpdateTextElement={onUpdateTextElement}
          onDeleteCoverText={onDeleteCoverText}
        />
      </div>
    </div>
  );
}

function SDBIPReportsTab({ 
  rows, 
  currentUser, 
  activeTenantId, 
  period, 
  setPeriod,
  coverImage,
  overlayOpacity,
  coverFit,
  coverScale,
  coverBgColor,
  coverPosition,
  coverTexts,
  onOpenCoverModal,
  onUpdateTextElement,
  onDeleteCoverText
}: { 
  rows: SdbipRow[], 
  currentUser: any, 
  activeTenantId: string, 
  period: string, 
  setPeriod: (p: any) => void,
  coverImage?: string,
  overlayOpacity?: number,
  coverFit?: 'contain' | 'cover' | 'stretch' | 'scale',
  coverScale?: number,
  coverBgColor?: string,
  coverPosition?: 'center' | 'top' | 'bottom',
  coverTexts?: CoverTextElement[],
  onOpenCoverModal?: () => void,
  onUpdateTextElement?: (id: string, updates: Partial<CoverTextElement>) => void,
  onDeleteCoverText?: (id: string) => void
}) {
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const exportToPDF = async () => {
    setIsExportingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { toPng } = await import('html-to-image');
      
      const content = document.getElementById('report-content');
      if (!content) return;
      
      const sections = Array.from(content.querySelectorAll('section'));
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Temporarily ensure content is visible
      const originalOverflow = content.style.overflow;
      content.style.overflow = 'visible';

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        const imgData = await toPng(section, { 
            quality: 0.95, 
            pixelRatio: 1.5,
            backgroundColor: '#ffffff',
            skipFonts: true,
            fontEmbedCSS: '',
        });
        
        if (i > 0) pdf.addPage();
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (section.offsetHeight * pdfWidth) / section.offsetWidth;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      
      content.style.overflow = originalOverflow;
      pdf.save(`SDBIP_Top_Layer_Report_${period.toUpperCase()}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF", error);
    }
    setIsExportingPDF(false);
  };

  const exportToWord = async () => {
    setIsExportingWord(true);
    try {
      const content = document.getElementById('report-content');
      if (!content) return;

      const quarterLabels: Record<string, string> = {
        q1: '1st Quarter',
        q2: '2nd Quarter',
        midTerm: 'Mid-Term Review',
        q3: '3rd Quarter',
        q4: '4th Quarter',
        annual: 'Annual Consolidated'
      };

      const qLabel = quarterLabels[period] || period.toUpperCase();
      const reportTitle = `NKANGALA DISTRICT MUNICIPALITY - SDBIP ${qLabel.toUpperCase()} REPORT 2025/2026`;

      // Build clean, native, rapid Word HTML document
      let docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${reportTitle}</title>
  <style>
    @page Section1 {
      size: 841.9pt 595.3pt;
      mso-page-orientation: landscape;
      margin: 28.0pt 28.0pt 28.0pt 28.0pt;
    }
    div.Section1 { page: Section1; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.4; }
    h1 { font-size: 18pt; color: #0f172a; text-align: center; margin-bottom: 8pt; text-transform: uppercase; }
    h2 { font-size: 14pt; color: #1e293b; margin-top: 14pt; margin-bottom: 6pt; border-bottom: 2pt solid #0f172a; padding-bottom: 3pt; text-transform: uppercase; }
    h3 { font-size: 11pt; color: #334155; margin-top: 10pt; margin-bottom: 4pt; text-transform: uppercase; }
    p { font-size: 9.5pt; text-align: justify; margin-bottom: 6pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; font-size: 8pt; }
    th { background-color: #0f172a; color: #ffffff; padding: 5pt 4pt; border: 1pt solid #334155; font-weight: bold; text-align: left; }
    td { padding: 4pt 3pt; border: 1pt solid #cbd5e1; vertical-align: top; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .rag-green { background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; }
    .rag-red { background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body style="tab-interval:36pt">
  <div class="Section1">
    <h1>${reportTitle}</h1>
    <p style="text-align:center; font-size: 10pt; color: #475569; font-weight: bold; margin-bottom: 16pt;">
      Official SDBIP Top Layer Institutional Scorecard & Performance Feedback
    </p>

    <h2>1. Purpose & Statutory Framework</h2>
    <p>
      The purpose of this report is to provide feedback on the performance of the Nkangala District Municipality, as mandated by Local Government: Municipal Systems Act No. 32 of 2000, section 41(e), and the Local Government: Municipal Finance Management Act 56 of 2003, section 52(d). The information presented in this report is founded on the Integrated Development Plan (IDP) for the fiscal year 2025/2026.
    </p>

    <h2>2. Executive Summary</h2>
    <p>
      This report presents the ${qLabel} Institutional Performance Review for the 2025/2026 fiscal year. During the period under review, the District Municipality recorded performance across several key service delivery and strategic focus areas, notably municipal transformation, infrastructure development, financial management, good governance, and spatial transformation.
    </p>

    <div class="page-break"></div>
    <h2>3. SDBIP Top Layer Performance Scorecards</h2>
`;

      // Group rows by KPA
      const kpaNames: Record<string, string> = {
        bsd: 'Basic Service Delivery and Infrastructure (BSD)',
        led: 'Local Economic Development (LED)',
        mfvm: 'Municipal Financial Viability and Management (MFVM)',
        ggpp: 'Good Governance and Public Participation (GGPP)',
        midt: 'Municipal Institutional Development and Transformation (MIDT)',
        sr: 'Spatial Rationale and Municipal Planning (SR)'
      };

      const kpaGroups: Record<string, SdbipRow[]> = {
        bsd: [],
        led: [],
        mfvm: [],
        ggpp: [],
        midt: [],
        sr: []
      };

      rows.forEach(r => {
        let kpaKey = 'bsd';
        if (r.bsd && r.bsd !== '-') kpaKey = 'bsd';
        else if (r.led && r.led !== '-') kpaKey = 'led';
        else if (r.mfvm && r.mfvm !== '-') kpaKey = 'mfvm';
        else if (r.ggpp && r.ggpp !== '-') kpaKey = 'ggpp';
        else if (r.midt && r.midt !== '-') kpaKey = 'midt';
        else if (r.sr && r.sr !== '-') kpaKey = 'sr';
        else if (r.kpas) {
          const lower = r.kpas.toLowerCase();
          if (lower.includes('led')) kpaKey = 'led';
          else if (lower.includes('mfvm') || lower.includes('financial')) kpaKey = 'mfvm';
          else if (lower.includes('ggpp') || lower.includes('governance')) kpaKey = 'ggpp';
          else if (lower.includes('midt') || lower.includes('institutional')) kpaKey = 'midt';
          else if (lower.includes('sr') || lower.includes('spatial')) kpaKey = 'sr';
        }

        if (kpaGroups[kpaKey]) {
          kpaGroups[kpaKey].push(r);
        } else {
          kpaGroups.bsd.push(r);
        }
      });

      Object.entries(kpaGroups).forEach(([kpaKey, kpaRows]) => {
        if (kpaRows.length === 0) return;
        const groupTitle = kpaNames[kpaKey] || kpaKey.toUpperCase();

        docHtml += `
    <h3>${groupTitle} (${kpaRows.length} KPIs)</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 6%;">Ref</th>
          <th style="width: 28%;">Indicator (KPI)</th>
          <th style="width: 8%;">Budget</th>
          <th style="width: 6%; text-align:center;">RAG</th>
          <th style="width: 12%;">Target</th>
          <th style="width: 12%;">Actual</th>
          <th style="width: 14%;">Variance / Issues</th>
          <th style="width: 14%;">Corrective Action</th>
        </tr>
      </thead>
      <tbody>
`;

        kpaRows.forEach(r => {
          const isAchieved = r.ragStatus === 'green';
          const ragClass = isAchieved ? 'rag-green' : 'rag-red';
          const ragText = isAchieved ? 'ACHIEVED' : 'NOT ACHIEVED';

          let targetText = '';
          let actualText = '';
          let varianceText = '';
          let correctiveText = '';

          if (period === 'q1') {
            targetText = r.q1 || '-';
            actualText = r.q1Actual || '-';
            varianceText = r.q1Variance || '-';
            correctiveText = r.q1Corrective || '-';
          } else if (period === 'q2') {
            targetText = r.q2 || '-';
            actualText = r.q2Actual || '-';
            varianceText = r.q2Variance || '-';
            correctiveText = r.q2Corrective || '-';
          } else if (period === 'q3') {
            targetText = r.q3 || '-';
            actualText = r.q3Actual || '-';
            varianceText = r.q3Variance || '-';
            correctiveText = r.q3Corrective || '-';
          } else if (period === 'q4') {
            targetText = r.q4 || '-';
            actualText = r.q4Actual || '-';
            varianceText = r.q4Variance || '-';
            correctiveText = r.q4Corrective || '-';
          } else {
            targetText = r.annualTarget || '-';
            actualText = r.q4Actual || r.q3Actual || r.q2Actual || r.q1Actual || '-';
            varianceText = r.q4Variance || r.q3Variance || r.q2Variance || r.q1Variance || '-';
            correctiveText = r.q4Corrective || r.q3Corrective || r.q2Corrective || r.q1Corrective || '-';
          }

          docHtml += `
        <tr>
          <td style="font-weight:bold;">${r.refNum || '-'}</td>
          <td>${r.kpi || '-'}</td>
          <td>${r.budgetAllocation || '-'}</td>
          <td class="${ragClass}">${ragText}</td>
          <td>${targetText}</td>
          <td>${actualText}</td>
          <td>${varianceText}</td>
          <td>${correctiveText}</td>
        </tr>
`;
        });

        docHtml += `
      </tbody>
    </table>
`;
      });

      docHtml += `
  </div>
</body>
</html>
`;

      const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = url;
      fileDownload.download = `SDBIP_Top_Layer_Report_${period.toUpperCase()}.doc`;
      fileDownload.click();
      document.body.removeChild(fileDownload);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export Word", error);
    }
    setIsExportingWord(false);
  };

  const exportToExcel = () => {
    let headers: string[] = [];
    let excelRows: any[][] = [];

    const quarterLabels: Record<string, string> = {
      q1: '1st Quarter',
      q2: '2nd Quarter',
      midTerm: 'Mid-Term Review',
      q3: '3rd Quarter',
      q4: '4th Quarter',
      annual: 'Annual Consolidated'
    };

    if (period === 'annual') {
      headers = [
        'KPA', 'Ref Num', 'Indicator (KPI)', 'Total Budget', 'RAG Status',
        'Q1,q2,q3,q4 Targets', 'q1,q2,q3,q4 Actuals', 'q1, q2, q3, q4 expenditures', 'q1, q2, q3, q4 poes',
        'Variance / Issue', 'Corrective Action'
      ];
    } else if (period === 'midTerm') {
      headers = [
        'KPA', 'Ref Num', 'Indicator (KPI)', 'Total Budget', 'RAG Status',
        'Q1 + Q2 Targets', 'Q1 + Q2 Actuals', 'Q1 + Q2 expenditures', 'q1 + q2 poes',
        'Variance / Issue', 'Corrective Action'
      ];
    } else {
      const qUpper = period.toUpperCase();
      headers = [
        'KPA', 'Ref Num', 'Indicator (KPI)', 'Total Budget', 'RAG Status',
        `${qUpper} Target`, `${qUpper} Actual`, `${qUpper} Expenditure`, `${qUpper} POE Desc`, `${qUpper} POE Files`,
        'Variance / Issue', 'Corrective Action'
      ];
    }

    const kpas = ['bsd', 'led', 'mfvm', 'ggpp', 'midt', 'sr'];
    const kpaNames: Record<string, string> = {
      bsd: 'Basic Service Delivery',
      led: 'Local Economic Development',
      mfvm: 'Financial Viability',
      ggpp: 'Good Governance',
      midt: 'Institutional Dev',
      sr: 'Spatial Transformation'
    };

    excelRows.push([`NKANGALA DISTRICT MUNICIPALITY - SDBIP ${quarterLabels[period].toUpperCase()} REPORT 2025/2026`]);
    excelRows.push([]); 

    kpas.forEach((kpa) => {
      const kpaRows = rows.filter(r => (r as any)[kpa] === 'Y' || (r as any)[kpa] === 'X');
      if (kpaRows.length === 0) return;

      excelRows.push([kpaNames[kpa].toUpperCase()]);
      excelRows.push(headers);

      kpaRows.forEach(row => {
        const rag = getRagDetails(row);
        const ragLabel = rag.label + ' ' + rag.face;
        
        if (period === 'annual') {
          excelRows.push([
            getRowKpa(row),
            row.refNum || '',
            row.kpi || '',
            row.budgetAllocation || 'Opex',
            ragLabel,
            sumStringValues([row.q1, row.q2, row.q3, row.q4]),
            sumStringValues([row.q1Actual, row.q2Actual, row.q3Actual, row.q4Actual]),
            sumStringValues([row.q1Expenditure, row.q2Expenditure, row.q3Expenditure, row.q4Expenditure]),
            getCombinedPoesText(row, [1, 2, 3, 4]),
            row.q4Variance || row.q3Variance || row.q2Variance || row.q1Variance || '',
            row.q4Corrective || row.q3Corrective || row.q2Corrective || row.q1Corrective || ''
          ]);
        } else if (period === 'midTerm') {
          excelRows.push([
            getRowKpa(row),
            row.refNum || '',
            row.kpi || '',
            row.budgetAllocation || 'Opex',
            ragLabel,
            sumStringValues([row.q1, row.q2]),
            sumStringValues([row.q1Actual, row.q2Actual]),
            sumStringValues([row.q1Expenditure, row.q2Expenditure]),
            getCombinedPoesText(row, [1, 2]),
            row.midTermVariance || row.q2Variance || row.q1Variance || '',
            row.midTermCorrective || row.q2Corrective || row.q1Corrective || ''
          ]);
        } else {
          excelRows.push([
            getRowKpa(row),
            row.refNum || '',
            row.kpi || '',
            row.budgetAllocation || 'Opex',
            ragLabel,
            (row as any)[period] || '',
            (row as any)[`${period}Actual`] || '',
            (row as any)[`${period}Expenditure`] || '',
            (row as any)[`${period}PoeDesc`] || '',
            ((row as any)[`${period}Poes`] || []).join(', '),
            (row as any)[`${period}Variance`] || '',
            (row as any)[`${period}Corrective`] || ''
          ]);
        }
      });
      excelRows.push([]); 
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SDBIP Performance');
    XLSX.writeFile(workbook, `SDBIP_Report_${period.toUpperCase()}_2025_2026.xlsx`);
  };

  const exportToMarkdown = () => {
    const quarterLabels: Record<string, string> = {
      q1: '1st Quarter',
      q2: '2nd Quarter',
      midTerm: 'Mid-Term',
      q3: '3rd Quarter',
      q4: '4th Quarter',
      annual: 'Annual Consolidated'
    };
    const reportTitle = `SDBIP ${quarterLabels[period]} REPORT 2025/2026`;

    let md = `# ${reportTitle}\n\n`;
    md += `**MZANSI FLOW AUTOMATED PMS SYSTEM**\n\n---\n\n`;
    
    md += `## 1. Purpose\n\n`;
    md += `The purpose of this report is to provide feedback on the performance of the Nkangala District Municipality, as mandated by Local Government: Municipal Systems Act No. 32 of 2000, section 41(e), and the Local Government: Municipal Finance Management Act 56 of 2003, section 52(d). The information presented in this report is founded on the Integrated Development Plan (IDP) for the fiscal year 2025/2026. The scorecard was designed to capture cumulative performance, thus indicating the overall level of performance achieved to date.\n\n`;
    md += `### METHODOLOGY USED IN COMPILING THE REPORT\n\n`;
    md += `In accordance with Section 46 of the Local Government: Municipal Systems Act 32 of 2000, municipalities are obligated to prepare an annual performance report for each fiscal year. This report must encompass:\n`;
    md += `(a) The performance of the Municipality and external service providers during the financial year.\n`;
    md += `(b) A comparison of the performances mentioned in (a) with the targets established for and performances in the preceding financial year.\n`;
    md += `(c) Measures taken to enhance performance.\n\n`;

    md += `## 2. Executive Summary\n\n`;
    md += `This report presents the ${quarterLabels[period]} Institutional Performance Review for the 2025/2026 fiscal year, concluding on the reporting date. It provides a thorough and insightful analysis of the Municipality’s performance against the targets set out in the Integrated Development Plan (IDP) and Service Delivery and Budget Implementation Plan (SDBIP) scorecards.\n\n`;

    md += `## 5. Institutional Performance Data\n\n`;
    
    const kpas = ['bsd', 'led', 'mfvm', 'ggpp', 'midt', 'sr'];
    const kpaNames: Record<number, string> = { 0: 'Basic Service Delivery', 1: 'Local Economic Development', 2: 'Financial Viability', 3: 'Good Governance', 4: 'Institutional Development', 5: 'Spatial Rationale' };

    kpas.forEach((kpa, idx) => {
      const kpaRows = rows.filter(r => (r as any)[kpa] === 'Y' || (r as any)[kpa] === 'X');
      if(kpaRows.length === 0) return;
      
      md += `### ${kpaNames[idx]}\n\n`;
      md += `| Ref | Indicator (KPI) | Baseline | Annual Target | Target | Actual | Variance / Issue | Corrective Action |\n`;
      md += `|---|---|---|---|---|---|---|---|\n`;
      kpaRows.forEach(row => {
        const target = period === 'midTerm' ? (row.midTermTarget || `${row.q1 || '-'}/${row.q2 || '-'}`) : (row as any)[period] || '-';
        const actual = period === 'midTerm' ? (row.midTermActual || `${row.q1Actual || '-'}/${row.q2Actual || '-'}`) : (row as any)[`${period}Actual`] || '-';
        const variance = (row as any)[`${period}Variance`] || '-';
        const corrective = (row as any)[`${period}Corrective`] || '-';
        
        const clean = (s: any) => (s || '-').toString().replace(/(\r\n|\n|\r|\|)/gm, " ");
        md += `| ${clean(row.refNum)} | ${clean(row.kpi)} | ${clean(row.baseline)} | ${clean(row.annualTarget)} | ${clean(target)} | ${clean(actual)} | ${clean(variance)} | ${clean(corrective)} |\n`;
      });
      md += `\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `SDBIP_Report_${period.toUpperCase()}.md`;
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-fade-in overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex gap-1">
          {['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                period === p 
                  ? "bg-slate-900 text-white shadow-md" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {p === 'midTerm' ? 'Mid-Term Review' : p === 'annual' ? 'Annual Consolidated' : p.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={exportToWord} disabled={isExportingWord || isExportingPDF} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 cursor-pointer">
            {isExportingWord ? <span className="animate-pulse">Exporting...</span> : <><FileText className="w-3.5 h-3.5" /> Word</>}
          </button>
          <button onClick={exportToPDF} disabled={isExportingWord || isExportingPDF} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition border border-slate-200 shadow-sm disabled:opacity-50 cursor-pointer">
            {isExportingPDF ? <span className="animate-pulse">Exporting...</span> : <><DownloadIcon className="w-3.5 h-3.5" /> PDF</>}
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm cursor-pointer">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={exportToMarkdown} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition shadow-sm cursor-pointer">
            <LayoutTemplate className="w-3.5 h-3.5" /> Markdown
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto hide-scrollbar flex justify-center bg-gray-200/50">
        <ReportDocument 
          rows={rows} 
          selectedQuarter={period as any} 
          currentUser={currentUser} 
          id="report-content" 
          coverImage={coverImage}
          overlayOpacity={overlayOpacity}
          coverFit={coverFit}
          coverScale={coverScale}
          coverBgColor={coverBgColor}
          coverPosition={coverPosition}
          coverTexts={coverTexts}
          onOpenCoverModal={onOpenCoverModal}
          onUpdateTextElement={onUpdateTextElement}
          onDeleteCoverText={onDeleteCoverText}
        />
      </div>
    </div>
  );
}

function EditableTable({ headers: initialHeaders, initialRows }: { headers: string[], initialRows: string[][] }) {
  const [headers, setHeaders] = useState(initialHeaders);
  const [rows, setRows] = useState(initialRows);

  const updateHeader = (colIdx: number, val: string) => {
    const updated = [...headers];
    updated[colIdx] = val;
    setHeaders(updated);
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const updated = [...rows];
    updated[rowIdx][colIdx] = val;
    setRows(updated);
  };

  const addRow = () => setRows([...rows, Array(headers.length).fill('')]);
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-slate-50 font-black text-slate-900 uppercase">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border border-slate-200 p-0 text-left">
                  <input value={h} onChange={(e) => updateHeader(i, e.target.value)} className="w-full p-3 bg-transparent outline-none focus:bg-indigo-50/50" />
                </th>
              ))}
              <th className="border border-slate-200 p-3 w-12 bg-slate-100"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="border border-slate-200 p-0">
                    <input value={cell} onChange={(e) => updateCell(rIdx, cIdx, e.target.value)} className="w-full p-3 bg-transparent outline-none focus:bg-indigo-50/50" />
                  </td>
                ))}
                <td className="border border-slate-200 p-1 text-center bg-slate-50/50">
                  <button onClick={() => removeRow(rIdx)} className="text-slate-300 hover:text-rose-500 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
        <Plus className="w-3 h-3" /> Add Row
      </button>
    </div>
  );
}

function CoverPictureModal({
  coverImage,
  overlayOpacity,
  coverFit = 'contain',
  coverScale = 100,
  coverBgColor = '#0f172a',
  coverPosition = 'center',
  coverTexts = DEFAULT_COVER_TEXTS,
  onUpdateCoverImage,
  onUpdateOverlayOpacity,
  onUpdateCoverFit,
  onUpdateCoverScale,
  onUpdateCoverBgColor,
  onUpdateCoverPosition,
  onUpdateCoverTexts,
  onUpdateTextElement,
  onDeleteCoverText,
  onAddCoverText,
  onResetCoverTexts,
  onClose
}: {
  coverImage: string;
  overlayOpacity: number;
  coverFit?: 'contain' | 'cover' | 'stretch' | 'scale';
  coverScale?: number;
  coverBgColor?: string;
  coverPosition?: 'center' | 'top' | 'bottom';
  coverTexts?: CoverTextElement[];
  onUpdateCoverImage: (url: string) => void;
  onUpdateOverlayOpacity: (opacity: number) => void;
  onUpdateCoverFit: (fit: 'contain' | 'cover' | 'stretch' | 'scale') => void;
  onUpdateCoverScale: (scale: number) => void;
  onUpdateCoverBgColor: (color: string) => void;
  onUpdateCoverPosition: (pos: 'center' | 'top' | 'bottom') => void;
  onUpdateCoverTexts: (texts: CoverTextElement[]) => void;
  onUpdateTextElement: (id: string, updates: Partial<CoverTextElement>) => void;
  onDeleteCoverText: (id: string) => void;
  onAddCoverText: () => void;
  onResetCoverTexts: () => void;
  onClose: () => void;
}) {
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'preset' | 'upload' | 'url'>('text');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please choose a smaller image.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateCoverImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      onUpdateCoverImage(customUrl.trim());
      setCustomUrl('');
    }
  };

  const getPreviewBgSize = () => {
    if (coverFit === 'contain') return 'contain';
    if (coverFit === 'stretch') return '100% 100%';
    if (coverFit === 'scale') return `${coverScale}% auto`;
    return 'cover';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">SDBIP Report Cover Customizer</h3>
              <p className="text-xs text-slate-400">Control picture size, fit modes, zoom scale, background colors & cover text elements.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Live Preview Card */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Live Cover Preview
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Hover text lines to delete</span>
            </div>
            <div 
              className="relative w-full h-44 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-center items-center text-center p-6 text-white border border-slate-200 transition-all"
              style={{
                backgroundColor: coverBgColor || '#0f172a',
                backgroundImage: coverImage.startsWith('linear-gradient') ? coverImage : `url('${coverImage}')`,
                backgroundSize: getPreviewBgSize(),
                backgroundPosition: coverPosition || 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div 
                className="absolute inset-0 bg-slate-900 mix-blend-multiply transition-opacity" 
                style={{ opacity: overlayOpacity }}
              />
              <div className="relative z-10 w-full flex flex-col items-center space-y-1.5">
                {coverTexts && coverTexts.length > 0 ? (
                  coverTexts.map((el) => (
                    <div key={el.id} className="relative group/previtem w-full flex justify-center items-center">
                      <p 
                        className={`px-4 text-center ${getCoverTextClasses(el)}`}
                        style={getCoverElementStyle(el)}
                      >
                        {el.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => onDeleteCoverText(el.id)}
                        className="absolute right-2 opacity-0 group-hover/previtem:opacity-100 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md text-[10px] font-bold transition shadow-sm cursor-pointer flex items-center gap-1 z-30"
                        title="Delete from cover"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : null}
                {coverTexts && coverTexts.length > 0 && (
                  <div className="w-16 h-1 bg-indigo-500 rounded-full mt-2"></div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Cover Picture Sizing & Fit Control Box */}
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-3.5 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-indigo-600" /> Picture Size & Frame Fit Mode
              </span>
              <span className="text-[10px] font-extrabold bg-indigo-200 text-indigo-900 px-2.5 py-0.5 rounded-full uppercase">
                {coverFit === 'contain' ? 'Fit Entire Graphic' : coverFit === 'cover' ? 'Fill Full Box' : coverFit === 'stretch' ? 'Stretch 100%' : `${coverScale}% Custom Zoom`}
              </span>
            </div>

            {/* Fit Mode Button Group */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onUpdateCoverFit('contain')}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border text-center cursor-pointer ${
                  coverFit === 'contain'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Fits 100% of image inside A4 without cropping any text or graphics"
              >
                Fit Entire Image (No Cutoff)
              </button>
              <button
                type="button"
                onClick={() => onUpdateCoverFit('cover')}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border text-center cursor-pointer ${
                  coverFit === 'cover'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Fills the entire cover box edge to edge"
              >
                Fill Page Edge-to-Edge
              </button>
              <button
                type="button"
                onClick={() => onUpdateCoverFit('stretch')}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border text-center cursor-pointer ${
                  coverFit === 'stretch'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Stretches graphic 100% width x 100% height"
              >
                Stretch Exact (100% x 100%)
              </button>
              <button
                type="button"
                onClick={() => onUpdateCoverFit('scale')}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border text-center cursor-pointer ${
                  coverFit === 'scale'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Manually adjust image zoom percentage slider"
              >
                Custom % Scale Zoom
              </button>
            </div>

            {/* Sub-controls: Zoom Slider & Background Frame Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Scale Zoom Slider */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>Image Zoom Scale</span>
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                    {coverScale}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="200" 
                  step="5"
                  value={coverScale}
                  onChange={(e) => {
                    onUpdateCoverScale(parseInt(e.target.value));
                    if (coverFit !== 'scale') onUpdateCoverFit('scale');
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Background Frame Color (for letterbox when containing) */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>Letterbox Padding Color</span>
                  <div className="flex items-center gap-1">
                    {['#0f172a', '#000000', '#ffffff', '#064e3b', '#1e1b4b'].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => onUpdateCoverBgColor(hex)}
                        className={`w-4 h-4 rounded-full border border-slate-300 cursor-pointer transition-transform ${
                          coverBgColor === hex ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={coverBgColor}
                      onChange={(e) => onUpdateCoverBgColor(e.target.value)}
                      className="w-5 h-5 rounded p-0 border border-slate-300 cursor-pointer ml-1"
                      title="Custom Hex color"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dark Overlay Opacity Slider */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" /> Tint Overlay Darkness
              </span>
              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-mono text-[11px]">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="0.95" 
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => onUpdateOverlayOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Selection Mode Tabs */}
          <div className="flex border-b border-slate-200 space-x-4 pt-1">
            <button
              onClick={() => setActiveTab('text')}
              className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'text'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Text Elements ({coverTexts.length})
            </button>
            <button
              onClick={() => setActiveTab('preset')}
              className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preset'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Background Presets
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Upload Image
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> URL / Gradient
            </button>
          </div>

          {/* Tab Content: Text Editor Tool */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Cover Page Text Elements</span>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {coverTexts.length} Lines
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateCoverTexts([])}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer border border-rose-200"
                    title="Remove all text lines to display background image 100% cleanly"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All Text
                  </button>
                  <button
                    type="button"
                    onClick={onResetCoverTexts}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={onAddCoverText}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Text Line
                  </button>
                </div>
              </div>

              {coverTexts.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/50">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-emerald-900">Clean Cover Mode Active</p>
                  <p className="text-[11px] text-emerald-700 mt-1 mb-4 max-w-md mx-auto">
                    All cover text lines have been deleted. Your cover background image will render 100% cleanly without any text boxes, overlays, or blue divider lines.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={onAddCoverText}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:bg-indigo-700 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Custom Text Line
                    </button>
                    <button
                      type="button"
                      onClick={onResetCoverTexts}
                      className="px-3.5 py-1.5 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:bg-slate-50 transition"
                    >
                      Restore Default Titles
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {coverTexts.map((el, index) => (
                    <div 
                      key={el.id} 
                      className="p-4 bg-slate-50 hover:bg-indigo-50/20 rounded-2xl border border-slate-200 transition-all space-y-3 group shadow-xs"
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </span>
                          {el.label || `Text Line ${index + 1}`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Uppercase toggle */}
                          <button
                            type="button"
                            onClick={() => onUpdateTextElement(el.id, { uppercase: !el.uppercase })}
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition cursor-pointer border ${
                              el.uppercase 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Toggle uppercase styling"
                          >
                            UPPERCASE
                          </button>

                          {/* Font Weight selector */}
                          <select
                            value={el.fontWeight || 'bold'}
                            onChange={(e) => onUpdateTextElement(el.id, { fontWeight: e.target.value as any })}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold outline-none cursor-pointer"
                            title="Font Weight"
                          >
                            <option value="normal">Normal (400)</option>
                            <option value="semibold">Semibold (600)</option>
                            <option value="bold">Bold (700)</option>
                            <option value="black">Black (900)</option>
                          </select>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => onDeleteCoverText(el.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer ml-1"
                            title="Delete text element"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Main Text Content Input */}
                      <div>
                        <input 
                          type="text" 
                          value={el.text}
                          onChange={(e) => onUpdateTextElement(el.id, { text: e.target.value })}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                          placeholder="Enter title string... (use {QUARTER} for dynamic period)"
                        />
                      </div>

                      {/* Advanced Formatting Controls: Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
                        {/* Font Size & Custom PX */}
                        <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Font Size
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select 
                              value={el.fontSize || 'base'}
                              onChange={(e) => onUpdateTextElement(el.id, { fontSize: e.target.value as any })}
                              className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="xs">Extra Small (12px)</option>
                              <option value="sm">Small (14px)</option>
                              <option value="base">Medium (16px)</option>
                              <option value="lg">Large (18px)</option>
                              <option value="xl">X-Large (20px)</option>
                              <option value="2xl">2X Large (24px)</option>
                              <option value="3xl">3X Large (30px)</option>
                              <option value="4xl">4X Large (36px)</option>
                              <option value="5xl">5X Large (48px)</option>
                              <option value="6xl">6X Large (60px)</option>
                            </select>
                            <div className="flex items-center gap-1 shrink-0" title="Custom size in pixels">
                              <input
                                type="number"
                                min="8"
                                max="120"
                                placeholder="px"
                                value={el.customFontSizePx || ''}
                                onChange={(e) => onUpdateTextElement(el.id, { customFontSizePx: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-12 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 text-center outline-none"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">px</span>
                            </div>
                          </div>
                        </div>

                        {/* Color Picker & Custom Hex */}
                        <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Text Color
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select 
                              value={el.customColor ? 'custom' : (el.color || 'white')}
                              onChange={(e) => {
                                if (e.target.value === 'custom') {
                                  onUpdateTextElement(el.id, { customColor: '#ffffff' });
                                } else {
                                  onUpdateTextElement(el.id, { color: e.target.value, customColor: undefined });
                                }
                              }}
                              className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="white">Pure White (#FFF)</option>
                              <option value="amber-300">Amber Gold (#FCD34D)</option>
                              <option value="indigo-300">Indigo Accent (#A5B4FC)</option>
                              <option value="emerald-300">Emerald Green (#6EE7B7)</option>
                              <option value="sky-300">Sky Blue (#7DD3FC)</option>
                              <option value="rose-300">Rose Pink (#F472B6)</option>
                              <option value="purple-300">Purple Accent (#D8B4FE)</option>
                              <option value="slate-300">Muted Slate (#CBD5E1)</option>
                              <option value="black">Jet Black (#0F172A)</option>
                              <option value="custom">Custom Hex Code...</option>
                            </select>
                            
                            {/* Color Swatch / Hex Input */}
                            <div className="flex items-center gap-1 shrink-0">
                              <input 
                                type="color" 
                                value={el.customColor || (el.color === 'amber-300' ? '#fcd34d' : el.color === 'indigo-300' ? '#a5b4fc' : el.color === 'emerald-300' ? '#6ee7b7' : el.color === 'black' ? '#0f172a' : '#ffffff')}
                                onChange={(e) => onUpdateTextElement(el.id, { customColor: e.target.value })}
                                className="w-7 h-7 rounded-lg border border-slate-300 p-0.5 cursor-pointer"
                                title="Pick exact custom color"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Background Container Pill */}
                        <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Background Box Pill
                          </label>
                          <select 
                            value={el.bgColor || 'none'}
                            onChange={(e) => onUpdateTextElement(el.id, { bgColor: e.target.value as any })}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                          >
                            <option value="none">None (Transparent)</option>
                            <option value="dark">Dark Glass Pill</option>
                            <option value="light">Light Glass Pill</option>
                            <option value="indigo">Indigo Dark Pill</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Presets */}
          {activeTab === 'preset' && (
            <div className="grid grid-cols-3 gap-3">
              {COVER_PRESETS.map((preset) => {
                const isSelected = coverImage === preset.url;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onUpdateCoverImage(preset.url)}
                    className={`relative rounded-xl overflow-hidden h-24 text-left border-2 transition-all p-2 flex flex-col justify-end text-white cursor-pointer group ${
                      isSelected 
                        ? 'border-indigo-600 ring-2 ring-indigo-600/30 scale-[1.02]' 
                        : 'border-transparent hover:border-slate-300'
                    }`}
                    style={{
                      backgroundImage: preset.url.startsWith('linear-gradient') ? preset.url : `url('${preset.url}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors" />
                    <span className="relative z-10 text-[11px] font-bold drop-shadow-sm">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 z-10 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content: Upload */}
          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50 hover:bg-indigo-50/30 transition-all cursor-pointer relative group">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 transition">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">Click to browse or drag and drop image</h4>
              <p className="text-xs text-slate-500 mb-4">Supports PNG, JPG, WEBP or SVG up to 5MB</p>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md group-hover:bg-indigo-700 transition">
                Choose Local Image
              </span>
            </div>
          )}

          {/* Tab Content: URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Image URL</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <button 
                    onClick={handleApplyUrl}
                    disabled={!customUrl.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 cursor-pointer"
                  >
                    Apply Image
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button 
            type="button"
            onClick={() => {
              onUpdateCoverImage(DEFAULT_COVER_IMAGE);
              onUpdateOverlayOpacity(0.8);
              onResetCoverTexts();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All Cover Settings
          </button>

          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
