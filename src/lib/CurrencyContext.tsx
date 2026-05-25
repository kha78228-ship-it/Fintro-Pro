import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

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

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const unsubSnap = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.currency) {
              if (data.currency !== localStorage.getItem('__fintro_currency')) {
                setCurrencyState(data.currency);
                localStorage.setItem('__fintro_currency', data.currency);
              }
            } else {
              // Firebase has no currency set yet, sync current local currency to Firestore
              const localCurrency = localStorage.getItem('__fintro_currency') || 'VND';
              updateDoc(docRef, { currency: localCurrency }).catch(err => {
                console.warn("Error setting initial currency in Firestore:", err);
              });
            }
          }
        }, (err) => {
          console.warn("Currency onSnapshot subscription warning:", err);
        });
        return () => unsubSnap();
      }
    });
    return () => unsubAuth();
  }, []);

  const setCurrency = async (c: string) => {
    setCurrencyState(c);
    localStorage.setItem('__fintro_currency', c);
    
    // Sync to Firestore if user is logged in
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { currency: c });
      } catch (err) {
        console.error("Error syncing currency to Firestore:", err);
      }
    }
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
