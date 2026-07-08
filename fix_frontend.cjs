const fs = require('fs');
const path = require('path');

const ipmsDir = './src/components/IPMS';
const files = fs.readdirSync(ipmsDir).filter(f => f.endsWith('.tsx'));

const pathsToUpdate = [
  'job-competencies',
  'kpas',
  'kpis',
  'pa-drafting-doc',
  'pdp',
  'performance-agreements',
  'pplan',
  'jsc-draft',
  'reports'
];

for (const file of files) {
  const fullPath = path.join(ipmsDir, file);
  let code = fs.readFileSync(fullPath, 'utf8');

  // Replace fetch(`/api/tenant/${activeTenantId}/path` with fetch(`/api/tenant/${activeTenantId}/path?userId=${encodeURIComponent(currentUser.email)}`
  // We need to use Regex.
  for (const p of pathsToUpdate) {
    const rx = new RegExp(`\\\`/api/tenant/\\\\\\$\\{activeTenantId\\}/${p}\\\``, 'g');
    code = code.replace(rx, `\`/api/tenant/\${activeTenantId}/${p}?userId=\${encodeURIComponent(currentUser?.email || 'default')}\``);
  }

  fs.writeFileSync(fullPath, code);
}
console.log('Done front-end fetch URLs');
