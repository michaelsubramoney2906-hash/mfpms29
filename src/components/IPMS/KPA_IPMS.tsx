import React, { useState, useEffect } from 'react';
import { Flag, Trash2, CheckCircle, Database, HelpCircle, ArrowRight, Save, LayoutTemplate, Sparkles, Server, Plus, X, Edit2 } from 'lucide-react';
import type { User } from '../../types';

interface KPAIPMSProps {
  currentUser: User;
  activeTenantId: string;
}

export interface KpaUnit {
  id: string;
  title: string;
  nationalKpa: string;
  parentObjective: string;
  mscoaCode: string;
  createdAt: string;
  weighting?: string;
}

const NATIONAL_KPAS = [
  "Basic Service Delivery",
  "Local Economic Development",
  "Municipal Financial viability and management",
  "Good Governance and public participation",
  "Municipal Institutional Development and Transformation",
  "Spatial Rationale"
];

const STRATEGIC_OBJECTIVES = [
  "To ensure reliable bulk water and electricity infrastructure",
  "To promote local agrarian, manufacturing, and tourism hospitality economy",
  "To achieve unqualified AG audit with zero recurring findings",
  "To enable deep responsive community consultation across all wards",
  "To improve professional competency and human capital retention",
  "To enforce optimal sustainable land use management aligned with SPLUMA",
  "To implement standard mSCOA compliance and cash-backed budgeting"
];

const MSCOA_CODES = [
  "Funding",
  "Functions",
  "Municipal Standard Classification/Responsibility",
  "Project",
  "Costing",
  "Regional Indicator",
  "Item"
];


const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getIsDualLayerTeamLeader(email: string | undefined) {
  if (!email) return false;
  return DUAL_LAYER_USERS.includes(email.toLowerCase().trim());
}

