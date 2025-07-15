const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  listarTareasEstudiante,
  listarCursosEstudiante,
  getCursoEstudianteById,
  getTareasCursoEstudiante,
  getTareaEstudianteById,
  enviarEntregaTarea,
  getEstadisticasEstudiante
} = require('../controllers/estudianteController');
const { protect } = require('../middleware/authMiddleware');
const { estudianteOnly } = require('../middleware/estudianteMiddleware');

// Configuración para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/entregas/'); // Directorio donde se guardarán los archivos
  },
  filename: function (req, file, cb) {
    // Crear un nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Aplicar middleware para todas las rutas
router.use(protect);
router.use(estudianteOnly);

// Rutas para tareas
router.get('/tareas', listarTareasEstudiante);
router.get('/tareas/:id', getTareaEstudianteById);
router.post('/tareas/:id/entrega', upload.single('archivo'), enviarEntregaTarea);

// Rutas para cursos
router.get('/cursos', listarCursosEstudiante);
router.get('/cursos/:id', getCursoEstudianteById);
router.get('/cursos/:id/tareas', getTareasCursoEstudiante);

// Estadísticas para el dashboard
router.get('/estadisticas', getEstadisticasEstudiante);

module.exports = router;
