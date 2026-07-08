import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('import mammoth from')) {
  content = content.replace('import { GoogleGenAI, Type } from "@google/genai";', 'import { GoogleGenAI, Type } from "@google/genai";\nimport mammoth from "mammoth";');
}

const targetStr = `      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: fileData
                }
              },
              {
                text: "You are an AI assistant processing a Performance Agreement document. Extract the following information: 1. SDBIP 2nd/3rd layer operational indicators and targets (kpi, weights, quarters, poe). 2. Job Specific Competencies (name, description, weight, requiredRating, etc.). 3. Personal Development Plan (PDP) items. 4. Drafting Suite HTML: Extract ALL text, tables, formatting, and structures from the entire document and return it as a complete semantic HTML representation, suitable for loading into a rich text editor. Extract everything exactly as it appears. If any section is missing, return an empty array/string for that section."
              }
            ]
          }
        ],`;

const replacementStr = `      let parts: any[] = [];
      
      const extractionPrompt = "You are an AI assistant processing a Performance Agreement document. Extract the following information: 1. SDBIP 2nd/3rd layer operational indicators and targets (kpi, weights, quarters, poe). 2. Job Specific Competencies (name, description, weight, requiredRating, etc.). 3. Personal Development Plan (PDP) items. 4. Drafting Suite HTML: Extract ALL text, tables, formatting, and structures from the entire document and return it as a complete semantic HTML representation, suitable for loading into a rich text editor. Extract everything exactly as it appears. If any section is missing, return an empty array/string for that section.";

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const result = await mammoth.convertToHtml({ buffer });
          const textContent = result.value;
          parts = [
            { text: \`Document Content:\\n\${textContent}\` },
            { text: extractionPrompt }
          ];
        } catch (docxErr) {
          throw new Error("Could not parse DOCX/DOC file. Please ensure it is a valid Word document or try uploading a PDF instead.");
        }
      } else if (mimeType === 'application/pdf') {
        parts = [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileData
            }
          },
          { text: extractionPrompt }
        ];
      } else {
        throw new Error(\`Unsupported MIME type: \${mimeType}. Please upload a PDF or DOCX file.\`);
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts
          }
        ],`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
console.log('Fixed extraction route to handle DOCX files natively.');
