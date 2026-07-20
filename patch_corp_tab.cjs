const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = \`          <button
              onClick={() => setActiveTab('ped')}
              className={\\\`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 \${
                activeTab === 'ped'
                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }\\\`}
            >
              <span className={\\\`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors \${activeTab === 'ped' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'}\\\`}>PED</span>
              Core Competencies (PED)
            </button>\`;

const newStr = \`          <button
              onClick={() => setActiveTab('ped')}
              className={\\\`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 \${
                activeTab === 'ped'
                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }\\\`}
            >
              <span className={\\\`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors \${activeTab === 'ped' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'}\\\`}>PED</span>
              Core Competencies (PED)
            </button>
            <button
              onClick={() => setActiveTab('corp')}
              className={\\\`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 \${
                activeTab === 'corp'
                  ? 'bg-pink-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }\\\`}
            >
              <span className={\\\`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors \${activeTab === 'corp' ? 'bg-pink-800 text-pink-100' : 'bg-slate-200 text-slate-700'}\\\`}>CORP</span>
              Corporate Services
            </button>\`;

content = content.replace(targetStr, newStr);

// Also add the footer status verification for corp
const footerTarget = \`        {activeTab === 'ped' && (
          <div className="flex items-center gap-2">
            {totalPedWeight === 100 ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Total Weight: 100%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Weights Total: {totalPedWeight}% (Must equal 100%)
              </span>
            )}
          </div>
        )}\`;

const footerNew = footerTarget + \`
        {activeTab === 'corp' && (
          <div className="flex items-center gap-2">
            {totalCorpWeight === 100 ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Total Weight: 100%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Weights Total: {totalCorpWeight}% (Must equal 100%)
              </span>
            )}
          </div>
        )}\`;

content = content.replace(footerTarget, footerNew);

fs.writeFileSync(file, content);
