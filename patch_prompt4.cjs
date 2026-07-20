const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = \`CRITICAL EXTRACTION RULES:
1. Locate the Core Competencies Requirements / Assessment table in the document for the Corporate Services department or specific employee (e.g., Mmaphiri R. Rampedi).
2. Extract the ENTIRE table EXACTLY as it appears in the source document. Do NOT summarize or shorten anything.
3. You MUST extract the exact text for the following four fields for EVERY single competency listed in the table:
   - "Competency": The exact name of the competency (e.g. "Financial Management", "People Management").
   - "Components": The exact sub-components, elements, or skills listed under or alongside the competency. Copy verbatim.
   - "Competency_Definition": The exact competency definition, behavioral indicators, or description. Copy verbatim.
   - "Weighting_Percent": The exact Weighting % / weight assigned, as a number (e.g. "20", "15").
4. Do NOT summarize, truncate, guess, or use creative reasoning. Your ONLY task is to copy exact text blocks from the source document. Ensure NO row from the core competencies table is missed. If the definition is a long paragraph, extract the entire paragraph.
5. Identify the Employee Name from the agreement.\`;

const newStr = \`CRITICAL EXTRACTION RULES:
1. Identify the performance agreement table that lists Core Managerial Competencies and Core Occupational Competencies. This is specifically for Corporate Services (often Mmaphiri R. Rampedi).
2. EXHAUSTIVE EXTRACTION: You MUST extract EVERY SINGLE ROW from this table. Do not skip or omit any competencies.
3. VERBATIM COPY: For EACH row, extract the text EXACTLY as written in the document:
   - "Competency": The exact name of the competency (e.g., "Strategic Capability and Leadership", "People Management").
   - "Components": The exact list of components or skills. Copy the entire text VERBATIM.
   - "Competency_Definition": The exact, full text of the competency definition. If it spans multiple paragraphs, copy ALL OF THEM verbatim. DO NOT SUMMARIZE or shorten it.
   - "Weighting_Percent": The exact weighting number (e.g., "15", "10").
4. DO NOT make up your own definitions. DO NOT truncate text. If a definition is long, you MUST include all the text.
5. Set "Employee_Name" to the employee's name found in the document (e.g., Mmaphiri R. Rampedi).\`;

content = content.replace(targetStr, newStr);
fs.writeFileSync(file, content);
