import React, { useState, useEffect } from 'react';
import { Flag, Trash2, Plus, Info, CheckCircle, Database, HelpCircle, ArrowRight } from 'lucide-react';
import type { User } from '../../types';

interface KPAProps {
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

export function KPA({ currentUser, activeTenantId }: KPAProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'capturing'>('brief');
  const [kpas, setKpas] = useState<KpaUnit[]>([]);
  const [title, setTitle] = useState('');
  const [nationalKpa, setNationalKpa] = useState('');
  const [parentObjective, setParentObjective] = useState('');
  const [mscoaCode, setMscoaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Load KPAs for this tenant on mount or activeTenantId change
    setLoading(true);
    fetch(`/api/tenant/${activeTenantId}/kpas`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.kpas)) {
          setKpas(data.kpas);
        } else {
          setKpas([]);
        }
      })
      .catch(err => console.error("Failed to load KPAs:", err))
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  const saveKpasList = async (newList: KpaUnit[]) => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/kpas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ kpas: newList })
      });
      if (!res.ok) throw new Error("Server failed to save KPAs.");
    } catch (err) {
      console.error("Save KPAs error:", err);
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !nationalKpa || !parentObjective || !mscoaCode) {
      alert("Please fill in all form fields before committing.");
      return;
    }

    const newUnit: KpaUnit = {
      id: `kpa-${Date.now()}`,
      title: title.trim(),
      nationalKpa,
      parentObjective,
      mscoaCode,
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [newUnit, ...kpas];
    setKpas(updated);
    saveKpasList(updated);

    // Also auto-append to SDBIP lists! We fetch first, append, and save
    try {
      const sdbipRes = await fetch(`/api/tenant/${activeTenantId}/sdbip`);
      const sdbipData = await sdbipRes.json();
      const currentItems = Array.isArray(sdbipData.items) ? sdbipData.items : [];
      
      const newSdbipItem = {
        id: `sdbip-${Date.now()}`,
        refNum: `KPA-MAP-${currentItems.length + 1}`,
        strategicObj: parentObjective,
        bsd: nationalKpa === "Basic Service Delivery" ? "Y" : "",
        led: nationalKpa === "Local Economic Development" ? "Y" : "",
        mfvm: nationalKpa === "Municipal Financial viability and management" ? "Y" : "",
        ggpp: nationalKpa === "Good Governance and public participation" ? "Y" : "",
        midt: nationalKpa === "Municipal Institutional Development and Transformation" ? "Y" : "",
        sr: nationalKpa === "Spatial Rationale" ? "Y" : "",
        kpas: title.trim(),
        operationalActivity: `Standard regulatory operations for ${title.trim()}`,
        kpi: `Quarterly target achievements of ${title.trim()}`,
        compliance: 'compliant',
        uom: 'Milestone reports approved',
        mscoaTracking: mscoaCode,
        baseline: 'Draft Framework 2025',
        annualTarget: '100% compliance met',
        budgetAllocation: 'R 1,500,000',
        q1: '25% complete',
        q2: '50% complete',
        q3: '75% complete',
        q4: '100% complete',
        responsibleUnit: 'Directorate Office',
        poeStatus: 'Not Uploaded'
      };

      await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [newSdbipItem, ...currentItems] })
      });
    } catch (e) {
      console.error("Failed to map KPA to SDBIP top-layer automatically:", e);
    }

    // Reset Form
    setTitle('');
    setNationalKpa('');
    setParentObjective('');
    setMscoaCode('');

    setNotification("KPA committed successfully and SDBIP mapping updated!");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this KPA unit? This won't automatically remove existing historical mappings in SDBIP log lines.")) {
      const updated = kpas.filter(k => k.id !== id);
      setKpas(updated);
      saveKpasList(updated);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col min-h-[600px] overflow-hidden text-slate-800">
      
      {/* Header ribbon tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">Key Performance Areas (KPA)</h1>
            <p className="text-xs text-slate-500">Formulate strategic priorities under Systems Act & National Treasury Guidelines</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-200/60 p-1.5 rounded-xl shrink-0">
          <button 
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'brief' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Module Brief
          </button>
          <button 
            onClick={() => setActiveTab('capturing')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'capturing' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Capturing Suite
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border-y border-emerald-100 px-6 py-3 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* Module Content */}
      <div className="p-6 lg:p-8 flex-1">
        
        {/* BRIEF TAB */}
        {activeTab === 'brief' && (
          <div className="space-y-8 max-w-5xl">
            
            {/* Sec 1 */}
            <div className="space-y-3">
              <h2 className="text-base font-black text-slate-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-emerald-600 font-mono text-xs font-bold">01.</span>
                What Information Does a KPA Contain?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Under the Municipal Systems Act and National Treasury guidelines, a KPA contains structured strategic intent, typically featuring:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-905 uppercase">Strategic Statement</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">A clear description of the long-term goal for that specific sector.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-905 uppercase">Assigned Portfolios</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Identification of which directorates (e.g., Infrastructure, Finance, Corporate Services) own the KPA.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-905 uppercase">Sub-Programmes</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">The core focus areas nested under it (e.g., under "Basic Service Delivery," Water, Sanitation, and Electricity).</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-905 uppercase font-sans">Baseline Indicators</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">High-level strategic metrics that summarize the current state of that entire sector.</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2.5 mt-4">
                <p className="text-xs font-bold text-emerald-900 uppercase">Mandatory COGTA Standard National KPAs (every municipality):</p>
                <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-700 list-decimal pl-5">
                  <li>Basic Service Delivery and Infrastructure Development.</li>
                  <li>Local Economic Development (LED).</li>
                  <li>Municipal Financial Viability and Management.</li>
                  <li>Good Governance and Public Participation.</li>
                  <li>Municipal Institutional Development and Transformation.</li>
                  <li>Spatial Rationale (often added to align with spatial planning).</li>
                </ol>
              </div>
            </div>

            {/* Sec 2 */}
            <div className="space-y-4">
              <h2 className="text-base font-black text-slate-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-emerald-600 font-mono text-xs font-bold">02.</span>
                What Is a KPA Aligned To?
              </h2>
              <p className="text-xs text-slate-600">
                KPAs serve as the structural "bridge" between high-level political promises and daily administrative work. They align directly to:
              </p>

              {/* ASCII Strategic Flowchart Diagram */}
              <div className="bg-slate-900 text-slate-300 font-mono p-5 rounded-2xl text-xs space-y-1 overflow-x-auto shadow-inner border border-slate-850 select-text max-w-full">
                <div>  ┌────────────────────────────────────────────────────────┐</div>
                <div>  │         National Development Plan (NDP 2030)           │</div>
                <div>  └───────────────────────────┬────────────────────────────┘</div>
                <div className="text-emerald-400">                              ▼</div>
                <div>  ┌────────────────────────────────────────────────────────┐</div>
                <div>  │        Integrated Development Plan (IDP) KPAs          │</div>
                <div>  └───────────────────────────┬────────────────────────────┘</div>
                <div className="text-emerald-400">                              ▼</div>
                <div>  ┌────────────────────────────────────────────────────────┐</div>
                <div>  │  Service Delivery & Budget Implementation Plan (SDBIP) │</div>
                <div>  └───────────────────────────┬────────────────────────────┘</div>
                <div className="text-emerald-400">                              ▼</div>
                <div>  ┌────────────────────────────────────────────────────────┐</div>
                <div>  │      Section 56/57 Director Performance Contracts      │</div>
                <div>  └────────────────────────────────────────────────────────┘</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">The IDP and Budget:</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    The IDP chapters and the mSCOA Strategic Segment are organized directly around these KPAs to ensure every rand spent matches a strategic pillar.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">National Outcomes:</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    They map directly to national priorities, such as the National Development Plan (NDP) 2030 and Back to Basics (B2B) pillars.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Performance Contracts (Section 56/57):</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    The MM and Executive Directors have their annual performance contracts structured around these exact KPAs. Their bonuses or renewals depend strictly on target success.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">MFMA Circular 88:</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Aligned to National Treasury’s standardized sectoral indicators for uniform reporting across the country.
                  </p>
                </div>
              </div>
            </div>

            {/* Sec 3 */}
            <div className="space-y-3">
              <h2 className="text-base font-black text-slate-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-emerald-600 font-mono text-xs font-bold">03.</span>
                Where Does the Information Come From?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                The strategy and mandates that build a KPA are compiled from several regulatory, macro-economic, and internal sources:
              </p>
              <ul className="space-y-2 text-xs list-disc pl-5 text-slate-600">
                <li>
                  <strong className="text-slate-800">National and Provincial Legislation:</strong> Frameworks like the Municipal Finance Management Act (MFMA) dictate the parameters for the Financial Viability KPA, while the Constitution dictates the Basic Service Delivery KPA.
                </li>
                <li>
                  <strong className="text-slate-800">The Political Mandate:</strong> The ruling party's local government election manifesto and the Mayor's strategic term priorities.
                </li>
                <li>
                  <strong className="text-slate-800">National Treasury Circulars:</strong> Specific performance expectations, reporting rules, and compliance standards (like Circular 88).
                </li>
                <li>
                  <strong className="text-slate-800">The Auditor-General of South Africa (AGSA):</strong> Previous audit reports highlight systemic failures, forcing municipalities to adjust their Good Governance and Financial Viability KPAs to address recurring findings.
                </li>
              </ul>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => setActiveTab('capturing')}
                className="px-5 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                Go to Capturing Suite <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

          </div>
        )}

        {/* CAPTURING TAB */}
        {activeTab === 'capturing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Captured image mock terminal */}
              <div className="bg-white border-2 border-slate-150 rounded-3xl p-6 lg:p-8 space-y-6 shadow-md relative">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">FUNCTIONAL ENTRY TERMINAL</h3>
                </div>

                <form onSubmit={handleCommit} className="space-y-5 select-text">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        1. FUNCTIONAL AREA (KPA) TITLE
                      </label>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Water Infrastructure..."
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 placeholder:text-slate-350"
                      />
                    </div>

                    {/* National KPA dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        2. NATIONAL KPA
                      </label>
                      <select 
                        value={nationalKpa}
                        onChange={(e) => setNationalKpa(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 cursor-pointer"
                      >
                        <option value="">Select National KPA...</option>
                        {NATIONAL_KPAS.map((k, kIdx) => (
                          <option key={kIdx} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>

                    {/* Parent Strategic Objective dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        3. PARENT STRATEGIC OBJECTIVE
                      </label>
                      <select 
                        value={parentObjective}
                        onChange={(e) => setParentObjective(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 cursor-pointer"
                      >
                        <option value="">Select Strategic Anchor...</option>
                        {STRATEGIC_OBJECTIVES.map((o, oIdx) => (
                          <option key={oIdx} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    {/* mSCOA Alignment Code dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        4. MSCOA ALIGNMENT CODE
                      </label>
                      <select 
                        value={mscoaCode}
                        onChange={(e) => setMscoaCode(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 cursor-pointer"
                      >
                        <option value="">Select mSCOA Code...</option>
                        {MSCOA_CODES.map((c, cIdx) => (
                          <option key={cIdx} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Commit KPA Unit Button styling matching the image precisely */}
                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit"
                      className="px-7 py-3.5 bg-[#0e1629] text-white hover:bg-slate-800 font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-sans"
                    >
                      COMMIT KPA UNIT
                    </button>
                  </div>

                </form>
              </div>

            </div>

            {/* List Sidebar Column */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase">Currently Captured KPAs</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Below items are fully mapped on Supabase & top-layer systems</p>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs font-medium text-slate-500 font-sans">
                  Loading KPAs from database...
                </div>
              ) : kpas.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs font-medium text-slate-400 space-y-1">
                  <Database className="w-5 h-5 mx-auto text-slate-350" />
                  <p>No custom KPAs registered yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {kpas.map((kpa) => (
                    <div key={kpa.id} className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-2 relative shadow-xs">
                      <button 
                        onClick={() => handleDelete(kpa.id)}
                        className="absolute top-2.5 right-2 text-slate-300 hover:text-rose-500 duration-150"
                        title="Delete target KPA"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">{kpa.nationalKpa}</span>
                        <h5 className="text-xs font-black text-slate-800 uppercase leading-snug pr-5">{kpa.title}</h5>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5 font-sans border-t border-slate-50 pt-2">
                        <p><strong>Anchor:</strong> <span className="text-slate-650">{kpa.parentObjective}</span></p>
                        <p><strong>mSCOA Tracking:</strong> <span className="font-mono text-emerald-700 font-semibold">{kpa.mscoaCode}</span></p>
                        <p className="text-[9px] text-slate-405 italic pt-1 text-right">Registered {kpa.createdAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
