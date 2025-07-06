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

module.exports = { listarTareasEstudiante };
