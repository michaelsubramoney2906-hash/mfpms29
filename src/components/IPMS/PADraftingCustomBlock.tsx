import React, { useState } from 'react';
import { 
  Plus, Trash2, Edit3, Table, ChevronDown, ChevronUp, Columns, 
  Check, X, AlignLeft, Layers, PlusCircle, AlertCircle
} from 'lucide-react';

export interface CustomTableBlock {
  enabled: boolean;
  title: string;
  headers: string[];
  rows: string[][];
}

export interface SectionExtraBlock {
  textAboveTable: string;
  table: CustomTableBlock;
  textBelowTable: string;
}

export interface DualSectionExtras {
  above: SectionExtraBlock;
  below: SectionExtraBlock;
}

export const createDefaultExtraBlock = (): SectionExtraBlock => ({
  textAboveTable: '',
  table: {
    enabled: false,
    title: '',
    headers: ['Item / Indicator', 'Operational Standard / Target', 'Responsible / Remarks'],
    rows: [['', '', '']]
  },
  textBelowTable: ''
});

export const createDefaultDualExtras = (): DualSectionExtras => ({
  above: createDefaultExtraBlock(),
  below: createDefaultExtraBlock()
});

export const normalizeSectionExtras = (saved: any, sectionKey: string): DualSectionExtras => {
  const defaults = createDefaultDualExtras();
  if (!saved || !saved[sectionKey]) return defaults;
  const current = saved[sectionKey];

  if (current.above || current.below) {
    return {
      above: {
        textAboveTable: current.above?.textAboveTable || '',
        table: {
          enabled: !!current.above?.table?.enabled,
          title: current.above?.table?.title || '',
          headers: Array.isArray(current.above?.table?.headers) && current.above?.table?.headers?.length > 0 
            ? current.above.table.headers 
            : ['Item / Indicator', 'Operational Standard / Target', 'Responsible / Remarks'],
          rows: Array.isArray(current.above?.table?.rows) && current.above?.table?.rows?.length > 0 
            ? current.above.table.rows 
            : [['', '', '']]
        },
        textBelowTable: current.above?.textBelowTable || ''
      },
      below: {
        textAboveTable: current.below?.textAboveTable || '',
        table: {
          enabled: !!current.below?.table?.enabled,
          title: current.below?.table?.title || '',
          headers: Array.isArray(current.below?.table?.headers) && current.below?.table?.headers?.length > 0 
            ? current.below.table.headers 
            : ['Item / Indicator', 'Operational Standard / Target', 'Responsible / Remarks'],
          rows: Array.isArray(current.below?.table?.rows) && current.below?.table?.rows?.length > 0 
            ? current.below.table.rows 
            : [['', '', '']]
        },
        textBelowTable: current.below?.textBelowTable || ''
      }
    };
  }

  // Legacy single block fallback
  if (current.table || current.text) {
    return {
      above: defaults.above,
      below: {
        textAboveTable: current.text || '',
        table: {
          enabled: !!current.table?.enabled,
          title: current.table?.title || '',
          headers: Array.isArray(current.table?.headers) && current.table.headers.length > 0 
            ? current.table.headers 
            : ['Item / Indicator', 'Operational Standard / Target', 'Responsible / Remarks'],
          rows: Array.isArray(current.table?.rows) && current.table.rows.length > 0 
            ? current.table.rows 
            : [['', '', '']]
        },
        textBelowTable: ''
      }
    };
  }

  return defaults;
};

interface SectionCustomBlockEditorProps {
  label: string; // e.g. "Above 1. Purpose" or "Below 1. Purpose"
  position: 'above' | 'below';
  extra: SectionExtraBlock;
  onChange: (updated: SectionExtraBlock) => void;
}

