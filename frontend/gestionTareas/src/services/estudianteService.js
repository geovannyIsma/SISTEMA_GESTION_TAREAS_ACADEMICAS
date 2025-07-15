import api from './api';

// Obtener todos los cursos del estudiante
const getCursosEstudiante = async () => {
  return api.get('/estudiante/cursos');
};

// Obtener un curso específico del estudiante
const getCursoById = async (id) => {
  return api.get(`/estudiante/cursos/${id}`);
};

// Obtener todas las tareas del estudiante
const getTareasEstudiante = async () => {
  return api.get('/estudiante/tareas');
};

// Obtener las tareas de un curso específico
const getTareasCurso = async (cursoId) => {
  return api.get(`/estudiante/cursos/${cursoId}/tareas`);
};

// Obtener detalles de una tarea específica
const getTareaById = async (id) => {
  return api.get(`/estudiante/tareas/${id}`);
};

// Enviar una entrega para una tarea
const enviarEntrega = async (tareaId, formData) => {
  return api.post(`/estudiante/tareas/${tareaId}/entrega`, formData);
};

// Obtener estadísticas del estudiante
const getEstadisticasEstudiante = async () => {
  return api.get('/estudiante/estadisticas');
};

const estudianteService = {
  getCursosEstudiante,
  getCursoById,
  getTareasEstudiante,
  getTareasCurso,
  getTareaById,
  enviarEntrega,
  getEstadisticasEstudiante
};

export default estudianteService;
