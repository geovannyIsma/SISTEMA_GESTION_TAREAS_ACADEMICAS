import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Alert from '../../components/alert';
import Dialog from '../../components/dialog';
import { sanitizeInput } from '../../utils/validation';

const TareaDocenteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaApertura: '',
    fechaCierre: '',
    notaMaxima: 10,
    habilitada: true,
    archivoUrl: '',
    editableHastaUltimaEntrega: true
  });
  
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Estados para alertas
  const [alertConfig, setAlertConfig] = useState({
    type: 'error',
    message: '',
    isVisible: false
  });
  
  // Estado para diálogos
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: 'question',
    title: '',
    message: '',
    action: null
  });
  
  // Estado para validaciones
  const [validations, setValidations] = useState({
    titulo: { isValid: true, message: '', touched: false },
    descripcion: { isValid: true, message: '', touched: false },
    fechaApertura: { isValid: true, message: '', touched: false },
    fechaCierre: { isValid: true, message: '', touched: false }
  });

  useEffect(() => {
    // Si estamos en modo edición, cargar los datos de la tarea
    if (isEditMode) {
      const fetchTarea = async () => {
        setLoading(true);
        try {
          const response = await api.getTareaById(id); 
          const tareaData = response.data;
          
          // Formatear fechas para inputs datetime-local
          const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
              .toISOString()
              .slice(0, 16); // Formato YYYY-MM-DDTHH:MM
          };
          
          // En edición, si solo existe fechaEntrega la usaremos como fechaCierre
          // y generaremos una fechaApertura como la fecha actual
          const fechaCierre = formatDateForInput(tareaData.fechaEntrega || tareaData.fechaCierre);
          const fechaApertura = formatDateForInput(tareaData.fechaApertura || new Date());
          
          setFormData({
            titulo: tareaData.titulo || '',
            descripcion: tareaData.descripcion || '',
            fechaApertura: fechaApertura,
            fechaCierre: fechaCierre,
            notaMaxima: tareaData.notaMaxima || 10,
            habilitada: tareaData.habilitada !== false, // Si no existe, asumimos true
            archivoUrl: tareaData.archivoUrl || '',
            editableHastaUltimaEntrega: tareaData.editableHastaUltimaEntrega !== false // Si no existe, asumimos true
          });
        } catch (err) {
          showAlert('error', 'Error al cargar datos de la tarea');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchTarea();
    } else {
      // Establecer fechas predeterminadas para nueva tarea
      // Fecha de apertura: fecha actual
      // Fecha de cierre: una semana después
      const ahora = new Date();
      const unaSemanaDepues = new Date();
      unaSemanaDepues.setDate(ahora.getDate() + 7);
      
      const formatDateForInput = (date) => {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, 16); // Formato YYYY-MM-DDTHH:MM
      };
      
      setFormData({
        ...formData,
        fechaApertura: formatDateForInput(ahora),
        fechaCierre: formatDateForInput(unaSemanaDepues)
      });
    }
  }, [id, isEditMode]);

  // Función para mostrar alertas
  const showAlert = (type, message, duration = 5000) => {
    setAlertConfig({ type, message, isVisible: true, duration });
  };

  // Función para cerrar alertas
  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isVisible: false }));
  };

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

  // Ejecutar acción al confirmar diálogo
  const handleDialogConfirm = () => {
    if (dialogConfig.action === 'cancel') {
      navigate('/docente/tareas');
    } else if (dialogConfig.action === 'submit') {
      processFormSubmission();
    }
    closeDialog();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Para campos de texto, sanitizamos la entrada
    if (type === 'text' || type === 'textarea') {
      const sanitizedValue = sanitizeInput(value);
      setFormData({ ...formData, [name]: sanitizedValue });
      validateField(name, sanitizedValue);
    } 
    // Para campos de checkbox
    else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    }
    // Para campos numéricos
    else if (type === 'number') {
      const numValue = parseFloat(value);
      setFormData({ ...formData, [name]: isNaN(numValue) ? 0 : numValue });
    }
    // Para el resto de campos (incluidos datetime-local)
    else {
      setFormData({ ...formData, [name]: value });
      validateField(name, value);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const validateField = (fieldName, value) => {
    let isValid = true;
    let message = '';
    
    switch (fieldName) {
      case 'titulo':
        if (!value.trim()) {
          isValid = false;
          message = 'El título es obligatorio';
        } else if (value.length > 100) {
          isValid = false;
          message = 'El título no puede exceder 100 caracteres';
        }
        break;
      case 'descripcion':
        if (!value.trim()) {
          isValid = false;
          message = 'La descripción es obligatoria';
        }
        break;
      case 'fechaApertura':
        if (!value) {
          isValid = false;
          message = 'La fecha de apertura es obligatoria';
        }
        break;
      case 'fechaCierre':
        if (!value) {
          isValid = false;
          message = 'La fecha de cierre es obligatoria';
        } else if (formData.fechaApertura && new Date(value) <= new Date(formData.fechaApertura)) {
          isValid = false;
          message = 'La fecha de cierre debe ser posterior a la fecha de apertura';
        }
        break;
      default:
        break;
    }
    
    setValidations(prev => ({
      ...prev,
      [fieldName]: { isValid, message, touched: true }
    }));
    
    return isValid;
  };

  const validateForm = () => {
    const tituloValid = validateField('titulo', formData.titulo);
    const descripcionValid = validateField('descripcion', formData.descripcion);
    const fechaAperturaValid = validateField('fechaApertura', formData.fechaApertura);
    const fechaCierreValid = validateField('fechaCierre', formData.fechaCierre);
    
    // Validación adicional: fechaCierre debe ser posterior a fechaApertura
    if (formData.fechaApertura && formData.fechaCierre) {
      const apertura = new Date(formData.fechaApertura);
      const cierre = new Date(formData.fechaCierre);
      
      if (cierre <= apertura) {
        setValidations(prev => ({
          ...prev,
          fechaCierre: { 
            isValid: false, 
            message: 'La fecha de cierre debe ser posterior a la fecha de apertura', 
            touched: true 
          }
        }));
        return false;
      }
    }
    
    return tituloValid && descripcionValid && fechaAperturaValid && fechaCierreValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('error', 'Por favor complete todos los campos obligatorios correctamente');
      return;
    }

    // Mostrar diálogo de confirmación
    showDialog(
      'question',
      isEditMode ? 'Actualizar Tarea' : 'Crear Tarea',
      isEditMode 
        ? `¿Está seguro de que desea actualizar la tarea "${formData.titulo}"?`
        : `¿Está seguro de que desea crear la tarea "${formData.titulo}"?`,
      'submit'
    );
  };

  // Procesar el envío del formulario después de la confirmación
  const processFormSubmission = async () => {
    setSubmitting(true);
    setSubmitError('');
    
    try {
      // Si hay un archivo para subir, hacerlo primero
      let archivoUrl = formData.archivoUrl;
      if (archivo) {
        // Esta es una simplificación - normalmente aquí iría lógica para 
        // subir el archivo a un servicio como AWS S3, Firebase Storage, etc.
        // y luego obtener la URL.
        const formDataFile = new FormData();
        formDataFile.append('file', archivo);
        
        // Suponemos que existe un endpoint para subir archivos
        const uploadResponse = await api.uploadFile(formDataFile);
        archivoUrl = uploadResponse.data.url;
      }
      
      // Crear o actualizar la tarea
      // Para compatibilidad con el backend, añadimos también fechaEntrega como fechaCierre
      const tareaData = {
        ...formData,
        archivoUrl,
        fechaEntrega: formData.fechaCierre  // Para compatibilidad con el backend actual
      };
      
      if (isEditMode) {
        await api.editarTarea(id, tareaData);
        showAlert('success', 'Tarea actualizada correctamente');
      } else {
        await api.crearTarea(tareaData);
        showAlert('success', 'Tarea creada correctamente');
      }

      // Navegar después de un breve retraso para que el usuario vea el mensaje de éxito
      setTimeout(() => navigate('/docente/tareas'), 1500);
    } catch (err) {
      setSubmitError(err.message || 'Ocurrió un error al guardar la tarea');
      showAlert('error', err.message || 'Ocurrió un error al guardar la tarea');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar cancelación si hay cambios en el formulario
  const confirmCancel = () => {
    showDialog(
      'warning',
      'Cancelar edición',
      '¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.',
      'cancel'
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>;
  }

  // Obtener el estilo para los campos de entrada
  const getInputClass = (field) => {
    const baseClass = "mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm";
    
    if (!validations[field] || !validations[field].touched) {
      return `${baseClass} border-gray-300`;
    }
    
    return validations[field].isValid 
      ? `${baseClass} border-green-300 focus:border-green-500` 
      : `${baseClass} border-red-300 focus:border-red-500`;
  };

  // Formatear fecha para mostrar
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Editar tarea' : 'Crear nueva tarea'}
        </h1>
      </div>

      {/* Componente de alerta */}
      <Alert 
        type={alertConfig.type}
        message={alertConfig.message}
        isVisible={alertConfig.isVisible}
        onClose={closeAlert}
        autoHideDuration={alertConfig.duration || 5000}
      />

      {/* Componente de diálogo */}
      <Dialog 
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        type={dialogConfig.type}
        onConfirm={handleDialogConfirm}
        confirmText={dialogConfig.action === 'cancel' ? 'Sí, cancelar' : 'Confirmar'}
        cancelText="Volver"
      >
        <p>{dialogConfig.message}</p>
      </Dialog>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
                Título de la tarea <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titulo"
                id="titulo"
                required
                className={getInputClass('titulo')}
                value={formData.titulo}
                onChange={handleChange}
                maxLength={100}
              />
              {validations.titulo.touched && !validations.titulo.isValid && (
                <p className="mt-1 text-sm text-red-600">{validations.titulo.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                name="descripcion"
                id="descripcion"
                rows={4}
                required
                className={getInputClass('descripcion')}
                value={formData.descripcion}
                onChange={handleChange}
              />
              {validations.descripcion.touched && !validations.descripcion.isValid && (
                <p className="mt-1 text-sm text-red-600">{validations.descripcion.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fechaApertura" className="block text-sm font-medium text-gray-700">
                  Fecha y hora de apertura <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="fechaApertura"
                  id="fechaApertura"
                  required
                  className={getInputClass('fechaApertura')}
                  value={formData.fechaApertura}
                  onChange={handleChange}
                />
                {validations.fechaApertura.touched && !validations.fechaApertura.isValid && (
                  <p className="mt-1 text-sm text-red-600">{validations.fechaApertura.message}</p>
                )}
                {formData.fechaApertura && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDateTime(formData.fechaApertura)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="fechaCierre" className="block text-sm font-medium text-gray-700">
                  Fecha y hora de cierre <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="fechaCierre"
                  id="fechaCierre"
                  required
                  className={getInputClass('fechaCierre')}
                  value={formData.fechaCierre}
                  onChange={handleChange}
                />
                {validations.fechaCierre.touched && !validations.fechaCierre.isValid && (
                  <p className="mt-1 text-sm text-red-600">{validations.fechaCierre.message}</p>
                )}
                {formData.fechaCierre && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDateTime(formData.fechaCierre)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notaMaxima" className="block text-sm font-medium text-gray-700">
                Nota máxima
              </label>
              <input
                type="number"
                name="notaMaxima"
                id="notaMaxima"
                min="0"
                max="20"
                step="0.1"
                className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.notaMaxima}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="archivo" className="block text-sm font-medium text-gray-700">
                Material de apoyo (opcional)
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  id="archivo"
                  name="archivo"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Seleccionar archivo
                </button>
                <span className="ml-3 text-sm text-gray-500">
                  {archivo ? archivo.name : formData.archivoUrl ? 'Archivo ya subido' : 'Ningún archivo seleccionado'}
                </span>
              </div>
            </div>

            {isEditMode && (
              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="habilitada"
                      name="habilitada"
                      type="checkbox"
                      checked={formData.habilitada}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="habilitada" className="font-medium text-gray-700">Tarea habilitada</label>
                    <p className="text-gray-500">Si está habilitada, los estudiantes podrán verla y entregar</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="editableHastaUltimaEntrega"
                    name="editableHastaUltimaEntrega"
                    type="checkbox"
                    checked={formData.editableHastaUltimaEntrega}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="editableHastaUltimaEntrega" className="font-medium text-gray-700">Editable hasta última entrega</label>
                  <p className="text-gray-500">Si está marcado, podrá editar la tarea hasta que todos los estudiantes hayan entregado</p>
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={confirmCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {submitting ? 'Guardando...' : isEditMode ? 'Actualizar tarea' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TareaDocenteForm;
