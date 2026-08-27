const fs = require('fs');
let jscPath = 'src/components/IPMS/JobSpecificCompetencies.tsx';
let jscContent = fs.readFileSync(jscPath, 'utf8');

// I need to ensure all vars are ordered correctly
const declarations = `
  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
`;

jscContent = jscContent.replace(declarations, "");

const insertTarget = "const userTargetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;";
jscContent = jscContent.replace(
  insertTarget,
  declarations + "\n  " + insertTarget
);

fs.writeFileSync(jscPath, jscContent);
