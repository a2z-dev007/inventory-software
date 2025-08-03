import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DetailPage } from '../components/common/DetailPage';
import { toast } from 'react-toastify';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiService.getProductById(id!),
    enabled: !!id,
  });

  const handleBack = () => {
    navigate('/products');
  };

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      // TODO: Implement delete functionality
      toast.error('Delete functionality not implemented yet');
    }
  };

  return (
    <DetailPage
      title="Product Details"
      data={product}
      isLoading={isLoading}
      error={error?.message || null}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onBack={handleBack}
    />
  );
}; 