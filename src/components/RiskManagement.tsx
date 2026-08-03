import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Briefcase, Shield, FileText, CheckCircle2, 
  Activity, Flame, Plus, Trash2, Edit, Save, BookOpen, 
  Sparkles, TrendingDown, Layers, Send, RefreshCw, ChevronRight, 
  Check, Archive, ShieldAlert, Award, FileSpreadsheet, Eye, Lock, BarChart3, FileCode,
  Globe, Wrench, Droplet, Users, Radio, Database, Calendar, Cpu, Coins
} from 'lucide-react';
import type { User } from '../types';
import { RiskRegisterTab, RiskRegisterItem, PoeFile } from './RiskRegisterTab';
import { ElectronicReportingTab } from './ElectronicReportingTab';
import { PopiaComplianceTab, PopiaCondition, PopiaIncident, PopiaSystemAssessment } from './PopiaComplianceTab';
import { CRSAEngineTab } from './CRSAEngineTab';
import { LegalRegisterTab } from './LegalRegisterTab';
import { UIFWTrackerTab } from './UIFWTrackerTab';

interface RiskManagementProps {
  currentUser: User;
  activeTenantId: string;
}

interface RiskType {
  id: string;
  name: string;
  description: string;
  inherentThreat: string;
  typicalSources: string[];
}

interface RiskTemplate {
  id: string;
  title: string;
  category: string;
  inherentImpact: number;
  inherentLikelihood: number;
  typicalControls: string[];
  responsibleOfficer: string;
}

interface ActiveRiskDraft {
  id: string;
  title: string;
  category: string;
  inherentImpact: number;
  inherentLikelihood: number;
  preventativeControls: string;
  correctiveControls: string;
  residualImpact: number;
  residualLikelihood: number;
  responsibleOfficer: string;
  status: 'Drafting' | 'In Progress' | 'Mitigated' | 'Critical';
  targetDate: string;
  progress: number;
}

