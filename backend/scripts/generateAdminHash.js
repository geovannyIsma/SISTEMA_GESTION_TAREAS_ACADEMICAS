const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Verificar si ya existe un administrador
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMINISTRADOR',
      },
    });

    if (existingAdmin) {
      console.log('Ya existe un usuario administrador en la base de datos:');
      console.log(`Email: ${existingAdmin.email}`);
      return;
    }

    // Generar hash de contraseña
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Crear usuario administrador con Prisma
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@uni.edu.ec',
        password: hash,
        role: 'ADMINISTRADOR',
      },
    });
    
    console.log('Usuario administrador creado exitosamente:');
    console.log(`ID: ${admin.id}`);
    console.log(`Nombre: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`\nPuedes iniciar sesión con:`);
    console.log(`Email: admin@uni.edu.ec`);
    console.log(`Contraseña: admin123`);

  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
