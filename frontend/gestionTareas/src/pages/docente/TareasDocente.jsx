import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Dialog from '../../components/dialog';
import { useAlert } from '../../context/AlertContext'; // Import useAlert

// Función para formatear fechas en formato legible
const formatDate = (dateString) => {
  if (!dateString) return 'Sin fecha';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TareasDocente = () => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  
  // Use the global alert context
  const { showAlert } = useAlert();

  // Estado para diálogo de confirmación
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    tareaId: null,
    title: '',
    message: '',
  });

  // Función para cerrar diálogo
  const closeDialog = () => {
    setDialogConfig({ ...dialogConfig, isOpen: false });
  };

  useEffect(() => {
    const fetchTareas = async () => {
      try {
        const response = await api.listarTareasDocente();
        setTareas(response.data);
      } catch (err) {
        showAlert('error', err.message || 'Error al cargar las tareas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTareas();
  }, [showAlert]);

  // Abrir diálogo de confirmación de eliminación
  const confirmDelete = (tareaId, tareaTitulo) => {
    setDialogConfig({
      isOpen: true,
      tareaId,
      title: 'Deshabilitar Tarea',
      message: `¿Está seguro de que desea deshabilitar la tarea "${tareaTitulo}"? Los estudiantes no podrán verla.`,
    });
  };

  // Función para ejecutar la deshabilitación de la tarea
  const handleConfirmDelete = async () => {
    try {
      await api.deshabilitarTarea(dialogConfig.tareaId);
      setTareas(tareas.map(tarea => 
        tarea.id === dialogConfig.tareaId 
          ? {...tarea, habilitada: false}
          : tarea
      ));
      showAlert('success', 'Tarea deshabilitada correctamente');
      closeDialog();
    } catch (err) {
      showAlert('error', err.message || 'Error al deshabilitar tarea');
      console.error(err);
      closeDialog();
    }
  };

  // Filtrar tareas según términos de búsqueda y estado
  const filteredTareas = tareas.filter(tarea => {
    const matchesSearch = tarea.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tarea.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === '' ? true : 
                         (filterEstado === 'true' ? tarea.habilitada : !tarea.habilitada);
    return matchesSearch && matchesEstado;
  });

  // Obtener clase de estado (para las etiquetas visuales)
  const getEstadoClass = (fechaEntrega, habilitada) => {
    if (!habilitada) return "bg-gray-100 text-gray-800"; // Deshabilitada
    
    const hoy = new Date();
    const fecha = new Date(fechaEntrega);
    
    if (fecha < hoy) return "bg-red-100 text-red-800"; // Vencida
    
    // Calcular días restantes
    const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes <= 3) return "bg-orange-100 text-orange-800"; // Próxima a vencer
    return "bg-green-100 text-green-800"; // Con tiempo
  };

  // Obtener texto de estado
  const getEstadoText = (fechaEntrega, habilitada) => {
    if (!habilitada) return "Deshabilitada";
    
    const hoy = new Date();
    const fecha = new Date(fechaEntrega);
    
    if (fecha < hoy) return "Vencida";
    
    // Calcular días restantes
    const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes <= 3) return `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`;
    return "Con tiempo";
  };

  // Check if a task is editable based on submission status
  const isTaskEditable = (tarea) => {
    // If editableHastaUltimaEntrega is false, it's always editable
    if (tarea.editableHastaUltimaEntrega === false) return true;
    
    // If allSubmitted is true, it's not editable
    return !tarea.allSubmitted;
  };

  // Handle edit task click
  const handleEditClick = (e, tarea) => {
    if (!isTaskEditable(tarea)) {
      e.preventDefault();
      showAlert('warning', 'Esta tarea no puede ser editada porque todos los estudiantes han realizado sus entregas.');
    }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Mis Tareas</h1>
        <Link 
          to="/docente/tareas/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Crear Nueva Tarea
        </Link>
      </div>

      {/* Componente de diálogo */}
      <Dialog
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        onConfirm={handleConfirmDelete}
        confirmText="Deshabilitar"
        cancelText="Cancelar"
        type="warning"
      >
        <p>{dialogConfig.message}</p>
      </Dialog>

      <div className="bg-white shadow-sm overflow-hidden rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="w-full md:w-1/3">
              <label htmlFor="search" className="sr-only">Buscar</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Buscar por título o descripción"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-1/5">
              <label htmlFor="estado" className="sr-only">Filtrar por estado</label>
              <select
                id="estado"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="">Todas las tareas</option>
                <option value="true">Habilitadas</option>
                <option value="false">Deshabilitadas</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Entrega
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Editable
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTareas.map((tarea) => (
                  <tr key={tarea.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tarea.titulo}</div>
                      {tarea.descripcion && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {tarea.descripcion.length > 100 ? 
                            `${tarea.descripcion.substring(0, 100)}...` : 
                            tarea.descripcion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(tarea.fechaEntrega)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(tarea.fechaEntrega, tarea.habilitada)}`}>
                        {getEstadoText(tarea.fechaEntrega, tarea.habilitada)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tarea.archivoUrl ? (
                        <a 
                          href={tarea.archivoUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Ver material
                        </a>
                      ) : (
                        <span className="text-gray-500">Sin material</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tarea.editableHastaUltimaEntrega === false ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Siempre
                        </span>
                      ) : tarea.allSubmitted ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Bloqueada
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Editable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/docente/tareas/${tarea.id}`} 
                        className={`text-indigo-700 hover:text-indigo-900 mr-4 hover:underline ${!isTaskEditable(tarea) ? 'cursor-not-allowed opacity-60' : ''}`}
                        onClick={(e) => handleEditClick(e, tarea)}
                      >
                        {isTaskEditable(tarea) ? 'Editar' : 'Ver'}
                      </Link>
                      <Link 
                        to={`/docente/tareas/${tarea.id}/asignar`} 
                        className="text-blue-700 hover:text-blue-900 mr-4 hover:underline"
                      >
                        Asignar
                      </Link>
                      {tarea.habilitada && (
                        <button 
                          onClick={() => confirmDelete(tarea.id, tarea.titulo)} 
                          className="text-red-700 hover:text-red-900 hover:underline focus:outline-none"
                        >
                          Deshabilitar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {filteredTareas.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-600">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <p className="text-lg font-medium text-gray-700">No se encontraron tareas</p>
                        <p className="text-sm text-gray-500 mt-1">Pruebe con otros criterios de búsqueda o añada una nueva tarea</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TareasDocente;