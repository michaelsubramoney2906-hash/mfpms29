const fs = require('fs');
const path = 'src/components/IPMS/JSCModules.tsx';
let content = fs.readFileSync(path, 'utf8');

const bannerHtml = `
      {isTimeLocked ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium mb-4 mx-4">
          <span className="text-base">🔒</span>
          <span>This evaluation section is strictly time-locked. It is only active during its reporting period: <strong>{activePeriodStr}</strong>.</span>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium mb-4 mx-4">
          <span className="text-base">✅</span>
          <span>This evaluation section is currently active ({activePeriodStr}).</span>
        </div>
      )}
`;

content = content.replace(
  "{/* Main Table */}",
  "{/* Main Table */}\n" + bannerHtml
);

fs.writeFileSync(path, content);
console.log("Patched JSC banner");
