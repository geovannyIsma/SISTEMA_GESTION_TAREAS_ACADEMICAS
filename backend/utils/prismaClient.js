const { PrismaClient } = require('@prisma/client');

// Crear una única instancia de PrismaClient para toda la aplicación
const prisma = new PrismaClient({
  // Configuraciones opcionales:
  // log: ['query', 'info', 'warn', 'error'],
});

// Mejora del manejo de errores de conexión
process.on('exit', async () => {
  console.log('PrismaClient desconectándose...');
  await prisma.$disconnect();
});

// Exportar la instancia
module.exports = prisma;    