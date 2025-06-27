import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

const WorkspacesPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    path: '',
    defaultFormatId: '',
    defaultRoleId: '',
    ignorePatterns: [] as string[]
  });

  const { workspaces, formats, roles, fetchWorkspaces, fetchFormats, fetchRoles } = useAppStore();

  useEffect(() => {
    fetchWorkspaces();
    fetchFormats();
    fetchRoles();
  }, [fetchWorkspaces, fetchFormats, fetchRoles]);

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newWorkspace,
          defaultFormatId: newWorkspace.defaultFormatId || undefined,
          defaultRoleId: newWorkspace.defaultRoleId || undefined,
        }),
      });

      if (response.ok) {
        setNewWorkspace({
          name: '',
          path: '',
          defaultFormatId: '',
          defaultRoleId: '',
          ignorePatterns: []
        });
        setIsCreating(false);
        fetchWorkspaces();
      } else {
        alert('Erreur lors de la création de l\'espace de travail');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de l\'espace de travail');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet espace de travail ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchWorkspaces();
      } else {
        alert('Erreur lors de la suppression de l\'espace de travail');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression de l\'espace de travail');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Espaces de travail</h1>
              <p className="text-gray-600">Gérez vos projets et leurs configurations</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setIsCreating(true)}
            >
              + Nouvel espace de travail
            </button>
          </div>
        </div>

        <div className="card-content">
          {/* Formulaire de création */}
          {isCreating && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nouvel espace de travail</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    placeholder="Mon projet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chemin
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newWorkspace.path}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, path: e.target.value })}
                    placeholder="/chemin/vers/projet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format par défaut
                  </label>
                  <select
                    className="select"
                    value={newWorkspace.defaultFormatId}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, defaultFormatId: e.target.value })}
                  >
                    <option value="">Aucun</option>
                    {formats.map((format) => (
                      <option key={format.id} value={format.id}>
                        {format.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle par défaut
                  </label>
                  <select
                    className="select"
                    value={newWorkspace.defaultRoleId}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, defaultRoleId: e.target.value })}
                  >
                    <option value="">Aucun</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="btn-secondary"
                  onClick={() => setIsCreating(false)}
                >
                  Annuler
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCreate}
                  disabled={!newWorkspace.name || !newWorkspace.path}
                >
                  Créer
                </button>
              </div>
            </div>
          )}

          {/* Liste des espaces de travail */}
          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{workspace.path}</p>
                    <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                      {workspace.defaultFormat && (
                        <span>Format: {workspace.defaultFormat.name}</span>
                      )}
                      {workspace.defaultRole && (
                        <span>Rôle: {workspace.defaultRole.name}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn-danger text-sm"
                    onClick={() => handleDelete(workspace.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {workspaces.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun espace de travail configuré
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspacesPage;