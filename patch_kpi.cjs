const fs = require('fs');

const path = 'src/components/IPMS/KPI_IPMS.tsx';
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
    content = content.replace('export function KPIIPMS', dualLayerArray + '\nexport function KPIIPMS');
}

const targetScopeInjection = `
  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
  const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;
`;

if (!content.includes('const targetEmail =')) {
    content = content.replace("  const [activeTab, setActiveTab] = useState<'build' | 'manage' | 'approve' | 'planner' | 'annual_planner'>('build');", targetScopeInjection + "\n  const [activeTab, setActiveTab] = useState<'build' | 'manage' | 'approve' | 'planner' | 'annual_planner'>('build');");
}

// Now replace fetch usages of currentUser.email with targetEmail
content = content.replace(/currentUser\.email/g, "targetEmail");

// Wait, currentUser.email is used in some places like currentUser.email || 'unknown'. 
// It's fine, targetEmail will be a string.

// Inject the Scope Selector UI right after the header or before the Tabs
const scopeToggleUI = `
        {isDualLayerTeamLeader && (
          <div className="bg-slate-900 px-6 py-3 flex items-center gap-4 justify-between border-b border-slate-800">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Dual-Layer Scope Toggle</span>
              <span className="text-[10px] text-slate-400">Switching will load/save a different KPI dataset.</span>
            </div>
            <div className="flex items-center bg-slate-800 rounded-xl p-1 shadow-inner border border-slate-700">
              <button 
                onClick={() => setAgreementScope('team')}
                className={\`px-6 py-2 rounded-lg text-xs font-bold transition-all \${agreementScope === 'team' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                Team KPIs
              </button>
              <button 
                onClick={() => setAgreementScope('individual')}
                className={\`px-6 py-2 rounded-lg text-xs font-bold transition-all \${agreementScope === 'individual' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                My Personal KPIs
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

// Fix useEffect dependencies
if (content.includes(', activeTenantId])')) {
  content = content.replace(/\]\);\n  \/\/ Extract distinct/g, ", targetEmail]);\n  // Extract distinct");
  content = content.replace(/\]\);\n\n  \/\/ Extract distinct/g, ", targetEmail]);\n\n  // Extract distinct");
}

// Wait, I replaced `currentUser.email` with `targetEmail` globally in this file, which is exactly what we want.
// But some places might have `currentUser.name || targetEmail`. That's fine.
// One more fix, we shouldn't replace `currentUser.email` in `PersonalDevelopmentPlanProps` interface or similar.
// But we didn't do it via Regex for type definitions, we did it blindly. Let's see if it broke types.

fs.writeFileSync(path, content);
console.log("Patched KPI_IPMS.tsx");
