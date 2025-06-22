import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Definir elementos del menú según el rol del usuario
  const getMenuItems = () => {
    const items = [
      { id: 'dashboard', name: 'Panel Principal', icon: '📊', path: '/dashboard' },
    ];
    
    // Elementos solo para administradores
    if (user?.role === 'ADMINISTRADOR') {
      items.push({ id: 'users', name: 'Gestión de Usuarios', icon: '👥', path: '/users' });
    }
    
    // Agregar otros elementos que se implementarán más adelante
    items.push(
      { id: 'settings', name: 'Configuración', icon: '⚙️', path: '/settings', disabled: true }
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
            <span className="mr-3 text-lg">{item.icon}</span>
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
          <span className="mr-3">🚪</span>
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
