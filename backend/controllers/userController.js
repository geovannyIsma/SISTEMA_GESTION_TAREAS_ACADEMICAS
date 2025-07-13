const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { 
  isValidFirstName, 
  isValidLastName, 
  isValidEmail, 
  isStrongPassword, 
  isValidRole,
  sanitizeInput,
  getFullName
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
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Añadir campo name para compatibilidad con el frontend
    const usersWithName = users.map(user => ({
      ...user,
      name: getFullName(user.firstName, user.lastName)
    }));

    res.status(200).json({
      status: 'success',
      data: usersWithName,
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
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    // Añadir campo name para compatibilidad con el frontend
    const userData = {
      ...user,
      name: getFullName(user.firstName, user.lastName)
    };

    res.status(200).json({
      status: 'success',
      data: userData,
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
    const firstName = sanitizeInput(req.body.firstName);
    const lastName = sanitizeInput(req.body.lastName);
    const email = sanitizeInput(req.body.email);
    const password = req.body.password; // No sanitizamos password para no afectar caracteres especiales válidos
    const role = req.body.role;

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Todos los campos son requeridos' });
    }

    // Validar nombre y apellido
    const firstNameValidation = isValidFirstName(firstName);
    if (!firstNameValidation.isValid) {
      return res.status(400).json({ status: 'error', message: firstNameValidation.message });
    }

    const lastNameValidation = isValidLastName(lastName);
    if (!lastNameValidation.isValid) {
      return res.status(400).json({ status: 'error', message: lastNameValidation.message });
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
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'ESTUDIANTE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Añadir campo name para compatibilidad con el frontend
    const userData = {
      ...user,
      name: getFullName(user.firstName, user.lastName)
    };

    res.status(201).json({
      status: 'success',
      data: userData,
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
    const firstName = req.body.firstName ? sanitizeInput(req.body.firstName) : undefined;
    const lastName = req.body.lastName ? sanitizeInput(req.body.lastName) : undefined;
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
    if (firstName) {
      const firstNameValidation = isValidFirstName(firstName);
      if (!firstNameValidation.isValid) {
        return res.status(400).json({ status: 'error', message: firstNameValidation.message });
      }
    }

    if (lastName) {
      const lastNameValidation = isValidLastName(lastName);
      if (!lastNameValidation.isValid) {
        return res.status(400).json({ status: 'error', message: lastNameValidation.message });
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
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
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
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Añadir campo name para compatibilidad con el frontend
    const userData = {
      ...updatedUser,
      name: getFullName(updatedUser.firstName, updatedUser.lastName)
    };

    res.status(200).json({
      status: 'success',
      data: userData,
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
