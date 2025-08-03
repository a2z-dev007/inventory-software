import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DetailPage } from '../components/common/DetailPage';
import { toast } from 'react-toastify';

export const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: purchaseOrder,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: () => apiService.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/purchase-orders');
  };

  const handleEdit = () => {
    navigate(`/purchase-orders/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      // TODO: Implement delete functionality
      toast.error('Delete functionality not implemented yet');
    }
  };

  return (
    <DetailPage
      title="Purchase Order Details"
      data={purchaseOrder}
      isLoading={isLoading}
      error={error?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onBack={handleBack}
    />
  );
}; 