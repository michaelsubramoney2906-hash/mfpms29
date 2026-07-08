const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace all app.post that do not have `userId` extracting logic.
const resources = ['kpas', 'job-competencies', 'pdp', 'pplan', 'pa-drafting-doc', 'performance-agreements', 'jsc-draft', 'kpis'];

for (const path of resources) {
  // Fix the missing const userId in POST
  code = code.replace(new RegExp(`app\\.post\\("/api/tenant/:tenantId/${path}", async \\(req, res\\) => \\{\\n\\s*const \\{ tenantId \\} = req\\.params;(?!\\n\\s*const userId)`),
    `app.post("/api/tenant/:tenantId/${path}", async (req, res) => {\n    const { tenantId } = req.params;\n    const userId = req.query.userId ? String(req.query.userId) : 'default';`);

  // Same for GET just in case
  code = code.replace(new RegExp(`app\\.get\\("/api/tenant/:tenantId/${path}", async \\(req, res\\) => \\{\\n\\s*const \\{ tenantId \\} = req\\.params;(?!\\n\\s*const userId)`),
    `app.get("/api/tenant/:tenantId/${path}", async (req, res) => {\n    const { tenantId } = req.params;\n    const userId = req.query.userId ? String(req.query.userId) : 'default';`);
}

fs.writeFileSync('server.ts', code);
console.log('Done fixing missing userId declarations.');