export function KPAIPMS({ currentUser, activeTenantId }: KPAIPMSProps) {

  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
  const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;

  const [kpas, setKpas] = useState<KpaUnit[]>([]);
  const [title, setTitle] = useState('');
  const [nationalKpa, setNationalKpa] = useState('');
  const [customNationalKpaText, setCustomNationalKpaText] = useState('');
  const [parentObjective, setParentObjective] = useState('');
  const [mscoaCode, setMscoaCode] = useState('');
  const [weighting, setWeighting] = useState('');
  const [customObjectiveText, setCustomObjectiveText] = useState('');
  const [customMscoaText, setCustomMscoaText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // States for interactive KPA table
  const [tableHeaders, setTableHeaders] = useState<string[]>(['KPA No', 'Functional Area KPA', 'National KPA Alignment (Optional)', 'Weighting']);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['1', 'Clean Ward Committees & Public Participation Support', 'Good Governance and public participation', '25%'],
    ['2', 'AG Unqualified Audit & mSCOA Financial Governance', 'Municipal Financial viability and management', '35%'],
    ['3', 'Water & Electricity Infrastructure Operations & Core Grid Stability', 'Basic Service Delivery', '40%']
  ]);

  const handleKpaDistributeEvenly = () => {
    const weightColIdx = tableHeaders.findIndex(h => h.toLowerCase().includes('weight'));
    if (weightColIdx === -1) {
      alert("No 'Weight' column found in table header configuration.");
      return;
    }
    const numRows = tableRows.length;
    if (numRows === 0) return;

    const baseVal = Math.floor(100 / numRows);
    const remainder = 100 % numRows;

    const updatedRows = tableRows.map((row, idx) => {
      const newRow = [...row];
      const val = idx === numRows - 1 ? (baseVal + remainder) : baseVal;
      newRow[weightColIdx] = `${val}%`;
      return newRow;
    });
    setTableRows(updatedRows);
    showNotification("Weights distributed evenly (summing to exactly 100%).");
  };

  const handleKpaScaleTo100 = () => {
    const weightColIdx = tableHeaders.findIndex(h => h.toLowerCase().includes('weight'));
    if (weightColIdx === -1) {
      alert("No 'Weight' column found in table header configuration.");
      return;
    }
    const numRows = tableRows.length;
    if (numRows === 0) return;

    // Parse current values
    const parsedValues = tableRows.map(row => {
      if (!row[weightColIdx]) return 0;
      const cellVal = row[weightColIdx].replace(/[^\d.-]/g, '').trim();
      const val = parseFloat(cellVal);
      return isNaN(val) ? 0 : val;
    });

    const sum = parsedValues.reduce((a, b) => a + b, 0);
    if (sum === 0) {
      // If sum is 0, just distribute evenly
      handleKpaDistributeEvenly();
      return;
    }

    // Scale proportionally
    let scaledValues = parsedValues.map(v => Math.round((v / sum) * 100));
    let scaledSum = scaledValues.reduce((a, b) => a + b, 0);

    // If there is rounding error, adjust the largest element to make it exactly 100
    if (scaledSum !== 100) {
      const difference = 100 - scaledSum;
      let maxIdx = 0;
      let maxVal = -1;
      parsedValues.forEach((v, idx) => {
        if (v > maxVal) {
          maxVal = v;
          maxIdx = idx;
        }
      });
      scaledValues[maxIdx] += difference;
    }

    const updatedRows = tableRows.map((row, idx) => {
      const newRow = [...row];
      newRow[weightColIdx] = `${scaledValues[idx]}%`;
      return newRow;
    });
    setTableRows(updatedRows);
    showNotification("Weights scaled proportionally (summing to exactly 100%).");
  };


  useEffect(() => {
    loadKpas();
  }, [activeTenantId, targetEmail]);



  const loadKpas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/kpas?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`);

      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (Array.isArray(data.kpas)) {
            setKpas(data.kpas);
          } else {
            setKpas([]);
          }
          if (data.customKpaTable) {
            setTableHeaders(data.customKpaTable.headers || ['KPA No', 'National KPA', 'Functional Area KPA', 'Weighting']);
            setTableRows(data.customKpaTable.rows || [
              ['1', 'Good Governance & Institutional Transformation', 'Clean Ward Committees & Public Participation', '25%'],
              ['2', 'Municipal Financial viability and management', 'AG Unqualified Audit & mSCOA Integration', '35%'],
              ['3', 'Basic Service Delivery', 'Infrastructure Operations & Core Grid Stability', '40%']
            ]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load KPAs:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveKpasList = async (newList: KpaUnit[], customTableToSave = { headers: tableHeaders, rows: tableRows }, scopeOverride?: 'individual' | 'team') => {
    setSaving(true);
    try {
      // Save both the KPA list and the custom table to the messages table
      const saveEmail = scopeOverride === 'team' ? currentUser.email + '_team' : currentUser.email;
      const res = await fetch(`/api/tenant/${activeTenantId}/kpas?userId=${encodeURIComponent(saveEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kpas: newList, 
          customKpaTable: customTableToSave 
        })
      });
      if (!res.ok) throw new Error("Server failed to save KPAs.");

      showNotification("Data successfully synced to Cloud Supabase Storage.");
    } catch (err) {
      console.error("Save KPAs error:", err);
      alert("Error saving: " + err);
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalNationalKpa = nationalKpa === "__CUSTOM__" ? customNationalKpaText.trim() : nationalKpa;
    const finalObjective = parentObjective === "__CUSTOM__" ? customObjectiveText.trim() : parentObjective;
    const finalMscoa = mscoaCode === "__CUSTOM__" ? customMscoaText.trim() : mscoaCode;
    const finalTitle = title.trim();

    if (!finalTitle && !finalNationalKpa && !finalObjective && !finalMscoa && !weighting.trim()) {
      alert("Please fill in at least one field in the entry terminal before committing.");
      return;
    }

    const newUnit: KpaUnit = {
      id: `kpa-${Date.now()}`,
      title: finalTitle,
      nationalKpa: finalNationalKpa,
      parentObjective: finalObjective,
      mscoaCode: finalMscoa,
      weighting: weighting.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [newUnit, ...kpas];
    setKpas(updated);
    await saveKpasList(updated);

    // Reset inputs
    setTitle('');
    setNationalKpa('');
    setCustomNationalKpaText('');
    setParentObjective('');
    setMscoaCode('');
    setWeighting('');
    setCustomObjectiveText('');
    setCustomMscoaText('');
    showNotification(`KPA Unit "${newUnit.title || 'Custom KPA'}" captured! It will reflect in the Performance Plan table.`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this KPA unit? This might affect Performance Plan alignments.")) {
      const updated = kpas.filter(k => k.id !== id);
      setKpas(updated);
      await saveKpasList(updated);
      showNotification("KPA unit deleted.");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 min-h-0 text-slate-100">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/45 p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent uppercase tracking-tight flex items-center gap-2">
            <Flag className="w-6 h-6 text-emerald-400" />
            IPMS Functional Area KPA Capturing Suite
          </h2>
          <p className="text-gray-450 text-xs mt-1">
            Capture Municipal Key Performance Areas (KPAs) directly into operational <strong>Functional Area KPAs</strong> (e.g., Water Infrastructure, Waste Management, Financial Governance) rather than generic National KPA abbreviations (BSD, LED, GGPP, etc.).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-xl border border-white/5 text-[11px] font-mono">
          <Server className="w-4 h-4 text-green-400 animate-pulse" />
          <span>Status: Supabase Connected</span>
        </div>
      </div>

      {/* Mandatory Statutory Notice */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-xl flex items-center gap-3 text-emerald-200 text-xs shadow-sm">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>IPMS Capturing Standard:</strong> All municipal indicators and units are categorized into <strong>Functional Area KPAs</strong>. National KPA alignment is recorded as an optional strategic tag.
        </span>
      </div>

      {notification && (
        <div className="bg-emerald-950/80 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-300 text-xs shadow-lg animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
         {/* LEFT COLUMN: The Functional Entry Terminal & Interactive Table */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          <div className="bg-white text-slate-900 rounded-2xl border-2 border-slate-900 shadow-2xl p-8 flex flex-col gap-6">
            <div className="border-b border-slate-150 pb-4 flex items-center justify-between">
              <div className="text-slate-950 font-sans italic font-extrabold text-2xl uppercase tracking-wider">
                FUNCTIONAL AREA KPA TERMINAL
              </div>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded font-mono uppercase">
                Functional Area Core
              </span>
            </div>

            <form onSubmit={handleCommit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Field 1: Functional Area KPA Title (Primary) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-emerald-800 font-mono uppercase tracking-wider flex items-center gap-1">
                    <span>1. FUNCTIONAL AREA KPA</span>
                    <span className="text-rose-600 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Water and Sanitation Infrastructure..."
                    required
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border-2 border-emerald-400 focus:border-emerald-700 rounded-xl font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white transition"
                  />
                  <span className="text-[9px] text-slate-500 italic">Captures the specific municipal functional work area</span>
                </div>

                {/* Field 2: National KPA Alignment (Secondary / Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                    2. NATIONAL KPA ALIGNMENT (OPTIONAL)
                  </label>
                  <select
                    value={nationalKpa}
                    onChange={(e) => setNationalKpa(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-930 outline-none focus:border-slate-800 focus:bg-white transition cursor-pointer text-xs"
                  >
                    <option value="">Select National KPA Alignment... (Optional)</option>
                    {NATIONAL_KPAS.map((kpa) => (
                      <option key={kpa} value={kpa}>{kpa}</option>
                    ))}
                    <option value="__CUSTOM__">➕ Enter Custom / Manual National KPA...</option>
                  </select>
                  {nationalKpa === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={customNationalKpaText}
                      onChange={(e) => setCustomNationalKpaText(e.target.value)}
                      placeholder="Type custom National KPA here..."
                      className="mt-2 w-full px-3 py-2 bg-emerald-50 border-2 border-dashed border-emerald-500 rounded-xl outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold text-slate-800 animate-fadeIn"
                    />
                  )}
                  <span className="text-[9px] text-slate-400 italic">Optional high-level national classification</span>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Field 3: Strategic Objective */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                    3. PARENT STRATEGIC OBJECTIVE (OPTIONAL)
                  </label>
                  <select
                    value={parentObjective}
                    onChange={(e) => setParentObjective(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-930 outline-none focus:border-slate-800 focus:bg-white transition cursor-pointer text-xs"
                  >
                    <option value="">Select Strategic Anchor... (Optional)</option>
                    {STRATEGIC_OBJECTIVES.map((obj) => (
                      <option key={obj} value={obj}>{obj}</option>
                    ))}
                    <option value="__CUSTOM__">➕ Enter Custom / Manual Strategic Objective...</option>
                  </select>
                  {parentObjective === '__CUSTOM__' && (
                    <textarea
                      rows={2}
                      value={customObjectiveText}
                      onChange={(e) => setCustomObjectiveText(e.target.value)}
                      placeholder="Type custom strategic objective here (Optional)..."
                      className="mt-2 w-full px-3 py-2 bg-emerald-50 border-2 border-dashed border-emerald-500 rounded-xl outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold text-slate-800 animate-fadeIn"
                    />
                  )}
                </div>

                {/* Field 4: mSCOA code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                    4. MSCOA ALIGNMENT CODE (OPTIONAL)
                  </label>
                  <select
                    value={mscoaCode}
                    onChange={(e) => setMscoaCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-930 outline-none focus:border-slate-800 focus:bg-white transition cursor-pointer text-xs"
                  >
                    <option value="">Select mSCOA Code... (Optional)</option>
                    {MSCOA_CODES.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                    <option value="__CUSTOM__">➕ Enter Custom / Manual mSCOA Code...</option>
                  </select>
                  {mscoaCode === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={customMscoaText}
                      onChange={(e) => setCustomMscoaText(e.target.value)}
                      placeholder="Type custom mSCOA alignment code (Optional)"
                      className="mt-2 w-full px-3 py-2 bg-emerald-50 border-2 border-dashed border-emerald-500 rounded-xl outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold text-slate-800 animate-fadeIn"
                    />
                  )}
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4">
                
                {/* Field 5: Weighting */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                    5. KPA WEIGHTING (WEIGHT %)
                  </label>
                  <input
                    type="text"
                    value={weighting}
                    onChange={(e) => setWeighting(e.target.value)}
                    placeholder="e.g. 25% or 25"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 focus:bg-white transition"
                  />
                </div>

              </div>

              {/* Commit Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-slate-950 font-bold uppercase text-xs tracking-wider text-white hover:bg-emerald-600 rounded-xl transition duration-150 transform hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg inline-flex items-center gap-2"
                >
                  {saving ? "COMMITTING UNIT..." : "COMMIT KPA UNIT"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* INTERACTIVE KPA TABLE EDITOR */}
          <div className="bg-white text-slate-900 rounded-2xl border-2 border-slate-900 shadow-2xl p-8 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div className="text-slate-950 font-sans italic font-extrabold text-lg uppercase tracking-wider flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-indigo-600" />
                Interactive KPA Table
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold font-mono text-slate-500 uppercase">Interactive Spreadsheet</span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium tracking-tight">
              Customize rows and columns under section 4.2. Double-click or type directly in empty fields. Click "Save Table Content" to persist modifications.
            </p>

            {/* WEIGHTING CALCULATOR & VALIDATION STATUS */}
            {(() => {
              const weightColIdx = tableHeaders.findIndex(h => h.toLowerCase().includes('weight'));
              let totalKpaWeight = 0;
              if (weightColIdx !== -1) {
                tableRows.forEach(row => {
                  if (row[weightColIdx]) {
                    const cleanVal = row[weightColIdx].replace(/[^\d.-]/g, '').trim();
                    const parsed = parseFloat(cleanVal);
                    if (!isNaN(parsed)) {
                      totalKpaWeight += parsed;
                    }
                  }
                });
              }

              const diff = 100 - totalKpaWeight;

              return (
                <div className="p-4 rounded-xl border border-dashed transition-all duration-200 bg-slate-50 border-slate-250 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full animate-pulse bg-indigo-600"></div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono">Weight Validation Metric</span>
                    </div>
                    {diff === 0 ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded uppercase">🎉 Aligned (100%)</span>
                    ) : diff > 0 ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded uppercase">⚠️ Short of 100% by {diff}%</span>
                    ) : (
                      <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2 py-0.5 rounded uppercase">🚨 Over 100% by {Math.abs(diff)}%</span>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        diff === 0 ? 'bg-emerald-500' : diff > 0 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, totalKpaWeight))}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 tracking-tight flex-wrap gap-1">
                    <div>Total KPA Weighting: <span className={diff === 0 ? "text-emerald-600 font-extrabold text-xs" : diff > 0 ? "text-amber-600 font-extrabold text-xs" : "text-rose-600 font-extrabold text-xs"}>{totalKpaWeight}%</span></div>
                    {diff > 0 && <div className="text-amber-600">Short by: {diff}%</div>}
                    {diff < 0 && <div className="text-rose-600">Excess: {Math.abs(diff)}%</div>}
                    {diff === 0 && <div className="text-emerald-600">Perfect 100% Sum!</div>}
                  </div>

                  {/* Balancing Helper Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase mr-1">Balance Weights:</span>
                    <button
                      type="button"
                      onClick={handleKpaDistributeEvenly}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded text-[10px] shadow-xs active:bg-slate-200 transition duration-150 cursor-pointer"
                      title="Set weight evenly to total exactly 100% (e.g., 33%, 33%, 34%)"
                    >
                      Equalize Weights
                    </button>
                    <button
                      type="button"
                      onClick={handleKpaScaleTo100}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded text-[10px] shadow-xs active:bg-slate-200 transition duration-150 cursor-pointer"
                      title="Proportionally scale existing weight values to total exactly 100%"
                    >
                      Scale to 100%
                    </button>
                  </div>

                  <div className="border-t border-slate-200/60 pt-2 text-[10.5px] text-slate-600 leading-relaxed font-medium flex flex-col gap-1.5">
                    <div className="flex items-start gap-1">
                      <span className="text-emerald-600 font-black shrink-0">✔ Compliance Rule:</span>
                      <span>The combined KPA weights <b>must sum to exactly 100%</b> under legal requirements. However, individual weights <b>do not need to be equally divisible</b> (e.g. allocations such as 33%, 33%, 34% or 45%, 35%, 20% are compliant, valid, and fully supported).</span>
                    </div>
                    <div className="flex items-start gap-1 text-[9.5px] text-indigo-700">
                      <span className="text-indigo-600 font-extrabold shrink-0">✦ Note:</span>
                      <span>Saving table content automatically exports and updates section 4.1 of the live Performance Agreement drafting suites.</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="overflow-x-auto min-w-0 border border-slate-250 rounded-xl bg-slate-50">
              <table className="w-full text-left border-collapse text-xs table-fixed">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    {tableHeaders.map((header, colIdx) => (
                      <th 
                        key={colIdx} 
                        style={{ resize: 'horizontal', width: colIdx === 0 ? '12%' : '29%' }}
                        className="p-3 font-extrabold text-slate-800 text-[10px] uppercase font-mono tracking-wider border-r border-slate-200 min-w-[120px] max-w-[500px] relative group overflow-hidden resize-x"
                      >
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => {
                            const updated = [...tableHeaders];
                            updated[colIdx] = e.target.value;
                            setTableHeaders(updated);
                          }}
                          className="bg-transparent font-extrabold text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none w-full px-1 rounded uppercase"
                        />
                        {tableHeaders.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (tableHeaders.length <= 2) return;
                              setTableHeaders(tableHeaders.filter((_, idx) => idx !== colIdx));
                              setTableRows(tableRows.map(row => row.filter((_, idx) => idx !== colIdx)));
                            }}
                            className="absolute -top-1 -right-1 hidden group-hover:flex bg-rose-500 text-white rounded-full p-0.5"
                            title="Remove column"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </th>
                    ))}
                    <th className="p-3 w-[80px] text-center text-slate-800 font-extrabold text-[10px] uppercase font-mono">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-150 hover:bg-slate-100/50 transition">
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="p-2 border-r border-slate-200 align-top">
                          <textarea
                            rows={1}
                            value={cell}
                            onChange={(e) => {
                              const updated = tableRows.map((r, rIdx) => {
                                if (rIdx === rowIdx) {
                                  const newRow = [...r];
                                  newRow[colIdx] = e.target.value;
                                  return newRow;
                                  }
                                return r;
                              });
                              setTableRows(updated);
                            }}
                            onInput={(e) => {
                              e.currentTarget.style.height = 'auto';
                              e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                            }}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }
                            }}
                            className="w-full bg-transparent p-1 border-0 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:rounded font-semibold text-slate-900 outline-none resize-none overflow-hidden text-xs leading-relaxed min-h-[30px]"
                            placeholder="..."
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => {
                            if (tableRows.length <= 1) {
                              alert("At least one row is required.");
                              return;
                            }
                            setTableRows(tableRows.filter((_, rIdx) => rIdx !== rowIdx));
                          }}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded transition inline-block"
                          title="Remove Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 justify-between border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = tableRows.length + 1;
                    const newRow = Array(tableHeaders.length).fill('');
                    newRow[0] = String(nextNum);
                    setTableRows([...tableRows, newRow]);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-slate-250 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const colName = prompt("Enter the name of the new column:", `New Column ${tableHeaders.length + 1}`);
                    if (!colName) return;
                    const name = colName.trim() || `New Column ${tableHeaders.length + 1}`;
                    setTableHeaders([...tableHeaders, name]);
                    setTableRows(tableRows.map(row => [...row, '']));
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-slate-250 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows });
                }}
                disabled={saving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "SAVING TABLE..." : "SAVE TABLE CONTENT"}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Performance Plan alignment guide & existing KPAs overview */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-emerald-400 font-extrabold text-sm uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-emerald-400" />
                Active Functional Area KPAs ({kpas.length} Units)
              </span>
              <span className="text-[9px] text-gray-500 font-mono">SUPABASE PIPELINE</span>
            </h3>
            
            {loading ? (
              <p className="text-slate-400 text-xs animate-pulse">Loading captured KPAs from database...</p>
            ) : kpas.length === 0 ? (
              <div className="p-8 border border-dashed border-white/10 rounded-xl text-center bg-black/20 text-slate-400">
                <Flag className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-40" />
                <p className="text-xs uppercase font-bold tracking-wider">No Functional Area KPA units captured yet.</p>
                <p className="text-[10px] text-gray-500 mt-1">Submit via the terminal on the left to add a municipal Functional Area KPA.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-auto pr-2 custom-scrollbar">
                {kpas.map((k) => (
                  <div 
                    key={k.id} 
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 transition relative group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/30">
                            Functional Area KPA
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white">{k.title}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {k.nationalKpa && (
                            <span className="bg-slate-800 text-slate-300 text-[9px] px-2 py-0.5 rounded border border-white/10 font-semibold font-mono">
                              National: {k.nationalKpa}
                            </span>
                          )}
                          {k.mscoaCode && (
                            <span className="bg-blue-950/65 text-blue-300 text-[9px] px-2 py-0.5 rounded border border-blue-500/20 font-semibold font-mono">
                              mSCOA: {k.mscoaCode}
                            </span>
                          )}
                          {k.weighting && (
                            <span className="bg-slate-800 text-amber-350 text-[9px] px-2 py-0.5 rounded border border-amber-500/25 font-bold font-mono">
                              Weight: {k.weighting}
                            </span>
                          )}
                        </div>
                        {k.parentObjective && (
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">
                            <span className="text-slate-500 font-bold uppercase tracking-tight text-[10px]">Strategic Objective:</span> {k.parentObjective}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 p-1.5 rounded-lg transition"
                        title="Delete KPA Unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/20 text-slate-300 text-xs leading-relaxed">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              STATUTORY IPMS DIRECTIVE
            </div>
            In municipal IPMS, Key Performance Areas represent practical, operational <strong>Functional Area KPAs</strong> (e.g. Water Infrastructure, Revenue Enhancement, Waste Management). When indicators are added in the **Performance Plan** or the **KPIs** module, each KPI is bound to its designated Functional Area KPA rather than a generic national acronym.
          </div>
        </div>

      </div>

    </div>
  );
}
