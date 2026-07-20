const fs = require('fs');
const file = 'src/components/IPMS/PADraftingSuite.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = \`                    {pulledPedCompetencyRows !== null && (
                      <button
                        id="btn-remove-adopted-ped-competencies"
                        type="button"
                        onClick={() => {
                          setPulledPedCompetencyRows(null);
                          triggerNotification("Removed adopted PED core competencies table", "success");
                        }}
                        className="w-full text-left font-bold text-[10px] px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center justify-between transition-all mt-1"
                      >
                        <span className="flex items-center gap-1.5 leading-snug">
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          Remove Adopted PED Core Competencies Table
                        </span>
                        <span className="text-[8.5px] font-bold text-rose-600 uppercase">Clear Table</span>
                      </button>
                    )}
                  </>\`;

const corpTarget = \`
                {isMikeViewer && (
                  <>
                    <button
                      id="btn-adopt-corp-competencies"
                      type="button"
                      disabled={pullingCorpCompetencies}
                      onClick={handlePullCorpCompetencies}
                      className={\\\`w-full text-left font-bold text-[10px] px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer \${
                        pulledCorpCompetencyRows !== null 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                          : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-900'
                      }\\\`}
                    >
                      <span className="flex items-center gap-1.5 leading-snug">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        Adopt Corporate Services Core Competencies Table
                      </span>
                      {pullingCorpCompetencies ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 flex-shrink-0" />
                      ) : pulledCorpCompetencyRows !== null ? (
                        <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0">
                          {pulledCorpCompetencyRows.length} Corp Competencies Loaded
                        </span>
                      ) : (
                        <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      )}
                    </button>
                    {pulledCorpCompetencyRows !== null && (
                      <button
                        id="btn-remove-adopted-corp-competencies"
                        type="button"
                        onClick={() => {
                          setPulledCorpCompetencyRows(null);
                          triggerNotification("Removed adopted Corporate Services core competencies table", "success");
                        }}
                        className="w-full text-left font-bold text-[10px] px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center justify-between transition-all mt-1"
                      >
                        <span className="flex items-center gap-1.5 leading-snug">
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          Remove Adopted Corporate Services Core Competencies Table
                        </span>
                        <span className="text-[8.5px] font-bold text-rose-600 uppercase">Clear Table</span>
                      </button>
                    )}
                  </>\`;

content = content.replace(target, target + corpTarget);
fs.writeFileSync(file, content);
