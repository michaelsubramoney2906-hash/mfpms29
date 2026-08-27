const fs = require('fs');

const path = 'src/components/IPMS/DraftingSuiteTeam.tsx';
let content = fs.readFileSync(path, 'utf8');

const dualLayerArray = `
const DUAL_LAYER_USERS = [
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
  if (DUAL_LAYER_USERS.includes(norm)) {
    return norm + '_team';
  }
  return norm;
}
`;

if (!content.includes('DUAL_LAYER_USERS')) {
    content = content.replace('export const calculateVariance', dualLayerArray + '\nexport const calculateVariance');
    
    // Replace emailToUse assignments
    content = content.replace(/const emailToUse = currentUser\?\.email \|\| 'khuboniy@nkangaladm.gov.za';/g, "const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');");
    content = content.replace(/const emailToUse = \(currentUser\?\.email \|\| 'khuboniy@nkangaladm.gov.za'\)\.toLowerCase\(\)\.trim\(\);/g, "const emailToUse = getEmailScope(currentUser?.email || 'khuboniy@nkangaladm.gov.za');");
    
    fs.writeFileSync(path, content);
    console.log("Patched DraftingSuiteTeam.tsx");
} else {
    console.log("Already patched DraftingSuiteTeam.tsx");
}
