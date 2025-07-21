import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa";


const DropdownMenu = ({ data, selected, onChange, length, bg }) => {
  const [isActive, setIsActive] = useState(false);

  const toggleDropdown = () => {
    setIsActive(!isActive);
  };

  const handleOptionClick = (value) => {
    onChange(value);
    setIsActive(false);
  };

  // Find label of the currently selected value
  const getSelectedLabel = () => {
    const found = data.find((opt) =>
      typeof opt === "object" ? opt.value === selected : opt === selected
    );
    return typeof found === "object" ? found.label : found || "Select option";
  };

  return (
    <div
      className={`select-menu ${isActive ? "active" : ""}`}
      style={{
        width: length || "180px",
        fontSize: bg ? ".85em" : "1em",
        position: "relative",
        right: "20px",
      }}
    >
      <div
        className="select-btn"
        onClick={toggleDropdown}
        style={{
          background: bg || "white",
          fontWeight: bg ? "bold" : "500",
          width: length || "180px",
        }}
      >
        <span className="sBtn-text">{getSelectedLabel()}</span>
        <FaAngleDown className="icon" />
      </div>

      <ul className="options">
        {data.map((option, index) => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;

          return (
            <li key={index} className="option" onClick={() => handleOptionClick(value)}>
              {option.iconClass && (
                <i className={option.iconClass} style={{ color: option.color }}></i>
              )}
              <span className="option-text">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};


export default DropdownMenu;
