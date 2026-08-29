const fs = require('fs');
const path = 'src/components/IPMS/KPA_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

const uiToggle = `
          {isDualLayerTeamLeader && (
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl shrink-0 mr-4">
              <button
                onClick={() => setAgreementScope('individual')}
                className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition \${
                  agreementScope === 'individual' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }\`}
              >
                My Personal Module
              </button>
              <button
                onClick={() => setAgreementScope('team')}
                className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition \${
                  agreementScope === 'team' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }\`}
              >
                Team Module
              </button>
            </div>
          )}
          <span className="text-xs bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
`;

if (!content.includes('My Personal Module')) {
  content = content.replace(
    '          <span className="text-xs bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">',
    uiToggle
  );
  fs.writeFileSync(path, content);
  console.log("KPA load toggle patched");
}
