import React, { useState, useEffect } from 'react';
import { Activity, Target, Trash2, Plus, Info, CheckCircle, Database, Award, ClipboardList, HelpCircle, FileText, UploadCloud, X } from 'lucide-react';
import type { User } from '../../types';
import { StrategicObjective } from '../StrategicObjectives/StrategicObjectives';

interface KPIProps {
  currentUser: User;
  activeTenantId: string;
}

export interface KpiUnit {
  id: string;
  indicator: string;
  baseline: string;
  annualTarget: string;
  q1Target: string;
  q2Target: string;
  q3Target: string;
  q4Target: string;
  weighting: string;
  unitOfMeasurement: string;
  evidenceRequired: string;
  operationalActivity: string;
  budgetAllocation: string;
  strategicObjectiveId: string;
  strategicObjectiveText: string;
  midTermTarget: string;
  q1Actual?: string;
  q1Variance?: string;
  q1Corrective?: string;
  q2Actual?: string;
  q2Variance?: string;
  q2Corrective?: string;
  midTermActual?: string;
  midTermVariance?: string;
  midTermCorrective?: string;
  q3Actual?: string;
  q3Variance?: string;
  q3Corrective?: string;
  q4Actual?: string;
  q4Variance?: string;
  q4Corrective?: string;
  q1Poes: any[];
  q2Poes: any[];
  midTermPoes: any[];
  q3Poes: any[];
  q4Poes: any[];
  score: string;
  createdAt: string;
}

