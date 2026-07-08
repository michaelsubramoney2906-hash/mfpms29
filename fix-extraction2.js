import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  '3. Personal Development Plan (PDP) items. Extract everything exactly as it appears in the tables of the document. If any section is missing, return an empty array for that section."',
  '3. Personal Development Plan (PDP) items. 4. Drafting Suite HTML: Extract ALL text, tables, formatting, and structures from the entire document and return it as a complete semantic HTML representation, suitable for loading into a rich text editor. Extract everything exactly as it appears. If any section is missing, return an empty array/string for that section."'
);

const pdpPropEnd = `"Support person": { type: Type.STRING }
                  }
                }
              }`;

content = content.replace(
  pdpPropEnd,
  `"Support person": { type: Type.STRING }
                  }
                }
              },
              draftingHTML: {
                type: Type.STRING,
                description: "The complete document parsed into semantic HTML, including all tables, formatting, text, lists, etc."
              }`
);

const savePDP = `// Save PDP
      if (extractedData.pdp && extractedData.pdp.length > 0) {
        await supabase.from('messages').upsert({
          id: \`pdp_\${tenantId}\`,
          tenant_id: tenantId,
          sender_id: 'pa_extraction_engine',
          sender_email: 'extraction@system.local',
          sender_name: 'Extraction Engine',
          content: JSON.stringify({ items: extractedData.pdp }),
          message_type: 'pdp_list',
          created_at: new Date().toISOString()
        });
      }`;

content = content.replace(
  savePDP,
  `// Save PDP
      if (extractedData.pdp && extractedData.pdp.length > 0) {
        await supabase.from('messages').upsert({
          id: \`pdp_\${tenantId}\`,
          tenant_id: tenantId,
          sender_id: 'pa_extraction_engine',
          sender_email: 'extraction@system.local',
          sender_name: 'Extraction Engine',
          content: JSON.stringify({ items: extractedData.pdp }),
          message_type: 'pdp_list',
          created_at: new Date().toISOString()
        });
      }
      
      // Save Drafting HTML
      if (extractedData.draftingHTML) {
         await supabase.from('messages').upsert({
          id: \`draft_doc_\${tenantId}\`,
          tenant_id: tenantId,
          sender_id: 'pa_extraction_engine',
          sender_email: 'extraction@system.local',
          sender_name: 'Extraction Engine',
          content: JSON.stringify({ html: extractedData.draftingHTML }),
          message_type: 'drafting_suite_doc',
          created_at: new Date().toISOString()
        });     
      }`
);

const jsonResponse = `res.json({ success: true, extractedCount: {
        sdbip: (extractedData.sdbip23 || []).length,
        jsc: (extractedData.jobCompetencies || []).length,
        pdp: (extractedData.pdp || []).length
      }});`;

content = content.replace(
  jsonResponse,
  `res.json({ success: true, extractedCount: {
        sdbip: (extractedData.sdbip23 || []).length,
        jsc: (extractedData.jobCompetencies || []).length,
        pdp: (extractedData.pdp || []).length,
        draftingHTMLBytes: extractedData.draftingHTML ? extractedData.draftingHTML.length : 0
      }});`
);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Successfully added 4th extraction engine to server.ts.');
