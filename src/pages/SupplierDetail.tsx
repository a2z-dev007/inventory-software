import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DetailPage } from '../components/common/DetailPage';
import { toast } from 'react-toastify';
import {
  Building,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Hash,
  TrendingUp,
  Clock,
  Shield,
  CheckCircle,
  Eye,
  Edit,
  Download,
  MoreVertical,
  Star,
  Activity,
  CreditCard,
  AlertTriangle,
  Globe,
  UserCheck,
  Briefcase,
  User2Icon
} from 'lucide-react';
import { formatINRCurrency, formatRelativeDate } from '../utils/constants';
import BackButton from '../components/common/BackButton';
export interface SupplierTypes {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const getActiveStatus = (isActive) => {
  return isActive
    ? { status: 'Active', color: 'bg-green-100 text-green-800 border-green-200' }
    : { status: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-200' };
};

const getRatingColor = (rating) => {
  if (rating >= 4.5) return 'from-green-500 to-emerald-600';
  if (rating >= 4.0) return 'from-blue-500 to-indigo-600';
  if (rating >= 3.5) return 'from-yellow-500 to-orange-600';
  return 'from-red-500 to-red-600';
};

const formatPhoneNumber = (phone) => {
  return phone.replace(/(\+\d{2})-(\d{2})-(\d{4})-(\d{4})/, '$1 $2 $3 $4');
};
export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();


  const {
    data: supplier,
    isLoading,
    error,
  } = useQuery<SupplierTypes>({
    queryKey: ['supplier', id],
    queryFn: () => apiService.getSupplierById(id!),
    enabled: !!id,
  });
  const activeStatus = getActiveStatus(supplier?.isActive);


  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
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
                  <User2Icon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {supplier?.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-2xl border border-yellow-200">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="font-bold text-yellow-800">{supplier?.rating}</span>
              </div> */}

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

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-8 mb-8">
          {/* Vendor Details */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl mr-3 shadow-lg shadow-blue-500/25">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Vendor Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 group-hover:bg-blue-200 p-2 rounded-lg transition-colors duration-200">
                        <Hash className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">Vendor ID</p>
                        <p className="font-bold text-lg text-gray-900 font-mono break-all">{supplier?._id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-emerald-100 group-hover:bg-emerald-200 p-2 rounded-lg transition-colors duration-200">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Contact Person</p>
                        <p className="font-bold text-lg text-gray-900">{supplier?.contact}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 group-hover:bg-purple-200 p-2 rounded-lg transition-colors duration-200">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                        <a href={`mailto:${supplier?.email}`} className="font-bold text-lg text-gray-900 hover:text-purple-600 transition-colors duration-200">
                          {supplier?.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="group hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-orange-100 group-hover:bg-orange-200 p-2 rounded-lg transition-colors duration-200">
                        <Phone className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                        <a href={`tel:${supplier?.phone}`} className="font-bold text-lg text-gray-900 hover:text-orange-600 transition-colors duration-200">
                          {supplier?.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 p-4 rounded-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="bg-indigo-100 group-hover:bg-indigo-200 p-2 rounded-lg transition-colors duration-200">
                        <MapPin className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Address</p>
                        <p className="font-bold text-lg text-gray-900">{supplier?.address}</p>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="group hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 p-4 rounded-xl transition-all duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 group-hover:bg-amber-200 p-2 rounded-lg transition-colors duration-200">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Onboarded</p>
                      <p className="font-bold text-lg text-gray-900">{formatRelativeDate(supplier?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Card */}

      </div>

      {/* Quick Actions */}
      {/* <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-xl mr-3 shadow-lg shadow-orange-500/25">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-lg hover:scale-105">
              <Briefcase className="h-5 w-5" />
              <span className="font-medium">Create Order</span>
            </button>
            
            <button className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 hover:shadow-lg hover:scale-105">
              <FileText className="h-5 w-5" />
              <span className="font-medium">View Orders</span>
            </button>
            
            <button className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:shadow-lg hover:scale-105">
              <Mail className="h-5 w-5" />
              <span className="font-medium">Send Email</span>
            </button>
            
            <button className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:shadow-lg hover:scale-105">
              <Phone className="h-5 w-5" />
              <span className="font-medium">Call Vendor</span>
            </button>
          </div>
        </div> */}

  
    </div>

  );
}
