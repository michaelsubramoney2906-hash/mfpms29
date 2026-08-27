const fs = require('fs');

const path = 'src/components/IPMS/PerformanceAgreements.tsx';
let content = fs.readFileSync(path, 'utf8');

const searchSection = `        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-4 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('brief')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'brief' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Brief
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'templates' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Templates
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Drafting Suite
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite_firefighters')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite_firefighters' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            CDS Team PA
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite_technical_services')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite_technical_services' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Technical Services Team PA
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite_corporate_services')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite_corporate_services' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Corporate Services Team PA
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite_pms_team')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite_pms_team' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            PMS Team PA
          </button>
          {isLeadFireFighter && (
            <button 
              onClick={() => setActiveTab('lead_fire_fighter')}
              className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'lead_fire_fighter' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
            >
              Lead Fire Fighter PA
            </button>
          )}
        </div>`;

const replacement = `        {/* Navigation Tabs */}
        {isDualLayerTeamLeader && (
          <div className="bg-slate-900 px-6 py-3 flex items-center gap-4 justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Dual-Layer Performance Scope</span>
                <span className="text-[10px] text-slate-400">You manage a team and have an individual scorecard.</span>
              </div>
            </div>
            <div className="flex items-center bg-slate-800 rounded-xl p-1 shadow-inner border border-slate-700">
              <button 
                onClick={() => {
                  setAgreementScope('team');
                  setActiveTab('brief');
                }}
                className={\`px-6 py-2 rounded-lg text-xs font-bold transition-all \${agreementScope === 'team' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                Team Performance
              </button>
              <button 
                onClick={() => {
                  setAgreementScope('individual');
                  setActiveTab('drafting_suite');
                }}
                className={\`px-6 py-2 rounded-lg text-xs font-bold transition-all \${agreementScope === 'individual' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                My Personal Agreement
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border-b border-gray-200 px-6 flex gap-4 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('brief')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'brief' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Brief
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'templates' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            Templates
          </button>
          {(!isDualLayerTeamLeader || agreementScope === 'individual') && (
            <button 
              onClick={() => setActiveTab('drafting_suite')}
              className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
            >
              Drafting Suite
            </button>
          )}
          {(!isDualLayerTeamLeader || agreementScope === 'team') && (
            <>
              <button 
                onClick={() => setActiveTab('drafting_suite_firefighters')}
                className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite_firefighters' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
              >
                CDS Team PA
              </button>
              <button 
                onClick={() => setActiveTab('drafting_suite_technical_services')}
                className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite_technical_services' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
              >
                Technical Services Team PA
              </button>
              <button 
                onClick={() => setActiveTab('drafting_suite_corporate_services')}
                className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite_corporate_services' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
              >
                Corporate Services Team PA
              </button>
              <button 
                onClick={() => setActiveTab('drafting_suite_pms_team')}
                className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'drafting_suite_pms_team' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
              >
                PMS Team PA
              </button>
            </>
          )}
          {isLeadFireFighter && (!isDualLayerTeamLeader || agreementScope === 'team') && (
            <button 
              onClick={() => setActiveTab('lead_fire_fighter')}
              className={\`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap \${activeTab === 'lead_fire_fighter' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
            >
              Lead Fire Fighter PA
            </button>
          )}
        </div>`;

if (!content.includes('Dual-Layer Performance Scope')) {
    content = content.replace(searchSection, replacement);
    fs.writeFileSync(path, content);
    console.log("Successfully replaced tabs.");
} else {
    console.log("Already applied.");
}
