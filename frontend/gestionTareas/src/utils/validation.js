/**
 * Utilidades de validación para datos de usuario
 */

// Validar nombre (solo permite letras, espacios y algunos caracteres especiales comunes en nombres)
const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Este campo es obligatorio' };
  }
  
  // Permitir letras, espacios, apóstrofes, guiones, y algunos acentos comunes en español
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'.-]+$/;
  
  if (!nameRegex.test(name)) {
    return { 
      isValid: false, 
      message: 'Solo puede contener letras, espacios, apóstrofes y guiones' 
    };
  }
  
  if (name.length > 50) {
    return { isValid: false, message: 'No puede exceder 50 caracteres' };
  }
  
  return { isValid: true, message: 'Nombre válido' };
};

// Validar email institucional con formato correcto
const validateEmail = (email) => {
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
const validatePassword = (password) => {
  const result = {
    isValid: true,
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    message: ''
  };
  
  // Si es un string vacío (para campos opcionales como al editar)
  if (!password) {
    result.isValid = false;
    result.message = 'La contraseña es obligatoria';
    return result;
  }
  
  // Validar longitud mínima
  result.minLength = password.length >= 8;
  
  // Validar mayúsculas
  result.hasUpperCase = /[A-Z]/.test(password);
  
  // Validar minúsculas
  result.hasLowerCase = /[a-z]/.test(password);
  
  // Validar números
  result.hasNumber = /[0-9]/.test(password);
  
  // Validar caracteres especiales
  result.hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // Validar que se cumplan todos los requisitos
  result.isValid = result.minLength && 
                 result.hasUpperCase && 
                 result.hasLowerCase && 
                 result.hasNumber && 
                 result.hasSpecialChar;
  
  // Establecer mensaje de error apropiado
  if (!result.isValid) {
    if (!result.minLength) {
      result.message = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!result.hasUpperCase) {
      result.message = 'La contraseña debe incluir al menos una letra mayúscula';
    } else if (!result.hasLowerCase) {
      result.message = 'La contraseña debe incluir al menos una letra minúscula';
    } else if (!result.hasNumber) {
      result.message = 'La contraseña debe incluir al menos un número';
    } else if (!result.hasSpecialChar) {
      result.message = 'La contraseña debe incluir al menos un carácter especial';
    }
  }
  
  return result;
};

// Sanitizar entrada de texto (elimina caracteres potencialmente peligrosos)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Eliminar caracteres HTML y scripts potenciales
  return input
    .replace(/<[^>]*>/g, '')  // Eliminar etiquetas HTML
    .replace(/javascript:/gi, '')  // Eliminar javascript:
    .replace(/on\w+=/gi, '')  // Eliminar manejadores de eventos inline
    .trim();  // Eliminar espacios al inicio y final
};

// Helper para obtener el nombre completo
const getFullName = (firstName, lastName) => {
  return `${firstName || ''} ${lastName || ''}`.trim();
};

export { validateName, validateEmail, validatePassword, sanitizeInput, getFullName };