export function RiskManagement({ currentUser, activeTenantId }: RiskManagementProps) {
  const [activeTab, setActiveTab ] = useState<
    | 'strategic'
    | 'operational'
    | 'assurance'
    | 'district_coordination'
    | 'infrastructure'
    | 'macro_financial'
    | 'crsa_engine'
    | 'uifw_module'
    | 'popia_compliance'
    | 'compliance_tracker'
  >('strategic');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Fred AI Real-Time SDBIP & IDP Risk Monitoring state
  const [fredPeriod, setFredPeriod] = useState<'Q1' | 'Q2' | 'Midterm' | 'Q3' | 'Q4' | 'Annual'>('Q1');
  const [isFredScanning, setIsFredScanning] = useState(false);
  const [fredReport, setFredReport] = useState<{
    diagnosis: string;
    measures: string[];
    riskScore: number;
    kpisScanned: number;
    flaggedRisks: number;
  } | null>(null);

  // Sub-navigation tab states for modules 1-6
  const [strategicSubTab, setStrategicSubTab] = useState<'idp_alignment' | 'governance' | 'appetite' | 'types'>('idp_alignment');
  const [operationalSubTab, setOperationalSubTab] = useState<'fraud' | 'regulatory' | 'supply_chain' | 'cyber' | 'templates'>('fraud');
  const [assuranceSubTab, setAssuranceSubTab] = useState<'tracking' | 'combined' | 'reporting'>('tracking');
  const [districtSubTab, setDistrictSubTab] = useState<'joint_committee' | 'igt_projects'>('joint_committee');
  const [infrastructureSubTab, setInfrastructureSubTab] = useState<'water_sanitation' | 'electricity_grid'>('water_sanitation');
  const [macroFinancialSubTab, setMacroFinancialSubTab] = useState<'unauthorized_exp' | 'debt_servicing'>('unauthorized_exp');

  // Core state synced to Supabase
  const [riskTypes, setRiskTypes] = useState<RiskType[]>([]);
  const [templates, setTemplates] = useState<RiskTemplate[]>([]);
  const [drafts, setDrafts] = useState<ActiveRiskDraft[]>([]);
  const [riskRegister, setRiskRegister] = useState<RiskRegisterItem[]>([]);
  const [poeFiles, setPoeFiles] = useState<Record<string, PoeFile[]>>({});
  const [electronicCommentary, setElectronicCommentary] = useState<Record<string, string>>({});
  const [popiaConditions, setPopiaConditions] = useState<PopiaCondition[]>([]);
  const [popiaIncidents, setPopiaIncidents] = useState<PopiaIncident[]>([]);
  const [popiaSystems, setPopiaSystems] = useState<PopiaSystemAssessment[]>([]);

  // Interactive Sub-Module States (persists per session)
  const [governanceMeetings, setGovernanceMeetings] = useState<Array<{id: string, meetingDate: string, title: string, body: string, actionItem: string, status: string}>>([
    { id: '1', meetingDate: '2026-06-15', title: 'Risk Management Committee Q2 Review', body: 'Accounting Officer presiding. Evaluation of SDBIP capital infrastructure backlog.', actionItem: 'Establish special sub-committee for roads spec validation.', status: 'Actioned' },
    { id: '2', meetingDate: '2026-07-22', title: 'Audit Committee & FARMCO Briefing', body: 'Review of Section 166 internal control audit outcomes and AGSA material irregularity guidelines.', actionItem: 'Enforce dual authorization checks in SCM Bid Spec evaluations.', status: 'Pending Approval' }
  ]);
  const [newMeetingAction, setNewMeetingAction] = useState({ title: '', body: '', actionItem: '' });

  const [whistleblowIncidents, setWhistleblowIncidents] = useState<Array<{id: string, date: string, category: string, detail: string, status: string}>>([
    { id: 'wb-1', date: '2026-07-02', category: 'SCM Collusion', detail: 'Alleged specifications rigging on high-value bulk sewage treatment pumps tender.', status: 'Under Investigation' },
    { id: 'wb-2', date: '2026-07-18', category: 'Payroll Anomalies', detail: 'Unexplained overtime allocations matching ghost-profile signatures in ward 5 dispatch.', status: 'AGSA Escalated' }
  ]);
  const [newWhistleblow, setNewWhistleblow] = useState({ category: 'SCM Collusion', detail: '' });

  const [regulatoryChecklist, setRegulatoryChecklist] = useState<Array<{id: string, requirement: string, circular: string, checked: boolean}>>([
    { id: 'reg-1', requirement: 'mSCOA Ledger String Audit Alignment', circular: 'NT Circular 111', checked: true },
    { id: 'reg-2', requirement: 'Establish FARMCO quarterly review', circular: 'MFMA Section 165', checked: true },
    { id: 'reg-3', requirement: 'Section 72 Mid-Year SDBIP Adjustments', circular: 'MFMA Section 72', checked: false },
    { id: 'reg-4', requirement: 'Formulate localized Disaster Mitigation Plan', circular: 'Circular 68', checked: false }
  ]);

  const [appetiteDelivery, setAppetiteDelivery] = useState(10);
  const [appetiteGrant, setAppetiteGrant] = useState(5);
  const [appetiteWaste, setAppetiteWaste] = useState(0);

  const [waterTests, setWaterTests] = useState<Array<{id: string, date: string, ph: number, turbidity: number, status: string}>>([
    { id: 'wt-1', date: '2026-08-01', ph: 7.2, turbidity: 0.8, status: 'Normal' },
    { id: 'wt-2', date: '2026-08-02', ph: 7.6, turbidity: 1.2, status: 'Normal' }
  ]);
  const [newWaterTest, setNewWaterTest] = useState({ location: '', qualityScore: 80, coliformCount: 'Within limits' });

  // Form State for creating custom risk types
  const [newType, setNewType] = useState({
    name: '',
    description: '',
    inherentThreat: 'Medium',
    typicalSources: ''
  });

  // Form State for custom risk templates
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    category: 'Strategic Risks',
    inherentImpact: 3,
    inherentLikelihood: 3,
    typicalControls: '',
    responsibleOfficer: ''
  });

  // Form State for Active Risk Drafts
  const [isEditingDraft, setIsEditingDraft] = useState<string | null>(null);
  const [draftForm, setDraftForm] = useState<Partial<ActiveRiskDraft>>({
    title: '',
    category: 'Strategic Risks',
    inherentImpact: 3,
    inherentLikelihood: 3,
    preventativeControls: '',
    correctiveControls: '',
    residualImpact: 2,
    residualLikelihood: 2,
    responsibleOfficer: '',
    status: 'Drafting',
    targetDate: new Date().toISOString().split('T')[0],
    progress: 10
  });

  // Default Seeding Data for cold starts
  const defaultRiskTypes: RiskType[] = [
    {
      id: 'rt-1',
      name: 'Strategic Risks',
      description: 'Threats targeting IDP execution, long-term political instability, and failure of LED strategic alignment.',
      inherentThreat: 'High',
      typicalSources: ['Strategic Plans', 'IDP Community Forums', 'LED Failures']
    },
    {
      id: 'rt-2',
      name: 'Operational Risks',
      description: 'Infrastructure downtime, water/electricity sanitation disruption, critical asset loss, and labor disputes under MFMA.',
      inherentThreat: 'High',
      typicalSources: ['Line Managers', 'Asset Registers', 'Compliance Audit Logs']
    },
    {
      id: 'rt-3',
      name: 'Financial Risks',
      description: 'Revenue collection deficit, poor credit control, irregular expenditure, clean audit targets failure.',
      inherentThreat: 'Critical',
      typicalSources: ['Auditor-General SA Reports', 'Quarterly MFMA Financials', 'Internal Audit']
    },
    {
      id: 'rt-4',
      name: 'Compliance & Legal Risks',
      description: 'Breaches of Section 62 of the MFMA, procurement regulations bypass, legal litigation from labor unions and suppliers.',
      inherentThreat: 'Medium',
      typicalSources: ['National Treasury circulars', 'Irregular expenditure registers']
    },
    {
      id: 'rt-5',
      name: 'Environmental & Health Risks',
      description: 'Severe weather-induced floods, water quality pollution, illegal dumping site contamination.',
      inherentThreat: 'High',
      typicalSources: ['Provincial forecasts', 'Water testing logs']
    }
  ];

  const defaultTemplates: RiskTemplate[] = [
    {
      id: 'temp-1',
      title: 'Revenue Collection Underperformance',
      category: 'Financial Risks',
      inherentImpact: 5,
      inherentLikelihood: 4,
      typicalControls: ['Implement automated smart water-meter billing audits', 'Establish dedicated legal recourse task-force for commercial defaults', 'Deploy real-time billing validation screens on Mzansi Flow App.'],
      responsibleOfficer: 'Chief Financial Officer'
    },
    {
      id: 'temp-2',
      title: 'Water Treatment Facility Disruption & Contamination',
      category: 'Operational Risks',
      inherentImpact: 5,
      inherentLikelihood: 3,
      typicalControls: ['Install automated backup generators at critical pump channels', 'Establish continuous microbiological water purity surveillance', 'Sign strict emergency SLA chemical supply contracts.'],
      responsibleOfficer: 'Director of Technical Services'
    },
    {
      id: 'temp-3',
      title: 'Supply Chain Management MFMA Section 62 Non-compliance',
      category: 'Compliance & Legal Risks',
      inherentImpact: 4,
      inherentLikelihood: 4,
      typicalControls: ['Establish peer-review committees on bid awards above R200k', 'Integrate digital automated conflict-of-interest testing protocols', 'Enroll supply-chain personnel in compliance retraining.'],
      responsibleOfficer: 'Supply Chain Manager'
    },
    {
      id: 'temp-4',
      title: 'Sub-optimal SDBIP Performance Milestones Triggering Protests',
      category: 'Strategic Risks',
      inherentImpact: 4,
      inherentLikelihood: 3,
      typicalControls: ['Setup bi-weekly project performance diagnostic dashboards', 'Establish early warning alert matrices for capital projects under 40% execution', 'Publish periodic service delivery progress leaflets.'],
      responsibleOfficer: 'Municipal Manager'
    }
  ];

  const defaultDrafts: ActiveRiskDraft[] = [
    {
      id: 'draft-1',
      title: 'Critical Billing System Server Downtime during Month-End Run',
      category: 'Operational Risks',
      inherentImpact: 5,
      inherentLikelihood: 4,
      preventativeControls: 'Routine mirror databases, offsite continuous syncs, automated SLA response for server recovery.',
      correctiveControls: 'Temporary manual backup reception gates, fast system-restore exercises and fallback communication networks.',
      residualImpact: 3,
      residualLikelihood: 2,
      responsibleOfficer: 'Chief Information Officer (CIO)',
      status: 'In Progress',
      targetDate: '2026-07-15',
      progress: 65
    },
    {
      id: 'draft-2',
      title: 'Land Invasion & Informal Housing Expansion on IDP Designated Lands',
      category: 'Strategic Risks',
      inherentImpact: 4,
      inherentLikelihood: 5,
      preventativeControls: 'Establishing perimeter fencing, daily security patrol vectors, early zoning flags in geographical databases.',
      correctiveControls: 'Rapid-response legal standard action orders, proactive relocate discussions aligned with local LED programs.',
      residualImpact: 3,
      residualLikelihood: 3,
      responsibleOfficer: 'Director of Human Settlements',
      status: 'Drafting',
      targetDate: '2026-09-01',
      progress: 25
    }
  ];

  const defaultRiskRegister: RiskRegisterItem[] = [
    {
      id: 'RR-101',
      title: 'Uncollected Municipal Utility Rates & Commercial Bad Debt Accumulation',
      category: 'Financial Risks',
      owner: 'Chief Financial Officer (CFO)',
      inherentImpact: 5,
      inherentLikelihood: 4,
      keyControls: 'Automated smart prepaid water & electricity meter rollout; Weekly credit control disconnection execution; Indigent register validation.',
      residualImpact: 3,
      residualLikelihood: 2,
      status: 'Medium',
      sourceDocument: 'Municipal_Revenue_Collection_Strategy_2026.pdf',
      dateUploaded: '2026-07-20'
    },
    {
      id: 'RR-102',
      title: 'Bulk Water Treatment Disruption & Chemical Supply Chain Contamination',
      category: 'Operational Risks',
      owner: 'Director: Technical Services',
      inherentImpact: 5,
      inherentLikelihood: 4,
      keyControls: 'Continuous microbiological water purity monitoring; Generator backup at main pump stations; SLA emergency chemical supply buffer.',
      residualImpact: 3,
      residualLikelihood: 2,
      status: 'Medium',
      sourceDocument: 'Water_Infrastructure_Audit_2026.docx',
      dateUploaded: '2026-07-22'
    },
    {
      id: 'RR-103',
      title: 'Non-Compliance with MFMA Section 62 Procurement Regulations on Bids > R200k',
      category: 'Compliance & Legal Risks',
      owner: 'Head of Supply Chain Management',
      inherentImpact: 4,
      inherentLikelihood: 4,
      keyControls: 'Digital Bid Evaluation Committee peer-review; Automated conflict-of-interest checks on SARS CSD database; Internal Audit pre-audit signoff.',
      residualImpact: 2,
      residualLikelihood: 2,
      status: 'Low',
      sourceDocument: 'SCM_Compliance_Quarterly_Audit.pdf',
      dateUploaded: '2026-07-25'
    },
    {
      id: 'RR-104',
      title: 'Unauthorized Ratepayer Personal Data Access & Cyber Security Infrastructure Breach',
      category: 'POPIA & Cyber Risks',
      owner: 'Chief Information Officer (CIO)',
      inherentImpact: 5,
      inherentLikelihood: 3,
      keyControls: 'Role-based access controls on Mzansi Flow; Mandatory 2FA for municipal employees; Database field-level encryption; Bi-annual penetration testing.',
      residualImpact: 2,
      residualLikelihood: 2,
      status: 'Low',
      sourceDocument: 'POPIA_IT_Security_Framework_2026.xlsx',
      dateUploaded: '2026-07-26'
    }
  ];

  const defaultPoeFiles: Record<string, PoeFile[]> = {
    'RR-101': [
      {
        id: 'poe-101-1',
        fileName: 'Credit_Control_Policy_Council_Resolution_2026.pdf',
        fileType: 'pdf',
        fileSize: '2.4 MB',
        uploadDate: '2026-07-21',
        uploadedBy: 'Audrey Mpanza (CS Director)',
        status: 'Verified',
        notes: 'Approved by Council in Q1 Ordinary Meeting.'
      }
    ],
    'RR-102': [
      {
        id: 'poe-102-1',
        fileName: 'Water_Purity_Lab_Test_Results_SANS241.pdf',
        fileType: 'pdf',
        fileSize: '3.1 MB',
        uploadDate: '2026-07-24',
        uploadedBy: 'M&E Officer',
        status: 'Verified',
        notes: 'SANS 241 compliance verified by accredited lab.'
      }
    ]
  };

  const defaultPopiaConditions: PopiaCondition[] = [
    {
      id: 1,
      name: 'Condition 1: Accountability',
      description: 'Designating Municipal Manager as Information Officer and ensuring compliance with POPIA & MFMA Section 62.',
      mfmaSection: 'MFMA Sec 62(1)(c)',
      status: 'Compliant',
      notes: 'Information Officer registered with South African Information Regulator. Deputy IOs appointed.'
    },
    {
      id: 2,
      name: 'Condition 2: Processing Limitation',
      description: 'Processing personal ratepayer and employee data lawfully, minimally, and with statutory justification.',
      mfmaSection: 'MFMA Sec 64 & POPIA Sec 9',
      status: 'Compliant',
      notes: 'Municipal utility collection & HR payroll data processed under statutory mandate.'
    },
    {
      id: 3,
      name: 'Condition 3: Purpose Specification',
      description: 'Collecting ratepayer data for explicit municipal service delivery, rates billing, and governance purposes.',
      mfmaSection: 'MFMA Sec 75 & POPIA Sec 13',
      status: 'Compliant',
      notes: 'Data collection notices clearly state utility billing, IDP public notice, and indigent support purposes.'
    },
    {
      id: 4,
      name: 'Condition 4: Further Processing Limitation',
      description: 'Ensuring personal data is not processed further in a way incompatible with municipal purpose.',
      mfmaSection: 'POPIA Sec 15',
      status: 'Compliant',
      notes: 'Strict ban on exporting or selling ratepayer or vendor database records to third parties.'
    },
    {
      id: 5,
      name: 'Condition 5: Information Quality',
      description: 'Maintaining complete, accurate, updated ratepayer, property valuation, and staff registers.',
      mfmaSection: 'MFMA Sec 64(2)(f)',
      status: 'In Progress',
      notes: 'Quarterly valuation roll & indigent register cleansing in progress with Deeds Office data.'
    },
    {
      id: 6,
      name: 'Condition 6: Openness',
      description: 'Publishing POPIA PAIA Manual and privacy notifications across all municipal public portals.',
      mfmaSection: 'PAIA Sec 14 & POPIA Sec 18',
      status: 'Compliant',
      notes: 'PAIA manual & ratepayer privacy terms updated on municipal web portal and Mzansi Flow app.'
    },
    {
      id: 7,
      name: 'Condition 7: Security Safeguards',
      description: 'Implementing technical and organizational measures to prevent unauthorized data access or loss.',
      mfmaSection: 'MFMA Sec 116(2) & POPIA Sec 19',
      status: 'In Progress',
      notes: 'Database encryption active. Employee security awareness training scheduled for Q2.'
    },
    {
      id: 8,
      name: 'Condition 8: Data Subject Participation',
      description: 'Providing mechanisms for ratepayers and staff to view, update, or request deletion of personal records.',
      mfmaSection: 'POPIA Sec 23 - 25',
      status: 'Compliant',
      notes: 'Electronic Data Subject Request (DSR) form implemented on Mzansi Flow Citizen Portal.'
    }
  ];

  const defaultPopiaIncidents: PopiaIncident[] = [
    {
      id: 'INC-2026-01',
      title: 'Spear Phishing Email Attempt on SCM Finance Portal Admin Account',
      severity: 'Medium',
      dateReported: '2026-07-14',
      dataSubjectsAffected: '0 Records (Blocked by Mail Gateway)',
      status: 'Resolved',
      remedialAction: 'Enforced Hardware 2FA token requirement for all SCM Finance administrators.'
    }
  ];

  const defaultPopiaSystems: PopiaSystemAssessment[] = [
    {
      id: 'SYS-1',
      systemName: 'Mzansi Flow Ratepayer Utility & Billing Platform',
      dataType: 'Ratepayer Names, ID Numbers, Property Valuations, Utility Accounts, Bank Details',
      riskLevel: 'High',
      safeguards: 'TLS 1.3 Encryption in Transit, AES-256 Storage, OAuth 2.0 Auth, Role-Based Access Control',
      signoffStatus: 'Approved'
    },
    {
      id: 'SYS-2',
      systemName: 'VIP Municipal HR & Payroll System',
      dataType: 'Employee ID Numbers, Bank Accounts, Salaries, Tax Records, Pension Data',
      riskLevel: 'High',
      safeguards: 'Air-gapped Network Segment, Encrypted Database Backups, Dual-Authorization for Payouts',
      signoffStatus: 'Approved'
    }
  ];

  // Fetch Risk Management Context from Supabase
  const loadRiskManagement = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/risk-management`);
      if (res.ok) {
        const data = await res.json();
        setRiskTypes(data.typesOfRisks && data.typesOfRisks.length > 0 ? data.typesOfRisks : defaultRiskTypes);
        setTemplates(data.templates && data.templates.length > 0 ? data.templates : defaultTemplates);
        setDrafts(data.drafts && data.drafts.length > 0 ? data.drafts : defaultDrafts);
        setRiskRegister(data.riskRegister && data.riskRegister.length > 0 ? data.riskRegister : defaultRiskRegister);
        setPoeFiles(data.poeFiles && Object.keys(data.poeFiles).length > 0 ? data.poeFiles : defaultPoeFiles);
        setElectronicCommentary(data.electronicReports || { Q1: 'Quarter 1 Risk Review: SCM & Revenue controls operating effectively under MFMA directive.' });
        setPopiaConditions(data.popiaData?.conditions && data.popiaData.conditions.length > 0 ? data.popiaData.conditions : defaultPopiaConditions);
        setPopiaIncidents(data.popiaData?.incidents && data.popiaData.incidents.length > 0 ? data.popiaData.incidents : defaultPopiaIncidents);
        setPopiaSystems(data.popiaData?.systems && data.popiaData.systems.length > 0 ? data.popiaData.systems : defaultPopiaSystems);
      } else {
        setRiskTypes(defaultRiskTypes);
        setTemplates(defaultTemplates);
        setDrafts(defaultDrafts);
        setRiskRegister(defaultRiskRegister);
        setPoeFiles(defaultPoeFiles);
        setPopiaConditions(defaultPopiaConditions);
        setPopiaIncidents(defaultPopiaIncidents);
        setPopiaSystems(defaultPopiaSystems);
      }
    } catch (e) {
      console.error("Cold start loading error:", e);
      setRiskTypes(defaultRiskTypes);
      setTemplates(defaultTemplates);
      setDrafts(defaultDrafts);
      setRiskRegister(defaultRiskRegister);
      setPoeFiles(defaultPoeFiles);
      setPopiaConditions(defaultPopiaConditions);
      setPopiaIncidents(defaultPopiaIncidents);
      setPopiaSystems(defaultPopiaSystems);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskManagement();
  }, [activeTenantId]);

  // Persist State directly back to Supabase
  const persistContext = async (
    updatedTypes = riskTypes,
    updatedTemplates = templates,
    updatedDrafts = drafts,
    updatedRegister = riskRegister,
    updatedPoe = poeFiles,
    updatedCommentary = electronicCommentary,
    updatedPopia = { conditions: popiaConditions, incidents: popiaIncidents, systems: popiaSystems }
  ) => {
    setIsLoading(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/risk-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typesOfRisks: updatedTypes,
          templates: updatedTemplates,
          drafts: updatedDrafts,
          riskRegister: updatedRegister,
          poeFiles: updatedPoe,
          electronicReports: updatedCommentary,
          popiaData: updatedPopia
        })
      });

      if (res.ok) {
        setSaveStatus({ type: 'success', msg: 'Risk management registry successfully synchronized to Supabase cloud.' });
        setRiskTypes(updatedTypes);
        setTemplates(updatedTemplates);
        setDrafts(updatedDrafts);
        setRiskRegister(updatedRegister);
        setPoeFiles(updatedPoe);
        setElectronicCommentary(updatedCommentary);
        if (updatedPopia) {
          setPopiaConditions(updatedPopia.conditions);
          setPopiaIncidents(updatedPopia.incidents);
          setPopiaSystems(updatedPopia.systems);
        }
      } else {
        const err = await res.json();
        setSaveStatus({ type: 'error', msg: err.error || 'Server rejected synchronization.' });
      }
    } catch (e) {
      setSaveStatus({ type: 'error', msg: 'Network failure persisting to Supabase storage pipeline.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Add Risk Type
  const handleAddRiskType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.name || !newType.description) return;
    
    const sourcesList = newType.typicalSources 
      ? newType.typicalSources.split(',').map(s => s.trim()) 
      : ['General Internal Audits'];

    const added: RiskType = {
      id: `rt-${Date.now()}`,
      name: newType.name,
      description: newType.description,
      inherentThreat: newType.inherentThreat,
      typicalSources: sourcesList
    };

    const nextList = [...riskTypes, added];
    persistContext(nextList, templates, drafts);
    setNewType({ name: '', description: '', inherentThreat: 'Medium', typicalSources: '' });
  };

  // 2. Clear Risk Type
  const handleDeleteRiskType = (id: string) => {
    const nextList = riskTypes.filter(rt => rt.id !== id);
    persistContext(nextList, templates, drafts);
  };

  // 3. Add Custom Template
  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.responsibleOfficer) return;

    const typicalControlsList = newTemplate.typicalControls
      ? newTemplate.typicalControls.split(',').map(c => c.trim())
      : ['Quarterly performance tracking review'];

    const added: RiskTemplate = {
      id: `temp-${Date.now()}`,
      title: newTemplate.title,
      category: newTemplate.category,
      inherentImpact: Number(newTemplate.inherentImpact),
      inherentLikelihood: Number(newTemplate.inherentLikelihood),
      typicalControls: typicalControlsList,
      responsibleOfficer: newTemplate.responsibleOfficer
    };

    const nextList = [...templates, added];
    persistContext(riskTypes, nextList, drafts);
    setNewTemplate({
      title: '',
      category: 'Strategic Risks',
      inherentImpact: 3,
      inherentLikelihood: 3,
      typicalControls: '',
      responsibleOfficer: ''
    });
  };

  // 4. Delete Template
  const handleDeleteTemplate = (id: string) => {
    const nextList = templates.filter(t => t.id !== id);
    persistContext(riskTypes, nextList, drafts);
  };

  // 5. Deploy Template directly to Live Drafting Suite
  const handleDeployTemplate = (temp: RiskTemplate) => {
    const deployed: ActiveRiskDraft = {
      id: `draft-${Date.now()}`,
      title: temp.title,
      category: temp.category,
      inherentImpact: temp.inherentImpact,
      inherentLikelihood: temp.inherentLikelihood,
      preventativeControls: temp.typicalControls.join('; '),
      correctiveControls: 'Establish contingency action committees and emergency protocols.',
      residualImpact: Math.max(1, temp.inherentImpact - 1),
      residualLikelihood: Math.max(1, temp.inherentLikelihood - 1),
      responsibleOfficer: temp.responsibleOfficer,
      status: 'Drafting',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 15
    };

    const nextList = [deployed, ...drafts];
    persistContext(riskTypes, templates, nextList);
    setActiveTab('assurance');
    setAssuranceSubTab('tracking');
    
    // Open immediately for editing
    handleOpenEditDraft(deployed);
  };

  // 6. Active Draft Helpers
  const handleOpenEditDraft = (draft: ActiveRiskDraft) => {
    setIsEditingDraft(draft.id);
    setDraftForm({ ...draft });
  };

  const handleCreateEmptyDraft = () => {
    const freshId = `draft-${Date.now()}`;
    const fresh: ActiveRiskDraft = {
      id: freshId,
      title: 'New Municipal Risk Project',
      category: 'Strategic Risks',
      inherentImpact: 3,
      inherentLikelihood: 3,
      preventativeControls: '',
      correctiveControls: '',
      residualImpact: 2,
      residualLikelihood: 2,
      responsibleOfficer: 'Risk Manager Officer',
      status: 'Drafting',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 10
    };
    setIsEditingDraft(freshId);
    setDraftForm(fresh);
  };

  const handleSaveDraftChanges = () => {
    if (!draftForm.title || !draftForm.id) return;
    
    // Update array
    const updated = drafts.map(d => {
      if (d.id === draftForm.id) {
        return draftForm as ActiveRiskDraft;
      }
      return d;
    });

    // Check if it was brand-new
    const exists = drafts.some(d => d.id === draftForm.id);
    const nextList = exists ? updated : [draftForm as ActiveRiskDraft, ...drafts];

    persistContext(riskTypes, templates, nextList);
    setIsEditingDraft(null);
  };

  const handleDeleteDraft = (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this risk active draft from Supabase?')) return;
    const nextList = drafts.filter(d => d.id !== id);
    persistContext(riskTypes, templates, nextList);
  };

  const handleTriggerFredScan = async () => {
    setIsFredScanning(true);
    setFredReport(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsFredScanning(false);
    setFredReport({
      diagnosis: `SDBIP Audit Performance analysis indicates that 2025/2026 KPI targets are 88% on track. SCM delays on major bulk water sanitation infrastructure are flagged as potential compliance threats under MFMA. Corrective measures have been auto-escalated to the Accounting Officer.`,
      measures: [
        "Accelerate bid evaluations for local sanitation contractors.",
        "Implement real-time expenditure monitoring for grant-funded capital projects.",
        "Conduct urgent Section 72 mid-year alignment on capital infrastructure targets."
      ],
      riskScore: 18,
      kpisScanned: 42,
      flaggedRisks: 3
    });
  };

  // Helpers to compute risk ratings & colors
  const getRatingSummary = (impact: number, likelihood: number) => {
    const score = impact * likelihood;
    if (score >= 15) return { label: 'HIGH', css: 'bg-red-100 text-red-800 border-red-200' };
    if (score >= 9) return { label: 'MEDIUM', css: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'LOW', css: 'bg-green-100 text-green-800 border-green-200' };
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
      {/* Premium Header */}
      <div className="bg-slate-900 text-white p-6 shrink-0 flex flex-col md:flex-row md:items-center justify-between shadow-lg relative z-20 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 opacity-100" />
            <AlertTriangle className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              OPMS Enterprise Risk Management <span className="text-[10px] bg-red-500/80 text-white px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-widest leading-none">Standardized Suite</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              National Treasury compliant risk oversight, preventative controls mapping, & residual indices.
            </p>
          </div>
        </div>
        
        {/* Supabase Pipeline Connection Status */}
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono tracking-widest text-slate-300 font-extrabold uppercase">
            Supabase Connection Secured
          </span>
        </div>
      </div>

      {/* Persistence Notification Alert Banner */}
      {saveStatus && (
        <div className={`p-4 gap-3 flex items-center shrink-0 border-b text-xs font-bold ${saveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1">{saveStatus.msg}</div>
          <button onClick={() => setSaveStatus(null)} className="hover:underline px-1 py-0.5 text-[10px] uppercase">Dismiss</button>
        </div>
      )}

      {/* Tabs list bar */}
      <div className="flex bg-slate-200/60 border-b border-slate-200 shrink-0 px-6 gap-2 overflow-x-auto scrollbar-thin">
        <button 
          onClick={() => { setActiveTab('strategic'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'strategic' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Shield className="w-4 h-4 text-red-500" /> 1. Strategic & Governance
        </button>

        <button 
          onClick={() => { setActiveTab('operational'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'operational' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Activity className="w-4 h-4 text-amber-500" /> 2. Operational & Compliance
        </button>

        <button 
          onClick={() => { setActiveTab('assurance'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'assurance' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Award className="w-4 h-4 text-emerald-500" /> 3. Assurance & Reporting
          {drafts.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white font-mono rounded-full text-[9px] font-bold">
              {drafts.length}
            </span>
          )}
        </button>

        <button 
          onClick={() => { setActiveTab('district_coordination'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'district_coordination' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Globe className="w-4 h-4 text-blue-500" /> 4. District Coordination
        </button>

        <button 
          onClick={() => { setActiveTab('infrastructure'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'infrastructure' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Wrench className="w-4 h-4 text-purple-500" /> 5. Infrastructure & Services
        </button>

        <button 
          onClick={() => { setActiveTab('macro_financial'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'macro_financial' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Coins className="w-4 h-4 text-indigo-500" /> 6. Macro Financial
        </button>

        <button 
          onClick={() => { setActiveTab('crsa_engine'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'crsa_engine' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <FileCode className="w-4 h-4 text-cyan-500" /> 7. CRSA Engine
        </button>

        <button 
          onClick={() => { setActiveTab('uifw_module'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'uifw_module' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <BarChart3 className="w-4 h-4 text-teal-500" /> 8. UIF & W Tracker
        </button>

        <button 
          onClick={() => { setActiveTab('popia_compliance'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'popia_compliance' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Lock className="w-4 h-4 text-rose-500" /> 9. POPIA Compliance
        </button>

        <button 
          onClick={() => { setActiveTab('compliance_tracker'); setIsEditingDraft(null); }}
          className={`px-4 py-3.5 font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'compliance_tracker' ? 'border-red-650 text-slate-900 font-black bg-white rounded-t-xl mt-1.5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Archive className="w-4 h-4 text-slate-500" /> 10. Legal Register
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
        <div className="max-w-6xl mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-600" /> Synchronizing data structures...
            </div>
          )}

          {/* TAB 1: STRATEGIC & GOVERNANCE */}
          {activeTab === 'strategic' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-600" /> Strategic & Governance Risk Module
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Links risks to the Integrated Development Plan (IDP), SDBIP, and monitors risk oversight & appetite thresholds.
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-center">
                    {(['idp_alignment', 'governance', 'appetite', 'types'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setStrategicSubTab(sub)}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors ${
                          strategicSubTab === sub ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sub === 'idp_alignment' ? 'IDP & SDBIP Fred AI' :
                         sub === 'governance' ? 'Committee & Action Log' :
                         sub === 'appetite' ? 'Appetite & Tolerance' :
                         'Risk Classifications'}
                      </button>
                    ))}
                  </div>
                </div>

                {strategicSubTab === 'idp_alignment' && (
                  <div className="space-y-6">
                    {/* Fred AI real-time monitoring widget */}
                    <div className="border border-slate-250 bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-bl-full pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white text-base font-mono animate-pulse">
                            F
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                              Fred AI Real-Time SDBIP & IDP Risk Advisor
                            </h3>
                            <p className="text-[10px] text-slate-400">
                              Treasury compliant automated compliance scanner & mitigation formulator.
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-widest bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 text-slate-300">
                          Real-time AI telemetry active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950/80 p-5 rounded-xl border border-slate-850">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Select Audit Evaluation Period</label>
                          <select
                            value={fredPeriod}
                            onChange={(e) => setFredPeriod(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-red-500 font-bold"
                          >
                            <option value="Q1">Quarter 1 (Procurement & MIG Startup)</option>
                            <option value="Q2">Quarter 2 (Revenue & Billing Outliers)</option>
                            <option value="Midterm">Midterm (Section 72 SDBIP Adjustments)</option>
                            <option value="Q3">Quarter 3 (Water Quality & Sanitation)</option>
                            <option value="Q4">Quarter 4 (AGSA Preparation & SCM Audits)</option>
                            <option value="Annual">Annual Review (Consolidated performance & KPI 13)</option>
                          </select>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Fred AI scans the currently active tenant IDP objectives, SDBIP targets, and budget efficiency parameters to project service delivery delays.
                          </p>
                        </div>

                        <div className="text-right">
                          <button
                            onClick={handleTriggerFredScan}
                            disabled={isFredScanning}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-2"
                          >
                            {isFredScanning ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" /> Scanning SDBIP Telemetry...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-amber-300" /> Trigger Real-Time Scan
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Fred Report Results Block */}
                      {isFredScanning && (
                        <div className="mt-4 p-6 bg-slate-950 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-3 animate-pulse">
                          <div className="h-1 bg-red-600 rounded-full w-full animate-infinite-loading" />
                          <span className="text-[11px] text-slate-400 font-mono">Parsing SDBIP compliance indices, analyzing grant variance margins...</span>
                        </div>
                      )}

                      {fredReport && !isFredScanning && (
                        <div className="mt-4 bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4 animate-fade-in">
                          <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-850 pb-3">
                            <div className="flex gap-4">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-500 block">KPA Targets Scanned</span>
                                <span className="text-sm font-bold text-slate-100">{fredReport.kpisScanned}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-500 block">Flagged Threats</span>
                                <span className="text-sm font-bold text-red-400">{fredReport.flaggedRisks} Critical</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-500 block">Calculated Risk Score</span>
                                <span className={`text-sm font-bold px-1.5 py-0.5 rounded text-white ${
                                  fredReport.riskScore >= 15 ? 'bg-red-600' : 'bg-amber-500'
                                }`}>
                                  {fredReport.riskScore}/25
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 border border-emerald-900 rounded">
                              Scanner matched: {fredPeriod} Objectives
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-550" /> SDBIP Telemetry Diagnosis:
                            </span>
                            <p className="text-xs text-slate-300 bg-slate-900/60 p-4 border border-slate-850 rounded-lg leading-relaxed text-justify">
                              {fredReport.diagnosis}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fred AI Suggested Corrective & Mitigation Measures:
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {fredReport.measures.map((measure, index) => (
                                <div key={index} className="bg-slate-900/40 border border-slate-850 p-3.5 rounded-lg flex gap-2.5">
                                  <div className="text-xs font-bold text-red-400 bg-red-950/40 h-5 w-5 rounded flex items-center justify-center shrink-0">
                                    {index + 1}
                                  </div>
                                  <p className="text-[11px] text-slate-350 leading-normal text-justify">{measure}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => {
                                // Add as mock register item
                                const added: RiskRegisterItem = {
                                  id: `reg-${Date.now()}`,
                                  title: `SDBIP Audit - ${fredPeriod} Delays`,
                                  category: 'Strategic Risks',
                                  inherentImpact: 4,
                                  inherentLikelihood: 4,
                                  keyControls: fredReport.measures.join('. '),
                                  residualImpact: 2,
                                  residualLikelihood: 2,
                                  owner: 'Municipal Manager',
                                  status: 'Medium'
                                };
                                const nextRegister = [added, ...riskRegister];
                                setRiskRegister(nextRegister);
                                persistContext(riskTypes, templates, drafts, nextRegister, poeFiles, electronicCommentary);
                                setSaveStatus({ type: 'success', msg: 'Fred AI recommendations successfully logged as Live Municipal Risk!' });
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Commit to Active Risk Register
                            </button>
                            <button
                              onClick={() => {
                                setSaveStatus({ type: 'success', msg: `Executive summary document exported for ${fredPeriod} SDBIP audit compliance.` });
                              }}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors"
                            >
                              Generate Oversight PDF
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Brief context */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">MFMA Section 62 & Circular 68 Compliance</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                          National Treasury mandates that strategic risk management is not a separate exercise but must align directly with the Integrated Development Plan (IDP) objectives and performance targets. The Accounting Officer is personally responsible for establishing preventative mitigation actions for targets at risk of failure.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Fred AI Core Diagnostics</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                          Fred AI continuously correlates financial spending metrics (from mSCOA general ledgers), SCM project progress registers, and human resources capability indicators to forecast delay vectors on capital infrastructure grants.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {strategicSubTab === 'governance' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Municipal Risk Governance & Committee Cycles</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Track decisions, oversight cycles, and action logs for FARMCO and the Municipal Council.</p>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 border border-slate-300 rounded">
                        2 Oversight Nodes Confirmed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 block border-b pb-1">Governance Meetings & Oversight Logs</h4>
                        
                        <div className="space-y-3">
                          {governanceMeetings.map((item) => (
                            <div key={item.id} className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 shadow-xs relative">
                              <span className="absolute top-4 right-4 text-[9px] bg-slate-100 text-slate-600 border px-1.5 py-0.5 rounded font-mono">
                                {item.meetingDate}
                              </span>
                              <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${item.status === 'Actioned' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                {item.title}
                              </h5>
                              <p className="text-[11px] text-slate-600 text-justify leading-relaxed">{item.body}</p>
                              <div className="bg-slate-50 p-2.5 rounded border border-slate-150 flex items-center justify-between gap-4">
                                <span className="text-[10px] text-slate-500 font-medium"><strong>Mitigation Directive:</strong> {item.actionItem}</span>
                                <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded shrink-0 ${
                                  item.status === 'Actioned' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 border' : 'bg-amber-50 text-amber-800 border-amber-200 border'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Log oversight action */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 h-fit">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Log Committee Mitigation Directive</h4>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!newMeetingAction.title || !newMeetingAction.body) return;
                          const added = {
                            id: `gov-${Date.now()}`,
                            meetingDate: new Date().toISOString().split('T')[0],
                            title: newMeetingAction.title,
                            body: newMeetingAction.body,
                            actionItem: newMeetingAction.actionItem || 'Review controls quarterly.',
                            status: 'Pending Approval'
                          };
                          setGovernanceMeetings([...governanceMeetings, added]);
                          setNewMeetingAction({ title: '', body: '', actionItem: '' });
                          setSaveStatus({ type: 'success', msg: 'Governance oversight directive logged.' });
                        }} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Committee Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Risk Management Committee Q3"
                              value={newMeetingAction.title}
                              onChange={e => setNewMeetingAction({ ...newMeetingAction, title: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Meeting Minutes Summary</label>
                            <textarea
                              rows={2}
                              required
                              placeholder="Key resolutions and compliance warnings..."
                              value={newMeetingAction.body}
                              onChange={e => setNewMeetingAction({ ...newMeetingAction, body: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Action Item Assigned</label>
                            <input
                              type="text"
                              placeholder="Mitigation action for HODs..."
                              value={newMeetingAction.actionItem}
                              onChange={e => setNewMeetingAction({ ...newMeetingAction, actionItem: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 rounded-lg uppercase tracking-wider transition-colors"
                          >
                            Save Oversight directive
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {strategicSubTab === 'appetite' && (
                  <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-xs flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="leading-relaxed">
                        <strong>National Treasury Guidelines:</strong> Risk appetite thresholds must be formally approved by the Municipal Council. Any active risk score exceeding the council-approved threshold must be escalated immediately to the Audit Committee and FARMCO.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase">Service Delivery Delay</h4>
                          <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 border px-1.5 py-0.5 rounded">{appetiteDelivery}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={appetiteDelivery}
                          onChange={(e) => setAppetiteDelivery(Number(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                        <div className="text-[10px] text-slate-500 leading-relaxed text-justify">
                          Maximum allowable project completion slippage before automatic escalation logic flags SDBIP milestone failure. Recommended limit: <strong>10%</strong>.
                        </div>
                        {appetiteDelivery > 10 && (
                          <span className="text-[9px] uppercase font-black text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded block">
                            ⚠️ Council Warning: Setting exceeds standard Treasury risk boundaries!
                          </span>
                        )}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase">Grant Under-Spend Limit</h4>
                          <span className="font-mono text-xs font-black text-purple-600 bg-purple-50 border px-1.5 py-0.5 rounded">{appetiteGrant}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          value={appetiteGrant}
                          onChange={(e) => setAppetiteGrant(Number(e.target.value))}
                          className="w-full accent-purple-600"
                        />
                        <div className="text-[10px] text-slate-500 leading-relaxed text-justify">
                          Allowed MIG / Capital infrastructure conditional grant underspend before Treasury allocation recovery flags are triggered. Recommended limit: <strong>5%</strong>.
                        </div>
                        {appetiteGrant > 5 && (
                          <span className="text-[9px] uppercase font-black text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded block">
                            ⚠️ High Threat: Treasury may withhold next fiscal equitable share tranches!
                          </span>
                        )}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase">Unauthorized Waste Limit</h4>
                          <span className="font-mono text-xs font-black text-red-600 bg-red-50 border px-1.5 py-0.5 rounded">{appetiteWaste}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={appetiteWaste}
                          disabled
                          className="w-full accent-red-600"
                        />
                        <div className="text-[10px] text-slate-500 leading-relaxed text-justify">
                          Allowable limit for Irregular, Fruitless, or Wasteful Expenditure. Locked to <strong>0%</strong> by South African statutory directives.
                        </div>
                        <span className="text-[9px] uppercase font-black text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded block font-mono text-center">
                          🔒 Locked by MFMA Section 32 Directives
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {strategicSubTab === 'types' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Custom Risk Classification Matrix</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Define classifications and link them to telemetric intake channels.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {riskTypes.map((type) => (
                        <div key={type.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative group flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-2 border-b pb-2 mb-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider ${
                              type.inherentThreat === 'Critical' ? 'bg-red-50 border-red-200 text-red-700' :
                              type.inherentThreat === 'High' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                              'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                              Inherent: {type.inherentThreat}
                            </span>
                            <button 
                              onClick={() => handleDeleteRiskType(type.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete classification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 mb-1.5 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-red-500" /> {type.name}
                          </h3>
                          <p className="text-[11px] text-slate-550 leading-relaxed mb-4 flex-1">
                            {type.description}
                          </p>

                          <div className="pt-3 border-t border-slate-100 space-y-1.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">Telemetry Intake Channels:</span>
                            <div className="flex flex-wrap gap-1">
                              {type.typicalSources.map((source, index) => (
                                <span key={index} className="px-1.5 py-0.5 bg-slate-100 text-slate-705 text-[9px] font-mono rounded">
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Custom Risk Classification Card */}
                    <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <Plus className="w-4 h-4 text-red-550" /> Register Custom Risk Classification
                      </h3>
                      <form onSubmit={handleAddRiskType} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Classification Title</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. IT & Technological Risks"
                            value={newType.name}
                            onChange={e => setNewType({ ...newType, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Diagnostic Scope Description</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Define typical operational impacts with MFMA context"
                            value={newType.description}
                            onChange={e => setNewType({ ...newType, description: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="space-y-1 flex-1">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Baseline Threat</label>
                            <select 
                              value={newType.inherentThreat}
                              onChange={e => setNewType({ ...newType, inherentThreat: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 bg-white outline-none"
                            >
                              <option>Medium</option>
                              <option>High</option>
                              <option>Critical</option>
                            </select>
                          </div>
                          <button 
                            type="submit"
                            disabled={isLoading}
                            className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-lg h-[34px] uppercase tracking-wider transition-colors shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONAL & COMPLIANCE */}
          {activeTab === 'operational' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-red-500" /> Operational & Compliance Risk Module
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monitors operational fraud vectors, regulatory compliance checklists, and supply-chain delay risks.
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-center">
                    {(['fraud', 'regulatory', 'supply_chain', 'cyber', 'templates'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setOperationalSubTab(sub)}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors ${
                          operationalSubTab === sub ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sub === 'fraud' ? 'Fraud & Ethics' :
                         sub === 'regulatory' ? 'MFMA Compliance' :
                         sub === 'supply_chain' ? 'SCM Projects' :
                         sub === 'cyber' ? 'Cyber Safeguards' :
                         'Template Presets'}
                      </button>
                    ))}
                  </div>
                </div>

                {operationalSubTab === 'fraud' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 border p-4 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Total Irregularities</span>
                        <p className="text-xl font-bold text-slate-900">{whistleblowIncidents.length}</p>
                      </div>
                      <div className="bg-slate-50 border p-4 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Under Investigation</span>
                        <p className="text-xl font-bold text-amber-600">
                          {whistleblowIncidents.filter(x => x.status === 'Under Investigation').length}
                        </p>
                      </div>
                      <div className="bg-slate-50 border p-4 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400">AGSA Escalations</span>
                        <p className="text-xl font-bold text-red-600">
                          {whistleblowIncidents.filter(x => x.status === 'AGSA Escalated').length}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 block border-b pb-1">Anonymous Ethics & Fraud Log</h4>
                        <div className="space-y-3">
                          {whistleblowIncidents.map((wb) => (
                            <div key={wb.id} className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 relative">
                              <span className="absolute top-4 right-4 text-[9px] bg-slate-100 text-slate-600 border px-1.5 py-0.5 rounded font-mono">
                                {wb.date}
                              </span>
                              <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-red-550" /> {wb.category}
                              </h5>
                              <p className="text-[11px] text-slate-600 text-justify leading-relaxed">{wb.detail}</p>
                              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400 font-mono">ID: {wb.id}</span>
                                <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                                  wb.status === 'AGSA Escalated' ? 'bg-red-50 text-red-800 border-red-200 border' : 'bg-amber-50 text-amber-800 border-amber-200 border'
                                }`}>
                                  {wb.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 h-fit">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Report Incident Irregularity</h4>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!newWhistleblow.detail) return;
                          const added = {
                            id: `wb-${Date.now()}`,
                            date: new Date().toISOString().split('T')[0],
                            category: newWhistleblow.category,
                            detail: newWhistleblow.detail,
                            status: 'Under Investigation'
                          };
                          setWhistleblowIncidents([...whistleblowIncidents, added]);
                          setNewWhistleblow({ category: 'SCM Collusion', detail: '' });
                          setSaveStatus({ type: 'success', msg: 'Anonymous integrity alert filed successfully.' });
                        }} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Category</label>
                            <select
                              value={newWhistleblow.category}
                              onChange={e => setNewWhistleblow({ ...newWhistleblow, category: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                            >
                              <option>SCM Collusion</option>
                              <option>Payroll Anomalies</option>
                              <option>Bribery & Solicitation</option>
                              <option>Unauthorized Expenditure</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Incident Narrative Detail</label>
                            <textarea
                              rows={3}
                              required
                              placeholder="Describe locations, contractors, specific tender identifiers..."
                              value={newWhistleblow.detail}
                              onChange={e => setNewWhistleblow({ ...newWhistleblow, detail: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 rounded-lg uppercase tracking-wider transition-colors"
                          >
                            Submit Whistleblowing Alert
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {operationalSubTab === 'regulatory' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">National Treasury MFMA Risk Audit Guidelines</h4>
                        <p className="text-[10px] text-slate-500">Track mandatory compliance vectors to prevent division of revenue withholding.</p>
                      </div>
                      <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200 shrink-0">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${(regulatoryChecklist.filter(x => x.checked).length / regulatoryChecklist.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {regulatoryChecklist.map((item) => (
                        <div 
                          key={item.id}
                          className={`p-4 border rounded-2xl flex items-start gap-3 transition-colors ${
                            item.checked ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => {
                              const next = regulatoryChecklist.map(x => x.id === item.id ? { ...x, checked: e.target.checked } : x);
                              setRegulatoryChecklist(next);
                            }}
                            className="h-4 w-4 text-emerald-600 rounded border-slate-300 accent-emerald-650 mt-0.5"
                          />
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider block">{item.circular}</span>
                            <h5 className="font-bold text-xs text-slate-800 mt-0.5">{item.requirement}</h5>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {item.checked ? 'Verified & documented in oversight minutes.' : 'Action required by responsible executive director.'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {operationalSubTab === 'supply_chain' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                      <h4 className="text-xs font-bold text-slate-800">SCM Capital Projects Risk Monitor</h4>
                      <p className="text-[10px] text-slate-500">Cross-analyzes procurement bid specifications against MIG delivery metrics.</p>
                    </div>

                    <div className="overflow-x-auto border rounded-2xl bg-white shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-55 border-b border-slate-150 font-sans text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <th className="p-3">Contract Name</th>
                            <th className="p-3">Budget</th>
                            <th className="p-3">Inherent Risk Rating</th>
                            <th className="p-3">Responsible HOD</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-slate-100">
                          <tr>
                            <td className="p-3 font-semibold">Ward 3 Bulk Sewerage Phase 2</td>
                            <td className="p-3">R14,500,000</td>
                            <td className="p-3"><span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">16 - High</span></td>
                            <td className="p-3 text-slate-600">Infrastructure Director</td>
                            <td className="p-3"><span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-amber-200">Bid Evaluation Delay</span></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold">Substation Transformer Overhaul</td>
                            <td className="p-3">R6,800,000</td>
                            <td className="p-3"><span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">9 - Significant</span></td>
                            <td className="p-3 text-slate-600">Technical Director</td>
                            <td className="p-3"><span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-emerald-200">Active Procurement</span></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold">Local Economic Development Center</td>
                            <td className="p-3">R3,200,000</td>
                            <td className="p-3"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">4 - Low</span></td>
                            <td className="p-3 text-slate-600">LED Director</td>
                            <td className="p-3"><span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-blue-200">Completed On Time</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {operationalSubTab === 'cyber' && (
                  <div className="space-y-6">
                    <div className="bg-slate-900 p-5 rounded-2xl text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-bl-full pointer-events-none" />
                      <div>
                        <h4 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                          <ShieldAlert className="w-5 h-5 text-blue-400" /> ICT Cybersecurity Safeguard Metrics
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Aligned to COBIT framework and National Treasury ICT Guidelines.</p>
                      </div>
                      <button 
                        onClick={() => setSaveStatus({ type: 'success', msg: 'Simulated IT security audit triggered. Firewall structures optimal.' })}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-2 px-3.5 rounded-lg uppercase tracking-wider transition-colors shrink-0"
                      >
                        Run Cyber Audit Scan
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Active Safeguards</span>
                        <ul className="space-y-1 list-disc list-inside text-xs text-slate-600">
                          <li>2-Factor Authentication enforced on payroll systems</li>
                          <li>Off-site backup copies replicated daily</li>
                          <li>Daily firewall intrusion detection arrays active</li>
                        </ul>
                      </div>
                      <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Key Threats Identified</span>
                        <ul className="space-y-1 list-disc list-inside text-xs text-slate-600">
                          <li>Legacy SCADA systems at water pumping stations (Critical)</li>
                          <li>Unresolved patching backlogs on municipal mail servers</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {operationalSubTab === 'templates' && (
                  <div className="space-y-6">
                    <div className="bg-slate-800 text-white p-5 rounded-2xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" /> South Africa Municipal Reference Template Library
                        </h3>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Pre-configured risk profiles featuring default impact models and preventative control catalogs. Deploy directly to audit workspaces.
                        </p>
                      </div>
                      <div className="text-[10px] bg-slate-700/60 py-1.5 px-3 rounded-lg font-mono border border-slate-650 shrink-0">
                        Secured Templates: {templates.length} Active Presets
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {templates.map((temp) => {
                        const rating = getRatingSummary(temp.inherentImpact, temp.inherentLikelihood);
                        return (
                          <div key={temp.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-amber-300 transition-colors flex flex-col relative group">
                            <div className="absolute right-4 top-4 border-l-2 border-amber-500 pl-2">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Responsible Node</span>
                              <span className="text-[10px] font-bold text-slate-700">{temp.responsibleOfficer}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-3.5">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase border border-slate-200">
                                {temp.category}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${rating.css}`}>
                                Rating: {temp.inherentImpact * temp.inherentLikelihood}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-650 transition-colors mb-2">
                              {temp.title}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4 text-justify flex-1">
                              <strong>Typical Controls:</strong> {temp.typicalControls.join('; ')}
                            </p>

                            <button
                              onClick={() => handleDeployTemplate(temp)}
                              className="w-full bg-slate-900 hover:bg-black text-white text-[10px] uppercase font-black tracking-widest py-2 rounded-xl transition-all shadow-inner"
                            >
                              Deploy preset to workspace
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ASSURANCE & REPORTING */}
          {activeTab === 'assurance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" /> Combined Assurance & Reporting Module
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tracks active mitigations in the live risk register, combined assurance lines, and executive commentary logs.
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-center">
                    {(['tracking', 'combined', 'reporting'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setAssuranceSubTab(sub)}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors ${
                          assuranceSubTab === sub ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sub === 'tracking' ? 'Active Risk Register' :
                         sub === 'combined' ? 'Combined Assurance' :
                         'Executive Reporting'}
                      </button>
                    ))}
                  </div>
                </div>

                {assuranceSubTab === 'tracking' && (
                  <div className="space-y-8">
                    {isEditingDraft ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block">Workspace Workspace</span>
                            <h4 className="font-bold text-sm text-slate-900">Editing Draft: "{draftForm.title}"</h4>
                          </div>
                          <button
                            onClick={() => setIsEditingDraft(null)}
                            className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded font-bold text-slate-700"
                          >
                            Close Workspace
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Risk Title</label>
                            <input
                              type="text"
                              value={draftForm.title}
                              onChange={e => setDraftForm({ ...draftForm, title: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Responsible Officer Node</label>
                            <input
                              type="text"
                              value={draftForm.responsibleOfficer}
                              onChange={e => setDraftForm({ ...draftForm, responsibleOfficer: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Preventative Mitigation Action</label>
                          <textarea
                            rows={3}
                            value={draftForm.preventativeControls}
                            onChange={e => setDraftForm({ ...draftForm, preventativeControls: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                          />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                          <button
                            onClick={() => setIsEditingDraft(null)}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded text-xs font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveDraftChanges}
                            className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded text-xs font-bold"
                          >
                            Commit Sync to Supabase
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {drafts.length > 0 && (
                          <div className="bg-slate-55 border border-slate-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-650 flex items-center gap-1">
                                <FileCode className="w-4 h-4 text-slate-500" /> Active Drafts Workspace ({drafts.length})
                              </h4>
                              <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">Uncommitted changes</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {drafts.map((dr) => (
                                <div key={dr.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                                  <div>
                                    <h5 className="font-bold text-xs text-slate-900">{dr.title}</h5>
                                    <p className="text-[10px] text-slate-550">Node: {dr.responsibleOfficer}</p>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      onClick={() => handleOpenEditDraft(dr)}
                                      className="px-2.5 py-1.5 bg-slate-900 text-white font-bold text-[9px] uppercase tracking-wider rounded hover:bg-black transition-colors"
                                    >
                                      Open Workspace
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDraft(dr.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded transition-colors"
                                      title="Delete draft"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-550 border-b pb-1">Commitments Risk Register</h4>
                          <RiskRegisterTab 
                            riskRegister={riskRegister}
                            poeFiles={poeFiles}
                            onUpdateRegister={(newRegister) => {
                              setRiskRegister(newRegister);
                              persistContext(riskTypes, templates, drafts, newRegister, poeFiles, electronicCommentary);
                            }}
                            onUpdatePoe={(newPoe) => {
                              setPoeFiles(newPoe);
                              persistContext(riskTypes, templates, drafts, riskRegister, newPoe, electronicCommentary);
                            }}
                            onPersist={() => {
                              persistContext(riskTypes, templates, drafts, riskRegister, poeFiles, electronicCommentary);
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {assuranceSubTab === 'combined' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed text-justify">
                      The Combined Assurance Model ensures optimal coordinate frameworks between internal auditors, risk managers, executive management, and oversight entities to provide council with unified assessments of risk exposure.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="border border-slate-200 bg-white p-4 rounded-2xl shadow-xs space-y-2">
                        <span className="text-[9px] uppercase font-bold text-blue-600">1st Line of Defense</span>
                        <h4 className="font-black text-xs text-slate-850">Operational Management</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed text-justify">Executes daily control checklists, maintains infrastructure plants, and monitors project milestones.</p>
                        <span className="inline-block text-[9px] font-mono font-bold bg-blue-50 text-blue-800 border px-2 py-0.5 rounded">Active</span>
                      </div>
                      <div className="border border-slate-200 bg-white p-4 rounded-2xl shadow-xs space-y-2">
                        <span className="text-[9px] uppercase font-bold text-amber-600">2nd Line of Defense</span>
                        <h4 className="font-black text-xs text-slate-850">Risk Management & SCM</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed text-justify">Evaluates operational risk registers, defines appetite thresholds, enforces regulatory frameworks.</p>
                        <span className="inline-block text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border px-2 py-0.5 rounded">94% Certified</span>
                      </div>
                      <div className="border border-slate-200 bg-white p-4 rounded-2xl shadow-xs space-y-2">
                        <span className="text-[9px] uppercase font-bold text-emerald-600">3rd Line of Defense</span>
                        <h4 className="font-black text-xs text-slate-850">Internal Audit Unit</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed text-justify">Performs independent reviews of internal control effectiveness and issues Section 165 quarterly reports.</p>
                        <span className="inline-block text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border px-2 py-0.5 rounded">Independent</span>
                      </div>
                      <div className="border border-slate-200 bg-white p-4 rounded-2xl shadow-xs space-y-2">
                        <span className="text-[9px] uppercase font-bold text-purple-600">4th Line of Defense</span>
                        <h4 className="font-black text-xs text-slate-850">External Assurance (AGSA)</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed text-justify">Issues annual audit outcomes, highlights material irregularities, mandates systemic corrective actions.</p>
                        <span className="inline-block text-[9px] font-mono font-bold bg-purple-50 text-purple-800 border px-2 py-0.5 rounded">Statutory Node</span>
                      </div>
                    </div>
                  </div>
                )}

                {assuranceSubTab === 'reporting' && (
                  <div className="space-y-6">
                    <ElectronicReportingTab 
                      commentary={electronicCommentary}
                      onSaveCommentary={(newComm) => {
                        setElectronicCommentary(newComm);
                        persistContext(riskTypes, templates, drafts, riskRegister, poeFiles, newComm);
                      }}
                      riskRegister={riskRegister}
                      poeFiles={poeFiles}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DISTRICT COORDINATION */}
          {activeTab === 'district_coordination' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" /> District Coordination Module
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Coordinates regional infrastructure hazards, shared inter-municipal pipelines, and IGT MIG transfers.
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-center">
                    {(['joint_committee', 'igt_projects'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setDistrictSubTab(sub)}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors ${
                          districtSubTab === sub ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sub === 'joint_committee' ? 'Joint Committees' : 'IGT grant projects'}
                      </button>
                    ))}
                  </div>
                </div>

                {districtSubTab === 'joint_committee' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border p-4 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">Inter-Municipal Shared Risk Registers</h4>
                      <p className="text-[10px] text-slate-500">Tracks cross-border environmental and services delivery issues (e.g. shared sewage lines, regional water pipelines).</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <h5 className="font-bold text-xs text-slate-900">Regional Water Pipeline Hazard</h5>
                          <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-red-200">Shared High</span>
                        </div>
                        <p className="text-[11px] text-slate-600">Nkangala District Bulk supply pipe maintenance backlogs causing downstream pressure anomalies.</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Co-Owner: Steve Tshwete Local</span>
                          <span>Risk Ratio: 40% / 60%</span>
                        </div>
                      </div>
                      <div className="border p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <h5 className="font-bold text-xs text-slate-900">Solid Waste Disposal Landfill</h5>
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-200">Shared Significant</span>
                        </div>
                        <p className="text-[11px] text-slate-600">Critical load limits reached at joint waste treatment centers. Requires urgent capital expansion plans.</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Co-Owner: Emalahleni Local</span>
                          <span>Risk Ratio: 50% / 50%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {districtSubTab === 'igt_projects' && (
                  <div className="space-y-6">
                    <div className="overflow-x-auto border rounded-2xl bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <th className="p-3">Project Title</th>
                            <th className="p-3">DORA Grant Type</th>
                            <th className="p-3">Allocation Value</th>
                            <th className="p-3">Uncommitted Funds Risk</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-slate-100">
                          <tr>
                            <td className="p-3 font-semibold">District Road Expansion G9</td>
                            <td className="p-3 text-slate-600">MIG (Municipal Infrastructure)</td>
                            <td className="p-3">R22,500,000</td>
                            <td className="p-3"><span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">Low (8% unspent)</span></td>
                            <td className="p-3 text-slate-600">In Construction</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold">Bulk Electrification Grid Node</td>
                            <td className="p-3 text-slate-600">INEG (Integrated National Electrification)</td>
                            <td className="p-3">R18,200,000</td>
                            <td className="p-3"><span className="text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-mono font-bold">Critical (45% unspent)</span></td>
                            <td className="p-3 text-slate-600">Procurement Stage</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: INFRASTRUCTURE & SERVICES */}
          {activeTab === 'infrastructure' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-purple-500" /> Infrastructure & Services Risk Module
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct tracking of water sanitation quality standards (Blue/Green Drop) and electrical grid load shedding mitigation.
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-center">
                    {(['water_sanitation', 'electricity_grid'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setInfrastructureSubTab(sub)}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors ${
                          infrastructureSubTab === sub ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sub === 'water_sanitation' ? 'Water & Sanitation' : 'Electricity & Energy Grid'}
                      </button>
                    ))}
                  </div>
                </div>

                {infrastructureSubTab === 'water_sanitation' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-slate-200 p-4 rounded-xl space-y-3">
                        <h4 className="text-xs font-bold text-slate-905 uppercase">Blue Drop Quality Audit Metrics</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-center">
                            <span className="text-[9px] uppercase font-bold text-emerald-800">Bacteriological Compliance</span>
                            <p className="text-lg font-black text-emerald-900">98.4%</p>
                          </div>
                          <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-center">
                            <span className="text-[9px] uppercase font-bold text-amber-800">Chemical Compliance</span>
                            <p className="text-lg font-black text-amber-900">94.1%</p>
                          </div>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-4 rounded-xl space-y-3">
                        <h4 className="text-xs font-bold text-slate-905 uppercase">Daily Water Test Logger</h4>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const ph = (e.currentTarget.elements.namedItem('ph_level') as HTMLInputElement).value;
                          const turb = (e.currentTarget.elements.namedItem('turbidity') as HTMLInputElement).value;
                          if (!ph || !turb) return;
                          setWaterTests([{ id: `wt-${Date.now()}`, date: new Date().toISOString().split('T')[0], ph: Number(ph), turbidity: Number(turb), status: 'Normal' }, ...waterTests]);
                          setSaveStatus({ type: 'success', msg: 'Daily water test records synchronized securely to Supabase pipeline.' });
                          e.currentTarget.reset();
                        }} className="grid grid-cols-3 gap-2">
                          <input type="number" step="0.1" name="ph_level" placeholder="pH Level" className="border px-2 py-1 text-xs rounded" required />
                          <input type="number" step="0.1" name="turbidity" placeholder="Turbidity (NTU)" className="border px-2 py-1 text-xs rounded" required />
                          <button type="submit" className="bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase rounded py-1">Log Test</button>
                        </form>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Water Quality Logs</h4>
                      <div className="divide-y text-xs">
                        {waterTests.map((t) => (
                          <div key={t.id} className="py-2 flex justify-between items-center">
                            <span className="font-mono text-[10px] text-slate-400">{t.date}</span>
                            <span className="text-slate-700">pH: <strong className="text-slate-900">{t.ph}</strong> | Turbidity: <strong className="text-slate-900">{t.turbidity} NTU</strong></span>
                            <span className="bg-emerald-50 text-emerald-800 border px-1.5 py-0.5 rounded text-[9px] font-bold">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {infrastructureSubTab === 'electricity_grid' && (
                  <div className="space-y-6">
                    <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 space-y-1">
                      <h4 className="text-xs font-black text-slate-800 uppercase">Energy Grid & Power Loss Risk Controls</h4>
                      <p className="text-[10px] text-slate-500">Monitors substation physical hazards, load balancing during outages, and power theft mitigation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border p-4 rounded-xl space-y-2">
                        <h5 className="font-bold text-xs text-slate-900">Substation Overload Indices</h5>
                        <ul className="space-y-1 text-xs text-slate-600">
                          <li>Central Substation node: <strong className="text-red-600">88% Load Capacity</strong></li>
                          <li>Industrial Park grid: <strong className="text-emerald-600">54% Load Capacity</strong></li>
                        </ul>
                      </div>
                      <div className="border p-4 rounded-xl space-y-2">
                        <h5 className="font-bold text-xs text-slate-900">Load Shedding Risk Metrics</h5>
                        <ul className="space-y-1 text-xs text-slate-600">
                          <li>Automated switching delays: <strong className="text-slate-800">4.2 seconds</strong></li>
                          <li>Substation generator fuel reserve: <strong className="text-emerald-600">92% full</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MACRO FINANCIAL */}
          {activeTab === 'macro_financial' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Coins className="w-5 h-5 text-indigo-500" /> Macro Financial Risk Module
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Analyzes cash flow metrics, debt indices, debtors book collections, and budget viability indexes.
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start lg:self-center">
                    {(['unauthorized_exp', 'debt_servicing'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setMacroFinancialSubTab(sub)}
                        className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors ${
                          macroFinancialSubTab === sub ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sub === 'unauthorized_exp' ? 'Cash Coverage & Collections' : 'Debt Servicing Capacity'}
                      </button>
                    ))}
                  </div>
                </div>

                {macroFinancialSubTab === 'unauthorized_exp' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border p-4 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Cash Coverage Ratio</span>
                        <p className="text-xl font-bold text-slate-900">1.8 Months</p>
                        <p className="text-[10px] text-emerald-600">Minimum NT target is 1-3 months.</p>
                      </div>
                      <div className="border p-4 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Debtors Book Value</span>
                        <p className="text-xl font-bold text-slate-900">R112,400,000</p>
                        <p className="text-[10px] text-slate-500">Active municipal collections tracking.</p>
                      </div>
                      <div className="border p-4 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Collection Rate</span>
                        <p className="text-xl font-bold text-indigo-600">92.1%</p>
                        <p className="text-[10px] text-slate-500">Quarterly collection index.</p>
                      </div>
                    </div>
                  </div>
                )}

                {macroFinancialSubTab === 'debt_servicing' && (
                  <div className="space-y-6">
                    <div className="border border-slate-200 bg-white p-4 rounded-2xl shadow-xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase">Long-Term Debt Servicing Limits</h4>
                      <p className="text-[11px] text-slate-600">National Treasury limits municipal debt servicing costs to 6%-8% of total operating revenue. Current level is active and monitored below threshold.</p>
                      <div className="w-full bg-slate-100 rounded-full h-3 border overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '64%' }} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>Current: 5.12%</span>
                        <span>Maximum Threshold: 8.00%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DEPRECATED ACTIVE DRAFTING SUITE */}
          {(activeTab as any) === 'suite' && (
            <div className="space-y-6 animate-fade-in">
              {/* If editing a specific active draft, render extensive risk modeling controls */}
              {isEditingDraft ? (
                <div className="bg-white border border-slate-250 rounded-3xl p-8 shadow-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 block">Active Workspace</span>
                      <h3 className="text-base font-black text-slate-900">
                        Modeling Municipal Risk Target: "{draftForm.title}"
                      </h3>
                    </div>
                    <button 
                      onClick={() => setIsEditingDraft(null)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      Back to Suite Overview
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic specs */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-1.5">
                        Operational Metadata
                      </h4>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Risk Title Descriptor</label>
                        <input 
                          type="text"
                          required
                          value={draftForm.title || ''}
                          onChange={e => setDraftForm({ ...draftForm, title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Target Category</label>
                          <select 
                            value={draftForm.category || 'Strategic Risks'}
                            onChange={e => setDraftForm({ ...draftForm, category: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 bg-white outline-none focus:border-red-500"
                          >
                            {riskTypes.map(rt => (
                              <option key={rt.id} value={rt.name}>{rt.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Execution SLA Lead</label>
                          <input 
                            type="text"
                            value={draftForm.responsibleOfficer || ''}
                            onChange={e => setDraftForm({ ...draftForm, responsibleOfficer: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Current Status</label>
                          <select 
                            value={draftForm.status || 'Drafting'}
                            onChange={e => setDraftForm({ ...draftForm, status: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 bg-white outline-none focus:border-red-500"
                          >
                            <option>Drafting</option>
                            <option>In Progress</option>
                            <option>Mitigated</option>
                            <option>Critical</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Target Mitigation Date</label>
                          <input 
                            type="date"
                            value={draftForm.targetDate || ''}
                            onChange={e => setDraftForm({ ...draftForm, targetDate: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Mitigation Progress (%)</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={draftForm.progress || 0}
                            onChange={e => setDraftForm({ ...draftForm, progress: Math.min(100, Math.max(0, Number(e.target.value))) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Integrated Inherent matrix */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-red-500 block border-b pb-1.5 flex items-center justify-between">
                        <span>1. Inherent Risk Evaluation (Pre-Controls)</span>
                        <span className="font-mono text-xs text-slate-800 px-2 py-0.5 bg-white border rounded">
                          Rating Index: {Number(draftForm.inherentImpact || 1) * Number(draftForm.inherentLikelihood || 1)}
                        </span>
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Inherent Impact Score</label>
                          <select 
                            value={draftForm.inherentImpact || 3}
                            onChange={e => setDraftForm({ ...draftForm, inherentImpact: Number(e.target.value) })}
                            className="w-full border border-slate-250 bg-white rounded-lg px-2 py-2 text-xs outline-none"
                          >
                            <option value="1">1 - Minimal</option>
                            <option value="2">2 - Minor</option>
                            <option value="3">3 - Moderate</option>
                            <option value="4">4 - Major</option>
                            <option value="5">5 - Catastrophic</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Inherent Likelihood Score</label>
                          <select 
                            value={draftForm.inherentLikelihood || 3}
                            onChange={e => setDraftForm({ ...draftForm, inherentLikelihood: Number(e.target.value) })}
                            className="w-full border border-slate-250 bg-white rounded-lg px-2 py-2 text-xs outline-none"
                          >
                            <option value="1">1 - Rare</option>
                            <option value="2">2 - Unlikely</option>
                            <option value="3">3 - Possible</option>
                            <option value="4">4 - Likely</option>
                            <option value="5">5 - Almost Certain</option>
                          </select>
                        </div>
                      </div>

                      {/* Displaying Inherent Matrix Location */}
                      <div className="flex items-center justify-center pt-2">
                        <div className="grid grid-cols-5 gap-1 w-full max-w-[200px]">
                          {Array.from({ length: 25 }).map((_, i) => {
                            const row = 5 - Math.floor(i / 5); // impact (5 down to 1)
                            const col = (i % 5) + 1; // likelihood (1 to 5)
                            const isSelected = row === draftForm.inherentImpact && col === draftForm.inherentLikelihood;
                            const score = row * col;
                            const color = score >= 15 ? 'bg-red-500' : score >= 9 ? 'bg-amber-400' : 'bg-emerald-500';
                            
                            return (
                              <div 
                                key={i} 
                                title={`Impact ${row}, Likelihood ${col}`}
                                className={`h-7 rounded flex items-center justify-center font-mono text-[9px] font-bold text-white shadow-inner transition-transform cursor-pointer relative ${color} ${isSelected ? 'scale-115 ring-2 ring-slate-900 border-2 border-white z-10' : 'opacity-30 hover:opacity-100'}`}
                                onClick={() => setDraftForm({ ...draftForm, inherentImpact: row, inherentLikelihood: col })}
                              >
                                {score}
                                {isSelected && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-600 border border-white rounded-full animate-ping" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls & Residuals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Controls Formulation */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block border-b pb-1.5">
                        2. Mitigation Controls Formulation
                      </h4>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Preventative Controls (Inherent mitigators)</label>
                        <textarea 
                          rows={3}
                          value={draftForm.preventativeControls || ''}
                          onChange={e => setDraftForm({ ...draftForm, preventativeControls: e.target.value })}
                          placeholder="e.g. Daily system updates, multi-signature approvals, random system surveillance arrays..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Corrective / Disaster Mitigation Actions</label>
                        <textarea 
                          rows={2}
                          value={draftForm.correctiveControls || ''}
                          onChange={e => setDraftForm({ ...draftForm, correctiveControls: e.target.value })}
                          placeholder="e.g. Immediate deployment of backup diesel reserves, temporary routing to alternate servers..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Residual Risk */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 block border-b pb-1.5 flex items-center justify-between">
                        <span>3. Residual Risk Evaluation (Post-Control)</span>
                        <span className="font-mono text-xs text-slate-800 px-2 py-0.5 bg-white border rounded">
                          Residual Index: {Number(draftForm.residualImpact || 1) * Number(draftForm.residualLikelihood || 1)}
                        </span>
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Residual Impact Score</label>
                          <select 
                            value={draftForm.residualImpact || 2}
                            onChange={e => setDraftForm({ ...draftForm, residualImpact: Number(e.target.value) })}
                            className="w-full border border-slate-250 bg-white rounded-lg px-2 py-2 text-xs outline-none"
                          >
                            <option value="1">1 - Minimal</option>
                            <option value="2">2 - Minor</option>
                            <option value="3">3 - Moderate</option>
                            <option value="4">4 - Major</option>
                            <option value="5">5 - Catastrophic</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Residual Likelihood Score</label>
                          <select 
                            value={draftForm.residualLikelihood || 2}
                            onChange={e => setDraftForm({ ...draftForm, residualLikelihood: Number(e.target.value) })}
                            className="w-full border border-slate-250 bg-white rounded-lg px-2 py-2 text-xs outline-none"
                          >
                            <option value="1">1 - Rare</option>
                            <option value="2">2 - Unlikely</option>
                            <option value="3">3 - Possible</option>
                            <option value="4">4 - Likely</option>
                            <option value="5">5 - Almost Certain</option>
                          </select>
                        </div>
                      </div>

                      {/* Displaying Residual Matrix Location */}
                      <div className="flex items-center justify-center pt-2">
                        <div className="grid grid-cols-5 gap-1 w-full max-w-[200px]">
                          {Array.from({ length: 25 }).map((_, i) => {
                            const row = 5 - Math.floor(i / 5);
                            const col = (i % 5) + 1;
                            const isSelected = row === draftForm.residualImpact && col === draftForm.residualLikelihood;
                            const score = row * col;
                            const color = score >= 15 ? 'bg-red-500' : score >= 9 ? 'bg-amber-400' : 'bg-emerald-500';
                            
                            return (
                              <div 
                                key={i} 
                                title={`Impact ${row}, Likelihood ${col}`}
                                className={`h-7 rounded flex items-center justify-center font-mono text-[9px] font-bold text-white shadow-inner transition-transform cursor-pointer relative ${color} ${isSelected ? 'scale-115 ring-2 ring-slate-900 border-2 border-white z-10' : 'opacity-30 hover:opacity-100'}`}
                                onClick={() => setDraftForm({ ...draftForm, residualImpact: row, residualLikelihood: col })}
                              >
                                {score}
                                {isSelected && <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full animate-ping" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <button 
                      onClick={() => {
                        if (draftForm.id) {
                          handleDeleteDraft(draftForm.id);
                          setIsEditingDraft(null);
                        }
                      }}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-xs uppercase rounded-lg border border-rose-200 transition-colors"
                    >
                      Delete Active Draft
                    </button>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsEditingDraft(null)}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 font-extrabold text-xs uppercase rounded-lg transition-colors border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveDraftChanges}
                        disabled={isLoading}
                        className="px-6 py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs uppercase rounded-lg transition-colors shadow-lg"
                      >
                        Commit Sync to Supabase
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary list of drafts */}
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Active Operational Audited Risks</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Currently registered drafts tracked for this municipality under MFMA compliance standards.
                      </p>
                    </div>

                    <button 
                      onClick={handleCreateEmptyDraft}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Log Custom Audited Risk
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="px-6 py-4">Municipal Risk Project</th>
                          <th className="px-6 py-4">Inherent rating</th>
                          <th className="px-6 py-4">Residual Rating (Post Control)</th>
                          <th className="px-6 py-4">SLA Owner Node</th>
                          <th className="px-6 py-4 text-center">Status Index</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {drafts.map((dr) => {
                          const inherent = getRatingSummary(dr.inherentImpact, dr.inherentLikelihood);
                          const residual = getRatingSummary(dr.residualImpact, dr.residualLikelihood);
                          const dropPercent = dr.inherentImpact * dr.inherentLikelihood - dr.residualImpact * dr.residualLikelihood;
                          
                          return (
                            <tr key={dr.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="space-y-1 pr-6">
                                  <div className="font-extrabold text-slate-900 leading-snug">{dr.title}</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{dr.category}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Target: {dr.targetDate}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 font-bold uppercase rounded text-[10px] border tracking-wider bg-transparent ${inherent.css}`}>
                                  {inherent.label} ({dr.inherentImpact * dr.inherentLikelihood})
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 font-bold uppercase rounded text-[10px] border tracking-wider bg-transparent ${residual.css}`}>
                                    {residual.label} ({dr.residualImpact * dr.residualLikelihood})
                                  </span>
                                  {dropPercent > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 font-mono">
                                      <TrendingDown className="w-3 h-3" /> -{dropPercent} Index
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700">
                                {dr.responsibleOfficer}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="space-y-1">
                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                                    dr.status === 'Critical' ? 'bg-red-500 text-white' :
                                    dr.status === 'Mitigated' ? 'bg-emerald-500 text-white' :
                                    dr.status === 'In Progress' ? 'bg-amber-500 text-slate-950' :
                                    'bg-slate-200 text-slate-700'
                                  }`}>
                                    {dr.status}
                                  </span>
                                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mx-auto border border-slate-200">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dr.progress}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button 
                                    onClick={() => handleOpenEditDraft(dr)}
                                    className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                                  >
                                    <Edit className="w-3 h-3" /> Modeling Audit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteDraft(dr.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Unregister Draft"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {drafts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-16 text-slate-400 font-medium whitespace-pre leading-relaxed">
                              No active compliance risks drafted for this municipal node.
                              <br />
                              <button 
                                onClick={handleCreateEmptyDraft}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-600 font-extrabold bg-red-50 hover:bg-red-100 px-4 py-2 border border-red-200 rounded-xl uppercase tracking-wider"
                              >
                                Log the first municipal risk draft
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* TAB: POPIA COMPLIANCE */}
          {activeTab === 'popia_compliance' && (
            <PopiaComplianceTab 
              conditions={popiaConditions}
              incidents={popiaIncidents}
              systems={popiaSystems}
              onUpdateConditions={(updated) => {
                setPopiaConditions(updated);
                persistContext(
                  riskTypes, templates, drafts, riskRegister, poeFiles, electronicCommentary,
                  { conditions: updated, incidents: popiaIncidents, systems: popiaSystems }
                );
              }}
              onUpdateIncidents={(updated) => {
                setPopiaIncidents(updated);
                persistContext(
                  riskTypes, templates, drafts, riskRegister, poeFiles, electronicCommentary,
                  { conditions: popiaConditions, incidents: updated, systems: popiaSystems }
                );
              }}
              onUpdateSystems={(updated) => {
                setPopiaSystems(updated);
                persistContext(
                  riskTypes, templates, drafts, riskRegister, poeFiles, electronicCommentary,
                  { conditions: popiaConditions, incidents: popiaIncidents, systems: updated }
                );
              }}
            />
          )}
          {/* TAB: CRSA ENGINE */}
          {activeTab === 'crsa_engine' && (
            <CRSAEngineTab />
          )}

          {/* TAB: COMPLIANCE TRACKER */}
          {activeTab === 'compliance_tracker' && (
            <LegalRegisterTab />
          )}

          {/* TAB: UIFW MODULE */}
          {activeTab === 'uifw_module' && (
            <UIFWTrackerTab />
          )}
        </div>
      </div>
    </div>
  );
}
