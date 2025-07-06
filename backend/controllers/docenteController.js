const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    await prisma.tareaAsignacion.create({
      data: {
        tareaId: tarea.id,
        cursoId: cursoId ? Number(cursoId) : null,
        estudianteId: estudianteId ? Number(estudianteId) : null,
      }
    });
    res.status(200).json({ status: 'success', message: 'Tarea asignada correctamente' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al asignar tarea' });
  }
};

// Listar tareas creadas por el docente
const listarTareasDocente = async (req, res) => {
  try {
    console.log('Usuario autenticado:', req.user);
    const tareas = await prisma.tarea.findMany({
      where: { docenteId: req.user.id },
    });
    res.status(200).json({ status: 'success', data: tareas });
  } catch (error) {
    console.error('Error en listarTareasDocente:', error); // <-- Esto mostrará el error real en consola
    res.status(500).json({ status: 'error', message: 'Error al listar tareas' });
  }
};

// Listar estudiantes para asignar tareas (filtrado por nombre/correo)
const listarEstudiantes = async (req, res) => {
  try {
    const search = req.query.search || '';
    const estudiantes = await prisma.user.findMany({
      where: {
        role: 'ESTUDIANTE',
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true }
    });
    res.status(200).json({ status: 'success', data: estudiantes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al listar estudiantes' });
  }
};

module.exports = {
  crearTarea,
  editarTarea,
  asignarTarea,
  listarTareasDocente,
  listarEstudiantes,
};
