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
      ? `${baseClass} bg-primary-dark text-gray-50`
      : `${baseClass} text-gray-50 hover:bg-primary-light`;
  };

  // Get user's initials
  const userInitials = user && user.firstName && user.lastName ? 
    `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U';

  // Get user's full name
  const userFullName = user ? getFullName(user.firstName, user.lastName) : 'Usuario';

  // Iconos para cada sección
  const icons = {
    dashboard: (
      <svg className="mr-3 h-5 w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round">
          <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
    ),
    users: (
      <svg className="mr-3 h-5 w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round">
          <path d="M18 21a8 8 0 0 0-16 0"/>
          <circle cx="10" cy="8" r="5"/>
          <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>
      </svg>
    ),
    asignaturas: (
      <svg className="mr-3 h-5 w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={2} 
          strokeLinecap="round" 
          strokeLinejoin="round">
          <path d="M10 2v8l3-3 3 3V2"/>
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
        </svg>
    ),
    cursos: (
      <svg className="mr-3 h-5 w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round">
          <path d="M2 3h20"/>
          <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/>
          <path d="m7 21 5-5 5 5"/>
      </svg>
    ),
    tasks: (
      <svg className="mr-3 h-5 w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round">
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <path d="m9 14 2 2 4-4"/>
      </svg>
    ),
    reportes: (
      <svg className="mr-3 h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    logout: (
      <svg xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round">
          <path d="m16 17 5-5-5-5"/>
          <path d="M21 12H9"/>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      </svg>
    )
  };

  return (
    <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed z-50 inset-y-0 left-0 w-64 bg-primary transition duration-300 ease-in-out transform flex flex-col`}>
      {/* Logo / título */}
      <div className="px-4 py-6 flex items-center border-b border-primary-dark">
        <div className="flex-shrink-0">
          <img src="/logo_st.svg" alt="Logo" className="h-10 w-10" />
        </div>
        <div className="ml-3">
          <h1 className="text-xl font-bold text-gray-50">SGT</h1>
          <p className="text-xs text-primary-100">Sistema de Gestión de Tareas</p>
        </div>
      </div>

      {/* Usuario actual */}
      <div className="px-4 py-3 bg-primary-dark">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-light flex items-center justify-center text-gray-50 font-semibold">
            {userInitials}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-50 truncate">{userFullName}</p>
            <p className="text-xs text-primary-100 truncate">{user?.email || 'usuario@uni.edu.ec'}</p>
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
          <>
            <Link to="/docente/tareas" className={getLinkClass('/docente/tareas')}>
              {icons.tasks}
              Mis Tareas
            </Link>
            <Link to="/docente/estadisticas" className={getLinkClass('/docente/estadisticas')}>
              {icons.reportes}
              Reportes
            </Link>
          </>
        )}

        {/* Enlaces para estudiantes */}
        {isStudent && (
          <>
            <Link to="/estudiante/tareas" className={getLinkClass('/estudiante/tareas')}>
              {icons.tasks}
              Mis Cursos
            </Link>
          </>
        )}
      </nav>

      {/* Botón de cerrar sesión */}
      <div className="px-2 py-4 border-t border-primary-dark mt-auto">
        <button 
          onClick={logout}
          className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-gray-50 hover:bg-primary-light"
        >
          {icons.logout}
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
