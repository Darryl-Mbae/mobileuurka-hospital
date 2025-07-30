# usePagination Hook

A comprehensive React hook for managing pagination state and calculations with debounced API calls.

## Features

- **State Management**: Handles current page, items per page, and loading states
- **Debounced Callbacks**: Prevents rapid API calls with configurable debounce delay
- **Flexible Integration**: Works with both client-side and server-side pagination
- **Helper Functions**: Provides utilities for data slicing, page info, and navigation
- **Smart Calculations**: Automatically calculates pagination metadata

## Basic Usage

```javascript
import { usePagination } from './usePagination';

const MyComponent = ({ data }) => {
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
    getPaginatedData,
    getPageInfo
  } = usePagination({
    totalItems: data.length,
    initialItemsPerPage: 25,
    initialPage: 1
  });

  const currentPageData = getPaginatedData(data);

  return (
    <div>
      <div>{getPageInfo()}</div>
      {currentPageData.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
};
```

## Server-Side Pagination

```javascript
const {
  currentPage,
  itemsPerPage,
  isLoading,
  handlePageChange,
  handleItemsPerPageChange,
  setIsLoading
} = usePagination({
  totalItems: serverTotalCount,
  initialItemsPerPage: 25,
  onPageChange: (page) => {
    // Called when page changes (debounced)
    fetchData(page, itemsPerPage);
  },
  onItemsPerPageChange: (newItemsPerPage, newPage) => {
    // Called when items per page changes (debounced)
    fetchData(newPage, newItemsPerPage);
  },
  debounceDelay: 300
});
```

## API Reference

### Parameters

- `totalItems` (number): Total number of items
- `initialItemsPerPage` (number, default: 25): Initial items per page
- `initialPage` (number, default: 1): Initial page number
- `onPageChange` (function): Callback for page changes
- `onItemsPerPageChange` (function): Callback for items per page changes
- `debounceDelay` (number, default: 300): Debounce delay in milliseconds

### Returns

#### State
- `currentPage`: Current page number
- `itemsPerPage`: Items per page
- `totalItems`: Total number of items
- `totalPages`: Total number of pages
- `startIndex`: Start index for current page
- `endIndex`: End index for current page
- `hasNextPage`: Whether next page exists
- `hasPreviousPage`: Whether previous page exists
- `isFirstPage`: Whether on first page
- `isLastPage`: Whether on last page
- `isEmpty`: Whether data is empty
- `isSinglePage`: Whether only one page exists
- `isLoading`: Loading state

#### Handlers
- `handlePageChange(page)`: Change to specific page
- `handleItemsPerPageChange(newItemsPerPage)`: Change items per page
- `goToNextPage()`: Navigate to next page
- `goToPreviousPage()`: Navigate to previous page
- `goToFirstPage()`: Navigate to first page
- `goToLastPage()`: Navigate to last page

#### Helpers
- `getPageRange(maxVisiblePages)`: Get array of page numbers for display
- `getPageInfo()`: Get formatted page info string
- `getPaginatedData(data)`: Slice data for current page (client-side)
- `setIsLoading(boolean)`: Manually set loading state

## Integration with Pagination Component

```javascript
<Pagination
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  currentPage={currentPage}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
  isLoading={isLoading}
/>
```

## Examples

See `usePagination.example.js` for comprehensive usage examples including:
- Client-side pagination
- Server-side pagination
- Integration with existing pages
- Advanced configuration options