export function SectionCustomBlockEditor({ label, position, extra, onChange }: SectionCustomBlockEditorProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [editingHeaderIdx, setEditingHeaderIdx] = useState<number | null>(null);

  const hasData = !!(
    extra.textAboveTable?.trim() || 
    extra.textBelowTable?.trim() || 
    (extra.table?.enabled && extra.table.rows.some(r => r.some(c => c.trim())))
  );

  // Toggle table enable
  const handleToggleTable = () => {
    const isEnabled = !extra.table.enabled;
    onChange({
      ...extra,
      table: {
        ...extra.table,
        enabled: isEnabled,
        headers: extra.table.headers.length > 0 ? extra.table.headers : ['Item / Indicator', 'Target / Spec', 'Responsible / Notes'],
        rows: extra.table.rows.length > 0 ? extra.table.rows : [['', '', '']]
      }
    });
  };

  // Add column
  const handleAddColumn = () => {
    const colNum = extra.table.headers.length + 1;
    const newHeaders = [...extra.table.headers, `Column ${colNum}`];
    const newRows = extra.table.rows.map(r => [...r, '']);
    onChange({
      ...extra,
      table: {
        ...extra.table,
        headers: newHeaders,
        rows: newRows
      }
    });
  };

  // Delete column
  const handleDeleteColumn = (colIdx: number) => {
    if (extra.table.headers.length <= 1) return;
    const newHeaders = extra.table.headers.filter((_, idx) => idx !== colIdx);
    const newRows = extra.table.rows.map(r => r.filter((_, idx) => idx !== colIdx));
    onChange({
      ...extra,
      table: {
        ...extra.table,
        headers: newHeaders,
        rows: newRows
      }
    });
  };

  // Update column header
  const handleUpdateHeader = (colIdx: number, val: string) => {
    const newHeaders = [...extra.table.headers];
    newHeaders[colIdx] = val;
    onChange({
      ...extra,
      table: {
        ...extra.table,
        headers: newHeaders
      }
    });
  };

  // Add row
  const handleAddRow = () => {
    const emptyRow = new Array(extra.table.headers.length).fill('');
    onChange({
      ...extra,
      table: {
        ...extra.table,
        rows: [...extra.table.rows, emptyRow]
      }
    });
  };

  // Delete row
  const handleDeleteRow = (rowIdx: number) => {
    if (extra.table.rows.length <= 1) {
      // Reset single row to empty
      const emptyRow = new Array(extra.table.headers.length).fill('');
      onChange({
        ...extra,
        table: {
          ...extra.table,
          rows: [emptyRow]
        }
      });
      return;
    }
    const newRows = extra.table.rows.filter((_, idx) => idx !== rowIdx);
    onChange({
      ...extra,
      table: {
        ...extra.table,
        rows: newRows
      }
    });
  };

  // Update cell
  const handleUpdateCell = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = [...extra.table.rows];
    const newRow = [...(newRows[rowIdx] || [])];
    newRow[colIdx] = val;
    newRows[rowIdx] = newRow;
    onChange({
      ...extra,
      table: {
        ...extra.table,
        rows: newRows
      }
    });
  };

  return (
    <div className={`my-2 rounded-lg border transition-all ${
      hasData 
        ? 'border-emerald-300/80 bg-emerald-50/30' 
        : 'border-dashed border-slate-200 bg-slate-50/40 hover:border-slate-300'
    }`}>
      {/* Header bar / Toggle Button */}
      <div className="flex justify-between items-center px-3 py-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
        >
          <Table className={`w-3.5 h-3.5 ${hasData ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>{label}</span>
          {hasData && (
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9.5px] font-bold rounded-full">
              Active {extra.table?.enabled ? '• Table Included' : '• Notes Included'}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {hasData && (
            <button
              type="button"
              onClick={() => {
                onChange(createDefaultExtraBlock());
                setIsExpanded(false);
              }}
              className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
              title="Clear custom table and notes"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="p-3 pt-1 border-t border-slate-200/80 space-y-3 bg-white rounded-b-lg">
          {/* Optional Text Above Table */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1 mb-1">
              <AlignLeft className="w-3 h-3 text-slate-400" />
              Additional Text (Above Table)
            </label>
            <textarea
              value={extra.textAboveTable}
              onChange={e => onChange({ ...extra, textAboveTable: e.target.value })}
              rows={2}
              placeholder="Enter optional narrative, clause notes or introductory text..."
              className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Table Controller */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleTable}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    extra.table?.enabled
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  {extra.table?.enabled ? 'Custom Table Active' : '+ Add Custom Table'}
                </button>
                {extra.table?.enabled && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {extra.table.rows.length} rows × {extra.table.headers.length} cols
                  </span>
                )}
              </div>

              {extra.table?.enabled && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Columns className="w-3 h-3 text-emerald-600" /> + Add Column
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" /> + Add Row
                  </button>
                </div>
              )}
            </div>

            {extra.table?.enabled && (
              <div className="space-y-2">
                {/* Table Title */}
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">
                    Table Title / Caption (Optional)
                  </label>
                  <input
                    type="text"
                    value={extra.table.title || ''}
                    onChange={e => onChange({
                      ...extra,
                      table: { ...extra.table, title: e.target.value }
                    })}
                    placeholder="e.g. Operational Standards & Response Matrix"
                    className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Table Structure */}
                <div className="overflow-x-auto border border-slate-300 rounded bg-white max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-300">
                      <tr>
                        <th className="p-1.5 w-8 text-center text-[10px] font-bold text-slate-400 border-r border-slate-200">#</th>
                        {extra.table.headers.map((h, colIdx) => (
                          <th key={colIdx} className="p-1.5 border-r border-slate-200 last:border-r-0 min-w-[130px]">
                            <div className="flex items-center justify-between gap-1">
                              <input
                                type="text"
                                value={h}
                                onChange={e => handleUpdateHeader(colIdx, e.target.value)}
                                className="w-full text-[10.5px] font-bold uppercase p-0.5 border-b border-transparent focus:border-emerald-500 bg-transparent outline-none"
                              />
                              {extra.table.headers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteColumn(colIdx)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                                  title="Delete column"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="p-1.5 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {extra.table.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50/80">
                          <td className="p-1.5 text-center text-[10px] font-bold text-slate-400 border-r border-slate-200">
                            {rowIdx + 1}
                          </td>
                          {extra.table.headers.map((_, colIdx) => (
                            <td key={colIdx} className="p-1 border-r border-slate-200 last:border-r-0">
                              <input
                                type="text"
                                value={row[colIdx] || ''}
                                onChange={e => handleUpdateCell(rowIdx, colIdx, e.target.value)}
                                placeholder="Enter value..."
                                className="w-full text-xs p-1 border border-slate-200 rounded focus:border-emerald-500 outline-none bg-white"
                              />
                            </td>
                          ))}
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(rowIdx)}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded"
                              title="Delete row"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Optional Text Below Table */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1 mb-1">
              <AlignLeft className="w-3 h-3 text-slate-400" />
              Additional Text (Below Table)
            </label>
            <textarea
              value={extra.textBelowTable}
              onChange={e => onChange({ ...extra, textBelowTable: e.target.value })}
              rows={2}
              placeholder="Enter optional concluding notes, remarks or annexure notes..."
              className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-slate-50/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SectionCustomBlockViewer({ extra }: { extra?: SectionExtraBlock }) {
  if (!extra) return null;
  const hasTextAbove = !!extra.textAboveTable?.trim();
  const hasTable = !!(extra.table?.enabled && extra.table.headers.length > 0 && extra.table.rows.length > 0);
  const hasTextBelow = !!extra.textBelowTable?.trim();

  if (!hasTextAbove && !hasTable && !hasTextBelow) return null;

  return (
    <div className="my-3 space-y-2 select-text">
      {hasTextAbove && (
        <div className="whitespace-pre-wrap text-slate-800 text-[11px] leading-relaxed font-sans bg-slate-50/60 p-2.5 rounded border border-slate-200">
          {extra.textAboveTable}
        </div>
      )}

      {hasTable && (
        <div className="my-2 overflow-x-auto">
          {extra.table.title?.trim() && (
            <h5 className="text-[10.5px] font-extrabold text-emerald-950 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {extra.table.title}
            </h5>
          )}
          <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
            <thead className="bg-emerald-50/80 text-emerald-950 uppercase font-black text-[9.5px]">
              <tr>
                {extra.table.headers.map((h, hi) => (
                  <th key={hi} className="border border-slate-300 p-2">
                    {h || `Column ${hi + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {extra.table.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`border border-slate-300 p-2 text-slate-800 ${ci === 0 ? 'font-semibold text-center' : ''}`}>
                      {cell || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasTextBelow && (
        <div className="whitespace-pre-wrap text-slate-800 text-[11px] leading-relaxed font-sans bg-slate-50/60 p-2.5 rounded border border-slate-200">
          {extra.textBelowTable}
        </div>
      )}
    </div>
  );
}

// Dedicated 4.2 KPA Table Editor with full Column and Row customization
interface KPATableEditorProps {
  headers: string[];
  rows: string[][];
  onChangeHeaders: (newHeaders: string[]) => void;
  onChangeRows: (newRows: string[][]) => void;
}

export function KPATableEditor({ headers, rows, onChangeHeaders, onChangeRows }: KPATableEditorProps) {
  // Calculate total weighting if any column is a weight column
  const weightColIdx = headers.findIndex(h => /weight|percentage|%/i.test(h));
  let totalWeight = 0;
  if (weightColIdx !== -1) {
    totalWeight = rows.reduce((sum, row) => {
      const val = parseFloat((row[weightColIdx] || '').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }

  // Add column
  const handleAddColumn = () => {
    const nextColNum = headers.length + 1;
    const newHeaders = [...headers, `Column ${nextColNum}`];
    const newRows = rows.map(r => [...r, '']);
    onChangeHeaders(newHeaders);
    onChangeRows(newRows);
  };

  // Delete column
  const handleDeleteColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== colIdx);
    const newRows = rows.map(r => r.filter((_, i) => i !== colIdx));
    onChangeHeaders(newHeaders);
    onChangeRows(newRows);
  };

  // Update header
  const handleUpdateHeader = (colIdx: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[colIdx] = val;
    onChangeHeaders(newHeaders);
  };

  // Add row
  const handleAddRow = () => {
    const nextNo = String(rows.length + 1);
    const emptyRow = new Array(headers.length).fill('');
    emptyRow[0] = nextNo;
    onChangeRows([...rows, emptyRow]);
  };

  // Delete row
  const handleDeleteRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, i) => i !== rowIdx);
    // Auto-reindex first column if it is numeric
    const reindexed = newRows.map((r, i) => {
      const updated = [...r];
      if (/^\d+$/.test(updated[0] || '')) {
        updated[0] = String(i + 1);
      }
      return updated;
    });
    onChangeRows(reindexed);
  };

  // Update cell
  const handleUpdateCell = (rowIdx: number, colIdx: number, val: string) => {
    const newRows = [...rows];
    const row = [...(newRows[rowIdx] || [])];
    row[colIdx] = val;
    newRows[rowIdx] = row;
    onChangeRows(newRows);
  };

  return (
    <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30 space-y-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <label className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" />
            4.2 Key Performance Areas (KPA) Matrix Table
          </label>
          <p className="text-[11px] text-slate-500">
            Expandable & editable KPA matrix. Add or remove rows and columns freely.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {weightColIdx !== -1 && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
              totalWeight === 100 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              Total Weight: {totalWeight}% {totalWeight === 100 ? '✓' : '(Target: 100%)'}
            </span>
          )}
          <button
            type="button"
            onClick={handleAddColumn}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Columns className="w-3.5 h-3.5 text-emerald-700" /> + Add Column
          </button>
          <button
            type="button"
            onClick={handleAddRow}
            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> + Add KPA Row
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-300 rounded-lg bg-white max-h-72 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-emerald-100/70 text-emerald-950 sticky top-0 z-10 border-b border-slate-300">
            <tr>
              <th className="p-2 w-10 text-center text-[10px] font-bold text-slate-500 border-r border-slate-200">#</th>
              {headers.map((h, colIdx) => (
                <th key={colIdx} className="p-2 border-r border-slate-200 last:border-r-0 min-w-[140px]">
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={h}
                      onChange={e => handleUpdateHeader(colIdx, e.target.value)}
                      className="w-full text-[11px] font-bold uppercase p-0.5 border-b border-transparent focus:border-emerald-600 bg-transparent outline-none text-emerald-950"
                    />
                    {headers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(colIdx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                        title="Delete column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-2 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50">
                <td className="p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 bg-slate-50/50">
                  {rowIdx + 1}
                </td>
                {headers.map((_, colIdx) => (
                  <td key={colIdx} className="p-1.5 border-r border-slate-200 last:border-r-0">
                    <input
                      type="text"
                      value={row[colIdx] || ''}
                      onChange={e => handleUpdateCell(rowIdx, colIdx, e.target.value)}
                      placeholder="Enter details..."
                      className={`w-full text-xs p-1.5 border border-slate-200 rounded focus:border-emerald-500 outline-none bg-white ${
                        colIdx === 0 ? 'text-center font-bold' : ''
                      }`}
                    />
                  </td>
                ))}
                <td className="p-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(rowIdx)}
                    disabled={rows.length <= 1}
                    className={`p-1 rounded ${rows.length <= 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 cursor-pointer'}`}
                    title="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function KPATableViewer({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!headers || headers.length === 0 || !rows || rows.length === 0) return null;

  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
        <thead className="bg-emerald-50 text-emerald-950 font-bold uppercase text-[9.5px]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-slate-300 p-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
              {r.map((c, ci) => (
                <td key={ci} className={`border border-slate-300 p-2 text-slate-800 ${ci === 0 ? 'text-center font-bold' : ''}`}>
                  {c || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
