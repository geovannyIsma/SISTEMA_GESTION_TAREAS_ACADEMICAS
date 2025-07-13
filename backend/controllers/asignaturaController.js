const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sanitizeInput } = require('../utils/validation');

// Obtener todas las asignaturas
const getAsignaturas = async (req, res) => {
  try {
    const asignaturas = await prisma.asignatura.findMany({
      include: {
        _count: {
          select: {
            cursos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.status(200).json({
      status: 'success',
      data: asignaturas
    });
  } catch (error) {
    console.error('Error al obtener asignaturas:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener asignaturas' });
  }
};

// Obtener una asignatura por ID
const getAsignaturaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const asignatura = await prisma.asignatura.findUnique({
      where: { id: Number(id) },
      include: {
        cursos: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            activo: true
          }
        }
      }
    });

    if (!asignatura) {
      return res.status(404).json({ status: 'error', message: 'Asignatura no encontrada' });
    }

    res.status(200).json({
      status: 'success',
      data: asignatura
    });
  } catch (error) {
    console.error('Error al obtener asignatura:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener asignatura' });
  }
};

// Crear una nueva asignatura
const createAsignatura = async (req, res) => {
  try {
    // Sanitizar entradas
    const codigo = sanitizeInput(req.body.codigo);
    const nombre = sanitizeInput(req.body.nombre);
    const descripcion = req.body.descripcion ? sanitizeInput(req.body.descripcion) : null;

    // Validar campos requeridos
    if (!codigo || !nombre) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'El código y nombre de la asignatura son obligatorios' 
      });
    }

    // Verificar si ya existe una asignatura con el mismo código
    const asignaturaExistente = await prisma.asignatura.findUnique({
      where: { codigo }
    });

    if (asignaturaExistente) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Ya existe una asignatura con ese código' 
      });
    }

    // Crear asignatura
    const asignatura = await prisma.asignatura.create({
      data: {
        codigo,
        nombre,
        descripcion
      }
    });

    res.status(201).json({
      status: 'success',
      data: asignatura
    });
  } catch (error) {
    console.error('Error al crear asignatura:', error);
    res.status(500).json({ status: 'error', message: 'Error al crear asignatura' });
  }
};

// Actualizar una asignatura existente
const updateAsignatura = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sanitizar entradas
    const codigo = req.body.codigo ? sanitizeInput(req.body.codigo) : undefined;
    const nombre = req.body.nombre ? sanitizeInput(req.body.nombre) : undefined;
    const descripcion = req.body.descripcion !== undefined ? 
      sanitizeInput(req.body.descripcion) : undefined;

    // Verificar si la asignatura existe
    const asignaturaExistente = await prisma.asignatura.findUnique({
      where: { id: Number(id) }
    });

    if (!asignaturaExistente) {
      return res.status(404).json({ status: 'error', message: 'Asignatura no encontrada' });
    }

    // Si se va a actualizar el código, verificar que no exista otra asignatura con ese código
    if (codigo && codigo !== asignaturaExistente.codigo) {
      const asignaturaConCodigo = await prisma.asignatura.findUnique({
        where: { codigo }
      });

      if (asignaturaConCodigo) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Ya existe una asignatura con ese código' 
        });
      }
    }

    // Preparar datos para actualización
    const updateData = {};
    if (codigo) updateData.codigo = codigo;
    if (nombre) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;

    // Actualizar asignatura
    const updatedAsignatura = await prisma.asignatura.update({
      where: { id: Number(id) },
      data: updateData
    });

    res.status(200).json({
      status: 'success',
      data: updatedAsignatura
    });
  } catch (error) {
    console.error('Error al actualizar asignatura:', error);
    res.status(500).json({ status: 'error', message: 'Error al actualizar asignatura' });
  }
};

// Eliminar una asignatura
const deleteAsignatura = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la asignatura existe
    const asignaturaExistente = await prisma.asignatura.findUnique({
      where: { id: Number(id) },
      include: {
        cursos: true
      }
    });

    if (!asignaturaExistente) {
      return res.status(404).json({ status: 'error', message: 'Asignatura no encontrada' });
    }

    // Verificar si hay cursos asociados a esta asignatura
    if (asignaturaExistente.cursos.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se puede eliminar la asignatura porque tiene cursos asociados'
      });
    }

    // Eliminar la asignatura
    await prisma.asignatura.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({
      status: 'success',
      message: 'Asignatura eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar asignatura:', error);
    res.status(500).json({ status: 'error', message: 'Error al eliminar asignatura' });
  }
};

module.exports = {
  getAsignaturas,
  getAsignaturaById,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura
};
