const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const resources = [
  { path: 'kpas', doc: 'kpas' },
  { path: 'job-competencies', doc: 'job_competencies' },
  { path: 'pdp', doc: 'pdp' },
  { path: 'pplan', doc: 'pplan' },
  { path: 'pa-drafting-doc', doc: 'pa_drafting_doc' },
  { path: 'performance-agreements', doc: 'performance_agreements' },
  { path: 'jsc-draft', doc: 'jsc_draft' },
  { path: 'kpis', doc: 'kpis' }
];

for (const { path, doc } of resources) {
  // Regex to find the app.get or app.post line and the documentId line.
  // It's safer to just find `const documentId = \`${doc}_\${tenantId}\`;` 
  // and replace it, AND insert userId extraction.
  
  const getRegex = new RegExp(`(app\\.get\\(\\s*"/api/tenant/:tenantId/${path}"\\s*,\\s*async\\s*\\(req,\\s*res\\)\\s*=>\\s*\\{[\\s\\S]*?)(const documentId = \`${doc}_\\$\\{tenantId\\}\`;)`, 'g');
  
  code = code.replace(getRegex, (match, prefix, docIdDecl) => {
      // If it already has userId, skip adding it
      let newPrefix = prefix;
      if (!newPrefix.includes('const userId = req.query.userId')) {
          newPrefix = newPrefix.replace('const { tenantId } = req.params;', 'const { tenantId } = req.params;\n    const userId = req.query.userId ? String(req.query.userId) : \'default\';');
      }
      return newPrefix + `const documentId = \`${doc}_\${tenantId}_\${userId}\`;`;
  });

  const postRegex = new RegExp(`(app\\.post\\(\\s*"/api/tenant/:tenantId/${path}"\\s*,\\s*async\\s*\\(req,\\s*res\\)\\s*=>\\s*\\{[\\s\\S]*?)(const documentId = \`${doc}_\\$\\{tenantId\\}\`;)`, 'g');

  code = code.replace(postRegex, (match, prefix, docIdDecl) => {
      let newPrefix = prefix;
      if (!newPrefix.includes('const userId = req.query.userId')) {
          newPrefix = newPrefix.replace('const { tenantId } = req.params;', 'const { tenantId } = req.params;\n    const userId = req.query.userId ? String(req.query.userId) : \'default\';');
      }
      return newPrefix + `const documentId = \`${doc}_\${tenantId}_\${userId}\`;`;
  });
}

// Ensure SDBIP23 is updated in real time when performance plan is saved.
// In the pplan POST route, we should append to sdbip23.
// We'll append this logic using another replace.

fs.writeFileSync('server.ts', code);
console.log('Done fixing logic 2');
