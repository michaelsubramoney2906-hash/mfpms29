import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Check, Users, Lock } from 'lucide-react';

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
  isFitAll?: boolean;
  disabled?: boolean;
}

export const FIXED_REVIEWERS = [
  'Nompumelelo P. Nsibande',
  'Sibusiso M. Shabanga',
  'Noluthando Zulu',
  'Mduduzi Lukele'
];

export const FIXED_INTERNAL_AUDITORS = [
  'Amos D. Twala',
  'Peggy L. Seerane',
  'Katlego Masemola',
  'Sthembile C. Mpanza',
  'Jayvanti Morar',
  'Nokubonga Chilli'
];

const COLORS = [
  'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 
  'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-sky-600'
];

const AUDITOR_EMAIL_MAP: Record<string, string> = {
  'Amos D. Twala': 'twalaad@nkangaladm.gov.za',
  'Peggy L. Seerane': 'seeranepl@nkangaladm.gov.za',
  'Katlego Masemola': 'masemolak@nkangaladm.gov.za',
  'Sthembile C. Mpanza': 'mpanzacs@nkangaladm.gov.za',
  'Jayvanti Morar': 'morarj@nkangaladm.gov.za',
  'Nokubonga Chilli': 'chillint@nkangaladm.gov.za'
};

const reviewerContacts: AzureContact[] = FIXED_REVIEWERS.map((name, idx) => ({
  id: name,
  name: name,
  email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nkangaladm.gov.za`,
  title: 'PMU Reviewer',
  department: 'PMU Review Panel',
  avatarColor: COLORS[idx % COLORS.length]
}));

const auditorContacts: AzureContact[] = FIXED_INTERNAL_AUDITORS.map((name, idx) => ({
  id: name,
  name: name,
  email: AUDITOR_EMAIL_MAP[name] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nkangaladm.gov.za`,
  title: 'Internal Auditor',
  department: 'Internal Audit Unit',
  avatarColor: COLORS[idx % COLORS.length]
}));

// Shared module-level cache to prevent thousands of simultaneous duplicate API calls
const usersCache: Record<string, AzureContact[]> = {};
const pendingRequests: Record<string, Promise<AzureContact[]> | null> = {};

async function fetchTenantUsers(tenantId: string): Promise<AzureContact[]> {
  if (usersCache[tenantId]) return usersCache[tenantId];
  if (pendingRequests[tenantId]) return pendingRequests[tenantId]!;

  const req = (async () => {
    try {
      const res = await fetch(`/api/tenant/${tenantId}/users`);
      const usersList = res.ok ? await res.json() : [];
      const mapped: AzureContact[] = (usersList || []).map((u: any, idx: number) => {
        const name = u.fullName || u.email.split('@')[0];
        let sum = 0;
        for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
        return {
          id: u.id || `user-${idx}`,
          name: name,
          email: u.email,
          title: u.jobFunction || u.role || 'Municipal Official',
          department: u.department || 'Administration',
          avatarColor: COLORS[sum % COLORS.length]
        };
      });
      usersCache[tenantId] = mapped;
      return mapped;
    } catch (e) {
      console.error("Failed to load tenant users:", e);
      return [];
    } finally {
      pendingRequests[tenantId] = null;
    }
  })();

  pendingRequests[tenantId] = req;
  return req;
}

