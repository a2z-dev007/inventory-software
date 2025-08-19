import { useState } from "react";

export function useDeleteModal<T>() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const openDeleteModal = (item: T) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return {
    isDeleteModalOpen,
    itemToDelete,
    openDeleteModal,
    closeDeleteModal,
  };
}
