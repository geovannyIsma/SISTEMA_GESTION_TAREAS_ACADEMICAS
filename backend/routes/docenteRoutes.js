const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { docenteOnly } = require('../middleware/docenteMiddleware');
const docenteController = require('../controllers/docenteController');

// Proteger todas las rutas y permitir solo a docentes
router.use(protect);
router.use(docenteOnly);

// Crear tarea
router.post('/tareas', docenteController.crearTarea);

// Obtener tarea específica por ID
router.get('/tareas/:id', docenteController.getTareaById);

// Editar tarea
router.put('/tareas/:id', docenteController.editarTarea);

// Asignar tarea a curso o estudiante
router.post('/tareas/:id/asignar', docenteController.asignarTarea);

// Listar tareas creadas por el docente
router.get('/tareas', docenteController.listarTareasDocente);

// Obtener estado de entregas para una tarea
router.get('/tareas/:id/submission-status', docenteController.getTareaSubmissionStatus);

// Listar estudiantes (solo para docentes)
router.get('/estudiantes', docenteController.listarEstudiantes);

// Nueva ruta para listar cursos asignados al docente
router.get('/cursos', docenteController.listarCursosDocente);

// Rutas para gestionar entregas
router.get('/entregas/pendientes', docenteController.listarEntregasPendientes);

// Ruta para obtener estadísticas del docente
router.get('/estadisticas', docenteController.getEstadisticasDocente);

module.exports = router;
