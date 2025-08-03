import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DetailPage } from '../components/common/DetailPage';
import { toast } from 'react-toastify';

export const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: sale,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => apiService.getSaleById(id!),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/sales');
  };

  const handleEdit = () => {
    navigate(`/sales/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      // TODO: Implement delete functionality
      toast.error('Delete functionality not implemented yet');
    }
  };

  return (
    <DetailPage
      title="Sale Details"
      data={sale}
      isLoading={isLoading}
      error={error?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onBack={handleBack}
    />
  );
}; 