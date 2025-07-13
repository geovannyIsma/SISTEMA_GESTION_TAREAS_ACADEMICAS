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
  return api.delete(`/cursos/${id}`);
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
  getDocentes
};

export default cursoService;
