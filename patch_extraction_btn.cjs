const fs = require('fs');
const path = 'src/components/ExtractionEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

// replace handleSyncToIPMS definition
content = content.replace(
  'const handleSyncToIPMS = async () => {',
  'const handleSyncToIPMS = async (targetProfile: "individual" | "team" = "individual") => {'
);

// find where it sets the targetEmail inside handleSyncToIPMS
content = content.replace(
  'const targetEmail = targetEmployeeEmail || currentUser?.email || "";',
  'let targetEmail = targetEmployeeEmail || currentUser?.email || "";\n    if (targetProfile === "team") {\n      targetEmail = currentUser?.email ? currentUser.email + "_team" : "";\n    }'
);
content = content.replace(
  "const targetEmail = targetEmployeeEmail || currentUser?.email || '';",
  "let targetEmail = targetEmployeeEmail || currentUser?.email || '';\n    if (targetProfile === 'team') {\n      targetEmail = currentUser?.email ? currentUser.email + '_team' : '';\n    }"
);

const buttonsStr = `
                {/* DUAL LAYER EXTRACT BUTTONS */}
                {['hlezard@nkangaladm.gov.za', 'dimpems@nkangaladm.gov.za', 'madihlabapk@nkangaladm.gov.za', 'mazwitc@nkangaladm.gov.za', 'bembem@nkangaladm.gov.za', 'masanabol@nkangaladm.gov.za'].includes((currentUser?.email || '').toLowerCase().trim()) ? (
                  <div className="flex gap-2">
                    <button
                      id="btn_sync_to_ipms_module_indiv"
                      onClick={() => handleSyncToIPMS('individual')}
                      disabled={isSyncingToIPMS}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      {isSyncingToIPMS ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      <span>Push to Individual Performance Plan</span>
                    </button>
                    <button
                      id="btn_sync_to_ipms_module_team"
                      onClick={() => handleSyncToIPMS('team')}
                      disabled={isSyncingToIPMS}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      {isSyncingToIPMS ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      <span>Push to Team Performance Plan</span>
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn_sync_to_ipms_module"
                    onClick={() => handleSyncToIPMS('individual')}
                    disabled={isSyncingToIPMS}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isSyncingToIPMS ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>Push to IPMS Performance Plan</span>
                  </button>
                )}
`;

content = content.replace(
  /<button[\s\S]*?id="btn_sync_to_ipms_module"[\s\S]*?<\/button>/,
  buttonsStr
);

fs.writeFileSync(path, content);
console.log("ExtractionEngine patched");
