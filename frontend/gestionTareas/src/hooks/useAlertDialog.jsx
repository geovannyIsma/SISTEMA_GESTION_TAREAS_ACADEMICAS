import { useState } from 'react';
import { useAlert } from '../context/AlertContext'; // Import useAlert

/**
 * Custom hook for handling alerts and dialogs
 */
const useAlertDialog = () => {
  const { showAlert: globalShowAlert, closeAlert: globalCloseAlert } = useAlert(); // Use global alert context

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
    globalShowAlert(type, message, duration); // Use the global alert function
  };

  // Close alert
  const closeAlert = () => {
    globalCloseAlert(); // Use the global close function
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
    alertConfig: {}, // Return empty object as we're using global alerts
    showAlert,
    closeAlert,
    dialogConfig,
    showDialog,
    closeDialog
  };
};

export default useAlertDialog;
