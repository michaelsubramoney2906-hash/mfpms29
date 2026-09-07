const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(" || normalizedEmail === 'delphine@mzansiflow.co.za'", "");
content = content.replace("        { id: '3', fullName: 'Delphine', email: 'delphine@mzansiflow.co.za', systemRole: 'admin', role: 'admin' },\n", "");
content = content.replace("'delphine@mzansiflow.co.za', ", "");
content = content.replace("          { email: 'delphine@mzansiflow.co.za', fullName: 'Delphine', role: 'Global Administrator' }\n", "");

fs.writeFileSync(path, content);
console.log("Patched server.ts to remove Delphine");
