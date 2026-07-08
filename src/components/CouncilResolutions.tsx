import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { FileText, Plus, Search, Calendar, Users, Signature, X, Check, Eye } from 'lucide-react';

interface CouncilResolutionsProps {
  currentUser: User;
  activeTenantId: string;
}

interface ResolutionItem {
  id: string;
  agenda: string;
  dateTime: string;
  type: string;
  fullDetails: string;
  membersPresent: string[]; // List of names
  signedSpeaker: boolean;
  signedSpeakerAt?: string;
  signedMayor: boolean;
  signedMayorAt?: string;
  signedChiefWhip: boolean;
  signedChiefWhipAt?: string;
}

const defaultInitialResolutions: ResolutionItem[] = [
  {
    id: 'RES-2026-001',
    agenda: 'Approval of 2026/2027 Nkangala Municipal Draft IDP Charter',
    dateTime: '2026-03-31T10:00',
    type: 'Statutory Approval',
    fullDetails: 'The council hereby resolves by unanimous assent to approve the integrated development plan for the upcoming fiscal transition, ensuring alignment with ward services and national treasury mandates.',
    membersPresent: ['Sibusiso Nkosi', 'Pieter Botha', 'Lerato Mokwena', 'Helen Zille', 'Julius Malema'],
    signedSpeaker: true,
    signedSpeakerAt: '2026-03-31 11:45',
    signedMayor: true,
    signedMayorAt: '2026-03-31 12:12',
    signedChiefWhip: true,
    signedChiefWhipAt: '2026-03-31 11:50'
  },
  {
    id: 'RES-2026-002',
    agenda: 'Emergency Allocation of Capital Reserves for Ward Water Infrastructure Refurbishment',
    dateTime: '2026-04-12T14:30',
    type: 'Financial Decision (MFMA)',
    fullDetails: 'Pursuant to Section 29 of the Municipal Finance Management Act (MFMA), the council authorizes immediate funding towards replacing deteriorated high-capacity valves in Ward 4 & Ward 12 reservoirs.',
    membersPresent: ['Sibusiso Nkosi', 'Zanele Magwaza', 'Floyd Shivambu', 'Themba Khoza', 'Patricia De Lille'],
    signedSpeaker: true,
    signedSpeakerAt: '2026-04-12 16:00',
    signedMayor: true,
    signedMayorAt: '2026-04-12 16:35',
    signedChiefWhip: false
  }
];

