import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("console.log(\\\`Starting AI extraction for tenant \\\${tenantId}, file \\\${fileName}, mimeType \\\${mimeType}\\\`);", 
"console.log(`Starting AI extraction for tenant ${tenantId}, file ${fileName}, mimeType ${mimeType}`);");

content = content.replace("id: \\\`sdbip23_\\\${Date.now()}_\\\${idx}\\\`,", "id: `sdbip23_${Date.now()}_${idx}`,");
content = content.replace("id: \\\`comp_\\\${Date.now()}_\\\${idx}\\\`,", "id: `comp_${Date.now()}_${idx}`,");
content = content.replace("id: \\\`\\\${extractionKey}_\\\${tenantId}\\\`,", "id: `${extractionKey}_${tenantId}`,");
content = content.replace("id: \\\`job_competencies_\\\${tenantId}\\\`,", "id: `job_competencies_${tenantId}`,");
content = content.replace("id: \\\`pdp_\\\${tenantId}\\\`,", "id: `pdp_${tenantId}`,");
content = content.replace("id: \\\`draft_doc_\\\${tenantId}\\\`,", "id: `draft_doc_${tenantId}`,");

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Fixed backticks manually.');
