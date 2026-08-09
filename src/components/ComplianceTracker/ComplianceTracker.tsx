import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, FileText, BookOpen, AlertTriangle, ShieldCheck, 
  ChevronRight, ArrowRight, Download, Search, Printer, HelpCircle, 
  CheckCircle2, XCircle, AlertCircle, FileBarChart, Loader2, Info, FolderOpen
} from 'lucide-react';
import { cn } from '../Branding';

interface ComplianceTrackerProps {
  currentUser: any;
  activeTenantId: string;
}

// 6 Documents data list
interface LegislationDocument {
  id: string;
  title: string;
  fileName: string;
  type: string;
  size: string;
  date: string;
  content: string[];
}

const LEGISLATION_DOCS: LegislationDocument[] = [
  {
    id: 'ethic-lead',
    title: 'Code for Ethical Leadership',
    fileName: 'code_for_ethical_leadership.pdf',
    type: 'Ethical Guidelines',
    size: '1.2 MB',
    date: '2023-11-01',
    content: [
      "CHAPTER 1: RATIONALE & PURPOSE\nEthical leadership is an absolute prerequisite for successful developmental local government as envisaged by the Constitution. It is ultimately a moral choice by individual leaders and the collective municipal council.",
      "THE OUTCOMES OF ETHICAL LEADERSHIP:\n1. An Ethical Culture: Building an environment where doing the right thing is simple and expected.\n2. Well-Functioning Municipality: Driven by accountability and professional service delivery.\n3. Public Trust: Strengthening trust between the municipality and its communities.",
      "THE SPIRIT OF ETHICAL LEADERSHIP:\nLeading in the long-term sustainable interest of the municipality and all its communities over personal, party-political, or factional interests.",
      "7 PRINCIPLES OF ETHICAL MUNICIPAL LEADERSHIP:\nPrinciple 1: An ethical municipal leader sets the tone for an ethical culture.\nPrinciple 2: An ethical municipal leader follows a community-centred approach to governance.\nPrinciple 3: An ethical municipal leader respects the boundary between the political and administrative spheres.\nPrinciple 4: An ethical municipal leader ensures the appointment of staff who have competence and integrity.\nPrinciple 5: An ethical municipal leader ensures the appropriate level of competence, integrity, and diversity on committees and oversight structures.\nPrinciple 6: An ethical municipal leader deals fairly and decisively with ethics transgressions and poor performance.\nPrinciple 7: An ethical municipal leader engages respectfully and constructively with other leaders."
    ]
  },
  {
    id: 'pms-guide',
    title: 'PMS Guide',
    fileName: 'pms_guide_political_stream.pdf',
    type: 'Performance Training Manual',
    size: '2.6 MB',
    date: '2019-06-15',
    content: [
      "UNIT 1: CONCEPT OF PERFORMANCE MANAGEMENT\nPerformance management is a strategic approach that equips leaders, managers, and stakeholders with tools to plan, monitor, measure, and review performance against Integrated Development Plans (IDPs) and the SDBIP.",
      "UNIT 2: LEGALLY MANDATED PHASES\nBased on MSA Sec 41, municipalities must follow an annual municipal cycle comprising:\n1. Planning and Review\n2. Monitoring\n3. Reporting\n4. Evaluation and Consequence Management",
      "UNIT 3: KEY PERFORMANCE TIMELINES & AUDITING\n- Monthly financial and quarterly performance reports accumulate progress against SDBIP objectives.\n- Mid-year reviews (S72) must inform adjustments to budgets and plans by January 25th.\n- Unaudited Annual Performance Reports must be compiled by August for submission to the Auditor-General.",
      "UNIT 4: THE BALANCED SCORECARD & LOGIC MODEL\nIntegrating the Logic Model (Inputs, Processes, Outputs, Outcomes, Impacts) with the Balanced Scorecard secures balanced reporting across financial, customer, operational, and development metrics."
    ]
  },
  {
    id: 'muni-scm',
    title: 'Local Government Municipal Supply Chain',
    fileName: 'local_government_municipal_supply_chain.pdf',
    type: 'Finance & Procurement Regulation',
    size: '1.8 MB',
    date: '2017-01-20',
    content: [
      "CHAPTER 1: ESTABLISHMENT OF SUPPLY CHAIN POLICIES\nSection 111 of the MFMA mandates every municipality to adopt and implement an SCM Policy that is fair, equitable, transparent, competitive, and cost-effective.",
      "CHAPTER 2: RANGE OF PROCUREMENT PROCESSES\n1. Petty Cash Purchases: Up to a transaction value of R2,000 (VAT included).\n2. Written/Verbal Quotations: Over R2,000 up to R10,000 (VAT included).\n3. Formal Written Price Quotations: Over R10,000 up to R200,000 (VAT included). Requires a 7-day website advertising threshold.\n4. Competitive Bidding: Above R200,000 and for long-term contracts. Requires formal public invitation and evaluation.",
      "CHAPTER 3: SCM COMMITTEE SYSTEM FOR COMPETITIVE BIDS\nRegulation 26 requires a three-tier committee system:\n- Bid Specification Committee (compiles unbiased criteria)\n- Bid Evaluation Committee (evaluates bids and verifies tax/rate compliance)\n- Bid Adjudication Committee (recommends or awards standard contracts)",
      "CHAPTER 4: ETHICAL STANDARDS & CONSEQUENCES\nSCM officials and councillors are strictly barred from participating in bids where there are direct conflicts of interest (Regulation 44). Gifts over R350 must be recorded in an interest disclosure register."
    ]
  },
  {
    id: 'nat-treasury',
    title: 'National Treasury',
    fileName: 'national_treasury_compliance_framework.pdf',
    type: 'Treasury Guidelines & Outlines',
    size: '3.1 MB',
    date: '2005-08-10',
    content: [
      "SECTION 1: TREASURY OVERSIGHT ROLES\nNational Treasury is established in terms of section 5 of the PFMA and is tasked with enforcing financial compliance, monitoring municipal budgets, and assessing SDBIP execution across all municipalities.",
      "SECTION 2: REPORTING STRUCTURES & TIMELINES\nIn accordance with Treasury framework regulations:\n- Monthly Budget Statements (Section 71) must be submitted within 10 working days of month-end.\n- Quarterly Compliance Reports must present consolidated progress on conditional grants, capital budget performance, and debt management levels.",
      "SECTION 3: CONSEQUENCES OF REMISS COMPLIANCE\nProvincial and National Treasury hold statutory powers to withhold conditional grants (Section 38), issue compliance recommendations, and request financial recovery plans for municipalities in deep systemic distress."
    ]
  },
  {
    id: 'mfma-act',
    title: 'MFMA Act 56 of 2003',
    fileName: 'mfma_act_56_of_2003.pdf',
    type: 'Statutory Legislation',
    size: '4.5 MB',
    date: '2004-02-13',
    content: [
      "CHAPTER 4: MUNICIPAL BUDGETS\nEvery municipality must approve an annual budget before the start of the financial year. Budget preparation must be coordinated by the Mayor in line with S53, accompanied by draft resolutions and the SDBIP.",
      "CHAPTER 8: RESPONSIBILITIES OF ACCOUNTING OFFICERS\nSection 60 names the Municipal Manager as the Accounting Officer. S62 details the general fiduciary and financial responsibilities, including managing municipal assets, keeping full records, and maintaining proper internal controls.",
      "SECTION 32: UNAUTHORISED, IRREGULAR, OR FRUITLESS & WASTEFUL EXPENDITURE (UIFWE)\nRules governing liability and recovery of unauthorized, irregular, or fruitless and wasteful expenditure. Councillors and officials who deliberately or negligently commit such expenditure are personally liable.",
      "CHAPTER 12: FINANCIAL REPORTING AND AUDITING\nSection 121 mandates the compilation of an Annual Report. It must contain the annual financial statements, the Auditor-General's audit report on performance information, and details of consequence management."
    ]
  },
  {
    id: 'mscoa-reg',
    title: 'mSCOA',
    fileName: 'mscoa_regulations_standard_chart_accounts.pdf',
    type: 'Standard Chart of Accounts',
    size: '5.2 MB',
    date: '2014-04-22',
    content: [
      "REGULATION 4: STANDARD SEGMENTS\nmSCOA mandates that every transaction recorded in the municipal general ledger must be classified according to seven primary multi-dimensional segments to maintain standardized whole-of-government reporting.",
      "THE SEVEN MANDATED SEGMENTS:\n1. Funding Segment (direct funding sources like grants or rates)\n2. Function Segment (operational municipal functions like electricity or sanitation)\n3. Municipal Standard Classification (organizational department structure)\n4. Project Segment (all capital and operating projects identified in the IDP)\n5. Regional Indicator (geographical block beneficiating from expenditure)\n6. Item Segment (accounting transaction type - assets, liabilities, revenue, expense)\n7. Costing Segment (internal secondary costing recoveries and allocations)",
      "REGULATION 7: MINIMUM SYSTEM & BUSINESS PROCESSES\nMunicipalities must operate certified ERP transaction processing systems that align completely with the prescribed standard chart data segments. Interfacing or spreadsheet data extrapolation is strictly prohibited."
    ]
  }
];

