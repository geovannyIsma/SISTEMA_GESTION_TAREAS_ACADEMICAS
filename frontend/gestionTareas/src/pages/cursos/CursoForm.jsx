import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cursoService from '../../services/cursoService';
import { sanitizeInput } from '../../utils/validation';
import Dialog from '../../components/dialog';
import UserSelector from '../../components/users/UserSelector';
import AsignaturaSelector from '../../components/courses/AsignaturaSelector';
import useAlertDialog from '../../hooks/useAlertDialog';
import { useAlert } from '../../context/AlertContext'; // Import the useAlert hook

const CursoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { dialogConfig, showDialog, closeDialog } = useAlertDialog();
  const { showAlert } = useAlert(); // Use the global alert context

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    asignaturaId: null,
    activo: true
  });
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Users state (docentes/estudiantes)
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [allDocentes, setAllDocentes] = useState([]);
  const [allEstudiantes, setAllEstudiantes] = useState([]);
  
  // User selector state
  const [assigningDocentes, setAssigningDocentes] = useState(false);
  const [assigningEstudiantes, setAssigningEstudiantes] = useState(false);
  const [selectedDocentes, setSelectedDocentes] = useState([]);
  const [selectedEstudiantes, setSelectedEstudiantes] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('info');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // If in edit mode, load course data
        if (isEditMode) {
          const cursoResponse = await cursoService.getCursoById(id);
          const cursoData = cursoResponse.data;
          
          setFormData({
            nombre: cursoData.nombre,
            codigo: cursoData.codigo,
            descripcion: cursoData.descripcion || '',
            asignaturaId: cursoData.asignaturaId,
            activo: cursoData.activo
          });
          
          // Load course docentes and estudiantes
          setDocentes(cursoData.docentes || []);
          setEstudiantes(cursoData.estudiantes || []);
        }
        
        // Pre-load available docentes and estudiantes for both create and edit mode
        const docentesResponse = await cursoService.getDocentes();
        const estudiantesResponse = await cursoService.getEstudiantes();
        
        setAllDocentes(docentesResponse.data);
        setAllEstudiantes(estudiantesResponse.data);
        
      } catch (err) {
        showAlert('error', err.message || 'Error al cargar datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, showAlert]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      // Preserve spaces in all fields but still sanitize for other unwanted characters
    const sanitizedValue = value.replace(/[^\w\s.-]/g, '');
    setFormData({ ...formData, [name]: sanitizedValue });
    }
  };

  // Handle asignatura change
  const handleAsignaturaChange = (value) => {
    setFormData({ ...formData, asignaturaId: value });
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.nombre || !formData.codigo || !formData.asignaturaId) {
      showAlert('error', 'Nombre, código y asignatura son obligatorios');
      return;
    }

    // Show confirmation dialog
    showDialog(
      'question',
      isEditMode ? 'Actualizar Curso' : 'Crear Curso',
      isEditMode 
        ? `¿Está seguro de que desea actualizar la información del curso "${formData.nombre}"?`
        : `¿Está seguro de que desea crear el curso "${formData.nombre}"?`,
      'submit'
    );
  };

  // Process form submission after confirmation
  const processFormSubmission = async () => {
    setSubmitting(true);
    
    try {
      if (isEditMode) {
        await cursoService.updateCurso(id, formData);
        showAlert('success', 'Curso actualizado correctamente');
        // Navigate immediately without delay
        navigate('/cursos');
      } else {
        // For new course, create it first then add students and teachers if selected
        const createResponse = await cursoService.createCurso(formData);
        const newCursoId = createResponse.data.id;
        
        // Add selected docentes if any
        if (selectedDocentes.length > 0) {
          await cursoService.addDocentes(newCursoId, selectedDocentes);
        }
        
        // Add selected estudiantes if any
        if (selectedEstudiantes.length > 0) {
          await cursoService.addEstudiantes(newCursoId, selectedEstudiantes);
        }
        
        showAlert('success', 'Curso creado correctamente');
        navigate('/cursos');
      }
    } catch (err) {
      showAlert('error', err.message || 'Ocurrió un error al guardar el curso');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm cancel if there are form changes
  const confirmCancel = () => {
    showDialog(
      'warning',
      'Cancelar edición',
      '¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.',
      'cancel'
    );
  };

  // Dialog confirmation handler
  const handleDialogConfirm = () => {
    const { action, actionData } = dialogConfig;
    closeDialog();

    if (action === 'cancel') {
      navigate('/cursos');
    } else if (action === 'submit') {
      processFormSubmission();
    } else if (action === 'removeDocente') {
      handleRemoveDocenteConfirm(actionData);
    } else if (action === 'removeEstudiante') {
      handleRemoveEstudianteConfirm(actionData);
    }
  };

  // User management functions
  const openAddDocentesModal = async () => {
    try {
      // No longer filter out selected docentes
      setAssigningDocentes(true);
    } catch (error) {
      showAlert('error', error.message || 'Error al cargar docentes');
      console.error(error);
    }
  };

  const openAddEstudiantesModal = async () => {
    try {
      // No longer filter out selected estudiantes
      setAssigningEstudiantes(true);
    } catch (error) {
      showAlert('error', error.message || 'Error al cargar estudiantes');
      console.error(error);
    }
  };

  const toggleSelectDocente = (docenteId) => {
    setSelectedDocentes(prev => 
      prev.includes(docenteId) 
        ? prev.filter(id => id !== docenteId)
        : [...prev, docenteId]
    );
  };

  const toggleSelectEstudiante = (estudianteId) => {
    setSelectedEstudiantes(prev => 
      prev.includes(estudianteId) 
        ? prev.filter(id => id !== estudianteId)
        : [...prev, estudianteId]
    );
  };

  const handleAddDocentesConfirm = async () => {
    try {
      if (isEditMode) {
        await cursoService.addDocentes(id, selectedDocentes);
        
        // Update docentes list
        const updatedCurso = await cursoService.getCursoById(id);
        setDocentes(updatedCurso.data.docentes);
        
        showAlert('success', 'Docentes añadidos correctamente');
      } else {
        // For new courses, just keep track of the selected docentes to add after creation
        showAlert('success', `${selectedDocentes.length} docentes seleccionados`);
      }
      setAssigningDocentes(false);
    } catch (error) {
      showAlert('error', error.message || 'Error al añadir docentes');
      console.error(error);
    }
  };

  const handleAddEstudiantesConfirm = async () => {
    try {
      if (isEditMode) {
        await cursoService.addEstudiantes(id, selectedEstudiantes);
        
        // Update estudiantes list
        const updatedCurso = await cursoService.getCursoById(id);
        setEstudiantes(updatedCurso.data.estudiantes);
        
        showAlert('success', 'Estudiantes añadidos correctamente');
      } else {
        // For new courses, just keep track of the selected estudiantes to add after creation
        showAlert('success', `${selectedEstudiantes.length} estudiantes seleccionados`);
      }
      setAssigningEstudiantes(false);
    } catch (error) {
      showAlert('error', error.message || 'Error al añadir estudiantes');
      console.error(error);
    }
  };

  // Remove docente confirmation
  const confirmRemoveDocente = (docenteId, docenteName) => {
    if (isEditMode) {
      showDialog(
        'warning',
        'Eliminar docente',
        `¿Está seguro de que desea eliminar al docente ${docenteName} del curso?`,
        'removeDocente',
        docenteId
      );
    } else {
      // For new courses, just remove from selectedDocentes array
      setSelectedDocentes(selectedDocentes.filter(id => id !== docenteId));
      showAlert('info', 'Docente eliminado de la selección');
    }
  };

  // Remove docente after confirmation
  const handleRemoveDocenteConfirm = async (docenteId) => {
    try {
      await cursoService.removeDocentes(id, [docenteId]);
      setDocentes(docentes.filter(d => d.id !== docenteId));
      showAlert('success', 'Docente eliminado correctamente');
    } catch (error) {
      showAlert('error', error.message || 'Error al eliminar docente');
      console.error(error);
    }
  };

  // Remove estudiante confirmation
  const confirmRemoveEstudiante = (estudianteId, estudianteName) => {
    if (isEditMode) {
      showDialog(
        'warning',
        'Eliminar estudiante',
        `¿Está seguro de que desea eliminar al estudiante ${estudianteName} del curso?`,
        'removeEstudiante',
        estudianteId
      );
    } else {
      // For new courses, just remove from selectedEstudiantes array
      setSelectedEstudiantes(selectedEstudiantes.filter(id => id !== estudianteId));
      showAlert('info', 'Estudiante eliminado de la selección');
    }
  };

  // Remove estudiante after confirmation
  const handleRemoveEstudianteConfirm = async (estudianteId) => {
    try {
      await cursoService.removeEstudiantes(id, [estudianteId]);
      setEstudiantes(estudiantes.filter(e => e.id !== estudianteId));
      showAlert('success', 'Estudiante eliminado correctamente');
    } catch (error) {
      showAlert('error', error.message || 'Error al eliminar estudiante');
      console.error(error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper function to render selected docentes for new courses
  const renderSelectedDocentes = () => {
    if (selectedDocentes.length === 0) {
      return (
        <p className="text-gray-500 py-4">No hay docentes seleccionados para este curso</p>
      );
    }
    
    return (
      <ul className="divide-y divide-gray-200">
        {selectedDocentes.map(docenteId => {
          const docente = allDocentes.find(d => d.id === docenteId);
          if (!docente) return null;
          
          return (
            <li key={docente.id} className="py-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">{docente.name || `${docente.firstName} ${docente.lastName}`}</h3>
                <p className="text-xs text-gray-500">{docente.email}</p>
              </div>
              <button
                onClick={() => confirmRemoveDocente(docente.id, docente.name || `${docente.firstName} ${docente.lastName}`)}
                className="text-red hover:text-red-dark text-sm"
              >
                Eliminar
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  // Helper function to render selected estudiantes for new courses
  const renderSelectedEstudiantes = () => {
    if (selectedEstudiantes.length === 0) {
      return (
        <p className="text-gray-500 py-4">No hay estudiantes seleccionados para este curso</p>
      );
    }
    
    return (
      <ul className="divide-y divide-gray-200">
        {selectedEstudiantes.map(estudianteId => {
          const estudiante = allEstudiantes.find(e => e.id === estudianteId);
          if (!estudiante) return null;
          
          return (
            <li key={estudiante.id} className="py-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">{estudiante.name || `${estudiante.firstName} ${estudiante.lastName}`}</h3>
                <p className="text-xs text-gray-500">{estudiante.email}</p>
              </div>
              <button
                onClick={() => confirmRemoveEstudiante(estudiante.id, estudiante.name || `${estudiante.firstName} ${estudiante.lastName}`)}
                className="text-red hover:text-red-dark text-sm"
              >
                Eliminar
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Editar curso' : 'Crear curso'}
        </h1>
      </div>

      {/* Confirmation dialog */}
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
        {/* Tabs for course information and participants - Now available for both create and edit */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'info' 
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Información del Curso
            </button>
            <button
              onClick={() => setActiveTab('docentes')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'docentes' 
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Docentes
            </button>
            <button
              onClick={() => setActiveTab('estudiantes')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'estudiantes' 
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Estudiantes
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        <div className="p-6">
          {/* Course information tab */}
          {activeTab === 'info' && (
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.codigo}
                    onChange={handleChange}
                    maxLength={20}
                  />
                  <p className="mt-1 text-xs text-gray-500">Código único para identificar el curso</p>
                </div>

                <div>
                  <label htmlFor="asignaturaId" className="block text-sm font-medium text-gray-700">
                    Asignatura
                  </label>
                  <AsignaturaSelector 
                    value={formData.asignaturaId} 
                    onChange={handleAsignaturaChange}
                    required={true}
                  />
                </div>

                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    id="descripcion"
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
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
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                    submitting 
                      ? 'bg-primary-light cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  {submitting ? 'Guardando...' : isEditMode ? 'Actualizar curso' : 'Crear'}
                </button>
              </div>
            </form>
          )}

          {/* Docentes tab */}
          {activeTab === 'docentes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {isEditMode ? 'Docentes asignados al curso' : 'Seleccionar docentes para el curso'}
                </h2>
                <button 
                  onClick={openAddDocentesModal}
                  className="px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary-dark"
                >
                  {isEditMode ? 'Añadir docentes' : 'Seleccionar docentes'}
                </button>
              </div>
              
              {isEditMode ? (
                docentes.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {docentes.map(docente => (
                      <li key={docente.id} className="py-3 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-medium">{docente.name}</h3>
                          <p className="text-xs text-gray-500">{docente.email}</p>
                        </div>
                        <button
                          onClick={() => confirmRemoveDocente(docente.id, docente.name)}
                          className="text-red hover:text-red-dark text-sm"
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 py-4">No hay docentes asignados a este curso</p>
                )
              ) : (
                renderSelectedDocentes()
              )}
            </div>
          )}

          {/* Estudiantes tab */}
          {activeTab === 'estudiantes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {isEditMode ? 'Estudiantes matriculados en el curso' : 'Seleccionar estudiantes para el curso'}
                </h2>
                <button 
                  onClick={openAddEstudiantesModal}
                  className="px-3 py-1.5 bg-green text-white text-sm rounded hover:bg-green-dark"
                >
                  {isEditMode ? 'Matricular estudiantes' : 'Seleccionar estudiantes'}
                </button>
              </div>
              
              {isEditMode ? (
                estudiantes.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {estudiantes.map(estudiante => (
                      <li key={estudiante.id} className="py-3 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-medium">{estudiante.name}</h3>
                          <p className="text-xs text-gray-500">{estudiante.email}</p>
                        </div>
                        <button
                          onClick={() => confirmRemoveEstudiante(estudiante.id, estudiante.name)}
                          className="text-red hover:text-red-dark text-sm"
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 py-4">No hay estudiantes matriculados en este curso</p>
                )
              ) : (
                renderSelectedEstudiantes()
              )}
            </div>
          )}
        </div>

        {/* Display action buttons at the bottom when on docentes or estudiantes tab */}
        {(activeTab === 'docentes' || activeTab === 'estudiantes') && !isEditMode && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={confirmCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className="bg-primary py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Continuar a Información del Curso
            </button>
          </div>
        )}
      </div>

      {/* UserSelector component for docentes */}
      {assigningDocentes && (
        <UserSelector
          title={isEditMode ? "Añadir docentes al curso" : "Seleccionar docentes para el curso"}
          users={isEditMode 
            ? allDocentes 
            : allDocentes}
          selectedIds={isEditMode ? docentes.map(d => d.id) : selectedDocentes}
          onToggleSelect={toggleSelectDocente}
          onCancel={() => setAssigningDocentes(false)}
          onConfirm={handleAddDocentesConfirm}
          confirmText={isEditMode ? "Añadir docentes" : "Seleccionar docentes"}
          searchPlaceholder="Buscar docentes por nombre o email..."
          emptyMessage="No se encontraron docentes disponibles"
          primaryColor="primary"
        />
      )}
      
      {/* UserSelector component for estudiantes */}
      {assigningEstudiantes && (
        <UserSelector
          title={isEditMode ? "Añadir estudiantes al curso" : "Seleccionar estudiantes para el curso"}
          users={isEditMode 
            ? allEstudiantes 
            : allEstudiantes}
          selectedIds={isEditMode ? estudiantes.map(e => e.id) : selectedEstudiantes}
          onToggleSelect={toggleSelectEstudiante}
          onCancel={() => setAssigningEstudiantes(false)}
          onConfirm={handleAddEstudiantesConfirm}
          confirmText={isEditMode ? "Añadir estudiantes" : "Seleccionar estudiantes"}
          searchPlaceholder="Buscar estudiantes por nombre o email..."
          emptyMessage="No se encontraron estudiantes disponibles"
          primaryColor="green"
        />
      )}
    </div>
  );
};

export default CursoForm;