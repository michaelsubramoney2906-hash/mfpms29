import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, Users, Trash2, Plus } from 'lucide-react';

interface AzureContact {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  avatarColor: string;
}

interface AzureADPickerProps {
  value: string;
  onChange: (value: string) => void;
  roleType: 'submitter' | 'reviewer' | 'approver' | 'internal_audit';
  placeholder?: string;
  activeTenantId: string;
  size?: 'sm' | 'md';
}

export function AzureADPicker({ value, onChange, roleType, placeholder, activeTenantId, size = 'md' }: AzureADPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<AzureContact[]>([]);
  const [poolNames, setPoolNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const usersPromise = fetch(`/api/tenant/${activeTenantId}/users`).then(res => res.ok ? res.json() : []);
      const poolPromise = (roleType === 'reviewer' || roleType === 'internal_audit') 
        ? fetch(`/api/tenant/${activeTenantId}/sdbip-officials`).then(res => res.ok ? res.json() : {})
        : Promise.resolve({});

      const [usersList, poolData]: [any[], any] = await Promise.all([usersPromise, poolPromise]);

      const colors = [
        'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 
        'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-sky-600'
      ];
      
      const mapped = (usersList || []).map((u: any, idx: number) => {
        const name = u.fullName || u.email.split('@')[0];
        let sum = 0;
        for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
        return {
          id: u.id || `user-${idx}`,
          name: name,
          email: u.email,
          title: u.jobFunction || u.role || 'Municipal Official',
          department: u.department || 'Administration',
          avatarColor: colors[sum % colors.length]
        };
      });

      const allUsersMap = new Map(mapped.map((u: AzureContact) => [u.name, u]));

      if (roleType === 'reviewer' || roleType === 'internal_audit') {
        const pNames = roleType === 'reviewer' ? (poolData.reviewers || []) : (poolData.internalAuditors || []);
        pNames.forEach((name: string, idx: number) => {
          if (!allUsersMap.has(name)) {
            let sum = 0;
            for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
            const dummy = {
              id: `dummy-${idx}-${name}`,
              name: name,
              email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nkangaladm.gov.za`,
              title: roleType === 'reviewer' ? 'Appointed PMU Reviewer' : 'Appointed Internal Auditor',
              department: roleType === 'reviewer' ? 'PMU' : 'Internal Audit',
              avatarColor: colors[sum % colors.length]
            };
            mapped.push(dummy);
            allUsersMap.set(name, dummy);
          }
        });
        setPoolNames(pNames);
      }

      setAllUsers(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId, roleType]);

  const updatePool = async (newPoolNames: string[]) => {
    // Optimistic update for instant UI feedback
    setPoolNames(newPoolNames);

    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip-officials`);
      let currentData = { reviewers: [], internalAuditors: [] };
      if (res.ok) {
        const d = await res.json();
        currentData = { reviewers: d.reviewers || [], internalAuditors: d.internalAuditors || [] };
      }

      if (roleType === 'reviewer') {
        currentData.reviewers = newPoolNames as never[];
      } else {
        currentData.internalAuditors = newPoolNames as never[];
      }

      await fetch(`/api/tenant/${activeTenantId}/sdbip-officials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const isPoolManaged = roleType === 'reviewer' || roleType === 'internal_audit';
  const poolMax = roleType === 'reviewer' ? 20 : 20;

  const handleAddToPool = (e: React.MouseEvent | { stopPropagation: () => void }, name: string) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (poolNames.length >= poolMax) {
      // Maximum reached, silently ignore
      return;
    }
    if (!poolNames.includes(name)) {
      updatePool([...poolNames, name]);
    }
  };

  const handleRemoveFromPool = (e: React.MouseEvent | { stopPropagation: () => void }, name: string) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    updatePool(poolNames.filter(n => n !== name));
    if (value === name) {
      onChange('');
    }
  };

  const filteredUsers = allUsers.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const poolContacts = isPoolManaged ? filteredUsers.filter(u => poolNames.includes(u.name)) : [];
  const otherContacts = isPoolManaged ? filteredUsers.filter(u => !poolNames.includes(u.name)) : filteredUsers;

  const getRoleTheme = () => {
    switch (roleType) {
      case 'submitter': return { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', label: 'Submitter' };
      case 'reviewer': return { bg: 'bg-violet-50 border-violet-200 text-violet-700', label: 'Reviewer' };
      case 'approver': return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Approver' };
      case 'internal_audit': return { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Auditor' };
    }
  };
  const theme = getRoleTheme();

  return (
    <div className="relative inline-block w-full" ref={popoverRef}>
      {/* Target Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between cursor-pointer border rounded-lg px-2.5 py-1.5 transition-all text-left bg-white shadow-sm hover:border-sky-400 select-none ${
          value ? 'border-slate-200 text-slate-800' : 'border-dashed border-slate-300 text-slate-400 hover:bg-slate-50'
        } ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-4 h-4 rounded-md bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <span className="truncate font-medium">
            {value || placeholder || `Select ${roleType}...`}
          </span>
        </div>

        {value && (
          <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-2 shrink-0 ${theme.bg}`}>
            {roleType === 'internal_audit' ? 'AUDIT' : roleType.substring(0, 4)}
          </span>
        )}
      </div>

      {/* Azure AD Dropdown Sheet */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100 flex flex-col font-sans">
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Users className="w-3 h-3" />
              </div>
              <div>
                <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-widest block">Azure AD Directory</span>
                <span className="text-[9px] text-slate-400 block mt-px">Select {theme.label} identity</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-2 border-b border-slate-800 bg-slate-950">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder={`Search entire directory...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Directory list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-850 bg-slate-950/40">
            {loading ? (
              <div className="p-6 text-center text-slate-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-500 border-t-transparent mx-auto mb-2"></div>
                <p className="text-[11px]">Loading directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400 font-medium">No AD records found</p>
                <button
                  onClick={() => {
                    if (isPoolManaged && poolNames.length < poolMax) {
                      updatePool([...poolNames, searchQuery]);
                    }
                    onChange(searchQuery);
                    setIsOpen(false);
                  }}
                  className="mt-2 text-[10px] font-black text-sky-400 uppercase bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-2 py-1 rounded cursor-pointer"
                >
                  Appoint Custom "{searchQuery}"
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Pool Section */}
                {isPoolManaged && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-850 flex items-center justify-between sticky top-0 z-10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">Available Pool</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${poolNames.length >= poolMax ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>
                        {poolNames.length} / {poolMax}
                      </span>
                    </div>
                    {poolContacts.length === 0 ? (
                      <div className="px-3 py-4 text-center border-b border-slate-800">
                        <p className="text-[10px] text-slate-500">Pool is empty. Add users from the directory below.</p>
                      </div>
                    ) : (
                      poolContacts.map(contact => {
                        const isSelected = value === contact.name;
                        return (
                          <div
                            key={contact.id}
                            onClick={() => {
                              onChange(contact.name);
                              setIsOpen(false);
                            }}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-800/80 group border-b border-slate-800/50 ${
                              isSelected ? 'bg-slate-850' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className={`w-7 h-7 rounded-full ${contact.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                                {contact.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="truncate">
                                <p className="text-[11.5px] font-bold text-slate-100 truncate flex items-center gap-1">
                                  {contact.name}
                                  {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                                </p>
                                <p className="text-[9.5px] text-slate-400 truncate">{contact.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleRemoveFromPool(e, contact.name)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-500/20 rounded transition-all cursor-pointer"
                                title="Remove from pool"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Directory Section */}
                <div className="border-t border-slate-800">
                  {isPoolManaged && (
                    <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-850 sticky top-0 z-10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Full Directory</span>
                    </div>
                  )}
                  {otherContacts.slice(0, searchQuery ? 200 : 80).map(contact => {
                    const isSelected = !isPoolManaged && (value === contact.name);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => {
                          if (!isPoolManaged) {
                            onChange(contact.name);
                            setIsOpen(false);
                          } else if (poolNames.length < poolMax) {
                            handleAddToPool({ stopPropagation: () => {} } as any, contact.name);
                          }
                        }}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-800/80 group ${
                          isSelected ? 'bg-slate-850' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`w-7 h-7 rounded-full ${contact.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="truncate">
                            <p className="text-[11.5px] font-bold text-slate-100 truncate flex items-center gap-1">
                              {contact.name}
                              {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                            </p>
                            <p className="text-[9.5px] text-slate-400 truncate">{contact.title}</p>
                          </div>
                        </div>
                        
                        {isPoolManaged ? (
                          <button
                            type="button"
                            onClick={(e) => handleAddToPool(e, contact.name)}
                            disabled={poolNames.length >= poolMax}
                            className="opacity-0 group-hover:opacity-100 p-1 bg-sky-500/20 text-sky-400 hover:bg-sky-500/40 rounded transition-all disabled:opacity-50 cursor-pointer shrink-0 text-[9px] font-bold px-2 uppercase"
                          >
                            Add to Pool
                          </button>
                        ) : (
                          <span className="text-[8.5px] font-semibold text-slate-500 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded shrink-0">
                            {contact.department.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Clear option */}
          {value && (
            <div 
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="p-2 text-center text-[10px] font-bold text-rose-400 bg-rose-950/20 border-t border-slate-800 hover:bg-rose-950/40 cursor-pointer transition-all shrink-0"
            >
              Clear Appointment
            </div>
          )}
        </div>
      )}
    </div>
  );
}
