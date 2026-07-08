import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Briefcase, Shield, FileText, CheckCircle2, 
  Activity, Flame, Plus, Trash2, Edit, Save, BookOpen, 
  Sparkles, TrendingDown, Layers, Send, RefreshCw, ChevronRight, 
  Check, Archive, ShieldAlert, Award, FileSpreadsheet, Eye
} from 'lucide-react';
import type { User } from '../types';

interface RiskManagementProps {
  currentUser: User;
  activeTenantId: string;
}

interface RiskType {
  id: string;
  name: string;
  description: string;
  inherentThreat: string;
  typicalSources: string[];
}

interface RiskTemplate {
  id: string;
  title: string;
  category: string;
  inherentImpact: number;
  inherentLikelihood: number;
  typicalControls: string[];
  responsibleOfficer: string;
}

interface ActiveRiskDraft {
  id: string;
  title: string;
  category: string;
  inherentImpact: number;
  inherentLikelihood: number;
  preventativeControls: string;
  correctiveControls: string;
  residualImpact: number;
  residualLikelihood: number;
  responsibleOfficer: string;
  status: 'Drafting' | 'In Progress' | 'Mitigated' | 'Critical';
  targetDate: string;
  progress: number;
}

export function RiskManagement({ currentUser, activeTenantId }: RiskManagementProps) {
  const [activeTab, setActiveTab ] = useState<'brief' | 'types' | 'templates' | 'suite'>('brief');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Core state synced to Supabase
  const [riskTypes, setRiskTypes] = useState<RiskType[]>([]);
  const [templates, setTemplates] = useState<RiskTemplate[]>([]);
  const [drafts, setDrafts] = useState<ActiveRiskDraft[]>([]);

  // Form State for creating custom risk types
  const [newType, setNewType] = useState({
    name: '',
    description: '',
    inherentThreat: 'Medium',
    typicalSources: ''
  });

  // Form State for custom risk templates
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    category: 'Strategic Risks',
    inherentImpact: 3,
    inherentLikelihood: 3,
    typicalControls: '',
    responsibleOfficer: ''
  });

  // Form State for Active Risk Drafts
  const [isEditingDraft, setIsEditingDraft] = useState<string | null>(null);
  const [draftForm, setDraftForm] = useState<Partial<ActiveRiskDraft>>({
    title: '',
    category: 'Strategic Risks',
    inherentImpact: 3,
    inherentLikelihood: 3,
    preventativeControls: '',
    correctiveControls: '',
    residualImpact: 2,
    residualLikelihood: 2,
    responsibleOfficer: '',
    status: 'Drafting',
    targetDate: new Date().toISOString().split('T')[0],
    progress: 10
  });

  // Default Seeding Data for cold starts
  const defaultRiskTypes: RiskType[] = [
    {
      id: 'rt-1',
      name: 'Strategic Risks',
      description: 'Threats targeting IDP execution, long-term political instability, and failure of LED strategic alignment.',
      inherentThreat: 'High',
      typicalSources: ['Strategic Plans', 'IDP Community Forums', 'LED Failures']
    },
    {
      id: 'rt-2',
      name: 'Operational Risks',
      description: 'Infrastructure downtime, water/electricity sanitation disruption, critical asset loss, and labor disputes under MFMA.',
      inherentThreat: 'High',
      typicalSources: ['Line Managers', 'Asset Registers', 'Compliance Audit Logs']
    },
    {
      id: 'rt-3',
      name: 'Financial Risks',
      description: 'Revenue collection deficit, poor credit control, irregular expenditure, clean audit targets failure.',
      inherentThreat: 'Critical',
      typicalSources: ['Auditor-General SA Reports', 'Quarterly MFMA Financials', 'Internal Audit']
    },
    {
      id: 'rt-4',
      name: 'Compliance & Legal Risks',
      description: 'Breaches of Section 62 of the MFMA, procurement regulations bypass, legal litigation from labor unions and suppliers.',
      inherentThreat: 'Medium',
      typicalSources: ['National Treasury circulars', 'Irregular expenditure registers']
    },
    {
      id: 'rt-5',
      name: 'Environmental & Health Risks',
      description: 'Severe weather-induced floods, water quality pollution, illegal dumping site contamination.',
      inherentThreat: 'High',
      typicalSources: ['Provincial forecasts', 'Water testing logs']
    }
  ];

  const defaultTemplates: RiskTemplate[] = [
    {
      id: 'temp-1',
      title: 'Revenue Collection Underperformance',
      category: 'Financial Risks',
      inherentImpact: 5,
      inherentLikelihood: 4,
      typicalControls: ['Implement automated smart water-meter billing audits', 'Establish dedicated legal recourse task-force for commercial defaults', 'Deploy real-time billing validation screens on Mzansi Flow App.'],
      responsibleOfficer: 'Chief Financial Officer'
    },
    {
      id: 'temp-2',
      title: 'Water Treatment Facility Disruption & Contamination',
      category: 'Operational Risks',
      inherentImpact: 5,
      inherentLikelihood: 3,
      typicalControls: ['Install automated backup generators at critical pump channels', 'Establish continuous microbiological water purity surveillance', 'Sign strict emergency SLA chemical supply contracts.'],
      responsibleOfficer: 'Director of Technical Services'
    },
    {
      id: 'temp-3',
      title: 'Supply Chain Management MFMA Section 62 Non-compliance',
      category: 'Compliance & Legal Risks',
      inherentImpact: 4,
      inherentLikelihood: 4,
      typicalControls: ['Establish peer-review committees on bid awards above R200k', 'Integrate digital automated conflict-of-interest testing protocols', 'Enroll supply-chain personnel in compliance retraining.'],
      responsibleOfficer: 'Supply Chain Manager'
    },
    {
      id: 'temp-4',
      title: 'Sub-optimal SDBIP Performance Milestones Triggering Protests',
      category: 'Strategic Risks',
      inherentImpact: 4,
      inherentLikelihood: 3,
      typicalControls: ['Setup bi-weekly project performance diagnostic dashboards', 'Establish early warning alert matrices for capital projects under 40% execution', 'Publish periodic service delivery progress leaflets.'],
      responsibleOfficer: 'Municipal Manager'
    }
  ];

  const defaultDrafts: ActiveRiskDraft[] = [
    {
      id: 'draft-1',
      title: 'Critical Billing System Server Downtime during Month-End Run',
      category: 'Operational Risks',
      inherentImpact: 5,
      inherentLikelihood: 4,
      preventativeControls: 'Routine mirror databases, offsite continuous syncs, automated SLA response for server recovery.',
      correctiveControls: 'Temporary manual backup reception gates, fast system-restore exercises and fallback communication networks.',
      residualImpact: 3,
      residualLikelihood: 2,
      responsibleOfficer: 'Chief Information Officer (CIO)',
      status: 'In Progress',
      targetDate: '2026-07-15',
      progress: 65
    },
    {
      id: 'draft-2',
      title: 'Land Invasion & Informal Housing Expansion on IDP Designated Lands',
      category: 'Strategic Risks',
      inherentImpact: 4,
      inherentLikelihood: 5,
      preventativeControls: 'Establishing perimeter fencing, daily security patrol vectors, early zoning flags in geographical databases.',
      correctiveControls: 'Rapid-response legal standard action orders, proactive relocate discussions aligned with local LED programs.',
      residualImpact: 3,
      residualLikelihood: 3,
      responsibleOfficer: 'Director of Human Settlements',
      status: 'Drafting',
      targetDate: '2026-09-01',
      progress: 25
    }
  ];

  // Fetch Risk Management Context from Supabase
  const loadRiskManagement = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/risk-management`);
      if (res.ok) {
        const data = await res.json();
        setRiskTypes(data.typesOfRisks && data.typesOfRisks.length > 0 ? data.typesOfRisks : defaultRiskTypes);
        setTemplates(data.templates && data.templates.length > 0 ? data.templates : defaultTemplates);
        setDrafts(data.drafts && data.drafts.length > 0 ? data.drafts : defaultDrafts);
      } else {
        setRiskTypes(defaultRiskTypes);
        setTemplates(defaultTemplates);
        setDrafts(defaultDrafts);
      }
    } catch (e) {
      console.error("Cold start loading error:", e);
      setRiskTypes(defaultRiskTypes);
      setTemplates(defaultTemplates);
      setDrafts(defaultDrafts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskManagement();
  }, [activeTenantId]);

  // Persist State directly back to Supabase
  const persistContext = async (updatedTypes: RiskType[], updatedTemplates: RiskTemplate[], updatedDrafts: ActiveRiskDraft[]) => {
    setIsLoading(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/risk-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typesOfRisks: updatedTypes,
          templates: updatedTemplates,
          drafts: updatedDrafts
        })
      });

      if (res.ok) {
        setSaveStatus({ type: 'success', msg: 'Risk management registry successfully synchronized to Supabase cloud.' });
        setRiskTypes(updatedTypes);
        setTemplates(updatedTemplates);
        setDrafts(updatedDrafts);
      } else {
        const err = await res.json();
        setSaveStatus({ type: 'error', msg: err.error || 'Server rejected synchronization.' });
      }
    } catch (e) {
      setSaveStatus({ type: 'error', msg: 'Network failure persisting to Supabase storage pipeline.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Add Risk Type
  const handleAddRiskType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.name || !newType.description) return;
    
    const sourcesList = newType.typicalSources 
      ? newType.typicalSources.split(',').map(s => s.trim()) 
      : ['General Internal Audits'];

    const added: RiskType = {
      id: `rt-${Date.now()}`,
      name: newType.name,
      description: newType.description,
      inherentThreat: newType.inherentThreat,
      typicalSources: sourcesList
    };

    const nextList = [...riskTypes, added];
    persistContext(nextList, templates, drafts);
    setNewType({ name: '', description: '', inherentThreat: 'Medium', typicalSources: '' });
  };

  // 2. Clear Risk Type
  const handleDeleteRiskType = (id: string) => {
    const nextList = riskTypes.filter(rt => rt.id !== id);
    persistContext(nextList, templates, drafts);
  };

  // 3. Add Custom Template
  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.responsibleOfficer) return;

    const typicalControlsList = newTemplate.typicalControls
      ? newTemplate.typicalControls.split(',').map(c => c.trim())
      : ['Quarterly performance tracking review'];

    const added: RiskTemplate = {
      id: `temp-${Date.now()}`,
      title: newTemplate.title,
      category: newTemplate.category,
      inherentImpact: Number(newTemplate.inherentImpact),
      inherentLikelihood: Number(newTemplate.inherentLikelihood),
      typicalControls: typicalControlsList,
      responsibleOfficer: newTemplate.responsibleOfficer
    };

    const nextList = [...templates, added];
    persistContext(riskTypes, nextList, drafts);
    setNewTemplate({
      title: '',
      category: 'Strategic Risks',
      inherentImpact: 3,
      inherentLikelihood: 3,
      typicalControls: '',
      responsibleOfficer: ''
    });
  };

  // 4. Delete Template
  const handleDeleteTemplate = (id: string) => {
    const nextList = templates.filter(t => t.id !== id);
    persistContext(riskTypes, nextList, drafts);
  };

  // 5. Deploy Template directly to Live Drafting Suite
  const handleDeployTemplate = (temp: RiskTemplate) => {
    const deployed: ActiveRiskDraft = {
      id: `draft-${Date.now()}`,
      title: temp.title,
      category: temp.category,
      inherentImpact: temp.inherentImpact,
      inherentLikelihood: temp.inherentLikelihood,
      preventativeControls: temp.typicalControls.join('; '),
      correctiveControls: 'Establish contingency action committees and emergency protocols.',
      residualImpact: Math.max(1, temp.inherentImpact - 1),
      residualLikelihood: Math.max(1, temp.inherentLikelihood - 1),
      responsibleOfficer: temp.responsibleOfficer,
      status: 'Drafting',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 15
    };

    const nextList = [deployed, ...drafts];
    persistContext(riskTypes, templates, nextList);
    setActiveTab('suite');
    
    // Open immediately for editing
    handleOpenEditDraft(deployed);
  };

  // 6. Active Draft Helpers
  const handleOpenEditDraft = (draft: ActiveRiskDraft) => {
    setIsEditingDraft(draft.id);
    setDraftForm({ ...draft });
  };

  const handleCreateEmptyDraft = () => {
    const freshId = `draft-${Date.now()}`;
    const fresh: ActiveRiskDraft = {
      id: freshId,
      title: 'New Municipal Risk Project',
      category: 'Strategic Risks',
      inherentImpact: 3,
      inherentLikelihood: 3,
      preventativeControls: '',
      correctiveControls: '',
      residualImpact: 2,
      residualLikelihood: 2,
      responsibleOfficer: 'Risk Manager Officer',
      status: 'Drafting',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 10
    };
    setIsEditingDraft(freshId);
    setDraftForm(fresh);
  };

  const handleSaveDraftChanges = () => {
    if (!draftForm.title || !draftForm.id) return;
    
    // Update array
    const updated = drafts.map(d => {
      if (d.id === draftForm.id) {
        return draftForm as ActiveRiskDraft;
      }
      return d;
    });

    // Check if it was brand-new
    const exists = drafts.some(d => d.id === draftForm.id);
    const nextList = exists ? updated : [draftForm as ActiveRiskDraft, ...drafts];

    persistContext(riskTypes, templates, nextList);
    setIsEditingDraft(null);
  };

  const handleDeleteDraft = (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this risk active draft from Supabase?')) return;
    const nextList = drafts.filter(d => d.id !== id);
    persistContext(riskTypes, templates, nextList);
  };

  // Helpers to compute risk ratings & colors
  const getRatingSummary = (impact: number, likelihood: number) => {
    const score = impact * likelihood;
    if (score >= 15) return { label: 'HIGH', css: 'bg-red-100 text-red-800 border-red-200' };
    if (score >= 9) return { label: 'MEDIUM', css: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'LOW', css: 'bg-green-100 text-green-800 border-green-200' };
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
      {/* Premium Header */}
      <div className="bg-slate-900 text-white p-6 shrink-0 flex flex-col md:flex-row md:items-center justify-between shadow-lg relative z-20 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 opacity-100" />
            <AlertTriangle className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              OPMS Enterprise Risk Management <span className="text-[10px] bg-red-500/80 text-white px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-widest leading-none">Standardized Suite</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              National Treasury compliant risk oversight, preventative controls mapping, & residual indices.
            </p>
          </div>
        </div>
        
        {/* Supabase Pipeline Connection Status */}
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono tracking-widest text-slate-300 font-extrabold uppercase">
            Supabase Connection Secured
          </span>
        </div>
      </div>

      {/* Persistence Notification Alert Banner */}
      {saveStatus && (
        <div className={`p-4 gap-3 flex items-center shrink-0 border-b text-xs font-bold ${saveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1">{saveStatus.msg}</div>
          <button onClick={() => setSaveStatus(null)} className="hover:underline px-1 py-0.5 text-[10px] uppercase">Dismiss</button>
        </div>
      )}

      {/* Tabs list bar */}
      <div className="flex bg-slate-200/60 border-b border-slate-200 shrink-0 px-6 gap-2">
        <button 
          onClick={() => { setActiveTab('brief'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'brief' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <BookOpen className="w-4 h-4 text-red-500" /> Administrative Brief
        </button>
        <button 
          onClick={() => { setActiveTab('types'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'types' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Layers className="w-4 h-4 text-orange-500" /> 1. Types of Risks
        </button>
        <button 
          onClick={() => { setActiveTab('templates'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'templates' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-500" /> 2. Risk Templates
        </button>
        <button 
          onClick={() => { setActiveTab('suite'); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'suite' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Activity className="w-4 h-4 text-emerald-500" /> 3. Risk Drafting Suite
          {drafts.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white font-mono rounded-full text-[9px] font-bold">
              {drafts.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
        <div className="max-w-6xl mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-600" /> Synchronizing data structures...
            </div>
          )}

          {/* TAB 1: BRIEF */}
          {activeTab === 'brief' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/30 rounded-bl-full pointer-events-none -z-10" />
                
                <h2 className="text-xl font-bold font-sans text-slate-900 mb-2 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-600 shrink-0" /> Enterprise Risk Framework Directive
                </h2>
                <div className="h-0.5 w-20 bg-red-500 mb-4" />
                
                <p className="text-sm text-slate-700 leading-relaxed font-normal bg-slate-50 border-l-4 border-slate-500 p-5 rounded-r-2xl mb-8">
                  Municipal risk management in South Africa is a structured, continuous process used to identify, assess, and mitigate threats that could prevent a municipality from achieving its service delivery, financial, and strategic objectives. It shifts risk from a reactive problem into proactive, integrated decision-making.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Aligned to */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-600 flex items-center gap-2">
                      <Award className="w-5 h-5" /> 1. Operational Alignment Parameters
                    </h3>
                    <p className="text-xs text-slate-500">
                      Our municipal frameworks are deeply aligned to constitutional imperatives and governance benchmarks:
                    </p>

                    <div className="space-y-3">
                      <div className="bg-slate-55 border border-slate-150 p-4 rounded-2xl flex gap-3.5">
                        <div className="text-xs font-black bg-red-100 text-red-800 h-7 w-7 rounded-lg flex items-center justify-center shrink-0">
                          MFMA
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wider">MFMA Act No. 56 of 2003</h4>
                          <p className="text-[11px] text-slate-605 mt-1 leading-relaxed">
                            Specifically <strong>Section 62(1)(c)</strong>, which mandates municipalities to maintain effective, efficient, and transparent systems of risk management.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-55 border border-slate-150 p-4 rounded-2xl flex gap-3.5">
                        <div className="text-xs font-black bg-orange-100 text-orange-850 h-7 w-7 rounded-lg flex items-center justify-center shrink-0">
                          PSRMF
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Public Sector Risk Framework</h4>
                          <p className="text-[11px] text-slate-605 mt-1 leading-relaxed">
                            Issued by the National Treasury, outlining the standard public-sector approach to managing operational exposure risk arrays and preventing fraud.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-55 border border-slate-150 p-4 rounded-2xl flex gap-3.5">
                        <div className="text-xs font-black bg-amber-100 text-amber-850 h-7 w-7 rounded-lg flex items-center justify-center shrink-0">
                          ISO
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wider">International ISO 31000</h4>
                          <p className="text-[11px] text-slate-605 mt-1 leading-relaxed">
                            Municipal frameworks leverage industry best-practice standards globally for Enterprise Risk Management (ERM) strategies.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Information Sources */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-600 flex items-center gap-2">
                      <Send className="w-5 h-5" /> 2. Sources of Risk Information & Telemetry
                    </h3>
                    <p className="text-xs text-slate-500 text-justify">
                      To build an accurate enterprise view, intelligence is piped into our risk registers from both internal operational matrices and external oversight agencies:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-2">
                        <h4 className="font-bold text-xs text-slate-850 flex items-center gap-1.5 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Internal Channels
                        </h4>
                        <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-550 leading-relaxed pl-1">
                          <li><strong>Line Managers & Directors:</strong> Identify departmental, project list or infrastructural block risks.</li>
                          <li><strong>Internal Audit Reports:</strong> Disclose key control failures or compliance loops.</li>
                          <li><strong>Financial Matrices:</strong> Integrated SDBIPs, IDP milestones, and Audit correction registers.</li>
                          <li><strong>FARMCOs:</strong> Dedicated committees reviewing register items periodically.</li>
                        </ul>
                      </div>

                      <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-2">
                        <h4 className="font-bold text-xs text-slate-850 flex items-center gap-1.5 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> External Pipelines
                        </h4>
                        <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-550 leading-relaxed pl-1">
                          <li><strong>National & Provincial Treasury:</strong> Guidelines, baseline indices, economic projections.</li>
                          <li><strong>Auditor-General SA:</strong> Core audit findings and material irregularity alerts.</li>
                          <li><strong>Community Feedback:</strong> Public participation petitions regarding service deliveries.</li>
                          <li><strong>Professional Bodies:</strong> Global risk criteria from IRMSA.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>South Africa Municipal Risk Alignment Active (MFMA Section 62 Compliant)</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('types')} 
                    className="flex items-center gap-1.5 text-red-600 font-bold uppercase tracking-wider hover:underline"
                  >
                    View Classifications <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPES OF RISKS */}
          {activeTab === 'types' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {riskTypes.map((type) => (
                  <div key={type.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col group relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-2 h-full bg-slate-900 group-hover:bg-red-500 transition-colors" />
                    <div className="flex items-start justify-between mb-3.5">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded border ${
                        type.inherentThreat === 'Critical' ? 'bg-red-50 border-red-200 text-red-700' :
                        type.inherentThreat === 'High' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        Inherent: {type.inherentThreat}
                      </span>
                      <button 
                        onClick={() => handleDeleteRiskType(type.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete classification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-500" /> {type.name}
                    </h3>
                    <p className="text-[11px] text-slate-550 leading-relaxed mb-4 flex-1">
                      {type.description}
                    </p>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">Telemetry Intake Channels:</span>
                      <div className="flex flex-wrap gap-1">
                        {type.typicalSources.map((source, index) => (
                          <span key={index} className="px-1.5 py-0.5 bg-slate-100 text-slate-705 text-[9px] font-mono rounded">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Risk Classification Card */}
              <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-red-550" /> Register Custom Risk Classification (Strict Supabase Pipeline)
                </h3>
                <form onSubmit={handleAddRiskType} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Classification Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. IT & Technological Risks"
                      value={newType.name}
                      onChange={e => setNewType({ ...newType, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Diagnostic Scope Description</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Define typical operational impacts with MFMA context"
                      value={newType.description}
                      onChange={e => setNewType({ ...newType, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="space-y-1 flex-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Baseline Threat</label>
                      <select 
                        value={newType.inherentThreat}
                        onChange={e => setNewType({ ...newType, inherentThreat: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 bg-white outline-none focus:border-red-500"
                      >
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-lg h-[34px] uppercase tracking-wider transition-colors shrink-0"
                    >
                      Save to Cloud
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: RISK TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-800 text-white p-5 rounded-2xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> South Africa Municipal Reference Template Library
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Pre-configured risk profiles featuring default impact models and preventative control catalogs. Deploy directly to audit workspaces.
                  </p>
                </div>
                <div className="text-[10px] bg-slate-700/60 py-1.5 px-3 rounded-lg font-mono border border-slate-650">
                  Secured Templates: {templates.length} Active Presets
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((temp) => {
                  const rating = getRatingSummary(temp.inherentImpact, temp.inherentLikelihood);
                  return (
                    <div key={temp.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-amber-300 transition-colors flex flex-col relative group">
                      <div className="absolute right-4 top-4 border-l-2 border-amber-500 pl-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Responsible Node</span>
                        <span className="text-[10px] font-bold text-slate-700">{temp.responsibleOfficer}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase border border-slate-200">
                          {temp.category}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${rating.css}`}>
                          Inherent Index: {rating.label} ({temp.inherentImpact * temp.inherentLikelihood})
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-slate-900 mb-3 group-hover:text-amber-700 transition-colors">
                        {temp.title}
                      </h3>

                      <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-150 space-y-2.5 flex-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" /> Standard Preventative Control Catalog:
                        </span>
                        <ul className="space-y-1.5 pl-1.5">
                          {temp.typicalControls.map((ctrl, index) => (
                            <li key={index} className="text-[10px] text-slate-600 leading-relaxed list-decimal list-inside text-justify">
                              {ctrl}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <button 
                          onClick={() => handleDeleteTemplate(temp.id)}
                          className="text-slate-400 hover:text-red-500 text-xs flex items-center gap-1 transition-colors"
                          title="Remove template"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Template
                        </button>
                        <button 
                          onClick={() => handleDeployTemplate(temp)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" /> Deploy to Drafting Suite
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Risk Template */}
              <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-550" /> Add Custom Risk Template Preset
                </h3>
                <form onSubmit={handleAddTemplate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Risk Title</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Irregular Bid Specification Formulation"
                        value={newTemplate.title}
                        onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Categorization</label>
                      <select 
                        value={newTemplate.category}
                        onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 bg-white outline-none focus:border-amber-500"
                      >
                        {riskTypes.map(rt => (
                          <option key={rt.id} value={rt.name}>{rt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Responsible Lead Officer</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Chief Risk Officer"
                        value={newTemplate.responsibleOfficer}
                        onChange={e => setNewTemplate({ ...newTemplate, responsibleOfficer: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Inherent Impact (1-5)</label>
                      <select 
                        value={newTemplate.inherentImpact}
                        onChange={e => setNewTemplate({ ...newTemplate, inherentImpact: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 bg-white outline-none focus:border-amber-500"
                      >
                        <option value="1">1 - Minimal</option>
                        <option value="2">2 - Minor</option>
                        <option value="3">3 - Moderate</option>
                        <option value="4">4 - Major</option>
                        <option value="5">5 - Catastrophic</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Inherent Likelihood (1-5)</label>
                      <select 
                        value={newTemplate.inherentLikelihood}
                        onChange={e => setNewTemplate({ ...newTemplate, inherentLikelihood: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 bg-white outline-none focus:border-amber-500"
                      >
                        <option value="1">1 - Rare</option>
                        <option value="2">2 - Unlikely</option>
                        <option value="3">3 - Possible</option>
                        <option value="4">4 - Likely</option>
                        <option value="5">5 - Almost Certain</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Standard Controls (Comma-separated)</label>
                      <input 
                        type="text" 
                        placeholder="Control A, Control B, Control C"
                        value={newTemplate.typicalControls}
                        onChange={e => setNewTemplate({ ...newTemplate, typicalControls: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs px-5 py-2.5 rounded-lg uppercase tracking-wider transition-colors"
                    >
                      Save Template Preset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVE DRAFTING SUITE */}
          {activeTab === 'suite' && (
            <div className="space-y-6 animate-fade-in">
              {/* If editing a specific active draft, render extensive risk modeling controls */}
              {isEditingDraft ? (
                <div className="bg-white border border-slate-250 rounded-3xl p-8 shadow-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 block">Active Workspace</span>
                      <h3 className="text-base font-black text-slate-900">
                        Modeling Municipal Risk Target: "{draftForm.title}"
                      </h3>
                    </div>
                    <button 
                      onClick={() => setIsEditingDraft(null)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      Back to Suite Overview
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic specs */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-1.5">
                        Operational Metadata
                      </h4>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Risk Title Descriptor</label>
                        <input 
                          type="text"
                          required
                          value={draftForm.title || ''}
                          onChange={e => setDraftForm({ ...draftForm, title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Target Category</label>
                          <select 
                            value={draftForm.category || 'Strategic Risks'}
                            onChange={e => setDraftForm({ ...draftForm, category: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 bg-white outline-none focus:border-red-500"
                          >
                            {riskTypes.map(rt => (
                              <option key={rt.id} value={rt.name}>{rt.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Execution SLA Lead</label>
                          <input 
                            type="text"
                            value={draftForm.responsibleOfficer || ''}
                            onChange={e => setDraftForm({ ...draftForm, responsibleOfficer: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Current Status</label>
                          <select 
                            value={draftForm.status || 'Drafting'}
                            onChange={e => setDraftForm({ ...draftForm, status: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 bg-white outline-none focus:border-red-500"
                          >
                            <option>Drafting</option>
                            <option>In Progress</option>
                            <option>Mitigated</option>
                            <option>Critical</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Target Mitigation Date</label>
                          <input 
                            type="date"
                            value={draftForm.targetDate || ''}
                            onChange={e => setDraftForm({ ...draftForm, targetDate: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Mitigation Progress (%)</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={draftForm.progress || 0}
                            onChange={e => setDraftForm({ ...draftForm, progress: Math.min(100, Math.max(0, Number(e.target.value))) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Integrated Inherent matrix */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-red-500 block border-b pb-1.5 flex items-center justify-between">
                        <span>1. Inherent Risk Evaluation (Pre-Controls)</span>
                        <span className="font-mono text-xs text-slate-800 px-2 py-0.5 bg-white border rounded">
                          Rating Index: {Number(draftForm.inherentImpact || 1) * Number(draftForm.inherentLikelihood || 1)}
                        </span>
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Inherent Impact Score</label>
                          <select 
                            value={draftForm.inherentImpact || 3}
                            onChange={e => setDraftForm({ ...draftForm, inherentImpact: Number(e.target.value) })}
                            className="w-full border border-slate-250 bg-white rounded-lg px-2 py-2 text-xs outline-none"
                          >
                            <option value="1">1 - Minimal</option>
                            <option value="2">2 - Minor</option>
                            <option value="3">3 - Moderate</option>
                            <option value="4">4 - Major</option>
                            <option value="5">5 - Catastrophic</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Inherent Likelihood Score</label>
                          <select 
                            value={draftForm.inherentLikelihood || 3}
                            onChange={e => setDraftForm({ ...draftForm, inherentLikelihood: Number(e.target.value) })}
                            className="w-full border border-slate-250 bg-white rounded-lg px-2 py-2 text-xs outline-none"
                          >
                            <option value="1">1 - Rare</option>
                            <option value="2">2 - Unlikely</option>
                            <option value="3">3 - Possible</option>
                            <option value="4">4 - Likely</option>
                            <option value="5">5 - Almost Certain</option>
                          </select>
                        </div>
                      </div>

                      {/* Displaying Inherent Matrix Location */}
                      <div className="flex items-center justify-center pt-2">
                        <div className="grid grid-cols-5 gap-1 w-full max-w-[200px]">
                          {Array.from({ length: 25 }).map((_, i) => {
                            const row = 5 - Math.floor(i / 5); // impact (5 down to 1)
                            const col = (i % 5) + 1; // likelihood (1 to 5)
                            const isSelected = row === draftForm.inherentImpact && col === draftForm.inherentLikelihood;
                            const score = row * col;
                            const color = score >= 15 ? 'bg-red-500' : score >= 9 ? 'bg-amber-400' : 'bg-emerald-500';
                            
                            return (
                              <div 
                                key={i} 
                                title={`Impact ${row}, Likelihood ${col}`}
                                className={`h-7 rounded flex items-center justify-center font-mono text-[9px] font-bold text-white shadow-inner transition-transform cursor-pointer relative ${color} ${isSelected ? 'scale-115 ring-2 ring-slate-900 border-2 border-white z-10' : 'opacity-30 hover:opacity-100'}`}
                                onClick={() => setDraftForm({ ...draftForm, inherentImpact: row, inherentLikelihood: col })}
                              >
                                {score}
                                {isSelected && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-600 border border-white rounded-full animate-ping" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls & Residuals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Controls Formulation */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-1.5">
                        2. Mitigation Controls Formulation
                      </h4>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Preventative Controls (Inherent mitigators)</label>
                        <textarea 
                          rows={3}
                          value={draftForm.preventativeControls || ''}
                          onChange={e => setDraftForm({ ...draftForm, preventativeControls: e.target.value })}
                          placeholder="e.g. Daily system updates, multi-signature approvals, random system surveillance arrays..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Corrective / Disaster Mitigation Actions</label>
                        <textarea 
                          rows={2}
                          value={draftForm.correctiveControls || ''}
                          onChange={e => setDraftForm({ ...draftForm, correctiveControls: e.target.value })}
                          placeholder="e.g. Immediate deployment of backup diesel reserves, temporary routing to alternate servers..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Residual Risk */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 block border-b pb-1.5 flex items-center justify-between">
                        <span>3. Residual Risk Evaluation (Post-Control)</span>
                        <span className="font-mono text-xs text-slate-800 px-2 py-0.5 bg-white border rounded">
                          Residual Index: {Number(draftForm.residualImpact || 1) * Number(draftForm.residualLikelihood || 1)}
                        </span>
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Residual Impact Score</label>
                          <select 
                            value={draftForm.residualImpact || 2}
                            onChange={e => setDraftForm({ ...draftForm, residualImpact: Number(e.target.value) })}
                            className="w-full border border-slate-250 bg-white rounded-lg px-2 py-2 text-xs outline-none"
                          >
                            <option value="1">1 - Minimal</option>
                            <option value="2">2 - Minor</option>
                            <option value="3">3 - Moderate</option>
                            <option value="4">4 - Major</option>
                            <option value="5">5 - Catastrophic</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Residual Likelihood Score</label>
                          <select 
                            value={draftForm.residualLikelihood || 2}
                            onChange={e => setDraftForm({ ...draftForm, residualLikelihood: Number(e.target.value) })}
                            className="w-full border border-slate-250 bg-white rounded-lg px-2 py-2 text-xs outline-none"
                          >
                            <option value="1">1 - Rare</option>
                            <option value="2">2 - Unlikely</option>
                            <option value="3">3 - Possible</option>
                            <option value="4">4 - Likely</option>
                            <option value="5">5 - Almost Certain</option>
                          </select>
                        </div>
                      </div>

                      {/* Displaying Residual Matrix Location */}
                      <div className="flex items-center justify-center pt-2">
                        <div className="grid grid-cols-5 gap-1 w-full max-w-[200px]">
                          {Array.from({ length: 25 }).map((_, i) => {
                            const row = 5 - Math.floor(i / 5);
                            const col = (i % 5) + 1;
                            const isSelected = row === draftForm.residualImpact && col === draftForm.residualLikelihood;
                            const score = row * col;
                            const color = score >= 15 ? 'bg-red-500' : score >= 9 ? 'bg-amber-400' : 'bg-emerald-500';
                            
                            return (
                              <div 
                                key={i} 
                                title={`Impact ${row}, Likelihood ${col}`}
                                className={`h-7 rounded flex items-center justify-center font-mono text-[9px] font-bold text-white shadow-inner transition-transform cursor-pointer relative ${color} ${isSelected ? 'scale-115 ring-2 ring-slate-900 border-2 border-white z-10' : 'opacity-30 hover:opacity-100'}`}
                                onClick={() => setDraftForm({ ...draftForm, residualImpact: row, residualLikelihood: col })}
                              >
                                {score}
                                {isSelected && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full animate-ping" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <button 
                      onClick={() => {
                        if (draftForm.id) {
                          handleDeleteDraft(draftForm.id);
                          setIsEditingDraft(null);
                        }
                      }}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-xs uppercase rounded-lg border border-rose-200 transition-colors"
                    >
                      Delete Active Draft
                    </button>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsEditingDraft(null)}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 font-extrabold text-xs uppercase rounded-lg transition-colors border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveDraftChanges}
                        disabled={isLoading}
                        className="px-6 py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs uppercase rounded-lg transition-colors shadow-lg"
                      >
                        Commit Sync to Supabase
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary list of drafts */}
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Active Operational Audited Risks</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Currently registered drafts tracked for this municipality under MFMA compliance standards.
                      </p>
                    </div>

                    <button 
                      onClick={handleCreateEmptyDraft}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Log Custom Audited Risk
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="px-6 py-4">Municipal Risk Project</th>
                          <th className="px-6 py-4">Inherent rating</th>
                          <th className="px-6 py-4">Residual Rating (Post Control)</th>
                          <th className="px-6 py-4">SLA Owner Node</th>
                          <th className="px-6 py-4 text-center">Status Index</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {drafts.map((dr) => {
                          const inherent = getRatingSummary(dr.inherentImpact, dr.inherentLikelihood);
                          const residual = getRatingSummary(dr.residualImpact, dr.residualLikelihood);
                          const dropPercent = dr.inherentImpact * dr.inherentLikelihood - dr.residualImpact * dr.residualLikelihood;
                          
                          return (
                            <tr key={dr.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="space-y-1 pr-6">
                                  <div className="font-extrabold text-slate-900 leading-snug">{dr.title}</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{dr.category}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Target: {dr.targetDate}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 font-bold uppercase rounded text-[10px] border tracking-wider bg-transparent ${inherent.css}`}>
                                  {inherent.label} ({dr.inherentImpact * dr.inherentLikelihood})
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 font-bold uppercase rounded text-[10px] border tracking-wider bg-transparent ${residual.css}`}>
                                    {residual.label} ({dr.residualImpact * dr.residualLikelihood})
                                  </span>
                                  {dropPercent > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 font-mono">
                                      <TrendingDown className="w-3 h-3" /> -{dropPercent} Index
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700">
                                {dr.responsibleOfficer}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="space-y-1">
                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                                    dr.status === 'Critical' ? 'bg-red-500 text-white' :
                                    dr.status === 'Mitigated' ? 'bg-emerald-500 text-white' :
                                    dr.status === 'In Progress' ? 'bg-amber-500 text-slate-950' :
                                    'bg-slate-200 text-slate-700'
                                  }`}>
                                    {dr.status}
                                  </span>
                                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mx-auto border border-slate-200">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dr.progress}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button 
                                    onClick={() => handleOpenEditDraft(dr)}
                                    className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                                  >
                                    <Edit className="w-3 h-3" /> Modeling Audit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteDraft(dr.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Unregister Draft"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {drafts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-16 text-slate-400 font-medium whitespace-pre leading-relaxed">
                              No active compliance risks drafted for this municipal node.
                              <br />
                              <button 
                                onClick={handleCreateEmptyDraft}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-600 font-extrabold bg-red-50 hover:bg-red-100 px-4 py-2 border border-red-200 rounded-xl uppercase tracking-wider"
                              >
                                Log the first municipal risk draft
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
