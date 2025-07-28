import React from "react";
import { IoWarningOutline } from "react-icons/io5";
import { FaTimes } from "react-icons/fa";
import "../css/OutdatedDialog.css";

const OutdatedDialog = ({
  title = "Outdated Data",
  message = "Some data may be outdated.",
  confirmText = "Proceed Anyway",
  cancelText = "Cancel",
  onConfirm = null,
  onCancel = null,
  onClose = null,
  showCloseButton = true,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="outdated-overlay">
      <div className="outdated-container">
        <div className="outdated-icon">
          <IoWarningOutline />
        </div>

        <h2 className="outdated-title">{title}</h2>
        <div className="outdated-message">
          {message.split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>

        <div className="outdated-buttons">
          <button className="outdated-btn secondary" onClick={handleCancel}>
            {cancelText}
          </button>
          <button className="outdated-btn primary" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>

        {showCloseButton && (
          <div className="outdated-close" onClick={handleClose}>
            <FaTimes />
          </div>
        )}
      </div>
    </div>
  );
};

export default OutdatedDialog;
