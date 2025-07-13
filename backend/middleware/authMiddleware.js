const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { getFullName } = require('../utils/validation');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (sin incluir la contraseña)
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, firstName: true, lastName: true, email: true, role: true }
      });

      // Añadir campo name para compatibilidad con el frontend
      req.user = {
        ...user,
        name: getFullName(user.firstName, user.lastName)
      };

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ status: 'error', message: 'No autorizado, token inválido' });
    }
  }

  if (!token) {
    res.status(401).json({ status: 'error', message: 'No autorizado, no se proporcionó token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: `Usuario con rol ${req.user.role} no tiene permiso para esta acción` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
