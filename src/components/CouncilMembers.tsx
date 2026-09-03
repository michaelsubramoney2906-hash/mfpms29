import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Search, Users, Shield, MapPin, Building, ChevronLeft, ChevronRight, Plus, X, Check, ArrowRight } from 'lucide-react';

interface CouncilMembersProps {
  currentUser: User;
  activeTenantId: string;
}

interface CouncilMember {
  id: string;
  fullName: string;
  termFrom: string;
  termTo: string;
  politicalParty: string;
  portfolioHead: boolean;
  ward: string;
}

// Pre-populate 75 high-quality South African Council Members
const firstNames = ['Sibusiso', 'Pieter', 'Lerato', 'Mokgadi', 'Nkosazana', 'John', 'Julius', 'Zweli', 'Thabo', 'Zanele', 'Helen', 'Floyd', 'Herman', 'Bheki', 'Patricia', 'Mbuyiseni', 'Nomvula', 'Solly', 'Gideon', 'Kabelo', 'Themba', 'Nomsa', 'Mandla', 'Sipho', 'Lungile', 'Andile', 'Ayanda', 'Zola', 'Nonhlanhla', 'Lindiwe', 'Palesa', 'Busisiwe', 'Refilwe', 'Kgomotso', 'Mpho', 'Tshepo', 'Katlego', 'Rethabile', 'Thabiso', 'Lehlohonolo'];
const lastNames = ['Nkosi', 'Botha', 'Mokwena', 'Dlamini', 'Steenhuisen', 'Malema', 'Mkhize', 'Mofokeng', 'Magwaza', 'Zille', 'Shivambu', 'Mashaba', 'Cele', 'De Lille', 'Groenewald', 'Ndlozi', 'Mokonyane', 'Msimanga', 'Nobanda', 'Gwamanda', 'Khoza', 'Sithole', 'Zulu', 'Zuma', 'Buthelezi', 'Modise', 'Khumalo', 'Mthembu', 'Ndlovu', 'Maphosa', 'Sibanda', 'Naidoo', 'Pillay', 'Moodley', 'Govender', 'Pretorius', 'Van der Merwe', 'Du Plessis', 'Coetzee', 'Fourie'];
const parties = ['ANC', 'DA', 'EFF', 'IFP', 'ActionSA', 'VF Plus', 'GOOD', 'Al Jama-ah', 'Independent'];

const initialPlaceholderMembers: CouncilMember[] = Array.from({ length: 75 }, (_, i) => {
  const fName = firstNames[i % firstNames.length];
  const lName = lastNames[(i * 3) % lastNames.length];
  const party = parties[(i * 7) % parties.length];
  const wardNo = (i % 32) + 1;
  return {
    id: `cm-${i + 1}`,
    fullName: `${fName} ${lName}`,
    termFrom: '2021',
    termTo: '2026',
    politicalParty: party,
    portfolioHead: i % 8 === 0,
    ward: `Ward ${wardNo}`,
  };
});

