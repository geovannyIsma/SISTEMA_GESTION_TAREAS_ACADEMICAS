const docenteOnly = (req, res, next) => {
  if (!req.user) {
    console.error('Authentication error: No user in request');
    return res.status(401).json({ status: 'error', message: 'Autenticación requerida' });
  }
  
  if (req.user.role === 'DOCENTE') {
    return next();
  }
  
  console.error(`Permission denied: User role ${req.user.role} attempted to access docente endpoint`);
  return res.status(403).json({ status: 'error', message: 'Acceso solo para docentes' });
};

module.exports = { docenteOnly };
