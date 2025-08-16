import moment from "moment";

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

  export const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  type FormatType =
    | 'relative'
    | 'calendar'
    | 'fromNow'
    | 'fullDate'
    | 'custom'
    | 'dateTime';
  
  /**
   * Formats a date string into a readable format
   * @param dateString - ISO string (e.g., '2025-08-27T05:30:00+05:30')
   * @param formatType - The type of formatting to apply
   * @param customFormat - Custom Moment format string, required if formatType is 'custom'
   * @returns formatted date string
   */
  export function formatRelativeDate(
    dateString: string,
    formatType: FormatType = "calendar",
    customFormat?: string
  ): string {
    const date = moment(dateString);
    const today = moment().startOf('day');
    const inputDay = date.clone().startOf('day');
    const diffDays = inputDay.diff(today, 'days');
  
    switch (formatType) {
      case 'relative':
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'tomorrow';
        if (diffDays > 1) return `${diffDays} days`;
        return `${Math.abs(diffDays)} days ago`;
  
      case 'calendar':
        return inputDay.calendar(undefined, {
          sameDay: '[Today]',
          nextDay: '[Tomorrow]',
          nextWeek: 'dddd',
          lastDay: '[Yesterday]',
          lastWeek: '[Last] dddd',
          sameElse: 'MMMM D, YYYY',
        });
  
      case 'fromNow':
        return date.fromNow(); // e.g., "in 23 days"
  
      case 'fullDate':
        return date.format('MMMM D, YYYY'); // e.g., "August 27, 2025"
  
      case 'dateTime':
        return date.format('MMMM D, YYYY [at] h:mm A'); // e.g., "August 27, 2025 at 5:30 AM"
  
      case 'custom':
        return date.format(customFormat || 'YYYY-MM-DD');
  
      default:
        return date.format(); // fallback ISO
    }
  }
  

export  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  export  function extractCancelledItemsFromPurchases(purchases:any,condition:boolean) {
    return purchases.map(purchase => ({
      ...purchase,
      items: purchase.items?.filter(item => item.isCancelled === condition) || [],
    })).filter(purchase => purchase.items.length > 0);
  }

   export  function extractReturnItemsFromPurchases(purchases:any,condition:boolean) {
    return purchases.map(purchase => ({
      ...purchase,
      items: purchase.items?.filter(item => item.isReturn === condition) || [],
    })).filter(purchase => purchase.items.length > 0);
  }