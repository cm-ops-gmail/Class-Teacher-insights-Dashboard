
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Year = '2025' | '2026';

interface YearContextType {
  selectedYear: Year;
  setSelectedYear: (year: Year) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const YearProvider = ({ children }: { children: ReactNode }) => {
  const [selectedYear, setSelectedYear] = useState<Year>('2025');

  useEffect(() => {
    const storedYear = localStorage.getItem('selectedYear') as Year | null;
    if (storedYear && ['2025', '2026'].includes(storedYear)) {
      setSelectedYear(storedYear);
    }
  }, []);

  const handleSetSelectedYear = (year: Year) => {
    setSelectedYear(year);
    localStorage.setItem('selectedYear', year);
  };

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear: handleSetSelectedYear }}>
      {children}
    </YearContext.Provider>
  );
};

export const useYear = () => {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
};
