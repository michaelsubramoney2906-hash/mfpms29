import React from 'react';

export interface CustomTableBlock {
  headers: string[];
  rows: string[][];
}

export interface SectionExtraBlock {
  text?: string;
  table?: CustomTableBlock;
  isEnabled?: boolean;
}

export interface DualSectionExtras {
  above: SectionExtraBlock;
  below: SectionExtraBlock;
}

export function createDefaultExtraBlock(): SectionExtraBlock {
  return {
    text: '',
    table: { headers: ['Column 1', 'Column 2'], rows: [['', '']] },
    isEnabled: false
  };
}

export function createDefaultDualExtras(): DualSectionExtras {
  return {
    above: createDefaultExtraBlock(),
    below: createDefaultExtraBlock()
  };
}

export function normalizeSectionExtras(val: any): DualSectionExtras {
  if (!val || typeof val !== 'object') return createDefaultDualExtras();
  return {
    above: val.above || createDefaultExtraBlock(),
    below: val.below || createDefaultExtraBlock()
  };
}

export function SectionCustomBlockEditor({
  label,
  extra,
  onChange
}: {
  label: string;
  position?: 'above' | 'below';
  extra?: SectionExtraBlock;
  onChange: (val: SectionExtraBlock) => void;
}) {
  const current = extra || createDefaultExtraBlock();

  return (
    <div className="my-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-slate-700">{label}</span>
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 font-medium">
          <input
            type="checkbox"
            checked={!!current.isEnabled}
            onChange={e => onChange({ ...current, isEnabled: e.target.checked })}
            className="rounded text-emerald-600"
          />
          <span>Enable custom block</span>
        </label>
      </div>
      {current.isEnabled && (
        <textarea
          value={current.text || ''}
          onChange={e => onChange({ ...current, text: e.target.value })}
          rows={3}
          placeholder="Enter additional text, notes, or clauses..."
          className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
        />
      )}
    </div>
  );
}

export function SectionCustomBlockViewer({
  extra,
  className = ''
}: {
  extra?: SectionExtraBlock;
  className?: string;
}) {
  if (!extra?.isEnabled || !extra.text) return null;
  return (
    <div className={`my-3 p-3 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap ${className}`}>
      {extra.text}
    </div>
  );
}

export function KPATableEditor({ data, onChange }: { data?: any; onChange: (val: any) => void }) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
      <span className="font-bold text-slate-700">KPA Alignment Table</span>
    </div>
  );
}

export function KPATableViewer({ data, className = '' }: { data?: any; className?: string }) {
  return null;
}
