const fs = require('fs');
let code = fs.readFileSync('src/components/IPMS/Evaluation_IPMS.tsx', 'utf8');

code = code.replace(
/await fetch\(\`\/api\/tenant\/\$\{activeTenantId\}\/pplan\?userId=\$\{encodeURIComponent\(currentUser\.email\)\}\`, \{\n\s*method: 'POST',\n\s*headers: \{ 'Content-Type': 'application\/json' \},\n\s*body: JSON.stringify\(payload\)\n\s*\}\);/g,
`const pplanRes = await fetch(\`/api/tenant/\${activeTenantId}/pplan?userId=\${encodeURIComponent(currentUser.email)}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!pplanRes.ok) {
        throw new Error("Failed to save. Status: " + pplanRes.status + " " + pplanRes.statusText);
      }`
);

fs.writeFileSync('src/components/IPMS/Evaluation_IPMS.tsx', code);
