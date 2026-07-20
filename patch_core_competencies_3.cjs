const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<button\n            onClick={() => setActiveTab(\'ped\')}',
  `<button
            onClick={() => setActiveTab('corp')}
            className={\`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors \${activeTab === 'corp' ? 'border-pink-500 text-pink-700 bg-pink-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}\`}
          >
            Corporate Services (Optional)
          </button>
          <button
            onClick={() => setActiveTab('ped')}`
);

// add corp table
content = content.replace(
  `{activeTab === 'ped' && pedRows.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">`,
  `{activeTab === 'corp' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100/50 border-b-2 border-slate-200 text-slate-600 text-[10px] uppercase font-black tracking-wider">
                    <th className="p-3 w-1/4">Competency</th>
                    <th className="p-3 w-1/4">Components</th>
                    <th className="p-3 w-1/3">Definition</th>
                    <th className="p-3 w-24 text-center">Weighting %</th>
                    {isMikeViewer() && <th className="p-3 w-16 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {corpRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-pink-50/30 transition group">
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4">
                        <input
                          type="text"
                          value={row.competency}
                          onChange={(e) => {
                            setCorpRows(prev => prev.map(r => r.id === row.id ? { ...r, competency: e.target.value } : r));
                            setSyncStatus('cached');
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-slate-800 placeholder-slate-400"
                          placeholder="e.g. Employee Relations..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4 text-xs text-slate-600">
                        <textarea
                          value={row.components}
                          onChange={(e) => {
                            setCorpRows(prev => prev.map(r => r.id === row.id ? { ...r, components: e.target.value } : r));
                            setSyncStatus('cached');
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[40px] placeholder-slate-400"
                          placeholder="e.g. Disciplinary hearings, policy review..."
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/3 text-xs text-slate-600">
                        <textarea
                          value={row.definition}
                          onChange={(e) => {
                            setCorpRows(prev => prev.map(r => r.id === row.id ? { ...r, definition: e.target.value } : r));
                            setSyncStatus('cached');
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[40px] placeholder-slate-400"
                          placeholder="e.g. Manages and resolves employee conflicts..."
                        />
                      </td>
                      <td className="p-3 text-center align-top border-r border-slate-100">
                        <div className="flex items-center justify-center">
                          <input
                            type="text"
                            value={row.weighting}
                            onChange={(e) => {
                              setCorpRows(prev => prev.map(r => r.id === row.id ? { ...r, weighting: e.target.value } : r));
                              setSyncStatus('cached');
                            }}
                            className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-xs font-bold text-pink-700"
                          />
                        </div>
                      </td>
                      {isMikeViewer() && (
                        <td className="p-3 text-center align-top">
                          <button
                            onClick={() => {
                              setCorpRows(prev => prev.filter(r => r.id !== row.id));
                              setSyncStatus('cached');
                            }}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Remove row"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {corpRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center bg-slate-50 border-b-2 border-dashed border-slate-300">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mb-2 text-slate-300" />
                          <p className="text-sm font-bold text-slate-500">No Corporate Services Competencies Configured</p>
                          <p className="text-xs mt-1 max-w-sm">Use the Fred Extraction Agent to import from a performance agreement, or add manually.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ped' && pedRows.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">`
);

content = content.replace(
  `{activeTab === 'ped' && pedRows.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">`,
  `{activeTab === 'corp' && corpRows.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Corporate Weight:</span>
                <span className={\`text-lg font-black \${totalCorpWeight === 100 ? 'text-emerald-600' : 'text-red-500'}\`}>
                  {totalCorpWeight}%
                </span>
                {totalCorpWeight !== 100 && (
                  <span className="text-[10px] text-red-500 font-bold ml-2 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    Must equal 100%
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ped' && pedRows.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">`
);


content = content.replace(
  `{activeTab === 'ped' && (
              <div className="flex gap-2 w-full sm:w-auto">
                {isMikeViewer() && (
                  <button
                    onClick={handlePullFredPed}
                    disabled={isPullingFredPed}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg transition-all border border-slate-700 disabled:opacity-50"
                  >
                    {isPullingFredPed ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    Pull Fred Extraction (PED)
                  </button>
                )}
                <button
                  onClick={() => {
                    setPedRows(prev => [...prev, { id: \`ped-row-\${Date.now()}\`, competency: '', components: '', definition: '', weighting: '0' }]);
                    setSyncStatus('cached');
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-lg border border-slate-200 transition-colors shadow-sm"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add PED Row
                </button>
              </div>
            )}`,
  `{activeTab === 'ped' && (
              <div className="flex gap-2 w-full sm:w-auto">
                {isMikeViewer() && (
                  <button
                    onClick={handlePullFredPed}
                    disabled={isPullingFredPed}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg transition-all border border-slate-700 disabled:opacity-50"
                  >
                    {isPullingFredPed ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    Pull Fred Extraction (PED)
                  </button>
                )}
                <button
                  onClick={() => {
                    setPedRows(prev => [...prev, { id: \`ped-row-\${Date.now()}\`, competency: '', components: '', definition: '', weighting: '0' }]);
                    setSyncStatus('cached');
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-lg border border-slate-200 transition-colors shadow-sm"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add PED Row
                </button>
              </div>
            )}
            
            {activeTab === 'corp' && (
              <div className="flex gap-2 w-full sm:w-auto">
                {isMikeViewer() && (
                  <button
                    onClick={handlePullFredCorp}
                    disabled={isPullingFredCorp}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-pink-400 font-bold text-xs rounded-lg transition-all border border-slate-700 disabled:opacity-50"
                  >
                    {isPullingFredCorp ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    Pull Fred Extraction (Corporate)
                  </button>
                )}
                <button
                  onClick={() => {
                    setCorpRows(prev => [...prev, { id: \`corp-row-\${Date.now()}\`, competency: '', components: '', definition: '', weighting: '0' }]);
                    setSyncStatus('cached');
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-lg border border-slate-200 transition-colors shadow-sm"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add Corp Row
                </button>
              </div>
            )}`
);

fs.writeFileSync(file, content);
