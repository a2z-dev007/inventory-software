export const API_BASE_URL = 'http://localhost:8080/api';

// Currency configuration
export const CURRENCY_CONFIG = {
  symbol: '₹',
  code: 'INR',
  name: 'Indian Rupee',
  locale: 'en-IN'
};

// Currency formatting utility
export const formatCurrency = (amount: number): string => {
  return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
