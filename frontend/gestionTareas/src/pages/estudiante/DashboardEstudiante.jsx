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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="bg-primary-100 text-primary-800 rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600">My Courses</h2>
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
                    <h2 className="text-sm font-medium text-gray-600">Total Tasks</h2>
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
                    <h2 className="text-sm font-medium text-gray-600">Pending Tasks</h2>
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
                    <h2 className="text-sm font-medium text-gray-600">Overdue Tasks</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.tareasVencidas}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="bg-green-100 text-green-800 rounded-full p-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600">Average Grade</h2>
                    <p className="text-2xl font-semibold text-gray-900">{stats.promedioCalificaciones.toFixed(1)}</p>
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
                <h3 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h3>
                <Link to="/estudiante/cursos" className="text-sm text-primary hover:text-primary-dark font-medium">
                  View All
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
                    <p className="mt-2 text-sm">No upcoming deadlines</p>
                    <p className="text-xs text-gray-400">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* My courses */}
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">My Courses</h3>
                <Link to="/estudiante/cursos" className="text-sm text-primary hover:text-primary-dark font-medium">
                  View All
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
                    <p className="mt-2 text-sm">You're not enrolled in any courses</p>
                    <p className="text-xs text-gray-400">Contact your teacher to be added</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link 
                  to="/estudiante/cursos" 
                  className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-50 bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  View My Courses
                </Link>
                
                {stats.tareasPendientes > 0 ? (
                  <Link 
                    to="/estudiante/cursos" 
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Pending Tasks ({stats.tareasPendientes})
                  </Link>
                ) : (
                  <div className="flex items-center justify-center px-4 py-3 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-800 bg-green-50">
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All Caught Up!
                </div>
                )}
                
                <button 
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => window.print()}
                >
                  <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Print Summary
                </button>
              </div>
            </div>
          </div>
          
          {/* Academic performance */}
          {stats.promedioCalificaciones > 0 && (
            <div className="bg-gray-50 shadow-sm rounded-lg overflow-hidden border border-gray-100 mt-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Academic Performance</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <h4 className="text-sm text-gray-500 mb-1">Overall Average</h4>
                    <div className="text-3xl font-bold text-primary">{stats.promedioCalificaciones.toFixed(1)}</div>
                    <p className="text-xs text-gray-500 mt-1">Out of 10</p>
                  </div>
                  
                  <div className="h-16 border-l border-gray-200"></div>
                  
                  <div className="text-center">
                    <h4 className="text-sm text-gray-500 mb-1">Completed Tasks</h4>
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
                    <h4 className="text-sm text-gray-500 mb-1">Current Status</h4>
                    {stats.tareasPendientes > 0 ? (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-yellow mr-2"></div>
                        <span className="text-sm font-medium">Pending Tasks</span>
                      </div>
                    ) : stats.tareasVencidas > 0 ? (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-red mr-2"></div>
                        <span className="text-sm font-medium">Overdue Tasks</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-green mr-2"></div>
                        <span className="text-sm font-medium">All Caught Up</span>
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
