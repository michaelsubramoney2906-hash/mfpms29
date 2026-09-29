import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, Loader2 } from 'lucide-react';

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
  disabled?: boolean;
}

export const TeamAzureSearchInput: React.FC<TeamAzureSearchInputProps> = ({
  value,
  onChange,
  onSelectUser,
  placeholder = "Search name or directory...",
  className = "",
  compact = false,
  disabled = false
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

  const handleSearch = async (text: string) => {
    setQuery(text);
    onChange(text);
    if (!text || text.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(text)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
        setIsOpen(true);
      }
    } catch (e) {
      console.warn("User search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (u: AzureUser) => {
    setQuery(u.fullName || u.email);
    onChange(u.fullName || u.email);
    if (onSelectUser) onSelectUser(u);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition ${
            compact ? 'py-1 text-[11px]' : ''
          }`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
          {results.map((u, i) => (
            <button
              key={u.id || i}
              type="button"
              onClick={() => handleSelect(u)}
              className="w-full text-left p-2.5 hover:bg-indigo-50/60 transition flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-slate-900">{u.fullName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
              </div>
              {u.department && (
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  {u.department}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
