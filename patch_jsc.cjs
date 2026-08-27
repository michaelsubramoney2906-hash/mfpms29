const fs = require('fs');

const path = 'src/components/IPMS/JobSpecificCompetencies.tsx';
let content = fs.readFileSync(path, 'utf8');

const dualLayerArray = `
const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

function getIsDualLayerTeamLeader(email) {
  if (!email) return false;
  return DUAL_LAYER_USERS.includes(email.toLowerCase().trim());
}
`;

if (!content.includes('DUAL_LAYER_USERS')) {
    content = content.replace('export function JobSpecificCompetencies', dualLayerArray + '\nexport function JobSpecificCompetencies');
}

const targetScopeInjection = `
  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
  const userTargetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;
`;

if (!content.includes('const userTargetEmail =')) {
    content = content.replace("  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(currentUser.email || '');", "  const [selectedUserEmailState, setSelectedUserEmailState] = useState<string>('');\n" + targetScopeInjection);
    
    // Fix occurrences of selectedUserEmail being used as the target for loading saving.
    // Actually, JobSpecificCompetencies might let managers select users?
    // Let's check how selectedUserEmail is used.
}

fs.writeFileSync(path, content);
