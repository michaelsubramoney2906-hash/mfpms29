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
  // Fix GET
  const getRegex = new RegExp(`app\\.get\\(\\s*"/api/tenant/:tenantId/${path}"\\s*,\\s*async\\s*\\(req,\\s*res\\)\\s*=>\\s*\\{\\n?\\s*const\\s*\\{\\s*tenantId\\s*\\}\\s*=\\s*req\\.params;\\n?\\s*try\\s*\\{\\n?\\s*const\\s*supabase\\s*=\\s*getSupabase\\(\\);\\n?\\s*const\\s*documentId\\s*=\\s*\`${doc}_\\$\\{tenantId\\}\`;`, 'g');
  
  code = code.replace(getRegex, `app.get("/api/tenant/:tenantId/${path}", async (req, res) => {\n    const { tenantId } = req.params;\n    const userId = req.query.userId ? String(req.query.userId) : 'default';\n    try {\n      const supabase = getSupabase();\n      const documentId = \`${doc}_\${tenantId}_\${userId}\`;`);

  // Fix POST
  const postRegex = new RegExp(`app\\.post\\(\\s*"/api/tenant/:tenantId/${path}"\\s*,\\s*async\\s*\\(req,\\s*res\\)\\s*=>\\s*\\{\\n?\\s*const\\s*\\{\\s*tenantId\\s*\\}\\s*=\\s*req\\.params;\\n?\\s*try\\s*\\{\\n?\\s*const\\s*supabase\\s*=\\s*getSupabase\\(\\);\\n?\\s*const\\s*documentId\\s*=\\s*\`${doc}_\\$\\{tenantId\\}\`;`, 'g');

  code = code.replace(postRegex, `app.post("/api/tenant/:tenantId/${path}", async (req, res) => {\n    const { tenantId } = req.params;\n    const userId = req.query.userId ? String(req.query.userId) : 'default';\n    try {\n      const supabase = getSupabase();\n      const documentId = \`${doc}_\${tenantId}_\${userId}\`;`);
}

fs.writeFileSync('server.ts', code);
console.log('Done refactoring server.ts');
