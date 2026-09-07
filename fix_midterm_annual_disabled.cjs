const fs = require('fs');
const path = 'src/components/IPMS/Evaluation_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

// Midterm tab replacement
let midtermStart = content.indexOf("{currentTab === 'midtermjs'");
let midtermEnd = content.indexOf("{currentTab === 'q3'");
if (midtermStart !== -1 && midtermEnd !== -1) {
  let midtermSection = content.substring(midtermStart, midtermEnd);
  midtermSection = midtermSection.replace(/disabled={kpiIsReadOnly}/g, "disabled={kpiIsReadOnly || isMidtermTimeLocked}");
  content = content.substring(0, midtermStart) + midtermSection + content.substring(midtermEnd);
}

// Annual tab replacement
let annualStart = content.indexOf("{currentTab === 'annual'");
let annualEnd = content.indexOf("{currentTab === 'overall'");
if (annualStart !== -1 && annualEnd !== -1) {
  let annualSection = content.substring(annualStart, annualEnd);
  annualSection = annualSection.replace(/disabled={kpiIsReadOnly}/g, "disabled={kpiIsReadOnly || isAnnualTimeLocked}");
  content = content.substring(0, annualStart) + annualSection + content.substring(annualEnd);
}

fs.writeFileSync(path, content);
console.log("Fixed Midterm and Annual disabled flags");
