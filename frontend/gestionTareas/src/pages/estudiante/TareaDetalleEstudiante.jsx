import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';

const TareaDetalleEstudiante = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [tarea, setTarea] = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const fetchTareaYEntrega = async () => {
      setLoading(true);
      try {
        // Obtener detalles de la tarea
        const tareaResponse = await api.getTareaEstudianteById(id);
        setTarea(tareaResponse.data);
        
        // Obtener entrega si existe
        const entregaResponse = await api.getEntregaEstudiante(id);
        if (entregaResponse.data) {
          setEntrega(entregaResponse.data);
          setComentario(entregaResponse.data.comentario || '');
        }
      } catch (err) {
        showAlert('error', err.message || 'Error al cargar la información de la tarea');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTareaYEntrega();
  }, [id, showAlert]);

  const handleFileChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!archivo && !entrega?.archivoUrl) {
      showAlert('error', 'Por favor, adjunte un archivo para entregar la tarea');
      return;
    }
    
    setEnviando(true);
    
    try {
      const formData = new FormData();
      if (archivo) {
        formData.append('archivo', archivo);
      }
      formData.append('comentario', comentario);
      
      if (entrega) {
        // Actualizar entrega existente
        await api.actualizarEntregaEstudiante(id, formData);
        showAlert('success', 'Entrega actualizada correctamente');
      } else {
        // Crear nueva entrega
        await api.crearEntregaEstudiante(id, formData);
        showAlert('success', 'Tarea entregada correctamente');
      }
      
      // Recargar los datos
      const entregaResponse = await api.getEntregaEstudiante(id);
      if (entregaResponse.data) {
        setEntrega(entregaResponse.data);
      }
      
      // Limpiar el archivo seleccionado
      setArchivo(null);
      document.getElementById('archivo').value = '';
    } catch (err) {
      showAlert('error', err.message || 'Error al entregar la tarea');
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  // Formato de fecha y hora
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Calcular si la fecha de entrega ya pasó
  const esFechaVencida = () => {
    if (!tarea?.fechaEntrega) return false;
    return new Date() > new Date(tarea.fechaEntrega);
  };

  // Determinar si el estudiante puede enviar o no una entrega
  const puedeEntregar = () => {
    // Si no hay tarea o la tarea está calificada, no se puede entregar
    if (!tarea || tarea.calificada) return false;
    
    // Si hay entrega y la tarea está vencida sin permitir entregas tardías
    if (esFechaVencida() && !tarea.permitirEntregasTardias && !entrega) return false;
    
    return true;
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
            {tarea?.curso && (
              <Link to={`/estudiante/cursos/${tarea.curso.id}`} className="text-primary hover:text-primary-dark mr-2">
                ← Volver a {tarea.curso.nombre}
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{tarea?.titulo || 'Tarea'}</h1>
          {tarea?.curso && (
            <p className="text-gray-600 mt-1">
              Curso: <span className="font-medium">{tarea.curso.nombre}</span>
            </p>
          )}
        </div>

        {/* Estado de la tarea */}
        <div className="mt-4 md:mt-0 flex items-center">
          {tarea?.calificada ? (
            <div className="px-4 py-2 rounded-md bg-green-100 text-green-800 font-medium">
              Calificada: {tarea.calificacion} / {tarea.notaMaxima || 10}
            </div>
          ) : entrega ? (
            <div className="px-4 py-2 rounded-md bg-blue-100 text-blue-800 font-medium">
              Entregada {formatDateTime(entrega.fechaEntrega)}
            </div>
          ) : esFechaVencida() ? (
            <div className="px-4 py-2 rounded-md bg-red-100 text-red-800 font-medium">
              Fecha límite vencida
            </div>
          ) : (
            <div className="px-4 py-2 rounded-md bg-yellow-100 text-yellow-800 font-medium">
              Pendiente
            </div>
          )}
        </div>
      </div>

      {/* Detalles de la tarea */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción de la tarea */}
          <div className="bg-gray-50 shadow-sm overflow-hidden rounded-lg border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Descripción de la tarea</h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="prose max-w-none">
                {tarea?.descripcion ? (
                  <div dangerouslySetInnerHTML={{ __html: tarea.descripcion }} />
                ) : (
                  <p className="text-gray-500">No hay descripción disponible para esta tarea.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recursos de la tarea */}
          {tarea?.recursos && tarea.recursos.length > 0 && (
            <div className="bg-gray-50 shadow-sm overflow-hidden rounded-lg border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recursos adicionales</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <ul className="divide-y divide-gray-200">
                  {tarea.recursos.map((recurso, idx) => (
                    <li key={idx} className="py-3">
                      <a 
                        href={recurso.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:text-primary-dark"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {recurso.nombre || 'Recurso'}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Comentarios del profesor */}
          {entrega?.comentariosProfesor && (
            <div className="bg-gray-50 shadow-sm overflow-hidden rounded-lg border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Retroalimentación del profesor</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="prose max-w-none">
                  {entrega.comentariosProfesor}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información de la tarea */}
          <div className="bg-gray-50 shadow-sm overflow-hidden rounded-lg border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Información</h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha de publicación</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(tarea?.fechaPublicacion)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha límite de entrega</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(tarea?.fechaEntrega)}</dd>
                </div>
                {tarea?.permitirEntregasTardias && (
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 text-sm text-gray-600">Se permiten entregas tardías</span>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Puntuación máxima</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tarea?.notaMaxima || 10} puntos</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Formulario de entrega */}
          {puedeEntregar() && (
            <div className="bg-gray-50 shadow-sm overflow-hidden rounded-lg border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Mi entrega</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="archivo" className="block text-sm font-medium text-gray-700">
                        Archivo de entrega
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          id="archivo"
                          name="archivo"
                          type="file"
                          className="py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          onChange={handleFileChange}
                        />
                      </div>
                      {entrega?.archivoUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Archivo actual:</p>
                          <a 
                            href={entrega.archivoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary-dark"
                          >
                            Ver archivo subido
                          </a>
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="comentario" className="block text-sm font-medium text-gray-700">
                        Comentarios (opcional)
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="comentario"
                          name="comentario"
                          rows={3}
                          className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Añade comentarios para tu profesor"
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={enviando}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-50 ${enviando ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                      >
                        {enviando ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                          </span>
                        ) : entrega ? 'Actualizar entrega' : 'Enviar tarea'}
                      </button>
                    </div>
                    {esFechaVencida() && tarea?.permitirEntregasTardias && (
                      <div className="text-center text-xs text-yellow">
                        La fecha límite ha pasado, pero el profesor permite entregas tardías.
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Detalles de la entrega ya calificada */}
          {tarea?.calificada && entrega && (
            <div className="bg-gray-50 shadow-sm overflow-hidden rounded-lg border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Calificación</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-center">
                  <div className="text-4xl font-bold text-primary">
                    {tarea.calificacion} <span className="text-xl text-gray-500">/ {tarea.notaMaxima || 10}</span>
                  </div>
                </div>
                {entrega.fechaCalificacion && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    Calificado el {formatDateTime(entrega.fechaCalificacion)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TareaDetalleEstudiante;