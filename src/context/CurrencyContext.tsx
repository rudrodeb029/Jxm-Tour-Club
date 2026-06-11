import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Currency = 'USD' | 'BDT';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CONVERSION_RATE = 1; // Raw values are now in BDT directly

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>('BDT');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('app_currency') as Currency;
    if (savedCurrency === 'USD' || savedCurrency === 'BDT') {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('app_currency', newCurrency);
  };

  const formatCurrency = (amount: number | string): string => {
    let numericAmount = 0;
    
    // Parse the amount, stripping out any existing currency symbols or commas
    if (typeof amount === 'string') {
      const cleanedString = amount.replace(/[^0-9.-]+/g, '');
      numericAmount = parseFloat(cleanedString);
    } else if (typeof amount === 'number') {
      numericAmount = amount;
    }

    if (isNaN(numericAmount)) numericAmount = 0;

    if (currency === 'BDT') {
      const converted = numericAmount * CONVERSION_RATE;
      return `৳${converted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    } else {
      return `$${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
