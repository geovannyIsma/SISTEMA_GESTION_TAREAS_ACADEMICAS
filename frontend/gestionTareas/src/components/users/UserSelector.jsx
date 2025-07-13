import { useState } from 'react';
import { getFullName } from '../../utils/validation';

const UserSelector = ({ 
  title,
  users,
  selectedIds,
  onToggleSelect,
  onCancel,
  onConfirm,
  confirmText,
  searchPlaceholder,
  emptyMessage,
  primaryColor = "indigo" // "indigo" for docentes, "green" for estudiantes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const colorClasses = {
    indigo: {
      checkbox: "text-indigo-600 border-gray-300 rounded focus:ring-indigo-500",
      button: "bg-indigo-600 text-white rounded-md hover:bg-indigo-700",
      selected: selectedIds.length === 0 ? 'Seleccione usuarios' : `Añadir ${selectedIds.length} usuarios`
    },
    green: {
      checkbox: "text-green-600 border-gray-300 rounded focus:ring-green-500",
      button: "bg-green-600 text-white rounded-md hover:bg-green-700",
      selected: selectedIds.length === 0 ? 'Seleccione usuarios' : `Añadir ${selectedIds.length} usuarios`
    }
  };

  const colors = colorClasses[primaryColor];
  
  // Filter users by search term
  const filteredUsers = users.filter(user => {
    const fullName = getFullName(user.firstName, user.lastName);
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 overflow-y-auto z-50" aria-modal="true" role="dialog">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Overlay with semi-transparent background and blur */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={onCancel}
        ></div>
        
        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full max-w-3xl z-50">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seleccionar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => onToggleSelect(user.id)}
                          className={`h-4 w-4 ${colors.checkbox}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getFullName(user.firstName, user.lastName)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        {emptyMessage}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 ${colors.button}`}
                disabled={selectedIds.length === 0}
              >
                {colors.selected}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
