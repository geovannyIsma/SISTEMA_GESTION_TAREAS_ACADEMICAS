import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { getFullName } from '../../utils/validation';

const DashboardDocente = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTareas: 0,
    tareasActivas: 0,
    tareasPorCalificar: 0,
    cursos: 0,
    estudiantes: 0,
    tareasProximas: 0,
    entregasPendientes: 0
  });
  const [cursos, setCursos] = useState([]);
  const [tareasRecientes, setTareasRecientes] = useState([]);
  const [entregasRecientes, setEntregasRecientes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Crear objeto para recopilar todas las estadísticas
        const newStats = {
          totalTareas: 0,
          tareasActivas: 0,
          tareasPorCalificar: 0,
          cursos: 0,
          estudiantes: 0,
          tareasProximas: 0,
          entregasPendientes: 0
        };
        
        // Intentar cargar estadísticas directamente del endpoint
        try {
          const statsResponse = await api.getDocenteEstadisticas();
          if (statsResponse && statsResponse.data) {
            // Actualizar estadísticas del servidor
            Object.assign(newStats, statsResponse.data);
          }
        } catch (statsErr) {
          console.error("Error al cargar estadísticas:", statsErr);
        }
        
        // Cargar cursos del docente
        const cursosResponse = await api.listarCursosDocente();
        if (cursosResponse && cursosResponse.data) {
          setCursos(cursosResponse.data);
          
          // Actualizar estadísticas de cursos y estudiantes
          newStats.cursos = newStats.cursos || cursosResponse.data.length;
          newStats.estudiantes = newStats.estudiantes || cursosResponse.data.reduce(
            (sum, curso) => sum + (curso._count?.estudiantes || 0), 0
          );
        }
        
        // Cargar tareas del docente
        const tareasResponse = await api.listarTareasDocente();
        if (tareasResponse && tareasResponse.data) {
          const tareasData = tareasResponse.data;
          
          // Calcular estadísticas basadas en las tareas
          const ahora = new Date();
          const proximaSemana = new Date();
          proximaSemana.setDate(ahora.getDate() + 7);
          
          // Filtrar tareas por estado
          const tareasActivas = tareasData.filter(t => 
            t.habilitada !== false && new Date(t.fechaEntrega) >= ahora
          );
          
          const tareasProximas = tareasActivas.filter(t => 
            new Date(t.fechaEntrega) <= proximaSemana
          );
          
          // Actualizar estadísticas de tareas
          newStats.totalTareas = newStats.totalTareas || tareasData.length;
          newStats.tareasActivas = newStats.tareasActivas || tareasActivas.length;
          newStats.tareasProximas = newStats.tareasProximas || tareasProximas.length;
          
          // Guardar tareas más recientes ordenadas por fecha
          if (tareasData.length > 0) {
            const tareasOrdenadas = [...tareasData].sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.fechaEntrega);
              const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.fechaEntrega);
              return dateB - dateA;
            });
            
            setTareasRecientes(tareasOrdenadas.slice(0, 5));
          }
        }
        
        // Obtener entregas pendientes de revisión
        try {
          const entregasResponse = await api.listarEntregasPendientes();
          if (entregasResponse && entregasResponse.data) {
            setEntregasRecientes(entregasResponse.data.slice(0, 5));
            
            // Actualizar contador de entregas pendientes
            newStats.tareasPorCalificar = newStats.tareasPorCalificar || entregasResponse.data.length;
            newStats.entregasPendientes = newStats.entregasPendientes || entregasResponse.data.length;
          }
        } catch (entregasErr) {
          console.error("Error al cargar entregas:", entregasErr);
        }
        
        // Actualizar todas las estadísticas de una vez
        setStats(newStats);
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
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

  // Sección para renderizar los cursos del docente
  const renderCursosDocente = () => {
    if (!cursos || cursos.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="mt-2 text-sm">No tiene cursos asignados</p>
        </div>
      );
    }
    
    return (
      <ul className="divide-y divide-gray-200">
        {cursos.map(curso => (
          <li key={curso.id} className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{curso.nombre}</h4>
                <p className="text-xs text-gray-500">
                  {curso.codigo} | Asignatura: {curso.asignatura?.nombre || 'No asignada'}
                </p>
              </div>
              <div className="ml-4 flex items-center">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {curso._count?.estudiantes || 0} estudiantes
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  // Sección específica para renderizar las tareas recientes
  const renderTareasRecientes = () => {
    if (!tareasRecientes || tareasRecientes.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="mt-2 text-sm">No hay tareas recientes</p>
        </div>
      );
    }
    
    return (
      <ul className="divide-y divide-gray-200">
        {tareasRecientes.map(tarea => {
          // Calcular días restantes
          const fechaEntrega = new Date(tarea.fechaEntrega);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24));
          
          // Determinar clases para estado visual
          let statusClass = "bg-green-100 text-green-800"; // Por defecto: con tiempo
          if (tarea.habilitada === false) {
            statusClass = "bg-gray-100 text-gray-800"; // Deshabilitada
          } else if (fechaEntrega < hoy) {
            statusClass = "bg-red-100 text-red-800"; // Vencida
          } else if (diasRestantes <= 3) {
            statusClass = "bg-yellow-100 text-yellow-800"; // Próxima a vencer
          }
          
          return (
            <li key={tarea.id} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/docente/tareas/${tarea.id}`}
                    className="text-sm font-medium text-primary hover:text-primary-dark truncate"
                  >
                    {tarea.titulo}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">{tarea.descripcion}</p>
                </div>
                <div className="ml-4">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                    {tarea.habilitada === false ? 
                      'Deshabilitada' : 
                      (fechaEntrega < hoy ? 
                        'Vencida' : 
                        diasRestantes <= 3 ? 
                          `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}` : 
                          'Con tiempo'
                      )
                    }
                  </span>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Fecha límite: {fechaEntrega.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  // Renderizar próximos vencimientos
  const renderProximosVencimientos = () => {
    // Filtrar tareas próximas a vencer (habilitadas y con fecha en próxima semana)
    const tareasProximas = tareasRecientes.filter(t => {
      const fechaEntrega = new Date(t.fechaEntrega);
      const hoy = new Date();
      const proximaSemana = new Date();
      proximaSemana.setDate(hoy.getDate() + 7);
      return t.habilitada !== false && fechaEntrega >= hoy && fechaEntrega <= proximaSemana;
    });
    
    if (tareasProximas.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm">No hay tareas con vencimiento próximo</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {tareasProximas.map(tarea => {
          const fechaEntrega = new Date(tarea.fechaEntrega);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={tarea.id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{tarea.titulo}</h4>
                  <p className="text-xs text-gray-500 mt-1">Vence en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                  {fechaEntrega.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          Bienvenido, {getFullName(user.firstName, user.lastName)}
        </h1>
      </div>
      
      {/* Estadísticas del docente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="bg-blue-50 text-blue rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Cursos</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.cursos}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="bg-green-50 text-green rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Estudiantes</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.estudiantes}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="bg-primary-50 text-primary rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Tareas activas</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.tareasActivas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="bg-yellow-50 text-yellow rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Próximas a vencer</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.tareasProximas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="bg-purple-50 text-purple rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Entregas pendientes</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.entregasPendientes}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secciones principales del dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tareas recientes */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Tareas recientes</h3>
            <Link to="/docente/tareas" className="text-sm text-primary hover:text-primary-dark font-medium">
              Ver todas
            </Link>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {renderTareasRecientes()}
          </div>
        </div>
        
        {/* Cursos asignados */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Mis cursos</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {renderCursosDocente()}
          </div>
        </div>
      </div>
      
      {/* Acciones rápidas */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100 mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Acciones rápidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/docente/tareas/nueva" 
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Crear Nueva Tarea
            </Link>
            <Link 
              to="/docente/tareas" 
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <svg className="mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Gestionar Tareas
            </Link>
            <button
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => {
                const tareasTexto = tareasRecientes
                  .map(t => `${t.titulo} - Fecha límite: ${new Date(t.fechaEntrega).toLocaleDateString('es-ES')}`)
                  .join('\n');
                
                const element = document.createElement("a");
                const file = new Blob([`INFORME DE TAREAS RECIENTES\n\n${tareasTexto}`], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = "tareas_recientes.txt";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              <svg className="mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Generar Informe
            </button>
          </div>
        </div>
      </div>
      
      {/* Próximos vencimientos */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Próximos vencimientos</h3>
        </div>
        <div className="p-6">
          {renderProximosVencimientos()}
        </div>
      </div>
      
      {/* Entregas pendientes */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100 mt-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Entregas por calificar</h3>
          <Link to="/docente/entregas" className="text-sm text-primary hover:text-primary-dark font-medium">
            Ver todas
          </Link>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {entregasRecientes && entregasRecientes.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {entregasRecientes.map(entrega => (
                <li key={entrega.id} className="py-4">
                  <Link to={`/docente/entregas/${entrega.id}`} className="block hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary truncate">{entrega.tarea?.titulo || 'Tarea sin título'}</p>
                        <p className="text-xs text-gray-500">{entrega.estudiante?.firstName} {entrega.estudiante?.lastName}</p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Entregado el: {formatDate(entrega.fechaEntrega || entrega.createdAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2 text-sm">No hay entregas pendientes por calificar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardDocente;
