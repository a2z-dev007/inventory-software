import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DetailPage } from '../components/common/DetailPage';
import { toast } from 'react-toastify';

export const PurchaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: purchase,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => apiService.getPurchaseById(id!),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/purchases');
  };

  const handleEdit = () => {
    navigate(`/purchases/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      // TODO: Implement delete functionality
      toast.error('Delete functionality not implemented yet');
    }
  };

  return (
    <DetailPage
      title="Purchase Details"
      data={purchase}
      isLoading={isLoading}
      error={error?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onBack={handleBack}
    />
  );
}; 