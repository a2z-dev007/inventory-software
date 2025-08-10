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
  IndianRupeeIcon,
  Hash,
  TrendingUp,
  Clock,
  Shield, 

  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Download,
  MoreVertical,
  Star,
  Activity
} from 'lucide-react';
import { formatINRCurrency, formatRelativeDate } from '../utils/constants';
import BackButton from '../components/common/BackButton';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiService.getProductById(id!),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/products');
  };

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      // TODO: Implement delete functionality
      toast.error('Delete functionality not implemented yet');
    }
  };
  const getStockStatus = (currentStock, minStockLevel) => {
    if (currentStock <= minStockLevel) {
      return { 
        status: 'Low Stock', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
        iconColor: 'text-red-600'
      };
    }
    if (currentStock <= minStockLevel * 1.5) {
      return { 
        status: 'Medium Stock', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        iconColor: 'text-yellow-600'
      };
    }
    return { 
      status: 'Good Stock', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    };
  };
  
  const getActiveStatus = (isActive) => {
    return isActive 
      ? { status: 'Active', color: 'bg-green-100 text-green-800 border-green-200' }
      : { status: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };
  const stockStatus = getStockStatus(product.currentStock, product.minStockLevel);
  const activeStatus = getActiveStatus(product.isActive);
  const StockIcon = stockStatus.icon;



  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
       <div className='mb-6'>
     <BackButton/>
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
                  {product.name}
                </h1>
                <p className="text-gray-600 mt-1 text-lg">{product.category}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-6 py-3 rounded-2xl font-bold text-lg ${activeStatus.color} border transform hover:scale-105 transition-all duration-200`}>
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>{activeStatus.status}</span>
                </div>
              </div>
              
              {/* <div className="flex space-x-2">
                <button className="p-3 bg-white/50 hover:bg-white/80 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg">
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-3 bg-white/50 hover:bg-white/80 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg">
                  <Download className="h-5 w-5 text-gray-600" />
                </button>
              </div> */}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Purchase Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatINRCurrency(product.purchaseRate)}</p>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg shadow-emerald-500/25">
                <IndianRupeeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-emerald-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Per {product.unitType}</span>
            </div>
          </div>

          {/* <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">{product.currentStock}</p>
              </div>
              <div className={`bg-gradient-to-r ${stockStatus.iconColor === 'text-red-600' ? 'from-red-500 to-red-600' : stockStatus.iconColor === 'text-yellow-600' ? 'from-yellow-500 to-orange-600' : 'from-green-500 to-emerald-600'} p-3 rounded-xl shadow-lg`}>
                <StockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className={`mt-4 flex items-center text-sm ${stockStatus.iconColor}`}>
              <StockIcon className="h-4 w-4 mr-1" />
              <span>{stockStatus.status}</span>
            </div>
          </div> */}

          {/* <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Min Stock Level</p>
                <p className="text-2xl font-bold text-gray-900">{product.minStockLevel}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl shadow-lg shadow-orange-500/25">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-orange-600 text-sm">
              <Shield className="h-4 w-4 mr-1" />
              <span>Safety Level</span>
            </div>
          </div> */}

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unit Type</p>
                <p className="text-2xl font-bold text-gray-900">{product.unitType}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg shadow-purple-500/25">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-purple-600 text-sm">
              <Star className="h-4 w-4 mr-1" />
              <span>Measurement</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Product Details */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl mr-3 shadow-lg shadow-blue-500/25">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Product Information
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
                        <p className="text-sm font-medium text-gray-600 mb-1">Product ID</p>
                        <p className="font-bold text-lg text-gray-900 font-mono">{product._id}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* <div className="group hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-emerald-100 group-hover:bg-emerald-200 p-2 rounded-lg transition-colors duration-200">
                        <Building className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Supplier</p>
                        <p className="font-bold text-lg text-gray-900">{product.supplier}</p>
                      </div>
                    </div>
                  </div> */}
                  
                  <div className="group hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 group-hover:bg-purple-200 p-2 rounded-lg transition-colors duration-200">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Created Date</p>
                        <p className="font-bold text-lg text-gray-900">{formatRelativeDate(product.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* <div className="group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-indigo-100 group-hover:bg-indigo-200 p-2 rounded-lg transition-colors duration-200">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Created By</p>
                        <p className="font-bold text-lg text-gray-900">{product.createdBy.name}</p>
                      </div>
                    </div>
                  </div> */}
                  
                  <div className="group hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-orange-100 group-hover:bg-orange-200 p-2 rounded-lg transition-colors duration-200">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Last Updated</p>
                        <p className="font-bold text-lg text-gray-900">{formatRelativeDate(product.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 p-4 rounded-xl transition-all duration-200">
                    {/* <div className="flex items-start space-x-4">
                      <div className="bg-teal-100 group-hover:bg-teal-200 p-2 rounded-lg transition-colors duration-200">
                        <Package className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Category</p>
                        <p className="font-bold text-lg text-gray-900">{product.category}</p>
                      </div>
                    </div> */}
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
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-2 rounded-xl mr-3 shadow-lg shadow-emerald-500/25">
                  <IndianRupeeIcon className="h-5 w-5 text-white" />
                </div>
                Pricing & Stock
              </h2>
              
              <div className="space-y-6">
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Product Rate</span>
                    <span className="font-bold text-gray-900 text-lg">{formatINRCurrency(product.purchaseRate)}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">Per {product.unitType}</div>
                </div>
                
                {/* <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Stock Value</span>
                    <span className="font-bold text-gray-900 text-lg">{formatINRCurrency(product.currentStock * product.purchaseRate)}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">Current Inventory Value</div>
                </div>
                 */}
                <div className={`rounded-2xl p-6 shadow-lg ${stockStatus.color.includes('red') ? 'bg-gradient-to-r from-red-500 to-red-600' : stockStatus.color.includes('yellow') ? 'bg-gradient-to-r from-yellow-500 to-orange-600' : 'bg-gradient-to-r from-emerald-500 to-green-600'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Stock Status</span>
                    <StockIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="mt-2 text-white text-sm">{product.currentStock} {product.unitType} Available</div>
                </div>
              </div>
              
              {/* <div className="mt-8 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                <p className="text-sm font-medium text-gray-600 mb-3">Product Created By</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{product.createdBy.name}</p>
                    <p className="text-sm text-gray-500">@{product.createdBy.username}</p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>

      

        {/* Activity Timeline */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl mr-3 shadow-lg shadow-blue-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            Recent Activity
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50/50 transition-all duration-200">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Product Updated</p>
                <p className="text-sm text-gray-600">{formatRelativeDate(product.updatedAt)} • System</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50/50 transition-all duration-200">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Product Created</p>
                <p className="text-sm text-gray-600">{formatRelativeDate(product.createdAt)} • {product.createdBy.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}