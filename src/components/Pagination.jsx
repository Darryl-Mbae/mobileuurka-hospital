import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoChevronDown } from 'react-icons/io5';
import '../css/Pagination.css';

/**
 * Custom Dropdown Component for Items Per Page
 */
const CustomDropdown = ({ value, options, onChange, disabled, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <label className="dropdown-label">{label}</label>
      <div
        className={`dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} ${value}`}
      >
        <span className="dropdown-value">{value}</span>
        <IoChevronDown className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`} />
      </div>
      {isOpen && (
        <div className="dropdown-menu" role="listbox">
          {options.map((option) => (
            <div
              key={option}
              className={`dropdown-option ${option === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
              role="option"
              aria-selected={option === value}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Reusable Pagination Component
 * Provides pagination functionality with customizable options
 */
const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  className = '',
  showItemsPerPageSelector = true,
  itemsPerPageOptions = [10, 25, 50, 100],
  showPageInfo = true,
  maxVisiblePages = 7,
  isLoading = false,
  ariaLabel = 'Pagination Navigation'
}) => {
  // Pagination calculation utilities
  const calculatePaginationData = () => {
    // Validate inputs
    const validTotalItems = Math.max(0, totalItems);
    const validItemsPerPage = Math.max(1, itemsPerPage);
    const totalPages = Math.ceil(validTotalItems / validItemsPerPage);
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
    
    // Calculate start and end indices for current page
    const startIndex = (validCurrentPage - 1) * validItemsPerPage;
    const endIndex = Math.min(startIndex + validItemsPerPage - 1, validTotalItems - 1);
    
    // Calculate navigation states
    const hasPreviousPage = validCurrentPage > 1;
    const hasNextPage = validCurrentPage < totalPages;
    
    return {
      totalPages,
      validCurrentPage,
      startIndex,
      endIndex,
      hasPreviousPage,
      hasNextPage,
      validTotalItems,
      validItemsPerPage
    };
  };

  const calculatePageRange = (currentPage, totalPages, maxVisible) => {
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisible / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages = [];
    
    // Always show first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
    }

    // Add visible page range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const paginationData = calculatePaginationData();
  const {
    totalPages,
    validCurrentPage,
    startIndex,
    endIndex,
    hasPreviousPage,
    hasNextPage,
    validTotalItems,
    validItemsPerPage
  } = paginationData;

  // Don't render if there's no data or only one page and no items per page selector
  if (validTotalItems === 0 || (totalPages <= 1 && !showItemsPerPageSelector)) {
    return null;
  }

  const pageRange = calculatePageRange(validCurrentPage, totalPages, maxVisiblePages);

  const handlePageChange = (page) => {
    if (page !== validCurrentPage && page >= 1 && page <= totalPages && !isLoading) {
      onPageChange(page);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage && !isLoading) {
      onPageChange(validCurrentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && !isLoading) {
      onPageChange(validCurrentPage + 1);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (onItemsPerPageChange && !isLoading) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  return (
    <nav 
      className={`pagination ${className}`} 
      aria-label={ariaLabel}
      role="navigation"
    >
      <div className="pagination-container">
        {/* Page Info Display */}
        {showPageInfo && validTotalItems > 0 && (
          <div className="pagination-info">
            Showing {startIndex + 1}-{endIndex + 1} of {validTotalItems} items
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            {/* Previous Button */}
            <button
              className={`pagination-btn pagination-prev ${!hasPreviousPage || isLoading ? 'disabled' : ''}`}
              onClick={handlePreviousPage}
              disabled={!hasPreviousPage || isLoading}
              aria-label="Go to previous page"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="pagination-pages">
              {pageRange.map((page) => {
                if (typeof page === 'string') {
                  // Render ellipsis
                  return (
                    <span key={page} className="pagination-ellipsis" aria-hidden="true">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    className={`pagination-btn pagination-page ${page === validCurrentPage ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(page)}
                    disabled={isLoading}
                    aria-label={`Go to page ${page}`}
                    aria-current={page === validCurrentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              className={`pagination-btn pagination-next ${!hasNextPage || isLoading ? 'disabled' : ''}`}
              onClick={handleNextPage}
              disabled={!hasNextPage || isLoading}
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        )}

        {/* Items Per Page Selector */}
        {/* {showItemsPerPageSelector && onItemsPerPageChange && (
          <div className="pagination-items-per-page">
            <CustomDropdown
              value={validItemsPerPage}
              options={itemsPerPageOptions}
              onChange={handleItemsPerPageChange}
              disabled={isLoading}
              label="Items per page:"
            />
          </div>
        )} */}
      </div>
    </nav>
  );
};

// PropTypes for validation
Pagination.propTypes = {
  // Required props
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  
  // Optional props
  onItemsPerPageChange: PropTypes.func,
  className: PropTypes.string,
  showItemsPerPageSelector: PropTypes.bool,
  itemsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  showPageInfo: PropTypes.bool,
  maxVisiblePages: PropTypes.number,
  isLoading: PropTypes.bool,
  ariaLabel: PropTypes.string
};

// Default props
Pagination.defaultProps = {
  onItemsPerPageChange: null,
  className: '',
  showItemsPerPageSelector: true,
  itemsPerPageOptions: [10, 25, 50, 100],
  showPageInfo: true,
  maxVisiblePages: 7,
  isLoading: false,
  ariaLabel: 'Pagination Navigation'
};

export default Pagination;