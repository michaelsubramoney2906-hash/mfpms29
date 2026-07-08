const fs = require('fs');
const arContent = fs.readFileSync('src/components/AR/AR.tsx', 'utf8');
const aprContent = fs.readFileSync('src/components/APR/APR.tsx', 'utf8');

const extractFromAR = arContent.indexOf('interface AzureUser {');
let extractedDraftingSuite = arContent.slice(extractFromAR);

// Replace "AR" variables with "APR"
extractedDraftingSuite = extractedDraftingSuite.replace(/'ar-global'/g, "'apr-global'");
extractedDraftingSuite = extractedDraftingSuite.replace(/\`ar-\$\{activeTenantId\}\`/g, "`apr-${activeTenantId}`");
extractedDraftingSuite = extractedDraftingSuite.replace(/ar_v2_/g, "apr_v2_");
extractedDraftingSuite = extractedDraftingSuite.replace(/ANNUAL REPORT/ig, "ANNUAL PERFORMANCE REPORT");
extractedDraftingSuite = extractedDraftingSuite.replace(/ANNUAL PERFORMANCE PERFORMANCE/ig, "ANNUAL PERFORMANCE");

// Replace chapters to be compliant with APR mSCOA and MFMA
const newChaptersArray = `  const [chapters, setChapters] = useState<string[]>([
    "Chapter 1: Mayor's Foreword & Executive Summary\\n\\nThe Annual Performance Report captures the municipality's service delivery and performance against the IDP. It highlights key priorities such as economic growth, human settlements, and good governance.",
    "Chapter 2: Organisational Performance\\n\\nThis chapter focuses on human resource management, including staff turnover, vacancies, skills development, and employment equity within the municipality as per the MSA.",
    "Chapter 3: Service Delivery Performance (KPA Performance)\\n\\nProvides detailed analysis of the performance of each Key Performance Area (KPA) compared to set targets in the SDBIP, basic service delivery such as water, sanitation, electricity, and refuse removal.",
    "Chapter 4: Financial Performance\\n\\nThis chapter presents the unaudited financial statements, budget utilization, capital expenditure, and revenue collection rate as per the MFMA guidelines.",
    "Chapter 5: Auditor-General Report\\n\\nSummarizes the audit findings from the previous financial year and outlines the audit action plan to address matters raised by the Auditor-General."
  ]);`;

extractedDraftingSuite = extractedDraftingSuite.replace(/const \[chapters, setChapters\] = useState<string\[\]>\(\[\s*([\s\S]*?)\]\);/g, newChaptersArray);

// Also need to correct any AR component logic
const replaceTargetIdx = aprContent.indexOf('interface DraftingSuiteTabProps {');
let newAprContent = aprContent.slice(0, replaceTargetIdx) + extractedDraftingSuite;

// Handle React import
if (!newAprContent.includes('useEffect')) {
   newAprContent = newAprContent.replace(/import React, { useState, useRef }/g, "import React, { useState, useRef, useEffect }");
}

fs.writeFileSync('src/components/APR/APR.tsx', newAprContent);
console.log('Successfully re-wrote APR.tsx');
