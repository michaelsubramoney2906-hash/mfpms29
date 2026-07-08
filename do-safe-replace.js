import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');
const replacement = fs.readFileSync('mock-replacement.txt', 'utf8');

const startTag = '  // Extract from PA document via Gemini API';
const endTag = '  // 17.7 Fetch Performance Agreements for a tenant';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  // We look for where the extraction endpoint ends. It ends exactly before endTag.
  // There is another endpoint app.get("/api/tenant/:tenantId/pa-drafting-doc" before endTag?
  // Let's find endTag and go back up to find the end of the extract block.
  
  // Or simpler: replace '  // Extract from PA document via Gemini API' up to '  // Extract from PA document via Gemini API' is the only block we want to replace.
  // Actually, wait carefully. Let's find exactly the boundaries.
  
  const endBlock = content.indexOf('app.get("/api/tenant/:tenantId/pa-drafting-doc"', startIndex);
  if (endBlock !== -1) {
    const finalContent = content.substring(0, startIndex) + replacement + content.substring(endBlock);
    fs.writeFileSync('server.ts', finalContent, 'utf8');
    console.log('Successfully completed safe replacement.');
  } else {
    console.log("Could not find draft endpoints.");
  }
} else {
  console.log("Could not find start or end tags!");
}
