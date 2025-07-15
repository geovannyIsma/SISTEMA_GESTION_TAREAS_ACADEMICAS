import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import GlobalAlert from './components/GlobalAlert';
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
import AsignarTarea from './pages/docente/AsignarTarea';
import CursosEstudiante from './pages/estudiante/CursosEstudiante';
import CursoTareasEstudiante from './pages/estudiante/CursoTareasEstudiante';
import TareasEstudiante from './pages/estudiante/TareasEstudiante';
import TareaDetalleEstudiante from './pages/estudiante/TareaDetalleEstudiante';

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <GlobalAlert />
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
            <Route path="/docente/tareas/:id" element={
              <AdminLayout>
                <TareaDocenteForm />
              </AdminLayout>
            } />
            <Route path="/docente/tareas/:id/asignar" element={
              <AdminLayout>
                <AsignarTarea />
              </AdminLayout>
            } />
          </Route>
          
          {/* Rutas para estudiantes */}
          <Route path="/estudiante/tareas" element={
            <AdminLayout>
              <TareasEstudiante />
            </AdminLayout>
          } />
          <Route path="/estudiante/cursos" element={
            <AdminLayout>
              <CursosEstudiante />
            </AdminLayout>
          } />
          <Route path="/estudiante/cursos/:id" element={
            <AdminLayout>
              <CursoTareasEstudiante />
            </AdminLayout>
          } />
          <Route path="/estudiante/tareas/:id" element={
            <AdminLayout>
              <TareaDetalleEstudiante />
            </AdminLayout>
          } />
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;