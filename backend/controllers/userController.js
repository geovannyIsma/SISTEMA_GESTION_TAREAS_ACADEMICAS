const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Validar email institucional
const isValidInstitutionalEmail = (email) => {
  return email.endsWith('@uni.edu.ec');
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener usuarios' });
  }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener usuario' });
  }
};

// Crear un nuevo usuario
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validar campos requeridos
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Todos los campos son requeridos' });
    }

    // Validar email institucional
    if (!isValidInstitutionalEmail(email)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'El correo debe ser institucional (@uni.edu.ec)' 
      });
    }

    // Verificar si el usuario ya existe
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'El usuario ya existe' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'ESTUDIANTE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al crear usuario' });
  }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // Verificar si el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!userExists) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    // Validar email institucional si se proporciona
    if (email && !isValidInstitutionalEmail(email)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'El correo debe ser institucional (@uni.edu.ec)' 
      });
    }

    // Preparar datos para actualización
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    // Actualizar contraseña si se proporciona
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al actualizar usuario' });
  }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!userExists) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({
      status: 'success',
      message: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al eliminar usuario' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
