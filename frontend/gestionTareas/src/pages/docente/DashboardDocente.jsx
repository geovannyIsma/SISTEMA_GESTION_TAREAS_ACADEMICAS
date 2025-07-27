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

  const [cursos, setCursos] = useState([]);
  const [tareasRecientes, setTareasRecientes] = useState([]);
  const [entregasRecientes, setEntregasRecientes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar cursos del docente
        const cursosResponse = await api.listarCursosDocente();
        if (cursosResponse && cursosResponse.data) {
          setCursos(cursosResponse.data);
        }
        
        // Cargar tareas del docente
        const tareasResponse = await api.listarTareasDocente();
        if (tareasResponse && tareasResponse.data) {
          const tareasData = tareasResponse.data;
          
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
          }
        } catch (entregasErr) {
          console.error("Error al cargar entregas:", entregasErr);
        }
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

  // Nueva función para mostrar tareas próximas (fusiona recientes y próximas a vencer)
  const renderTareasProximas = () => {
    // Mostrar tareas próximas a vencer (próximos 7 días) y recién creadas (últimos 7 días)
    const ahora = new Date();
    const hace7dias = new Date();
    hace7dias.setDate(ahora.getDate() - 7);
    const proximaSemana = new Date();
    proximaSemana.setDate(ahora.getDate() + 7);

    // Unir tareas recientes y próximas a vencer, sin duplicados
    const tareasUnidas = [
      ...(tareasRecientes || []),
      ...(tareasRecientes || []).filter(t => {
        const fechaEntrega = new Date(t.fechaEntrega);
        return t.habilitada !== false && fechaEntrega >= ahora && fechaEntrega <= proximaSemana;
      })
    ].filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);

    if (!tareasUnidas || tareasUnidas.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="mt-2 text-sm">No hay tareas próximas ni recientes</p>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-gray-200">
        {tareasUnidas.map(tarea => {
          const fechaEntrega = new Date(tarea.fechaEntrega);
          const diasRestantes = Math.ceil((fechaEntrega - ahora) / (1000 * 60 * 60 * 24));
          let statusClass = "bg-green-100 text-green-800";
          let statusText = "Con tiempo";
          if (tarea.habilitada === false) {
            statusClass = "bg-gray-100 text-gray-800";
            statusText = "Deshabilitada";
          } else if (fechaEntrega < ahora) {
            statusClass = "bg-red-100 text-red-800";
            statusText = "Vencida";
          } else if (diasRestantes <= 3) {
            statusClass = "bg-yellow-100 text-yellow-800";
            statusText = `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`;
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
                    {statusText}
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

  // Mejorar sección de entregas por calificar: mostrar solo pendientes y acceso directo
  const renderEntregasPendientes = () => {
    if (!entregasRecientes || entregasRecientes.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="mt-2 text-sm">No hay entregas pendientes por calificar</p>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-gray-200">
        {entregasRecientes
          .filter(entrega => entrega.calificacion === null || entrega.calificacion === undefined)
          .map(entrega => (
            <li key={entrega.id} className="py-4">
              <div className="block hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{entrega.tarea?.titulo || 'Tarea sin título'}</p>
                    <p className="text-xs text-gray-500">
                      Estudiante: {entrega.estudiante?.firstName} {entrega.estudiante?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Entregado: {formatDate(entrega.fechaEntrega || entrega.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                    <Link 
                      to={`/docente/tareas/${entrega.tareaId}/calificar`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Calificar
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
      </ul>
    );
  };

  // Mejorar cursos asignados: mostrar % de entregas realizadas por curso
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
              <div className="ml-4 flex flex-col items-end">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {curso._count?.estudiantes || 0} estudiantes
                </span>
                {/* Si tienes datos de entregas por curso, muestra el porcentaje */}
                {curso.entregasTotales && curso.entregasEsperadas ? (
                  <span className="text-xs text-gray-500 mt-1">
                    {Math.round((curso.entregasTotales / curso.entregasEsperadas) * 100)}% entregas
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  // Calcular estadísticas rápidas para el dashboard
  const stats = {
    tareasPorCalificar: entregasRecientes
      ? entregasRecientes.filter(e => e.calificacion === null || e.calificacion === undefined).length
      : 0,
    cursos: cursos ? cursos.length : 0,
    estudiantes: cursos
      ? cursos.reduce((sum, c) => sum + (c._count?.estudiantes || 0), 0)
      : 0,
    tareasActivas: tareasRecientes
      ? tareasRecientes.filter(t => t.habilitada !== false && new Date(t.fechaEntrega) >= new Date()).length
      : 0,
    entregasPendientes: entregasRecientes
      ? entregasRecientes.length
      : 0,
    tareasProximas: tareasRecientes
      ? tareasRecientes.filter(t => {
          const fechaEntrega = new Date(t.fechaEntrega);
          const ahora = new Date();
          const proximaSemana = new Date();
          proximaSemana.setDate(ahora.getDate() + 7);
          return t.habilitada !== false && fechaEntrega >= ahora && fechaEntrega <= proximaSemana;
        }).length
      : 0,
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
      

      
      {/* Acciones rápidas */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100 mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Acciones rápidas</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to="/docente/tareas/nueva" 
              className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors duration-200"
            >
              <div className="bg-primary text-white rounded-full p-2 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Nueva Tarea</h4>
                <p className="text-xs text-gray-600">Crear nueva tarea</p>
              </div>
            </Link>
            
            <Link 
              to="/docente/tareas" 
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <div className="bg-blue-600 text-white rounded-full p-2 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Mis Tareas</h4>
                <p className="text-xs text-gray-600">Ver todas las tareas</p>
              </div>
            </Link>
            
            <div className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 cursor-pointer"
                 onClick={() => {
                   if (tareasRecientes && tareasRecientes.length > 0) {
                     // Encontrar la primera tarea con entregas pendientes
                     const tareaConEntregas = tareasRecientes.find(tarea => tarea.id);
                     if (tareaConEntregas) {
                       window.location.href = `/docente/tareas/${tareaConEntregas.id}/calificar`;
                     }
                   }
                 }}
            > 
            <div className="bg-green-600 text-white rounded-full p-2 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div> 
                <h4 className="text-sm font-medium text-gray-900">Calificar</h4>
                <p className="text-xs text-gray-600">{stats.tareasPorCalificar} tareas por calificar</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 cursor-pointer"
                 onClick={() => {
                   // Generar reporte rápido de estadísticas
                   const reportData = `REPORTE DASHBOARD DOCENTE\n\n` +
                     `Fecha: ${new Date().toLocaleDateString('es-ES')}\n` +
                     `Docente: ${getFullName(user.firstName, user.lastName)}\n\n` +
                     `ESTADÍSTICAS:\n` +
                     `- Cursos: ${stats.cursos}\n` +
                     `- Estudiantes: ${stats.estudiantes}\n` +
                     `- Tareas activas: ${stats.tareasActivas}\n` +
                     `- Entregas pendientes: ${stats.entregasPendientes}\n` +
                     `- Próximas a vencer: ${stats.tareasProximas}\n`;
                   
                   const element = document.createElement("a");
                   const file = new Blob([reportData], {type: 'text/plain'});
                   element.href = URL.createObjectURL(file);
                   element.download = `reporte_dashboard_${new Date().toISOString().split('T')[0]}.txt`;
                   document.body.appendChild(element);
                   element.click();
                   document.body.removeChild(element);
                 }}
            >
              <div className="bg-purple-600 text-white rounded-full p-2 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Reportes</h4>
                <p className="text-xs text-gray-600">Generar informes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secciones principales del dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tareas próximas (fusiona recientes y próximas a vencer) */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Tareas próximas</h3>
            <Link to="/docente/tareas" className="text-sm text-primary hover:text-primary-dark font-medium">
              Ver todas
            </Link>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {renderTareasProximas()}
          </div>
        </div>
        {/* Cursos asignados mejorados */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Mis cursos</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {renderCursosDocente()}
          </div>
        </div>
      </div>
      {/* Entregas pendientes mejoradas */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100 mt-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Entregas por calificar</h3>
          <Link to="/docente/tareas" className="text-sm text-primary hover:text-primary-dark font-medium">
            Ver todas las tareas
          </Link>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {renderEntregasPendientes()}
        </div>
      </div>
    </div>
  );
};

export default DashboardDocente;
