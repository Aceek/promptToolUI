import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

const RolesPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const { roles, fetchRoles } = useAppStore();

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setIsCreating(false);
    setEditingRole(null);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchRoles();
      } else {
        alert('Erreur lors de la création du rôle');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du rôle');
    }
  };

  const handleUpdate = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch(`/api/roles/${editingRole}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchRoles();
      } else {
        alert('Erreur lors de la mise à jour du rôle');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleEdit = (role: any) => {
    setFormData({
      name: role.name,
      description: role.description
    });
    setEditingRole(role.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRoles();
      } else {
        alert('Erreur lors de la suppression du rôle');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du rôle');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rôles de l'IA</h1>
              <p className="text-gray-600">Définissez les personas que l'IA peut adopter</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setIsCreating(true)}
            >
              + Nouveau rôle
            </button>
          </div>
        </div>

        <div className="card-content">
          {/* Formulaire de création/édition */}
          {isCreating && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom du rôle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="textarea"
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description détaillée du rôle, expertise, style de communication..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="btn-secondary"
                  onClick={resetForm}
                >
                  Annuler
                </button>
                <button
                  className="btn-primary"
                  onClick={editingRole ? handleUpdate : handleCreate}
                  disabled={!formData.name || !formData.description}
                >
                  {editingRole ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          )}

          {/* Liste des rôles */}
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                      {role.description.substring(0, 300)}
                      {role.description.length > 300 && '...'}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      className="btn-secondary text-sm"
                      onClick={() => handleEdit(role)}
                    >
                      Modifier
                    </button>
                    <button
                      className="btn-danger text-sm"
                      onClick={() => handleDelete(role.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {roles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun rôle configuré
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolesPage;