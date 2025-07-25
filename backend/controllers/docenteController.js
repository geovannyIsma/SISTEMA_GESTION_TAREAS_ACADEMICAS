const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');

// Crear tarea
const crearTarea = async (req, res) => {
  try {
    const { titulo, descripcion, fechaEntrega } = req.body;
    if (!titulo || !descripcion || !fechaEntrega) {
      return res.status(400).json({ status: 'error', message: 'Todos los campos son requeridos' });
    }
    const tarea = await prisma.tarea.create({
      data: {
        titulo,
        descripcion,
        fechaEntrega: new Date(fechaEntrega),
        docenteId: req.user.id,
      },
    });
    res.status(201).json({ status: 'success', data: tarea });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al crear tarea' });
  }
};

// Editar tarea (solo si no han entregado todos los asignados)
const editarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, fechaEntrega, archivoUrl, habilitada } = req.body;
    const tarea = await prisma.tarea.findUnique({
      where: { id: Number(id) },
      include: {
        asignaciones: true,
        entregas: true,
      }
    });
    if (!tarea || tarea.docenteId !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Tarea no encontrada o sin permisos' });
    }

    // Obtener todos los estudiantes asignados (por curso o individual)
    let asignados = [];
    for (const asignacion of tarea.asignaciones) {
      if (asignacion.estudianteId) {
        asignados.push(asignacion.estudianteId);
      } else if (asignacion.cursoId) {
        const curso = await prisma.curso.findUnique({
          where: { id: asignacion.cursoId },
          include: { estudiantes: true }
        });
        asignados.push(...curso.estudiantes.map(e => e.id));
      }
    }
    // Quitar duplicados
    asignados = [...new Set(asignados)];

    // Verificar si todos los asignados ya entregaron
    const entregados = tarea.entregas.map(e => e.estudianteId);
    const faltanEntregas = asignados.filter(id => !entregados.includes(id));
    if (asignados.length > 0 && faltanEntregas.length === 0) {
      return res.status(403).json({ status: 'error', message: 'No se puede editar la tarea, todos los estudiantes ya entregaron.' });
    }

    // Actualizar tarea (incluye habilitada)
    const tareaActualizada = await prisma.tarea.update({
      where: { id: Number(id) },
      data: {
        titulo: titulo || tarea.titulo,
        descripcion: descripcion || tarea.descripcion,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : tarea.fechaEntrega,
        archivoUrl: archivoUrl !== undefined ? archivoUrl : tarea.archivoUrl,
        habilitada: typeof habilitada === 'boolean' ? habilitada : tarea.habilitada,
      },
    });
    res.status(200).json({ status: 'success', data: tareaActualizada });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al editar tarea' });
  }
};

// Asignar tarea a curso o estudiante
const asignarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { cursoId, estudianteId } = req.body;
    const tarea = await prisma.tarea.findUnique({ where: { id: Number(id) } });
    if (!tarea || tarea.docenteId !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Tarea no encontrada o sin permisos' });
    }
    if (!cursoId && !estudianteId) {
      return res.status(400).json({ status: 'error', message: 'Debe especificar cursoId o estudianteId' });
    }
    
    // Validar que el docente tenga acceso al curso o estudiante
    if (cursoId) {
      // Verificar si el docente está asignado al curso
      const cursoDocente = await prisma.curso.findFirst({
        where: {
          id: Number(cursoId),
          docentes: {
            some: {
              id: req.user.id
            }
          }
        }
      });
      
      if (!cursoDocente) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'No tiene permiso para asignar tareas a este curso' 
        });
      }
    }
    
    if (estudianteId) {
      // Verificar si el estudiante pertenece a algún curso del docente
      const estudianteEnCursoDocente = await prisma.curso.findFirst({
        where: {
          docentes: {
            some: {
              id: req.user.id
            }
          },
          estudiantes: {
            some: {
              id: Number(estudianteId)
            }
          }
        }
      });
      
      if (!estudianteEnCursoDocente) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'No tiene permiso para asignar tareas a este estudiante' 
        });
      }
    }

    await prisma.tareaAsignacion.create({
      data: {
        tareaId: tarea.id,
        cursoId: cursoId ? Number(cursoId) : null,
        estudianteId: estudianteId ? Number(estudianteId) : null,
      }
    });
    res.status(200).json({ status: 'success', message: 'Tarea asignada correctamente' });
  } catch (error) {
    console.error('Error al asignar tarea:', error);
    res.status(500).json({ status: 'error', message: 'Error al asignar tarea' });
  }
};

