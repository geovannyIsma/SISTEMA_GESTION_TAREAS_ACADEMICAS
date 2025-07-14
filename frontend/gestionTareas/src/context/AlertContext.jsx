import { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    type: 'info',
    message: '',
    isVisible: false,
    duration: 3000
  });

  const showAlert = useCallback((type, message, duration = 5000) => {
    setAlertState({
      type,
      message,
      isVisible: true,
      duration
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ alertState, showAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
