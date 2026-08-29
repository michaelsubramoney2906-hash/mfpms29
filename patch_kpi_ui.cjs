const fs = require('fs');
const path = 'src/components/IPMS/KPI_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('My Personal Plan', 'My Personal Module');
content = content.replace('Team Plan', 'Team Module');

fs.writeFileSync(path, content);
