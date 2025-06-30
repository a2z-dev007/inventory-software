// src/hooks/usePagination.ts
import { useState } from 'react';

export interface Pagination {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

export const usePagination = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);

  const handleNext = (pagination: Pagination) => {
    if (page < pagination.pages) {
      const newPage = page + 1;
      console.log('Going to next page:', newPage);
      setPage(newPage);
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      const newPage = page - 1;
      console.log('Going to previous page:', newPage);
      setPage(newPage);
    }
  };

  const resetPage = () => {
    setPage(1);
  };

  return {
    page,
    setPage,
    handleNext,
    handlePrev,
    resetPage,
  };
};
