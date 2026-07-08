import React from 'react';
import { User } from '../types';
import { Users } from 'lucide-react';

interface WardCommitteesProps {
  currentUser: User;
  activeTenantId: string;
}

export function WardCommittees({ currentUser, activeTenantId }: WardCommitteesProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center justify-center gap-2">
             <Users className="w-8 h-8 text-indigo-600" /> Ward Committees
          </h1>
          <p className="text-slate-500 font-medium">Statutory Community-Based Advisory Structures (Section 73 MSA)</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 prose prose-sm max-w-none prose-indigo">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-900 text-sm">
            <strong>Brief:</strong> In South African local government, Ward Committees are statutory, community-based advisory structures established under Section 73 of the Local Government: Municipal Structures Act No. 117 of 1998. They serve as the vital, formal communication link between the local municipality and the residents living within a specific geographical ward. Their primary purpose is to institutionalize public participation, ensuring that grassroots community needs directly influence municipal planning, budgeting, and service delivery.
          </div>

          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800 border-b pb-2">1. Composition and Structure</h2>
          <ul>
            <li><strong>The Chairperson:</strong> Every ward committee is automatically chaired by the democratically elected Ward Councillor for that specific ward.</li>
            <li><strong>Community Members:</strong> The committee consists of a maximum of 10 community members.</li>
            <li><strong>Sectoral Representation:</strong> These 10 members are elected by the ward's residents to represent diverse local interest groups, such as:
               <ul>
                 <li>Youth and women's forums</li>
                 <li>Local business and informal traders</li>
                 <li>Civic and ratepayer associations</li>
                 <li>Faith-based organizations</li>
                 <li>Persons with disabilities and elderly groups</li>
               </ul>
            </li>
          </ul>

          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800 border-b pb-2 mt-8">2. Key Responsibilities: What Do They Do?</h2>
          <p>Ward committees do not have executive or legislative powers; they cannot pass by-laws, manage municipal budgets, or employ staff. Instead, their functions focus heavily on advisory, oversight, and mobilization tasks:</p>
          
          <h3 className="font-bold text-slate-700">Infusing Local Needs into the Budget (IDP)</h3>
          <ul>
            <li><strong>IDP Formulation:</strong> They ensure that the specific needs of their neighborhood (e.g., a specific clinic upgrade, a new sports facility, or road repairs) are captured during the drafting of the 5-year Integrated Development Plan (IDP).</li>
            <li><strong>Budget Consultations:</strong> They mobilize residents to attend municipal budget public hearings and help explain complex budget choices to the community.</li>
          </ul>

          <h3 className="font-bold text-slate-700">Service Delivery Monitoring</h3>
          <ul>
            <li><strong>Early Warning Tracking:</strong> They act as the eyes and ears of the municipality on the ground, reporting localized service delivery failures like burst water pipes, faulty streetlights, illegal dumping, and electricity outages to the Ward Councillor.</li>
            <li><strong>Project Accountability:</strong> They monitor the implementation of municipal infrastructure projects taking place within their ward boundaries to check if contractors are performing the work adequately.</li>
          </ul>

          <h3 className="font-bold text-slate-700">Community Communication and Mobilization</h3>
          <ul>
            <li><strong>Information Dissemination:</strong> They ensure residents are kept informed about upcoming municipal decisions, changes in property rates tariffs, water restrictions, or scheduled maintenance power cuts.</li>
            <li><strong>Grievance Management:</strong> They provide a formal channel for community members to submit petitions or lodge official complaints regarding municipal administration.</li>
          </ul>

          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800 border-b pb-2 mt-8">3. Operational and Funding Rules</h2>
          <ul>
            <li><strong>Term of Office:</strong> The term of a ward committee runs concurrently with the 5-year term of the municipal council.</li>
            <li><strong>Stipends:</strong> While ward committee members are officially volunteers, national frameworks allow municipalities to pay them a monthly out-of-pocket stipend (to cover basic transport and mobile data costs incurred while performing official duties).</li>
            <li><strong>Administrative Support:</strong> The office of the Speaker of Council is legally responsible for providing administrative support, meeting venues, and governance training to ward committees to ensure they function optimally.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