export const AzureADPicker = React.memo(function AzureADPicker({ 
  value, 
  onChange, 
  roleType, 
  placeholder, 
  activeTenantId, 
  size = 'md',
  isFitAll = false,
  disabled = false
}: AzureADPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<AzureContact[]>(() => {
    if (roleType === 'reviewer') return reviewerContacts;
    if (roleType === 'internal_audit') return auditorContacts;
    return usersCache[activeTenantId] || [];
  });
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Attach click-outside listener ONLY when popover is open
  useEffect(() => {
    if (!isOpen || disabled) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, disabled]);

  // Load user data on open or when tenant/role changes
  useEffect(() => {
    if (roleType === 'reviewer') {
      setAllUsers(reviewerContacts);
      return;
    }
    if (roleType === 'internal_audit') {
      setAllUsers(auditorContacts);
      return;
    }

    if (usersCache[activeTenantId]) {
      setAllUsers(usersCache[activeTenantId]);
      return;
    }

    let isMounted = true;
    if (isOpen || !allUsers.length) {
      setLoading(!usersCache[activeTenantId]);
      fetchTenantUsers(activeTenantId).then(users => {
        if (isMounted) {
          setAllUsers(users);
          setLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [activeTenantId, roleType, isOpen]);

  const filteredUsers = useMemo(() => {
    if (!isOpen || disabled) return [];
    if (!searchQuery.trim()) return allUsers;
    const q = searchQuery.toLowerCase();
    return allUsers.filter(contact => 
      contact.name.toLowerCase().includes(q) ||
      contact.email.toLowerCase().includes(q) ||
      contact.title.toLowerCase().includes(q) ||
      contact.department.toLowerCase().includes(q)
    );
  }, [allUsers, searchQuery, isOpen, disabled]);

  const getRoleTheme = () => {
    switch (roleType) {
      case 'submitter': return { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', label: 'Submitter' };
      case 'reviewer': return { bg: 'bg-violet-50 border-violet-200 text-violet-700', label: 'Reviewer' };
      case 'approver': return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Approver' };
      case 'internal_audit': return { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Auditor' };
    }
  };
  const theme = getRoleTheme();
  
  const resolvedDisplayName = useMemo(() => {
    if (!value) return '';
    const match = allUsers.find(u => u.id === value || u.name === value || u.email === value);
    return match ? match.name : value;
  }, [allUsers, value]);

  return (
    <div className="relative inline-block w-full" ref={popoverRef}>
      {/* Target Trigger Button */}
      <div 
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        title={
          disabled 
            ? `${resolvedDisplayName ? `${resolvedDisplayName} • ` : ''}${theme.label} Locked (Read-Only)`
            : (resolvedDisplayName || placeholder || `Select ${roleType}...`)
        }
        className={`flex items-center justify-between border rounded-lg px-2.5 py-1.5 transition-all text-left select-none ${
          disabled
            ? 'bg-slate-100/90 border-slate-200 text-slate-500 cursor-not-allowed shadow-none'
            : `cursor-pointer bg-white shadow-sm hover:border-sky-400 ${
                value ? 'border-slate-200 text-slate-800' : 'border-dashed border-slate-300 text-slate-400 hover:bg-slate-50'
              }`
        } ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}
      >
        <div className={`flex items-center gap-2 ${isFitAll ? 'min-w-0' : 'truncate'}`}>
          {disabled ? (
            <div className="w-4 h-4 rounded-md bg-slate-200/80 text-amber-600 flex items-center justify-center shrink-0">
              <Lock className="w-2.5 h-2.5" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-md bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
          )}
          <span className={`font-medium font-sans ${isFitAll ? 'break-words whitespace-normal leading-tight' : 'truncate'}`}>
            {resolvedDisplayName || (disabled ? 'Locked' : (placeholder || `Select ${roleType}...`))}
          </span>
        </div>

        {disabled ? (
          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-2 shrink-0 bg-slate-200/80 text-slate-600 border border-slate-300 flex items-center gap-0.5">
            <Lock className="w-2 h-2 text-amber-600" />
            <span>{roleType === 'internal_audit' ? 'AUDIT' : roleType.substring(0, 4)}</span>
          </span>
        ) : value ? (
          <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-2 shrink-0 ${theme.bg}`}>
            {roleType === 'internal_audit' ? 'AUDIT' : roleType.substring(0, 4)}
          </span>
        ) : null}
      </div>

      {/* Azure AD Dropdown Sheet */}
      {isOpen && !disabled && (
        <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100 flex flex-col font-sans">
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Users className="w-3 h-3" />
              </div>
              <div>
                <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-widest block">
                  {roleType === 'reviewer' ? 'Appointed Reviewers' : roleType === 'internal_audit' ? 'Appointed Internal Auditors' : 'Azure AD Directory'}
                </span>
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
                placeholder={`Search ${theme.label.toLowerCase()}s...`}
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
                <p className="text-[11px]">Loading options...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400 font-medium">No matching officials found</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-800/60">
                {filteredUsers.map(contact => {
                  const isSelected = value === contact.name || value === contact.id;
                  return (
                    <div
                      key={contact.id}
                      onClick={() => {
                        onChange(contact.name);
                        setIsOpen(false);
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
                      
                      {isSelected && (
                        <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0 uppercase">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}
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
              Clear Selection
            </div>
          )}
        </div>
      )}
    </div>
  );
});
