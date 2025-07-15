import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext'; // Import useAlert hook
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation';
import Dialog from '../components/dialog';
import '../pages/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const { showAlert } = useAlert(); // Use the global alert context
  const navigate = useNavigate();
  
  // Estados para validaciones
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '', touched: false });
  const [passwordValidation, setPasswordValidation] = useState({ 
    isValid: false, 
    touched: false, 
    message: '' 
  });
  
  // Estado para diálogo
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

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

  return (
    <div className="min-h-screen flex">
      {/* Left side with enhanced background and logo */}
      <div className="hidden lg:flex lg:w-1/2 login-bg relative items-center">
        {/* Background logo with rotation and layers */}
        <div className="bg-logo-container">
          <div className="bg-logo" style={{ 
            backgroundImage: "url('/logo_st.svg')", 
            backgroundSize: "cover", 
            backgroundPosition: "left center", 
            top: "-10%",
            left: "-25%", 
            right: "-5%",
            bottom: "-10%",
            width: "130%", 
            height: "120%" 
          }}></div>
          <div className="bg-color-layer-1"></div>
          <div className="bg-color-layer-2"></div>
          <div className="bg-color-layer-3"></div>
        </div>
        
        <div className="relative z-10 w-full px-8 md:px-16 flex flex-col items-start justify-center">
          <div className="flex items-center mb-6">
            <div className="p-2 mr-3">
              <img src="/logo_st.svg" alt="Logo" className="h-15 w-15" />
            </div>
            <span className="text-blue-300 text-2xl font-bold text-shadow">
              Sistema de Gestión de Tareas
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-shadow">
            Bienvenido<br />a su cuenta
          </h1>
          <p className="text-blue-200 text-xl max-w-md">
            Plataforma académica para la gestión eficiente de tareas y seguimiento educativo
          </p>
        </div>
      </div>
      
      {/* Right side with login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo - only visible on small screens */}
          <div className="flex items-center justify-center mb-6 lg:hidden">
            <div className="bg-blue-900 p-2 rounded-full mr-3">
              <img src="/logo_st.svg" alt="Logo" className="h-8 w-8" />
            </div>
            <span className="text-blue-900 text-2xl font-bold">Sistema de Gestión</span>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Iniciar sesión</h2>
            
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
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={handleEmailChange}
                />
                {emailValidation.touched && !emailValidation.isValid && (
                  <p className="text-xs text-red-600 mt-1">{emailValidation.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={handlePasswordChange}
                />
                {passwordValidation.touched && !passwordValidation.isValid && (
                  <p className="text-xs text-red-600 mt-1">{passwordValidation.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || (emailValidation.touched && !emailValidation.isValid)}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || (emailValidation.touched && !emailValidation.isValid) 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Iniciando sesión...
                    </>
                  ) : 'Iniciar sesión'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="text-center mt-6 text-sm text-gray-500">
            © {new Date().getFullYear()} Sistema de Gestión de Tareas Académicas. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;