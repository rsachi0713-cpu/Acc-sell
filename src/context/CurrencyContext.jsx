import React, { createContext, useState, useContext, useEffect } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('LKR');
  const [exchangeRate, setExchangeRate] = useState(300); // Default: 1 USD = 300 LKR

  useEffect(() => {
    // Optional: Fetch real-time rate
    const fetchRate = async () => {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        if (data.rates && data.rates.LKR) {
          setExchangeRate(data.rates.LKR);
        }
      } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
      }
    };
    fetchRate();
  }, []);

  const formatPrice = (priceInLKR) => {
    if (currency === 'USD') {
      const priceInUSD = priceInLKR / exchangeRate;
      return `$${priceInUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rs. ${Number(priceInLKR).toLocaleString()}`;
  };

  const convertPrice = (priceInLKR) => {
    if (currency === 'USD') {
      return (Number(priceInLKR) / exchangeRate).toFixed(2);
    }
    return Number(priceInLKR);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
