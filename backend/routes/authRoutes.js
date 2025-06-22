const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas
router.post('/login', loginUser);

// Solo administradores pueden registrar usuarios
router.post('/register', protect, authorize('ADMINISTRADOR'), registerUser);

// Ruta protegida para obtener datos del usuario actual
router.get('/me', protect, getMe);

module.exports = router;
                