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

// Editar tarea
router.put('/tareas/:id', docenteController.editarTarea);

// Asignar tarea a curso o estudiante
router.post('/tareas/:id/asignar', docenteController.asignarTarea);

// Listar tareas creadas por el docente
router.get('/tareas', docenteController.listarTareasDocente);

// Listar estudiantes (solo para docentes)
router.get('/estudiantes', docenteController.listarEstudiantes);

module.exports = router;
