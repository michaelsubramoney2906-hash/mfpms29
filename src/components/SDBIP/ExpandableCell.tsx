import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Check, Copy, Edit3, X } from 'lucide-react';

export interface ExpandModalState {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  value: string;
  isReadOnly?: boolean;
  onSave?: (newValue: string) => void;
}

interface ExpandableCellProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  title?: string;
  cellTitle: string;
  refNum?: string;
  isFitAll?: boolean;
  onOpenExpandModal?: (title: string, value: string, onSave?: (v: string) => void, readOnly?: boolean, subtitle?: string) => void;
  textClassName?: string;
}

export const ExpandableCell: React.FC<ExpandableCellProps> = ({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  placeholder = '',
  className = '',
  minRows = 2,
  title,
  cellTitle,
  refNum,
  isFitAll = true,
  onOpenExpandModal,
  textClassName = ''
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // Dynamically calculate rows if fitAll is enabled
  const calculatedRows = (() => {
    if (!isFitAll) return minRows;
    const text = internalValue || '';
    if (!text) return minRows;
    const lines = text.split('\n');
    let totalLines = 0;
    for (const line of lines) {
      totalLines += Math.max(1, Math.ceil(line.length / 28));
    }
    return Math.max(minRows, Math.min(15, totalLines));
  })();

  const handleTriggerModal = () => {
    if (onOpenExpandModal) {
      onOpenExpandModal(
        cellTitle,
        internalValue,
        readOnly || disabled ? undefined : (newVal: string) => {
          setInternalValue(newVal);
          onChange?.(newVal);
        },
        readOnly || disabled,
        refNum ? `KPI Ref: ${refNum}` : undefined
      );
    }
  };

  // If completely read-only display
  if (readOnly) {
    return (
      <div 
        className={`group/cell relative w-full rounded p-1.5 transition-colors ${className}`}
        title={title || "Double-click to expand"}
        onDoubleClick={handleTriggerModal}
      >
        <div className={`w-full whitespace-pre-wrap break-words leading-relaxed text-[11px] ${textClassName || 'text-slate-800 font-medium'}`}>
          {internalValue || <span className="text-slate-300 italic">-</span>}
        </div>

        {/* Expand Trigger Button on Hover */}
        {onOpenExpandModal && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerModal();
            }}
            className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 focus:opacity-100 bg-white/90 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-400 hover:text-indigo-600 p-0.5 rounded shadow-xs transition-all cursor-pointer z-10"
            title="Expand cell into modal view"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="group/cell relative w-full">
      <textarea
        ref={textareaRef}
        rows={calculatedRows}
        disabled={disabled}
        value={internalValue}
        placeholder={disabled ? "Locked" : placeholder}
        title={title}
        onChange={(e) => {
          setInternalValue(e.target.value);
          onChange?.(e.target.value);
        }}
        onDoubleClick={handleTriggerModal}
        className={`w-full p-1.5 rounded text-[11px] leading-relaxed resize-y whitespace-pre-wrap break-words transition-colors outline-none ${
          disabled 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 italic' 
            : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300'
        } ${className}`}
      />

      {/* Expand Button in top-right corner on hover */}
      {onOpenExpandModal && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerModal();
          }}
          className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 focus:opacity-100 bg-white/95 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-400 hover:text-indigo-600 p-0.5 rounded shadow-xs transition-all cursor-pointer z-10"
          title="Open expanded editor for this cell"
        >
          <Maximize2 className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

// Modal for Full Cell Inspector & Editor
export const CellExpandModal: React.FC<{
  modalState: ExpandModalState;
  onClose: () => void;
}> = ({ modalState, onClose }) => {
  const [currentText, setCurrentText] = useState(modalState.value || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentText(modalState.value || '');
    setCopied(false);
  }, [modalState]);

  if (!modalState.isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    modalState.onSave?.(currentText);
    onClose();
  };

  const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const charCount = currentText.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                {modalState.title}
              </h3>
              {modalState.isReadOnly && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-200 text-slate-700 tracking-wider">
                  Read Only
                </span>
              )}
            </div>
            {modalState.subtitle && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">{modalState.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>All words & sentences formatted:</span>
            <span>{wordCount} words • {charCount} characters</span>
          </div>

          {modalState.isReadOnly ? (
            <div className="w-full min-h-[160px] max-h-[50vh] p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap break-words overflow-y-auto select-text">
              {currentText || <span className="text-slate-400 italic">No content recorded.</span>}
            </div>
          ) : (
            <textarea
              autoFocus
              rows={8}
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Enter full sentences or text..."
              className="w-full p-4 border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm leading-relaxed text-slate-800 font-sans resize-y transition outline-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Text"}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              {modalState.isReadOnly ? "Close" : "Cancel"}
            </button>
            {!modalState.isReadOnly && (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save & Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
