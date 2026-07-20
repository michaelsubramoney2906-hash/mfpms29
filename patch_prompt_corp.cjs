const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = \`      } else if (engineType === "corporate_services_competencies_engine") {
        extractionPrompt = \\\`You are a highly precise document parser and strict data extraction engine.
Your ONLY goal is to extract the Core Competencies Assessment or CCR (Core Competency Requirements) table from the provided Corporate Services performance agreement document. The document belongs to Mmaphiri R. Rampedi.

CRITICAL EXTRACTION RULES - READ CAREFULLY:
1. Locate the exact table that lists the core competencies. Look for columns like "Core Managerial Competencies", "Core Occupational Competencies", "Components", "Competency Definition", and "Weighting".
2. EXHAUSTIVE EXTRACTION: You MUST extract EVERY SINGLE ROW from this table. Do not skip or omit any competencies.
3. VERBATIM COPY: For EACH row, extract the text EXACTLY as written in the document:
   - "Competency": The exact name of the competency (e.g., "Financial Management", "People Management").
   - "Components": The exact list of components or skills. Copy the entire text VERBATIM.
   - "Competency_Definition": The exact, full text of the competency definition. If it spans multiple paragraphs, copy ALL OF THEM verbatim. DO NOT SUMMARIZE or shorten it.
   - "Weighting_Percent": The exact weighting number (e.g., "15", "10").
4. DO NOT make up your own definitions. DO NOT truncate text. If a definition is long, you MUST include all the text.
5. Identify the Employee Name from the agreement (e.g., Mmaphiri R. Rampedi). Ensure the extracted competencies belong to this specific user profile.

Format your response exactly according to the following JSON schema:
{"Employee_Name": "", "Corporate_Services_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}\\\`;\`;

const newStr = \`      } else if (engineType === "corporate_services_competencies_engine") {
        extractionPrompt = \\\`You are a highly precise document parser and strict data extraction engine.
Your ONLY goal is to extract the Core Competencies Assessment or CCR (Core Competency Requirements) table from the provided Corporate Services performance agreement document. 

CRITICAL EXTRACTION RULES - READ CAREFULLY:
1. STRICTLY EXCLUDE Key Performance Areas (KPAs), Key Performance Indicators (KPIs), or any other performance plan tables.
2. Locate the EXACT table that lists the core competencies. Look for headers such as "Core Managerial Competencies", "Core Occupational Competencies", "Components", "Competency Definition", and "Weighting".
3. EXHAUSTIVE EXTRACTION: You MUST extract EVERY SINGLE ROW from the core competencies table. Do not skip or omit any competencies.
4. VERBATIM COPY: For EACH row, extract the exact text for these four columns/fields:
   - "Competency": The exact name of the competency (e.g., "Financial Management", "People Management", "Strategic Capability").
   - "Components": The exact list of components, elements, or skills listed. Copy the entire text VERBATIM.
   - "Competency_Definition": The exact, full text of the competency definition. If it spans multiple paragraphs or bullet points, copy ALL OF THEM verbatim. DO NOT SUMMARIZE or shorten it.
   - "Weighting_Percent": The exact weighting number (e.g., "15", "10").
5. DO NOT make up your own definitions. DO NOT truncate text. If a definition is long, you MUST include all the text exactly as written.
6. Identify the Employee Name from the agreement.

Format your response exactly according to the following JSON schema:
{"Employee_Name": "", "Corporate_Services_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}\\\`;\`;

content = content.replace(targetStr, newStr);
fs.writeFileSync(file, content);
