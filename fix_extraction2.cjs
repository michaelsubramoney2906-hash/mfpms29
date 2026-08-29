const fs = require('fs');
const path = 'src/components/ExtractionEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

// The JSX is malformed around line 692. Let's fix it manually by re-reading original file. Wait, I can't.
// Let's just fix the JSX structure.

let targetStr = `          <div className="flex items-center gap-2 shrink-0">
            {extractedItems.length > 0 && (<>
                {/* DUAL LAYER EXTRACT BUTTONS */}`;

let newStr = `          <div className="flex items-center gap-2 shrink-0">
            {extractedItems.length > 0 && (
              <div className="flex items-center gap-2">
                {/* DUAL LAYER EXTRACT BUTTONS */}`;

content = content.replace(targetStr, newStr);

targetStr = `                  </button>
                )}
</>
              </div>`;

newStr = `                  </button>
                )}
              </div>
            )}`;

content = content.replace(targetStr, newStr);

fs.writeFileSync(path, content);
