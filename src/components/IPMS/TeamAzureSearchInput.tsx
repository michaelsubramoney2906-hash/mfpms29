import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, CheckCircle, Loader2, Sparkles } from 'lucide-react';

export interface AzureUser {
  id?: string;
  fullName: string;
  email: string;
  jobFunction?: string;
  department?: string;
  signatureData?: string;
  signatureType?: string;
  role?: string;
  tenantId?: string;
}

interface TeamAzureSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelectUser?: (user: AzureUser) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export const TeamAzureSearchInput: React.FC<TeamAzureSearchInputProps> = ({
  value,
  onChange,
  onSelectUser,
  placeholder = "Search name or directory...",
  className = "",
  compact = false
}) => {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<AzureUser[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/azure-search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data || []);
        }
      } catch (err) {
        console.error("Azure AD Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query, isOpen]);

  const handleSelect = (user: AzureUser) => {
    setQuery(user.fullName);
    onChange(user.fullName);
    if (onSelectUser) {
      onSelectUser(user);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={`flex items-center gap-1.5 bg-white border border-slate-300 rounded focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition shadow-xs ${className}`}>
        <Search className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400 ml-2 shrink-0`} />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent outline-none text-slate-800 ${compact ? 'text-[11px] py-1 px-1' : 'text-xs py-1.5 px-2'}`}
        />
        {loading && <Loader2 className="w-3 h-3 text-emerald-600 animate-spin mr-2 shrink-0" />}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Azure AD Directory ({results.length})
            </span>
            {loading && <span className="text-[9px] text-emerald-600 font-normal">Searching...</span>}
          </div>

          {results.length === 0 && !loading ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No matching users found in directory
            </div>
          ) : (
            results.map((user, idx) => (
              <button
                key={`${user.email || user.fullName}-${idx}`}
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full text-left p-2 hover:bg-emerald-50/80 transition flex items-start justify-between gap-2 group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900 truncate flex items-center gap-1.5">
                    {user.fullName}
                    {user.signatureData && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded" title="Signature on file">
                        ✍️ Signed
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {user.jobFunction || user.department || 'Municipal Employee'}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {user.email}
                  </div>
                </div>
                <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 mt-1" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
