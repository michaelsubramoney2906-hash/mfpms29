const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const targetPrompt = \`      } else if (engineType === "corporate_services_competencies_engine") {
        extractionPrompt = \\\`You are a highly precise document parser and strict data extraction engine.
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
{"Employee_Name": "", "Corporate_Services_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}\\\`;\`;

const newPrompt = \`      } else if (engineType === "corporate_services_competencies_engine") {
        extractionPrompt = \\\`You are a highly precise data extraction engine. 
Your ONLY goal is to extract the Core Competencies Assessment or CCR (Core Competency Requirements) table from the provided Corporate Services performance agreement document. The document likely belongs to "Mmaphiri R. Rampedi".

CRITICAL EXTRACTION RULES - READ CAREFULLY:
1. Locate the exact table that lists the core competencies. Look for columns like "Core Managerial Competencies", "Core Occupational Competencies", "Components", "Competency Definition", and "Weighting".
2. Extract EVERY SINGLE ROW from this table. Do not skip any rows.
3. For EACH row, extract the text EXACTLY as written in the document:
   - "Competency": The name of the competency (e.g., "Financial Management", "People Management").
   - "Components": The exact list of components or skills. Copy the entire text verbatim.
   - "Competency_Definition": The exact, full text of the competency definition. If it spans multiple sentences or paragraphs, copy everything verbatim. DO NOT SUMMARIZE.
   - "Weighting_Percent": The number representing the weighting (e.g., "15", "10", "20").
4. DO NOT make up your own definitions. DO NOT truncate text. If the definition is 100 words long, you must include all 100 words.
5. Set "Employee_Name" to the employee's name found in the document (e.g., Mmaphiri R. Rampedi).

Format your response strictly as JSON:
{"Employee_Name": "", "Corporate_Services_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}\\\`;\`;

content = content.replace(targetPrompt, newPrompt);
fs.writeFileSync(file, content);
