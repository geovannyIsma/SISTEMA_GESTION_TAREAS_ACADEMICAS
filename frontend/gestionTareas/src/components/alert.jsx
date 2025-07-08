import { useEffect } from 'react';

const Alert = ({ type, message, isVisible, onClose, autoHideDuration = 3000 }) => {
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, autoHideDuration, onClose]);

  if (!isVisible) return null;

  const alertStyles = {
    success: {
      border: 'border-green-700',
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
    error: {
      border: 'border-red-700',
      bg: 'bg-red-50',
      text: 'text-red-700',
    },
    warning: {
      border: 'border-yellow-600',
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
    },
    info: {
      border: 'border-blue-700',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
  };

  const style = alertStyles[type] || alertStyles.info;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        );
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm border-2 ${style.border} ${style.bg} p-4 rounded-md shadow-lg font-vintage`}>
      <div className="flex items-start">
        <div className={`mr-3 flex-shrink-0 ${style.text}`}>
          {renderIcon()}
        </div>
        <div className="flex-1">
          <p className={`font-medium ${style.text}`}>{message}</p>
        </div>
        <button 
          className={`ml-3 flex-shrink-0 ${style.text} hover:opacity-75`}
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Alert;
