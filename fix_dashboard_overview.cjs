const fs = require('fs');
const path = 'src/components/DashboardOverview.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`        const [usersRes, pplanRes, kpasRes, sdbipRes] = await Promise.all([
          fetch(\`/api/tenant/\${activeTenantId}/users\`).then(res => res.ok ? res.json() : []).catch(() => []),
          fetch(\`/api/tenant/\${activeTenantId}/pplan\`).then(res => res.ok ? res.json() : { items: [] }).catch(() => ({ items: [] })),
          fetch(\`/api/tenant/\${activeTenantId}/kpas\`).then(res => res.ok ? res.json() : { kpas: [] }).catch(() => ({ kpas: [] })),
          fetch(\`/api/tenant/\${activeTenantId}/sdbip23\`).then(res => res.ok ? res.json() : { items: [] }).catch(() => ({ items: [] }))
        ]);`,
`        const safeJson = async (res) => {
          try {
            const text = await res.text();
            if (!text) return null;
            return JSON.parse(text);
          } catch(e) {
            return null;
          }
        };
        const [usersRes, pplanRes, kpasRes, sdbipRes] = await Promise.all([
          fetch(\`/api/tenant/\${activeTenantId}/users\`).then(res => res.ok ? safeJson(res) : []).then(d => d || []).catch(() => []),
          fetch(\`/api/tenant/\${activeTenantId}/pplan\`).then(res => res.ok ? safeJson(res) : { items: [] }).then(d => d || { items: [] }).catch(() => ({ items: [] })),
          fetch(\`/api/tenant/\${activeTenantId}/kpas\`).then(res => res.ok ? safeJson(res) : { kpas: [] }).then(d => d || { kpas: [] }).catch(() => ({ kpas: [] })),
          fetch(\`/api/tenant/\${activeTenantId}/sdbip23\`).then(res => res.ok ? safeJson(res) : { items: [] }).then(d => d || { items: [] }).catch(() => ({ items: [] }))
        ]);`
);
fs.writeFileSync(path, content);
console.log("DashboardOverview fixed");
