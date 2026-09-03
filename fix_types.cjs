const fs = require('fs');

function fixAny(path) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/let data = {}; try { data = JSON\.parse\(saved\); }/g, 'let data: any = {}; try { data = JSON.parse(saved); }');
    fs.writeFileSync(path, content);
  }
}

fixAny('src/components/OfficeOfTheMayor/OfficeOfTheMayor.tsx');
fixAny('src/components/OfficeOfTheMM/OfficeOfTheMM.tsx');
fixAny('src/components/SpeakersSuite.tsx');

let eePath = 'src/components/ExtractionEngine.tsx';
let eeContent = fs.readFileSync(eePath, 'utf8');
eeContent = eeContent.replace(/let parsed = \[\];/g, 'let parsed: any = [];');
fs.writeFileSync(eePath, eeContent);

console.log("Types fixed");
