import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const draftEndpoints = `
  app.get("/api/tenant/:tenantId/pa-drafting-doc", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = \`draft_doc_\${tenantId}\`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      let html = "";
      if (data && data.content) {
        const parsed = JSON.parse(data.content);
        html = parsed.html || "";
      }
      res.json({ html });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/pa-drafting-doc", async (req, res) => {
    const { tenantId } = req.params;
    const { html } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = \`draft_doc_\${tenantId}\`;
      
      const { error } = await supabase.from('messages').upsert({
        id: documentId,
        tenant_id: tenantId,
        sender_id: 'system',
        sender_email: 'admin@system.local',
        sender_name: 'System Admin',
        content: JSON.stringify({ html }),
        message_type: 'drafting_suite_doc',
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
`;

const insertMarker = `  // 17.7 Fetch Performance Agreements for a tenant`;

content = content.replace(insertMarker, draftEndpoints + "\n  " + insertMarker);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Added drafting suite endpoints to server.ts.');