// Listar tareas creadas por el docente
const listarTareasDocente = async (req, res) => {
  try {
    console.log('Usuario autenticado:', req.user);
    const tareas = await prisma.tarea.findMany({
      where: { docenteId: req.user.id },
      orderBy: { 
        fechaEntrega: 'desc' 
      }
    });
    console.log(`Tareas encontradas: ${tareas.length}`);
    res.status(200).json({ status: 'success', data: tareas });
  } catch (error) {
    console.error('Error en listarTareasDocente:', error);
    res.status(500).json({ status: 'error', message: 'Error al listar tareas' });
  }
};

// Listar estudiantes para asignar tareas (filtrado por nombre/correo)
const listarEstudiantes = async (req, res) => {
  try {
    const search = req.query.search || '';
    const cursoId = req.query.cursoId ? Number(req.query.cursoId) : null;
    
    console.log(`Buscando estudiantes para docente ID: ${req.user.id}, curso: ${cursoId}, search: "${search}"`);
    
    // Si se proporciona un ID de curso, verificar que el docente tenga acceso a él
    if (cursoId) {
      const cursoDocente = await prisma.curso.findFirst({
        where: {
          id: cursoId,
          docentes: {
            some: {
              id: req.user.id
            }
          }
        }
      });
      
      if (!cursoDocente) {
        console.warn(`Acceso denegado: Docente ${req.user.id} intentó acceder al curso ${cursoId}`);
        return res.status(403).json({ 
          status: 'error', 
          message: 'No tiene permiso para ver estudiantes de este curso' 
        });
      }
      
      // Obtener estudiantes específicos del curso
      const estudiantes = await prisma.user.findMany({
        where: {
          role: 'ESTUDIANTE',
          cursos: {
            some: {
              id: cursoId
            }
          },
          OR: search ? [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ] : undefined
        },
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          email: true 
        }
      });
      
      console.log(`Encontrados ${estudiantes.length} estudiantes para el curso ${cursoId}`);
      
      // Añadir campo name para compatibilidad
      const estudiantesFormateados = estudiantes.map(est => ({
        ...est,
        name: `${est.firstName || ''} ${est.lastName || ''}`.trim()
      }));
      
      return res.status(200).json({ 
        status: 'success', 
        data: estudiantesFormateados 
      });
    }
    
    // Si no hay cursoId, obtener estudiantes de todos los cursos del docente
    const estudiantes = await prisma.user.findMany({
      where: {
        role: 'ESTUDIANTE',
        cursos: {
          some: {
            docentes: {
              some: {
                id: req.user.id
              }
            }
          }
        },
        OR: search ? [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ] : undefined
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true 
      }
    });
    
    console.log(`Encontrados ${estudiantes.length} estudiantes para todos los cursos del docente ${req.user.id}`);
    
    // Añadir campo name para compatibilidad
    const estudiantesFormateados = estudiantes.map(est => ({
      ...est,
      name: `${est.firstName || ''} ${est.lastName || ''}`.trim()
    }));
    
    res.status(200).json({ status: 'success', data: estudiantesFormateados });
  } catch (error) {
    console.error('Error al listar estudiantes:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al listar estudiantes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener tarea por ID
const getTareaById = async (req, res) => {
  try {
    const { id } = req.params;
    const tareaId = Number(id);
    
    // Buscar la tarea y verificar que pertenezca al docente autenticado
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId }
    });

    if (!tarea) {
      return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });
    }

    if (tarea.docenteId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'No tiene permisos para ver esta tarea' });
    }

    // Obtener información sobre el estado de entregas de esta tarea
    let allSubmitted = false;
    let totalStudents = 0;
    let submittedCount = 0;

    // Obtener todas las asignaciones para esta tarea
    const asignaciones = await prisma.tareaAsignacion.findMany({
      where: { tareaId },
      include: {
        curso: {
          include: {
            estudiantes: {
              select: { id: true }
            }
          }
        }
      }
    });

    // Calcular estudiantes asignados
    const asignadosSet = new Set();
    for (const asignacion of asignaciones) {
      if (asignacion.estudianteId) {
        asignadosSet.add(asignacion.estudianteId);
      } else if (asignacion.curso) {
        asignacion.curso.estudiantes.forEach(est => {
          asignadosSet.add(est.id);
        });
      }
    }
    totalStudents = asignadosSet.size;

    // Obtener conteo de entregas
    if (totalStudents > 0) {
      const entregas = await prisma.entrega.findMany({
        where: { tareaId },
        select: { estudianteId: true }
      });

      const entregasSet = new Set(entregas.map(e => e.estudianteId));
      submittedCount = entregasSet.size;
      
      // Verificar si todos han entregado
      const estudiantesSinEntregar = [...asignadosSet].filter(id => !entregasSet.has(id));
      allSubmitted = estudiantesSinEntregar.length === 0;
    }

    // Devolver la tarea con información adicional
    res.status(200).json({ 
      status: 'success', 
      data: {
        ...tarea,
        allSubmitted,
        totalStudents,
        submittedCount
      } 
    });
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener la tarea' });
  }
};

