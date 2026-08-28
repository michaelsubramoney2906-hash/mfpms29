const fs = require('fs');
const path = 'src/components/IPMS/KPI_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

const uiToggle = `
        <div className="flex items-center gap-2">
          {isDualLayerTeamLeader && (
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl shrink-0 mr-2 border border-white/10">
              <button
                onClick={() => setAgreementScope('individual')}
                className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition \${
                  agreementScope === 'individual' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }\`}
              >
                My Personal Plan
              </button>
              <button
                onClick={() => setAgreementScope('team')}
                className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition \${
                  agreementScope === 'team' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }\`}
              >
                Team Plan
              </button>
            </div>
          )}
          {isDualLayerTeamLeader ? (
`;

content = content.replace(
  '        <div className="flex items-center gap-2">\n          {isDualLayerTeamLeader ? (',
  uiToggle
);

fs.writeFileSync(path, content);
console.log("KPI load toggle patched");
