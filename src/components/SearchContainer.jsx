import React, { useState } from 'react'
import { FiSearch, FiPlus, FiRefreshCw } from 'react-icons/fi'
import '../css/SearchContainer.css'

const SearchContainer = ({ 
  placeholder = "Search...", 
  onSearch, 
  onAdd, 
  showAddButton = true,
  addButtonText = "Add",
  searchValue = "",
  onSearchChange,
  onRefresh,
  showRefresh = false
}) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setLocalSearchValue(value)
    
    if (onSearchChange) {
      onSearchChange(value)
    }
    
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleAddClick = () => {
    if (onAdd) {
      onAdd()
    }
  }

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  return (
    <div className="search-container">
      <div className="input-container">
        <FiSearch className="search-icon" />
        <input 
          type="text" 
          placeholder={placeholder}
          value={localSearchValue}
          onChange={handleSearchChange}
        />
      </div>
      <div className="buttons-container">
        {showRefresh && (
          <div className="refresh-button" onClick={handleRefreshClick}>
            <FiRefreshCw className="refresh-icon" />
          </div>
        )}
        {showAddButton && (
          <div className="add-button" onClick={handleAddClick}>
            <FiPlus className="add-icon" />
            <span>{addButtonText}</span>
          </div>
        )}
      </div>
    </div>
  )
      
}

export default SearchContainer