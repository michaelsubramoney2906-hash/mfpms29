import React, { useState } from 'react';
import { Maximize2, X, Check, Copy } from 'lucide-react';

export interface ExpandModalState {
  isOpen: boolean;
  title?: string;
  value?: string;
  refNum?: string;
  readOnly?: boolean;
  onSave?: (val: string) => void;
}

interface ExpandableCellProps {
  value: string;
  readOnly?: boolean;
  cellTitle?: string;
  refNum?: string;
  isFitAll?: boolean;
  onChange?: (val: string) => void;
  className?: string;
  [key: string]: any;
}

export const ExpandableCell: React.FC<ExpandableCellProps> = React.memo(({
  value,
  readOnly = false,
  cellTitle = '',
  refNum = '',
  isFitAll = false,
  onChange,
  className = ''
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className={`relative group/cell min-w-[80px] ${className}`}>
      <div className={`text-xs ${isFitAll ? 'whitespace-normal' : 'line-clamp-2'} text-slate-800 break-words`}>
        {value || <span className="text-slate-300 italic">None</span>}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDraft(value);
          setModalOpen(true);
        }}
        className="absolute right-0 top-0 opacity-0 group-hover/cell:opacity-100 p-1 bg-white/90 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded shadow-sm border border-slate-200 transition"
        title="Expand inspector"
      >
        <Maximize2 className="w-3 h-3" />
      </button>

      {modalOpen && (
        <CellExpandModal
          modalState={{
            isOpen: true,
            title: cellTitle,
            value: draft,
            refNum,
            readOnly,
            onSave: (newVal) => {
              if (onChange) onChange(newVal);
              setModalOpen(false);
            }
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
});

export const CellExpandModal: React.FC<{
  modalState: ExpandModalState;
  onClose: () => void;
}> = ({ modalState, onClose }) => {
  const [val, setVal] = useState(modalState.value || '');
  const [copied, setCopied] = useState(false);

  if (!modalState.isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">{modalState.title || 'Cell Inspector'}</h3>
              {modalState.refNum && (
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  {modalState.refNum}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Detailed cell value & audit inspector</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs flex items-center gap-1 transition"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {modalState.readOnly ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
              {val || <span className="text-slate-400 italic">No content recorded.</span>}
            </div>
          ) : (
            <textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              rows={10}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed font-sans focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Edit cell value..."
            />
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
          >
            {modalState.readOnly ? 'Close' : 'Cancel'}
          </button>
          {!modalState.readOnly && modalState.onSave && (
            <button
              onClick={() => {
                if (modalState.onSave) modalState.onSave(val);
                onClose();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
