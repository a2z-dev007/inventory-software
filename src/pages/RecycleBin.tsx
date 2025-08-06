import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trash2, RefreshCw, Search, Calendar, Package, ShoppingCart, FileText, AlertTriangle, CheckCircle, Users, IndianRupeeIcon, ChevronLeft, Che, IndianRupeeIconvronRight } from 'lucide-react';
import { apiService } from '../services/api';

// Assuming apiService is imported from your API service file
// import { apiService } from './api/apiService';

// Types based on your data structure
interface BaseItem {
  _id: string;
  ref_num: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  createdBy: {
    _id: string;
    username: string;
    name: string;
  };
}

interface PurchaseOrder extends BaseItem {
  type: 'purchaseOrder';
  poNumber: string;
  vendor: string;
  status: string;
  orderDate: string;
  deliveryDate: string;
  total: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  purpose?: string;
  remarks?: string;
}

interface Purchase extends BaseItem {
  type: 'purchase';
  receiptNumber: string;
  vendor: string;
  purchaseDate: string;
  total: number;
  subtotal: number;
  cancelledAmount: number;
  cancelledQty: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    isCancelled: boolean;
  }>;
  remarks?: string;
}

interface Sale extends BaseItem {
  type: 'sale';
  saleNumber: string;
  customer: string;
  saleDate: string;
  total: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

type RecycleBinItem = PurchaseOrder | Purchase | Sale;

// Mock apiService for demonstration - replace with your actual apiService


const RecycleBin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'purchaseOrder' | 'purchase' | 'sale'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'restore' | 'permanent'>('restore');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // API Queries
  const {
    data: poResponse = { purchaseOrders: [], pagination: { page: 1, pages: 1, total: 0, limit } },
    isLoading: isPOLoading,
  } = useQuery({
    queryKey: ['purchase-orders-deleted', page, debouncedSearch],
    queryFn: () => apiService.getDeletedPurchaseOrders({ page, limit, search: debouncedSearch }),
    enabled: activeTab === 'all' || activeTab === 'purchaseOrder',
  });

  const { 
    data: purchasesData = { purchases: [], pagination: { page: 1, pages: 1, total: 0, limit} }, 
    isLoading: isPurchasesLoading 
  } = useQuery({
    queryKey: ['purchases-deleted', page, debouncedSearch],
    queryFn: () => apiService.getDeletedPurchases({ page, limit, search: debouncedSearch }),
    enabled: activeTab === 'all' || activeTab === 'purchase',
  });

  const {
    data: salesResponse = { sales: [], pagination: { page: 1, pages: 1, total: 0, limit } },
    isLoading: isSalesLoading,
  } = useQuery({
    queryKey: ['sales-deleted', page, debouncedSearch],
    queryFn: () => apiService.getDeletedSales({ page, limit, search: debouncedSearch }),
    enabled: activeTab === 'all' || activeTab === 'sale',
  });

  // Debug logging
  React.useEffect(() => {
    console.log('Debug - API Responses:', {
      poResponse,
      purchasesData,
      salesResponse,
      activeTab
    });
  }, [poResponse, purchasesData, salesResponse, activeTab]);

  // Combine all items with type information
  const allItems: RecycleBinItem[] = useMemo(() => {
    const items: RecycleBinItem[] = [];
    
    if (activeTab === 'all' || activeTab === 'purchaseOrder') {
      const purchaseOrders = (poResponse.purchaseOrders || [])
        .map(item => ({ ...item, type: 'purchaseOrder' as const }));
      console.log('Purchase Orders:', purchaseOrders);
      items.push(...purchaseOrders);
    }
    
    if (activeTab === 'all' || activeTab === 'purchase') {
      const purchases = (purchasesData.purchases || [])
        .map(item => ({ ...item, type: 'purchase' as const }));
      console.log('Purchases:', purchases);
      items.push(...purchases);
    }
    
    if (activeTab === 'all' || activeTab === 'sale') {
      const sales = (salesResponse.sales || [])
        .map(item => ({ ...item, type: 'sale' as const }));
      console.log('Sales:', sales);
      items.push(...sales);
    }
    
    console.log('All combined items:', items);
    return items;
  }, [poResponse, purchasesData, salesResponse, activeTab]);

