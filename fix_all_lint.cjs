const fs = require('fs');

// Fix 1: KPA_IPMS
let kpaPath = 'src/components/IPMS/KPA_IPMS.tsx';
let kpaContent = fs.readFileSync(kpaPath, 'utf8');

const dualLayerArray = `
const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getIsDualLayerTeamLeader(email: string | undefined) {
  if (!email) return false;
  return DUAL_LAYER_USERS.includes(email.toLowerCase().trim());
}
`;

if (!kpaContent.includes('DUAL_LAYER_USERS')) {
    kpaContent = kpaContent.replace('export function KPAIPMS', dualLayerArray + '\nexport function KPAIPMS');
    fs.writeFileSync(kpaPath, kpaContent);
}

// Fix 2: KPI_IPMS
let kpiPath = 'src/components/IPMS/KPI_IPMS.tsx';
let kpiContent = fs.readFileSync(kpiPath, 'utf8');

kpiContent = kpiContent.replace(
  "body: JSON.stringify({ items: pplanData.items, managerSignoffs: pplanData.managerSignoffs })",
  "body: JSON.stringify({ items: pplanData.items })"
);

fs.writeFileSync(kpiPath, kpiContent);
console.log("Lint fixed");
