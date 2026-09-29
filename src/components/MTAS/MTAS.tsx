import React, { useState } from 'react';
import { User } from '../../types';
import { BookOpen, MonitorPlay, PenTool, LayoutGrid, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '../Branding';
import { DraftingSuiteTab } from '../APR/APR';

interface MTASProps {
  currentUser: User;
  activeTenantId: string;
}

export function MTAS({ currentUser, activeTenantId }: MTASProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'model' | 'template'>('brief');

  const mtasChapters = [
    `1. Statutory Report: Section 71 Monthly Budget Statement Template\n\nThis standardized reporting framework fulfills the statutory submission requirements under Section 71 of the Local Government: Municipal Finance Management Act (MFMA) No. 56 of 2003.\n\nSECTION 71 MONTHLY BUDGET STATEMENT REPORT\nMUNICIPALITY NAME: [Insert Name]\nFINANCIAL YEAR: [e.g., 2026/2027]\nREPORTING PERIOD: [Month, Year]\nSUBMISSION DATE: [Must be within 10 working days after month-end]\n\n1.1 Executive Summary & Performance Indicators\n\n1.1.1 Financial Dashboard Snapshot\nFinancial Indicator | Year-to-Date (YTD) Budget (R) | Actual Result (R) | Variance (%) | Status (Healthy / Critical)\nTotal Revenue Collected | [Amount] | [Amount] | [X%] | [Status]\nTotal Operational Expenditure | [Amount] | [Amount] | [X%] | [Status]\nCapital Expenditure Spent | [Amount] | [Amount] | [X%] | [Status]\nCash / Bank Balance | — | [Amount] | — | [Status]\n\n1.1.2 Material Variances & Explanations\n[Example Intervention Note]: Revenue collection is currently 14% below target due to data errors in the billing system inherited in Phase 1. An automated data-cleansing process is underway to stabilize collections by month 3.\n\n1.2 Detailed Financial Performance\n\n1.2.1 Revenue Framework (MFMA Sec 71(1)(a))\nRevenue Source | Original Budget (R) | Monthly Actual (R) | YTD Actual (R) | Collection Rate (%)\nProperty Rates | [Amount] | [Amount] | [Amount] | [X%]\nElectricity Sales | [Amount] | [Amount] | [Amount] | [X%]\nWater Sales | [Amount] | [Amount] | [Amount] | [X%]\nSanitation & Refuse | [Amount] | [Amount] | [Amount] | [X%]\nGovernment Grants (Equitable Share) | [Amount] | [Amount] | [Amount] | [X%]\nTotal Revenue | [Amount] | [Amount] | [Amount] | [X%]\n\n1.2.2 Operational Expenditure (MFMA Sec 71(1)(c))\nExpenditure Type | Original Budget (R) | Monthly Actual (R) | YTD Actual (R) | YTD Spend (%)\nEmployee Related Costs (Salaries) | [Amount] | [Amount] | [Amount] | [X%]\nRemuneration of Councillors | [Amount] | [Amount] | [Amount] | [X%]\nBulk Purchases (Eskom & Water) | [Amount] | [Amount] | [Amount] | [X%]\nContracted Services | [Amount] | [Amount] | [Amount] | [X%]\nOther Operational Costs | [Amount] | [Amount] | [Amount] | [X%]\nTotal Opex | [Amount] | [Amount] | [Amount] | [X%]\n\n1.3 Capital Expenditure & Grant Management\n\n1.3.1 Capital Budget Spend (MFMA Sec 71(1)(b))\nTotal Capital Budget Allocated: R [Amount]\nCapital Expenditure Spent YTD: R [Amount]\nPercentage Spent YTD: [X%]\n\n1.3.2 Conditional Grant Tracking\nGrant Name | Allocation Received (R) | Spent This Month (R) | Total Spent YTD (R) | Unspent Balance (R)\nMunicipal Infrastructure Grant (MIG) | [Amount] | [Amount] | [Amount] | [Amount]\nWater Services Infrastructure Grant | [Amount] | [Amount] | [Amount] | [Amount]\nTotal Grants | [Amount] | [Amount] | [Amount] | [Amount]\n\n1.4 Creditors & Debtors Management\n\n1.4.1 Creditors Age Analysis (MFMA Sec 65(2)(e) - 30-Day Rule)\nCreditor Name | 0 - 30 Days (R) | 31 - 60 Days (R) | 61 - 90 Days (R) | 91+ Days (R) | Total Owed (R)\nEskom Holdings | [Amount] | [Amount] | [Amount] | [Amount] | [Amount]\nWater Board | [Amount] | [Amount] | [Amount] | [Amount] | [Amount]\nTrade Creditors (SMEs) | [Amount] | [Amount] | [Amount] | [Amount] | [Amount]\nTotal Creditors | [Amount] | [Amount] | [Amount] | [Amount] | [Amount]\n\n1.4.2 Debtors Age Analysis (Consumer Receivables)\nTotal Outstanding Consumer Debt: R [Amount]\nGovernment Departments Debt: R [Amount]\nBusiness/Commercial Debt: R [Amount]\nResidential/Household Debt: R [Amount]\n\n1.5 Phase 1 Stabilization Recommendations & Remedial Actions\n(To be completed by the Accounting Officer / Administrator)\nRevenue Recovery Action: [e.g., Issue final demand notices to top 100 commercial debtors by the 15th of next month.]\nCost Containment Action: [e.g., Terminate month-to-month vehicle hire contracts and transition to internal fleet repairs.]\nBulk Debt Escalation: [e.g., Submit revised payment plan proposal to Eskom before the upcoming provincial treasury meeting.]\n\n1.6 Accounting Officer / Administrator Quality Certificate\nI, [Full Name], the Accounting Officer / Administrator of [Municipality Name], hereby certify that the Section 71 Monthly Budget Statement and supporting documentation for the month of [Month, Year] have been prepared in accordance with the Municipal Finance Management Act and the regulations made under the Act.\nPrint Name: ____________________________\nSignature: _____________________________\nDate: _________________`,

    `2. Council Resolution Draft\n\nThis document functions as the official legal instrument for council to adopt the turnaround strategy and its corresponding Section 71 reporting mechanisms.\n\nEXTRACT FROM THE MINUTES OF THE ORDINARY COUNCIL MEETING\nHELD AT: [Venue Name / Digital Chambers]\nDATE: [Insert Date]\nTIME: [Insert Time]\nRESOLUTION NUMBER: C/[Insert Number]/2026\n\nUPON MOTION duly made, seconded, and carried, IT WAS RESOLVED:\n\nAdoption of the Recovery Framework: Council formally adopts the Municipal Turnaround Strategy and Phased Recovery Framework (Phase 1: Stabilization, Phase 2: Recovery, Phase 3: Sustainable Growth) as the primary steering operational policy of the municipality.\n\nMandatory Reporting Package: Council approves the implementation of the standardized Section 71 Monthly Budget Statement reporting package template, effective immediately.\n\nAccounting Officer Mandate: The Accounting Officer (or Appointed Administrator under Section 139 intervention) is directed to compile and submit this reporting package to the Executive Mayor, Provincial Treasury, and National Treasury within 10 working days after the closure of every calendar month, in strict accordance with MFMA Section 71(1).\n\nExecution of Enforcement Measures: Council authorizes the Accounting Officer to implement the immediate corporate cost-containment instructions and enforcement measures attached to this resolution.\n\nEstablishment of Oversight Timeline: The Executive Mayor is directed to submit a written evaluation of the monthly report to Council at every subsequent ordinary sitting, detailing any failures by administration to execute specific Phase 1 recovery targets.\n\nCERTIFIED AS A TRUE EXTRACT OF THE RESOLUTION PASSED BY COUNCIL:\n\nMunicipal Manager / Administrator: ____________________\nSignature: ____________________\nDate: ____________________\n\nSpeaker of Council: ____________________\nSignature: ____________________\nDate: ____________________`,

    `3. Statutory Risk Register Template\n\nThis register tracks operational risks, financial impact, and individual legal liabilities if statutory deadlines under the Local Government: Municipal Finance Management Act (MFMA) are breached.\n\nRisk ID | Statutory Event / Deadline | Specific MFMA Breach | Primary Consequence & Penalty | Risk Rating (Low/Med/High) | Mitigating Control Action | Responsible Official\n\nR-01 | Monthly Reporting: Within 10 working days of month-end. | Failure to submit the Section 71 Monthly Budget Statement. | • Withholding of Equitable Share allocations (MFMA Sec 216(2)). • Irregular expenditure triggers. • Financial misconduct charges against the CFO. | HIGH | Implement automated ledger alerts 3 days prior to the statutory deadline. | Chief Financial Officer\n\nR-02 | 30-Day Payments: Paid within 30 days of invoice date. | Failure to clear verified trade and bulk supplier invoices (MFMA Sec 65(2)(e)). | • Accumulation of interest penalties. • Disconnection notices from Eskom/Water Boards. • Legal claims by local SMEs. | HIGH | Centralize payment tracking into a single registry; mandate weekly invoice-to-pay balance reviews. | Supply Chain Manager\n\nR-03 | Annual Financial Statements: Submission by 31 August. | Failure to submit Annual Financial Statements to the Auditor-General (MFMA Sec 126(1)). | • Mandatory Adverse or Disclaimed audit outcome. • Immediate Provincial Executive Section 139 discretionary intervention. • Public accountability hearings before MPAC. | CRITICAL | Appoint a dedicated AFS preparation team by 1 June to complete automated trial balances weekly. | Accounting Officer / MM\n\nR-04 | Annual Report: Tabled by 31 January. | Failure to table the Annual Report to Council (MFMA Sec 127(2)). | • Public notification of non-compliance. • Written explanation required to Provincial Legislature. • Severe loss of municipal credit rating. | MEDIUM | Draft individual components of the report concurrently starting 1 October. | Executive Mayor\n\nR-05 | Budget Approval: Concluded by 31 May. | Failure to approve the annual budget and IDP (MFMA Sec 24(1)). | • Dissolution of the municipal council. • Immediate stoppage of municipal funding lines on 1 July. • Provincial takeover of budget drafting. | CRITICAL | Enforce a 10-month planning schedule with mandatory adjustments completed in March. | Speaker of Council`,

    `4. Immediate Cost Containment Framework\n\nThe following austerity categories must be implemented immediately by the Accounting Officer to halt non-priority operational cash outflows, aligned with National Treasury MFMA Circular 82.\n\n[MUNICIPAL COST CONTAINMENT FRAMEWORK]\n├── 1. Travel & Subsistence\n│   ├── No business/first class flights; economy class only.\n│   └── Freeze all international travel unless 100% externally funded.\n│\n├── 2. Consultants & Professional Services\n│   ├── Halt all new consultant appointments if internal capacity exists.\n│   └── Cap consultant fees at the exact rates set by DPSA or SAFCEC.\n│\n├── 3. Events, Catering & Entertainment\n│   ├── Zero municipal budget for social events, end-of-year functions, or generic team building.\n│   └── No catering provided for internal, routine departmental meetings.\n│\n└── 4. Corporate Communication & Marketing\n    ├── Stop printing physical annual reports/newsletters; shift entirely to digital publishing.\n    └── Terminate all procurement of custom corporate gifts, branded clothing, and marketing novelties.\n\n4.1 Implementation Action Plan\n\n4.1.1 Travel & Subsistence Restraints\nEnforcement Action: Vehicle hire options are capped at Group B vehicles (engine capacity not exceeding 1600cc). Km reimbursement claims must be verified via tracking logs and strictly checked against official logbooks.\n\n4.1.2 Consultants & Professional Services Restraints\nEnforcement Action: All active consultant contracts must be audited within 30 days of this framework's adoption. Contracts lacking clear, measurable service-level deliverables must be suspended immediately.\n\n4.1.3 Events, Catering & Entertainment Restraints\nEnforcement Action: Catering is limited exclusively to public participation sessions, council sittings, and oversight site visits lasting longer than 5 consecutive hours.\n\n4.1.4 Corporate Communication & Marketing Restraints\nEnforcement Action: All marketing, announcements, and statutory public notifications must be moved to the municipality's official website, digital noticeboards, and free social media feeds.`
  ];

  return (
    <div className="flex flex-col h-full space-y-4 font-sans">
      
      <div className="flex bg-slate-900 border border-slate-700/50 rounded-2xl p-1 shrink-0 backdrop-blur-xl shadow-lg relative z-20">
        <button
          onClick={() => setActiveTab('brief')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'brief'
              ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <BookOpen className="w-4 h-4" /> Brief
        </button>
        <button
          onClick={() => setActiveTab('model')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'model'
              ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <MonitorPlay className="w-4 h-4" /> Model & Implementation
        </button>
        <button
          onClick={() => setActiveTab('template')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'template'
              ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <PenTool className="w-4 h-4" /> Templates
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'brief' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-10 space-y-6 text-slate-800 shadow-sm h-full overflow-y-auto custom-scrollbar">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Municipal Turnaround Strategy (MTAS)</h2>
            <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
              <p className="text-lg text-slate-600 font-medium">
                A Municipal Turnaround Strategy (MTAS) is a localized, actionable recovery plan designed to restore financial viability, fix governance failures, and improve basic service delivery in struggling South African municipalities. It is a legally grounded blueprint to pull failing towns out of distress and return them to proper functioning.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-800"><LayoutGrid className="w-5 h-5"/> What it Consists of</h3>
                <p className="mb-4">The strategy serves as a comprehensive "reset" and typically focuses on the following core components:</p>
                <ul className="space-y-3 font-medium text-slate-700">
                  <li><strong className="text-slate-900">Financial Recovery Plans:</strong> Addressing deficit budgets, eliminating wasteful expenditure, and putting measures in place to maximize revenue collection.</li>
                  <li><strong className="text-slate-900">Institutional Governance:</strong> Professionalizing administration by recruiting qualified technical experts, removing political interference, and enforcing consequence management for corruption.</li>
                  <li><strong className="text-slate-900">Service Delivery Targets:</strong> Specific, short- to long-term goals for fixing water infrastructure, sanitation, road maintenance, and electricity provision.</li>
                  <li><strong className="text-slate-900">Public Participation:</strong> Increasing transparency and involving local communities in monitoring municipal performance and the budget.</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-purple-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Alignment to Municipalities in Distress</h3>
                <p className="mb-4">When a municipality is classified as being in distress (failing to deliver services, running a deficit, or facing collapse), national and provincial governments intervene to rescue it:</p>
                <ul className="space-y-3 font-medium text-slate-700">
                  <li><strong className="text-slate-900">Section 139 of the MFMA:</strong> This allows the provincial executive to intervene by taking over the municipality's executive obligations, which often includes installing an administrator to draft and execute the Turnaround Strategy.</li>
                  <li><strong className="text-slate-900">Section 154 of the Constitution:</strong> This mandates national and provincial governments to provide support and build the capacity of the municipality so it can independently manage its affairs.</li>
                  <li><strong className="text-slate-900">Differentiated Approach:</strong> Interventions are tailored to the specific root causes of distress in the municipality in question (e.g., whether the problem is structural debt, billing failures, or infrastructure sabotage).</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-purple-800 flex items-center gap-2"><FileText className="w-5 h-5"/> Where the Information and Budget Come From</h3>
                <p className="mb-4">Turnaround strategies are highly data-driven and funded through specific national frameworks:</p>
                
                <h4 className="font-bold text-slate-900 mb-2">Information Sources:</h4>
                <ul className="list-disc list-inside space-y-2 mb-6 font-medium text-slate-700">
                  <li>Diagnostic analyses from the Department of Cooperative Governance and Traditional Affairs (CoGTA).</li>
                  <li>The State of Local Government Reports.</li>
                  <li>Findings, audit outcomes, and forensic investigations from the Auditor-General of South Africa.</li>
                  <li>Reports from the Municipal Infrastructure Support Agent (MISA).</li>
                </ul>

                <h4 className="font-bold text-slate-900 mb-2">Funding Sources:</h4>
                <ul className="list-disc list-inside space-y-2 font-medium text-slate-700">
                  <li><strong>Municipal Own Revenue:</strong> Tariffs for property rates, water, electricity, and refuse collection.</li>
                  <li><strong>Equitable Share:</strong> Unconditional grants provided by the national government to help municipalities cover the costs of basic services for indigent households.</li>
                  <li><strong>Conditional Grants:</strong> Such as the Municipal Infrastructure Grant (MIG) or the Municipal Systems Improvement Grant (MSIG), which are directly allocated for specific capital projects and system improvements.</li>
                  <li><strong>Financial Relief Packages:</strong> In extreme distress, National Treasury may assist with specialized loans or bailouts, tied strictly to the implementation of the strategy.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'model' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-10 space-y-8 shadow-sm h-full overflow-y-auto custom-scrollbar">
            
            {/* Image Placeholder representing the attached image */}
            <div className="w-full bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner relative group">
                <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
                    alt="Phased Recovery Framework Master Plan" 
                    className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-6">
                    <span className="text-white font-bold tracking-wider uppercase text-sm drop-shadow-md">The Phased Recovery Framework</span>
                </div>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-6 border-b border-slate-200 pb-4">Implementation: Municipal Turnaround Strategy Legislative Compliance Checklist</h2>
              <p className="text-slate-600 mb-8 font-medium">This compiled checklist integrates specific statutory deadlines and mandatory reporting obligations from the Local Government: Municipal Finance Management Act (MFMA) No. 56 of 2003 and the Municipal Systems Act (MSA) into the phased recovery framework.</p>

              <div className="space-y-6">
                
                <div className="border border-red-200 bg-red-50/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-red-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">1</span>
                    Phase 1: Stabilization (Months 1–6)
                  </h3>
                  <p className="text-red-700/80 font-medium mb-4"><strong>Objective:</strong> Stop the financial bleed, implement emergency cash-flow controls, and meet urgent statutory compliance windows.</p>
                  <ul className="space-y-4">
                    <li className="flex gap-3 text-slate-700">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Publish Section 139 Intervention Gazette:</strong> Ensure the Provincial Executive formally gazettes the intervention, defining the Administrator’s powers within 14 days of the intervention council resolution.</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Enforce 30-Day Creditor Payment Controls:</strong> Enforce strict dual-signatory bank mandates to comply with MFMA Section 65(2)(e), ensuring all valid invoices from small businesses and bulk suppliers are paid within 30 days of receipt to avoid compounding interest penalties.</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Initiate Monthly Section 71 Reporting:</strong> Establish a strict internal timeline where the Municipal Manager/Administrator submits a budget performance report to the Mayor and Provincial Treasury within 10 working days after the end of each month (MFMA Section 71).</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Assess Service Delivery and Infrastructure Backlogs:</strong> Conduct a data-driven physical audit of water and electricity grid failure points to comply with safety standards under MSA Section 73.</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Draft the Initial Status Quo Assessment:</strong> Complete the comprehensive institutional, governance, and financial assessment within 45 days of the administrator's deployment to serve as the baseline for the mandatory Financial Recovery Plan (FRP).</div>
                    </li>
                  </ul>
                </div>

                <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-amber-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">2</span>
                    Phase 2: Recovery (Months 7–24)
                  </h3>
                  <p className="text-amber-700/80 font-medium mb-4"><strong>Objective:</strong> Systematically clean up municipal systems, aggressively implement revenue strategies, and meet core mid-term planning deadlines.</p>
                  <ul className="space-y-4">
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Table the Revenue Enhancement Plan & Debt Restructuring:</strong> Finalize structural debt negotiations with Eskom and Water Boards, ensuring conditions are met for 12 consecutive months if participating in national debt-relief programs (MFMA Circular 124).</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Advertise and Fill Section 56/57 Vacancies:</strong> Formally advertise and fill critical top management seats (Municipal Manager, CFO, Technical Directors) strictly within 6 months of the vacancy occurring, ensuring compliance with MSA Section 54A and 56 competency frameworks.</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Submit Annual Financial Statements (AFS):</strong> Ensure the accounting officer prepares and submits the municipality's AFS directly to the Auditor-General (AG) by 31 August each year (MFMA Section 126(1)).</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Table the Annual Report to Council:</strong> Ensure the comprehensive annual report is formally tabled by the Mayor to the municipal council by 31 January each year (MFMA Section 127(2)).</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Execute Conditional Grant Commitments:</strong> Monitor and report monthly on the utilization of the Municipal Infrastructure Grant (MIG), ensuring funds are legally locked to infrastructure repairs and prevent national re-allocation.</div>
                    </li>
                  </ul>
                </div>

                <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-emerald-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">3</span>
                    Phase 3: Sustainable Growth (Years 3+)
                  </h3>
                  <p className="text-emerald-700/80 font-medium mb-4"><strong>Objective:</strong> Achieve high-level transparency, lock in permanent clean governance frameworks, and prepare for institutional handover.</p>
                  <ul className="space-y-4">
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Table the Schedule of Key Deadlines:</strong> Ensure the Mayor tables the 10-month budget and IDP planning process schedule in council by 31 August—at least 10 months before the start of the next budget year (MFMA Section 21(1)(b)).</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Table the Draft Budget and IDP:</strong> Table the newly adjusted, funded annual budget and Integrated Development Plan (IDP) in council at least 90 days before the start of the budget year, strictly by 31 March (MFMA Section 16(2)).</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Approve the Final Annual Budget:</strong> Secure full council approval for the final, sustainable budget and IDP by 31 May—at least 30 days prior to the start of the municipal financial year (MFMA Section 24(1)).</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Sign the Service Delivery and Budget Implementation Plan (SDBIP):</strong> Ensure the Mayor approves the final SDBIP and signs senior management performance agreements within 28 days after the budget's final approval (MFMA Section 53(1)(c)(ii)).</div>
                    </li>
                    <li className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div><strong className="text-slate-900">Formalize Exit Protocols and Exit Section 139:</strong> Provide continuous monthly compliance reports through MFMA Circular 88 frameworks to the Provincial Treasury to verify institutional stability, prompting a formal legislative handover back to the newly structured local council.</div>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="flex-1 overflow-hidden rounded-2xl relative z-10 border border-slate-200 h-full bg-white shadow-sm">
            <DraftingSuiteTab 
              currentUser={currentUser as any} 
              activeTenantId={activeTenantId} 
              documentIdPrefix="mtas"
              defaultChapters={mtasChapters}
            />
          </div>
        )}
      </div>
    </div>
  );
}
