const fs = require('fs');
const path = 'src/components/IPMS/KPA_IPMS.tsx';
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
    content = content.replace('export function KPA_IPMS', dualLayerArray + '\nexport function KPA_IPMS');
}

// 1. Add isDualLayerTeamLeader to component top
if (!content.includes('const isDualLayerTeamLeader = getIsDualLayerTeamLeader')) {
    content = content.replace(
      '  const [kpas, setKpas] = useState<KpaUnit[]>([]);',
      '  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);\n  const [kpas, setKpas] = useState<KpaUnit[]>([]);'
    );
}

// 2. Modify save function
content = content.replace(
  "const saveKpasList = async (newList: KpaUnit[], customTableToSave = { headers: tableHeaders, rows: tableRows }) => {",
  "const saveKpasList = async (newList: KpaUnit[], customTableToSave = { headers: tableHeaders, rows: tableRows }, scopeOverride?: 'individual' | 'team') => {"
);
content = content.replace(
  "const res = await fetch(`/api/tenant/${activeTenantId}/kpas`, {",
  "const saveEmail = scopeOverride === 'team' ? currentUser.email + '_team' : currentUser.email;\n      const res = await fetch(`/api/tenant/${activeTenantId}/kpas?userId=${encodeURIComponent(saveEmail)}`, {"
);
// Also load needs to use currentUser.email by default
content = content.replace(
  "const res = await fetch(`/api/tenant/${activeTenantId}/kpas?t=${Date.now()}`);",
  "const res = await fetch(`/api/tenant/${activeTenantId}/kpas?userId=${encodeURIComponent(currentUser.email)}&t=${Date.now()}`);"
);

// 3. Buttons replacement
const singleButton = `<button
                onClick={async () => {
                  await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows });
                }}
                disabled={saving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "SAVING TABLE..." : "SAVE TABLE CONTENT"}
              </button>`;

const dualButtons = `{isDualLayerTeamLeader ? (
                <div className="flex gap-2">
                  <button
                    onClick={async () => await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows }, 'individual')}
                    disabled={saving}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "SAVING..." : "COMMIT PERSONAL DB"}
                  </button>
                  <button
                    onClick={async () => await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows }, 'team')}
                    disabled={saving}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "SAVING..." : "COMMIT TEAM DB"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows })}
                  disabled={saving}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "SAVING TABLE..." : "SAVE TABLE CONTENT"}
                </button>
              )}`;

if (content.includes('SAVE TABLE CONTENT')) {
    content = content.replace(singleButton, dualButtons);
}

fs.writeFileSync(path, content);
console.log("KPA patched");
