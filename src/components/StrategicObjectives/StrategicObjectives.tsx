import React, { useState, useEffect } from 'react';
import { Target, Flag, Trash2, Plus, Info, CheckCircle, Database, Award, ClipboardList, HelpCircle } from 'lucide-react';
import type { User } from '../../types';

interface StrategicObjectivesProps {
  currentUser: User;
  activeTenantId: string;
}

export interface StrategicObjective {
  id: string;
  title: string;
  kpaCategory: string;
  subProgramme: string;
  financialYear: string;
  budgetAllocation: string;
  ownerDepartment: string;
  createdAt: string;
}

const KPA_CATEGORIES = [
  "Basic Service Delivery",
  "Local Economic Development",
  "Municipal Financial viability and management",
  "Good Governance and public participation",
  "Municipal Institutional Development and Transformation",
  "Spatial Rationale"
];

const MUNICIPAL_DEPARTMENTS = [
  "Infrastructure & Basic Services",
  "Local Economic Development Office",
  "Finance & Treasury Department",
  "Good Governance & Public Participation Unit",
  "Corporate Services & Institutional Transformation",
  "Spatial Planning & Land Use Management"
];

export function StrategicObjectives({ currentUser, activeTenantId }: StrategicObjectivesProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'capturing'>('brief');
  const [strategicObjectives, setStrategicObjectives] = useState<StrategicObjective[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [kpaCategory, setKpaCategory] = useState('');
  const [subProgramme, setSubProgramme] = useState('');
  const [financialYear, setFinancialYear] = useState('2025/2026');
  const [budgetAllocation, setBudgetAllocation] = useState('');
  const [ownerDepartment, setOwnerDepartment] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Load existing strategic objectives
  useEffect(() => {
    setLoading(true);
    fetch(`/api/tenant/${activeTenantId}/strategic-objectives`)
      .then(res => res.ok ? res.json() : { strategicObjectives: [] })
      .then(data => {
        setStrategicObjectives(data.strategicObjectives || []);
      })
      .catch(err => console.error("Error loading strategic objectives:", err))
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  // Save changes
  const saveObjectivesList = async (list: StrategicObjective[]) => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/strategic-objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ strategicObjectives: list })
      });
      if (!res.ok) throw new Error("Server failed to save strategic objectives.");
    } catch (err) {
      console.error("Save strategic objectives error:", err);
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !kpaCategory || !subProgramme.trim() || !budgetAllocation.trim() || !ownerDepartment) {
      alert("Please fill in all form fields before committing.");
      return;
    }

    const newObjective: StrategicObjective = {
      id: `so-${Date.now()}`,
      title: title.trim(),
      kpaCategory,
      subProgramme: subProgramme.trim(),
      financialYear,
      budgetAllocation: budgetAllocation.trim(),
      ownerDepartment,
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [newObjective, ...strategicObjectives];
    setStrategicObjectives(updated);
    await saveObjectivesList(updated);

    // Auto update/sync with SDBIP
    try {
      const sdbipRes = await fetch(`/api/tenant/${activeTenantId}/sdbip`);
      const sdbipData = sdbipRes.ok ? await sdbipRes.json() : { items: [] };
      const currentItems = Array.isArray(sdbipData.items) ? sdbipData.items : [];

      const newSdbipItem = {
        id: `sdbip-so-${Date.now()}`,
        refNum: `SO-ALIGN-${currentItems.length + 1}`,
        strategicObj: title.trim(),
        bsd: kpaCategory === "Basic Service Delivery" ? "Y" : "",
        led: kpaCategory === "Local Economic Development" ? "Y" : "",
        mfvm: kpaCategory === "Municipal Financial viability and management" ? "Y" : "",
        ggpp: kpaCategory === "Good Governance and public participation" ? "Y" : "",
        midt: kpaCategory === "Municipal Institutional Development and Transformation" ? "Y" : "",
        sr: kpaCategory === "Spatial Rationale" ? "Y" : "",
        kpas: subProgramme.trim(),
        operationalActivity: `Align strategic activities to support standard municipality goals for: ${title.trim()}`,
        kpi: `Deploy basic support for objective: ${title.trim()}`,
        compliance: 'compliant',
        uom: 'Operational audit checklists complete',
        mscoaTracking: '',
        baseline: 'Standard Framework 2025/2026',
        annualTarget: `100% of objective goals executed`,
        budgetAllocation: budgetAllocation.trim(),
        q1: '25% complete',
        q2: '50% complete',
        q3: '75% complete',
        q4: '105% complete',
        responsibleUnit: ownerDepartment,
        poeStatus: 'Not Uploaded'
      };

      await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [newSdbipItem, ...currentItems] })
      });
      
      setNotification(`Strategic Objective captured successfully! Alignment with SDBIP updated.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (sdbipErr) {
      console.error("Failed to sync new Strategic Objective to SDBIP:", sdbipErr);
    }

    // Reset Form
    setTitle('');
    setKpaCategory('');
    setSubProgramme('');
    setBudgetAllocation('');
    setOwnerDepartment('');
  };

  const handleDelete = async (idOfObjective: string) => {
    if (!window.confirm("Are you sure you want to delete this strategic objective? This will remove its drop-down listing in other modules.")) {
      return;
    }
    const filtered = strategicObjectives.filter(item => item.id !== idOfObjective);
    setStrategicObjectives(filtered);
    await saveObjectivesList(filtered);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800">
      {/* Module Title Section */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 font-sans uppercase">Strategic Objectives Module</h4>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-tight">Municipal Planning Alignment Panel</p>
          </div>
        </div>

        {/* Tab Controls */}
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

      {/* Main Panel Content */}
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
                <Info className="w-5 h-5 text-green-700" />
                Strategic Objectives in South African Municipalities
              </h5>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong>Strategic Objectives</strong> define the longer-term goals that the municipality must achieve under its key performance areas (KPAs). In terms of the Municipal Systems Act (Act 32 of 2000) and National Treasury development frameworks, all municipal strategic objectives must directly align with national guidelines and the long-term vision of the <strong>Integrated Development Plan (IDP)</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-green-700 uppercase block">1. Structured Strategic Intent</span>
                  <p className="text-xs text-gray-650 leading-relaxed">
                    Objectives must provide clear, concise statements of what each specific department aims to accomplish within a 5-year cycle, ensuring that strategic planning does not remain static.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-green-700 uppercase block">2. Budgetary Alignment</span>
                  <p className="text-xs text-gray-650 leading-relaxed">
                    National Treasury guidelines require every strategic objective to be mapped to concrete financial estimates and standard mSCOA focus categories for auditing purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <h5 className="text-sm font-bold text-gray-800 uppercase tracking-tight border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-green-700" />
                Planning Hierarchy & Regulatory Milestones
              </h5>
              
              <ul className="space-y-3.5 text-xs text-gray-600">
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5"></span>
                  <span><strong>National KPAs:</strong> The highest structural level defined by COGTA, encapsulating Basic Service Delivery, Local Economic Development, Financial Viability, Good Governance, and Institutional Transformation.</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5"></span>
                  <span><strong>Strategic Objectives:</strong> Nest directly below National KPAs and map out long-term sector goals which subsequently govern key projects and budgets.</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5"></span>
                  <span><strong>SDBIP & KPI Tracking:</strong> SDBIP is the implementation roadmap. Every strategic objective captured transforms into rows in the SDBIP table and feeds into corresponding dropdown options in the KPI capturing module.</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Capture Form */}
            <form onSubmit={handleCommit} className="lg:col-span-5 bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-4">
              <h5 className="text-xs font-bold text-green-700 uppercase tracking-wider pb-2 border-b border-gray-100">
                Capture Strategic Objective
              </h5>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Objective Statement / Title</label>
                <textarea
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., To ensure reliable water filtration and main pipeline expansion"
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white h-20"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">KPA Category</label>
                <select
                  value={kpaCategory}
                  onChange={e => setKpaCategory(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                >
                  <option value="">Select KPA Category...</option>
                  {KPA_CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Sub-Programme Area</label>
                <input
                  type="text"
                  value={subProgramme}
                  onChange={e => setSubProgramme(e.target.value)}
                  placeholder="e.g., Sanitation, Roads, local tourism"
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Financial Year</label>
                  <select
                    value={financialYear}
                    onChange={e => setFinancialYear(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Budget Allocation</label>
                  <input
                    type="text"
                    value={budgetAllocation}
                    onChange={e => setBudgetAllocation(e.target.value)}
                    placeholder="e.g., R 12,000,000"
                    className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Owner Department</label>
                <select
                  value={ownerDepartment}
                  onChange={e => setOwnerDepartment(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-205 rounded-xl bg-gray-50 outline-none focus:border-green-600 focus:bg-white"
                >
                  <option value="">Select Department Owner...</option>
                  {MUNICIPAL_DEPARTMENTS.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A1A1A] hover:bg-black text-white py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-green-400 mt-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-green-500" />
                Commit Strategic Objective
              </button>
            </form>

            {/* List / Table Area */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-[#1A1A1A] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-green-500" />
                    <h5 className="text-xs font-bold uppercase">Captured Strategic Objectives</h5>
                  </div>
                  <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                    Count: {strategicObjectives.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200 text-gray-700">
                      <tr>
                        <th className="px-4 py-3">Objective Statement</th>
                        <th className="px-4 py-3">KPA & Programme</th>
                        <th className="px-4 py-3">Budget & Owner</th>
                        <th className="px-4 py-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            Loading captured objectives...
                          </td>
                        </tr>
                      ) : strategicObjectives.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                            No strategic objectives captured yet for this municipality.
                          </td>
                        </tr>
                      ) : (
                        strategicObjectives.map(obj => (
                          <tr key={obj.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900 max-w-xs break-words">
                              {obj.title}
                            </td>
                            <td className="px-4 py-3 space-y-0.5 text-gray-500">
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 font-bold uppercase text-[9px] rounded block w-fit">
                                {obj.kpaCategory}
                              </span>
                              <span className="block text-[10px]">{obj.subProgramme}</span>
                            </td>
                            <td className="px-4 py-3 space-y-0.5 text-gray-500">
                              <span className="font-bold text-gray-800 font-mono block">{obj.budgetAllocation}</span>
                              <span className="block text-[10px] truncate max-w-[150px]">{obj.ownerDepartment}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDelete(obj.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-200 inline-flex cursor-pointer"
                                title="Delete Strategic Objective"
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
