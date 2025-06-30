import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Definir elementos del menú según el rol del usuario
  const getMenuItems = () => {
    const items = [
      { 
        id: 'dashboard', 
        name: 'Panel Principal', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
          </svg>
        ), 
        path: '/dashboard' 
      },
    ];
    
    // Elementos solo para administradores
    if (user?.role === 'ADMINISTRADOR') {
      items.push({ 
        id: 'users', 
        name: 'Gestión de Usuarios', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ), 
        path: '/users' 
      });
    }
    
    // Agregar otros elementos que se implementarán más adelante
    items.push(
      { 
        id: 'settings', 
        name: 'Configuración', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ), 
        path: '/settings', 
        disabled: true 
      }
    );
    
    return items;
  };
  
  const menuItems = getMenuItems();

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} md:block bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform md:relative md:translate-x-0 transition duration-200 ease-in-out z-20`}>
      <div className="flex items-center justify-center mb-10 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Sistema de Tareas</h1>
          <p className="text-xs text-gray-200 mt-1">Gestión Académica</p>
        </div>
      </div>

      <nav className="space-y-1 px-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.disabled ? '#' : item.path}
            className={`flex items-center py-3 px-4 transition duration-200 ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
            } rounded-lg ${
              location.pathname.startsWith(item.path) ? 'bg-gray-700 shadow-md font-medium' : ''
            }`}
            onClick={e => item.disabled && e.preventDefault()}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
            {item.disabled && <span className="ml-2 text-xs text-gray-300">(próximamente)</span>}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-2 mt-auto absolute bottom-0 w-full left-0 bg-gray-900 rounded-t-lg">
        <button 
          onClick={logout} 
          className="flex items-center w-full py-2 px-4 transition duration-200 hover:bg-gray-800 rounded text-left mb-4 text-gray-100"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
        
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-800 font-bold">
            {user?.name.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-gray-100 truncate">{user?.name || 'Usuario'}</div>
            <div className="text-xs text-gray-300 truncate">{user?.email || 'usuario@example.com'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
