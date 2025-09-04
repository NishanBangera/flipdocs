import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { useCallback, useMemo } from "react";

export interface IPaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  paginate: (pageNumber: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const Pagination = ({
  totalItems,
  itemsPerPage,
  paginate,
  currentPage = 0,
  onPageSizeChange,
}: IPaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Generate page size options with smart limiting
  const getPageSizeOptions = useMemo(() => {
    const baseOptions = [5, 10, 15, 20, 25, 50, 100];
    // Only show options that are less than or equal to total items
    const validOptions = baseOptions.filter(option => option <= totalItems);
    // Always include current itemsPerPage if it's not in the list
    if (!validOptions.includes(itemsPerPage) && itemsPerPage <= totalItems) {
      validOptions.push(itemsPerPage);
      validOptions.sort((a, b) => a - b);
    }
    // Limit to 5 options for dropdown UX
    return validOptions.slice(0, 5);
  }, [totalItems, itemsPerPage]);

  // Calculate the 3-page range to display
  const getThreePageRange = useMemo(() => {
    if (totalPages <= 3) {
      // If total pages is 3 or less, show all pages
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    // Always show exactly 3 pages
    let startPage = Math.max(0, currentPage - 1); // Try to center current page
    let endPage = startPage + 2;

    // Adjust if we're near the end
    if (endPage >= totalPages) {
      endPage = totalPages - 1;
      startPage = Math.max(0, endPage - 2);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  }, [currentPage, totalPages]);

  const pageNumbers = getThreePageRange;

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      paginate(currentPage - 1);
    }
  }, [currentPage, paginate]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      paginate(currentPage + 1);
    }
  }, [currentPage, totalPages, paginate]);

  const handlePageSizeChange = useCallback((value: string) => {
    const newPageSize = parseInt(value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  }, [onPageSizeChange]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center px-4 p-2 dark:text-white ">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Showing items</span>
          {onPageSizeChange && getPageSizeOptions.length > 1 && (
            <div className="flex items-center space-x-2">
              <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="!h-6 !py-1 !px-2 p-3 text-sm min-w-[2.5rem] w-fit rounded cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getPageSizeOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <span className="text-sm">{(currentPage * itemsPerPage) + 1}{"-"}{Math.min((currentPage + 1) * itemsPerPage, totalItems)} of{" "}
            {totalItems}</span>

        </div>

        <div className="flex items-center space-x-1 text-sm">
          {/* Previous Page */}
          <button
            className="px-2 py-1 text-muted-foreground border border-transparent hover:border-border hover:dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onClick={handlePrev}
            disabled={currentPage === 0}
          >
            <IconChevronLeft size={20} />
          </button>

          {/* Page Numbers - Always show exactly 3 pages */}
          {pageNumbers.map((number) => (
            <button
              key={number}
              className={`px-2 py-1 rounded cursor-pointer border text-muted-foreground hover:border-border hover:text-white ${currentPage === number
                ? "border-border text-white"
                : "border-transparent"
                }`}
              onClick={() => paginate(number)}

            >
              {number + 1}
            </button>
          ))}

          {/* Next Page */}
          <button
            className="px-2 py-1 text-muted-foreground border border-transparent hover:border-border hover:dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
          >
            <IconChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;