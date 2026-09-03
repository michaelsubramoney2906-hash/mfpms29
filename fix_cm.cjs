const fs = require('fs');
const path = 'src/components/CouncilMembers.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
`  const [members, setMembers] = useState<CouncilMember[]>(() => {
    const saved = localStorage.getItem(\`council_members_\${activeTenantId}\`);
    return saved ? JSON.parse(saved) : initialPlaceholderMembers;
  });`,
`  const [members, setMembers] = useState<CouncilMember[]>(() => {
    const saved = localStorage.getItem(\`council_members_\${activeTenantId}\`);
    if (saved && saved !== 'undefined') {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return initialPlaceholderMembers;
  });`
);
fs.writeFileSync(path, content);
console.log("CM fixed");
