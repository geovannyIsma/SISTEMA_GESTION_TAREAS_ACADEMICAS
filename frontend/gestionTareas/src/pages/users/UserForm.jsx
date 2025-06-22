import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ESTUDIANTE',
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If in edit mode, fetch user data
    if (isEditMode) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          const response = await api.getUserById(id);
          const userData = response.data;
          
          // Set form data without password
          setFormData({
            name: userData.name,
            email: userData.email,
            password: '', // Aseguramos que la contraseña esté vacía
            role: userData.role,
          });
        } catch (err) {
          setError('Failed to load user data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUser();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate email
      if (!formData.email.endsWith('@uni.edu.ec')) {
        throw new Error('Email must be an institutional email (@uni.edu.ec)');
      }

      // Create or update based on mode
      if (isEditMode) {
        // For update, we'll only include password if it was changed
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await api.updateUser(id, updateData);
      } else {
        // For new user, all fields are required
        if (!formData.name || !formData.email || !formData.password) {
          throw new Error('All fields are required');
        }
        await api.createUser(formData);
      }

      navigate('/users');
    } catch (err) {
      setError(err.message || 'An error occurred while saving user');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit User' : 'Add New User'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                placeholder="user@uni.edu.ec"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
              <p className="mt-1 text-sm text-gray-500">Must be an institutional email (@uni.edu.ec)</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required={!isEditMode}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password" // Ayuda a evitar el autocompletado
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="DOCENTE">Docente</option>
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="OBSERVADOR">Observador</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
