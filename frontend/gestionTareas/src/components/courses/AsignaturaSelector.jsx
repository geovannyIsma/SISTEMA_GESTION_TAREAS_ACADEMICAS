import { useState, useEffect } from 'react';
import cursoService from '../../services/cursoService';

const AsignaturaSelector = ({ value, onChange, required = false, disabled = false }) => {
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAsignaturas = async () => {
      setLoading(true);
      try {
        const response = await cursoService.getAsignaturas();
        setAsignaturas(response.data);
      } catch (err) {
        setError('Error al cargar asignaturas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAsignaturas();
  }, []);

  if (loading) {
    return (
      <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6">
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-1 block w-full border border-red-300 rounded-md shadow-sm py-2 px-3 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <select
      id="asignaturaId"
      name="asignaturaId"
      required={required}
      disabled={disabled}
      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">Seleccione una asignatura</option>
      {asignaturas.map(asignatura => (
        <option key={asignatura.id} value={asignatura.id}>
          {asignatura.nombre} ({asignatura.codigo})
        </option>
      ))}
    </select>
  );
};

export default AsignaturaSelector;
