import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, Plus, ReceiptIndianRupee, RefreshCcw, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import jsPDF from 'jspdf';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormField } from '../components/forms/FormField';
import { SelectField } from '../components/forms/SelectField';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { apiService } from '../services/api';
import { extractCancelledItemsFromPurchases, formatCurrency, getStatusColor } from '../utils/constants';
import ReloadButton from '../components/common/ReloadButton';
import { ReusableDeleteModal } from '../components/modals/ReusableDeleteModal';

const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce
    .number()
    .min(1, 'Quantity must be at least 1')
    .refine(val => Number.isFinite(val), { message: 'Quantity must be a valid number' }),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  unitType: z.string().min(1, 'Unit type is required'),
  isCancelled: z.boolean().optional(),
  isReturn: z.boolean().optional(),

});

const purchaseSchema = z.object({
  ref_num: z.string().min(1, 'DB Number is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  invoiceFile: z.any().optional(),
  remarks: z.string().optional(),
  receivedBy: z.string().min(1, 'Received by is required'),

});

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

export interface Purchase {
  _id: string;
  ref_num: string;
  invoiceFile: null;
  vendor: string;
  purchaseDate: string;
  items: Item[];
  subtotal: number;
  total: number;
  receiptNumber: string;
  createdBy: CreatedBy;
  isDeleted: boolean;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  receivedBy: string;
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

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, purchase }) => {
  const queryClient = useQueryClient();
  const isEditing = !!purchase;

  // Fetch products, purchaseOrders, suppliers as before
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts({ all: true }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: purchaseOrderData, refetch } = useQuery({
    queryKey: ['purchaseOrderData'],
    queryFn: () => apiService.getPurchaseOrders({ all: true }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apiService.getSuppliers({ all: true }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // NEW: fetch latest purchase by id when editing to ensure cancelled flags are current
  const {
    data: latestPurchase, // actual purchase object returned by apiService.getPurchaseById
    isLoading: isLatestPurchaseLoading,
    error: latestPurchaseError,
  } = useQuery({
    queryKey: ['purchase', purchase?._id],
    queryFn: async () => {
      if (!purchase?._id) return null;
      return apiService.getPurchaseById(purchase._id);
    },
    enabled: isEditing && !!purchase?._id,
    refetchOnWindowFocus: false,
    // optional: staleTime: 1000 * 60, // 1 minute
  });

  const products = Array.isArray(productsData?.products) ? productsData.products : Array.isArray(productsData) ? productsData : [];
  const suppliersList = suppliers?.vendors || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      ref_num: '',
      supplier: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0, unitType: '', isCancelled: false, isReturn: false }],
      invoiceFile: '',
      remarks: '',
      receivedBy: '',
    },
  });

  const selectedRefNum = watch('ref_num');
  const [attachment, setAttachment] = useState<File | null>(null);

  // Helper to pick the source purchase (prefer latestPurchase if available)
  const currentPurchase = latestPurchase ?? purchase ?? null;

  // Reset form when opening edit modal or when latestPurchase loads
  useEffect(() => {
    if (isEditing && currentPurchase) {
      reset({
        ref_num: currentPurchase.ref_num,
        supplier: currentPurchase.vendor || currentPurchase.supplier || '',
        items: (currentPurchase.items || []).map((item: any) => ({
          productId: String(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitType: item.unitType,
          isCancelled: item.isCancelled ?? false,
          isReturn: item.isReturn ?? false,
        })),
        invoiceFile: currentPurchase.invoiceFile || '',
        remarks: currentPurchase.remarks || '',
        receivedBy: currentPurchase.receivedBy || '',
      });

      // Set invoiceFile if exists
      if (currentPurchase.invoiceFile && typeof currentPurchase.invoiceFile === 'string') {
        setValue('invoiceFile', currentPurchase.invoiceFile);
        setAttachment(null);
      }
    }
    // if not editing, we keep defaults (create flow)
  }, [isEditing, currentPurchase, reset, setValue]);

  // When user selects DB Number (ref_num) - load PO and merge cancelled flags from currentPurchase (if editing)
  useEffect(() => {
    if (!selectedRefNum || !purchaseOrderData?.purchaseOrders?.length) return;

    const matchedPO = purchaseOrderData.purchaseOrders.find(
      (po: any) => po.ref_num === selectedRefNum
    );

    if (matchedPO) {
      // Merge PO items with cancelled info from currentPurchase (if editing)
      const mergedItems = (matchedPO.items || []).map((poItem: any) => {
        let cancelledFlag = false;
        let returnFlag = false;
        if (isEditing && currentPurchase && Array.isArray(currentPurchase.items)) {
          const matchingPurchaseItem = currentPurchase.items.find(
            (pItem: any) => String(pItem.productId) === String(poItem.productId)
          );
          if (matchingPurchaseItem) {
            cancelledFlag = matchingPurchaseItem.isCancelled ?? false;
            returnFlag = matchingPurchaseItem.isReturn ?? false;
          }
        }

        return {
          productId: String(poItem.productId),
          quantity: poItem.quantity,
          unitPrice: poItem.unitPrice,
          unitType: poItem.unitType,
          isCancelled: cancelledFlag,
          isReturn: returnFlag,
        };
      });

      // Preserve invoiceFile & remarks from current form values (or use matchedPO.attachment for invoice)
      // If matchedPO has attachment and invoiceFile is empty, set it.
      reset((prevValues: any) => ({
        ...prevValues,
        ref_num: matchedPO.ref_num,
        supplier: matchedPO.vendor,
        items: mergedItems.length ? mergedItems : [{ productId: '', quantity: 1, unitPrice: 0, unitType: '', isCancelled: false, isReturn: false }],
        invoiceFile: prevValues.invoiceFile || matchedPO.attachment || '',
        remarks: prevValues.remarks,
        receivedBy: prevValues.receivedBy,
      }));

      if (matchedPO.attachment) {
        setValue('invoiceFile', matchedPO.attachment);
        setAttachment(null);
      } else {
        // if no attachment on PO, keep previous invoiceFile (could be from purchase) — do nothing here
      }
    } else {
      // no PO matched, reset items to default
      reset({
        ref_num: '',
        supplier: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0, unitType: '', isCancelled: false, isReturn: false }],
        invoiceFile: '',
        remarks: '',
        receivedBy: '',
      });
      setValue('invoiceFile', '');
      setAttachment(null);
    }
  }, [selectedRefNum, purchaseOrderData, currentPurchase, isEditing, reset, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const formData = new FormData();
      formData.append('ref_num', payload.ref_num);
      // formData.append(
      //   'receiptNumber',
      //   isEditing && currentPurchase ? currentPurchase.receiptNumber : generateReceiptNumber()
      // );
      formData.append('vendor', payload.vendor || payload.supplier);
      formData.append('purchaseDate', isEditing && currentPurchase ? currentPurchase.purchaseDate : new Date().toISOString());
      formData.append('subtotal', String(subtotal));
      formData.append('total', String(grandTotal));
      formData.append('receivedBy', payload.receivedBy || '');
      formData.append('remarks', payload.remarks || '');

      if (attachment instanceof File) {
        formData.append('invoiceFile', attachment);
      }

      formData.append('items', JSON.stringify(payload.items.map((item: any) => ({
        productId: String(item.productId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitType: item.unitType,
        isCancelled: item.isCancelled || false,
        isReturn: item.isReturn || false,
      }))));

      if (isEditing && currentPurchase && currentPurchase._id) {
        return apiService.updatePurchase(currentPurchase._id, formData);
      } else {
        return apiService.createPurchase(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', purchase?._id] });
      onClose();
      reset();
      refetch();
    },
  });



  const calculateTotals = (items: any[]) => {
    let subtotal = 0;
    let cancelledTotal = 0;
    let returnTotal = 0;

    items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice || 0);
      const lineTotal = qty * price;

      if (item.isCancelled) {
        cancelledTotal += lineTotal;
      } else if (item.isReturn) {
        returnTotal += lineTotal;
      } else {
        subtotal += lineTotal; // only active items add to subtotal
      }
    });

    return {
      subtotal,
      cancelledTotal,
      returnTotal,
      grandTotal: subtotal, // ✅ grand total = subtotal only
    };
  };



  const onSubmit = async (data: any) => {
    const payload = {
      ref_num: data.ref_num,
      vendor: data.supplier,
      items: data.items.map((item: any) => ({
        productId: String(item.productId),
        productName: products.find((p: any) => String(p._id) === String(item.productId))?.name || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitType: item.unitType,
        total: item.quantity * item.unitPrice,
        isCancelled: item.isCancelled || false,
        isReturn: item.isReturn || false,
      })),
      subtotal: subtotal,
      total: grandTotal,
      invoiceFile: typeof data.invoiceFile === 'string' ? data.invoiceFile : (data.invoiceFile?.[0]?.name || ''),
      supplier: data.supplier,
      remarks: data.remarks,
      receivedBy: data.receivedBy,
    };

    createMutation.mutate(payload);
    refetch();
  };

  if (!isOpen) return null;

  // const subtotal = calculateSubtotal();
  const { subtotal, cancelledTotal, returnTotal, grandTotal } = calculateTotals(watchedItems || []);

  return (
    <div style={{ marginTop: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Purchase' : 'Create Purchase'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" encType="multipart/form-data">

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <SelectField<any>
                label="DB Number"
                name="ref_num"
                options={
                  isEditing
                    ? [
                      // current DB number (disabled)
                      {
                        value: currentPurchase?.ref_num,
                        label: `${currentPurchase?.ref_num} (locked)`,
                        disabled: true,
                      },
                      // other available DB numbers for create mode
                      ...(purchaseOrderData?.purchaseOrders
                        .filter(item => !item.isPurchasedCreated)
                        .map((po: any) => ({
                          value: po.ref_num,
                          label: po.ref_num,
                        })) || []),
                    ]
                    : purchaseOrderData?.purchaseOrders
                      .filter(item => !item.isPurchasedCreated)
                      .map((po: any) => ({
                        value: po.ref_num,
                        label: po.ref_num,
                      })) || []
                }
                control={control}
                error={errors.ref_num}
                required
                disabled={isEditing} // 👈 lock the dropdown entirely when editing
              />

              <div className="">

                <SelectField<any>
                  label="Supplier"
                  name="supplier"
                  options={suppliersList.map((s: any) => ({ value: s.name, label: s.name })) || []}
                  control={control}
                  error={errors.supplier}
                  required
                />


              </div>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" >

              <FormField
                label="Received By"
                name="receivedBy"
                placeholder='Received By'
                type="text"
                register={register}
                error={errors.receivedBy}
                required
              />
              <div className='flex-1'>
                <Controller
                  name="invoiceFile"
                  control={control}
                  render={() => (
                    <div className="space-y-1 ">
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
                      {errors.invoiceFile && <p className="text-sm text-red-600">{errors.invoiceFile.message}</p>}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg 
                      ${watchedItems[index]?.isCancelled ? 'bg-red-100' : watchedItems[index]?.isReturn ? 'bg-yellow-100' : ''}`}

                  >
                    <div className="md:col-span-2">
                      <SelectField<any>
                        label="Product"
                        name={`items.${index}.productId`}
                        options={products.map((product: any) => ({ value: String(product._id), label: `${product.name}` })) || []}
                        control={control}
                        error={errors.items?.[index]?.productId}
                        required
                        disabled={watchedItems[index]?.isCancelled || watchedItems[index]?.isReturn}
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
                      disabled={watchedItems[index]?.isCancelled || watchedItems[index]?.isReturn}
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
                      placeholder="Nos"
                      name={`items.${index}.unitType`}
                      type="text"
                      register={register}
                      disabled={true}
                      required
                    />

                    {watchedItems[index]?.productId &&
                      watchedItems[index]?.quantity > 0 &&
                      watchedItems[index]?.unitPrice > 0 && (
                        <div className="flex items-center gap-4">
                          <label className="text-sm font-medium text-gray-700">Status:</label>

                          <Controller
                            control={control}
                            name={`items.${index}.status`}
                            render={({ field }) => {
                              const currentValue = watchedItems[index]?.isCancelled
                                ? 'cancelled'
                                : watchedItems[index]?.isReturn
                                  ? 'return'
                                  : 'none';

                              return (
                                <div className="flex gap-3">
                                  <label className="flex items-center gap-1 text-sm">
                                    <input
                                      type="radio"
                                      value="none"
                                      checked={currentValue === 'none'}
                                      onChange={() => {
                                        setValue(`items.${index}.isCancelled`, false);
                                        setValue(`items.${index}.isReturn`, false);
                                      }}
                                    />
                                    None
                                  </label>

                                  <label className="flex items-center gap-1 text-sm text-red-600">
                                    <input
                                      type="radio"
                                      value="cancelled"
                                      checked={currentValue === 'cancelled'}
                                      onChange={() => {
                                        setValue(`items.${index}.isCancelled`, true);
                                        setValue(`items.${index}.isReturn`, false);
                                      }}
                                    />
                                    Cancelled
                                  </label>

                                  {/* <label className="flex items-center gap-1 text-sm text-yellow-600">
                                    <input
                                      type="radio"
                                      value="return"
                                      checked={currentValue === 'return'}
                                      onChange={() => {
                                        setValue(`items.${index}.isCancelled`, false);
                                        setValue(`items.${index}.isReturn`, true);
                                      }}
                                    />
                                    Return
                                  </label> */}
                                </div>
                              );
                            }}
                          />
                        </div>


                      )}

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
            {/* <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                {calculateCancelledTotal() > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Cancelled Total:</span>
                    <span>{formatCurrency(calculateCancelledTotal())}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div> */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                {cancelledTotal > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Cancelled Total:</span>
                    <span>{formatCurrency(cancelledTotal)}</span>
                  </div>
                )}

                {returnTotal > 0 && (
                  <div className="flex justify-between text-yellow-600">
                    <span>Return Total:</span>
                    <span>{formatCurrency(returnTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(grandTotal)}</span>
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
                    items: [{ productId: '', quantity: 1, unitPrice: 0, unitType: '' }],
                    invoiceFile: undefined,
                    remarks: '',
                  });
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="gradient-btn" loading={createMutation.isPending}>
                {isEditing ? 'Update Purchase' : 'Create Purchase'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;

export const Purchases: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEditPurchase, setSelectedEditPurchase] = useState<Purchase | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 800);
  const { page, handleNext, handlePrev } = usePagination(1);
  const { isAdmin } = useAuth();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  const { data: purchasesData, isLoading, refetch } = useQuery<PurchasesApiResponse>({
    queryKey: ['purchases', page, debouncedSearch],
    queryFn: () => apiService.getPurchases({ page, limit: 10, search: debouncedSearch }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 30000, // Refetch every 30 seconds (optional)
  });

  const purchases = purchasesData?.purchases || [];
  const pagination = purchasesData?.pagination || { page: 1, pages: 1, total: 0, limit: 10 };

  const filteredPurchases = extractCancelledItemsFromPurchases(purchases, false);
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
      setIsDeleteModalOpen(false);
      setPurchaseToDelete(null);
    },
    onError: (error: unknown) => {
      console.error('Delete error:', error);
      // You can add toast notification here instead of alert
    }
  });

  const handleDeleteClick = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (purchaseToDelete) {
      deleteMutation.mutate(purchaseToDelete._id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setPurchaseToDelete(null);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <>
      <div className="space-y-6">
        <ReloadButton isLoading={isLoading} refetch={refetch} />
        <Card>
          <CardHeader
            title={`Purchases`}
            subtitle="Create and manage your purchases"
            action={
              <Button
                icon={Plus}
                className='gradient-btn'
                onClick={() => setIsModalOpen(true)}
              >
                Create Purchase
              </Button>
            }
          />

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="search"
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
                    DB Number
                  </th>
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
                {filteredPurchases.map((purchase, index) => (
                  <tr key={purchase._id} className={`hover:bg-gray-50`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor('delivered')}`}>
                          {purchase?.ref_num}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor('delivered')}`}>
                          {purchase?.receiptNumber}
                        </span>
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
                        <a
                          target='_blank'
                          className="text-white rounded-full p-1 px-2 text-xs bg-blue-500 hover:text-green-900"
                          href={purchase.invoiceFile}
                        >
                          View File
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">No file</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(purchase.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {isAdmin() && (
                        <button
                          onClick={() => {
                            setSelectedEditPurchase(purchase);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/purchases/${purchase._id}`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => handleDeleteClick(purchase)}
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
              <ReceiptIndianRupee className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first purchase.
              </p>
            </div>
          )}
        </Card>

        <PurchaseModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedEditPurchase(null); }}
          purchase={selectedEditPurchase}
        />


      </div>
      {/* Reusable Delete Modal */}
      <ReusableDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase"
        message="Are you sure you want to delete purchase"
        itemName={purchaseToDelete?.receiptNumber || purchaseToDelete?.ref_num}
        isDeleting={deleteMutation.isPending}
        confirmText="Delete Purchase"
        extraInfo='You can restore this item from Recycle Bin'
      />
    </>
  );
};