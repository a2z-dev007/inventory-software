import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Upload, Download, Edit, Search } from 'lucide-react';
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

const purchaseItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

const purchaseSchema = z.object({
  supplier: z.string().min(1, 'Supplier is required'),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  invoiceFile: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase?: any;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, purchase }) => {
  const queryClient = useQueryClient();
  const isEditing = !!purchase;

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: apiService.getProducts,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: apiService.getSuppliers,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: purchase ? {
      supplier: purchase.supplier,
      items: purchase.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      invoiceFile: purchase.invoiceFile,
    } : {
      supplier: '',
      items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
      invoiceFile: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const createMutation = useMutation({
    mutationFn: apiService.createPurchase,
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

  const calculateTax = (subtotal: number) => subtotal * 0.12;
  const calculateTotal = (subtotal: number, tax: number) => subtotal + tax;

  const onSubmit = (data: PurchaseFormData) => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal, tax);

    const purchaseData = {
      ...data,
      receiptNumber: isEditing ? purchase.receiptNumber : `REC-${Date.now()}`,
      purchaseDate: isEditing ? purchase.purchaseDate : new Date().toISOString(),
      items: data.items.map(item => {
        const product = products?.find(p => p.id === Number(item.productId));
        return {
          ...item,
          productName: product?.name || '',
          total: item.quantity * item.unitPrice,
        };
      }),
      subtotal,
      tax,
      total,
    };

    createMutation.mutate(purchaseData);
  };

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Purchase' : 'Record Purchase'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Supplier"
                name="supplier"
                options={suppliers?.map(supplier => ({
                  value: supplier.name,
                  label: supplier.name,
                })) || []}
                register={register}
                error={errors.supplier}
                required
              />

              <FormField
                label="Invoice File"
                name="invoiceFile"
                placeholder="e.g., invoice-001.pdf"
                register={register}
                error={errors.invoiceFile}
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
                      <SelectField
                        label="Product"
                        name={`items.${index}.productId`}
                        options={products?.map(product => ({
                          value: product.id,
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
                      step="0.01"
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
                <div className="flex justify-between">
                  <span>Tax (12%):</span>
                  <span>{formatCurrency(tax)}</span>
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: apiService.getPurchases,
  });

  const filteredPurchases = purchases?.filter(purchase =>
    purchase.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
    doc.text(`Tax: ₹${purchase.tax.toFixed(2)}`, 20, yPos + 15);
    doc.text(`Total: ₹${purchase.total.toFixed(2)}`, 20, yPos + 30);
    
    doc.save(`${purchase.receiptNumber}.pdf`);
  };

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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Receipt className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.receiptNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {purchase.invoiceFile ? (
                      <span className="text-sm text-blue-600">{purchase.invoiceFile}</span>
                    ) : (
                      <span className="text-sm text-gray-400">No file</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(purchase.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => generateReceiptPDF(purchase)}
                      className="text-green-600 hover:text-green-900"
                      title="Download Receipt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};