import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      let parts: any[] = [];
      
      const extractionPrompt = "You are an AI assistant processing a Performance Agreement document. Extract the following information: 1. SDBIP 2nd/3rd layer operational indicators and targets (kpi, weights, quarters, poe). 2. Job Specific Competencies (name, description, weight, requiredRating, etc.). 3. Personal Development Plan (PDP) items. 4. Drafting Suite HTML: Extract ALL text, tables, formatting, and structures from the entire document and return it as a complete semantic HTML representation, suitable for loading into a rich text editor. Extract everything exactly as it appears. If any section is missing, return an empty array/string for that section.";

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const result = await mammoth.convertToHtml({ buffer });
          const textContent = result.value;
          parts = [
            { text: \\\`Document Content:\\n\${textContent}\\\` },
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
        throw new Error(\\\`Unsupported MIME type: \${mimeType}. Please upload a PDF or DOCX file.\\\`);
      }`;

const schemaStr = `        config: {
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

const replacement1 = `      let parts: any[] = [];
      let docxHtml = "";
      
      const extractionPrompt = "You are an AI assistant processing a Performance Agreement document. Extract the following information EXACTLY based on the document: 1. SDBIP 2nd/3rd layer operational indicators and targets (kpi, weights, quarters, poe). 2. Job Specific Competencies (name, description, weight, requiredRating, etc.). 3. Personal Development Plan (PDP) items.";

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const result = await mammoth.convertToHtml({ buffer });
          docxHtml = result.value; 
          parts = [
            { text: \`Document Content:\\n\${docxHtml}\` },
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
      }`;

const replacement2 = `        config: {
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

content = content.replace(targetStr, replacement1);
content = content.replace(schemaStr, replacement2);

const finalHtmlReplace = `      const extractedData = JSON.parse(response.text);
      if (docxHtml) {
        extractedData.draftingHTML = docxHtml;
      } else {
        extractedData.draftingHTML = "<p>PDF was analyzed for extraction. To auto-generate the complete drafting suite HTML, please upload the DOCX version of the performance agreement.</p>";
      }`;

content = content.replace('      const extractedData = JSON.parse(response.text);', finalHtmlReplace);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Update complete.');
