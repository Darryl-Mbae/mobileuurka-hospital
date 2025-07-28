import { useState } from 'react';

/**
 * Custom hook for managing outdated data dialog state
 * @returns {Object} Dialog state and handlers
 */
export const useOutdatedDialog = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: "Outdated Data",
    message: "Some data may be outdated.",
    confirmText: "Proceed Anyway",
    cancelText: "Cancel",
    showCloseButton: true
  });
  const [dialogResolve, setDialogResolve] = useState(null);

  /**
   * Show dialog and return a promise that resolves with user's choice
   * @param {Object} config - Dialog configuration
   * @returns {Promise<boolean>} Promise that resolves to true if confirmed, false if cancelled
   */
  const showOutdatedDialog = (config = {}) => {
    return new Promise((resolve) => {
      setDialogConfig({
        ...dialogConfig,
        ...config
      });
      setDialogResolve(() => resolve);
      setShowDialog(true);
    });
  };

  /**
   * Hide dialog
   */
  const hideDialog = () => {
    setShowDialog(false);
    setDialogResolve(null);
  };

  /**
   * Handle confirm action
   */
  const handleConfirm = () => {
    if (dialogResolve) {
      dialogResolve(true);
    }
    hideDialog();
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (dialogResolve) {
      dialogResolve(false);
    }
    hideDialog();
  };

  /**
   * Handle close action (same as cancel)
   */
  const handleClose = () => {
    if (dialogResolve) {
      dialogResolve(false);
    }
    hideDialog();
  };

  return {
    showDialog,
    dialogConfig: {
      ...dialogConfig,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      onClose: handleClose
    },
    showOutdatedDialog,
    hideDialog
  };
};

export default useOutdatedDialog;