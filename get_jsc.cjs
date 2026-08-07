const fs = require('fs');
let content = fs.readFileSync('src/components/FredExtractionAgent.tsx', 'utf8');

let startIndex = content.indexOf("{selectedEngine === 'jsc_pdp_engine' && (");
let endIndex = content.indexOf("          {/* Idle Placeholder instructions */}");

let jscBlock = content.substring(startIndex, endIndex);
fs.writeFileSync('jsc_block.txt', jscBlock);
console.log("Extracted JSC block");
