const fs = require('fs');
const path = 'src/components/CouncilResolutions.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
`  const [resolutions, setResolutions] = useState<ResolutionItem[]>(() => {
    const saved = localStorage.getItem(\`council_resolutions_\${activeTenantId}\`);
    return saved ? JSON.parse(saved) : defaultInitialResolutions;
  });`,
`  const [resolutions, setResolutions] = useState<ResolutionItem[]>(() => {
    const saved = localStorage.getItem(\`council_resolutions_\${activeTenantId}\`);
    if (saved && saved !== 'undefined') {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return defaultInitialResolutions;
  });`
);
fs.writeFileSync(path, content);
console.log("CR fixed");
