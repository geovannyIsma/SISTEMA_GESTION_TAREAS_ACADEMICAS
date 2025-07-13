const express = require('express');
const { 
  getAsignaturas,
  getAsignaturaById,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura
} = require('../controllers/asignaturaController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas protegidas para administradores
router.use(protect);

// Cualquier rol puede ver las asignaturas
router.get('/', getAsignaturas);
router.get('/:id', getAsignaturaById);

// Solo administradores pueden modificar asignaturas
router.post('/', authorize('ADMINISTRADOR'), createAsignatura);
router.put('/:id', authorize('ADMINISTRADOR'), updateAsignatura);
router.delete('/:id', authorize('ADMINISTRADOR'), deleteAsignatura);

module.exports = router;