// Tracking Modules definitions & criteria
interface ComplianceModule {
  id: string;
  name: string;
  description: string;
  referencedDocIds: string[];
  mandatoryCriteria: {
    id: string;
    text: string;
    ref: string;
    isCompliant: boolean;
  }[];
}

export function ComplianceTracker({ currentUser, activeTenantId }: ComplianceTrackerProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'legislation' | 'tracking' | 'report'>('brief');
  const [selectedDoc, setSelectedDoc] = useState<LegislationDocument>(LEGISLATION_DOCS[0]);
  const [legislationSearch, setLegislationSearch] = useState('');
  const [activeQuarter, setActiveQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');

  // Load the initial questionnaire data for compliance evaluation
  // Keys represent: moduleId_criterionId -> boolean
  const [auditAnswers, setAuditAnswers] = useState<Record<string, boolean>>({});

  // Dynamic state list representing compliance modules with hardcoded evaluation criteria
  const COMPLIANCE_MODULES: ComplianceModule[] = [
    {
      id: 'apr',
      name: 'Annual Performance Report',
      description: 'Review performance report against targets, audited comparative data, and and SDBIP inputs.',
      referencedDocIds: ['mfma-act', 'pms-guide'],
      mandatoryCriteria: [
        { id: 'apr-1', text: 'Comparison with SDBIP targets of the previous year (Sec 46 of Systems Act)', ref: 'PMS Guide / Systems Act Sec 46', isCompliant: true },
        { id: 'apr-2', text: 'Evaluation on performance metrics by external AG Audit team', ref: 'MFMA Sec 121(3)', isCompliant: true },
        { id: 'apr-3', text: 'Involvement of general public and ward structures in setting thresholds', ref: 'PMS Guide Unit 4.14', isCompliant: true },
        { id: 'apr-4', text: 'Submission to MEC and provincial treasury inside 10 days post-adoption', ref: 'PMS Guide Unit 4.15', isCompliant: false },
      ]
    },
    {
      id: 'ar',
      name: 'Annual Report',
      description: 'Audit report and disclosure on intergovenmental grants and consequence actions.',
      referencedDocIds: ['mfma-act', 'nat-treasury'],
      mandatoryCriteria: [
        { id: 'ar-1', text: 'Contains Audited Annual Financial Statements (AFS) exactly', ref: 'MFMA Act Sec 121(3)(a)', isCompliant: true },
        { id: 'ar-2', text: 'Includes disclosure of salary benefits of Mayor, CFO, and MM', ref: 'MFMA S124', isCompliant: true },
        { id: 'ar-3', text: 'Voted on S129 oversight report within two months of tabling', ref: 'MFMA S129', isCompliant: true },
        { id: 'ar-4', text: 'Published in full on municipal website within five days of public tabling', ref: 'MFMA S75', isCompliant: false }
      ]
    },
    {
      id: 'cm',
      name: 'Change Management',
      description: 'Adoption and execution of municipal change templates and ICT systems policies.',
      referencedDocIds: ['ethic-lead', 'pms-guide'],
      mandatoryCriteria: [
        { id: 'cm-1', text: 'Involvement of all leadership and administrative divisions in SDBIP transitions', ref: 'PMS Guide S5.3.3', isCompliant: true },
        { id: 'cm-2', text: 'Institutionalized change management committee with clear lines of authority', ref: 'PMS Guide S5.3.3', isCompliant: true },
        { id: 'cm-3', text: 'Regular workshops conducted for staff training and readiness outcomes', ref: 'Ethical Leadership Principle 1', isCompliant: false }
      ]
    },
    {
      id: 'idp',
      name: 'IDP (Integrated Development Plan)',
      description: 'Five-year tactical service development framework integrated into local council approvals.',
      referencedDocIds: ['mfma-act', 'pms-guide'],
      mandatoryCriteria: [
        { id: 'idp-1', text: 'Adopted single inclusive development roadmap matching budget targets', ref: 'Systems Act S25 / PMS S3.2', isCompliant: true },
        { id: 'idp-2', text: 'Includes the legally required core components (Sec 26 of Systems Act)', ref: 'PMS Guide S3.7.1', isCompliant: true },
        { id: 'idp-3', text: 'Public consultation sessions held prior to adoption of draft framework', ref: 'PMS Guide S3.4', isCompliant: true },
        { id: 'idp-4', text: 'Allocated budget projections match current three-year MTREF estimates', ref: 'MFMA S18 / IDP Alignment', isCompliant: true }
      ]
    },
    {
      id: 'kpa',
      name: 'Key Performance Area',
      description: 'Establishment of service programs and capital investments linked to core focus pillars.',
      referencedDocIds: ['pms-guide', 'mscoa-reg'],
      mandatoryCriteria: [
        { id: 'kpa-1', text: 'Structured around the five key national performance sectors', ref: 'PMS Guide S3.5.2', isCompliant: true },
        { id: 'kpa-2', text: 'Directly mapped to mSCOA function Segments (sanitation, electricity, water)', ref: 'mSCOA Segment Regulation 4', isCompliant: true },
        { id: 'kpa-3', text: 'Objectives clearly state intended outcome benchmarks', ref: 'PMS S3.5.2', isCompliant: true }
      ]
    },
    {
      id: 'kpi',
      name: 'Key Performance Indicator',
      description: 'Definition and calculation metrics of municipal KPIs, checked against SMART criteria.',
      referencedDocIds: ['pms-guide'],
      mandatoryCriteria: [
        { id: 'kpi-1', text: 'KPIs follow the SMART parameters (Specific, Measurable, Action-oriented, Realistic, Time-specific)', ref: 'PMS Guide S4.3.4', isCompliant: true },
        { id: 'kpi-2', text: 'Performance targets are easily calculable and verified at reasonable cost', ref: 'PMS Guide S4.3.3', isCompliant: true },
        { id: 'kpi-3', text: 'Includes the seven mandated national key indicators', ref: 'PMS Guide S2.4.1', isCompliant: false },
        { id: 'kpi-4', text: 'Integrated into employment contracts of Section 56 senior staff', ref: 'PMS Guide S2.4.2', isCompliant: true }
      ]
    },
    {
      id: 'led',
      name: 'LED Projects',
      description: 'Regional economic development investments and spatial goals compliance tracking.',
      referencedDocIds: ['pms-guide'],
      mandatoryCriteria: [
        { id: 'led-1', text: 'Projects align thoroughly with local economic development goals', ref: 'PMS Guide S3.6.3', isCompliant: true },
        { id: 'led-2', text: 'Fund allocation clearly delineated and approved by council', ref: 'PMS Guide S3.6.3', isCompliant: true },
        { id: 'led-3', text: 'Impact assessment benchmarks defined to evaluate job creation rates', ref: 'PMS Guide S3.6.3', isCompliant: false }
      ]
    },
    {
      id: 'mtas',
      name: 'MTAS (Municipal Turnaround Strategy)',
      description: 'Strategic turnaround frameworks aligned to provincial emergency recommendations.',
      referencedDocIds: ['mfma-act', 'nat-treasury'],
      mandatoryCriteria: [
        { id: 'mtas-1', text: 'Identified critical distress triggers in line with treasury indices', ref: 'MFMA Chapter 13 Recovery', isCompliant: true },
        { id: 'mtas-2', text: 'Adopted remedial steps addressing irregular and unauthorized expenditure', ref: 'MFMA Sec 32 Compliance', isCompliant: true },
        { id: 'mtas-3', text: 'Monthly reporting to Mayor and provincial MEC on recovery objectives', ref: 'MFMA Sec 145 / MTAS', isCompliant: false }
      ]
    },
    {
      id: 'omm',
      name: 'Office of the MM',
      description: 'General MM administrative duties, fiduciary guidelines, and oversight processes.',
      referencedDocIds: ['mfma-act', 'ethic-lead'],
      mandatoryCriteria: [
        { id: 'omm-1', text: 'MM provides comprehensive regulatory compliance guidance to staff & council', ref: 'MFMA Sec 60(b)', isCompliant: true },
        { id: 'omm-2', text: 'Signatures on contracts and documents comply with delegation levels', ref: 'MFMA Sec 79', isCompliant: true },
        { id: 'omm-3', text: 'Ethical conduct standards implemented as MM sets administrative tone', ref: 'Ethical Leadership Principle 4', isCompliant: true },
        { id: 'omm-4', text: 'MM declares all financial interests on date of assumption', ref: 'MFMA Act Sec 69(ii)', isCompliant: true }
      ]
    },
    {
      id: 'rm',
      name: 'Risk Management',
      description: 'Evaluation of risk registers, internal controls checks, and internal audit unit mandates.',
      referencedDocIds: ['mfma-act', 'muni-scm'],
      mandatoryCriteria: [
        { id: 'rm-1', text: 'Maintains independent risk register reviewed quarterly by risk unit', ref: 'MFMA Sec 62(1)(c)', isCompliant: true },
        { id: 'rm-2', text: 'Adopted comprehensive SCM risk mitigation procedures', ref: 'SCM Regulation 41', isCompliant: true },
        { id: 'rm-3', text: 'Maintains active internal audit committee with non-executive majority', ref: 'MFMA Sec 166', isCompliant: true },
        { id: 'rm-4', text: 'Internal audit reviews compliance on standard procurement parameters', ref: 'MFMA Sec 165', isCompliant: false }
      ]
    },
    {
      id: 'sdbip',
      name: 'SDBIP Top Layer',
      description: 'Service delivery implementation target sheets, projections, and monthly reports.',
      referencedDocIds: ['mfma-act', 'pms-guide'],
      mandatoryCriteria: [
        { id: 'sdbip-1', text: 'Projections on monthly revenue collections clearly outlined', ref: 'MFMA Sec 53 SDBIP Define', isCompliant: true },
        { id: 'sdbip-2', text: 'Quarterly targets defined for service delivery operations', ref: 'PMS Guide S4.5 SDBIP', isCompliant: true },
        { id: 'sdbip-3', text: 'Adopted within 28 days of national budget approvals', ref: 'MFMA Sec 53(1)(c)(ii)', isCompliant: true },
        { id: 'sdbip-4', text: 'SDBIP revisions accepted primarily via adjustive council budget sessions', ref: 'MFMA Sec 54(1)(c)', isCompliant: false }
      ]
    },
    {
      id: 'so',
      name: 'Strategic Objectives',
      description: 'Delineation of medium-term strategic goals mapped back to IDP service areas.',
      referencedDocIds: ['pms-guide'],
      mandatoryCriteria: [
        { id: 'so-1', text: 'Objectives align exactly to community spatial design needs', ref: 'PMS Guide S3.5.3', isCompliant: true },
        { id: 'so-2', text: 'Delineates responsibilities down to specific execution divisions', ref: 'PMS Guide S3.6.3', isCompliant: true },
        { id: 'so-3', text: 'Approved formally by council alongside IDP framework documents', ref: 'PMS Guide S3.7.1', isCompliant: true }
      ]
    }
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load and sync answers with Supabase in real-time
  useEffect(() => {
    let active = true;
    const loadCompliance = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tenant/${activeTenantId}/compliance`);
        if (!response.ok) throw new Error("Failed to fetch from server");
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }
        const data = await response.json();
        
        if (active) {
          const baseline: Record<string, boolean> = {};
          COMPLIANCE_MODULES.forEach(mod => {
            mod.mandatoryCriteria.forEach(crit => {
              baseline[`${mod.id}_${crit.id}`] = crit.isCompliant;
            });
          });

          if (data && data.answers) {
            setAuditAnswers({ ...baseline, ...data.answers });
          } else {
            setAuditAnswers(baseline);
          }
        }
      } catch (err) {
        console.error("Error loading compliance from API:", err);
        // Fallback to baseline on error
        const baseline: Record<string, boolean> = {};
        COMPLIANCE_MODULES.forEach(mod => {
          mod.mandatoryCriteria.forEach(crit => {
            baseline[`${mod.id}_${crit.id}`] = crit.isCompliant;
          });
        });
        if (active) setAuditAnswers(baseline);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadCompliance();
    return () => {
      active = false;
    };
  }, [activeTenantId]);

  const handleToggleCompliant = async (moduleId: string, criterionId: string) => {
    const key = `${moduleId}_${criterionId}`;
    const nextValue = !auditAnswers[key];
    const updatedAnswers = {
      ...auditAnswers,
      [key]: nextValue
    };
    
    // Optimistic state update feel
    setAuditAnswers(updatedAnswers);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: updatedAnswers })
      });
      if (!response.ok) throw new Error("Failed to persist changes");
    } catch (err) {
      console.error("Error updating compliance on remote database:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper logic calculating dynamic compliance score for a modules list
  const getModuleMetrics = (mod: ComplianceModule) => {
    const criteria = mod.mandatoryCriteria;
    const answeredCount = criteria.length;
    let compliantCount = 0;
    criteria.forEach(crit => {
      const isOk = auditAnswers[`${mod.id}_${crit.id}`] !== undefined 
        ? auditAnswers[`${mod.id}_${crit.id}`] 
        : crit.isCompliant;
      if (isOk) compliantCount++;
    });

    const percent = Math.round((compliantCount / answeredCount) * 100);
    let status: 'COMPLIANT' | 'PARTIALLY' | 'NON-COMPLIANT' = 'NON-COMPLIANT';
    if (percent === 100) status = 'COMPLIANT';
    else if (percent >= 50) status = 'PARTIALLY';

    return { percent, compliantCount, totalCount: answeredCount, status };
  };

  // Calculate overall global compliance score
  const getGlobalMetrics = () => {
    let totalCrit = 0;
    let compliantCrit = 0;

    COMPLIANCE_MODULES.forEach(mod => {
      mod.mandatoryCriteria.forEach(crit => {
        totalCrit++;
        const isOk = auditAnswers[`${mod.id}_${crit.id}`] !== undefined 
          ? auditAnswers[`${mod.id}_${crit.id}`] 
          : crit.isCompliant;
        if (isOk) compliantCrit++;
      });
    });

    const percent = Math.round((compliantCrit / totalCrit) * 100);
    return { percent, compliantCount: compliantCrit, totalCount: totalCrit };
  };

  const globalMetrics = getGlobalMetrics();

  // Documents filtering inside legislation view
  const filteredDocs = LEGISLATION_DOCS.filter(doc => 
    doc.title.toLowerCase().includes(legislationSearch.toLowerCase()) ||
    doc.type.toLowerCase().includes(legislationSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-xl text-slate-800 animate-fade-in font-sans">
      {/* Module Title Header */}
      <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-700 flex items-center justify-center border border-green-500/20">
            <CheckSquare className="w-5 h-5 shadow-inner" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight tracking-tight text-slate-900">Compliance Tracker</h3>
            <p className="text-[11px] text-slate-500 font-medium font-mono uppercase tracking-widest">
              Municipality Compliance Monitor & Verification Engine
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono">GLOBAL SCORE:</span>
          <div className={cn(
            "px-3 py-1 bg-white rounded font-mono font-bold text-xs border shadow-sm",
            globalMetrics.percent > 90 ? "text-green-700 border-green-500/30 bg-green-50" :
            globalMetrics.percent >= 70 ? "text-yellow-700 border-yellow-500/30 bg-yellow-50" :
            "text-red-700 border-red-500/30 bg-red-50"
          )}>
            {globalMetrics.percent}% COMPLIANT ({globalMetrics.compliantCount}/{globalMetrics.totalCount} RULES)
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex space-x-1 py-1">
          {(['brief', 'legislation', 'tracking', 'report'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-xs font-bold transition-all relative border-b-2 uppercase tracking-wide",
                activeTab === tab 
                  ? "border-green-600 text-green-600 bg-white" 
                  : "border-transparent text-slate-550 hover:text-slate-800 hover:bg-slate-100/50"
              )}
            >
              {tab === 'brief' && 'The Brief'}
              {tab === 'legislation' && 'Reference Legislation'}
              {tab === 'tracking' && 'Compliance Matrix'}
              {tab === 'report' && 'Quarterly Audit Reports'}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-mono select-none flex items-center gap-2">
          {isSaving ? (
            <span className="text-green-600 flex items-center gap-1.5 font-bold animate-pulse">
              <Loader2 className="w-3" /> WRITING TO SUPABASE...
            </span>
          ) : (
            <span className="text-slate-500">SYSTEM ACTIVE / DATABASE SECURE</span>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-800 bg-white p-8">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-3 animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-[#10B981] uppercase font-bold">Synchronizing Audit Records...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: BRIEF */}
        {activeTab === 'brief' && (
          <div className="flex-1 overflow-y-auto p-8 hide-scrollbar bg-slate-50/55 text-slate-800">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Introduction Banner */}
              <div className="relative overflow-hidden rounded-xl border border-slate-205 bg-white p-6 shadow-sm transition-all">
                <div className="relative z-10">
                  <h4 className="text-lg font-bold text-slate-900 mb-3">South African Municipal Compliance Overview</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Compliance tracking in South African municipalities is the systematic process of monitoring, recording, and reporting on a municipality’s adherence to complex laws, financial regulations, and performance standards—principally the Municipal Finance Management Act (MFMA). It ensures that public funds are managed properly, service delivery targets are met, and irregular or wasteful expenditure is prevented.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-green-500/5 to-transparent -z-10"></div>
              </div>

              {/* Core Elements section */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-sans">Core Elements of Compliance Tracking</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <FileBarChart className="w-4 h-4" />
                    </div>
                    <div>
                      <h6 className="text-sm font-bold text-slate-900 mb-1.5 font-sans">Financial Management</h6>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Tracking budgets, Supply Chain Management (SCM) processes, and preventing unauthorized, irregular, or fruitless and wasteful expenditure (UIFWE).
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-700 flex items-center justify-center shrink-0 border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h6 className="text-sm font-bold text-slate-900 mb-1.5 font-sans">Performance Reporting</h6>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Monitoring whether the municipality is meeting the objectives outlined in its Integrated Development Plan (IDP) and Service Delivery and Budget Implementation Plan (SDBIP).
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 border border-purple-500/20">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h6 className="text-sm font-bold text-slate-900 mb-1.5 font-sans">Legal Obligations</h6>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Ensuring strict adherence to core local government legislation, including the Municipal Systems Act and the Municipal Structures Act.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h6 className="text-sm font-bold text-slate-900 mb-1.5 font-sans">Audit Readiness</h6>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Preparing for evaluations by the Auditor-General of South Africa (AGSA) to avoid negative audit outcomes (e.g., disclaimers or adverse opinions).
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Grid 2-column with Why & Consequences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-emerald-50 border border-emerald-250 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Info className="w-4 h-4" />
                    <h6 className="text-xs font-bold uppercase tracking-wider font-sans">Why It’s Done?</h6>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed">
                    Compliance tracking is mandatory for good governance and aims to minimize corruption, manage institutional risk, and build public trust. By using compliance dashboards and monitoring systems, municipal officials can proactively spot bottlenecks before they result in financial misconduct or administrative penalties.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-250 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <h6 className="text-xs font-bold uppercase tracking-wider font-sans">The Consequences of Non-Compliance</h6>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed">
                    Failure to properly track and meet compliance requirements leads to severe consequences. Municipalities frequently face investigations by provincial Treasuries or the AGSA, which can result in withheld conditional grants, disciplinary actions against accounting officers, and compromised service delivery for residents.
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}
              {/* TAB 2: LEGISLATION (PDF Viewer Simulator) */}
        {activeTab === 'legislation' && (
          <div className="flex-1 overflow-hidden flex bg-white text-slate-800">
            {/* Sidebar Documents Selector */}
            <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-200 shrink-0 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={legislationSearch}
                    onChange={e => setLegislationSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-205 rounded-lg text-xs outline-none focus:border-green-600 font-sans text-slate-800"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
                {filteredDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all border flex flex-col cursor-pointer",
                      selectedDoc.id === doc.id
                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                        : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    <span className="text-xs font-bold leading-tight">{doc.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">
                      {doc.type} • {doc.size}
                    </span>
                  </button>
                ))}
                {filteredDocs.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 font-mono">
                    No matching documents
                  </div>
                )}
              </div>
            </div>

            {/* Document Reader Container */}
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-100/50">
              {/* Reader Action Toolbar */}
              <div className="h-12 border-b border-slate-200 px-6 bg-slate-50 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-850 font-bold">{selectedDoc.title}</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] uppercase font-mono font-bold">
                    PDF Document
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex space-x-1 items-center bg-white border border-slate-200 rounded px-1 text-slate-500 text-xs py-0.5 font-mono">
                    <span className="px-2 font-bold text-[10px]">PAGES 1 - {selectedDoc.content.length}</span>
                  </div>
                  <button className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-950 px-2.5 py-1 rounded text-[10px] font-bold text-slate-700 font-mono transition-colors shadow-sm cursor-pointer border">
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    {selectedDoc.fileName}
                  </button>
                </div>
              </div>

              {/* Reader Sheet Area */}
              <div className="flex-1 overflow-y-auto bg-slate-100/60 p-8 flex justify-center hide-scrollbar">
                <div className="space-y-8 w-full max-w-3xl">
                  {selectedDoc.content.map((pageText, pageIndex) => (
                    <div 
                      key={pageIndex} 
                      className="bg-white text-slate-900 shadow-xl rounded-lg p-10 min-h-[500px] border border-slate-200 flex flex-col justify-between select-text"
                      style={{ fontFamily: "'Inter', ui-serif, Georgia, serif" }}
                    >
                      {/* Sheet Header */}
                      <div className="border-b border-slate-100 pb-3 flex justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400 select-none">
                        <span>SOUTH AFRICAN COMPLIANCE CODES / {selectedDoc.title}</span>
                        <span>REFERENCE PG. {pageIndex + 1}</span>
                      </div>

                      {/* Sheet Content Body */}
                      <div className="my-8 flex-1 text-[13px] leading-relaxed text-slate-800 font-light whitespace-pre-wrap">
                        {pageText}
                      </div>

                      {/* Sheet Footer */}
                      <div className="border-t border-slate-100 pt-3 flex justify-between text-[9px] font-bold text-slate-400 select-none uppercase">
                        <span>CONFIDENTIAL • OFFICE ADOPTIVE COPY</span>
                        <span>PAGE {pageIndex + 1} OF {selectedDoc.content.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: TRACKING MATRIX */}
        {activeTab === 'tracking' && (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/55">
            {/* Context Notice */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 font-medium font-mono">
              <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-600" /> Hardcoded audit checklist logic evaluated dynamically across 12 sectors.</span>
              <span className="text-[10px] text-slate-405">ALL CHANGES SAVE PERSISTENTLY</span>
            </div>

            {/* Modules Grid */}
            <div className="flex-1 overflow-y-auto p-6 gap-6 grid grid-cols-1 xl:grid-cols-2 hide-scrollbar">
              {COMPLIANCE_MODULES.map(mod => {
                const metrics = getModuleMetrics(mod);

                return (
                  <div key={mod.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                    
                    {/* Header */}
                    <div className="bg-slate-50 border-b border-slate-100 p-4 shrink-0 flex items-center justify-between gap-4">
                      <div>
                        <h6 className="font-bold text-sm text-slate-900 font-sans">{mod.name}</h6>
                        <span className="text-[10px] text-slate-500 font-sans tracking-tight block mt-0.5">{mod.description}</span>
                      </div>

                      {/* Dynamic Metric pill */}
                      <div className={cn(
                        "font-mono font-bold text-[10px] px-2.5 py-1 rounded border shadow-sm shrink-0",
                        metrics.status === 'COMPLIANT' ? "text-green-700 border-green-500/20 bg-green-50" :
                        metrics.status === 'PARTIALLY' ? "text-yellow-700 border-yellow-500/20 bg-yellow-50" :
                        "text-red-700 border-red-500/20 bg-red-50"
                      )}>
                        {metrics.percent}% {metrics.status} ({metrics.compliantCount}/{metrics.totalCount})
                      </div>
                    </div>

                    {/* Criteria evaluator list */}
                    <div className="flex-1 p-4 bg-white divide-y divide-slate-100">
                      {mod.mandatoryCriteria.map(crit => {
                        const currentAnswer = auditAnswers[`${mod.id}_${crit.id}`] !== undefined 
                          ? auditAnswers[`${mod.id}_${crit.id}`] 
                          : crit.isCompliant;

                        return (
                          <div key={crit.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                            <div className="flex-1">
                              <span className="font-medium text-slate-800 font-sans">{crit.text}</span>
                              <span className="block text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter font-bold">
                                REFERENCE: {crit.ref}
                              </span>
                            </div>

                            <button
                              onClick={() => handleToggleCompliant(mod.id, crit.id)}
                              className={cn(
                                "px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all uppercase border shrink-0 cursor-pointer",
                                currentAnswer
                                  ? "bg-green-50 text-green-700 border-green-500/30 hover:bg-green-100/50"
                                  : "bg-red-50 text-red-700 border-red-500/30 hover:bg-red-100/50"
                              )}
                            >
                                {currentAnswer ? 'Passed' : 'Infracted'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COMPREHENSIVE REPORTS */}
        {activeTab === 'report' && (
          <div className="flex-1 overflow-hidden flex bg-white text-slate-850">
            {/* Sidebar with Quarters list & high level statuses */}
            <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-200 shrink-0 select-none bg-white">
                <span className="text-[10px] font-bold font-mono tracking-widest text-slate-605 uppercase block">
                  Quarterly Audit Bulletins
                </span>
                <p className="text-xs text-slate-500 mt-1">Select an issue to preview findings derived from audit entries.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
                {[
                  { q: 'q1', title: 'Quarter 1 Report (Jul - Sep)', date: 'Oct 15, 2025' },
                  { q: 'q2', title: 'Quarter 2 Report (Oct - Dec)', date: 'Jan 15, 2026' },
                  { q: 'q3', title: 'Quarter 3 Report (Jan - Mar)', date: 'Apr 15, 2026' },
                  { q: 'q4', title: 'Quarter 4 Report (Apr - Jun)', date: 'Jul 15, 2026' },
                ].map(item => (
                  <button
                    key={item.q}
                    onClick={() => setActiveQuarter(item.q as any)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all border flex flex-col cursor-pointer",
                      activeQuarter === item.q
                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                        : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    <span className="text-xs font-bold leading-tight uppercase tracking-tight">{item.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 uppercase font-semibold">
                      Audit Issued: {item.date}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Comprehensive Report view */}
            <div className="flex-1 overflow-y-auto bg-slate-100/50 p-8 hide-scrollbar select-text">
              <div className="max-w-3xl mx-auto bg-white text-slate-900 border border-slate-200 rounded-xl p-10 shadow-2xl relative">
                
                {/* Printable action link */}
                <button
                  onClick={() => window.print()}
                  className="absolute top-8 right-8 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm font-mono border border-slate-200 select-none"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print PDF
                </button>

                {/* Cover header logo & stamps */}
                <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xl border shadow-inner">
                      MF
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight text-slate-900 uppercase">Mzansi Flow PMS</h4>
                      <span className="text-[9px] text-slate-400 tracking-wider block font-mono font-medium">COMPLIANCE REVIEW SYSTEM</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[9px] text-slate-500 uppercase">
                    <span>DOCUMENT SECURITY ID: BR-29202-K</span>
                  </div>
                </div>

                {/* Report Content Panel */}
                <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }} className="space-y-6 text-slate-800">
                  <div className="text-center max-w-lg mx-auto">
                    <h5 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase select-none">
                      Comprehensive Quarterly Audit Statement
                    </h5>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase mt-1">
                      {activeQuarter === 'q1' && 'Quarter 1 General Compliance Report'}
                      {activeQuarter === 'q2' && 'Quarter 2 General Compliance Report'}
                      {activeQuarter === 'q3' && 'Quarter 3 General Compliance Report'}
                      {activeQuarter === 'q4' && 'Quarter 4 General Compliance Report'}
                    </h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1 select-none">
                      Issued in accordance with the Local Government: Municipal Finance Management Act (Act 56 of 2003)
                    </p>
                  </div>

                  {/* High level figures box */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-lg grid grid-cols-3 gap-4 text-center select-none shadow-inner">
                    <div className="border-r border-slate-200">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Global Compliance</span>
                      <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                        {globalMetrics.percent}%
                      </span>
                    </div>
                    <div className="border-r border-slate-200">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Rules Verified</span>
                      <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                        {globalMetrics.totalCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Infractions Found</span>
                      <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block text-red-630">
                        {globalMetrics.totalCount - globalMetrics.compliantCount}
                      </span>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="space-y-2">
                    <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                      1. Executive Turnaround Summary
                    </h6>
                    <p className="text-xs leading-relaxed text-slate-600 font-light">
                      During this compliance period, Mzansi Flow Compliance Engine has run systematic evaluation logic over all 12 operational modules. The findings show that while basic planning elements (IDPs and KPAs) remain soundly integrated within SSCOA rules, minor administrative bottlenecks persist regarding the finalization of SDBIP layers and timeous annual report website uploads (as required in terms of Section 75). Immediate correction is advised to limit irregular SCM alerts.
                    </p>
                  </div>

                  {/* Detailed Module Audit scores table */}
                  <div className="space-y-3">
                    <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                      2. Section-by-Section Audit Outcomes
                    </h6>
                    <div className="border border-slate-200 rounded-lg overflow-hidden shrink-0 shadow-sm text-slate-600">
                      <table className="w-full text-left text-xs bg-transparent">
                        <thead className="bg-slate-50 font-bold uppercase tracking-wider text-[9px] text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Oversight Pillar Module</th>
                            <th className="px-4 py-2.5">Rule Compliance</th>
                            <th className="px-4 py-2.5">Performance Score</th>
                            <th className="px-4 py-2.5 text-right">Adopted Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
                          {COMPLIANCE_MODULES.slice(0, 6).map(mod => {
                            const stats = getModuleMetrics(mod);
                            return (
                              <tr key={mod.id}>
                                <td className="px-4 py-2 font-bold text-slate-800">{mod.name}</td>
                                <td className="px-4 py-2 uppercase font-mono font-bold text-[10px]">
                                  {stats.status}
                                </td>
                                <td className="px-4 py-2 font-mono font-bold">{stats.percent}%</td>
                                <td className="px-4 py-2 text-right font-light text-slate-500">
                                  {stats.percent === 100 ? 'Monitor Routine' : 'Amend & Resolve'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-lg overflow-hidden shrink-0 shadow-sm text-slate-600">
                      <table className="w-full text-left text-xs bg-transparent">
                        <thead className="bg-slate-50 font-bold uppercase tracking-wider text-[9px] text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Oversight Pillar Module</th>
                            <th className="px-4 py-2.5">Rule Compliance</th>
                            <th className="px-4 py-2.5">Performance Score</th>
                            <th className="px-4 py-2.5 text-right">Adopted Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
                          {COMPLIANCE_MODULES.slice(6).map(mod => {
                            const stats = getModuleMetrics(mod);
                            return (
                              <tr key={mod.id}>
                                <td className="px-4 py-2 font-bold text-slate-800">{mod.name}</td>
                                <td className="px-4 py-2 uppercase font-mono font-bold text-[10px]">
                                  {stats.status}
                                </td>
                                <td className="px-4 py-2 font-mono font-bold">{stats.percent}%</td>
                                <td className="px-4 py-2 text-right font-light text-slate-500">
                                  {stats.percent === 100 ? 'Monitor Routine' : 'Amend & Resolve'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Legal warning details */}
                  <div className="space-y-2">
                    <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                      3. Statutory Directives & Consequences
                    </h6>
                    <p className="text-xs leading-relaxed text-slate-600 font-light">
                      Non-compliance triggers critical reviews under S38 of the Municipal Finance Management Act. In accordance with the Auditor-General's most recent directives, failure to implement systematic monitoring of mSCOA coding lines and SCM thresholds threatens the municipality's grant disbursement status. Corrective, non-punitive training schedules have been outlined in Appendix B of the municipal PMS framework.
                    </p>
                  </div>

                  {/* Sign-off Stamps */}
                  <div className="p-6 border-t border-slate-150 flex items-center justify-between select-none">
                    <div className="text-slate-400 text-[10px] font-mono leading-tight uppercase font-medium">
                      <span>Certified Audit System</span><br/>
                      <span>Sign-off date: {new Date().toISOString().substring(0, 10)}</span>
                    </div>

                    <div className="text-center font-sans">
                      <div className="border border-slate-900/10 px-4 py-1.5 rounded bg-slate-50 text-[11px] font-bold text-slate-800 tracking-wide uppercase select-none shadow-sm block text-center min-w-[150px]">
                        AUDITED SECURE
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
