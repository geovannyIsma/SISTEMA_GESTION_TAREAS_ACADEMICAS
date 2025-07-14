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
    console.log(`Realizando petición ${method} a ${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`Error en petición a ${endpoint}:`, result);
      throw new Error(result.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return result;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Define métodos HTTP como funciones helper
const api = {
  // Métodos HTTP genéricos
  get: (endpoint, options = {}) => {
    const params = options.params || {};
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return apiRequest(url);
  },
  post: (endpoint, data) => apiRequest(endpoint, 'POST', data),
  put: (endpoint, data) => apiRequest(endpoint, 'PUT', data),
  delete: (endpoint, data) => {
    // Fix the DELETE request by passing the data directly to apiRequest without the "data" wrapper
    return apiRequest(endpoint, 'DELETE', data);
  },
  
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
  getTareaById: (id) => apiRequest(`/docente/tareas/${id}`),
  asignarTarea: (id, data) => apiRequest(`/docente/tareas/${id}/asignar`, 'POST', data),
  listarTareasDocente: () => {
    console.log("Llamando al endpoint /docente/tareas");
    return apiRequest('/docente/tareas');
  },
  deshabilitarTarea: (id) => apiRequest(`/docente/tareas/${id}`, 'PUT', { habilitada: false }),
  getTareaSubmissionStatus: (id) => apiRequest(`/docente/tareas/${id}/submission-status`),
  
  // Nuevo método para listar entregas pendientes de revisión
  listarEntregasPendientes: () => {
    console.log("Llamando al endpoint /docente/entregas/pendientes");
    return apiRequest('/docente/entregas/pendientes');
  },
  
  // Nuevo método para obtener estadísticas del docente
  getDocenteEstadisticas: () => {
    console.log("Llamando al endpoint /docente/estadisticas");
    return apiRequest('/docente/estadisticas');
  },
  
  // Nuevo método para listar cursos del docente
  listarCursosDocente: () => {
    console.log("Llamando al endpoint /docente/cursos");
    return apiRequest('/docente/cursos');
  },
  
  // Método mejorado para listar estudiantes (ahora puede filtrar por curso)
  listarEstudiantesDocente: (search = '', cursoId = null) => {
    let url = `/docente/estudiantes?search=${encodeURIComponent(search)}`;
    if (cursoId) url += `&cursoId=${cursoId}`;
    return apiRequest(url);
  },

  // Tareas Estudiante
  listarTareasEstudiante: () => apiRequest('/estudiante/tareas'),

  // Buscar estudiantes por nombre o apellido
  buscarEstudiantes: (query) => apiRequest(`/users?search=${encodeURIComponent(query)}&role=ESTUDIANTE`),

  // File uploads
  uploadFile: (formData) => {
    const token = localStorage.getItem('token');
    
    return fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json();
    });
  }
};

export default api;
