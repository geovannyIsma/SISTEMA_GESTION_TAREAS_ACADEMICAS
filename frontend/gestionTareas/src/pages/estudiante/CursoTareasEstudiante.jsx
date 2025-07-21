import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const CursoTareasEstudiante = () => {
  const { id } = useParams();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [curso, setCurso] = useState(null);
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    const fetchCursoYTareas = async () => {
      setLoading(true);
      try {
        // Obtener información del curso
        const cursoResponse = await api.getCursoEstudianteById(id);
        setCurso(cursoResponse.data);
        
        // Obtener tareas del curso
        const tareasResponse = await api.getTareasCursoEstudiante(id);
        setTareas(tareasResponse.data);
      } catch (err) {
        showAlert('error', err.message || 'Error al cargar el curso y sus tareas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCursoYTareas();
  }, [id, showAlert]);

  // Función para calcular el estado de la tarea
  const calcularEstadoTarea = (tarea) => {
    const hoy = new Date();
    const fechaEntrega = new Date(tarea.fechaEntrega);
    
    if (tarea.entregado) {
      return {
        label: "Entregado",
        bgColor: "bg-green-100",
        textColor: "text-green-800"
      };
    }
    
    if (fechaEntrega < hoy) {
      return {
        label: "Vencido",
        bgColor: "bg-red-100",
        textColor: "text-red-800"
      };
    }
    
    // Calcular días restantes
    const diasRestantes = Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes <= 1) {
      return {
        label: "Hoy",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800"
      };
    }
    
    if (diasRestantes <= 3) {
      return {
        label: `${diasRestantes} días`,
        bgColor: "bg-orange-100",
        textColor: "text-orange-800"
      };
    }
    
    return {
      label: "Pendiente",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800"
    };
  };

  // Formatear fecha en formato legible
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
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
        <div>
          <div className="flex items-center mb-1">
            <Link to="/estudiante/cursos" className="text-primary hover:text-primary-dark mr-2">
              ← Volver a mis cursos
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{curso?.nombre || 'Curso'}</h1>
          {curso?.asignatura && (
            <p className="text-gray-600 mt-1">
              Asignatura: <span className="font-medium">{curso.asignatura.nombre}</span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 shadow-sm overflow-hidden rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Tareas del curso</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            A continuación se muestran todas las tareas asignadas a este curso.
          </p>
        </div>

        {tareas.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas asignadas a este curso</h3>
            <p className="mt-1 text-sm text-gray-500">Las tareas asignadas por el docente aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tareas.map((tarea) => {
                const estado = calcularEstadoTarea(tarea);
                
                return (
                  <Link 
                    to={`/estudiante/tareas/${tarea.id}`} 
                    key={tarea.id}
                    className="block bg-gray-50 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="px-6 py-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{tarea.titulo}</h3>
                        <span className={`${estado.bgColor} ${estado.textColor} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                          {estado.label}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {tarea.descripcion}
                      </p>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span>Fecha límite: {formatDate(tarea.fechaEntrega)}</span>
                        </div>
                        
                        {tarea.calificacion !== null && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Calificación: {tarea.calificacion} / {tarea.notaMaxima || 10}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <span className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark">
                          Ver detalles →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CursoTareasEstudiante;
