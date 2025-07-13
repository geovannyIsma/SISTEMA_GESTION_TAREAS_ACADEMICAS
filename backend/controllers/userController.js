const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { 
  isValidName, 
  isValidEmail, 
  isStrongPassword, 
  isValidRole,
  sanitizeInput 
} = require('../utils/validation');

const prisma = new PrismaClient();

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    // Filtrar por rol si se proporciona en la consulta
    const { role, search } = req.query;
    
    // Construir condición de filtrado
    let whereCondition = {};
    
    // Filtrar por rol si se especifica
    if (role) {
      whereCondition.role = role;
    }
    
    // Filtrar por término de búsqueda si se proporciona
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
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
    // Sanitizar entradas
    const name = sanitizeInput(req.body.name);
    const email = sanitizeInput(req.body.email);
    const password = req.body.password; // No sanitizamos password para no afectar caracteres especiales válidos
    const role = req.body.role;

    // Validar campos requeridos
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Todos los campos son requeridos' });
    }

    // Validar nombre
    const nameValidation = isValidName(name);
    if (!nameValidation.isValid) {
      return res.status(400).json({ status: 'error', message: nameValidation.message });
    }

    // Validar email
    const emailValidation = isValidEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ status: 'error', message: emailValidation.message });
    }
    
    // Validar fortaleza de contraseña
    const passwordValidation = isStrongPassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: passwordValidation.message
      });
    }

    // Validar rol si se proporciona
    if (role) {
      const roleValidation = isValidRole(role);
      if (!roleValidation.isValid) {
        return res.status(400).json({ status: 'error', message: roleValidation.message });
      }
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
    
    // Sanitizar entradas
    const name = req.body.name ? sanitizeInput(req.body.name) : undefined;
    const email = req.body.email ? sanitizeInput(req.body.email) : undefined;
    const password = req.body.password; // No sanitizamos password
    const role = req.body.role;

    // Verificar si el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!userExists) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    // Validaciones para los campos proporcionados
    if (name) {
      const nameValidation = isValidName(name);
      if (!nameValidation.isValid) {
        return res.status(400).json({ status: 'error', message: nameValidation.message });
      }
    }

    if (email) {
      const emailValidation = isValidEmail(email);
      if (!emailValidation.isValid) {
        return res.status(400).json({ status: 'error', message: emailValidation.message });
      }
    }

    if (role) {
      const roleValidation = isValidRole(role);
      if (!roleValidation.isValid) {
        return res.status(400).json({ status: 'error', message: roleValidation.message });
      }
    }

    // Preparar datos para actualización
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    // Actualizar contraseña si se proporciona
    if (password) {
      // Validar fortaleza de contraseña
      const passwordValidation = isStrongPassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          status: 'error',
          message: passwordValidation.message
        });
      }
      
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
