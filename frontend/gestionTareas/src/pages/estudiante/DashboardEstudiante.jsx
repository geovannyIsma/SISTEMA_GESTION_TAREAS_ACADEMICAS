import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getFullName } from '../../utils/validation';
import { useAlert } from '../../context/AlertContext';

const DashboardEstudiante = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [stats, setStats] = useState({
    totalCursos: 0,
    totalTareas: 0,
    tareasPendientes: 0,
    tareasVencidas: 0,
    promedioCalificaciones: 0,
    proximasEntregas: []
  });
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
    
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load student statistics
        const statsResponse = await api.getEstadisticasEstudiante();
        if (statsResponse && statsResponse.data) {
          console.log('Statistics received:', statsResponse.data);
          setStats(statsResponse.data);
        }
        
        // Load student courses
        const cursosResponse = await api.listarCursosEstudiante();
        if (cursosResponse && cursosResponse.data) {
          setCursos(cursosResponse.data.slice(0, 4)); // Show only first 4 courses
        }
      } catch (err) {
        console.error("Error loading student data:", err);
        showAlert('error', 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [showAlert]);
  
  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-2">Bienvenido, {getFullName(user?.firstName, user?.lastName)}</h1>
      <p className="mb-6 text-gray-700">A continuación se muestra un resumen de tus cursos y tareas académicas.</p>
      
      {loading ? (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Student statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="bg-primary-100 text-primary-800 rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600">Mis Cursos</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalCursos}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600">Tareas Totales</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalTareas}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="bg-yellow-100 text-yellow-800 rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600">Tareas Pendientes</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.tareasPendientes}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="bg-red-100 text-red-800 rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600">Tareas Vencidas</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.tareasVencidas}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main dashboard sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Upcoming deadlines */}
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Proximas Entregas</h3>
                <Link to="/estudiante/cursos" className="text-sm text-primary hover:text-primary-dark font-medium">
                  Ver Todo
                </Link>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {stats.proximasEntregas && stats.proximasEntregas.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {stats.proximasEntregas.map(tarea => {
                      // Calculate remaining days
                      const fechaEntrega = new Date(tarea.fechaEntrega);
                      const hoy = new Date();
                      const diasRestantes = Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24));
                      
                      // Determine visual status classes
                      let statusClass = "bg-green-100 text-green-800"; // Default: plenty of time
                      if (diasRestantes <= 1) {
                        statusClass = "bg-red-100 text-red-800"; // Today or tomorrow
                      } else if (diasRestantes <= 3) {
                        statusClass = "bg-orange-100 text-orange-800"; // Soon to expire
                      }
                      
                      return (
                        <li key={tarea.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <Link 
                                to={`/estudiante/tareas/${tarea.id}`}
                                className="text-sm font-medium text-primary hover:text-primary-dark truncate"
                              >
                                {tarea.titulo}
                              </Link>
                              <p className="text-xs text-gray-500 truncate">{tarea.curso?.nombre}</p>
                            </div>
                            <div className="ml-4">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                                {diasRestantes <= 0 
                                  ? 'Today' 
                                  : diasRestantes === 1 
                                    ? 'Tomorrow' 
                                    : `${diasRestantes} days`
                                }
                              </span>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Due date: {fechaEntrega.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm">No tienes tareas pendientes</p>
                    <p className="text-xs text-gray-400">¡Estás todo cargado!</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* My courses */}
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Mis Cursos</h3>
                <Link to="/estudiante/cursos" className="text-sm text-primary hover:text-primary-dark font-medium">
                  Ver Todo
                </Link>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {cursos && cursos.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cursos.map(curso => (
                      <li key={curso.id} className="border border-gray-200 rounded-md hover:shadow-md transition-shadow duration-200">
                        <Link to={`/estudiante/cursos/${curso.id}`} className="block p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {curso.codigo}
                            </span>
                            {curso.asignatura && (
                              <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                {curso.asignatura.nombre}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">{curso.nombre}</h4>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                            </svg>
                            {curso._count?.tareas || 0} tasks
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="mt-2 text-sm">No estas inscrito en ningun curso</p>
                    <p className="text-xs text-gray-400">Contacta a tu docente para ser inscrito</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Academic performance */}
          {stats.promedioCalificaciones > 0 && (
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden border border-gray-100 mt-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Mi Desempeño Académico</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <h4 className="text-sm text-gray-500 mb-1">Promedio General</h4>
                    <div className="text-3xl font-bold text-primary">{stats.promedioCalificaciones.toFixed(1)}</div>
                    <p className="text-xs text-gray-500 mt-1">Out of 10</p>
                  </div>
                  
                  <div className="h-16 border-l border-gray-200"></div>
                  
                  <div className="text-center">
                    <h4 className="text-sm text-gray-500 mb-1">Tareas Completadas</h4>
                    <div className="text-3xl font-bold text-green">
                      {stats.totalTareas > 0 ? 
                        `${Math.round((stats.totalTareas - stats.tareasPendientes - stats.tareasVencidas) / stats.totalTareas * 100)}%` : 
                        '0%'
                      }
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalTareas - stats.tareasPendientes - stats.tareasVencidas} / {stats.totalTareas} tasks
                    </p>
                  </div>
                  
                  <div className="h-16 border-l border-gray-200"></div>
                  
                  <div className="text-center">
                    <h4 className="text-sm text-gray-500 mb-1">Estado Actual</h4>
                    {stats.tareasPendientes > 0 ? (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-yellow mr-2"></div>
                        <span className="text-sm font-medium">Tareas Pendientes</span>
                      </div>
                    ) : stats.tareasVencidas > 0 ? (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-red mr-2"></div>
                        <span className="text-sm font-medium">Tareas Vencidas</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-green mr-2"></div>
                        <span className="text-sm font-medium">Todo Cargado</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardEstudiante;
