const fs = require('fs');

function fixJSON(path, target, replacement) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log("Fixed", path);
  }
}

fixJSON('src/components/OfficeOfTheMayor/OfficeOfTheMayor.tsx',
`        const data = JSON.parse(saved);`,
`        let data = {}; try { data = JSON.parse(saved); } catch(e) { return; }`
);

fixJSON('src/components/OfficeOfTheMM/OfficeOfTheMM.tsx',
`        const data = JSON.parse(saved);`,
`        let data = {}; try { data = JSON.parse(saved); } catch(e) { return; }`
);

fixJSON('src/components/SpeakersSuite.tsx',
`        const data = JSON.parse(saved);`,
`        let data = {}; try { data = JSON.parse(saved); } catch(e) { return; }`
);

