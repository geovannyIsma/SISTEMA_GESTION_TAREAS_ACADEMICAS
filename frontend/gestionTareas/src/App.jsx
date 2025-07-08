import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/users/UsersList';
import UserForm from './pages/users/UserForm';
import Login from './pages/Login';
import TareasDocente from './pages/docente/TareasDocente';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          } />
          
          {/* Rutas de administración de usuarios (solo admin) */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/users" element={
              <AdminLayout>
                <UsersList />
              </AdminLayout>
            } />
            <Route path="/users/new" element={
              <AdminLayout>
                <UserForm />
              </AdminLayout>
            } />
            <Route path="/users/:id" element={
              <AdminLayout>
                <UserForm />
              </AdminLayout>
            } />
          </Route>
          {/* Rutas para docentes */}
          <Route path="/docente/tareas" element={
            <AdminLayout>
              <TareasDocente />
            </AdminLayout>
          } />
        </Route>
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;