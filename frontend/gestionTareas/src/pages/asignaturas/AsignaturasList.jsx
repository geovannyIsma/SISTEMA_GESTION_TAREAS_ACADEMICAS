import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cursoService from '../../services/cursoService';
import Dialog from '../../components/dialog';
import useAlertDialog from '../../hooks/useAlertDialog';

const AsignaturasList = () => {
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { showAlert, dialogConfig, showDialog, closeDialog } = useAlertDialog();

  useEffect(() => {
    const fetchAsignaturas = async () => {
      try {
        const response = await cursoService.getAsignaturas();
        setAsignaturas(response.data);
      } catch (err) {
        showAlert('error', err.message || 'Error al cargar asignaturas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAsignaturas();
  }, []);

  // Confirmar eliminación de asignatura
  const confirmDelete = (asignaturaId, asignaturaNombre) => {
    showDialog(
      'warning',
      'Eliminar Asignatura',
      `¿Está seguro de que desea eliminar la asignatura "${asignaturaNombre}"? Esta acción no se puede deshacer.`,
      'delete',
      asignaturaId
    );
  };

  // Eliminar asignatura después de confirmar
  const handleDialogConfirm = async () => {
    if (dialogConfig.action === 'delete' && dialogConfig.actionData) {
      try {
        await cursoService.deleteAsignatura(dialogConfig.actionData);
        setAsignaturas(asignaturas.filter(a => a.id !== dialogConfig.actionData));
        showAlert('success', 'Asignatura eliminada correctamente');
      } catch (err) {
        if (err.message.includes('cursos asociados')) {
          showAlert('error', 'No se puede eliminar la asignatura porque tiene cursos asociados');
        } else {
          showAlert('error', 'Error al eliminar asignatura');
        }
        console.error(err);
      }
    }
    closeDialog();
  };

  // Filtrar asignaturas según términos de búsqueda
  const filteredAsignaturas = asignaturas.filter(asignatura => {
    return asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
           asignatura.codigo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Gestión de Asignaturas</h1>
        <Link 
          to="/asignaturas/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Crear Nueva Asignatura
        </Link>
      </div>

      {/* Componente de diálogo */}
      <Dialog
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        onConfirm={handleDialogConfirm}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="error"
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
                  placeholder="Buscar por nombre o código"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cursos
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAsignaturas.map((asignatura) => (
                  <tr key={asignatura.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {asignatura.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{asignatura.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {asignatura.descripcion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {asignatura._count?.cursos || 0} cursos
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/asignaturas/${asignatura.id}`} 
                        className="text-primary hover:text-primary-dark mr-4 hover:underline"
                      >
                        Editar
                      </Link>
                      <button 
                        onClick={(e) => {
                          if (asignatura._count?.cursos > 0) {
                            e.preventDefault();
                            showAlert('warning', `No se puede eliminar la asignatura "${asignatura.nombre}" porque tiene ${asignatura._count.cursos} curso(s) asociado(s). Debe eliminar los cursos primero.`);
                          } else {
                            confirmDelete(asignatura.id, asignatura.nombre);
                          }
                        }}
                        className={`text-red hover:text-red-dark hover:underline focus:outline-none ${
                          asignatura._count?.cursos > 0 ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredAsignaturas.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-600">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-lg font-medium text-gray-700">No se encontraron asignaturas</p>
                        <p className="text-sm text-gray-500 mt-1">Pruebe con otros criterios de búsqueda o añada una nueva asignatura</p>
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

export default AsignaturasList;
