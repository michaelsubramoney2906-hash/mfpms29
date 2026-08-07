const fs = require('fs');

const topContent = fs.readFileSync('src/components/FredExtractionAgent.tsx', 'utf8').split('\n').slice(0, 393).join('\n');
const jscBlock = fs.readFileSync('jsc_block.txt', 'utf8');

const newContent = topContent + `
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
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <button type="button" onClick={() => {
                const el = document.querySelector('input[type="file"]');
                if (el) el.click();
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
                             // Real push logic goes here later
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
                
` + jscBlock + `
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
`;

fs.writeFileSync('src/components/FredExtractionAgent.tsx', newContent, 'utf8');
console.log('Restored and patched FredExtractionAgent.tsx successfully.');
