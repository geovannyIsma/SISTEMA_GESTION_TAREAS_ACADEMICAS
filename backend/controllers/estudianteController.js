const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

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
      },
      include: {
        archivos: true  // Incluir archivos relacionados
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
    
    console.log(`Procesando entrega para tarea: ${tareaId}, estudiante: ${estudianteId}`);
    
    // Verificar si existe un archivo en la solicitud
    let archivoInfo = null;
    if (req.file) {
      console.log(`Archivo recibido: ${req.file.filename}, tamaño: ${req.file.size} bytes`);
      // Usar path relativo para almacenar en DB, con formato Unix para evitar problemas en diferentes OS
      const archivoUrl = req.file.path.replace(/\\/g, '/');
      
      // Si el path incluye el directorio raíz, quitar para tener un path relativo
      const url = archivoUrl.includes('uploads/') 
        ? archivoUrl.substring(archivoUrl.indexOf('uploads/'))
        : archivoUrl;
      
      // Determinar tipo de archivo basado en la extensión
      const extension = req.file.originalname.split('.').pop().toLowerCase();
      let tipo = 'OTRO';
      
      if (['pdf'].includes(extension)) {
        tipo = 'PDF';
      } else if (['zip', 'rar', '7z'].includes(extension)) {
        tipo = 'ZIP';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        tipo = 'IMG';
      }
      
      // Calcular tamaño en MB
      const sizeMB = req.file.size / (1024 * 1024);
      
      archivoInfo = {
        url,
        tipo,
        sizeMB
      };
      
      console.log(`Información de archivo preparada: `, archivoInfo);
    } else {
      console.log('No se recibió ningún archivo');
    }
    
    // Verificar que la tarea exista
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId }
    });
    
    if (!tarea) {
      console.log(`Tarea ${tareaId} no encontrada`);
      return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });
    }
    
    // Verificar que la tarea esté habilitada
    if (!tarea.habilitada) {
      console.log(`Tarea ${tareaId} no está habilitada`);
      return res.status(400).json({ status: 'error', message: 'La tarea no está disponible para entrega' });
    }
    
    // Verificar que no haya pasado la fecha límite o si permite entregas tardías
    const fechaActual = new Date();
    const fueraDePlazo = fechaActual > new Date(tarea.fechaEntrega);
    
    if (fueraDePlazo && !tarea.permitirEntregasTardias) {
      console.log(`Entrega fuera de plazo para tarea ${tareaId} y no se permiten entregas tardías`);
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
      console.log(`Estudiante ${estudianteId} no tiene acceso a la tarea ${tareaId}`);
      return res.status(403).json({ status: 'error', message: 'No tienes acceso a esta tarea' });
    }
    
    // Verificar si ya existe una entrega para actualizarla
    const entregaExistente = await prisma.entrega.findFirst({
      where: {
        tareaId,
        estudianteId
      },
      include: {
        archivos: true
      }
    });
    
    let entrega;
    
    // Usar una transacción para garantizar la integridad de los datos
    await prisma.$transaction(async (prisma) => {
      if (entregaExistente) {
        console.log(`Actualizando entrega existente para tarea ${tareaId}, estudiante ${estudianteId}`);
        // Actualizar entrega existente
        entrega = await prisma.entrega.update({
          where: { id: entregaExistente.id },
          data: {
            comentario: comentario !== undefined ? comentario : entregaExistente.comentario,
            fecha: new Date(),
            fueraDePlazo: fueraDePlazo
          }
        });
        
        // Si hay un nuevo archivo, agregar a la colección de archivos
        if (archivoInfo) {
          await prisma.archivoEntrega.create({
            data: {
              entregaId: entregaExistente.id,
              url: archivoInfo.url,
              tipo: archivoInfo.tipo,
              sizeMB: archivoInfo.sizeMB
            }
          });
        }
      } else {
        console.log(`Creando nueva entrega para tarea ${tareaId}, estudiante ${estudianteId}`);
        
        // Si no hay archivo y es una nueva entrega, exigir el archivo
        if (!archivoInfo) {
          console.log('Error: Nueva entrega sin archivo');
          throw new Error('Es necesario adjuntar un archivo para la entrega');
        }
        
        // Crear nueva entrega con archivos relacionados
        entrega = await prisma.entrega.create({
          data: {
            tareaId,
            estudianteId,
            comentario,
            fecha: new Date(),
            fueraDePlazo,
            archivos: {
              create: [
                {
                  url: archivoInfo.url,
                  tipo: archivoInfo.tipo,
                  sizeMB: archivoInfo.sizeMB
                }
              ]
            }
          },
          include: {
            archivos: true
          }
        });
      }
    });
    
    // Recuperar la entrega actualizada con sus archivos
    const entregaCompleta = await prisma.entrega.findUnique({
      where: { id: entrega.id },
      include: { archivos: true }
    });
    
    console.log(`Entrega procesada correctamente: ID ${entrega.id}`);
    res.status(200).json({
      status: 'success',
      message: entregaExistente ? 'Entrega actualizada correctamente' : 'Entrega enviada correctamente',
      data: entregaCompleta
    });
  } catch (error) {
    console.error('Error detallado al procesar entrega:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al procesar la entrega',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

// Obtener entrega específica de una tarea
const getEntregaEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const tareaId = Number(id);
    const estudianteId = req.user.id;
    
    // Buscar la entrega del estudiante para esta tarea
    const entrega = await prisma.entrega.findFirst({
      where: {
        tareaId,
        estudianteId
      },
      include: {
        archivos: true  // Incluir archivos relacionados
      }
    });
    
    if (!entrega) {
      return res.status(200).json({ status: 'success', data: null });
    }
    
    res.status(200).json({ status: 'success', data: entrega });
  } catch (error) {
    console.error('Error al obtener entrega:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener la entrega' });
  }
};

