const fs = require('fs');
const content = fs.readFileSync('src/components/IPMS/PerformanceAgreements.tsx', 'utf8');

const isLeadFireFighterRegex = /const isLeadFireFighter = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[effectiveUser, currentUser\]\);/g;
const match = content.match(isLeadFireFighterRegex);
if(match) console.log(match[0]);
