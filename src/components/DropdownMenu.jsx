import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa";

const DropdownMenu = ({ data, selected, onChange,length ,bg}) => {
  const [isActive, setIsActive] = useState(false); // State for dropdown toggle

  // Toggle dropdown menu visibility
  const toggleDropdown = () => {
    setIsActive(!isActive);
  };

  // Handle option selection
  const handleOptionClick = (value) => {
    onChange(value); // Call the parent onChange handler with the selected value
    setIsActive(false); // Close the dropdown menu
  };

  return (
    <div className={`select-menu ${isActive ? "active" : ""}`} style={{width: length ? length : "180px",fontSize:bg? '.85em' : '1em', position:'relative', right:'20px'}}>
      {/* Select Button */}
      <div className="select-btn" onClick={toggleDropdown} style={{background:bg ? bg : 'white',fontWeight:bg? 'bold' :'500',width:length ? length : '180px'}}>
        <span className="sBtn-text">{selected || "Select your option"}</span>
        <FaAngleDown className="icon" />
      </div>

      {/* Dropdown Options */}
      <ul className="options">
        {data.map((option, index) => (
          <li
            key={index}
            className="option"
            onClick={() => handleOptionClick(option.text || option)}
          >
            {option.iconClass && (
              <i className={option.iconClass} style={{ color: option.color }}></i>
            )}
            <span className="option-text">{
            option.text === "heart_rate" ? "Heart Rate" :
            option === "heart_rate" ? "Heart Rate" :
            option.text || option}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DropdownMenu;
