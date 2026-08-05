const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The logic replaces all targetUsers loops that use SYNCED_EMAILS with just [userId] or similar
// Actually, an easier way is to just redefine SYNCED_EMAILS to empty array so it never triggers!
code = code.replace(/const SYNCED_EMAILS: string\[\] = \['zulune@nkangaladm\.gov\.za', 'nsibandenp@nkangaladm\.gov\.za'\];/, 'const SYNCED_EMAILS: string[] = [];');

fs.writeFileSync('server.ts', code);
console.log('Patched SYNCED_EMAILS array to empty.');
