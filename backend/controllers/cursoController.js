const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sanitizeInput } = require('../utils/validation');

// Obtener todos los cursos con información de docentes y estudiantes
const getCursos = async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        asignatura: true,
        docentes: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        estudiantes: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            estudiantes: true,
            docentes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      status: 'success',
      data: cursos,
    });
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener cursos' });
  }
};

// Obtener un curso específico por ID
const getCursoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const curso = await prisma.curso.findUnique({
      where: { id: Number(id) },
      include: {
        asignatura: true,
        docentes: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        estudiantes: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!curso) {
      return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    }

    res.status(200).json({
      status: 'success',
      data: curso,
    });
  } catch (error) {
    console.error('Error al obtener curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener curso' });
  }
};

// Crear un nuevo curso
const createCurso = async (req, res) => {
  try {
    // Sanitizar entradas
    const nombre = sanitizeInput(req.body.nombre);
    const codigo = sanitizeInput(req.body.codigo);
    const descripcion = sanitizeInput(req.body.descripcion);
    const asignaturaId = req.body.asignaturaId;

    // Validar campos requeridos
    if (!nombre || !codigo || !asignaturaId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'El nombre, código y asignatura del curso son obligatorios' 
      });
    }

    // Verificar si ya existe un curso con el mismo código
    const cursoExistente = await prisma.curso.findUnique({
      where: { codigo },
    });

    if (cursoExistente) {
      return res.status(400).json({ status: 'error', message: 'Ya existe un curso con ese código' });
    }

    // Verificar si la asignatura existe
    const asignatura = await prisma.asignatura.findUnique({
      where: { id: Number(asignaturaId) },
    });

    if (!asignatura) {
      return res.status(400).json({ status: 'error', message: 'La asignatura seleccionada no existe' });
    }

    // Crear curso
    const curso = await prisma.curso.create({
      data: {
        nombre,
        codigo,
        descripcion,
        asignaturaId: Number(asignaturaId)
      },
    });

    res.status(201).json({
      status: 'success',
      data: curso,
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al crear curso' });
  }
};

// Actualizar un curso existente
const updateCurso = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sanitizar entradas
    const nombre = req.body.nombre ? sanitizeInput(req.body.nombre) : undefined;
    const codigo = req.body.codigo ? sanitizeInput(req.body.codigo) : undefined;
    const descripcion = req.body.descripcion ? sanitizeInput(req.body.descripcion) : undefined;
    const asignaturaId = req.body.asignaturaId ? Number(req.body.asignaturaId) : undefined;
    const activo = req.body.activo !== undefined ? req.body.activo : undefined;

    // Verificar si el curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id: Number(id) },
    });

    if (!cursoExistente) {
      return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    }

    // Si se va a actualizar el código, verificar que no exista otro curso con ese código
    if (codigo && codigo !== cursoExistente.codigo) {
      const cursoConCodigo = await prisma.curso.findUnique({
        where: { codigo },
      });

      if (cursoConCodigo) {
        return res.status(400).json({ status: 'error', message: 'Ya existe un curso con ese código' });
      }
    }

    // Si se va a actualizar la asignatura, verificar que exista
    if (asignaturaId) {
      const asignatura = await prisma.asignatura.findUnique({
        where: { id: asignaturaId },
      });

      if (!asignatura) {
        return res.status(400).json({ status: 'error', message: 'La asignatura seleccionada no existe' });
      }
    }

    // Preparar datos para actualización
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (codigo) updateData.codigo = codigo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (asignaturaId) updateData.asignaturaId = asignaturaId;
    if (activo !== undefined) updateData.activo = activo;

    // Actualizar curso
    const updatedCurso = await prisma.curso.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.status(200).json({
      status: 'success',
      data: updatedCurso,
    });
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al actualizar curso' });
  }
};

