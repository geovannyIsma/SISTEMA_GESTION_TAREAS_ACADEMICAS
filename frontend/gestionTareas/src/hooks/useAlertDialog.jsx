import { useState } from 'react';

/**
 * Custom hook for handling alerts and dialogs
 */
const useAlertDialog = () => {
  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    type: 'error',
    message: '',
    isVisible: false,
    duration: 5000
  });

  // Dialog state
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: 'question',
    title: '',
    message: '',
    action: null,
    actionData: null
  });

  // Show alert with specified type, message and duration
  const showAlert = (type, message, duration = 5000) => {
    setAlertConfig({ type, message, isVisible: true, duration });
  };

  // Close alert
  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isVisible: false }));
  };

  // Show dialog with specified type, title, message, action and optional data
  const showDialog = (type, title, message, action, actionData = null) => {
    setDialogConfig({
      isOpen: true,
      type,
      title,
      message,
      action,
      actionData
    });
  };

  // Close dialog
  const closeDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  return {
    alertConfig,
    showAlert,
    closeAlert,
    dialogConfig,
    showDialog,
    closeDialog
  };
};

export default useAlertDialog;