// Obtener estado de entregas para una tarea
const getTareaSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const tareaId = Number(id);
    
    // Verificar que la tarea exista y pertenezca al docente
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId }
    });

    if (!tarea) {
      return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });
    }

    if (tarea.docenteId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'No tiene permisos para ver esta tarea' });
    }

    // Obtener todas las asignaciones para esta tarea
    const asignaciones = await prisma.tareaAsignacion.findMany({
      where: { tareaId },
      include: {
        curso: {
          include: {
            estudiantes: {
              select: { id: true }
            }
          }
        }
      }
    });

    // Calcular estudiantes asignados
    const asignadosSet = new Set();
    for (const asignacion of asignaciones) {
      if (asignacion.estudianteId) {
        asignadosSet.add(asignacion.estudianteId);
      } else if (asignacion.curso) {
        asignacion.curso.estudiantes.forEach(est => {
          asignadosSet.add(est.id);
        });
      }
    }
    const totalStudents = asignadosSet.size;

    // Obtener conteo de entregas
    let submittedCount = 0;
    let allSubmitted = false;
    
    if (totalStudents > 0) {
      const entregas = await prisma.entrega.findMany({
        where: { tareaId },
        select: { estudianteId: true }
      });

      const entregasSet = new Set(entregas.map(e => e.estudianteId));
      submittedCount = entregasSet.size;
      
      // Verificar si todos han entregado
      const estudiantesSinEntregar = [...asignadosSet].filter(id => !entregasSet.has(id));
      allSubmitted = estudiantesSinEntregar.length === 0;
    }

    res.status(200).json({
      status: 'success',
      data: {
        allSubmitted,
        totalStudents,
        submittedCount
      }
    });
  } catch (error) {
    console.error('Error al obtener estado de entregas:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener estado de entregas' });
  }
};