export function KPI({ currentUser, activeTenantId }: KPIProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'capturing'>('brief');
  const [kpis, setKpis] = useState<KpiUnit[]>([]);
  const [strategicObjectives, setStrategicObjectives] = useState<StrategicObjective[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [indicator, setIndicator] = useState('');
  const [baseline, setBaseline] = useState('');
  const [annualTarget, setAnnualTarget] = useState('');
  const [q1Target, setQ1Target] = useState('');
  const [q2Target, setQ2Target] = useState('');
  const [midTermTarget, setMidTermTarget] = useState('');
  const [q3Target, setQ3Target] = useState('');
  const [q4Target, setQ4Target] = useState('');

  // Reporting Fields
  const [q1Actual, setQ1Actual] = useState('');
  const [q1Variance, setQ1Variance] = useState('');
  const [q1Corrective, setQ1Corrective] = useState('');
  const [q2Actual, setQ2Actual] = useState('');
  const [q2Variance, setQ2Variance] = useState('');
  const [q2Corrective, setQ2Corrective] = useState('');
  const [midTermActual, setMidTermActual] = useState('');
  const [midTermVariance, setMidTermVariance] = useState('');
  const [midTermCorrective, setMidTermCorrective] = useState('');
  const [q3Actual, setQ3Actual] = useState('');
  const [q3Variance, setQ3Variance] = useState('');
  const [q3Corrective, setQ3Corrective] = useState('');
  const [q4Actual, setQ4Actual] = useState('');
  const [q4Variance, setQ4Variance] = useState('');
  const [q4Corrective, setQ4Corrective] = useState('');
  const [score, setScore] = useState('');

  const [weighting, setWeighting] = useState('');
  const [unitOfMeasurement, setUnitOfMeasurement] = useState('');
  const [operationalActivity, setOperationalActivity] = useState('');
  const [budgetAllocation, setBudgetAllocation] = useState('');
  const [evidenceRequired, setEvidenceRequired] = useState('');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  
  // POE states for each period
  const [q1Poes, setQ1Poes] = useState<Array<{ id: string; name: string; size: string; date: string }>>([]);
  const [q2Poes, setQ2Poes] = useState<Array<{ id: string; name: string; size: string; date: string }>>([]);
  const [midTermPoes, setMidTermPoes] = useState<Array<{ id: string; name: string; size: string; date: string }>>([]);
  const [q3Poes, setQ3Poes] = useState<Array<{ id: string; name: string; size: string; date: string }>>([]);
  const [q4Poes, setQ4Poes] = useState<Array<{ id: string; name: string; size: string; date: string }>>([]);

  const [notification, setNotification] = useState<string | null>(null);

  // Load KPIs and Strategic Objectives
  useEffect(() => {
    setLoading(true);
    
    // Load strategic objectives to populate dropdown
    fetch(`/api/tenant/${activeTenantId}/strategic-objectives`)
      .then(res => res.ok ? res.json() : { strategicObjectives: [] })
      .then(data => {
        setStrategicObjectives(data.strategicObjectives || []);
      })
      .catch(err => console.error("Error loading strategic objectives:", err));

    // Load KPIs
    fetch(`/api/tenant/${activeTenantId}/kpis`)
      .then(res => res.ok ? res.json() : { kpis: [] })
      .then(data => {
        setKpis(data.kpis || []);
      })
      .catch(err => console.error("Error loading KPIs:", err))
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  // Save changes
  const saveKpisList = async (list: KpiUnit[]) => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/kpis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ kpis: list })
      });
      if (!res.ok) throw new Error("Server failed to save KPIs.");
    } catch (err) {
      console.error("Save KPIs error:", err);
    }
  };

  // Simulated file upload for POEs inside captured KPIs
  const handleFileUpload = (period: 'q1' | 'q2' | 'mid' | 'q3' | 'q4') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files) as File[];
    
    const newPoes = files.map(f => ({
      id: `poe-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: f.name,
      size: `${Math.round(f.size / 102.4) / 10} KB`,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    if (period === 'q1') setQ1Poes(prev => [...prev, ...newPoes]);
    if (period === 'q2') setQ2Poes(prev => [...prev, ...newPoes]);
    if (period === 'mid') setMidTermPoes(prev => [...prev, ...newPoes]);
    if (period === 'q3') setQ3Poes(prev => [...prev, ...newPoes]);
    if (period === 'q4') setQ4Poes(prev => [...prev, ...newPoes]);
  };

  const removeUploadedPoe = (period: 'q1' | 'q2' | 'mid' | 'q3' | 'q4', idToRemove: string) => {
    if (period === 'q1') setQ1Poes(prev => prev.filter(p => p.id !== idToRemove));
    if (period === 'q2') setQ2Poes(prev => prev.filter(p => p.id !== idToRemove));
    if (period === 'mid') setMidTermPoes(prev => prev.filter(p => p.id !== idToRemove));
    if (period === 'q3') setQ3Poes(prev => prev.filter(p => p.id !== idToRemove));
    if (period === 'q4') setQ4Poes(prev => prev.filter(p => p.id !== idToRemove));
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicator.trim() || !baseline.trim() || !annualTarget.trim() || !unitOfMeasurement.trim() || !selectedObjectiveId) {
      alert("Please fill in all mandatory fields, including selecting a Strategic Objective.");
      return;
    }

    const linkedObjective = strategicObjectives.find(o => o.id === selectedObjectiveId);
    const linkedText = linkedObjective ? linkedObjective.title : "Corporate Mandates Alignment";

    const newKpi: KpiUnit = {
      id: `kpi-${Date.now()}`,
      indicator: indicator.trim(),
      baseline: baseline.trim(),
      annualTarget: annualTarget.trim(),
      q1Target: q1Target.trim() || "N/A",
      q2Target: q2Target.trim() || "N/A",
      midTermTarget: midTermTarget.trim() || "N/A",
      q3Target: q3Target.trim() || "N/A",
      q4Target: q4Target.trim() || "N/A",
      q1Actual, q1Variance, q1Corrective,
      q2Actual, q2Variance, q2Corrective,
      midTermActual, midTermVariance, midTermCorrective,
      q3Actual, q3Variance, q3Corrective,
      q4Actual, q4Variance, q4Corrective,
      weighting: "",
      unitOfMeasurement: unitOfMeasurement.trim(),
      operationalActivity: "",
      budgetAllocation: budgetAllocation.trim(),
      evidenceRequired: evidenceRequired.trim() || "Standard Portfolio of Evidence (POE)",
      strategicObjectiveId: selectedObjectiveId,
      strategicObjectiveText: linkedText,
      score: score.trim(),
      q1Poes, q2Poes, midTermPoes, q3Poes, q4Poes,
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [newKpi, ...kpis];
    setKpis(updated);
    await saveKpisList(updated);

    // Auto update/sync with SDBIP
    try {
      const sdbipRes = await fetch(`/api/tenant/${activeTenantId}/sdbip`);
      const sdbipData = sdbipRes.ok ? await sdbipRes.json() : { items: [] };
      const currentItems = Array.isArray(sdbipData.items) ? sdbipData.items : [];

      const newSdbipItem = {
        id: `sdbip-kpi-${Date.now()}`,
        refNum: `KPI-ALIGN-${currentItems.length + 1}`,
        strategicObj: linkedText,
        bsd: linkedObjective?.kpaCategory === "Basic Service Delivery" ? "Y" : "",
        led: linkedObjective?.kpaCategory === "Local Economic Development" ? "Y" : "",
        mfvm: linkedObjective?.kpaCategory === "Municipal Financial viability and management" ? "Y" : "",
        ggpp: linkedObjective?.kpaCategory === "Good Governance and public participation" ? "Y" : "",
        midt: linkedObjective?.kpaCategory === "Municipal Institutional Development and Transformation" ? "Y" : "",
        sr: linkedObjective?.kpaCategory === "Spatial Rationale" ? "Y" : "",
        kpas: unitOfMeasurement.trim(),
        operationalActivity: "",
        kpi: indicator.trim(),
        compliance: "" as any,
        uom: unitOfMeasurement.trim(),
        mscoaTracking: '',
        baseline: baseline.trim(),
        annualTarget: annualTarget.trim(),
        weight: "",
        score: score.trim(),
        budgetAllocation: budgetAllocation.trim() || 'R 0.00',
        q1: q1Target.trim() || "Quarterly assessment complete",
        q2: q2Target.trim() || "Milestone 2 assessed",
        q3: q3Target.trim() || "Milestone 3 assessed",
        q4: q4Target.trim() || "Final targets evaluated",
        responsibleUnit: linkedObjective?.ownerDepartment || 'Performance Auditing Unit',
        poeStatus: (q1Poes.length + q2Poes.length + midTermPoes.length + q3Poes.length + q4Poes.length) > 0 ? "Attached" : 'Not Uploaded',
        // Sync reporting fields too
        q1Actual, q1Variance, q1Corrective,
        q2Actual, q2Variance, q2Corrective,
        midTermActual, midTermVariance, midTermCorrective,
        q3Actual, q3Variance, q3Corrective,
        q4Actual, q4Variance, q4Corrective,
        ragStatus: 'amber' // Default to in-progress
      };

      await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [newSdbipItem, ...currentItems] })
      });

      setNotification(`KPI captured successfully! Automated row created under corresponding columns in SDBIP and Reporting Table.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (sdbipErr) {
      console.error("Failed to sync new KPI to SDBIP table:", sdbipErr);
    }

    // Reset Form fields
    setIndicator('');
    setBaseline('');
    setAnnualTarget('');
    setQ1Target('');
    setQ2Target('');
    setMidTermTarget('');
    setQ3Target('');
    setQ4Target('');
    setQ1Actual(''); setQ1Variance(''); setQ1Corrective('');
    setQ2Actual(''); setQ2Variance(''); setQ2Corrective('');
    setMidTermActual(''); setMidTermVariance(''); setMidTermCorrective('');
    setQ3Actual(''); setQ3Variance(''); setQ3Corrective('');
    setQ4Actual(''); setQ4Variance(''); setQ4Corrective('');
    setWeighting('');
    setUnitOfMeasurement('');
    setOperationalActivity('');
    setBudgetAllocation('');
    setEvidenceRequired('');
    setScore('');
    setSelectedObjectiveId('');
    setQ1Poes([]); setQ2Poes([]); setMidTermPoes([]); setQ3Poes([]); setQ4Poes([]);
  };

  const handleDelete = async (idOfKpi: string) => {
    if (!window.confirm("Are you sure you want to delete this captured KPI?")) {
      return;
    }
    const filtered = kpis.filter(item => item.id !== idOfKpi);
    setKpis(filtered);
    await saveKpisList(filtered);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800">
      {/* Tab/Title Header */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 font-sans uppercase">Key Performance Indicators</h4>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-tight">Departmental Scorecard Tracker</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
              activeTab === 'brief'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Brief
          </button>
          <button
            onClick={() => setActiveTab('capturing')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
              activeTab === 'capturing'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Capturing
          </button>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
        {notification && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            {notification}
          </div>
        )}

        {activeTab === 'brief' ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
              <h5 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Info className="w-5 h-5 text-green-750" />
                South African Regulatory guidelines for KPIs
              </h5>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                A <strong>Key Performance Indicator (KPI)</strong> in South Africa is a highly structured, measurable metric used to gauge a municipality’s progress against its service delivery mandates. It outlines exactly what is being measured, the target to be reached, the timeframe, and the specific evidence required to prove the target was successfully achieved.
              </p>

              <div className="border border-green-100 bg-green-50/10 p-5 rounded-xl">
                <h6 className="text-xs font-extrabold text-green-800 uppercase tracking-tight mb-2">What Information is Contained in a KPI?</h6>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Every structured KPI in a municipal performance plan consists of the following key data points:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-800 uppercase block">1. The Indicator</span>
                    <p className="text-[11px] text-gray-500">A clear, SMART (Specific, Measurable, Achievable, Relevant, Time-bound) description of the metric (e.g., % of households with piped water access etc.).</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-800 uppercase block">2. Baseline & Targets</span>
                    <p className="text-[11px] text-gray-500">The historical starting status paired with annual & quarterly milestones that must be met over the municipal performance cycle.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-800 uppercase block">3. Weighting</span>
                    <p className="text-[11px] text-gray-500">The relative importance of the KPI, usually configured on a range from 1 to 100%, totaling 100% across the department’s primary scorecard.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-800 uppercase block">4. Portfolio of Evidence (POE)</span>
                    <p className="text-[11px] text-gray-500">The strict requirement of concrete documentation (progress certificates, invoices etc.) requested to transparently verify achievements.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <h5 className="text-sm font-bold text-gray-800 uppercase tracking-tight border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-green-700" />
                Inter-Module Alignment Workflow
              </h5>
              
              <ul className="space-y-3.5 text-xs text-gray-600">
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5"></span>
                  <span><strong>Strategic Objectives Dependency:</strong> All KPIs captured here require mapping to a previously submitted Strategic Objective. Captured objectives dynamically register as dropdown listing items in the KPI capturing form.</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5"></span>
                  <span><strong>Automated SDBIP Mapping:</strong> Saving a KPI pushes corresponding operational rows and quarterly indicators down to the SDBIP, allowing departments to manage data seamlessly.</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Form Column */}
            <form onSubmit={handleCommit} className="lg:col-span-5 bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-4">
              <h5 className="text-xs font-bold text-green-700 uppercase tracking-wider pb-2 border-b border-gray-100">
                Capture Key Performance Indicator
              </h5>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">1. Link Strategic Objective <span className="text-red-500">*</span></label>
                <select
                  value={selectedObjectiveId}
                  onChange={e => setSelectedObjectiveId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                >
                  <option value="">Select Captured Strategic Objective...</option>
                  {strategicObjectives.map(obj => (
                    <option key={obj.id} value={obj.id}>{obj.title} ({obj.kpaCategory})</option>
                  ))}
                </select>
                {strategicObjectives.length === 0 && (
                  <span className="text-[10px] text-amber-650 font-medium block mt-1">
                    ⚠️ No Captured Strategic Objectives found for this tenant. Please capture them first in the Strategic Objectives sub-module.
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">2. SMART Indicator Description <span className="text-red-500">*</span></label>
                <textarea
                  value={indicator}
                  onChange={e => setIndicator(e.target.value)}
                  placeholder="e.g., Kilometers of asphalt municipal roads rehabilitated and upgraded in Ward 15"
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white h-16"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">3. Baseline <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={baseline}
                  onChange={e => setBaseline(e.target.value)}
                  placeholder="e.g., 14km upgraded by 2024"
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">4. Unit of Measurement <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={unitOfMeasurement}
                    onChange={e => setUnitOfMeasurement(e.target.value)}
                    placeholder="e.g., Kilometers"
                    className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">5. Annual Target <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={annualTarget}
                    onChange={e => setAnnualTarget(e.target.value)}
                    placeholder="e.g., 5.5km roads upgraded"
                    className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">6. Budget Allocation</label>
                <input
                  type="text"
                  value={budgetAllocation}
                  onChange={e => setBudgetAllocation(e.target.value)}
                  placeholder="e.g., R 1,500,000"
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>

              {/* Quarterly Slits */}
              <div className="p-3 bg-gray-100 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-gray-700 uppercase block mb-1">Quarterly Milestones / Targets</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-semibold text-gray-500 block">Q1 Target</label>
                    <input
                      type="text"
                      value={q1Target}
                      onChange={e => setQ1Target(e.target.value)}
                      placeholder="Q1 target"
                      className="w-full text-[11px] p-2 border border-gray-200 rounded-lg bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-semibold text-gray-500 block">Q2 Target</label>
                    <input
                      type="text"
                      value={q2Target}
                      onChange={e => setQ2Target(e.target.value)}
                      placeholder="Q2 target"
                      className="w-full text-[11px] p-2 border border-gray-200 rounded-lg bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-semibold text-gray-500 block text-indigo-600">Mid-Term Target</label>
                    <input
                      type="text"
                      value={midTermTarget}
                      onChange={e => setMidTermTarget(e.target.value)}
                      placeholder="Mid-term target"
                      className="w-full text-[11px] p-2 border border-indigo-200 rounded-lg bg-indigo-50 outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-semibold text-gray-500 block">Q3 Target</label>
                    <input
                      type="text"
                      value={q3Target}
                      onChange={e => setQ3Target(e.target.value)}
                      placeholder="Q3 target"
                      className="w-full text-[11px] p-2 border border-gray-200 rounded-lg bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-semibold text-gray-500 block">Q4 Target</label>
                    <input
                      type="text"
                      value={q4Target}
                      onChange={e => setQ4Target(e.target.value)}
                      placeholder="Q4 target"
                      className="w-full text-[11px] p-2 border border-gray-200 rounded-lg bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Reporting Subsection */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h6 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  Reporting Capture Section
                </h6>
                
                <div className="space-y-4">
                  {/* Reporting Period Helper */}
                  {[
                    { label: 'Q1 Reporting', actual: q1Actual, setActual: setQ1Actual, variance: q1Variance, setVariance: setQ1Variance, corrective: q1Corrective, setCorrective: setQ1Corrective, poes: q1Poes, period: 'q1' },
                    { label: 'Q2 Reporting', actual: q2Actual, setActual: setQ2Actual, variance: q2Variance, setVariance: setQ2Variance, corrective: q2Corrective, setCorrective: setQ2Corrective, poes: q2Poes, period: 'q2' },
                    { label: 'Mid-Term Reporting', actual: midTermActual, setActual: setMidTermActual, variance: midTermVariance, setVariance: setMidTermVariance, corrective: midTermCorrective, setCorrective: setMidTermCorrective, poes: midTermPoes, period: 'mid', special: true },
                    { label: 'Q3 Reporting', actual: q3Actual, setActual: setQ3Actual, variance: q3Variance, setVariance: setQ3Variance, corrective: q3Corrective, setCorrective: setQ3Corrective, poes: q3Poes, period: 'q3' },
                    { label: 'Q4 Reporting', actual: q4Actual, setActual: setQ4Actual, variance: q4Variance, setVariance: setQ4Variance, corrective: q4Corrective, setCorrective: setQ4Corrective, poes: q4Poes, period: 'q4' }
                  ].map((p, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${p.special ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-700 uppercase">{p.label}</span>
                        <div className="relative overflow-hidden inline-flex">
                           <button type="button" className="px-2 py-1 bg-white border border-gray-200 rounded text-[9px] font-bold flex items-center gap-1">
                             <UploadCloud className="w-3 h-3" /> Upload POE
                           </button>
                           <input 
                            type="file" 
                            multiple 
                            onChange={(e) => handleFileUpload(p.period as any)(e)} 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                           />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <input 
                          type="text" 
                          value={p.actual} 
                          onChange={e => p.setActual(e.target.value)} 
                          placeholder="Actual Progress" 
                          className="w-full text-[10px] p-2 bg-white border border-gray-200 rounded-lg outline-none" 
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={p.variance} 
                            onChange={e => p.setVariance(e.target.value)} 
                            placeholder="Variance" 
                            className="w-full text-[10px] p-2 bg-white border border-gray-200 rounded-lg outline-none" 
                          />
                          <input 
                            type="text" 
                            value={p.corrective} 
                            onChange={e => p.setCorrective(e.target.value)} 
                            placeholder="Corrective Measure" 
                            className="w-full text-[10px] p-2 bg-white border border-gray-200 rounded-lg outline-none" 
                          />
                        </div>
                      </div>
                      {p.poes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.poes.map(file => (
                            <div key={file.id} className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-gray-200 rounded-md text-[8px] font-medium group">
                              <span className="truncate max-w-[60px] text-gray-600">{file.name}</span>
                              <button type="button" onClick={() => removeUploadedPoe(p.period as any, file.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">9. Required Portfolio of Evidence (POE)</label>
                <input
                  type="text"
                  value={evidenceRequired}
                  onChange={e => setEvidenceRequired(e.target.value)}
                  placeholder="e.g., signed progress certificate, site photos"
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">10. Performance Score (1-5 Internal scale)</label>
                <input
                  type="text"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  placeholder="e.g., 4"
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A1A1A] hover:bg-black text-white py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-green-400 mt-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-green-500" />
                Commit KPI Indicator
              </button>
            </form>

            {/* List Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-[#1A1A1A] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-green-500" />
                    <h5 className="text-xs font-bold uppercase">Captured Key Performance Indicators</h5>
                  </div>
                  <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                    KPI Count: {kpis.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-[#F9FAFB] font-bold uppercase text-[10px] tracking-wider border-b border-[#E5E7EB] text-gray-700">
                      <tr>
                        <th className="px-4 py-3">Indicator Information</th>
                        <th className="px-4 py-3">Linked Strategic Objective</th>
                        <th className="px-4 py-3">Targets</th>
                        <th className="px-4 py-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            Loading captured KPIs...
                          </td>
                        </tr>
                      ) : kpis.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                            No KPIs captured yet for this municipality.
                          </td>
                        </tr>
                      ) : (
                        kpis.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 space-y-1 max-w-xs break-words">
                              <span className="font-bold text-gray-900 block">{item.indicator}</span>
                              <div className="flex flex-wrap gap-1 items-center text-[10px] text-gray-500 pt-0.5">
                                <span className="px-1 bg-gray-100 text-gray-700 rounded text-[9px] font-semibold">UOM: {item.unitOfMeasurement}</span>
                                <span className="px-1 bg-blue-50 text-blue-700 rounded text-[9px] font-semibold">Baseline: {item.baseline}</span>
                                {( (item.q1Poes?.length || 0) + (item.q2Poes?.length || 0) + (item.midTermPoes?.length || 0) + (item.q3Poes?.length || 0) + (item.q4Poes?.length || 0) ) > 0 && (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-bold">
                                    {( (item.q1Poes?.length || 0) + (item.q2Poes?.length || 0) + (item.midTermPoes?.length || 0) + (item.q3Poes?.length || 0) + (item.q4Poes?.length || 0) )} POE attached
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 max-w-xxs break-words">
                              <span className="font-medium text-gray-800 block text-[11px] leading-tight mb-1">
                                {item.strategicObjectiveText}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-green-700 block">Linked Objective</span>
                            </td>
                             <td className="px-4 py-3 space-y-1 text-gray-600">
                               <div className="text-[10px] font-bold outline-none flex flex-wrap items-center gap-2">
                                 Annual: <span className="text-green-700 font-mono">{item.annualTarget}</span>
                                 <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 rounded-full uppercase">Budget: {item.budgetAllocation}</span>
                                 {item.score && (
                                   <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 rounded font-black">Score: {item.score}</span>
                                 )}
                               </div>
                               <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 text-[9px] text-gray-400 font-mono font-bold leading-none bg-gray-50 p-1.5 rounded border border-gray-100">
                                 <div className="flex flex-col">
                                   <span className="text-gray-500 underline">Q1: {item.q1Target}</span>
                                   <span className="text-emerald-600">Actual: {item.q1Actual || '---'}</span>
                                   {(item.q1Poes?.length || 0) > 0 && <span className="text-blue-500 font-black">POE: {item.q1Poes?.length}</span>}
                                 </div>
                                 <div className="flex flex-col border-l border-gray-200 pl-1.5">
                                   <span className="text-gray-500 underline">Q2: {item.q2Target}</span>
                                   <span className="text-emerald-600">Actual: {item.q2Actual || '---'}</span>
                                   {(item.q2Poes?.length || 0) > 0 && <span className="text-blue-500 font-black">POE: {item.q2Poes?.length}</span>}
                                 </div>
                                 <div className="flex flex-col col-span-2 bg-indigo-50/50 p-1 rounded mt-1 border-t border-indigo-100">
                                   <span className="text-indigo-800 underline">MID: {item.midTermTarget}</span>
                                   <span className="text-indigo-600">Actual: {item.midTermActual || '---'}</span>
                                   {(item.midTermPoes?.length || 0) > 0 && <span className="text-blue-500 font-black">POE: {item.midTermPoes?.length}</span>}
                                 </div>
                                 <div className="flex flex-col pt-1">
                                   <span className="text-gray-500 underline">Q3: {item.q3Target}</span>
                                   <span className="text-emerald-600">Actual: {item.q3Actual || '---'}</span>
                                   {(item.q3Poes?.length || 0) > 0 && <span className="text-blue-500 font-black">POE: {item.q3Poes?.length}</span>}
                                 </div>
                                 <div className="flex flex-col border-l border-gray-200 pl-1.5 pt-1">
                                   <span className="text-gray-500 underline">Q4: {item.q4Target}</span>
                                   <span className="text-emerald-600">Actual: {item.q4Actual || '---'}</span>
                                   {(item.q4Poes?.length || 0) > 0 && <span className="text-blue-500 font-black">POE: {item.q4Poes?.length}</span>}
                                 </div>
                               </div>
                             </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-200 inline-flex cursor-pointer"
                                title="Delete Captured KPI"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
