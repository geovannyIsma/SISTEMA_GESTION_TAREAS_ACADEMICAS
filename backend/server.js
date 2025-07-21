const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const cursoRoutes = require('./routes/cursoRoutes');
const asignaturaRoutes = require('./routes/asignaturaRoutes');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/docente', docenteRoutes);
app.use('/api/estudiante', estudianteRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/asignaturas', asignaturaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API del Sistema de Gestión de Tareas Académicas funcionando');
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Archivos estáticos servidos desde: ${path.join(__dirname, 'uploads')}`);
});
