const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

const newFn = `  const handlePullFredCorp = async () => {
    if (!activeTenantId) return;
    setIsPullingFredCorp(true);
    setImportMessage(null);

    try {
      const response = await fetch(\`/api/tenant/\${activeTenantId}/fred-extraction/corporate_services_competencies_engine?userId=\${currentUser?.email || 'default'}\`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.Corporate_Services_Core_Competencies) {
          const mappedRows = json.data.Corporate_Services_Core_Competencies.map((comp: any, idx: number) => ({
            id: \`corp-row-ext-\${idx}-\${Date.now()}\`,
            competency: comp.Competency || '',
            components: comp.Components || '',
            definition: comp.Competency_Definition || '',
            weighting: comp.Weighting_Percent ? String(comp.Weighting_Percent).replace(/[^0-9.]/g, '') : '0'
          }));
          if (mappedRows.length > 0) {
            setCorpRows(mappedRows);
            setSyncStatus('cached');
            setImportMessage({
              text: \`Successfully imported \${mappedRows.length} Corporate Services core competencies from Fred Extraction! Click "Save Configuration" to persist.\`,
              type: 'success'
            });
          } else {
            setImportMessage({
              text: "No competencies found in the saved Corporate Services extraction JSON structure.",
              type: 'error'
            });
          }
        } else {
          setImportMessage({
            text: "No saved Corporate Services extractions found. Please upload and process a document in Fred's Cognitive Extraction Agent first.",
            type: 'error'
          });
        }
      } else {
        setImportMessage({
          text: "Could not retrieve saved Corporate Services extractions from the Supabase ledger. Ensure the document has been processed first.",
          type: 'error'
        });
      }
    } catch (err) {
      console.error("Failed to pull Corporate Services extraction:", err);
      setImportMessage({
        text: "Exception occurred while pulling Corporate Services extraction data.",
        type: 'error'
      });
    } finally {
      setIsPullingFredCorp(false);
      setTimeout(() => {
        setImportMessage(null);
      }, 7000);
    }
  };

  const handlePullFredCore = async () => {`;

content = content.replace('  const handlePullFredCore = async () => {', newFn);
fs.writeFileSync(file, content);
