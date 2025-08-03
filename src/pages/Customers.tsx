import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Edit, Trash2, Search, Phone, Mail, MapPin, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormField } from '../components/forms/FormField';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { DetailModal } from '../components/common/DetailModal';
import { useAuth } from '../hooks/useAuth';

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  contact: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer }) => {
  // Debug: log customer prop
  console.log('CustomerModal props:', { isOpen, customer });
  const queryClient = useQueryClient();
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  // Always reset form values when modal opens or customer changes
  React.useEffect(() => {
    if (isOpen) {
      if (customer) {
        reset({
          name: customer.name || '',
          contact: customer.contact || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
        });
      } else {
        reset({ name: '', contact: '', email: '', phone: '', address: '' });
      }
    }
  }, [isOpen, customer, reset]);

  const createMutation = useMutation({
    mutationFn: apiService.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) => apiService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
      reset();
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    if (isEditing && customer?._id) {
      // Debug: log id and data
      console.log('Updating customer:', customer._id, data);
      updateMutation.mutate({ id: customer._id, data });
    } else if (!customer?._id) {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Customer Name"
                name="name"
                placeholder="Enter customer name"
                register={register}
                error={errors.name}
                required
              />

              <FormField
                label="Contact Person"
                name="contact"
                placeholder="Enter contact person"
                register={register}
                error={errors.contact}
                required
              />

              <FormField
                label="Email"
                name="email"
                type="email"
                placeholder="Enter email address"
                register={register}
                error={errors.email}
                required
              />

              <FormField
                label="Phone"
                name="phone"
                placeholder="Enter phone number"
                register={register}
                error={errors.phone}
                required
              />
            </div>

            <FormField
              label="Address"
              name="address"
              placeholder="Enter full address"
              register={register}
              error={errors.address}
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
                className='gradient-btn'
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add Sale interface back
interface Sale {
  id: string;
  customerName: string;
  total: number;
  saleDate: string;
}

// Remove unused Customer interface and add PaginatedCustomers type
interface PaginatedCustomers {
  customers: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 800); 
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const {
  page,
  setPage,
  handleNext,
  handlePrev,
  resetPage
} = usePagination(1);

  const limit = 10;

  // Fetch paginated customers with correct useQuery syntax and types
  const {
    data: customerResponse = { customers: [], pagination: { page: 1, pages: 1, total: 0, limit } },
    isLoading,
  } = useQuery<PaginatedCustomers>({
    queryKey: ['customers', page, debouncedSearch],
    queryFn: () => apiService.getCustomers({ page, limit, search: debouncedSearch }),
  });

  // Always fallback to array/object to avoid map on undefined
  const customers = Array.isArray(customerResponse?.customers) ? customerResponse.customers : [];
  const pagination = customerResponse?.pagination || { page: 1, pages: 1, total: 0, limit };

  // Use this instead to avoid the overload error:
  const { data: salesData } = useQuery({
    queryKey: ['sales'],
    queryFn: () => apiService.getSales({}),
  });
  const sales = salesData?.sales || [];

  const getCustomerStats = (customerName: string) => {
    const customerSales = sales.filter((sale: Sale) => sale.customerName === customerName) || [];
    const totalSales = customerSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
    const lastSale = customerSales.sort((a: Sale, b: Sale) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())[0];
    return {
      totalSales,
      totalOrders: customerSales.length,
      lastSale: lastSale?.saleDate,
    };
  };

  const handleEdit = (customer: any) => {
    // Debug: log customer object
    console.log('handleEdit called with:', customer);
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6  pb-6">
      <Card>
        <CardHeader
          title={`Customers (${customerResponse?.pagination?.total || 0})`}
          subtitle="Manage your customer base"
          action={
            <Button
              icon={Plus}
              className='gradient-btn'
              onClick={() => setIsModalOpen(true)}
            >
              Add Customer
            </Button>
          }
        />
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPage();
              }}
            />
          </div>
        </div>
        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer: any) => {
            const stats = getCustomerStats(customer.name);
            return (
              <Card key={customer._id || customer.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
                      <p className="text-sm text-gray-500">{customer.contact}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isAdmin() && (
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/customers/${customer._id || customer.id}`)}
                      className="text-gray-600 hover:text-gray-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {isAdmin() && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this customer?')) {
                            deleteMutation.mutate(customer._id || customer.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {customer.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {customer.phone}
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                </div>
                {/* Customer Stats */}
                {/* <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Sales</p>
                      <p className="text-sm font-medium text-gray-900">
                        ${stats.totalSales.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Orders</p>
                      <p className="text-sm font-medium text-gray-900">
                        {stats.totalOrders}
                      </p>
                    </div>
                  </div>
                  {stats.lastSale && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Last Sale</p>
                      <p className="text-sm text-gray-700">
                        {new Date(stats.lastSale).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div> */}
              </Card>
            );
          })}
        </div>
        {customers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first customer.
            </p>
          </div>
        )}
        {/* Pagination Controls */}
        <div className="flex justify-center items-center space-x-2 mt-6 mb-6">
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
      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        customer={editingCustomer}
      />

    </div>
  );
};