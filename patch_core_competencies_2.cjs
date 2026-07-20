const fs = require('fs');
const file = 'src/components/IPMS/CoreCompetencies.tsx';
let content = fs.readFileSync(file, 'utf8');

const pedFn = `  const handlePullFredPed = async () => {
    setIsPullingFredPed(true);
    setSyncStatus('saving');
    try {
      const response = await fetch(\`/api/tenant/\${activeTenantId}/fred-extraction/ped_competencies_engine?userId=\${currentUser?.email || 'default'}\`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.PED_Core_Competencies) {
          const mappedRows = json.data.PED_Core_Competencies.map((comp: any, idx: number) => ({
            id: \`ped-row-ext-\${idx}-\${Date.now()}\`,
            competency: comp.Competency || '',
            components: comp.Components || '',
            definition: comp.Competency_Definition || '',
            weighting: comp.Weighting_Percent ? String(comp.Weighting_Percent).replace(/[^0-9.]/g, '') : '0'
          }));
          if (mappedRows.length > 0) {
            setPedRows(mappedRows);
            setSyncStatus('cached');
            setImportMessage({
              text: \`Successfully imported \${mappedRows.length} PED core competencies from Fred PED Extraction! Click "Save Configuration" to persist.\`,
              type: 'success'
            });
          } else {
            setSyncStatus('error');
            setImportMessage({
              text: "No PED competencies found in the extracted document data.",
              type: 'error'
            });
          }
        } else {
          setSyncStatus('error');
          setImportMessage({
            text: "No saved PED extractions found. Please upload and process a document in Fred's Cognitive Extraction Agent first.",
            type: 'error'
          });
        }
      } else {
        throw new Error("Failed to load FRED extractions");
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setImportMessage({
        text: "Error pulling data from Fred Extraction Agent.",
        type: 'error'
      });
    } finally {
      setIsPullingFredPed(false);
    }
  };`;

const corpFn = `
  const handlePullFredCorp = async () => {
    setIsPullingFredCorp(true);
    setSyncStatus('saving');
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
            setSyncStatus('error');
            setImportMessage({
              text: "No Corporate Services competencies found in the extracted document data.",
              type: 'error'
            });
          }
        } else {
          setSyncStatus('error');
          setImportMessage({
            text: "No saved Corporate Services extractions found. Please upload and process a document in Fred's Cognitive Extraction Agent first.",
            type: 'error'
          });
        }
      } else {
        throw new Error("Failed to load FRED extractions");
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setImportMessage({
        text: "Error pulling data from Fred Extraction Agent.",
        type: 'error'
      });
    } finally {
      setIsPullingFredCorp(false);
    }
  };`;

content = content.replace(pedFn, pedFn + corpFn);
fs.writeFileSync(file, content);
