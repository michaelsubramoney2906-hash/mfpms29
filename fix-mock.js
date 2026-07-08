import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const startMarker = '      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI || process.env.gemini;';
const endMarker = '      const supabase = getSupabase();';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `      // Hardcoded mock data instead of AI extraction
      console.log(\`Starting MOCK extraction for tenant \${tenantId}, file \${fileName}, mimeType \${mimeType}\`);

      const isSecondLayer = sdbipLayer === '2nd Layer';
      const extractionKey = isSecondLayer ? 'pa_extract_sdbip_2nd' : 'pa_extract_sdbip_3rd';

      const extractedData = {
        sdbip23: [
          {
            id: \`sdbip23_\${Date.now()}_1\`,
            refNum: "1",
            strategicObj: "Good Governance",
            bsd: "N",
            led: "N",
            mfvm: "N",
            ggpp: "Y",
            midt: "N",
            sr: "N",
            kpas: "KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION",
            operationalActivity: isSecondLayer ? "Governance oversight" : "Maintain clean audit opinion by 30 December 2025",
            kpi: "Maintain clean audit opinion by 30 December 2025",
            weight: "10",
            compliance: "compliant",
            uom: "Report",
            mscoaTracking: "N/A",
            baseline: "1",
            annualTarget: "1",
            budgetAllocation: "OPEX",
            q1: "N/A",
            q2: "1",
            q3: "N/A",
            q4: "N/A",
            poe: "AG's Audit Report",
            isCustom: true
          }
        ],
        jobCompetencies: [
          {
            id: \`comp_\${Date.now()}_1\`,
            name: "Strategic Leadership",
            category: "Core Managerial",
            description: "Ability to provide coaching and direction to the team.",
            requiredRating: 4,
            currentRating: 0,
            weight: 20,
            evidence: "Team feedback and performance records.",
            isCustom: true
          }
        ],
        pdp: [
          {
            "Skills performance gap (in order of priority)": "Advanced Digital Processing",
            "Outcomes expected": "Improved processing time",
            "Suggested training and/or development activity": "Advanced MS Excel / Access",
            "Suggested mode of delivery": "Online Course",
            "Suggested time frame": "Q1 2026",
            "Work opportunity created to practice skills/development area": "Data consolidation task",
            "Support person": "IT Manager"
          }
        ],
        draftingHTML: \`<h1>Performance Agreement 2025/2026</h1><p>Entered into by and between the Municipality and the Employee.</p><h2>SDBIP Extract</h2><table border="1"><tr><th>Ref</th><th>Strategic Obj</th><th>KPI</th></tr><tr><td>1</td><td>Good Governance</td><td>Maintain clean audit</td></tr></table><h2>Job Competencies</h2><ul><li>Strategic Leadership (Weight 20)</li></ul><h2>PDP</h2><table border="1"><tr><th>Gap</th><th>Suggested Training</th></tr><tr><td>Advanced Digital Processing</td><td>Advanced MS Excel</td></tr></table>\`
      };

`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log("Successfully reverted to mock logic");
} else {
  console.error("Could not find markers", startIndex, endIndex);
}
