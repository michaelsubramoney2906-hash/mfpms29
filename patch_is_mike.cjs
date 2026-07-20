const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

// remove isMikeViewer function and useEffect
content = content.replace(/  const isMikeViewer = \(\) => \{\n    const email = \(currentUser\?\.email \|\| ""\)\.toLowerCase\(\)\.trim\(\);\n    return email === 'mike@massivedynamixdistributors\.com';\n  \};\n\n  useEffect\(\(\) => \{\n    if \(!isMikeViewer\(\) && activeTab !== 'standard'\) \{\n      setActiveTab\('standard'\);\n    \}\n  \}, \[currentUser, activeTab\]\);\n/, '');

// remove {isMikeViewer() && (...)} wrappers
content = content.replace(/\{isMikeViewer\(\) && \(\s*(<button[\s\S]*?<\/button>)\s*\)\}/g, '$1');
content = content.replace(/\{isMikeViewer\(\) && activeTab === 'cfo' && \(/g, "{activeTab === 'cfo' && (");
content = content.replace(/\{isMikeViewer\(\) && activeTab === 'ped' && \(/g, "{activeTab === 'ped' && (");
content = content.replace(/\{isMikeViewer\(\) && activeTab === 'corp' && \(/g, "{activeTab === 'corp' && (");
content = content.replace(/\{isMikeViewer\(\) && <th/g, "{<th");

// Wait, the action column:
// {isMikeViewer() && <th className="p-3 w-16 text-center">Action</th>} -> <th className="p-3 w-16 text-center">Action</th>
content = content.replace(/\{isMikeViewer\(\) && <th (.*?)<\/th>\}/g, '<th $1</th>');

// {isMikeViewer() && ( <td ...> <button ...> </button> </td> )} -> <td ...> <button ...> </button> </td>
content = content.replace(/\{isMikeViewer\(\) && \(\s*(<td[\s\S]*?<\/td>)\s*\)\}/g, '$1');

fs.writeFileSync(file, content);