  // Get pagination info based on active tab
  const paginationInfo = useMemo(() => {
    switch (activeTab) {
      case 'purchaseOrder':
        return poResponse.pagination;
      case 'purchase':
        return purchasesData.pagination;
      case 'sale':
        return salesResponse.pagination;
      default:
        // For 'all' tab, we'll use the max pagination info
        const maxPages = Math.max(
          poResponse.pagination.pages,
          purchasesData.pagination?.pages || 1,
          salesResponse.pagination.pages
        );
        const totalItems = (poResponse.pagination.total) + 
                          (purchasesData.pagination?.total || 0) + 
                          (salesResponse.pagination.total);
        return {
          page,
          pages: maxPages,
          total: totalItems,
          limit
        };
    }
  }, [activeTab, poResponse, purchasesData, salesResponse, page]);

  const isLoading = isPOLoading || isPurchasesLoading || isSalesLoading;

  const getItemCounts = () => {
    return {
      all: (poResponse.pagination.total) + 
           (purchasesData.pagination?.total || 0) + 
           (salesResponse.pagination.total),
      purchaseOrder: poResponse.pagination.total,
      purchase: purchasesData.pagination?.total || 0,
      sale: salesResponse.pagination.total,
    };
  };

  const counts = getItemCounts();

  const tabs = [
    { key: 'all', label: 'All Items', icon: Trash2, count: counts.all, color: 'from-gray-500 to-gray-600' },
    { key: 'purchaseOrder', label: 'Purchase Orders', icon: FileText, count: counts.purchaseOrder, color: 'from-blue-500 to-blue-600' },
    { key: 'purchase', label: 'Purchases', icon: Package, count: counts.purchase, color: 'from-green-500 to-green-600' },
    { key: 'sale', label: 'Sales', icon: ShoppingCart, count: counts.sale, color: 'from-purple-500 to-purple-600' }
  ];

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkAction = (action: 'restore' | 'permanent') => {
    if (selectedItems.length === 0) return;
    setActionType(action);
    setShowConfirmModal(true);
  };

  const confirmAction = () => {
    console.log(`${actionType} items:`, selectedItems);
    // Here you would implement the actual restore/delete API calls
    setSelectedItems([]);
    setShowConfirmModal(false);
  };

