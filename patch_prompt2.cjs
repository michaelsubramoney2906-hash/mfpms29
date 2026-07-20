const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const targetPrompt = `      } else if (engineType === "corporate_services_competencies_engine") {
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

const newPrompt = `      } else if (engineType === "corporate_services_competencies_engine") {
        extractionPrompt = \`You are a highly precise document parser and strict data extraction engine.
You MUST analyze the entire provided document exhaustively and extract ALL Core Competencies specifically from the "Corporate Services" performance agreement table.

CRITICAL EXTRACTION RULES:
1. Locate the Core Competencies Requirements / Assessment table in the document for the Corporate Services department or specific employee (e.g., Mmaphiri R. Rampedi).
2. Extract the ENTIRE table EXACTLY as it appears in the source document. Do NOT summarize or shorten anything.
3. You MUST extract the exact text for the following four fields for EVERY single competency listed in the table:
   - "Competency": The exact name of the competency (e.g. "Financial Management", "People Management").
   - "Components": The exact sub-components, elements, or skills listed under or alongside the competency. Copy verbatim.
   - "Competency_Definition": The exact competency definition, behavioral indicators, or description. Copy verbatim.
   - "Weighting_Percent": The exact Weighting % / weight assigned, as a number (e.g. "20", "15").
4. Do NOT summarize, truncate, guess, or use creative reasoning. Your ONLY task is to copy exact text blocks from the source document. Ensure NO row from the core competencies table is missed. If the definition is a long paragraph, extract the entire paragraph.
5. Identify the Employee Name from the agreement.

Format your response exactly according to the following JSON schema:
{"Employee_Name": "", "Corporate_Services_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}\`;`;

content = content.replace(targetPrompt, newPrompt);
fs.writeFileSync(file, content);
