/**
 * Example usage of usePagination hook
 * This file demonstrates how to integrate the pagination hook with existing pages
 */

import React, { useState, useEffect } from 'react';
import { usePagination } from './usePagination';
import Pagination from '../components/Pagination';

// Example 1: Client-side pagination (for small datasets)
export const ClientSidePaginationExample = ({ data = [] }) => {
  const {
    // Pagination state
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    isLoading,
    
    // Handlers
    handlePageChange,
    handleItemsPerPageChange,
    
    // Helpers
    getPaginatedData,
    getPageInfo
  } = usePagination({
    totalItems: data.length,
    initialItemsPerPage: 25,
    initialPage: 1
  });

  // Get current page data
  const currentPageData = getPaginatedData(data);

  return (
    <div>
      <div className="data-list">
        {currentPageData.map((item, index) => (
          <div key={index} className="data-item">
            {/* Render your data item here */}
            {JSON.stringify(item)}
          </div>
        ))}
      </div>
      
      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isLoading={isLoading}
        showPageInfo={true}
        showItemsPerPageSelector={true}
      />
    </div>
  );
};

// Example 2: Server-side pagination (for large datasets)
export const ServerSidePaginationExample = ({ apiEndpoint }) => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const {
    currentPage,
    itemsPerPage,
    isLoading,
    handlePageChange,
    handleItemsPerPageChange,
    setIsLoading
  } = usePagination({
    totalItems: totalCount,
    initialItemsPerPage: 25,
    initialPage: 1,
    onPageChange: (page) => {
      // This will be called when page changes (debounced)
      fetchData(page, itemsPerPage);
    },
    onItemsPerPageChange: (newItemsPerPage, newPage) => {
      // This will be called when items per page changes (debounced)
      fetchData(newPage, newItemsPerPage);
    },
    debounceDelay: 300
  });

  const fetchData = async (page, perPage) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiEndpoint}?page=${page}&limit=${perPage}`);
      const result = await response.json();
      
      setData(result.data || []);
      setTotalCount(result.total || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData(currentPage, itemsPerPage);
  }, []); // Only run once on mount

  return (
    <div>
      <div className="data-list">
        {data.map((item, index) => (
          <div key={item.id || index} className="data-item">
            {/* Render your data item here */}
            {JSON.stringify(item)}
          </div>
        ))}
      </div>
      
      <Pagination
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isLoading={isLoading}
        showPageInfo={true}
        showItemsPerPageSelector={true}
      />
    </div>
  );
};

// Example 3: Integration with existing Patients page pattern
export const PatientsPageIntegration = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    currentPage,
    itemsPerPage,
    totalItems,
    isLoading,
    handlePageChange,
    handleItemsPerPageChange,
    getPaginatedData,
    getPageInfo
  } = usePagination({
    totalItems: filteredPatients.length,
    initialItemsPerPage: 25,
    initialPage: 1
  });

  // Filter patients based on search term
  useEffect(() => {
    if (patients) {
      const safePatients = Array.isArray(patients) ? patients : patients ? [patients] : [];
      const filtered = safePatients.filter(patient => 
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.hospital?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.reasonForVisit?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);

  // Get current page of filtered data
  const currentPagePatients = getPaginatedData(filteredPatients);

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    // Reset to first page when searching
    handlePageChange(1);
  };

  return (
    <div className="patients-page">
      <div className="toolbar">
        <div className="count">
          All Patients <span>{filteredPatients.length || 0}</span>
        </div>
        <div className="search">
          {/* Your existing SearchContainer component */}
          <input 
            type="text" 
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="patients-grid">
        {currentPagePatients.map((patient) => (
          <div key={patient.id} className="patient-card">
            {/* Your existing patient card rendering */}
            <h3>{patient.name}</h3>
            <p>ID: {patient.patientId}</p>
            <p>Hospital: {patient.hospital}</p>
          </div>
        ))}
      </div>

      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isLoading={isLoading}
        showPageInfo={true}
        showItemsPerPageSelector={true}
        itemsPerPageOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};

// Example 4: Advanced usage with custom configuration
export const AdvancedPaginationExample = ({ data, onDataChange }) => {
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isFirstPage,
    isLastPage,
    isEmpty,
    isSinglePage,
    handlePageChange,
    handleItemsPerPageChange,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    getPageRange,
    getPageInfo,
    getPaginatedData
  } = usePagination({
    totalItems: data.length,
    initialItemsPerPage: 10,
    initialPage: 1,
    onPageChange: (page) => {
      console.log(`Page changed to: ${page}`);
      // Custom logic when page changes
      if (onDataChange) {
        onDataChange({ page, itemsPerPage });
      }
    },
    onItemsPerPageChange: (newItemsPerPage, newPage) => {
      console.log(`Items per page changed to: ${newItemsPerPage}, new page: ${newPage}`);
      // Custom logic when items per page changes
      if (onDataChange) {
        onDataChange({ page: newPage, itemsPerPage: newItemsPerPage });
      }
    },
    debounceDelay: 500 // Custom debounce delay
  });

  // Custom navigation handlers
  const handleKeyboardNavigation = (event) => {
    switch (event.key) {
      case 'ArrowLeft':
        if (hasPreviousPage) goToPreviousPage();
        break;
      case 'ArrowRight':
        if (hasNextPage) goToNextPage();
        break;
      case 'Home':
        if (!isFirstPage) goToFirstPage();
        break;
      case 'End':
        if (!isLastPage) goToLastPage();
        break;
    }
  };

  if (isEmpty) {
    return <div>No data available</div>;
  }

  if (isSinglePage) {
    return (
      <div>
        <div className="data-list">
          {data.map((item, index) => (
            <div key={index}>{JSON.stringify(item)}</div>
          ))}
        </div>
        <div className="pagination-info">{getPageInfo()}</div>
      </div>
    );
  }

  const currentPageData = getPaginatedData(data);
  const pageRange = getPageRange(5); // Show max 5 page numbers

  return (
    <div onKeyDown={handleKeyboardNavigation} tabIndex={0}>
      <div className="pagination-info">{getPageInfo()}</div>
      
      <div className="data-list">
        {currentPageData.map((item, index) => (
          <div key={index}>{JSON.stringify(item)}</div>
        ))}
      </div>

      <div className="custom-pagination">
        <button onClick={goToFirstPage} disabled={isFirstPage}>
          First
        </button>
        <button onClick={goToPreviousPage} disabled={!hasPreviousPage}>
          Previous
        </button>
        
        {pageRange.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={typeof page !== 'number'}
            className={page === currentPage ? 'active' : ''}
          >
            {typeof page === 'string' ? '...' : page}
          </button>
        ))}
        
        <button onClick={goToNextPage} disabled={!hasNextPage}>
          Next
        </button>
        <button onClick={goToLastPage} disabled={isLastPage}>
          Last
        </button>

        <select 
          value={itemsPerPage} 
          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <div className="pagination-debug">
        <p>Current Page: {currentPage}</p>
        <p>Total Pages: {totalPages}</p>
        <p>Items Per Page: {itemsPerPage}</p>
        <p>Has Next: {hasNextPage ? 'Yes' : 'No'}</p>
        <p>Has Previous: {hasPreviousPage ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};