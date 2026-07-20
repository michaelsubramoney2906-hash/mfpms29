const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "  const handleAddRowClick = () => {\n    if (activeTab === 'standard') {\n      handleAddRow();\n    } else if (activeTab === 'cfo') {\n      handleAddCfoRow();\n    } else {\n      handleAddPedRow();\n    }\n  };",
  "  const handleAddRowClick = () => {\n    if (activeTab === 'standard') {\n      handleAddRow();\n    } else if (activeTab === 'cfo') {\n      handleAddCfoRow();\n    } else if (activeTab === 'ped') {\n      handleAddPedRow();\n    } else {\n      setCorpRows(prev => [...prev, { id: `corp-row-${Date.now()}`, competency: '', components: '', definition: '', weighting: '0' }]);\n      setSyncStatus('cached');\n    }\n  };"
);

fs.writeFileSync(file, content);
