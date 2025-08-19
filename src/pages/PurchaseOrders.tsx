import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Building, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, DollarSign, Download, Edit, ExternalLink, Eye, FileText, Filter, Fullscreen, Hash, LayoutGrid, LayoutList, LockIcon, Paperclip, Plus, RefreshCcw, Search, SortAsc, Trash2, X } from 'lucide-react';
import Select from "react-select"
import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormField } from '../components/forms/FormField';
import { SelectField } from '../components/forms/SelectField';
import { PODetailModal } from '../components/PO/PODetailModal';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { apiService } from '../services/api';
import { Product, Purposes, Supplier } from '../types';
import { formatCurrency, getStatusColor } from '../utils/constants';
import { generatePDF } from '../utils/pdf';
import ReloadButton from '../components/common/ReloadButton';
import { ReusableDeleteModal } from '../components/modals/ReusableDeleteModal';

// Define error types
interface ApiError {
  response?: {
    data?: {
      message?: string
      errors?: Array<{
        msg: string
        path: string
        type: string
        value: string
      }>
    }
  }
  message?: string
}

// Item schema
export const purchaseOrderSchema = z.object({
  ref_num: z.string().min(1, 'DB Number is required'),
  vendor: z.string().min(1, 'Supplier is required'),
  customer: z.string().min(1, 'Client is required'),
  customerName: z.string().optional(),
  siteType: z.string().min(1, 'Site Type is required').default("Site"),
  status: z.enum(['draft', 'pending', 'approved', 'delivered', 'cancelled']),
  attachment: z.union([z.instanceof(File), z.string(), z.null()]).optional(),
  remarks: z.union([
    z.string().max(1000, 'Remarks cannot exceed 1000 characters'),
    z.literal(''),
    z.null(),
  ]).optional(),
  site_incharge: z.string().optional(),
  orderedBy: z.string().optional(),
  deliveryDate: z.string().optional(),
  contractor: z.string().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      quantity: z.coerce
        .number()
        .min(1, 'Quantity must be at least 1')
        .refine(val => Number.isFinite(val), { message: 'Quantity must be a valid number' }),
      unitPrice: z.coerce.number().min(0, 'Unit price must be a number'),
      unitType: z.string().min(1, 'Unit type is required'),
    })
  ).min(1, 'At least one item is required'),
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

  // Add state for server-side error
  const [serverError, setServerError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [customerAddress, setCustomerAddress] = useState("")
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts({ all: true }),
    refetchOnMount: true, // Add this line

  });
  const products: Product[] = Array.isArray(productsData?.products) ? productsData.products : Array.isArray(productsData) ? productsData : [];
  // console.log(products);
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apiService.getSuppliers({ all: true }),
    refetchOnMount: true, // Add this line

  });
  const { data: customerResponse } = useQuery<{ customers: any[] }>({
    queryKey: ['customers'],
    queryFn: () => apiService.getCustomers({ all: true }),
  });
  const customers: any[] = customerResponse?.customers || [];
  const suppliers: { vendors?: Supplier[] } = suppliersData || {};
  const { data: purposesData } = useQuery({
    queryKey: ['purposes'],
    queryFn: () => apiService.getAllPurposes({ all: true }),
    refetchOnMount: true, // Add this line

  });
  const purposes: { purposes?: Purposes[] } = purposesData || {};
  console.log("purposesData", purposesData)

  // Fix defaultValues to ensure items are always of the correct type (productId: number)
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: purchaseOrder
      ? {
        ref_num: purchaseOrder.ref_num || '',
        attachment: purchaseOrder.attachment || '',
        vendor: purchaseOrder.vendor || '',
        customer: purchaseOrder.customer || '',
        customerName: purchaseOrder.customerName || '',
        siteType: purchaseOrder.siteType || '',
        status: purchaseOrder.status || 'draft',
        deliveryDate: purchaseOrder.deliveryDate || '',
        orderedBy: purchaseOrder.orderedBy || '',
        remarks: purchaseOrder.remarks || '',
        site_incharge: purchaseOrder.site_incharge || '',
        purpose: purchaseOrder.purpose || '',
        contractor: purchaseOrder.contractor || '',
        items: purchaseOrder.items.map((item: PurchaseOrderItem) => ({
          productId: String(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitType: item.unitType,
        })) || [],
      }
      : {
        ref_num: '',
        attachment: '',
        vendor: '',
        customer: '',
        customerName: '',
        siteType: 'Site',
        status: 'draft',
        remarks: '',
        site_incharge: '',
        purpose: '',
        orderedBy: '',
        deliveryDate: '',
        contractor: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0, unitType: '' }],
      },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  // Add useEffect to autofill unitPrice when productId changes
  useEffect(() => {
    watchedItems.forEach((item, idx) => {
      if (item.productId) {
        const product = products.find((p: Product) => p._id === item.productId);
        if (product) {
          setValue(`items.${idx}.unitPrice`, product.purchaseRate);
          setValue(`items.${idx}.unitType`, product.unitType); // <-- Add this
        }
      }
    });
  }, [watchedItems.map(i => i.productId).join(','), products, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiService.createPurchaseOrder(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setServerError(null);
      onClose();
      reset();
    },
    onError: (error: ApiError) => {
      console.error('Create PO error:', error);
      let msg = error?.response?.data?.message || error?.message || 'Failed to create purchase order';

      // Handle validation errors more specifically
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err) => `${err.msg} (${err.path})`).join('\n');
        msg = `Validation failed:\n${errorMessages}`;
      }

      setServerError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      apiService.updatePurchaseOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setServerError(null);
      onClose();
      reset();
    },
    onError: (error: ApiError) => {
      console.error('Update PO error:', error);
      let msg = error?.response?.data?.message || error?.message || 'Failed to update purchase order';

      // Handle validation errors more specifically
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err) => `${err.msg} (${err.path})`).join('\n');
        msg = `Validation failed:\n${errorMessages}`;
      }

      setServerError(msg);
    },
  });

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  console.log('attachment:', attachment);
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });



  // Prefill form fields when editing a purchase order
  const onSubmit = async (data: PurchaseOrderFormData) => {
    const subtotal = calculateSubtotal();
    const total = subtotal;

    const itemsData = data.items.map((item) => {
      const product = products.find((p) => p._id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitType: item.unitType,
        total: item.quantity * item.unitPrice,
      };
    });

    const formData = new FormData();

    formData.append('ref_num', data.ref_num);
    formData.append('vendor', data.vendor);
    formData.append('customer', data.customer);
    formData.append('customerAddress', customerAddress || '');
    formData.append('siteType', data.siteType);
    formData.append('status', data.status);
    formData.append('subtotal', subtotal.toString());
    formData.append('total', total.toString());
    formData.append('remarks', data.remarks || '');
    formData.append('site_incharge', data.site_incharge || '');
    formData.append('contractor', data.contractor || '');
    formData.append('orderedBy', data.orderedBy || '');
    formData.append('deliveryDate', data.deliveryDate || '');
    formData.append('purpose', data.purpose || '');

    if (attachment instanceof File) {
      formData.append('attachment', attachment); // 🖼️ Send as file
    }

    formData.append('items', JSON.stringify(itemsData));

    if (isEditing) {
      const id = String(purchaseOrder.id ?? purchaseOrder._id);
      if (!id) {
        alert("Invalid purchase order ID");
        return;
      }
      updateMutation.mutate({ id, data: formData });
    } else {
      formData.append('poNumber', `PO-${Date.now()}`);
      formData.append('orderDate', new Date().toISOString());
      createMutation.mutate(formData);
    }
  };

  const selectedCustomerId = watch('customer');

  useEffect(() => {
    if (selectedCustomerId) {
      const selectedCustomer = customers.find(c => c._id === selectedCustomerId);
      if (selectedCustomer) {
        setCustomerAddress(selectedCustomer.address)
        setValue('customerAddress', selectedCustomer.address || '');
      }
    } else {
      setValue('customerAddress', '');
      setCustomerAddress("")
    }
  }, [selectedCustomerId, customers, setValue]);

  useEffect(() => {
    if (purchaseOrder) {
      console.log('Prefilling form with purchase order:', purchaseOrder);

      // If editing and there's an existing attachment
      if (purchaseOrder.attachment) {
        console.log('Existing attachment found:', purchaseOrder.attachment);
        // Set the attachment value for validation - use the actual string value
        setValue('attachment', purchaseOrder.attachment);
        // We don't need a new file upload since we're using the existing one
        setAttachment(null);
      } else {
        console.log('No existing attachment found');
        setValue('attachment', null);
        setAttachment(null);
      }
      // auto filled data in update modal
      // Reset the form with the purchase order data
      reset({
        ref_num: purchaseOrder.ref_num || '',
        attachment: purchaseOrder.attachment || null, // Use null instead of empty string for no attachment
        vendor: purchaseOrder.vendor,
        customer: purchaseOrder.customer,
        siteType: purchaseOrder.siteType,
        status: purchaseOrder.status,
        remarks: purchaseOrder.remarks,
        site_incharge: purchaseOrder.site_incharge,
        contractor: purchaseOrder.contractor,
        orderedBy: purchaseOrder.orderedBy,
        deliveryDate: purchaseOrder.deliveryDate,
        purpose: purchaseOrder.purpose,
        items: purchaseOrder.items.map((item: PurchaseOrderItem) => ({
          productId: String(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitType: item.unitType
        })),
      });
    } else {
      console.log('Creating new purchase order');
      // Clear the form for a new purchase order
      reset({
        ref_num: '',
        attachment: null, // Use null instead of empty string for no attachment
        vendor: '',
        customer: '',
        siteType: 'Site',
        status: 'draft',
        remarks: '',
        site_incharge: '',
        contractor: '',
        orderedBy: '',
        deliveryDate: '',
        purpose: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      });
      setValue('attachment', null);
      setAttachment(null);
    }
  }, [purchaseOrder, reset, setValue]);

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();
  const total = subtotal;

  return (
    <div style={{ marginTop: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center backdrop-blur-sm justify-center p-4 z-50">

      <div className="bg-white rounded-lg relative max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <header className="py-3 px-6 flex items-center justify-between bg-slate-100 fixed max-w-4xl w-full rounded-lg z-50 ">
          <h2 className="text-xl font-semibold text-gray-900 ">
            {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h2>
          <button
            onClick={onClose}
            className=" text-white bg-black/30 hover:bg-black/50 rounded-full p-2 z-50"
          >
            <X className="h-6 w-6" />
          </button>
        </header>
        <div className="p-6 pt-20">


          {serverError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" encType='multipart/form-data'>
            <div>

            </div>
            {/* DB Number and Attachment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="DB Number"
                name="ref_num"
                placeholder='DB Number e.g number/page'
                type="text"
                register={register}
                error={errors.ref_num}
                required
              />
              <Controller
                name="attachment"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Attachment</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"

                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAttachment(file);
                          setValue('attachment', 'file-selected', { shouldValidate: true });
                        } else {
                          setAttachment(null);
                          setValue('attachment', null, { shouldValidate: true });
                        }
                      }}
                    />
                    {errors.attachment && (
                      <p className="text-sm text-red-600">{errors.attachment.message}</p>
                    )}
                  </div>
                )}
              />

            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField<PurchaseOrderFormData>
                label="Supplier"
                name="vendor"
                options={suppliers?.vendors?.map((supplier: Supplier) => ({
                  value: supplier.name,
                  label: supplier.name,
                })) || []}
                control={control}
                error={errors.vendor}
                required
              />
              <SelectField<PurchaseOrderFormData>
                label="Client"
                name="customer"
                options={customers?.map((customer: any) => ({
                  value: customer._id,  // ✅ use id
                  label: customer.name,
                })) || []}
                control={control}
                error={errors.customer}
                required
              />
              <FormField
                label="Client Address"
                name="customerAddress"
                placeholder="Client address will autofill"
                type="text"
                register={register}
                disabled
              />
              <SelectField<PurchaseOrderFormData>
                label="Status"
                name="status"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                control={control}
                error={errors.status}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


              {/* Site/Unit radio buttons */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Site/Unit <span className="text-red-500 ml-1">*</span></label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="Site"
                      required
                      {...register('siteType')}
                      defaultChecked
                      className="text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    Site
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="Unit"
                      required
                      {...register('siteType')}
                      className="text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    Unit
                  </label>
                </div>
                {errors.siteType && (
                  <p className="text-sm text-red-600">{errors.siteType.message}</p>
                )}
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
                  className='gradient-btn text-white'
                  icon={Plus}
                  onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, unitType: 'nos' })} // Default productId is ''
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="md:col-span-2">
                      <SelectField<PurchaseOrderFormData>
                        label="Product"
                        name={`items.${index}.productId`}
                        options={[
                          { value: '', label: 'Select a product' },
                          ...products.map((product: Product) => ({
                            value: product._id,
                            label: `${product.name} - (${product.unitType})`,
                          }))
                        ]}
                        control={control}
                        error={errors.items?.[index]?.productId}
                        required
                      />
                    </div>

                    <FormField
                      label="Quantity"
                      name={`items.${index}.quantity`}
                      type="number"
                      min={1}
                      register={register}
                      error={errors.items?.[index]?.quantity}
                      required
                    />

                    <FormField
                      label="Unit Price"
                      name={`items.${index}.unitPrice`}
                      type="number"
                      register={register}
                      disabled={true}
                      error={errors.items?.[index]?.unitPrice}
                      required
                    />

                    <FormField
                      label="Unit Type"
                      placeholder='Nos'
                      name={`items.${index}.unitType`}
                      type="text"
                      register={register}
                      // readOnly
                      disabled={true}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

                <FormField
                  label="Site Incharge"
                  name="site_incharge"
                  placeholder="Enter Site Incharge Name"
                  type="text"
                  register={register}
                  required
                  error={errors.site_incharge}
                />
                <FormField
                  label="Contractor"
                  name="contractor"
                  placeholder="Enter Contractor Name"
                  type="text"
                  register={register}
                  required
                  error={errors.contractor}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

                <FormField
                  label="Ordered By"
                  name="orderedBy"
                  placeholder="Ordered By"
                  type="text"
                  required
                  register={register}
                  error={errors.orderedBy}
                />
                <FormField
                  label="Delivery Date"
                  name="deliveryDate"
                  placeholder="Delivery Date"
                  type="date"
                  register={register}
                  error={errors.deliveryDate}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
                <SelectField<PurchaseOrderFormData>
                  label="Purpose"
                  name="purpose"
                  options={purposesData.purposes?.map((purpose: Purposes) => ({
                    value: purpose.title,
                    label: purpose.title,
                  })) || []}
                  required
                  control={control}
                  error={errors.purpose}
                />
                <FormField
                  label="Remarks"
                  name="remarks"
                  type="textarea"
                  placeholder="Enter remarks (optional)"
                  register={register}
                  error={errors.remarks}
                />
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
                className='gradient-btn'
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
interface PurchaseOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  productName?: string;
  total?: number;
  unitType?: string
}

export interface PurchaseOrder {
  id?: string;
  _id?: string;
  ref_num: string;
  attachment?: string;
  poNumber: string;
  vendor: string;
  siteType?: string;
  customer?: string;
  customerName?: string;
  status: 'draft' | 'approved' | 'delivered' | 'cancelled';
  orderDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  total: number;
  isDeleted?: boolean;
  ref_no: string;
  remarks?: string;
  site_incharge?: string;
  isPurchasedCreated?: boolean;
  contractor?: string;
  deliveryDate?: string;
  orderedBy?: string;
  purpose?: string
}

export const PurchaseOrders: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<string>('orderDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();
  const [selectedDetailItem, setSelectedDetailItem] = useState<PurchaseOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev, resetPage } = usePagination(1);
  const [DBNum, setDBNum] = useState({
    lable: "",
    value: ""
  })
  const limit = 10;
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState<PurchaseOrder | null>(null);

  const {
    data: poResponse = { purchaseOrders: [], pagination: { page: 1, pages: 1, total: 0, limit } },
    isLoading,
    refetch,
  } = useQuery<{ purchaseOrders: PurchaseOrder[]; pagination: { page: number; pages: number; total: number; limit: number } }>({
    queryKey: ['purchase-orders', debouncedSearch],
    queryFn: () => apiService.getPurchaseOrders({
      page: 1,
      limit: 10, // Get all data for client-side sorting
      search: debouncedSearch,
      all: false // Use the all flag to get all records
    }),
    refetchOnMount: true,
  });

  const {
    data: allPOData,
  } = useQuery<{ purchaseOrders: PurchaseOrder[] }>({
    queryKey: ['purchase-orders-all',],
    queryFn: () => apiService.getPurchaseOrders({
      page: 1,
      limit: 10, // Get all data for client-side sorting
      search: debouncedSearch,
      all: true // Use the all flag to get all records
    }),
    refetchOnMount: true,
  });

  console.log("allPOData", allPOData)

  const optionPO = allPOData?.purchaseOrders?.map((item, index) => {
    return {
      label: item.ref_num,
      value: item.ref_num,
    }
  })
  const filteredPurchaseOrders = poResponse?.purchaseOrders.filter((po: PurchaseOrder) => po.isDeleted === false || po.isDeleted !== undefined);
  const allPurchaseOrders = Array.isArray(filteredPurchaseOrders) ? filteredPurchaseOrders : [];

  // Client-side sorting
  const sortedPurchaseOrders = [...allPurchaseOrders].sort((a, b) => {
    let aValue: any = a[sortBy as keyof PurchaseOrder];
    let bValue: any = b[sortBy as keyof PurchaseOrder];

    // Handle different data types
    if (sortBy === 'orderDate') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortBy === 'total') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    } else if (sortBy === 'ref_num') {
      // Handle numeric sorting for ref_num
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    } else {
      // String sorting (case insensitive)
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Client-side pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const purchaseOrders = sortedPurchaseOrders.slice(startIndex, endIndex);

  // Update pagination object for client-side pagination
  const totalItems = sortedPurchaseOrders.length;
  const totalPages = Math.ceil(totalItems / limit);
  const pagination = {
    page,
    pages: totalPages,
    total: totalItems,
    limit
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'], exact: false });
      setIsDeleteModalOpen(false);
      setPurchaseOrderToDelete(null);
    },
    onError: (error: unknown) => {
      console.error('Delete error:', error);
      // You can add toast notification here instead of alert
    }
  });

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO({ ...po, id: po.id ?? po._id });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (po: PurchaseOrder) => {
    setPurchaseOrderToDelete(po);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (purchaseOrderToDelete) {
      const id = purchaseOrderToDelete.id ?? purchaseOrderToDelete._id;
      if (!id) {
        alert('Invalid purchase order ID');
        return;
      }
      deleteMutation.mutate(String(id));
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setPurchaseOrderToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPO(null);
    setServerError(null);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc order
      setSortBy(field);
      setSortOrder('desc');
    }
    resetPage(); // Reset to first page when sorting
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown size={14} className="text-gray-400 group-hover:text-gray-600" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp size={14} className="text-blue-600" />
      : <ArrowDown size={14} className="text-blue-600" />;
  };

  const SortableHeader = ({ field, children, className = "" }: {
    field: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`px-6 py-4 text-left flex-1 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150 group ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {getSortIcon(field)}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 text-sm">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  const ActionButton = ({ onClick, icon: Icon, label, variant = "default", disabled = false }: {
    onClick: () => void;
    icon: any;
    label: string;
    variant?: "default" | "danger" | "success" | "info";
    disabled?: boolean;
  }) => {
    const variants = {
      default: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
      danger: "text-red-600 hover:text-red-900 hover:bg-red-50",
      success: "text-green-600 hover:text-green-900 hover:bg-green-50",
      info: "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
    };

    return (
      <div className="relative group">
        <button
          onClick={onClick}
          disabled={disabled}
          className={`p-2 rounded-lg transition-all duration-200 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={label}
        >
          <Icon size={18} />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
          {label}
        </div>
      </div>
    );
  };

  const PurchaseOrderCard = ({ po }: { po: PurchaseOrder }) => (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200  group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{po.ref_num || '--'}</h3>
              {/* <p className="text-sm text-gray-500">#{po.ref_num || '--'}</p> */}
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
            {po.status}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Supplier</span>
            <span className="text-sm font-medium text-gray-900">{po.vendor}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Order Date</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(po.orderDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(po.total)}</span>
          </div>
        </div>

        {/* Attachment */}
        {po.attachment && (
          <div className="mb-4">
            <a
              href={po.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors duration-200"
            >
              <Paperclip size={16} />
              View Attachment
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-1">
            {po.attachment && (
              <ActionButton
                onClick={() => generatePDF(po)}
                icon={Download}
                label="Download PDF"
                variant="success"
              />
            )}
            <ActionButton
              onClick={() => navigate(`/purchase-orders/${po._id}`)}
              icon={Eye}
              label="View Details"
              variant="info"
            />
            <ActionButton
              onClick={() => { setSelectedDetailItem(po); setIsDetailModalOpen(true); }}
              icon={Fullscreen}
              label="Preview"
            />
          </div>

          {isAdmin() && !po.isPurchasedCreated && (
            <div className="flex space-x-1">
              <ActionButton
                onClick={() => handleEdit(po)}
                icon={Edit}
                label="Edit"
                variant="info"
              />
              <ActionButton
                onClick={() => handleDeleteClick(po)}
                icon={Trash2}
                label="Delete"
                variant="danger"
              />
            </div>
          )}

          {po.isPurchasedCreated && (
            <ActionButton
              onClick={() => { }}
              icon={LockIcon}
              label="Locked"
              variant="danger"
              disabled
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Floating Refresh Button */}
      <ReloadButton isLoading={isLoading} refetch={refetch} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-gray-600 mt-1">Manage and track your purchase orders</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                icon={Plus}
                className="gradient-btn hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => { setIsModalOpen(true); setServerError(null); }}
              >
                Create PO
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="search"
                  placeholder="Search by PO number, supplier, or status..."
                  className="pl-11 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    resetPage();
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card>
          {viewMode === 'table' ? (
            // Table View
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={`px-6 py-4 text-left flex-1 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150 group `}>
                        <div className="flex items-center gap-2">
                          DB Num
                        </div>
                      </th>

                      <SortableHeader field="poNumber">
                        <div className="flex items-center gap-2">
                          PO Number
                        </div>
                      </SortableHeader>
                      <SortableHeader field="vendor" className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          Supplier
                        </div>
                      </SortableHeader>
                      <SortableHeader field="status">
                        Status
                      </SortableHeader>
                      <SortableHeader field="orderDate" className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          Order Date
                        </div>
                      </SortableHeader>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          Files
                        </div>
                      </th>
                      <SortableHeader field="total">
                        <div className="flex items-center gap-2">
                          Total
                        </div>
                      </SortableHeader>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseOrders.map((po) => (
                      <tr key={po.id ?? po._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                            {po.ref_num || '--'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-semibold text-gray-900">
                              {po.poNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                          {po.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          {po.attachment && (
                            <a
                              href={po.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors duration-200"
                            >
                              <ExternalLink size={12} />
                              File
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(po.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <ActionButton
                              onClick={() => generatePDF(po)}
                              icon={Download}
                              label="Download PDF"
                              variant="success"
                            />
                            <ActionButton
                              onClick={() => navigate(`/purchase-orders/${po._id}`)}
                              icon={Eye}
                              label="View Details"
                              variant="info"
                            />
                            <ActionButton
                              onClick={() => { setSelectedDetailItem(po); setIsDetailModalOpen(true); }}
                              icon={Fullscreen}
                              label="Preview"
                            />
                            {isAdmin() && !po.isPurchasedCreated && (
                              <>
                                <ActionButton
                                  onClick={() => handleEdit(po)}
                                  icon={Edit}
                                  label="Edit"
                                  variant="info"
                                />
                                <ActionButton
                                  onClick={() => handleDeleteClick(po)}
                                  icon={Trash2}
                                  label="Delete"
                                  variant="danger"
                                />
                              </>
                            )}
                            {po.isPurchasedCreated && (
                              <ActionButton
                                onClick={() => { }}
                                icon={LockIcon}
                                label="Locked"
                                variant="danger"
                                disabled
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Grid View
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {purchaseOrders.map((po) => (
                  <PurchaseOrderCard key={po.id ?? po._id} po={po} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {purchaseOrders.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms or create a new purchase order."
                  : "Get started by creating your first purchase order to track your procurement."}
              </p>
              <Button
                icon={Plus}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg"
                onClick={() => { setIsModalOpen(true); setServerError(null); }}
              >
                Create Your First PO
              </Button>
            </div>
          )}

          {/* Pagination */}
          {purchaseOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pagination.page <= 1}
                    onClick={handlePrev}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </Button>

                  <div className="hidden sm:flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {/* Handle page click */ }}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${pageNum === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handleNext(pagination)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <POModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        purchaseOrder={editingPO || undefined}
      />
      <PODetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedDetailItem}
        title="Purchase Order Details"
      />

      {/* Reusable Delete Modal */}
      <ReusableDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Order"
        message="Are you sure you want to delete"
        itemName={purchaseOrderToDelete?.ref_num}
        isDeleting={deleteMutation.isPending}
        confirmText="Delete Purchase Order"
        extraInfo='This item will be move to Recycle Bin.'
      />
    </div>
  );
};