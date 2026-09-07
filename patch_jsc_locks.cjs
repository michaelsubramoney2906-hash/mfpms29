const fs = require('fs');
const path = 'src/components/IPMS/JSCModules.tsx';
let content = fs.readFileSync(path, 'utf8');

const lockLogic = `  const currentMonth = new Date().getMonth(); // 0-11
  let isTimeLocked = false;
  let activePeriodStr = "";
  if (selectedQuarter === 'q1') {
    isTimeLocked = !(currentMonth >= 6 && currentMonth <= 8);
    activePeriodStr = "July - September";
  } else if (selectedQuarter === 'q2') {
    isTimeLocked = !(currentMonth >= 9 && currentMonth <= 11);
    activePeriodStr = "October - December";
  } else if (selectedQuarter === 'q3') {
    isTimeLocked = !(currentMonth >= 0 && currentMonth <= 2);
    activePeriodStr = "January - March";
  } else if (selectedQuarter === 'q4') {
    isTimeLocked = !(currentMonth >= 3 && currentMonth <= 5);
    activePeriodStr = "April - June";
  }
`;

// Insert into JSCSelfEvaluationSection
let funcStart = content.indexOf("export function JSCSelfEvaluationSection(");
let renderStart = content.indexOf("return (", funcStart);
if (funcStart !== -1 && renderStart !== -1) {
  content = content.substring(0, renderStart) + lockLogic + "\n  " + content.substring(renderStart);
}

// Modify the isLocked variable in JSCSelfEvaluationSection map
// const isLocked = qData.status === 'pending_approval' || qData.status === 'approved' || qData.status === 'audited' || qData.status === 'moderated';
content = content.replace(
  "const isLocked = qData.status === 'pending_approval' || qData.status === 'approved' || qData.status === 'audited' || qData.status === 'moderated';",
  "const isLocked = qData.status === 'pending_approval' || qData.status === 'approved' || qData.status === 'audited' || qData.status === 'moderated' || isTimeLocked;"
);

// Add the banner above the table
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
  /<div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">/g,
  bannerHtml + '<div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">'
);

fs.writeFileSync(path, content);
console.log("Patched JSCModules.tsx");
