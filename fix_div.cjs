const fs = require('fs');
const path = 'src/components/ExtractionEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

const SEARCH = `            </div>
          </div>

      {/* TABS NAVIGATION */}`;

const REPLACE = `            </div>
          </div>
        </div>

      {/* TABS NAVIGATION */}`;

content = content.replace(SEARCH, REPLACE);
fs.writeFileSync(path, content);
console.log("Fixed missing div");
