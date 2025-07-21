import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';

const DashboardDocente = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTareas: 0,
    tareasActivas: 0,
    tareasPorCalificar: 0,
    cursos: 0,
    estudiantes: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [pendingGrades, setPendingGrades] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener estadísticas del docente
        const statsResponse = await api.getDocenteEstadisticas();
        setStats(statsResponse.data);
        
        // Obtener tareas recientes
        const tareasResponse = await api.listarTareasDocente();
        const sorted = [...tareasResponse.data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRecentTasks(sorted.slice(0, 5));
        
        // Obtener entregas pendientes por calificar
        const pendingResponse = await api.listarEntregasPendientes();
        setPendingGrades(pendingResponse.data.slice(0, 5));
      } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
        showAlert('error', 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showAlert]);

  // Función para formatear fechas
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard del Docente</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido, {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-md bg-indigo-100 p-2">
              <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Total Tareas</h2>
              <p className="text-lg font-semibold text-gray-900">{stats.totalTareas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-md bg-green-100 p-2">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Tareas Activas</h2>
              <p className="text-lg font-semibold text-gray-900">{stats.tareasActivas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-md bg-yellow-100 p-2">
              <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Por Calificar</h2>
              <p className="text-lg font-semibold text-gray-900">{stats.tareasPorCalificar}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-100 p-2">
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Cursos</h2>
              <p className="text-lg font-semibold text-gray-900">{stats.cursos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-md bg-purple-100 p-2">
              <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Estudiantes</h2>
              <p className="text-lg font-semibold text-gray-900">{stats.estudiantes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tareas recientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Tareas recientes</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {recentTasks.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentTasks.map(task => (
                  <li key={task.id} className="py-3">
                    <Link to={`/docente/tareas/${task.id}`} className="block hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">{task.titulo}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          {task.habilitada ? (
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Activa
                            </p>
                          ) : (
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Inactiva
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <p>Fecha límite: {formatDate(task.fechaEntrega || task.fechaCierre)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No hay tareas recientes</p>
            )}
            <div className="mt-4 text-right">
              <Link to="/docente/tareas" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Ver todas las tareas →
              </Link>
            </div>
          </div>
        </div>

        {/* Entregas pendientes por calificar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Entregas por calificar</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {pendingGrades.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {pendingGrades.map(submission => (
                  <li key={submission.id} className="py-3">
                    <Link to={`/docente/entregas/${submission.id}`} className="block hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">{submission.tarea.titulo}</p>
                          <p className="text-xs text-gray-500">{submission.estudiante.name}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pendiente
                          </p>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <p>Entregado el: {formatDate(submission.fechaEntrega)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No hay entregas pendientes por calificar</p>
            )}
            <div className="mt-4 text-right">
              <Link to="/docente/entregas" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Ver todas las entregas →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDocente;
