const fs = require('fs');

const path = 'src/components/IPMS/KPI_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

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
    fs.writeFileSync(path, content);
}
