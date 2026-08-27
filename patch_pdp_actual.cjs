const fs = require('fs');
const path = 'src/components/IPMS/PersonalDevelopmentPlan.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update signature
content = content.replace(
  "cmSupport = supportMasters\n  ) => {",
  "cmSupport = supportMasters,\n    explicitTargetEmail?: string\n  ) => {"
);

// 2. Update fetch inside handleSaveToDatabase
content = content.replace(
  "const res = await fetch(`/api/tenant/${activeTenantId}/pdp?userId=${targetEmail}`, {",
  "const emailToSave = explicitTargetEmail || targetEmail;\n      const res = await fetch(`/api/tenant/${activeTenantId}/pdp?userId=${emailToSave}`, {"
);

// 3. Update the button
const singleBtn = `<button
            onClick={() => handleSaveToDatabase()}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Syncing..." : "Database Commit"}</span>
          </button>`;

const dualBtns = `{isDualLayerTeamLeader ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveToDatabase(undefined, undefined, undefined, undefined, undefined, currentUser.email)}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Syncing..." : "Commit Personal DB"}</span>
              </button>
              <button
                onClick={() => handleSaveToDatabase(undefined, undefined, undefined, undefined, undefined, currentUser.email + '_team')}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Syncing..." : "Commit Team DB"}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleSaveToDatabase()}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 uppercase tracking-wide cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Syncing..." : "Database Commit"}</span>
            </button>
          )}`;

if (content.includes('Database Commit') || content.includes('Syncing...')) {
    content = content.replace(singleBtn, dualBtns);
}

fs.writeFileSync(path, content);
console.log("PDP actually patched");
