/**
 * Utilidades de validación para el frontend
 */

// Validar nombre (solo permite letras, espacios y algunos caracteres especiales comunes en nombres)
export const validateName = (name) => {
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
export const validateEmail = (email) => {
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
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'La contraseña es obligatoria' };
  }
  
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const notTooLong = password.length <= 100;
  
  const isValid = minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && notTooLong;
  
  let message = 'Contraseña válida';
  
  if (!isValid) {
    if (!minLength) {
      message = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!hasUpperCase) {
      message = 'La contraseña debe incluir al menos una letra mayúscula';
    } else if (!hasLowerCase) {
      message = 'La contraseña debe incluir al menos una letra minúscula';
    } else if (!hasNumber) {
      message = 'La contraseña debe incluir al menos un número';
    } else if (!hasSpecialChar) {
      message = 'La contraseña debe incluir al menos un carácter especial';
    } else if (!notTooLong) {
      message = 'La contraseña es demasiado larga (máximo 100 caracteres)';
    }
  }
  
  return {
    isValid,
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    notTooLong,
    message,
    touched: true
  };
};

// Limpiar texto de caracteres potencialmente peligrosos
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Eliminar caracteres HTML y scripts potenciales
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};
