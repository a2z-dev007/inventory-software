import React, { useState } from 'react';
import { X } from 'lucide-react';
import moment from 'moment';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Record<string, any> | null;
  title?: string;
}

const HIDDEN_FIELDS = ['_id', '__v', 'created_by','image'];
const shouldHide = (key: string) => HIDDEN_FIELDS.includes(key);

// const formatValue = (key: string, value: any) => {
//   if (value === null || value === undefined) {
//     return <span className="text-gray-400 italic">Not available</span>;
//   }

//   if (typeof value === 'number' && /total|amount|price|subtotal|discount|limit/i.test(key)) {
//     return <span className="font-semibold text-emerald-600">₹{value.toLocaleString()}</span>;
//   }

//   if (
//     typeof value === 'string' &&
//     moment(value, moment.ISO_8601, true).isValid()
//   ) {
//     const formatted = moment(value).format('MMM D, YYYY [at] hh:mm A');
//     return (
//       <span className="inline-flex items-center gap-1 text-muted">
//         {formatted}
//       </span>
//     );
//   }
  
 

//   if (typeof value === 'string' && /status/i.test(key)) {
//     const statusColorMap: Record<string, string> = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       approved: 'bg-emerald-100 text-emerald-800',
//       delivered: 'bg-blue-100 text-blue-800',
//       cancelled: 'bg-red-100 text-red-800',
//       overdue: 'bg-red-100 text-red-800',
//       active: 'bg-green-100 text-green-800',
//       inactive: 'bg-gray-100 text-gray-600',
//     };
//     const color = statusColorMap[value.toLowerCase()] || 'bg-gray-100 text-gray-700';
//     return <span className={`text-xs font-bold px-3 py-1 ${key.toLowerCase()=='is active'&& 'bg-emerald-100 text-emerald-800'} rounded-full shadow-sm ${color}`}>{value}</span>;
//   }

//   if (typeof value === 'boolean') {
//     return value ? <span className="text-emerald-600 font-semibold">Yes</span> : <span className="text-gray-400">No</span>;
//   }

//   return <span className="text-gray-700">{value.toString()}</span>;
// };
const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">Not available</span>;
  }

  // Currency fields
  if (typeof value === 'number' && /total|amount|price|subtotal|discount|limit/i.test(key)) {
    return <span className="font-semibold text-emerald-600">₹{value.toLocaleString()}</span>;
  }

  // ISO Date string fields
  if (typeof value === 'string' && moment(value, moment.ISO_8601, true).isValid()) {
    const formatted = moment(value).format('MMM D, YYYY [at] hh:mm A');
    return (
      <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
        {formatted}
      </span>
    );
  }

  // Status fields
  if (typeof value === 'string' && /status/i.test(key)) {
    const statusColorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-emerald-100 text-emerald-800',
      delivered: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      overdue: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-600',
    };
    const color = statusColorMap[value.toLowerCase()] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`text-xs font-bold px-3 py-[3px] rounded-full shadow-sm ${color}`}>
        {value}
      </span>
    );
  }

  // Boolean fields
  if (typeof value === 'boolean') {
    return value ? (
      <span className="text-emerald-600 font-semibold">Yes</span>
    ) : (
      <span className="text-gray-400">No</span>
    );
  }
  

  // File or image URL (like attachment)
  if (
    typeof value === 'string' &&
    /^(http|https):\/\/.*\.(jpg|jpeg|png|gif|bmp|pdf|docx?|xlsx?)$/i.test(value)
  ) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm px-3 py-[2px] bg-blue-100 text-blue-800 rounded-full font-semibold shadow-sm hover:bg-blue-200 transition"
      >
        View
      </a>
    );
  }

  // Plain string fallback
  return <span className="text-gray-700">{value.toString()}</span>;
};

const CollapsibleSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        type="button"
        className="flex items-center gap-2 text-slate-900 font-bold text-[1rem] hover:underline focus:outline-none mb-1"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? '▼' : '▶'} {label}</span>
      </button>
      {open && <div className="pl-4">{children}</div>}
    </div>
  );
};

const renderArrayTable = (arr: any[]) => {
  if (!arr.length) return <span className="text-gray-400 italic">Empty</span>;
  const keys = Array.from(
    arr.reduce((set: Set<string>, obj: any) => {
      Object.keys(obj || {}).forEach((k) => {
        if (!shouldHide(k)) set.add(k);
      });
      return set;
    }, new Set<string>())
  );
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2 bg-white/70">
      <table className="min-w-full text-sm">
        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
          <tr>
            {keys.map((key: string) => (
              <th key={key} className="text-left px-4 py-2  text-slate-900 font-semibold uppercase tracking-wide">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {arr.map((row, idx) => (
            <tr key={idx} className="even:bg-blue-50">
              {keys.map((key: string) => (
                <td key={key} className="px-4 py-2 text-slate-500 whitespace-nowrap">{formatValue(key, row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderObjectTable = (obj: Record<string, any>) => {
  const entries = Object.entries(obj).filter(([key]) => !shouldHide(key));
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm">
      <table className="w-full table-auto">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td className="py-2 pr-4 font-medium  text-slate-900 whitespace-nowrap capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
              <td className="py-2 text-slate-500">{formatValue(key, value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, item, title }) => {
  if (!isOpen || !item) return null;

  const entries = Object.entries(item).filter(([key]) => !shouldHide(key));
  const simpleFields = entries.filter(
    ([key, value]) =>
      (typeof value !== 'object' || value === null || value instanceof Date) &&
      !(key.toLowerCase() === 'image' &&
        typeof value === 'string' &&
        /^(http|https):\/\/.*\.(jpg|jpeg|png|gif|bmp?)$/i.test(value))
  );
  
  
  // const simpleFields = entries.filter(([_, value]) => typeof value !== 'object' || value === null || value instanceof Date);
  const complexFields = entries.filter(([_, value]) => typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date));
  const arrayFields = entries.filter(([_, value]) => Array.isArray(value));

  return (
    <div style={{ marginTop: 0 }} className="fixed top-0 inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white/80 shadow-2xl rounded-2xl border border-blue-200 animate-scaleIn overflow-hidden" style={{ backdropFilter: 'blur(8px)' }}>
        {/* Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-emerald-400" />
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white/80">
          <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-2">
            {title || 'Details'}
          </h2>
          <button
            onClick={onClose}
            className="ml-2 rounded-full p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-blue-700" />
          </button>
        </div>
        {/* Content */}
        <div className="p-8 space-y-6 bg-white/80 rounded-b-2xl">
          {/* Simple fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {simpleFields.map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-xs text-[0.9rem] text-slate-900 font-bold uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                <span className="text-muted text-[0.9rem]">{formatValue(key, value)}</span>
              </div>
            ))}
          </div>
          {/* Complex fields (objects) */}
          {complexFields.length > 0 && (
            <div className="space-y-4">
              {complexFields.map(([key, value]) => (
                <CollapsibleSection key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}>
                  {renderObjectTable(value)}
                </CollapsibleSection>
              ))}
            </div>
          )}
          {/* Array fields */}
          {arrayFields.length > 0 && (
            <div className="space-y-4">
              {arrayFields.map(([key, value]) => (
                <CollapsibleSection key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}>
                  {renderArrayTable(value)}
                </CollapsibleSection>
              ))}
            </div>
          )}
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
