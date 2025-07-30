import React from "react";
import { useNavigate } from "react-router-dom";
import { IoCheckmarkCircle } from "react-icons/io5";
import "../css/SuccessMessage.css";
import { FaTimes } from "react-icons/fa";
import { RiInformation2Line } from "react-icons/ri";
import { IoMdInformationCircle } from "react-icons/io";

const SuccessMessage = ({
  title = "Success!",
  message = "Your action was completed successfully.",
  showNextButton = false,
  nextButtonText = "Next",
  nextButtonAction = null,
  showScreeningButton = false,
  closeAction = null,
  showProceedButton = false,
  proceedButtonText = "Proceed",
  proceedButtonAction = null,
  onClose = null,
}) => {
  const navigate = useNavigate();



  const handleGoToScreening = () => {
    navigate(`/Screening`);
    window.location.reload();
  };

  const handleNext = () => {
    if (nextButtonAction) {
      nextButtonAction();
    }
  };


  return (
    <div className="success-overlay">
      <div className="success-container">
        {title === "Action Needed"  ? (
          <div>
            <div className="success-icon" >
            <IoMdInformationCircle  style={{
              color:"#ffc187"
            }}/>

          </div>
          </div>
        ) : (
          <div className="success-icon">
            <IoCheckmarkCircle />
          </div>
        )}

        <h2 className="success-title">{title}</h2>
        <p className="success-message">{message}</p>

        <div className="success-buttons">
          {showScreeningButton && (
            <button
              className="success-btn primary"
              onClick={handleGoToScreening}
              style={{
                backgroundColor: title == "Action Needed"  ? "#ffc187" : "#008540"
              }}
            >
              Go to Screening
            </button>
          )}

          { showProceedButton && (
            <button
              className="success-btn primary"
              onClick={proceedButtonAction}
              style={{
                backgroundColor: title == "Action Needed"  ? "#ffc187" : "#008540"
              }}
            >
              {proceedButtonText}
            </button>
          )}

          {onClose && (
            <div className="close" onClick={() => {
              onClose();
              closeAction();
            }}>
            
              <FaTimes />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;
