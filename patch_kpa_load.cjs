const fs = require('fs');
const path = 'src/components/IPMS/KPA_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

const injectionState = `
  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
  const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;
`;

content = content.replace("  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);", injectionState);

const loadInjection = `
  const loadKpas = async () => {
    setLoading(true);
    try {
      const res = await fetch(\`/api/tenant/\${activeTenantId}/kpas?userId=\${encodeURIComponent(targetEmail)}&t=\${Date.now()}\`);
`;
content = content.replace(
  "  const loadKpas = async () => {\n    setLoading(true);\n    try {\n      const res = await fetch(`/api/tenant/${activeTenantId}/kpas?userId=${encodeURIComponent(currentUser.email)}&t=${Date.now()}`);",
  loadInjection
);

const depsInjection = `
  useEffect(() => {
    loadKpas();
  }, [activeTenantId, targetEmail]);
`;
content = content.replace(
  "  useEffect(() => {\n    loadKpas();\n  }, [activeTenantId]);",
  depsInjection
);

const uiToggle = `
          {isDualLayerTeamLeader && (
            <div className="flex items-center gap-1.5 bg-slate-200/50 p-1 rounded-xl shrink-0 mr-4">
              <button
                onClick={() => setAgreementScope('individual')}
                className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition \${
                  agreementScope === 'individual' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-700'
                }\`}
              >
                My Personal KPAs
              </button>
              <button
                onClick={() => setAgreementScope('team')}
                className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition \${
                  agreementScope === 'team' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'
                }\`}
              >
                Team KPAs
              </button>
            </div>
          )}
          <button
`;

content = content.replace(
  "          <button\n            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}",
  uiToggle + "\n            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}"
);

fs.writeFileSync(path, content);
console.log("KPA load patched");
