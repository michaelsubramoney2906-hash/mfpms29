const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const oldJscPdpPrompt = `      } else if (engineType === "jsc_pdp_engine") {
        extractionPrompt = \`You are a deterministic data mapping engine. Extract Job Specific Competencies (JSC), Personal Development Plan (PDP), and KPAs/KPIs. Populate the exact JSON structure provided below. Do not add or change any keys:
{"Employee_Details": {"Name": "","Job_Title": ""},"Job_Specific_Competencies_Module": {"JSCs": []},"Personal_Development_Plan_Module": {"PDPs": []},"Performance_Plan_Module": {"Annual_Planner_Grid": {"Quarter_1": [],"Quarter_2": [],"Quarter_3": [],"Quarter_4": []}}}\`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Employee_Details: {
              type: Type.OBJECT,
              properties: {
                Name: { type: Type.STRING },
                Job_Title: { type: Type.STRING }
              },
              required: ["Name", "Job_Title"]
            },
            Job_Specific_Competencies_Module: {
              type: Type.OBJECT,
              properties: {
                JSCs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      Competency_Name: { type: Type.STRING },
                      Weight: { type: Type.STRING },
                      Definition: { type: Type.STRING }
                    },
                    required: ["Competency_Name", "Weight", "Definition"]
                  }
                }
              },
              required: ["JSCs"]
            },
            Personal_Development_Plan_Module: {
              type: Type.OBJECT,
              properties: {
                PDPs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      Developmental_Area: { type: Type.STRING },
                      Action_Plan: { type: Type.STRING },
                      Timeframe: { type: Type.STRING }
                    },
                    required: ["Developmental_Area", "Action_Plan", "Timeframe"]
                  }
                }
              },
              required: ["PDPs"]
            },
            Performance_Plan_Module: {
              type: Type.OBJECT,
              properties: {
                Annual_Planner_Grid: {
                  type: Type.OBJECT,
                  properties: {
                    Quarter_1: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_2: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_3: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_4: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["Quarter_1", "Quarter_2", "Quarter_3", "Quarter_4"]
                }
              },
              required: ["Annual_Planner_Grid"]
            }
          },
          required: ["Employee_Details", "Job_Specific_Competencies_Module", "Personal_Development_Plan_Module", "Performance_Plan_Module"]
        };`;

const newJscPdpPrompt = `      } else if (engineType === "jsc_pdp_engine") {
        extractionPrompt = \`You are a highly precise document parser and strict data extraction engine.
You MUST analyze the entire provided document exhaustively and extract ALL Job Specific Competencies (JSC) and Personal Development Plan (PDP) entries exactly as they are written.

CRITICAL EXTRACTION RULES FOR JSC:
1. Extract ALL Job Specific Competencies from the table in the performance agreement.
2. Even if there is no JSC number specified, extract all other information and map it.
3. Map exactly:
   - "jsc" maps to "jsc_no"
   - "competency" maps to "competency"
   - "competency definition" maps to "competency_definition"
   - "level of capability" maps to "level_of_capability"
   - "weighting" maps to "weight"

CRITICAL EXTRACTION RULES FOR PDP:
1. Extract ALL Personal Development Plan entries.
2. Map exactly:
   - "skills performance gap" maps to "skills_gap"
   - "outcomes expected" maps to "outcomes_expected"
   - "suggested training and/or development activity" maps to "suggested_training_and_development"
   - "suggested mode of delivery" maps to "suggested_mode_of_delivery"
   - "suggested time frame" maps to "suggested_time_frame"
   - "work opportunity created to practice skills/development area" maps to "practice_work_opportunity"
   - "support person" maps to "support_person"

Format your response exactly according to the following JSON schema:
{"Job_Specific_Competencies": [{"jsc_no": "", "competency": "", "competency_definition": "", "level_of_capability": "", "weight": ""}], "Personal_Development_Plan": [{"skills_gap": "", "outcomes_expected": "", "suggested_training_and_development": "", "suggested_mode_of_delivery": "", "suggested_time_frame": "", "practice_work_opportunity": "", "support_person": ""}]}\`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Job_Specific_Competencies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jsc_no: { type: Type.STRING },
                  competency: { type: Type.STRING },
                  competency_definition: { type: Type.STRING },
                  level_of_capability: { type: Type.STRING },
                  weight: { type: Type.STRING }
                },
                required: ["jsc_no", "competency", "competency_definition", "level_of_capability", "weight"]
              }
            },
            Personal_Development_Plan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skills_gap: { type: Type.STRING },
                  outcomes_expected: { type: Type.STRING },
                  suggested_training_and_development: { type: Type.STRING },
                  suggested_mode_of_delivery: { type: Type.STRING },
                  suggested_time_frame: { type: Type.STRING },
                  practice_work_opportunity: { type: Type.STRING },
                  support_person: { type: Type.STRING }
                },
                required: ["skills_gap", "outcomes_expected", "suggested_training_and_development", "suggested_mode_of_delivery", "suggested_time_frame", "practice_work_opportunity", "support_person"]
              }
            }
          },
          required: ["Job_Specific_Competencies", "Personal_Development_Plan"]
        };`;

if (serverCode.includes('} else if (engineType === "jsc_pdp_engine") {')) {
  serverCode = serverCode.replace(oldJscPdpPrompt, newJscPdpPrompt);
  fs.writeFileSync('server.ts', serverCode, 'utf8');
  console.log('Successfully updated server.ts for jsc_pdp_engine.');
} else {
  console.log('Could not find jsc_pdp_engine in server.ts');
}
