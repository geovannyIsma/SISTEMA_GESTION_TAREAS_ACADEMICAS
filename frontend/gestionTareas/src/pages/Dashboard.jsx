import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getFullName } from '../utils/validation';
import { useAlert } from '../context/AlertContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
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
  
  // Nuevos estados para el dashboard del docente
  const [cursos, setCursos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalCursos: 0,
    totalEstudiantes: 0,
    tareasActivas: 0,
    tareasProximas: 0,
    entregasPendientes: 0
  });
  const [tareasRecientes, setTareasRecientes] = useState([]);
  const [entregasRecientes, setEntregasRecientes] = useState([]);

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
    { 
      id: 'total', 
      name: 'Total Usuarios', 
      stat: stats.totalUsers, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ), 
      color: 'bg-indigo-600', 
      iconBg: 'bg-indigo-100', 
      iconText: 'text-indigo-800' 
    },
    { 
      id: 'admin', 
      name: 'Administradores', 
      stat: stats.adminUsers, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ), 
      color: 'bg-purple-600', 
      iconBg: 'bg-purple-100', 
      iconText: 'text-purple-800' 
    },
    { 
      id: 'teacher', 
      name: 'Docentes', 
      stat: stats.teacherUsers, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ), 
      color: 'bg-green-600', 
      iconBg: 'bg-green-100', 
      iconText: 'text-green-800' 
    },
    { 
      id: 'student', 
      name: 'Estudiantes', 
      stat: stats.studentUsers, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ), 
      color: 'bg-blue-600', 
      iconBg: 'bg-blue-100', 
      iconText: 'text-blue-800' 
    }
  ];
  
  // Agregar observadores si hay alguno
  if (stats.observerUsers > 0) {
    statCards.push({ 
      id: 'observer', 
      name: 'Observadores', 
      stat: stats.observerUsers, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ), 
      color: 'bg-amber-600',
      iconBg: 'bg-amber-100', 
      iconText: 'text-amber-800'
    });
  }

  // Cargar datos del docente
  useEffect(() => {
    if (user?.role === 'DOCENTE') {
      const fetchDocenteData = async () => {
        setLoading(true);
        try {
          console.log('Iniciando carga de datos de docente');
          
          // Intentar cargar estadísticas directamente del endpoint
          try {
            const statsResponse = await api.getDocenteEstadisticas();
            if (statsResponse && statsResponse.status === 'success' && statsResponse.data) {
              console.log('Estadísticas recibidas:', statsResponse.data);
              setEstadisticas(statsResponse.data);
            }
          } catch (statsErr) {
            console.error("Error al cargar estadísticas:", statsErr);
            // Continuamos con el resto de la carga
          }
          
          // Cargar cursos del docente
          const cursosResponse = await api.listarCursosDocente();
          console.log('Cursos recibidos:', cursosResponse);
          
          if (cursosResponse && cursosResponse.data) {
            setCursos(cursosResponse.data);
            
            // Si no pudimos cargar estadísticas antes, calcular total de cursos
            if (!estadisticas.totalCursos) {
              setEstadisticas(prev => ({
                ...prev,
                totalCursos: cursosResponse.data.length,
                totalEstudiantes: cursosResponse.data.reduce(
                  (sum, curso) => sum + (curso._count?.estudiantes || 0), 0
                )
              }));
            }
          } else {
            console.warn('No se recibieron datos de cursos del docente');
          }
          
          // Cargar tareas del docente
          const tareasResponse = await api.listarTareasDocente();
          console.log('Tareas recibidas:', tareasResponse);
          
          if (tareasResponse && tareasResponse.data) {
            const tareasData = tareasResponse.data;
            
            // Calcular estadísticas basadas en las tareas
            const ahora = new Date();
            const proximaSemana = new Date();
            proximaSemana.setDate(ahora.getDate() + 7);
            
            // Filtrar tareas activas (habilitadas y no vencidas)
            const tareasActivas = tareasData.filter(t => 
              t.habilitada !== false && new Date(t.fechaEntrega) >= ahora
            );
            
            // Tareas con vencimiento en la próxima semana
            const tareasProximas = tareasActivas.filter(t => 
              new Date(t.fechaEntrega) <= proximaSemana
            );
            
            // Actualizar estadísticas si no pudimos cargarlas antes
            if (!estadisticas.tareasActivas) {
              setEstadisticas(prev => ({
                ...prev,
                tareasActivas: tareasActivas.length,
                tareasProximas: tareasProximas.length,
              }));
            }
            
            // Guardar tareas más recientes (últimas 5)
            if (tareasData.length > 0) {
              const tareasOrdenadas = [...tareasData].sort((a, b) => {
                // Usar fechaEntrega si no existe createdAt
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.fechaEntrega);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.fechaEntrega);
                return dateB - dateA;
              });
              
              console.log('Tareas ordenadas para mostrar:', tareasOrdenadas.slice(0, 5));
              setTareasRecientes(tareasOrdenadas.slice(0, 5));
            }
          } else {
            console.warn('No se recibieron datos de tareas del docente');
          }
          
          // Obtener entregas pendientes de revisión
          try {
            const entregasResponse = await api.listarEntregasPendientes();
            console.log('Entregas pendientes recibidas:', entregasResponse);
            
            if (entregasResponse && entregasResponse.data) {
              setEntregasRecientes(entregasResponse.data.slice(0, 5));
              
              // Actualizar contador de entregas pendientes si no lo hicimos antes
              if (!estadisticas.entregasPendientes) {
                setEstadisticas(prev => ({
                  ...prev, 
                  entregasPendientes: entregasResponse.data.length
                }));
              }
            }
          } catch (entregasErr) {
            console.error("Error al cargar entregas:", entregasErr);
          }
        } catch (err) {
          console.error("Error general al cargar datos del docente:", err);
          showAlert('error', 'Error al cargar los datos del dashboard');
        } finally {
          setLoading(false);
        }
      };
      
      fetchDocenteData();
    }
  }, [user, showAlert]);

  // Tareas del estudiante (vista simplificada)
  const renderTareasEstudiante = () => {
    const tareasHabilitadas = tareas.filter(t => t.habilitada !== false);
    
    if (tareasHabilitadas.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="mt-2 text-sm">No hay tareas asignadas</p>
        </div>
      );
    }
    
    return (
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
          </tbody>
        </table>
      </div>
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
            statusClass = "bg-orange-100 text-orange-800"; // Próxima a vencer
          }
          
          return (
            <li key={tarea.id} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/docente/tareas/${tarea.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900 truncate"
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

  // Mostrar directamente la gestión de tareas para docentes
  if (user && user.role === 'DOCENTE') {
    return (
      <div className="py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Bienvenido, {getFullName(user.firstName, user.lastName)}
          </h1>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Estadísticas del docente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 rounded-full p-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-600">Cursos</h2>
                      <p className="text-2xl font-semibold text-gray-900">{estadisticas.totalCursos}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="bg-green-100 text-green-800 rounded-full p-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-600">Estudiantes</h2>
                      <p className="text-2xl font-semibold text-gray-900">{estadisticas.totalEstudiantes}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 text-indigo-800 rounded-full p-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-600">Tareas activas</h2>
                      <p className="text-2xl font-semibold text-gray-900">{estadisticas.tareasActivas}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="bg-orange-100 text-orange-800 rounded-full p-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-600">Próximas a vencer</h2>
                      <p className="text-2xl font-semibold text-gray-900">{estadisticas.tareasProximas}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="bg-purple-100 text-purple-800 rounded-full p-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-600">Entregas pendientes</h2>
                      <p className="text-2xl font-semibold text-gray-900">{estadisticas.entregasPendientes}</p>
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
                  <Link to="/docente/tareas" className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
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
                    className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Crear Nueva Tarea
                  </Link>
                  <Link 
                    to="/docente/tareas" 
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Gestionar Tareas
                  </Link>
                  <button
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => {
                      // Función para generar un reporte simple de tareas
                      const tareasTexto = tareasRecientes
                        .map(t => `${t.titulo} - Fecha límite: ${new Date(t.fechaEntrega).toLocaleDateString('es-ES')}`)
                        .join('\n');
                      
                      // Crear un elemento temporal para la descarga
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
            
            {/* Calendario o próximos eventos (vista simple) */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Próximos vencimientos</h3>
              </div>
              <div className="p-6">
                {estadisticas.tareasProximas > 0 ? (
                  <div className="space-y-4">
                    {tareasRecientes
                      .filter(t => {
                        const fechaEntrega = new Date(t.fechaEntrega);
                        const hoy = new Date();
                        const proximaSemana = new Date();
                        proximaSemana.setDate(hoy.getDate() + 7);
                        return fechaEntrega >= hoy && fechaEntrega <= proximaSemana && t.habilitada;
                      })
                      .map(tarea => {
                        const fechaEntrega = new Date(tarea.fechaEntrega);
                        const hoy = new Date();
                        const diasRestantes = Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div key={tarea.id} className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{tarea.titulo}</h4>
                                <p className="text-xs text-gray-500 mt-1">Vence en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}</p>
                              </div>
                              <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
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
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm">No hay tareas con vencimiento próximo</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ESTUDIANTE: saludo + tabla de tareas asignadas
  if (user && user.role === 'ESTUDIANTE') {
    const tareasHabilitadas = tareas.filter(t => t.habilitada !== false);
    return (
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Bienvenido, {getFullName(user.firstName, user.lastName)}</h1>
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
          Bienvenido, {user ? getFullName(user.firstName, user.lastName) : 'Administrador'}
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
                      {stat.icon}
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
                            {user.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getFullName(user.firstName, user.lastName)}
                            </div>
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
