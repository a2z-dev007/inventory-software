import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, ReceiptIndianRupee, RefreshCcw, Search, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { apiService } from '../services/api';
import { extractCancelledItemsFromPurchases } from '../utils/constants';
import ReloadButton from '../components/common/ReloadButton';
import { ReusableDeleteModal } from '../components/modals/ReusableDeleteModal';

export interface Purchase {
  _id: string;
  ref_num: string;
  invoiceFile: null;
  vendor: string;
  purchaseDate: Date;
  items: Item[];
  subtotal: number;
  total: number;
  receiptNumber: string;
  createdBy: CreatedBy;
  isDeleted: boolean;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface CreatedBy {
  _id: string;
  username: string;
  name: string;
}

export interface Item {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitType: string;
  total: number;
  isCancelled?: boolean;
  _id: string;
}
interface PurchasesApiResponse {
  purchases: Purchase[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}


export const CancelledItems: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null); // ✅ state for delete modal
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev } = usePagination(1);
  const { isAdmin } = useAuth();

  const { data: purchasesData, isLoading, refetch } = useQuery<PurchasesApiResponse>({
    queryKey: ["purchases", page, debouncedSearch],
    queryFn: () => apiService.getPurchases({ page, limit: 10, search: debouncedSearch }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const purchases = purchasesData?.purchases || [];
  const pagination = purchasesData?.pagination || { page: 1, pages: 1, total: 0, limit: 10 };

  const filteredPurchases = extractCancelledItemsFromPurchases(purchases, true);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deletePurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      setPurchaseToDelete(null); // ✅ reset after success
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <>
      <div className="space-y-6">
        <ReloadButton isLoading={isLoading} refetch={refetch} />
        <Card>
          <CardHeader title="Cancelled Purchases" />

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="search"
                placeholder="Search purchases..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Purchases Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DB Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-sm font-medium rounded-full bg-red-300">
                        {purchase.ref_num}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-sm font-medium ">
                        {purchase.receiptNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{purchase.vendor}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {purchase.invoiceFile ? (
                        <a href={purchase.invoiceFile} target="_blank" download className="text-sm text-blue-600">
                          Download
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">No file</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      {/* {isAdmin() && (
                      <button
                        onClick={() => {
                          setSelectedEditPurchase(purchase);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={20} size={20} />
                      </button>
                    )} */}
                      <button
                        onClick={() => navigate(`/cancelled-items/${purchase._id}`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => setPurchaseToDelete(purchase)} // ✅ open modal
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-6">
              <Button variant="outline" onClick={() => handlePrev()} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button variant="outline" onClick={() => handleNext(pagination)} disabled={page === pagination.pages}>
                Next
              </Button>
            </div>
          )}

          {filteredPurchases.length === 0 && (
            <div className="text-center py-8">
              <ReceiptIndianRupee className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by recording your first purchase.</p>
            </div>
          )}
        </Card>


      </div>
      {/* ✅ Delete Modal */}
      <ReusableDeleteModal
        isOpen={!!purchaseToDelete}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={() => purchaseToDelete && deleteMutation.mutate(purchaseToDelete._id)}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase?"
        itemName={purchaseToDelete?.ref_num}
        isDeleting={deleteMutation.isPending}
        confirmText="Delete Purchase"
      // extraInfo="This action cannot be undone"
      />
    </>
  );
};