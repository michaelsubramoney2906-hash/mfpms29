import { SupabaseClient } from '@supabase/supabase-js';

export function getInitialDemoState(tenantId: string) {
  return {
    tenantId,
    status: 'DRAFT_CAPTURED',
    lastUpdated: new Date().toISOString(),
    users: {
      standardUser: {
        email: 'user@mzansiflow.co.za',
        fullName: 'Demo Standard User',
        role: 'Standard User',
        department: 'Corporate Services',
        jobFunction: 'Performance Management Specialist',
        manager: 'Demo Line Manager',
        managerEmail: 'manager@mzansiflow.co.za'
      },
      manager: {
        email: 'manager@mzansiflow.co.za',
        fullName: 'Demo Line Manager',
        role: 'Line Manager',
        department: 'Corporate Services',
        jobFunction: 'Divisional Manager: Corporate Services'
      },
      audit: {
        email: 'audit@mzansiflow.co.za',
        fullName: 'Demo Internal Auditor',
        role: 'Internal Auditor',
        department: 'Internal Audit Services',
        jobFunction: 'Senior Internal Auditor'
      },
      dpmc: {
        email: 'dpmc@mzansiflow.co.za',
        fullName: 'Demo DPMC Moderator',
        role: 'DPMC Committee',
        department: 'Performance Moderation (DPMC)',
        jobFunction: 'Committee Moderator'
      }
    },
    agreement: {
      financialYear: '2024/2025',
      jobTitle: 'Performance Management Specialist',
      employeeName: 'Demo Standard User',
      employeeEmail: 'user@mzansiflow.co.za',
      managerName: 'Demo Line Manager',
      managerEmail: 'manager@mzansiflow.co.za',
      department: 'Corporate Services',
      kpas: [
        { id: 'kpa-1', kpaNo: 'KPA 1', name: 'Basic Service Delivery and Infrastructure Development', weight: 20 },
        { id: 'kpa-2', kpaNo: 'KPA 2', name: 'Municipal Financial Viability and Management', weight: 25 },
        { id: 'kpa-3', kpaNo: 'KPA 3', name: 'Good Governance and Public Participation', weight: 20 },
        { id: 'kpa-4', kpaNo: 'KPA 4', name: 'Institutional Development and Transformation', weight: 20 },
        { id: 'kpa-5', kpaNo: 'KPA 5', name: 'Local Economic Development (LED)', weight: 15 }
      ],
      kpis: [
        {
          id: 'kpi-demo-1',
          kpiNo: 'KPI #1',
          kpa: 'Municipal Financial Viability and Management',
          kpaNo: 'KPA 2',
          strategicGoal: 'Ensure Sound Financial Sustainability and Statutory SDBIP Compliance',
          kpi: 'Percentage compliance with Municipal SDBIP quarterly target milestones and National Treasury Section 71 reporting',
          baseline: '85% compliance in 2023/24',
          annualTarget: '100% compliance with all quarterly deadlines',
          q1Target: '90%',
          q2Target: '95%',
          q3Target: '100%',
          q4Target: '100%',
          weighting: 25,
          unitOfMeasurement: 'Percentage (%)',
          selfScore: '4.5',
          managerScore: '4.0',
          auditScore: '4.0',
          dpmcScore: '4.0',
          poeDoc: 'Q1_SDBIP_Milestone_Verification.pdf',
          poeStatus: 'Verified',
          poeDocs: [
            { id: 'doc-1', name: 'Q1_SDBIP_Milestone_Verification.pdf', size: '2.4 MB', uploadedBy: 'user@mzansiflow.co.za', uploadDate: '2024-10-15' },
            { id: 'doc-2', name: 'National_Treasury_Section71_Receipt.pdf', size: '1.1 MB', uploadedBy: 'user@mzansiflow.co.za', uploadDate: '2024-10-20' }
          ]
        },
        {
          id: 'kpi-demo-2',
          kpiNo: 'KPI #2',
          kpa: 'Institutional Development and Transformation',
          kpaNo: 'KPA 4',
          strategicGoal: 'Enhance Operational Efficiency, Turnaround Time, and Supply Chain Governance',
          kpi: 'Average turnaround time (in business days) for processing and evaluating procurement requisitions under delegations',
          baseline: '12 business days average',
          annualTarget: '7 business days average turnaround',
          q1Target: '9 days',
          q2Target: '8 days',
          q3Target: '7 days',
          q4Target: '7 days',
          weighting: 20,
          unitOfMeasurement: 'Business Days',
          selfScore: '4.0',
          managerScore: '4.0',
          auditScore: '4.0',
          dpmcScore: '4.0',
          poeDoc: 'SCM_Turnaround_Log_Q2.xlsx',
          poeStatus: 'Verified',
          poeDocs: [
            { id: 'doc-3', name: 'SCM_Turnaround_Log_Q2.xlsx', size: '3.8 MB', uploadedBy: 'user@mzansiflow.co.za', uploadDate: '2025-01-12' }
          ]
        },
        {
          id: 'kpi-demo-3',
          kpiNo: 'KPI #3',
          kpa: 'Municipal Financial Viability and Management',
          kpaNo: 'KPA 2',
          strategicGoal: 'Zero Tolerance on Irregularity and Full Audit Cleanliness',
          kpi: 'Percentage reduction in Municipal UIFW (Unauthorized, Irregular, Fruitless & Wasteful) expenditure across operations',
          baseline: '60% reduction achieved',
          annualTarget: '100% reduction and resolution of historical audit queries',
          q1Target: '80%',
          q2Target: '90%',
          q3Target: '100%',
          q4Target: '100%',
          weighting: 20,
          unitOfMeasurement: 'Percentage Reduction (%)',
          selfScore: '5.0',
          managerScore: '4.5',
          auditScore: '4.5',
          dpmcScore: '4.5',
          poeDoc: 'UIFW_Audit_Register_Report.docx',
          poeStatus: 'Verified',
          poeDocs: [
            { id: 'doc-4', name: 'UIFW_Audit_Register_Report.docx', size: '1.9 MB', uploadedBy: 'user@mzansiflow.co.za', uploadDate: '2025-01-18' },
            { id: 'doc-5', name: 'MPAC_Consequence_Management_Minutes.pdf', size: '890 KB', uploadedBy: 'user@mzansiflow.co.za', uploadDate: '2025-01-22' }
          ]
        },
        {
          id: 'kpi-demo-4',
          kpiNo: 'KPI #4',
          kpa: 'Good Governance and Public Participation',
          kpaNo: 'KPA 3',
          strategicGoal: 'Deepen Citizen Engagement, Ward Consultations, and Accountability',
          kpi: 'Number of quarterly public participation feedback sessions and stakeholder accountability clinics convened',
          baseline: '2 sessions held per annum',
          annualTarget: '4 structured quarterly sessions',
          q1Target: '1 session',
          q2Target: '2 sessions',
          q3Target: '3 sessions',
          q4Target: '4 sessions',
          weighting: 20,
          unitOfMeasurement: 'Number of Sessions',
          selfScore: '5.0',
          managerScore: '5.0',
          auditScore: '5.0',
          dpmcScore: '5.0',
          poeDoc: 'Ward_Attendance_Minutes_Q1_Q2.pdf',
          poeStatus: 'Verified',
          poeDocs: [
            { id: 'doc-6', name: 'Ward_Attendance_Minutes_Q1_Q2.pdf', size: '4.2 MB', uploadedBy: 'user@mzansiflow.co.za', uploadDate: '2025-02-05' }
          ]
        },
        {
          id: 'kpi-demo-5',
          kpiNo: 'KPI #5',
          kpa: 'Basic Service Delivery and Infrastructure Development',
          kpaNo: 'KPA 1',
          strategicGoal: 'Accelerate Quality Municipal Infrastructure Delivery and Operations',
          kpi: 'Percentage completion of planned institutional infrastructure maintenance and refurbishment milestones',
          baseline: '75% completion in 2023/24',
          annualTarget: '95% infrastructure milestone completion rate',
          q1Target: '80%',
          q2Target: '85%',
          q3Target: '90%',
          q4Target: '95%',
          weighting: 15,
          unitOfMeasurement: 'Percentage (%)',
          selfScore: '4.0',
          managerScore: '4.0',
          auditScore: '4.0',
          dpmcScore: '4.0',
          poeDoc: 'Infrastructure_Project_Certificates.pdf',
          poeStatus: 'Verified',
          poeDocs: [
            { id: 'doc-7', name: 'Infrastructure_Project_Certificates.pdf', size: '5.6 MB', uploadedBy: 'user@mzansiflow.co.za', uploadDate: '2025-02-14' }
          ]
        }
      ],
      jscs: [
        {
          id: 'jsc-demo-1',
          jscNo: 'JSC 1',
          competency: 'Performance Management Systems Analysis & SDBIP Alignment',
          level: 'Advanced (Level 4)',
          weighting: 25,
          selfScore: '4',
          managerScore: '4',
          auditScore: '4',
          dpmcScore: '4',
          definition: 'Deep expertise in analyzing municipal indicators, cascading departmental KPIs, and validating portfolio evidence integrity.',
          motivation: 'Conducted bi-weekly SDBIP alignment workshops across 6 municipal departments with 100% attendance and zero reporting gaps.'
        },
        {
          id: 'jsc-demo-2',
          jscNo: 'JSC 2',
          competency: 'Compliance Monitoring & Statutory Reporting',
          level: 'Advanced (Level 4)',
          weighting: 25,
          selfScore: '4',
          managerScore: '4',
          auditScore: '4',
          dpmcScore: '4',
          definition: 'Rigorous compliance tracking adhering to MFMA, MSA Section 57, and COGTA Performance Management Regulations.',
          motivation: 'Submitted all Section 52(d) quarterly performance reports and Section 71 submissions strictly within statutory windows.'
        },
        {
          id: 'jsc-demo-3',
          jscNo: 'JSC 3',
          competency: 'Strategic Planning & IDP Cascading',
          level: 'Proficient (Level 3)',
          weighting: 25,
          selfScore: '4',
          managerScore: '4',
          auditScore: '4',
          dpmcScore: '4',
          definition: 'Ability to translate 5-year municipal Integrated Development Plans into executable departmental scorecards and operational plans.',
          motivation: 'Facilitated IDP cascading to operational plans for junior officers and cross-functional teams.'
        },
        {
          id: 'jsc-demo-4',
          jscNo: 'JSC 4',
          competency: 'Risk & Audit Remediation Coordination',
          level: 'Advanced (Level 4)',
          weighting: 25,
          selfScore: '5',
          managerScore: '5',
          auditScore: '5',
          dpmcScore: '5',
          definition: 'Proactive collaboration with Internal Audit, AGSA, and Audit Committee to resolve findings and strengthen internal controls.',
          motivation: 'Resolved 100% of internal audit review queries within 14 working days, maintaining clean audit trail.'
        }
      ],
      pdps: [
        {
          id: 'pdp-demo-1',
          pdpNo: 'PDP 1',
          developmentNeed: 'Advanced Municipal Financial Governance & GRAP Standards',
          intervention: 'SALGA Executive Municipal Finance Management Programme (MFMP)',
          targetQuarter: 'Q2 (October - December)',
          progress: 'Completed',
          outcome: 'Certified in Municipal Finance Governance; implemented strengthened quarterly expenditure tracking.'
        },
        {
          id: 'pdp-demo-2',
          pdpNo: 'PDP 2',
          developmentNeed: 'Automated IPMS Analytics & Fred AI-Assisted SDBIP Verification',
          intervention: 'Hands-on Fred AI & PowerBI Municipal Dashboard Architecture Masterclass',
          targetQuarter: 'Q3 (January - March)',
          progress: 'In Progress (85% completed)',
          outcome: 'Engineered automated evidence extraction pipelines that reduced audit prep turnaround by 40%.'
        },
        {
          id: 'pdp-demo-3',
          pdpNo: 'PDP 3',
          developmentNeed: 'Dispute Resolution & Performance Moderation in Local Government',
          intervention: 'SALGBC (Bargaining Council) Performance Moderation & Conciliation Seminar',
          targetQuarter: 'Q4 (April - June)',
          progress: 'Scheduled',
          outcome: 'Equipped to serve as official secretarial advisor to the Departmental Performance Moderation Committee (DPMC).'
        }
      ]
    },
    workflowHistory: [
      {
        id: 'hist-1',
        timestamp: new Date().toISOString(),
        actor: 'user@mzansiflow.co.za',
        actorName: 'Demo Standard User',
        role: 'Standard User (Submitter)',
        stage: 'Draft Initialized',
        action: 'Captured Performance Agreement',
        notes: 'Full Performance Agreement captured with 5 KPAs (100% weight), 5 municipal KPIs with attached verified PoEs, 4 JSCs, and 3 targeted PDPs.'
      }
    ],
    managerReview: null,
    auditReview: null,
    dpmcReview: null
  };
}

