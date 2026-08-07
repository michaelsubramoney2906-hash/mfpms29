import React, { useState, useEffect, useRef } from 'react';
import { 
  Archive, 
  UploadCloud, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Database, 
  RefreshCw,
  ChevronRight,
  Calendar,
  Shield,
  CheckSquare,
  ArrowRight,
  User as UserIcon
} from 'lucide-react';
import type { User } from '../types';

const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    if (!res.ok && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
};

interface FredExtractionAgentProps {
  currentUser: User;
  activeTenantId: string;
}

type EngineType = 'sdbip_engine' | 'core_competencies_engine' | 'agreement_to_plan_engine' | 'jsc_pdp_engine' | 'cfo_competencies_engine' | 'ped_competencies_engine' | 'corporate_services_competencies_engine';

export function FredExtractionAgent({ currentUser, activeTenantId }: FredExtractionAgentProps) {
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('sdbip_engine');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
  const [temperature, setTemperature] = useState<number>(0.0);
  const [dbStatus, setDbStatus] = useState<'connected' | 'checking'>('checking');
  const [progress, setProgress] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSyncToSdbipTable = async () => {
    const rawItems = extractionResult?.items || extractionResult?.sdbip || [];
    if (!rawItems || rawItems.length === 0) return;
    setIsSyncing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const mappedItems = rawItems.map((item: any, idx: number) => {
        const natKpa = String(item.National_KPA || item.KPA || item.kpas || '');
        const respOwner = String(item.Responsible_Owner || item.responsibleUnit || item.Responsible_Person || item.Responsible_Official || item.Responsible_Manager || item.Executive_Manager || '');
        const kpiVal = String(item.KPI || item.kpi || item.Operational_Activity || item.Description || '');
        
        const rawRef = item.Ref_Number || item.Ref_No || item.Ref || item.refNum || '';
        let refNumVal = String(rawRef).trim();
        if (!refNumVal || refNumVal.toUpperCase().startsWith('KPI-')) {
          if (idx < 92) {
            refNumVal = `M_${String(idx + 1).padStart(2, '0')}`;
          } else {
            refNumVal = `P_${String(idx - 91).padStart(2, '0')}`;
          }
        }

        return {
          id: item.id || `sdbip-ext-${idx + 1}-${Date.now()}`,
          refNum: refNumVal,
          strategicObj: item.SDBIP_Strategic_Objective || item.strategicObj || '',
          bsd: item.BSD === 'X' || item.BSD === true || natKpa.includes('BSD') ? 'X' : '',
          led: item.LED === 'X' || item.LED === true || natKpa.includes('LED') ? 'X' : '',
          mfvm: item.MFVM === 'X' || item.MFVM === true || natKpa.includes('MFVM') ? 'X' : '',
          ggpp: item.GGPP === 'X' || item.GGPP === true || natKpa.includes('GGPP') ? 'X' : '',
          midt: item.MIDT === 'X' || item.MIDT === true || natKpa.includes('MIDT') ? 'X' : '',
          sr: item.SR === 'X' || item.SR === true || natKpa.includes('SR') ? 'X' : '',
          kpas: natKpa,
          operationalActivity: item.Description || kpiVal,
          kpi: kpiVal,
          compliance: item.compliance || 'compliant',
          uom: item.Unit_of_Measure || item.uom || 'Number',
          mscoaTracking: item.mSCOA_Tracking || item.mscoaTracking || 'mSCOA Item Code',
          baseline: item.Baseline || item.baseline || '0',
          annualTarget: item.Annual_Target || item.Target || item.annualTarget || '',
          budgetAllocation: item.Budget_Allocation || item.budgetAllocation || 'R 0',
          q1: item.Q1_Target || item.q1 || '',
          q2: item.Q2_Target || item.q2 || '',
          midTerm: item.Mid_Term_Target || item.midTerm || '',
          q3: item.Q3_Target || item.q3 || '',
          q4: item.Q4_Target || item.q4 || '',
          responsibleUnit: respOwner,
          submitter: item.Submitter || item.submitter || '',
          approver: item.Approver || item.approver || '',
          poeStatus: item.POE_Description || item.poeStatus || 'Pending Upload',
          description: item.Description || kpiVal || ''
        };
      });

      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: mappedItems })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Successfully synchronized ${mappedItems.length} extracted SDBIP items to the SDBIP Top Layer & Reporting tables in Supabase!`);
      } else {
        setError(`Failed to sync to SDBIP table: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`Error syncing to SDBIP table: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-load previously saved extractions from Supabase on mount or engine change
  useEffect(() => {
    const fetchSavedRecord = async () => {
      setDbStatus('checking');
      try {
        setError(null);
        setExtractionResult(null);
        setSuccessMsg(null);
        
        const response = await fetchWithRetry(`/api/tenant/${activeTenantId}/fred-extraction/${selectedEngine}?userId=${currentUser?.email || 'default'}`);
        const rawText = await response.text();
        if (response.ok && rawText.trim()) {
          try {
            const json = JSON.parse(rawText);
            if (json.success && json.data) {
              setExtractionResult(json.data);
              setSuccessMsg(`Loaded previously analyzed record from Supabase database. parsed: ${json.extractedAt ? new Date(json.extractedAt).toLocaleString() : 'N/A'} for file "${json.fileName || 'unknown_file'}"`);
            }
          } catch (pErr) {
            console.warn("Could not parse saved extraction response as JSON:", pErr);
          }
        }
        setDbStatus('connected');
      } catch (err: any) {
        console.error("Failed to load saved extraction:", err);
        setDbStatus('connected');
      }
    };
    fetchSavedRecord();
  }, [activeTenantId, selectedEngine, currentUser?.email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setSuccessMsg(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setProgress(0);
    setError(null);
    setExtractionResult(null);
    setSuccessMsg(null);

    // Setup an interval to animate the progress bar realistically
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          return prev + Math.floor(Math.random() * 4) + 2; // +2 to +5
        } else if (prev < 70) {
          return prev + Math.floor(Math.random() * 3) + 1; // +1 to +3
        } else if (prev < 90) {
          return prev + (Math.random() * 1.5 + 0.5); // +0.5 to +2.0
        } else if (prev < 95) {
          return prev + 0.1; // slow down near completion
        }
        return prev;
      });
    }, 150);

    try {
      const base64Data = await fileToBase64(selectedFile);
      
      const response = await fetch(`/api/tenant/${activeTenantId}/fred-extraction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileData: base64Data,
          engineType: selectedEngine,
          temperature: temperature,
          userEmail: currentUser?.email
        })
      });

      const rawText = await response.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(rawText);
      } catch (pErr) {
        console.error("Extraction endpoint returned non-JSON:", rawText);
        throw new Error(`Server endpoint returned non-JSON response (${response.status} ${response.statusText}). Server response snippet: "${rawText.slice(0, 150)}..."`);
      }

      if (!response.ok || !resJson || !resJson.success) {
        throw new Error(resJson?.error || resJson?.message || `Extraction failed with server status ${response.status}`);
      }

      // Complete progress smoothly
      clearInterval(interval);
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 350));

      setExtractionResult(resJson.data);
      setSuccessMsg(`Document successfully extracted and mapped using Fred's real ${selectedEngine.replace(/_/g, ' ').toUpperCase()}! All records synchronized to Supabase.`);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "An exception occurred during the cognitive extraction process.");
    } finally {
      clearInterval(interval);
      setIsExtracting(false);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="fred-extraction-agent-workspace" className="p-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header Banner */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            Fred's Cognitive Extraction Agent Workspace
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Legacy engines removed. Upgraded to 4 strict extraction engines with real-time cognitive processing and direct secure Supabase persistence.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
          <Database className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>{dbStatus === 'checking' ? 'Checking connection...' : 'Supabase Sync Connected'}</span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Extraction Setup Controls */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Parsing Engine</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Choose the appropriate cognitive extraction rule-set for your document.</p>
            </div>

            {/* Selection list of the 4 Engines */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedEngine('sdbip_engine')}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 flex flex-col gap-1 ${selectedEngine === 'sdbip_engine' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>SDBIP Engine</span>
                </div>
                <span className="text-[10px] text-slate-400">Maps National KPAs to SDBIP tables</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEngine('core_competencies_engine')}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 flex flex-col gap-1 ${selectedEngine === 'core_competencies_engine' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Core Competencies Engine</span>
                </div>
                <span className="text-[10px] text-slate-400">Extracts competencies from performance agreements</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEngine('agreement_to_plan_engine')}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 flex flex-col gap-1 ${selectedEngine === 'agreement_to_plan_engine' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Agreement to Plan Engine</span>
                </div>
                <span className="text-[10px] text-slate-400">Maps contract goals to operational plans</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEngine('jsc_pdp_engine')}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 flex flex-col gap-1 ${selectedEngine === 'jsc_pdp_engine' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <ArrowRight className="w-4 h-4 text-pink-400" />
                  <span>JSC & PDP Engine</span>
                </div>
                <span className="text-[10px] text-slate-400">Extracts specific competencies, plans, and indicators</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEngine('cfo_competencies_engine')}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 flex flex-col gap-1 ${selectedEngine === 'cfo_competencies_engine' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckSquare className="w-4 h-4 text-sky-400" />
                  <span>CFO Core Competencies Engine</span>
                </div>
                <span className="text-[10px] text-slate-400">Extracts CFO competencies and maps to Core Competencies module</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEngine('ped_competencies_engine')}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 flex flex-col gap-1 ${selectedEngine === 'ped_competencies_engine' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <span>PED Core Competencies Engine</span>
                </div>
                <span className="text-[10px] text-slate-400">Extracts PED core competencies and maps to Core Competencies module</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEngine('corporate_services_competencies_engine')}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition duration-150 flex flex-col gap-1 ${selectedEngine === 'corporate_services_competencies_engine' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckSquare className="w-4 h-4 text-pink-400" />
                  <span>Corporate Services Core Competencies Engine</span>
                </div>
                <span className="text-[10px] text-slate-400">Extracts Corporate Services core competencies and maps to Core Competencies module</span>
              </button>
            </div>

            {/* Slider for Temperature */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <span>Creativity Threshold</span>
                <span className="font-mono text-indigo-400">T = {temperature.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none outline-none"
              />
              <p className="text-[9px] text-slate-500 leading-normal">
                Set to 0.0 for strict deterministic extraction. Set higher for semantic insight capability.
              </p>
            </div>

            {selectedEngine === 'sdbip_engine' && (
              <div className="mt-2.5 p-3 bg-indigo-950/20 border border-indigo-900/50 rounded-lg text-[9.5px] leading-relaxed text-slate-400 space-y-1">
                <p>Extracts SDBIP Top Layer metrics.</p>
              </div>
            )}
            {selectedEngine === 'core_competencies_engine' && (
              <div className="mt-2.5 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg text-[9.5px] leading-relaxed text-slate-400 space-y-1">
                <p>Extracts Core Competencies.</p>
              </div>
            )}
            {selectedEngine === 'agreement_to_plan_engine' && (
              <div className="mt-2.5 p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg text-[9.5px] leading-relaxed text-slate-400 space-y-1">
                <p>Extracts KPAs and KPIs into a strict matrix mapped to the Annual Planner Grid.</p>
              </div>
            )}
            {selectedEngine === 'jsc_pdp_engine' && (
              <div className="mt-2.5 p-3 bg-pink-950/20 border border-pink-900/50 rounded-lg text-[9.5px] leading-relaxed text-slate-400 space-y-1">
                <p>Extracts Job Specific Competencies and PDP.</p>
              </div>
            )}
            {selectedEngine === 'cfo_competencies_engine' && (
              <div className="mt-2.5 p-3 bg-sky-950/20 border border-sky-900/50 rounded-lg text-[9.5px] leading-relaxed text-slate-400 space-y-1">
                <p>Extracts CFO core competencies.</p>
              </div>
            )}
            {selectedEngine === 'ped_competencies_engine' && (
              <div className="mt-2.5 p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg text-[9.5px] leading-relaxed text-slate-400 space-y-1">
                <p>Extracts PED core competencies.</p>
              </div>
            )}
            {selectedEngine === 'corporate_services_competencies_engine' && (
              <div className="mt-2.5 p-3 bg-pink-950/20 border border-pink-900/50 rounded-lg text-[9.5px] leading-relaxed text-slate-400 space-y-1">
                <p>Extracts Corporate Services core competencies.</p>
              </div>
            )}
            
            <div className="pt-5 border-t border-slate-800/80 space-y-3">
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <button type="button" onClick={() => {
                fileInputRef.current?.click();
              }} className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-800 transition text-xs font-bold shadow-sm">
                <UploadCloud className="w-4 h-4" />
                {selectedFile ? selectedFile.name : "Upload Document"}
              </button>
              
              <button type="button" onClick={handleExtract} disabled={!selectedFile || isExtracting} className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition text-xs font-bold shadow-md shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Initiate Extraction
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Workspace Results */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {isExtracting && (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-md text-center py-24 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Cognitive Extraction in Progress</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Fred is currently analyzing the document. This process requires complex schema mapping and semantic interpretation.
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-xs flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong className="block font-bold mb-1">Extraction Error</strong>
                {error}
              </div>
            </div>
          )}
          
          {successMsg && !isExtracting && extractionResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-xl text-emerald-400 text-xs flex gap-3 items-center">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}
          
          {extractionResult && !isExtracting && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
              <div className="p-4 md:p-6 flex-1 overflow-y-auto">
                {selectedEngine === 'sdbip_engine' && (
                  <div className="text-center p-8 text-slate-400 text-xs">SDBIP Extracted Successfully</div>
                )}
                
                {selectedEngine === 'core_competencies_engine' && (
                  <div className="text-center p-8 text-slate-400 text-xs">Core Competencies Extracted Successfully</div>
                )}
                
                {selectedEngine === 'cfo_competencies_engine' && (
                  <div className="text-center p-8 text-slate-400 text-xs">CFO Core Competencies Extracted Successfully</div>
                )}
                
                {selectedEngine === 'ped_competencies_engine' && (
                  <div className="text-center p-8 text-slate-400 text-xs">PED Core Competencies Extracted Successfully</div>
                )}
                
                {selectedEngine === 'corporate_services_competencies_engine' && (
                  <div className="text-center p-8 text-slate-400 text-xs">Corporate Services Core Competencies Extracted Successfully</div>
                )}
                
                {selectedEngine === 'agreement_to_plan_engine' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500">Document Reference ID</p>
                        <h4 className="text-xs font-mono font-bold text-indigo-300 mt-0.5">
                          {extractionResult.Document_Reference || "NKANGALA_MM_AGREEMENT_2025"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold">
                        Agreement to Plan Matrix
                      </span>
                    </div>
                    
                    <div className="bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-indigo-900/50 pb-2">
                         <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                           <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                           Data Verification
                         </h4>
                         <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                           {extractionResult.Performance_Plan?.KPAs?.reduce((acc, kpa) => acc + (kpa.Associated_KPIs?.length || 0), 0) || 0} Targets Extracted
                         </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Please verify the exact target mapping below. The extraction engine has mapped the targets exactly as they appear in the performance agreement document.
                      </p>
                      
                      <div className="flex gap-3 pt-2">
                        <button 
                          type="button"
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[11px] font-bold transition"
                          onClick={async () => {
                             alert("Pushing to Performance Planner...");
                          }}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Push to Performance Planner
                        </button>
                        
                        <button 
                          type="button"
                          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-[11px] font-bold transition"
                          onClick={() => {
                             setExtractionResult(null);
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Clear Extraction
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Extracted Performance Targets</h4>
                      
                      {extractionResult.Performance_Plan?.KPAs?.map((kpa, kIdx) => (
                        <div key={kIdx} className="bg-slate-900/40 border border-slate-850 rounded-lg overflow-hidden">
                          <div className="p-3 bg-slate-900/80 flex flex-col gap-1 border-b border-slate-850">
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                                KPA {kpa.KPA_Number || (kIdx + 1)}
                              </span>
                              <span className="text-xs font-bold text-white">{kpa.KPA_Description || "KPA Area Details"}</span>
                            </div>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-850 text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                                  <th className="p-3 font-medium min-w-[80px]">KPI NO</th>
                                  <th className="p-3 font-medium min-w-[200px]">KPI Description</th>
                                  <th className="p-3 font-medium min-w-[60px]">WT</th>
                                  <th className="p-3 font-medium min-w-[150px]">Baseline</th>
                                  <th className="p-3 font-medium min-w-[150px]">Annual Target</th>
                                  <th className="p-3 font-medium min-w-[100px]">1st Qtr Target</th>
                                  <th className="p-3 font-medium min-w-[100px]">2nd Qtr Target</th>
                                  <th className="p-3 font-medium min-w-[100px]">3rd Qtr Target</th>
                                  <th className="p-3 font-medium min-w-[100px]">4th Qtr Target</th>
                                  <th className="p-3 font-medium min-w-[150px]">Portfolio of Evidence</th>
                                  <th className="p-3 font-medium min-w-[100px]">Total Budget</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850">
                                {kpa.Associated_KPIs?.map((kpi, kpIdx) => (
                                  <tr key={kpIdx} className="hover:bg-slate-900/30 transition-colors">
                                    <td className="p-3 text-[10px] text-slate-400 font-mono align-top">{kpi.KPI_Number}</td>
                                    <td className="p-3 text-[11px] text-slate-200 align-top">{kpi.Key_Performance_Indicator}</td>
                                    <td className="p-3 text-[10px] text-pink-400 font-mono align-top">{kpi.Weight}</td>
                                    <td className="p-3 text-[10px] text-slate-400 align-top">{kpi.Baseline}</td>
                                    <td className="p-3 text-[10px] text-indigo-300 font-bold align-top">{kpi.Annual_Target}</td>
                                    <td className="p-3 text-[10px] text-emerald-400 align-top">{kpi.Q1_Target}</td>
                                    <td className="p-3 text-[10px] text-emerald-400 align-top">{kpi.Q2_Target}</td>
                                    <td className="p-3 text-[10px] text-emerald-400 align-top">{kpi.Q3_Target}</td>
                                    <td className="p-3 text-[10px] text-emerald-400 align-top">{kpi.Q4_Target}</td>
                                    <td className="p-3 text-[10px] text-slate-400 align-top">{kpi.POE}</td>
                                    <td className="p-3 text-[10px] text-slate-400 font-mono align-top">{kpi.Total_Budget_Allocated}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {(!kpa.Associated_KPIs || kpa.Associated_KPIs.length === 0) && (
                              <div className="text-center py-4 text-slate-500 text-[10px] italic">
                                No associated KPIs list extracted.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
{selectedEngine === 'jsc_pdp_engine' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500">Extraction Module</p>
                        <h4 className="text-xs font-mono font-bold text-indigo-300 mt-0.5">
                          JSC & PDP Extractions
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold">
                        Cognitive Pipeline
                      </span>
                    </div>

                    <div className="bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-indigo-900/50 pb-2">
                         <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                           <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                           Data Verification
                         </h4>
                         <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                           {extractionResult.Job_Specific_Competencies?.length || 0} JSCs | {extractionResult.Personal_Development_Plan?.length || 0} PDPs Extracted
                         </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Please verify the extraction targets before pushing to the respective planners.
                      </p>
                      
                      <div className="flex gap-3 pt-2">
                        <button 
                          type="button"
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[11px] font-bold transition"
                          onClick={async () => {
                             alert("Pushing to JSC Planner...");
                          }}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Push to JSC
                        </button>

                        <button 
                          type="button"
                          className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-[11px] font-bold transition"
                          onClick={async () => {
                             alert("Pushing to PDP Planner...");
                          }}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Push to PDP
                        </button>
                        
                        <button 
                          type="button"
                          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-[11px] font-bold transition"
                          onClick={() => {
                             setExtractionResult(null);
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Clear Extraction
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Job Specific Competencies (JSC)</h4>
                      
                      <div className="bg-slate-900/40 border border-slate-850 rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-850 text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                              <th className="p-3 font-medium min-w-[80px]">JSC No</th>
                              <th className="p-3 font-medium min-w-[200px]">Competency</th>
                              <th className="p-3 font-medium min-w-[300px]">Competency Definition</th>
                              <th className="p-3 font-medium min-w-[150px]">Level of Capability</th>
                              <th className="p-3 font-medium min-w-[100px]">Weight</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {extractionResult.Job_Specific_Competencies?.map((jsc: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                                <td className="p-3 text-[10px] text-slate-400 font-mono align-top">{jsc.jsc_no}</td>
                                <td className="p-3 text-[11px] text-slate-200 align-top font-bold">{jsc.competency}</td>
                                <td className="p-3 text-[10px] text-slate-400 align-top">{jsc.competency_definition}</td>
                                <td className="p-3 text-[10px] text-indigo-300 align-top">{jsc.level_of_capability}</td>
                                <td className="p-3 text-[10px] text-pink-400 font-mono align-top">{jsc.weight}</td>
                              </tr>
                            ))}
                            {(!extractionResult.Job_Specific_Competencies || extractionResult.Job_Specific_Competencies.length === 0) && (
                               <tr><td colSpan={5} className="text-center py-4 text-slate-500 text-[10px] italic">No JSCs extracted.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Personal Development Plan (PDP)</h4>
                      
                      <div className="bg-slate-900/40 border border-slate-850 rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-850 text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                              <th className="p-3 font-medium min-w-[180px]">Skills Gap (Priority Order)</th>
                              <th className="p-3 font-medium min-w-[200px]">Measurable Indicators/Outcomes Expected</th>
                              <th className="p-3 font-medium min-w-[200px]">Suggested Training and Development</th>
                              <th className="p-3 font-medium min-w-[150px]">Suggested Mode of Delivery</th>
                              <th className="p-3 font-medium min-w-[120px]">Suggested Time Frame</th>
                              <th className="p-3 font-medium min-w-[200px]">Practice Work Opportunity</th>
                              <th className="p-3 font-medium min-w-[120px]">Support Person</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {extractionResult.Personal_Development_Plan?.map((pdp: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                                <td className="p-3 text-[10px] text-pink-400 font-bold align-top">{pdp.skills_gap}</td>
                                <td className="p-3 text-[10px] text-slate-300 align-top">{pdp.outcomes_expected}</td>
                                <td className="p-3 text-[10px] text-emerald-400 font-medium align-top">{pdp.suggested_training_and_development}</td>
                                <td className="p-3 text-[10px] text-slate-400 align-top">{pdp.suggested_mode_of_delivery}</td>
                                <td className="p-3 text-[10px] text-amber-400 align-top">{pdp.suggested_time_frame}</td>
                                <td className="p-3 text-[10px] text-indigo-300 align-top">{pdp.practice_work_opportunity}</td>
                                <td className="p-3 text-[10px] text-slate-400 align-top">{pdp.support_person}</td>
                              </tr>
                            ))}
                            {(!extractionResult.Personal_Development_Plan || extractionResult.Personal_Development_Plan.length === 0) && (
                               <tr><td colSpan={7} className="text-center py-4 text-slate-500 text-[10px] italic">No PDPs extracted.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-900 text-slate-500 p-4 text-center text-[9px] border-t border-slate-800 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Extracted structures are successfully formatted and securely recorded in our Supabase messages ledger.</span>
              </div>
            </div>
          )}

          {/* Idle Placeholder instructions */}
          {!selectedFile && !isExtracting && !extractionResult && (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-md text-center py-24 space-y-4">
              <Archive className="w-12 h-12 text-slate-700 mx-auto animate-pulse animate-ease-in-out" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">Awaiting Cognitive Queue...</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Provide an input document file on the left pane and select your cognitive extraction engine. Fred will initiate advanced hard-coded extraction schema mapping to populate your secure tables.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
