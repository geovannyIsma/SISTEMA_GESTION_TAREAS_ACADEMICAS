import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import Dialog from '../../components/dialog';

const AsignarTarea = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tarea, setTarea] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [tipoAsignacion, setTipoAsignacion] = useState('curso');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para diálogo
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'question',
    action: null
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar la tarea
        const tareaResponse = await api.getTareaById(id);
        setTarea(tareaResponse.data);
        
        // Cargar los cursos asignados al docente
        const cursosResponse = await api.listarCursosDocente();
        setCursos(cursosResponse.data);
      } catch (err) {
        showAlert('error', err.message || 'Error al cargar datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, showAlert]);

  // Cargar estudiantes cuando se selecciona un curso
  useEffect(() => {
    if (tipoAsignacion === 'estudiante' && selectedCursoId) {
      const fetchEstudiantes = async () => {
        try {
          setLoading(true);
          console.log(`Fetching students for course ID: ${selectedCursoId}`);
          const response = await api.listarEstudiantesDocente(searchTerm, selectedCursoId);
          setEstudiantes(response.data || []);
        } catch (err) {
          console.error("Error fetching students:", err);
          showAlert('error', err.message || 'Error al cargar estudiantes. Por favor, intente nuevamente.');
          setEstudiantes([]);
        } finally {
          setLoading(false);
        }
      };
      fetchEstudiantes();
    }
  }, [selectedCursoId, searchTerm, tipoAsignacion, showAlert]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (tipoAsignacion === 'curso' && !selectedCursoId) {
      showAlert('error', 'Debe seleccionar un curso');
      return;
    }
    
    if (tipoAsignacion === 'estudiante' && !selectedEstudianteId) {
      showAlert('error', 'Debe seleccionar un estudiante');
      return;
    }
    
    showDialog(
      'question',
      'Confirmar asignación',
      `¿Está seguro de que desea asignar la tarea "${tarea.titulo}" a ${tipoAsignacion === 'curso' ? 'este curso' : 'este estudiante'}?`,
      'submit'
    );
  };

  const handleDialogConfirm = async () => {
    if (dialogConfig.action === 'submit') {
      setSubmitting(true);
      try {
        await api.asignarTarea(id, {
          cursoId: tipoAsignacion === 'curso' ? selectedCursoId : null,
          estudianteId: tipoAsignacion === 'estudiante' ? selectedEstudianteId : null
        });
        
        showAlert('success', 'Tarea asignada correctamente');
        navigate('/docente/tareas');
      } catch (err) {
        showAlert('error', err.message || 'Error al asignar tarea');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
    closeDialog();
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
        <h1 className="text-3xl font-bold text-gray-900">Asignar Tarea</h1>
        <p className="mt-2 text-gray-600">
          Asigne la tarea "{tarea?.titulo}" a un curso completo o a estudiantes específicos
        </p>
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

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Tipo de asignación */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de asignación
              </label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-indigo-600"
                    value="curso"
                    checked={tipoAsignacion === 'curso'}
                    onChange={() => setTipoAsignacion('curso')}
                  />
                  <span className="ml-2">Asignar a curso completo</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-indigo-600"
                    value="estudiante"
                    checked={tipoAsignacion === 'estudiante'}
                    onChange={() => setTipoAsignacion('estudiante')}
                  />
                  <span className="ml-2">Asignar a estudiante específico</span>
                </label>
              </div>
            </div>

            {/* Selección de curso */}
            <div>
              <label htmlFor="curso" className="block text-sm font-medium text-gray-700">
                Curso
              </label>
              <select
                id="curso"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedCursoId}
                onChange={(e) => setSelectedCursoId(e.target.value)}
                required={tipoAsignacion === 'curso'}
              >
                <option value="">Seleccione un curso</option>
                {cursos.map(curso => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre} ({curso.codigo}) - {curso.asignatura.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de estudiante (solo visible si se seleccionó "estudiante") */}
            {tipoAsignacion === 'estudiante' && (
              <div>
                <label htmlFor="estudiante" className="block text-sm font-medium text-gray-700">
                  Estudiante
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Buscar por nombre o email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {selectedCursoId ? (
                  <div className="mt-2 max-h-60 overflow-y-auto border rounded-md">
                    {estudiantes.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {estudiantes.map(estudiante => (
                          <div
                            key={estudiante.id}
                            className={`p-3 flex items-center hover:bg-gray-50 cursor-pointer ${selectedEstudianteId === estudiante.id ? 'bg-indigo-50' : ''}`}
                            onClick={() => setSelectedEstudianteId(estudiante.id)}
                          >
                            <input
                              type="radio"
                              className="h-4 w-4 text-indigo-600 border-gray-300"
                              checked={selectedEstudianteId === estudiante.id}
                              onChange={() => setSelectedEstudianteId(estudiante.id)}
                              id={`estudiante-${estudiante.id}`}
                            />
                            <label htmlFor={`estudiante-${estudiante.id}`} className="ml-3 block text-sm">
                              <span className="font-medium text-gray-700">{estudiante.name}</span>
                              <span className="text-gray-500 text-xs ml-2">{estudiante.email}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron estudiantes en este curso
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 p-4 text-center text-gray-500 border rounded-md">
                    Seleccione un curso para ver sus estudiantes
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/docente/tareas')}
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
              {submitting ? 'Asignando...' : 'Asignar Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsignarTarea;
