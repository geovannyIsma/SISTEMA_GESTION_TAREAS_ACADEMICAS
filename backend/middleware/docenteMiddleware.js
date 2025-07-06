const docenteOnly = (req, res, next) => {
  if (req.user && req.user.role === 'DOCENTE') {
    return next();
  }
  return res.status(403).json({ status: 'error', message: 'Acceso solo para docentes' });
};

module.exports = { docenteOnly };
