import React from 'react';
import { ArrowLeft, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from './Button';
import { Card, CardHeader } from './Card';
import { LoadingSpinner } from './LoadingSpinner';
import moment from 'moment';

interface DetailPageProps {
  title: string;
  data: Record<string, any> | null;
  isLoading: boolean;
  error: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack: () => void;
  children?: React.ReactNode;
}

const HIDDEN_FIELDS = ['_id', '__v', 'created_by', 'image'];
const shouldHide = (key: string) => HIDDEN_FIELDS.includes(key);

const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">Not available</span>;
  }

  // Currency fields
  if (typeof value === 'number' && /total|amount|price|subtotal|discount|limit|rate/i.test(key)) {
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
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mb-4">
      <button
        type="button"
        className="flex items-center gap-2 text-slate-900 font-bold text-lg hover:underline focus:outline-none mb-2"
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
              <th key={key} className="text-left px-4 py-2 text-slate-900 font-semibold uppercase tracking-wide">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {arr.map((row, idx) => (
            <tr key={idx} className="even:bg-blue-50">
              {keys.map((key: string) => (
                <td key={key} className="px-4 py-2 text-slate-500 whitespace-nowrap">
                  {formatValue(key, row[key])}
                </td>
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
    <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-sm">
      <table className="w-full table-auto">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td className="py-2 pr-4 font-medium text-slate-900 whitespace-nowrap capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </td>
              <td className="py-2 text-slate-500">{formatValue(key, value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const DetailPage: React.FC<DetailPageProps> = ({
  title,
  data,
  isLoading,
  error,
  onEdit,
  onDelete,
  onBack,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Not Found</h2>
              <p className="text-gray-500 mb-4">The requested item could not be found.</p>
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const entries = Object.entries(data).filter(([key]) => !shouldHide(key));
  const simpleFields = entries.filter(
    ([key, value]) =>
      (typeof value !== 'object' || value === null || value instanceof Date) &&
      !(key.toLowerCase() === 'image' &&
        typeof value === 'string' &&
        /^(http|https):\/\/.*\.(jpg|jpeg|png|gif|bmp?)$/i.test(value))
  );
  const complexFields = entries.filter(
    ([_, value]) => typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
  );
  const arrayFields = entries.filter(([_, value]) => Array.isArray(value));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button onClick={onEdit} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button onClick={onDelete} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Simple fields grid */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </CardHeader>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {simpleFields.map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    </span>
                    <div className="text-gray-900">{formatValue(key, value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Complex fields (objects) */}
          {complexFields.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Additional Details</h2>
              </CardHeader>
              <div className="p-6">
                <div className="space-y-4">
                  {complexFields.map(([key, value]) => (
                    <CollapsibleSection key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}>
                      {renderObjectTable(value)}
                    </CollapsibleSection>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Array fields */}
          {arrayFields.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Related Items</h2>
              </CardHeader>
              <div className="p-6">
                <div className="space-y-4">
                  {arrayFields.map(([key, value]) => (
                    <CollapsibleSection key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}>
                      {renderArrayTable(value)}
                    </CollapsibleSection>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Custom children content */}
          {children && (
            <Card>
              <div className="p-6">{children}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 