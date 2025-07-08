const express = require('express');
const router = express.Router();
const { listarTareasEstudiante } = require('../controllers/estudianteController');
const { protect } = require('../middleware/authMiddleware');

// Solo autenticados
router.use(protect);

// Listar tareas asignadas al estudiante autenticado
router.get('/tareas', listarTareasEstudiante);

module.exports = router;
