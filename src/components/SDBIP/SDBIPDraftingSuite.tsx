import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileText, Search, Settings, Download, Upload, Cpu, LayoutTemplate, 
  Plus, Trash2, Check, ArrowRight, Info, AlertTriangle, User,
  BarChart as BarChartIcon, TrendingUp, PieChart, FileCheck, Printer, ChevronRight, Download as DownloadIcon,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import type { SdbipRow } from './SDBIP';
import { WordProcessor } from './WordProcessor';

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
        <div className="flex gap-2">
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
        {activeTab === 'template' && <SDBIPTemplateTab rows={rows} selectedQuarter={selectedQuarter} setSelectedQuarter={setSelectedQuarter} currentUser={currentUser} onAdopt={handleAdoptTemplate} />}
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
        {activeTab === 'reports' && <SDBIPReportsTab rows={rows} currentUser={currentUser} activeTenantId={activeTenantId} period={reportPeriod} setPeriod={setReportPeriod} />}
      </div>
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
      face: '😐',
      label: 'No Data',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
      textClass: 'text-slate-500',
      tooltip: 'No target/actual data entered.'
    };
  }

  if (totalTarget === 0) {
    if (totalActual >= 0) {
      return {
        status: 'green' as const,
        face: '😊',
        label: 'Happy',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        textClass: 'text-emerald-700',
        tooltip: 'No target set, performance is positive.'
      };
    } else {
      return {
        status: 'red' as const,
        face: '😡',
        label: 'Angry',
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
      face: '😊',
      label: 'Happy',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      textClass: 'text-emerald-700',
      tooltip: `Exceeds or meets target! Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
    };
  } else if (achievementRate >= 0.70) {
    return {
      status: 'amber' as const,
      face: '☹️',
      label: 'Sad',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      textClass: 'text-amber-700',
      tooltip: `Under target with minor variance. Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
    };
  } else {
    return {
      status: 'red' as const,
      face: '😡',
      label: 'Angry',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
      textClass: 'text-rose-700',
      tooltip: `Significant underperformance. Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
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

function ReportDocument({ rows, selectedQuarter, currentUser, id = "template-content" }: { rows: SdbipRow[], selectedQuarter: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual', currentUser: any, id?: string }) {
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
      
      {/* Front Cover */}
      <section className="relative w-[297mm] h-[210mm] flex flex-col justify-center items-center text-center p-12 text-white page-break-after" style={{ backgroundColor: "#1e293b", backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
         <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply" />
         <div className="relative z-10 w-full flex flex-col items-center">
            <h1 
              className="text-2xl font-black uppercase tracking-widest mb-6 outline-none border-b-2 border-transparent focus:border-white text-center w-3/4 mx-auto"
              contentEditable 
              suppressContentEditableWarning
            >
              SDBIP {quarterLabels[selectedQuarter]} REPORT
            </h1>
            <h2 
              className="text-lg font-bold uppercase tracking-widest outline-none border-b-2 border-transparent focus:border-white text-center w-2/3 mx-auto text-indigo-300"
              contentEditable 
              suppressContentEditableWarning
            >
              2025/2026 FINANCIAL YEAR
            </h2>
            <div className="mt-16 w-1/4 h-1 bg-indigo-500 rounded-full"></div>
            <p className="mt-8 text-xs font-medium tracking-widest text-slate-400 uppercase">MZANSI FLOW AUTOMATED PMS SYSTEM</p>
         </div>
      </section>

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
              
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse text-[8px] border border-slate-300 shadow-sm text-black">
                  <thead className="bg-slate-900 text-white uppercase text-left break-inside-avoid">
                    {selectedQuarter === 'annual' ? (
                      <tr>
                        <th className="border border-slate-700 p-2 font-black w-10 text-white bg-slate-900">KPA</th>
                        <th className="border border-slate-700 p-2 font-black w-10 text-white bg-slate-900">Ref</th>
                        <th className="border border-slate-700 p-2 font-black w-32 text-white bg-slate-900">Indicators (KPI)</th>
                        <th className="border border-slate-700 p-2 font-black w-12 text-white bg-slate-900">Total Budget</th>
                        <th className="border border-slate-700 p-2 font-black text-center w-8 text-white bg-slate-900">RAG</th>
                        <th className="border border-slate-700 p-2 font-black bg-indigo-950 text-indigo-100 w-24">Q1,q2,q3,q4 Targets</th>
                        <th className="border border-slate-700 p-2 font-black bg-emerald-950 text-emerald-100 w-24">q1,q2,q3,q4 Actuals</th>
                        <th className="border border-slate-700 p-2 font-black bg-teal-950 text-teal-100 w-24">q1, q2, q3, q4 expenditures</th>
                        <th className="border border-slate-700 p-2 font-black bg-amber-950 text-amber-100 w-28">q1, q2, q3, q4 poes</th>
                        <th className="border border-slate-700 p-2 font-black w-16 text-white bg-slate-900">variance/issue</th>
                        <th className="border border-slate-700 p-2 font-black w-16 text-white bg-slate-900">corrective action</th>
                      </tr>
                    ) : selectedQuarter === 'midTerm' ? (
                      <tr>
                        <th className="border border-slate-700 p-2 font-black w-10 text-white bg-slate-900">KPA</th>
                        <th className="border border-slate-700 p-2 font-black w-10 text-white bg-slate-900">Ref</th>
                        <th className="border border-slate-700 p-2 font-black w-32 text-white bg-slate-900">Indicator (KPI)</th>
                        <th className="border border-slate-700 p-2 font-black w-12 text-white bg-slate-900">Total Budget</th>
                        <th className="border border-slate-700 p-2 font-black text-center w-8 text-white bg-slate-900">RAG</th>
                        <th className="border border-slate-700 p-2 font-black bg-indigo-950 text-indigo-100 w-20">Q1 + Q2 Targets</th>
                        <th className="border border-slate-700 p-2 font-black bg-emerald-950 text-emerald-100 w-20">Q1 + Q2 Actuals</th>
                        <th className="border border-slate-700 p-2 font-black bg-teal-950 text-teal-100 w-20">Q1 + Q2 expenditures</th>
                        <th className="border border-slate-700 p-2 font-black bg-amber-950 text-amber-100 w-24">q1 + q2 poes</th>
                        <th className="border border-slate-700 p-2 font-black w-16 text-white bg-slate-900">variance/issue</th>
                        <th className="border border-slate-700 p-2 font-black w-16 text-white bg-slate-900">corrective action</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="border border-slate-700 p-2 font-black w-10 text-white bg-slate-900">KPA</th>
                        <th className="border border-slate-700 p-2 font-black w-10 text-white bg-slate-900">Ref</th>
                        <th className="border border-slate-700 p-2 font-black w-36 text-white bg-slate-900">Indicator (KPI)</th>
                        <th className="border border-slate-700 p-2 font-black w-14 text-white bg-slate-900">total budget</th>
                        <th className="border border-slate-700 p-2 font-black text-center w-8 text-white bg-slate-900">RAG</th>
                        <th className="border border-slate-700 p-2 font-black bg-indigo-900 text-white w-24">{selectedQuarter.toUpperCase()} Target</th>
                        <th className="border border-slate-700 p-2 font-black bg-emerald-900 text-white w-24">{selectedQuarter.toUpperCase()} Actual</th>
                        <th className="border border-slate-700 p-2 font-black bg-teal-800 text-white w-24">{selectedQuarter.toLowerCase()} expenditure</th>
                        <th className="border border-slate-700 p-2 font-black bg-amber-800 text-white w-28">{selectedQuarter.toLowerCase()} poe</th>
                        <th className="border border-slate-700 p-2 font-black w-20 text-white bg-slate-900">variance/issue</th>
                        <th className="border border-slate-700 p-2 font-black w-20 text-white bg-slate-900">corrective action</th>
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
                            <td className="border border-slate-300 p-1.5 font-black text-center text-[7px] text-slate-600 bg-slate-100/50">{kpaLabel}</td>
                            <td className="border border-slate-300 p-1.5 font-bold font-mono text-center">{row.refNum}</td>
                            <td className="border border-slate-300 p-1.5 font-bold leading-tight">{row.kpi}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-slate-700">{row.budgetAllocation || 'Opex'}</td>
                            <td className="border border-slate-300 p-1.5 text-center">
                              <span className="text-xs" title={rag.tooltip}>{rag.face}</span>
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-indigo-800 text-xs text-center">
                              {sumStringValues([row.q1, row.q2, row.q3, row.q4])}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-emerald-800 text-xs text-center">
                              {sumStringValues([row.q1Actual, row.q2Actual, row.q3Actual, row.q4Actual])}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-medium text-slate-700 text-xs text-center">
                              {sumStringValues([row.q1Expenditure, row.q2Expenditure, row.q3Expenditure, row.q4Expenditure])}
                            </td>
                            <td className="border border-slate-300 p-1">
                              <div className="flex flex-col gap-0.5 text-[6px] leading-tight text-slate-600">
                                {[1, 2, 3, 4].map(q => {
                                  const poeDesc = (row as any)[`q${q}PoeDesc`] || '';
                                  const poes = (row as any)[`q${q}Poes`] || [];
                                  if (!poeDesc && poes.length === 0) return null;
                                  return (
                                    <div key={q} className="border-b border-slate-100 last:border-0 pb-0.5 mb-0.5 last:pb-0 last:mb-0">
                                      <span className="font-bold text-slate-500 mr-0.5">Q{q}:</span>
                                      <span className="truncate" title={poeDesc}>{poeDesc || 'Submitted'}</span>
                                      {poes.length > 0 && <span className="text-emerald-800 ml-1">📄</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="border border-slate-300 p-1.5 italic text-rose-900 font-bold leading-tight">{variance}</td>
                            <td className="border border-slate-300 p-1.5 font-medium leading-tight">{corrective}</td>
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
                            <td className="border border-slate-300 p-1.5 font-black text-center text-[7px] text-slate-600 bg-slate-100/50">{kpaLabel}</td>
                            <td className="border border-slate-300 p-1.5 font-bold font-mono text-center">{row.refNum}</td>
                            <td className="border border-slate-300 p-1.5 font-bold leading-tight">{row.kpi}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-slate-700">{row.budgetAllocation || 'Opex'}</td>
                            <td className="border border-slate-300 p-1.5 text-center">
                              <span className="text-xs" title={rag.tooltip}>{rag.face}</span>
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-indigo-800 text-xs text-center">
                              {sumStringValues([row.q1, row.q2])}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-emerald-800 text-xs text-center">
                              {sumStringValues([row.q1Actual, row.q2Actual])}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-medium text-slate-700 text-xs text-center">
                              {sumStringValues([row.q1Expenditure, row.q2Expenditure])}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-left">
                              <div className="flex flex-col gap-0.5 text-[6px] leading-tight text-slate-600">
                                {[1, 2].map(q => {
                                  const poeDesc = (row as any)[`q${q}PoeDesc`] || '';
                                  const poes = (row as any)[`q${q}Poes`] || [];
                                  if (!poeDesc && poes.length === 0) return null;
                                  return (
                                    <div key={q} className="border-b border-slate-100 last:border-0 pb-0.5 mb-0.5 last:pb-0 last:mb-0">
                                      <span className="font-bold text-slate-500 mr-0.5">Q{q}:</span>
                                      <span className="truncate" title={poeDesc}>{poeDesc || 'Submitted'}</span>
                                      {poes.length > 0 && <span className="text-emerald-800 ml-1">📄</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="border border-slate-300 p-1.5 italic text-rose-900 font-bold leading-tight">{variance}</td>
                            <td className="border border-slate-300 p-1.5 font-medium leading-tight">{corrective}</td>
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
                            <td className="border border-slate-300 p-1.5 font-black text-center text-[7px] text-slate-600 bg-slate-100/50">{kpaLabel}</td>
                            <td className="border border-slate-300 p-1.5 font-bold font-mono text-center">{row.refNum}</td>
                            <td className="border border-slate-300 p-1.5 font-bold leading-tight">{row.kpi}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-slate-700">{row.budgetAllocation || 'Opex'}</td>
                            <td className="border border-slate-300 p-1.5 text-center">
                              <span className="text-xs" title={rag.tooltip}>{rag.face}</span>
                            </td>
                            <td className="border border-slate-300 p-1.5 font-bold text-indigo-700">{target}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-emerald-700">{actual}</td>
                            <td className="border border-slate-300 p-1.5 font-medium">{exp}</td>
                            <td className="border border-slate-300 p-1.5">
                              {poeDesc && <div className="text-[8px] text-slate-600 leading-tight mb-1">{poeDesc}</div>}
                              {poes && poes.length > 0 && (
                                <div className="text-[7px] text-emerald-850 bg-emerald-50 px-1 py-0.5 rounded truncate" title={poes.join(', ')}>
                                  📄 {poes[poes.length - 1]}
                                </div>
                              )}
                            </td>
                            <td className="border border-slate-300 p-1.5 italic text-rose-900 font-bold leading-tight">{variance}</td>
                            <td className="border border-slate-300 p-1.5 font-medium leading-tight">{corrective}</td>
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
      <section className="relative w-[297mm] h-[210mm] flex flex-col justify-center items-center text-center p-12 text-white" style={{ backgroundColor: "#1e293b", backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
         <div className="absolute inset-0 bg-slate-900/90 mix-blend-multiply" />
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

function SDBIPTemplateTab({ rows, selectedQuarter, setSelectedQuarter, currentUser, onAdopt }: { rows: SdbipRow[], selectedQuarter: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual', setSelectedQuarter: (q: any) => void, currentUser: any, onAdopt: (html: string) => void }) {
  return (
    <div className="h-full flex overflow-hidden bg-gray-50 animate-fade-in">
      <div className="w-80 border-r border-gray-200 bg-white p-6 overflow-y-auto">
        <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Report Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Reporting Period</label>
            <select 
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
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
          
          <div className="pt-6 border-t border-gray-100 text-center">
            <button 
              onClick={() => {
                const el = document.getElementById('template-content');
                if (el) onAdopt(el.innerHTML);
              }}
              className="w-full py-3 bg-indigo-600 text-white text-[11px] font-black rounded-xl uppercase tracking-widest mt-4 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" /> Adopt Template
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto hide-scrollbar flex justify-center bg-gray-200/50">
        <ReportDocument rows={rows} selectedQuarter={selectedQuarter} currentUser={currentUser} id="template-content" />
      </div>
    </div>
  );
}

function SDBIPReportsTab({ rows, currentUser, activeTenantId, period, setPeriod }: { rows: SdbipRow[], currentUser: any, activeTenantId: string, period: string, setPeriod: (p: any) => void }) {
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
      
      // We need to hide the container's overflow temporarily so html-to-image can capture it completely
      const originalOverflow = content.style.overflow;
      content.style.overflow = 'visible';

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        const imgData = await toPng(section, { 
            quality: 1.0, 
            pixelRatio: 2,
            backgroundColor: '#ffffff' 
        });
        
        if (i > 0) pdf.addPage();
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (section.offsetHeight * pdfWidth) / section.offsetWidth;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      content.style.overflow = originalOverflow;
      pdf.save(`SDBIP_Report_${period.toUpperCase()}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF", error);
    }
    setIsExportingPDF(false);
  };

  const exportToWord = async () => {
    setIsExportingWord(true);
    try {
      const { toPng } = await import('html-to-image');
      
      const content = document.getElementById('report-content');
      if (!content) return;

      let htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <style>
    @page Section1 {
      size: 841.9pt 595.3pt;
      mso-page-orientation: landscape;
      margin: 36.0pt 36.0pt 36.0pt 36.0pt;
    }
    div.Section1 { page: Section1; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
  </style>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
</head>
<body style="tab-interval:36pt">
  <div class="Section1">`;

      const sections = Array.from(content.querySelectorAll('section'));
      const originalOverflow = content.style.overflow;
      content.style.overflow = 'visible';

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        const imgData = await toPng(section, { 
            quality: 1.0, 
            pixelRatio: 1.2, // Lowered to ensure sharpness but fit within margins
            backgroundColor: '#ffffff'
        });
        htmlContent += `
          <div style="text-align:center; padding-bottom: 20px;">
            <img src="${imgData}" width="700" style="width:700px; max-width: 100%;">
          </div>
          <br clear="all" style="page-break-before:always;" />`;
      }
      
      content.style.overflow = originalOverflow;
      htmlContent += "</div></body></html>";
      
      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(htmlContent);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = `SDBIP_Report_${period.toUpperCase()}.doc`;
      fileDownload.click();
      document.body.removeChild(fileDownload);
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
          <button onClick={exportToWord} disabled={isExportingWord || isExportingPDF} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50">
            {isExportingWord ? <span className="animate-pulse">Exporting...</span> : <><FileText className="w-3.5 h-3.5" /> Word</>}
          </button>
          <button onClick={exportToPDF} disabled={isExportingWord || isExportingPDF} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition border border-slate-200 shadow-sm disabled:opacity-50">
            {isExportingPDF ? <span className="animate-pulse">Exporting...</span> : <><DownloadIcon className="w-3.5 h-3.5" /> PDF</>}
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={exportToMarkdown} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition shadow-sm">
            <LayoutTemplate className="w-3.5 h-3.5" /> Markdown
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto hide-scrollbar flex justify-center bg-gray-200/50">
        <ReportDocument rows={rows} selectedQuarter={period as any} currentUser={currentUser} id="report-content" />
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
