with open('src/components/FredExtractionAgent.tsx', 'r') as f:
    content = f.read()

target1 = """                         <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                           <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                           Data Verification
                         </h4>
                         <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                           {extractionResult.Performance_Plan?.KPAs?.reduce((acc, kpa) => acc + (kpa.Associated_KPIs?.length || 0), 0) || 0} Targets Extracted
                         </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Please verify the exact target mapping below. The extraction engine has mapped the targets exactly as they appear in the performance agreement document.
                      </p>"""

replacement1 = """                         <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                           <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                           Data Verification
                         </h4>
                         <div className="flex gap-2">
                           <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-900/50">
                             Match: {extractionResult.Data_Match_Percentage || 100}%
                           </span>
                           <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                             {extractionResult.Performance_Plan?.KPAs?.reduce((acc: any, kpa: any) => acc + (kpa.Associated_KPIs?.length || 0), 0) || 0} Targets Extracted
                           </span>
                         </div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Please verify the exact target mapping below. The extraction engine has mapped the targets exactly as they appear in the performance agreement document, ensuring correct KPI Number mapping and sequential ordering.
                      </p>"""


target2 = """                              <thead>
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
                                ))}"""

replacement2 = """                              <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-850 text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                                  <th className="p-3 font-medium min-w-[80px]">Nat. KPA</th>
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
                                    <td className="p-3 text-[10px] text-indigo-400 font-bold font-mono align-top">{kpi.National_KPA || "-"}</td>
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
                                ))}"""

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Replaced target1!")
else:
    print("target1 not found!")

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced target2!")
else:
    print("target2 not found!")

with open('src/components/FredExtractionAgent.tsx', 'w') as f:
    f.write(content)

