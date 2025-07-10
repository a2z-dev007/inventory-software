import React from 'react';
import { Button } from './Button';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Record<string, any> | null;
  title?: string;
}

const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
  if (typeof value === 'number' && /total|amount|price|subtotal|tax|discount/i.test(key)) {
    return <span className="font-semibold">₹{value.toLocaleString()}</span>;
  }
  if (typeof value === 'string' && /date/i.test(key) && !isNaN(Date.parse(value))) {
    return new Date(value).toLocaleString();
  }
  if (typeof value === 'string' && /status/i.test(key)) {
    let color = 'bg-gray-100 text-gray-800';
    if (value === 'pending') color = 'bg-yellow-100 text-yellow-800';
    if (value === 'paid' || value === 'delivered') color = 'bg-green-100 text-green-800';
    if (value === 'overdue' || value === 'cancelled') color = 'bg-red-100 text-red-800';
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>{value}</span>;
  }
  return value;
};

const renderArrayTable = (arr: any[]) => {
  if (!arr.length) return <span className="text-gray-400">-</span>;
  const keys = Array.from(
    arr.reduce((set: Set<string>, obj: any) => {
      Object.keys(obj || {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  return (
    <div className="overflow-x-auto rounded border border-gray-200 my-2">
      <table className="min-w-full text-xs">
        <thead className="bg-gradient-to-r from-blue-100 to-blue-50">
          <tr>
            {keys.map((k) => (
              <th key={k} className="px-3 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {arr.map((row, i) => (
            <tr key={i} className="even:bg-blue-50 hover:bg-blue-100 transition-colors">
              {keys.map((k) => (
                <td key={k} className="px-3 py-2 align-top">{formatValue(k, row[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderObjectTable = (obj: Record<string, any>) => (
  <div className="bg-blue-50 rounded p-3 my-2 border border-blue-100">
    <table className="min-w-full text-xs">
      <tbody>
        {Object.entries(obj).map(([k, v]) => (
          <tr key={k}>
            <td className="pr-3 py-1 font-medium text-blue-700 whitespace-nowrap">{k}</td>
            <td className="py-1 text-gray-900">{formatValue(k, v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, item, title }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 transition-opacity animate-fadeIn">
      <div className="relative bg-gradient-to-br from-white via-blue-50 to-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200 animate-scaleIn">
        {/* Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-t-2xl mb-0.5" />
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white rounded-t-2xl">
          <h2 className="text-2xl font-extrabold text-blue-800 tracking-tight flex items-center gap-2">
            {/* Optionally add an icon here */}
            {title || 'Details'}
          </h2>
          <button
            onClick={onClose}
            className="ml-2 rounded-full p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Content */}
        <div className="p-8 space-y-6 bg-white rounded-b-2xl">
          <table className="min-w-full divide-y divide-blue-100">
            <tbody>
              {Object.entries(item).map(([key, value]) => (
                <tr key={key}>
                  <td className="py-3 pr-8 font-bold text-blue-900 align-top whitespace-nowrap w-1/4 text-base capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </td>
                  <td className="py-3 align-top text-base">
                    {Array.isArray(value) && value.length && typeof value[0] === 'object'
                      ? renderArrayTable(value)
                      : value && typeof value === 'object' && !Array.isArray(value)
                        ? renderObjectTable(value)
                        : formatValue(key, value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.25s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </div>
  );
}; 