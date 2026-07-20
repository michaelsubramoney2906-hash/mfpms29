const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

const newButton = `          {isMikeViewer() && activeTab === 'ped' && (
            <button
              onClick={handlePullFredPed}
              disabled={isPullingFredPed}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
            >
              {isPullingFredPed ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-white" />
                  <span>Import Fred PED Extraction</span>
                </>
              )}
            </button>
          )}

          {isMikeViewer() && activeTab === 'corp' && (
            <button
              onClick={handlePullFredCorp}
              disabled={isPullingFredCorp}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
            >
              {isPullingFredCorp ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-white" />
                  <span>Import Fred Corp Extraction</span>
                </>
              )}
            </button>
          )}`;

content = content.replace(
  `          {isMikeViewer() && activeTab === 'ped' && (
            <button
              onClick={handlePullFredPed}
              disabled={isPullingFredPed}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
            >
              {isPullingFredPed ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-white" />
                  <span>Import Fred PED Extraction</span>
                </>
              )}
            </button>
          )}`,
  newButton
);

fs.writeFileSync(file, content);
