import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCheckmarkCircle } from 'react-icons/io5';
import '../css/SuccessMessage.css';
import { FaTimes } from 'react-icons/fa';

const SuccessMessage = ({ 
  title = "Success!", 
  message = "Your action was completed successfully.",
  showRedoButton = true,
  showNextButton = false,
  nextButtonText = "Next",
  nextButtonAction = null,
  setInternalTab =  null,
  onRedo = null,
  clearForm = null,
  showScreeningButton = false,
  patientId = null,
  onClose = null
}) => {
  const navigate = useNavigate();

  const handleRedo = () => {
    // Clear the form first if clearForm function is provided
    if (clearForm) {
      clearForm();
    }
    
    // Then call custom onRedo function if provided
    if (onRedo) {
      onRedo();
    }
    
    // Close the success message to show the form again
    if (onClose) {
      onClose();
      onRedo()
    }
  };

  const handleGoToScreening = () => {
    navigate(`/Screening`);
    window.location.reload();
  };

  const handleNext = () => {
    if (nextButtonAction) {
      nextButtonAction();
    }
  };

  const handleBackToPatient = () => {
    if (patientId) {
      navigate(`/Patient/${patientId}`);
    } else {
      navigate('/Patients');
    }
  };

  return (
    <div className="success-overlay">
      <div className="success-container">
        <div className="success-icon">
          <IoCheckmarkCircle />
        </div>
        
        <h2 className="success-title">{title}</h2>
        <p className="success-message">{message}</p>
        
        <div className="success-buttons">
          
          
          {showScreeningButton && (
            <button 
              className="success-btn primary"
              onClick={handleGoToScreening}
            >
              Go to Screening
            </button>
          )}
          
          {/* {showNextButton && nextButtonAction && (
            <button 
              className="success-btn primary"
              onClick={handleNext}
            >
              {nextButtonText}
            </button>
          )}
           */}
        
          {onClose && (
            <div 
              className="close"
              onClick={onClose}
            >
             <FaTimes />

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;