import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Download, Edit, Trash2, Search } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import jsPDF from 'jspdf';
import { apiService } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormField } from '../components/forms/FormField';
import { SelectField } from '../components/forms/SelectField';
import { formatCurrency } from '../utils/constants';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { DetailModal } from '../components/common/DetailModal';

const poItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

const purchaseOrderSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required'),
  status: z.enum(['draft', 'approved', 'delivered', 'cancelled']),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface POModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder?: PurchaseOrder | null;
}

const POModal: React.FC<POModalProps> = ({ isOpen, onClose, purchaseOrder }) => {
  const queryClient = useQueryClient();
  const isEditing = !!purchaseOrder;

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts({}),
  });
  const products: Product[] = Array.isArray(productsData?.products) ? productsData.products : Array.isArray(productsData) ? productsData : [];

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apiService.getSuppliers({}),
  });
  const suppliers: { vendors?: Supplier[] } = suppliersData || {};

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: purchaseOrder ? {
      vendor: purchaseOrder.vendor,
      status: purchaseOrder.status,
      items: purchaseOrder.items.map((item: PurchaseOrderItem) => ({
        productId: String(item.productId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    } : {
      vendor: '',
      status: 'draft',
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const createMutation = useMutation({
    mutationFn: apiService.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'purchase-orders' });
      onClose();
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PurchaseOrderFormData }) =>
      apiService.updatePurchaseOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'purchase-orders' });
      onClose();
      reset();
    },
  });

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const onSubmit = (data: PurchaseOrderFormData) => {
    const subtotal = calculateSubtotal();
    const total = subtotal;

    const poData = {
      ...data,
      poNumber: isEditing ? purchaseOrder.poNumber : `PO-${Date.now()}`,
      orderDate: isEditing ? purchaseOrder.orderDate : new Date().toISOString(),
      items: data.items.map(item => {
        const product = products.find((p: Product) => String(p.id ?? p._id) === item.productId);
        return {
          ...item,
          productName: product?.name || '',
          total: item.quantity * item.unitPrice,
        };
      }),
      subtotal,
      total,
    };

    if (isEditing) {
      const id = String(purchaseOrder.id ?? purchaseOrder._id);
      if (!id) {
        alert('Invalid purchase order ID');
        return;
      }
      updateMutation.mutate({ id, data: poData });
    } else {
      createMutation.mutate(poData);
    }
  };

  // Prefill form fields when editing a purchase order
  useEffect(() => {
    if (purchaseOrder) {
      reset({
        vendor: purchaseOrder.vendor,
        status: purchaseOrder.status,
        items: purchaseOrder.items.map((item: PurchaseOrderItem) => ({
          productId: String(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
    } else {
      reset({
        vendor: '',
        status: 'draft',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      });
    }
  }, [purchaseOrder, reset]);

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();
  const total = subtotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Vendor"
                name="vendor"
                options={suppliers?.vendors?.map((supplier: Supplier) => ({
                  value: supplier.name,
                  label: supplier.name,
                })) || []}
                register={register}
                error={errors.vendor}
                required
              />

              <SelectField
                label="Status"
                name="status"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                register={register}
                error={errors.status}
                required
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="md:col-span-2">
                      <SelectField
                        label="Product"
                        name={`items.${index}.productId`}
                        options={products.map((product: Product) => ({
                          value: String(product.id ?? product._id),
                          label: `${product.name} (${product.sku})`,
                        })) || []}
                        register={register}
                        error={errors.items?.[index]?.productId}
                        required
                      />
                    </div>

                    <FormField
                      label="Quantity"
                      name={`items.${index}.quantity`}
                      type="number"
                      register={register}
                      error={errors.items?.[index]?.quantity}
                      required
                    />

                    <FormField
                      label="Unit Price"
                      name={`items.${index}.unitPrice`}
                      type="number"
                      register={register}
                      error={errors.items?.[index]?.unitPrice}
                      required
                    />

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
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
                {isEditing ? 'Update PO' : 'Create PO'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add types for Product, Supplier, PurchaseOrder
interface Product {
  id?: string | number;
  _id?: string | number;
  name: string;
  sku: string;
}

interface Supplier {
  name: string;
}

interface PurchaseOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  productName?: string;
  total?: number;
}

interface PurchaseOrder {
  id?: string;
  _id?: string;
  poNumber: string;
  vendor: string;
  status: 'draft' | 'approved' | 'delivered' | 'cancelled';
  orderDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  total: number;
}

export const PurchaseOrders: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev, resetPage } = usePagination(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const {
    data: poResponse = { purchaseOrders: [], pagination: { page: 1, pages: 1, total: 0, limit } },
    isLoading,
  } = useQuery<{ purchaseOrders: PurchaseOrder[]; pagination: { page: number; pages: number; total: number; limit: number } }>({
    queryKey: ['purchase-orders', page, debouncedSearch],
    // Use a function that ignores the context param for react-query v4 compatibility
    queryFn: () => apiService.getPurchaseOrders({ page, limit, search: debouncedSearch }),
  });

  const purchaseOrders = Array.isArray(poResponse?.purchaseOrders) ? poResponse.purchaseOrders : [];
  const pagination = poResponse?.pagination || { page: 1, pages: 1, total: 0, limit };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'purchase-orders' });
    },
  });

  const filteredPOs = purchaseOrders;

  const generatePDF = (po: PurchaseOrder) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Purchase Order', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`PO Number: ${po.poNumber}`, 20, 50);
    doc.text(`Vendor: ${po.vendor}`, 20, 65);
    doc.text(`Status: ${po.status.toUpperCase()}`, 20, 80);
    doc.text(`Order Date: ${new Date(po.orderDate).toLocaleDateString()}`, 20, 95);
    
    // Items
    doc.text('Items:', 20, 120);
    let yPos = 135;
    
    po.items.forEach((item: PurchaseOrderItem, index: number) => {
      doc.text(`${index + 1}. ${item.productName}`, 25, yPos);
      doc.text(`   Qty: ${item.quantity} × ₹${item.unitPrice} = ₹${item.total}`, 25, yPos + 10);
      yPos += 25;
    });
    
    // Totals
    yPos += 10;
    doc.text(`Subtotal: ₹${po.subtotal.toFixed(2)}`, 20, yPos);
    doc.text(`Total: ₹${po.total.toFixed(2)}`, 20, yPos + 30);
    
    doc.save(`${po.poNumber}.pdf`);
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO({ ...po, id: po.id ?? po._id });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number | string | undefined) => {
    if (!id) {
      alert('Invalid purchase order ID');
      return;
    }
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      deleteMutation.mutate(String(id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPO(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Purchase Orders"
          subtitle="Manage your purchase orders"
          action={
            <Button
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              Create PO
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search purchase orders..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPage();
              }}
            />
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPOs.map((po) => (
                <tr key={po.id ?? po._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {po.poNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {po.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(po.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(po.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => generatePDF(po)}
                      className="text-green-600 hover:text-green-900"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(po)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const id = po.id ?? po._id;
                        if (id && window.confirm('Are you sure you want to delete this purchase order?')) {
                          deleteMutation.mutate(String(id));
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedDetailItem(po); setIsDetailModalOpen(true); }}
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

        {filteredPOs.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first purchase order.
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

      <POModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        purchaseOrder={editingPO || undefined}
      />
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedDetailItem}
        title="Purchase Order Details"
      />
    </div>
  );
};