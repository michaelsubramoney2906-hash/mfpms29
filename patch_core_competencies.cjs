const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("const [activeTab, setActiveTab] = useState<'standard' | 'cfo' | 'ped'>('standard');", "const [activeTab, setActiveTab] = useState<'standard' | 'cfo' | 'ped' | 'corp'>('standard');");
content = content.replace("const [isPullingFredCore, setIsPullingFredCore] = useState<boolean>(false);", "const [isPullingFredCore, setIsPullingFredCore] = useState<boolean>(false);\n  const [isPullingFredCorp, setIsPullingFredCorp] = useState<boolean>(false);");

content = content.replace("]);\n\n  // Handle cell edits for Standard rows", "]);\n\n  const [corpRows, setCorpRows] = useState<CFOCompetencyRow[]>([]);\n\n  // Handle cell edits for Standard rows");

content = content.replace("if (data.pedItems && Array.isArray(data.pedItems) && data.pedItems.length > 0) {\n            setPedRows(data.pedItems);\n          } else {\n            setPedRows([]);\n          }", "if (data.pedItems && Array.isArray(data.pedItems) && data.pedItems.length > 0) {\n            setPedRows(data.pedItems);\n          } else {\n            setPedRows([]);\n          }\n          if (data.corporateServicesItems && Array.isArray(data.corporateServicesItems) && data.corporateServicesItems.length > 0) {\n            setCorpRows(data.corporateServicesItems);\n          } else {\n            setCorpRows([]);\n          }");

content = content.replace("body: JSON.stringify({ items: rows, cfoItems: cfoRows, pedItems: pedRows })", "body: JSON.stringify({ items: rows, cfoItems: cfoRows, pedItems: pedRows, corporateServicesItems: corpRows })");

content = content.replace("const totalPedWeight = pedRows.reduce((acc, row) => {\n    const w = parseFloat(row.weighting) || 0;\n    return acc + w;\n  }, 0);", "const totalPedWeight = pedRows.reduce((acc, row) => {\n    const w = parseFloat(row.weighting) || 0;\n    return acc + w;\n  }, 0);\n\n  const totalCorpWeight = corpRows.reduce((acc, row) => {\n    const w = parseFloat(row.weighting) || 0;\n    return acc + w;\n  }, 0);");

fs.writeFileSync(file, content);