// Eliminar un curso
const deleteCurso = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id: Number(id) },
    });

    if (!cursoExistente) {
      return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    }

    // Antes de eliminar, verificar si hay asignaciones relacionadas
    const asignacionesExistentes = await prisma.tareaAsignacion.count({
      where: { cursoId: Number(id) },
    });

    if (asignacionesExistentes > 0) {
      // En lugar de eliminar, desactivar el curso
      await prisma.curso.update({
        where: { id: Number(id) },
        data: { activo: false },
      });

      return res.status(200).json({
        status: 'success',
        message: 'Curso desactivado correctamente ya que tiene asignaciones relacionadas',
      });
    }

    // Si no hay asignaciones, eliminar el curso y todas sus relaciones
    await prisma.$transaction(async (prisma) => {
      // Eliminar todas las relaciones con estudiantes y docentes
      await prisma.curso.update({
        where: { id: Number(id) },
        data: {
          estudiantes: { set: [] },
          docentes: { set: [] },
        },
      });

      // Eliminar el curso
      await prisma.curso.delete({
        where: { id: Number(id) },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Curso eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al eliminar curso' });
  }
};

// Agregar estudiantes al curso
const addEstudiantes = async (req, res) => {
  try {
    const { id } = req.params;
    const { estudiantesIds } = req.body;

    if (!estudiantesIds || !Array.isArray(estudiantesIds) || estudiantesIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Se requiere un arreglo de IDs de estudiantes' });
    }

    // Verificar si el curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id: Number(id) },
    });

    if (!cursoExistente) {
      return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    }

    // Verificar que todos los IDs correspondan a estudiantes
    const estudiantes = await prisma.user.findMany({
      where: {
        id: { in: estudiantesIds.map(id => Number(id)) },
        role: 'ESTUDIANTE',
      },
    });

    if (estudiantes.length !== estudiantesIds.length) {
      return res.status(400).json({ status: 'error', message: 'Algunos IDs no corresponden a estudiantes válidos' });
    }

    // Conectar estudiantes al curso
    await prisma.curso.update({
      where: { id: Number(id) },
      data: {
        estudiantes: {
          connect: estudiantes.map(estudiante => ({ id: estudiante.id })),
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Estudiantes agregados al curso correctamente',
    });
  } catch (error) {
    console.error('Error al agregar estudiantes al curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al agregar estudiantes al curso' });
  }
};

// Remover estudiantes del curso
const removeEstudiantes = async (req, res) => {
  try {
    const { id } = req.params;
    const { estudiantesIds } = req.body;

    if (!estudiantesIds || !Array.isArray(estudiantesIds) || estudiantesIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Se requiere un arreglo de IDs de estudiantes' });
    }

    // Verificar si el curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id: Number(id) },
    });

    if (!cursoExistente) {
      return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    }

    // Desconectar estudiantes del curso
    await prisma.curso.update({
      where: { id: Number(id) },
      data: {
        estudiantes: {
          disconnect: estudiantesIds.map(id => ({ id: Number(id) })),
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Estudiantes removidos del curso correctamente',
    });
  } catch (error) {
    console.error('Error al remover estudiantes del curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al remover estudiantes del curso' });
  }
};

// Agregar docentes al curso
const addDocentes = async (req, res) => {
  try {
    const { id } = req.params;
    const { docentesIds } = req.body;

    if (!docentesIds || !Array.isArray(docentesIds) || docentesIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Se requiere un arreglo de IDs de docentes' });
    }

    // Verificar si el curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id: Number(id) },
    });

    if (!cursoExistente) {
      return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    }

    // Verificar que todos los IDs correspondan a docentes
    const docentes = await prisma.user.findMany({
      where: {
        id: { in: docentesIds.map(id => Number(id)) },
        role: 'DOCENTE',
      },
    });

    if (docentes.length !== docentesIds.length) {
      return res.status(400).json({ status: 'error', message: 'Algunos IDs no corresponden a docentes válidos' });
    }

    // Conectar docentes al curso
    await prisma.curso.update({
      where: { id: Number(id) },
      data: {
        docentes: {
          connect: docentes.map(docente => ({ id: docente.id })),
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Docentes agregados al curso correctamente',
    });
  } catch (error) {
    console.error('Error al agregar docentes al curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al agregar docentes al curso' });
  }
};

// Remover docentes del curso
const removeDocentes = async (req, res) => {
  try {
    const { id } = req.params;
    const { docentesIds } = req.body;

    if (!docentesIds || !Array.isArray(docentesIds) || docentesIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Se requiere un arreglo de IDs de docentes' });
    }

    // Verificar si el curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id: Number(id) },
    });

    if (!cursoExistente) {
      return res.status(404).json({ status: 'error', message: 'Curso no encontrado' });
    }

    // Desconectar docentes del curso
    await prisma.curso.update({
      where: { id: Number(id) },
      data: {
        docentes: {
          disconnect: docentesIds.map(id => ({ id: Number(id) })),
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Docentes removidos del curso correctamente',
    });
  } catch (error) {
    console.error('Error al remover docentes del curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al remover docentes del curso' });
  }
};

module.exports = {
  getCursos,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
  addEstudiantes,
  removeEstudiantes,
  addDocentes,
  removeDocentes,
};
