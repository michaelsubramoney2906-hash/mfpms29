import React, { useState, useEffect, useMemo } from 'react';
import { 
  BadgePlus, Plus, Trash2, Save, AlertTriangle, ShieldCheck, HelpCircle, Send, 
  Loader2, FileSpreadsheet, CheckCircle2, ArrowRight, Eye, Download, Upload, 
  Paperclip, X, File, Presentation, Image, FileText, Briefcase, UserCheck, Award,
  Bot, Sparkles, Lock, Shield, Layers, Users, ChevronRight
} from 'lucide-react';
import { JSCAllInOneCompetenciesTable } from './JSCModules';
import { OfficeDocumentViewer, PoeDocument } from './OfficeDocumentViewer';
import { downloadOriginalFile, getMimeTypeForFile } from '../../utils/documentBinaryHelper';
import { OFFICIAL_COMPLIANCE_DIRECTORY, matchStrictOfficial } from '../../data/officialComplianceDirectory';

export type CoreCompetencyScope = 
  | 'community_services' 
  | 'technical_services' 
  | 'cfo' 
  | 'mm' 
  | 'ped' 
  | 'corp' 
  | 'standard';

export interface CoreCompetenciesProps {
  currentUser?: {
    email: string;
    role: string;
    name?: string;
    fullName?: string;
    jobFunction?: string;
    department?: string;
    systemRole?: string;
  };
  activeTenantId?: string;
  onNavigateToSubModule?: (subId?: string) => void;
}

export interface CompetencyRow {
  id: string;
  competency: string;
  basic: string;
  competent: string;
  advanced: string;
  superior: string;
}

export interface CFOCompetencyRow {
  id: string;
  competency: string;
  components: string;
  definition: string;
  weighting: string;
  poeDescription?: string;
  poeFile?: {
    id?: string;
    name: string;
    mimeType: string;
    size?: number | string;
    dataUrl?: string;
    uploadedAt?: string | Date;
    uploadedBy?: string;
  };
}

export interface OfficialAssignment {
  fullName: string;
  email: string;
  jobFunction: string;
  department: string;
  refCode: string;
  roleKey: CoreCompetencyScope;
  roleName: string;
}

/**
 * Intelligent official matcher that links user emails / usernames to their official 
 * designation, department, and assigned Core Competencies module.
 */
export function matchOfficialCoreRole(user?: {
  email?: string;
  name?: string;
  fullName?: string;
  jobFunction?: string;
  department?: string;
  role?: string;
  systemRole?: string;
}): OfficialAssignment {
  const emailRaw = (user?.email || '').trim().toLowerCase();
  const emailPrefix = emailRaw.includes('@') ? emailRaw.split('@')[0] : emailRaw;

  // 1. Directory lookup via verified compliance records
  const directoryMatch = matchStrictOfficial(emailRaw) || 
    OFFICIAL_COMPLIANCE_DIRECTORY.find(o => o.email.toLowerCase() === emailRaw) ||
    (emailPrefix ? OFFICIAL_COMPLIANCE_DIRECTORY.find(o => o.email.toLowerCase().split('@')[0] === emailPrefix) : undefined) ||
    (user?.fullName ? OFFICIAL_COMPLIANCE_DIRECTORY.find(o => o.fullName.toLowerCase() === user.fullName?.toLowerCase()) : undefined);

  const fullName = directoryMatch?.fullName || user?.fullName || user?.name || (emailPrefix ? emailPrefix.replace(/[._-]/g, ' ').toUpperCase() : 'Municipal Official');
  const jobFunction = directoryMatch?.jobFunction || user?.jobFunction || 'Municipal Official';
  const department = directoryMatch?.department || user?.department || 'Nkangala District Municipality';
  const email = directoryMatch?.email || user?.email || (emailPrefix ? `${emailPrefix}@nkangaladm.gov.za` : 'official@nkangaladm.gov.za');
  const refCode = directoryMatch?.refCode || 'SEC57-DIR-01';

  const jobLower = jobFunction.toLowerCase();
  const deptLower = department.toLowerCase();

  // Rule 1: Municipal Manager -> mahlanguml@nkangaladm.gov.za
  if (
    emailRaw === 'mahlanguml@nkangaladm.gov.za' ||
    emailPrefix === 'mahlanguml' ||
    emailRaw.startsWith('mm@') ||
    emailRaw.includes('municipal.manager') ||
    jobLower.includes('municipal manager') ||
    jobLower.includes('accounting officer') ||
    (deptLower.includes('office of the municipal manager') && (jobLower.includes('manager') || jobLower.includes('executive') || jobLower.includes('accounting')))
  ) {
    return {
      fullName,
      email,
      jobFunction,
      department,
      refCode,
      roleKey: 'mm',
      roleName: 'Municipal Managers Core Competencies'
    };
  }

  // Rule 2: Chief Financial Officer -> standeral@nkangaladm.gov.za / cfo
  if (
    emailRaw === 'standeral@nkangaladm.gov.za' ||
    emailPrefix === 'standeral' ||
    emailRaw.startsWith('cfo@') ||
    emailRaw === 'mkharia@nkangaladm.gov.za' ||
    emailPrefix === 'mkharia' ||
    jobLower.includes('chief financial officer') ||
    jobLower.includes('cfo') ||
    (deptLower.includes('financial services') && (jobLower.includes('manager') || jobLower.includes('cfo')))
  ) {
    return {
      fullName,
      email,
      jobFunction,
      department,
      refCode,
      roleKey: 'cfo',
      roleName: 'CFOs Core Competencies'
    };
  }

  // Rule 3: Technical Service -> ralephalengjn@nkangaladm.gov.za / technical / infrastructure
  if (
    emailRaw === 'ralephalengjn@nkangaladm.gov.za' ||
    emailPrefix === 'ralephalengjn' ||
    emailRaw.startsWith('technical@') ||
    emailRaw.startsWith('infrastructure@') ||
    emailRaw === 'mtshweniwm@nkangaladm.gov.za' ||
    emailPrefix === 'mtshweniwm' ||
    emailRaw === 'bembem@nkangaladm.gov.za' ||
    jobLower.includes('infrastructure development') ||
    jobLower.includes('technical services') ||
    jobLower.includes('project management unit') ||
    jobLower.includes('pmu') ||
    jobLower.includes('civil infrastructure') ||
    jobLower.includes('project engineer') ||
    deptLower.includes('infrastructure development') ||
    deptLower.includes('technical services')
  ) {
    return {
      fullName,
      email,
      jobFunction,
      department,
      refCode,
      roleKey: 'technical_services',
      roleName: 'Technical Service Core Competencies'
    };
  }

  // Rule 4: Community Service -> rampedimr@nkangaladm.gov.za / mahlangupt@... / cds / community
  if (
    emailRaw === 'rampedimr@nkangaladm.gov.za' ||
    emailPrefix === 'rampedimr' ||
    emailRaw.startsWith('community@') ||
    emailRaw === 'mahlangupt@nkangaladm.gov.za' ||
    emailPrefix === 'mahlangupt' ||
    emailRaw.startsWith('cds@') ||
    jobLower.includes('community development') ||
    jobLower.includes('social services') ||
    jobLower.includes('community service') ||
    jobLower.includes('emergency services') ||
    jobLower.includes('disaster management') ||
    jobLower.includes('municipal health') ||
    deptLower.includes('community development') ||
    deptLower.includes('social services')
  ) {
    return {
      fullName,
      email,
      jobFunction,
      department,
      refCode,
      roleKey: 'community_services',
      roleName: 'Community Service Core Competencies'
    };
  }

  // Rule 5: Corporate Services -> lengwatetm@nkangaladm.gov.za / mahlangua@nkangaladm.gov.za
  if (
    emailRaw === 'lengwatetm@nkangaladm.gov.za' ||
    emailPrefix === 'lengwatetm' ||
    emailRaw === 'mahlangua@nkangaladm.gov.za' ||
    emailPrefix === 'mahlangua' ||
    emailRaw.startsWith('corporate@') ||
    emailRaw === 'nhlaphomj@nkangaladm.gov.za' ||
    jobLower.includes('corporate services') ||
    jobLower.includes('human resource') ||
    jobLower.includes('hrm') ||
    deptLower.includes('corporate services')
  ) {
    return {
      fullName,
      email,
      jobFunction,
      department,
      refCode,
      roleKey: 'corp',
      roleName: 'Corporate Services Core Competencies'
    };
  }

  // Rule 6: Planning & Economic Development (PED) -> shabanguf@nkangaladm.gov.za / bvumaa@...
  if (
    emailRaw === 'shabanguf@nkangaladm.gov.za' ||
    emailPrefix === 'shabanguf' ||
    emailRaw.startsWith('ped@') ||
    emailRaw === 'bvumaa@nkangaladm.gov.za' ||
    emailPrefix === 'bvumaa' ||
    jobLower.includes('planning & economic development') ||
    jobLower.includes('ped') ||
    jobLower.includes('spatial planning') ||
    jobLower.includes('led') ||
    jobLower.includes('town planner') ||
    deptLower.includes('planning & economic development') ||
    deptLower.includes('ped')
  ) {
    return {
      fullName,
      email,
      jobFunction,
      department,
      refCode,
      roleKey: 'ped',
      roleName: 'PED Core Competencies'
    };
  }

  // Rule 7: Standard Core Competencies for other municipal staff
  return {
    fullName,
    email,
    jobFunction,
    department,
    refCode,
    roleKey: 'standard',
    roleName: 'Standard Core Competencies'
  };
}

