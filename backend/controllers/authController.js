const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { 
  isValidName, 
  isValidEmail, 
  isStrongPassword, 
  isValidRole, 
  sanitizeInput 
} = require('../utils/validation');

const prisma = new PrismaClient();

// Generación de token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Registro de usuario (solo administradores pueden crear usuarios)
const registerUser = async (req, res) => {
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
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al registrar usuario' });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const email = sanitizeInput(req.body.email);
    const password = req.body.password;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email y contraseña son requeridos' });
    }

    // Validar formato de email
    const emailValidation = isValidEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ status: 'error', message: emailValidation.message });
    }

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatch) {
      // Por seguridad, no especificamos si fue el email o la contraseña incorrecta
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generateToken(user.id);

    // Registro exitoso de inicio de sesión
    res.status(200).json({
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('Error de login:', error);
    res.status(500).json({ status: 'error', message: 'Error al iniciar sesión' });
  }
};

// Obtener datos del usuario actual
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener datos del usuario' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
