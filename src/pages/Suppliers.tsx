import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Truck, Edit, Search, Phone, Mail, MapPin, Trash2, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormField } from '../components/forms/FormField';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { DetailModal } from '../components/common/DetailModal';
import { useAuth } from '../hooks/useAuth';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: any;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, supplier }) => {
  const queryClient = useQueryClient();
  const isEditing = !!supplier;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(
        supplier
          ? {
              name: supplier.name || '',
              contact: supplier.contact || '',
              email: supplier.email || '',
              phone: supplier.phone || '',
              address: supplier.address || '',
            }
          : {
              name: '',
              contact: '',
              email: '',
              phone: '',
              address: '',
            }
      );
    }
  }, [isOpen, supplier, reset]);

  const createMutation = useMutation({
    mutationFn: apiService.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierFormData }) =>
      apiService.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    if (isEditing && supplier?._id) {
      updateMutation.mutate({ id: supplier._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Supplier Name"
                name="name"
                placeholder="Enter supplier name"
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className='gradient-btn' loading={createMutation.isPending}>
                {isEditing ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add type for suppliers API response
interface SuppliersApiResponse {
  vendors: any[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const { page, setPage, handleNext, handlePrev } = usePagination(1);
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery<SuppliersApiResponse>({
    queryKey: ['suppliers', page, debouncedSearch],
    queryFn: () => apiService.getSuppliers({ page, limit: 9, search: debouncedSearch }),
    // keepPreviousData: true, // Remove or move to options if your React Query version supports it
  });

  const suppliers = data?.vendors || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0, limit: 9 };

  console.log('📦 Current Page State:', page);
  console.log('📄 Pagination Response:', pagination);

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`Suppliers`}
          subtitle="Manage your supplier network"
          action={
            <Button icon={Plus} className='gradient-btn' onClick={() => setIsModalOpen(true)}>
              Add Supplier
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search suppliers..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1); // reset to first page on search
              }}
            />
          </div>
        </div>

        {isLoading || isFetching ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier: any) => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-500">{supplier.contact}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {isAdmin() && (
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/suppliers/${supplier._id || supplier.id}`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this supplier?')) {
                              deleteMutation.mutate(supplier._id || supplier.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {supplier.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {supplier.phone}
                    </div>
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {suppliers.length === 0 && (
              <div className="text-center py-12">
                <Truck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first supplier.
                </p>
              </div>
            )}

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
          </>
        )}
      </Card>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        supplier={editingSupplier}
      />

    </div>
  );
};
