const fs = require('fs');

const kpa = fs.readFileSync('src/components/IPMS/KPA_IPMS.tsx', 'utf8');
const jsc = fs.readFileSync('src/components/IPMS/JobSpecificCompetencies.tsx', 'utf8');
const kpi = fs.readFileSync('src/components/IPMS/KPI_IPMS.tsx', 'utf8');
const pdp = fs.readFileSync('src/components/IPMS/PersonalDevelopmentPlan.tsx', 'utf8');

console.log("KPA buttons:", kpa.includes("Commit Personal DB"));
console.log("JSC buttons:", jsc.includes("Commit Personal DB"));
console.log("KPI buttons:", kpi.includes("Commit Personal DB"));
console.log("PDP buttons:", pdp.includes("Commit Personal DB"));
