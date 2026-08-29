const fs = require('fs');
const path = 'src/components/ExtractionEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '{extractedItems.length > 0 && (\n              \n                {/* DUAL LAYER EXTRACT BUTTONS */}',
  '{extractedItems.length > 0 && (<>\n                {/* DUAL LAYER EXTRACT BUTTONS */}'
);

content = content.replace(
  '                  </button>\n                )}\n',
  '                  </button>\n                )}\n</>'
);

fs.writeFileSync(path, content);
console.log("ExtractionEngine fixed");
