const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const startStr = '} else if (engineType === "agreement_to_plan_engine") {';
const endStr = '} else if (engineType === "jsc_pdp_engine") {';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end string");
  process.exit(1);
}

const replacement = `} else if (engineType === "agreement_to_plan_engine") {
        extractionPrompt = \`You are a highly precise document parser and strict data extraction engine.
You MUST analyze the entire provided document exhaustively and extract ALL Key Performance Areas (KPAs) and Key Performance Indicators (KPIs) exactly as they are written in the document.
IMPORTANT: You MUST find and extract EVERY SINGLE KPI and EVERY SINGLE KPA from the document without exception. Do NOT omit any KPI regardless of whether it has a reference code (like M_01, M_02, P_01, P_02, U_01, Ref 1, KPI 1, 1.1) or a custom number/code, or no reference code at all.
Do NOT truncate the list, do NOT use "etc", do NOT stop early. Exhaustively extract 100% of all KPAs and KPIs.

CRITICAL MAPPING & IDENTIFICATION RULES:
1. Extract ALL Key Performance Areas (KPAs) with their respective numbers/names and descriptions exactly as written in the document.
2. For every KPI under each KPA, extract its exact code (ID) or reference number as written in the document.
3. STRICT CODE & REFERENCE HANDLING:
   - Extract ALL KPIs regardless of reference number format. If a reference code or number exists in the document, capture it exactly as written in "KPI_Number". DO NOT skip, omit, or filter out KPIs.
   - If a KPI has NO code/ID/ref in the document (empty or unassigned), assign a sequential code starting with "U_01", "U_02", etc.
4. For every extracted KPI, extract its exact properties from the document: Key Performance Indicator (description), Weight, Baseline, Annual Target, 1st Quarter planned target, 2nd Quarter planned target, 3rd Quarter planned target, 4th Quarter planned target, POE (Portfolio of Evidence), and Total Budget allocated. If any value is missing or blank, leave it as an empty string.

Format your response exactly according to the following JSON schema:
{"Document_Reference": "","Performance_Plan": {"KPAs": [{"KPA_Number": "","KPA_Description": "","Associated_KPIs": [{"KPI_Number": "","Key_Performance_Indicator": "","Weight": "","Baseline": "","Annual_Target": "","Q1_Target": "","Q2_Target": "","Q3_Target": "","Q4_Target": "","POE": "","Total_Budget_Allocated": ""}]}]}}\`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Document_Reference: { type: Type.STRING },
            Performance_Plan: {
              type: Type.OBJECT,
              properties: {
                KPAs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      KPA_Number: { type: Type.STRING },
                      KPA_Description: { type: Type.STRING },
                      Associated_KPIs: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            KPI_Number: { type: Type.STRING },
                            Key_Performance_Indicator: { type: Type.STRING },
                            Weight: { type: Type.STRING },
                            Baseline: { type: Type.STRING },
                            Annual_Target: { type: Type.STRING },
                            Q1_Target: { type: Type.STRING },
                            Q2_Target: { type: Type.STRING },
                            Q3_Target: { type: Type.STRING },
                            Q4_Target: { type: Type.STRING },
                            POE: { type: Type.STRING },
                            Total_Budget_Allocated: { type: Type.STRING }
                          },
                          required: ["KPI_Number", "Key_Performance_Indicator", "Weight", "Baseline", "Annual_Target", "Q1_Target", "Q2_Target", "Q3_Target", "Q4_Target", "POE", "Total_Budget_Allocated"]
                        }
                      }
                    },
                    required: ["KPA_Number", "KPA_Description", "Associated_KPIs"]
                  }
                }
              },
              required: ["KPAs"]
            }
          },
          required: ["Document_Reference", "Performance_Plan"]
        };
      `;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync('server.ts', content, 'utf8');
console.log("Success");
