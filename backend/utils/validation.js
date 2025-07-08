/**
 * Utilidades de validación para datos de usuario
 */

// Validar nombre (solo permite letras, espacios y algunos caracteres especiales comunes en nombres)
const isValidName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'El nombre es obligatorio' };
  }
  
  // Permitir letras, espacios, apóstrofes, guiones, y algunos acentos comunes en español
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'.-]+$/;
  
  if (!nameRegex.test(name)) {
    return { 
      isValid: false, 
      message: 'El nombre solo puede contener letras, espacios, apóstrofes y guiones' 
    };
  }
  
  if (name.length > 100) {
    return { isValid: false, message: 'El nombre no puede exceder 100 caracteres' };
  }
  
  return { isValid: true, message: 'Nombre válido' };
};

// Validar email institucional con formato correcto
const isValidEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, message: 'El correo electrónico es obligatorio' };
  }
  
  // Validación básica de formato de email
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  
  if (!emailRegex.test(email)) {
    return { 
      isValid: false, 
      message: 'Formato de correo electrónico inválido' 
    };
  }
  
  // Validar que sea un correo institucional
  if (!email.endsWith('@uni.edu.ec')) {
    return { 
      isValid: false, 
      message: 'El correo debe ser institucional (@uni.edu.ec)' 
    };
  }
  
  return { isValid: true, message: 'Email válido' };
};

// Validar fortaleza de contraseña
const isStrongPassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'La contraseña es obligatoria' };
  }
  
  // Requisitos:
  // - Al menos 8 caracteres
  // - Al menos una letra mayúscula
  // - Al menos una letra minúscula
  // - Al menos un número
  // - Al menos un carácter especial
  
  if (password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos una letra mayúscula' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos una letra minúscula' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos un número' };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos un carácter especial' };
  }
  
  // Evitar contraseñas demasiado largas que podrían causar problemas
  if (password.length > 100) {
    return { isValid: false, message: 'La contraseña es demasiado larga (máximo 100 caracteres)' };
  }
  
  return { isValid: true, message: 'Contraseña válida' };
};

// Validar rol de usuario
const isValidRole = (role) => {
  const validRoles = ['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', 'OBSERVADOR'];
  
  if (!validRoles.includes(role)) {
    return { 
      isValid: false, 
      message: 'Rol inválido. Roles permitidos: ADMINISTRADOR, DOCENTE, ESTUDIANTE, OBSERVADOR' 
    };
  }
  
  return { isValid: true, message: 'Rol válido' };
};

// Sanitizar entrada de texto (elimina caracteres potencialmente peligrosos)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Eliminar caracteres HTML y scripts potenciales
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

module.exports = {
  isValidName,
  isValidEmail,
  isStrongPassword,
  isValidRole,
  sanitizeInput
};
