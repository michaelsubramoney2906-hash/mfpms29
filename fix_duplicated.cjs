const fs = require('fs');
const path = 'src/components/IPMS/Evaluation_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\|\| isQ1TimeLocked \|\| isQ1TimeLocked/g, '|| isQ1TimeLocked');
content = content.replace(/\|\| isQ2TimeLocked \|\| isQ2TimeLocked/g, '|| isQ2TimeLocked');
content = content.replace(/\|\| isQ3TimeLocked \|\| isQ3TimeLocked/g, '|| isQ3TimeLocked');
content = content.replace(/\|\| isQ4TimeLocked \|\| isQ4TimeLocked/g, '|| isQ4TimeLocked');

fs.writeFileSync(path, content);
console.log("Fixed duplicates");
