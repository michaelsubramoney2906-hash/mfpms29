const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const fallbackUrl = "https://skuuhpjbhiablxycsyco.supabase.co";
const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdXVocGpiaGlhYmx4eWNzeWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUzOTY4NSwiZXhwIjoyMDk2MTE1Njg1fQ.4hh-OrX2GQGC_nlA4Qp6D0I3qQXP3ehX4i3WQhLWIOQ";

const supabase = createClient(fallbackUrl, fallbackKey);

async function analyzeAllSubmissions() {
  const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  const userByEmail = new Map();
  users.forEach(u => {
    if (u.email) userByEmail.set(u.email.toLowerCase().trim(), u);
  });

  // Fetch all pplan rows
  console.log('Fetching all pplans from messages...');
  const { data: rows, error } = await supabase
    .from('messages')
    .select('id, content, created_at')
    .like('id', 'pplan_%');

  if (error) {
    console.error('Error fetching pplans:', error);
    return;
  }

  console.log(`Found ${rows.length} pplan records.`);

  const plansByUser = new Map();

  for (const r of rows) {
    // Extract userId from id: pplan_tenant-229_email or pplan_nkangala_auto_email
    const parts = r.id.split('_');
    const userEmail = parts.slice(2).join('_').toLowerCase().trim();
    if (!userEmail) continue;

    let parsed = null;
    try {
      parsed = typeof r.content === 'string' ? JSON.parse(r.content) : r.content;
    } catch(e) {
      continue;
    }

    if (!parsed || !parsed.metadata) continue;

    // We keep the one with most items or latest
    const existing = plansByUser.get(userEmail);
    const itemsCount = Array.isArray(parsed.items) ? parsed.items.length : 0;
    if (!existing || itemsCount > (existing.items?.length || 0)) {
      plansByUser.set(userEmail, {
        recordId: r.id,
        userEmail,
        plan: parsed,
        itemsCount
      });
    }
  }

  console.log(`Unique users with pplans: ${plansByUser.size}`);

  const submittedUsers = [];
  const invisibleSubmissions = [];

  for (const [email, entry] of plansByUser.entries()) {
    const p = entry.plan;
    const meta = p.metadata || {};
    const items = Array.isArray(p.items) ? p.items : [];
    
    const isSubmitted = 
      meta.reviewStatus === 'Submitted for Approval' ||
      meta.reviewStatus === 'Submitted for Review' ||
      meta.reviewStatus === 'Submitted' ||
      items.some(i => i.reviewStatus === 'Submitted for Approval' || i.reviewStatus === 'Submitted for Review');

    const hasActualOrPoe = items.some(i => 
      (i.q1Actual && String(i.q1Actual).trim() !== '' && String(i.q1Actual).trim() !== 'N/A') ||
      (i.q1PoeDocs && i.q1PoeDocs.length > 0) ||
      i.poeFileBase64
    );

    if (isSubmitted || hasActualOrPoe) {
      const userProfile = userByEmail.get(email);
      const mgrName = meta.manager || userProfile?.manager || 'Unknown Manager';
      const mgrEmail = meta.managerEmail || userProfile?.managerEmail || '';
      
      submittedUsers.push({
        email,
        name: meta.name || userProfile?.fullName || email,
        isSubmitted,
        hasActualOrPoe,
        reviewStatus: meta.reviewStatus || 'None',
        mgrName,
        mgrEmail,
        itemsCount: items.length
      });
    }
  }

  console.log(`\n=== TOTAL USERS WITH SUBMISSIONS OR COMPLETED REPORTING: ${submittedUsers.length} ===`);

  // Group by Manager
  const byManager = {};
  submittedUsers.forEach(u => {
    const key = (u.mgrEmail || u.mgrName || 'Unknown').toLowerCase();
    if (!byManager[key]) byManager[key] = [];
    byManager[key].push(u);
  });

  console.log('\n--- BREAKDOWN BY MANAGER ---');
  for (const [mgr, list] of Object.entries(byManager)) {
    console.log(`Manager: "${mgr}" (${list.length} subordinates with submissions)`);
    list.forEach(sub => {
      console.log(`  - ${sub.email} (${sub.name}) | Status: ${sub.reviewStatus} | HasActual/PoE: ${sub.hasActualOrPoe}`);
    });
  }
}

analyzeAllSubmissions();
