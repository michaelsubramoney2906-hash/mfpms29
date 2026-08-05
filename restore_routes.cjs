const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/tenant\/:tenantId\/job-competencies"[\s\S]*?\/\/ Shared Performance Reports Dispatch & Routing Routes/m;

const replacement = `app.post("/api/tenant/:tenantId/job-competencies", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { competencies, jscMasters, competencyMasters, definitionMasters, levelMasters, weightMasters } = req.body;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      
      const targetUsers = SYNCED_EMAILS.includes(userId) ? SYNCED_EMAILS : [userId];
      for (const u of targetUsers) {
        const uDocId = \`job_competencies_\${tenantId}_\${u}\`;
        const { error } = await supabase
          .from('messages')
          .upsert({ 
            id: uDocId,
            tenant_id: tenantId,
            sender_id: 'job_competencies_editor',
            sender_email: 'job_competencies@system.local',
            sender_name: 'Job Competencies Editor',
            content: JSON.stringify({ competencies, jscMasters, competencyMasters, definitionMasters, levelMasters, weightMasters }),
            message_type: 'job_competencies_list',
            created_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("job-competencies save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Core Competencies Routes
  app.get("/api/tenant/:tenantId/core-competencies", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = \`core_competencies_\${tenantId}_\${userId}\`;
      
      if (SYNCED_EMAILS.includes(userId)) {
        const id1 = \`core_competencies_\${tenantId}_zulune@nkangaladm.gov.za\`;
        const id2 = \`core_competencies_\${tenantId}_nsibandenp@nkangaladm.gov.za\`;
        const { data: res1 } = await supabase.from('messages').select('content').eq('id', id1).maybeSingle();
        const { data: res2 } = await supabase.from('messages').select('content').eq('id', id2).maybeSingle();
        let bestContent = null;
        if (res1 && res1.content) bestContent = res1.content;
        else if (res2 && res2.content) bestContent = res2.content;
        if (bestContent) return res.json(JSON.parse(bestContent));
      }

      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load core competencies error:", error.message);
        return res.json({ items: [], cfoItems: [], pedItems: [], corporateServicesItems: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {}
      }
      return res.json({ items: [], cfoItems: [], pedItems: [], corporateServicesItems: [] });
    } catch (err: any) {
      console.error("Core competencies load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/core-competencies", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { items, cfoItems, pedItems, corporateServicesItems } = req.body;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const targetUsers = SYNCED_EMAILS.includes(userId) ? SYNCED_EMAILS : [userId];
      for (const u of targetUsers) {
        const uDocId = \`core_competencies_\${tenantId}_\${u}\`;
        const { error } = await supabase
          .from('messages')
          .upsert({ 
            id: uDocId,
            tenant_id: tenantId,
            sender_id: 'core_competencies_editor',
            sender_email: 'core_competencies@system.local',
            sender_name: 'Core Competencies Editor',
            content: JSON.stringify({ items, cfoItems, pedItems, corporateServicesItems }),
            message_type: 'core_competencies_list',
            created_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("core-competencies save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Personal Development Plan (PDP) Routes
  app.get("/api/tenant/:tenantId/pdp", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = \`pdp_\${tenantId}_\${userId}\`;
      
      if (SYNCED_EMAILS.includes(userId)) {
        const id1 = \`pdp_\${tenantId}_zulune@nkangaladm.gov.za\`;
        const id2 = \`pdp_\${tenantId}_nsibandenp@nkangaladm.gov.za\`;
        const { data: res1 } = await supabase.from('messages').select('content').eq('id', id1).maybeSingle();
        const { data: res2 } = await supabase.from('messages').select('content').eq('id', id2).maybeSingle();
        let bestContent = null;
        if (res1 && res1.content) bestContent = res1.content;
        else if (res2 && res2.content) bestContent = res2.content;
        if (bestContent) return res.json(JSON.parse(bestContent));
      }

      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load pdp error:", error.message);
        return res.json({ items: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {}
      }
      return res.json({ items: [] });
    } catch (err: any) {
      console.error("pdp load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/pdp", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { items, gapsMasters, outcomesMasters, trainingsMasters, modesMasters, supportMasters } = req.body;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const targetUsers = SYNCED_EMAILS.includes(userId) ? SYNCED_EMAILS : [userId];
      for (const u of targetUsers) {
        const uDocId = \`pdp_\${tenantId}_\${u}\`;
        const { error } = await supabase
          .from('messages')
          .upsert({ 
            id: uDocId,
            tenant_id: tenantId,
            sender_id: 'pdp_editor',
            sender_email: 'pdp@system.local',
            sender_name: 'PDP Editor',
            content: JSON.stringify({ items, gapsMasters, outcomesMasters, trainingsMasters, modesMasters, supportMasters }),
            message_type: 'pdp_list',
            created_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("pdp save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Performance Plan (PPLAN) Routes
  let pplanCache;
  if (typeof global.pplanCache === 'undefined') {
    global.pplanCache = new Map();
  }
  pplanCache = global.pplanCache;
  const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

  app.get("/api/tenant/:tenantId/pplan", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = \`pplan_\${tenantId}_\${userId}\`;
      
      const cached = pplanCache.get(documentId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        try {
          return res.json(JSON.parse(cached.raw));
        } catch (e) {}
      }

      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load pplan error:", error.message);
        return res.json({ metadata: {}, items: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          pplanCache.set(documentId, { raw: data.content, timestamp: Date.now() });
          return res.json(parsed);
        } catch (parseErr) {}
      }
      return res.json({ metadata: {}, items: [] });
    } catch (err: any) {
      console.error("pplan load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/pplan", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { metadata, items } = req.body;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const uDocId = \`pplan_\${tenantId}_\${userId}\`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: uDocId,
          tenant_id: tenantId,
          sender_id: 'pplan_editor_tool',
          sender_email: 'pplan@system.local',
          sender_name: 'PPLAN Editor',
          content: JSON.stringify({ metadata, items }),
          message_type: 'pplan_list',
          created_at: new Date().toISOString()
        });
      if (error) throw error;
      pplanCache.delete(uDocId);

      // Automatically map Performance Plan items to the 2nd/3rd Layer SDBIP table
      if (items && Array.isArray(items)) {
        const sdbipId = \`sdbip23_\${tenantId}\`;
        const { data: sdbipData, error: sdbipGetError } = await supabase
          .from('messages')
          .select('content')
          .eq('id', sdbipId)
          .maybeSingle();
        let sdbipItems = [];
        if (!sdbipGetError && sdbipData && sdbipData.content) {
          try {
            const parsed = JSON.parse(sdbipData.content);
            sdbipItems = parsed.items || [];
          } catch(e) {}
        }
        
        items.forEach((pplanItem) => {
          const existing = sdbipItems.find((s) => s.id === pplanItem.id);
          const sdbipRow = {
            id: pplanItem.id,
            refNum: pplanItem.kpiNo || 'Unassigned',
            strategicObj: pplanItem.strategicGoal || 'Departmental Alignment',
            bsd: pplanItem.bsd ? 'Y' : 'N',
            led: pplanItem.led ? 'Y' : 'N',
            mfvm: pplanItem.mfvm ? 'Y' : 'N',
            ggpp: pplanItem.ggpp ? 'Y' : 'N',
            midt: pplanItem.midt ? 'Y' : 'N',
            sr: pplanItem.sr ? 'Y' : 'N',
            kpas: 'KPA 1: Service Delivery and Infrastructure Alignment',
            operationalActivity: 'Operational Target Action implementation',
            kpi: pplanItem.kpi || 'Detail not provided',
            compliance: pplanItem.review ? 'compliant' : 'non-compliant',
            uom: 'Operational measure as per evaluation evidence',
            mscoaTracking: 'Departmental budget non-financial vector',
            baseline: pplanItem.baseline || '-',
            annualTarget: pplanItem.annualTarget || '-',
            budgetAllocation: pplanItem.budget || 'R0.00',
            q1: pplanItem.annualTarget || '-',
            q2: pplanItem.annualTarget || '-',
            q3: pplanItem.annualTarget || '-',
            q4: pplanItem.annualTarget || '-',
            weight: pplanItem.weighting || '10',
            responsibleUnit: 'Assigned User Ward',
            evaluationUser: SYNCED_EMAILS.includes(userId) 
              ? 'Noluthando Zulu / Nompumelelo P. Nsibande'
              : (decodeURIComponent(userId) || 'Employee'),
            reviewManager: 'Line Supervisor',
            poeStatus: pplanItem.poeStatus || (existing ? existing.poeStatus : "Not Uploaded"),
            q1PoeDocs: pplanItem.q1PoeDocs || (existing ? existing.q1PoeDocs : []),
            q2PoeDocs: pplanItem.q2PoeDocs || (existing ? existing.q2PoeDocs : []),
            q3PoeDocs: pplanItem.q3PoeDocs || (existing ? existing.q3PoeDocs : []),
            q4PoeDocs: pplanItem.q4PoeDocs || (existing ? existing.q4PoeDocs : [])
          };
          if (existing) { 
            Object.assign(existing, sdbipRow);
          } else { 
            sdbipItems.push(sdbipRow);
          }
        });
        
        await supabase
          .from('messages')
          .upsert({
            id: sdbipId,
            tenant_id: tenantId,
            sender_id: 'auto_sync',
            sender_email: 'sync@sdbip.node',
            sender_name: 'PPLAN Sync',
            content: JSON.stringify({ items: sdbipItems }),
            message_type: 'sdbip23_list',
            created_at: new Date().toISOString()
          });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("pplan save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Shared Performance Reports Dispatch & Routing Routes`;

code = code.replace(regex, replacement);

fs.writeFileSync('server.ts', code);
console.log('Restored missing routes');
