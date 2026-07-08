import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const oldStr = `      let parts: any[] = [];
      
      const extractionPrompt = "You are an AI assistant processing a Performance Agreement document. Extract the following information: 1. SDBIP 2nd/3rd layer operational indicators and targets (kpi, weights, quarters, poe). 2. Job Specific Competencies (name, description, weight, requiredRating, etc.). 3. Personal Development Plan (PDP) items. 4. Drafting Suite HTML: Extract ALL text, tables, formatting, and structures from the entire document and return it as a complete semantic HTML representation, suitable for loading into a rich text editor. Extract everything exactly as it appears. If any section is missing, return an empty array/string for that section.";

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const result = await mammoth.convertToHtml({ buffer });
          const textContent = result.value;
          parts = [
            { text: \\\`Document Content:\\n\${textContent}\\\` },
            { text: extractionPrompt }
          ];`;

const newStr = `      let parts: any[] = [];
      let docxHtml = "";
      
      const extractionPrompt = "You are an AI assistant processing a Performance Agreement document. Extract the following information: 1. SDBIP 2nd/3rd layer operational indicators and targets (kpi, weights, quarters, poe). 2. Job Specific Competencies (name, description, weight, requiredRating, etc.). 3. Personal Development Plan (PDP) items.";

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const result = await mammoth.convertToHtml({ buffer });
          docxHtml = result.value;
          parts = [
            { text: \\\`Document Content:\\n\${docxHtml}\\\` },
            { text: extractionPrompt }
          ];`;

content = content.replace(oldStr, newStr);

const oldSchemaStr = `        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sdbip23: {
                type: Type.ARRAY,
                description: "Extracted SDBIP 2nd and 3rd layer indicators and targets",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    refNum: { type: Type.STRING },
                    strategicObj: { type: Type.STRING },
                    bsd: { type: Type.STRING, description: "Y or N" },
                    led: { type: Type.STRING, description: "Y or N" },
                    mfvm: { type: Type.STRING, description: "Y or N" },
                    ggpp: { type: Type.STRING, description: "Y or N" },
                    midt: { type: Type.STRING, description: "Y or N" },
                    sr: { type: Type.STRING, description: "Y or N" },
                    kpas: { type: Type.STRING },
                    operationalActivity: { type: Type.STRING },
                    kpi: { type: Type.STRING },
                    weight: { type: Type.STRING },
                    compliance: { type: Type.STRING, description: "compliant or non-compliant" },
                    uom: { type: Type.STRING },
                    mscoaTracking: { type: Type.STRING },
                    baseline: { type: Type.STRING },
                    annualTarget: { type: Type.STRING },
                    budgetAllocation: { type: Type.STRING },
                    q1: { type: Type.STRING },
                    q2: { type: Type.STRING },
                    q3: { type: Type.STRING },
                    q4: { type: Type.STRING },
                    poe: { type: Type.STRING }
                  }
                }
              },
              jobCompetencies: {
                type: Type.ARRAY,
                description: "Job Specific Competencies extracted from the document",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    requiredRating: { type: Type.INTEGER },
                    currentRating: { type: Type.INTEGER },
                    weight: { type: Type.INTEGER },
                    evidence: { type: Type.STRING }
                  }
                }
              },
              pdp: {
                type: Type.ARRAY,
                description: "Personal Development Plan (PDP) items extracted",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    "Skills performance gap (in order of priority)": { type: Type.STRING },
                    "Outcomes expected": { type: Type.STRING },
                    "Suggested training and/or development activity": { type: Type.STRING },
                    "Suggested mode of delivery": { type: Type.STRING },
                    "Suggested time frame": { type: Type.STRING },
                    "Work opportunity created to practice skills/development area": { type: Type.STRING },
                    "Support person": { type: Type.STRING }
                  }
                }
              },
              draftingHTML: {
                type: Type.STRING,
                description: "The complete document parsed into semantic HTML, including all tables, formatting, text, lists, etc."
              }
            }
          }
        }`;

const newSchemaStr = `        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sdbip23: {
                type: Type.ARRAY,
                description: "Extracted SDBIP 2nd and 3rd layer indicators and targets",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    refNum: { type: Type.STRING },
                    strategicObj: { type: Type.STRING },
                    bsd: { type: Type.STRING, description: "Y or N" },
                    led: { type: Type.STRING, description: "Y or N" },
                    mfvm: { type: Type.STRING, description: "Y or N" },
                    ggpp: { type: Type.STRING, description: "Y or N" },
                    midt: { type: Type.STRING, description: "Y or N" },
                    sr: { type: Type.STRING, description: "Y or N" },
                    kpas: { type: Type.STRING },
                    operationalActivity: { type: Type.STRING },
                    kpi: { type: Type.STRING },
                    weight: { type: Type.STRING },
                    compliance: { type: Type.STRING, description: "compliant or non-compliant" },
                    uom: { type: Type.STRING },
                    mscoaTracking: { type: Type.STRING },
                    baseline: { type: Type.STRING },
                    annualTarget: { type: Type.STRING },
                    budgetAllocation: { type: Type.STRING },
                    q1: { type: Type.STRING },
                    q2: { type: Type.STRING },
                    q3: { type: Type.STRING },
                    q4: { type: Type.STRING },
                    poe: { type: Type.STRING }
                  }
                }
              },
              jobCompetencies: {
                type: Type.ARRAY,
                description: "Job Specific Competencies extracted from the document",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    requiredRating: { type: Type.INTEGER },
                    currentRating: { type: Type.INTEGER },
                    weight: { type: Type.INTEGER },
                    evidence: { type: Type.STRING }
                  }
                }
              },
              pdp: {
                type: Type.ARRAY,
                description: "Personal Development Plan (PDP) items extracted",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    "Skills performance gap (in order of priority)": { type: Type.STRING },
                    "Outcomes expected": { type: Type.STRING },
                    "Suggested training and/or development activity": { type: Type.STRING },
                    "Suggested mode of delivery": { type: Type.STRING },
                    "Suggested time frame": { type: Type.STRING },
                    "Work opportunity created to practice skills/development area": { type: Type.STRING },
                    "Support person": { type: Type.STRING }
                  }
                }
              }
            }
          }
        }`;

content = content.replace(oldSchemaStr, newSchemaStr);

// To fix invalid JSON, let's wrap JSON parse in try-catch and log raw string if there's an error.
content = content.replace(`      const extractedData = JSON.parse(response.text);
      if (docxHtml) {`, `      let extractedData: any;
      try {
        extractedData = JSON.parse(response.text);
      } catch (parseErr) {
        console.error("JSON Parse Error. Raw response was:");
        console.error(response.text);
        throw new Error("Failed to parse AI response into JSON. " + parseErr.message);
      }
      
      if (docxHtml) {`);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Fixed docxHtml variable and schema.');
