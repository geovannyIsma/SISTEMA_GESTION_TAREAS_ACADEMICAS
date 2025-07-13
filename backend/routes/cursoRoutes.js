const express = require('express');
const { 
  getCursos,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
  addEstudiantes,
  removeEstudiantes,
  addDocentes,
  removeDocentes
} = require('../controllers/cursoController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas protegidas para administradores
router.use(protect);
router.use(authorize('ADMINISTRADOR'));

// Rutas CRUD básicas
router.route('/')
  .get(getCursos)
  .post(createCurso);

router.route('/:id')
  .get(getCursoById)
  .put(updateCurso)
  .delete(deleteCurso);

// Rutas para gestión de estudiantes y docentes
router.route('/:id/estudiantes')
  .post(addEstudiantes)
  .delete(removeEstudiantes);

router.route('/:id/docentes')
  .post(addDocentes)
  .delete(removeDocentes);

module.exports = router;
