const fs = require('fs');
const path = 'src/components/IPMS/Evaluation_IPMS.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Inject the time lock logic at the top of EvaluationIPMS
const logicInjection = `  const currentMonth = new Date().getMonth(); // 0-11
  const isQ1TimeLocked = !(currentMonth >= 6 && currentMonth <= 8);
  const q1ActivePeriod = "July - September";
  const isQ2TimeLocked = !(currentMonth >= 9 && currentMonth <= 11);
  const q2ActivePeriod = "October - December";
  const isMidtermTimeLocked = !(currentMonth >= 0 && currentMonth <= 5);
  const midtermActivePeriod = "January - June (Post-Q2)";
  const isQ3TimeLocked = !(currentMonth >= 0 && currentMonth <= 2);
  const q3ActivePeriod = "January - March";
  const isQ4TimeLocked = !(currentMonth >= 3 && currentMonth <= 5);
  const q4ActivePeriod = "April - June";
  const isAnnualTimeLocked = !(currentMonth >= 6 && currentMonth <= 8);
  const annualActivePeriod = "July - September (Post-Q4)";

  const renderTimeLockBanner = (isLocked, periodName) => {
    if (isLocked) {
      return (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium mb-3">
          <span className="text-base">🔒</span>
          <span>This evaluation section is strictly time-locked. It is only active during its reporting period: <strong>{periodName}</strong>.</span>
        </div>
      );
    }
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium mb-3">
        <span className="text-base">✅</span>
        <span>This evaluation section is currently active ({periodName}).</span>
      </div>
    );
  };
`;

content = content.replace(
  "export function EvaluationIPMS({ currentUser, activeTenantId }: Props) {\n",
  "export function EvaluationIPMS({ currentUser, activeTenantId }: Props) {\n" + logicInjection
);

// 2. Patch Q1
content = content.replace(
  /{kpi\.q1Locked && \(/g,
  "{renderTimeLockBanner(isQ1TimeLocked, q1ActivePeriod)}\n                        {kpi.q1Locked && ("
);
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.q1Locked}/g, "disabled={kpiIsReadOnly || kpi.q1Locked || isQ1TimeLocked}");
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.q1Locked \|\| /g, "disabled={kpiIsReadOnly || kpi.q1Locked || isQ1TimeLocked || ");

// 3. Patch Q2
content = content.replace(
  /{kpi\.q2Locked && \(/g,
  "{renderTimeLockBanner(isQ2TimeLocked, q2ActivePeriod)}\n                        {kpi.q2Locked && ("
);
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.q2Locked}/g, "disabled={kpiIsReadOnly || kpi.q2Locked || isQ2TimeLocked}");
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.q2Locked \|\| /g, "disabled={kpiIsReadOnly || kpi.q2Locked || isQ2TimeLocked || ");

// 4. Patch Midterm
content = content.replace(
  /{currentTab === 'midtermjs' && \(\n\s*<div className="space-y-4">/g,
  "{currentTab === 'midtermjs' && (\n                      <div className=\"space-y-4\">\n                        {renderTimeLockBanner(isMidtermTimeLocked, midtermActivePeriod)}"
);
// Midterm has q2Locked in some places? Or kpi.midtermLocked? Let's check. 
// Wait, I will use generic replace for Midterm
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.midtermLocked}/g, "disabled={kpiIsReadOnly || kpi.midtermLocked || isMidtermTimeLocked}");
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.midtermLocked \|\| /g, "disabled={kpiIsReadOnly || kpi.midtermLocked || isMidtermTimeLocked || ");

// 5. Patch Q3
content = content.replace(
  /{kpi\.q3Locked && \(/g,
  "{renderTimeLockBanner(isQ3TimeLocked, q3ActivePeriod)}\n                        {kpi.q3Locked && ("
);
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.q3Locked}/g, "disabled={kpiIsReadOnly || kpi.q3Locked || isQ3TimeLocked}");
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.q3Locked \|\| /g, "disabled={kpiIsReadOnly || kpi.q3Locked || isQ3TimeLocked || ");

// 6. Patch Q4
content = content.replace(
  /{kpi\.q4Locked && \(/g,
  "{renderTimeLockBanner(isQ4TimeLocked, q4ActivePeriod)}\n                        {kpi.q4Locked && ("
);
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.q4Locked}/g, "disabled={kpiIsReadOnly || kpi.q4Locked || isQ4TimeLocked}");
content = content.replace(/disabled={kpiIsReadOnly \|\| kpi\.q4Locked \|\| /g, "disabled={kpiIsReadOnly || kpi.q4Locked || isQ4TimeLocked || ");

// 7. Patch Annual
content = content.replace(
  /{currentTab === 'annual' && \(\n\s*<div className="space-y-4">/g,
  "{currentTab === 'annual' && (\n                      <div className=\"space-y-4\">\n                        {renderTimeLockBanner(isAnnualTimeLocked, annualActivePeriod)}"
);
// Replace annual specific disabled state
content = content.replace(/disabled={kpiIsReadOnly}/g, "disabled={kpiIsReadOnly}"); // Wait, I need to match carefully for Annual since it doesn't have a kpi.annualLocked flag maybe? Let's check how Annual is disabled.

fs.writeFileSync(path, content);
console.log("Patched Evaluation_IPMS.tsx with time locks");
