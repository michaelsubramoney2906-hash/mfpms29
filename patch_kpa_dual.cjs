const fs = require('fs');
const path = 'src/components/IPMS/KPA_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

const singleBtn = `<button
                onClick={async () => {
                  await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows });
                }}
                disabled={saving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "SAVING TABLE..." : "SAVE TABLE CONTENT"}
              </button>`;

const dualBtns = `{isDualLayerTeamLeader ? (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows }, 'individual');
                }}
                disabled={saving}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "SAVING..." : "Commit Personal DB"}
              </button>
              <button
                onClick={async () => {
                  await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows }, 'team');
                }}
                disabled={saving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "SAVING..." : "Commit Team DB"}
              </button>
            </div>
          ) : (
            <button
                onClick={async () => {
                  await saveKpasList(kpas, { headers: tableHeaders, rows: tableRows });
                }}
                disabled={saving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition font-bold uppercase text-[10px] tracking-wider text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "SAVING TABLE..." : "Commit to Database"}
              </button>
          )}`;

if (content.includes('SAVE TABLE CONTENT')) {
    content = content.replace(singleBtn, dualBtns);
} else {
    console.log("Could not find singleBtn");
}

fs.writeFileSync(path, content);
console.log("KPA patched");
