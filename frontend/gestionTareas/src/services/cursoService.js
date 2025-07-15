import api from './api';

// Obtener todos los cursos
const getCursos = async () => {
  return api.get('/cursos');
};

// Obtener un curso específico por ID
const getCursoById = async (id) => {
  return api.get(`/cursos/${id}`);
};

// Crear un nuevo curso
const createCurso = async (cursoData) => {
  return api.post('/cursos', cursoData);
};

// Actualizar un curso existente
const updateCurso = async (id, cursoData) => {
  return api.put(`/cursos/${id}`, cursoData);
};

// Eliminar un curso
const deleteCurso = async (id) => {
  const response = await api.delete(`/cursos/${id}`);
  return response; // Devolver la respuesta completa en lugar de solo los datos
};

// Agregar estudiantes a un curso
const addEstudiantes = async (cursoId, estudiantesIds) => {
  return api.post(`/cursos/${cursoId}/estudiantes`, { estudiantesIds });
};

// Remover estudiantes de un curso
const removeEstudiantes = async (cursoId, estudiantesIds) => {
  return api.delete(`/cursos/${cursoId}/estudiantes`, { estudiantesIds });
};

// Agregar docentes a un curso
const addDocentes = async (cursoId, docentesIds) => {
  return api.post(`/cursos/${cursoId}/docentes`, { docentesIds });
};

// Remover docentes de un curso
const removeDocentes = async (cursoId, docentesIds) => {
  // Send the payload without additional nesting to avoid double "data" wrapping
  return api.delete(`/cursos/${cursoId}/docentes`, { docentesIds });
};

// Obtener todos los estudiantes (para seleccionar al matricular)
const getEstudiantes = async (search = '') => {
  const params = { role: 'ESTUDIANTE' };
  if (search) params.search = search;
  return api.get('/users', { params });
};

// Obtener todos los docentes (para asignar al curso)
const getDocentes = async (search = '') => {
  const params = { role: 'DOCENTE' };
  if (search) params.search = search;
  return api.get('/users', { params });
};

// Obtener todas las asignaturas
const getAsignaturas = async () => {
  return api.get('/asignaturas');
};

// Obtener una asignatura específica por ID
const getAsignaturaById = async (id) => {
  return api.get(`/asignaturas/${id}`);
};

// Crear una nueva asignatura
const createAsignatura = async (asignaturaData) => {
  return api.post('/asignaturas', asignaturaData);
};

// Actualizar una asignatura existente
const updateAsignatura = async (id, asignaturaData) => {
  return api.put(`/asignaturas/${id}`, asignaturaData);
};

// Eliminar una asignatura
const deleteAsignatura = async (id) => {
  return api.delete(`/asignaturas/${id}`);
};

const cursoService = {
  getCursos,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
  addEstudiantes,
  removeEstudiantes,
  addDocentes,
  removeDocentes,
  getEstudiantes,
  getDocentes,
  getAsignaturas,
  getAsignaturaById,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura
};

export default cursoService;
