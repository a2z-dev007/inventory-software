import React from 'react';
import { FileText, Calendar, User, Truck, Clipboard, DollarSign, Box, X, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/constants';
import { generatePDF } from '../../utils/pdf';
import { PurchaseOrder } from '../../pages/PurchaseOrders';
// import { PurchaseOrder } from '../../types';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PurchaseOrder;
  title: string;
}

export const PODetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, item, title }) => {
  if (!isOpen || !item) return null;

  // Status color mapping
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    delivered: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">

      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-white" />
              <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
              <span className="text-white text-sm font-medium">#{item.poNumber}</span>
            </div>
            <div className={`px-3 py-1 rounded-full flex items-center ${statusColors[item.status]}`}>
              <span className="text-sm font-medium capitalize">{item.status}</span>
            </div>
            {item.ref_num && (
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center">
                <span className="text-white text-sm font-medium">DB: {item.ref_num}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Supplier and Dates Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{item.vendor}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(item.orderDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Delivery Date</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {item.deliveryDate ?
                  new Date(item.deliveryDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : '--'}
              </p>
            </div>
          </div>

          {/* Site Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-full">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Site Incharge</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{item.site_incharge || '--'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <User className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Client </h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{item.customerName || '--'}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-full">
                  <User className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Contractor</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{item.contractor || '--'}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-cyan-100 rounded-full">
                  <User className="h-5 w-5 text-cyan-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Ordered By</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{item.orderedBy || '--'}</p>
            </div>
          </div>

          {/* Purpose and Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Clipboard className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-500">Purpose</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">{item.purpose || '--'}</p>
            </div>

            {item.remarks && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-pink-100 rounded-full">
                    <FileText className="h-5 w-5 text-pink-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Remarks</h3>
                </div>
                <p className="text-gray-700">{item.remarks}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Unit Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {item.items.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Box className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">
                        {item.unitType || '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-medium text-gray-700">Subtotal:</span>
              <span className="text-xl font-semibold text-gray-900">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-xl font-bold text-blue-700">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-700">
                {formatCurrency(item.total)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => generatePDF(item)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-md transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};