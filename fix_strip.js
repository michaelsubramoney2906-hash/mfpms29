const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find the stripping code block
const regex = /\/\/ Strip dataUrl from PoE docs to prevent massive response sizes\s+if \(parsed\.items && Array\.isArray\(parsed\.items\)\) \{\s+parsed\.items\.forEach\(\(item: any\) => \{\s+const docFields = \['q1PoeDocs', 'q2PoeDocs', 'q3PoeDocs', 'q4PoeDocs', 'annualPoeDocs', 'midtermPoeDocs'\];\s+docFields\.forEach\(field => \{\s+if \(item\[field\] && Array\.isArray\(item\[field\]\)\) \{\s+item\[field\] = item\[field\]\.map\(\(doc: any\) => \{\s+if \(\!doc\) return doc;\s+const \{ dataUrl, \.\.\.rest \} = doc;\s+return rest;\s+\}\);\s+\}\s+\}\);\s+\}\);\s+\}/g;

code = code.replace(regex, "// dataUrl stripping removed to allow managers to view and persist POEs");
fs.writeFileSync('server.ts', code);
