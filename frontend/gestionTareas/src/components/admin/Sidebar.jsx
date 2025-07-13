import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFullName } from '../../utils/validation';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const { user, isAdmin, isTeacher, isStudent, logout } = useAuth();

  // Determinar si un enlace está activo
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Clase para enlaces activos/inactivos
  const getLinkClass = (path) => {
    const baseClass = "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors";
    return isActive(path) 
      ? `${baseClass} bg-indigo-700 text-white`
      : `${baseClass} text-white hover:bg-indigo-600`;
  };

  // Get user's initials
  const userInitials = user && user.firstName && user.lastName ? 
    `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U';

  // Get user's full name
  const userFullName = user ? getFullName(user.firstName, user.lastName) : 'Usuario';

  // Iconos para cada sección
  const icons = {
    dashboard: (
      <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    users: (
      <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    asignaturas: (
      <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    cursos: (
      <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    tasks: (
      <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    logout: (
      <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    )
  };

  return (
    <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed z-30 inset-y-0 left-0 w-64 bg-indigo-800 transition duration-300 ease-in-out transform flex flex-col`}>
      {/* Logo / título */}
      <div className="px-4 py-6 flex items-center border-b border-indigo-700">
        <div className="flex-shrink-0">
          <img src="/logo_st.svg" alt="Logo" className="h-10 w-10" />
        </div>
        <div className="ml-3">
          <h1 className="text-xl font-bold text-white">SGTA</h1>
          <p className="text-xs text-indigo-300">Sistema de Gestión de Tareas</p>
        </div>
      </div>

      {/* Usuario actual */}
      <div className="px-4 py-3 bg-indigo-900">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-700 flex items-center justify-center text-white font-semibold">
            {userInitials}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white truncate">{userFullName}</p>
            <p className="text-xs text-indigo-300 truncate">{user?.email || 'usuario@uni.edu.ec'}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="mt-5 flex-1 px-2 space-y-1">
        <Link to="/dashboard" className={getLinkClass('/dashboard')}>
          {icons.dashboard}
          Dashboard
        </Link>

        {/* Enlaces para administradores */}
        {isAdmin && (
          <>
            <Link to="/users" className={getLinkClass('/users')}>
              {icons.users}
              Usuarios
            </Link>

            <Link to="/asignaturas" className={getLinkClass('/asignaturas')}>
              {icons.asignaturas}
              Asignaturas
            </Link>

            <Link to="/cursos" className={getLinkClass('/cursos')}>
              {icons.cursos}
              Cursos
            </Link>
          </>
        )}

        {/* Enlaces para docentes */}
        {isTeacher && (
          <Link to="/docente/tareas" className={getLinkClass('/docente/tareas')}>
            {icons.tasks}
            Mis Tareas
          </Link>
        )}

        {/* Enlaces para estudiantes */}
        {isStudent && (
          <Link to="/estudiante/tareas" className={getLinkClass('/estudiante/tareas')}>
            {icons.tasks}
            Mis Tareas
          </Link>
        )}
      </nav>

      {/* Botón de cerrar sesión */}
      <div className="px-2 py-4 border-t border-indigo-700 mt-auto">
        <button 
          onClick={logout}
          className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-white hover:bg-indigo-600"
        >
          {icons.logout}
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
