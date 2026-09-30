import React, { useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { tenants } from '../data';
import { 
  Users, UserPlus, FileSpreadsheet, Key, ShieldCheck, 
  RefreshCw, CheckCircle2, AlertTriangle, Upload, 
  Search, KeyRound, Edit, PenTool, Monitor, Globe, Activity,
  Database, Play, Trash2, AlertCircle, Terminal, HelpCircle, Check, Info
} from 'lucide-react';
import { cn } from './Branding';
import { PerformanceMonitor } from './Admin/PerformanceMonitor';

interface UserManagement2Props {
  currentUser: User;
  activeTenantId?: string; // We strictly lock this to 'neda' for NEDA Administrator 2
  onImpersonate?: (user: User) => void;
  onNavigateToCommandCenter?: () => void;
}

const NEDA_DIRECTORATES = [
  "Office of the Chief Executive Officer",
  "Investment Promotion & Marketing",
  "Agri-processing & Infrastructure",
  "SMME Development & Funding",
  "Finance and Administration",
  "Governance & Risk Management"
];

export function UserManagement2({ currentUser, onImpersonate, onNavigateToCommandCenter }: UserManagement2Props) {
  // Always lock UserManagement2 to NEDA tenant space to completely separate its data
  const activeTenantId = 'neda';
  const [activeTab, setActiveTab] = useState<'list' | 'manual' | 'azure' | 'sessions' | 'perf'>('list');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [azureConfig, setAzureConfig] = useState({
    clientId: '',
    directoryTenantId: '',
    secretValue: ''
  });
  const [azureStatus, setAzureStatus] = useState<{ type: 'success'|'error', msg: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [selectedDirectorate, setSelectedDirectorate] = useState<string>('all');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [sessionFetchTime, setSessionFetchTime] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Form State for NEDA User creation
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    idNumber: '',
    birthday: '',
    gender: '',
    cellPhone: '',
    residentialAddress: '',
    jobFunction: '',
    reportTo: '',
    directorate: NEDA_DIRECTORATES[0],
    manager: '',
    department: 'NEDA Headquarters',
    systemRole: 'Standard User',
    selectedTenant: 'neda',
    level: '1'
  });

  const [editingUser, setEditingUser] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant/neda/users?t=${Date.now()}`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error("Error loading NEDA users:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAzureConfig = async () => {
    try {
      const res = await fetch(`/api/tenant/neda/azure-config`);
      if (res.ok) {
        setAzureConfig(await res.json());
      } else {
        setAzureConfig({ clientId: '', directoryTenantId: '', secretValue: '' });
      }
    } catch (e) {
      console.error("Error loading NEDA Azure AD Sync config:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'azure') {
      fetchAzureConfig();
    }
  }, [activeTab]);

  const fetchActiveSessions = async () => {
    try {
      const res = await fetch(`/api/tenant/neda/active-sessions`);
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.sessions || []).sort((a: any, b: any) => 
          new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
        );
        setActiveSessions(sorted);
        setSessionFetchTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Error loading active sessions for NEDA:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchActiveSessions();
      const interval = setInterval(fetchActiveSessions, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
    let birthday = formData.birthday;
    let gender = formData.gender;
    
    if (val.length >= 6) {
      const yy = parseInt(val.substring(0, 2), 10);
      const mm = val.substring(2, 4);
      const dd = val.substring(4, 6);
      const year = yy > (new Date().getFullYear() % 100) ? 1900 + yy : 2000 + yy;
      birthday = `${year}-${mm}-${dd}`;
    }

    if (val.length >= 7) {
      const genderDigit = parseInt(val.substring(6, 7), 10);
      gender = genderDigit >= 5 ? 'Male' : 'Female';
    }

    setFormData(prev => ({
      ...prev,
      idNumber: val,
      birthday,
      gender
    }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant/neda/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccessMsg("NEDA Member onboarded successfully!");
        setFormData({
          fullName: '',
          email: '',
          idNumber: '',
          birthday: '',
          gender: '',
          cellPhone: '',
          residentialAddress: '',
          jobFunction: '',
          reportTo: '',
          directorate: NEDA_DIRECTORATES[0],
          manager: '',
          department: 'NEDA Headquarters',
          systemRole: 'Standard User',
          selectedTenant: 'neda',
          level: '1'
        });
        fetchUsers();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert("Failed to onboard NEDA member. Ensure unique email.");
      }
    } catch (err) {
      console.error("Failed manual onboarding:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/tenant/neda/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });

      if (res.ok) {
        setSuccessMsg("NEDA Member updated successfully!");
        setEditingUser(null);
        fetchUsers();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert("Failed to update NEDA user profile.");
      }
    } catch (err) {
      console.error("Edit profile error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this staff profile from NEDA? This action is permanent.")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users?id=${userId}&tenantId=neda`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg("NEDA profile removed successfully.");
        fetchUsers();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert("Failed to remove staff profile.");
      }
    } catch (err) {
      console.error("Deletion error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAzureConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setAzureStatus(null);
    try {
      const res = await fetch(`/api/tenant/neda/azure-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(azureConfig)
      });
      if (res.ok) {
        setAzureStatus({ type: 'success', msg: 'Microsoft Entra ID configurations stored successfully for NEDA!' });
      } else {
        setAzureStatus({ type: 'error', msg: 'Failed to update Entra ID configurations.' });
      }
    } catch (e) {
      console.error(e);
      setAzureStatus({ type: 'error', msg: 'Error connecting to database server.' });
    }
  };

  const handleTriggerAzureSync = async () => {
    setAzureStatus(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant/neda/azure-sync`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAzureStatus({ type: 'success', msg: `Sync Complete! Fetched and registered ${data.count || 0} active NEDA users from Entra ID.` });
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        setAzureStatus({ type: 'error', msg: errData.error || 'Sync handshake failed. Please verify credentials.' });
      }
    } catch (e) {
      console.error(e);
      setAzureStatus({ type: 'error', msg: 'Network handshake error.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering
  const filteredUsers = users.filter(u => {
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      (u.fullName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.jobFunction || '').toLowerCase().includes(term) ||
      (u.department || '').toLowerCase().includes(term);

    const matchDirectorate = 
      selectedDirectorate === 'all' || 
      (u.directorate || '').toLowerCase() === selectedDirectorate.toLowerCase();

    return matchSearch && matchDirectorate;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div id="neda-usermanagement-root" className="flex flex-col h-full bg-slate-50 overflow-hidden text-slate-800">
      
      {/* Ribbon Banner for Strict Separation */}
      <div className="bg-emerald-600 text-white px-8 py-2.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider z-10 shadow-sm shrink-0 select-none">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-white animate-pulse" />
          <span>Administrator 2 (NEDA Isolation Space) — Data completely separate from Nkangala</span>
        </div>
      </div>

      {/* Sub-Header Ribbon */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Administrator 2 Workspace</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">NEDA Subsidiary Users, Directory Sync & Performance Matrix</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Users className="w-3.5 h-3.5" /> NEDA Staff Roster
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Onboard Member
          </button>
          <button 
            onClick={() => setActiveTab('azure')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'azure' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Key className="w-3.5 h-3.5" /> Entra ID Config
          </button>
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'sessions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Monitor className="w-3.5 h-3.5" /> Active Terminals
          </button>
          <button 
            onClick={() => setActiveTab('perf')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'perf' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Activity className="w-3.5 h-3.5" /> Node Diagnostics
          </button>
        </div>
      </div>

      {/* Workspace Inner Frame */}
      <div className="flex-1 overflow-y-auto p-8 max-w-[1600px] w-full mx-auto">
        
        {/* Toast / Success Msg */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-xs animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Staff Roster */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            
            {/* Filter controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search staff by name, email, or job function..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Directorate:</span>
                <select 
                  value={selectedDirectorate}
                  onChange={(e) => {
                    setSelectedDirectorate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="all">Show All Directorates</option>
                  {NEDA_DIRECTORATES.map(dir => (
                    <option key={dir} value={dir}>{dir}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={fetchUsers}
                  disabled={isLoading}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 transition cursor-pointer"
                  title="Refresh staff list"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Roster Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100 select-none">
                      <th className="p-4 pl-6">Profile Details</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Staff Role</th>
                      <th className="p-4">Directorate / Office</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-4">Connecting with Supabase security registry...</p>
                        </td>
                      </tr>
                    ) : currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest select-none">
                          No NEDA staff records match your criteria.
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((u: any) => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center uppercase shadow-xs">
                                {(u.fullName || u.full_name || 'U').charAt(0)}
                              </div>
                              <div>
                                <div className="text-xs font-black text-slate-950 leading-tight">{u.fullName || u.full_name || 'Anonymous User'}</div>
                                <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">{u.jobFunction || u.job_function || 'Municipal Representative'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{u.email}</span>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                              u.role === 'Global Administrator' || u.role === 'admin'
                                ? "bg-red-50 text-red-700 border-red-200"
                                : u.role === 'Standard User'
                                  ? "bg-slate-50 text-slate-600 border-slate-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            )}>
                              {u.role || 'Standard User'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-xs font-black text-slate-800">{u.directorate || 'General Administration'}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider leading-none">Level {u.level || '1'} • {u.department || 'NEDA HQ'}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition"
                                title="Edit staff profile"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {onImpersonate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Set portal mode of target user to neda so they impersonate cleanly within NEDA
                                    onImpersonate({
                                      ...u,
                                      portalMode: 'neda'
                                    });
                                  }}
                                  className="px-2 py-1 text-[9px] bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 text-indigo-700 rounded-lg font-black uppercase tracking-wider transition cursor-pointer"
                                  title="Bypass and view as this NEDA staff member"
                                >
                                  Impersonate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition"
                                title="Delete staff profile"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider select-none">
                    Showing {(currentPage-1)*itemsPerPage + 1} - {Math.min(currentPage*itemsPerPage, filteredUsers.length)} of {filteredUsers.length} staff
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="px-2.5 py-1 text-xs border rounded-lg hover:bg-white text-slate-600 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-bold rounded-lg border",
                          currentPage === i + 1 ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-white text-slate-600 border-slate-200"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="px-2.5 py-1 text-xs border rounded-lg hover:bg-white text-slate-600 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Onboard Member Form */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-4xl mx-auto space-y-6">
            <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Onboard Autonomous NEDA Representative</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Establish a secure staff identifier within NEDA’s private database. This record is completely isolated from Nkangala District Municipality.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Full Names</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Nomvula Sibanyoni"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Official Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. nomvula.s@neda.co.za"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">National ID Number</label>
                <input 
                  type="text"
                  required
                  placeholder="13-Digit Numeric"
                  value={formData.idNumber}
                  onChange={handleIdChange}
                  className="w-full px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Calculated Birthday</label>
                <input 
                  type="text"
                  readOnly
                  placeholder="Auto-calculated from ID"
                  value={formData.birthday}
                  className="w-full px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-500 select-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Calculated Gender</label>
                <input 
                  type="text"
                  readOnly
                  placeholder="Auto-calculated from ID"
                  value={formData.gender}
                  className="w-full px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-500 select-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Designated Job Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Senior Investment Analyst"
                  value={formData.jobFunction}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobFunction: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">System Role Profile</label>
                <select 
                  value={formData.systemRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemRole: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option>Standard User</option>
                  <option>Section 56 Director</option>
                  <option>Line Manager</option>
                  <option>HOD (Head of Department)</option>
                  <option>PMS Official</option>
                  <option>Internal Auditor</option>
                  <option>NEDA Executive Manager</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Executive Directorate</label>
                <select 
                  value={formData.directorate}
                  onChange={(e) => setFormData(prev => ({ ...prev, directorate: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  {NEDA_DIRECTORATES.map(dir => (
                    <option key={dir} value={dir}>{dir}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Direct Line Manager</label>
                <input 
                  type="text"
                  placeholder="Name of Manager"
                  value={formData.manager}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Staff Ranking Level</label>
                <select 
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="1">Level 1 (Executive HOD / Sec 56)</option>
                  <option value="2">Level 2 (Director / Line Manager)</option>
                  <option value="3">Level 3 (Standard Staff / Officer)</option>
                  <option value="4">Level 4 (Audit and Specialists)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                By completing this onboarding process, this user profile is strictly registered inside NEDA's database enclosure (`tenantId: 'neda'`). No database cross-contamination will happen with Nkangala District Municipality.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Register NEDA Member</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Azure Entra ID Config */}
        {activeTab === 'azure' && (
          <form onSubmit={handleSaveAzureConfig} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-4xl mx-auto space-y-6">
            <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">NEDA Microsoft Entra ID Directory Sync</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Establish a dedicated Microsoft Entra ID (formerly Azure AD) API synchronization link. These tenant parameters are stored inside the secure NEDA sandbox configuration matrix.
                </p>
              </div>
            </div>

            {azureStatus && (
              <div className={cn(
                "p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-1",
                azureStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              )}>
                {azureStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{azureStatus.msg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Directory Tenant ID</label>
                <input 
                  type="text"
                  placeholder="e.g. a8b4c2d6-11aa-bb22-cc33-dd44ee55ff66"
                  value={azureConfig.directoryTenantId}
                  onChange={(e) => setAzureConfig(prev => ({ ...prev, directoryTenantId: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Enterprise Application Client ID</label>
                <input 
                  type="text"
                  placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                  value={azureConfig.clientId}
                  onChange={(e) => setAzureConfig(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">App Registration Secret Value</label>
                <input 
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={azureConfig.secretValue}
                  onChange={(e) => setAzureConfig(prev => ({ ...prev, secretValue: e.target.value }))}
                  className="w-full px-4 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-500">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Microsoft Entra ID integrations allow NEDA administrators to pull entire staff rosters with exact corporate hierarchies instantly. Clicking sync will run an automated, zero-leak API sync that routes NEDA directory members strictly into the `neda` tenant.
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTriggerAzureSync}
                disabled={isLoading || !azureConfig.clientId}
                className="px-4.5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-40"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Trigger Entra ID Active Sync</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer transition"
                >
                  Save Sync Configuration
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 4: Active Terminals */}
        {activeTab === 'sessions' && (
          <div className="bg-slate-950 rounded-3xl p-6 shadow-2xl border border-slate-800 font-mono space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-emerald-500 animate-pulse" />
                <div>
                  <span className="text-white text-xs font-black uppercase tracking-wider block">NEDA Secure Login Terminals & Active Audit Trails</span>
                  <span className="text-[10px] text-slate-400">Telemetry updated at: {sessionFetchTime || 'Connecting...'}</span>
                </div>
              </div>
              <button
                onClick={fetchActiveSessions}
                className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg text-slate-400 border border-slate-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {activeSessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 select-none uppercase tracking-widest text-[10px]">
                  No active NEDA terminal connections detected.
                </div>
              ) : (
                activeSessions.map((s, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-850/80 p-3.5 rounded-xl flex items-center justify-between gap-4 text-[11px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-white font-black">{s.fullName || s.full_name || 'Autonomous Official'}</span>
                        <span className="text-slate-400 font-bold">({s.email})</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-1">
                        <span>Role: <strong className="text-emerald-400 font-bold">{s.role || 'NEDA Official'}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span>IP Location: <span className="font-bold text-indigo-400">{s.ipAddress || '196.25.255.1'}</span></span>
                        <span className="text-slate-600">•</span>
                        <span>Referral Kickoff: <span className="font-mono text-slate-500 text-[10px]">{s.loginKickoffRef || 'NEDA-AUTH-2'}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-300 font-bold">Last Action: {new Date(s.lastActiveAt).toLocaleTimeString()}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{s.os || 'Ubuntu / Linux Platform'} • {s.browser || 'Chromium Headless'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Node Performance Matrix */}
        {activeTab === 'perf' && (
          <div className="rounded-3xl overflow-hidden shadow-xs border border-slate-200">
            <PerformanceMonitor currentUser={currentUser} activeTenantId="neda" />
          </div>
        )}

      </div>

      {/* Edit User Profile Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <form onSubmit={handleSaveEditUser} className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 flex flex-col gap-4 relative">
            <button 
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 p-2 rounded-full font-bold text-xs"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Modify NEDA Member Profile</h3>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Editing: {editingUser.fullName || editingUser.full_name || editingUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Full Names</label>
                <input 
                  type="text"
                  required
                  value={editingUser.fullName || editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value, full_name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Job Function Title</label>
                <input 
                  type="text"
                  required
                  value={editingUser.jobFunction || editingUser.job_function || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, jobFunction: e.target.value, job_function: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">System Authorization Role</label>
                <select 
                  value={editingUser.role || 'Standard User'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-bold"
                >
                  <option>Standard User</option>
                  <option>Section 56 Director</option>
                  <option>Line Manager</option>
                  <option>HOD (Head of Department)</option>
                  <option>PMS Official</option>
                  <option>Internal Auditor</option>
                  <option>NEDA Executive Manager</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Executive Directorate</label>
                <select 
                  value={editingUser.directorate || NEDA_DIRECTORATES[0]}
                  onChange={(e) => setEditingUser({ ...editingUser, directorate: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  {NEDA_DIRECTORATES.map(dir => (
                    <option key={dir} value={dir}>{dir}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Ranking Staff Level</label>
                <select 
                  value={editingUser.level || '1'}
                  onChange={(e) => setEditingUser({ ...editingUser, level: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="1">Level 1 (Executive HOD / Sec 56)</option>
                  <option value="2">Level 2 (Director / Line Manager)</option>
                  <option value="3">Level 3 (Standard Staff / Officer)</option>
                  <option value="4">Level 4 (Audit and Specialists)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Direct Line Manager</label>
                <input 
                  type="text"
                  value={editingUser.manager || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, manager: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
