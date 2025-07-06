const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const docenteRoutes = require('./routes/docenteRouthes'); // <-- Agrega esta línea
const estudianteRoutes = require('./routes/estudianteRoutes');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/docente', docenteRoutes); // <-- Agrega esta línea
app.use('/api/estudiante', estudianteRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API del Sistema de Gestión de Tareas Académicas funcionando');
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
