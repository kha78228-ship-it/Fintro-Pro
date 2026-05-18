import React, { createContext, useContext, useState, useEffect } from 'react';

export const CURRENCIES = [
  { code: 'VND', symbol: 'đ', name: 'Việt Nam Đồng', locale: 'vi-VN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
];

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  formatMoney: (amount: number, maxFractionDigits?: number) => string;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('__fintro_currency') || 'VND');
  const currencySymbol = CURRENCIES.find(x => x.code === currency)?.symbol || 'đ';

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem('__fintro_currency', c);
  };

  const formatMoney = (amount: number, maxFractionDigits?: number) => {
    const c = CURRENCIES.find(x => x.code === currency) || CURRENCIES[0];
    const isZeroDecimal = c.code === 'VND' || c.code === 'JPY' || c.code === 'KRW';
    
    if (c.code === 'VND') {
       return amount.toLocaleString(c.locale, { maximumFractionDigits: maxFractionDigits ?? (isZeroDecimal ? 0 : 2) }) + c.symbol;
    }
    
    return new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.code,
      minimumFractionDigits: isZeroDecimal ? 0 : (maxFractionDigits ?? 2),
      maximumFractionDigits: maxFractionDigits ?? (isZeroDecimal ? 0 : 2)
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatMoney, currencySymbol }}>
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
