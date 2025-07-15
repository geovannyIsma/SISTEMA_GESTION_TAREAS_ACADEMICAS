const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar tareas asignadas al estudiante autenticado
const listarTareasEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.id;
    // Buscar todas las asignaciones directas o por curso
    const asignaciones = await prisma.tareaAsignacion.findMany({
      where: {
        OR: [
          { estudianteId },
          {
            curso: {
              estudiantes: {
                some: { id: estudianteId }
              }
            }
          }
        ],
        tarea: { habilitada: true }
      },
      include: {
        tarea: true
      }
    });

    // Extraer tareas únicas
    const tareas = [];
    const tareaIds = new Set();
    for (const asignacion of asignaciones) {
      if (asignacion.tarea && !tareaIds.has(asignacion.tarea.id)) {
        tareas.push(asignacion.tarea);
        tareaIds.add(asignacion.tarea.id);
      }
    }

    res.status(200).json({ status: 'success', data: tareas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al listar tareas asignadas' });
  }
};

// Listar todos los cursos en los que está matriculado el estudiante
const listarCursosEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.id;
    
    const cursos = await prisma.curso.findMany({
      where: {
        estudiantes: {
          some: { id: estudianteId }
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
            estudiantes: true,
            docentes: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener conteo de tareas activas por curso
    const cursosConTareas = await Promise.all(cursos.map(async (curso) => {
      const tareas = await prisma.tarea.count({
        where: {
          asignaciones: {
            some: {
              OR: [
                { cursoId: curso.id },
                { 
                  estudianteId,
                  tarea: {
                    asignaciones: {
                      some: {
                        cursoId: curso.id
                      }
                    }
                  }
                }
              ]
            }
          },
          habilitada: true
        }
      });
      
      return {
        ...curso,
        _count: {
          ...curso._count,
          tareas
        }
      };
    }));

    res.status(200).json({ status: 'success', data: cursosConTareas });
  } catch (error) {
    console.error('Error al listar cursos del estudiante:', error);
    res.status(500).json({ status: 'error', message: 'Error al listar cursos' });
  }
};

// Obtener detalles de un curso específico
const getCursoEstudianteById = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteId = req.user.id;
    
    // Verificar que el curso exista y que el estudiante esté matriculado
    const curso = await prisma.curso.findFirst({
      where: {
        id: Number(id),
        estudiantes: {
          some: { id: estudianteId }
        }
      },
      include: {
        asignatura: true,
        docentes: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!curso) {
      return res.status(404).json({ status: 'error', message: 'Curso no encontrado o no estás matriculado' });
    }
    
    // Formatear nombres de docentes
    const cursoDatos = {
      ...curso,
      docentes: curso.docentes.map(docente => ({
        ...docente,
        name: `${docente.firstName} ${docente.lastName}`.trim()
      }))
    };
    
    res.status(200).json({ status: 'success', data: cursoDatos });
  } catch (error) {
    console.error('Error al obtener curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener datos del curso' });
  }
};

// Listar tareas de un curso específico para el estudiante
const getTareasCursoEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const cursoId = Number(id);
    const estudianteId = req.user.id;
    
    // Verificar que el estudiante esté matriculado en el curso
    const cursoEstudiante = await prisma.curso.findFirst({
      where: {
        id: cursoId,
        estudiantes: {
          some: { id: estudianteId }
        }
      }
    });
    
    if (!cursoEstudiante) {
      return res.status(403).json({ status: 'error', message: 'No estás matriculado en este curso' });
    }
    
    // Buscar tareas asignadas al curso o al estudiante en este curso
    const asignaciones = await prisma.tareaAsignacion.findMany({
      where: {
        OR: [
          { cursoId },
          { 
            estudianteId,
            tarea: {
              asignaciones: {
                some: {
                  cursoId
                }
              }
            }
          }
        ],
        tarea: { habilitada: true }
      },
      include: {
        tarea: true
      }
    });
    
    // Extraer tareas únicas
    const tareas = [];
    const tareaIds = new Set();
    for (const asignacion of asignaciones) {
      if (asignacion.tarea && !tareaIds.has(asignacion.tarea.id)) {
        // Verificar si el estudiante ya entregó esta tarea
        const entrega = await prisma.entrega.findFirst({
          where: {
            tareaId: asignacion.tarea.id,
            estudianteId
          }
        });
        
        // Añadir información adicional a la tarea
        const tareaConInfo = {
          ...asignacion.tarea,
          entregado: !!entrega,
          calificacion: entrega?.calificacion || null,
          cursoId: cursoId
        };
        
        tareas.push(tareaConInfo);
        tareaIds.add(asignacion.tarea.id);
      }
    }
    
    res.status(200).json({ status: 'success', data: tareas });
  } catch (error) {
    console.error('Error al listar tareas del curso:', error);
    res.status(500).json({ status: 'error', message: 'Error al listar tareas del curso' });
  }
};

