const fs = require('fs');
const path = 'src/components/MzansiFlowAcademy.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`  const [history, setHistory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(\`academy_history_\${currentUser.email}\`);
    return saved ? JSON.parse(saved) : {};
  });`,
`  const [history, setHistory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(\`academy_history_\${currentUser.email}\`);
    if (saved && saved !== 'undefined') {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return {};
  });`
);
fs.writeFileSync(path, content);
console.log("Mzansi fixed");
