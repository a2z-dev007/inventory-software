import React, { useState, useEffect, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Download, Edit, Trash2, Search } from 'lucide-react';
import { useForm, useFieldArray, FieldError, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import jsPDF from 'jspdf';
import { apiService } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormField } from '../components/forms/FormField';
import { SelectField } from '../components/forms/SelectField';
import { formatCurrency, formatINRCurrency, getBase64 } from '../utils/constants';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { DetailModal } from '../components/common/DetailModal';
import { Product, Purposes, Supplier } from '../types';
import { Badge } from '../components/common/Badge';
import autoTable from 'jspdf-autotable';
import logo from '../assets/images/logo.png'; // static image import
import { format } from 'date-fns/format';
import { useAuth } from '../hooks/useAuth';
// Define error types
interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{
        msg: string;
        path: string;
        type: string;
        value: string;
      }>;
    };
  };
  message?: string;
}

// Item schema is defined inline in the purchaseOrderSchema below

export const purchaseOrderSchema = z.object({
  ref_num: z.string().min(1, 'DB Number is required'),
  vendor: z.string().min(1, 'Supplier is required'),
  status: z.enum(['draft', 'pending', 'approved', 'delivered', 'cancelled']),
  attachment: z.any().optional(),
  remarks: z.string().max(1000, 'Remarks cannot exceed 1000 characters').optional(),
  site_incharge: z.string().optional(),
  orderedBy:z.string().optional(),
  deliveryDate:z.string().optional(),
  contractor: z.string().optional(),
  purpose: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
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

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts({limit:1000}),
  });
  const products: Product[] = Array.isArray(productsData?.products) ? productsData.products : Array.isArray(productsData) ? productsData : [];
  // console.log(products);
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apiService.getSuppliers({}),
  });
  const suppliers: { vendors?: Supplier[] } = suppliersData || {};
  const { data: purposesData } = useQuery({
    queryKey: ['purposes'],
    queryFn: () => apiService.getAllPurposes({limit:100}),
  });
  const purposes: { purposes?: Purposes[] } = purposesData || {};
  console.log("purposesData",purposesData)

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
    <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h2>

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
                placeholder='Enter DB Number'
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
  status: 'draft' | 'approved' | 'delivered' | 'cancelled';
  orderDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  total: number;
  ref_no: string;
  remarks?: string;
  site_incharge?: string;
  contractor?: string;
  deliveryDate?: string;
  orderedBy?: string;
  purpose?: string
}

