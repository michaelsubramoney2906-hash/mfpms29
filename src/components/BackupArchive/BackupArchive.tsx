import React, { useState, useEffect } from 'react';
import { Archive, Folder, File, ChevronRight, Download, Clock, User as UserIcon, Search, Eye, ShieldAlert, X, ShieldCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { User, Tenant } from '../../types';
import { tenants } from '../../data';
import { cn } from '../Branding';

interface BackupArchiveProps {
  currentUser: User;
  activeTenantId: string;
}

export function BackupArchive({ currentUser, activeTenantId }: BackupArchiveProps) {
  const isSuperUser = currentUser.role === 'admin' || currentUser.email === 'mike@mzansiflow.co.za';
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedSubFolder, setSelectedSubFolder] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [coverPageDesigns, setCoverPageDesigns] = useState<any[]>([]);
  const [savedGraphs, setSavedGraphs] = useState<any[]>([]);
  const [complianceAnswers, setComplianceAnswers] = useState<any | null>(null);
  const [sdbipPoes, setSdbipPoes] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [strategicObjectives, setStrategicObjectives] = useState<any[]>([]);
  const [previewCover, setPreviewCover] = useState<any | null>(null);
  const [previewGraph, setPreviewGraph] = useState<any | null>(null);
  const [previewCompliance, setPreviewCompliance] = useState<any | null>(null);
  const [previewIsFront, setPreviewIsFront] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Live profile backup states for dynamic downloads
  const [profilePdp, setProfilePdp] = useState<any>(null);
  const [profileJsc, setProfileJsc] = useState<any>(null);
  const [profilePplan, setProfilePplan] = useState<any>(null);

  // Security Access Guard - non-admin can only access their own profile
  useEffect(() => {
    if (selectedProfile && !isSuperUser && selectedProfile.email !== currentUser.email) {
      setSelectedProfile(null);
      setSelectedSubFolder(null);
    }
  }, [selectedProfile, currentUser, isSuperUser]);

  useEffect(() => {
    const displayTenantObj = selectedTenant || tenants.find(t => t.id === activeTenantId) || tenants[0];
    if (selectedProfile && displayTenantObj?.id) {
      // Fetch PDP
      fetch(`/api/tenant/${displayTenantObj.id}/pdp?userId=${selectedProfile.email}&t=${Date.now()}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setProfilePdp(data))
        .catch(console.error);

      // Fetch JSC
      fetch(`/api/tenant/${displayTenantObj.id}/job-competencies?userId=${selectedProfile.email}&t=${Date.now()}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setProfileJsc(data))
        .catch(console.error);

      // Fetch IPP / Plan
      fetch(`/api/tenant/${displayTenantObj.id}/pplan?userId=${selectedProfile.email}&t=${Date.now()}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setProfilePplan(data))
        .catch(console.error);
    } else {
      setProfilePdp(null);
      setProfileJsc(null);
      setProfilePplan(null);
    }
  }, [selectedProfile, selectedTenant, activeTenantId]);

  useEffect(() => {
    const tenantIdToFetch = selectedTenant ? selectedTenant.id : (activeTenantId !== 'global' ? activeTenantId : null);
    if (tenantIdToFetch) {
      fetch(`/api/tenant/${tenantIdToFetch}/users`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setUsers(data);
        })
        .catch(console.error);

      fetch(`/api/tenant/${tenantIdToFetch}/coverpages`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setCoverPageDesigns(data);
        })
        .catch(console.error);

      fetch(`/api/tenant/${tenantIdToFetch}/graphs`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setSavedGraphs(data);
        })
        .catch(console.error);

      fetch(`/api/tenant/${tenantIdToFetch}/compliance`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.answers) {
            setComplianceAnswers(data.answers);
          } else {
            setComplianceAnswers(null);
          }
        })
        .catch(console.error);

      fetch(`/api/tenant/${tenantIdToFetch}/sdbip-poes`)
        .then(res => res.ok ? res.json() : { poes: [] })
        .then(data => {
          setSdbipPoes(data.poes || []);
        })
        .catch(console.error);

      fetch(`/api/tenant/${tenantIdToFetch}/kpis`)
        .then(res => res.ok ? res.json() : { kpis: [] })
        .then(data => {
          setKpis(data.kpis || []);
        })
        .catch(console.error);

      fetch(`/api/tenant/${tenantIdToFetch}/strategic-objectives`)
        .then(res => res.ok ? res.json() : { strategicObjectives: [] })
        .then(data => {
          setStrategicObjectives(data.strategicObjectives || []);
        })
        .catch(console.error);
    }
  }, [selectedTenant, activeTenantId]);

  // If super user and no tenant selected, show folders for all municipalities
  if (isSuperUser && !selectedTenant && activeTenantId === 'global') {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800">
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">Backup Archive</h3>
              <p className="text-xs text-gray-500 font-medium tracking-tight uppercase">Global Administrator Access</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar bg-gray-50/50">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">All Municipalities</h4>
              <p className="text-sm text-gray-500 mt-1">Select a municipality to view its backup archives.</p>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search municipalities..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors w-64"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(tenant => (
              <div 
                key={tenant.id}
                onClick={() => {
                  setSelectedTenant(tenant);
                  setSelectedSubFolder(null);
                  setSelectedProfile(null);
                  setSearchQuery('');
                }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-blue-100" />
                </div>
                <span className="text-xs font-bold text-gray-700 line-clamp-2">{tenant.name}</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1">8 module folders & templates</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayTenant = selectedTenant || tenants.find(t => t.id === activeTenantId) || tenants[0];
  
  if (!selectedSubFolder) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800">
        <div className="h-16 px-6 border-b border-gray-100 flex items-center shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isSuperUser && (
                  <>
                    <button 
                      onClick={() => {
                        setSelectedTenant(null);
                        setSelectedSubFolder(null);
                        setSelectedProfile(null);
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      All Municipalities
                    </button>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </>
                )}
                <h3 className="font-bold text-gray-900 leading-tight">Backup Archive</h3>
              </div>
              <p className="text-xs text-gray-500 font-medium tracking-tight uppercase line-clamp-1">
                {displayTenant.name} / Modules & Profiles
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar bg-gray-50/50">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Sub-Folders</h4>
              <p className="text-sm text-gray-500 mt-1">
                Select a module folder or user profiles to view backups.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search folders..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors w-64"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {isSuperUser && (!searchQuery || 'apr'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('apr'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-blue-100" />
                </div>
                <span className="text-sm font-bold text-gray-700">APR</span>
                <span className="text-[10px] text-gray-400 mt-1">Annual Performance Reports</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'ar'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('ar'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-blue-100" />
                </div>
                <span className="text-sm font-bold text-gray-700">AR</span>
                <span className="text-[10px] text-gray-400 mt-1">Annual Reports</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'change management'.includes(searchQuery.toLowerCase()) || 'cm'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('cm'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-indigo-100" />
                </div>
                <span className="text-sm font-bold text-gray-700">Change Management</span>
                <span className="text-[10px] text-gray-400 mt-1">Change requests & strategies</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'budget'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('budget'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-blue-100" />
                </div>
                <span className="text-sm font-bold text-gray-700">Budget</span>
                <span className="text-[10px] text-gray-400 mt-1">Municipal budget imports</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'cover pages'.includes(searchQuery.toLowerCase()) || 'cp'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('cp'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-emerald-100" />
                </div>
                <span className="text-sm font-bold text-gray-700">Cover Pages</span>
                <span className="text-[10px] text-gray-400 mt-1">Sleek cover creations</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'graph lab'.includes(searchQuery.toLowerCase()) || 'gl'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('gl'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-650 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-green-100" />
                </div>
                <span className="text-sm font-bold text-gray-700 font-sans">graph lab</span>
                <span className="text-[10px] text-gray-400 mt-1">Saved graphs and charts</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'compliance'.includes(searchQuery.toLowerCase()) || 'comp'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('compliance'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-teal-100" />
                </div>
                <span className="text-sm font-bold text-gray-700 font-sans">Compliance</span>
                <span className="text-[10px] text-gray-400 mt-1">Municipal compliance tracker backups</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'idp'.includes(searchQuery.toLowerCase()) || 'integrated development plan'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('idp'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-emerald-100" />
                </div>
                <span className="text-sm font-bold text-gray-700 font-sans">IDP</span>
                <span className="text-[10px] text-gray-405 mt-1">Integrated Development Plan</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'sdbip'.includes(searchQuery.toLowerCase()) || 'poes'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('sdbip'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-indigo-100" />
                </div>
                <span className="text-sm font-bold text-gray-700 font-sans">SDBIP POEs</span>
                <span className="text-[10px] text-gray-400 mt-1">SDBIP Portfolios of Evidence</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'kpi'.includes(searchQuery.toLowerCase()) || 'key performance indicator'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('kpis'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-violet-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-violet-100" />
                </div>
                <span className="text-sm font-bold text-gray-700 font-sans">KPI's</span>
                <span className="text-[10px] text-gray-400 mt-1">Key Performance Indicators</span>
              </div>
            )}

            {isSuperUser && (!searchQuery || 'strategic objectives'.includes(searchQuery.toLowerCase()) || 'so'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('so'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6 fill-emerald-100" />
                </div>
                <span className="text-sm font-bold text-gray-700 font-sans">Strategic Objectives</span>
                <span className="text-[10px] text-gray-400 mt-1">Strategic objectives backups</span>
              </div>
            )}

            {(!searchQuery || 'user profiles'.includes(searchQuery.toLowerCase())) && (
              <div 
                onClick={() => { setSelectedSubFolder('profiles'); setSearchQuery(''); }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UserIcon className="w-5 h-5 fill-purple-100" />
                </div>
                <span className="text-sm font-bold text-gray-700">User Profiles</span>
                <span className="text-[10px] text-gray-400 mt-1">Individual user backups</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Decide whether to show user profiles folder view
  // If no profile selected, and this is a tenant view, and subfolder is profiles
  const shouldShowProfiles = selectedSubFolder === 'profiles' && !selectedProfile;
  const rawFiltered = isSuperUser ? users : users.filter(u => u.email === currentUser.email);
  // Apply proviso: users must have a non-empty job function/title and manager's details to have active backups
  const filteredUsers = rawFiltered.filter(u => {
    const jobTitle = u.jobFunction || u.job_function || '';
    const manager = u.manager || '';
    return jobTitle.trim() !== '' && manager.trim() !== '';
  });

  if (shouldShowProfiles) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800">
        <div className="h-16 px-6 border-b border-gray-100 flex items-center shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isSuperUser && (
                  <>
                    <button 
                      onClick={() => {
                        setSelectedTenant(null);
                        setSelectedSubFolder(null);
                        setSelectedProfile(null);
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      All Municipalities
                    </button>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </>
                )}
                <button 
                  onClick={() => setSelectedSubFolder(null)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  {displayTenant.name}
                </button>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <h3 className="font-bold text-gray-900 leading-tight">User Profiles</h3>
              </div>
              <p className="text-xs text-gray-500 font-medium tracking-tight uppercase line-clamp-1">
                {displayTenant.name} / User Profiles
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar bg-gray-50/50">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">User Profiles</h4>
              <p className="text-sm text-gray-500 mt-1">
                Select a user folder to view their individual backups. {isSuperUser ? '' : 'You only have access to your own profile.'}
              </p>
              <div className="mt-2 text-xs text-blue-700 bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 max-w-xl">
                ℹ️ <strong>System Proviso Policy:</strong> Individual profile backup archive folders are created only for active users who have a registered <strong>Job Title</strong> AND designated <strong>Manager details</strong>.
              </div>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search profiles..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors w-64"
              />
            </div>
          </div>
          
          {filteredUsers.filter(u => `${u.full_name || u.fullName || ''} ${u.email || ''}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-900">No users found</p>
              <p className="text-sm mt-1">There are no users matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredUsers.filter(u => `${u.full_name || u.fullName || ''} ${u.email || ''}`.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                <div 
                  key={u.id}
                  onClick={() => {
                    setSelectedProfile(u);
                    setSearchQuery('');
                  }}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UserIcon className="w-5 h-5 fill-purple-100" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 line-clamp-1">{u.full_name || u.fullName}</span>
                  <span className="text-[10px] text-gray-400 mt-1">{u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Backup data view
  const isProfileView = selectedSubFolder === 'profiles' || selectedSubFolder?.startsWith('profile-');
  const mockBackups: any[] = 
    selectedSubFolder === 'apr' ? [
      { id: 'apr-1', name: 'apr_municipal_compliance_v1.0.pdf', type: 'Annual Performance Report', date: '2026-05-12 14:30', size: '2.4 MB' },
      { id: 'apr-2', name: 'apr_service_delivery_audit_backup.pdf', type: 'Service Audit', date: '2026-04-18 11:20', size: '1.8 MB' },
      { id: 'apr-3', name: 'apr_ward_performance_consolidated.pdf', type: 'Performance Data', date: '2026-03-01 09:15', size: '4.1 MB' }
    ] : selectedSubFolder === 'ar' ? [
      { id: 'ar-1', name: 'annual_report_final_signed_2025.pdf', type: 'Annual Report', date: '2026-05-10 16:45', size: '7.2 MB' },
      { id: 'ar-2', name: 'ar_financial_statements_audited.pdf', type: 'Financial Statements', date: '2026-04-20 10:00', size: '5.5 MB' },
      { id: 'ar-3', name: 'ar_governance_reconciliation_2025.pdf', type: 'Governance Records', date: '2026-03-15 13:10', size: '3.0 MB' }
    ] : selectedSubFolder === 'cm' ? [
      { id: 'cm-doc-1', name: 'Code for Ethical Leadership.pdf', type: 'Ethical Guidelines', date: '2026-06-04 10:00', size: '1.2 MB' },
      { id: 'cm-doc-2', name: 'PMS Guide.pdf', type: 'Performance Training Manual', date: '2026-06-04 10:00', size: '2.6 MB' },
      { id: 'cm-doc-3', name: 'Local Government Municipal Supply Chain.pdf', type: 'Finance & Procurement Regulation', date: '2026-06-04 10:00', size: '1.8 MB' },
      { id: 'cm-doc-4', name: 'National Treasury.pdf', type: 'Treasury Guidelines & Outlines', date: '2026-06-04 10:00', size: '3.1 MB' },
      { id: 'cm-doc-5', name: 'MFMA Act 56 of 2003.pdf', type: 'Statutory Legislation', date: '2026-06-04 10:00', size: '4.5 MB' },
      { id: 'cm-doc-6', name: 'mSCOA.pdf', type: 'Standard Chart of Accounts', date: '2026-06-04 10:00', size: '5.2 MB' },
      { id: 'cm-1', name: 'change_readiness_assessment_municipal.pdf', type: 'People Change Readiness', date: '2026-05-28 15:30', size: '1.5 MB' },
      { id: 'cm-2', name: 'system_migration_ict_change_control.pdf', type: 'ICT Change Control', date: '2026-05-14 09:40', size: '2.1 MB' },
      { id: 'cm-3', name: 'institutional_restructuring_blueprint.pdf', type: 'Strategic Realignment', date: '2026-04-05 14:15', size: '3.8 MB' }
    ] : selectedSubFolder === 'budget' ? [
      { id: 'b-1', name: 'approved_operating_budget_2026_2027.pdf', type: 'Operating Budget', date: '2026-05-01 08:30', size: '6.3 MB' },
      { id: 'b-2', name: 'capital_expenditure_framework_final.pdf', type: 'Capital Budget', date: '2026-04-12 11:00', size: '4.9 MB' }
    ] : selectedSubFolder === 'compliance' ? [
      {
        id: `compliance-real-${displayTenant.id}`,
        name: `compliance_tracker_${displayTenant.id}_backup.json`,
        type: 'Municipal Compliance Evaluation Answers',
        date: '2026-06-04 10:00',
        size: '15 KB',
        fileDataUrl: complianceAnswers ? `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(complianceAnswers, null, 2))}` : `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ default_mode: true }, null, 2))}`,
        isCompliance: true,
        answers: complianceAnswers
      },
      { 
        id: 'compliance-statutory-1', 
        name: 'statutory_compliance_audit_baseline.pdf', 
        type: 'Statutory Compliance Baseline Guidelines', 
        date: '2026-05-20 12:45', 
        size: '1.4 MB' 
      },
      { 
        id: 'compliance-legislation-framework', 
        name: 'legislation_municipal_accountability_standards.pdf', 
        type: 'Accountability Standards Regulation', 
        date: '2026-05-02 09:15', 
        size: '3.6 MB' 
      }
    ] : selectedSubFolder === 'cp' ? coverPageDesigns.map((cp, idx) => {
      const emailSafe = cp.userEmail ? cp.userEmail.replace(/[@.]/g, '_') : 'user';
      return {
        id: cp.id || `cp-${idx}`,
        name: `cover_page_${emailSafe}.json`,
        type: 'Report Cover Page Layout',
        date: cp.updatedAt ? new Date(cp.updatedAt).toLocaleString('en-ZA').substring(0, 16) : '2026-06-04 10:00',
        size: '12 KB',
        config: cp.config,
        userEmail: cp.userEmail,
        isCoverPage: true
      };
    }) : selectedSubFolder === 'gl' ? savedGraphs.map((graph, idx) => {
      return {
        id: graph.id || `gl-${idx}`,
        name: graph.filename || `graph_${idx + 1}.png`,
        type: `${graph.graphType ? graph.graphType.toUpperCase() : 'BAR'} Chart Image`,
        date: graph.createdAt ? new Date(graph.createdAt).toLocaleString('en-ZA').substring(0, 16) : '2026-06-04 10:00',
        size: '48 KB',
        fileDataUrl: graph.fileDataUrl,
        title: graph.title,
        isGraph: true
      };
    }) : selectedSubFolder === 'idp' ? [
      {
        id: 'idp-master-temp',
        name: `idp_master_template_${displayTenant.id}.json`,
        type: 'Integrated Development Plan (IDP) Consolidated Template',
        date: '2026-06-04 12:00',
        size: '18 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          municipality_id: displayTenant.id,
          municipality_name: displayTenant.name,
          framework: "MFMA Circular 71 & Systems Act Compliance",
          version: "2026-2027 R1",
          chapters_included: ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5", "Chapter 6", "Chapter 7", "Chapter 8"],
          chapters_data: [
            {
              id: 1,
              title: "CHAPTER 1: EXECUTIVE SUMMARY & PROCESS",
              elements: ["Mayor’s Foreword", "Municipal Manager’s Overview", "The IDP Process Plan", "District Development Model Alignment"]
            },
            {
              id: 2,
              title: "CHAPTER 2: SITUATIONAL ANALYSIS (Status Quo)",
              elements: ["Demographic Profile", "Socio-Economic Profile", "Service Delivery Backlogs", "Institutional Capacity"]
            },
            {
              id: 3,
              title: "CHAPTER 3: STRATEGIC DIRECTIVES",
              elements: ["Vision & Mission Statement", "Strategic Goals (mSCOA Aligned)", "Strategic Objectives"]
            },
            {
              id: 4,
              title: "CHAPTER 4: SPATIAL DEVELOPMENT FRAMEWORK (SDF)",
              elements: ["Spatial Vision", "Land Use Management / SPLUMA", "Capital Investment Framework"]
            },
            {
              id: 5,
              title: "CHAPTER 5: IMPLEMENTATION PLAN (Projects)",
              elements: ["mSCOA Technical Matrix", "Capital Projects", "Operational Projects", "Unfunded Projects Wishlist"]
            },
            {
              id: 6,
              title: "CHAPTER 6: FINANCIAL PLAN",
              elements: ["Revenue Enhancement Strategies", "Cost Containment Models", "MTREF Budget Summaries"]
            },
            {
              id: 7,
              title: "CHAPTER 7: OPERATIONAL SECTOR PLANS",
              elements: ["Disaster Management", "Water Services", "Integrated Waste", "Local Economic Development"]
            },
            {
              id: 8,
              title: "CHAPTER 8: KEY PERFORMANCE INDICATORS (KPIs)",
              elements: ["National General Key Performance Indicators", "SDBIP Integration Goals", "Efficacy Metrics"]
            }
          ]
        }, null, 2))}`
      },
      {
        id: 'idp-ch-1',
        name: 'chapter_1_executive_summary_template.json',
        type: 'IDP Chapter Template',
        date: '2026-06-04 12:00',
        size: '3 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          chapter: "CHAPTER 1",
          title: "EXECUTIVE SUMMARY & PROCESS",
          mfma_alignment: "Section 21 Time Schedule Sync",
          sample_elements: "Political direction, strategic foreword, advisory panels"
        }, null, 2))}`
      },
      {
        id: 'idp-ch-2',
        name: 'chapter_2_situational_analysis_template.json',
        type: 'IDP Chapter Template',
        date: '2026-06-04 12:00',
        size: '4 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          chapter: "CHAPTER 2",
          title: "SITUATIONAL ANALYSIS (Status Quo)",
          socio_economic_baseline: "StatsSA 2022 Census data maps",
          backlogs: ["Water formal access", "Electricity grid capacity", "Sanitation buckets elimination"]
        }, null, 2))}`
      },
      {
        id: 'idp-ch-3',
        name: 'chapter_3_strategic_directives_template.json',
        type: 'IDP Chapter Template',
        date: '2026-06-04 12:00',
        size: '3 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          chapter: "CHAPTER 3",
          title: "STRATEGIC DIRECTIVES",
          mscoa_alignment: "1-to-1 strategic segment mapping",
          priorities: ["Local Bulk Infrastructure Development", "Revenue Enhancement Integrity"]
        }, null, 2))}`
      },
      {
        id: 'idp-ch-4',
        name: 'chapter_4_spatial_development_framework_template.json',
        type: 'IDP Chapter Template',
        date: '2026-06-04 12:00',
        size: '3 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          chapter: "CHAPTER 4",
          title: "SPATIAL DEVELOPMENT FRAMEWORK (SDF)",
          spluma_status: "Legally compliant",
          corridors: ["N2 Economic Belt Integration", "Industrial Node Zones"]
        }, null, 2))}`
      },
      {
        id: 'idp-ch-5',
        name: 'chapter_5_implementation_projects_template.json',
        type: 'IDP Chapter Template',
        date: '2026-06-04 12:00',
        size: '5 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          chapter: "CHAPTER 5",
          title: "IMPLEMENTATION PLAN (Projects)",
          mandatory_mscoa_guid: "Registered",
          primary_project_example: {
            name: "Bulk Water Purification Upgrade",
            mscoa_guid: "PC-Water-09923",
            region: "Ward 12 Node",
            budget: "R 12,500,000",
            source: "MIG"
          }
        }, null, 2))}`
      },
      {
        id: 'idp-ch-6',
        name: 'chapter_6_financial_plan_template.json',
        type: 'IDP Chapter Template',
        date: '2026-06-04 12:00',
        size: '3 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          chapter: "CHAPTER 6",
          title: "FINANCIAL PLAN",
          mtref_compliance: "Aligned with Circular 115 boundaries",
          components: ["Operating revenue summaries", "Tariff restructuring policies"]
        }, null, 2))}`
      },
      {
        id: 'idp-ch-7',
        name: 'chapter_7_operational_sector_plans_template.json',
        type: 'IDP Chapter Template',
        date: '2026-06-04 12:00',
        size: '3 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          chapter: "CHAPTER 7",
          title: "OPERATIONAL SECTOR PLANS",
          plans: ["Disaster Management Blueprint", "Integrated Waste Strategy", "LED Strategic Framework"]
        }, null, 2))}`
      },
      {
        id: 'idp-ch-8',
        name: 'chapter_8_key_performance_indicators_template.json',
        type: 'IDP Chapter Template',
        date: '2026-06-04 12:00',
        size: '3 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          chapter: "CHAPTER 8",
          title: "KEY PERFORMANCE INDICATORS (KPIs)",
          guidelines: "National General KPIs compliance checklist",
          metrics: ["SDBIP output counts", "Bulk services uptime reliability"]
        }, null, 2))}`
      }
    ] : selectedSubFolder === 'sdbip' ? sdbipPoes.map(poe => ({
      id: poe.id || `${poe.refNum}-${poe.date}`,
      name: poe.name,
      type: `SDBIP POE Ref: ${poe.refNum}`,
      date: poe.date,
      size: poe.size || "1.5 MB"
    })) : selectedSubFolder === 'kpis' ? [
      {
        id: 'kpis-poe-folder',
        name: 'POE',
        type: 'Sub-Folder',
        date: 'Folder',
        size: '--',
        isFolder: true,
        targetFolder: 'kpi-poe'
      },
      {
        id: 'kpis-data',
        name: 'key_performance_indicators_list_backup.json',
        type: 'KPI Collection',
        date: new Date().toISOString().split('T')[0] + ' 12:00',
        size: `${Math.round(JSON.stringify(kpis).length / 102) / 10 || 1.1} KB`,
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(kpis, null, 2))}`
      }
    ] : selectedSubFolder === 'kpi-poe' ? (
      kpis.flatMap(k => k.poes || []).length > 0 ? (
        kpis.flatMap(k => k.poes || []).map((p, i) => ({
          id: p.id || `kpi-poe-${i}`,
          name: p.name || `kpi_poe_document_${i}.pdf`,
          type: 'Portfolio of Evidence',
          date: p.date || '2026-06-04 12:00',
          size: p.size || '1.2 MB',
          fileDataUrl: p.fileDataUrl
        }))
      ) : [
        { id: 'kpi-poe-default-1', name: 'service_delivery_water_registers.xlsx', type: 'Portfolio of Evidence', date: '2026-06-04 10:00', size: '450 KB' },
        { id: 'kpi-poe-default-2', name: 'engineered_roads_sign_offs.pdf', type: 'Portfolio of Evidence', date: '2026-06-03 14:30', size: '1.4 MB' }
      ]
    ) : selectedSubFolder === 'so' ? [
      {
        id: 'so-poe-folder',
        name: 'POE',
        type: 'Sub-Folder',
        date: 'Folder',
        size: '--',
        isFolder: true,
        targetFolder: 'so-poe'
      },
      {
        id: 'so-data',
        name: 'strategic_objectives_list_backup.json',
        type: 'Strategic Objectives Collection',
        date: new Date().toISOString().split('T')[0] + ' 12:00',
        size: `${Math.round(JSON.stringify(strategicObjectives).length / 102) / 10 || 0.8} KB`,
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(strategicObjectives, null, 2))}`
      }
    ] : selectedSubFolder === 'so-poe' ? (
      strategicObjectives.flatMap(s => s.poes || []).length > 0 ? (
        strategicObjectives.flatMap(s => s.poes || []).map((p, i) => ({
          id: p.id || `so-poe-${i}`,
          name: p.name || `strategic_objective_poe_${i}.pdf`,
          type: 'Strategic POE Document',
          date: p.date || '2026-06-04 12:00',
          size: p.size || '1.8 MB',
          fileDataUrl: p.fileDataUrl
        }))
      ) : [
        { id: 'so-poe-default-1', name: 'idp_participation_minutes_signed.pdf', type: 'Strategic POE Document', date: '2026-06-04 11:30', size: '2.3 MB' },
        { id: 'so-poe-default-2', name: 'cooperative_governance_assessment_coGTA.pdf', type: 'Strategic POE Document', date: '2026-06-02 09:15', size: '3.1 MB' }
      ]
    ) : selectedSubFolder === 'profiles' ? [
      { id: 'module-pdp', name: 'Personal Development Plan (PDP)', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-pdp' },
      { id: 'module-jsc', name: 'Job Specific Competencies', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-jsc' },
      { id: 'module-ipp', name: 'Performance Plan', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-ipp' },
      { id: 'module-pa', name: 'Performance Agreements', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-pa' },
      { id: 'module-kpi', name: 'KPA & KPI Registration', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-kpi' },
      { id: 'module-qr', name: 'Drafting Suite (Quarterly Reports)', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-qr' },
      { id: 'module-ev', name: 'Self Evaluation', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-ev' },
      { id: 'module-mr', name: 'Manager Review', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-mr' },
      { id: 'module-mod', name: 'Audit & Moderation', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-mod' },
      { id: 'module-rep', name: 'Reports', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-rep' },
      { id: 'module-sec', name: 'Security & Audit Trail', type: 'Profile Sub-Folder', date: 'Folder', size: '--', isFolder: true, targetFolder: 'profile-sec' }
    ] : selectedSubFolder === 'profile-pdp' ? [
      { 
        id: 'p-1', 
        name: `pdp_${selectedProfile?.email || 'user'}.json`, 
        type: 'Personal Development Plan Data', 
        date: new Date().toISOString().substring(0, 16).replace('T', ' '), 
        size: '15 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(profilePdp || { message: "No PDP found for this user" }, null, 2))}`
      }
    ] : selectedSubFolder === 'profile-jsc' ? [
      { 
        id: 'p-2', 
        name: `job_competencies_${selectedProfile?.email || 'user'}.json`, 
        type: 'Job Specific Competencies Data', 
        date: new Date().toISOString().substring(0, 16).replace('T', ' '), 
        size: '20 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(profileJsc || { message: "No Job Competencies found for this user" }, null, 2))}`
      }
    ] : selectedSubFolder === 'profile-ipp' ? [
      { 
        id: 'p-3', 
        name: `performance_plan_${selectedProfile?.email || 'user'}.json`, 
        type: 'Performance Plan Data', 
        date: new Date().toISOString().substring(0, 16).replace('T', ' '), 
        size: '35 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(profilePplan || { message: "No Performance Plan found for this user" }, null, 2))}`
      }
    ] : selectedSubFolder === 'profile-pa' ? [
      { 
        id: 'p-4', 
        name: `performance_agreement_${selectedProfile?.email || 'user'}.json`, 
        type: 'Performance Agreement Data', 
        date: new Date().toISOString().substring(0, 16).replace('T', ' '), 
        size: '45 KB',
        fileDataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
          agreementType: "Performance Agreement",
          user: selectedProfile?.fullName || selectedProfile?.full_name,
          employeeEmail: selectedProfile?.email,
          performancePlan: profilePplan || [],
          personalDevelopmentPlan: profilePdp || [],
          jobCompetencies: profileJsc || []
        }, null, 2))}`
      }
    ] : selectedSubFolder === 'profile-kpi' ? [
      { id: 'p-5', name: `kpas_kpis_${selectedProfile?.email || 'user'}.json`, type: 'KPA & KPI Registration Data', date: new Date().toISOString().substring(0, 16).replace('T', ' '), size: '60 KB' }
    ] : selectedSubFolder === 'profile-qr' ? [
      { id: 'p-6', name: `drafting_suite_${selectedProfile?.email || 'user'}.json`, type: 'Drafting Suite Drafts', date: new Date().toISOString().substring(0, 16).replace('T', ' '), size: '24 KB' }
    ] : selectedSubFolder === 'profile-ev' ? [
      { id: 'p-7', name: `evaluation_${selectedProfile?.email || 'user'}.json`, type: 'Self Evaluation Data', date: new Date().toISOString().substring(0, 16).replace('T', ' '), size: '18 KB' }
    ] : selectedSubFolder === 'profile-mr' ? [
      { id: 'p-8', name: `manager_review_${selectedProfile?.email || 'user'}.json`, type: 'Manager Review Data', date: new Date().toISOString().substring(0, 16).replace('T', ' '), size: '15 KB' }
    ] : selectedSubFolder === 'profile-mod' ? [
      { id: 'p-9', name: `moderation_internal_audit_${selectedProfile?.email || 'user'}.json`, type: 'Audit & Moderation Data', date: new Date().toISOString().substring(0, 16).replace('T', ' '), size: '12 KB' }
    ] : selectedSubFolder === 'profile-rep' ? [
      { id: 'p-10', name: `ipms_reports_${selectedProfile?.email || 'user'}.json`, type: 'Generated IPMS Reports', date: new Date().toISOString().substring(0, 16).replace('T', ' '), size: '22 KB' }
    ] : selectedSubFolder === 'profile-sec' ? [
      { id: 'p-sec-1', name: 'user_profile_access_audit_log.csv', type: 'Audit Trail', date: '2026-05-29 17:00', size: '124 KB' },
      { id: 'p-sec-2', name: 'user_signature_cert_auth.key', type: 'Security Key', date: '2026-04-25 15:30', size: '4 KB' }
    ] : [];
  
  const displayTitle = isProfileView ? 
                       (selectedSubFolder === 'profiles' ? (selectedProfile?.full_name || selectedProfile?.fullName || 'User Profile') :
                       selectedSubFolder === 'profile-pdp' ? `${selectedProfile?.full_name || 'User Profile'} / PDP` :
                       selectedSubFolder === 'profile-jsc' ? `${selectedProfile?.full_name || 'User Profile'} / Job Competencies` :
                       selectedSubFolder === 'profile-ipp' ? `${selectedProfile?.full_name || 'User Profile'} / Performance Plan` :
                       selectedSubFolder === 'profile-pa' ? `${selectedProfile?.full_name || 'User Profile'} / Agreements` :
                       selectedSubFolder === 'profile-kpi' ? `${selectedProfile?.full_name || 'User Profile'} / KPIs` :
                       selectedSubFolder === 'profile-qr' ? `${selectedProfile?.full_name || 'User Profile'} / Quarterly Reports` :
                       selectedSubFolder === 'profile-ev' ? `${selectedProfile?.full_name || 'User Profile'} / Evaluation` :
                       selectedSubFolder === 'profile-mr' ? `${selectedProfile?.full_name || 'User Profile'} / Manager Review` :
                       selectedSubFolder === 'profile-mod' ? `${selectedProfile?.full_name || 'User Profile'} / Moderation` :
                       selectedSubFolder === 'profile-rep' ? `${selectedProfile?.full_name || 'User Profile'} / Reports` :
                       selectedSubFolder === 'profile-sec' ? `${selectedProfile?.full_name || 'User Profile'} / Audit & Security` :
                       (selectedProfile?.full_name || selectedProfile?.fullName || 'User Profile')) : 
                       selectedSubFolder === 'budget' ? 'Budget Backups' :
                       selectedSubFolder === 'cp' ? 'Cover Pages' :
                       selectedSubFolder === 'gl' ? 'graph lab' :
                       selectedSubFolder === 'compliance' ? 'Compliance Backups' :
                       selectedSubFolder === 'idp' ? 'IDP Backups & Templates' :
                       selectedSubFolder === 'sdbip' ? 'SDBIP POEs Backups' :
                       selectedSubFolder === 'kpis' ? 'KPIs Backups' :
                       selectedSubFolder === 'kpi-poe' ? 'KPIs POE Backups' :
                       selectedSubFolder === 'so' ? 'Strategic Objectives Backups' :
                       selectedSubFolder === 'so-poe' ? 'Strategic Objectives POE Backups' :
                       selectedSubFolder === 'apr' ? 'APR Backups' :
                       selectedSubFolder === 'ar' ? 'AR Backups' :
                       selectedSubFolder === 'cm' ? 'Change Management Backups' : 'Backups';

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in text-gray-800">
      <div className="h-16 px-6 border-b border-gray-100 flex items-center shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {isSuperUser && selectedTenant && (
                <>
                  <button 
                    onClick={() => {
                      setSelectedTenant(null);
                      setSelectedSubFolder(null);
                      setSelectedProfile(null);
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    All Municipalities
                  </button>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </>
              )}
              <button 
                onClick={() => {
                  setSelectedSubFolder(null);
                  setSelectedProfile(null);
                }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {displayTenant.name}
              </button>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              {isProfileView ? (
                <>
                  <button 
                    onClick={() => {
                      setSelectedProfile(null);
                      setSelectedSubFolder('profiles');
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    User Profiles
                  </button>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </>
              ) : null}
              <h3 className="font-bold text-gray-900 leading-tight">Archive</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium tracking-tight uppercase line-clamp-1">
              {isProfileView ? `Profile: ${displayTitle}` : `Module: ${displayTitle}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 hide-scrollbar bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Available Backups</h4>
              <p className="text-sm text-gray-500 mt-1">Download and restore previous system states and reports for {displayTitle}.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search backups..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors w-64"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap">
                Create New Backup
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Backup Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockBackups.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.type.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium text-gray-900">No backups found</p>
                      <p className="text-sm mt-1">This user profile does not have any backup archives yet.</p>
                    </td>
                  </tr>
                ) : (
                  mockBackups.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.type.toLowerCase().includes(searchQuery.toLowerCase())).map(backup => (
                    <tr 
                      key={backup.id} 
                      className={cn("hover:bg-gray-50/50 transition-colors", backup.isFolder && "cursor-pointer font-semibold")}
                      onClick={() => {
                        if (backup.isFolder) {
                          setSelectedSubFolder(backup.targetFolder);
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {backup.isFolder ? (
                            <Folder className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                          ) : (
                            <File className="w-5 h-5 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">{backup.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          {backup.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-500 font-mono text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {backup.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {backup.size}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {backup.isFolder ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubFolder(backup.targetFolder);
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            Open Folder
                          </button>
                        ) : (
                          <>
                            {backup.isCoverPage && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewCover(backup);
                                  setPreviewIsFront(true);
                                }}
                                title="Preview Cover Page Visuals"
                                className="w-8 h-8 rounded hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors shadow-sm border border-transparent hover:border-emerald-100 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {backup.isGraph && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewGraph(backup);
                                }}
                                title="Preview Saved Graph Layout"
                                className="w-8 h-8 rounded hover:bg-green-50 text-green-600 flex items-center justify-center transition-colors shadow-sm border border-transparent hover:border-green-100 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {backup.isCompliance && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewCompliance(backup);
                                }}
                                title="Preview Compliance Evaluation Answers"
                                className="w-8 h-8 rounded hover:bg-teal-50 text-teal-600 flex items-center justify-center transition-colors shadow-sm border border-transparent hover:border-teal-100 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {backup.fileDataUrl ? (
                              <a 
                                href={backup.fileDataUrl} 
                                download={backup.name}
                                onClick={(e) => e.stopPropagation()}
                                title={`Download ${backup.name}`}
                                className="w-8 h-8 rounded hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-colors shadow-sm border border-transparent hover:border-blue-100 inline-flex cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Initiating download flow for: ${backup.name}`);
                                }}
                                title="Download Backup"
                                className="w-8 h-8 rounded hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-colors shadow-sm border border-transparent hover:border-blue-100 inline-flex cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RENDERED PREVIEW MODAL FOR SAVED COVER PAGE LAYOUTS */}
      {previewCover && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4 select-none animate-fade-in text-slate-800">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header control */}
            <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-xs text-green-400 font-mono font-bold uppercase tracking-widest">Saved Cover Layout Preview</span>
                <span className="text-[10px] text-slate-400 font-mono">{previewCover.userEmail}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex space-x-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setPreviewIsFront(true)}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-bold uppercase rounded transition-all",
                      previewIsFront ? "bg-green-600 text-white" : "text-slate-400"
                    )}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setPreviewIsFront(false)}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-bold uppercase rounded transition-all",
                      !previewIsFront ? "bg-green-600 text-white" : "text-slate-400"
                    )}
                  >
                    Back
                  </button>
                </div>

                <button 
                  onClick={() => setPreviewCover(null)}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Canvas View */}
            <div className="flex-1 p-6 bg-slate-900/50 overflow-y-auto flex items-center justify-center min-h-[450px]">
              <div className="w-full max-w-[340px] shadow-2xl relative">
                
                {previewIsFront ? (
                  /* FRONT */
                  <div 
                    style={{ fontFamily: `'${previewCover.config?.titleFont || 'Space Grotesk'}', sans-serif` }}
                    className="w-full aspect-[1/1.41] bg-white rounded-xl p-6 flex flex-col justify-between overflow-hidden relative"
                  >
                    <div 
                      className="absolute inset-0 z-0 bg-cover bg-center opacity-10 blur-sm"
                      style={{ backgroundImage: `url(${previewCover.config?.bgImage})` }}
                    ></div>
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: previewCover.config?.primaryColor || '#15803d' }}></div>
                    <div className="absolute bottom-0 left-0 w-full h-1.5" style={{ backgroundColor: previewCover.config?.secondaryColor || '#ca8a04' }}></div>

                    <div className="z-10 text-center space-y-2 pt-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-lg shadow-sm border border-slate-200">
                        <span>{previewCover.config?.selectedLogo === 'emerald-shield' ? '🛡️' : previewCover.config?.selectedLogo === 'royal-protea' ? '🌸' : previewCover.config?.selectedLogo === 'corporate-globe' ? '🌐' : previewCover.config?.selectedLogo === 'landmark-star' ? '⭐' : '🇿🇦'}</span>
                      </div>
                      <h4 
                        className="font-black tracking-wider uppercase text-slate-800 leading-tight"
                        style={{ fontSize: `${previewCover.config?.muniFontSize ? previewCover.config.muniFontSize : 18}px` }}
                      >
                        {previewCover.config?.municipalityName}
                      </h4>
                    </div>

                    <div className="z-10 text-center space-y-2.5">
                      <div className="w-10 h-[2px] mx-auto rounded" style={{ backgroundColor: previewCover.config?.primaryColor || '#15803d' }}></div>
                      <h1 
                        className="font-black leading-tight tracking-tight uppercase text-slate-900"
                        style={{ fontSize: `${previewCover.config?.titleFontSize ? previewCover.config.titleFontSize : 32}px` }}
                      >
                        {previewCover.config?.documentTitle || 'INTEGRATED DEVELOPMENT PLAN'}
                      </h1>
                      <div className="w-6 h-[1px] mx-auto rounded" style={{ backgroundColor: previewCover.config?.secondaryColor || '#ca8a04' }}></div>
                      {previewCover.config?.documentSubtitle && (
                        <p className="text-slate-505 font-medium text-[9px] uppercase max-w-[240px] mx-auto leading-relaxed">
                          {previewCover.config.documentSubtitle}
                        </p>
                      )}
                    </div>

                    <div className="z-10 border-t border-slate-150 pt-3 flex justify-between font-mono text-[8px] font-bold uppercase text-slate-400">
                      <span>VERIFIED BACKUP</span>
                      <span>CP-920-K</span>
                    </div>
                  </div>
                ) : (
                  /* BACK */
                  <div 
                    style={{ fontFamily: `'${previewCover.config?.titleFont || 'Space Grotesk'}', sans-serif` }}
                    className="w-full aspect-[1/1.41] bg-slate-950 rounded-xl p-6 flex flex-col justify-between overflow-hidden relative text-white"
                  >
                    <div 
                      className="absolute inset-0 z-0 bg-cover bg-center opacity-5 blur-xs"
                      style={{ backgroundImage: `url(${previewCover.config?.bgImage})` }}
                    ></div>
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: previewCover.config?.primaryColor || '#15803d' }}></div>

                    <div className="z-10 border-b border-white/5 pb-2 text-[8px] font-mono font-bold uppercase text-slate-400 select-none flex justify-between">
                      <span>REPORT ENDORSEMENT</span>
                      <span>CONFIDENTIAL</span>
                    </div>

                    <div className="z-10 my-auto space-y-4">
                      {previewCover.config?.isConfidential && (
                        <div className="border border-red-500/20 bg-red-950/10 rounded-lg p-3 text-center text-red-400 font-mono">
                          <ShieldAlert className="w-5 h-5 text-red-500 mx-auto mb-1 animate-pulse" />
                          <h6 className="font-extrabold text-[9px] uppercase tracking-widest">CONFIDENTIAL</h6>
                        </div>
                      )}

                      <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-1">
                        <span className="text-[8px] text-slate-400 font-mono uppercase block">Accounting Officer</span>
                        <p className="text-[10px] font-black uppercase text-white">{previewCover.config?.signOffMM || 'Accounting Officer'}</p>
                      </div>
                    </div>

                    <div className="z-10 border-t border-white/5 pt-3 text-[8px] font-mono text-slate-400 flex justify-between uppercase">
                      <span>© {new Date().getFullYear()} PRESETS</span>
                      <span>MZANSIFLOW</span>
                    </div>

                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* RENDERED PREVIEW MODAL FOR SAVED GRAPHS */}
      {previewGraph && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4 select-none animate-fade-in text-slate-800">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            {/* Header control */}
            <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-xs text-green-400 font-mono font-bold uppercase tracking-widest">Saved Graph Preview (JPG/PNG)</span>
                <span className="text-[10px] text-slate-400 font-mono italic">{previewGraph.name}</span>
              </div>
              <button 
                onClick={() => setPreviewGraph(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer animate-pulse"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Image display */}
            <div className="flex-1 p-6 bg-slate-900/50 overflow-y-auto flex items-center justify-center min-h-[350px]">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
                <img 
                  referrerPolicy="no-referrer"
                  src={previewGraph.fileDataUrl} 
                  className="max-w-full h-auto mx-auto rounded-lg border border-gray-100" 
                  alt={previewGraph.title || 'Chart'} 
                />
                <div className="mt-4 text-center">
                  <h4 className="text-gray-900 font-bold text-sm tracking-tight">{previewGraph.title || 'Performance Data Chart'}</h4>
                  <p className="text-xs text-gray-400 mt-1 uppercase font-mono">{previewGraph.type}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDERED PREVIEW MODAL FOR COMPLIANCE AUDIT ANSWERS */}
      {previewCompliance && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4 select-none animate-fade-in text-slate-800">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh] text-white select-text">
            {/* Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-950/50 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  🛡️
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight uppercase text-white">Compliance Evaluation Checklist</h4>
                  <p className="text-[10px] text-slate-400 font-mono italic">Archive File: {previewCompliance.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewCompliance(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main content split */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/25">
              <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h5 className="text-[11px] font-mono text-teal-400 uppercase tracking-wider font-bold">Municipality Scope</h5>
                  <h3 className="text-base font-black text-white mt-0.5">{displayTenant.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Reviewing active governance benchmarks matching statutory regulations (MFMA / Systems Act).</p>
                </div>
                <div className="flex items-center gap-6 shrink-0 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Status</span>
                    <span className="text-xs font-bold text-teal-400 uppercase mt-0.5 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 animate-pulse" /> SECURE
                    </span>
                  </div>
                  <div className="text-center border-l border-slate-800 pl-4">
                    <span className="text-[10px] text-slate-400 font-mono block uppercase">Checked On</span>
                    <span className="text-xs text-slate-300 font-bold block mt-0.5">2026-06-04</span>
                  </div>
                </div>
              </div>

              {/* Checklist review grids */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest px-1">Audited Governance Sections</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'apr',
                      name: 'Annual Performance Report',
                      criteria: [
                        { text: 'Comparison with SDBIP targets of the previous year (Sec 46)', ruleKey: 'apr_apr-1', defaultV: true },
                        { text: 'Evaluation on performance metrics by external AG Audit team', ruleKey: 'apr_apr-2', defaultV: true },
                        { text: 'Involvement of general public and ward structures in setting thresholds', ruleKey: 'apr_apr-3', defaultV: true },
                        { text: 'Submission to MEC and provincial treasury inside 10 days post-adoption', ruleKey: 'apr_apr-4', defaultV: false },
                      ]
                    },
                    {
                      id: 'ar',
                      name: 'Annual Report',
                      criteria: [
                        { text: 'Contains Audited Annual Financial Statements (AFS) exactly', ruleKey: 'ar_ar-1', defaultV: true },
                        { text: 'Includes disclosure of salary benefits of Mayor, CFO, and MM', ruleKey: 'ar_ar-2', defaultV: true },
                        { text: 'Voted on S129 oversight report within two months of tabling', ruleKey: 'ar_ar-3', defaultV: true },
                        { text: 'Published in full on municipal website within five days of public tabling', ruleKey: 'ar_ar-4', defaultV: false }
                      ]
                    },
                    {
                      id: 'cm',
                      name: 'Change Management',
                      criteria: [
                        { text: 'Involvement of all leadership and administrative divisions in SDBIP transitions', ruleKey: 'cm_cm-1', defaultV: true },
                        { text: 'Institutionalized change management committee with clear lines of authority', ruleKey: 'cm_cm-2', defaultV: true },
                        { text: 'Regular workshops conducted for staff training and readiness outcomes', ruleKey: 'cm_cm-3', defaultV: false }
                      ]
                    },
                    {
                      id: 'rm',
                      name: 'Risk Management',
                      criteria: [
                        { text: 'Maintains independent risk register reviewed quarterly by risk unit', ruleKey: 'rm_rm-1', defaultV: true },
                        { text: 'Adopted comprehensive SCM risk mitigation procedures', ruleKey: 'rm_rm-2', defaultV: true },
                        { text: 'Maintains active internal audit committee with non-executive majority', ruleKey: 'rm_rm-3', defaultV: true },
                        { text: 'Internal audit reviews compliance on standard procurement parameters', ruleKey: 'rm_rm-4', defaultV: false }
                      ]
                    }
                  ].map(sec => (
                    <div key={sec.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-xs uppercase tracking-tight text-slate-300">{sec.name}</span>
                        <span className="text-[9px] text-teal-400 font-mono tracking-wider uppercase font-bold">MFMA SECTION</span>
                      </div>
                      <div className="space-y-2">
                        {sec.criteria.map((cr, cIdx) => {
                          const customAnswers = previewCompliance.answers || {};
                          const finalCompliant = customAnswers[cr.ruleKey] !== undefined ? customAnswers[cr.ruleKey] : cr.defaultV;
                          return (
                            <div key={cIdx} className="flex items-start gap-2.5 text-xs">
                              {finalCompliant ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-550 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              )}
                              <p className="text-slate-300 leading-normal text-[11px]">{cr.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 text-center font-mono text-[9px] uppercase tracking-wider text-slate-500 shrink-0 select-none">
              verified system authentication • nakangala district municipality backup pipeline
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
