import React from 'react';
import { getNextStep, getStepProgress } from '../config/screeningFlowConfig';
import '../css/NextScreeningButton.css';

const NextScreeningButton = ({
  flowId = 'PATIENT_SCREENING',
  currentStepId,
  patientId,
  onNext,
  className = '',
  disabled = false
}) => {
  const nextStep = getNextStep(flowId, currentStepId);
  const progress = getStepProgress(flowId, currentStepId);

  console.log(nextStep)

  if (!nextStep) {
    return (
      <div className={`screening-completion ${className}`}>
        <div className="completion-icon">✅</div>
        <div className="completion-text">
          <h3>Screening Complete!</h3>
          <p>All required assessments have been completed.</p>
        </div>

      </div>
    );
  }

  const handleNext = () => {
    if (onNext && !disabled) {
      onNext({
        nextStep,
        patientId,
        flowId,
        progress
      });
    }
  };

  return (
    <div className={`next-screening-container ${className}`}>




      <button
        className={`next-screening-btn ${disabled ? 'disabled' : ''}`}
        onClick={handleNext}
        disabled={disabled}
      >
        <span>Continue to {nextStep.name}</span>
        <span className="arrow">→</span>
      </button>
    </div>
  );
};

export default NextScreeningButton;