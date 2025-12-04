import { useState, useEffect } from 'react';
import { useDoneQuery } from '../../hooks/useDone';
import { MetricsHeader } from '../done/MetricsHeader';
import { CompletedTaskList } from '../done/CompletedTaskList';
import { PaginationControls } from '../done/PaginationControls';

export function DoneView() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      return pageParam ? parseInt(pageParam, 10) : 1;
    }
    return 1;
  });

  const limit = 50;
  const offset = (currentPage - 1) * limit;

  const { data, isLoading, error, refetch } = useDoneQuery({ limit, offset });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('page', currentPage.toString());
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentPage]);

  useEffect(() => {
    if (data) {
      const totalPages = Math.ceil(data.total / limit);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
      }
    }
  }, [data, currentPage, limit]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Done Archive</h1>

      <MetricsHeader />

      <div className="mt-6">
        <CompletedTaskList
          tasks={data?.tasks ?? []}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
        />
      </div>

      {data && data.total > 0 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            total={data.total}
            itemsPerPage={limit}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
