import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Check, AlertTriangle } from 'lucide-react';

export interface SDBIPPaginationProps {
  currentPage: number;
  pageSize: number | 'all';
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number | 'all') => void;
  pageSizeOptions?: (number | 'all')[];
  itemName?: string;
  isSaving?: boolean;
}

export const SDBIPPagination: React.FC<SDBIPPaginationProps> = React.memo(({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200, 'all'],
  itemName = 'records',
  isSaving = false
}) => {
  const isAll = pageSize === 'all';
  const numericSize = isAll ? totalItems : pageSize;
  const totalPages = isAll || totalItems === 0 ? 1 : Math.ceil(totalItems / numericSize);
  
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * numericSize + 1;
  const endItem = isAll ? totalItems : Math.min(safeCurrentPage * numericSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [];
    pages.push(1);

    if (safeCurrentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs select-none shadow-xs">
      {/* Left side: Item count info & Save status */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-slate-600 font-medium">
          Showing <strong className="text-slate-900 font-bold">{startItem}</strong> to{' '}
          <strong className="text-slate-900 font-bold">{endItem}</strong> of{' '}
          <strong className="text-slate-900 font-black">{totalItems.toLocaleString()}</strong> {itemName}
        </div>

        {isSaving !== undefined && (
          <div>
            {isSaving ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                Saving...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                Auto-saved
              </span>
            )}
          </div>
        )}

        {isAll && totalItems > 100 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Showing all rows may slow browser response
          </span>
        )}
      </div>

      {/* Right side: Page size selector and page navigation */}
      <div className="flex items-center gap-4 flex-wrap justify-end">
        {/* Page size buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold text-[11px]">Per page:</span>
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {pageSizeOptions.map((opt) => {
              const active = pageSize === opt;
              return (
                <button
                  key={String(opt)}
                  type="button"
                  onClick={() => {
                    onPageSizeChange(opt as (number | 'all'));
                    onPageChange(1);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                    active 
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-black' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt === 'all' ? 'All' : opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation buttons */}
        {!isAll && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => onPageChange(1)}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => onPageChange(safeCurrentPage - 1)}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold text-xs">
                      ...
                    </span>
                  );
                }
                const isActive = p === safeCurrentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p as number)}
                    className={`min-w-[28px] h-7 px-1.5 rounded-md text-[11px] font-bold cursor-pointer transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => onPageChange(safeCurrentPage + 1)}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
