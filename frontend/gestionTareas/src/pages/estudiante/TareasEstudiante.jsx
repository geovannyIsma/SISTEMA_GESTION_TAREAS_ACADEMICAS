import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAlert } from '../../context/AlertContext';

const TareasEstudiante = () => {
  const { showAlert } = useAlert();
  
  useEffect(() => {
    showAlert('info', 'Redirigiendo a la vista de cursos...');
  }, [showAlert]);

  // Redirigir a la vista de cursos
  return <Navigate to="/estudiante/cursos" replace />;
};  

export default TareasEstudiante;
