const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const targetPrompt = `      } else if (engineType === "corporate_services_competencies_engine") {
        extractionPrompt = \`You are a highly precise document parser and strict data extraction engine.
You MUST analyze the entire provided document exhaustively and extract ALL Corporate Services Core Competencies from the table in the performance agreement exactly as they are written in the document.

CRITICAL EXTRACTION RULES:
1. Extract ALL Corporate Services Core Competencies. Typically these are found in a specific competency or assessment table within the Performance Agreement (often with columns like Competency, Components, Competency Definition, Weighting % / Weighting % (100%), etc.).
2. Do NOT summarize, guess, or use creative reasoning. Your only task is to extract exact text blocks.
3. For each extracted competency, map exactly:
   - "Competency" (the name of the competency, map to competency)
   - "Components" (the key parts, sub-components, or components listed under or alongside it, map to components)
   - "Competency_Definition" (the exact definition or behavioral indicator text, map to competency definition)
   - "Weighting_Percent" (the weighting percentage number, e.g. "25" or "20", map to weighting % (100%))

Format your response exactly according to the following JSON schema:
{"Employee_Name": "", "Corporate_Services_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}\`;`;

const newPrompt = `      } else if (engineType === "corporate_services_competencies_engine") {
        extractionPrompt = \`You are a highly precise document parser and strict data extraction engine.
You MUST analyze the entire provided document exhaustively and extract ALL Core Competencies specifically for Corporate Services from the performance agreement.

CRITICAL EXTRACTION RULES:
1. Locate the Core Competencies Assessment or Core Competency Requirements table in the document.
2. Extract the entire table exactly as written.
3. You MUST extract the exact text for the following four fields for EVERY competency listed:
   - "Competency" (the exact name of the competency)
   - "Components" (the exact sub-components or components listed)
   - "Competency_Definition" (the exact competency definition or behavioral indicators)
   - "Weighting_Percent" (the exact Weighting % or weight assigned, e.g. "20")
4. Do NOT summarize, truncate, guess, or use creative reasoning. Your only task is to extract exact text blocks from the source document. Ensure NO row from the core competencies table is missed.
5. Identify the Employee Name from the agreement (e.g. Mmaphiri R. Rampedi or similar).

Format your response exactly according to the following JSON schema:
{"Employee_Name": "", "Corporate_Services_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}\`;`;

content = content.replace(targetPrompt, newPrompt);
fs.writeFileSync(file, content);
