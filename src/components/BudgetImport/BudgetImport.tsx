import React, { useState } from 'react';
import { Upload, FileText, PieChart, Info, Archive, Folder } from 'lucide-react';
import { User } from '../../types';
import { cn } from '../Branding';

interface BudgetImportProps {
  currentUser: User;
  activeTenantId: string;
}

export function BudgetImport({ currentUser, activeTenantId }: BudgetImportProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'import'>('brief');

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800">
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Budget Import</h3>
            <p className="text-xs text-gray-500 font-medium tracking-tight uppercase">Module Overview & Import Suite</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('brief')}
            className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === 'brief' ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
          >
            Brief
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", activeTab === 'import' ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
          >
            Budget Import
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'brief' && <BriefTab />}
        {activeTab === 'import' && <ImportTab currentUser={currentUser} activeTenantId={activeTenantId} />}
      </div>
    </div>
  );
}

function BriefTab() {
  return (
    <div className="p-8 overflow-y-auto h-full hide-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">1. What Information is Contained?</h2>
          <p className="text-gray-700 leading-relaxed">
            The annual budget breaks down into financial data split into seven core operational tables, along with supporting budget-related policy disclosures:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>The Operating Budget:</strong> Details the recurrent revenue generated from property rates, tariff service charges (water, electricity, sanitation, refuse), and operational grants (Equitable Share). It balances this against operating expenses such as municipal employee salaries, contracted services, bulk purchases (from Eskom or water boards), and asset maintenance.</li>
            <li><strong>The Capital Budget:</strong> Allocates funding specifically for infrastructure development. It lists appropriations for multi-year capital projects (such as new roads, pipes, or substations) and explicitly specifies how they are financed—whether via conditional national grants, internal reserves, or external bank loans.</li>
            <li><strong>Financial Position & Cash Flow Forecasting:</strong> Provides a simulated balance sheet projecting assets, liabilities, and available cash reserves. It documents the municipality’s projected liquidity and cost-coverage ratios to prove the budget is fully funded and cash-backed.</li>
            <li><strong>Budget-Related Policies:</strong> Includes proposed revisions to tariff structures, indigent support limits, credit control policies, and property rating parameters.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 border-t border-gray-100 pt-8">2. What is the Information Aligned To?</h2>
          <p className="text-gray-700 leading-relaxed">
            To ensure money is directed to community priorities, the budget must align with three key instruments forming the Local Government Accountability Cycle: [5-Year IDP Strategy] ➔ [3-Year MTREF Budget] ➔ [1-Year SDBIP Implementation]
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>The 5-Year Integrated Development Plan (IDP):</strong> The structural link is absolute. Section 153 of the Constitution and the MFMA require that every single rand allocated in the budget must connect back to a strategic objective or localized community priority logged in the IDP. Council cannot legally approve a budget if it fails to fund the IDP.</li>
            <li><strong>The Service Delivery and Budget Implementation Plan (SDBIP):</strong> The budget provides the financial framework, while the SDBIP breaks that money down into month-by-month cash flows and specific quarterly performance targets per department.</li>
            <li><strong>The mSCOA Segments:</strong> All financial data must align with the 7 mandatory classification dimensions of mSCOA (Function, Item, Funding Source, Region, Costing, Project, and Asset). This ensures standardized reporting directly mapping to the National Revenue Fund and provincial accounts.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 border-t border-gray-100 pt-8">3. Where Does the Information Come From?</h2>
          <p className="text-gray-700 leading-relaxed">
            A municipal budget integrates operational estimates from various distinct internal inputs and external institutions:
          </p>
          
          <h3 className="font-bold text-gray-900 mt-4">External Data Stream Inputs</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>The National Division of Revenue Act (DoRA):</strong> Dictates the exact gazetted fiscal allocations the municipality will receive from national government over the 3-year MTREF period, including the unconditional Equitable Share and conditional infrastructure grants (e.g., MIG, USDG).</li>
            <li><strong>Macroeconomic Guidance (National Treasury Budget Circulars):</strong> National Treasury regularly issues MFMA Circulars (such as Circular 130). These circulars provide the definitive parameters for inflation forecasts, maximum permissible tariff increases, and overall growth expectations that the municipality must use to build its models.</li>
            <li><strong>State-Owned Utility Determinations:</strong> Price determinations from bodies like NERSA (electricity tariff adjustments) and water boards establish the baseline bulk costs the municipality must pay.</li>
          </ul>

          <h3 className="font-bold text-gray-900 mt-4">Internal System Inputs</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Internal Asset Management and Technical Systems:</strong> Engineering departments provide cost estimation models for repairs, maintenance backlogs, and project feasibility timelines for new infrastructure.</li>
            <li><strong>Human Resource Information Systems (HRIS):</strong> Generate automated payroll projections based on existing headcounts, collective bargaining agreements, salary increases, and vacant posts.</li>
            <li><strong>Public Participation Inputs:</strong> Legally mandated ward-level community meetings conducted during April and May yield localized prioritization data. These community inputs help the budget steering committee rank which projects receive immediate capital funding.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function ImportTab({ currentUser, activeTenantId }: { currentUser: User, activeTenantId: string }) {
  const handleUpload = () => {
    alert("Budget saved into Backup Archive -> " + (activeTenantId === 'global' ? 'Global' : activeTenantId) + " -> Budget -> " + currentUser.email);
  };

  return (
    <div className="flex h-full w-full bg-gray-50 flex-col items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-8 text-center shadow-sm">
         <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6">
           <Upload className="w-8 h-8" />
         </div>
         <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Budget Document</h3>
         <p className="text-sm text-gray-500 mb-8">Upload your municipal MTREF budget document. This will be automatically archived into the Backup Archive under your user profile for this municipality.</p>
         
         <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50 mb-6 hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleUpload}>
            <p className="font-medium text-gray-600">Drag & drop your file here, or click to browse</p>
            <p className="text-xs text-gray-400 mt-2">Supports PDF, XLSX, and DOCX (up to 200MB)</p>
         </div>

         <button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg font-bold transition-colors">
            Upload & Archive Budget
         </button>
      </div>
    </div>
  );
}