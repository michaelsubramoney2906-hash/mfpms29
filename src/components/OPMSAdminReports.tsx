import React from 'react';
import { User } from '../types';
import { Mic } from 'lucide-react';

interface PublicParticipationProps {
  currentUser: User;
  activeTenantId: string;
}

export function PublicParticipation({ currentUser, activeTenantId }: PublicParticipationProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center justify-center gap-2">
             <Mic className="w-8 h-8 text-indigo-600" /> Public Participation
          </h1>
          <p className="text-slate-500 font-medium">Legally Mandated Community Involvment</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 prose prose-sm max-w-none prose-indigo">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-900 text-sm">
            <strong>Brief:</strong> In South African local government, public participation is a legally mandated, open process through which community members, businesses, and civic organizations actively influence municipal planning, budgeting, and law-making. It is not a voluntary exercise or a matter of courtesy; it is a constitutional requirement. The state views public participation as a mechanism to shift local government from a system that simply delivers services to people, into a collaborative governance system that works with people.
          </div>

          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800 border-b pb-2">1. The Legal Foundation</h2>
          <p>If a municipality fails to properly conduct public participation before passing major decisions, its resolutions and policies can be declared legally invalid by the High Court. This mandate is locked into several laws:</p>
          <ul>
            <li><strong>The Constitution (Chapter 7):</strong> Objects of local government include encouraging the involvement of communities and community organizations in matters of local government.</li>
            <li><strong>The Municipal Systems Act (Chapter 4):</strong> This entire chapter is dedicated to public participation. It commands municipalities to develop a culture of participatory governance and establish mechanisms, processes, and procedures to enable it.</li>
            <li><strong>The Municipal Finance Management Act (MFMA):</strong> Requires the municipality to table its draft budget for public comment and host public hearings before any budget can be legally passed.</li>
          </ul>

          <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800 border-b pb-2 mt-8">2. Core Channels of Public Participation</h2>
          <p>Municipalities execute public participation through several formal, structured pathways:</p>

          <h3 className="font-bold text-slate-700">Integrated Development Plan (IDP) & Budget Consultations</h3>
          <p>Every year between January and May, municipalities host IDP and Budget Public Hearings. Officials travel to community halls across all wards to present the draft budget, proposed property rates, and tariff increases (water, electricity, refuse). Residents are given the floor to object, support, or request shifts in capital spending priorities.</p>

          <h3 className="font-bold text-slate-700">Ward Committees and Public Meetings</h3>
          <p>As permanent structures on the ground, Ward Committees host regular community meetings to gather localized grievances and infrastructure needs, filtering them directly into the council system through the Ward Councillor.</p>

          <h3 className="font-bold text-slate-700">By-Law Comment Windows</h3>
          <p>Before a municipality can pass a new local law (by-law)—such as new informal trading rules, traffic regulations, or zoning laws—it must publish the draft law in local newspapers and online, opening a formal notice-and-comment window (usually 30 days) for written public submissions.</p>

          <h3 className="font-bold text-slate-700">The Annual Report Oversight Process</h3>
          <p>When the municipality releases its Annual Report and the Auditor-General's findings, the Municipal Public Accounts Committee (MPAC) hosts public hearings. This allows residents and ratepayer associations to publicly interrogate why certain projects failed or why irregular expenditure occurred.</p>

        </div>
      </div>
    </div>
  );
}
