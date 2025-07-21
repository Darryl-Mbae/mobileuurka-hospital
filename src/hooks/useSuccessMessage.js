import { useState } from 'react';

/**
 * Custom hook for managing success message state in forms
 * @param {Function} clearFormFunction - Function to clear/reset the form
 * @returns {Object} Success message state and handlers
 */
export const useSuccessMessage = (clearFormFunction = null) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successConfig, setSuccessConfig] = useState({
    title: "Success!",
    message: "Your action was completed successfully.",
    showRedoButton: true,
    showNextButton: false,
    nextButtonText: "Next",
    setInternalTab: null,
    nextButtonAction: null,
    showScreeningButton: false,
    patientId: null
  });

  /**
   * Show success message with custom configuration
   * @param {Object} config - Success message configuration
   */
  const showSuccessMessage = (config = {}) => {
    setSuccessConfig({
      ...successConfig,
      ...config
    });
    setShowSuccess(true);
  };

  /**
   * Hide success message
   */
  const hideSuccessMessage = () => {
    setShowSuccess(false);
  };

  /**
   * Handle form submission success
   * @param {Object} config - Success message configuration
   */
  const handleFormSuccess = (config = {}) => {
    showSuccessMessage(config);
  };

  /**
   * Handle redo action - clears form and hides success message
   */
  const handleRedo = () => {
    if (clearFormFunction) {
      clearFormFunction();
    }
    hideSuccessMessage();
  };

  return {
    showSuccess,
    successConfig: {
      ...successConfig,
      clearForm: clearFormFunction,
      onRedo: handleRedo,
      onClose: hideSuccessMessage
    },
    showSuccessMessage: handleFormSuccess,
    hideSuccessMessage,
    handleRedo
  };
};

export default useSuccessMessage;