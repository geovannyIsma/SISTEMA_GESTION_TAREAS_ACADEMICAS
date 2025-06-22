const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Importar rutas
const tareasRoutes = require('./src/routes/tareas.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');
const categoriasRoutes = require('./src/routes/categorias.routes');

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/api/tareas', tareasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'API Sistema de Gestión de Tareas Académicas' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: true, 
    message: 'Error interno del servidor' 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Exportar la app para pruebas
module.exports = app;
