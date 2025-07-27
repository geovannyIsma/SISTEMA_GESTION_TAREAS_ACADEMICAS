const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { docenteOnly } = require('../middleware/docenteMiddleware');
const docenteController = require('../controllers/docenteController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Proteger todas las rutas y permitir solo a docentes
router.use(protect);
router.use(docenteOnly);

// Crear directorio para materiales de docentes si no existe
const materialDir = path.join(__dirname, '../uploads/material');
if (!fs.existsSync(materialDir)) {
  fs.mkdirSync(materialDir, { recursive: true });
  console.log(`Directorio de materiales docentes creado: ${materialDir}`);
}

// Configuración para subida de archivos de materiales docentes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, materialDir);
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
  limits: { fileSize: 50 * 1024 * 1024 }, // Limite de 50MB para material docente
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

// Crear tarea
router.post('/tareas', docenteController.crearTarea);

// Ruta para subir material
router.post('/material/upload', handleMulterError, docenteController.subirMaterial);

// Ruta para subir material
router.put('/material/upload', handleMulterError, docenteController.subirMaterial);

// Ruta para eliminar material
router.delete('/material/:id', docenteController.eliminarMaterial);

// Obtener tarea específica por ID
router.get('/tareas/:id', docenteController.getTareaById);

// Editar tarea
router.put('/tareas/:id', docenteController.editarTarea);

// Eliminar tarea
router.delete('/tareas/:id', docenteController.eliminarTarea);

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
