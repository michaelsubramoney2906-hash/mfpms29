const fs = require('fs');

const path = 'src/components/IPMS/PerformanceAgreements.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetMemo = "  // Check if active or impersonated user is a lead fire fighter";
const replacementMemo = `  const isDualLayerTeamLeader = React.useMemo(() => {
    const targetUser = effectiveUser || currentUser;
    if (!targetUser || !targetUser.email) return false;
    const email = targetUser.email.toLowerCase().trim();
    return DUAL_LAYER_USERS.includes(email);
  }, [effectiveUser, currentUser]);

  // Check if active or impersonated user is a lead fire fighter`;

if (!content.includes('const isDualLayerTeamLeader')) {
    content = content.replace(targetMemo, replacementMemo);
}
fs.writeFileSync(path, content);
