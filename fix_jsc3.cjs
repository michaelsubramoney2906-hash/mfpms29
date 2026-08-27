const fs = require('fs');
let jscPath = 'src/components/IPMS/JobSpecificCompetencies.tsx';
let jscContent = fs.readFileSync(jscPath, 'utf8');

// I need to ensure selectedUserEmail is defined
if (!jscContent.includes('const selectedUserEmail = selectedUserEmailState || userTargetEmail;')) {
    jscContent = jscContent.replace(
      "const [selectedUserEmailState, setSelectedUserEmailState] = useState<string>('');",
      "const [selectedUserEmailState, setSelectedUserEmailState] = useState<string>('');\n  const selectedUserEmail = selectedUserEmailState || userTargetEmail;"
    );
    fs.writeFileSync(jscPath, jscContent);
}

