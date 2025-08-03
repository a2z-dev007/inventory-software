"use client";

import type React from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  FileText,
  DollarSign,
  IndianRupee,
} from "lucide-react";
import { Button } from "./Button";
import { Card, CardHeader } from "./Card";
import { LoadingSpinner } from "./LoadingSpinner";
import moment from "moment";

interface DetailPageProps {
  title: string;
  data: Record<string, any> | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  children?: React.ReactNode;
}

const HIDDEN_FIELDS = [
  "_id",
  "__v",
  "image",
  "tax",
  "updatedAt",
  "updated_at",
  "isDeleted",
];
const shouldHide = (key: string) => HIDDEN_FIELDS.includes(key);

const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">Not available</span>;
  }

  // Currency fields
  if (
    typeof value === "number" &&
    /total|amount|price|subtotal|discount|limit|rate/i.test(key)
  ) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
        <IndianRupee className="h-4 w-4" />₹{value.toLocaleString()}
      </span>
    );
  }

  // ISO Date string fields
  if (
    typeof value === "string" &&
    moment(value, moment.ISO_8601, true).isValid()
  ) {
    const formatted = moment(value).format("MMM D, YYYY [at] hh:mm A");
    return (
      <span className="inline-flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
        <Calendar className="h-4 w-4" />
        {formatted}
      </span>
    );
  }

  // Status fields
  if (typeof value === "string" && /status/i.test(key)) {
    const statusConfig: Record<
      string,
      { color: string; bg: string; icon?: string }
    > = {
      pending: {
        color: "text-amber-700",
        bg: "bg-gradient-to-r from-amber-100 to-amber-200",
      },
      approved: {
        color: "text-emerald-700",
        bg: "bg-gradient-to-r from-emerald-100 to-emerald-200",
      },
      delivered: {
        color: "text-blue-700",
        bg: "bg-gradient-to-r from-blue-100 to-blue-200",
      },
      cancelled: {
        color: "text-red-700",
        bg: "bg-gradient-to-r from-red-100 to-red-200",
      },
      overdue: {
        color: "text-red-700",
        bg: "bg-gradient-to-r from-red-100 to-red-200",
      },
      active: {
        color: "text-green-700",
        bg: "bg-gradient-to-r from-green-100 to-green-200",
      },
      inactive: {
        color: "text-gray-600",
        bg: "bg-gradient-to-r from-gray-100 to-gray-200",
      },
      draft: {
        color: "text-gray-600",
        bg: "bg-gradient-to-r from-gray-100 to-gray-200",
      },
    };

    const config = statusConfig[value.toLowerCase()] || {
      color: "text-gray-700",
      bg: "bg-gradient-to-r from-gray-100 to-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-bold shadow-sm ${config.bg} ${config.color} border border-white/50`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-2 ${config.color.replace(
            "text-",
            "bg-"
          )}`}
        ></div>
        {value.toUpperCase()}
      </span>
    );
  }

  // Boolean fields - Fixed to show Yes/No instead of Active/Inactive
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-emerald-700 bg-emerald-100">
        ✓ Active
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-gray-500 bg-gray-100">
        ✗ Inactive
      </span>
    );
  }

  // File or image URL (like attachment)
  if (
    typeof value === "string" &&
    /^(http|https):\/\/.*\.(jpg|jpeg|png|gif|bmp|pdf|docx?|xlsx?)$/i.test(value)
  ) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
      >
        <FileText className="h-4 w-4" />
        View Document
      </a>
    );
  }

  // Plain string fallback
  return <span className="text-gray-800 font-medium">{value.toString()}</span>;
};

// Handle created_by field specially
const formatCreatedBy = (createdBy: any) => {
  if (!createdBy) return <span className="text-gray-400 italic">Unknown</span>;

  if (typeof createdBy === "object") {
    const name = createdBy.name || createdBy.username || "Unknown";
    const role = createdBy.role || "User";
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full font-medium">
        <User className="h-4 w-4" />
        {name} ({role})
      </span>
    );
  }

  return (
    <span className="text-gray-800 font-medium">{createdBy.toString()}</span>
  );
};

const renderArrayTable = (arr: any[], title: string) => {
  if (!arr.length)
    return <span className="text-gray-400 italic">No items found</span>;

  // Filter out productId from the keys
  const keys = Array.from(
    arr.reduce((set: Set<string>, obj: any) => {
      Object.keys(obj || {}).forEach((k) => {
        if (!shouldHide(k) && k !== "productId") set.add(k);
      });
      return set;
    }, new Set<string>())
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          {title} ({arr.length} items)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              {keys.map((key: string) => (
                <th
                  key={key}
                  className="text-left px-6 py-4 text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-blue-100"
                >
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {arr.map((row, idx) => (
              <tr
                key={idx}
                className={`hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25 transition-all duration-150 ${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                {keys.map((key: string) => (
                  <td key={key} className="px-6 py-4 text-sm text-gray-700">
                    {formatValue(key, row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const renderObjectTable = (obj: Record<string, any>, title: string) => {
  const entries = Object.entries(obj).filter(([key]) => !shouldHide(key));

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
      <h4 className="text-lg font-bold text-gray-900 mb-4">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {key.replace(/([A-Z])/g, " $1")}
            </span>
            <div className="text-gray-800">{formatValue(key, value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DetailPage: React.FC<DetailPageProps> = ({
  title,
  data,
  isLoading,
  error,
  onBack,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600 font-medium">
                Loading details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center bg-white rounded-xl shadow-lg p-8 border border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Error Loading Data
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">{error}</p>
              <Button
                onClick={onBack}
                variant="outline"
                className="shadow-md bg-transparent"
              >
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-600 mb-4">
                Not Found
              </h2>
              <p className="text-gray-500 mb-6 max-w-md">
                The requested item could not be found.
              </p>
              <Button
                onClick={onBack}
                variant="outline"
                className="shadow-md bg-transparent"
              >
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

  // Separate created_by field for special handling
  const createdByEntry = entries.find(
    ([key]) => key === "created_by" || key === "createdBy"
  );
  const otherEntries = entries.filter(
    ([key]) => key !== "created_by" && key !== "createdBy"
  );

  const simpleFields = otherEntries.filter(
    ([key, value]) =>
      (typeof value !== "object" || value === null || value instanceof Date) &&
      !(
        key.toLowerCase() === "image" &&
        typeof value === "string" &&
        /^(http|https):\/\/.*\.(jpg|jpeg|png|gif|bmp?)$/i.test(value)
      )
  );

  const complexFields = otherEntries.filter(
    ([_, value]) =>
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date)
  );

  const arrayFields = otherEntries.filter(([_, value]) => Array.isArray(value));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Simple fields grid */}
          {simpleFields.length > 0 && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </h2>
              </CardHeader>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {simpleFields.map(([key, value]) => (
                    <div key={key} className="group">
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                        <span className="block text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">
                          {/* {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} */}
                          {key === "isActive"
                            ? "Active"
                            : key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (s) => s.toUpperCase())}
                        </span>
                        <div className="text-gray-900">
                          {formatValue(key, value)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Created By field positioned after other simple fields */}
                  {createdByEntry && (
                    <div className="group">
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                        <span className="block text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">
                          Created By
                        </span>
                        <div className="text-gray-900">
                          {formatCreatedBy(createdByEntry[1])}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Complex fields (objects) */}
          {complexFields.length > 0 && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Additional Details
                </h2>
              </CardHeader>
              <div className="p-8">
                <div className="space-y-6">
                  {complexFields.map(([key, value]) => (
                    <div key={key}>
                      {renderObjectTable(
                        value,
                        key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase())
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Array fields - Always open, no collapse */}
          {arrayFields.length > 0 && (
            <div className="space-y-8">
              {arrayFields.map(([key, value]) => (
                <div key={key}>
                  {renderArrayTable(
                    value,
                    key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (s) => s.toUpperCase())
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Custom children content */}
          {children && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <div className="p-8">{children}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
