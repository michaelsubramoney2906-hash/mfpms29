const fs = require('fs');

// Fix 1: DraftingSuiteTeam.tsx
let dstPath = 'src/components/IPMS/DraftingSuiteTeam.tsx';
let dstContent = fs.readFileSync(dstPath, 'utf8');

// The getEmailScope is defined but we might have placed it after usage or not in the right scope.
// Let's check where it is. It's likely placed at the bottom where we replaced 'export const calculateVariance'
const dualLayerArrayDst = `
const DUAL_LAYER_USERS_DST = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getEmailScope(email) {
  if (!email) return 'default';
  const norm = email.toLowerCase().trim();
  if (DUAL_LAYER_USERS_DST.includes(norm)) {
    return norm + '_team';
  }
  return norm;
}
`;
if (!dstContent.includes('const DUAL_LAYER_USERS_DST')) {
    dstContent = dstContent.replace('export function DraftingSuiteTeam', dualLayerArrayDst + '\nexport function DraftingSuiteTeam');
}

fs.writeFileSync(dstPath, dstContent);

// Fix 2: JobSpecificCompetencies.tsx
let jscPath = 'src/components/IPMS/JobSpecificCompetencies.tsx';
let jscContent = fs.readFileSync(jscPath, 'utf8');

jscContent = jscContent.replace(/setSelectedUserEmail\(/g, "setSelectedUserEmailState(");

fs.writeFileSync(jscPath, jscContent);
console.log("Lint fixes applied");
