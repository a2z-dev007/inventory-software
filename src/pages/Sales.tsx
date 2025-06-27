import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingCart, Download, Edit, Search, Receipt } from 'lucide-react';
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

const saleItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

const saleSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
  status: z.enum(['paid', 'pending', 'overdue']),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
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

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: apiService.getProducts,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: apiService.getCustomers,
  });

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
    defaultValues: sale ? {
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      status: sale.status,
      items: sale.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    } : {
      customerName: '',
      customerEmail: '',
      status: 'pending',
      items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const createMutation = useMutation({
    mutationFn: apiService.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      onClose();
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiService.updateSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      onClose();
    },
  });

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTax = (subtotal: number) => subtotal * 0.12;
  const calculateTotal = (subtotal: number, tax: number) => subtotal + tax;

  const handleCustomerSelect = (customerName: string) => {
    const customer = customers?.find(c => c.name === customerName);
    if (customer) {
      setValue('customerEmail', customer.email);
    }
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.unitPrice`, product.salesRate);
    }
  };

  const onSubmit = (data: SaleFormData) => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal, tax);

    const saleData = {
      ...data,
      invoiceNumber: isEditing ? sale.invoiceNumber : `INV-${Date.now()}`,
      saleDate: isEditing ? sale.saleDate : new Date().toISOString(),
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

    if (isEditing) {
      updateMutation.mutate({ id: sale.id, data: saleData });
    } else {
      createMutation.mutate(saleData);
    }
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
            {isEditing ? 'Edit Sale' : 'Create Sale Invoice'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <SelectField
                  label="Customer"
                  name="customerName"
                  options={customers?.map(customer => ({
                    value: customer.name,
                    label: customer.name,
                  })) || []}
                  register={register}
                  error={errors.customerName}
                  required
                />
                <input
                  type="hidden"
                  {...register('customerName', {
                    onChange: (e) => handleCustomerSelect(e.target.value)
                  })}
                />
              </div>

              <FormField
                label="Customer Email"
                name="customerEmail"
                type="email"
                register={register}
                error={errors.customerEmail}
                required
              />

              <SelectField
                label="Status"
                name="status"
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'overdue', label: 'Overdue' },
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
                          label: `${product.name} (Stock: ${product.currentStock})`,
                        })) || []}
                        register={register}
                        error={errors.items?.[index]?.productId}
                        required
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.productId`, {
                          onChange: (e) => handleProductSelect(index, Number(e.target.value))
                        })}
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
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (12%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
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
                {isEditing ? 'Update Sale' : 'Create Sale'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Sales: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: apiService.getSales,
  });

  const filteredSales = sales?.filter(sale =>
    sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
    
    sale.items.forEach((item: any, index: number) => {
      doc.text(`${index + 1}. ${item.productName}`, 25, yPos);
      doc.text(`   Qty: ${item.quantity} × $${item.unitPrice} = $${item.total}`, 25, yPos + 10);
      yPos += 25;
    });
    
    // Totals
    yPos += 10;
    doc.text(`Subtotal: $${sale.subtotal.toFixed(2)}`, 20, yPos);
    doc.text(`Tax: $${sale.tax.toFixed(2)}`, 20, yPos + 15);
    doc.text(`Total: $${sale.total.toFixed(2)}`, 20, yPos + 30);
    
    doc.save(`${sale.invoiceNumber}.pdf`);
  };

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
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

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Sales & Invoices"
          subtitle="Manage your sales transactions"
          action={
            <Button
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              Create Sale
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  Sale Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Receipt className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {sale.invoiceNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sale.customerName}</div>
                    <div className="text-sm text-gray-500">{sale.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${sale.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => generateInvoicePDF(sale)}
                      className="text-green-600 hover:text-green-900"
                      title="Download Invoice"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(sale)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first sale.
            </p>
          </div>
        )}
      </Card>

      <SaleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sale={editingSale}
      />
    </div>
  );
};