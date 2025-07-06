const API_URL = 'http://localhost:3000/api';

/**
 * Realiza peticiones a la API con manejo de tokens
 */
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export const api = {
  // Autenticación
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
  getMe: () => apiRequest('/auth/me'),
  
  // Usuarios
  getUsers: () => apiRequest('/users'),
  getUserById: (id) => apiRequest(`/users/${id}`),
  createUser: (userData) => apiRequest('/users', 'POST', userData),
  updateUser: (id, userData) => apiRequest(`/users/${id}`, 'PUT', userData),
  deleteUser: (id) => apiRequest(`/users/${id}`, 'DELETE'),

  // Tareas Docente
  crearTarea: (data) => apiRequest('/docente/tareas', 'POST', data),
  editarTarea: (id, data) => apiRequest(`/docente/tareas/${id}`, 'PUT', data),
  asignarTarea: (id, data) => apiRequest(`/docente/tareas/${id}/asignar`, 'POST', data),
  listarTareasDocente: () => apiRequest('/docente/tareas'),
  deshabilitarTarea: (id) => apiRequest(`/docente/tareas/${id}`, 'PUT', { habilitada: false }),

  // Tareas Estudiante
  listarTareasEstudiante: () => apiRequest('/estudiante/tareas'),

  // Buscar estudiantes por nombre o apellido
  buscarEstudiantes: (query) => apiRequest(`/users?search=${encodeURIComponent(query)}&role=ESTUDIANTE`),

  // Listar estudiantes para docentes
  listarEstudiantesDocente: (search = '') => apiRequest(`/docente/estudiantes?search=${encodeURIComponent(search)}`),
};

export default api;
