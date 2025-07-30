import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Download, Search, Trash2, Edit, Link } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { DetailModal } from '../components/common/DetailModal';
import { PurchaseOrder } from './PurchaseOrders';
import { useAuth } from '../hooks/useAuth';

const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  unitType: z.string().min(1, 'Unit type is required'),
});

const purchaseSchema = z.object({
  ref_num: z.string().min(1, 'DB Number is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  invoiceFile: z.any().optional(),
  remarks:z.string().optional(),
});

type PurchaseFormData = {
  ref_num: string;
  supplier: string;
  items: { productId: number; quantity: number; unitPrice: number, unitType: string }[];
  invoiceFile: FileList;
  remarks: string;
  // add other fields as needed
};

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase?: any;
}

// Types
interface Supplier {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}
interface SuppliersApiResponse {
  vendors: Supplier[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}
interface Purchase {
  _id: string;
  receiptNumber: string;
  supplier: string;
  ref_num: string;
  createdBy: string;
  vendor?: string;
  purchaseDate: string;
  invoiceFile?: string;
  total: number;
  items: any[];
  subtotal: number;
  remarks?: string;
  // Removed tax
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

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, purchase }) => {
  const queryClient = useQueryClient();
  const isEditing = !!purchase;

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts(),
  });
  const { data: purchaseOrderData, refetch } = useQuery({
    queryKey: ['purchaseOrderData'],
    queryFn: () => apiService.getPurchaseOrders({ limit: 100 }),
  });



  const products = Array.isArray(productsData?.products) ? productsData.products : Array.isArray(productsData) ? productsData : [];

  const { data: suppliers } = useQuery<SuppliersApiResponse>({
    queryKey: ['suppliers'],
    queryFn: () => apiService.getSuppliers({ page: 1, limit: 100 }),
  });
  const suppliersList = suppliers?.vendors || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      ref_num: '',
      supplier: '',
      items: [{ productId: 0, quantity: 1, unitPrice: 0, unitType: '' }],
      invoiceFile: '',
      remarks:''
    },
  });
  const selectedRefNum = watch('ref_num');
  const [attachment, setAttachment] = useState<File | null>(null);


  useEffect(() => {
    if (isEditing && purchase) {
      reset({
        ref_num: purchase.ref_num,
        supplier: purchase.vendor || purchase.supplier || '',
        items: purchase.items.map((item: any) => ({
          productId: String(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitType: item.unitType,
        })),
        invoiceFile: purchase.invoiceFile || '',
        remarks: purchase.remarks
      });
  
      // If there's an attachment
      if (purchase.invoiceFile && typeof purchase.invoiceFile === 'string') {
        setValue('invoiceFile', purchase.invoiceFile);
        setAttachment(null); // prevent unnecessary upload again
      }
    }
  }, [isEditing, purchase, reset, setValue]);
  
  useEffect(() => {
    if (!selectedRefNum || !purchaseOrderData?.purchaseOrders?.length) return;

    const matchedPO = purchaseOrderData.purchaseOrders.find(
      (po: any) => po.ref_num === selectedRefNum
    );

    if (matchedPO) {
      // If editing and there's an existing attachment
      if (matchedPO.attachment) {
        console.log('Existing attachment found:', matchedPO.attachment);
        // Set the attachment value for validation - use the actual string value
        setValue('invoiceFile', matchedPO.attachment);
        // We don't need a new file upload since we're using the existing one
        setAttachment(null);
      } else {
        console.log('No existing attachment found');
        setValue('invoiceFile', null);
        setAttachment(null);
      }
      reset((prevValues) => ({
        ...prevValues,
        ref_num: matchedPO.ref_num,
        supplier: matchedPO.vendor,
        items: matchedPO.items.map((item: any) => ({
          productId: String(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitType: item.unitType
        })),
        // Keep invoiceFile untouched
        invoiceFile: prevValues.invoiceFile,
        remarks: prevValues.remarks
      }));
    } else {
      reset({
        ref_num: '',
        supplier: '',
        items: [{ productId: 0, quantity: 1, unitPrice: 0, unitType: '' }],
        invoiceFile: '',
        remarks:''
      })
      setValue('invoiceFile', '');
      setAttachment(null);

    }
  }, [selectedRefNum, purchaseOrderData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const createMutation = useMutation({
    // mutationFn: (payload: PurchaseFormData) => {
    //   // Prepare payload for backend
    //   const backendPayload = {
    //     ref_num: payload.ref_num,
    //     receiptNumber: isEditing && purchase ? purchase.receiptNumber : generateReceiptNumber(),
    //     vendor: payload.supplier, // vendor is the supplier name
    //     purchaseDate: isEditing && purchase ? purchase.purchaseDate : new Date().toISOString(),
    //     items: payload.items.map(item => ({
    //       productId: String(item.productId),
    //       quantity: item.quantity,
    //       unitPrice: item.unitPrice,
    //       unitType:item.unitType
    //     })),
    //     subtotal: calculateSubtotal(),
    //     // Removed tax
    //     total: calculateSubtotal(),
    //     invoiceFile: payload.invoiceFile?.[0]?.name || '',
    //     // supplier: payload.supplier, // add supplier for type compatibility
    //   };
    //   console.log('Backend payload--------:', backendPayload);
    //   if (isEditing && purchase && purchase._id) {
    //     return apiService.updatePurchase(purchase._id, backendPayload);
    //   } else {
    //     return apiService.createPurchase(backendPayload);
    //   }
    // },
    mutationFn: async (payload: PurchaseFormData) => {
      const formData = new FormData();

      // Add all basic fields
      formData.append("ref_num", payload.ref_num);
      formData.append(
        "receiptNumber",
        isEditing && purchase ? purchase.receiptNumber : generateReceiptNumber()
      );
      formData.append(
        "vendor",
        payload.supplier
      );
      formData.append(
        "purchaseDate",
        isEditing && purchase ? purchase.purchaseDate : new Date().toISOString()
      );

      formData.append("subtotal", String(calculateSubtotal()));
      formData.append("total", String(calculateSubtotal()));

      formData.append("remarks", payload.remarks);

      // Append file
      if (attachment instanceof File) {
        formData.append("invoiceFile", attachment); // Must match backend's multer fieldName
      }

      // Append items as a JSON string
      formData.append("items", JSON.stringify(payload.items.map(item => ({
        productId: String(item.productId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitType: item.unitType
      }))));

      // POST or PUT to API
      if (isEditing && purchase && purchase._id) {
        return apiService.updatePurchase(purchase._id, formData);
      } else {
        return apiService.createPurchase(formData);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      onClose();
      reset();
    },
  });

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  // Removed calculateTax and calculateTotal

  const generateReceiptNumber = () => {
    const now = new Date();
    return `PUR-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data: PurchaseFormData) => {
    const payload = {
      ref_num: data.ref_num,
      // receiptNumber: isEditing && purchase ? purchase.receiptNumber : generateReceiptNumber(),
      vendor: data.supplier,
      // purchaseDate: isEditing && purchase ? purchase.purchaseDate : new Date().toISOString(),
      items: data.items.map(item => ({
        productId: String(item.productId),
        productName: products.find((p: any) => String(p._id) === String(item.productId))?.name || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitType: item.unitType,
        total: item.quantity * item.unitPrice,
      })),
      subtotal: calculateSubtotal(),
      // Removed tax
      total: calculateSubtotal(),
      invoiceFile: data.invoiceFile?.[0]?.name || '',
      supplier: data.supplier, // add supplier for type compatibility
      remarks:data.remarks
    };

    createMutation.mutate(payload);
  };

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();
  // Removed tax and total

  return (
    <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Purchase' : 'Record Purchase'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" encType='multipart/form-data'>
            <SelectField<PurchaseFormData>
              label="DB Number"
              name="ref_num"
              options={purchaseOrderData?.purchaseOrders?.map((po: PurchaseOrder) => ({
                value: po.ref_num, // vendor is po name
                label: po.ref_num,
              })) || []}
              control={control}
              error={errors.supplier}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <SelectField<PurchaseFormData>
                label="Supplier"
                name="supplier"
                options={suppliersList.map((supplier: Supplier) => ({
                  value: supplier.name, // vendor is supplier name
                  label: supplier.name,
                })) || []}
                control={control}
                error={errors.supplier}
                required
              />

              {/* <FormField
                label="Invoice File"
                name="invoiceFile"
                type="file"
                register={register}
                error={errors.invoiceFile}
                inputProps={{ accept: '.pdf,.jpg,.jpeg,.png' }}
              /> */}
              <Controller
                name="invoiceFile"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Invoice</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"

                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAttachment(file);
                          setValue('invoiceFile', 'file-selected', { shouldValidate: true });
                        } else {
                          setAttachment(null);
                          setValue('invoiceFile', null, { shouldValidate: true });
                        }
                      }}
                    />
                    {errors.invoiceFile && (
                      <p className="text-sm text-red-600">{errors.invoiceFile.message}</p>
                    )}
                  </div>
                )}
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
                  onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0 })}
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="md:col-span-2">
                      <SelectField<PurchaseFormData>
                        label="Product"
                        name={`items.${index}.productId`}
                        options={products.map((product: any) => ({
                          value: String(product._id),
                          label: `${product.name} (${product.sku})`,
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
                      disabled={true}
                      type="number"
                      register={register}
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
            </div>
            <FormField
              label="Remarks"
              name="remarks"
              type="textarea"
              placeholder="Enter remarks (optional)"
              register={register}
              error={errors.remarks}
            />
            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {/* Removed Tax row */}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset({
                    ref_num: '',
                    supplier: '',
                    items: [{ productId: 0, quantity: 1, unitPrice: 0, unitType: '' }],
                    invoiceFile: undefined,
                    remarks: '',
                  });
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className='gradient-btn'
                loading={createMutation.isPending}
              >
                {isEditing ? 'Update Purchase' : 'Record Purchase'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Purchases: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEditPurchase, setSelectedEditPurchase] = useState<Purchase | null>(null); // <-- New state
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev } = usePagination(1);
  const { isAdmin } = useAuth();

  const { data: purchasesData, isLoading } = useQuery<PurchasesApiResponse>({
    queryKey: ['purchases', page, debouncedSearch],
    queryFn: () => apiService.getPurchases({ page, limit: 10, search: debouncedSearch }),
  });

  const purchases = purchasesData?.purchases || [];
  const pagination = purchasesData?.pagination || { page: 1, pages: 1, total: 0, limit: 10 };

  const filteredPurchases = purchases;
  console.log("filteredPurchases", filteredPurchases)
  const generateReceiptPDF = (purchase: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('PURCHASE RECEIPT', 20, 30);

    doc.setFontSize(12);
    doc.text(`Receipt #: ${purchase.receiptNumber}`, 20, 50);
    doc.text(`Supplier: ${purchase.supplier}`, 20, 65);
    doc.text(`Date: ${new Date(purchase.purchaseDate).toLocaleDateString()}`, 20, 80);
    if (purchase.invoiceFile) {
      doc.text(`Invoice File: ${purchase.invoiceFile}`, 20, 95);
    }

    // Items
    doc.text('Items:', 20, 120);
    let yPos = 135;

    purchase.items.forEach((item: any, index: number) => {
      doc.text(`${index + 1}. ${item.productName}`, 25, yPos);
      doc.text(`   Qty: ${item.quantity} × ₹${item.unitPrice} = ₹${item.total}`, 25, yPos + 10);
      yPos += 25;
    });

    // Totals
    yPos += 10;
    doc.text(`Subtotal: ₹${purchase.subtotal.toFixed(2)}`, 20, yPos);
    // Removed Tax line
    doc.text(`Total: ₹${purchase.total.toFixed(2)}`, 20, yPos + 30);

    doc.save(`${purchase.receiptNumber}.pdf`);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deletePurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Purchases"
          subtitle="Record and manage your purchases"
          action={
            <Button
              icon={Plus}
              className='gradient-btn'
              onClick={() => setIsModalOpen(true)}
            >
              Record Purchase
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search purchases..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Purchases Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice File
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
              {filteredPurchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Receipt className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.receiptNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {purchase.invoiceFile ? (
                      <span className="text-sm text-blue-600">
                        <a href={purchase.invoiceFile} target="_blank" download>Download</a>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">No file</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(purchase.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* <button
                      onClick={() => generateReceiptPDF(purchase)}
                      className="text-green-600 hover:text-green-900"
                      title="Download Receipt"
                    >
                      <Download className="h-4 w-4" />
                    </button> */}
                    <button
                      onClick={() => { setSelectedDetailItem(purchase); setIsDetailModalOpen(true); }}
                      className="text-gray-600 hover:text-gray-900"
                      title="View Details"
                    >
                      <span className="sr-only">View Details</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    {isAdmin() && (
                      <button
                        onClick={() => {
                          setSelectedEditPurchase(purchase); // <-- Set for editing
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {isAdmin() && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this purchase?')) {
                            deleteMutation.mutate(purchase._id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={() => handlePrev()}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => handleNext(pagination)}
              disabled={page === pagination.pages}
            >
              Next
            </Button>
          </div>
        )}

        {filteredPurchases.length === 0 && (
          <div className="text-center py-8">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by recording your first purchase.
            </p>
          </div>
        )}
      </Card>

      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedEditPurchase(null); }}
        purchase={selectedEditPurchase}
      />
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedDetailItem}
        title="Purchase Details"
      />
    </div>
  );
};