export const PurchaseOrders: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<PurchaseOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev, resetPage } = usePagination(1);
  const limit = 10;
  const queryClient = useQueryClient();
  // State for server-side error
  const [serverError, setServerError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

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
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'], exact: false });
    },
  });

  const filteredPOs = purchaseOrders;

  // const generatePDF = (po: PurchaseOrder) => {
  //   const doc = new jsPDF();

  //   // Header
  //   doc.setFontSize(20);
  //   doc.text('Purchase Order', 20, 30);

  //   doc.setFontSize(12);
  //   doc.text(`PO Number: ${po.poNumber}`, 20, 50);
  //   doc.text(`Vendor: ${po.vendor}`, 20, 65);
  //   doc.text(`Status: ${po.status.toUpperCase()}`, 20, 80);
  //   doc.text(`Order Date: ${new Date(po.orderDate).toLocaleDateString()}`, 20, 95);

  //   // Items
  //   doc.text('Items:', 20, 120);
  //   let yPos = 135;

  //   po.items.forEach((item: PurchaseOrderItem, index: number) => {
  //     doc.text(`${index + 1}. ${item.productName}`, 25, yPos);
  //     doc.text(`   Qty: ${item.quantity} × ₹${item.unitPrice} = ₹${item.total}`, 25, yPos + 10);
  //     yPos += 25;
  //   });

  //   // Totals
  //   yPos += 10;
  //   doc.text(`Subtotal: ₹${po.subtotal.toFixed(2)}`, 20, yPos);
  //   doc.text(`Total: ₹${po.total.toFixed(2)}`, 20, yPos + 30);

  //   doc.save(`${po.poNumber}.pdf`);
  // };


  // generating the pdf🧮 
   const generatePDF = async (po) => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  
    const base64Logo = await getBase64(logo);
  
    // === Styling ===
    const labelStyle = () => doc.setTextColor(0, 0, 0).setFont('helvetica', 'bold').setFontSize(11);
    const valueStyle = () => doc.setTextColor(80, 80, 80).setFont('helvetica', 'normal');
  
    const marginLeft = 20;
    const marginRight = 190;
    let y = 20;
  
    // === Header: Logo + Company Info ===
    doc.addImage(base64Logo, 'PNG', marginLeft, y, 30, 20);
  
    doc.setFontSize(14).setFont('helvetica', 'bold');
    doc.text('SPACE WINGS PVT. LTD', marginLeft + 35, y + 8);
    doc.text('PURCHASE ORDER (PO)', marginRight, y + 8, { align: 'right' });
  
    doc.setFontSize(10).setFont('helvetica', 'normal');
    doc.text('Contact - +91-7897391111  Email - Team@spacewings.com', 105, y + 18, { align: 'center' });
    doc.text('1/7, Vishwas Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010', 105, y + 24, { align: 'center' });
    // add devider with margin bottom
    // doc.line(marginLeft, y + 20, marginRight, y + 20);
    // add space below

    y = y + 32;
  
    // === Info Block ===
    labelStyle(); doc.text('PO Number:', marginLeft, y);
    valueStyle(); doc.text(po.poNumber, marginLeft + 35, y);
  
    labelStyle(); doc.text('Date:', 140, y);
    valueStyle(); doc.text(format(new Date(po.orderDate), 'yyyy-MM-dd'), 160, y);
  
    y += 8;
    labelStyle(); doc.text('Client Name:', marginLeft, y);
    valueStyle(); doc.text(po.clientName || po.vendor || '-', marginLeft + 35, y);
  
   
  
    y += 8;
    labelStyle(); doc.text('Status:', marginLeft, y);
    valueStyle(); doc.text(po.status.toUpperCase(), marginLeft + 35, y);
  
    labelStyle(); doc.text('DB No:', 140, y);
    valueStyle(); doc.text(po.ref_num || '-', 160, y);
  
    y += 8;
    labelStyle(); doc.text('Site Incharge:', marginLeft, y);
    valueStyle(); doc.text(po.site_incharge || '-', marginLeft + 35, y);
  
    labelStyle(); doc.text('Contractor :  ', 140, y);
    valueStyle(); doc.text(po.contractor || '-',164, y);
  
    // === Items Table ===
    autoTable(doc, {
      startY: y + 12,
      margin: { left: marginLeft, right: 20 },
      head: [['Item Name', 'Unit Type', 'Quantity', 'Rate (INR)', 'Total Amount (INR)']],
      body: po.items.map((item) => [
        item.productName,
        item.unitType || '-',
        item.quantity,
        item.unitPrice.toLocaleString(),
        item.total.toLocaleString(),
      ]),
      styles: {
        fontSize: 10,
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [38, 0, 84],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      bodyStyles: {
        textColor: [40, 40, 40],
        
      },
    });
  
    const finalY = doc.lastAutoTable.finalY || 120;
  
    // === Totals Section ===
    // labelStyle(); doc.text('Subtotal:', marginLeft + 30, finalY + 10);
    // valueStyle(); doc.text(`₹ ${formatINRCurrency(po.subtotal, { withSymbol: false, fraction: false })}`, marginLeft + 30, finalY + 10, { align: 'right' });
  
    // labelStyle(); doc.text('Total:', marginLeft + 30, finalY + 18);
    // valueStyle(); doc.text(`₹ ${formatINRCurrency(po.total, { withSymbol: false, fraction: false })}`, marginLeft + 30, finalY + 18, { align: 'right' });
  
    // === Footer Details ===
    labelStyle(); doc.text('Ordered By:', marginLeft, finalY + 30);
    valueStyle(); doc.text(po.orderedBy || '-', marginLeft + 30, finalY + 30);
  
    labelStyle(); doc.text('Delivery Date:', marginLeft, finalY + 38);
    valueStyle(); doc.text(format(new Date(po.deliveryDate), 'yyyy-MM-dd'), marginLeft + 30, finalY + 38);
    
    labelStyle(); doc.text('Purpose:', marginLeft, finalY + 48);
    valueStyle(); doc.text(po.purpose || '-', marginLeft + 30, finalY + 48);
    if (po.remarks) {
      labelStyle(); doc.text('Remarks:', marginLeft, finalY + 60);
      valueStyle(); doc.text(po.remarks, marginLeft, finalY + 70, { maxWidth: 170 });
    }
  
    // === Save File ===
    doc.save(`${po.poNumber}_Purchase_Order.pdf`);
  };
  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO({ ...po, id: po.id ?? po._id });
    setIsModalOpen(true);
  };

  // Function to handle deletion of purchase orders
  const handleDelete = (id: string | undefined) => {
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
    setServerError(null);
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
              className='gradient-btn'
              onClick={() => { setIsModalOpen(true); setServerError(null); }}
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
                  DB Num
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
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
                      {/* <FileText className="h-5 w-5 text-gray-400 mr-3" /> */}
                      {/* <Badge variant="green" bordered size="sm" radius="full"> {po.ref_num || '--'}</Badge> */}
                      <span className={`px-2 py-1 text-sm  font-medium rounded-md ${getStatusColor('delivered')}`}>
                        {po.ref_num || '--'}
                      </span>
                    </div>
                  </td>
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
                    <div className="flex space-x-2">
                      <div className="relative group">
                        <button
                          onClick={() => generatePDF(po)}
                          className="text-green-600 hover:text-green-900"
                          aria-label="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <span className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">Download PDF</span>
                      </div>
                      {isAdmin() && (
                        <div className="relative group">
                          <button
                            onClick={() => handleEdit(po)}
                            className="text-blue-600 hover:text-blue-900"
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <span className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">Edit</span>
                        </div>
                      )}
                      {isAdmin() && (
                        <div className="relative group">
                          <button
                            onClick={() => handleDelete(po.id ?? po._id)}
                            className="text-red-600 hover:text-red-900"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <span className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">Delete</span>
                        </div>
                      )}
                      <div className="relative group">
                        <button
                          onClick={() => { setSelectedDetailItem(po); setIsDetailModalOpen(true); }}
                          className="text-gray-600 hover:text-gray-900"
                          aria-label="View Details"
                        >
                          <span className="sr-only">View Details</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <span className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">View Details</span>
                      </div>
                    </div>
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