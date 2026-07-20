const fs = require('fs');
const file = 'src/components/IPMS/PADraftingSuite.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
const stateTarget = "  const [pulledPedCompetencyRows, setPulledPedCompetencyRows] = useState<any[] | null>(null);";
const stateNew = stateTarget + "\n  const [pulledCorpCompetencyRows, setPulledCorpCompetencyRows] = useState<any[] | null>(null);";
content = content.replace(stateTarget, stateNew);

const stateTarget2 = "  const [pullingPedCompetencies, setPullingPedCompetencies] = useState(false);";
const stateNew2 = stateTarget2 + "\n  const [pullingCorpCompetencies, setPullingCorpCompetencies] = useState(false);";
content = content.replace(stateTarget2, stateNew2);

// 2. Add handlePullCorpCompetencies
const pullPedTarget = "  const handlePullPedCompetencies = async () => {";
const handlePullCorp = \`
  const handlePullCorpCompetencies = async () => {
    setPullingCorpCompetencies(true);
    try {
      const res = await fetch(\\\`/api/tenant/\${activeTenantId}/core-competencies?t=\${Date.now()}\\\`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.corporateServicesItems) && data.corporateServicesItems.length > 0) {
          setPulledCorpCompetencyRows(data.corporateServicesItems);
          triggerNotification(\\\`Successfully pulled all \${data.corporateServicesItems.length} Corporate Services Core Competencies!\\\`, "success");
        } else {
          setPulledCorpCompetencyRows([]);
          triggerNotification("No Corporate Services Competency rows found. Please ensure they are populated in the Core Competencies Corporate Services Tab.", "error");
        }
      } else {
        throw new Error("Failed to load Corporate Services Competencies data.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Error pulling Corporate Services Competencies: " + err.message, "error");
    } finally {
      setPullingCorpCompetencies(false);
    }
  };
\`;
content = content.replace(pullPedTarget, handlePullCorp + "\\n" + pullPedTarget);

fs.writeFileSync(file, content);
