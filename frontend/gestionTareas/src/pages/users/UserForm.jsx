import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { validateName, validateEmail, validatePassword, sanitizeInput } from '../../utils/validation';
import Dialog from '../../components/dialog';
import { useAlert } from '../../context/AlertContext'; // Import useAlert

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert(); // Use the global alert context
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'ESTUDIANTE',
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Estado para diálogos
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: 'question',
    title: '',
    message: '',
    action: null
  });
  
  // Estado para validaciones
  const [validations, setValidations] = useState({
    firstName: { isValid: true, message: '', touched: false },
    lastName: { isValid: true, message: '', touched: false },
    email: { isValid: true, message: '', touched: false },
    password: { 
      isValid: false,
      minLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false,
      touched: false,
      message: ''
    }
  });

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
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: '',
            role: userData.role,
          });
        } catch (err) {
          showAlert('error', err.message || 'Error al cargar datos del usuario');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUser();
    }
  }, [id, isEditMode, showAlert]);

  // Función para mostrar diálogo
  const showDialog = (type, title, message, action) => {
    setDialogConfig({
      isOpen: true,
      type,
      title,
      message,
      action
    });
  };

  // Función para cerrar diálogo
  const closeDialog = () => {
    setDialogConfig({ ...dialogConfig, isOpen: false });
  };

  // Ejecutar acción al confirmar diálogo
  const handleDialogConfirm = () => {
    if (dialogConfig.action === 'cancel') {
      navigate('/users');
    } else if (dialogConfig.action === 'submit') {
      processFormSubmission();
    }
    closeDialog();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Permitir espacios en nombre y apellido
    let sanitizedValue;
    if (name === 'firstName' || name === 'lastName') {
      // Sanitiza pero permite espacios internos
      sanitizedValue = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ' -]/g, '');
    } else if (name !== 'password') {
      sanitizedValue = sanitizeInput(value);
    } else {
      sanitizedValue = value;
    }
    
    setFormData({ ...formData, [name]: sanitizedValue });
    
    // Validar el campo modificado
    validateField(name, sanitizedValue);
  };

  const validateField = (fieldName, value) => {
    let validation = { isValid: true, message: '', touched: true };
    
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        validation = validateName(value);
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'password':
        validation = validatePassword(value);
        break;
      default:
        break;
    }
    
    setValidations(prev => ({
      ...prev,
      [fieldName]: { ...validation, touched: true }
    }));
    
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos obligatorios
    const firstNameIsValid = validateField('firstName', formData.firstName);
    const lastNameIsValid = validateField('lastName', formData.lastName);
    const emailIsValid = validateField('email', formData.email);
    
    // Solo validar contraseña si es nuevo usuario o si se está cambiando la contraseña
    const passwordIsValid = isEditMode && !formData.password 
      ? true 
      : validateField('password', formData.password);
    
    // Si algún campo no es válido, detener el envío
    if (!firstNameIsValid || !lastNameIsValid || !emailIsValid || !passwordIsValid) {
      showAlert('error', 'Por favor, corrija los errores en el formulario antes de continuar');
      return;
    }

    // Mostrar diálogo de confirmación
    showDialog(
      'question',
      isEditMode ? 'Actualizar Usuario' : 'Crear Usuario',
      isEditMode 
        ? `¿Está seguro de que desea actualizar la información de "${formData.firstName} ${formData.lastName}"?`
        : `¿Está seguro de que desea crear el usuario "${formData.firstName} ${formData.lastName}"?`,
      'submit'
    );
  };

  // Procesar el envío del formulario después de la confirmación
  const processFormSubmission = async () => {
    setSubmitting(true);
    
    try {
      if (isEditMode) {
        // For update, we'll only include password if it was changed
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await api.updateUser(id, updateData);
        showAlert('success', 'Usuario actualizado correctamente');
        navigate('/users');
      } else {
        // For new user, all fields are required
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
          throw new Error('Todos los campos son obligatorios');
        }
        await api.createUser(formData);
        showAlert('success', 'Usuario creado correctamente');
        navigate('/users');
      }
    } catch (err) {
      showAlert('error', err.message || 'Ocurrió un error al guardar el usuario');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar cancelación si hay cambios en el formulario
  const confirmCancel = () => {
    showDialog(
      'warning',
      'Cancelar edición',
      '¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.',
      'cancel'
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Obtener el estilo para los indicadores de validación
  const getValidationClass = (field, condition = null) => {
    if (!validations[field].touched) return "text-gray-500";
    
    if (condition !== null) {
      return condition ? "text-green" : "text-red";
    }
    
    return validations[field].isValid ? "text-green" : "text-red";
  };

  // Obtener el estilo para los campos de entrada
  const getInputClass = (field) => {
    const baseClass = "mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm";
    
    if (!validations[field].touched) {
      return `${baseClass} border-gray-300`;
    }
    
    return validations[field].isValid 
      ? `${baseClass} border-green focus:border-green` 
      : `${baseClass} border-red focus:border-red`;
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Editar usuario' : 'Agregar usuario'}
        </h1>
      </div>

      {/* Componente de diálogo */}
      <Dialog 
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        title={dialogConfig.title}
        type={dialogConfig.type}
        onConfirm={handleDialogConfirm}
        confirmText={dialogConfig.action === 'cancel' ? 'Sí, cancelar' : 'Confirmar'}
        cancelText="Volver"
      >
        <p>{dialogConfig.message}</p>
      </Dialog>

      <div className="bg-gray-50 shadow overflow-hidden rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* First Name Field */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  required
                  className={getInputClass('firstName')}
                  value={formData.firstName}
                  onChange={handleChange}
                  maxLength={50}
                />
                {validations.firstName.touched && !validations.firstName.isValid && (
                  <p className="mt-1 text-sm text-red">{validations.firstName.message}</p>
                )}
              </div>
              
              {/* Last Name Field */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  required
                  className={getInputClass('lastName')}
                  value={formData.lastName}
                  onChange={handleChange}
                  maxLength={50}
                />
                {validations.lastName.touched && !validations.lastName.isValid && (
                  <p className="mt-1 text-sm text-red">{validations.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <p className="text-xs text-gray-500">Solo letras, espacios, apóstrofes y guiones permitidos en el nombre y apellido</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico institucional
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                placeholder="usuario@uni.edu.ec"
                className={getInputClass('email')}
                value={formData.email}
                onChange={handleChange}
              />
              {validations.email.touched && !validations.email.isValid && (
                <p className="mt-1 text-sm text-red">{validations.email.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Debe ser un correo electrónico institucional (@uni.edu.ec)</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {isEditMode ? 'Nueva contraseña (deja en blanco para mantener la actual)' : 'Contraseña'}
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className={getInputClass('password')}
                required={!isEditMode}
                value={formData.password}
                onChange={handleChange}
                maxLength={100}
              />
              
              {/* Requisitos de contraseña */}
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">La contraseña debe cumplir los siguientes requisitos:</p>
                <ul className="pl-5 text-sm space-y-1 list-disc">
                  <li className={getValidationClass('password', validations.password.minLength)}>
                    Al menos 8 caracteres
                  </li>
                  <li className={getValidationClass('password', validations.password.hasUpperCase)}>
                    Al menos una letra mayúscula (A-Z)
                  </li>
                  <li className={getValidationClass('password', validations.password.hasLowerCase)}>
                    Al menos una letra minúscula (a-z)
                  </li>
                  <li className={getValidationClass('password', validations.password.hasNumber)}>
                    Al menos un número (0-9)
                  </li>
                  <li className={getValidationClass('password', validations.password.hasSpecialChar)}>
                    Al menos un carácter especial (!@#$%^&*...)
                  </li>
                </ul>
                {validations.password.touched && !validations.password.isValid && (
                  <p className="text-sm text-red">{validations.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                id="role"
                name="role"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
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
              onClick={confirmCancel}
              className="bg-gray-50 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || 
                (!isEditMode && (!validations.firstName.isValid || !validations.lastName.isValid || !validations.email.isValid || !validations.password.isValid)) ||
                (isEditMode && formData.password && !validations.password.isValid)}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                submitting || (!isEditMode && (!validations.firstName.isValid || !validations.lastName.isValid || !validations.email.isValid || !validations.password.isValid)) ||
                (isEditMode && formData.password && !validations.password.isValid)
                  ? 'bg-primary-light cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark'
              }`}
            >
              {submitting ? 'Guardando...' : isEditMode ? 'Actualizar usuario' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;