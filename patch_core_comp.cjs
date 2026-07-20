const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove isMikeViewer function and the useEffect that forces activeTab
content = content.replace(/  const isMikeViewer = \(\) => {[\s\S]*?setActiveTab\('standard'\);\n    }\n  }, \[currentUser, activeTab\]\);\n/g, '');

// 2. Remove {isMikeViewer() && ...} wrappers around tabs
content = content.replace(/\{isMikeViewer\(\) && \(\s*<button\s*onClick=\{\(\) => setActiveTab\('cfo'\)\}/g, "<button onClick={() => setActiveTab('cfo')}");
content = content.replace(/\{isMikeViewer\(\) && \(\s*<button\s*onClick=\{\(\) => setActiveTab\('ped'\)\}/g, "<button onClick={() => setActiveTab('ped')}");
content = content.replace(/\{isMikeViewer\(\) && \(\s*<button\s*onClick=\{\(\) => setActiveTab\('corp'\)\}/g, "<button onClick={() => setActiveTab('corp')}");

// We need a more robust replace for the tabs
