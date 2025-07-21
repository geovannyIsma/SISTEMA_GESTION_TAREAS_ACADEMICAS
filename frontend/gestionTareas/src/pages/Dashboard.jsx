import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getFullName } from '../utils/validation';
import { useAlert } from '../context/AlertContext';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    teacherUsers: 0,
    studentUsers: 0,
    observerUsers: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  
  // Redirect based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'DOCENTE') {
        navigate('/docente/dashboard', { replace: true });
      } else if (user.role === 'ESTUDIANTE') {
        navigate('/estudiante/dashboard', { replace: true });
      } else if (user.role === 'ADMINISTRADOR') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Fetch user data for admin dashboard
  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'ADMINISTRADOR') {
        try {
          const response = await api.getUsers();
          const users = response.data;
          
          // Calculate statistics
          setStats({
            totalUsers: users.length,
            adminUsers: users.filter(u => u.role === 'ADMINISTRADOR').length,
            teacherUsers: users.filter(u => u.role === 'DOCENTE').length,
            studentUsers: users.filter(u => u.role === 'ESTUDIANTE').length,
            observerUsers: users.filter(u => u.role === 'OBSERVADOR').length
          });
          
          // Get 5 most recent users
          const sorted = [...users].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setRecentUsers(sorted.slice(0, 5));
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
    };

    fetchData();
  }, [user]);

  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Generic message for observers or other roles
  return (
    <div className="py-6">
      <div className="bg-gray-50 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Bienvenido al Sistema de Gestión de Tareas Académicas</h1>
        <p className="text-gray-700">Redirigiendo a su panel correspondiente...</p>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-dark">
                Información
              </h3>
              <div className="mt-2 text-sm text-blue-dark">
                <p>Actualmente ha iniciado sesión como <strong>{user?.role?.toLowerCase() || 'usuario'}</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;