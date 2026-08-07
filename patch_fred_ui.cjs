const fs = require('fs');

let content = fs.readFileSync('src/components/FredExtractionAgent.tsx', 'utf8');

const startStr = "{selectedEngine === 'agreement_to_plan_engine' && (";
const endStr = "{selectedEngine === 'jsc_pdp_engine' && (";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end string");
  process.exit(1);
}

const replacement = `{selectedEngine === 'agreement_to_plan_engine' && (
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
                           {extractionResult.Performance_Plan?.KPAs?.reduce((acc: number, kpa: any) => acc + (kpa.Associated_KPIs?.length || 0), 0) || 0} Targets Extracted
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
                             // Logic to map to Performance Planner goes here
                             // KPI Number to KPI NO, Key Performance Indicator to kpi description, Weight to wt, Baseline to baseline, etc.
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
                      
                      {extractionResult.Performance_Plan?.KPAs?.map((kpa: any, kIdx: number) => (
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
                                {kpa.Associated_KPIs?.map((kpi: any, kpIdx: number) => (
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
                
                `;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync('src/components/FredExtractionAgent.tsx', content, 'utf8');
console.log("Success");
