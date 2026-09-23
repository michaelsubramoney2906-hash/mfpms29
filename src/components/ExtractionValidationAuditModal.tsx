import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  FileText,
  Layers,
  Sparkles,
  Search,
  Download,
  RefreshCw,
  X,
  ExternalLink,
  Zap,
  Scale,
  Hash,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { ExtractedMappedKPI, ExtractedKpaDefinition } from '../utils/performanceAgreementParser';

export interface KpiValidationDetail {
  kpiNo: string;
  kpiDescription: string;
  functionalKpa: string;
  weight: string;
  baseline: string;
  annualTarget: string;
  q1Target: string;
  q2Target: string;
  q3Target: string;
  q4Target: string;
  poe: string;
  budget: string;
  groundingStatus: 'VERIFIED_100_PERCENT' | 'EXACT_MATCH' | 'PARTIAL_MATCH' | 'POTENTIAL_HALLUCINATION' | 'UNMATCHED_DEVIATION';
  similarityScore: number;
  matchedSnippet?: string;
  matchedLocation?: string;
  kpaAlignmentStatus: 'VERIFIED_CORRECT' | 'MISALIGNED_KPA' | 'UNASSIGNED_KPA';
  weightIntegrity: 'VALID' | 'MISSING_WEIGHT' | 'ZERO_WEIGHT' | 'DISCREPANCY';
  targetsConsistency: 'CONSISTENT' | 'QUARTERLY_MISMATCH' | 'MISSING_TARGET';
  deviations: {
    field: string;
    extractedValue: string;
    documentValue?: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }[];
  flags: string[];
}

export interface KpaValidationSummary {
  kpaNumber: string;
  kpaName: string;
  fullTitle: string;
  frameworkWeight: number;
  calculatedWeight: number;
  weightVariance: number;
  kpiCount: number;
  groundedKpiCount: number;
  isBalanced: boolean;
  status: 'PERFECT_MATCH' | 'WEIGHT_VARIANCE' | 'UNGROUNDED_KPAS' | 'EMPTY';
}

export interface ExtractionValidationReport {
  timestamp: string;
  fileName: string;
  overallIntegrityScore: number;
  verdict: 'PASSED_100_PERCENT_INTEGRITY' | 'MINOR_DEVIATIONS_FLAGGED' | 'CRITICAL_HALLUCINATION_ALERT';
  summary: {
    totalKpis: number;
    perfectlyGroundedKpis: number;
    partiallyGroundedKpis: number;
    potentialHallucinations: number;
    totalKpas: number;
    totalExtractedWeight: number;
    expectedWeight: number;
    weightVariance: number;
    isWeightBalanced: boolean;
    omissionsDetected: number;
    deviationsCount: number;
  };
  kpaValidation: KpaValidationSummary[];
  kpiDetails: KpiValidationDetail[];
  hallucinatedItems: KpiValidationDetail[];
  omittedItems: { kpiNo?: string; snippet: string; note: string }[];
  mathematicalAudit: {
    totalWeight: number;
    frameworkTotal: number;
    is100Percent: boolean;
    kpaBreakdowns: { kpaName: string; frameworkWeight: number; actualWeight: number; balanced: boolean }[];
  };
  aiAuditNotes?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: ExtractionValidationReport | null;
  isValidating: boolean;
  onReValidate: () => void;
  rawDocumentText?: string;
  onAutoFixItem?: (kpiNo: string, newDescription: string) => void;
  onRemoveItem?: (kpiNo: string) => void;
}

