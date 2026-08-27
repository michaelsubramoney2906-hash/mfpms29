const fs = require('fs');

const path = 'src/components/IPMS/PerformanceAgreements.tsx';
let content = fs.readFileSync(path, 'utf8');

const searchState = "const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');";
const replacementState = `const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');`;

if (!content.includes('agreementScope')) {
    content = content.replace(searchState, replacementState);
}
fs.writeFileSync(path, content);
