const fs = require('fs');
const path = 'src/components/ExtractionEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
`      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const rawArray = Array.isArray(parsed) ? parsed : (parsed.items || parsed.kpis || []);`,
`      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        let parsed = [];
        try { parsed = JSON.parse(text); } catch(e) { throw new Error("Invalid JSON file uploaded"); }
        const rawArray = Array.isArray(parsed) ? parsed : (parsed.items || parsed.kpis || []);`
);

fs.writeFileSync(path, content);
console.log("EE fixed");
