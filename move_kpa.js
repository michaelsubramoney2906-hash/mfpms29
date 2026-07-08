const fs = require('fs');
const file = 'src/components/IPMS/PATemplates.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `              {/* Chapter 4.1 KPAs Table */}`;
const endStr = `              {/* Chapter 4.2 Competencies Table */}`;
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end index for Web Preview KPA table.");
  process.exit(1);
}

const tableBlock = content.slice(startIndex, endIndex);
content = content.slice(0, startIndex) + content.slice(endIndex);

const insertTarget = `              {/* Chapter 7 */}`;
const insertIndex = content.indexOf(insertTarget);

if (insertIndex === -1) {
  console.log("Could not find insert index.");
  process.exit(1);
}

content = content.slice(0, insertIndex) + tableBlock + content.slice(insertIndex);

// Now for the A4 Print Pages view
// Find PAGE 3: PERFORMANCE PLAN - KPAs TABLE
const printStartStr = `              {/* PAGE 3: PERFORMANCE PLAN - KPAs TABLE */}`;
const printEndStr = `              {/* PAGE 4: JSC TABLE */}`;

const printStartIndex = content.indexOf(printStartStr);
const printEndIndex = content.indexOf(printEndStr);

if (printStartIndex === -1 || printEndIndex === -1) {
  console.log("Could not find start or end index for Print Page KPA table.");
  console.log(printStartIndex, printEndIndex);
  process.exit(1);
}

const printTableBlock = content.slice(printStartIndex, printEndIndex);
content = content.slice(0, printStartIndex) + content.slice(printEndIndex);

// We need to insert it inside the continuous Chapter 1-12 A4 page?
// Wait, no. The print view has:
// PAGE 3: CHAPTERS 1 TO 4 (which holds 1 to 12)
// PAGE 3: PERFORMANCE PLAN - KPAs TABLE
// PAGE 4: JSC TABLE
// If the user wants the KPA table "below 6.6", and Chapter 1-12 is all inside one A4 page div, we have a problem.
// Let's write the updated content to file first so we can analyze the A4 page structure easily.
fs.writeFileSync(file, content);
console.log("Moved KPA table in Web Preview.");
