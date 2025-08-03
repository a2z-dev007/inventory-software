import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DetailPage } from '../components/common/DetailPage';
import { toast } from 'react-toastify';

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: supplier,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => apiService.getSupplierById(id!),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/suppliers');
  };

  const handleEdit = () => {
    navigate(`/suppliers/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      // TODO: Implement delete functionality
      toast.error('Delete functionality not implemented yet');
    }
  };

  return (
    <DetailPage
      title="Supplier Details"
      data={supplier}
      isLoading={isLoading}
      error={error?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onBack={handleBack}
    />
  );
}; 