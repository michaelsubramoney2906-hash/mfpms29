const fs = require('fs');
const path = 'src/components/ExtractionEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/handleProcessPastedTable/g, 'handleParsePastedText');

fs.writeFileSync(path, content);
console.log("Fixed function name");