// Listar todas las entregas del estudiante
const getEntregasEstudiante = async (req, res) => {
  try {
    const estudianteId = req.user.id;
    
    // Obtener todas las entregas del estudiante con información de las tareas
    // Modificamos la consulta para evitar el error de relación con curso
    const entregas = await prisma.entrega.findMany({
      where: {
        estudianteId
      },
      include: {
        tarea: {
          select: {
            id: true,
            titulo: true,
            fechaEntrega: true,
            notaMaxima: true
          }
        },
        archivos: true
      },
      orderBy: {
        fecha: 'desc'
      }
    });
    
    // Si queremos información del curso, hacemos una segunda consulta para cada tarea
    const entregasConCurso = await Promise.all(entregas.map(async (entrega) => {
      if (!entrega.tarea) {
        return entrega;
      }
      
      // Buscar la asignación de la tarea para encontrar el curso
      const asignacion = await prisma.tareaAsignacion.findFirst({
        where: {
          tareaId: entrega.tarea.id,
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
          curso: {
            select: {
              id: true,
              nombre: true,
              codigo: true
            }
          }
        }
      });
      
      return {
        ...entrega,
        tarea: {
          ...entrega.tarea,
          curso: asignacion?.curso || null
        }
      };
    }));
    
    res.status(200).json({ status: 'success', data: entregasConCurso });
  } catch (error) {
    console.error('Error al listar entregas:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al listar las entregas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar un archivo específico de una entrega
const eliminarArchivoEntrega = async (req, res) => {
  try {
    const { tareaId, archivoId } = req.params;
    const estudianteId = req.user.id;
    
    // Verificar que el archivo exista y pertenezca a una entrega del estudiante
    const archivo = await prisma.archivoEntrega.findUnique({
      where: { id: Number(archivoId) },
      include: {
        entrega: true
      }
    });
    
    if (!archivo) {
      return res.status(404).json({ status: 'error', message: 'Archivo no encontrado' });
    }
    
    // Verificar que el archivo pertenece a una entrega del estudiante y de la tarea especificada
    if (archivo.entrega.estudianteId !== estudianteId || archivo.entrega.tareaId !== Number(tareaId)) {
      return res.status(403).json({ status: 'error', message: 'No tienes permiso para eliminar este archivo' });
    }
    
    // Verificar que la entrega no esté calificada
    if (archivo.entrega.calificacion !== null) {
      return res.status(400).json({ status: 'error', message: 'No se puede modificar una entrega ya calificada' });
    }
    
    // Eliminar archivo físico si existe
    if (archivo.url) {
      const rutaArchivo = path.join(__dirname, '..', archivo.url);
      if (fs.existsSync(rutaArchivo)) {
        fs.unlinkSync(rutaArchivo);
        console.log(`Archivo físico eliminado: ${rutaArchivo}`);
      }
    }
    
    // Eliminar registro de archivo de la base de datos
    await prisma.archivoEntrega.delete({
      where: { id: Number(archivoId) }
    });
    
    // Verificar si quedan otros archivos en la entrega
    const archivosRestantes = await prisma.archivoEntrega.count({
      where: { entregaId: archivo.entrega.id }
    });
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Archivo eliminado correctamente',
      data: { archivosRestantes }
    });
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    res.status(500).json({ status: 'error', message: 'Error al eliminar archivo' });
  }
};

// Eliminar una entrega completa
const eliminarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const tareaId = Number(id);
    const estudianteId = req.user.id;
    
    // Buscar la entrega
    const entrega = await prisma.entrega.findFirst({
      where: {
        tareaId,
        estudianteId
      },
      include: {
        archivos: true
      }
    });
    
    if (!entrega) {
      return res.status(404).json({ status: 'error', message: 'Entrega no encontrada' });
    }
    
    // Verificar que la entrega no esté calificada
    if (entrega.calificacion !== null) {
      return res.status(400).json({ status: 'error', message: 'No se puede eliminar una entrega ya calificada' });
    }
    
    // Eliminar archivos físicos
    for (const archivo of entrega.archivos) {
      if (archivo.url) {
        const rutaArchivo = path.join(__dirname, '..', archivo.url);
        if (fs.existsSync(rutaArchivo)) {
          fs.unlinkSync(rutaArchivo);
          console.log(`Archivo físico eliminado: ${rutaArchivo}`);
        }
      }
    }
    
    // Usar transacción para eliminar entrega y sus archivos asociados
    await prisma.$transaction(async (prisma) => {
      // Eliminar archivos asociados
      await prisma.archivoEntrega.deleteMany({
        where: { entregaId: entrega.id }
      });
      
      // Eliminar la entrega
      await prisma.entrega.delete({
        where: { id: entrega.id }
      });
    });
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Entrega eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar entrega:', error);
    res.status(500).json({ status: 'error', message: 'Error al eliminar entrega' });
  }
};

module.exports = { 
  listarTareasEstudiante,
  listarCursosEstudiante,
  getCursoEstudianteById,
  getTareasCursoEstudiante,
  getTareaEstudianteById,
  enviarEntregaTarea,
  getEstadisticasEstudiante,
  getEntregaEstudiante,
  getEntregasEstudiante,
  eliminarArchivoEntrega,
  eliminarEntrega
};
