import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, LayoutTemplate, Folder, Settings, Search, Sparkles, Cpu, Layers, 
  Users, Wrench, CheckSquare, RefreshCw, Download, Upload, Printer, Share2, 
  Eye, HelpCircle, Save, Scissors, Copy, Clipboard, ChevronRight, Mic, 
  Volume2, BookOpen, Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, List, ListOrdered, FileSpreadsheet, PlayCircle, 
  PenTool, Bookmark, MessageSquare, Code, CheckSquare as CheckIcon, Calendar, Type,
  X, Info, AlertTriangle, ChevronDown, Sliders, Palette, ZoomIn, ZoomOut
} from 'lucide-react';
import { cn } from '../Branding';
import { User } from '../../types';
import io, { Socket } from 'socket.io-client';
import { ExportDropdowns } from '../DraftingSuite/ExportDropdowns';

interface ChangeManagementProps {
  currentUser: User;
  activeTenantId: string;
}

export function ChangeManagement({ currentUser, activeTenantId }: ChangeManagementProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'framework' | 'templates' | 'drafting'>('brief');
  const [adoptedTemplateData, setAdoptedTemplateData] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800">
      
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Change Management</h3>
            <p className="text-xs text-gray-500 font-medium tracking-tight uppercase">Module Overview & Working Suite</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('brief')}
            className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === 'brief' ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
            id="cm-tab-brief"
          >
            Brief
          </button>
          <button 
            onClick={() => setActiveTab('framework')}
            className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === 'framework' ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
            id="cm-tab-framework"
          >
            Framework & Blueprint
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === 'templates' ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
            id="cm-tab-templates"
          >
            Templates
          </button>
          <button 
            onClick={() => setActiveTab('drafting')}
            className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === 'drafting' ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
            id="cm-tab-drafting"
          >
            Drafting Suite
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'brief' && <BriefTab />}
        {activeTab === 'framework' && <FrameworkBlueprintTab />}
        {activeTab === 'templates' && (
          <TemplatesTab 
            onAdoptTemplate={(htmlContent) => {
              setAdoptedTemplateData(htmlContent);
              setActiveTab('drafting');
            }} 
          />
        )}
        {activeTab === 'drafting' && (
          <DraftingSuiteTab 
            currentUser={currentUser} 
            activeTenantId={activeTenantId} 
            adoptedTemplateData={adoptedTemplateData}
            clearAdopted={() => setAdoptedTemplateData(null)}
          />
        )}
      </div>
    </div>
  );
}

