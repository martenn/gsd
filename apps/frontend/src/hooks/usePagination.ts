import { useState, useCallback } from 'react';
import type { PaginationInfo } from '../types/done';

interface UsePaginationOptions {
  initialPage?: number;
  itemsPerPage: number;
}

interface UsePaginationReturn {
  paginationInfo: PaginationInfo;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setTotal: (total: number) => void;
}

export function usePagination({
  initialPage = 1,
  itemsPerPage,
}: UsePaginationOptions): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / itemsPerPage);

  const paginationInfo: PaginationInfo = {
    currentPage,
    totalPages,
    total,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages || 1));
      setCurrentPage(validPage);
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [paginationInfo.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [paginationInfo.hasPreviousPage]);

  return {
    paginationInfo,
    goToPage,
    nextPage,
    previousPage,
    setTotal,
  };
}
