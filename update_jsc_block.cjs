const fs = require('fs');

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
                )}
              </div>
              <div className="bg-slate-900 text-slate-500 p-4 text-center text-[9px] border-t border-slate-800 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Extracted structures are successfully formatted and securely recorded in our Supabase messages ledger.</span>
              </div>
            </div>
          )}`;

fs.writeFileSync('jsc_block.txt', newJscBlockStr);
console.log('Updated jsc_block.txt');
