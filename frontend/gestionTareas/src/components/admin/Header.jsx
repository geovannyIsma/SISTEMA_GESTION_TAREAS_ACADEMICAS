import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFullName } from '../../utils/validation';

const THEMES = {
  azul: {
    '--color-primary': '#1e40af',
    '--color-primary-light': '#2563eb',
    '--color-primary-dark': '#1e3a8a',
    '--color-primary-50': '#e0e7ff',
    '--color-primary-100': '#c7d2fe',
    '--color-primary-200': '#a5b4fc',
    '--color-primary-800': '#172554',
  },
  verde: {
    '--color-primary': '#059669',
    '--color-primary-light': '#10b981',
    '--color-primary-dark': '#047857',
    '--color-primary-50': '#ecfdf5',
    '--color-primary-100': '#d1fae5',
    '--color-primary-200': '#a7f3d0',
    '--color-primary-800': '#065f46',
  },
  morado: {
    '--color-primary': '#7c3aed',
    '--color-primary-light': '#8b5cf6',
    '--color-primary-dark': '#6d28d9',
    '--color-primary-50': '#f5f3ff',
    '--color-primary-100': '#ede9fe',
    '--color-primary-200': '#ddd6fe',
    '--color-primary-800': '#5b21b6',
  },
  rojo: {
    '--color-primary': '#dc2626',
    '--color-primary-light': '#ef4444',
    '--color-primary-dark': '#b91c1c',
    '--color-primary-50': '#fef2f2',
    '--color-primary-100': '#fee2e2',
    '--color-primary-200': '#fecaca',
    '--color-primary-800': '#991b1b',
  },
  naranja: {
    '--color-primary': '#f59e42',
    '--color-primary-light': '#fbbf24',
    '--color-primary-dark': '#d97706',
    '--color-primary-50': '#fff7ed',
    '--color-primary-100': '#ffedd5',
    '--color-primary-200': '#fed7aa',
    '--color-primary-800': '#9a3412',
  },
  gris: {
    '--color-primary': '#6b7280',
    '--color-primary-light': '#9ca3af',
    '--color-primary-dark': '#374151',
    '--color-primary-50': '#f9fafb',
    '--color-primary-100': '#f3f4f6',
    '--color-primary-200': '#e5e7eb',
    '--color-primary-800': '#1f2937',
  },
  rosa: {
    '--color-primary': '#ec4899',
    '--color-primary-light': '#f472b6',
    '--color-primary-dark': '#be185d',
    '--color-primary-50': '#fdf2f8',
    '--color-primary-100': '#fce7f3',
    '--color-primary-200': '#fbcfe8',
    '--color-primary-800': '#831843',
  },
  cyan: {
    '--color-primary': '#06b6d4',
    '--color-primary-light': '#22d3ee',
    '--color-primary-dark': '#0e7490',
    '--color-primary-50': '#ecfeff',
    '--color-primary-100': '#cffafe',
    '--color-primary-200': '#a5f3fc',
    '--color-primary-800': '#164e63',
  }
};

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('azul');
  const navigate = useNavigate();
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user's full name or initials
  const userFullName = user ? getFullName(user.firstName, user.lastName) : 'Usuario';
  const userInitials = userFullName.charAt(0).toUpperCase();

  // Aplicar el tema seleccionado
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'azul';
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName) => {
    const theme = THEMES[themeName];
    if (!theme) return;
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    localStorage.setItem('app-theme', themeName);
  };

  const handleThemeChange = (e) => {
    const theme = e.target.value;
    setSelectedTheme(theme);
    applyTheme(theme);
  };

  return (
    <header className="bg-gray-50 shadow-sm z-40 relative">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button
              onClick={toggleSidebar}
              aria-label="Alternar menú lateral"
              className="px-4 border-r border-gray-200 text-gray-600 focus:outline-none focus:bg-gray-100 focus:text-gray-800 md:hidden"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/dashboard" className="flex-shrink-0 flex items-center ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Sistema Gestión Académica</h2>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex md:items-center">
              {user?.role === 'ADMINISTRADOR' && (
                <>
                  <Link
                    to="/users"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Usuarios
                  </Link>
                  <Link
                    to="/cursos"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Cursos
                  </Link>
                </>
              )}
            </div>

            {/* Configuración */}
            <div className="ml-2 relative">
              <button
                onClick={() => setIsConfigOpen((v) => !v)}
                className="p-1 rounded-full text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-label="Configuraciones"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  >
                    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                    <path d="M12 2v2"/>
                    <path d="M12 22v-2"/>
                    <path d="m17 20.66-1-1.73"/>
                    <path d="M11 10.27 7 3.34"/>
                    <path d="m20.66 17-1.73-1"/>
                    <path d="m3.34 7 1.73 1"/>
                    <path d="M14 12h8"/>
                    <path d="M2 12h2"/>
                    <path d="m20.66 7-1.73 1"/>
                    <path d="m3.34 17 1.73-1"/>
                    <path d="m17 3.34-1 1.73"/>
                    <path d="m11 13.73-4 6.93"/>
                </svg>
              </button>
              {isConfigOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-2 bg-gray-50 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">Configuraciones</div>
                  <div className="px-4 py-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tema de la app</label>
                    <select
                      value={selectedTheme}
                      onChange={handleThemeChange}
                      className="block w-full mt-1 rounded border-gray-300 focus:ring-primary focus:border-primary text-sm"
                    >
                      <option value="azul">Azul</option>
                      <option value="verde">Verde</option>
                      <option value="morado">Morado</option>
                      <option value="rojo">Rojo</option>
                      <option value="naranja">Naranja</option>
                      <option value="gris">Gris</option>
                      <option value="rosa">Rosa</option>
                      <option value="cyan">Cyan</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              <button 
                className="p-1 rounded-full text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-label="Notificaciones"
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* Dropdown del perfil */}
              <div className="ml-3 relative">
                <div>
                  <button 
                    onClick={toggleDropdown}
                    className="max-w-xs bg-gray-50 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <span className="sr-only">Abrir menú de usuario</span>
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-gray-50 font-medium">
                      {userInitials}
                    </div>
                  </button>
                </div>
                
                {isDropdownOpen && (
                  <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-50 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  >
                    <div className="block px-4 py-2 text-xs text-gray-500">
                      Sesión iniciada como
                    </div>
                    <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <div className="font-medium">{userFullName}</div>
                      <div className="text-xs text-gray-600">{user?.email}</div>
                      <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                        {user?.role === 'ADMINISTRADOR' ? 'Administrador' : 
                         user?.role === 'DOCENTE' ? 'Docente' : 
                         user?.role === 'ESTUDIANTE' ? 'Estudiante' : 'Observador'}
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Panel Principal
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