function BriefTab() {
  return (
    <div className="p-8 overflow-y-auto h-full hide-scrollbar bg-slate-50/50">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 text-indigo-800">
            <Info className="w-6 h-6 shrink-0 text-indigo-600" />
            1. What Information is Contained in Change Management?
          </h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-indigo-500 pl-4 space-y-2">
              <h3 className="text-lg font-bold text-gray-800">Stream A: People & Institutional Change Management</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-750 text-sm">
                <li><strong>Change Readiness Assessments:</strong> Data measuring staff morale, willingness to adapt, and anticipated points of union or employee resistance.</li>
                <li><strong>Stakeholder & Impact Analysis:</strong> Identification of who is affected by administrative restructures, political leadership changes, or municipal amalgamations.</li>
                <li><strong>Communication & Coaching Plans:</strong> Structured timelines detailing how changes will be messaged to the workforce to minimize service delivery disruptions.</li>
                <li><strong>Skills Gap & Training Trackers:</strong> Progress logs identifying what new competencies staff require to operate in a professionalized municipal environment.</li>
              </ul>
            </div>

            <div className="border-l-4 border-emerald-500 pl-4 space-y-2">
              <h3 className="text-lg font-bold text-gray-800">Stream B: ICT Change Management & Control</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-750 text-sm">
                <li><strong>Change Requests (CRs):</strong> Formal submissions detailing the nature, scope, and technical justification of an infrastructure or software alteration.</li>
                <li><strong>Risk & Impact Analysis:</strong> Assessments of how a system change could impact municipal billing, water/electricity tracking, or data security.</li>
                <li><strong>Rollback & Contingency Plans:</strong> Step-by-step procedures to revert to previous configurations if the change causes a critical system failure.</li>
                <li><strong>Change Freeze Schedules:</strong> Calendars mapping out strict periods (like the financial year-end close) where no non-emergency system changes are allowed.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 text-indigo-800">
            <Layers className="w-6 h-6 shrink-0 text-indigo-600" />
            2. What is the Information Aligned To?
          </h2>
          <p className="text-gray-700 leading-relaxed text-sm">
            To prevent arbitrary operational shifts, change management data must align directly with legislated statutory frameworks:
          </p>
          
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-center flex flex-wrap justify-center items-center gap-3 font-semibold text-indigo-900 text-sm mb-4">
            <span className="px-3 py-1.5 bg-white rounded-lg border border-indigo-100 shadow-xs">[5-Year IDP Strategy]</span>
            <span className="text-indigo-400">➔</span>
            <span className="px-3 py-1.5 bg-white rounded-lg border border-indigo-100 shadow-xs">[3-Year MTREF Budget]</span>
            <span className="text-indigo-400">➔</span>
            <span className="px-3 py-1.5 bg-white rounded-lg border border-indigo-100 shadow-xs">[1-Year SDBIP Implementation]</span>
          </div>

          <ul className="list-disc pl-6 space-y-2 text-gray-750 text-sm">
            <li><strong>The Municipal Systems Act:</strong> Sets the baseline for institutional transformation, requiring change initiatives to align with the Batho Pele (&quot;People First&quot;) principles of public service.</li>
            <li><strong>The Integrated Development Plan (IDP):</strong> Any structural or cultural change must serve the municipal strategy; change records must show how shifting resources will directly accelerate IDP service delivery targets.</li>
            <li><strong>Staff Performance Management Systems:</strong> Individual change tracking must align with key performance areas (KPAs) so that officials are incentivized and held legally accountable for adopting new operational processes.</li>
            <li><strong>COBIT & King IV Frameworks (for ICT):</strong> Technical change data is aligned against international IT governance frameworks and King IV principles to ensure compliance with Municipal Finance Management Act (MFMA) internal control audits.</li>
          </ul>
        </section>

        <section className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 text-indigo-800">
            <Sparkles className="w-6 h-6 shrink-0 text-indigo-600" />
            3. Where Does the Information Come From?
          </h2>
          <p className="text-gray-700 leading-relaxed text-sm">
            The metrics and data feeding into municipal change strategies originate from internal and collaborative intergovernmental channels:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-750 text-sm">
            <li><strong>Human Resource Information Systems (HRIS):</strong> Provide hard data on vacancy rates, disciplinary trends, and employee turnover that signal where structural change is most urgent.</li>
            <li><strong>The South African Local Government Association (SALGA):</strong> Issues benchmark toolkits, professionalization guidelines, and case studies detailing how other municipalities managed large-scale turnarounds.</li>
            <li><strong>Independent Employee Surveys:</strong> Direct feedback, focus groups, and local labor forum minutes that highlight union concerns or staff readiness.</li>
            <li><strong>The Auditor-General of South Africa (AGSA):</strong> Annual audit findings serve as an external trigger, providing data on systemic failures that legally require a change management intervention (e.g., poor financial controls).</li>
            <li><strong>IT Change Advisory Boards (CAB):</strong> Internal municipal committees consisting of the Chief Financial Officer (CFO), IT technicians, and risk managers who generate, log, and sign off on all technical infrastructure variations.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function FrameworkBlueprintTab() {
  const [activeItem, setActiveItem] = useState<number | null>(0);

  const frameworkItems = [
    {
      title: "Strategic Frameworks",
      summary: "Implementing structured approaches (like SALGA toolkit) to manage old to new shifts.",
      detail: ""
    },
    {
      title: "Performance Management",
      summary: "Cascading systems to all levels per updated municipal regulations.",
      detail: ""
    },
    {
      title: "IT and Systems Change",
      summary: "Formal processes (Request, Analysis, Approval) to prevent service disruptions.",
      detail: ""
    },
    {
      title: "Overcoming Resistance",
      summary: "Addressing employee resistance through communication and training to drive performance.",
      detail: ""
    },
    {
      title: "Leadership and Structure",
      summary: "Ensuring leadership provides resources, particularly during political transitions.",
      detail: ""
    },
    {
      title: "Culture Goal",
      summary: "Building a vision, planning, implementing, and embedding efficient practices into organizational culture.",
      detail: ""
    }
  ];

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      
      {/* LEFT PANEL - FRAMEWORK */}
      <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col h-full overflow-y-auto p-8 hide-scrollbar">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Strategic Pillars</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Change Management Framework</h2>
          </div>
          
          <p className="text-gray-650 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-gray-100 font-medium">
            Change management in South African municipalities is crucial for driving adoption of new, often mandated, operational changes—like the 2021 staff regulations and performance systems—to ensure service delivery. It involves adopting structured frameworks for organizational, structural, and IT-related changes to reduce negative impacts, minimize resistance, and enhance performance.
          </p>

          <div className="space-y-3 mt-6">
            {frameworkItems.map((item, index) => (
              <div 
                key={index} 
                className={cn(
                  "border rounded-xl cursor-pointer transition-all p-5 shadow-xs",
                  activeItem === index 
                    ? "border-indigo-500 bg-indigo-50/40 shadow-sm" 
                    : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-xs"
                )}
                onClick={() => setActiveItem(activeItem === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-3">
                    <span className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      activeItem === index ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      {index + 1}
                    </span>
                    {item.title}
                  </h3>
                  <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", activeItem === index && "rotate-90 text-indigo-600")} />
                </div>
                
                {(activeItem === index) && (
                  <div className="mt-3 text-sm text-gray-700 leading-relaxed border-t border-indigo-100 pt-3">
                    <p className="font-medium text-indigo-950">{item.summary}</p>
                    <p className="text-xs text-gray-500 mt-2 italic">Interactive Framework Milestone &bull; Documented reference checklist fully integrated for formal reporting.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - BLUEPRINT */}
      <div className="w-1/2 bg-slate-50 flex flex-col h-full overflow-y-auto p-8 hide-scrollbar">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Roadmap Instructions</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Operational Implementation Blueprint</h2>
          </div>

          <div className="space-y-8 relative pl-6 border-l-2 border-emerald-200/60 mt-6">
            {/* Phase 1 */}
            <div className="relative">
              <span className="absolute -left-10 top-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">1</span>
              <h3 className="font-bold text-gray-950 text-base">Phase 1: Pre-Change Readiness & Mandate</h3>
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">Establishment of legal and structural foundations</p>
              
              <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 shadow-xs text-xs text-gray-700 leading-relaxed">
                <p><strong>Legislative Alignment:</strong> Ensure all changes comply with the Local Government: Municipal Systems Act and the Municipal Finance Management Act (MFMA).</p>
                <p><strong>Readiness Assessments:</strong> Conduct cultural and operational readiness surveys across all departments to identify anticipated points of resistance.</p>
                <p><strong>Stakeholder Buy-in:</strong> Establish a participatory planning process involving the municipal council, organized labor (SAMWU, IMATU), and community structures.</p>
                <p><strong>Executive Sponsorship:</strong> Form a steering committee comprising the Municipal Manager, Chief Financial Officer (CFO), and Directors to champion the change.</p>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="relative">
              <span className="absolute -left-10 top-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">2</span>
              <h3 className="font-bold text-gray-950 text-base">Phase 2: Design and Integration</h3>
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">Shifting from current state to desired future state</p>
              
              <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 shadow-xs text-xs text-gray-700 leading-relaxed">
                <p><strong>Political and Administrative Separation:</strong> Define the exact roles of political structures (agenda-setting/oversight) versus administrative functions (implementation).</p>
                <p><strong>Skills Audit and Redesign:</strong> Assess the competencies of existing staff against the National Treasury competency requirements. Train or redeploy staff accordingly.</p>
                <p><strong>Workflow Analysis:</strong> Map out the current business procedures in Supply Chain Management (SCM), revenue collection, and service delivery, and redesign them for efficiency.</p>
                <p><strong>ICT Control Integration:</strong> Implement strict ICT Change Management and Control Policies to prevent disruptions, data loss, and corruption during system transitions.</p>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="relative">
              <span className="absolute -left-10 top-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">3</span>
              <h3 className="font-bold text-gray-950 text-base">Phase 3: Implementation & Communication</h3>
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">Execution with active disruption mitigation</p>
              
              <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 shadow-xs text-xs text-gray-700 leading-relaxed">
                <p><strong>Targeted Communication Plan:</strong> Create a continuous, multilingual (e.g., English, isiZulu, Afrikaans based on the province) communication matrix detailing what the change is, why it is happening, and how it affects staff and residents.</p>
                <p><strong>Capacity Building:</strong> Roll out mandatory training on updated Standard Operating Procedures (SOPs), municipal bylaws, and performance management systems.</p>
                <p><strong>Pilot Projects:</strong> Roll out changes in a controlled environment (e.g., in a single department like water services) before full, municipality-wide implementation.</p>
                <p><strong>Labor Engagement:</strong> Maintain transparent communication with union representatives to prevent industrial action and minimize staff resistance.</p>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="relative">
              <span className="absolute -left-10 top-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">4</span>
              <h3 className="font-bold text-gray-950 text-base">Phase 4: Reinforcement & Accountability</h3>
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">Reinforce, stabilize, and sustain new practices</p>
              
              <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 shadow-xs text-xs text-gray-700 leading-relaxed">
                <p><strong>Continuous Feedback Loops:</strong> Establish platforms for employees and citizens to log grievances or feedback regarding the new changes.</p>
                <p><strong>Monitoring and Evaluation:</strong> Align departmental change goals with the Integrated Development Plan (IDP) and monitor outcomes quarterly through the Municipal Performance Management system.</p>
                <p><strong>Reward and Recognize:</strong> Celebrate quick wins and acknowledge staff/teams who have successfully adopted new systems and contributed to service delivery improvements.</p>
                <p><strong>Corrective Interventions:</strong> Diagnose performance gaps quickly and apply targeted, corrective actions to ensure continued regulatory compliance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

interface TemplatesTabProps {
  onAdoptTemplate: (html: string) => void;
}

function TemplatesTab({ onAdoptTemplate }: TemplatesTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);

  const templates = [
    {
      id: 1,
      title: "Template 1: Office of the Municipal Manager (MM)",
      focus: "Strategic alignment, Integrated Development Plan (IDP) shifts, performance management cascading, and legal accountability.",
      themeColor: "bg-blue-600",
      themeAccent: "indigo",
      colorText: "text-blue-700",
      colorBorder: "border-blue-200",
      colorBg: "bg-blue-50/30",
      colorBadge: "bg-blue-100 text-blue-800",
      fields: [
        { section: "Change Identifier", detail: "Strategic & Oversight Alignment" },
        { section: "mSCOA Segment Impact", detail: "Function: Core Governance / Executive & Council.\nProject: Operational (IDP Review / Performance Management Implementation)." },
        { section: "MFMA Legal Trigger", detail: "Section 55 (Duties of MM) & Section 56/57 (Appointment and Performance Agreements)." },
        { section: "Change Description", detail: "Describe changes to macro-organisational structure, devolution of delegations, or emergency IDP/SDBIP amendments." },
        { section: "Risk & Control Impact", detail: "Detail how this change affects internal controls, council oversight, or the municipality's risk register." },
        { section: "SDBIP Target Calibration", detail: "Identify exactly which top-layer Service Delivery and Budget Implementation Plan (SDBIP) KPIs must be updated via council resolution." },
        { section: "Stakeholder Impact Matrix", detail: "Internal: Executive MayCo, Council, Directors.\nExternal: Auditor-General (AGSA), National/Provincial Treasury, SALGA, CoGTA." },
        { section: "Labour Forum Notification", detail: "Date tabled at the Local Labour Forum (LLF) if structural changes affect reporting lines or job descriptions." },
        { section: "Sign-Off & Approval", detail: "Prepared by: Strategic Manager | Approved by: Municipal Manager (Accounting Officer)" }
      ]
    },
    {
      id: 2,
      title: "Template 2: Corporate Services",
      focus: "Institutional transformation, human resource restructuring, policy updates, and ICT change controls.",
      themeColor: "bg-purple-600",
      themeAccent: "purple",
      colorText: "text-purple-700",
      colorBorder: "border-purple-200",
      colorBg: "bg-purple-50/30",
      colorBadge: "bg-purple-100 text-purple-800",
      fields: [
        { section: "Change Identifier", detail: "Human Capital & ICT Institutional Change" },
        { section: "mSCOA Segment Impact", detail: "Item: Expenditure (Employee-related costs: Salaries, Allowances, or Training).\nProject: Operational (Workplace Skills Plan implementation or ICT system migration)." },
        { section: "MFMA Legal Trigger", detail: "Section 67 (Human Resource Management) & MFMA Circular 63 (Annual Report structural tracking)." },
        { section: "Change Description", detail: "Describe changes to HR policies, staff placement/amalgamations, or municipal-wide ICT software/hardware migrations." },
        { section: "Financial/Payroll Impact", detail: "Confirm if changes affect the payroll register, organogram budget codes, or necessitate updates to the mSCOA employee-cost strings." },
        { section: "Skills & Competency Plan", detail: "Detail training requirements against the Workplace Skills Plan (WSP) and Minimum Competency Regulations compliance." },
        { section: "LLF Resolution Details", detail: "Documentation of formal consultation and signed agreement with unions (SAMWU/IMATU) at the Local Labour Forum." },
        { section: "ICT CAB Integration", detail: "(If technical change) Log number from the IT Change Advisory Board (CAB) detailing server rollback and data contingency plans." },
        { section: "Sign-Off & Approval", detail: "Prepared by: HR/IT Manager | Approved by: Director: Corporate Services" }
      ]
    },
    {
      id: 3,
      title: "Template 3: Technical Services (Infrastructure)",
      focus: "Capital projects, asset lifecycle management, engineering adjustments, and service delivery continuity.",
      themeColor: "bg-teal-600",
      themeAccent: "teal",
      colorText: "text-teal-700",
      colorBorder: "border-teal-200",
      colorBg: "bg-teal-50/30",
      colorBadge: "bg-teal-100 text-teal-800",
      fields: [
        { section: "Change Identifier", detail: "Infrastructure & Asset Operations Change" },
        { section: "mSCOA Segment Impact", detail: "Asset: Infrastructure (Water, Electricity, Roads, Sanitation).\nProject: Capital (Project identification codes).\nFunding: Conditional Grants (MIG, INEP) or Internally Generated Funds." },
        { section: "MFMA Legal Trigger", detail: "Section 19 (Capital projects approval) & Section 63 (Asset Management obligations)." },
        { section: "Change Description", detail: "Describe construction scope modifications, supplier variations, or shifts in technical operations/maintenance methods." },
        { section: "mSCOA Project Mapping", detail: "Input the exact 15-digit mSCOA Capital Project String to ensure expenditure maps correctly to the infrastructure asset register." },
        { section: "Grant Compliance Check", detail: "Document whether this change impacts conditional grant frameworks set by national sector departments (e.g., DWS, DMRE)." },
        { section: "Service Interruption Plan", detail: "Step-by-step public notification protocol for temporary service shut-offs (Water/Power) to maintain community stability." },
        { section: "Asset Register Update", detail: "Detail how the unbundled asset components will be updated in the Geographic Information System (GIS) and FAR (Fixed Asset Register)." },
        { section: "Sign-Off & Approval", detail: "Prepared by: PMU Manager / Chief Engineer | Approved by: Director: Technical Services" }
      ]
    },
    {
      id: 4,
      title: "Template 4: Finance (Budget & Treasury Office)",
      focus: "Financial system compliance, tariff restructuring, supply chain management, and audit remediation.",
      themeColor: "bg-amber-600",
      themeAccent: "amber",
      colorText: "text-amber-700",
      colorBorder: "border-amber-200",
      colorBg: "bg-amber-50/30",
      colorBadge: "bg-amber-100 text-amber-800",
      fields: [
        { section: "Change Identifier", detail: "Financial Governance & Fiscal Control Change" },
        { section: "mSCOA Segment Impact", detail: "Affects all 7 mSCOA Dimensions (Project, Function, Item, Funding, Regional, Costing, Asset)." },
        { section: "MFMA Legal Trigger", detail: "Section 28 (Municipal adjustments budgets) & Section 110-119 (Supply Chain Management)." },
        { section: "Change Description", detail: "Describe structural shifts in billing engines, modifications to SCM evaluation criteria, or emergency budget votes." },
        { section: "Virement/Adjustment Link", detail: "Cross-reference the official Council Resolution number authorizing the budget shift or virement application form." },
        { section: "Treasury Notification Log", detail: "Verification that the ledger configuration changes have been uploaded successfully to the National Treasury GoMuni portal." },
        { section: "SCM Deviation Control", detail: "(If procurement-related) Document the exceptional circumstances justifying the change, mapping to MFMA Regulation 36." },
        { section: "AGSA Clean Audit Alignment", detail: "Detail how this process alteration affects internal financial controls or addresses historical audit queries." },
        { section: "Sign-Off & Approval", detail: "Prepared by: Budget / SCM Manager | Approved by: Chief Financial Officer (CFO)" }
      ]
    },
    {
      id: 5,
      title: "Template 5: Community Development Services",
      focus: "Public-facing facility changes, indigent allocation shifts, and social amenity management.",
      themeColor: "bg-rose-600",
      themeAccent: "rose",
      colorText: "text-rose-700",
      colorBorder: "border-rose-200",
      colorBg: "bg-rose-50/30",
      colorBadge: "bg-rose-100 text-rose-800",
      fields: [
        { section: "Change Identifier", detail: "Social Infrastructure & Public Amenity Change" },
        { section: "mSCOA Segment Impact", detail: "Function: Community & Social Services / Sport & Recreation / Public Safety.\nItem: Expenditure (Free Basic Services / Indigent Subsidies)." },
        { section: "MFMA Legal Trigger", detail: "Section 97 (Revenue Management - Indigent Policy context) & Systems Act Section 4 (Community Rights)." },
        { section: "Change Description", detail: "Describe modifications to waste collection schedules, facility management outsourcing, or updates to the Indigent Register criteria." },
        { section: "Indigent Subsidy Impact", detail: "Project the exact fiscal shift in Free Basic Services (FBS) expenditure and its alignment with the national Equitable Share allocation." },
        { section: "Public Safety & Bylaws", detail: "Detail if the changes require security re-deployments (Traffic/Law Enforcement) or adjustments to municipal health enforcement." },
        { section: "Public Participation Log", detail: "Document public consultation dates, ward councillor notifications, and feedback mechanisms utilized for the affected community." },
        { section: "Sign-Off & Approval", detail: "Prepared by: Parks/Social/Safety Manager | Approved by: Director: Community Services" }
      ]
    },
    {
      id: 6,
      title: "Template 6: Planning & Economic Development",
      focus: "Spatial planning transformations, local economic development (LED) grants, and land-use variations.",
      themeColor: "bg-emerald-600",
      themeAccent: "emerald",
      colorText: "text-emerald-700",
      colorBorder: "border-emerald-200",
      colorBg: "bg-emerald-50/30",
      colorBadge: "bg-emerald-100 text-emerald-800",
      fields: [
        { section: "Change Identifier", detail: "Spatial & Socio-Economic Development Change" },
        { section: "mSCOA Segment Impact", detail: "Regional: Ward-specific identifier coding.\nProject: Operational (LED Projects / Spatial Development Framework implementation)." },
        { section: "MFMA Legal Trigger", detail: "SPLUMA (Spatial Planning and Land Use Management Act) regulations & MFMA Section 153 (Developmental duties)." },
        { section: "Change Description", detail: "Describe structural transformations in town planning schemes, informal trader formalisation drives, or localized job creation models." },
        { section: "mSCOA Regional Segment", detail: "Identify exactly which geographical wards or zones are targeted to ensure localized expenditure tracking matches the mSCOA matrix." },
        { section: "EPWP Job Creation Tracking", detail: "Outline how job opportunities generated by this change will be reported to the National Department of Public Works database." },
        { section: "Business Stakeholder Log", detail: "Detail engagements held with Local Business Forums, chambers of commerce, or property developers regarding the operational shift." },
        { section: "Sign-Off & Approval", detail: "Prepared by: LED / Town Planning Manager | Approved by: Director: Planning & Economic Development" }
      ]
    }
  ];

  const handleAdopt = (templ: typeof templates[0]) => {
    // Generate structured HTML for adoption
    const headerBorder = templ.id === 1 ? '#2563EB' : templ.id === 2 ? '#9333EA' : templ.id === 3 ? '#0D9488' : templ.id === 4 ? '#D97706' : templ.id === 5 ? '#E11D48' : '#059669';
    const headerBg = templ.id === 1 ? '#EFF6FF' : templ.id === 2 ? '#FBF7FF' : templ.id === 3 ? '#F0FDF4' : templ.id === 4 ? '#FEF3C7' : templ.id === 5 ? '#FFF1F2' : '#F0FDF4';
    
    let htmlContent = `
      <div style="border: 2px solid ${headerBorder}; border-radius: 8px; overflow: hidden; margin: 20px 0; font-family: 'Inter', sans-serif;">
        <div style="background-color: ${headerBg}; padding: 16px; border-bottom: 2px solid ${headerBorder};">
          <h2 style="margin: 0; font-size: 14pt; color: ${headerBorder}; font-weight: bold;">${templ.title}</h2>
          <p style="margin: 4px 0 0 0; font-size: 10pt; color: #4B5563; font-style: italic;">Focus: ${templ.focus}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
    `;

    templ.fields.forEach(f => {
      htmlContent += `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="width: 30%; padding: 12px; font-weight: bold; background-color: #F9FAFB; border-right: 1px solid #E5E7EB; vertical-align: top; color: #1F2937;">${f.section}</td>
          <td style="width: 70%; padding: 12px; vertical-align: top; color: #4B5563; white-space: pre-wrap;">${f.detail}</td>
        </tr>
      `;
    });

    htmlContent += `
        </table>
      </div>
      <p><br/></p>
    `;

    onAdoptTemplate(htmlContent);
  };

  const curr = templates[selectedTemplate];

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden text-gray-850">
      
      {/* Sidebar List */}
      <div className="w-80 border-r border-gray-200 bg-white p-6 flex flex-col h-full overflow-y-auto">
        <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wider text-slate-400">Available Templates</h3>
        <p className="text-xs text-gray-500 mb-6 font-medium">Select a structural template to view compliance fields. Adopt selected templates to the drafting suite.</p>
        
        <div className="space-y-3 flex-1">
          {templates.map((t, i) => (
            <div 
              key={t.id} 
              onClick={() => setSelectedTemplate(i)}
              className={cn(
                "p-4 border rounded-xl cursor-pointer transition-all flex flex-col gap-1.5",
                selectedTemplate === i 
                  ? "border-indigo-600 bg-indigo-50/50 shadow-sm" 
                  : "border-gray-200 bg-white hover:border-indigo-400"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full shrink-0", t.themeColor)}></span>
                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{t.title}</h4>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">{t.focus}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Preview */}
      <div className="flex-1 p-8 overflow-y-auto hide-scrollbar flex flex-col items-center justify-start bg-slate-50">
        <div className="max-w-[210mm] w-full bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden p-8 flex flex-col min-h-[297mm]">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 shrink-0">
            <div>
              <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full", curr.colorBadge)}>
                STATUTORY STRUCTURE
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-2">{curr.title}</h2>
              <p className="text-xs text-gray-500 mt-1 font-medium italic">Complies directly with National Treasury & SALGA guidelines.</p>
            </div>
            
            <button 
              onClick={() => handleAdopt(curr)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <LayoutTemplate className="w-4 h-4" />
              Adopt Into Drafting Suite
            </button>
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-650 bg-slate-50 p-4 rounded-xl border border-gray-150 mb-6 font-medium">
              <strong>Operational Focus:</strong> {curr.focus}
            </p>

            <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden text-xs text-gray-800 shadow-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-gray-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <th className="w-1/3 text-left p-4 border-r border-gray-250">Council & SDBIP Compliance Target Section</th>
                  <th className="w-2/3 text-left p-4">Mandatory Compliance Detail</th>
                </tr>
              </thead>
              <tbody>
                {curr.fields.map((f, fk) => (
                  <tr key={fk} className="border-b border-gray-200 last:border-b-0 hover:bg-slate-50/50">
                    <td className="p-4 font-bold border-r border-gray-250 bg-slate-50 text-gray-900 leading-normal align-top">{f.section}</td>
                    <td className="p-4 text-gray-650 leading-relaxed align-top whitespace-pre-wrap">{f.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold shrink-0">
            <span>MUTUAL LOCAL GOVERNMENT STANDARD WORKBOOK</span>
            <span>PAGE 1 of 1</span>
          </div>

        </div>
      </div>

    </div>
  );
}

interface DraftingSuiteTabProps {
  currentUser: User;
  activeTenantId: string;
  adoptedTemplateData: string | null;
  clearAdopted: () => void;
}

function DraftingSuiteTab({ currentUser, activeTenantId, adoptedTemplateData, clearAdopted }: DraftingSuiteTabProps) {
  const [activeMenu, setActiveMenu] = useState<'Home' | 'Insert' | 'Draw' | 'Design' | 'Layout' | 'References' | 'Mailings' | 'Review' | 'View' | 'File' | 'Advanced'>('Home');
  const [content, setContent] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  
  // Custom states matching Office options
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [showGridlines, setShowGridlines] = useState<boolean>(false);
  const [pageColor, setPageColor] = useState<string>('#ffffff');
  const [pageBorder, setPageBorder] = useState<string>('none');
  const [watermark, setWatermark] = useState<string>('');
  
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const emitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const documentId = activeTenantId === 'global' ? 'cm-global' : `cm-${activeTenantId}`;

  const menus: Array<'Home' | 'Insert' | 'Draw' | 'Design' | 'Layout' | 'References' | 'Mailings' | 'Review' | 'View' | 'File' | 'Advanced'> = [
    'Home', 'Insert', 'Draw', 'Design', 'Layout', 'References', 'Mailings', 'Review', 'View', 'File', 'Advanced'
  ];

  // Socket sync & Load from Supabase
  useEffect(() => {
    const newSocket = io({ transports: ['websocket', 'polling'] });
    setSocket(newSocket);

    newSocket.emit("join_document", { documentId, userEmail: currentUser.email });

    newSocket.on("document_update", (data: any) => {
      if (data.senderId !== currentUser.id) {
         setContent(data.content);
         if (editorRef.current && editorRef.current.innerHTML !== data.content) {
            editorRef.current.innerHTML = data.content;
         }
      }
    });

    newSocket.on("presence", (users: any[]) => {
       setActiveUsers(users);
    });

    return () => {
      newSocket.emit("leave_document", { documentId });
      newSocket.disconnect();
    };
  }, [documentId, currentUser]);

  // Handle Adopted template data from the templates tab
  useEffect(() => {
    if (adoptedTemplateData && editorRef.current) {
      const currentHTML = editorRef.current.innerHTML;
      // We wrap the adopted HTML block neatly
      const adoptedBlock = `
        <div style="border-left: 4px solid #4F46E5; padding-left: 12px; margin: 16px 0;">
          ${adoptedTemplateData}
        </div>
      `;
      const combinedHTML = currentHTML + adoptedBlock;
      editorRef.current.innerHTML = combinedHTML;
      setContent(combinedHTML);
      
      if (socket) {
        socket.emit("document_update", { documentId, content: combinedHTML, senderId: currentUser.id });
      }
      clearAdopted(); // Clear so it only inserts once
    }
  }, [adoptedTemplateData, socket, documentId, currentUser, clearAdopted]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    
    if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
    emitTimeoutRef.current = setTimeout(() => {
       if (socket) {
          socket.emit("document_update", { documentId, content: newContent, senderId: currentUser.id });
       }
    }, 300);
  };

  // Safe Formatting commands using Document execCommand
  const format = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleInput({ currentTarget: editorRef.current } as any);
    }
  };

  const handleSave = () => {
    if (socket && editorRef.current) {
      socket.emit("document_update", { documentId, content: editorRef.current.innerHTML, senderId: currentUser.id });
      alert("Document saved successfully to Supabase Database (apr_documents table as key " + documentId + ").");
    }
  };

  const executeFindReplace = () => {
    if (!editorRef.current || !findText) return;
    const bodyText = editorRef.current.innerHTML;
    // Simple global replace of matches
    const escapedFind = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedFind, 'gi');
    const updated = bodyText.replace(regex, replaceText);
    editorRef.current.innerHTML = updated;
    setContent(updated);
    if (socket) {
      socket.emit("document_update", { documentId, content: updated, senderId: currentUser.id });
    }
    alert(`Replaced matches for "${findText}" with "${replaceText}".`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Word & character counts
  const wordCount = (content.replace(/<[^>]*>/g, '').match(/\S+/g) || []).length;
  const charCount = content.replace(/<[^>]*>/g, '').length;

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none text-gray-800">
      
      {/* ----------------- MS WORD RIBBON ----------------- */}
      <div className="bg-white border-b border-gray-250 shrink-0 shadow-sm z-15 block">
        
        {/* Ribbon Top Tabs row */}
        <div className="flex justify-between items-end px-2 pt-1 bg-slate-50 border-b border-gray-100">
           <div className="flex overflow-x-auto hide-scrollbar">
             {menus.map(name => (
               <button 
                 key={name}
                 onClick={() => setActiveMenu(name)}
                 className={cn(
                   "px-3.5 py-1.5 text-xs transition-all border-b-2 font-bold tracking-tight shrink-0",
                   activeMenu === name 
                     ? "border-indigo-600 text-indigo-700 bg-white rounded-t-md" 
                     : "border-transparent text-gray-600 hover:bg-gray-150"
                 )}
               >
                 {name}
               </button>
             ))}
           </div>
           
           {/* Document title & Active Collab Users */}
           <div className="flex items-center gap-3 mr-4 pb-1 text-xs">
              <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-800 px-2 py-0.5 rounded font-bold uppercase tracking-tight">Active Room</span>
              <div className="flex -space-x-1.5 shrink-0">
                 {[...new Set(activeUsers)].slice(0, 5).map((emailKey: any, i: number) => (
                    <div 
                      key={i} 
                      className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] text-white font-bold shrink-0 shadow-xs" 
                      style={{ backgroundColor: `hsl(${(i * 55) % 360}, 65%, 45%)` }} 
                      title={String(emailKey)}
                    >
                      {String(emailKey).charAt(0).toUpperCase()}
                    </div>
                 ))}
                 {new Set(activeUsers).size > 5 && (
                   <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] text-white font-bold bg-slate-500 shrink-0">
                     +{new Set(activeUsers).size - 5}
                   </div>
                 )}
              </div>
           </div>
        </div>
        
        {/* Active Ribbon Content area */}
        <div className="px-4 py-2 bg-white min-h-[75px] flex items-center gap-3 overflow-x-auto hide-scrollbar select-none border-b border-gray-250">
           
           {/* ================= HOME TAB ================= */}
           {activeMenu === 'Home' && (
             <div className="flex items-center gap-3 shrink-0 h-full">
                {/* Clipboard */}
                <div className="flex flex-col items-center border-r border-gray-205 pr-2 gap-1 justify-center">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => format('cut')} className="p-1 hover:bg-slate-100 rounded text-gray-700" title="Cut"><Scissors className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('copy')} className="p-1 hover:bg-slate-100 rounded text-gray-700" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('paste')} className="p-1 hover:bg-slate-100 rounded text-gray-700" title="Paste"><Clipboard className="w-3.5 h-3.5" /></button>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Clipboard</span>
                </div>

                {/* Font Choices */}
                <div className="flex flex-col items-center border-r border-gray-205 pr-2 justify-center">
                  <div className="flex items-center gap-1">
                    <select onChange={(e) => format('fontName', e.target.value)} className="border border-gray-250 rounded px-1.5 py-0.5 text-[11px] focus:outline-none w-28 text-gray-800">
                      <option value="Inter">Inter (Sans-Serif)</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                    <select onChange={(e) => format('fontSize', e.target.value)} className="border border-gray-250 rounded px-1 py-0.5 text-[11px] focus:outline-none w-14 text-gray-800">
                      <option value="3">12pt</option>
                      <option value="1">8pt</option>
                      <option value="2">10pt</option>
                      <option value="4">14pt</option>
                      <option value="5">18pt</option>
                      <option value="6">24pt</option>
                      <option value="7">36pt</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <button onClick={() => format('bold')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center font-bold text-gray-700 block text-xs" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('italic')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center italic text-gray-700 block text-xs" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('underline')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center underline text-gray-700 block text-xs" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('strikeThrough')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center line-through text-gray-700 block text-xs" title="Strikethrough">S</button>
                    <button onClick={() => format('superscript')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700 text-[10px]" title="Superscript">x²</button>
                    <button onClick={() => format('subscript')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700 text-[10px]" title="Subscript">x₂</button>
                    <div className="w-px h-3 bg-gray-200"></div>
                    <button onClick={() => format('backColor', '#ffff00')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-yellow-500" title="Text Highlight">A(H)</button>
                    <button onClick={() => format('foreColor', '#e11d48')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-rose-600" title="Font Color">A(C)</button>
                    <button onClick={() => format('removeFormat')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-xs text-gray-400" title="Clear Formatting">C</button>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Font</span>
                </div>

                {/* Paragraph */}
                <div className="flex flex-col items-center border-r border-gray-205 pr-2 justify-center">
                  <div className="flex items-center gap-1">
                    <button onClick={() => format('justifyLeft')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('justifyCenter')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700" title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('justifyRight')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('justifyFull')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700" title="Justify"><AlignJustify className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <button onClick={() => format('insertUnorderedList')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700" title="Bullets"><List className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('insertOrderedList')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700" title="Numbering"><ListOrdered className="w-3.5 h-3.5" /></button>
                    <button onClick={() => format('outdent')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700 text-xs" title="Decrease Indent">&lt;</button>
                    <button onClick={() => format('indent')} className="w-5 h-5 hover:bg-slate-100 rounded flex items-center justify-center text-gray-700 text-xs" title="Increase Indent">&gt;</button>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Paragraph</span>
                </div>

                {/* Styles and Formatting preset */}
                <div className="flex flex-col items-center border-r border-gray-205 pr-2 gap-1 justify-center">
                  <div className="flex gap-1.5">
                    <button onClick={() => format('formatBlock', '<h1>')} className="text-[10px] bg-slate-50 border border-gray-200 px-1.5 py-0.5 rounded font-bold text-gray-800 hover:bg-slate-100">Heading 1</button>
                    <button onClick={() => format('formatBlock', '<h2>')} className="text-[10px] bg-slate-50 border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-800 hover:bg-slate-100">Heading 2</button>
                    <button onClick={() => format('formatBlock', '<p>')} className="text-[10px] bg-slate-50 border border-gray-200 px-1.5 py-0.5 rounded text-gray-800 hover:bg-slate-100">Normal</button>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Styles</span>
                </div>

                {/* Editing */}
                <div className="flex flex-col items-center pr-2 justify-center gap-1">
                  <button 
                    onClick={() => setShowFindReplace(!showFindReplace)} 
                    className={cn("px-3 py-1 text-xs rounded border font-bold flex items-center gap-1", showFindReplace ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100")}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Find / Replace
                  </button>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Editing</span>
                </div>
             </div>
           )}

           {/* ================= INSERT TAB ================= */}
           {activeMenu === 'Insert' && (
             <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-center border-r border-gray-200 pr-3 justify-center gap-1">
                   <div className="flex gap-2">
                     <button onClick={() => format('insertHTML', '<div style="page-break-before: always; border-top: 2px dashed #4F46E5; margin-top:20px; padding-top:20px; font-weight:bold; color:#4F46E5;">--- NEW BLANK PAGE BREAK ---</div><p><br/></p>')} className="flex flex-col items-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold"><FileText className="w-4 h-4 text-violet-500 mb-0.5" />Page Break</button>
                     <ExportDropdowns 
                       activeTenantId={activeTenantId} 
                       onInsertHTML={(html) => {
                          if (!editorRef.current) return;
                          const isCover = html.includes("draft-suite-cover-page-block");
                          const currentHTML = editorRef.current.innerHTML;
                          const newHTML = isCover ? (html + currentHTML) : (currentHTML + html);
                          editorRef.current.innerHTML = newHTML;
                          setContent(newHTML);
                          if (socket) {
                            socket.emit("document_update", { documentId, content: newHTML, senderId: currentUser.id });
                          }
                          alert(isCover ? "Cover Page layout successfully injected at the top of your draft document!" : "Graph Lab layout successfully injected into your document!");
                       }} 
                     />
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Pages</span>
                </div>

                <div className="flex flex-col items-center border-r border-gray-200 pr-3 justify-center gap-1">
                   <button 
                     onClick={() => format('insertHTML', '<table style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #D1D5DB;"><tr style="background:#F3F4F6;"><th style="padding:8px; border:1px solid #D1D5DB;">Header 1</th><th style="padding:8px; border:1px solid #D1D5DB;">Header 2</th></tr><tr><td style="padding:8px; border:1px solid #D1D5DB;">Data Cell A</td><td style="padding:8px; border:1px solid #D1D5DB;">Data Cell B</td></tr></table><p><br/></p>')}
                     className="flex flex-col items-center p-1.5 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold"
                   >
                     <FileSpreadsheet className="w-4 h-4 text-emerald-500 mb-0.5" />
                     Insert Table
                   </button>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Tables</span>
                </div>

                <div className="flex flex-col items-center border-r border-gray-200 pr-3 justify-center gap-1">
                   <div className="flex gap-2">
                     <button onClick={() => format('insertImage', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80')} className="flex flex-col items-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold">🖼️ Picture</button>
                     <button onClick={() => format('insertHTML', '<div style="width:60px; height:60px; background:#4F46E5; border-radius:50%; display:inline-block; margin:8px;"></div>')} className="flex flex-col items-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold">🔵 Shape</button>
                     <button onClick={() => format('insertHTML', '<div style="border:1px solid #E5E7EB; border-radius:8px; padding:12px; margin:10px 0;"><h3 style="margin:0; font-weight:bold; color:#10B981;">📊 COMPLIANCE METRIC CHART</h3><div style="background:#F3F4F6; height:120px; display:flex; align-items:flex-end; gap:8px; padding:12px 24px; border-radius:6px; margin:8px 0;"><div style="background:#10B981; width:24px; height:80%;"></div><div style="background:#10B981; width:24px; height:45%;"></div><div style="background:#10B981; width:24px; height:95%;"></div></div></div>')} className="flex flex-col items-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold">📉 Chart</button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Illustrations & Media</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1">
                   <div className="flex gap-2">
                     <button onClick={() => format('insertHTML', '<div style="font-size: 10pt; color: #374151; padding: 4px; background: #FEF3C7; border-radius: 4px; margin: 4px 0; display: inline-block;">[Comment Reference ID: 2026]</div>')} className="flex flex-col items-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold"><MessageSquare className="w-4 h-4 text-blue-500 mb-0.5" />Comment</button>
                     <button onClick={() => format('insertHTML', '<span style="font-family:\'Courier New\'; font-weight:bold; font-size:16pt;">&Sigma; (X + Y) &Delta;</span>')} className="flex flex-col items-center p-1 hover:bg-slate-100 rounded text-gray-700 text-[10px] font-semibold">&Sigma; Symbol</button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Annotations / Symbols</span>
                </div>
             </div>
           )}

           {/* ================= DRAW TAB ================= */}
           {activeMenu === 'Draw' && (
             <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-center border-r border-gray-200 pr-3 justify-center gap-1">
                   <div className="flex gap-2.5">
                     <button onClick={() => alert('Drawing Pen selected. Ink is ready')} className="p-1 hover:bg-indigo-50 border border-gray-200 rounded flex flex-col items-center text-[10px] font-semibold text-gray-750 shrink-0"><PenTool className="w-4 h-4 text-rose-500 mb-0.5" />Pen</button>
                     <button onClick={() => alert('Highlighter tool selected')} className="p-1 hover:bg-indigo-50 border border-gray-200 rounded flex flex-col items-center text-[10px] font-semibold text-gray-750 shrink-0"><CheckIcon className="w-4 h-4 text-yellow-500 mb-0.5" />Highlighter</button>
                     <button onClick={() => alert('Ink Eraser selected')} className="p-1 hover:bg-indigo-50 border border-gray-200 rounded flex flex-col items-center text-[10px] font-semibold text-gray-750 shrink-0">🧹 Eraser</button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Drawing Tools</span>
                </div>
                
                <div className="flex flex-col items-center justify-center gap-1">
                   <div className="flex gap-2 text-[10px] text-slate-600 font-medium">
                     <button onClick={() => format('insertHTML', '&#9633;')} className="px-2 py-1 bg-slate-50 border border-gray-200 rounded hover:bg-gray-100">Ink to Shape</button>
                     <button onClick={() => format('insertHTML', '&int; x.dx')} className="px-2 py-1 bg-slate-50 border border-gray-200 rounded hover:bg-gray-100">Ink to Math</button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Ink Actions</span>
                </div>
             </div>
           )}

           {/* ================= DESIGN TAB ================= */}
           {activeMenu === 'Design' && (
             <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-center border-r border-gray-200 pr-3 justify-center gap-1">
                   <div className="flex gap-2">
                     <button onClick={() => { setPageColor('#ffffff'); }} className="px-2 py-1 bg-white border border-gray-300 text-[10px] rounded font-bold shadow-xs">Classic White</button>
                     <button onClick={() => { setPageColor('#fbfbf9'); }} className="px-2 py-1 bg-[#fbfbf9] border border-gray-300 text-[10px] rounded font-bold shadow-xs">Editorial Warm</button>
                     <button onClick={() => { setPageColor('#eff6ff'); }} className="px-2 py-1 bg-[#eff6ff] border border-gray-300 text-[10px] rounded font-bold shadow-xs">Corporate Cool</button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Page Color</span>
                </div>

                <div className="flex flex-col items-center border-r border-gray-200 pr-3 justify-center gap-1">
                   <div className="flex gap-2">
                     <button onClick={() => { setPageBorder('none'); }} className="px-2 py-1 bg-slate-50 border border-gray-200 text-[10px] rounded font-semibold hover:bg-slate-100">None</button>
                     <button onClick={() => { setPageBorder('2px solid #4F46E5'); }} className="px-2 py-1 bg-slate-50 border border-gray-200 text-[10px] rounded font-semibold hover:bg-slate-100">Solid Indigo</button>
                     <button onClick={() => { setPageBorder('4px double #10B981'); }} className="px-2 py-1 bg-slate-50 border border-gray-200 text-[10px] rounded font-semibold hover:bg-slate-100">Double Teal </button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Page Borders</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1">
                   <div className="flex items-center gap-1.5">
                     <input 
                       type="text" 
                       placeholder="CONFIDENTIAL" 
                       value={watermark}
                       onChange={e => setWatermark(e.target.value)}
                       className="border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none w-28 placeholder:text-gray-400"
                     />
                     <button onClick={() => setWatermark('')} className="p-1 text-xs text-rose-500 font-bold block" title="Clear Watermark">X</button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Watermark Tool</span>
                </div>
             </div>
           )}

           {/* ================= LAYOUT TAB ================= */}
           {activeMenu === 'Layout' && (
             <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-center justify-center gap-1">
                   <div className="flex gap-2 text-[10px] text-gray-700 font-bold">
                     <button onClick={() => alert('Margins set to Normal A4 (2.54cm)')} className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded hover:bg-slate-100 flex items-center gap-1">Normal</button>
                     <button onClick={() => alert('Margins set to Narrow (1.27cm)')} className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded hover:bg-slate-100 flex items-center gap-1">Narrow</button>
                     <button onClick={() => alert('Orientation switched to Landscape')} className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded hover:bg-slate-100 flex items-center gap-1">Landscape</button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Page Setup</span>
                </div>
             </div>
           )}

           {/* ================= REFERENCES TAB ================= */}
           {activeMenu === 'References' && (
             <div className="flex items-center gap-4 shrink-0">
                <button 
                  onClick={() => format('insertHTML', '<div style="border: 1px solid #E5E7EB; padding: 16px; border-radius: 6px; background: #F9FAFB; margin:16px 0;"><h3 style="margin:0 0 8px 0; font-weight:bold;">TABLE OF CONTENTS</h3><p style="margin:2px 0;">1. Component Overview ...................................................... Page 1</p><p style="margin:2px 0;">2. Change Framework Verification ........................................ Page 2</p></div>')} 
                  className="px-3 py-1.5 bg-slate-50 border border-gray-200 text-[10px] font-bold rounded flex items-center gap-1 hover:bg-slate-100"
                >
                  <ListOrdered className="w-4 h-4 text-indigo-500" /> Insert Table of Contents
                </button>
                <button 
                  onClick={() => format('insertHTML', '<sup style="color:#4F46E5; font-weight:bold;">[1]</sup>')} 
                  className="px-3 py-1.5 bg-slate-50 border border-gray-200 text-[10px] font-bold rounded flex items-center gap-1 hover:bg-slate-100"
                >
                  <Bookmark className="w-4 h-4 text-indigo-500" /> Insert Footnote
                </button>
                <button 
                  onClick={() => format('insertHTML', '<div style="font-size:9pt; color:#6B7280; font-family:serif; border-left:2px solid #D1D5DB; padding-left:8px; margin: 10px 0;"><strong>Bibliography:</strong> Local Government Municipal Systems Act (No. 32 of 2000). Pretoria: Govt Printers.</div>')} 
                  className="px-3 py-1.5 bg-slate-50 border border-gray-200 text-[10px] font-bold rounded flex items-center gap-1 hover:bg-slate-100"
                >
                  <FileText className="w-4 h-4 text-indigo-500" /> Bibliography (APA)
                </button>
             </div>
           )}

           {/* ================= MAILINGS TAB ================= */}
           {activeMenu === 'Mailings' && (
             <div className="flex items-center gap-4 shrink-0 text-gray-500 text-xs">
                <span>Mail Merge parameters integrated. Target database matches <strong>Municipal Register Office</strong>.</span>
                <button onClick={() => alert('Starting Mail Merge for all registered Ward Councillors')} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded">Start Merge</button>
             </div>
           )}

           {/* ================= REVIEW TAB ================= */}
           {activeMenu === 'Review' && (
             <div className="flex items-center gap-4 shrink-0">
                <button 
                  onClick={() => alert(`Word Count metrics:\n- Words: ${wordCount}\n- Characters: ${charCount}`)}
                  className="px-3 py-1.5 bg-slate-50 border border-gray-200 text-[11px] font-bold rounded flex items-center gap-1.5 text-gray-750 hover:bg-slate-100"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  Spelling & Word Count
                </button>
                
                <button 
                  onClick={() => {
                    const cleanText = editorRef.current?.innerText || '';
                    if (!cleanText) {
                      alert('Please write something in the editor first.');
                      return;
                    }
                    const speakObj = new SpeechSynthesisUtterance(cleanText.slice(0, 400));
                    speakObj.lang = 'en-ZA';
                    window.speechSynthesis.speak(speakObj);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-gray-200 text-[11px] font-bold rounded flex items-center gap-1.5 text-gray-750 hover:bg-slate-100"
                >
                  <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
                  Read Aloud
                </button>
             </div>
           )}

           {/* ================= VIEW TAB ================= */}
           {activeMenu === 'View' && (
             <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col items-center border-r border-gray-200 pr-3 justify-center gap-1">
                   <div className="flex items-center gap-3">
                     <label className="flex items-center gap-1 text-[11px] font-bold text-gray-700 cursor-pointer">
                       <input type="checkbox" checked={showRuler} onChange={e => setShowRuler(e.target.checked)} className="rounded text-indigo-600" />
                       Ruler
                     </label>
                     <label className="flex items-center gap-1 text-[11px] font-bold text-gray-700 cursor-pointer">
                       <input type="checkbox" checked={showGridlines} onChange={e => setShowGridlines(e.target.checked)} className="rounded text-indigo-600" />
                       Gridlines
                     </label>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Show/Hide</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1">
                   <div className="flex items-center gap-1">
                     <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} className="p-1 bg-slate-100 rounded hover:bg-gray-200 border border-gray-200 shrink-0 select-none"><ZoomOut className="w-3 h-3" /></button>
                     <span className="text-xs font-bold text-gray-750 w-10 text-center">{zoomLevel}%</span>
                     <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))} className="p-1 bg-slate-100 rounded hover:bg-gray-200 border border-gray-200 shrink-0 select-none"><ZoomIn className="w-3 h-3" /></button>
                   </div>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Zoom View</span>
                </div>
             </div>
           )}

           {/* ================= FILE TAB ================= */}
           {activeMenu === 'File' && (
             <div className="flex items-center gap-4 shrink-0">
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors">
                  <Save className="w-4 h-4" /> Save to Cloud Storage
                </button>
                <button onClick={handlePrint} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors">
                  <Printer className="w-4 h-4" /> Print PDF Preview
                </button>
                <button onClick={() => alert('Invited editors successfully.')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded font-bold text-xs flex items-center gap-1.5 border border-gray-300 transition-colors">
                  <Share2 className="w-4 h-4" /> Invite Co-Authors
                </button>
             </div>
           )}

           {/* ================= ADVANCED TAB ================= */}
           {activeMenu === 'Advanced' && (
             <div className="flex items-center gap-4 shrink-0">
                <button onClick={() => format('insertHTML', '<br/><code style="font-family:\'Courier New\'; font-weight:bold; background:#F3F4F6; padding:2px 4px; border-radius:4px; font-size:10pt;">[automated_api_macro_payload]</code><br/>')} className="px-3 py-1.5 bg-slate-50 border border-gray-250 text-[10px] font-bold rounded flex items-center gap-1 text-gray-750 hover:bg-slate-100 shadow-3xs">
                  <Code className="w-4 h-4 text-indigo-500" /> Insert Macro Tag
                </button>
                <button onClick={() => format('insertHTML', '<input type="checkbox" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;" />')} className="px-3 py-1.5 bg-slate-50 border border-gray-250 text-[10px] font-bold rounded flex items-center gap-1 text-gray-750 hover:bg-slate-100 shadow-3xs">
                  <CheckIcon className="w-4 h-4 text-indigo-500" /> Insert Checkbox Controller
                </button>
             </div>
           )}

        </div>
      </div>

      {/* ----------------- FIND & REPLACE SUB PANEL ----------------- */}
      {showFindReplace && (
        <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-2.5 flex items-center gap-4 shrink-0 animate-slide-down">
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-indigo-800 shrink-0">Find:</span>
             <input 
               type="text" 
               placeholder="Search text..." 
               value={findText}
               onChange={e => setFindText(e.target.value)}
               className="bg-white border border-gray-250 rounded px-2.5 py-1 text-xs outline-none focus:border-indigo-500 w-44"
             />
           </div>
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-indigo-800 shrink-0">Replace with:</span>
             <input 
               type="text" 
               placeholder="New replacement..." 
               value={replaceText}
               onChange={e => setReplaceText(e.target.value)}
               className="bg-white border border-gray-250 rounded px-2.5 py-1 text-xs outline-none focus:border-indigo-500 w-44"
             />
           </div>
           <button onClick={executeFindReplace} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all">Replace All</button>
           <button onClick={() => setShowFindReplace(false)} className="text-gray-400 hover:text-gray-600 shrink-0 font-bold px-1.5 py-0.5 ml-auto">✕</button>
        </div>
      )}

      {/* ----------------- RULERS & EDITOR CANVAS AREA ----------------- */}
      <div className="flex-1 overflow-y-auto bg-[#F3F2F1] relative p-8 flex flex-col items-center hide-scrollbar">
         
         {/* Top Ruler Visual */}
         {showRuler && (
           <div className="w-[210mm] h-4 bg-white border border-gray-250 shrink-0 relative flex items-end select-none text-[8px] text-gray-400 font-bold mb-1 shadow-sm">
             <span className="absolute left-2 text-[7px]">cm</span>
             <span className="absolute left-[2.5cm]">|</span>
             <span className="absolute left-[5cm]">5</span>
             <span className="absolute left-[7.5cm]">|</span>
             <span className="absolute left-[10cm]">10</span>
             <span className="absolute left-[12.5cm]">|</span>
             <span className="absolute left-[15cm]">15</span>
             <span className="absolute left-[18.5cm] text-red-500 font-bold text-[9px]" title="Margin Right Boundary">&#9660;</span>
             <span className="absolute left-[2.54cm] text-indigo-500 font-bold text-[9px]" title="Margin Left Boundary">&#9660;</span>
           </div>
         )}

         {/* Gridlines overlay style wrapper */}
         <div 
           className="bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] mb-12 w-[210mm] min-h-[297mm] h-max relative overflow-hidden flex flex-col justify-between"
           style={{ 
             transform: `scale(${zoomLevel / 100})`, 
             transformOrigin: 'top center',
             backgroundColor: pageColor,
             border: pageBorder,
             backgroundImage: showGridlines ? 'linear-gradient(to right, #E5E7EB 1px, transparent 1px), linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)' : 'none',
             backgroundSize: '15px 15px'
           }}
         >
            {/* Watermark layer if set */}
            {watermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-10">
                <span className="text-gray-900 font-bold text-5xl uppercase tracking-widest leading-none rotate-45 text-center block w-full">{watermark}</span>
              </div>
            )}
            
            {/* Safe margin bounds lines (interactive feedback only) */}
            <div className="absolute top-0 bottom-0 left-[2.5cm] border-l border-indigo-100/10 pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 right-[2.5cm] border-r border-indigo-100/10 pointer-events-none"></div>
            <div className="absolute left-0 right-0 top-[2.5cm] border-t border-indigo-100/10 pointer-events-none"></div>
            
            {/* Formatted ContentEditable Text Box */}
            <div 
              ref={editorRef}
              contentEditable 
              className="outline-none text-black font-serif text-[11pt] leading-relaxed whitespace-pre-wrap z-10 select-text flex-1 break-words overflow-x-hidden"
              style={{ 
                padding: '2.54cm 2.54cm 1.5cm 2.54cm',
                maxWidth: '100%',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
              data-placeholder="Begin typing compliance change management documentation here..."
              onInput={handleInput}
            ></div>

            {/* Page Footer */}
            <div className="mt-auto border-t border-gray-150 py-3 px-[2.54cm] flex justify-between text-[11px] text-gray-400 font-medium select-none z-10 bg-transparent shrink-0">
               <span>Prepared By Mzansi Flow PMS System</span>
               <span>Page 1 of 1</span>
            </div>
         </div>
      </div>
      
      {/* ----------------- WORD PROCESSOR STATUS BAR ----------------- */}
      <div className="h-6 bg-indigo-700 text-white flex items-center justify-between px-4 text-[10px] shrink-0 font-bold select-none shadow-md z-10 uppercase tracking-wider">
         <div className="flex items-center gap-4">
           <span>Page 1 of 1</span>
           <span>{wordCount} words</span>
           <span>English (South Africa)</span>
         </div>
         <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <button title="Print Layout Mode" onClick={() => alert('Switched to Print Layout')}><LayoutTemplate className="w-3 h-3" /></button>
             <button title="Quick Print Document" onClick={handlePrint}><Printer className="w-3 h-3 opacity-70" /></button>
           </div>
           <div className="flex items-center gap-2">
             <span className="w-24 h-1 bg-white/20 rounded-full overflow-hidden flex items-center relative">
               <span className="absolute top-1/2 left-1/2 w-1.5 h-3 bg-white -translate-y-1/2 rounded-full cursor-pointer"></span>
             </span>
             <span>{zoomLevel}%</span>
           </div>
         </div>
      </div>

    </div>
  );
}