export function CouncilResolutions({ currentUser, activeTenantId }: CouncilResolutionsProps) {
  const [resolutions, setResolutions] = useState<ResolutionItem[]>(() => {
    const saved = localStorage.getItem(`council_resolutions_${activeTenantId}`);
    return saved ? JSON.parse(saved) : defaultInitialResolutions;
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedRes, setSelectedRes] = useState<ResolutionItem | null>(null);

  // Form Fields
  const [agenda, setAgenda] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [type, setType] = useState('Ordinary Resolution');
  const [fullDetails, setFullDetails] = useState('');
  const [membersPresent, setMembersPresent] = useState<string[]>([]);

  // AD lookup present members search
  const [adSearch, setAdSearch] = useState('');
  const [adResults, setAdResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Save/Sync state variables
  const saveResolutions = (newRes: ResolutionItem[]) => {
    setResolutions(newRes);
    localStorage.setItem(`council_resolutions_${activeTenantId}`, JSON.stringify(newRes));
  };

  // Search Userbase directory on disk in real-time
  useEffect(() => {
    if (!adSearch.trim()) {
      setAdResults([]);
      return;
    }
    const delayTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/azure-search?q=${encodeURIComponent(adSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setAdResults(data);
        }
      } catch (err) {
        console.error("Ad search err", err);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(delayTimer);
  }, [adSearch]);

  const handleAddMember = (fullName: string) => {
    if (!membersPresent.includes(fullName)) {
      setMembersPresent([...membersPresent, fullName]);
    }
    setAdSearch('');
    setAdResults([]);
  };

  const handleRemoveMember = (name: string) => {
    setMembersPresent(membersPresent.filter(m => m !== name));
  };

  const handleSubmitResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agenda.trim() || !dateTime || !fullDetails.trim()) {
      alert("Please fill in the agenda item, date/time and the full details.");
      return;
    }

    const newRes: ResolutionItem = {
      id: `RES-2026-00${resolutions.length + 1}`,
      agenda,
      dateTime,
      type,
      fullDetails,
      membersPresent,
      signedSpeaker: false,
      signedMayor: false,
      signedChiefWhip: false
    };

    const updated = [newRes, ...resolutions];
    saveResolutions(updated);

    // Reset Form
    setAgenda('');
    setDateTime('');
    setType('Ordinary Resolution');
    setFullDetails('');
    setMembersPresent([]);
    setShowForm(false);
  };

  const handleSignOff = (id: string, role: 'speaker' | 'mayor' | 'chief_whip') => {
    const timestamp = new Date().toLocaleString();
    const updated = resolutions.map(r => {
      if (r.id === id) {
        if (role === 'speaker') {
          return { ...r, signedSpeaker: true, signedSpeakerAt: timestamp };
        } else if (role === 'mayor') {
          return { ...r, signedMayor: true, signedMayorAt: timestamp };
        } else {
          return { ...r, signedChiefWhip: true, signedChiefWhipAt: timestamp };
        }
      }
      return r;
    });
    saveResolutions(updated);

    if (selectedRes && selectedRes.id === id) {
      const match = updated.find(r => r.id === id);
      if (match) setSelectedRes(match);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-6">

        {/* Header Block */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" /> Council Resolutions Board
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Statutory, ordinary, financial and executive decisions recorded under the Local Government Municipal Structures Act.
            </p>
          </div>
          <button 
            onClick={() => { setShowForm(!showForm); setSelectedRes(null); }} 
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" /> {showForm ? "Close Panel" : "Record Resolution"}
          </button>
        </div>

        {/* Capture Form */}
        {showForm && (
          <form onSubmit={handleSubmitResolution} className="bg-white p-6 border border-indigo-100 rounded-2xl shadow-md space-y-5 animate-slideDown">
            <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">
              Statutory Resolution Ledger Form
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Agenda Item / Subject Headline</label>
                <input 
                  type="text" 
                  value={agenda}
                  onChange={e => setAgenda(e.target.value)}
                  placeholder="e.g. Supplementary Budget Adoption 2026"
                  className="w-full border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Session Time and Date</label>
                <input 
                  type="datetime-local" 
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                  className="w-full border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Type of Council Resolution</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition"
                >
                  <option value="Ordinary Resolution">Ordinary Resolution</option>
                  <option value="Statutory Resolution">Statutory Resolution</option>
                  <option value="Financial Decision (MFMA)">Financial Decision (MFMA)</option>
                  <option value="Policy Framework Bypass">Policy Framework Bypass</option>
                </select>
              </div>

              {/* Members Present Picker - Search Userbase */}
              <div className="md:col-span-2 space-y-1.5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1.5 tracking-wider">
                  <Users className="w-4 h-4 text-indigo-600" /> Search Userbase to Appoint Present Members
                </label>
                
                <div className="relative">
                  <input 
                    type="text" 
                    value={adSearch}
                    onChange={e => setAdSearch(e.target.value)}
                    placeholder="Search standard municipal user database or Azure namespace..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none transition"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                </div>

                {searching && <p className="text-[10px] text-slate-400 animate-pulse text-left">Searching user directory...</p>}

                {adResults.length > 0 && (
                  <div className="bg-white border border-slate-100 divide-y divide-slate-100 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {adResults.map((u, index) => (
                      <div 
                        key={u.email || index}
                        onClick={() => handleAddMember(u.fullName || u.email)}
                        className="p-2.5 hover:bg-indigo-50/50 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                        </div>
                        <span className="text-[9px] font-black text-indigo-600 uppercase">Click to Add</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags List */}
                <div className="pt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Appointed Members Present ({membersPresent.length}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {membersPresent.map(m => (
                      <span key={m} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg">
                        <span>{m}</span>
                        <button type="button" onClick={() => handleRemoveMember(m)} className="text-rose-500 hover:text-rose-700 font-bold text-sm select-none items-center">&times;</button>
                      </span>
                    ))}
                    {membersPresent.length === 0 && (
                      <span className="text-[10.5px] text-slate-400 italic block">No members appointed yet. Search and select above.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider font-bold">Full Assent Resolution Details & Minutes</label>
                <textarea 
                  rows={4}
                  value={fullDetails}
                  onChange={e => setFullDetails(e.target.value)}
                  placeholder="Insert the comprehensive textual definitions, terms of service and clauses decided by council..."
                  className="w-full border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs outline-none transition text-slate-800 leading-relaxed font-semibold bg-slate-50"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-4 py-2 font-black text-slate-500 hover:text-slate-700 text-xs uppercase"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow"
              >
                Commit Resolution
              </button>
            </div>
          </form>
        )}

        {/* List Grid split selection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Resolution items table */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
              Enacted Resolution Register ({resolutions.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-105 text-slate-500 border-b border-slate-200 font-bold uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="p-3">Reference ID</th>
                    <th className="p-3 font-extrabold">Agenda / Headline</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {resolutions.map(r => (
                    <tr 
                      key={r.id} 
                      onClick={() => setSelectedRes(r)}
                      className={`hover:bg-indigo-50/20 cursor-pointer transition ${selectedRes?.id === r.id ? 'bg-indigo-50/50' : ''}`}
                    >
                      <td className="p-4 font-mono font-bold text-indigo-600 block">{r.id}</td>
                      <td className="p-4">
                        <div className="truncate max-w-[280px] font-semibold text-slate-800">{r.agenda}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{r.type} • {r.dateTime.replace('T', ' ')}</div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide float-right transition">
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details & Sign-off Panel */}
          <div className="lg:col-span-5 space-y-4">
            {selectedRes ? (
              <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-5 animate-fadeIn">
                
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-mono text-[10px] text-indigo-600 font-black bg-indigo-50 border border-indigo-200/90 px-2.5 py-1 rounded uppercase tracking-wider">
                      {selectedRes.id}
                    </span>
                    <h2 className="text-base font-black text-slate-900 mt-2 leading-relaxed tracking-tight">{selectedRes.agenda}</h2>
                  </div>
                  <button onClick={() => setSelectedRes(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-left bg-slate-50 p-4 border border-slate-150 rounded-xl leading-normal text-slate-600">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resolution Particulars</div>
                  <div><b className="text-slate-800">Assent Type:</b> {selectedRes.type}</div>
                  <div><b className="text-slate-800">Conferred Date:</b> {selectedRes.dateTime.replace('T', ' ')}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resolution Details</div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-100 p-3 border border-slate-200 rounded-xl select-text">
                    {selectedRes.fullDetails}
                  </p>
                </div>

                {/* Members Present Display */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Attending Members present</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedRes.membersPresent.map(m => (
                      <span key={m} className="bg-slate-105 border border-slate-200 text-slate-700 text-[10.5px] font-bold px-2 py-0.5 rounded-md">
                        {m}
                      </span>
                    ))}
                    {selectedRes.membersPresent.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No appointed members logged.</span>
                    )}
                  </div>
                </div>

                {/* Sign-off Segment */}
                <div className="space-y-3 pt-4 border-t border-slate-150">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Signature className="w-4 h-4 text-indigo-600" /> Digital Sign-off Verification
                  </h4>

                  {/* Speaker signature */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black text-slate-800">Speaker / Council Chairperson</div>
                      {selectedRes.signedSpeaker ? (
                        <div className="text-[9.5px] text-emerald-600 font-sans font-bold flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" /> Signed off at {selectedRes.signedSpeakerAt}
                        </div>
                      ) : (
                        <div className="text-[9.5px] text-amber-500 font-bold mt-0.5">Awaiting Executive Sign-off</div>
                      )}
                    </div>
                    {!selectedRes.signedSpeaker && (
                      <button 
                        onClick={() => handleSignOff(selectedRes.id, 'speaker')}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-wider rounded transition shadow flex items-center gap-1"
                      >
                        Sign Roll
                      </button>
                    )}
                  </div>

                  {/* Mayor signature */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black text-slate-800">Executive Mayor Signatory</div>
                      {selectedRes.signedMayor ? (
                        <div className="text-[9.5px] text-emerald-600 font-sans font-bold flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" /> Signed off at {selectedRes.signedMayorAt}
                        </div>
                      ) : (
                        <div className="text-[9.5px] text-amber-500 font-bold mt-0.5">Awaiting Executive Sign-off</div>
                      )}
                    </div>
                    {!selectedRes.signedMayor && (
                      <button 
                        onClick={() => handleSignOff(selectedRes.id, 'mayor')}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-wider rounded transition shadow flex items-center gap-1"
                      >
                        Sign Roll
                      </button>
                    )}
                  </div>

                  {/* Chief Whip / Speaker Roll */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black text-slate-800">Chief Whip / Party Signatory</div>
                      {selectedRes.signedChiefWhip ? (
                        <div className="text-[9.5px] text-emerald-600 font-sans font-bold flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" /> Signed off at {selectedRes.signedChiefWhipAt}
                        </div>
                      ) : (
                        <div className="text-[9.5px] text-amber-500 font-bold mt-0.5">Awaiting Executive Sign-off</div>
                      )}
                    </div>
                    {!selectedRes.signedChiefWhip && (
                      <button 
                        onClick={() => handleSignOff(selectedRes.id, 'chief_whip')}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-wider rounded transition shadow flex items-center gap-1"
                      >
                        Sign Roll
                      </button>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-white text-slate-400">
                <FileText className="w-8 h-8 text-slate-350 mx-auto opacity-70 mb-2" />
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Select Resolution Item</span>
                <p className="text-[10px] text-slate-505 leading-relaxed mt-1">
                  Click on any recorded subject row to view complete statutory clauses, attending Present members and signatory statuses.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
