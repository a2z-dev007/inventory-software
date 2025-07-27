import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiService } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormField } from '../components/forms/FormField';
import { SelectField } from '../components/forms/SelectField';
import { formatCurrency } from '../utils/constants';
import { Product } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { DetailModal } from '../components/common/DetailModal';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  // unitType:z.string(),
  purchaseRate: z.number().min(0, 'Purchase rate must be positive'),
  salesRate: z.number().min(0, 'Sales rate must be positive'),
  currentStock: z.number().min(0, 'Current stock must be positive'),
  category: z.string().min(1, 'Category is required'),
  supplier: z.string().min(1, 'Supplier is required'),
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

  // Fetch suppliers for dropdown
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apiService.getSuppliers({ page: 1, limit: 100 }),
  });
  type Supplier = { id?: string; _id?: string; name: string };
  const suppliers: Supplier[] = suppliersData?.vendors || [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? { ...product, supplier: product.supplier || '' }
      : { name: '', sku: '', category: '', purchaseRate: 0, salesRate: 0, currentStock: 0, supplier: '' },
  });

  // Prefill form fields with correct supplier ID after suppliers load
  useEffect(() => {
    if (isOpen && product && suppliers.length > 0) {
      let supplierId = '';
      if (typeof product.supplier === 'object' && product.supplier !== null) {
        supplierId = String((product.supplier as Record<string, unknown>).id ?? (product.supplier as Record<string, unknown>)._id);
      } else if (typeof product.supplier === 'string') {
        const found = suppliers.find(s => s.name === product.supplier);
        supplierId = found ? String(found.id ?? found._id) : '';
      }
      reset({
        name: product.name,
        sku: product.sku,
        purchaseRate: product.purchaseRate,
        salesRate: product.salesRate,
        currentStock: product.currentStock,
        category: product.category,
        supplier: supplierId,
      });
    }
  }, [isOpen, product, suppliers, reset]);

  useEffect(() => {
    if (isOpen && !product) {
      reset({
        name: '',
        sku: '',
        purchaseRate: 0,
        salesRate: 0,
        currentStock: 0,
        category: '',
        supplier: '',
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
    const selectedSupplier = suppliers.find(s => String(s.id ?? s._id) === data.supplier);
    const payload = { ...data, vendor: selectedSupplier ? selectedSupplier.name : '', createdAt: new Date().toISOString() };
    delete (payload as Record<string, unknown>).supplier;
    if (isEditing) {
      const id = (product?.id ?? '').toString();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                label="SKU"
                name="sku"
                placeholder="Enter SKU"
                register={register}
                error={errors.sku}
                required
              />

              <FormField
                label="Purchase Rate"
                name="purchaseRate"
                type="number"
                placeholder="Enter purchase rate"
                register={register}
                error={errors.purchaseRate}
                required
              />

              <FormField
                label="Sales Rate"
                name="salesRate"
                type="number"
                placeholder="Enter sales rate"
                register={register}
                error={errors.salesRate}
                required
              />

              <FormField
                label="Current Stock"
                name="currentStock"
                type="number"
                placeholder="Enter current stock"
                register={register}
                error={errors.currentStock}
                required
              />

              <FormField
                label="Category"
                name="category"
                placeholder="Enter category"
                register={register}
                error={errors.category}
                required
              />
            </div>

            <SelectField<ProductFormData>
              label="Supplier"
              name="supplier"
              options={suppliers.map((supplier) => ({
                value: String(supplier.id ?? supplier._id),
                label: supplier.name,
              }))}
              control={control}
              error={errors.supplier}
              required
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev, resetPage } = usePagination(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const {
    data: productResponse = { products: [], pagination: { page: 1, pages: 1, total: 0, limit } },
    isLoading,
  } = useQuery({
    queryKey: ['products', page, debouncedSearch],
    queryFn: () => apiService.getProducts({ page, limit, search: debouncedSearch }),
    staleTime: 0,
  });

  const products = Array.isArray(productResponse?.products)
    ? productResponse.products.map((p: Product) => {
        const id = typeof p.id === 'string'
          ? p.id
          : (typeof ((p as unknown) as { _id?: string })._id === 'string'
              ? ((p as unknown) as { _id: string })._id
              : undefined);
        return { ...p, id };
      })
    : [];
  const pagination = productResponse?.pagination || { page: 1, pages: 1, total: 0, limit };

  const deleteMutation = useMutation({
    mutationFn: apiService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const filteredProducts: Product[] = products;

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id.toString());
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Products"
          subtitle="Manage your product inventory"
          action={
            <Button
              icon={Plus}
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
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product: Product) => (
                <tr key={product.id} className="hover:bg-gray-50">
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
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {product?.name} - ({product?.unitType})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.purchaseRate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.salesRate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.currentStock < 10
                        ? 'bg-red-100 text-red-800'
                        : product.currentStock < 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.currentStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this product?')) {
                          deleteMutation.mutate(product._id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedDetailItem(product); setIsDetailModalOpen(true); }}
                      className="text-gray-600 hover:text-gray-900"
                      title="View Details"
                    >
                      <span className="sr-only">View Details</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
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
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedDetailItem}
        title="Product Details"
      />
    </div>
  );
};