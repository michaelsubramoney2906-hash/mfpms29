import React, { useState, useEffect } from 'react';
import { BadgePlus, Plus, Trash2, Save, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface CoreCompetenciesProps {
  currentUser?: {
    email: string;
    role: string;
    name?: string;
  };
  activeTenantId?: string;
}

interface CompetencyRow {
  id: string;
  competency: string;
  basic: string;
  competent: string;
  advanced: string;
  superior: string;
}

interface CFOCompetencyRow {
  id: string;
  competency: string;
  components: string;
  definition: string;
  weighting: string;
}

export function CoreCompetencies({ currentUser, activeTenantId }: CoreCompetenciesProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'cached' | 'saved' | 'saving' | 'error'>('cached');
  const [activeTab, setActiveTab] = useState<'standard' | 'cfo' | 'ped' | 'corp'>('standard');
  const [isPullingFred, setIsPullingFred] = useState<boolean>(false);
  const [isPullingFredPed, setIsPullingFredPed] = useState<boolean>(false);
  const [isPullingFredCore, setIsPullingFredCore] = useState<boolean>(false);
  const [isPullingFredCorp, setIsPullingFredCorp] = useState<boolean>(false);
  const [importMessage, setImportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);


  const [rows, setRows] = useState<CompetencyRow[]>([
    {
      id: 'row-1',
      competency: 'Strategic Leadership',
      basic: 'Minimal ability to guide teams',
      competent: 'Can lead a team effectively',
      advanced: 'Transforms team performance and strategy',
      superior: 'Industry visionary, drives systemic changes'
    },
    {
      id: 'row-2',
      competency: 'Financial Management',
      basic: 'Basic understanding of budgets',
      competent: 'Manages departmental budgets accurately',
      advanced: 'Optimizes large scale financial operations',
      superior: 'Sets strategic financial policies for the organisation'
    }
  ]);

  const [cfoRows, setCfoRows] = useState<CFOCompetencyRow[]>([
    {
      id: 'cfo-row-1',
      competency: 'Strategic Financial Management',
      components: 'Financial planning, forecasting, policy formulation, capital program management',
      definition: 'Ability to align financial resources with strategic institutional goals and SDF/IDP priorities.',
      weighting: '25'
    },
    {
      id: 'cfo-row-2',
      competency: 'Operational Financial Management',
      components: 'Budget preparation, cash-flow monitoring, expenditure control, in-year reporting',
      definition: 'Directs and monitors all operational budget parameters to maintain solvency and clean audit outcomes.',
      weighting: '25'
    },
    {
      id: 'cfo-row-3',
      competency: 'Governance, Risk & Compliance (GRC)',
      components: 'Internal controls, MFMA compliance, risk registers, audit action plans, Treasury guidelines',
      definition: 'Formulates and enforces compliance with the Municipal Finance Management Act (MFMA) and municipal regulations.',
      weighting: '20'
    },
    {
      id: 'cfo-row-4',
      competency: 'Supply Chain Management (SCM)',
      components: 'Procurement policy, bid committee oversight, demand planning, supplier monitoring',
      definition: 'Guides procurement structures to ensure fair, equitable, transparent, competitive, and cost-effective acquisition.',
      weighting: '15'
    },
    {
      id: 'cfo-row-5',
      competency: 'Financial Reporting & Auditing',
      components: 'Annual Financial Statements (AFS), liaison with Auditor-General, mSCOA alignment',
      definition: 'Directs timeous preparation and submission of accurate statutory financial reports.',
      weighting: '15'
    }
  ]);

  const [pedRows, setPedRows] = useState<CFOCompetencyRow[]>([
    {
      id: 'ped-row-1',
      competency: 'Strategic Land Use & Spatial Planning',
      components: 'Spatial Development Framework (SDF), Land Use Management Scheme (LUMS), GIS Alignment',
      definition: 'Formulates and implements integrated spatial strategies and land-use policies aligned with municipal development goals.',
      weighting: '25'
    },
    {
      id: 'ped-row-2',
      competency: 'Local Economic Development (LED)',
      components: 'LED Strategy, SMME support, job creation programs, investment promotion, tourism coordination',
      definition: 'Designs and executes programs that stimulate sustainable local economic growth, competitiveness, and enterprise support.',
      weighting: '25'
    },
    {
      id: 'ped-row-3',
      competency: 'Integrated Human Settlements',
      components: 'Housing needs assessment, informal settlement upgrading, social housing oversight',
      definition: 'Coordinates housing development strategies to deliver sustainable and well-located human settlements.',
      weighting: '20'
    },
    {
      id: 'ped-row-4',
      competency: 'Project Portfolio Management (PED)',
      components: 'MIG projects, economic infrastructure projects, development progress tracking, CapEx control',
      definition: 'Directs the execution of human settlements, land use, and LED capital projects effectively.',
      weighting: '15'
    },
    {
      id: 'ped-row-5',
      competency: 'Intergovernmental Relations & Funding Alignment',
      components: 'Community consultation, public-private partnerships, MIG & grant fund utilization',
      definition: 'Leverages inter-governmental programs and funding models to implement economic growth policies.',
      weighting: '15'
    }
  ]);

  const [corpRows, setCorpRows] = useState<CFOCompetencyRow[]>([]);

  // Handle cell edits for Standard rows
  const handleCellEdit = (rowId: string, field: keyof CompetencyRow, value: string) => {
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
    setSyncStatus('cached');
  };

  // Handle cell edits for CFO rows
  const handleCfoCellEdit = (rowId: string, field: keyof CFOCompetencyRow, value: string) => {
    setCfoRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
    setSyncStatus('cached');
  };

  // Handle cell edits for PED rows
  const handlePedCellEdit = (rowId: string, field: keyof CFOCompetencyRow, value: string) => {
    setPedRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
    setSyncStatus('cached');
  };

  // Handle row deletion
  const handleDeleteRow = (rowId: string) => {
    setRows(prevRows => prevRows.filter(row => row.id !== rowId));
    setSyncStatus('cached');
  };

  const handleDeleteCfoRow = (rowId: string) => {
    setCfoRows(prevRows => prevRows.filter(row => row.id !== rowId));
    setSyncStatus('cached');
  };

  const handleDeletePedRow = (rowId: string) => {
    setPedRows(prevRows => prevRows.filter(row => row.id !== rowId));
    setSyncStatus('cached');
  };

  // Handle adding new rows
  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    setRows(prevRows => [
      ...prevRows, 
      {
        id: newId,
        competency: '',
        basic: '',
        competent: '',
        advanced: '',
        superior: ''
      }
    ]);
    setSyncStatus('cached');
  };

  const handleAddCfoRow = () => {
    const newId = `cfo-row-${Date.now()}`;
    setCfoRows(prevRows => [
      ...prevRows, 
      {
        id: newId,
        competency: '',
        components: '',
        definition: '',
        weighting: '0'
      }
    ]);
    setSyncStatus('cached');
  };

  const handleAddPedRow = () => {
    const newId = `ped-row-${Date.now()}`;
    setPedRows(prevRows => [
      ...prevRows, 
      {
        id: newId,
        competency: '',
        components: '',
        definition: '',
        weighting: '0'
      }
    ]);
    setSyncStatus('cached');
  };

  const handleAddRowClick = () => {
    if (activeTab === 'standard') {
      handleAddRow();
    } else if (activeTab === 'cfo') {
      handleAddCfoRow();
    } else if (activeTab === 'ped') {
      handleAddPedRow();
    } else {
      setCorpRows(prev => [...prev, { id: `corp-row-${Date.now()}`, competency: '', components: '', definition: '', weighting: '0' }]);
      setSyncStatus('cached');
    }
  };

  // Calculate total CFO weighting
  const totalCfoWeight = cfoRows.reduce((acc, row) => {
    const w = parseFloat(row.weighting) || 0;
    return acc + w;
  }, 0);

  // Calculate total PED weighting
  const totalPedWeight = pedRows.reduce((acc, row) => {
    const w = parseFloat(row.weighting) || 0;
    return acc + w;
  }, 0);

  const totalCorpWeight = corpRows.reduce((acc, row) => {
    const w = parseFloat(row.weighting) || 0;
    return acc + w;
  }, 0);

  // Fetch data
  useEffect(() => {
    if (!activeTenantId) return;
    
    setLoading(true);
    fetch(`/api/tenant/${activeTenantId}/core-competencies?userId=${currentUser?.email || 'default'}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            setRows(data.items);
          } else {
            setRows([]);
          }
          if (data.cfoItems && Array.isArray(data.cfoItems) && data.cfoItems.length > 0) {
            setCfoRows(data.cfoItems);
          } else {
            setCfoRows([]);
          }
          if (data.pedItems && Array.isArray(data.pedItems) && data.pedItems.length > 0) {
            setPedRows(data.pedItems);
          } else {
            setPedRows([]);
          }
          if (data.corporateServicesItems && Array.isArray(data.corporateServicesItems) && data.corporateServicesItems.length > 0) {
            setCorpRows(data.corporateServicesItems);
          } else {
            setCorpRows([]);
          }
          setSyncStatus('saved');
        } else {
          setRows([]);
          setCfoRows([]);
          setPedRows([]);
          setSyncStatus('saved');
        }
      })
      .catch(err => {
        console.error("Error fetching core competencies:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeTenantId, currentUser?.email]);

  // Save to backend
  const handleSave = async () => {
    if (!activeTenantId) return;
    
    setSaving(true);
    setSyncStatus('saving');
    
    try {
      await fetch(`/api/tenant/${activeTenantId}/core-competencies?userId=${currentUser?.email || 'default'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows, cfoItems: cfoRows, pedItems: pedRows, corporateServicesItems: corpRows })
      });
      setSyncStatus('saved');
    } catch (err) {
      console.error("Failed to save core competencies:", err);
      setSyncStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handlePullFredCfo = async () => {
    if (!activeTenantId) return;
    setIsPullingFred(true);
    setImportMessage(null);
    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/cfo_competencies_engine?userId=${currentUser?.email || 'default'}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.CFO_Core_Competencies) {
          const mappedRows = json.data.CFO_Core_Competencies.map((comp: any, idx: number) => ({
            id: `cfo-row-ext-${idx}-${Date.now()}`,
            competency: comp.Competency || '',
            components: comp.Components || '',
            definition: comp.Competency_Definition || '',
            weighting: comp.Weighting_Percent ? String(comp.Weighting_Percent).replace(/[^0-9.]/g, '') : '0'
          }));
          if (mappedRows.length > 0) {
            setCfoRows(mappedRows);
            setSyncStatus('cached');
            setImportMessage({
              text: `Successfully imported ${mappedRows.length} CFO core competencies from Fred CFO Extraction! Click "Save Configuration" to persist.`,
              type: 'success'
            });
            try {
              await fetch(`/api/tenant/${activeTenantId}/fred-extraction/cfo_competencies_engine?userId=${currentUser?.email || 'default'}`, { method: 'DELETE' });
            } catch (e) {
              console.error("Failed to clear fred extraction state after pull", e);
            }
          } else {
            setImportMessage({
              text: "No competencies found in the saved CFO extraction JSON structure.",
              type: 'error'
            });
          }
        } else {
          setImportMessage({
            text: "No saved CFO extractions found. Please upload and process a document in Fred's Cognitive Extraction Agent first.",
            type: 'error'
          });
        }
      } else {
        setImportMessage({
          text: "Could not retrieve saved CFO extractions from the Supabase ledger. Ensure the document has been processed first.",
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Failed to pull CFO extraction:", err);
      setImportMessage({
        text: "Exception occurred while pulling CFO extraction data.",
        type: 'error'
      });
    } finally {
      setIsPullingFred(false);
      setTimeout(() => {
        setImportMessage(null);
      }, 7000);
    }
  };

  const handlePullFredPed = async () => {
    if (!activeTenantId) return;
    setIsPullingFredPed(true);
    setImportMessage(null);
    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/ped_competencies_engine?userId=${currentUser?.email || 'default'}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.PED_Core_Competencies) {
          const mappedRows = json.data.PED_Core_Competencies.map((comp: any, idx: number) => ({
            id: `ped-row-ext-${idx}-${Date.now()}`,
            competency: comp.Competency || '',
            components: comp.Components || '',
            definition: comp.Competency_Definition || '',
            weighting: comp.Weighting_Percent ? String(comp.Weighting_Percent).replace(/[^0-9.]/g, '') : '0'
          }));
          if (mappedRows.length > 0) {
            setPedRows(mappedRows);
            setSyncStatus('cached');
            setImportMessage({
              text: `Successfully imported ${mappedRows.length} PED core competencies from Fred PED Extraction! Click "Save Configuration" to persist.`,
              type: 'success'
            });
            try {
              await fetch(`/api/tenant/${activeTenantId}/fred-extraction/ped_competencies_engine?userId=${currentUser?.email || 'default'}`, { method: 'DELETE' });
            } catch (e) {
              console.error("Failed to clear fred extraction state after pull", e);
            }
          } else {
            setImportMessage({
              text: "No competencies found in the saved PED extraction JSON structure.",
              type: 'error'
            });
          }
        } else {
          setImportMessage({
            text: "No saved PED extractions found. Please upload and process a document in Fred's Cognitive Extraction Agent first.",
            type: 'error'
          });
        }
      } else {
        setImportMessage({
          text: "Could not retrieve saved PED extractions from the Supabase ledger. Ensure the document has been processed first.",
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Failed to pull PED extraction:", err);
      setImportMessage({
        text: "Exception occurred while pulling PED extraction data.",
        type: 'error'
      });
    } finally {
      setIsPullingFredPed(false);
      setTimeout(() => {
        setImportMessage(null);
      }, 7000);
    }
  };

  const handlePullFredCorp = async () => {
    if (!activeTenantId) return;
    setIsPullingFredCorp(true);
    setImportMessage(null);

    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/corporate_services_competencies_engine?userId=${currentUser?.email || 'default'}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.Corporate_Services_Core_Competencies) {
          const mappedRows = json.data.Corporate_Services_Core_Competencies.map((comp: any, idx: number) => ({
            id: `corp-row-ext-${idx}-${Date.now()}`,
            competency: comp.Competency || '',
            components: comp.Components || '',
            definition: comp.Competency_Definition || '',
            weighting: comp.Weighting_Percent ? String(comp.Weighting_Percent).replace(/[^0-9.]/g, '') : '0'
          }));
          if (mappedRows.length > 0) {
            setCorpRows(mappedRows);
            setSyncStatus('cached');
            setImportMessage({
              text: `Successfully imported ${mappedRows.length} Corporate Services core competencies from Fred Extraction! Click "Save Configuration" to persist.`,
              type: 'success'
            });
            try {
              await fetch(`/api/tenant/${activeTenantId}/fred-extraction/corporate_services_competencies_engine?userId=${currentUser?.email || 'default'}`, { method: 'DELETE' });
            } catch (e) {
              console.error("Failed to clear fred extraction state after pull", e);
            }
          } else {
            setImportMessage({
              text: "No competencies found in the saved Corporate Services extraction JSON structure.",
              type: 'error'
            });
          }
        } else {
          setImportMessage({
            text: "No saved Corporate Services extractions found. Please upload and process a document in Fred's Cognitive Extraction Agent first.",
            type: 'error'
          });
        }
      } else {
        setImportMessage({
          text: "Could not retrieve saved Corporate Services extractions from the Supabase ledger. Ensure the document has been processed first.",
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Failed to pull Corporate Services extraction:", err);
      setImportMessage({
        text: "Exception occurred while pulling Corporate Services extraction data.",
        type: 'error'
      });
    } finally {
      setIsPullingFredCorp(false);
      setTimeout(() => {
        setImportMessage(null);
      }, 7000);
    }
  };

  const handlePullFredCore = async () => {
    if (!activeTenantId) return;
    setIsPullingFredCore(true);
    setImportMessage(null);
    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${currentUser?.email || 'default'}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.Core_Competencies) {
          const mappedRows = json.data.Core_Competencies.map((comp: any, idx: number) => ({
            id: `core-row-ext-${idx}-${Date.now()}`,
            competency: comp.Competency_Name || '',
            basic: comp.Definition ? `Demonstrates basic understanding of ${comp.Competency_Name || 'this competency'}.` : 'Minimal capability',
            competent: comp.Definition || 'Demonstrates competent level performance in this domain.',
            advanced: comp.Definition ? `Advanced mastery of ${comp.Competency_Name || 'this competency'}: ${comp.Definition}` : 'Transforms organizational performance',
            superior: comp.Definition ? `Superior strategic and systems leadership of ${comp.Competency_Name || 'this competency'}.` : 'Industry visionary'
          }));
          if (mappedRows.length > 0) {
            setRows(mappedRows);
            setSyncStatus('cached');
            setImportMessage({
              text: `Successfully imported ${mappedRows.length} standard core competencies from Fred Core Competencies Extraction! Click "Save Configuration" to persist.`,
              type: 'success'
            });
            try {
              await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${currentUser?.email || 'default'}`, { method: 'DELETE' });
            } catch (e) {
              console.error("Failed to clear fred extraction state after pull", e);
            }
          } else {
            setImportMessage({
              text: "No competencies found in the saved Core Competencies extraction JSON structure.",
              type: 'error'
            });
          }
        } else {
          setImportMessage({
            text: "No saved Core Competencies extractions found. Please upload and process a document in Fred's Cognitive Extraction Agent first.",
            type: 'error'
          });
        }
      } else {
        setImportMessage({
          text: "Could not retrieve saved Core Competencies extractions from the Supabase ledger. Ensure the document has been processed first.",
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Failed to pull standard core competencies extraction:", err);
      setImportMessage({
        text: "Exception occurred while pulling standard core competencies extraction data.",
        type: 'error'
      });
    } finally {
      setIsPullingFredCore(false);
      setTimeout(() => {
        setImportMessage(null);
      }, 7000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent pr-1"></div>
          <p className="font-medium text-slate-500">Loading Core Competencies API Pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50/50 select-text">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <BadgePlus className="w-6 h-6 text-white" />
            </div>
            Core Competencies Module
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage institutional core competency definitions and scaling standards.</p>
        </div>
        <div className="flex items-center gap-4">
           {syncStatus === 'cached' && <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Unsaved Changes</span>}
           {syncStatus === 'saving' && <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5"><div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/> Syncing...</span>}
           {syncStatus === 'saved' && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">✓ Synced to Cloud</span>}
          <button 
            onClick={handleAddRowClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-slate-100 border-b border-slate-200 px-8 py-2.5 flex items-center justify-between select-none">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'standard'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Standard Core Competencies
          </button>
          <button
              onClick={() => setActiveTab('cfo')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'cfo'
                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${activeTab === 'cfo' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'}`}>CFO</span>
              Core Competencies (CFO)
            </button>
          <button
              onClick={() => setActiveTab('ped')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'ped'
                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${activeTab === 'ped' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'}`}>PED</span>
              Core Competencies (PED)
            </button>
          <button
              onClick={() => setActiveTab('corp')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'corp'
                  ? 'bg-pink-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${activeTab === 'corp' ? 'bg-pink-800 text-pink-100' : 'bg-slate-200 text-slate-700'}`}>CORP</span>
              Corporate Services
            </button>
        </div>

        {activeTab === 'cfo' && (
          <div className="flex items-center gap-2">
            {totalCfoWeight === 100 ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Total Weight: 100%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Weights Total: {totalCfoWeight}% (Must equal 100%)
              </span>
            )}
          </div>
        )}

        {activeTab === 'ped' && (
          <div className="flex items-center gap-2">
            {totalPedWeight === 100 ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Total Weight: 100%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Weights Total: {totalPedWeight}% (Must equal 100%)
              </span>
            )}
          </div>
        )}

        {activeTab === 'corp' && (
          <div className="flex items-center gap-2">
            {totalCorpWeight === 100 ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Total Weight: 100%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Weights Total: {totalCorpWeight}% (Must equal 100%)
              </span>
            )}
          </div>
        )}
      </div>

      {importMessage && (
        <div className={`mx-8 mt-4 p-4 rounded-xl border text-xs font-bold flex items-center justify-between ${
          importMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{importMessage.text}</span>
          <button onClick={() => setImportMessage(null)} className="text-slate-550 hover:text-slate-800 font-extrabold text-sm px-2">&times;</button>
        </div>
      )}

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800">
              {activeTab === 'standard' 
                ? 'Competency Levels & Scaling Criteria' 
                : activeTab === 'cfo' 
                  ? 'CFO Specific Competency Weighting Grid' 
                  : 'PED Specific Competency Weighting Grid'
              }
            </h2>
          </div>
          
          <div className="overflow-x-auto w-full">
            {activeTab === 'standard' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4 border-b border-r border-slate-200">Competencies</th>
                    <th className="p-4 border-b border-r border-slate-200">Basic</th>
                    <th className="p-4 border-b border-r border-slate-200">Competent</th>
                    <th className="p-4 border-b border-r border-slate-200">Advanced</th>
                    <th className="p-4 border-b border-slate-200">Superior</th>
                    <th className="p-4 border-b border-slate-200 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition group">
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/6">
                        <textarea 
                          value={row.competency} 
                          onChange={(e) => handleCellEdit(row.id, 'competency', e.target.value)}
                          className="w-full text-sm font-bold text-slate-900 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                          placeholder="Enter competency..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/6 bg-rose-50/20 focus-within:bg-rose-50/50 transition">
                        <textarea 
                          value={row.basic} 
                          onChange={(e) => handleCellEdit(row.id, 'basic', e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                          placeholder="Define basic level..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/6 bg-amber-50/20 focus-within:bg-amber-50/50 transition">
                        <textarea 
                          value={row.competent} 
                          onChange={(e) => handleCellEdit(row.id, 'competent', e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                          placeholder="Define competent level..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/6 bg-emerald-50/20 focus-within:bg-emerald-50/50 transition">
                        <textarea 
                          value={row.advanced} 
                          onChange={(e) => handleCellEdit(row.id, 'advanced', e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                          placeholder="Define advanced level..."
                        />
                      </td>
                      <td className="p-3 whitespace-pre-wrap align-top w-1/6 bg-blue-50/20 focus-within:bg-blue-50/50 transition">
                        <textarea 
                          value={row.superior} 
                          onChange={(e) => handleCellEdit(row.id, 'superior', e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                          placeholder="Define superior level..."
                        />
                      </td>
                      <td className="p-3 align-middle text-center">
                        <button 
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition opacity-0 group-hover:opacity-100 mx-auto"
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center bg-slate-50 border-b-2 border-dashed border-slate-300">
                        <div className="flex flex-col items-center justify-center space-y-2">
                           <BadgePlus className="w-8 h-8 text-slate-400" />
                           <p className="text-sm font-bold text-slate-600">No core competencies defined.</p>
                           <p className="text-xs font-medium text-slate-500 w-3/4">Click "Add Row" or "Import Fred Core Extraction" to start building your institutional core competency evaluation standards matrix.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'cfo' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4 border-b border-r border-slate-200">Competencies</th>
                    <th className="p-4 border-b border-r border-slate-200">Components</th>
                    <th className="p-4 border-b border-r border-slate-200">Competency Definition</th>
                    <th className="p-4 border-b border-r border-slate-200 w-32 text-center">Weighting %</th>
                    <th className="p-4 border-b border-slate-200 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cfoRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition group">
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4">
                        <textarea 
                          value={row.competency} 
                          onChange={(e) => handleCfoCellEdit(row.id, 'competency', e.target.value)}
                          className="w-full text-sm font-bold text-slate-900 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                          placeholder="Enter CFO competency..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/3 bg-slate-50/20 focus-within:bg-slate-50/50 transition">
                        <textarea 
                          value={row.components} 
                          onChange={(e) => handleCfoCellEdit(row.id, 'components', e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                          placeholder="Define components..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/3 bg-slate-50/20 focus-within:bg-slate-50/50 transition">
                        <textarea 
                          value={row.definition} 
                          onChange={(e) => handleCfoCellEdit(row.id, 'definition', e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                          placeholder="Define competency..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 align-top text-center w-32 bg-indigo-50/10 focus-within:bg-indigo-50/30 transition">
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 max-w-[100px] mx-auto focus-within:ring-2 focus-within:ring-indigo-500">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={row.weighting} 
                            onChange={(e) => handleCfoCellEdit(row.id, 'weighting', e.target.value)}
                            className="w-full text-sm font-bold text-slate-900 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                          <span className="text-slate-400 font-bold text-xs">%</span>
                        </div>
                      </td>
                      <td className="p-3 align-middle text-center">
                        <button 
                          onClick={() => handleDeleteCfoRow(row.id)}
                          className="p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition opacity-0 group-hover:opacity-100 mx-auto"
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {cfoRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center bg-slate-50 border-b-2 border-dashed border-slate-300">
                        <div className="flex flex-col items-center justify-center space-y-2">
                           <BadgePlus className="w-8 h-8 text-slate-400" />
                           <p className="text-sm font-bold text-slate-600">No CFO core competencies defined.</p>
                           <p className="text-xs font-medium text-slate-500 w-3/4">Click "Add Row" or "Import Fred CFO Extraction" to build your CFO specific core competency and weighting matrix.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-4 border-b border-r border-slate-200">Competencies</th>
                    <th className="p-4 border-b border-r border-slate-200">Components</th>
                    <th className="p-4 border-b border-r border-slate-200">Competency Definition</th>
                    <th className="p-4 border-b border-r border-slate-200 w-32 text-center">Weighting %</th>
                    <th className="p-4 border-b border-slate-200 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pedRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition group">
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4">
                        <textarea 
                          value={row.competency} 
                          onChange={(e) => handlePedCellEdit(row.id, 'competency', e.target.value)}
                          className="w-full text-sm font-bold text-slate-900 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                          placeholder="Enter PED competency..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/3 bg-slate-50/20 focus-within:bg-slate-50/50 transition">
                        <textarea 
                          value={row.components} 
                          onChange={(e) => handlePedCellEdit(row.id, 'components', e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                          placeholder="Define components..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/3 bg-slate-50/20 focus-within:bg-slate-50/50 transition">
                        <textarea 
                          value={row.definition} 
                          onChange={(e) => handlePedCellEdit(row.id, 'definition', e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                          placeholder="Define competency..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 align-top text-center w-32 bg-indigo-50/10 focus-within:bg-indigo-50/30 transition">
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 max-w-[100px] mx-auto focus-within:ring-2 focus-within:ring-indigo-500">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={row.weighting} 
                            onChange={(e) => handlePedCellEdit(row.id, 'weighting', e.target.value)}
                            className="w-full text-sm font-bold text-slate-900 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                          <span className="text-slate-400 font-bold text-xs">%</span>
                        </div>
                      </td>
                      <td className="p-3 align-middle text-center">
                        <button 
                          onClick={() => handleDeletePedRow(row.id)}
                          className="p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition opacity-0 group-hover:opacity-100 mx-auto"
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {pedRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center bg-slate-50 border-b-2 border-dashed border-slate-300">
                        <div className="flex flex-col items-center justify-center space-y-2">
                           <BadgePlus className="w-8 h-8 text-slate-400" />
                           <p className="text-sm font-bold text-slate-600">No PED core competencies defined.</p>
                           <p className="text-xs font-medium text-slate-500 w-3/4">Click "Add Row" or "Import Fred PED Extraction" to build your PED specific core competency and weighting matrix.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer with Total Weight for CFO */}
          {activeTab === 'cfo' && cfoRows.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status verification:</span>
                {totalCfoWeight === 100 ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10.5px] font-black px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Weights sum is exactly 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10.5px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Weights total must equal 100% (Current: {totalCfoWeight}%)
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-slate-800">
                Total Weighting: <span className={totalCfoWeight === 100 ? "text-emerald-600 text-base" : "text-amber-600 text-base"}>{totalCfoWeight}%</span>
              </div>
            </div>
          )}

          {/* Table Footer with Total Weight for PED */}
          {activeTab === 'corp' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100/50 border-b-2 border-slate-200 text-slate-600 text-[10px] uppercase font-black tracking-wider">
                    <th className="p-3 w-1/4">Competency</th>
                    <th className="p-3 w-1/4">Components</th>
                    <th className="p-3 w-1/3">Definition</th>
                    <th className="p-3 w-24 text-center">Weighting %</th>
                    <th className="p-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {corpRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-pink-50/30 transition group">
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4">
                        <input
                          type="text"
                          value={row.competency}
                          onChange={(e) => {
                            setCorpRows(prev => prev.map(r => r.id === row.id ? { ...r, competency: e.target.value } : r));
                            setSyncStatus('cached');
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-slate-800 placeholder-slate-400"
                          placeholder="e.g. Employee Relations..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4 text-xs text-slate-600">
                        <textarea
                          value={row.components}
                          onChange={(e) => {
                            setCorpRows(prev => prev.map(r => r.id === row.id ? { ...r, components: e.target.value } : r));
                            setSyncStatus('cached');
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[40px] placeholder-slate-400"
                          placeholder="e.g. Disciplinary hearings, policy review..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/3 text-xs text-slate-600">
                        <textarea
                          value={row.definition}
                          onChange={(e) => {
                            setCorpRows(prev => prev.map(r => r.id === row.id ? { ...r, definition: e.target.value } : r));
                            setSyncStatus('cached');
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[40px] placeholder-slate-400"
                          placeholder="e.g. Manages and resolves employee conflicts..."
                        />
                      </td>
                      <td className="p-3 text-center align-top border-r border-slate-100">
                        <div className="flex items-center justify-center">
                          <input
                            type="text"
                            value={row.weighting}
                            onChange={(e) => {
                              setCorpRows(prev => prev.map(r => r.id === row.id ? { ...r, weighting: e.target.value } : r));
                              setSyncStatus('cached');
                            }}
                            className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-xs font-bold text-pink-700"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center align-top">
                          <button
                            onClick={() => {
                              setCorpRows(prev => prev.filter(r => r.id !== row.id));
                              setSyncStatus('cached');
                            }}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                    </tr>
                  ))}
                  
                  {corpRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center bg-slate-50 border-b-2 border-dashed border-slate-300">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <AlertTriangle className="w-8 h-8 mb-2 text-slate-300" />
                          <p className="text-sm font-bold text-slate-500">No Corporate Services Competencies Configured</p>
                          <p className="text-xs mt-1 max-w-sm">Use the Fred Extraction Agent to import from a performance agreement, or add manually.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'corp' && corpRows.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Corporate Weight:</span>
                <span className={`text-lg font-black ${totalCorpWeight === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {totalCorpWeight}%
                </span>
                {totalCorpWeight !== 100 && (
                  <span className="text-[10px] text-red-500 font-bold ml-2 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    Must equal 100%
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ped' && pedRows.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status verification:</span>
                {totalPedWeight === 100 ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10.5px] font-black px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Weights sum is exactly 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10.5px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Weights total must equal 100% (Current: {totalPedWeight}%)
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-slate-800">
                Total Weighting: <span className={totalPedWeight === 100 ? "text-emerald-600 text-base" : "text-amber-600 text-base"}>{totalPedWeight}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
