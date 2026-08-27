const fs = require('fs');

const path = 'src/components/IPMS/PersonalDevelopmentPlan.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update saveToDatabase to accept scopeOverride
content = content.replace(
  "const saveToDatabase = async () => {",
  "const saveToDatabase = async (scopeOverride?: 'individual' | 'team') => {"
);

// 2. Change the fetch URL inside saveToDatabase
// Currently it might be using targetEmail
content = content.replace(
  /fetch\(\`\/api\/tenant\/\$\{activeTenantId\}\/pdp\?userId=\$\{encodeURIComponent\(targetEmail\)\}\`/g,
  "fetch(`/api/tenant/${activeTenantId}/pdp?userId=${encodeURIComponent(scopeOverride === 'team' ? currentUser.email + '_team' : (scopeOverride === 'individual' ? currentUser.email : targetEmail))}`"
);

// 3. Find the single save button and replace it
const singleButton = `<button
            onClick={saveToDatabase}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-md border border-indigo-500"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Commit to Database
          </button>`;

const dualButtons = `{isDualLayerTeamLeader ? (
            <div className="flex gap-2">
              <button
                onClick={() => saveToDatabase('individual')}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-md border border-emerald-500"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Commit Personal DB
              </button>
              <button
                onClick={() => saveToDatabase('team')}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-md border border-indigo-500"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Commit Team DB
              </button>
            </div>
          ) : (
            <button
              onClick={() => saveToDatabase('individual')}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-md border border-indigo-500"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Commit to Database
            </button>
          )}`;

if (content.includes('Commit to Database')) {
    content = content.replace(singleButton, dualButtons);
}

fs.writeFileSync(path, content);
console.log("PDP patched");