  const handleTabChange = (newTab: 'all' | 'purchaseOrder' | 'purchase' | 'sale') => {
    setActiveTab(newTab);
    setPage(1); // Reset to first page when changing tabs
    setSelectedItems([]); // Clear selections when changing tabs
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedItems([]); // Clear selections when changing pages
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const renderCard = (item: RecycleBinItem) => (
    <div
      key={item._id}
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group ${
        selectedItems.includes(item._id) ? 'ring-2 ring-blue-500 shadow-blue-100' : ''
      }`}
    >
      {/* Card Header */}
      <div className={`bg-gradient-to-r ${item.type === 'purchaseOrder' ? 'from-blue-500 to-blue-600' : 
        item.type === 'purchase' ? 'from-green-500 to-green-600' : 'from-purple-500 to-purple-600'} p-5 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {item.type === 'purchaseOrder' && <FileText className="w-6 h-6" />}
              {item.type === 'purchase' && <Package className="w-6 h-6" />}
              {item.type === 'sale' && <ShoppingCart className="w-6 h-6" />}
              <div>
                <h3 className="font-bold text-lg">
                  {item.type === 'purchaseOrder' ? 'Purchase Order' : 
                   item.type === 'purchase' ? 'Purchase' : 'Sale'}
                </h3>
                <p className="text-sm opacity-90">#{item.ref_num}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={selectedItems.includes(item._id)}
              onChange={() => handleItemSelect(item._id)}
              className="w-5 h-5 rounded border-white/30 bg-white/20 text-white focus:ring-white/30 focus:ring-2"
            />
          </div>
          
          <div className="text-sm opacity-90">
            {item.type === 'purchaseOrder' && (item as PurchaseOrder).poNumber}
            {item.type === 'purchase' && (item as Purchase).receiptNumber}
            {item.type === 'sale' && (item as Sale).saleNumber}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4">
        {/* Vendor/Customer Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Users className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium">
              {item.type === 'sale' ? 'Customer' : 'Vendor'}
            </p>
            <p className="font-semibold text-gray-800 truncate">
              {'vendor' in item ? item.vendor : 'customer' in item ? item.customer : 'N/A'}
            </p>
          </div>
        </div>

        {/* Amount and Items */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <IndianRupeeIcon className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-green-600 font-medium">Total Amount</p>
            <p className="font-bold text-lg text-green-700">
              {formatCurrency(item.total)}
            </p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-blue-600 font-medium">Items</p>
            <p className="font-bold text-lg text-blue-700">
              {item.items.length}
            </p>
          </div>
        </div>

        {/* Status and Purpose */}
        {item.type === 'purchaseOrder' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                (item as PurchaseOrder).status === 'approved' ? 'bg-green-100 text-green-700' :
                (item as PurchaseOrder).status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {(item as PurchaseOrder).status.toUpperCase()}
              </span>
            </div>
            {(item as PurchaseOrder).purpose && (
              <div>
                <span className="text-sm text-gray-600">Purpose:</span>
                <p className="text-sm text-gray-800 mt-1 p-2 bg-gray-50 rounded-lg">
                  {(item as PurchaseOrder).purpose}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Deletion Info */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span>Deleted: {formatDate(item.updatedAt)}</span>
          </div>
          <p className="text-xs text-gray-500">
            Deleted by: {item.createdBy.name}
          </p>
        </div>

        {/* Remarks */}
        {item.remarks && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Note:</span> {item.remarks}
            </p>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="p-5 pt-0">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedItems([item._id]);
              setActionType('restore');
              setShowConfirmModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Restore
          </button>
          <button
            onClick={() => {
              setSelectedItems([item._id]);
              setActionType('permanent');
              setShowConfirmModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const renderPagination = () => {
    if (paginationInfo.pages <= 1) return null;

    return (
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mt-6">
        <div className="text-gray-600">
          Showing page {paginationInfo.page} of {paginationInfo.pages} ({paginationInfo.total} total items)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(paginationInfo.page - 1)}
            disabled={paginationInfo.page <= 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, paginationInfo.pages) }, (_, i) => {
            const pageNum = Math.max(1, paginationInfo.page - 2) + i;
            if (pageNum > paginationInfo.pages) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  pageNum === paginationInfo.page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(paginationInfo.page + 1)}
            disabled={paginationInfo.page >= paginationInfo.pages}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 shadow-xl">
              <Trash2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Recycle Bin
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Manage and restore your deleted items</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key as any)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === tab.key
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeTab === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Actions */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {selectedItems.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBulkAction('restore')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg font-semibold"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Restore ({selectedItems.length})
                  </button>
                  <button
                    onClick={() => handleBulkAction('permanent')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg font-semibold"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Permanently ({selectedItems.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Items Grid - 3 Columns */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
            {allItems.map(renderCard)}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && renderPagination()}

        {/* Empty State */}
        {!isLoading && allItems.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto w-32 h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
              <Trash2 className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">No deleted items found</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              {debouncedSearch 
                ? 'Try adjusting your search criteria to find deleted items.'
                : `No deleted ${activeTab === 'all' ? 'items' : tabs.find(t => t.key === activeTab)?.label.toLowerCase()} in your recycle bin.`}
            </p>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                {actionType === 'restore' ? (
                  <div className="p-3 rounded-xl bg-green-100">
                    <RefreshCw className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-red-100">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-800">
                  {actionType === 'restore' ? 'Restore Items' : 'Permanent Delete'}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                {actionType === 'restore' 
                  ? `Are you sure you want to restore ${selectedItems.length} item(s)? They will be moved back to their original location.`
                  : `Are you sure you want to permanently delete ${selectedItems.length} item(s)? This action cannot be undone.`
                }
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 px-6 py-3 text-white rounded-xl transition-all font-semibold text-lg shadow-lg ${
                    actionType === 'restore'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  }`}
                >
                  {actionType === 'restore' ? 'Restore' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBin;