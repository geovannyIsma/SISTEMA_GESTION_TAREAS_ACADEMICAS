import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { getFullName } from '../../utils/validation';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  const [exportingPDF, setExportingPDF] = useState(false);
  const statisticsRef = useRef(null);
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

  // Función para exportar a PDF
  const exportToPDF = async () => {
    if (!statisticsRef.current) {
      showAlert('error', 'No se pudo encontrar el contenido para exportar');
      return;
    }

    setExportingPDF(true);
    try {
      // Esperar un momento para que los gráficos se rendericen completamente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Método más directo: crear una copia temporal del contenedor y limpiar todos los estilos problemáticos
      const originalElement = statisticsRef.current;
      const clonedElement = originalElement.cloneNode(true);
      
      // Posicionar el elemento clonado fuera de la vista
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      clonedElement.style.backgroundColor = '#ffffff';
      clonedElement.style.width = originalElement.offsetWidth + 'px';
      clonedElement.style.height = 'auto';
      
      // Agregar al DOM temporalmente
      document.body.appendChild(clonedElement);
      
      // Función para limpiar agresivamente todos los colores oklch
      const cleanAllOklchColors = (element) => {
        const allElements = element.querySelectorAll('*');
        
        allElements.forEach(el => {
          // Remover todos los estilos inline que puedan contener oklch
          if (el.style && el.style.cssText) {
            el.removeAttribute('style');
          }
          
          // Aplicar estilos seguros basados en las clases
          if (el.classList.contains('bg-white')) el.style.backgroundColor = '#ffffff';
          if (el.classList.contains('bg-gray-50')) el.style.backgroundColor = '#f9fafb';
          if (el.classList.contains('bg-blue-50')) el.style.backgroundColor = '#eff6ff';
          if (el.classList.contains('text-blue-600')) {
            el.style.color = '#2563eb';
            el.style.fill = '#2563eb';
          }
          if (el.classList.contains('bg-green-50')) el.style.backgroundColor = '#f0fdf4';
          if (el.classList.contains('text-green-600')) {
            el.style.color = '#16a34a';
            el.style.fill = '#16a34a';
          }
          if (el.classList.contains('bg-yellow-50')) el.style.backgroundColor = '#fefce8';
          if (el.classList.contains('text-yellow-600')) {
            el.style.color = '#ca8a04';
            el.style.fill = '#ca8a04';
          }
          if (el.classList.contains('bg-purple-50')) el.style.backgroundColor = '#faf5ff';
          if (el.classList.contains('text-purple-600')) {
            el.style.color = '#9333ea';
            el.style.fill = '#9333ea';
          }
          if (el.classList.contains('bg-red-50')) el.style.backgroundColor = '#fef2f2';
          if (el.classList.contains('text-red-600')) {
            el.style.color = '#dc2626';
            el.style.fill = '#dc2626';
          }
          if (el.classList.contains('text-gray-900')) el.style.color = '#111827';
          if (el.classList.contains('text-gray-600')) el.style.color = '#4b5563';
          if (el.classList.contains('text-gray-500')) el.style.color = '#6b7280';
          
          // Manejar SVGs específicamente
          if (el.tagName === 'SVG' || el.tagName === 'PATH') {
            el.style.color = 'currentColor';
            el.style.fill = 'currentColor';
            el.style.stroke = 'currentColor';
          }
        });
      };
      
      // Limpiar todos los colores problemáticos
      cleanAllOklchColors(clonedElement);
      
      // Copiar el contenido de los canvas de Chart.js
      const originalCanvases = originalElement.querySelectorAll('canvas');
      const clonedCanvases = clonedElement.querySelectorAll('canvas');
      
      originalCanvases.forEach((originalCanvas, index) => {
        if (clonedCanvases[index]) {
          const clonedCanvas = clonedCanvases[index];
          const context = clonedCanvas.getContext('2d');
          
          // Copiar las dimensiones
          clonedCanvas.width = originalCanvas.width;
          clonedCanvas.height = originalCanvas.height;
          clonedCanvas.style.width = originalCanvas.style.width;
          clonedCanvas.style.height = originalCanvas.style.height;
          
          // Copiar el contenido del canvas original al clonado
          context.drawImage(originalCanvas, 0, 0);
        }
      });
      
      let canvas;
      try {
        // Usar el elemento clonado y limpio
        canvas = await html2canvas(clonedElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: clonedElement.offsetWidth,
          height: clonedElement.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          logging: false
        });
        
        // Remover el elemento clonado del DOM
        document.body.removeChild(clonedElement);
      } catch (firstError) {
        console.log('Primer intento falló, probando método alternativo:', firstError);
        
        // Si el primer intento falló, limpiar el elemento clonado y usar el método de texto
        if (clonedElement && clonedElement.parentNode) {
          document.body.removeChild(clonedElement);
        }
        
        // Usar directamente el método de texto como fallback
        await exportToPDFAlternative();
        return;
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calcular dimensiones para ajustar la imagen al PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; // Margen superior

      // Agregar título al PDF
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const cursoSeleccionado = cursos.find(c => c.id === selectedCursoId);
      const titulo = `Estadísticas del Docente - ${cursoSeleccionado?.nombre || 'Todos los cursos'}`;
      pdf.text(titulo, pdfWidth / 2, 20, { align: 'center' });

      // Agregar fecha y hora
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const fechaHora = new Date().toLocaleString('es-ES');
      pdf.text(`Generado el: ${fechaHora}`, pdfWidth / 2, 25, { align: 'center' });
      pdf.text(`Docente: ${getFullName(user?.firstName, user?.lastName)}`, pdfWidth / 2, 30, { align: 'center' });

      // Si la imagen es muy alta, dividirla en páginas
      const maxHeight = pdfHeight - 40; // Espacio para título y márgenes
      const scaledHeight = imgHeight * ratio;
      
      if (scaledHeight <= maxHeight) {
        // La imagen cabe en una página
        pdf.addImage(imgData, 'PNG', imgX, 35, imgWidth * ratio, scaledHeight);
      } else {
        // Dividir en múltiples páginas
        let yPosition = 35;
        let remainingHeight = scaledHeight;
        let sourceY = 0;
        
        while (remainingHeight > 0) {
          const pageHeight = Math.min(remainingHeight, maxHeight);
          const sourceHeight = pageHeight / ratio;
          
          // Crear canvas temporal para esta sección
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imgWidth;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          tempCtx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
          const tempImgData = tempCanvas.toDataURL('image/png');
          
          pdf.addImage(tempImgData, 'PNG', imgX, yPosition, imgWidth * ratio, pageHeight);
          
          remainingHeight -= pageHeight;
          sourceY += sourceHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
            yPosition = 10;
          }
        }
      }

      // Guardar el PDF
      const fileName = `estadisticas_docente_${cursoSeleccionado?.nombre?.replace(/\s+/g, '_') || 'todos_cursos'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      showAlert('success', 'Reporte PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      
      // Si el error es relacionado con oklch, intentar método alternativo
      if (error.message && error.message.includes('oklch')) {
        try {
          // Método alternativo: usar dom-to-image como fallback
          showAlert('info', 'Intentando método alternativo...');
          await exportToPDFAlternative();
        } catch (fallbackError) {
          console.error('Error en método alternativo:', fallbackError);
          showAlert('error', 'Error al generar el reporte PDF. Intente refrescar la página y volver a intentar.');
        }
      } else {
        showAlert('error', 'Error al generar el reporte PDF');
      }
    } finally {
      setExportingPDF(false);
    }
  };

  // Método alternativo para exportar PDF sin html2canvas
  const exportToPDFAlternative = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Agregar título
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const cursoSeleccionado = cursos.find(c => c.id === selectedCursoId);
    const titulo = `Estadísticas del Docente - ${cursoSeleccionado?.nombre || 'Todos los cursos'}`;
    pdf.text(titulo, pdfWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Agregar información del docente
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Docente: ${getFullName(user?.firstName, user?.lastName)}`, pdfWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pdfWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Agregar estadísticas como texto
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Estadísticas Generales:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const estadisticas = [
      `Total de Tareas: ${stats.totalTareas}`,
      `Tareas Activas: ${stats.tareasActivas}`,
      `Entregas Pendientes: ${stats.entregasPendientes}`,
      `Promedio de Calificaciones: ${stats.promedioCalificaciones ?? '--'}`,
      `Tareas Vencidas: ${stats.tareasVencidas}`,
      `Estudiantes en el Curso: ${cursos.find(c => c.id === selectedCursoId)?._count?.estudiantes ?? 0}`,
      `Cursos Asignados: ${cursos.length}`
    ];

    estadisticas.forEach(stat => {
      pdf.text(stat, 20, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Agregar información de cursos
    if (cursos.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cursos:', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      cursos.forEach(curso => {
        pdf.text(`• ${curso.nombre} - ${curso._count?.estudiantes || 0} estudiantes`, 25, yPosition);
        yPosition += 7;
      });
    }

    // Nota sobre los gráficos
    yPosition += 15;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Nota: Los gráficos no se pudieron incluir debido a limitaciones técnicas.', 20, yPosition);
    pdf.text('Para ver los gráficos completos, consulte la página web.', 20, yPosition + 5);

    // Guardar el PDF
    const fileName = `estadisticas_docente_${cursoSeleccionado?.nombre?.replace(/\s+/g, '_') || 'todos_cursos'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    showAlert('success', 'Reporte PDF generado exitosamente (versión simplificada)');
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas del Docente</h1>
            <p className="mt-2 text-gray-600">
              Bienvenido, {getFullName(user?.firstName, user?.lastName)}
            </p>
          </div>
          <button
            onClick={exportToPDF}
            disabled={exportingPDF}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            {exportingPDF ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exportar PDF</span>
              </>
            )}
          </button>
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

        {/* Contenedor de estadísticas para PDF */}
        <div ref={statisticsRef} className="bg-white p-6 rounded-lg">
          {/* Información del curso seleccionado */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {cursos.find(c => c.id === selectedCursoId)?.nombre || 'Curso no seleccionado'}
            </h2>
            <p className="text-gray-600">Docente: {getFullName(user?.firstName, user?.lastName)}</p>
            <p className="text-gray-500 text-sm">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
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
    </div>
  );
};

export default EstadisticasDocente;