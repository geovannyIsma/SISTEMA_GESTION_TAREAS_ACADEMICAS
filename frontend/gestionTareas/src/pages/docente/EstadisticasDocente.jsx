import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { getFullName } from '../../utils/validation';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
  Filler // <-- Agregar Filler
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
  Filler // <-- Registrar Filler
);

const EstadisticasDocente = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState(null);
  const [stats, setStats] = useState({
    totalTareas: 0,
    tareasActivas: 0,
    tareasPorCalificar: 0,
    estudiantes: 0,
    tareasProximas: 0,
    entregasPendientes: 0,
    tareasVencidas: 0,
    promedioCalificaciones: null
  });
  const [chartData, setChartData] = useState({
    tareasPorEstado: null,
    entregasPorCurso: null,
    calificacionesPorMes: null,
    distribucionCalificaciones: null
  });
  const [tareasData,  areasData] = useState([]);
  const [promediosPorCurso, setPromediosPorCurso] = useState([]);
  const [todasTareasDocente, setTodasTareasDocente] = useState([]);

  useEffect(() => {
    const fetchCursos = async () => {
      setLoading(true);
      try {
        const cursosResponse = await api.listarCursosDocente();
        if (cursosResponse && cursosResponse.data) {
          setCursos(cursosResponse.data);
          if (cursosResponse.data.length > 0) {
            setSelectedCursoId(cursosResponse.data[0].id);
          }
        }
      } catch (err) {
        showAlert('error', 'Error al cargar los cursos');
      } finally {
        setLoading(false);
      }
    };
    fetchCursos();
  }, [showAlert]);

  useEffect(() => {
    if (!selectedCursoId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener estadísticas por curso
        const statsResponse = await api.getDocenteEstadisticasPorCurso(selectedCursoId);
        console.log('Estadísticas por curso:', statsResponse);
        if (statsResponse && statsResponse.data) {
          setStats(statsResponse.data);
        }
        // Obtener todas las tareas del docente (con entregas y asignaciones)
        const tareasResponse = await api.listarTareasDocente();
        console.log('Tareas docente:', tareasResponse);
        let tareasCurso = [];
        let tareasDocente = [];
        if (tareasResponse && tareasResponse.data) {
          tareasDocente = tareasResponse.data;
          setTodasTareasDocente(tareasDocente);
          // Filtrar tareas del curso seleccionado (por asignación)
          tareasCurso = tareasDocente.filter(
            t => t.asignaciones && t.asignaciones.some(a => a.cursoId === selectedCursoId)
          );
        }
        console.log('Tareas del curso seleccionado:', tareasCurso);
        generateChartData(statsResponse?.data || {}, tareasCurso, tareasDocente);

        // Calcular promedios de calificaciones por curso (usando asignaciones[].cursoId y entregas)
        if (cursos.length > 0 && tareasResponse && tareasResponse.data) {
          const promedios = cursos.map(curso => {
            // Tareas asignadas a este curso
            const tareasDeCurso = tareasResponse.data.filter(
              t =>
                Array.isArray(t.asignaciones) &&
                t.asignaciones.some(a => a.cursoId === curso.id)
            );
            let suma = 0, total = 0;
            tareasDeCurso.forEach(tarea => {
              if (Array.isArray(tarea.entregas)) {
                tarea.entregas.forEach(entrega => {
                  if (
                    entrega.calificacion !== null &&
                    entrega.calificacion !== undefined
                  ) {
                    suma += entrega.calificacion;
                    total++;
                  }
                });
              }
            });
            return {
              curso: curso.nombre,
              promedio: total > 0 ? (suma / total).toFixed(2) : null
            };
          }).filter(p => p.promedio !== null);
          console.log('Promedios por curso:', promedios);
          setPromediosPorCurso(promedios);
        }
      } catch (err) {
        console.error('Error al cargar las estadísticas:', err);
        showAlert('error', 'Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [selectedCursoId, showAlert, cursos.length]);

  // Nuevo useEffect para actualizar el gráfico de promedios cuando cambie promediosPorCurso
  useEffect(() => {
    if (!promediosPorCurso || promediosPorCurso.length === 0) return;

    const promediosLabels = promediosPorCurso.map(p => p.curso);
    const promediosData = promediosPorCurso.map(p => Number(p.promedio));

    const promediosCursosChart = {
      labels: promediosLabels,
      datasets: [{
        label: 'Promedio de Calificaciones',
        data: promediosData,
        backgroundColor: '#a855f7',
        borderColor: '#7c3aed',
        borderWidth: 1
      }]
    };

    setChartData(prev => ({
      ...prev,
      promediosCursosChart
    }));

    console.log('Actualizado gráfico de promedios:', promediosCursosChart);
  }, [promediosPorCurso]);

  const generateChartData = (stats, tareasData, todasTareasDocente) => {
    // Gráfico de tareas por estado (del curso seleccionado)
    const tareasPorEstado = {
      labels: ['Activas', 'Vencidas', 'Próximas a vencer'],
      datasets: [{
        data: [stats.tareasActivas, stats.tareasVencidas, stats.tareasProximas],
        backgroundColor: [
          '#10B981', // Verde para activas
          '#EF4444', // Rojo para vencidas
          '#F59E0B'  // Amarillo para próximas
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Gráfico de entregas por estado (Entregadas vs Pendientes) para el curso seleccionado
    let totalEntregadas = 0;
    let totalPendientes = 0;
    tareasData.forEach(tarea => {
      // Calcular estudiantes asignados a la tarea
      let asignados = [];
      if (tarea.asignaciones) {
        tarea.asignaciones.forEach(asig => {
          if (asig.estudianteId) {
            asignados.push(asig.estudianteId);
          } else if (asig.curso && asig.curso.estudiantes) {
            asignados.push(...asig.curso.estudiantes.map(e => e.id));
          }
        });
      }
      asignados = [...new Set(asignados)];
      const entregadas = tarea.entregas ? tarea.entregas.length : 0;
      totalEntregadas += entregadas;
      totalPendientes += Math.max(asignados.length - entregadas, 0);
    });

    const entregasPorEstado = {
      labels: ['Entregadas', 'Pendientes'],
      datasets: [{
        data: [totalEntregadas, totalPendientes],
        backgroundColor: ['#3B82F6', '#F59E0B'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Gráfico de estudiantes por curso (siempre visible)
    const entregasPorCurso = {
      labels: cursos.map(curso => curso.nombre),
      datasets: [{
        label: 'Estudiantes',
        data: cursos.map(curso => curso._count?.estudiantes || 0),
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 1
      }]
    };

    setChartData({
      tareasPorEstado,
      entregasPorCurso,
      entregasPorEstado
      // promediosCursosChart se actualiza en el useEffect de arriba
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas del Docente</h1>
          <p className="mt-2 text-gray-600">
            Bienvenido, {getFullName(user?.firstName, user?.lastName)}
          </p>
        </div>

        {/* Selector de curso */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Curso:</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedCursoId || ''}
            onChange={e => setSelectedCursoId(Number(e.target.value))}
          >
            {cursos.map(curso => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-50 text-blue-600 rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Total Tareas</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTareas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-50 text-green-600 rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Tareas Activas</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.tareasActivas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-50 text-yellow-600 rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Entregas Pendientes</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.entregasPendientes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-50 text-purple-600 rounded-full p-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600">Promedio Calificaciones</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.promedioCalificaciones ?? '--'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de tareas por estado */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de las Tareas</h3>
            <div className="h-64">
              {chartData.tareasPorEstado && (
                <Doughnut data={chartData.tareasPorEstado} options={chartOptions} />
              )}
            </div>
          </div>

          {/* NUEVO: Gráfico de entregas por estado */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Entregas por Estado</h3>
            <div className="h-64">
              {chartData.entregasPorEstado && (
                <Doughnut data={chartData.entregasPorEstado} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Gráficos de cursos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de estudiantes por curso */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estudiantes por Curso</h3>
            <div className="h-64">
              {chartData.entregasPorCurso && chartData.entregasPorCurso.labels.length > 0 ? (
                <Bar data={chartData.entregasPorCurso} options={barOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Sin datos</div>
              )}
            </div>
          </div>
          {/* Gráfico de promedio de calificaciones por curso */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Promedio de Calificaciones por Curso</h3>
            <div className="h-64">
              {chartData.promediosCursosChart && chartData.promediosCursosChart.labels.length > 0 ? (
                <Bar data={chartData.promediosCursosChart} options={barOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Sin datos</div>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Cursos Asignados</h3>
                <p className="text-3xl font-bold text-blue-600">{cursos.length}</p>
              </div>
              <div className="bg-blue-50 text-blue-600 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Estudiantes en el Curso</h3>
                <p className="text-3xl font-bold text-green-600">
                  {cursos.find(c => c.id === selectedCursoId)?._count?.estudiantes ?? 0}
                </p>
              </div>
              <div className="bg-green-50 text-green-600 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Tareas Vencidas</h3>
                <p className="text-3xl font-bold text-red-600">{stats.tareasVencidas}</p>
              </div>
              <div className="bg-red-50 text-red-600 rounded-full p-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasDocente;