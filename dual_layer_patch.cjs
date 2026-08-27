const fs = require('fs');

const path = 'src/components/IPMS/PerformanceAgreements.tsx';
let content = fs.readFileSync(path, 'utf8');

// We will insert DUAL_LAYER_USERS array at the top
const dualLayerArray = `
const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());
`;

if (!content.includes('DUAL_LAYER_USERS')) {
    content = content.replace('export const calculateVariance', dualLayerArray + '\nexport const calculateVariance');
}
fs.writeFileSync(path, content);