// Obtener detalles de una tarea específica para el estudiante
const getTareaEstudianteById = async (req, res) => {
  try {
    const { id } = req.params;
    const tareaId = Number(id);
    const estudianteId = req.user.id;
    
    // Buscar la tarea y verificar que el estudiante tenga acceso a ella
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      include: {
        docente: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!tarea) {
      return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });
    }
    
    // Verificar que el estudiante tenga acceso a esta tarea (por asignación directa o por curso)
    const tieneAcceso = await prisma.tareaAsignacion.findFirst({
      where: {
        tareaId,
        OR: [
          { estudianteId },
          {
            curso: {
              estudiantes: {
                some: { id: estudianteId }
              }
            }
          }
        ]
      },
      include: {
        curso: true
      }
    });
    
    if (!tieneAcceso) {
      return res.status(403).json({ status: 'error', message: 'No tienes acceso a esta tarea' });
    }
    
    // Buscar entrega del estudiante para esta tarea
    const entrega = await prisma.entrega.findFirst({
      where: {
        tareaId,
        estudianteId
      }
    });
    
    // Obtener información del curso
    const cursoInfo = tieneAcceso.curso ? {
      id: tieneAcceso.curso.id,
      nombre: tieneAcceso.curso.nombre,
      codigo: tieneAcceso.curso.codigo
    } : null;
    
    // Formatear nombre del docente
    const docenteName = tarea.docente ? 
      `${tarea.docente.firstName} ${tarea.docente.lastName}`.trim() : 'No asignado';
    
    // Componer la respuesta completa
    const tareaData = {
      ...tarea,
      docente: {
        ...tarea.docente,
        name: docenteName
      },
      curso: cursoInfo,
      entrega
    };
    
    res.status(200).json({ status: 'success', data: tareaData });
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener datos de la tarea' });
  }
};

// Enviar o actualizar entrega de una tarea
const enviarEntregaTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const tareaId = Number(id);
    const estudianteId = req.user.id;
    const { comentario } = req.body;
    
    // Verificar si existe un archivo en la solicitud
    let archivoUrl = null;
    if (req.file) {
      archivoUrl = req.file.path || req.file.location; // Dependiendo del almacenamiento (local o S3)
    }
    
    // Verificar que la tarea exista
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId }
    });
    
    if (!tarea) {
      return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });
    }
    
    // Verificar que la tarea esté habilitada
    if (!tarea.habilitada) {
      return res.status(400).json({ status: 'error', message: 'La tarea no está disponible para entrega' });
    }
    
    // Verificar que no haya pasado la fecha límite
    const fechaActual = new Date();
    if (fechaActual > new Date(tarea.fechaEntrega)) {
      return res.status(400).json({ status: 'error', message: 'La fecha límite para esta tarea ha pasado' });
    }
    
    // Verificar que el estudiante tenga acceso a esta tarea
    const tieneAcceso = await prisma.tareaAsignacion.findFirst({
      where: {
        tareaId,
        OR: [
          { estudianteId },
          {
            curso: {
              estudiantes: {
                some: { id: estudianteId }
              }
            }
          }
        ]
      }
    });
    
    if (!tieneAcceso) {
      return res.status(403).json({ status: 'error', message: 'No tienes acceso a esta tarea' });
    }
    
    // Verificar si ya existe una entrega para actualizarla
    const entregaExistente = await prisma.entrega.findFirst({
      where: {
        tareaId,
        estudianteId
      }
    });
    
    let entrega;
    
    if (entregaExistente) {
      // Actualizar entrega existente
      entrega = await prisma.entrega.update({
        where: { id: entregaExistente.id },
        data: {
          archivoUrl: archivoUrl || entregaExistente.archivoUrl,
          comentario: comentario !== undefined ? comentario : entregaExistente.comentario,
          fecha: new Date()
        }
      });
    } else {
      // Crear nueva entrega
      entrega = await prisma.entrega.create({
        data: {
          tareaId,
          estudianteId,
          archivoUrl,
          comentario,
          fecha: new Date()
        }
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: entregaExistente ? 'Entrega actualizada correctamente' : 'Entrega enviada correctamente',
      data: entrega
    });
  } catch (error) {
    console.error('Error al procesar entrega:', error);
    res.status(500).json({ status: 'error', message: 'Error al procesar la entrega' });
  }
};