export async function seedDemoDataInSupabase(supabase: SupabaseClient, tenantId: string) {
  const state = getInitialDemoState(tenantId);
  const u = 'user@mzansiflow.co.za';

  // 1. Seed demo state in messages
  await supabase.from('messages').upsert({
    id: `ipms_demo_workflow_${tenantId}`,
    tenant_id: tenantId,
    sender_id: 'ipms_demo_system',
    sender_email: 'demo@system.local',
    sender_name: 'IPMS Demo System',
    content: JSON.stringify(state),
    message_type: 'ipms_demo_workflow',
    created_at: new Date().toISOString()
  });

  // 2. Seed PPLAN module for user@mzansiflow.co.za
  const pplanDocId = `pplan_${tenantId}_${u}`;
  await supabase.from('messages').upsert({
    id: pplanDocId,
    tenant_id: tenantId,
    sender_id: 'ipms_demo_system',
    sender_email: 'demo@system.local',
    sender_name: 'IPMS Demo System',
    content: JSON.stringify({
      metadata: {
        financialYear: '2024/2025',
        name: 'Demo Standard User',
        jobTitle: 'Performance Management Specialist',
        department: 'Corporate Services',
        manager: 'Demo Line Manager',
        managerEmail: 'manager@mzansiflow.co.za',
        reportTo: 'Demo Line Manager',
        email: 'user@mzansiflow.co.za',
        reviewStatus: 'Draft'
      },
      items: state.agreement.kpis
    }),
    message_type: 'pplan_list',
    created_at: new Date().toISOString()
  });

  // 3. Seed KPAs for user@mzansiflow.co.za
  await supabase.from('messages').upsert({
    id: `kpas_${tenantId}_${u}`,
    tenant_id: tenantId,
    sender_id: 'ipms_demo_system',
    sender_email: 'demo@system.local',
    sender_name: 'IPMS Demo System',
    content: JSON.stringify({ kpas: state.agreement.kpas }),
    message_type: 'kpa_list',
    created_at: new Date().toISOString()
  });

  // 4. Seed JSCs for user@mzansiflow.co.za
  await supabase.from('messages').upsert({
    id: `job_competencies_${tenantId}_${u}`,
    tenant_id: tenantId,
    sender_id: 'ipms_demo_system',
    sender_email: 'demo@system.local',
    sender_name: 'IPMS Demo System',
    content: JSON.stringify({ competencies: state.agreement.jscs }),
    message_type: 'job_competencies_list',
    created_at: new Date().toISOString()
  });

  // 5. Seed PDP for user@mzansiflow.co.za
  await supabase.from('messages').upsert({
    id: `pdp_${tenantId}_${u}`,
    tenant_id: tenantId,
    sender_id: 'ipms_demo_system',
    sender_email: 'demo@system.local',
    sender_name: 'IPMS Demo System',
    content: JSON.stringify({ pdpItems: state.agreement.pdps }),
    message_type: 'pdp_list',
    created_at: new Date().toISOString()
  });

  // 6. Ensure the 4 users exist in Supabase 'users' table
  const demoUsersList: Record<string, any>[] = [
    {
      id: 'demo-user-mzansiflow',
      full_name: 'Demo Standard User',
      email: 'user@mzansiflow.co.za',
      job_function: 'Performance Management Specialist',
      department: 'Corporate Services',
      manager: 'Demo Line Manager',
      manager_email: 'manager@mzansiflow.co.za',
      report_to: 'Demo Line Manager',
      role: 'tenant_user',
      source: 'demo',
      tenant_id: tenantId === 'global' ? 'tenant-229' : tenantId
    },
    {
      id: 'demo-manager-mzansiflow',
      full_name: 'Demo Line Manager',
      email: 'manager@mzansiflow.co.za',
      job_function: 'Divisional Manager: Corporate Services',
      department: 'Corporate Services',
      manager: 'Municipal Manager',
      manager_email: 'mm@mzansiflow.co.za',
      report_to: 'Municipal Manager',
      role: 'Manager',
      source: 'demo',
      tenant_id: tenantId === 'global' ? 'tenant-229' : tenantId
    },
    {
      id: 'demo-audit-mzansiflow',
      full_name: 'Demo Internal Auditor',
      email: 'audit@mzansiflow.co.za',
      job_function: 'Senior Internal Auditor',
      department: 'Internal Audit Services',
      manager: 'Chief Audit Executive',
      manager_email: 'cae@mzansiflow.co.za',
      report_to: 'Chief Audit Executive',
      role: 'Auditor',
      source: 'demo',
      tenant_id: tenantId === 'global' ? 'tenant-229' : tenantId
    },
    {
      id: 'demo-dpmc-mzansiflow',
      full_name: 'Demo DPMC Moderator',
      email: 'dpmc@mzansiflow.co.za',
      job_function: 'Committee Moderator',
      department: 'Performance Moderation (DPMC)',
      manager: 'Audit Committee Chair',
      manager_email: 'chair@mzansiflow.co.za',
      report_to: 'Audit Committee Chair',
      role: 'DPMC',
      source: 'demo',
      tenant_id: tenantId === 'global' ? 'tenant-229' : tenantId
    }
  ];

  try {
    for (const usr of demoUsersList) {
      await (supabase.from('users') as any).upsert(usr, { onConflict: 'email' });
    }
  } catch (e) {
    console.error('Error upserting demo users to Supabase users table:', e);
  }

  return state;
}

