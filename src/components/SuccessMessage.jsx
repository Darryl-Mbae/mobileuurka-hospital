import React from "react";
import { useNavigate } from "react-router-dom";
import { IoCheckmarkCircle } from "react-icons/io5";
import "../css/SuccessMessage.css";
import { FaTimes } from "react-icons/fa";
import { RiInformation2Line } from "react-icons/ri";
import { IoMdInformationCircle } from "react-icons/io";
import { MdError } from "react-icons/md";
import NextScreeningButton from "./NextScreeningButton";

const SuccessMessage = ({
  title = "Success!",
  message = "Your action was completed successfully.",
  showNextButton = false,
  nextButtonText = "Next",
  nextButtonAction = null,
  showScreeningButton = true,
  closeAction = null,
  showFeedbackButton = false,
  showProceedButton = false,
  proceedButtonText = "Proceed",
  proceedButtonAction = null,
  onClose = null,
  // New props for screening flow
  showNextScreening = false,
  flowId = 'PATIENT_SCREENING',
  currentStepId = null,
  patientId = null,
  onNextScreening = null,
}) => {
  const navigate = useNavigate();

  const handleGoToScreening = () => {
    navigate(`/Screening`);
  };

  const handleGoToFeedback = () => {
    navigate(`/Feedback`);
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
        {title === "Action Needed" ? (
          <div>
            <div className="success-icon">
              <IoMdInformationCircle
                style={{
                  color: "#ffc187",
                }}
              />
            </div>
          </div>
        ) : title === "Feature Unavailable During Pilot" ? (
          <div className="success-icon" style={{ color: "#008540" }}>
            <MdError />
          </div>
        ) : (
          <div className="success-icon">
            <IoCheckmarkCircle />
          </div>
        )}

        <h2 className="success-title">{title}</h2>
        <p className="success-message">{message}</p>

        {/* Next Screening Flow Button */}
        {showNextScreening && (
          <NextScreeningButton
            flowId={flowId}
            currentStepId={currentStepId}
            patientId={patientId}
            onNext={onNextScreening}
            className="success-next-screening"
          />
        )}
        
        {showScreeningButton && (
          <button
            className="next-screening-btn"
            onClick={handleGoToScreening}
            style={{
              backgroundColor:
                title == "Action Needed" ? "#ffc187" : "#008540",
            }}
          >
            Go to Screening
            <span className="arrow">→</span>
          </button>
        )}

        <div className="success-buttons">

          {showFeedbackButton && (
            <button
              className="success-btn primary"
              onClick={handleGoToFeedback}
            >
              Feedback
            </button>
          )}

          {showProceedButton && (
            <button
              className="success-btn primary"
              onClick={proceedButtonAction}
              style={{
                backgroundColor:
                  title == "Action Needed" ? "#ffc187" : "#008540",
              }}
            >
              {proceedButtonText}
            </button>
          )}

          {onClose && (
            <div
              className="close"
              onClick={() => {
                onClose();
                closeAction();
              }}
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