export function CouncilMembers({ currentUser, activeTenantId }: CouncilMembersProps) {
  const [members, setMembers] = useState<CouncilMember[]>(() => {
    const saved = localStorage.getItem(`council_members_${activeTenantId}`);
    if (saved && saved !== 'undefined') {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return initialPlaceholderMembers;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 10;

  // Search Userbase directory mock-up
  const [showAddModal, setShowAddModal] = useState(false);
  const [userbaseSearch, setUserbaseSearch] = useState('');
  const [userbaseResults, setUserbaseResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Selected User link form
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [termFrom, setTermFrom] = useState('2021');
  const [termTo, setTermTo] = useState('2026');
  const [partySelect, setPartySelect] = useState('ANC');
  const [isPortfolioHead, setIsPortfolioHead] = useState(false);
  const [wardInput, setWardInput] = useState('Ward 1');

  // Sync to localStorage
  const saveMembers = (newMembers: CouncilMember[]) => {
    setMembers(newMembers);
    localStorage.setItem(`council_members_${activeTenantId}`, JSON.stringify(newMembers));
  };

  // Perform active user directory search on azure endpoint
  useEffect(() => {
    if (!userbaseSearch.trim()) {
      setUserbaseResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/azure-search?q=${encodeURIComponent(userbaseSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setUserbaseResults(data);
        }
      } catch (err) {
        console.error("Failed to query azure AD directory:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [userbaseSearch]);

  const handleLinkToCouncil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    const newMember: CouncilMember = {
      id: `cm-${Date.now()}`,
      fullName: selectedProfile.fullName || selectedProfile.email,
      termFrom,
      termTo,
      politicalParty: partySelect,
      portfolioHead: isPortfolioHead,
      ward: wardInput,
    };

    const updated = [newMember, ...members];
    saveMembers(updated);
    
    // Reset form & close
    setSelectedProfile(null);
    setShowAddModal(false);
    setUserbaseSearch('');
    setUserbaseResults([]);
    setCurrentPage(1);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm("Are you sure you want to remove this council member?")) {
      const updated = members.filter(m => m.id !== id);
      saveMembers(updated);
    }
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.politicalParty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.ward.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const currentMembers = filteredMembers.slice((currentPage - 1) * membersPerPage, currentPage * membersPerPage);

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" /> Council Members Directory
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Elected municipal ward councilors, term listings, and political affiliations. Add direct link to Azure AD personnel profiles.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  placeholder="Filter members or wards..." 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-105 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              
              <button 
                onClick={() => { setShowAddModal(true); setSelectedProfile(null); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Link Userbase
              </button>
            </div>
          </div>
        </div>

        {/* Listing Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Name & Surname</th>
                  <th className="p-4">Legislative Term</th>
                  <th className="p-4">Political Party</th>
                  <th className="p-4">Municipal Ward</th>
                  <th className="p-4">Portfolio Chairperson</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                        {member.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-slate-800 font-black text-sm">{member.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">ID: {member.id}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-600">
                      {member.termFrom} - {member.termTo}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-black uppercase inline-block ${
                        member.politicalParty === 'ANC' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        member.politicalParty === 'DA' ? 'bg-blue-105 bg-blue-100 text-blue-800 border border-blue-200' :
                        member.politicalParty === 'EFF' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {member.politicalParty}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{member.ward}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {member.portfolioHead ? (
                        <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-200/85 px-3 py-1 rounded-full uppercase text-[9px] tracking-wide inline-block">
                          PORTFOLIO HEAD
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">MEMBER</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-rose-600 hover:text-white bg-transparent hover:bg-rose-600 border border-rose-200 hover:border-transparent px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                
                {currentMembers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-extrabold uppercase text-xs">No Council Members matched search filters.</p>
                      <p className="text-[11px] text-gray-400 mt-1">Try searching for simple names, ward digits or party tags.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paging Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
            <div>
              Showing {filteredMembers.length === 0 ? 0 : (currentPage - 1) * membersPerPage + 1} to {Math.min(currentPage * membersPerPage, filteredMembers.length)} of {filteredMembers.length} Council Members (10 per page)
            </div>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Linking Modal - Azure Active Directory user base search */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-205 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-sm uppercase tracking-wider">Search Azure Directory Base</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {!selectedProfile ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Search Azure AD Username / Namespace</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Type standard employee name or department..." 
                        value={userbaseSearch}
                        onChange={e => setUserbaseSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold outline-none transition"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Matching AD Personnel ({userbaseResults.length})</span>
                    
                    {searching ? (
                      <p className="text-slate-500 text-xs py-4 text-center animate-pulse">Searching Nkangala Local Municipal namespace on disk...</p>
                    ) : userbaseResults.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                        {userbaseSearch ? "No profiles found in AD namespace." : "Begin typing name to lookup live municipal users."}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                        {userbaseResults.map((u, index) => (
                          <div 
                            key={u.id || `${u.email}-${index}`}
                            onClick={() => setSelectedProfile(u)}
                            className="p-3 bg-white hover:bg-indigo-50/50 flex justify-between items-center transition cursor-pointer"
                          >
                            <div>
                              <div className="text-xs font-black text-slate-800">{u.fullName || 'Unnamed Employee'}</div>
                              <div className="text-[10px] text-slate-505 font-mono text-slate-500">{u.email}</div>
                              <div className="text-[9px] text-indigo-600 font-bold uppercase">{u.department || 'Corporate Division'}</div>
                            </div>
                            <button className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[9.5px] font-black uppercase flex items-center gap-1">
                              Select <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleLinkToCouncil} className="space-y-4 text-left">
                  
                  <div className="bg-indigo-950 text-indigo-105 p-4 rounded-xl text-white space-y-1">
                    <span className="text-[8.5px] font-black uppercase text-indigo-400 tracking-widest block">Linked Profile details</span>
                    <div className="text-sm font-black">{selectedProfile.fullName}</div>
                    <div className="text-xs font-mono opacity-80">{selectedProfile.email}</div>
                    <div className="text-[10px] uppercase font-bold text-indigo-300">{selectedProfile.department}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Term From</label>
                      <input 
                        type="text" 
                        value={termFrom} 
                        onChange={e => setTermFrom(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Term To</label>
                      <input 
                        type="text" 
                        value={termTo} 
                        onChange={e => setTermTo(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Political Party</label>
                      <select 
                        value={partySelect}
                        onChange={e => setPartySelect(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                      >
                        {parties.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ward Affiliation</label>
                      <input 
                        type="text" 
                        value={wardInput} 
                        onChange={e => setWardInput(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <input 
                      type="checkbox" 
                      id="portfolioHeadCk" 
                      checked={isPortfolioHead} 
                      onChange={e => setIsPortfolioHead(e.target.checked)} 
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                    />
                    <label htmlFor="portfolioHeadCk" className="text-xs font-bold text-slate-700 select-none">
                      Appointed Chairperson / Portfolio Head
                    </label>
                  </div>

                  <div className="flex justify-between gap-3 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setSelectedProfile(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase rounded-xl transition"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl transition shadow flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" /> Bind Councilor
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
