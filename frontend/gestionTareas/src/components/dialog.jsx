import { useEffect, useRef } from 'react';

const Dialog = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  confirmText = 'Aceptar', 
  cancelText = 'Cancelar',
  onConfirm,
  type = 'info',
  showCancel = true,
  preventOutsideClick = false,
  width = 'max-w-md'
}) => {
  const dialogRef = useRef(null);

  // Manejar el cierre con la tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (isOpen && e.key === 'Escape' && !preventOutsideClick) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, preventOutsideClick]);

  // Detener la propagación de clics dentro del modal
  const handleDialogClick = (e) => {
    e.stopPropagation();
  };

  // Cerrar al hacer clic fuera del modal
  const handleBackdropClick = (e) => {
    if (preventOutsideClick) return;
    if (dialogRef.current && !dialogRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Estilos según el tipo
  const dialogStyles = {
    info: {
      border: 'border-blue-700',
      header: 'bg-blue-50 text-blue-700',
      icon: 'text-blue-700',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    success: {
      border: 'border-green-700',
      header: 'bg-green-50 text-green-700',
      icon: 'text-green-700',
      confirmBtn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    },
    warning: {
      border: 'border-yellow-600',
      header: 'bg-yellow-50 text-yellow-600',
      icon: 'text-yellow-600',
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
    error: {
      border: 'border-red-700',
      header: 'bg-red-50 text-red-700',
      icon: 'text-red-700',
      confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    question: {
      border: 'border-indigo-700',
      header: 'bg-indigo-50 text-indigo-700',
      icon: 'text-indigo-700',
      confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    }
  };

  const style = dialogStyles[type] || dialogStyles.info;

  // Renderizar el icono según el tipo
  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'question':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div 
    className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
    onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={dialogRef}
        className={`bg-white rounded-lg shadow-xl transform transition-all ${width} border-t-4 ${style.border} animate-dialogAppear`}
        onClick={handleDialogClick}
      >
        <div className={`px-4 py-3 ${style.header} rounded-t-lg flex items-center`}>
          <div className={`${style.icon} mr-2`}>
            {renderIcon()}
          </div>
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        
        <div className="p-6">
          <div className="text-gray-700">
            {children}
          </div>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${style.confirmBtn} focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
