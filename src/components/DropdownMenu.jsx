import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa";

const DropdownMenu = ({ data, selected,fontSize, onChange, length, bg }) => {
  const [isActive, setIsActive] = useState(false);

  const toggleDropdown = () => setIsActive(!isActive);

  const handleOptionClick = (value) => {
    onChange(value);
    setIsActive(false);
  };

  // Enhanced selected item finder
  const getSelectedItem = () => {
    const found = data.find((opt) =>
      typeof opt === "object" ? opt.value === selected : opt === selected
    );

    return typeof found === "object"
      ? found
      : { label: found || "Select option" };
  };

  const selectedItem = getSelectedItem();

  return (
    <div
      className={`select-menu ${isActive ? "active" : ""}`}
      style={{
        width: length || "180px",
        fontSize: fontSize ? fontSize : bg ? ".85em" : "1em",
        position: "relative",
        right: "20px",
      }}
    >
      {/* Trigger Button - Now supports images */}
      <div
        className="select-btn"
        onClick={toggleDropdown}
        style={{
          background: bg || "white",
          fontWeight: bg ? "bold" : "500",
          width: length || "180px",
        }}
      >
        <span className="sBtn-text">
          {selectedItem.image && (
            <img
              src={selectedItem.image}
              alt={selectedItem.label}
              className="dropdown-img"
              style={{
                width: "35px",
                height: "35px",
                marginRight: "8px",
                verticalAlign: "middle",
                borderRadius: "5px",

              }}
            />
          )}
          {selectedItem.label}
        </span>
        <FaAngleDown className="icon" />
      </div>

      {/* Options List - Supports images, icons, or plain text */}
      <ul className="options">
        {data.map((option, index) => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          const image = typeof option === "object" ? option.image : null;
          const iconClass =
            typeof option === "object" ? option.iconClass : null;
          const color = typeof option === "object" ? option.color : null;

          return (
            <li
              key={index}
              className="option"
              onClick={() => handleOptionClick(value)}
              style={image ? { marginBottom: "5px",padding:"10px 12px" } : {}}
            >
              {/* Image takes priority, then icon, then neither */}
              {image && (
                <img
                  src={image}
                  alt={label}
                  className="option-img"
                  style={{
                    width: "25px",
                    height: "25px",
                    marginRight: "8px",
                    borderRadius: "5px",
                  }}
                />
              )}
              {!image && iconClass && (
                <i
                  className={iconClass}
                  style={{ color, marginRight: "8px" }}
                ></i>
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
