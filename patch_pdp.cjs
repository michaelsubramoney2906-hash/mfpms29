const fs = require('fs');

const path = 'src/components/IPMS/PersonalDevelopmentPlan.tsx';
let content = fs.readFileSync(path, 'utf8');

const dualLayerArray = `
const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getIsDualLayerTeamLeader(email) {
  if (!email) return false;
  return DUAL_LAYER_USERS.includes(email.toLowerCase().trim());
}
`;

if (!content.includes('DUAL_LAYER_USERS')) {
    content = content.replace('export function PersonalDevelopmentPlan', dualLayerArray + '\nexport function PersonalDevelopmentPlan');
}

const targetScopeInjection = `
  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
  const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;
`;

if (!content.includes('const targetEmail =')) {
    content = content.replace("  // Navigation Tabs state", targetScopeInjection + "\n  // Navigation Tabs state");
}

// Now replace fetch usages of currentUser.email with targetEmail
content = content.replace(/fetch\(\`\/api\/tenant\/\$\{activeTenantId\}\/pdp\?userId=\$\{currentUser.email\}/g, "fetch(`/api/tenant/${activeTenantId}/pdp?userId=${targetEmail}");

// Inject the Scope Selector UI right after the "Personal Development Plan (PDP)" header or before the Tabs
const scopeToggleUI = `
        {isDualLayerTeamLeader && (
          <div className="bg-slate-900 px-6 py-3 flex items-center gap-4 justify-between border-b border-slate-800">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Dual-Layer Scope Toggle</span>
              <span className="text-[10px] text-slate-400">Switching will load/save a different PDP dataset.</span>
            </div>
            <div className="flex items-center bg-slate-800 rounded-xl p-1 shadow-inner border border-slate-700">
              <button 
                onClick={() => setAgreementScope('team')}
                className={\`px-6 py-2 rounded-lg text-xs font-bold transition-all \${agreementScope === 'team' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                Team PDP
              </button>
              <button 
                onClick={() => setAgreementScope('individual')}
                className={\`px-6 py-2 rounded-lg text-xs font-bold transition-all \${agreementScope === 'individual' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                My Personal PDP
              </button>
            </div>
          </div>
        )}
`;

if (!content.includes('Dual-Layer Scope Toggle')) {
    content = content.replace(
      '<div className="bg-white border-b border-gray-200 px-4 flex gap-4 overflow-x-auto hide-scrollbar">',
      scopeToggleUI + '\n        <div className="bg-white border-b border-gray-200 px-4 flex gap-4 overflow-x-auto hide-scrollbar">'
    );
}

// ensure useEffect listens to targetEmail
if (content.includes(', activeTenantId])')) {
  // If it's the loadData effect
  content = content.replace(/\]\);\n  \/\/ Load Data/g, ", targetEmail]);\n  // Load Data");
  content = content.replace(/activeTenantId\]\);\n\n  \/\/ Row Manipulation/g, "activeTenantId, targetEmail]);\n\n  // Row Manipulation");
}

fs.writeFileSync(path, content);
console.log("Patched PersonalDevelopmentPlan.tsx");
