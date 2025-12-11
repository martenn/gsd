import { Button } from '../ui/button';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  total: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  total,
  itemsPerPage,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages === 0) {
    return null;
  }

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, total);

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-4"
      aria-label="Pagination"
    >
      <div className="text-sm text-foreground">
        Showing <span className="font-medium">{start}</span> to{' '}
        <span className="font-medium">{end}</span> of <span className="font-medium">{total}</span>{' '}
        results
      </div>

      <div className="flex flex-wrap gap-1 justify-center">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
          variant="outline"
          size="sm"
          aria-label="Previous page"
        >
          Previous
        </Button>

        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-1 text-muted-foreground">
                …
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Page ${pageNum}`}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          variant="outline"
          size="sm"
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
