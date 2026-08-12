import React, { useState } from 'react';
import { 
  X, Award, CheckCircle2, AlertTriangle, XCircle, TrendingUp, 
  Printer, Download, FileText, Calendar, Building, Briefcase, Mail, 
  Target, ShieldCheck, Sparkles, Layers, ChevronRight, Check
} from 'lucide-react';
import { cn } from '../Branding';

export interface PerformanceReportModalProps {
  user: any;
  userPlan?: any;
  activeFinancialYear?: string;
  onClose: () => void;
}

export const PerformanceReportModal: React.FC<PerformanceReportModalProps> = ({
  user,
  userPlan,
  activeFinancialYear = '2026-2027',
  onClose
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');
  const [isPrintMode, setIsPrintMode] = useState(false);

  const name = user.fullName || user.full_name || user.name || user.email || 'Employee';
  const email = user.email || '';
  const role = user.jobFunction || user.job_function || user.role || 'Staff Member';
  const department = user.department || 'Municipal Operations';
  const manager = user.manager || user.reportTo || 'Municipal Manager';

  const items: any[] = userPlan?.plan?.items || [];

  // Calculate stats based on selected quarter
  const getKpiStatus = (item: any, q: string) => {
    let score = 0;
    let actual = '';
    let target = item.annualTarget || item.target || '';

    if (q === 'Q1') {
      score = parseFloat(item.q1Score || item.q1_score || '0');
      actual = item.q1Actual || item.q1_actual || '';
      target = item.q1Target || item.q1_target || target;
    } else if (q === 'Q2') {
      score = parseFloat(item.q2Score || item.q2_score || '0');
      actual = item.q2Actual || item.q2_actual || '';
      target = item.q2Target || item.q2_target || target;
    } else if (q === 'Q3') {
      score = parseFloat(item.q3Score || item.q3_score || '0');
      actual = item.q3Actual || item.q3_actual || '';
      target = item.q3Target || item.q3_target || target;
    } else if (q === 'Q4') {
      score = parseFloat(item.q4Score || item.q4_score || '0');
      actual = item.q4Actual || item.q4_actual || '';
      target = item.q4Target || item.q4_target || target;
    } else {
      // Annual / All: take average of available valid scores or fallback to moderated/manager scores
      const validScores = ['dpmcScore', 'internalAuditorScore', 'managerScore', 'q1Score', 'q2Score', 'q3Score', 'q4Score', 'score', 'evalScore']
        .map(k => parseFloat(item[k] || '0'))
        .filter(s => !isNaN(s) && s > 0);
      score = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
      actual = item.q4Actual || item.q3Actual || item.q2Actual || item.q1Actual || item.actualAchieved || item.actual || '';
      target = item.annualTarget || item.q4Target || item.q3Target || item.q2Target || item.q1Target || item.target || '';
    }

    if (score >= 4) return { status: 'exceeded', label: 'Exceeded', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', score: Number(score.toFixed(1)), actual: actual || '-', target: target || '-' };
    if (score >= 3) return { status: 'met', label: 'Met', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', score: Number(score.toFixed(1)), actual: actual || '-', target: target || '-' };
    if (score > 0 && score < 3) return { status: 'unmet', label: 'Not Met', color: 'bg-rose-100 text-rose-800 border-rose-200', score: Number(score.toFixed(1)), actual: actual || '-', target: target || '-' };

    // Fallback based on text if score not explicit
    if (actual && target) {
      const actNum = parseFloat(actual);
      const tgtNum = parseFloat(target);
      if (!isNaN(actNum) && !isNaN(tgtNum)) {
        if (actNum > tgtNum * 1.1) return { status: 'exceeded', label: 'Exceeded', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', score: 4, actual, target };
        if (actNum >= tgtNum) return { status: 'met', label: 'Met', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', score: 3, actual, target };
        return { status: 'unmet', label: 'Not Met', color: 'bg-rose-100 text-rose-800 border-rose-200', score: 2, actual, target };
      }
    }

    return { status: 'pending', label: 'Pending Assessment', color: 'bg-slate-100 text-slate-700 border-slate-200', score: 0, actual: actual || '-', target: target || '-' };
  };

  const processedItems = items.map(item => ({
    ...item,
    assessment: getKpiStatus(item, selectedQuarter)
  }));

  const totalKPIs = items.length || 1;
  const exceededCount = processedItems.filter(i => i.assessment.status === 'exceeded').length;
  const metCount = processedItems.filter(i => i.assessment.status === 'met').length;
  const unmetCount = processedItems.filter(i => i.assessment.status === 'unmet').length;
  const pendingCount = processedItems.filter(i => i.assessment.status === 'pending').length;

  const qualifiedCount = metCount + exceededCount;
  const qualificationRate = items.length > 0 ? Math.round((qualifiedCount / totalKPIs) * 100) : 0;

  // Rule: 65% of KPIs must be Met or Exceeded to qualify for Performance Bonus
  const isBonusEligible = qualificationRate >= 65;
  const remainingNeeded = Math.max(0, Math.ceil(totalKPIs * 0.65) - qualifiedCount);

  // Overall Score Average
  const scoresList = processedItems.map(i => i.assessment.score).filter(s => s > 0);
  const avgScore = scoresList.length > 0 ? (scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(1) : '0.0';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Individual Performance Dossier
                </span>
                <span className="text-xs text-slate-400 font-mono">FY {activeFinancialYear}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                {name} — Performance Evaluation
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              Print Certificate
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quarter Filter & User Summary Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          {/* User Details */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-black text-lg shadow-inner">
              {name.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-snug">{name}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-emerald-600" /> {role}</span>
                <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-emerald-600" /> {department}</span>
              </div>
            </div>
          </div>

          {/* Quarter Pills Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm self-start md:self-auto">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">Quarter:</span>
            {(['all', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer uppercase tracking-wider",
                  selectedQuarter === q
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {q === 'all' ? 'Annual Overview' : q}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* 65% Bonus Qualification Banner & Key Score Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Widget 1: Bonus Qualification Card */}
            <div className={cn(
              "md:col-span-2 p-5 rounded-3xl border-2 flex flex-col justify-between relative overflow-hidden transition-all shadow-sm",
              isBonusEligible
                ? "bg-emerald-50/70 border-emerald-500 text-emerald-950"
                : "bg-amber-50/70 border-amber-500 text-amber-950"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border",
                      isBonusEligible ? "bg-emerald-600 text-white border-emerald-700" : "bg-amber-600 text-white border-amber-700"
                    )}>
                      Statutory Bonus Requirement (65% Target)
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {selectedQuarter === 'all' ? 'Annual Cycle' : selectedQuarter} Evaluation
                    </span>
                  </div>
                  <h4 className="text-xl font-black tracking-tight mt-1 flex items-center gap-2">
                    {isBonusEligible ? (
                      <>
                        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                        QUALIFIED FOR PERFORMANCE BONUS
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                        INELIGIBLE FOR BONUS PAYMENT
                      </>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                    {isBonusEligible ? (
                      <>Achieved <strong className="text-slate-900 font-bold">{qualificationRate}%</strong> KPI compliance rate ({qualifiedCount} of {totalKPIs} KPIs Met/Exceeded). Exceeds the required 65% statutory threshold.</>
                    ) : (
                      <>Current compliance rate is <strong className="text-slate-900 font-bold">{qualificationRate}%</strong> ({qualifiedCount} of {totalKPIs} Met/Exceeded). Requires <strong className="text-slate-900 font-bold">{remainingNeeded} additional KPI(s)</strong> met to reach the 65% bonus baseline.</>
                    )}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-3xl font-black font-mono">
                    {qualificationRate}%
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                    Met/Exceeded
                  </div>
                </div>
              </div>

              {/* Threshold Meter Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span>0%</span>
                  <span className="text-emerald-700 font-black">65% Target Baseline</span>
                  <span>100%</span>
                </div>
                <div className="relative w-full h-3 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
                  {/* 65% Threshold Line Marker */}
                  <div className="absolute top-0 bottom-0 left-[65%] w-0.5 bg-slate-900 z-10 opacity-70"></div>
                  
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isBonusEligible ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min(100, qualificationRate)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Widget 2: Performance Average & Metrics Box */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Moderated Rating</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black font-mono text-white">{avgScore}</span>
                  <span className="text-xs text-slate-400 font-bold">/ 5.0 Rating</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 mt-4 text-center">
                <div>
                  <span className="text-lg font-black text-indigo-400 block font-mono">{exceededCount}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Exceeded</span>
                </div>
                <div>
                  <span className="text-lg font-black text-emerald-400 block font-mono">{metCount}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Met</span>
                </div>
                <div>
                  <span className="text-lg font-black text-rose-400 block font-mono">{unmetCount}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Unmet</span>
                </div>
              </div>
            </div>

          </div>

          {/* KPI Execution Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Key Performance Indicators Ledger ({selectedQuarter === 'all' ? 'Annual' : selectedQuarter})
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {processedItems.length} Total Indicators
              </span>
            </div>

            {processedItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">
                No active performance agreement KPIs recorded for this user.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">KPI # / Description</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3">Actual Achieved</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3">Outcome Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-extrabold text-slate-900 leading-snug">
                            {item.kpiNumber || `KPI ${idx + 1}`}: {item.kpiDescription || item.indicator || 'Standard KPI'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            KPA: {item.kpa || 'Operational Target'} | Weight: {item.weighting || '20'}%
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">
                          {item.assessment.target}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {item.assessment.actual}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-900 font-black font-mono">
                            {item.assessment.score || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                            item.assessment.color
                          )}>
                            {item.assessment.status === 'exceeded' && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                            {item.assessment.status === 'met' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {item.assessment.status === 'unmet' && <XCircle className="w-3 h-3 text-rose-600" />}
                            {item.assessment.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sign-off & Audit Trail Block */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
            <div>
              <span className="font-extrabold text-slate-900 block text-[11px] uppercase tracking-wider mb-0.5">
                Evaluation Verification & Sign-Off
              </span>
              Line Manager: <strong className="text-slate-900 font-bold">{manager}</strong> | Audit Moderated
            </div>

            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Download Formal Evaluation Report
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
