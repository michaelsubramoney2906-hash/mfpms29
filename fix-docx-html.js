import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace('let parts: any[] = [];', 'let parts: any[] = [];\n      let docxHtml = "";');

content = content.replace('const result = await mammoth.convertToHtml({ buffer });\n          const textContent = result.value;\n          parts = [\n            { text: \`Document Content:\\n\${textContent}\` },', 'const result = await mammoth.convertToHtml({ buffer });\n          docxHtml = result.value;\n          parts = [\n            { text: \`Document Content:\\n\${docxHtml}\` },');

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Fixed docxHtml variable.');
