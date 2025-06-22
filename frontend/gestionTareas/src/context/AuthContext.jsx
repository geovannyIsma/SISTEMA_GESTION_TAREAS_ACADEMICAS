import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const checkUserAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const result = await api.getMe();
        setUser(result.data);
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkUserAuth();
  }, []);

  // Función de login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.login({ email, password });
      
      // Guardar token en localStorage
      localStorage.setItem('token', result.data.token);
      setUser(result.data);
      
      return result.data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMINISTRADOR',
    isTeacher: user?.role === 'DOCENTE',
    isStudent: user?.role === 'ESTUDIANTE',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
