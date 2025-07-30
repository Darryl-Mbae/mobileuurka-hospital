import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Simple debounce utility function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Custom hook for managing pagination state and calculations
 * @param {Object} options - Configuration options
 * @param {number} options.totalItems - Total number of items
 * @param {number} options.initialItemsPerPage - Initial items per page (default: 25)
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {Function} options.onPageChange - Callback for page changes
 * @param {Function} options.onItemsPerPageChange - Callback for items per page changes
 * @param {number} options.debounceDelay - Debounce delay for page changes (default: 300ms)
 * @returns {Object} Pagination state and helper functions
 */
export const usePagination = ({
  totalItems = 0,
  initialItemsPerPage = 25,
  initialPage = 1,
  onPageChange = null,
  onItemsPerPageChange = null,
  debounceDelay = 300
}) => {
  // State management
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for debounced callbacks
  const onPageChangeRef = useRef(onPageChange);
  const onItemsPerPageChangeRef = useRef(onItemsPerPageChange);

  // Update refs when callbacks change
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    onItemsPerPageChangeRef.current = onItemsPerPageChange;
  }, [onItemsPerPageChange]);

  // Debounced page change handler
  const debouncedPageChange = useCallback(
    debounce((page) => {
      if (onPageChangeRef.current) {
        onPageChangeRef.current(page);
      }
      setIsLoading(false);
    }, debounceDelay),
    [debounceDelay]
  );

  // Debounced items per page change handler
  const debouncedItemsPerPageChange = useCallback(
    debounce((newItemsPerPage, newPage) => {
      if (onItemsPerPageChangeRef.current) {
        onItemsPerPageChangeRef.current(newItemsPerPage, newPage);
      }
      setIsLoading(false);
    }, debounceDelay),
    [debounceDelay]
  );

  // Calculated pagination values
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
    const hasNextPage = validCurrentPage < totalPages;
    const hasPreviousPage = validCurrentPage > 1;

    return {
      currentPage: validCurrentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      startIndex,
      endIndex,
      hasNextPage,
      hasPreviousPage,
      isFirstPage: validCurrentPage === 1,
      isLastPage: validCurrentPage === totalPages,
      isEmpty: totalItems === 0,
      isSinglePage: totalPages <= 1
    };
  }, [currentPage, itemsPerPage, totalItems]);

  // Page change handler
  const handlePageChange = useCallback((page) => {
    const newPage = Math.min(Math.max(1, page), paginationData.totalPages);
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      setIsLoading(true);
      debouncedPageChange(newPage);
    }
  }, [currentPage, paginationData.totalPages, debouncedPageChange]);

  // Items per page change handler
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    if (newItemsPerPage !== itemsPerPage && newItemsPerPage > 0) {
      // Calculate what the new page should be to maintain roughly the same position
      const currentStartIndex = (currentPage - 1) * itemsPerPage;
      const newPage = Math.max(1, Math.ceil((currentStartIndex + 1) / newItemsPerPage));
      
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(newPage);
      setIsLoading(true);
      debouncedItemsPerPageChange(newItemsPerPage, newPage);
    }
  }, [currentPage, itemsPerPage, debouncedItemsPerPageChange]);

  // Navigation helpers
  const goToNextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, paginationData.hasNextPage, handlePageChange]);

  const goToPreviousPage = useCallback(() => {
    if (paginationData.hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, paginationData.hasPreviousPage, handlePageChange]);

  const goToFirstPage = useCallback(() => {
    handlePageChange(1);
  }, [handlePageChange]);

  const goToLastPage = useCallback(() => {
    handlePageChange(paginationData.totalPages);
  }, [paginationData.totalPages, handlePageChange]);

  // Helper function to get page range for display
  const getPageRange = useCallback((maxVisiblePages = 7) => {
    const { totalPages, currentPage } = paginationData;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    
    // Add first page if not in range
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page if not in range
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [paginationData]);

  // Helper function to get current page info text
  const getPageInfo = useCallback(() => {
    const { startIndex, endIndex, totalItems, isEmpty } = paginationData;
    
    if (isEmpty) {
      return 'No items to display';
    }

    const displayStart = startIndex + 1;
    const displayEnd = endIndex + 1;
    
    return `Showing ${displayStart}-${displayEnd} of ${totalItems}`;
  }, [paginationData]);

  // Helper function to slice data for current page (for client-side pagination)
  const getPaginatedData = useCallback((data = []) => {
    const { startIndex, endIndex } = paginationData;
    return data.slice(startIndex, endIndex + 1);
  }, [paginationData]);

  // Reset pagination when total items change significantly
  useEffect(() => {
    const { totalPages } = paginationData;
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, currentPage, paginationData]);

  return {
    // State
    ...paginationData,
    isLoading,

    // Handlers
    handlePageChange,
    handleItemsPerPageChange,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,

    // Helpers
    getPageRange,
    getPageInfo,
    getPaginatedData,

    // Setters for external control
    setCurrentPage: handlePageChange,
    setItemsPerPage: handleItemsPerPageChange,
    setIsLoading
  };
};

export default usePagination;