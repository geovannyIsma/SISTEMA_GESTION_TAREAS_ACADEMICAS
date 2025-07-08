import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Alert from '../../components/alert';
import Dialog from '../../components/dialog';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  // Estado para alertas
  const [alertConfig, setAlertConfig] = useState({
    type: 'error',
    message: '',
    isVisible: false
  });

  // Estado para diálogo de confirmación
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    userId: null,
    title: '',
    message: '',
  });

  // Función para mostrar alertas
  const showAlert = (type, message, duration = 5000) => {
    setAlertConfig({ type, message, isVisible: true, duration });
  };

  // Función para cerrar alertas
  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.getUsers();
        setUsers(response.data);
      } catch (err) {
        showAlert('error', 'Error al cargar usuarios');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Abrir diálogo de confirmación de eliminación
  const confirmDelete = (userId, userName) => {
    setDialogConfig({
      isOpen: true,
      userId,
      title: 'Eliminar Usuario',
      message: `¿Está seguro de que desea eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`,
    });
  };

  // Función para cerrar el diálogo sin acción
  const closeDialog = () => {
    setDialogConfig({ ...dialogConfig, isOpen: false });
  };

  // Función para ejecutar la eliminación del usuario
  const handleConfirmDelete = async () => {
    try {
      await api.deleteUser(dialogConfig.userId);
      setUsers(users.filter(user => user.id !== dialogConfig.userId));
      showAlert('success', 'Usuario eliminado correctamente');
      closeDialog();
    } catch (err) {
      showAlert('error', 'Error al eliminar usuario');
      console.error(err);
      closeDialog();
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole ? user.role === filterRole : true;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'ADMINISTRADOR': return 'bg-purple-100 text-purple-800';
      case 'DOCENTE': return 'bg-green-100 text-green-800';
      case 'ESTUDIANTE': return 'bg-blue-100 text-blue-800';
      case 'OBSERVADOR': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getRoleDisplay = (role) => {
    switch(role) {
      case 'ADMINISTRADOR': return 'Administrador';
      case 'DOCENTE': return 'Docente';
      case 'ESTUDIANTE': return 'Estudiante';
      case 'OBSERVADOR': return 'Observador';
      default: return role;
    }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Gestión de Usuarios</h1>
        <Link 
          to="/users/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Agregar Nuevo Usuario
        </Link>
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
        onConfirm={handleConfirmDelete}
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
                  placeholder="Buscar por nombre o correo"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-1/5">
              <label htmlFor="role" className="sr-only">Filtrar por rol</label>
              <select
                id="role"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Todos los roles</option>
                <option value="ADMINISTRADOR">Administradores</option>
                <option value="DOCENTE">Docentes</option>
                <option value="ESTUDIANTE">Estudiantes</option>
                <option value="OBSERVADOR">Observadores</option>
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
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {getRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/users/${user.id}`} 
                        className="text-indigo-700 hover:text-indigo-900 mr-4 hover:underline"
                      >
                        Editar
                      </Link>
                      <button 
                        onClick={() => confirmDelete(user.id, user.name)} 
                        className="text-red-700 hover:text-red-900 hover:underline focus:outline-none"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-600">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-700">No se encontraron usuarios</p>
                        <p className="text-sm text-gray-500 mt-1">Pruebe con otros criterios de búsqueda o añada un nuevo usuario</p>
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

export default UsersList;
