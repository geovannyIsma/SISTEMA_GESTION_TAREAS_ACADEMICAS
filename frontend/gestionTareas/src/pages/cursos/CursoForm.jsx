import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cursoService from '../../services/cursoService';
import { sanitizeInput } from '../../utils/validation';
import Alert from '../../components/alert';
import Dialog from '../../components/dialog';
import api from '../../services/api'; // Asegúrate de importar el cliente de API

const CursoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    activo: true
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [allDocentes, setAllDocentes] = useState([]);
  const [allEstudiantes, setAllEstudiantes] = useState([]);
  const [searchDocenteTerm, setSearchDocenteTerm] = useState('');
  const [searchEstudianteTerm, setSearchEstudianteTerm] = useState('');
  const [assigningDocentes, setAssigningDocentes] = useState(false);
  const [assigningEstudiantes, setAssigningEstudiantes] = useState(false);
  const [selectedDocentes, setSelectedDocentes] = useState([]);
  const [selectedEstudiantes, setSelectedEstudiantes] = useState([]);

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
    action: null,
    actionData: null
  });
  
  // Estado para pestañas
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Si estamos en modo edición, cargar datos del curso
        if (isEditMode) {
          const cursoResponse = await cursoService.getCursoById(id);
          const cursoData = cursoResponse.data;
          
          setFormData({
            nombre: cursoData.nombre,
            codigo: cursoData.codigo,
            descripcion: cursoData.descripcion || '',
            activo: cursoData.activo
          });
          
          // Cargar docentes y estudiantes del curso
          setDocentes(cursoData.docentes || []);
          setEstudiantes(cursoData.estudiantes || []);
        }
        
        // Cargar todos los docentes y estudiantes para asignación
        const docentesResponse = await cursoService.getDocentes();
        setAllDocentes(docentesResponse.data);
        
        const estudiantesResponse = await cursoService.getEstudiantes();
        setAllEstudiantes(estudiantesResponse.data);
      } catch (err) {
        showAlert('error', 'Error al cargar datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
  const showDialog = (type, title, message, action, actionData = null) => {
    // Asegurarse de que no haya diálogos modales abiertos antes de mostrar el diálogo de confirmación
    setAssigningDocentes(false);
    setAssigningEstudiantes(false);
    
    setDialogConfig({
      isOpen: true,
      type,
      title,
      message,
      action,
      actionData
    });
  };

  // Función para cerrar diálogo
  const closeDialog = () => {
    setDialogConfig({ ...dialogConfig, isOpen: false });
  };

  // Ejecutar acción al confirmar diálogo
  const handleDialogConfirm = () => {
    const { action, actionData } = dialogConfig;
    closeDialog();

    if (action === 'cancel') {
      navigate('/cursos');
    } else if (action === 'submit') {
      processFormSubmission();
    } else if (action === 'addDocentes') {
      handleAddDocentesConfirm();
    } else if (action === 'addEstudiantes') {
      handleAddEstudiantesConfirm();
    } else if (action === 'removeDocente') {
      handleRemoveDocenteConfirm(actionData);
    } else if (action === 'removeEstudiante') {
      handleRemoveEstudianteConfirm(actionData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      // Only sanitize name and codigo fields, leave description as-is to preserve spaces
      const sanitizedValue = name === 'descripcion' 
        ? value  // Don't sanitize description to preserve spaces
        : sanitizeInput(value);
      setFormData({ ...formData, [name]: sanitizedValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    if (!formData.nombre || !formData.codigo) {
      showAlert('error', 'El nombre y código del curso son obligatorios');
      return;
    }

    // Mostrar diálogo de confirmación
    showDialog(
      'question',
      isEditMode ? 'Actualizar Curso' : 'Crear Curso',
      isEditMode 
        ? `¿Está seguro de que desea actualizar la información del curso "${formData.nombre}"?`
        : `¿Está seguro de que desea crear el curso "${formData.nombre}"?`,
      'submit'
    );
  };

  // Procesar el envío del formulario después de la confirmación
  const processFormSubmission = async () => {
    setSubmitting(true);
    
    try {
      if (isEditMode) {
        await cursoService.updateCurso(id, formData);
        showAlert('success', 'Curso actualizado correctamente');
      } else {
        await cursoService.createCurso(formData);
        showAlert('success', 'Curso creado correctamente');
      }

      // Navegar después de un breve retraso para que el usuario vea el mensaje de éxito
      setTimeout(() => navigate('/cursos'), 1500);
    } catch (err) {
      showAlert('error', err.message || 'Ocurrió un error al guardar el curso');
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

  // Filtrar docentes según el término de búsqueda
  const filteredDocentes = allDocentes.filter(docente => {
    const matchesSearch = docente.name.toLowerCase().includes(searchDocenteTerm.toLowerCase()) || 
                         docente.email.toLowerCase().includes(searchDocenteTerm.toLowerCase());
    // Excluir docentes que ya están en el curso
    const isNotAssigned = !docentes.some(d => d.id === docente.id);
    return matchesSearch && isNotAssigned;
  });

  // Filtrar estudiantes según el término de búsqueda
  const filteredEstudiantes = allEstudiantes.filter(estudiante => {
    const matchesSearch = estudiante.name.toLowerCase().includes(searchEstudianteTerm.toLowerCase()) || 
                         estudiante.email.toLowerCase().includes(searchEstudianteTerm.toLowerCase());
    // Excluir estudiantes que ya están en el curso
    const isNotAssigned = !estudiantes.some(e => e.id === estudiante.id);
    return matchesSearch && isNotAssigned;
  });

  // Abrir modal para añadir docentes
  const openAddDocentesModal = () => {
    // Cerrar cualquier otro modal o diálogo que esté abierto
    setAssigningEstudiantes(false);
    setDialogConfig({...dialogConfig, isOpen: false});
    
    // Cargar docentes filtrados por rol
    setSearchDocenteTerm('');
    cursoService.getDocentes()
      .then(response => {
        setAllDocentes(response.data);
        setAssigningDocentes(true);
        setSelectedDocentes([]);
      })
      .catch(error => {
        showAlert('error', 'Error al cargar docentes');
        console.error(error);
      });
  };

  // Abrir modal para añadir estudiantes
  const openAddEstudiantesModal = () => {
    // Cerrar cualquier otro modal o diálogo que esté abierto
    setAssigningDocentes(false);
    setDialogConfig({...dialogConfig, isOpen: false});
    
    // Cargar estudiantes filtrados por rol
    setSearchEstudianteTerm('');
    cursoService.getEstudiantes()
      .then(response => {
        setAllEstudiantes(response.data);
        setAssigningEstudiantes(true);
        setSelectedEstudiantes([]);
      })
      .catch(error => {
        showAlert('error', 'Error al cargar estudiantes');
        console.error(error);
      });
  };

  // Seleccionar/deseleccionar docente
  const toggleSelectDocente = (docenteId) => {
    if (selectedDocentes.includes(docenteId)) {
      setSelectedDocentes(selectedDocentes.filter(id => id !== docenteId));
    } else {
      setSelectedDocentes([...selectedDocentes, docenteId]);
    }
  };

  // Seleccionar/deseleccionar estudiante
  const toggleSelectEstudiante = (estudianteId) => {
    if (selectedEstudiantes.includes(estudianteId)) {
      setSelectedEstudiantes(selectedEstudiantes.filter(id => id !== estudianteId));
    } else {
      setSelectedEstudiantes([...selectedEstudiantes, estudianteId]);
    }
  };

  // Confirmar añadir docentes seleccionados al curso
  const confirmAddDocentes = () => {
    if (selectedDocentes.length === 0) {
      showAlert('warning', 'No hay docentes seleccionados');
      return;
    }
    
    // Ejecutar directamente sin mostrar diálogo de confirmación
    handleAddDocentesConfirm();
    setAssigningDocentes(false);
  };

  // Añadir docentes seleccionados al curso
  const handleAddDocentesConfirm = async () => {
    try {
      await cursoService.addDocentes(id, selectedDocentes);
      
      // Actualizar la lista de docentes del curso
      const updatedCurso = await cursoService.getCursoById(id);
      setDocentes(updatedCurso.data.docentes);
      
      showAlert('success', 'Docentes añadidos correctamente');
    } catch (error) {
      showAlert('error', 'Error al añadir docentes');
      console.error(error);
    }
  };

  // Confirmar añadir estudiantes seleccionados al curso
  const confirmAddEstudiantes = () => {
    if (selectedEstudiantes.length === 0) {
      showAlert('warning', 'No hay estudiantes seleccionados');
      return;
    }
    
    // Ejecutar directamente sin mostrar diálogo de confirmación
    handleAddEstudiantesConfirm();
    setAssigningEstudiantes(false);
  };

  // Añadir estudiantes seleccionados al curso
  const handleAddEstudiantesConfirm = async () => {
    try {
      await cursoService.addEstudiantes(id, selectedEstudiantes);
      
      // Actualizar la lista de estudiantes del curso
      const updatedCurso = await cursoService.getCursoById(id);
      setEstudiantes(updatedCurso.data.estudiantes);
      
      showAlert('success', 'Estudiantes añadidos correctamente');
    } catch (error) {
      showAlert('error', 'Error al añadir estudiantes');
      console.error(error);
    }
  };

  // Confirmar eliminar docente del curso
  const confirmRemoveDocente = (docenteId, docenteName) => {
    showDialog(
      'warning',
      'Eliminar docente',
      `¿Está seguro de que desea eliminar al docente ${docenteName} del curso?`,
      'removeDocente',
      docenteId
    );
  };

  // Eliminar docente del curso
  const handleRemoveDocenteConfirm = async (docenteId) => {
    try {
      await cursoService.removeDocentes(id, [docenteId]);
      
      // Actualizar la lista de docentes
      setDocentes(docentes.filter(d => d.id !== docenteId));
      
      showAlert('success', 'Docente eliminado correctamente');
    } catch (error) {
      showAlert('error', 'Error al eliminar docente');
      console.error(error);
    }
  };

  // Confirmar eliminar estudiante del curso
  const confirmRemoveEstudiante = (estudianteId, estudianteName) => {
    showDialog(
      'warning',
      'Eliminar estudiante',
      `¿Está seguro de que desea eliminar al estudiante ${estudianteName} del curso?`,
      'removeEstudiante',
      estudianteId
    );
  };

  // Eliminar estudiante del curso
  const handleRemoveEstudianteConfirm = async (estudianteId) => {
    try {
      await cursoService.removeEstudiantes(id, [estudianteId]);
      
      // Actualizar la lista de estudiantes
      setEstudiantes(estudiantes.filter(e => e.id !== estudianteId));
      
      showAlert('success', 'Estudiante eliminado correctamente');
    } catch (error) {
      showAlert('error', 'Error al eliminar estudiante');
      console.error(error);
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Editar curso' : 'Crear curso'}
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

      {/* Componente de diálogo de confirmación - aumentar z-index */}
      <Dialog 
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        type={dialogConfig.type}
        onConfirm={handleDialogConfirm}
        confirmText={
          dialogConfig.action === 'cancel' ? 'Sí, cancelar' : 
          dialogConfig.action === 'removeDocente' || dialogConfig.action === 'removeEstudiante' ? 'Eliminar' : 
          'Confirmar'
        }
        cancelText="Volver"
        width="max-w-lg"
        preventOutsideClick={true}
      >
        <p>{dialogConfig.message}</p>
      </Dialog>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {/* Pestañas para navegar entre información del curso y participantes */}
        {isEditMode && (
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'info' 
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Información del Curso
              </button>
              <button
                onClick={() => setActiveTab('docentes')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'docentes' 
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Docentes
              </button>
              <button
                onClick={() => setActiveTab('estudiantes')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'estudiantes' 
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Estudiantes
              </button>
            </nav>
          </div>
        )}

        {/* Contenido según la pestaña activa */}
        <div className="p-6">
          {/* Pestaña de información del curso (visible por defecto o cuando activeTab === 'info') */}
          {(!isEditMode || activeTab === 'info') && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Nombre del curso
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    id="nombre"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.nombre}
                    onChange={handleChange}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
                    Código del curso
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    id="codigo"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.codigo}
                    onChange={handleChange}
                    maxLength={20}
                  />
                  <p className="mt-1 text-xs text-gray-500">Código único para identificar el curso</p>
                </div>

                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    id="descripcion"
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.descripcion}
                    onChange={handleChange}
                  />
                </div>

                {isEditMode && (
                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="activo"
                        id="activo"
                        checked={formData.activo}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                        Curso activo
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Los cursos inactivos no son visibles para los estudiantes</p>
                  </div>
                )}
              </div>

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
                    submitting 
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {submitting ? 'Guardando...' : isEditMode ? 'Actualizar curso' : 'Crear'}
                </button>
              </div>
            </form>
          )}

          {/* Pestaña de docentes */}
          {isEditMode && activeTab === 'docentes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Docentes asignados al curso</h2>
                <button 
                  onClick={openAddDocentesModal}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  Añadir docentes
                </button>
              </div>
              
              {docentes.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {docentes.map(docente => (
                    <li key={docente.id} className="py-3 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium">{docente.name}</h3>
                        <p className="text-xs text-gray-500">{docente.email}</p>
                      </div>
                      <button
                        onClick={() => confirmRemoveDocente(docente.id, docente.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 py-4">No hay docentes asignados a este curso</p>
              )}
            </div>
          )}

          {/* Pestaña de estudiantes */}
          {isEditMode && activeTab === 'estudiantes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Estudiantes matriculados en el curso</h2>
                <button 
                  onClick={openAddEstudiantesModal}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Matricular estudiantes
                </button>
              </div>
              
              {estudiantes.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {estudiantes.map(estudiante => (
                    <li key={estudiante.id} className="py-3 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium">{estudiante.name}</h3>
                        <p className="text-xs text-gray-500">{estudiante.email}</p>
                      </div>
                      <button
                        onClick={() => confirmRemoveEstudiante(estudiante.id, estudiante.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 py-4">No hay estudiantes matriculados en este curso</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para añadir docentes */}
      {assigningDocentes && (
        <div className="fixed inset-0 overflow-y-auto z-50" aria-modal="true" role="dialog">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Overlay con fondo semitransparente y desenfoque */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
              onClick={() => setAssigningDocentes(false)}
            ></div>
            
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full max-w-3xl z-50">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Añadir docentes al curso</h3>
                <button onClick={() => setAssigningDocentes(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar docentes por nombre o email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchDocenteTerm}
                    onChange={(e) => handleDocenteSearch(e.target.value)}
                  />
                </div>
                
                <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seleccionar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDocentes.map((docente) => (
                        <tr key={docente.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedDocentes.includes(docente.id)}
                              onChange={() => toggleSelectDocente(docente.id)}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{docente.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{docente.email}</div>
                          </td>
                        </tr>
                      ))}
                      {filteredDocentes.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                            No se encontraron docentes disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setAssigningDocentes(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmAddDocentes}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    disabled={selectedDocentes.length === 0}
                  >
                    {selectedDocentes.length === 0 ? 'Seleccione docentes' : `Añadir ${selectedDocentes.length} docentes`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para añadir estudiantes */}
      {assigningEstudiantes && (
        <div className="fixed inset-0 overflow-y-auto z-50" aria-modal="true" role="dialog">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Overlay con fondo semitransparente y desenfoque */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
              onClick={() => setAssigningEstudiantes(false)}
            ></div>
            
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full max-w-3xl z-50">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Añadir estudiantes al curso</h3>
                <button onClick={() => setAssigningEstudiantes(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar estudiantes por nombre o email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    value={searchEstudianteTerm}
                    onChange={(e) => handleEstudianteSearch(e.target.value)}
                  />
                </div>
                
                <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seleccionar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEstudiantes.map((estudiante) => (
                        <tr key={estudiante.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedEstudiantes.includes(estudiante.id)}
                              onChange={() => toggleSelectEstudiante(estudiante.id)}
                              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{estudiante.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{estudiante.email}</div>
                          </td>
                        </tr>
                      ))}
                      {filteredEstudiantes.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                            No se encontraron estudiantes disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setAssigningEstudiantes(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmAddEstudiantes}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={selectedEstudiantes.length === 0}
                  >
                    {selectedEstudiantes.length === 0 ? 'Seleccione estudiantes' : `Añadir ${selectedEstudiantes.length} estudiantes`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CursoForm;
