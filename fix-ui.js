import fs from 'fs';

let content = fs.readFileSync('src/components/IPMS/PerformanceAgreements.tsx', 'utf8');

content = content.replace(
  "const res = await fetch(`/api/tenant/${activeTenantId}/pa-drafting-doc`);",
  `if (!activeTenantId) return;
        const res = await fetch(\`/api/tenant/\${activeTenantId}/pa-drafting-doc\`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {`
);

content = content.replace(
  `        if (res.ok) {
          const data = await res.json();
          if (data.html && editorRef.current) {
            editorRef.current.innerHTML = data.html;
          }
        }`,
  `          const data = await res.json();
          if (data.html && editorRef.current) {
            editorRef.current.innerHTML = data.html;
          }
        }`
);

fs.writeFileSync('src/components/IPMS/PerformanceAgreements.tsx', content, 'utf8');
console.log('Fixed IPMS UI');
