const fs = require('fs');

const path = 'src/components/IPMS/KPI_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

const anchor = "  const [notification, setNotification] = useState<string | null>(null);";
const targetScopeInjection = `
  const isDualLayerTeamLeader = getIsDualLayerTeamLeader(currentUser?.email);
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');
  const targetEmail = isDualLayerTeamLeader && agreementScope === 'team' ? currentUser.email + '_team' : currentUser.email;
`;

if (!content.includes('const targetEmail =')) {
    content = content.replace(anchor, anchor + "\n" + targetScopeInjection);
    content = content.replace(/currentUser\.email/g, "targetEmail");
    
    // Restore the parameter definitions
    content = content.replace(/targetEmail\?: string;/g, "email?: string;");
    content = content.replace(/currentUser: \{\n    targetEmail: string;/g, "currentUser: {\n    email: string;");
    content = content.replace(/targetEmail: string;\n  role: string;/g, "email: string;\n  role: string;");
    content = content.replace(/currentUser\?\.targetEmail/g, "currentUser?.email");
    content = content.replace(/getIsDualLayerTeamLeader\(currentUser\?\.targetEmail\)/g, "getIsDualLayerTeamLeader(currentUser?.email)");
    content = content.replace(/currentUser\.targetEmail \+ '_team' : currentUser\.targetEmail/g, "currentUser.email + '_team' : currentUser.email");
    
    fs.writeFileSync(path, content);
}
