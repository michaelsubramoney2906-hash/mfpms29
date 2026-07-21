import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, Shield, Users, Sparkles, Building, UserCheck } from 'lucide-react';

export interface AzureContact {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  avatarColor: string;
}

export const AZURE_AD_CONTACTS: AzureContact[] = [
  { id: 'ad-1', name: 'Sipho Dlamini', email: 'sipho.dlamini@mzansiflow.gov.za', title: 'Director of Finance', department: 'Budget & Treasury Office', avatarColor: 'bg-emerald-600' },
  { id: 'ad-2', name: 'Zama Khumalo', email: 'zama.khumalo@mzansiflow.gov.za', title: 'Performance Audit Specialist', department: 'Performance Management Unit', avatarColor: 'bg-blue-600' },
  { id: 'ad-3', name: 'Mike Thompson', email: 'mike@massivedynamixdistributors.com', title: 'Senior OPMS Submitter', department: 'Corporate Services', avatarColor: 'bg-indigo-600' },
  { id: 'ad-4', name: 'Lerato Mokwena', email: 'lerato.mokwena@mzansiflow.gov.za', title: 'Executive Director: Development', department: 'Local Economic Development', avatarColor: 'bg-violet-600' },
  { id: 'ad-5', name: 'Thabo Mokoena', email: 'thabo.mokoena@mzansiflow.gov.za', title: 'Municipal Manager', department: 'Office of the MM', avatarColor: 'bg-amber-600' },
  { id: 'ad-6', name: 'Nomvula Sithole', email: 'nomvula.sithole@mzansiflow.gov.za', title: 'Infrastructure Lead', department: 'Basic Services', avatarColor: 'bg-rose-600' },
  { id: 'ad-7', name: 'Fatima Patel', email: 'fatima.patel@mzansiflow.gov.za', title: 'Internal Auditor', department: 'Internal Audit', avatarColor: 'bg-teal-600' },
  { id: 'ad-8', name: 'Brandon Naidoo', email: 'brandon.naidoo@mzansiflow.gov.za', title: 'Strategic Planning Specialist', department: 'IDP and Strategy', avatarColor: 'bg-sky-600' }
];

interface AzureADPickerProps {
  value: string;
  onChange: (newValue: string) => void;
  roleType: 'submitter' | 'reviewer' | 'approver';
  placeholder?: string;
  size?: 'sm' | 'md';
  activeTenantId: string;
}

export function AzureADPicker({ value, onChange, roleType, placeholder, size = 'sm', activeTenantId }: AzureADPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<AzureContact[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeTenantId) return;

    setLoading(true);
    fetch(`/api/tenant/${activeTenantId}/users`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then((usersList: any[]) => {
        const colors = [
          'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 
          'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-sky-600'
        ];
        
        const mapped: AzureContact[] = (usersList || []).map((u, idx) => {
          const name = u.fullName || u.email.split('@')[0];
          let sum = 0;
          for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
          const color = colors[sum % colors.length];

          return {
            id: u.id || `user-${idx}`,
            name: name,
            email: u.email,
            title: u.jobFunction || u.role || 'Municipal Official',
            department: u.department || 'Administration',
            avatarColor: color
          };
        });
        setContacts(mapped);
      })
      .catch(err => {
        console.error('Error loading real user directory:', err);
        setContacts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeTenantId]);

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleTheme = () => {
    switch (roleType) {
      case 'submitter':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          accent: 'indigo',
          accentBg: 'bg-indigo-600',
          label: 'Authorized Submitter'
        };
      case 'reviewer':
        return {
          bg: 'bg-violet-50 border-violet-200 text-violet-700',
          accent: 'violet',
          accentBg: 'bg-violet-600',
          label: 'PMU Reviewer'
        };
      case 'approver':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          accent: 'emerald',
          accentBg: 'bg-emerald-600',
          label: 'Executive Approver'
        };
    }
  };

  const theme = getRoleTheme();

  return (
    <div className="relative inline-block w-full" ref={popoverRef}>
      {/* Target Trigger Button with Azure Microsoft Identity Styling */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between cursor-pointer border rounded-lg px-2.5 py-1.5 transition-all text-left bg-white shadow-sm hover:border-sky-400 select-none ${
          value ? 'border-slate-200 text-slate-800' : 'border-dashed border-slate-300 text-slate-400 hover:bg-slate-50'
        } ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}
      >
        <div className="flex items-center gap-2 truncate">
          {/* Azure AD Icon (Styled after Azure AD with blue/cloud accents) */}
          <div className="w-4 h-4 rounded-md bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0" title="Azure Active Directory identity verified">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>

          <span className="truncate font-medium">
            {value || placeholder || `Select ${roleType}...`}
          </span>
        </div>

        {/* Mini Role Indicator Badge */}
        {value && (
          <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ml-2 shrink-0 ${theme.bg}`}>
            {roleType.substring(0, 4)}
          </span>
        )}
      </div>

      {/* Azure AD Dropdown Sheet */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100 flex flex-col font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Users className="w-3 h-3" />
              </div>
              <div>
                <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-widest block">Azure AD Directory</span>
                <span className="text-[9px] text-slate-400 block mt-px">Type or select verified identity</span>
              </div>
            </div>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[8px] font-bold px-1.5 py-0.5 rounded">
              Active Directory
            </span>
          </div>

          {/* Search bar */}
          <div className="p-2 border-b border-slate-800 bg-slate-950">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder={`Search Azure contacts...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Directory list */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-850 bg-slate-950/40">
            {loading ? (
              <div className="p-6 text-center text-slate-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-500 border-t-transparent mx-auto mb-2"></div>
                <p className="text-[11px]">Loading user directory...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400 font-medium">No AD records found</p>
                <button
                  onClick={() => {
                    onChange(searchQuery);
                    setIsOpen(false);
                  }}
                  className="mt-2 text-[10px] font-black text-sky-400 uppercase bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-2 py-1 rounded cursor-pointer"
                >
                  Appoint Custom "{searchQuery}"
                </button>
              </div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = value === contact.name || value === contact.email;
                return (
                  <div
                    key={contact.id}
                    onClick={() => {
                      onChange(contact.name);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-800/80 ${
                      isSelected ? 'bg-slate-850' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full ${contact.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>

                      {/* Info */}
                      <div className="truncate">
                        <p className="text-[11.5px] font-bold text-slate-100 truncate flex items-center gap-1">
                          {contact.name}
                          {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </p>
                        <p className="text-[9.5px] text-slate-400 truncate">{contact.title}</p>
                        <p className="text-[8.5px] text-slate-500 truncate">{contact.email}</p>
                      </div>
                    </div>

                    <span className="text-[8.5px] font-semibold text-slate-500 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded shrink-0">
                      {contact.department.split(' ')[0]}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Clear option */}
          {value && (
            <div 
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="p-2 text-center text-[10px] font-bold text-rose-400 bg-rose-950/20 border-t border-slate-800 hover:bg-rose-950/40 cursor-pointer transition-all"
            >
              Clear Appointment
            </div>
          )}
        </div>
      )}
    </div>
  );
}
