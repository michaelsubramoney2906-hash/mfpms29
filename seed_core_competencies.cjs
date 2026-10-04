const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function seedCoreCompetenciesModule() {
  const email = 'manganijp@nkangaladm.gov.za';
  const defaultCoreCompetencies = [
    {
      id: 'row-1',
      competency: 'Strategic Leadership & Direction',
      basic: 'Guides basic operational teams and ensures day-to-day administrative compliance.',
      competent: 'Formulates departmental strategies aligned to District SDBIP and Council mandates.',
      advanced: 'Transforms organizational units, leading inter-departmental performance integration.',
      superior: 'Visionary public sector leadership, setting national local governance benchmarks.'
    },
    {
      id: 'row-2',
      competency: 'Financial & Budgetary Oversight (MFMA)',
      basic: 'Understands basic municipal budget votes and internal expenditure controls.',
      competent: 'Manages departmental capital & operational budgets in compliance with MFMA Section 57.',
      advanced: 'Optimizes large scale municipal resource allocations and drives zero-defect audit outcomes.',
      superior: 'Defines institutional financial sustainability models across municipal entities.'
    },
    {
      id: 'row-3',
      competency: 'People & Change Management',
      basic: 'Supervises immediate staff and monitors daily attendance and task logs.',
      competent: 'Fosters high-performing teams, manages performance gaps, and resolves workplace disputes.',
      advanced: 'Builds cross-functional leadership pipelines and mentors departmental heads.',
      superior: 'Drives systemic cultural transformation and organizational excellence.'
    },
    {
      id: 'row-4',
      competency: 'Governance, Ethics & Risk Management',
      basic: 'Acknowledges statutory compliance protocols and local government codes of conduct.',
      competent: 'Ensures functional areas meet regulatory parameters and AG compliance standards.',
      advanced: 'Champions clean governance and leads proactive risk mitigation across municipal operations.',
      superior: 'Establishes zero-tolerance risk management frameworks and statutory accountability models.'
    }
  ];

  const targetDocIds = [
    `core_competencies_neda_${email}`,
    `core_competencies_nkangala_auto_${email}`,
    `core_competencies_tenant-229_${email}`,
    `core_competencies_neda_default`,
    `core_competencies_nkangala_auto_default`
  ];

  for (const docId of targetDocIds) {
    const tenantId = docId.includes('neda') ? 'neda' : docId.includes('tenant-229') ? 'tenant-229' : 'nkangala_auto';
    
    // Check if document already exists
    const { data } = await supabase.from('messages').select('content').eq('id', docId).maybeSingle();
    let itemsToSave = defaultCoreCompetencies;
    if (data && data.content) {
      try {
        const parsed = JSON.parse(data.content);
        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          console.log(`Document ${docId} already has ${parsed.items.length} items. Updating metadata...`);
          itemsToSave = parsed.items;
        }
      } catch (e) {}
    }

    const payload = JSON.stringify({
      items: itemsToSave,
      cfoItems: [],
      pedItems: [],
      corporateServicesItems: []
    });

    const { error } = await supabase.from('messages').upsert({
      id: docId,
      tenant_id: tenantId,
      sender_id: 'core_competencies_editor',
      sender_email: email,
      sender_name: 'Core Competencies Editor',
      content: payload,
      message_type: 'core_competencies_list',
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error(`Error seeding ${docId}:`, error);
    } else {
      console.log(`Successfully seeded ${docId} with ${itemsToSave.length} Standard Core Competencies.`);
    }
  }
}

seedCoreCompetenciesModule();
