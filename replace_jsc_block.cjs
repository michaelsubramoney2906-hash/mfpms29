const fs = require('fs');

let content = fs.readFileSync('src/components/FredExtractionAgent.tsx', 'utf8');

const oldJscBlockStr = `{selectedEngine === 'jsc_pdp_engine' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500">Document Reference ID</p>
                        <h4 className="text-xs font-mono font-bold text-indigo-300 mt-0.5">
                          {extractionResult.Document_Reference || "NKANGALA_MM_AGREEMENT_2025"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold">
                        JSC & PDP Cognitive Pipeline
                      </span>
                    </div>
                    <div className="bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-indigo-900/50 pb-2">
                         <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                           <UserIcon className="w-4 h-4 text-emerald-400" />
                           Employee Information Context
                         </h4>
                      </div>
                      <div className="flex gap-8">
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
                )}`;

const newJscBlockStr = `{selectedEngine === 'jsc_pdp_engine' && (
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
                )}`;

if (content.includes("{selectedEngine === 'jsc_pdp_engine' && (")) {
  
  // Try to find the exact block boundaries to do a precise replace, since simple replace might fail on string formatting
  const startIndex = content.indexOf("{selectedEngine === 'jsc_pdp_engine' && (");
  const endMarker = "          {/* Idle Placeholder instructions */}";
  const endIndex = content.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const startStr = content.substring(0, startIndex);
    const endStr = content.substring(endIndex);
    const updatedContent = startStr + newJscBlockStr + '\n\n' + endStr;
    fs.writeFileSync('src/components/FredExtractionAgent.tsx', updatedContent);
    console.log("Successfully replaced JSC Block.");
  } else {
    console.log("Could not find start/end markers.");
  }
} else {
  console.log("Could not find JSC block in file.");
}
