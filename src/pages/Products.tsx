import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, Package, Plus, RefreshCcw, Search, Trash2, AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { z } from 'zod';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormField } from '../components/forms/FormField';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { apiService } from '../services/api';
import { Product } from '../types';
import { formatCurrency } from '../utils/constants';
import DeleteModal from '../components/modals/DeleteModal';
import Creatable from 'react-select/creatable';

// const UNIT_TYPE_OPTIONS = [
//   { value: 'Nos', label: 'Nos' },
//   { value: 'kg', label: 'kg' },
//   { value: 'MT', label: 'MT' },
//   { value: 'm²', label: 'm²' },
//   { value: 'm³', label: 'm³' },
//   { value: 'Bag', label: 'Bag' },
//   { value: 'Sheet', label: 'Sheet' },
//   { value: 'Roll', label: 'Roll' },
//   { value: 'Set', label: 'Set' },
//   { value: 'Unit', label: 'Unit' },
//   { value: 'Box', label: 'Box' },
//   { value: 'Packet', label: 'Packet' },
//   { value: 'Can', label: 'Can' },
//   { value: 'Litre', label: 'Litre' },
//   { value: 'Piece', label: 'Piece' },
//   { value: 'Pair', label: 'Pair' },
//   { value: 'Machine Hour', label: 'Machine Hour' },
// ];

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  purchaseRate: z.number().min(0, 'Purchase rate must be positive'),
  unitType: z.string().min(1, 'Unit type is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}


const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product }) => {
  const queryClient = useQueryClient();
  const isEditing = !!product;
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  // Fetch unit types from backend using TanStack Query
  const {
    data: unitTypeData = [],
    isLoading: isUnitTypeLoading,
    refetch: refetchUnitTypes,
  } = useQuery({
    queryKey: ['unit-types'],
    queryFn: () => apiService.getUnitTypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  useEffect(() => {
    const format = unitTypeData?.map(ut => ({ value: ut.title, label: ut.title })) || [];
    // Only update state if changed
    if (JSON.stringify(format) !== JSON.stringify(unitOptions)) {
      setUnitOptions(format);
    }
  }, [unitTypeData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? { ...product }
      : { name: '', purchaseRate: 0, unitType: '' },
  });

  // Prefill when editing
  useEffect(() => {
    if (isOpen && product) {
      reset({
        name: product.name || '',
        purchaseRate: product.purchaseRate || 0,
        unitType: product.unitType || '',
      });
    }
  }, [isOpen, product, reset]);

  // Clear when adding new
  useEffect(() => {
    if (isOpen && !product) {
      reset({
        name: '',
        purchaseRate: 0,
        unitType: '',
      });
    }
  }, [isOpen, product, reset]);

  const createMutation = useMutation({
    mutationFn: apiService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      apiService.updateProduct(id, data),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      reset();
    },
    onError: (error: unknown) => {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response
      ) {
        // Axios error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as { response?: { data?: { message?: string } } };
        console.error('Update error (axios):', err.response?.data || error);
        alert('Failed to update product: ' + (err.response?.data?.message || error));
      } else {
        console.error('Update error:', error);
        alert('Failed to update product. See console for details.');
      }
    },
  });

  const onSubmit = (data: ProductFormData) => {
    // Find the supplier name by ID
    // const selectedSupplier = suppliers.find(s => String(s.id ?? s._id) === data.supplier);
    // const payload = { ...data, vendor: selectedSupplier ? selectedSupplier.name : '', createdAt: new Date().toISOString() };
    const payload = { ...data };
    delete (payload as Record<string, unknown>).supplier;
    if (isEditing) {
      const id = (product?._id ?? '').toString();
      if (!id) {
        alert('Product ID is missing. Cannot update.');
        return;
      }
      updateMutation.mutate({ id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ marginTop: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white relative rounded-lg max-w-2xl w-full min-h-[auto] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Product Name"
                name="name"
                placeholder="Enter product name"
                register={register}
                error={errors.name}
                required
              />
              <FormField
                label="Rate"
                name="purchaseRate"
                type="number"
                placeholder="Enter purchase rate"
                register={register}
                min={0}
                error={errors.purchaseRate}
                required
              />
              <Controller
                name="unitType"
                control={control}
                rules={{ required: 'Unit type is required' }}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Type<span className="text-red-500">*</span>
                    </label>
                    <Creatable
                      {...field}
                      options={unitOptions}
                      value={field.value ? { value: field.value, label: field.value } : null}
                      onChange={option => field.onChange(option ? option.value : '')}
                      onCreateOption={async (inputValue) => {
                        const newOption = { value: inputValue, label: inputValue };
                        try {
                          await apiService.createUnitType(newOption);
                          refetchUnitTypes();
                        } catch (err) {
                          // Optionally show error toast
                          console.log('Failed to create unit type:', err);
                        }

                        field.onChange(inputValue);
                      }}
                      placeholder="Select unit type"
                      isClearable
                      classNamePrefix="react-select"
                    />
                    {errors.unitType && (
                      <span className="text-xs text-red-500">{errors.unitType.message}</span>
                    )}
                  </div>
                )}
              />
            </div>
            <div className="flex justify-end  space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className='gradient-btn'
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};


export const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev, resetPage } = usePagination(1);
  const limit = 10;
  // const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const {
    data: productResponse = { products: [], pagination: { page: 1, pages: 1, total: 0, limit } },
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['products', page, debouncedSearch],
    queryFn: () => apiService.getProducts({ page, limit, search: debouncedSearch }),
    staleTime: 0,
  });


  const products = Array.isArray(productResponse?.products)
    ? productResponse.products
    : [];
  const pagination = productResponse?.pagination || { page: 1, pages: 1, total: 0, limit };

  const deleteMutation = useMutation({
    mutationFn: apiService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    },
    onError: (error: unknown) => {
      console.error('Delete error:', error);
      // You can add toast notification here instead of alert
    }
  });

  const filteredProducts: Product[] = products;

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete._id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <>
      <div className="space-y-6">

        <Card >
          <CardHeader
            title={`Products`}
            subtitle="Manage your product inventory"
            action={
              <Button
                icon={Plus}
                className='gradient-btn'
                onClick={() => setIsModalOpen(true)}
              >
                Add Product
              </Button>
            }
          />
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetPage();
                }}
              />
            </div>
          </div>
          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product: Product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.vendor}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.purchaseRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.unitType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {isAdmin() && (
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/products/${product._id}`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => handleDeleteClick(product)}
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
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first product.
              </p>
            </div>
          )}
          {/* Pagination Controls */}
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={handlePrev}
            >
              Previous
            </Button>
            <span className="px-2">Page {pagination.page} of {pagination.pages}</span>
            <Button
              type="button"
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => handleNext(pagination)}
            >
              Next
            </Button>
          </div>
        </Card>

        <ProductModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          product={editingProduct}
        />



      </div>
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        productName={productToDelete?.name || ''}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};