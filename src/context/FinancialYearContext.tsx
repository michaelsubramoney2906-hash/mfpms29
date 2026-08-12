import React, { createContext, useContext, useState, useEffect } from 'react';

export type FinancialYear = '2026-2027' | '2025-2026';

interface FinancialYearContextType {
  financialYear: FinancialYear;
  setFinancialYear: (year: FinancialYear) => void;
  showYearModal: boolean;
  setShowYearModal: (show: boolean) => void;
  hasSelectedYear: boolean;
  selectYear: (year: FinancialYear) => void;
  getEffectiveYearForModule: (moduleId?: string) => FinancialYear;
  isPriorYear: boolean;
}

const FinancialYearContext = createContext<FinancialYearContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'mzansi_active_financial_year';
const SELECTION_DONE_KEY = 'mzansi_fy_selected_session';

export const FinancialYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [financialYear, setFinancialYearState] = useState<FinancialYear>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return (saved === '2025-2026' || saved === '2026-2027') ? saved : '2026-2027';
  });

  const [hasSelectedYear, setHasSelectedYear] = useState<boolean>(() => {
    return sessionStorage.getItem(SELECTION_DONE_KEY) === 'true';
  });

  const [showYearModal, setShowYearModal] = useState<boolean>(() => {
    return sessionStorage.getItem(SELECTION_DONE_KEY) !== 'true';
  });

  const setFinancialYear = (year: FinancialYear) => {
    setFinancialYearState(year);
    localStorage.setItem(LOCAL_STORAGE_KEY, year);
  };

  const selectYear = (year: FinancialYear) => {
    setFinancialYear(year);
    setHasSelectedYear(true);
    sessionStorage.setItem(SELECTION_DONE_KEY, 'true');
    setShowYearModal(false);
  };

  // Helper to get effective year for a specific module
  // Annual Report ('ar') always evaluates prior year (2025-2026) in the current year
  const getEffectiveYearForModule = (moduleId?: string): FinancialYear => {
    if (moduleId === 'ar' || moduleId === 'annual-report') {
      return '2025-2026';
    }
    return financialYear;
  };

  const isPriorYear = financialYear === '2025-2026';

  return (
    <FinancialYearContext.Provider
      value={{
        financialYear,
        setFinancialYear,
        showYearModal,
        setShowYearModal,
        hasSelectedYear,
        selectYear,
        getEffectiveYearForModule,
        isPriorYear,
      }}
    >
      {children}
    </FinancialYearContext.Provider>
  );
};

export const useFinancialYear = (): FinancialYearContextType => {
  const context = useContext(FinancialYearContext);
  if (!context) {
    throw new Error('useFinancialYear must be used within a FinancialYearProvider');
  }
  return context;
};
