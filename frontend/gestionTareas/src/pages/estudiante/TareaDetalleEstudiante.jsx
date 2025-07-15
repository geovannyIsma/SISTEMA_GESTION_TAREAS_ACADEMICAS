import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import Dialog from '../../components/dialog';

const TareaDetalleEstudiante = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tarea, setTarea] = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [comentario, setComentario] = useState('');
  
  // Estado para diálogo
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'question',
    action: null
  });

  useEffect(() => {
    const fetchTarea = async () => {
      setLoading(true);
      try {
        const response = await api.getTareaEstudianteById(id);
        setTarea(response.data);
        
        // Si hay una entrega, cargarla
        if (response.data.entrega) {
          setEntrega(response.data.entrega);
          setComentario(response.data.entrega.comentario || '');
        }
      } catch (err) {
        showAlert('error', err.message || 'Error al cargar la tarea');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTarea();
  }, [id, showAlert]);

  // Función para mostrar diálogo
  const showDialog = (type, title, message, action) => {
    setDialogConfig({
      isOpen: true,
      type,
      title,
      message,
      action
    });
  };

  // Función para cerrar diálogo
  const closeDialog = () => {
    setDialogConfig({ ...dialogConfig, isOpen: false });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleComentarioChange = (e) => {
    setComentario(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Si no hay archivo y no es una actualización con archivo previo, mostrar error
    if (!archivo && !entrega?.archivoUrl) {
      showAlert('error', 'Debe seleccionar un archivo para entregar');
      return;
    }
    
    showDialog(
      'question',
      entrega ? 'Actualizar entrega' : 'Enviar entrega',
      entrega 
        ? '¿Está seguro de que desea actualizar su entrega? Se reemplazará la entrega anterior.'
        : '¿Está seguro de que desea enviar esta entrega? Podrá actualizarla hasta la fecha límite.',
      'submit'
    );
  };

  const handleDialogConfirm = async () => {
    if (dialogConfig.action === 'submit') {
      await processEntrega();
    }
    closeDialog();
  };

  const processEntrega = async () => {
    setSubmitting(true);
    try {
      // Crear FormData para enviar archivo
      const formData = new FormData();
      
      if (archivo) {
        formData.append('archivo', archivo);
      }
      
      if (comentario) {
        formData.append('comentario', comentario);
      }
      
      // Enviar la entrega
      await api.enviarEntregaTarea(id, formData);
      
      showAlert('success', entrega ? 'Entrega actualizada correctamente' : 'Entrega enviada correctamente');
      
      // Recargar los datos de la tarea para mostrar la nueva entrega
      const response = await api.getTareaEstudianteById(id);
      setTarea(response.data);
      setEntrega(response.data.entrega);
      setArchivo(null);
    } catch (err) {
      showAlert('error', err.message || 'Error al procesar la entrega');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular si la tarea está vencida
  const isVencida = () => {
    if (!tarea) return false;
    const fechaEntrega = new Date(tarea.fechaEntrega);
    const hoy = new Date();
    return fechaEntrega < hoy;
  };

  // Formatear fecha en formato legible
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
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
      {/* Breadcrumb y título */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center mb-1">
          <Link to={`/estudiante/cursos/${tarea?.cursoId}`} className="text-indigo-600 hover:text-indigo-900 mr-2">
            ← Volver al curso
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{tarea?.titulo || 'Tarea'}</h1>
        {tarea?.curso && (
          <p className="text-gray-600 mt-1">
            Curso: <span className="font-medium">{tarea.curso.nombre}</span>
          </p>
        )}
      </div>

      {/* Componente de diálogo */}
      <Dialog 
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        type={dialogConfig.type}
        onConfirm={handleDialogConfirm}
        confirmText="Confirmar"
        cancelText="Cancelar"
      >
        <p>{dialogConfig.message}</p>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalles de la tarea */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm overflow-hidden rounded-lg border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Detalles de la tarea</h2>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{tarea?.descripcion}</p>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de apertura</h3>
                  <p className="mt-1 text-sm text-gray-900">{tarea?.fechaApertura ? formatDate(tarea.fechaApertura) : 'No especificada'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha límite</h3>
                  <p className={`mt-1 text-sm ${isVencida() ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                    {tarea?.fechaEntrega ? formatDate(tarea.fechaEntrega) : 'No especificada'}
                    {isVencida() && ' (VENCIDA)'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nota máxima</h3>
                  <p className="mt-1 text-sm text-gray-900">{tarea?.notaMaxima || 10}</p>
                </div>
                {entrega?.calificacion !== undefined && entrega?.calificacion !== null && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tu calificación</h3>
                    <p className="mt-1 text-sm font-bold text-gray-900">{entrega.calificacion} / {tarea?.notaMaxima || 10}</p>
                  </div>
                )}
              </div>
              
              {tarea?.archivoUrl && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Material de apoyo</h3>
                  <a 
                    href={tarea.archivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Descargar material
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de entrega */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm overflow-hidden rounded-lg border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Tu entrega</h2>
            </div>
            <div className="p-6">
              {isVencida() && !entrega ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">La fecha límite ha pasado. Ya no puedes entregar esta tarea.</p>
                    </div>
                  </div>
                </div>
              ) : entrega ? (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-900">Entrega realizada</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      Fecha: {formatDate(entrega.fechaEntrega)}
                    </p>
                  </div>
                  
                  {entrega.archivoUrl && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Archivo enviado</h3>
                      <a 
                        href={entrega.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Ver archivo
                      </a>
                    </div>
                  )}
                  
                  {entrega.comentario && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Tu comentario</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line p-3 bg-gray-50 rounded-md">
                        {entrega.comentario}
                      </p>
                    </div>
                  )}
                  
                  {entrega.comentarioDocente && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Comentario del docente</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line p-3 bg-blue-50 rounded-md">
                        {entrega.comentarioDocente}
                      </p>
                    </div>
                  )}
                  
                  {!isVencida() && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Actualizar entrega</h3>
                      <form onSubmit={handleSubmit}>
                        <div>
                          <label htmlFor="archivo" className="block text-sm font-medium text-gray-700">
                            Nuevo archivo (opcional)
                          </label>
                          <input
                            type="file"
                            id="archivo"
                            name="archivo"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                          <div className="mt-1 flex items-center">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current.click()}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Seleccionar archivo
                            </button>
                            <span className="ml-3 text-sm text-gray-500">
                              {archivo ? archivo.name : 'Ningún archivo seleccionado'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label htmlFor="comentario" className="block text-sm font-medium text-gray-700">
                            Comentario (opcional)
                          </label>
                          <textarea
                            id="comentario"
                            name="comentario"
                            rows="3"
                            value={comentario}
                            onChange={handleComentarioChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Escribe un comentario para tu docente..."
                          ></textarea>
                        </div>
                        
                        <div className="mt-4">
                          <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                              submitting ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                          >
                            {submitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Actualizando...
                              </>
                            ) : 'Actualizar entrega'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="archivo" className="block text-sm font-medium text-gray-700">
                      Archivo de entrega <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      id="archivo"
                      name="archivo"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                    <div className="mt-1 flex items-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Seleccionar archivo
                      </button>
                      <span className="ml-3 text-sm text-gray-500">
                        {archivo ? archivo.name : 'Ningún archivo seleccionado'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="comentario" className="block text-sm font-medium text-gray-700">
                      Comentario (opcional)
                    </label>
                    <textarea
                      id="comentario"
                      name="comentario"
                      rows="3"
                      value={comentario}
                      onChange={handleComentarioChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Escribe un comentario para tu docente..."
                    ></textarea>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={submitting || !archivo}
                      className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        (submitting || !archivo) ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : 'Enviar entrega'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TareaDetalleEstudiante;