// Obtener estadísticas del estudiante para el dashboard
const getEstadisticasEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.id;
    
    // Contar cursos en los que está matriculado
    const totalCursos = await prisma.curso.count({
      where: {
        estudiantes: {
          some: { id: estudianteId }
        },
        activo: true
      }
    });
    
    // Obtener todas las tareas asignadas
    const asignaciones = await prisma.tareaAsignacion.findMany({
      where: {
        OR: [
          { estudianteId },
          {
            curso: {
              estudiantes: {
                some: { id: estudianteId }
              }
            }
          }
        ],
        tarea: { habilitada: true }
      },
      include: {
        tarea: true
      }
    });
    
    // Extraer tareas únicas
    const tareas = [];
    const tareaIds = new Set();
    for (const asignacion of asignaciones) {
      if (asignacion.tarea && !tareaIds.has(asignacion.tarea.id)) {
        tareas.push(asignacion.tarea);
        tareaIds.add(asignacion.tarea.id);
      }
    }
    
    const totalTareas = tareas.length;
    
    // Obtener entregas del estudiante
    const entregas = await prisma.entrega.findMany({
      where: {
        estudianteId,
        tareaId: { in: [...tareaIds] }
      }
    });
    
    const entregasIds = entregas.map(entrega => entrega.tareaId);
    
    // Calcular tareas pendientes (asignadas pero no entregadas)
    const tareasPendientes = tareas.filter(tarea => 
      !entregasIds.includes(tarea.id) && 
      new Date(tarea.fechaEntrega) >= new Date()
    ).length;
    
    // Calcular tareas vencidas (no entregadas y fecha límite pasada)
    const tareasVencidas = tareas.filter(tarea => 
      !entregasIds.includes(tarea.id) && 
      new Date(tarea.fechaEntrega) < new Date()
    ).length;
    
    // Calcular promedio de calificaciones
    let promedioCalificaciones = 0;
    const entregasCalificadas = entregas.filter(entrega => entrega.calificacion !== null);
    if (entregasCalificadas.length > 0) {
      const sumaCalificaciones = entregasCalificadas.reduce(
        (suma, entrega) => suma + entrega.calificacion, 0
      );
      promedioCalificaciones = sumaCalificaciones / entregasCalificadas.length;
    }
    
    // Obtener próximas entregas (ordenadas por fecha límite)
    const fechaActual = new Date();
    const tareasPendientesObj = tareas.filter(tarea => 
      !entregasIds.includes(tarea.id) && 
      new Date(tarea.fechaEntrega) >= fechaActual
    ).sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega));
    
    // Obtener información de curso para cada tarea pendiente
    const proximasEntregas = await Promise.all(
      tareasPendientesObj.slice(0, 5).map(async (tarea) => {
        // Buscar el curso de esta tarea
        const asignacion = await prisma.tareaAsignacion.findFirst({
          where: { 
            tareaId: tarea.id,
            OR: [
              { estudianteId },
              {
                curso: {
                  estudiantes: {
                    some: { id: estudianteId }
                  }
                }
              }
            ]
          },
          include: {
            curso: true
          }
        });
        
        return {
          ...tarea,
          curso: asignacion?.curso ? {
            id: asignacion.curso.id,
            nombre: asignacion.curso.nombre
          } : null
        };
      })
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        totalCursos,
        totalTareas,
        tareasPendientes,
        tareasVencidas,
        promedioCalificaciones,
        proximasEntregas
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del estudiante:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener estadísticas' });
  }
};

module.exports = { 
  listarTareasEstudiante,
  listarCursosEstudiante,
  getCursoEstudianteById,
  getTareasCursoEstudiante,
  getTareaEstudianteById,
  enviarEntregaTarea,
  getEstadisticasEstudiante
};
