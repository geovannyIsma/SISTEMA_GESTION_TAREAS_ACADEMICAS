import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/users/UsersList';
import UserForm from './pages/users/UserForm';
import Login from './pages/Login';
import TareasDocente from './pages/docente/TareasDocente';
import CursosList from './pages/cursos/CursosList';
import CursoForm from './pages/cursos/CursoForm';
import AsignaturasList from './pages/asignaturas/AsignaturasList';
import AsignaturaForm from './pages/asignaturas/AsignaturaForm';
import './App.css';
import TareaDocenteForm from './pages/docente/TareaDocenteForm';

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
            
            {/* Rutas para gestión de asignaturas (admin) */}
            <Route path="/asignaturas" element={
              <AdminLayout>
                <AsignaturasList />
              </AdminLayout>
            } />
            <Route path="/asignaturas/new" element={
              <AdminLayout>
                <AsignaturaForm />
              </AdminLayout>
            } />
            <Route path="/asignaturas/:id" element={
              <AdminLayout>
                <AsignaturaForm />
              </AdminLayout>
            } />
            
            {/* Rutas para gestión de cursos (admin) */}
            <Route path="/cursos" element={
              <AdminLayout>
                <CursosList />
              </AdminLayout>
            } />
            <Route path="/cursos/new" element={
              <AdminLayout>
                <CursoForm />
              </AdminLayout>
            } />
            <Route path="/cursos/:id" element={
              <AdminLayout>
                <CursoForm />
              </AdminLayout>
            } />
          </Route>
          
          {/* Rutas para docentes */}
          <Route path="/docente/tareas" element={
            <AdminLayout>
              <TareasDocente />
            </AdminLayout>
          } />
          <Route path="/docente/tareas/nueva" element={
            <AdminLayout>
              <TareaDocenteForm />
            </AdminLayout>
          } />
        </Route>
        
        {/* Redirección por defecto */XMLDocument}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;