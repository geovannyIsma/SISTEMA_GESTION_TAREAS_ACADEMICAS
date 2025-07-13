/**
 * Manejador centralizado de errores para controladores
 * @param {Function} fn - Función controladora async
 * @returns {Function} - Función controladora con manejo de errores
 */
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      res.status(500).json({
        status: 'error',
        message: 'Error del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Responder con un error
 * @param {Response} res - Objeto respuesta de Express
 * @param {Number} statusCode - Código de estado HTTP
 * @param {String} message - Mensaje de error
 */
const errorResponse = (res, statusCode = 400, message = 'Error en la solicitud') => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};

/**
 * Responder con éxito
 * @param {Response} res - Objeto respuesta de Express
 * @param {Number} statusCode - Código de estado HTTP
 * @param {*} data - Datos a enviar
 * @param {String} message - Mensaje opcional
 */
const successResponse = (res, statusCode = 200, data = null, message = null) => {
  const response = {
    status: 'success',
  };
  
  if (data !== null) response.data = data;
  if (message !== null) response.message = message;
  
  return res.status(statusCode).json(response);
};

module.exports = {
  asyncHandler,
  errorResponse,
  successResponse
};
