const fs = require('fs');
let jscPath = 'src/components/IPMS/JobSpecificCompetencies.tsx';
let jscContent = fs.readFileSync(jscPath, 'utf8');

// I need to ensure userTargetEmail is defined before it's used
const declaration = "const userTargetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;";
jscContent = jscContent.replace(declaration, "");

const insertTarget = "const selectedUserEmail = selectedUserEmailState || userTargetEmail;";
jscContent = jscContent.replace(
  insertTarget,
  declaration + "\n  " + insertTarget
);

fs.writeFileSync(jscPath, jscContent);