// Listar los cursos asignados al docente autenticado
const listarCursosDocente = async (req, res) => {
  try {
    console.log('Buscando cursos para docente ID:', req.user.id);
    const cursos = await prisma.curso.findMany({
      where: {
        docentes: {
          some: {
            id: req.user.id
          }
        },
        activo: true // Solo cursos activos
      },
      include: {
        asignatura: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        },
        _count: {
          select: {
            estudiantes: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    console.log(`Cursos encontrados: ${cursos.length}`);
    res.status(200).json({ status: 'success', data: cursos });
  } catch (error) {
    console.error('Error al listar cursos del docente:', error);
    res.status(500).json({ status: 'error', message: 'Error al listar cursos' });
  }
};

// Listar entregas pendientes de revisión
const listarEntregasPendientes = async (req, res) => {
  try {
    // Buscar tareas del docente
    const tareas = await prisma.tarea.findMany({
      where: { docenteId: req.user.id },
      select: { id: true }
    });
    
    const tareaIds = tareas.map(t => t.id);
    
    // Buscar entregas sin calificar de esas tareas
    const entregas = await prisma.entrega.findMany({
      where: { 
        tareaId: { in: tareaIds },
        calificacion: null // Sin calificar
      },
      include: {
        estudiante: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tarea: {
          select: {
            id: true,
            titulo: true
          }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 10 // Limitar a las 10 más recientes
    });
    
    // Añadir nombre completo al estudiante
    const entregasFormateadas = entregas.map(entrega => ({
      ...entrega,
      estudiante: {
        ...entrega.estudiante,
        name: `${entrega.estudiante.firstName} ${entrega.estudiante.lastName}`.trim()
      }
    }));
    
    res.status(200).json({ status: 'success', data: entregasFormateadas });
  } catch (error) {
    console.error('Error al listar entregas pendientes:', error);
    res.status(500).json({ status: 'error', message: 'Error al listar entregas pendientes' });
  }
};

// Obtener estadísticas del docente
const getEstadisticasDocente = async (req, res) => {
  try {
    // Obtener conteo de cursos donde el docente está asignado
    const cursos = await prisma.curso.findMany({
      where: {
        docentes: {
          some: { id: req.user.id }
        }
      },
      include: {
        _count: {
          select: { estudiantes: true }
        }
      }
    });
    
    // Calcular el total de estudiantes (sin duplicados)
    const estudiantesPorCurso = await prisma.user.findMany({
      where: {
        role: 'ESTUDIANTE',
        cursos: {
          some: {
            docentes: {
              some: { id: req.user.id }
            }
          }
        }
      },
      select: { id: true }
    });
    
    // Obtener tareas del docente
    const tareas = await prisma.tarea.findMany({
      where: { docenteId: req.user.id }
    });
    
    // Calcular tareas activas, próximas, etc.
    const ahora = new Date();
    const proximaSemana = new Date();
    proximaSemana.setDate(ahora.getDate() + 7);
    
    const tareasActivas = tareas.filter(t => 
      t.habilitada && new Date(t.fechaEntrega) >= ahora
    );
    
    const tareasProximas = tareasActivas.filter(t => 
      new Date(t.fechaEntrega) <= proximaSemana
    );
    
    // Contar entregas pendientes
    const tareaIds = tareas.map(t => t.id);
    const entregasPendientes = await prisma.entrega.count({
      where: {
        tareaId: { in: tareaIds },
        calificacion: null
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        totalCursos: cursos.length,
        totalEstudiantes: estudiantesPorCurso.length,
        totalTareas: tareas.length,
        tareasActivas: tareasActivas.length,
        tareasProximas: tareasProximas.length,
        entregasPendientes
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del docente:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener estadísticas' });
  }
};

// Eliminar una tarea
const eliminarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const tareaId = Number(id);
    
    // Verificar que la tarea existe y pertenece al docente
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId }
    });
    
    if (!tarea) {
      return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });
    }
    
    if (tarea.docenteId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'No tiene permisos para eliminar esta tarea' });
    }
    
    // Verificar si hay entregas asociadas a esta tarea
    const entregasExistentes = await prisma.entrega.count({
      where: { tareaId }
    });
    
    if (entregasExistentes > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No se puede eliminar la tarea porque tiene entregas asociadas. Deshabilite la tarea en su lugar.' 
      });
    }
    
    // Usar transacción para garantizar la integridad de los datos
    await prisma.$transaction(async (prisma) => {
      // Eliminar las asignaciones de la tarea primero
      await prisma.tareaAsignacion.deleteMany({
        where: { tareaId }
      });
      
      // Eliminar la tarea
      await prisma.tarea.delete({
        where: { id: tareaId }
      });
    });
    
    res.status(200).json({ status: 'success', message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ status: 'error', message: 'Error al eliminar la tarea' });
  }
};

// Subir material docente
const subirMaterial = async (req, res) => {
  try {
    // Verifica que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No se ha proporcionado ningún archivo' });
    }

    // Ruta relativa del archivo para guardar en la base de datos
    const archivoUrl = `/uploads/material/${req.file.filename}`;
    
    // Determinar tipo de archivo
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let fileType = 'OTRO';
    
    if (['.pdf'].includes(fileExt)) fileType = 'PDF';
    else if (['.zip', '.rar', '.7z'].includes(fileExt)) fileType = 'ZIP';
    else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExt)) fileType = 'IMG';
    else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileExt)) fileType = 'DOC';
    
    // Obtener tamaño en MB
    const fileSizeMB = req.file.size / (1024 * 1024);

    // Crear respuesta con información del archivo
    const fileInfo = {
      url: archivoUrl,
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      sizeMB: fileSizeMB.toFixed(2),
      type: fileType,
      mimetype: req.file.mimetype
    };

    res.status(200).json({ 
      status: 'success', 
      message: 'Material subido correctamente',
      data: fileInfo
    });
  } catch (error) {
    console.error('Error al subir material:', error);
    res.status(500).json({ status: 'error', message: 'Error al subir el material' });
  }
};

module.exports = {
  crearTarea,
  editarTarea,
  asignarTarea,
  listarTareasDocente,
  listarEstudiantes,
  getTareaById,
  getTareaSubmissionStatus,
  listarCursosDocente,
  listarEntregasPendientes,
  getEstadisticasDocente,
  eliminarTarea,
  subirMaterial
};
