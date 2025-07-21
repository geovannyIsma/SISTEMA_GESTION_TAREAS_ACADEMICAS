const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { 
  listarTareasEstudiante,
  listarCursosEstudiante,
  getCursoEstudianteById,
  getTareasCursoEstudiante,
  getTareaEstudianteById,
  enviarEntregaTarea,
  getEstadisticasEstudiante,
  getEntregaEstudiante,
  getEntregasEstudiante,
  eliminarEntrega,
  eliminarArchivoEntrega
} = require('../controllers/estudianteController');
const { protect } = require('../middleware/authMiddleware');
const { estudianteOnly } = require('../middleware/estudianteMiddleware');

// Crear directorio de uploads si no existe
const uploadDir = path.join(__dirname, '../uploads/entregas');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Directorio de uploads creado: ${uploadDir}`);
}

// Configuración para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Usar la ruta absoluta
  },
  filename: function (req, file, cb) {
    // Crear un nombre único para el archivo y sanitizar el nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo si es necesario
    cb(null, true);
  }
}).single('archivo');

// Middleware personalizado para manejar errores de multer
const handleMulterError = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Error de Multer
      console.error('Error en carga de archivo Multer:', err);
      return res.status(400).json({ 
        status: 'error', 
        message: `Error en la carga del archivo: ${err.message}` 
      });
    } else if (err) {
      // Error desconocido
      console.error('Error desconocido en carga de archivo:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: `Error en la carga del archivo: ${err.message}` 
      });
    }
    next();
  });
};

// Aplicar middleware para todas las rutas
router.use(protect);
router.use(estudianteOnly);

// Rutas para tareas
router.get('/tareas', listarTareasEstudiante);
router.get('/tareas/:id', getTareaEstudianteById);
router.post('/tareas/:id/entrega', handleMulterError, enviarEntregaTarea);
router.put('/tareas/:id/entrega', handleMulterError, enviarEntregaTarea);
router.get('/tareas/:id/entrega', getEntregaEstudiante);
router.delete('/tareas/:id/entrega', eliminarEntrega);
router.delete('/tareas/:tareaId/entrega/archivos/:archivoId', eliminarArchivoEntrega);

// Rutas para entregas
router.get('/entregas', getEntregasEstudiante);

// Rutas para cursos
router.get('/cursos', listarCursosEstudiante);
router.get('/cursos/:id', getCursoEstudianteById);
router.get('/cursos/:id/tareas', getTareasCursoEstudiante);

// Estadísticas para el dashboard
router.get('/estadisticas', getEstadisticasEstudiante);

module.exports = router;
