import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';

const TareasDocente = () => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de nueva tarea
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fechaEntrega: '',
    archivo: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef();

  // Estado para edición y asignación
  const [editId, setEditId] = useState(null);
  const [assignId, setAssignId] = useState(null);
  const [assignData, setAssignData] = useState({ cursoId: '', estudianteId: '' });
  const [assignError, setAssignError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Para búsqueda y selección de estudiantes
  const [allStudents, setAllStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [assigningTo, setAssigningTo] = useState(null);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listarTareasDocente();
      setTareas(res.data);
    } catch (err) {
      setError('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'archivo') {
      setForm({ ...form, archivo: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleReset = () => {
    setForm({
      titulo: '',
      descripcion: '',
      fechaEntrega: '',
      archivo: null,
    });
    setFormError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!form.titulo || !form.descripcion || !form.fechaEntrega) {
      setFormError('Todos los campos son obligatorios');
      setSubmitting(false);
      return;
    }

    try {
      // Adjuntos: simula subida, solo envía nombre (backend real debe aceptar archivos)
      let archivoUrl = '';
      if (form.archivo) {
        // Aquí deberías subir el archivo a un endpoint y obtener la URL
        // Por ahora solo guardamos el nombre
        archivoUrl = form.archivo.name;
      }

      await api.crearTarea({
        titulo: form.titulo,
        descripcion: form.descripcion,
        fechaEntrega: form.fechaEntrega,
        archivoUrl, // En backend real, guarda la URL del archivo subido
      });

      handleReset();
      fetchTareas();
    } catch (err) {
      setFormError('Error al crear tarea');
    } finally {
      setSubmitting(false);
    }
  };

  // Asignar tarea a curso o estudiante
  const handleAssign = (tareaId) => {
    setAssignId(tareaId);
    setAssignError('');
    setAssignData({ cursoId: '', estudianteId: '' });
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssigning(true);
    try {
      if (!assignData.cursoId && !assignData.estudianteId) {
        setAssignError('Debe ingresar un curso o estudiante');
        setAssigning(false);
        return;
      }
      await api.asignarTarea(assignId, assignData);
      setAssignId(null);
      fetchTareas();
    } catch (err) {
      setAssignError('Error al asignar tarea');
    } finally {
      setAssigning(false);
    }
  };

  // Editar tarea (solo si editable)
  const handleEdit = (tarea) => {
    setEditId(tarea.id);
    setForm({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fechaEntrega: tarea.fechaEntrega.split('T')[0],
      archivo: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Deshabilitar tarea
  const handleDisable = async (id) => {
    if (!window.confirm('¿Seguro que desea deshabilitar esta tarea?')) return;
    setDeletingId(id);
    try {
      await api.deshabilitarTarea(id);
      await fetchTareas();
    } catch (err) {
      alert('Error al deshabilitar tarea');
    } finally {
      setDeletingId(null);
    }
  };

  // Habilitar tarea
  const handleEnable = async (id) => {
    setDeletingId(id);
    try {
      await api.editarTarea(id, { habilitada: true });
      await fetchTareas();
    } catch (err) {
      alert('Error al habilitar tarea');
    } finally {
      setDeletingId(null);
    }
  };

  // Cargar todos los estudiantes al abrir el modal de asignar
  useEffect(() => {
    if (assignId) {
      api.listarEstudiantesDocente().then(res => {
        setAllStudents(res.data);
        setFilteredStudents(res.data);
      });
      setStudentQuery('');
      setAssigningTo(null);
    }
    // eslint-disable-next-line
  }, [assignId]);

  // Filtrar estudiantes en backend
  const handleStudentFilter = async (value) => {
    setStudentQuery(value);
    const res = await api.listarEstudiantesDocente(value);
    setFilteredStudents(res.data);
  };

  // Asignar tarea a estudiante seleccionado
  const handleAssignStudent = async (estudianteId) => {
    setAssigningTo(estudianteId);
    setAssignError('');
    setAssigning(true);
    try {
      await api.asignarTarea(assignId, { estudianteId });
      setAssignId(null);
      fetchTareas();
    } catch (err) {
      setAssignError('Error al asignar tarea');
    } finally {
      setAssigning(false);
      setAssigningTo(null);
    }
  };

  // Modal o sección para asignar tarea
  {assignId && (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Asignar tarea a estudiante</h3>
        {assignError && <div className="text-red-600 mb-2">{assignError}</div>}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Buscar estudiante por nombre o correo</label>
          <input
            type="text"
            className="block w-full border border-gray-300 rounded px-3 py-2"
            value={studentQuery}
            onChange={e => handleStudentFilter(e.target.value)}
            placeholder="Ej: Juan Pérez"
            autoComplete="off"
          />
        </div>
        <div className="overflow-x-auto max-h-72">
          <table className="min-w-full bg-white rounded shadow divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Nombre</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Correo</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map(est => (
                <tr key={est.id}>
                  <td className="px-4 py-2 border-r">{est.name}</td>
                  <td className="px-4 py-2 border-r">{est.email}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
                      onClick={() => handleAssignStudent(est.id)}
                      disabled={assigning && assigningTo === est.id}
                    >
                      {assigning && assigningTo === est.id ? 'Asignando...' : 'Asignar'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-500">No se encontraron estudiantes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 mt-4 justify-end">
          <button
            type="button"
            onClick={() => {
              setAssignId(null);
              setStudentQuery('');
              setFilteredStudents([]);
              setAssignData({ cursoId: '', estudianteId: '' });
            }}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            disabled={assigning}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )}

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-4">Mis Tareas</h1>

      {/* Formulario para crear tarea */}
      <div className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Crear nueva tarea</h2>
        {formError && <div className="text-red-600 mb-2">{formError}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              name="titulo"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.titulo}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              name="descripcion"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              value={form.descripcion}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha límite</label>
            <input
              type="date"
              name="fechaEntrega"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={form.fechaEntrega}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Archivo adjunto</label>
            <input
              type="file"
              name="archivo"
              ref={fileInputRef}
              className="mt-1 block w-full"
              onChange={handleInputChange}
              accept="*"
            />
            {form.archivo && (
              <div className="text-xs text-gray-500 mt-1">Archivo seleccionado: {form.archivo.name}</div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              {submitting ? 'Creando...' : 'Crear tarea'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
              disabled={submitting}
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de tareas */}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Fecha Límite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Archivo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tareas.map((t) => (
                <tr key={t.id} className={t.habilitada === false ? "bg-gray-100 text-gray-400" : ""}>
                  <td className="px-6 py-4 border-r align-top">{t.titulo}</td>
                  <td className="px-6 py-4 border-r align-top">{t.descripcion}</td>
                  <td className="px-6 py-4 border-r align-top">{new Date(t.fechaEntrega).toLocaleDateString()}</td>
                  <td className="px-6 py-4 border-r align-top">
                    {t.archivoUrl ? (
                      <a
                        href={t.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline"
                      >
                        Ver archivo
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col items-stretch gap-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        onClick={() => handleAssign(t.id)}
                        disabled={t.habilitada === false}
                      >
                        Asignar
                      </button>
                      {t.editable !== false && (
                        <button
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600"
                          onClick={() => handleEdit(t)}
                          disabled={t.habilitada === false}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                        onClick={() => handleDisable(t.id)}
                        disabled={deletingId === t.id || t.habilitada === false}
                      >
                        {t.habilitada === false
                          ? 'Deshabilitada'
                          : (deletingId === t.id ? 'Deshabilitando...' : 'Deshabilitar')}
                      </button>
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                        onClick={() => handleEnable(t.id)}
                        disabled={deletingId === t.id || t.habilitada === true}
                      >
                        {t.habilitada === true
                          ? 'Habilitada'
                          : (deletingId === t.id ? 'Habilitando...' : 'Habilitar')}
                      </button>
                      {t.editable === false && (
                        <span className="text-xs text-gray-400 text-center">Solo lectura</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {tareas.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">No hay tareas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal o sección para asignar tarea */}
      {assignId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Asignar tarea a estudiante</h3>
            {assignError && <div className="text-red-600 mb-2">{assignError}</div>}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Buscar estudiante por nombre o correo</label>
              <input
                type="text"
                className="block w-full border border-gray-300 rounded px-3 py-2"
                value={studentQuery}
                onChange={e => handleStudentFilter(e.target.value)}
                placeholder="Ej: Juan Pérez"
                autoComplete="off"
              />
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="min-w-full bg-white rounded shadow divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-r">Correo</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map(est => (
                    <tr key={est.id}>
                      <td className="px-4 py-2 border-r">{est.name}</td>
                      <td className="px-4 py-2 border-r">{est.email}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
                          onClick={() => handleAssignStudent(est.id)}
                          disabled={assigning && assigningTo === est.id}
                        >
                          {assigning && assigningTo === est.id ? 'Asignando...' : 'Asignar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-gray-500">No se encontraron estudiantes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  setAssignId(null);
                  setStudentQuery('');
                  setFilteredStudents([]);
                  setAssignData({ cursoId: '', estudianteId: '' });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                disabled={assigning}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TareasDocente;
