import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation';
import Alert from '../components/alert';
import Dialog from '../components/dialog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  
  // Estados para validaciones
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '', touched: false });
  const [passwordValidation, setPasswordValidation] = useState({ 
    isValid: false, 
    touched: false, 
    message: '' 
  });
  
  // Estado para alerta
  const [alertConfig, setAlertConfig] = useState({
    type: 'error',
    message: '',
    isVisible: false
  });
  
  // Estado para diálogo
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Función para mostrar alertas
  const showAlert = (type, message, duration = 5000) => {
    setAlertConfig({ type, message, isVisible: true, duration });
  };

  // Función para cerrar alertas
  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isVisible: false }));
  };

  // Función para mostrar diálogos
  const showDialog = (title, message, type = 'info') => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Función para cerrar diálogos
  const closeDialog = () => {
    setDialogConfig({ ...dialogConfig, isOpen: false });
  };

  const handleEmailChange = (e) => {
    const value = sanitizeInput(e.target.value);
    setEmail(value);
    
    if (value) {
      const validation = validateEmail(value);
      setEmailValidation({ ...validation, touched: true });
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    if (value) {
      const validation = validatePassword(value);
      setPasswordValidation({
        isValid: validation.isValid,
        touched: true,
        minLength: validation.minLength,
        hasUpperCase: validation.hasUpperCase,
        hasLowerCase: validation.hasLowerCase,
        hasNumber: validation.hasNumber,
        hasSpecialChar: validation.hasSpecialChar,
        message: validation.message
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validar el email
      const emailCheck = validateEmail(email);
      if (!emailCheck.isValid) {
        showAlert('error', emailCheck.message);
        return;
      }

      await login(email, password);
      showAlert('success', '¡Inicio de sesión exitoso!', 1500);
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      showAlert('error', err.message || 'Error al iniciar sesión');
    }
  };

  // Estilo dinámico para campos según validación
  const getInputClasses = (isValid, touched) => {
    const baseClasses = "appearance-none relative block w-full px-3 py-3 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:z-10 sm:text-sm";
    
    if (!touched) return `${baseClasses} border border-gray-300`;
    
    return isValid 
      ? `${baseClasses} border border-green-500` 
      : `${baseClasses} border border-red-500`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h1 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Gestión de Tareas Académicas
          </h1>
          <p className="mt-2 text-center text-sm text-gray-700">
            Inicie sesión con su cuenta institucional
          </p>
        </div>
        
        {/* Componente de alerta */}
        <Alert 
          type={alertConfig.type}
          message={alertConfig.message}
          isVisible={alertConfig.isVisible}
          onClose={closeAlert}
          autoHideDuration={alertConfig.duration || 5000}
        />
        
        {/* Componente de diálogo */}
        <Dialog
          isOpen={dialogConfig.isOpen}
          onClose={closeDialog}
          title={dialogConfig.title}
          type={dialogConfig.type}
          confirmText="Entendido"
          showCancel={false}
        >
          <p className="whitespace-pre-line">{dialogConfig.message}</p>
        </Dialog>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <div>
              <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`${getInputClasses(emailValidation.isValid, emailValidation.touched)} rounded-t-md`}
                placeholder="Correo electrónico institucional"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
            {emailValidation.touched && !emailValidation.isValid && (
              <p className="text-xs text-red-600 mt-1">{emailValidation.message}</p>
            )}
          </div>

          <div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`${getInputClasses(passwordValidation.isValid, passwordValidation.touched)} rounded-b-md`}
                placeholder="Contraseña"
                value={password}
                onChange={handlePasswordChange}
              />
            </div>
            {passwordValidation.touched && !passwordValidation.isValid && (
              <p className="text-xs text-red-600 mt-1">{passwordValidation.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || (emailValidation.touched && !emailValidation.isValid)}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || (emailValidation.touched && !emailValidation.isValid) 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out`}
            >
              {loading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Iniciar sesión
                </>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}; 

export default Login;
