const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const { 
  isValidFirstName,
  isValidLastName,
  isValidEmail, 
  isStrongPassword, 
  isValidRole, 
  sanitizeInput,
  getFullName
} = require('../utils/validation');
const { asyncHandler, errorResponse, successResponse } = require('../utils/errorHandler');

// Generación de token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Registro de usuario (solo administradores pueden crear usuarios)
const registerUser = asyncHandler(async (req, res) => {
  // Sanitizar entradas
  const firstName = sanitizeInput(req.body.firstName);
  const lastName = sanitizeInput(req.body.lastName);
  const email = sanitizeInput(req.body.email);
  const password = req.body.password; // No sanitizamos password para no afectar caracteres especiales válidos
  const role = req.body.role;

  // Validar campos requeridos
  if (!firstName || !lastName || !email || !password) {
    return errorResponse(res, 400, 'Todos los campos son requeridos');
  }

  // Validar nombre y apellido
  const firstNameValidation = isValidFirstName(firstName);
  if (!firstNameValidation.isValid) {
    return errorResponse(res, 400, firstNameValidation.message);
  }

  const lastNameValidation = isValidLastName(lastName);
  if (!lastNameValidation.isValid) {
    return errorResponse(res, 400, lastNameValidation.message);
  }

  // Validar email
  const emailValidation = isValidEmail(email);
  if (!emailValidation.isValid) {
    return errorResponse(res, 400, emailValidation.message);
  }
  
  // Validar fortaleza de contraseña
  const passwordValidation = isStrongPassword(password);
  if (!passwordValidation.isValid) {
    return errorResponse(res, 400, passwordValidation.message);
  }

  // Validar rol si se proporciona
  if (role) {
    const roleValidation = isValidRole(role);
    if (!roleValidation.isValid) {
      return errorResponse(res, 400, roleValidation.message);
    }
  }

  // Verificar si el usuario ya existe
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    return errorResponse(res, 400, 'El usuario ya existe');
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
  });

  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: getFullName(user.firstName, user.lastName),
    email: user.email,
    role: user.role,
  };

  return successResponse(res, 201, userData);
});

// Login
const loginUser = asyncHandler(async (req, res) => {
  const email = sanitizeInput(req.body.email);
  const password = req.body.password;

  // Validar campos
  if (!email || !password) {
    return errorResponse(res, 400, 'Email y contraseña son requeridos');
  }

  // Validar formato de email
  const emailValidation = isValidEmail(email);
  if (!emailValidation.isValid) {
    return errorResponse(res, 400, emailValidation.message);
  }

  // Verificar si el usuario existe
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return errorResponse(res, 401, 'Credenciales inválidas');
  }

  // Verificar contraseña
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  
  if (!isPasswordMatch) {
    return errorResponse(res, 401, 'Credenciales inválidas');
  }

  // Generar token
  const token = generateToken(user.id);

  return successResponse(res, 200, {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: getFullName(user.firstName, user.lastName),
    email: user.email,
    role: user.role,
    token,
  });
});

// Obtener datos del usuario actual
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });

  // Añadir campo name para compatibilidad con el frontend
  const userData = {
    ...user,
    name: getFullName(user.firstName, user.lastName)
  };

  return successResponse(res, 200, userData);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
