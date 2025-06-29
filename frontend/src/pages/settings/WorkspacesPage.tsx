import React, { useState, useEffect } from 'react';
import { useAppStore, Workspace } from '../../store/useAppStore';

const initialFormState = {
  name: '',
  path: '',
  defaultCompositionId: '',
  projectInfo: '',
  ignorePatterns: [] as string[],
};

const WorkspacesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [ignorePatternsText, setIgnorePatternsText] = useState('');

  const { 
    workspaces, 
    compositions,
    isLoading, 
    error, 
    loadWorkspaces, 
    loadCompositions,
    createWorkspace, 
    updateWorkspace, 
    deleteWorkspace 
  } = useAppStore();

  useEffect(() => {
    loadWorkspaces();
    loadCompositions();
  }, [loadWorkspaces, loadCompositions]);

  const resetForm = () => {
    setEditingWorkspace(null);
    setFormData(initialFormState);
    setIgnorePatternsText('');
    setIsFormOpen(false);
  };

  const handleNew = () => {
    setEditingWorkspace(null);
    setFormData(initialFormState);
    setIgnorePatternsText('');
    setIsFormOpen(true);
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      path: workspace.path,
      defaultCompositionId: workspace.defaultCompositionId || '',
      projectInfo: workspace.projectInfo || '',
      ignorePatterns: workspace.ignorePatterns || [],
    });
    setIgnorePatternsText((workspace.ignorePatterns || []).join('\n'));
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const ignorePatterns = ignorePatternsText
      .split('\n')
      .map(pattern => pattern.trim())
      .filter(pattern => pattern.length > 0);

    const workspaceData = {
      name: formData.name,
      path: formData.path,
      defaultCompositionId: formData.defaultCompositionId || undefined,
      projectInfo: formData.projectInfo || undefined,
      ignorePatterns,
    };

    try {
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, workspaceData);
      } else {
        await createWorkspace(workspaceData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet espace de travail ?')) {
      await deleteWorkspace(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Espaces de Travail</h1>
          <p className="text-gray-600">Configurez vos projets et leurs paramètres par défaut</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouvel Espace de Travail
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Liste des workspaces */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(workspace)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(workspace.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Chemin:</span> {workspace.path}</p>
              
              {workspace.defaultComposition && (
                <p>
                  <span className="font-medium">Composition par défaut:</span>{' '}
                  <span className="text-blue-600">{workspace.defaultComposition.name}</span>
                </p>
              )}
              
              {workspace.projectInfo && (
                <p><span className="font-medium">Info projet:</span> {workspace.projectInfo.substring(0, 50)}...</p>
              )}
              
              {workspace.ignorePatterns && workspace.ignorePatterns.length > 0 && (
                <p><span className="font-medium">Patterns d'exclusion:</span> {workspace.ignorePatterns.length} défini(s)</p>
              )}
              
              <p className="text-xs text-gray-400">
                Créé le {new Date(workspace.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun espace de travail</h3>
          <p className="text-gray-600 mb-4">Créez votre premier espace de travail pour commencer</p>
          <button
            onClick={handleNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer un espace de travail
          </button>
        </div>
      )}

      {/* Modal de création/édition */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingWorkspace ? 'Modifier l\'espace de travail' : 'Nouvel espace de travail'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'espace de travail
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chemin du projet
                  </label>
                  <input
                    type="text"
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/chemin/vers/votre/projet"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Composition par défaut (optionnel)
                  </label>
                  <select
                    value={formData.defaultCompositionId}
                    onChange={(e) => setFormData({ ...formData, defaultCompositionId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune composition par défaut</option>
                    {compositions.map((composition) => (
                      <option key={composition.id} value={composition.id}>
                        {composition.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Informations du projet (optionnel)
                  </label>
                  <textarea
                    value={formData.projectInfo}
                    onChange={(e) => setFormData({ ...formData, projectInfo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Description du projet, technologies utilisées, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patterns d'exclusion (un par ligne)
                  </label>
                  <textarea
                    value={ignorePatternsText}
                    onChange={(e) => setIgnorePatternsText(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="node_modules&#10;.git&#10;*.log&#10;dist"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Fichiers et dossiers à exclure de la structure du projet
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingWorkspace ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacesPage;