export async function addIpmsNotification(supabase: SupabaseClient, tenantId: string, notif: any) {
  const notifDocId = `ipms_notifications_${tenantId}`;
  let currentNotifs: any[] = [];
  try {
    const { data } = await supabase.from('messages').select('content').eq('id', notifDocId).maybeSingle();
    if (data && data.content) {
      const parsed = JSON.parse(data.content);
      currentNotifs = Array.isArray(parsed.notifications) ? parsed.notifications : [];
    }
  } catch (e) {}

  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isRead: false,
    ...notif
  };

  currentNotifs.unshift(newNotif);

  await supabase.from('messages').upsert({
    id: notifDocId,
    tenant_id: tenantId,
    sender_id: 'ipms_notification_system',
    sender_email: notif.senderEmail || 'system@mzansiflow.co.za',
    sender_name: notif.senderName || 'IPMS System',
    content: JSON.stringify({ notifications: currentNotifs }),
    message_type: 'ipms_notifications_store',
    created_at: new Date().toISOString()
  });

  return newNotif;
}

export async function handleDemoWorkflowGet(req: any, res: any, supabase: SupabaseClient) {
  const { tenantId } = req.params;
  try {
    const { data } = await supabase
      .from('messages')
      .select('content')
      .eq('id', `ipms_demo_workflow_${tenantId}`)
      .maybeSingle();

    if (data && data.content) {
      try {
        const parsed = JSON.parse(data.content);
        return res.json(parsed);
      } catch (e) {}
    }

    // Auto seed if not present
    const seeded = await seedDemoDataInSupabase(supabase, tenantId);
    return res.json(seeded);
  } catch (err: any) {
    console.error('Error in handleDemoWorkflowGet:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function handleDemoWorkflowAction(req: any, res: any, supabase: SupabaseClient) {
  const { tenantId } = req.params;
  const { action, notes, actionType, comments, scores, kpiId } = req.body;

  try {
    let state: any = null;
    const { data } = await supabase
      .from('messages')
      .select('content')
      .eq('id', `ipms_demo_workflow_${tenantId}`)
      .maybeSingle();

    if (data && data.content) {
      try {
        state = JSON.parse(data.content);
      } catch (e) {}
    }

    if (!state) {
      state = await seedDemoDataInSupabase(supabase, tenantId);
    }

    const timestamp = new Date().toISOString();

    // 1. Reset Action
    if (action === 'reset') {
      state = await seedDemoDataInSupabase(supabase, tenantId);
      return res.json({ success: true, message: 'IPMS Demo workflow reset to pristine captured state.', state });
    }

    // 2. Submit to Manager Action (by user@mzansiflow.co.za)
    if (action === 'submit_to_manager' || action === 'submit_kpi') {
      const isSingleKpi = action === 'submit_kpi';
      const kpiId = req.body?.kpiId || 'kpi-demo-1';
      const targetKpi = (state.agreement?.kpis || []).find((k: any) => k.id === kpiId) || state.agreement?.kpis?.[0];
      const kpiNo = targetKpi?.kpiNo || 'KPI #1';
      const kpiTitle = targetKpi?.kpi || 'Key Performance Indicator';

      state.status = 'SUBMITTED_TO_MANAGER';
      state.lastUpdated = timestamp;
      state.lastSubmittedKpiId = isSingleKpi ? kpiId : (state.agreement?.kpis?.[0]?.id || 'kpi-demo-1');

      // Update reviewStatus on agreement KPIs
      if (Array.isArray(state.agreement?.kpis)) {
        state.agreement.kpis = state.agreement.kpis.map((k: any) => {
          if (!isSingleKpi || k.id === kpiId) {
            return { ...k, reviewStatus: 'Submitted for Approval' };
          }
          return k;
        });
      }

      state.workflowHistory.unshift({
        id: `hist_${Date.now()}`,
        timestamp,
        actor: 'user@mzansiflow.co.za',
        actorName: 'Demo Standard User',
        role: 'Standard User (Submitter)',
        stage: 'Submitted to Manager',
        action: isSingleKpi 
          ? `Submitted ${kpiNo} to Line Manager for Approval`
          : 'Submitted Performance Agreement to Line Manager',
        notes: notes || (isSingleKpi 
          ? `Submitted ${kpiNo} ("${kpiTitle}") for line manager review and validation.`
          : 'Submitted 2024/2025 Performance Agreement for line manager review and validation.')
      });

      // Update PPLAN reviewStatus in Supabase messages
      try {
        const pplanRes = await supabase.from('messages').select('content').eq('id', `pplan_${tenantId}_user@mzansiflow.co.za`).maybeSingle();
        if (pplanRes.data && pplanRes.data.content) {
          const parsedPlan = JSON.parse(pplanRes.data.content);
          parsedPlan.metadata = { 
            ...parsedPlan.metadata, 
            reviewStatus: 'Submitted for Approval',
            manager: 'Demo Line Manager',
            managerEmail: 'manager@mzansiflow.co.za',
            reportTo: 'Demo Line Manager'
          };
          if (Array.isArray(parsedPlan.items)) {
            parsedPlan.items = parsedPlan.items.map((it: any) => {
              if (!isSingleKpi || it.id === kpiId) {
                return { ...it, reviewStatus: 'Submitted for Approval' };
              }
              return it;
            });
          }
          await supabase.from('messages').upsert({
            id: `pplan_${tenantId}_user@mzansiflow.co.za`,
            tenant_id: tenantId,
            sender_id: 'ipms_demo_system',
            sender_email: 'user@mzansiflow.co.za',
            sender_name: 'Demo Standard User',
            content: JSON.stringify(parsedPlan),
            message_type: 'pplan_list',
            created_at: timestamp
          });
        }
      } catch (e) {}

      // Send persistent notification to manager@mzansiflow.co.za
      await addIpmsNotification(supabase, tenantId, {
        senderEmail: 'user@mzansiflow.co.za',
        senderName: 'Demo Standard User',
        recipientEmail: 'manager@mzansiflow.co.za',
        recipientName: 'Demo Line Manager',
        title: isSingleKpi 
          ? `⚡ PoE Submitted for ${kpiNo} by Demo Standard User`
          : '📥 Performance Agreement Submitted for Manager Approval',
        message: isSingleKpi
          ? `Demo Standard User (user@mzansiflow.co.za) has submitted ${kpiNo}: "${kpiTitle}" with verified Portfolio of Evidence (PoE) for manager review and approval.\n\nSubordinate Notes: "${notes || 'Submitting KPI evaluation for formal approval.'}"`
          : `Demo Standard User (user@mzansiflow.co.za) has submitted their complete 2024/2025 Performance Agreement (5 KPAs, 5 KPIs, 4 JSCs, 3 PDPs) for your review and approval.\n\nSubordinate Notes: "${notes || 'Submitting performance agreement for formal approval.'}"`,
        actionType: 'submission',
        kpiId: isSingleKpi ? kpiId : (state.agreement?.kpis?.[0]?.id || 'kpi-demo-1'),
        kpiNo: isSingleKpi ? kpiNo : 'KPI #1'
      });

      await supabase.from('messages').upsert({
        id: `ipms_demo_workflow_${tenantId}`,
        tenant_id: tenantId,
        sender_id: 'ipms_demo_system',
        sender_email: 'demo@system.local',
        sender_name: 'IPMS Demo System',
        content: JSON.stringify(state),
        message_type: 'ipms_demo_workflow',
        created_at: timestamp
      });

      return res.json({ 
        success: true, 
        message: isSingleKpi 
          ? `${kpiNo} submitted to manager@mzansiflow.co.za. Notification dispatched.` 
          : 'Performance agreement submitted to manager@mzansiflow.co.za. Notification dispatched.', 
        state,
        submittedKpiId: isSingleKpi ? kpiId : state.agreement?.kpis?.[0]?.id
      });
    }

    // 3. Manager Action (by manager@mzansiflow.co.za)
    if (action === 'manager_action') {
      const decision = actionType || 'approve';

      if (decision === 'approve') {
        const incomingManagerScores = req.body?.managerScores || {};
        const incomingManagerComments = req.body?.managerKpiComments || {};
        state.status = 'MANAGER_APPROVED';
        state.managerReview = {
          decision: 'Approved',
          comments: comments || 'Verified all KPAs and portfolio evidence.',
          timestamp,
          reviewer: 'manager@mzansiflow.co.za'
        };

        if (Array.isArray(state.agreement?.kpis)) {
          state.agreement.kpis = state.agreement.kpis.map((k: any) => ({
            ...k,
            managerScore: incomingManagerScores[k.id] ? String(incomingManagerScores[k.id]) : (k.managerScore || '4.0'),
            managerComment: incomingManagerComments[k.id] || k.managerComment || comments || 'Target achieved; PoE verified.',
            reviewStatus: 'Dispatched to Audit',
            internalAuditStatus: 'Dispatched to Audit'
          }));
        }

        state.workflowHistory.unshift({
          id: `hist_${Date.now()}`,
          timestamp,
          actor: 'manager@mzansiflow.co.za',
          actorName: 'Demo Line Manager',
          role: 'Line Manager (Reviewer)',
          stage: 'Manager Approval Granted',
          action: 'Approved Performance Agreement & Pushed to Internal Audit',
          notes: comments || 'Manager verified and approved all indicators and portfolio of evidence documents.'
        });

        // Update PPLAN reviewStatus
        try {
          const pplanRes = await supabase.from('messages').select('content').eq('id', `pplan_${tenantId}_user@mzansiflow.co.za`).maybeSingle();
          if (pplanRes.data && pplanRes.data.content) {
            const parsedPlan = JSON.parse(pplanRes.data.content);
            parsedPlan.metadata = { 
              ...parsedPlan.metadata, 
              reviewStatus: 'Dispatched to Audit',
              internalAuditStatus: 'Dispatched to Audit',
              managerReviewComments: comments
            };
            if (Array.isArray(parsedPlan.items)) {
              parsedPlan.items = parsedPlan.items.map((it: any) => ({
                ...it,
                managerScore: incomingManagerScores[it.id] ? String(incomingManagerScores[it.id]) : (it.managerScore || '4.0'),
                managerComment: incomingManagerComments[it.id] || it.managerComment || comments || 'Target achieved; PoE verified.',
                reviewStatus: 'Dispatched to Audit',
                internalAuditStatus: 'Dispatched to Audit'
              }));
            }
            await supabase.from('messages').upsert({
              id: `pplan_${tenantId}_user@mzansiflow.co.za`,
              tenant_id: tenantId,
              sender_id: 'ipms_demo_system',
              sender_email: 'manager@mzansiflow.co.za',
              sender_name: 'Demo Line Manager',
              content: JSON.stringify(parsedPlan),
              message_type: 'pplan_list',
              created_at: timestamp
            });
          }
        } catch (e) {}

        // Notification 1: To user@mzansiflow.co.za informing of approval outcome
        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'manager@mzansiflow.co.za',
          senderName: 'Demo Line Manager',
          recipientEmail: 'user@mzansiflow.co.za',
          recipientName: 'Demo Standard User',
          title: '✅ Performance Agreement Approved by Manager',
          message: `Demo Line Manager (manager@mzansiflow.co.za) has reviewed and approved your 2024/2025 Performance Agreement.\n\nManager Feedback: "${comments}"\n\nYour agreement has now been automatically pushed to Internal Audit for quality assurance and compliance clearance.`,
          actionType: 'approval'
        });

        // Notification 2: Automatically pushed to audit@mzansiflow.co.za (Audit Dispatch)
        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'manager@mzansiflow.co.za',
          senderName: 'Demo Line Manager',
          recipientEmail: 'audit@mzansiflow.co.za',
          recipientName: 'Demo Internal Auditor',
          title: '🛡️ Audit Dispatch: Manager-Approved Performance Agreement for user@mzansiflow.co.za',
          message: `Line Manager Demo Line Manager (manager@mzansiflow.co.za) has approved the Performance Agreement for Demo Standard User (user@mzansiflow.co.za).\n\nManager Review Comment: "${comments}"\n\nPlease conduct internal audit review, verify portfolio of evidence (PoE) compliance, and clear the docket for DPMC moderation.`,
          actionType: 'audit_request'
        });

        await supabase.from('messages').upsert({
          id: `ipms_demo_workflow_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'ipms_demo_system',
          sender_email: 'demo@system.local',
          sender_name: 'IPMS Demo System',
          content: JSON.stringify(state),
          message_type: 'ipms_demo_workflow',
          created_at: timestamp
        });

        return res.json({ success: true, message: 'Approved by manager. User notified and docket dispatched to audit@mzansiflow.co.za.', state });
      } else if (decision === 'request_changes') {
        state.status = 'MANAGER_CHANGES_REQUESTED';
        state.managerReview = {
          decision: 'Changes Requested',
          comments: comments || 'Please revise KPIs and update evidence.',
          timestamp,
          reviewer: 'manager@mzansiflow.co.za'
        };

        state.workflowHistory.unshift({
          id: `hist_${Date.now()}`,
          timestamp,
          actor: 'manager@mzansiflow.co.za',
          actorName: 'Demo Line Manager',
          role: 'Line Manager (Reviewer)',
          stage: 'Changes Requested',
          action: 'Requested Changes on Performance Agreement',
          notes: comments || 'Manager requested revisions before approval.'
        });

        // Notification to user@mzansiflow.co.za
        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'manager@mzansiflow.co.za',
          senderName: 'Demo Line Manager',
          recipientEmail: 'user@mzansiflow.co.za',
          recipientName: 'Demo Standard User',
          title: '⚠️ Manager Requested Changes on Performance Agreement',
          message: `Demo Line Manager (manager@mzansiflow.co.za) reviewed your Performance Agreement and requested modifications.\n\nManager Feedback: "${comments}"\n\nPlease update your targets or evidence and re-submit for approval.`,
          actionType: 'revision_requested'
        });

        await supabase.from('messages').upsert({
          id: `ipms_demo_workflow_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'ipms_demo_system',
          sender_email: 'demo@system.local',
          sender_name: 'IPMS Demo System',
          content: JSON.stringify(state),
          message_type: 'ipms_demo_workflow',
          created_at: timestamp
        });

        return res.json({ success: true, message: 'Changes requested by manager. User notified.', state });
      } else {
        state.status = 'MANAGER_REJECTED';
        state.managerReview = {
          decision: 'Rejected',
          comments: comments || 'Submission rejected by line manager.',
          timestamp,
          reviewer: 'manager@mzansiflow.co.za'
        };

        state.workflowHistory.unshift({
          id: `hist_${Date.now()}`,
          timestamp,
          actor: 'manager@mzansiflow.co.za',
          actorName: 'Demo Line Manager',
          role: 'Line Manager (Reviewer)',
          stage: 'Submission Rejected',
          action: 'Rejected Performance Agreement',
          notes: comments || 'Submission rejected.'
        });

        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'manager@mzansiflow.co.za',
          senderName: 'Demo Line Manager',
          recipientEmail: 'user@mzansiflow.co.za',
          recipientName: 'Demo Standard User',
          title: '❌ Performance Agreement Rejected by Manager',
          message: `Demo Line Manager (manager@mzansiflow.co.za) has rejected your Performance Agreement submission.\n\nReason: "${comments}"`,
          actionType: 'rejection'
        });

        await supabase.from('messages').upsert({
          id: `ipms_demo_workflow_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'ipms_demo_system',
          sender_email: 'demo@system.local',
          sender_name: 'IPMS Demo System',
          content: JSON.stringify(state),
          message_type: 'ipms_demo_workflow',
          created_at: timestamp
        });

        return res.json({ success: true, message: 'Performance agreement rejected by manager.', state });
      }
    }

    // 4. Internal Audit Action (by audit@mzansiflow.co.za)
    if (action === 'audit_action') {
      const decision = actionType || 'approve';

      if (decision === 'approve') {
        const incomingAuditScores = req.body?.auditScores || {};
        const incomingAuditComments = req.body?.auditKpiComments || {};
        const incomingAuditCompliance = req.body?.auditKpiCompliance || {};
        state.status = 'AUDIT_APPROVED';
        state.auditReview = {
          decision: 'Audit Clearance Granted',
          scores: incomingAuditScores,
          kpiComments: incomingAuditComments,
          compliance: incomingAuditCompliance,
          comments: comments || 'Quality assurance and compliance verified.',
          timestamp,
          auditor: 'audit@mzansiflow.co.za'
        };

        if (Array.isArray(state.agreement?.kpis)) {
          state.agreement.kpis = state.agreement.kpis.map((k: any) => ({
            ...k,
            auditScore: incomingAuditScores[k.id] ? String(incomingAuditScores[k.id]) : (k.auditScore || '4.0'),
            internalAuditRating: incomingAuditScores[k.id] ? String(incomingAuditScores[k.id]) : (k.auditScore || '4.0'),
            internalAuditComment: incomingAuditComments[k.id] || k.internalAuditComment || comments || 'Compliance verified and approved for DPMC.',
            internalAuditCompliance: incomingAuditCompliance[k.id] || k.internalAuditCompliance || 'Compliant',
            internalAuditStatus: 'Pushed to DPMC'
          }));
        }

        state.workflowHistory.unshift({
          id: `hist_${Date.now()}`,
          timestamp,
          actor: 'audit@mzansiflow.co.za',
          actorName: 'Demo Internal Auditor',
          role: 'Internal Auditor (QA & Compliance)',
          stage: 'Audit Clearance Granted',
          action: 'Granted Audit Clearance & Dispatched to DPMC',
          notes: comments || 'Audit findings confirm full regulatory alignment with SDBIP.'
        });

        // Update PPLAN in Supabase
        try {
          const pplanRes = await supabase.from('messages').select('content').eq('id', `pplan_${tenantId}_user@mzansiflow.co.za`).maybeSingle();
          if (pplanRes.data && pplanRes.data.content) {
            const parsedPlan = JSON.parse(pplanRes.data.content);
            parsedPlan.metadata = { 
              ...parsedPlan.metadata, 
              internalAuditStatus: 'Pushed to DPMC',
              reviewStatus: 'Audited',
              auditComments: comments
            };
            if (Array.isArray(parsedPlan.items)) {
              parsedPlan.items = parsedPlan.items.map((it: any) => ({
                ...it,
                internalAuditStatus: 'Pushed to DPMC',
                auditScore: incomingAuditScores[it.id] ? String(incomingAuditScores[it.id]) : (it.auditScore || '4.0'),
                internalAuditRating: incomingAuditScores[it.id] ? String(incomingAuditScores[it.id]) : (it.auditScore || '4.0'),
                internalAuditComment: incomingAuditComments[it.id] || it.internalAuditComment || comments || 'Compliance verified and approved for DPMC.',
                internalAuditCompliance: incomingAuditCompliance[it.id] || it.internalAuditCompliance || 'Compliant'
              }));
            }
            await supabase.from('messages').upsert({
              id: `pplan_${tenantId}_user@mzansiflow.co.za`,
              tenant_id: tenantId,
              sender_id: 'ipms_demo_system',
              sender_email: 'audit@mzansiflow.co.za',
              sender_name: 'Demo Internal Auditor',
              content: JSON.stringify(parsedPlan),
              message_type: 'pplan_list',
              created_at: timestamp
            });
          }
        } catch (e) {}

        // Notification 1: To user@mzansiflow.co.za
        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'audit@mzansiflow.co.za',
          senderName: 'Demo Internal Auditor',
          recipientEmail: 'user@mzansiflow.co.za',
          recipientName: 'Demo Standard User',
          title: '🛡️ Internal Audit Clearance Granted',
          message: `Internal Auditor Demo Internal Auditor (audit@mzansiflow.co.za) has completed statutory quality assurance on your Performance Agreement.\n\nAudit Opinion: "${comments}"\n\nYour docket has been cleared and forwarded to the Departmental Performance Moderation Committee (DPMC) for final scoring and moderation.`,
          actionType: 'audit_cleared'
        });

        // Notification 2: To manager@mzansiflow.co.za
        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'audit@mzansiflow.co.za',
          senderName: 'Demo Internal Auditor',
          recipientEmail: 'manager@mzansiflow.co.za',
          recipientName: 'Demo Line Manager',
          title: '🛡️ Audit Clearance Notice: user@mzansiflow.co.za',
          message: `Internal Audit has cleared the Performance Agreement for your subordinate Demo Standard User (user@mzansiflow.co.za).\n\nAudit Finding: "${comments}"\n\nDocket successfully forwarded to DPMC.`,
          actionType: 'audit_notice'
        });

        // Notification 3: Automatically sent on to dpmc@mzansiflow.co.za
        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'audit@mzansiflow.co.za',
          senderName: 'Demo Internal Auditor',
          recipientEmail: 'dpmc@mzansiflow.co.za',
          recipientName: 'Demo DPMC Moderator',
          title: '📋 DPMC Moderation Docket: Audit-Cleared Agreement for user@mzansiflow.co.za',
          message: `Internal Audit has granted full audit clearance for the Performance Agreement of Demo Standard User (user@mzansiflow.co.za), approved by Demo Line Manager.\n\nAudit Finding: "${comments}"\n\nThe docket is now officially submitted to DPMC for committee scoring, moderation, and committee resolutions.`,
          actionType: 'dpmc_docket'
        });

        await supabase.from('messages').upsert({
          id: `ipms_demo_workflow_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'ipms_demo_system',
          sender_email: 'demo@system.local',
          sender_name: 'IPMS Demo System',
          content: JSON.stringify(state),
          message_type: 'ipms_demo_workflow',
          created_at: timestamp
        });

        return res.json({ success: true, message: 'Audit clearance granted. Docket forwarded to dpmc@mzansiflow.co.za.', state });
      } else if (decision === 'request_resubmission') {
        state.status = 'AUDIT_RESUBMISSION_REQUESTED';
        state.auditReview = {
          decision: 'Resubmission Requested',
          comments: comments || 'Compliance queries identified.',
          timestamp,
          auditor: 'audit@mzansiflow.co.za'
        };

        state.workflowHistory.unshift({
          id: `hist_${Date.now()}`,
          timestamp,
          actor: 'audit@mzansiflow.co.za',
          actorName: 'Demo Internal Auditor',
          role: 'Internal Auditor',
          stage: 'Audit Query Issued',
          action: 'Requested Resubmission with Changes',
          notes: comments || 'Auditor identified issues requiring revision.'
        });

        // Notify both user and manager
        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'audit@mzansiflow.co.za',
          senderName: 'Demo Internal Auditor',
          recipientEmail: 'user@mzansiflow.co.za',
          recipientName: 'Demo Standard User',
          title: '⚠️ Internal Audit: Resubmission with Changes Required',
          message: `Internal Audit reviewed your Performance Agreement and issued an audit query requiring corrections before DPMC moderation.\n\nAuditor Query: "${comments}"`,
          actionType: 'audit_query'
        });

        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'audit@mzansiflow.co.za',
          senderName: 'Demo Internal Auditor',
          recipientEmail: 'manager@mzansiflow.co.za',
          recipientName: 'Demo Line Manager',
          title: '⚠️ Audit Query on Subordinate Submission: user@mzansiflow.co.za',
          message: `Internal Audit has requested resubmission for user@mzansiflow.co.za.\n\nFindings: "${comments}"`,
          actionType: 'audit_query'
        });

        await supabase.from('messages').upsert({
          id: `ipms_demo_workflow_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'ipms_demo_system',
          sender_email: 'demo@system.local',
          sender_name: 'IPMS Demo System',
          content: JSON.stringify(state),
          message_type: 'ipms_demo_workflow',
          created_at: timestamp
        });

        return res.json({ success: true, message: 'Audit resubmission query issued to user and manager.', state });
      } else {
        state.status = 'AUDIT_REJECTED';
        state.auditReview = {
          decision: 'Rejected Non-Compliant',
          comments: comments || 'Non-compliance with statutory standards.',
          timestamp,
          auditor: 'audit@mzansiflow.co.za'
        };

        state.workflowHistory.unshift({
          id: `hist_${Date.now()}`,
          timestamp,
          actor: 'audit@mzansiflow.co.za',
          actorName: 'Demo Internal Auditor',
          role: 'Internal Auditor',
          stage: 'Audit Rejection',
          action: 'Rejected for Non-Compliance',
          notes: comments || 'Rejected.'
        });

        await addIpmsNotification(supabase, tenantId, {
          senderEmail: 'audit@mzansiflow.co.za',
          senderName: 'Demo Internal Auditor',
          recipientEmail: 'user@mzansiflow.co.za',
          recipientName: 'Demo Standard User',
          title: '❌ Internal Audit: Agreement Rejected for Non-Compliance',
          message: `Internal Audit rejected the Performance Agreement.\n\nFindings: "${comments}"`,
          actionType: 'audit_rejection'
        });

        await supabase.from('messages').upsert({
          id: `ipms_demo_workflow_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'ipms_demo_system',
          sender_email: 'demo@system.local',
          sender_name: 'IPMS Demo System',
          content: JSON.stringify(state),
          message_type: 'ipms_demo_workflow',
          created_at: timestamp
        });

        return res.json({ success: true, message: 'Agreement rejected by internal audit.', state });
      }
    }

    // 5. DPMC Action (by dpmc@mzansiflow.co.za)
    if (action === 'dpmc_action') {
      const scoreValues = Object.values(scores || {}) as number[];
      const avgScore = scoreValues.length > 0
        ? (scoreValues.reduce((a, b) => a + Number(b), 0) / scoreValues.length).toFixed(1)
        : '4.3';

      const incomingDpmcKpiComments = req.body?.dpmcKpiComments || {};
      state.status = 'DPMC_COMPLETED';
      state.dpmcReview = {
        scores: scores || {},
        kpiComments: incomingDpmcKpiComments,
        averageScore: avgScore,
        comments: comments || 'Moderation approved with performance incentive rating.',
        timestamp,
        moderator: 'dpmc@mzansiflow.co.za'
      };

      if (Array.isArray(state.agreement?.kpis)) {
        state.agreement.kpis = state.agreement.kpis.map((k: any) => ({
          ...k,
          dpmcScore: scores && scores[k.id] ? String(scores[k.id]) : (k.dpmcScore || '4.0'),
          dpmcComment: incomingDpmcKpiComments[k.id] || k.dpmcComment || comments || 'Approved by committee.'
        }));
      }

      state.workflowHistory.unshift({
        id: `hist_${Date.now()}`,
        timestamp,
        actor: 'dpmc@mzansiflow.co.za',
        actorName: 'Demo DPMC Moderator',
        role: 'DPMC Committee Moderator',
        stage: 'Moderation Finalized',
        action: `Scored & Moderated by DPMC (Average Score: ${avgScore}/5.0)`,
        notes: comments || 'DPMC finalized moderation ratings, confirmed portfolio scores, and signed off resolutions.'
      });

      // Update PPLAN in Supabase
      try {
        const pplanRes = await supabase.from('messages').select('content').eq('id', `pplan_${tenantId}_user@mzansiflow.co.za`).maybeSingle();
        if (pplanRes.data && pplanRes.data.content) {
          const parsedPlan = JSON.parse(pplanRes.data.content);
          parsedPlan.metadata = { 
            ...parsedPlan.metadata, 
            dpmcStatus: 'Moderated',
            dpmcScore: avgScore,
            dpmcComments: comments || 'Moderation approved with performance incentive rating.',
            reviewStatus: 'Moderated' 
          };
          if (Array.isArray(parsedPlan.items)) {
            parsedPlan.items = parsedPlan.items.map((it: any) => ({
              ...it,
              dpmcScore: scores && scores[it.id] ? String(scores[it.id]) : (it.dpmcScore || '4.0'),
              dpmcComment: incomingDpmcKpiComments[it.id] || it.dpmcComment || comments || 'Approved by committee.',
              dpmcComments: incomingDpmcKpiComments[it.id] || it.dpmcComments || comments || 'Approved by committee.'
            }));
          }
          await supabase.from('messages').upsert({
            id: `pplan_${tenantId}_user@mzansiflow.co.za`,
            tenant_id: tenantId,
            sender_id: 'ipms_demo_system',
            sender_email: 'dpmc@mzansiflow.co.za',
            sender_name: 'Demo DPMC Moderator',
            content: JSON.stringify(parsedPlan),
            message_type: 'pplan_list',
            created_at: timestamp
          });
        }
      } catch (e) {}

      // Disclose official moderation outcome to all 3 parties:
      // 1. To Subordinate user@mzansiflow.co.za
      await addIpmsNotification(supabase, tenantId, {
        senderEmail: 'dpmc@mzansiflow.co.za',
        senderName: 'Demo DPMC Moderator',
        recipientEmail: 'user@mzansiflow.co.za',
        recipientName: 'Demo Standard User',
        title: '🏆 DPMC Moderation Finalized: Official Scores Released',
        message: `The Departmental Performance Moderation Committee (DPMC) has concluded official moderation of your 2024/2025 Performance Agreement.\n\n• Final Moderated Score: ${avgScore} / 5.0 (Rating: ${(Number(avgScore) * 20).toFixed(0)}%)\n• Committee Resolution: "${comments}"\n\nYour moderated outcome is archived and locked in the official municipal record.`,
        actionType: 'dpmc_resolution'
      });

      // 2. To Line Manager manager@mzansiflow.co.za
      await addIpmsNotification(supabase, tenantId, {
        senderEmail: 'dpmc@mzansiflow.co.za',
        senderName: 'Demo DPMC Moderator',
        recipientEmail: 'manager@mzansiflow.co.za',
        recipientName: 'Demo Line Manager',
        title: '🏆 DPMC Resolution Notice: user@mzansiflow.co.za',
        message: `DPMC has concluded moderation for your subordinate Demo Standard User (user@mzansiflow.co.za).\n\n• Average Moderated Score: ${avgScore} / 5.0\n• Resolution: "${comments}"`,
        actionType: 'dpmc_resolution'
      });

      // 3. To Internal Audit audit@mzansiflow.co.za
      await addIpmsNotification(supabase, tenantId, {
        senderEmail: 'dpmc@mzansiflow.co.za',
        senderName: 'Demo DPMC Moderator',
        recipientEmail: 'audit@mzansiflow.co.za',
        recipientName: 'Demo Internal Auditor',
        title: '🏆 DPMC Committee Conclusion Signed Off: user@mzansiflow.co.za',
        message: `DPMC has moderated and closed the docket for Demo Standard User (user@mzansiflow.co.za). Compliance audit record marked as finalized.`,
        actionType: 'dpmc_resolution'
      });

      await supabase.from('messages').upsert({
        id: `ipms_demo_workflow_${tenantId}`,
        tenant_id: tenantId,
        sender_id: 'ipms_demo_system',
        sender_email: 'demo@system.local',
        sender_name: 'IPMS Demo System',
        content: JSON.stringify(state),
        message_type: 'ipms_demo_workflow',
        created_at: timestamp
      });

      return res.json({ success: true, message: `DPMC moderation completed. Average score: ${avgScore}/5.0. All parties notified.`, state });
    }

    // 6. User Redo Action (User resets KPI or agreement for re-evaluation)
    if (action === 'user_redo' || action === 'redo_kpi') {
      const isSingle = Boolean(kpiId);
      const targetKpi = isSingle ? state.agreement?.kpis?.find((k: any) => k.id === kpiId) : null;
      const kpiNo = targetKpi?.kpiNo || 'KPI';
      
      state.status = 'DRAFT_CAPTURED';
      if (Array.isArray(state.agreement?.kpis)) {
        state.agreement.kpis = state.agreement.kpis.map((k: any) => {
          if (!isSingle || k.id === kpiId) {
            return {
              ...k,
              reviewStatus: 'Draft'
            };
          }
          return k;
        });
      }

      state.workflowHistory.unshift({
        id: `hist_${Date.now()}`,
        timestamp,
        actor: 'user@mzansiflow.co.za',
        actorName: 'Demo Standard User',
        role: 'Standard User (Subordinate)',
        stage: 'Draft Reopened for Redo',
        action: isSingle ? `Unlocked ${kpiNo} for Redo Evaluation` : 'Unlocked Performance Agreement for Redo',
        notes: comments || (isSingle ? `Employee reopened ${kpiNo} to revise targets and portfolio evidence.` : 'Employee reopened evaluation for revision.')
      });

      // Update PPLAN
      try {
        const pplanRes = await supabase.from('messages').select('content').eq('id', `pplan_${tenantId}_user@mzansiflow.co.za`).maybeSingle();
        if (pplanRes.data && pplanRes.data.content) {
          const parsedPlan = JSON.parse(pplanRes.data.content);
          parsedPlan.metadata = { ...parsedPlan.metadata, reviewStatus: 'Draft' };
          if (Array.isArray(parsedPlan.items)) {
            parsedPlan.items = parsedPlan.items.map((it: any) => {
              if (!isSingle || it.id === kpiId) {
                return { ...it, reviewStatus: 'Draft' };
              }
              return it;
            });
          }
          await supabase.from('messages').upsert({
            id: `pplan_${tenantId}_user@mzansiflow.co.za`,
            tenant_id: tenantId,
            sender_id: 'ipms_demo_system',
            sender_email: 'user@mzansiflow.co.za',
            sender_name: 'Demo Standard User',
            content: JSON.stringify(parsedPlan),
            message_type: 'pplan_list',
            created_at: timestamp
          });
        }
      } catch (e) {}

      await supabase.from('messages').upsert({
        id: `ipms_demo_workflow_${tenantId}`,
        tenant_id: tenantId,
        sender_id: 'ipms_demo_system',
        sender_email: 'demo@system.local',
        sender_name: 'IPMS Demo System',
        content: JSON.stringify(state),
        message_type: 'ipms_demo_workflow',
        created_at: timestamp
      });

      return res.json({ 
        success: true, 
        message: isSingle ? `${kpiNo} unlocked for redo evaluation.` : 'Performance agreement unlocked for redo evaluation.',
        state 
      });
    }

    // 7. Manager Redo Action (Manager redoes approval or rejection)
    if (action === 'manager_redo') {
      const isSingle = Boolean(kpiId);
      const targetKpi = isSingle ? state.agreement?.kpis?.find((k: any) => k.id === kpiId) : null;
      const kpiNo = targetKpi?.kpiNo || 'KPI';

      state.status = 'SUBMITTED_TO_MANAGER';
      if (Array.isArray(state.agreement?.kpis)) {
        state.agreement.kpis = state.agreement.kpis.map((k: any) => {
          if (!isSingle || k.id === kpiId) {
            return {
              ...k,
              reviewStatus: 'Submitted for Approval',
              internalAuditStatus: 'Pending Review'
            };
          }
          return k;
        });
      }

      state.workflowHistory.unshift({
        id: `hist_${Date.now()}`,
        timestamp,
        actor: 'manager@mzansiflow.co.za',
        actorName: 'Demo Line Manager',
        role: 'Line Manager (Reviewer)',
        stage: 'Manager Review Redo',
        action: isSingle ? `Reset ${kpiNo} Approval / Rejection for Redo` : 'Reset Manager Approval / Rejection for Redo',
        notes: comments || (isSingle ? `Manager reset approval/rejection on ${kpiNo} to redo assessment.` : 'Manager reset review to redo assessment.')
      });

      // Update PPLAN
      try {
        const pplanRes = await supabase.from('messages').select('content').eq('id', `pplan_${tenantId}_user@mzansiflow.co.za`).maybeSingle();
        if (pplanRes.data && pplanRes.data.content) {
          const parsedPlan = JSON.parse(pplanRes.data.content);
          parsedPlan.metadata = { 
            ...parsedPlan.metadata, 
            reviewStatus: 'Submitted for Approval',
            internalAuditStatus: 'Pending Review'
          };
          if (Array.isArray(parsedPlan.items)) {
            parsedPlan.items = parsedPlan.items.map((it: any) => {
              if (!isSingle || it.id === kpiId) {
                return { ...it, reviewStatus: 'Submitted for Approval', internalAuditStatus: 'Pending Review' };
              }
              return it;
            });
          }
          await supabase.from('messages').upsert({
            id: `pplan_${tenantId}_user@mzansiflow.co.za`,
            tenant_id: tenantId,
            sender_id: 'ipms_demo_system',
            sender_email: 'manager@mzansiflow.co.za',
            sender_name: 'Demo Line Manager',
            content: JSON.stringify(parsedPlan),
            message_type: 'pplan_list',
            created_at: timestamp
          });
        }
      } catch (e) {}

      await supabase.from('messages').upsert({
        id: `ipms_demo_workflow_${tenantId}`,
        tenant_id: tenantId,
        sender_id: 'ipms_demo_system',
        sender_email: 'demo@system.local',
        sender_name: 'IPMS Demo System',
        content: JSON.stringify(state),
        message_type: 'ipms_demo_workflow',
        created_at: timestamp
      });

      return res.json({ 
        success: true, 
        message: isSingle ? `${kpiNo} reset to redo manager approval/rejection.` : 'Performance agreement reset to redo manager approval/rejection.',
        state 
      });
    }

    // 8. Audit Redo Action (Auditor redoes achieved / not achieved verification)
    if (action === 'audit_redo') {
      const isSingle = Boolean(kpiId);
      const targetKpi = isSingle ? state.agreement?.kpis?.find((k: any) => k.id === kpiId) : null;
      const kpiNo = targetKpi?.kpiNo || 'KPI';

      state.status = 'MANAGER_APPROVED';
      if (Array.isArray(state.agreement?.kpis)) {
        state.agreement.kpis = state.agreement.kpis.map((k: any) => {
          if (!isSingle || k.id === kpiId) {
            return {
              ...k,
              internalAuditStatus: 'Under Review',
              auditScore: '',
              internalAuditRating: '',
              internalAuditComment: ''
            };
          }
          return k;
        });
      }

      state.workflowHistory.unshift({
        id: `hist_${Date.now()}`,
        timestamp,
        actor: 'audit@mzansiflow.co.za',
        actorName: 'Demo Internal Auditor',
        role: 'Internal Auditor',
        stage: 'Audit Verification Redo',
        action: isSingle ? `Reset ${kpiNo} Achieved / Not Achieved for Redo` : 'Reset All KPIs for Audit Achieved / Not Achieved Redo',
        notes: comments || (isSingle ? `Auditor reset verification on ${kpiNo} to redo assessment.` : 'Auditor reset assessment to redo achieved / not achieved verification.')
      });

      // Update PPLAN
      try {
        const pplanRes = await supabase.from('messages').select('content').eq('id', `pplan_${tenantId}_user@mzansiflow.co.za`).maybeSingle();
        if (pplanRes.data && pplanRes.data.content) {
          const parsedPlan = JSON.parse(pplanRes.data.content);
          parsedPlan.metadata = { 
            ...parsedPlan.metadata, 
            internalAuditStatus: 'Under Review',
            reviewStatus: 'Dispatched to Audit'
          };
          if (Array.isArray(parsedPlan.items)) {
            parsedPlan.items = parsedPlan.items.map((it: any) => {
              if (!isSingle || it.id === kpiId) {
                return { 
                  ...it, 
                  internalAuditStatus: 'Under Review',
                  internalAuditRating: '',
                  internalAuditComment: '' 
                };
              }
              return it;
            });
          }
          await supabase.from('messages').upsert({
            id: `pplan_${tenantId}_user@mzansiflow.co.za`,
            tenant_id: tenantId,
            sender_id: 'ipms_demo_system',
            sender_email: 'audit@mzansiflow.co.za',
            sender_name: 'Demo Internal Auditor',
            content: JSON.stringify(parsedPlan),
            message_type: 'pplan_list',
            created_at: timestamp
          });
        }
      } catch (e) {}

      await supabase.from('messages').upsert({
        id: `ipms_demo_workflow_${tenantId}`,
        tenant_id: tenantId,
        sender_id: 'ipms_demo_system',
        sender_email: 'demo@system.local',
        sender_name: 'IPMS Demo System',
        content: JSON.stringify(state),
        message_type: 'ipms_demo_workflow',
        created_at: timestamp
      });

      return res.json({ 
        success: true, 
        message: isSingle ? `${kpiNo} reset to redo audit achieved / not achieved verification.` : 'Audit assessments reset to redo achieved / not achieved verification.',
        state 
      });
    }

    // 9. Audit Push to Manager Action
    if (action === 'audit_push_to_manager') {
      const isSingle = Boolean(kpiId);
      const targetKpi = isSingle ? state.agreement?.kpis?.find((k: any) => k.id === kpiId) : null;
      const kpiNo = targetKpi?.kpiNo || 'KPI';

      state.status = 'SUBMITTED_TO_MANAGER';
      if (Array.isArray(state.agreement?.kpis)) {
        state.agreement.kpis = state.agreement.kpis.map((k: any) => {
          if (!isSingle || k.id === kpiId) {
            return {
              ...k,
              internalAuditStatus: 'Pushed to Manager',
              reviewStatus: 'Revision Required'
            };
          }
          return k;
        });
      }

      state.workflowHistory.unshift({
        id: `hist_${Date.now()}`,
        timestamp,
        actor: 'audit@mzansiflow.co.za',
        actorName: 'Demo Internal Auditor',
        role: 'Internal Auditor',
        stage: 'Audit Pushed to Line Manager',
        action: isSingle ? `Pushed ${kpiNo} Audit Findings to Line Manager` : 'Pushed Audit Findings to Line Manager',
        notes: comments || 'Internal Audit forwarded findings back to Line Manager for action.'
      });

      // Send notifications to manager and employee
      await addIpmsNotification(supabase, tenantId, {
        senderEmail: 'audit@mzansiflow.co.za',
        senderName: 'Demo Internal Auditor',
        recipientEmail: 'manager@mzansiflow.co.za',
        recipientName: 'Demo Line Manager',
        title: isSingle ? `🛡️ Internal Audit Findings for ${kpiNo} Pushed to Manager` : '🛡️ Internal Audit Findings Pushed to Manager',
        message: `Internal Audit has returned ${isSingle ? `${kpiNo}` : 'the performance plan'} for subordinate user@mzansiflow.co.za back to Line Manager with audit findings.\n\nAuditor Notes: "${comments || 'Please address audit queries.'}"`,
        actionType: 'revision_requested'
      });

      await addIpmsNotification(supabase, tenantId, {
        senderEmail: 'audit@mzansiflow.co.za',
        senderName: 'Demo Internal Auditor',
        recipientEmail: 'user@mzansiflow.co.za',
        recipientName: 'Demo Standard User',
        title: isSingle ? `🛡️ Internal Audit Findings for ${kpiNo} Sent to Line Manager` : '🛡️ Internal Audit Findings Sent to Line Manager',
        message: `Internal Audit reviewed your submission and pushed findings to Line Manager for further review.`,
        actionType: 'revision_requested'
      });

      await supabase.from('messages').upsert({
        id: `ipms_demo_workflow_${tenantId}`,
        tenant_id: tenantId,
        sender_id: 'ipms_demo_system',
        sender_email: 'demo@system.local',
        sender_name: 'IPMS Demo System',
        content: JSON.stringify(state),
        message_type: 'ipms_demo_workflow',
        created_at: timestamp
      });

      return res.json({ 
        success: true, 
        message: isSingle ? `${kpiNo} audit assessment pushed to Line Manager.` : 'Audit assessment pushed to Line Manager.',
        state 
      });
    }

    return res.status(400).json({ error: 'Unrecognized action' });
  } catch (err: any) {
    console.error('Error in handleDemoWorkflowAction:', err);
    res.status(500).json({ error: err.message });
  }
}
