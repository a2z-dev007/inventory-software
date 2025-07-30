export const API_BASE_URL = 'http://localhost:8080/api';
import { moment } from 'moment';

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

// export function formatDate(dateString, formatPattern = 'MMMM Do YYYY, h:mm:ss A') {
//   return moment(dateString).format(formatPattern);
// }

export const getBase64 = (imgPath:string) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    fetch(imgPath)
      .then(res => res.blob())
      .then(blob => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
  });


  export function formatINRCurrency(amount, { withSymbol = true, fraction = true } = {}) {
    return new Intl.NumberFormat("en-IN", {
      style: withSymbol ? "currency" : "decimal",
      currency: "INR",
      minimumFractionDigits: fraction ? 2 : 0,
      maximumFractionDigits: fraction ? 2 : 0,
    }).format(amount);
  }