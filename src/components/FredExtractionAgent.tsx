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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-load previously saved extractions from Supabase on mount or engine change
  useEffect(() => {
    const fetchSavedRecord = async () => {
      setDbStatus('checking');
      try {
        setError(null);
        setExtractionResult(null);
        setSuccessMsg(null);
        
        const response = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/${selectedEngine}?userId=${currentUser?.email || 'default'}`);
        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            setExtractionResult(json.data);
            setSuccessMsg(`Loaded previously analyzed record from Supabase database. parsed: ${json.extractedAt ? new Date(json.extractedAt).toLocaleString() : 'N/A'} for file "${json.fileName || 'unknown_file'}"`);
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
          userEmail: currentUser.email
        })
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Failed raw cognitive parsing of this document structure.");
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

            {selectedEngine === 'agreement_to_plan_engine' && (
              <div className="mt-2.5 p-3 bg-indigo-950/20 border border-indigo-900/50 rounded-lg text-[9.5px] leading-relaxed text-slate-400 space-y-1 select-text">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[8.5px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Exhaustive Extraction Protocol
                </div>
                <p>
                  All KPAs and KPIs are exhaustively extracted regardless of reference number format (<strong className="text-slate-200">M_</strong>, <strong className="text-slate-200">P_</strong>, <strong className="text-slate-200">U_</strong>, numeric, custom codes, or unassigned) and mapped directly to their respective Key Performance Area categories.
                </p>
              </div>
            )}
          </div>

          {/* Document Upload Zone */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-md flex flex-col items-center justify-center text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx"
            />
            
            <div className="p-4 bg-slate-900 rounded-full border border-slate-800 mb-4 text-indigo-400">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Upload Raw Contract / Document</h4>
            <p className="text-slate-500 text-[10px] mt-1 max-w-[280px]">
              Supports standard PDF and Word format (.docx files). File size up to 25MB.
            </p>

            {selectedFile ? (
              <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 w-full flex items-center justify-between">
                <div className="flex items-center gap-2 text-left">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <div className="max-w-[170px] truncate">
                    <p className="text-xs font-bold text-slate-300 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-500 hover:text-white transition"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={triggerSelectFile}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg active:scale-95 transition"
              >
                Select Input File
              </button>
            )}

            {selectedFile && (
              <button
                type="button"
                disabled={isExtracting}
                onClick={handleExtract}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-xs uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing & Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-white" />
                    <span>Launch Extraction</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Extraction Result Views */}
        <div className="lg:col-span-8 space-y-5">
          {/* Status Message Display */}
          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isExtracting && (
            <div className="bg-slate-950 p-12 rounded-xl border border-slate-800 text-center py-20 space-y-6">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-1">
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider">Fred is digesting the document structures...</h4>
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    Parsing text blocks, invoking strict cognitive output parameters, and mapping schema contents into Supabase relational tables. Please hold on.
                  </p>
                </div>
                
                {/* Real-time Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>PROGRESS STATUS</span>
                    <span className="text-indigo-400 font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-150 ease-out" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 italic">
                    {progress < 30 ? 'Initializing secure pipeline...' : 
                     progress < 70 ? 'Extracting text nodes and mapping structural schema...' : 
                     progress < 90 ? 'Validating schema rules and building associations...' : 
                     'Finalizing Supabase synchronizations...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Extraction Result View */}
          {extractionResult && !isExtracting && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-md divide-y divide-slate-800/80 overflow-hidden">
              <div className="p-5 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Active Schema Structure</span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-3 py-1 rounded-full font-bold">
                  {selectedEngine.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              {/* Rendering logic per engine result */}
              <div className="p-5">
                {selectedEngine === 'sdbip_engine' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mapped SDBIP Items Table</h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                        {extractionResult.items?.length || 0} entries found
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                      <table className="w-full text-left border-collapse text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] font-black">
                            <th className="p-3">National KPA</th>
                            <th className="p-3">SDBIP Strategic Objective</th>
                            <th className="p-3">KPI Area / Target</th>
                            <th className="p-3">Unit of Measure</th>
                            <th className="p-3">System Mapping Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {extractionResult.items?.map((item: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                              <td className="p-3 font-medium text-white max-w-[180px] truncate" title={item.National_KPA}>
                                {item.National_KPA || "N/A"}
                              </td>
                              <td className="p-3 max-w-[200px] truncate" title={item.SDBIP_Strategic_Objective}>
                                {item.SDBIP_Strategic_Objective || "N/A"}
                              </td>
                              <td className="p-3">
                                <p className="font-bold text-indigo-300 text-[11px]">{item.KPI || "N/A"}</p>
                                <p className="text-slate-400 text-[10px] mt-0.5">Target: {item.Target || "N/A"}</p>
                              </td>
                              <td className="p-3 text-slate-400">{item.Unit_of_Measure || "N/A"}</td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <div className="text-[9px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded inline-block border border-slate-800">
                                    Top Layer: {item.Mapping?.SDBIP_Top_Layer_Table || "Yes"}
                                  </div>
                                  <div className="text-[9px] text-indigo-300 font-mono bg-indigo-950/30 px-2 py-0.5 rounded block border border-indigo-900/30">
                                    Reporting: {item.Mapping?.SDBIP_Top_Layer_Reporting_Table || "Yes"}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {(!extractionResult.items || extractionResult.items.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-500 text-xs italic">
                                No SDBIP indicators extracted. Please ensure the uploaded file contains SDBIP table matrices.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedEngine === 'core_competencies_engine' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500">Employee Name</p>
                        <h4 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-emerald-400" />
                          {extractionResult.Employee_Name || "N/A"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                        {extractionResult.Core_Competencies?.length || 0} Core Competencies
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {extractionResult.Core_Competencies?.map((comp: any, cIdx: number) => (
                        <div key={cIdx} className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between hover:border-slate-700 transition duration-150">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-bold text-white">{comp.Competency_Name || "N/A"}</h5>
                              <span className="text-[10px] font-mono text-emerald-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-bold">
                                Wt: {comp.Weight || "10%"}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5 text-justify">
                              {comp.Definition || "No definition text provided."}
                            </p>
                          </div>
                          
                          <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between text-[9px] text-slate-550 font-mono">
                            <span>Mapping Registry:</span>
                            <span className="text-indigo-400 font-bold bg-indigo-950/20 py-0.5 px-2 rounded border border-indigo-900/30">
                              Core_Competencies_Table: {comp.Mapping?.Core_Competencies_Table || "Yes"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEngine === 'cfo_competencies_engine' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500">Employee Name (CFO)</p>
                        <h4 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-sky-400" />
                          {extractionResult.Employee_Name || "N/A"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-sky-950/40 border border-sky-900/40 text-sky-400 px-2.5 py-0.5 rounded-full font-bold">
                        {extractionResult.CFO_Core_Competencies?.length || 0} CFO Competencies Extracted
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                      <table className="w-full text-left border-collapse text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] font-black">
                            <th className="p-3">Competencies</th>
                            <th className="p-3">Components</th>
                            <th className="p-3">Competency Definition</th>
                            <th className="p-3 text-center">Weighting %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {extractionResult.CFO_Core_Competencies?.map((comp: any, cIdx: number) => (
                            <tr key={cIdx} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                              <td className="p-3 font-bold text-white max-w-[150px] whitespace-normal">
                                {comp.Competency || "N/A"}
                              </td>
                              <td className="p-3 max-w-[200px] whitespace-normal text-slate-400">
                                {comp.Components || "N/A"}
                              </td>
                              <td className="p-3 max-w-[250px] whitespace-normal text-slate-300">
                                {comp.Competency_Definition || "N/A"}
                              </td>
                              <td className="p-3 text-center font-mono text-sky-400 font-bold">
                                {comp.Weighting_Percent || "0"}%
                              </td>
                            </tr>
                          ))}
                          {(!extractionResult.CFO_Core_Competencies || extractionResult.CFO_Core_Competencies.length === 0) && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500 text-xs italic">
                                No CFO competencies extracted. Please ensure the uploaded document contains CFO specific matrices.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedEngine === 'ped_competencies_engine' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500">Employee Name (PED)</p>
                        <h4 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-amber-400" />
                          {extractionResult.Employee_Name || "N/A"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-950/40 border border-amber-900/40 text-amber-400 px-2.5 py-0.5 rounded-full font-bold">
                        {extractionResult.PED_Core_Competencies?.length || 0} PED Competencies Extracted
                      </span>
                    </div>
                    <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                      <table className="w-full text-left border-collapse text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] font-black">
                            <th className="p-3">Competencies</th>
                            <th className="p-3">Components</th>
                            <th className="p-3">Competency Definition</th>
                            <th className="p-3 text-center">Weighting %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {extractionResult.PED_Core_Competencies?.map((comp: any, cIdx: number) => (
                            <tr key={cIdx} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                              <td className="p-3 font-bold text-white max-w-[150px] whitespace-normal">
                                {comp.Competency || "N/A"}
                              </td>
                              <td className="p-3 max-w-[200px] whitespace-normal text-slate-400">
                                {comp.Components || "N/A"}
                              </td>
                              <td className="p-3 max-w-[250px] whitespace-normal text-slate-300">
                                {comp.Competency_Definition || "N/A"}
                              </td>
                              <td className="p-3 text-center font-mono text-amber-400 font-bold">
                                {comp.Weighting_Percent || "0"}%
                              </td>
                            </tr>
                          ))}
                          {(!extractionResult.PED_Core_Competencies || extractionResult.PED_Core_Competencies.length === 0) && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500 text-xs italic">
                                No PED competencies extracted. Please ensure the uploaded document contains PED specific matrices.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedEngine === 'corporate_services_competencies_engine' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500">Employee Name (Corporate Services)</p>
                        <h4 className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-pink-400" />
                          {extractionResult.Employee_Name || "N/A"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-pink-950/40 border border-pink-900/40 text-pink-400 px-2.5 py-0.5 rounded-full font-bold">
                        {extractionResult.Corporate_Services_Core_Competencies?.length || 0} Corporate Services Competencies Extracted
                      </span>
                    </div>
                    <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                      <table className="w-full text-left border-collapse text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] font-black">
                            <th className="p-3">Competencies</th>
                            <th className="p-3">Components</th>
                            <th className="p-3">Competency Definition</th>
                            <th className="p-3 text-center">Weighting %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {extractionResult.Corporate_Services_Core_Competencies?.map((comp: any, cIdx: number) => (
                            <tr key={cIdx} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                              <td className="p-3 font-bold text-white max-w-[150px] whitespace-normal">
                                {comp.Competency || "N/A"}
                              </td>
                              <td className="p-3 max-w-[200px] whitespace-normal text-slate-400">
                                {comp.Components || "N/A"}
                              </td>
                              <td className="p-3 max-w-[250px] whitespace-normal text-slate-300">
                                {comp.Competency_Definition || "N/A"}
                              </td>
                              <td className="p-3 text-center font-mono text-pink-400 font-bold">
                                {comp.Weighting_Percent || "0"}%
                              </td>
                            </tr>
                          ))}
                          {(!extractionResult.Corporate_Services_Core_Competencies || extractionResult.Corporate_Services_Core_Competencies.length === 0) && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500 text-xs italic">
                                No Corporate Services competencies extracted. Please ensure the uploaded document contains Corporate Services specific matrices.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                        Plan Matrix
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Extracted Performance Plan & KPAs</h4>
                      
                      {extractionResult.Performance_Plan?.KPAs?.map((kpa: any, kIdx: number) => (
                        <div key={kIdx} className="bg-slate-900/40 border border-slate-850 rounded-lg overflow-hidden">
                          <div className="p-3 bg-slate-900/80 flex items-center gap-2 border-b border-slate-850">
                            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                              KPA {kpa.KPA_Number || (kIdx + 1)}
                            </span>
                            <span className="text-xs font-bold text-white">{kpa.KPA_Description || "KPA Area Details"}</span>
                          </div>
                          
                          <div className="p-3 divide-y divide-slate-850">
                            {kpa.Associated_KPIs?.map((kpiItem: any, kpIdx: number) => (
                              <div key={kpIdx} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2.5">
                                <div className="flex items-start gap-2.5">
                                  <span className="text-[9px] font-mono font-bold text-slate-500 mt-0.5">
                                    [{kpiItem.KPI_Code || `KPI-${kpIdx+1}`}]
                                  </span>
                                  <span className="text-[11px] text-slate-300 leading-relaxed font-sans">
                                    {kpiItem.KPI_Description || "Key Performance Metric description."}
                                  </span>
                                </div>
                                {(kpiItem.Total_Budget_Allocated_R000 || kpiItem.budget || kpiItem.Budget) && (
                                  <span className="text-[9px] font-mono font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded whitespace-nowrap">
                                    R {kpiItem.Total_Budget_Allocated_R000 || kpiItem.budget || kpiItem.Budget} '000
                                  </span>
                                )}
                              </div>
                            ))}
                            {(!kpa.Associated_KPIs || kpa.Associated_KPIs.length === 0) && (
                              <div className="text-center py-2 text-slate-500 text-[10px] italic">
                                No associated KPIs list extracted.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quarter Board - Annual Planner Grid */}
                    <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl space-y-3 mt-6">
                      <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-805">
                        <Calendar className="w-3.5 h-3.5" />
                        Performance Annual Planner Grid
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {['Quarter_1', 'Quarter_2', 'Quarter_3', 'Quarter_4'].map((quarter, qIdx) => {
                          const items = (extractionResult.Performance_Plan?.Annual_Planner_Grid?.[quarter] || 
                                         extractionResult.Performance_Plan_Module?.Annual_Planner_Grid?.[quarter] || 
                                         extractionResult.Annual_Planner_Grid?.[quarter] || []);
                          return (
                            <div key={qIdx} className="bg-slate-950/40 rounded-lg p-3 border border-slate-850 flex flex-col justify-between">
                              <div>
                                <header className="flex justify-between items-center mb-2.5 pb-1 border-b border-slate-800">
                                  <span className="text-[10px] font-black uppercase text-white font-mono">{quarter.replace('_', ' ')}</span>
                                  <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                    {items.length} KPIs
                                  </span>
                                </header>
                                <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-0.5">
                                  {items.map((it: string, itIdx: number) => (
                                    <div key={itIdx} className="bg-slate-900 p-2 rounded border border-slate-850 text-[10px] text-slate-300 leading-tight flex gap-1.5 items-start">
                                      <span className="font-mono text-slate-500 mt-0.5">•</span>
                                      <span>{it}</span>
                                    </div>
                                  ))}
                                  {items.length === 0 && (
                                    <p className="text-[9px] text-slate-600 italic text-center py-4">No planner entries.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {selectedEngine === 'jsc_pdp_engine' && (
                  <div className="space-y-5">
                    
                    {/* Employee Profile Metadata Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/20">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-black text-slate-500">Officer Profile Details</p>
                          <h4 className="text-sm font-black text-white mt-0.5">
                            {extractionResult.Employee_Details?.Name || "N/A"}
                          </h4>
                          <p className="text-[10px] text-indigo-300 font-mono mt-0.5">
                            Title: {extractionResult.Employee_Details?.Job_Title || "Senior Manager / MM"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Job Specific Competencies Module */}
                      <div className="space-y-3 bg-slate-900/20 p-4 rounded-xl border border-slate-850">
                        <h4 className="text-[10px] font-black uppercase text-pink-400 tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800/50">
                          <Shield className="w-3.5 h-3.5" />
                          Job Specific Competencies
                        </h4>
                        
                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                          {extractionResult.Job_Specific_Competencies_Module?.JSCs?.map((jsc: any, jIdx: number) => (
                            <div key={jIdx} className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="text-[11px] font-bold text-white leading-tight">{jsc.Competency_Name || "Competency Unit"}</h5>
                                <span className="text-[9px] font-mono text-pink-400 bg-pink-950/30 px-1.5 py-0.5 rounded border border-pink-900/30">
                                  {jsc.Weight || "10%"}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed text-justify">
                                {jsc.Definition || "Details regarding Job Specific capability criteria."}
                              </p>
                            </div>
                          ))}
                          {(!extractionResult.Job_Specific_Competencies_Module?.JSCs || extractionResult.Job_Specific_Competencies_Module.JSCs.length === 0) && (
                            <div className="text-center py-6 text-slate-550 text-[10px] italic">
                              No JSCs extracted in this module.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Personal Development Plan Module */}
                      <div className="space-y-3 bg-slate-900/20 p-4 rounded-xl border border-slate-850">
                        <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800/50">
                          <CheckSquare className="w-3.5 h-3.5" />
                          Personal Development Plan (PDP)
                        </h4>
                        
                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                          {extractionResult.Personal_Development_Plan_Module?.PDPs?.map((pdp: any, pIdx: number) => (
                            <div key={pIdx} className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-1.5">
                              <div>
                                <p className="text-[9px] text-slate-500 font-mono uppercase">Developmental Area:</p>
                                <h5 className="text-[11px] font-bold text-white">{pdp.Developmental_Area || "Capability Area"}</h5>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-500 font-mono uppercase">Suggested Action:</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{pdp.Action_Plan || "Training course or peer mentorship activity"}</p>
                              </div>
                              <div className="flex justify-between items-center pt-1 text-[9px] text-slate-500">
                                <span>Timeframe:</span>
                                <span className="font-bold text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{pdp.Timeframe || "Continuous"}</span>
                              </div>
                            </div>
                          ))}
                          {(!extractionResult.Personal_Development_Plan_Module?.PDPs || extractionResult.Personal_Development_Plan_Module.PDPs.length === 0) && (
                            <div className="text-center py-6 text-slate-550 text-[10px] italic">
                              No PDP entries extracted in this module.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Quarter Board - Annual Planner Grid */}
                    <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-805">
                        <Calendar className="w-3.5 h-3.5" />
                        Performance Annual Planner Grid
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {['Quarter_1', 'Quarter_2', 'Quarter_3', 'Quarter_4'].map((quarter, qIdx) => {
                          const items = extractionResult.Performance_Plan_Module?.Annual_Planner_Grid?.[quarter] || [];
                          return (
                            <div key={qIdx} className="bg-slate-950/40 rounded-lg p-3 border border-slate-850 flex flex-col justify-between">
                              <div>
                                <header className="flex justify-between items-center mb-2.5 pb-1 border-b border-slate-800">
                                  <span className="text-[10px] font-black uppercase text-white font-mono">{quarter.replace('_', ' ')}</span>
                                  <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                    {items.length} KPIs
                                  </span>
                                </header>
                                <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-0.5">
                                  {items.map((it: string, itIdx: number) => (
                                    <div key={itIdx} className="bg-slate-900 p-2 rounded border border-slate-850 text-[10px] text-slate-300 leading-tight flex gap-1.5 items-start">
                                      <span className="font-mono text-slate-500 mt-0.5">•</span>
                                      <span>{it}</span>
                                    </div>
                                  ))}
                                  {items.length === 0 && (
                                    <p className="text-[9px] text-slate-600 italic text-center py-4">No planner entries.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