export function CoreCompetencies({ currentUser, activeTenantId, onNavigateToSubModule }: CoreCompetenciesProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'cached' | 'saved' | 'saving' | 'error'>('cached');

  // Intelligent Role Matcher: Map user to their designated position & competency tab
  const assignedOfficial = useMemo(() => {
    return matchOfficialCoreRole(currentUser);
  }, [currentUser]);

  // Check if current user is an Administrator or PMS Lead with full district oversight
  const isGlobalOrPmsAdmin = useMemo(() => {
    const emailLower = (currentUser?.email || '').toLowerCase().trim();
    const roleLower = (currentUser?.role || '').toLowerCase();
    const systemRoleLower = (currentUser?.systemRole || '').toLowerCase();
    return (
      emailLower === 'mike@mzansiflow.co.za' ||
      emailLower === 'nsibandenp@nkangaladm.gov.za' ||
      emailLower === 'shabangus@nkangaladm.gov.za' ||
      emailLower === 'admin@mzansiflow.co.za' ||
      roleLower === 'admin' ||
      systemRoleLower === 'global administrator' ||
      systemRoleLower === 'systems administrator'
    );
  }, [currentUser]);

  // Active Tab state: defaulted to user's matched role
  const [activeTab, setActiveTab] = useState<CoreCompetencyScope | 'grid'>(assignedOfficial.roleKey);

  // Enforce strict role isolation: If user is not an administrator, activeTab is ALWAYS locked to their role
  useEffect(() => {
    if (!isGlobalOrPmsAdmin) {
      setActiveTab(assignedOfficial.roleKey);
    }
  }, [assignedOfficial.roleKey, isGlobalOrPmsAdmin]);

  // Pulling state indicators
  const [isPullingFredCommunity, setIsPullingFredCommunity] = useState<boolean>(false);
  const [isPullingFredTechnical, setIsPullingFredTechnical] = useState<boolean>(false);
  const [isPullingFredCfo, setIsPullingFredCfo] = useState<boolean>(false);
  const [isPullingFredMm, setIsPullingFredMm] = useState<boolean>(false);
  const [isPullingFredPed, setIsPullingFredPed] = useState<boolean>(false);
  const [isPullingFredCorp, setIsPullingFredCorp] = useState<boolean>(false);
  const [isPullingFredCore, setIsPullingFredCore] = useState<boolean>(false);

  const [importMessage, setImportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pushingToPA, setPushingToPA] = useState<boolean>(false);
  const [pushSuccessInfo, setPushSuccessInfo] = useState<string | null>(null);

  // 1. Standard Core Competencies Rows
  const [rows, setRows] = useState<CompetencyRow[]>([
    {
      id: 'row-1',
      competency: 'Strategic Leadership',
      basic: 'Minimal ability to guide teams',
      competent: 'Can lead a team effectively',
      advanced: 'Transforms team performance and strategy',
      superior: 'Industry visionary, drives systemic changes'
    },
    {
      id: 'row-2',
      competency: 'Financial Management',
      basic: 'Basic understanding of budgets',
      competent: 'Manages departmental budgets accurately',
      advanced: 'Optimizes large scale financial operations',
      superior: 'Sets strategic financial policies for the organisation'
    }
  ]);

  // 2. Community Service Core Competencies Rows
  const [communityRows, setCommunityRows] = useState<CFOCompetencyRow[]>([
    {
      id: 'cds-row-1',
      competency: 'Strategic Community Development & Social Services Leadership',
      components: 'Vision translation, social services institutional alignment, IDP social cluster integration, public health & safety priorities',
      definition: 'Guides departmental community strategy and aligns social infrastructure and welfare resources to municipal priorities and IDP goals.',
      weighting: '25'
    },
    {
      id: 'cds-row-2',
      competency: 'Emergency Management, Fire & Disaster Risk Governance',
      components: 'Disaster management framework, fire & rescue operational compliance, hazard mitigation, contingency planning',
      definition: 'Enforces statutory disaster risk reduction, emergency response preparedness, and multi-agency public safety protocols across the district.',
      weighting: '25'
    },
    {
      id: 'cds-row-3',
      competency: 'Municipal Health Services & Environmental Amenities Oversight',
      components: 'Environmental health norms, air quality monitoring, waste management oversight, public recreational facilities',
      definition: 'Directs the implementation of municipal health standards, pollution control, and social amenities maintenance for healthy communities.',
      weighting: '20'
    },
    {
      id: 'cds-row-4',
      competency: 'Community Services Financial Prudence & Grant Governance',
      components: 'Departmental budget oversight, grant expenditure controls, equitable share allocation, MFMA compliance',
      definition: 'Manages departmental financial resources and community grants prudently in strict compliance with the MFMA and municipal regulations.',
      weighting: '15'
    },
    {
      id: 'cds-row-5',
      competency: 'Public Participation & Stakeholder Social Cohesion',
      components: 'Citizen engagement forums, traditional leadership consultation, vulnerable groups support, social cohesion programs',
      definition: 'Strengthens grassroots civic engagement, promotes social inclusion, and oversees prompt resolution of community service delivery issues.',
      weighting: '15'
    }
  ]);

  // 3. Technical Service Core Competencies Rows
  const [technicalRows, setTechnicalRows] = useState<CFOCompetencyRow[]>([
    {
      id: 'tech-row-1',
      competency: 'Strategic Infrastructure Planning & Bulk Engineering Governance',
      components: 'Bulk water & sanitation planning, electrical grid capacity, regional roads & stormwater master planning, IDP infrastructure alignment',
      definition: 'Guides strategic engineering design, bulk service networks, and long-term capital infrastructure planning across the municipal district.',
      weighting: '25'
    },
    {
      id: 'tech-row-2',
      competency: 'Capital Project Management Unit (PMU) & MIG Governance',
      components: 'Municipal Infrastructure Grant (MIG) execution, contractor supervision, milestone milestone tracking, GCC/FIDIC contract management',
      definition: 'Directs the PMU to deliver capital projects on schedule, within approved budget limits, and to strict technical specifications.',
      weighting: '25'
    },
    {
      id: 'tech-row-3',
      competency: 'Municipal Asset Management & Technical Maintenance Operations',
      components: 'Comprehensive infrastructure asset register, preventative maintenance schedules, plant & machinery reliability, water loss reduction',
      definition: 'Oversees asset lifecycle management, preventative maintenance protocols, and operational continuity of municipal utility networks.',
      weighting: '20'
    },
    {
      id: 'tech-row-4',
      competency: 'Infrastructure Budgetary Control & Capital Grant Compliance',
      components: 'Capital expenditure (CapEx) monitoring, grant reporting (DoRA), variance tracking, SCM infrastructure procurement alignment',
      definition: 'Enforces strict financial discipline on infrastructure allocations, ensuring zero grant rollbacks and 100% adherence to MFMA and SCM standards.',
      weighting: '15'
    },
    {
      id: 'tech-row-5',
      competency: 'Occupational Health, Safety & Environmental Statutory Compliance',
      components: 'OHS Act enforcement, site safety protocols, environmental authorization (EIA/WULA), technical risk mitigations',
      definition: 'Upholds statutory workplace safety standards, construction compliance, and environmental stewardship across all infrastructure sites.',
      weighting: '15'
    }
  ]);

  // 4. CFO Core Competencies Rows
  const [cfoRows, setCfoRows] = useState<CFOCompetencyRow[]>([
    {
      id: 'cfo-row-1',
      competency: 'Strategic Financial Management',
      components: 'Financial planning, forecasting, policy formulation, capital program management',
      definition: 'Ability to align financial resources with strategic institutional goals and SDF/IDP priorities.',
      weighting: '25'
    },
    {
      id: 'cfo-row-2',
      competency: 'Operational Financial Management',
      components: 'Budget preparation, cash-flow monitoring, expenditure control, in-year reporting',
      definition: 'Directs and monitors all operational budget parameters to maintain solvency and clean audit outcomes.',
      weighting: '25'
    },
    {
      id: 'cfo-row-3',
      competency: 'Governance, Risk & Compliance (GRC)',
      components: 'Internal controls, MFMA compliance, risk registers, audit action plans, Treasury guidelines',
      definition: 'Formulates and enforces compliance with the Municipal Finance Management Act (MFMA) and municipal regulations.',
      weighting: '20'
    },
    {
      id: 'cfo-row-4',
      competency: 'Supply Chain Management (SCM)',
      components: 'Procurement policy, bid committee oversight, demand planning, supplier monitoring',
      definition: 'Guides procurement structures to ensure fair, equitable, transparent, competitive, and cost-effective acquisition.',
      weighting: '15'
    },
    {
      id: 'cfo-row-5',
      competency: 'Financial Reporting & Auditing',
      components: 'Annual Financial Statements (AFS), liaison with Auditor-General, mSCOA alignment',
      definition: 'Directs timeous preparation and submission of accurate statutory financial reports.',
      weighting: '15'
    }
  ]);

  // 5. Municipal Managers (MM) Core Competencies Rows
  const [mmRows, setMmRows] = useState<CFOCompetencyRow[]>([
    {
      id: 'mm-row-1',
      competency: 'Strategic Capability & Institutional Leadership',
      components: 'Executive governance, IDP integration, Council directive execution, organizational strategy',
      definition: 'Provides authoritative administrative leadership, translates political vision into institutional strategy, and coordinates overall municipal administration.',
      weighting: '25'
    },
    {
      id: 'mm-row-2',
      competency: 'Financial Governance & Fiscal Sustainability',
      components: 'Accounting officer responsibilities, clean audit oversight, resource allocation, budget approval',
      definition: 'Fulfills accounting officer responsibilities under the MFMA, ensuring fiscal prudence, financial viability, and transparent public expenditure.',
      weighting: '25'
    },
    {
      id: 'mm-row-3',
      competency: 'Service Delivery & Infrastructure Oversight',
      components: 'SDBIP Top Layer accountability, bulk infrastructure governance, community impact tracking',
      definition: 'Directs institutional service delivery performance to ensure equitable, efficient, and uninterrupted municipal services to all communities.',
      weighting: '20'
    },
    {
      id: 'mm-row-4',
      competency: 'People & Institutional Transformation',
      components: 'Section 56/57 performance contracts, workforce stability, organizational transformation, labor harmony',
      definition: 'Steers organizational development, holds executive directors accountable to statutory scorecards, and fosters an ethical, high-performance culture.',
      weighting: '15'
    },
    {
      id: 'mm-row-5',
      competency: 'Governance, Ethics & Intergovernmental Relations',
      components: 'Council reporting, IGR forums, community consultation, statutory compliance, anti-corruption frameworks',
      definition: 'Champions moral competence, institutional integrity, risk mitigation, and proactive intergovernmental collaboration.',
      weighting: '15'
    }
  ]);

  // 6. PED Core Competencies Rows
  const [pedRows, setPedRows] = useState<CFOCompetencyRow[]>([
    {
      id: 'ped-row-1',
      competency: 'Strategic Land Use & Spatial Planning',
      components: 'Spatial Development Framework (SDF), Land Use Management Scheme (LUMS), GIS Alignment',
      definition: 'Formulates and implements integrated spatial strategies and land-use policies aligned with municipal development goals.',
      weighting: '25'
    },
    {
      id: 'ped-row-2',
      competency: 'Local Economic Development (LED)',
      components: 'LED Strategy, SMME support, job creation programs, investment promotion, tourism coordination',
      definition: 'Designs and executes programs that stimulate sustainable local economic growth, competitiveness, and enterprise support.',
      weighting: '25'
    },
    {
      id: 'ped-row-3',
      competency: 'Integrated Human Settlements',
      components: 'Housing needs assessment, informal settlement upgrading, social housing oversight',
      definition: 'Coordinates housing development strategies to deliver sustainable and well-located human settlements.',
      weighting: '20'
    },
    {
      id: 'ped-row-4',
      competency: 'Project Portfolio Management (PED)',
      components: 'MIG projects, economic infrastructure projects, development progress tracking, CapEx control',
      definition: 'Directs the execution of human settlements, land use, and LED capital projects effectively.',
      weighting: '15'
    },
    {
      id: 'ped-row-5',
      competency: 'Intergovernmental Relations & Funding Alignment',
      components: 'Community consultation, public-private partnerships, MIG & grant fund utilization',
      definition: 'Leverages inter-governmental programs and funding models to implement economic growth policies.',
      weighting: '15'
    }
  ]);

  // 7. Corporate Services Rows
  const [corpRows, setCorpRows] = useState<CFOCompetencyRow[]>([
    {
      id: 'corp-row-1',
      competency: 'Human Capital & Workforce Strategy',
      components: 'Workplace Skills Plan (WSP), Employment Equity, talent acquisition, performance coaching',
      definition: 'Formulates and guides the institutional talent framework and human resources development systems.',
      weighting: '25'
    },
    {
      id: 'corp-row-2',
      competency: 'Labor Relations & Dispute Resolution',
      components: 'Local Labour Forum (LLF), disciplinary hearings, grievance management, SALGBC compliance',
      definition: 'Maintains healthy collective bargaining relations and statutory municipal labor harmony.',
      weighting: '25'
    },
    {
      id: 'corp-row-3',
      competency: 'ICT Governance & Digital Transformation',
      components: 'Corporate ICT governance policy, cybersecurity safeguards, network continuity, digital archiving',
      definition: 'Directs information systems modernization and information security safeguarding.',
      weighting: '20'
    },
    {
      id: 'corp-row-4',
      competency: 'Records & Statutory Document Archives',
      components: 'Registry management, National Archives Act compliance, PAIA compliance, electronic document tracking',
      definition: 'Directs timeous archival preservation and access control to institutional municipal records.',
      weighting: '15'
    },
    {
      id: 'corp-row-5',
      competency: 'Council Support & Auxiliary Administration',
      components: 'Council agendas, mayoral committee secretariat, fleet management, facilities security',
      definition: 'Directs reliable municipal secretariat support and facilities management services.',
      weighting: '15'
    }
  ]);

  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);

  // Weights Calculations
  const totalCommunityWeight = communityRows.reduce((acc, row) => acc + (parseFloat(row.weighting) || 0), 0);
  const totalTechnicalWeight = technicalRows.reduce((acc, row) => acc + (parseFloat(row.weighting) || 0), 0);
  const totalCfoWeight = cfoRows.reduce((acc, row) => acc + (parseFloat(row.weighting) || 0), 0);
  const totalMmWeight = mmRows.reduce((acc, row) => acc + (parseFloat(row.weighting) || 0), 0);
  const totalPedWeight = pedRows.reduce((acc, row) => acc + (parseFloat(row.weighting) || 0), 0);
  const totalCorpWeight = corpRows.reduce((acc, row) => acc + (parseFloat(row.weighting) || 0), 0);

  // Fetch data with backward compatibility
  useEffect(() => {
    if (!activeTenantId) return;
    
    setLoading(true);
    fetch(`/api/tenant/${activeTenantId}/core-competencies?userId=${currentUser?.email || 'default'}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            setRows(data.items);
          }
          // Community Service: prioritize communityServicesItems, fall back to legacy directorItems
          if (data.communityServicesItems && Array.isArray(data.communityServicesItems) && data.communityServicesItems.length > 0) {
            setCommunityRows(data.communityServicesItems);
          } else if (data.directorItems && Array.isArray(data.directorItems) && data.directorItems.length > 0) {
            setCommunityRows(data.directorItems);
          }
          // Technical Service: load technicalServicesItems
          if (data.technicalServicesItems && Array.isArray(data.technicalServicesItems) && data.technicalServicesItems.length > 0) {
            setTechnicalRows(data.technicalServicesItems);
          }
          if (data.cfoItems && Array.isArray(data.cfoItems) && data.cfoItems.length > 0) {
            setCfoRows(data.cfoItems);
          }
          if (data.mmItems && Array.isArray(data.mmItems) && data.mmItems.length > 0) {
            setMmRows(data.mmItems);
          }
          if (data.pedItems && Array.isArray(data.pedItems) && data.pedItems.length > 0) {
            setPedRows(data.pedItems);
          }
          if (data.corporateServicesItems && Array.isArray(data.corporateServicesItems) && data.corporateServicesItems.length > 0) {
            setCorpRows(data.corporateServicesItems);
          }
          setSyncStatus('saved');
        }
      })
      .catch(err => {
        console.error("Error fetching core competencies:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeTenantId, currentUser?.email]);

  // Save to backend
  const handleSave = async () => {
    if (!activeTenantId) return;
    
    setSaving(true);
    setSyncStatus('saving');
    
    try {
      await fetch(`/api/tenant/${activeTenantId}/core-competencies?userId=${currentUser?.email || 'default'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: rows, 
          communityServicesItems: communityRows,
          technicalServicesItems: technicalRows,
          directorItems: communityRows, // backward compatibility
          cfoItems: cfoRows, 
          mmItems: mmRows, 
          pedItems: pedRows, 
          corporateServicesItems: corpRows 
        })
      });
      setSyncStatus('saved');
    } catch (err) {
      console.error("Failed to save core competencies:", err);
      setSyncStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Push to PA Drafting Suite
  const handlePushToDraftingSuite = async () => {
    if (!activeTenantId) return;
    setPushingToPA(true);
    setImportMessage(null);
    setPushSuccessInfo(null);
    try {
      await handleSave();
      const res = await fetch(`/api/tenant/${activeTenantId}/core-competencies/push-to-pa?userId=${currentUser?.email || 'default'}&target=standard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser?.email || 'default',
          target: 'standard',
          items: rows, 
          communityServicesItems: communityRows,
          technicalServicesItems: technicalRows,
          directorItems: communityRows,
          cfoItems: cfoRows, 
          mmItems: mmRows, 
          pedItems: pedRows, 
          corporateServicesItems: corpRows 
        })
      });
      if (!res.ok) throw new Error("Server rejected PA push");
      setSyncStatus('saved');
      setPushSuccessInfo("Successfully pushed standard core competencies to Performance Agreement Drafting Suite!");
      setImportMessage({
        text: '✓ Successfully pushed Standard Core Competencies to Performance Agreement Drafting Suite!',
        type: 'success'
      });
    } catch (err: any) {
      console.error("Failed to push to PA:", err);
      setImportMessage({
        text: `Error pushing to Performance Agreement: ${err.message || 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setPushingToPA(false);
      setTimeout(() => setPushSuccessInfo(null), 8000);
    }
  };

  const handlePushRoleToDraftingSuite = async (
    roleKey: CoreCompetencyScope | 'directors', 
    roleName: string, 
    itemsList: CFOCompetencyRow[]
  ) => {
    if (!activeTenantId) return;
    setPushingToPA(true);
    setImportMessage(null);
    setPushSuccessInfo(null);

    try {
      await handleSave();
      const pushRes = await fetch(`/api/tenant/${activeTenantId}/core-competencies/push-to-pa?userId=${currentUser?.email || 'default'}&target=${roleKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser?.email || 'default',
          target: roleKey,
          items: rows, 
          communityServicesItems: communityRows,
          technicalServicesItems: technicalRows,
          directorItems: communityRows,
          cfoItems: cfoRows, 
          mmItems: mmRows, 
          pedItems: pedRows, 
          corporateServicesItems: corpRows 
        })
      });

      if (!pushRes.ok) throw new Error(`Push to Performance Agreement (${roleName}) rejected by server.`);

      setSyncStatus('saved');
      setPushSuccessInfo(`Successfully pushed all ${itemsList.length} ${roleName} Core Competencies into the Performance Agreement below Point 6.6!`);
      setImportMessage({
        text: `✓ Successfully pushed all ${itemsList.length} ${roleName} Core Competencies into the Performance Agreement below Point 6.6!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error(`Failed to push ${roleName} Core Competencies:`, err);
      setImportMessage({
        text: `Error pushing to Performance Agreement: ${err.message || 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setPushingToPA(false);
      setTimeout(() => setPushSuccessInfo(null), 8000);
    }
  };

  // PoE Handling
  const handlePoeDescriptionChange = (scope: CoreCompetencyScope, rowId: string, desc: string) => {
    if (scope === 'community_services') {
      setCommunityRows(prev => prev.map(r => r.id === rowId ? { ...r, poeDescription: desc } : r));
    } else if (scope === 'technical_services') {
      setTechnicalRows(prev => prev.map(r => r.id === rowId ? { ...r, poeDescription: desc } : r));
    } else if (scope === 'cfo') {
      setCfoRows(prev => prev.map(r => r.id === rowId ? { ...r, poeDescription: desc } : r));
    } else if (scope === 'mm') {
      setMmRows(prev => prev.map(r => r.id === rowId ? { ...r, poeDescription: desc } : r));
    } else if (scope === 'ped') {
      setPedRows(prev => prev.map(r => r.id === rowId ? { ...r, poeDescription: desc } : r));
    } else if (scope === 'corp') {
      setCorpRows(prev => prev.map(r => r.id === rowId ? { ...r, poeDescription: desc } : r));
    }
    setSyncStatus('cached');
  };

  const handlePoeFileUpload = (scope: CoreCompetencyScope, rowId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const poeFile = {
        id: `poe-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        mimeType: file.type || getMimeTypeForFile(file.name),
        size: file.size,
        dataUrl: dataUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.name || currentUser?.email || 'Official'
      };

      if (scope === 'community_services') {
        setCommunityRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile } : r));
      } else if (scope === 'technical_services') {
        setTechnicalRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile } : r));
      } else if (scope === 'cfo') {
        setCfoRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile } : r));
      } else if (scope === 'mm') {
        setMmRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile } : r));
      } else if (scope === 'ped') {
        setPedRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile } : r));
      } else if (scope === 'corp') {
        setCorpRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile } : r));
      }
      setSyncStatus('cached');
    };
    reader.readAsDataURL(file);
  };

  const handlePoeFileRemove = (scope: CoreCompetencyScope, rowId: string) => {
    if (scope === 'community_services') {
      setCommunityRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile: undefined } : r));
    } else if (scope === 'technical_services') {
      setTechnicalRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile: undefined } : r));
    } else if (scope === 'cfo') {
      setCfoRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile: undefined } : r));
    } else if (scope === 'mm') {
      setMmRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile: undefined } : r));
    } else if (scope === 'ped') {
      setPedRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile: undefined } : r));
    } else if (scope === 'corp') {
      setCorpRows(prev => prev.map(r => r.id === rowId ? { ...r, poeFile: undefined } : r));
    }
    setSyncStatus('cached');
  };

  const handlePoeView = (row: CFOCompetencyRow, scopeName: string) => {
    if (!row.poeFile) return;
    setPreviewDoc({
      id: row.poeFile.id,
      name: row.poeFile.name,
      mimeType: row.poeFile.mimeType,
      size: typeof row.poeFile.size === 'number' ? row.poeFile.size : undefined,
      dataUrl: row.poeFile.dataUrl,
      kpiName: `${row.competency} (${scopeName} Core Competency)`,
      quarter: 'Portfolio of Evidence'
    });
  };

  const handlePoeDownload = async (row: CFOCompetencyRow, scopeName: string) => {
    if (!row.poeFile) return;
    await downloadOriginalFile(row.poeFile.name, row.poeFile.dataUrl, {
      mimeType: row.poeFile.mimeType,
      kpiName: `${row.competency} (${scopeName})`,
      quarter: 'Annual Evidence'
    });
  };

  const getPoeFileIcon = (mimeType?: string, name?: string) => {
    const ext = (name || '').split('.').pop()?.toLowerCase() || '';
    if (['ppt', 'pptx', 'pps'].includes(ext) || (mimeType && mimeType.includes('presentation'))) {
      return <Presentation className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
    }
    if ((mimeType && mimeType.startsWith('image/')) || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      return <Image className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || (mimeType && (mimeType.includes('spreadsheet') || mimeType.includes('excel')))) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    }
    if (['doc', 'docx', 'rtf', 'txt'].includes(ext) || (mimeType && (mimeType.includes('word') || mimeType.includes('text')))) {
      return <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  };

  // Cell Editing
  const handleStandardCellEdit = (rowId: string, field: keyof CompetencyRow, value: string) => {
    setRows(prevRows => prevRows.map(row => row.id === rowId ? { ...row, [field]: value } : row));
    setSyncStatus('cached');
  };

  const handleRoleCellEdit = (scope: CoreCompetencyScope, rowId: string, field: keyof CFOCompetencyRow, value: string) => {
    const updater = (prev: CFOCompetencyRow[]) => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r);
    if (scope === 'community_services') setCommunityRows(updater);
    else if (scope === 'technical_services') setTechnicalRows(updater);
    else if (scope === 'cfo') setCfoRows(updater);
    else if (scope === 'mm') setMmRows(updater);
    else if (scope === 'ped') setPedRows(updater);
    else if (scope === 'corp') setCorpRows(updater);
    setSyncStatus('cached');
  };

  // Row Deletion
  const handleDeleteRow = (rowId: string) => {
    setRows(prevRows => prevRows.filter(row => row.id !== rowId));
    setSyncStatus('cached');
  };

  const handleDeleteRoleRow = (scope: CoreCompetencyScope, rowId: string) => {
    const filterer = (prev: CFOCompetencyRow[]) => prev.filter(r => r.id !== rowId);
    if (scope === 'community_services') setCommunityRows(filterer);
    else if (scope === 'technical_services') setTechnicalRows(filterer);
    else if (scope === 'cfo') setCfoRows(filterer);
    else if (scope === 'mm') setMmRows(filterer);
    else if (scope === 'ped') setPedRows(filterer);
    else if (scope === 'corp') setCorpRows(filterer);
    setSyncStatus('cached');
  };

  // Adding Rows
  const handleAddStandardRow = () => {
    const newId = `row-${Date.now()}`;
    setRows(prev => [...prev, { id: newId, competency: '', basic: '', competent: '', advanced: '', superior: '' }]);
    setSyncStatus('cached');
  };

  const handleAddRoleRow = (scope: CoreCompetencyScope) => {
    const newId = `${scope}-row-${Date.now()}`;
    const newRow: CFOCompetencyRow = { id: newId, competency: '', components: '', definition: '', weighting: '0' };
    if (scope === 'community_services') setCommunityRows(prev => [...prev, newRow]);
    else if (scope === 'technical_services') setTechnicalRows(prev => [...prev, newRow]);
    else if (scope === 'cfo') setCfoRows(prev => [...prev, newRow]);
    else if (scope === 'mm') setMmRows(prev => [...prev, newRow]);
    else if (scope === 'ped') setPedRows(prev => [...prev, newRow]);
    else if (scope === 'corp') setCorpRows(prev => [...prev, newRow]);
    setSyncStatus('cached');
  };

  const handleAddRowClick = () => {
    if (activeTab === 'standard') {
      handleAddStandardRow();
    } else if (activeTab === 'grid') {
      // no-op
    } else {
      handleAddRoleRow(activeTab);
    }
  };

  // Fred Extraction Pulls
  const handlePullFredExtraction = async (
    engineType: string,
    jsonKey: string,
    roleName: string,
    setter: React.Dispatch<React.SetStateAction<CFOCompetencyRow[]>>,
    setLoadingState: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!activeTenantId) return;
    setLoadingState(true);
    setImportMessage(null);
    try {
      let response = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/${engineType}?userId=${currentUser?.email || 'default'}`);
      let json = response.ok ? await response.json() : null;

      // Fallback to core_competencies_engine if role-specific not found
      if (!json || !json.data) {
        const fallbackRes = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${currentUser?.email || 'default'}`);
        if (fallbackRes.ok) {
          json = await fallbackRes.json();
        }
      }

      if (json && json.success && json.data) {
        const extractedList = 
          json.data[jsonKey] || 
          json.data.community_services ||
          json.data.technical_services ||
          json.data.directors ||
          json.data.competencies || 
          json.data.items || 
          json.data.Competencies || 
          json.items || 
          (Array.isArray(json.data) ? json.data : []);

        if (Array.isArray(extractedList) && extractedList.length > 0) {
          const mappedRows: CFOCompetencyRow[] = extractedList.map((comp: any, idx: number) => ({
            id: `${engineType}-row-${idx}-${Date.now()}`,
            competency: comp.competency || comp.competencies || comp.Competency_Name || comp.name || '',
            components: comp.components || comp.Components || comp.operational_components || '',
            definition: comp.definition || comp['compentency definition'] || comp.Definition || comp.description || '',
            weighting: String(comp.weighting || comp.Weighting || comp.weight || '20')
          }));

          setter(mappedRows);
          setSyncStatus('cached');
          setImportMessage({
            text: `Successfully imported ${mappedRows.length} ${roleName} core competencies from Fred Extraction! Click "Save Configuration" to persist.`,
            type: 'success'
          });
          try {
            await fetch(`/api/tenant/${activeTenantId}/fred-extraction/${engineType}?userId=${currentUser?.email || 'default'}`, { method: 'DELETE' });
          } catch (e) {}
        } else {
          setImportMessage({
            text: `No competencies found in the saved ${roleName} extraction. Upload and process a document in Fred Extraction Agent first.`,
            type: 'error'
          });
        }
      } else {
        setImportMessage({
          text: `No extraction found for ${roleName}. Open Fred Extractor to process a competencies document.`,
          type: 'error'
        });
      }
    } catch (err: any) {
      console.error(`Failed to pull ${roleName} extraction:`, err);
      setImportMessage({
        text: `Exception occurred while pulling ${roleName} extraction data.`,
        type: 'error'
      });
    } finally {
      setLoadingState(false);
      setTimeout(() => setImportMessage(null), 7000);
    }
  };

  const handlePullFredCore = async () => {
    if (!activeTenantId) return;
    setIsPullingFredCore(true);
    setImportMessage(null);
    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${currentUser?.email || 'default'}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.Core_Competencies) {
          const mappedRows = json.data.Core_Competencies.map((comp: any, idx: number) => ({
            id: `core-row-ext-${idx}-${Date.now()}`,
            competency: comp.Competency_Name || '',
            basic: comp.Definition ? `Demonstrates basic understanding of ${comp.Competency_Name || 'this competency'}.` : 'Minimal capability',
            competent: comp.Definition || 'Demonstrates competent level performance in this domain.',
            advanced: comp.Definition ? `Advanced mastery of ${comp.Competency_Name || 'this competency'}: ${comp.Definition}` : 'Transforms organizational performance',
            superior: comp.Definition ? `Superior strategic and systems leadership of ${comp.Competency_Name || 'this competency'}.` : 'Industry visionary'
          }));
          if (mappedRows.length > 0) {
            setRows(mappedRows);
            setSyncStatus('cached');
            setImportMessage({
              text: `Successfully imported ${mappedRows.length} standard core competencies from Fred Core Extraction! Click "Save Configuration" to persist.`,
              type: 'success'
            });
            try {
              await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${currentUser?.email || 'default'}`, { method: 'DELETE' });
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Failed to pull standard core competencies extraction:", err);
    } finally {
      setIsPullingFredCore(false);
      setTimeout(() => setImportMessage(null), 7000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent pr-1"></div>
          <p className="font-medium text-slate-500">Loading Core Competencies API Pipeline...</p>
        </div>
      </div>
    );
  }

  // Active role config helper
  const getActiveRoleDetails = () => {
    switch (activeTab) {
      case 'community_services':
        return { 
          scope: 'community_services' as const, 
          roleName: 'Community Service', 
          title: 'Community Service Core Competencies Grid', 
          rows: communityRows, 
          totalWeight: totalCommunityWeight,
          color: 'indigo',
          isPulling: isPullingFredCommunity,
          onPush: () => handlePushRoleToDraftingSuite('community_services', 'Community Service', communityRows),
          onPullFred: () => handlePullFredExtraction('community_services_competencies_engine', 'Community_Services_Core_Competencies', 'Community Service', setCommunityRows, setIsPullingFredCommunity)
        };
      case 'technical_services':
        return { 
          scope: 'technical_services' as const, 
          roleName: 'Technical Service', 
          title: 'Technical Service Core Competencies Grid', 
          rows: technicalRows, 
          totalWeight: totalTechnicalWeight,
          color: 'teal',
          isPulling: isPullingFredTechnical,
          onPush: () => handlePushRoleToDraftingSuite('technical_services', 'Technical Service', technicalRows),
          onPullFred: () => handlePullFredExtraction('technical_services_competencies_engine', 'Technical_Services_Core_Competencies', 'Technical Service', setTechnicalRows, setIsPullingFredTechnical)
        };
      case 'cfo':
        return { 
          scope: 'cfo' as const, 
          roleName: 'CFO', 
          title: 'Chief Financial Officer (CFO) Competency Weighting Grid', 
          rows: cfoRows, 
          totalWeight: totalCfoWeight,
          color: 'blue',
          isPulling: isPullingFredCfo,
          onPush: () => handlePushRoleToDraftingSuite('cfo', 'CFO', cfoRows),
          onPullFred: () => handlePullFredExtraction('cfo_competencies_engine', 'CFO_Core_Competencies', 'CFO', setCfoRows, setIsPullingFredCfo)
        };
      case 'mm':
        return { 
          scope: 'mm' as const, 
          roleName: 'Municipal Manager', 
          title: 'Municipal Manager (MM) Competency Weighting Grid', 
          rows: mmRows, 
          totalWeight: totalMmWeight,
          color: 'emerald',
          isPulling: isPullingFredMm,
          onPush: () => handlePushRoleToDraftingSuite('mm', 'Municipal Manager', mmRows),
          onPullFred: () => handlePullFredExtraction('mm_competencies_engine', 'MM_Core_Competencies', 'Municipal Manager', setMmRows, setIsPullingFredMm)
        };
      case 'ped':
        return { 
          scope: 'ped' as const, 
          roleName: 'PED', 
          title: 'PED Specific Competency Weighting Grid', 
          rows: pedRows, 
          totalWeight: totalPedWeight,
          color: 'amber',
          isPulling: isPullingFredPed,
          onPush: () => handlePushRoleToDraftingSuite('ped', 'PED', pedRows),
          onPullFred: () => handlePullFredExtraction('ped_competencies_engine', 'PED_Core_Competencies', 'PED', setPedRows, setIsPullingFredPed)
        };
      case 'corp':
        return { 
          scope: 'corp' as const, 
          roleName: 'Corporate Services', 
          title: 'Corporate Services Competency Grid', 
          rows: corpRows, 
          totalWeight: totalCorpWeight,
          color: 'pink',
          isPulling: isPullingFredCorp,
          onPush: () => handlePushRoleToDraftingSuite('corp', 'Corporate Services', corpRows),
          onPullFred: () => handlePullFredExtraction('corporate_services_competencies_engine', 'Corporate_Services_Core_Competencies', 'Corporate Services', setCorpRows, setIsPullingFredCorp)
        };
      default:
        return null;
    }
  };

  const activeRole = getActiveRoleDetails();

  // Define tab navigation list based on Role Isolation:
  // Non-admin users strictly see ONLY their assigned competency tab!
  const availableTabsList = [
    {
      id: 'community_services' as const,
      label: 'Community Service Core Competencies',
      badge: 'COMMUNITY SERVICE',
      activeColor: 'bg-indigo-600 text-white',
      badgeActiveColor: 'bg-indigo-800 text-indigo-100',
      badgeInactiveColor: 'bg-slate-200 text-slate-700'
    },
    {
      id: 'technical_services' as const,
      label: 'Technical Service Core Competencies',
      badge: 'TECHNICAL SERVICE',
      activeColor: 'bg-teal-600 text-white',
      badgeActiveColor: 'bg-teal-800 text-teal-100',
      badgeInactiveColor: 'bg-slate-200 text-slate-700'
    },
    {
      id: 'cfo' as const,
      label: 'CFOs Core Competencies',
      badge: 'CFO',
      activeColor: 'bg-blue-600 text-white',
      badgeActiveColor: 'bg-blue-800 text-blue-100',
      badgeInactiveColor: 'bg-slate-200 text-slate-700'
    },
    {
      id: 'mm' as const,
      label: 'Municipal Managers Core Competencies',
      badge: 'MM',
      activeColor: 'bg-emerald-700 text-white',
      badgeActiveColor: 'bg-emerald-900 text-emerald-100',
      badgeInactiveColor: 'bg-slate-200 text-slate-700'
    },
    {
      id: 'ped' as const,
      label: 'Core Competencies (PED)',
      badge: 'PED',
      activeColor: 'bg-amber-600 text-white',
      badgeActiveColor: 'bg-amber-800 text-amber-100',
      badgeInactiveColor: 'bg-slate-200 text-slate-700'
    },
    {
      id: 'corp' as const,
      label: 'Corporate Services',
      badge: 'CORP',
      activeColor: 'bg-pink-600 text-white',
      badgeActiveColor: 'bg-pink-800 text-pink-100',
      badgeInactiveColor: 'bg-slate-200 text-slate-700'
    },
    {
      id: 'standard' as const,
      label: 'Standard Core Competencies',
      badge: 'STANDARD',
      activeColor: 'bg-slate-800 text-white font-black',
      badgeActiveColor: 'bg-slate-900 text-slate-200',
      badgeInactiveColor: 'bg-slate-200 text-slate-700'
    }
  ];

  // Strictly filter tabs: If user is not global admin/PMS lead, show ONLY their single matched tab
  const displayTabs = isGlobalOrPmsAdmin 
    ? availableTabsList 
    : availableTabsList.filter(t => t.id === assignedOfficial.roleKey);

  return (
    <div className="h-full flex flex-col bg-slate-50/50 select-text">
      {/* Official Identity & Strict Role-Isolation Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-white shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center text-white font-black shadow-inner">
            <UserCheck className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-tight">{assignedOfficial.fullName}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-mono">
                {assignedOfficial.refCode}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300 uppercase">
                {assignedOfficial.roleName}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2 font-medium">
              <span>Position: <strong className="text-slate-200">{assignedOfficial.jobFunction}</strong></span>
              <span>•</span>
              <span>Department: <strong className="text-slate-200">{assignedOfficial.department}</strong></span>
              <span>•</span>
              <span>Official Email: <strong className="text-emerald-300 font-mono">{assignedOfficial.email}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Strict Role Isolation Status Indicator */}
          {!isGlobalOrPmsAdmin ? (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-600/60 text-xs text-emerald-300 flex items-center gap-2 shadow-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">Strict Role Isolation Active (Private Tab)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-amber-950/70 border border-amber-600/60 text-xs text-amber-300 flex items-center gap-2 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">District Administrator Oversight Mode</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Header bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <BadgePlus className="w-6 h-6 text-white" />
            </div>
            Core Competencies Module
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Role-matched institutional core competency matrix for Municipal Manager, CFO, Community Service, Technical Service, PED & Corporate Services.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {syncStatus === 'cached' && <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Unsaved Changes</span>}
          {syncStatus === 'saving' && <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5"><div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/> Syncing...</span>}
          {syncStatus === 'saved' && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">✓ Synced to Cloud</span>}
          
          {activeTab === 'standard' && (
            <button 
              id="btn-push-standard-competencies-top-bar"
              type="button"
              onClick={handlePushToDraftingSuite}
              disabled={pushingToPA || rows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50"
              title="Push entire standard core competencies table into Performance Agreement Drafting Suite in Individual PMS"
            >
              {pushingToPA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Push Table to Drafting Suite</span>
            </button>
          )}

          {activeRole && (
            <button 
              id={`btn-push-${activeRole.scope}-competencies-top-bar`}
              type="button"
              onClick={activeRole.onPush}
              disabled={pushingToPA || activeRole.rows.length === 0}
              className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50 ${
                activeRole.color === 'indigo' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700' :
                activeRole.color === 'teal' ? 'bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800' :
                activeRole.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' :
                activeRole.color === 'emerald' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800' :
                activeRole.color === 'amber' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700' :
                'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700'
              }`}
              title={`Push the entire ${activeRole.roleName} Core Competencies table into the Performance Agreement below Point 6.6`}
            >
              {pushingToPA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Push Table to Performance Agreement (Point 6.6)</span>
            </button>
          )}

          <button 
            onClick={handleAddRowClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>

          {onNavigateToSubModule && (
            <button
              id="btn-launch-fred-extractor-engine"
              type="button"
              onClick={() => onNavigateToSubModule('fred-ccomp')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-sm font-black rounded-lg shadow-sm transition cursor-pointer"
              title="Open completely separate Fred Core Competencies Extractor and Mapping Engine"
            >
              <Bot className="w-4 h-4 text-rose-200" />
              <span>Fred Competencies Engine</span>
            </button>
          )}

          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>

      {/* Tabs navigation with Strict User Isolation */}
      <div className="bg-slate-100 border-b border-slate-200 px-8 py-2.5 flex items-center justify-between select-none overflow-x-auto">
        <div className="flex gap-2 min-w-max items-center">
          {displayTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? `${tab.activeColor} shadow-sm font-black`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${
                activeTab === tab.id ? tab.badgeActiveColor : tab.badgeInactiveColor
              }`}>
                {tab.badge}
              </span>
              {tab.label}
            </button>
          ))}

          {/* Quarterly Reviews Grid available to authorized oversight / evaluation */}
          {(isGlobalOrPmsAdmin || assignedOfficial.roleKey === 'standard') && (
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'grid'
                  ? 'bg-purple-700 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${activeTab === 'grid' ? 'bg-purple-900 text-purple-100' : 'bg-slate-200 text-slate-700'}`}>GRID</span>
              Quarterly Reviews Grid (Self, Auditor & DPMC)
            </button>
          )}
        </div>

        {activeRole && (
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {activeRole.totalWeight === 100 ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Total Weight: 100% (Balanced)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Weights Total: {activeRole.totalWeight}% (Must equal 100%)
              </span>
            )}
          </div>
        )}
      </div>

      {importMessage && (
        <div className={`mx-8 mt-4 p-4 rounded-xl border text-xs font-bold flex items-center justify-between ${
          importMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{importMessage.text}</span>
          <button onClick={() => setImportMessage(null)} className="text-slate-500 hover:text-slate-800 font-extrabold text-sm px-2">&times;</button>
        </div>
      )}

      {pushSuccessInfo && (
        <div className="mx-8 mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pushSuccessInfo}</span>
        </div>
      )}

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'grid' ? (
          <JSCAllInOneCompetenciesTable
            currentUser={{ email: currentUser?.email || 'user@system.local' }}
            activeTenantId={activeTenantId || 'default'}
          />
        ) : activeTab === 'standard' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  Competency Levels & Scaling Criteria (Standard Core Competencies)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Defined standard core competencies across Basic, Competent, Advanced, and Superior scaling criteria.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePullFredCore}
                  disabled={isPullingFredCore}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                  title="Import from Fred Core Competencies Extraction"
                >
                  {isPullingFredCore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Import Fred Core Extraction</span>
                </button>
                <button
                  type="button"
                  onClick={handlePushToDraftingSuite}
                  disabled={pushingToPA || rows.length === 0}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                  title="Push the entire table directly into Performance Agreement Drafting Suite in Individual PMS"
                >
                  {pushingToPA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Push Entire Table to Drafting Suite</span>
                </button>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-4 border-b border-r border-slate-200 w-1/5">Competency</th>
                  <th className="p-4 border-b border-r border-slate-200 w-1/5">Basic</th>
                  <th className="p-4 border-b border-r border-slate-200 w-1/5">Competent</th>
                  <th className="p-4 border-b border-r border-slate-200 w-1/5">Advanced</th>
                  <th className="p-4 border-b border-r border-slate-200 w-1/5">Superior</th>
                  <th className="p-4 border-b border-slate-200 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition group">
                    <td className="p-3 border-r border-slate-100 align-top">
                      <input 
                        type="text" 
                        value={row.competency} 
                        onChange={(e) => handleStandardCellEdit(row.id, 'competency', e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none transition-all"
                        placeholder="Enter competency name..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 align-top">
                      <textarea 
                        value={row.basic} 
                        onChange={(e) => handleStandardCellEdit(row.id, 'basic', e.target.value)}
                        className="w-full text-xs font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Basic criteria..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 align-top">
                      <textarea 
                        value={row.competent} 
                        onChange={(e) => handleStandardCellEdit(row.id, 'competent', e.target.value)}
                        className="w-full text-xs font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Competent criteria..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 align-top">
                      <textarea 
                        value={row.advanced} 
                        onChange={(e) => handleStandardCellEdit(row.id, 'advanced', e.target.value)}
                        className="w-full text-xs font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Advanced criteria..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 align-top">
                      <textarea 
                        value={row.superior} 
                        onChange={(e) => handleStandardCellEdit(row.id, 'superior', e.target.value)}
                        className="w-full text-xs font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Superior criteria..."
                      />
                    </td>
                    <td className="p-3 align-middle text-center">
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition opacity-0 group-hover:opacity-100 mx-auto"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center bg-slate-50 border-b-2 border-dashed border-slate-300">
                      <div className="flex flex-col items-center justify-center space-y-2">
                         <BadgePlus className="w-8 h-8 text-slate-400" />
                         <p className="text-sm font-bold text-slate-600">No core competencies defined.</p>
                         <p className="text-xs font-medium text-slate-500 w-3/4">Click "Add Row" or "Import Fred Core Extraction" to build your institutional core competency evaluation matrix.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeRole ? (
          /* Role Competency Table: Community Service, Technical Service, CFO, Municipal Manager, PED, Corporate Services */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className={`w-5 h-5 ${
                    activeRole.color === 'indigo' ? 'text-indigo-600' :
                    activeRole.color === 'teal' ? 'text-teal-600' :
                    activeRole.color === 'blue' ? 'text-blue-600' :
                    activeRole.color === 'emerald' ? 'text-emerald-600' :
                    activeRole.color === 'amber' ? 'text-amber-600' : 'text-pink-600'
                  }`} />
                  {activeRole.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned core competency requirements, operational components, statutory definitions, weightings, and Portfolio of Evidence.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                  activeRole.color === 'indigo' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                  activeRole.color === 'teal' ? 'bg-teal-50 border-teal-200 text-teal-800' :
                  activeRole.color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                  activeRole.color === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  activeRole.color === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                  'bg-pink-50 border-pink-200 text-pink-800'
                }`}>
                  {activeRole.rows.length} {activeRole.roleName} Competencies Active
                </span>

                <button
                  type="button"
                  onClick={activeRole.onPullFred}
                  disabled={activeRole.isPulling}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                  title={`Import ${activeRole.roleName} competencies from Fred Cognitive Extraction Agent`}
                >
                  {activeRole.isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Import {activeRole.roleName} Fred Extraction</span>
                </button>

                {onNavigateToSubModule && (
                  <button
                    type="button"
                    onClick={() => onNavigateToSubModule('fred-ccomp')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
                    title={`Open Fred Extractor Engine to process and map ${activeRole.roleName} competencies`}
                  >
                    <Bot className="w-3.5 h-3.5 text-rose-100" />
                    <span>Open Fred Extractor</span>
                  </button>
                )}

                <button
                  id={`btn-push-entire-table-${activeRole.scope}-competencies`}
                  type="button"
                  onClick={activeRole.onPush}
                  disabled={pushingToPA || activeRole.rows.length === 0}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-white text-xs font-black rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 ${
                    activeRole.color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' :
                    activeRole.color === 'teal' ? 'bg-teal-600 hover:bg-teal-700' :
                    activeRole.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    activeRole.color === 'emerald' ? 'bg-emerald-700 hover:bg-emerald-800' :
                    activeRole.color === 'amber' ? 'bg-amber-600 hover:bg-amber-700' :
                    'bg-pink-600 hover:bg-pink-700'
                  }`}
                  title={`Push entire ${activeRole.roleName} table directly into Performance Agreement Drafting Suite`}
                >
                  {pushingToPA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Push Entire Table to Performance Agreement</span>
                </button>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-4 border-b border-r border-slate-200">Competencies</th>
                  <th className="p-4 border-b border-r border-slate-200">Components</th>
                  <th className="p-4 border-b border-r border-slate-200">Competency Definition</th>
                  <th className="p-4 border-b border-r border-slate-200 w-32 text-center">Weighting %</th>
                  <th className="p-4 border-b border-r border-slate-200 min-w-[280px]">
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Portfolio of Evidence (PoE)</span>
                    </div>
                  </th>
                  <th className="p-4 border-b border-slate-200 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeRole.rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition group">
                    <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4">
                      <textarea 
                        value={row.competency} 
                        onChange={(e) => handleRoleCellEdit(activeRole.scope, row.id, 'competency', e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                        placeholder={`Enter ${activeRole.roleName} competency...`}
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4 bg-slate-50/20 focus-within:bg-slate-50/50 transition">
                      <textarea 
                        value={row.components} 
                        onChange={(e) => handleRoleCellEdit(activeRole.scope, row.id, 'components', e.target.value)}
                        className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                        placeholder="Define components..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/4 bg-slate-50/20 focus-within:bg-slate-50/50 transition">
                      <textarea 
                        value={row.definition} 
                        onChange={(e) => handleRoleCellEdit(activeRole.scope, row.id, 'definition', e.target.value)}
                        className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1.5 outline-none resize-y min-h-[70px] transition-all"
                        placeholder="Define competency..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 align-top text-center w-28 bg-indigo-50/10 focus-within:bg-indigo-50/30 transition">
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 max-w-[90px] mx-auto focus-within:ring-2 focus-within:ring-indigo-500">
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={row.weighting} 
                          onChange={(e) => handleRoleCellEdit(activeRole.scope, row.id, 'weighting', e.target.value)}
                          className="w-full text-sm font-bold text-slate-900 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                        <span className="text-slate-400 font-bold text-xs">%</span>
                      </div>
                    </td>

                    {/* PoE Column */}
                    <td className="p-3 border-r border-slate-100 align-top bg-slate-50/20 min-w-[280px]">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={row.poeDescription || ''}
                          onChange={(e) => handlePoeDescriptionChange(activeRole.scope, row.id, e.target.value)}
                          placeholder="Enter PoE description / evidence notes..."
                          className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 outline-none transition"
                        />

                        {row.poeFile ? (
                          <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg shadow-2xs">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {getPoeFileIcon(row.poeFile.mimeType, row.poeFile.name)}
                              <span className="font-bold text-xs text-slate-700 truncate block max-w-[130px]" title={row.poeFile.name}>
                                {row.poeFile.name}
                              </span>
                              <span className="text-[9px] font-mono font-bold uppercase text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                {row.poeFile.name.split('.').pop()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handlePoeView(row, activeRole.roleName)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                                title="View PoE Document (Word, Excel, PowerPoint, Notepad, PDF, Images)"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePoeDownload(row, activeRole.roleName)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                                title="Download in Exact Original File Format"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePoeFileRemove(activeRole.scope, row.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                title="Remove File"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-lg cursor-pointer transition text-xs font-bold text-slate-600">
                              <Upload className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Upload PoE File</span>
                              <input
                                type="file"
                                className="hidden"
                                accept=".doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.pdf,.txt,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePoeFileUpload(activeRole.scope, row.id, file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <span className="text-[8.5px] text-slate-400 block text-center mt-1">
                              Word, Excel, PowerPoint, Notepad, PDF, PNG, JPG
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3 align-middle text-center">
                      <button 
                        onClick={() => handleDeleteRoleRow(activeRole.scope, row.id)}
                        className="p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition opacity-0 group-hover:opacity-100 mx-auto cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {activeRole.rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center bg-slate-50 border-b-2 border-dashed border-slate-300">
                      <div className="flex flex-col items-center justify-center space-y-2">
                         <BadgePlus className="w-8 h-8 text-slate-400" />
                         <p className="text-sm font-bold text-slate-600">No {activeRole.roleName} core competencies defined.</p>
                         <p className="text-xs font-medium text-slate-500 w-3/4">Click "Add Row" or "Import {activeRole.roleName} Fred Extraction" to build your {activeRole.roleName} specific core competency and weighting matrix.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Table Footer with Total Weight */}
            {activeRole.rows.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{activeRole.roleName} Weight Verification:</span>
                  {activeRole.totalWeight === 100 ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Total Weight: 100% (Balanced)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full border border-amber-200 animate-pulse">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Total Weight: {activeRole.totalWeight}% (Must equal 100%)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id={`btn-push-entire-table-${activeRole.scope}-bottom`}
                    type="button"
                    onClick={activeRole.onPush}
                    disabled={pushingToPA || activeRole.rows.length === 0}
                    className={`flex items-center gap-2 px-5 py-2.5 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer disabled:opacity-50 ${
                      activeRole.color === 'indigo' ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800' :
                      activeRole.color === 'teal' ? 'bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-800 hover:from-teal-700 hover:to-emerald-900' :
                      activeRole.color === 'blue' ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 hover:from-blue-700 hover:to-cyan-800' :
                      activeRole.color === 'emerald' ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900' :
                      activeRole.color === 'amber' ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-700 hover:to-orange-800' :
                      'bg-gradient-to-r from-pink-600 via-pink-700 to-rose-700 hover:from-pink-700 hover:to-rose-800'
                    }`}
                    title={`Push the entire ${activeRole.roleName} table into the Performance Agreement below Point 6.6`}
                  >
                    {pushingToPA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Push Entire Table into Performance Agreement (Below Point 6.6)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Office Document Viewer Modal for PoE */}
      {previewDoc && (
        <OfficeDocumentViewer
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
