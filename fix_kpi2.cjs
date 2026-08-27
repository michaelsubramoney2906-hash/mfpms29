const fs = require('fs');

const path = 'src/components/IPMS/KPI_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? targetEmail + '_team' : targetEmail;", 
  "const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;"
);

fs.writeFileSync(path, content);