export const ExtractionValidationAuditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  report,
  isValidating,
  onReValidate,
  rawDocumentText,
  onAutoFixItem,
  onRemoveItem
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kpis' | 'kpas' | 'document' | 'raw_report'>('kpis');
  const [filterMode, setFilterMode] = useState<'all' | 'verified' | 'deviations' | 'hallucinations'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKpiNo, setExpandedKpiNo] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState('');

  if (!isOpen) return null;

  const summary = report?.summary;
  const is100Percent = report?.overallIntegrityScore === 100 && report?.summary.potentialHallucinations === 0;

  // Filter KPI details
  const filteredKpis = (report?.kpiDetails || []).filter(it => {
    if (filterMode === 'verified') {
      if (it.groundingStatus !== 'VERIFIED_100_PERCENT' && it.groundingStatus !== 'EXACT_MATCH') return false;
    } else if (filterMode === 'deviations') {
      if (it.deviations.length === 0 && it.groundingStatus === 'VERIFIED_100_PERCENT') return false;
    } else if (filterMode === 'hallucinations') {
      if (it.groundingStatus !== 'POTENTIAL_HALLUCINATION') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = it.kpiNo.toLowerCase().includes(q);
      const matchDesc = it.kpiDescription.toLowerCase().includes(q);
      const matchKpa = it.functionalKpa.toLowerCase().includes(q);
      return matchNo || matchDesc || matchKpa;
    }
    return true;
  });

  const handleDownloadCertificate = () => {
    if (!report) return;
    const certData = {
      title: "MUNICIPAL PERFORMANCE MANAGEMENT DATA INTEGRITY CERTIFICATE",
      standards: "Regulation 805 & South African Municipal Planning and Performance Management Framework",
      issuedAt: report.timestamp,
      documentName: report.fileName,
      integrityScore: `${report.overallIntegrityScore}%`,
      complianceVerdict: report.verdict,
      zeroHallucinationAssurance: report.summary.potentialHallucinations === 0 ? "PASSED (Zero Hallucinations)" : "ACTION REQUIRED",
      kpisVerified: `${report.summary.perfectlyGroundedKpis + report.summary.partiallyGroundedKpis} / ${report.summary.totalKpis}`,
      weightBalance: `${report.summary.totalExtractedWeight}% (Expected 100.0%)`,
      auditTrail: report
    };

    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Integrity_Audit_Certificate_${report.fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner ${
              is100Percent 
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' 
                : 'bg-amber-600/20 border-amber-500/40 text-amber-400'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">Automated Extraction &amp; Integrity Validation Service</h2>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  is100Percent
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {is100Percent ? '100% Verbatim Verified' : 'Integrity Audit Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifies extracted KPAs &amp; KPIs against original uploaded performance agreement with zero tolerance for deviations or hallucinations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReValidate}
              disabled={isValidating}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
              <span>{isValidating ? 'Auditing...' : 'Re-Run Audit'}</span>
            </button>
            <button
              onClick={handleDownloadCertificate}
              disabled={!report}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOP SCORE OVERVIEW BANNER */}
        {report && (
          <div className="p-6 bg-slate-950/60 border-b border-slate-800 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Overall Integrity Score Card */}
              <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                is100Percent
                  ? 'bg-emerald-950/40 border-emerald-500/40'
                  : report.overallIntegrityScore >= 80
                  ? 'bg-indigo-950/40 border-indigo-500/40'
                  : 'bg-amber-950/40 border-amber-500/40'
              }`}>
                <div className="relative flex items-center justify-center shrink-0">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl border-4 ${
                    is100Percent
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/80'
                      : report.overallIntegrityScore >= 80
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-950/80'
                      : 'border-amber-500 text-amber-400 bg-amber-950/80'
                  }`}>
                    {report.overallIntegrityScore}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Integrity Score</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {is100Percent ? '100% Data Integrity' : `${report.overallIntegrityScore}% Verified`}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{report.summary.potentialHallucinations === 0 ? 'Zero Hallucinations' : `${report.summary.potentialHallucinations} Flags`}</span>
                  </div>
                </div>
              </div>

              {/* KPI Grounding Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verbatim Grounding</span>
                  <FileCheck2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-black text-white">
                    {summary?.perfectlyGroundedKpis || 0} <span className="text-xs text-slate-500">/ {summary?.totalKpis || 0}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {summary?.perfectlyGroundedKpis === summary?.totalKpis
                      ? '100% Verbatim word-for-word in doc'
                      : `${summary?.partiallyGroundedKpis || 0} partial, ${summary?.potentialHallucinations || 0} ungrounded`}
                  </div>
                </div>
              </div>

              {/* Functional KPA Hierarchy Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KPA Alignment</span>
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-black text-white">
                    {report.kpaValidation.length} <span className="text-xs text-slate-500">Active KPAs</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Strictly bound to Section 4.2 framework</span>
                  </div>
                </div>
              </div>

              {/* Mathematical Weight Balance Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Weight Balance</span>
                  <Scale className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2">
                  <div className={`text-2xl font-black ${summary?.isWeightBalanced ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {summary?.totalExtractedWeight || 0}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {summary?.isWeightBalanced 
                      ? 'Balanced precisely at 100.0%' 
                      : `Variance delta: ${summary?.weightVariance > 0 ? `+${summary?.weightVariance}` : summary?.weightVariance}%`}
                  </div>
                </div>
              </div>

            </div>

            {/* AI Auditor Commentary */}
            {report.aiAuditNotes && (
              <div className="mt-4 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-start gap-2.5 text-xs text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="text-white font-medium">Internal Audit Verification Note: </strong>
                  <span>{report.aiAuditNotes}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB CONTROLS */}
        <div className="bg-slate-950 px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('kpis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'kpis' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>KPI Verification ({report?.kpiDetails.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('kpas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'kpas' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>KPA Mathematical Balance ({report?.kpaValidation.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('document')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'document' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Source Document Inspector</span>
            </button>
          </div>

          {activeSubTab === 'kpis' && (
            <div className="flex items-center gap-2">
              {/* Filter Pills */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-bold">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${filterMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All ({report?.kpiDetails.length || 0})
                </button>
                <button
                  onClick={() => setFilterMode('verified')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${filterMode === 'verified' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}
                >
                  100% Verbatim ({report?.summary.perfectlyGroundedKpis || 0})
                </button>
                <button
                  onClick={() => setFilterMode('deviations')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${filterMode === 'deviations' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'}`}
                >
                  Deviations ({report?.summary.deviationsCount || 0})
                </button>
                {report?.summary.potentialHallucinations && report.summary.potentialHallucinations > 0 ? (
                  <button
                    onClick={() => setFilterMode('hallucinations')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${filterMode === 'hallucinations' ? 'bg-rose-600/40 text-rose-300 border border-rose-500/50' : 'text-rose-400 hover:text-rose-300'}`}
                  >
                    Hallucinations ({report.summary.potentialHallucinations})
                  </button>
                ) : null}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by indicator or KPA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
                />
              </div>
            </div>
          )}
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          
          {isValidating && (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-sm font-bold text-white">Cross-Verifying Dataset with Source Document...</div>
              <p className="text-xs text-slate-400">Comparing each KPI description, weight, and target against verbatim text streams.</p>
            </div>
          )}

          {!isValidating && activeSubTab === 'kpis' && (
            <div className="space-y-3">
              {filteredKpis.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No KPI records match the selected filter.
                </div>
              ) : (
                filteredKpis.map((kpi, idx) => {
                  const isExpanded = expandedKpiNo === kpi.kpiNo;
                  const isGrounded = kpi.groundingStatus === 'VERIFIED_100_PERCENT' || kpi.groundingStatus === 'EXACT_MATCH';
                  const isHallucination = kpi.groundingStatus === 'POTENTIAL_HALLUCINATION';

                  return (
                    <div
                      key={`val-kpi-${kpi.kpiNo}-${idx}`}
                      className={`border rounded-xl p-4 transition ${
                        isHallucination
                          ? 'bg-rose-950/30 border-rose-600/50'
                          : !isGrounded || kpi.deviations.length > 0
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black border ${
                            isHallucination
                              ? 'bg-rose-900/40 border-rose-500 text-rose-300'
                              : isGrounded
                              ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300'
                              : 'bg-amber-900/40 border-amber-500 text-amber-300'
                          }`}>
                            {kpi.kpiNo || `#${idx + 1}`}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                                {kpi.functionalKpa}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                                Weight: {kpi.weight}%
                              </span>
                              {kpi.annualTarget && (
                                <span className="text-[10px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                  Annual Target: <strong>{kpi.annualTarget}</strong>
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-semibold text-white mt-1.5 leading-relaxed">
                              {kpi.kpiDescription}
                            </p>
                          </div>
                        </div>

                        {/* Grounding Status Badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                            kpi.groundingStatus === 'VERIFIED_100_PERCENT'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                              : kpi.groundingStatus === 'EXACT_MATCH'
                              ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50'
                              : isHallucination
                              ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse'
                              : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                          }`}>
                            {isGrounded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                            <span>
                              {kpi.groundingStatus === 'VERIFIED_100_PERCENT'
                                ? '100% Verbatim Grounded'
                                : kpi.groundingStatus === 'EXACT_MATCH'
                                ? 'Exact Match (Normalized)'
                                : isHallucination
                                ? 'Potential Hallucination'
                                : `Partial Grounding (${Math.round(kpi.similarityScore * 100)}%)`}
                            </span>
                          </span>

                          <button
                            onClick={() => setExpandedKpiNo(isExpanded ? null : kpi.kpiNo)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Matched Source Document Snippet */}
                      {kpi.matchedSnippet && (
                        <div className="mt-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <span className="flex items-center gap-1 text-indigo-400">
                              <FileText className="w-3 h-3" />
                              Matched Source Document Context:
                            </span>
                            <span className="font-mono text-slate-500">{kpi.matchedLocation || 'Source text offset'}</span>
                          </div>
                          <p className="text-slate-300 font-mono text-[11px] leading-relaxed italic bg-slate-950/60 p-2 rounded border border-slate-800">
                            {kpi.matchedSnippet}
                          </p>
                        </div>
                      )}

                      {/* Deviations List */}
                      {kpi.deviations.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {kpi.deviations.map((dev, dIdx) => (
                            <div
                              key={`dev-${dIdx}`}
                              className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                                dev.severity === 'critical'
                                  ? 'bg-rose-950/40 border border-rose-600/40 text-rose-200'
                                  : dev.severity === 'warning'
                                  ? 'bg-amber-950/40 border border-amber-600/40 text-amber-200'
                                  : 'bg-blue-950/40 border border-blue-600/40 text-blue-200'
                              }`}
                            >
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-bold uppercase text-[10px] tracking-wider mr-1.5">[{dev.field}]:</span>
                                <span>{dev.message}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expanded Full Attribute Inspection & Quick Actions */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                              <div className="text-[10px] font-bold text-slate-500 uppercase">Baseline</div>
                              <div className="text-slate-200 font-medium mt-0.5">{kpi.baseline || '-'}</div>
                            </div>
                            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                              <div className="text-[10px] font-bold text-slate-500 uppercase">Portfolio of Evidence</div>
                              <div className="text-slate-200 font-medium mt-0.5">{kpi.poe || '-'}</div>
                            </div>
                            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                              <div className="text-[10px] font-bold text-slate-500 uppercase">Total Budget</div>
                              <div className="text-slate-200 font-medium mt-0.5">{kpi.budget || '-'}</div>
                            </div>
                            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                              <div className="text-[10px] font-bold text-slate-500 uppercase">Quarterly Breakdown</div>
                              <div className="text-slate-200 font-mono text-[11px] mt-0.5">
                                Q1: {kpi.q1Target || '-'} | Q2: {kpi.q2Target || '-'} | Q3: {kpi.q3Target || '-'} | Q4: {kpi.q4Target || '-'}
                              </div>
                            </div>
                          </div>

                          {/* Quick Alignment or Discard Actions */}
                          <div className="flex items-center justify-end gap-2 pt-2">
                            {isHallucination && onRemoveItem && (
                              <button
                                onClick={() => onRemoveItem(kpi.kpiNo)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Remove Flagged Hallucination</span>
                              </button>
                            )}
                            {kpi.matchedSnippet && onAutoFixItem && (
                              <button
                                onClick={() => onAutoFixItem(kpi.kpiNo, kpi.matchedSnippet!.replace(/^\.\.\.|\.\.\.$/g, '').trim())}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300" />
                                <span>Auto-Align with Source Snippet</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          )}

          {!isValidating && activeSubTab === 'kpas' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-1">Key Performance Area (KPA) Alignment &amp; Weight Matrix</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Compares Section 4.2 framework weightings with the sum of extracted KPI weights for each Functional KPA.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">KPA Name &amp; Framework Title</th>
                        <th className="p-3 text-center">Framework %</th>
                        <th className="p-3 text-center">Extracted %</th>
                        <th className="p-3 text-center">Variance</th>
                        <th className="p-3 text-center">KPI Count</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {report?.kpaValidation.map((kpa, kIdx) => (
                        <tr key={`kpa-val-${kIdx}`} className="hover:bg-slate-900/50 transition">
                          <td className="p-3 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span>{kpa.fullTitle}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-300">
                            {kpa.frameworkWeight > 0 ? `${kpa.frameworkWeight}%` : 'N/A'}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-300">
                            {kpa.calculatedWeight}%
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {kpa.frameworkWeight > 0 ? (
                              <span className={kpa.isBalanced ? 'text-emerald-400' : 'text-rose-400'}>
                                {kpa.weightVariance > 0 ? `+${kpa.weightVariance}%` : `${kpa.weightVariance}%`}
                              </span>
                            ) : (
                              <span className="text-slate-500">0.0%</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-200">
                            {kpa.kpiCount} KPIs
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              kpa.isBalanced
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-950 text-rose-300 border-rose-500/40'
                            }`}>
                              {kpa.isBalanced ? 'Balanced' : 'Variance Detected'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Mathematical Balance Confirmation */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Cumulative Individual Performance Plan Weight</div>
                    <div className="text-[11px] text-slate-400">Total of all Functional KPA weightings must equal exactly 100.0%.</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-black font-mono ${summary?.isWeightBalanced ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {summary?.totalExtractedWeight}%
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    {summary?.isWeightBalanced ? '100% Balanced' : 'Out of Balance'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isValidating && activeSubTab === 'document' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Original Document Text Stream:</span>
                  <span className="text-xs text-slate-400 font-mono">({report?.fileName || 'Source Document'})</span>
                </div>
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search document text..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="pl-7 pr-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                {rawDocumentText ? (
                  rawDocumentText
                ) : (
                  <span className="text-slate-500 italic">No raw text stream available for preview.</span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit record logged and persisted to Supabase database.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
          >
            Confirm &amp; Return to Mapping
          </button>
        </div>

      </div>
    </div>
  );
};
