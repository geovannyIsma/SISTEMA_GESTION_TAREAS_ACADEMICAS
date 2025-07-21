import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cursoService from '../../services/cursoService';
import { sanitizeInput } from '../../utils/validation';
import Dialog from '../../components/dialog';
import { useAlert } from '../../context/AlertContext'; // Import useAlert directly
import useAlertDialog from '../../hooks/useAlertDialog';

const AsignaturaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { alertConfig, closeAlert, dialogConfig, showDialog, closeDialog } = useAlertDialog();
  const { showAlert } = useAlert(); // Use global alert directly when needed

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cursos, setCursos] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // If in edit mode, load asignatura data
        if (isEditMode) {
          const response = await cursoService.getAsignaturaById(id);
          const asignaturaData = response.data;
          
          setFormData({
            nombre: asignaturaData.nombre,
            codigo: asignaturaData.codigo,
            descripcion: asignaturaData.descripcion || '',
          });
          
          // Load related courses
          setCursos(asignaturaData.cursos || []);
        }
      } catch (err) {
        showAlert('error', err.message || 'Error al cargar datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Only sanitize name and codigo fields, leave description as-is to preserve spaces
    const sanitizedValue = name === 'descripcion' 
      ? value  // Don't sanitize description to preserve spaces
      : sanitizeInput(value);
    setFormData({ ...formData, [name]: sanitizedValue });
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.nombre || !formData.codigo) {
      showAlert('error', 'El nombre y código son obligatorios');
      return;
    }

    // Show confirmation dialog
    showDialog(
      'question',
      isEditMode ? 'Actualizar Asignatura' : 'Crear Asignatura',
      isEditMode 
        ? `¿Está seguro de que desea actualizar la información de la asignatura "${formData.nombre}"?`
        : `¿Está seguro de que desea crear la asignatura "${formData.nombre}"?`,
      'submit'
    );
  };

  // Process form submission after confirmation
  const handleDialogConfirm = async () => {
    if (dialogConfig.action === 'submit') {
      processFormSubmission();
    } else if (dialogConfig.action === 'cancel') {
      navigate('/asignaturas');
    }
    closeDialog();
  };

  const processFormSubmission = async () => {
    setSubmitting(true);
    
    try {
      if (isEditMode) {
        await cursoService.updateAsignatura(id, formData);
        showAlert('success', 'Asignatura actualizada correctamente');
        navigate('/asignaturas');
      } else {
        await cursoService.createAsignatura(formData);
        showAlert('success', 'Asignatura creada correctamente');
        navigate('/asignaturas');
      }
    } catch (err) {
      if (err.message && err.message.includes('código')) {
        showAlert('error', 'Ya existe una asignatura con ese código');
      } else {
        showAlert('error', err.message || 'Ocurrió un error al guardar la asignatura');
      }
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Editar asignatura' : 'Crear asignatura'}
        </h1>
      </div>

      {/* Alert component */}
      <Dialog 
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        type={dialogConfig.type}
        onConfirm={handleDialogConfirm}
        confirmText={
          dialogConfig.action === 'cancel' ? 'Sí, cancelar' : 'Confirmar'
        }
        cancelText="Volver"
        preventOutsideClick={true}
      >
        <p>{dialogConfig.message}</p>
      </Dialog>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
                  Código de la asignatura
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
                <p className="mt-1 text-xs text-gray-500">Código único para identificar la asignatura</p>
              </div>

              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre de la asignatura
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
            </div>

            {isEditMode && cursos.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cursos relacionados</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <ul className="divide-y divide-gray-200">
                    {cursos.map(curso => (
                      <li key={curso.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-medium">{curso.nombre}</span>
                          <span className="ml-2 text-sm text-gray-500">({curso.codigo})</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${curso.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {curso.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

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
                {submitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AsignaturaForm;