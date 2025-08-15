import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DetailPage } from '../components/common/DetailPage';
import { toast } from 'react-toastify';
import {
  Package,
  Calendar,
  User,
  Building,
  FileText,
  Truck,
  CheckCircle,
  DollarSign,
  Hash,
  MapPin,
  UserCheck,
  Wrench,
  Download,
  Eye,
  MoreVertical,
  Star,
  TrendingUp,
  Clock,
  Shield,
  IndianRupeeIcon,
  User2Icon,
  Building2Icon,
  InfoIcon
} from 'lucide-react';
import { generatePDF } from '../utils/pdf';
import moment from 'moment';
import { formatCurrency, formatDate, formatINRCurrency, formatRelativeDate, getStatusColor } from '../utils/constants';
import BackButton from '../components/common/BackButton';

export const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: purchaseOrder,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: () => apiService.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  // Status color mapping
  const po = purchaseOrder;


  return (
    <div className="min-h-screen bg-gradient-to-br  p-4 sm:p-6 lg:p-8">
      {/* Background Pattern */}
      {/* <div className="absolute inset-0 bg-grid-pattern opacity-5"></div> */}
      <div className='mb-6'>
        <BackButton />
      </div>
      <div className="relative max-w-7xl mx-auto">
        {/* Floating Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-purple-500/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg shadow-blue-500/25">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Purchase Order
                </h1>
                {/* <p className="text-gray-600 mt-1 text-lg">Advanced Order Management</p> */}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`px-6 py-3 rounded-2xl font-bold text-lg ${getStatusColor(po?.status)} transform hover:scale-105 transition-all duration-200`}>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="capitalize">{po?.status}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button onClick={() => generatePDF(po)} className="p-3 bg-white/50 hover:bg-white/80 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg">
                  <Download className="h-5 w-5 text-gray-600" />
                </button>
                {/* <button className="p-3 bg-white/50 hover:bg-white/80 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatINRCurrency(po?.total)}</p>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg shadow-emerald-500/25">
                <IndianRupeeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* <div className="mt-4 flex items-center text-emerald-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>100% Complete</span>
            </div> */}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Count</p>
                <p className="text-2xl font-bold text-gray-900">{po?.items.length}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/25">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* <div className="mt-4 flex items-center text-blue-600 text-sm">
              <Star className="h-4 w-4 mr-1" />
              <span>Premium Quality</span>
            </div> */}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery In</p>
                <p className="text-2xl font-bold text-gray-900">{formatRelativeDate(po?.deliveryDate, 'relative')}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg shadow-purple-500/25">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* <div className="mt-4 flex items-center text-purple-600 text-sm">
              <Truck className="h-4 w-4 mr-1" />
              <span>On Schedule</span>
            </div> */}
          </div>

          {/* <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security</p>
                <p className="text-2xl font-bold text-gray-900">Verified</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl shadow-lg shadow-orange-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-orange-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Authenticated</span>
            </div>
          </div> */}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-8 mb-8">
          {/* Order Details */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl mr-3 shadow-lg shadow-blue-500/25">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Order Information
                </h2>
                {
                  po?.attachment && (
                    <a href={po?.attachment} target='_blank' className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">View File</span>
                    </a>
                  )
                }

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 group-hover:bg-blue-200 p-2 rounded-lg transition-colors duration-200">
                        <Hash className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">PO Number</p>
                        <p className="font-bold text-lg text-gray-900">{po?.poNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-emerald-100 group-hover:bg-emerald-200 p-2 rounded-lg transition-colors duration-200">
                        <Building className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Supplier</p>
                        <p className="font-bold text-lg text-gray-900">{po?.vendor}</p>
                      </div>
                    </div>
                  </div>
                  <div className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-100 group-hover:bg-gray-200 p-2 rounded-lg transition-colors duration-200">
                        <Building className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Client</p>
                        <p className="font-bold text-lg text-gray-900">{po?.customer}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 group-hover:bg-purple-200 p-2 rounded-lg transition-colors duration-200">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Order Date</p>
                        <p className="font-bold text-lg text-gray-900">{formatDate(po?.orderDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-orange-100 group-hover:bg-orange-200 p-2 rounded-lg transition-colors duration-200">
                        <Truck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Delivery Date</p>
                        <p className="font-bold text-lg text-gray-900">{formatDate(po?.deliveryDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="group hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-orange-100 group-hover:bg-orange-200 p-2 rounded-lg transition-colors duration-200">
                        <User2Icon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Created By</p>
                        <p className="font-bold text-lg text-gray-900">{po?.createdBy.username}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-indigo-100 group-hover:bg-indigo-200 p-2 rounded-lg transition-colors duration-200">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Ordered By</p>
                        <p className="font-bold text-lg text-gray-900">{po?.orderedBy}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-teal-100 group-hover:bg-teal-200 p-2 rounded-lg transition-colors duration-200">
                        <MapPin className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Site Incharge</p>
                        <p className="font-bold text-lg text-gray-900">{po?.site_incharge}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-rose-100 group-hover:bg-rose-200 p-2 rounded-lg transition-colors duration-200">
                        <UserCheck className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Contractor</p>
                        <p className="font-bold text-lg text-gray-900">{po?.contractor}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-amber-100 group-hover:bg-amber-200 p-2 rounded-lg transition-colors duration-200">
                        <InfoIcon className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Purpose</p>
                        <p className="font-bold text-lg text-gray-900">{po?.purpose}</p>
                      </div>
                    </div>
                  </div>
                  <div className="group hover:bg-gradient-to-r hover:from-violet-50 hover:to-violet-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-violet-100 group-hover:bg-violet-200 p-2 rounded-lg transition-colors duration-200">
                        <Building2Icon className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Site/Unit</p>
                        <p className="font-bold text-lg text-gray-900">{po?.siteType}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Summary Card */}

        </div>

        {/* Premium Items Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-8 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl mr-3 shadow-lg shadow-blue-500/25">
                  <Package className="h-5 w-5 text-white" />
                </div>
                Order Items
              </h2>
              {/* <div className="flex space-x-3">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg">
                  Export
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200">
                  Print
                </button>
              </div> */}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white">
                  <th className="px-8 py-6 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Product</th>
                  {/* <th className="px-8 py-6 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Product ID</th> */}
                  <th className="px-8 py-6 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">Quantity</th>
                  <th className="px-8 py-6 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">Unit</th>
                  <th className="px-8 py-6 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">Unit Price</th>
                  <th className="px-8 py-6 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {po?.items.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 border-b border-gray-100">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-blue-500/25">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{item.productName}</p>
                          <p className="text-sm text-gray-500">Premium Quality</p>
                        </div>
                      </div>
                    </td>
                    {/* <td className="px-8 py-6">
                      <span className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded-lg">
                        {item.productId}
                      </span>
                    </td> */}
                    <td className="px-8 py-6 text-center">
                      <span className="font-bold text-gray-900 text-lg">{item.quantity}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-bold">
                        {item.unitType}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-bold text-gray-900 text-lg">{formatCurrency(item.unitPrice)}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-bold text-2xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {formatCurrency(item.total)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

