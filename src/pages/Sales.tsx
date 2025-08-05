import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingCart, Download, Edit, Search, Receipt, Trash2, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '../hooks/useAuth';
import Switch from '../components/common/Switch';

// --- SCHEMA & TYPES ---
const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  unitType:z.string()
});

const saleSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  address: z.string().min(1, 'address is required'),
  phone: z.string().min(1, 'Phone is required'),
  ref_num: z.string().min(1, 'DB Number is required'),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  saleDate:z.string().min(1, 'Sale date is required'),
  receivedBy:z.string().min(1, 'Received by is required'),      
  remarks:z.string().optional(),
});


type SaleFormData = z.infer<typeof saleSchema>;

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: any;
}

const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose, sale }) => {
  const queryClient = useQueryClient();
  const isEditing = !!sale;
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: productsData } = useQuery<{ products: any[] }>({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts({all:true}),
  });
  const products: any[] = Array.isArray(productsData?.products) ? productsData.products : Array.isArray(productsData) ? productsData : [];

  const { data: customerResponse } = useQuery<{ customers: any[] }>({
    queryKey: ['customers'],
    queryFn: () => apiService.getCustomers({all:true}),
  });
  const customers: any[] = customerResponse?.customers || [];

  // --- PURCHASE ORDERS (DB Numbers) ---
  const { data: purchaseOrderData } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => apiService.getPurchaseOrders({ all:true }),
  });
  const purchaseOrders = purchaseOrderData?.purchaseOrders || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedCustomerName = watch('customerName');
  const watchedref_num = watch('ref_num');

  // --- AUTO-FILL address AND PHONE WHEN CUSTOMER SELECTED ---
  useEffect(() => {
    if (!watchedCustomerName || isEditing || !isInitialized) return;
    const customer = customers?.find((c: any) => c.name === watchedCustomerName);
    if (customer) {
      setValue('address', customer.address, { shouldValidate: true });
      setValue('phone', customer.phone || '', { shouldValidate: true });
    }
  }, [watchedCustomerName, customers, setValue, isEditing, isInitialized]);

  // --- AUTO-FILL ITEMS WHEN DB NUMBER SELECTED ---
  useEffect(() => {
    if (!watchedref_num || !purchaseOrders.length || isEditing || !isInitialized) return;
    const matchedPO = purchaseOrders.find((po: any) => po.ref_num === watchedref_num);
    if (matchedPO && matchedPO.items) {
      reset((prev) => ({
        ...prev,
        ref_num: matchedPO.ref_num,
        items: (matchedPO.items || []).map((item: any) => ({
          productId: String(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitType:item.unitType
        })),
      }));
    }
  }, [watchedref_num, purchaseOrders, reset, isEditing, isInitialized]);

  // --- AUTO-FILL UNIT PRICE WHEN PRODUCT CHANGES ---
  useEffect(() => {
    if (!watchedItems) return;
    watchedItems.forEach((item, idx) => {
      if (!item.productId) return;
      const product = products?.find((p: any) => String(p.id ?? p._id) === item.productId);
      if (product && (!item.unitPrice || item.unitPrice === 0)) {
        setValue(`items.${idx}.unitPrice`, product.salesRate, { shouldValidate: true });
      }
    });
  }, [watchedItems, products, setValue]);

  // --- PREFILL FORM FIELDS WHEN EDITING ---
  useEffect(() => {
    if (sale && isOpen) {
      reset({
        customerName: sale.customerName,
        address: sale.address,
        phone: sale.phone || '',
        ref_num: sale.ref_num,
        receivedBy: sale.receivedBy,
        remarks: sale.remarks,
        saleDate: sale.saleDate ? sale.saleDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        items: (sale.items || []).map((item: any) => ({
          productId: String(item.productId ?? item.id ?? item._id),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitType:item.unitType
        })),
      });
      setIsInitialized(true);
    } else if (!sale && isOpen) {
      reset({
        customerName: '',
        address: '',
        phone: '',
        ref_num: '',
        saleDate: new Date().toISOString().slice(0, 10),
        items: [{ productId: '', quantity: 1, unitPrice: 0,unitType:'' }],
      });
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [sale, isOpen, reset]);

  const createMutation = useMutation({
    mutationFn: apiService.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      onClose();
      setIsInitialized(false);
      reset({
        customerName: '',
        address: '',
        phone: '',
        ref_num: '',
        saleDate: new Date().toISOString().slice(0, 10),
        items: [{ productId: '', quantity: 1, unitPrice: 0,unitType:'' }],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiService.updateSale(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.refetchQueries({ queryKey: ['sales'] });
      onClose();
      setIsInitialized(false);
      reset({
        customerName: '',
        address: '',
        phone: '',
        ref_num: '',
        saleDate: new Date().toISOString().slice(0, 10),
        items: [{ productId: '', quantity: 1, unitPrice: 0,unitType:'' }],
      });
    },
  });

  const calculateSubtotal = () => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const onSubmit = (data: SaleFormData) => {
    const subtotal = calculateSubtotal();
    const total = subtotal;
    const saleData = {
      ...data,
      invoiceNumber: isEditing ? sale.invoiceNumber : `INV-${Date.now()}`,
      saleDate: isEditing ? sale.saleDate : new Date().toISOString(),
      items: (data.items || []).map(item => {
        const product = products?.find(p => p.id === Number(item.productId));
        return {
          ...item,
          productName: product?.name || '',
          total: item.quantity * item.unitPrice,
          unitType:item.unitType

        };
      }),
      subtotal,
      total,
      ref_num: data.ref_num,
      address: data.address,
    };
    if (isEditing) {
      updateMutation.mutate({ id: sale.id, data: saleData });
    } else {
      createMutation.mutate(saleData);
    }
  };

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();
  const total = subtotal;

  return (
    <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Delivery' : 'Create Delivery'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" >
              <SelectField<SaleFormData>
                label="DB Number"
                name="ref_num"
                options={purchaseOrders?.map((po: any) => ({
                  value: po.ref_num,
                  label: po.ref_num,
                })) || []}
                control={control}
                error={errors.ref_num}
                required
              />
                <SelectField<SaleFormData>
                  label="Customer"
                  name="customerName"
                  options={customers?.map((customer: any) => ({
                    value: customer.name,
                    label: customer.name,
                  })) || []}
                  control={control}
                  error={errors.customerName}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" >
             <FormField
                label="Address"
                name="address"
                placeholder='Address'
                type="text"
                register={register}
                error={errors.address}
                required
              />
              <FormField
                label="Phone"
                name="phone"
                placeholder='Phone'
                type="text"
                register={register}
                error={errors.phone}
                required
              />
             </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" >
           <FormField
                label="Delivery Date"
                name="saleDate"
                placeholder='Delivery Date'
                type="date"
                register={register}
                error={errors.saleDate}
                required
              />
               <FormField
                label="Received By"
                name="receivedBy"
                placeholder='Received By'
                type="text"
                register={register}
                error={errors.receivedBy}
                required
              />
           </div>

            
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
                  onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, unitType: '' })}
                >
                  Add Item
                </Button>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="md:col-span-2">
                      <SelectField<SaleFormData>
                        label="Product"
                        name={`items.${index}.productId`}
                        options={products?.map(product => ({
                          value: String(product._id ?? product._id),
                          label: `${product.name}`,
                        })) || []}
                        control={control}
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
                       <FormField
                      label="Unit Type"
                      name={`items.${index}.unitType`}
                      type="string"
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
            <div className="" >
              <FormField
              label="Remarks"
              name="remarks"
              type="textarea"
              placeholder="Enter remarks (optional)"
              register={register}
              error={errors.remarks}
            />
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
                onClick={()=>{
                  onClose()
                  setIsInitialized(false);
                  reset({
                    customerName: '',
                    address: '',
                    phone: '',
                    ref_num: '',
                    saleDate: new Date().toISOString().slice(0, 10),
                    items: [{ productId: '', quantity: 1, unitPrice: 0,unitType:'' }],
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className='gradient-btn'
                loading={createMutation.isPending || updateMutation.isPending}
              >
                  {isEditing ? 'Update Delivery' : 'Create Delivery'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Sales: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev, resetPage } = usePagination(1);
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null);
const [confirmToggleValue, setConfirmToggleValue] = useState<boolean>(false);
  const limit = 10;
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { handleSubmit, control,watch } = useForm({
    defaultValues: {
      isActive: false,
    },
  });

  const toggleIsActiveMutation = async({ id, isActive }:{id:string,isActive:boolean})=>{
    try {
        const res = await apiService.toggleSaleActiveStatus({ id, isActive })
        console.log("res",res)
            // ✅ Invalidate and refetch the sales list
    queryClient.invalidateQueries({ queryKey: ['sales'] });

    } catch (error) {
      console.log("Error",error)
    }
  }
  const isActive = watch('isActive');

  const onActiveChange = (data: any) => {
    console.log('Form Data:', data);
  };
  const {
    data: salesResponse = { sales: [], pagination: { page: 1, pages: 1, total: 0, limit } },
    isLoading,
  } = useQuery<{ sales: any[]; pagination: { page: number; pages: number; total: number; limit: number } }>({
    queryKey: ['sales', page, debouncedSearch],
    queryFn: () => apiService.getSales({ page, limit, search: debouncedSearch }),
  });

  const sales = Array.isArray(salesResponse?.sales) ? salesResponse.sales : [];
  const pagination = salesResponse?.pagination || { page: 1, pages: 1, total: 0, limit };

  const filteredSales = sales;

  const generateInvoicePDF = (sale: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('SALES INVOICE', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Invoice #: ${sale.invoiceNumber}`, 20, 50);
    doc.text(`Customer: ${sale.customerName}`, 20, 65);
    doc.text(`Email: ${sale.customerEmail}`, 20, 80);
    doc.text(`Date: ${new Date(sale.saleDate).toLocaleDateString()}`, 20, 95);
    doc.text(`Status: ${sale.status.toUpperCase()}`, 20, 110);
    
    // Items
    doc.text('Items:', 20, 135);
    let yPos = 150;
    
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach((item: any, index: number) => {
        doc.text(`${index + 1}. ${item.productName}`, 25, yPos);
        doc.text(`   Qty: ${item.quantity} × ₹${item.unitPrice} = ₹${item.total}`, 25, yPos + 10);
        yPos += 25;
      });
    }
    
    // Totals
    yPos += 10;
    doc.text(`Subtotal: ₹${sale.subtotal.toFixed(2)}`, 20, yPos);
    doc.text(`Total: ₹${sale.total.toFixed(2)}`, 20, yPos + 30);
    
    doc.save(`${sale.invoiceNumber}.pdf`);
  };

  const handleEdit = (sale: any) => {
    setEditingSale({ ...sale, id: sale.id ?? sale._id });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`Sites`}
          subtitle="Manage your sites transactions"
          action={
            <Button
              icon={Plus}
              className='gradient-btn'
              onClick={() => setIsModalOpen(true)}
            >
              Create Delivery
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search sales..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPage();
              }}
            />
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                {
                  isAdmin() && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Site Status
                  </th>
                  )
                }
            
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* <Receipt className="h-5 w-5 text-gray-400 mr-3" /> */}
                      <span className={`px-2 py-1 text-sm  font-medium rounded-full ${getStatusColor('delivered')}`}>
                        {sale.invoiceNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sale.customerName}</div>
                    {/* <div className="text-sm text-gray-500">{sale.customerEmail}</div> */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </td>
                  {
                    isAdmin() && (  <td className="px-6 py-4 whitespace-nowrap">
                      {/* <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span> */}
                      {/* Add swtich when isActive is true show active else show inactive */}
                      <Switch
                      name={`isActive-${sale._id}`}
                      checked={sale.isActive}
                      label={sale.isActive ? 'Active' : 'Inactive'}
                      onChange={(val) => {
                        setConfirmToggleId(sale._id);
                        setConfirmToggleValue(val);
                      }}
                    
                    />
                    </td>)
                  }
                
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* <button
                      onClick={() => generateInvoicePDF(sale)}
                      className="text-green-600 hover:text-green-900"
                      title="Download Invoice"
                    >
                      <Download size={20} />
                    </button> */}
                    {isAdmin() && (
                      <button
                        onClick={() => handleEdit(sale)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/site/${sale._id || sale.id}`)}
                      className="text-gray-600 hover:text-gray-900"
                      title="View Details"
                    >
                      <Eye size={20} />
                    </button>
                    {isAdmin() && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this sale?')) {
                            deleteMutation.mutate(sale._id);
                          }
                        }}
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

        {filteredSales.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first delivery.
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

      <SaleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sale={editingSale}
      />
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedDetailItem}
        title="Sale Details"
      />
      {confirmToggleId && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Are you sure you want to {confirmToggleValue ? 'activate' : 'deactivate'} this site?
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        This will mark the site as {confirmToggleValue ? 'active' : 'inactive'} in the system.
      </p>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setConfirmToggleId(null)}
        >
          Cancel
        </Button>
        <Button
          className="gradient-btn"
          onClick={() =>{
            toggleIsActiveMutation({id:confirmToggleId,isActive:confirmToggleValue})
            setConfirmToggleId(null)
          }


          }
        >
          Yes, {confirmToggleValue ? 'Activate' : 'Deactivate'}
        </Button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};