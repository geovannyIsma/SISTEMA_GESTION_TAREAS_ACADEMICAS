import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    teacherUsers: 0,
    studentUsers: 0,
    observerUsers: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Obtener datos de usuarios para el panel de administrador
  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'ADMINISTRADOR') {
        try {
          const response = await api.getUsers();
          const users = response.data;
          
          // Calcular estadísticas
          setStats({
            totalUsers: users.length,
            adminUsers: users.filter(u => u.role === 'ADMINISTRADOR').length,
            teacherUsers: users.filter(u => u.role === 'DOCENTE').length,
            studentUsers: users.filter(u => u.role === 'ESTUDIANTE').length,
            observerUsers: users.filter(u => u.role === 'OBSERVADOR').length
          });
          
          // Obtener los 5 usuarios más recientes
          const sorted = [...users].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setRecentUsers(sorted.slice(0, 5));
        } catch (error) {
          console.error("Error al obtener usuarios:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Cargar tareas del docente o estudiante
  useEffect(() => {
    if (user?.role === 'DOCENTE') {
      fetchTareasDocente();
    } else if (user?.role === 'ESTUDIANTE') {
      fetchTareasEstudiante();
    }
    // eslint-disable-next-line
  }, [user]);

  // Tareas del docente
  const fetchTareasDocente = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listarTareasDocente();
      setTareas(res.data);
    } catch (err) {
      setError('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  // Tareas asignadas al estudiante
  const fetchTareasEstudiante = async () => {
    setLoading(true);
    setError(null);
    try {
      // Suponiendo que tienes un endpoint para listar tareas asignadas al estudiante autenticado
      const res = await api.listarTareasEstudiante?.();
      setTareas(res.data);
    } catch (err) {
      setError('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que desea eliminar esta tarea?')) return;
    setDeletingId(id);
    try {
      await api.editarTarea(id, { eliminado: true }); // Si tienes endpoint delete, usa api.deleteTarea(id)
      setTareas(tareas.filter(t => t.id !== id));
    } catch (err) {
      alert('Error al eliminar tarea');
    } finally {
      setDeletingId(null);
    }
  };

  // Configuración de las tarjetas de estadísticas con colores mejorados
  const statCards = [
    { id: 'total', name: 'Total Usuarios', stat: stats.totalUsers, icon: '👥', color: 'bg-indigo-600', iconBg: 'bg-indigo-100', iconText: 'text-indigo-800' },
    { id: 'admin', name: 'Administradores', stat: stats.adminUsers, icon: '🔑', color: 'bg-purple-600', iconBg: 'bg-purple-100', iconText: 'text-purple-800' },
    { id: 'teacher', name: 'Docentes', stat: stats.teacherUsers, icon: '👨‍🏫', color: 'bg-green-600', iconBg: 'bg-green-100', iconText: 'text-green-800' },
    { id: 'student', name: 'Estudiantes', stat: stats.studentUsers, icon: '👨‍🎓', color: 'bg-blue-600', iconBg: 'bg-blue-100', iconText: 'text-blue-800' }
  ];
  
  // Agregar observadores si hay alguno
  if (stats.observerUsers > 0) {
    statCards.push({ 
      id: 'observer', 
      name: 'Observadores', 
      stat: stats.observerUsers, 
      icon: '👁️', 
      color: 'bg-amber-600',
      iconBg: 'bg-amber-100', 
      iconText: 'text-amber-800'
    });
  }

  // Mostrar directamente la gestión de tareas para docentes
  if (user && user.role === 'DOCENTE') {
    const tareasHabilitadas = tareas.filter(t => t.habilitada !== false);
    return (
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Bienvenido, {user.name}</h1>
        <p className="mb-6 text-gray-700">Estas son tus tareas asignadas:</p>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading ? (
          <div>Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Fecha Límite</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Archivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tareasHabilitadas.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 border-r align-top">{t.titulo}</td>
                    <td className="px-6 py-4 border-r align-top">{t.descripcion}</td>
                    <td className="px-6 py-4 border-r align-top">{new Date(t.fechaEntrega).toLocaleDateString()}</td>
                    <td className="px-6 py-4 border-r align-top">
                      {t.archivoUrl ? (
                        <a
                          href={t.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 underline"
                        >
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {tareasHabilitadas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">No hay tareas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ESTUDIANTE: saludo + tabla de tareas asignadas (misma estructura)
  if (user && user.role === 'ESTUDIANTE') {
    const tareasHabilitadas = tareas.filter(t => t.habilitada !== false);
    return (
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Bienvenido, {user.name}</h1>
        <p className="mb-6 text-gray-700">Estas son tus tareas asignadas:</p>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading ? (
          <div>Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Fecha Límite</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Archivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tareasHabilitadas.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 border-r align-top">{t.titulo}</td>
                    <td className="px-6 py-4 border-r align-top">{t.descripcion}</td>
                    <td className="px-6 py-4 border-r align-top">{new Date(t.fechaEntrega).toLocaleDateString()}</td>
                    <td className="px-6 py-4 border-r align-top">
                      {t.archivoUrl ? (
                        <a
                          href={t.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 underline"
                        >
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {tareasHabilitadas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">No hay tareas asignadas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Mostrar mensaje para usuarios no administradores
  if (user && user.role !== 'ADMINISTRADOR') {
    return (
      <div className="py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Bienvenido al Sistema de Gestión de Tareas Académicas</h1>
          <p className="text-gray-700">Su panel de control está en construcción. Pronto tendrá acceso a todas las funcionalidades correspondientes a su rol.</p>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Información
                </h3>
                <div className="mt-2 text-sm text-blue-800">
                  <p>Actualmente ha iniciado sesión como <strong>{user.role === 'DOCENTE' ? 'Docente' : user.role === 'ESTUDIANTE' ? 'Estudiante' : 'Observador'}</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-0">Panel de Administración</h1>
        <div className="text-gray-700">
          Bienvenido, {user?.name || 'Administrador'}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Cuadrícula de estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {statCards.map((stat) => (
              <div key={stat.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className={`${stat.color} h-1.5 w-full`}></div>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`${stat.iconBg} ${stat.iconText} rounded-full p-3`}>
                      <span className="text-xl">{stat.icon}</span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-600">{stat.name}</h2>
                      <p className="text-2xl font-semibold text-gray-900">{stat.stat}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Acciones rápidas del administrador */}
          <div className="bg-white shadow-sm rounded-lg mb-8 overflow-hidden border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link 
                  to="/users/new" 
                  className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Agregar Nuevo Usuario
                </Link>
                <Link 
                  to="/users" 
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Gestionar Usuarios
                </Link>
                <button
                  disabled
                  className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
                >
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Configuración del Sistema
                <span className="ml-2 text-xs">(próximamente)</span>
              </button>
              </div>
            </div>
          </div>

          {/* Usuarios recientes */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Usuarios Recientes</h3>
              <Link to="/users" className="text-sm text-indigo-700 hover:text-indigo-900 font-medium hover:underline">
                Ver Todos
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creado
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'DOCENTE' ? 'bg-green-100 text-green-800' : 
                          user.role === 'ESTUDIANTE' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {user.role === 'ADMINISTRADOR' ? 'Administrador' : 
                           user.role === 'DOCENTE' ? 'Docente' : 
                           user.role === 'ESTUDIANTE' ? 'Estudiante' : 'Observador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/users/${user.id}`} className="text-indigo-700 hover:text-indigo-900 mr-4 hover:underline">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                  
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-600">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
