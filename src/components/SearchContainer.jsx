import React, { useState } from 'react'
import { FiSearch, FiPlus } from 'react-icons/fi'
import '../css/SearchContainer.css'

const SearchContainer = ({ 
  placeholder = "Search...", 
  onSearch, 
  onAdd, 
  addButtonText = "Add",
  searchValue = "",
  onSearchChange 
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
      <div className="add-button" onClick={handleAddClick}>
        <FiPlus className="add-icon" />
        <span>{addButtonText}</span>
      </div>
    </div>
  )
}

export default SearchContainer