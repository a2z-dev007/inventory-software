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
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0';
  }
  return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};


export const unitTypes =  [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'litre', label: 'Litre' },
  { value: 'gallon', label: 'Gallon' },
  { value: 'meter', label: 'Meter' },
  { value: 'feet', label: 'Feet' },
  { value: 'inch', label: 'Inch' },
  { value: 'roll', label: 'Roll' },
  { value: 'box', label: 'Box' },
  { value: 'can', label: 'Can' },
  { value: 'bag', label: 'Bag' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'set', label: 'Set' },
  { value: 'unit', label: 'Unit' },
  { value: 'pair', label: 'Pair' },
  { value: 'machine_hour', label: 'Machine Hour' },
  {
    value: 'nos',
    label: 'Nos'
  },


]