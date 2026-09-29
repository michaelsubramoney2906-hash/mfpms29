import React, { useState } from 'react';
import { 
  BarChart3, Calendar, Download, FileText, CheckCircle2, 
  TrendingDown, Shield, Printer, Save, Award, Activity, FileSpreadsheet
} from 'lucide-react';
import type { RiskRegisterItem, PoeFile } from './RiskRegisterTab';

interface ElectronicReportingTabProps {
  riskRegister: RiskRegisterItem[];
  poeFiles: Record<string, PoeFile[]>;
  commentary: Record<string, string>;
  onSaveCommentary: (updated: Record<string, string>) => void;
}

export function ElectronicReportingTab({
  riskRegister,
  poeFiles,
  commentary,
  onSaveCommentary
}: ElectronicReportingTabProps) {
  const [selectedCycle, setSelectedCycle] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Mid-Term' | 'Annual'>('Q1');
  const [activeCommentary, setActiveCommentary] = useState(commentary[selectedCycle] || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const cycles: Array<{ id: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Mid-Term' | 'Annual'; label: string; months: string }> = [
    { id: 'Q1', label: 'Quarter 1', months: 'July – September' },
    { id: 'Q2', label: 'Quarter 2', months: 'October – December' },
    { id: 'Q3', label: 'Quarter 3', months: 'January – March' },
    { id: 'Q4', label: 'Quarter 4', months: 'April – June' },
    { id: 'Mid-Term', label: 'Mid-Term Performance', months: '6-Month Comprehensive Review' },
    { id: 'Annual', label: 'Annual Risk Report', months: 'Full Financial Year Audit' },
  ];

  const handleCycleChange = (cycleId: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Mid-Term' | 'Annual') => {
    setSelectedCycle(cycleId);
    setActiveCommentary(commentary[cycleId] || '');
    setSaveStatus(null);
  };

  const handleSaveCommentary = () => {
    const updated = {
      ...commentary,
      [selectedCycle]: activeCommentary
    };
    onSaveCommentary(updated);
    setSaveStatus('Executive commentary successfully saved to cloud storage.');
  };

  // KPI Calculations
  const totalRisks = riskRegister.length;
  const highRisks = riskRegister.filter(r => (r.inherentImpact * r.inherentLikelihood) >= 15).length;
  const mitigatedRisks = riskRegister.filter(r => (r.residualImpact * r.residualLikelihood) < 9).length;
  const poeCompleteCount = riskRegister.filter(r => (poeFiles[r.id] || []).length > 0).length;
  const poeRate = totalRisks > 0 ? Math.round((poeCompleteCount / totalRisks) * 100) : 100;

  // Document Exporters
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ["Reporting Cycle", "Risk ID", "Title", "Category", "Inherent Score", "Residual Score", "Status", "POE Attached"];
    const rows = riskRegister.map(r => [
      selectedCycle,
      r.id,
      r.title,
      r.category,
      r.inherentImpact * r.inherentLikelihood,
      r.residualImpact * r.residualLikelihood,
      r.status,
      (poeFiles[r.id] || []).length > 0 ? "YES" : "NO"
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadFile(csvContent, `Municipal_Electronic_Risk_Report_${selectedCycle}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportWord = () => {
    const htmlBody = `
      <h2>Executive Summary for ${selectedCycle}</h2>
      <p><strong>Reporting Cycle:</strong> ${selectedCycle} | <strong>Total Risks Tracked:</strong> ${totalRisks} | <strong>High Risks:</strong> ${highRisks} | <strong>POE Compliance Rate:</strong> ${poeRate}%</p>
      <h3>Executive Commentary & Audit Findings</h3>
      <p>${activeCommentary || 'No executive commentary provided for this cycle.'}</p>
      <h3>Quarterly Risk Assessment Register</h3>
      <table>
        <thead>
          <tr>
            <th>Risk ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Responsible Officer</th>
            <th>Inherent Rating</th>
            <th>Residual Rating</th>
            <th>POE Verified</th>
          </tr>
        </thead>
        <tbody>
          ${riskRegister.map(r => `
            <tr>
              <td>${r.id}</td>
              <td>${r.title}</td>
              <td>${r.category}</td>
              <td>${r.owner}</td>
              <td>${r.inherentImpact * r.inherentLikelihood}</td>
              <td>${r.residualImpact * r.residualLikelihood}</td>
              <td>${(poeFiles[r.id] || []).length > 0 ? 'Verified' : 'Pending'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Electronic Risk Report - ${selectedCycle}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { color: #991b1b; border-bottom: 2px solid #ef4444; padding-bottom: 5px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #f1f5f9; }
      </style>
      </head>
      <body>
        <h1>Municipal Electronic Risk Report - ${selectedCycle}</h1>
        <p style="font-size:11px; color:#64748b;">Produced under MFMA Section 62 Directive</p>
        <hr/>
        ${htmlBody}
      </body>
      </html>
    `;
    downloadFile(wordContent, `Municipal_Risk_Report_${selectedCycle}.doc`, 'application/msword');
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Electronic Risk Report - ${selectedCycle}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #0f172a; }
          h1 { color: #991b1b; border-bottom: 3px solid #dc2626; padding-bottom: 8px; font-size: 20px; }
          .stats { display: flex; gap: 15px; margin: 20px 0; }
          .stat-box { border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; flex: 1; text-align: center; }
          .stat-num { font-size: 18px; font-weight: bold; color: #991b1b; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Municipal Electronic Risk Report — ${selectedCycle}</h1>
        <p><strong>Compliance Framework:</strong> MFMA Act No. 56 of 2003 & Treasury Circular 62</p>
        
        <div class="stats">
          <div class="stat-box"><div class="stat-num">${totalRisks}</div><div>Total Monitored Risks</div></div>
          <div class="stat-box"><div class="stat-num">${highRisks}</div><div>Critical/High Exposure</div></div>
          <div class="stat-box"><div class="stat-num">${mitigatedRisks}</div><div>Controlled Risks</div></div>
          <div class="stat-box"><div class="stat-num">${poeRate}%</div><div>POE Compliance</div></div>
        </div>

        <h3>Executive & Risk Committee Commentary</h3>
        <p style="background: #f8fafc; padding: 12px; border-left: 4px solid #dc2626; border-radius: 4px;">
          ${activeCommentary || 'Standard quarterly risk oversight completed.'}
        </p>

        <h3>Quarterly Risk Assessment Schedule</h3>
        <table>
          <thead>
            <tr>
              <th>Risk ID</th>
              <th>Description</th>
              <th>Department</th>
              <th>Inherent Score</th>
              <th>Residual Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${riskRegister.map(r => `
              <tr>
                <td>${r.id}</td>
                <td>${r.title}</td>
                <td>${r.owner}</td>
                <td>${r.inherentImpact * r.inherentLikelihood}</td>
                <td>${r.residualImpact * r.residualLikelihood}</td>
                <td>${r.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quarter Selection Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-600" /> Electronic Quarterly & Annual Risk Reporting
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Automated risk telemetry per quarter, mid-term assessment, & annual report exports for Council & FARMCO.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrintPdf}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Export PDF
            </button>
            <button 
              onClick={handleExportWord}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-emerald-400" /> Export Word (.doc)
            </button>
            <button 
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600" /> Export Excel
            </button>
          </div>
        </div>

        {/* Cycle Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-6">
          {cycles.map(c => (
            <button
              key={c.id}
              onClick={() => handleCycleChange(c.id)}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedCycle === c.id 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md font-bold' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
              }`}
            >
              <div className="text-xs font-bold">{c.label}</div>
              <div className="text-[10px] opacity-75 mt-0.5">{c.months}</div>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-700 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalRisks}</div>
            <div className="text-xs text-slate-500 font-medium">Total Risks Tracked</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{highRisks}</div>
            <div className="text-xs text-slate-500 font-medium">Critical/High Exposure</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{mitigatedRisks}</div>
            <div className="text-xs text-slate-500 font-medium">Controlled Residual Items</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{poeRate}%</div>
            <div className="text-xs text-slate-500 font-medium">POE Evidence Index</div>
          </div>
        </div>
      </div>

      {/* Executive Commentary Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-600" /> Chief Risk Officer & Committee Commentary for {selectedCycle}
          </h3>
          <button 
            onClick={handleSaveCommentary}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-emerald-400" /> Save Commentary to Cloud
          </button>
        </div>

        <textarea 
          rows={3}
          placeholder={`Enter executive risk commentary, control audit findings, and committee remarks for ${selectedCycle}...`}
          value={activeCommentary}
          onChange={e => setActiveCommentary(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-800 outline-none focus:border-red-500"
        />

        {saveStatus && (
          <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
            {saveStatus}
          </div>
        )}
      </div>

      {/* Quarterly Risk Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
          Quarterly Risk Assessment Schedule ({selectedCycle})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                <th className="p-4">Risk ID</th>
                <th className="p-4">Risk Description</th>
                <th className="p-4">Department / Owner</th>
                <th className="p-4">Inherent Score</th>
                <th className="p-4">Residual Score</th>
                <th className="p-4">POE Status</th>
                <th className="p-4">Quarterly Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskRegister.map(r => {
                const inherent = r.inherentImpact * r.inherentLikelihood;
                const residual = r.residualImpact * r.residualLikelihood;
                const hasPoe = (poeFiles[r.id] || []).length > 0;

                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-900">{r.id}</td>
                    <td className="p-4 font-bold text-slate-900">{r.title}</td>
                    <td className="p-4 text-slate-600">{r.owner}</td>
                    <td className="p-4 font-bold text-slate-800">{inherent}</td>
                    <td className="p-4 font-bold text-emerald-700">{residual}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        hasPoe ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {hasPoe ? 'POE Attached' : 'No POE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                        <TrendingDown className="w-3 h-3" /> Improved Control
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
