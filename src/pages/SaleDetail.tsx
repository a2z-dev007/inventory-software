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
  IndianRupeeIcon,
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
  Phone,
  ShoppingBag,
  CreditCard,
  AlertCircle
} from 'lucide-react';
export const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: sale,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => apiService.getSaleById(id!),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/sales');
  };


  const handleEdit = () => {
    navigate(`/sales/${id}/edit`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = () => {
    switch(sale?.status) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25';
      case 'pending':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25';
      case 'cancelled':
        return 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25';
    }
  };

  const getStatusIcon = () => {
    switch(sale?.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      // TODO: Implement delete functionality
      toast.error('Delete functionality not implemented yet');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">

      
      <div className="relative max-w-7xl mx-auto">
        {/* Floating Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-purple-500/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-purple-500/25">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Site Details
                </h1>
                {/* <p className="text-gray-600 mt-1 text-lg">Advanced Sales Management</p> */}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* <div className={`px-6 py-3 rounded-2xl font-bold text-lg ${getStatusColor()} transform hover:scale-105 transition-all duration-200`}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span className="capitalize">{sale?.status}</span>
                </div>
              </div> */}
              
              {/* <div className="flex space-x-2">
                <button className="p-3 bg-white/50 hover:bg-white/80 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg">
                  <Download className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-3 bg-white/50 hover:bg-white/80 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
              </div> */}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(sale?.total)}</p>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg shadow-emerald-500/25">
                <IndianRupeeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* <div className="mt-4 flex items-center text-emerald-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>High Value Transaction</span>
            </div> */}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Invoice Number</p>
                <p className="text-lg font-bold text-gray-900">{sale?.invoiceNumber}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/25">
                <Hash className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* <div className="mt-4 flex items-center text-blue-600 text-sm">
              <FileText className="h-4 w-4 mr-1" />
              <span>Sales Record</span>
            </div> */}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Site Date</p>
                <p className="text-lg font-bold text-gray-900">{formatDate(sale?.saleDate)}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg shadow-purple-500/25">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* <div className="mt-4 flex items-center text-purple-600 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>Transaction Date</span>
            </div> */}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Count</p>
                <p className="text-2xl font-bold text-gray-900">{sale?.items.length}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/25">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* <div className="mt-4 flex items-center text-blue-600 text-sm">
              <Star className="h-4 w-4 mr-1" />
              <span>Premium Equipment</span>
            </div> */}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Order Details */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-xl mr-3 shadow-lg shadow-purple-500/25">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Site Information
                </h2>
               
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 group-hover:bg-blue-200 p-2 rounded-lg transition-colors duration-200">
                        <Hash className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Invoice Number</p>
                        <p className="font-bold text-lg text-gray-900">{sale?.invoiceNumber}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-emerald-100 group-hover:bg-emerald-200 p-2 rounded-lg transition-colors duration-200">
                        <Building className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Customer</p>
                        <p className="font-bold text-lg text-gray-900">{sale?.customerName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 group-hover:bg-purple-200 p-2 rounded-lg transition-colors duration-200">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1"> Date</p>
                        <p className="font-bold text-lg text-gray-900">{formatDate(sale?.saleDate)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-orange-100 group-hover:bg-orange-200 p-2 rounded-lg transition-colors duration-200">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Reference Number</p>
                        <p className="font-bold text-lg text-gray-900">{sale?.ref_num}</p>
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
                        <p className="text-sm font-medium text-gray-600 mb-1">Created By</p>
                        <p className="font-bold text-lg text-gray-900">{sale?.createdBy.name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-teal-100 group-hover:bg-teal-200 p-2 rounded-lg transition-colors duration-200">
                        <UserCheck className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Received By</p>
                        <p className="font-bold text-lg text-gray-900">{sale?.receivedBy}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-rose-100 group-hover:bg-rose-200 p-2 rounded-lg transition-colors duration-200">
                        <Phone className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Customer Phone</p>
                        <p className="font-bold text-lg text-gray-900">{sale?.phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-amber-100 group-hover:bg-amber-200 p-2 rounded-lg transition-colors duration-200">
                        <MapPin className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Customer Address</p>
                        <p className="font-bold text-lg text-gray-900 line-clamp-1">{sale?.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Summary Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-green-500/10 rounded-full -translate-y-12 translate-x-12"></div>
            
            <div className="relative">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-xl mr-3 shadow-lg shadow-purple-500/25">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                Financial Summary
              </h2>
              
              <div className="space-y-6">
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(sale?.subtotal)}</span>
                  </div>
                </div>
                
                {/* <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Tax & Fees</span>
                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(0)}</span>
                  </div>
                </div> */}
                
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-lg shadow-purple-500/25">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Grand Total</span>
                    <span className="text-white font-bold text-2xl">{formatCurrency(sale?.total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                <p className="text-sm font-medium text-gray-600 mb-3">Order Created By</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{sale?.createdBy.name}</p>
                    <p className="text-sm text-gray-500">@{sale?.createdBy.username}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Items Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-8 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-xl mr-3 shadow-lg shadow-purple-500/25">
                  <Package className="h-5 w-5 text-white" />
                </div>
                Site Items
              </h2>
             
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
                {sale?.items.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 border-b border-gray-100">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-purple-500/25">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{item.productName}</p>
    
                        </div>
                      </div>
                    </td>
                  
                    <td className="px-8 py-6 text-center">
                      <span className="font-bold text-gray-900 text-lg">{item.quantity}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-bold">
                        {item.unitType}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-bold text-gray-900 text-lg">{formatCurrency(item.unitPrice)}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
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