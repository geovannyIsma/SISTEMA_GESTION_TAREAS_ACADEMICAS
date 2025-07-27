import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const CalificarEntregas = () => {
  const { tareaId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // State
  const [tarea, setTarea] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for grading
  const [calificacion, setCalificacion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Filter state
  const [filtroEstado, setFiltroEstado] = useState('todas'); // todas, calificadas, pendientes

  // Load task submissions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get task details
        const tareaResponse = await api.getTareaById(tareaId);
        setTarea(tareaResponse.data);

        // Get submissions for this task
        const entregasResponse = await api.listarEntregasTarea(tareaId);
        setEntregas(entregasResponse.data);
      } catch (error) {
        console.error('Error loading data:', error);
        showAlert('error', error.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    if (tareaId) {
      fetchData();
    }
  }, [tareaId, showAlert]);

  // Load submission details
  const handleSelectEntrega = async (entrega) => {
    if (selectedEntrega?.id === entrega.id) {
      // Deselect if clicking the same submission
      setSelectedEntrega(null);
      setCalificacion('');
      setObservaciones('');
      return;
    }

    setLoadingDetails(true);
    try {
      const response = await api.getEntregaDetails(entrega.id);
      setSelectedEntrega(response.data);
      setCalificacion(response.data.calificacion || '');
      setObservaciones(response.data.observaciones || '');
    } catch (error) {
      console.error('Error loading submission details:', error);
      showAlert('error', error.message || 'Error al cargar detalles de la entrega');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Submit grade
  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    
    if (!selectedEntrega) return;
    
    if (calificacion === '' || calificacion < 0 || calificacion > 10) {
      showAlert('error', 'La calificación debe estar entre 0 y 10');
      return;
    }

    setSubmitting(true);
    try {
      await api.calificarEntrega(selectedEntrega.id, {
        calificacion: parseFloat(calificacion),
        observaciones: observaciones.trim() || null
      });

      // Update the submissions list
      setEntregas(prev => prev.map(entrega => 
        entrega.id === selectedEntrega.id 
          ? { ...entrega, calificacion: parseFloat(calificacion), observaciones }
          : entrega
      ));

      // Update selected submission
      setSelectedEntrega(prev => ({
        ...prev,
        calificacion: parseFloat(calificacion),
        observaciones
      }));

      showAlert('success', 'Entrega calificada correctamente');
    } catch (error) {
      console.error('Error grading submission:', error);
      showAlert('error', error.message || 'Error al calificar la entrega');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter submissions
  const filteredEntregas = entregas.filter(entrega => {
    if (filtroEstado === 'calificadas') return entrega.calificacion !== null;
    if (filtroEstado === 'pendientes') return entrega.calificacion === null;
    return true;
  });

  // Get file type icon
  const getFileIcon = (tipo) => {
    switch (tipo) {
      case 'PDF':
        return '📄';
      case 'IMG':
        return '🖼️';
      case 'ZIP':
        return '📦';
      case 'DOC':
        return '📝';
      default:
        return '📎';
    }
  };

  // Format file size
  const formatFileSize = (sizeMB) => {
    if (sizeMB < 1) {
      return `${(sizeMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeMB.toFixed(1)} MB`;
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/docente/tareas')}
              className="text-primary hover:text-primary-dark mb-2 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Tareas
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Calificar Entregas
            </h1>
            {tarea && (
              <p className="text-gray-600 mt-1">
                Tarea: <span className="font-medium">{tarea.titulo}</span>
              </p>
            )}
          </div>
          
          {/* Filter */}
          <div className="flex items-center space-x-4">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="todas">Todas las entregas</option>
              <option value="pendientes">Pendientes de calificar</option>
              <option value="calificadas">Ya calificadas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Entregas ({filteredEntregas.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredEntregas.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No hay entregas para mostrar</p>
              </div>
            ) : (
              filteredEntregas.map((entrega) => (
                <div
                  key={entrega.id}
                  onClick={() => handleSelectEntrega(entrega)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedEntrega?.id === entrega.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {entrega.estudiante.firstName} {entrega.estudiante.lastName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {entrega.estudiante.email}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs text-gray-500">
                          📅 {new Date(entrega.fecha).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          📎 {entrega.archivos.length} archivo(s)
                        </span>
                        {entrega.fueraDePlazo && (
                          <span className="text-xs text-red-600 font-medium">
                            ⚠️ Fuera de plazo
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {entrega.calificacion !== null ? (
                        <div className="text-sm font-medium text-green-600">
                          {entrega.calificacion}/10
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          Sin calificar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submission Details & Grading */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {!selectedEntrega ? (
            <div className="p-6 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
              </svg>
              <p>Selecciona una entrega para ver los detalles</p>
            </div>
          ) : loadingDetails ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando detalles...</p>
            </div>
          ) : (
            <div>
              {/* Student Info */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedEntrega.estudiante.firstName} {selectedEntrega.estudiante.lastName}
                </h2>
                <p className="text-sm text-gray-500">{selectedEntrega.estudiante.email}</p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                  <span>📅 {new Date(selectedEntrega.fecha).toLocaleString()}</span>
                  {selectedEntrega.fueraDePlazo && (
                    <span className="text-red-600 font-medium">⚠️ Entrega tardía</span>
                  )}
                </div>
              </div>

              {/* Student Comment */}
              {selectedEntrega.comentario && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Comentario del estudiante:</h3>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700">{selectedEntrega.comentario}</p>
                  </div>
                </div>
              )}

              {/* Files */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Archivos entregados ({selectedEntrega.archivos.length})
                </h3>
                <div className="space-y-2">
                  {selectedEntrega.archivos.map((archivo) => (
                    <div key={archivo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getFileIcon(archivo.tipo)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{archivo.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {archivo.tipo} • {formatFileSize(archivo.sizeMB)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`http://localhost:3000${archivo.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                      >
                        Ver archivo
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grading Form */}
              <div className="px-6 py-4">
                <form onSubmit={handleSubmitGrade}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="calificacion" className="block text-sm font-medium text-gray-700">
                        Calificación (0-10) *
                      </label>
                      <input
                        type="number"
                        id="calificacion"
                        min="0"
                        max="10"
                        step="0.1"
                        value={calificacion}
                        onChange={(e) => setCalificacion(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">
                        Retroalimentación / Observaciones
                      </label>
                      <textarea
                        id="observaciones"
                        rows={4}
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Escribe comentarios sobre la entrega del estudiante..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                          submitting 
                            ? 'bg-primary-light cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-dark'
                        }`}
                      >
                        {submitting ? 'Guardando...' : 'Guardar Calificación'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalificarEntregas;
