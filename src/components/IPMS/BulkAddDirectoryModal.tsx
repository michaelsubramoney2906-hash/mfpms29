import React, { useState, useEffect } from 'react';
import { Search, X, Users, CheckSquare, Square, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import type { AzureUser } from './TeamAzureSearchInput';

interface BulkAddDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (members: { name: string; designation: string }[]) => void;
  currentMembers: string[][];
}

export const BulkAddDirectoryModal: React.FC<BulkAddDirectoryModalProps> = ({
  isOpen,
  onClose,
  onAddMembers,
  currentMembers
}) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AzureUser[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/azure-search?q=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data || []);
        }
      } catch (e) {
        console.error("Bulk add search error:", e);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) {
      next.delete(email);
    } else {
      next.add(email);
    }
    setSelectedEmails(next);
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === users.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(users.map(u => u.email).filter(Boolean)));
    }
  };

  const handleConfirm = () => {
    const selectedUsers = users.filter(u => selectedEmails.has(u.email));
    const formatted = selectedUsers.map(u => ({
      name: u.fullName,
      designation: u.jobFunction || u.department || (u.email ? u.email.split('@')[0] : 'Municipal Official')
    }));
    onAddMembers(formatted);
    setSelectedEmails(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Select Team Members from Azure AD Directory</h3>
              <p className="text-[11px] text-slate-400">Search and check members to insert into this team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 flex gap-3 items-center bg-slate-50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, department, or job role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition shrink-0"
          >
            {selectedEmails.size === users.length && users.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Searching Azure Directory...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching employees found in directory.
            </div>
          ) : (
            users.map((u, idx) => {
              const isSelected = selectedEmails.has(u.email);
              const isAlreadyInTeam = currentMembers.some(row => (row[1] || '').toLowerCase().includes(u.fullName.toLowerCase()));
              return (
                <div
                  key={`${u.email}-${idx}`}
                  onClick={() => toggleSelect(u.email)}
                  className={`p-2.5 flex items-center justify-between gap-3 rounded-lg cursor-pointer transition ${
                    isSelected ? 'bg-emerald-50/80 border border-emerald-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button type="button" className="text-emerald-600 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span>{u.fullName}</span>
                        {isAlreadyInTeam && (
                          <span className="text-[9px] font-normal px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Already in roster
                          </span>
                        )}
                        {u.signatureData && (
                          <span className="text-[9px] font-normal px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            ✍️ Signature on file
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {u.jobFunction || u.department || 'Municipal Staff'} • {u.email}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-xs text-slate-600 font-medium">
            Selected: <span className="font-bold text-emerald-700">{selectedEmails.size}</span> employee(s)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedEmails.size === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Add {selectedEmails.size} Member(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
