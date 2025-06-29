import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore, Workspace } from '../../store/useAppStore';
import { workspaceFormSchema, WorkspaceFormData } from '../../schemas/workspace.schema';
import { toastService } from '../../services/toastService';

const WorkspacesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  const {
    workspaces,
    compositions,
    isLoading,
    error,
    loadWorkspaces,
    loadCompositions,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    showConfirmation
  } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: '',
      path: '',
      defaultCompositionId: '',
      projectInfo: '',
      ignorePatterns: '',
    }
  });

  useEffect(() => {
    loadWorkspaces();
    loadCompositions();
  }, [loadWorkspaces, loadCompositions]);

  const resetForm = () => {
    setEditingWorkspace(null);
    reset();
    setIsFormOpen(false);
  };

  const handleNew = () => {
    setEditingWorkspace(null);
    reset({
      name: '',
      path: '',
      defaultCompositionId: '',
      projectInfo: '',
      ignorePatterns: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setValue('name', workspace.name);
    setValue('path', workspace.path);
    setValue('defaultCompositionId', workspace.defaultCompositionId || '');
    setValue('projectInfo', workspace.projectInfo || '');
    setValue('ignorePatterns', (workspace.ignorePatterns || []).join('\n'));
    setIsFormOpen(true);
  };

  const onSubmit: SubmitHandler<WorkspaceFormData> = async (data) => {
    const ignorePatterns = data.ignorePatterns
      ? data.ignorePatterns
          .split('\n')
          .map(pattern => pattern.trim())
          .filter(pattern => pattern.length > 0)
      : [];

    const workspaceData = {
      name: data.name,
      path: data.path,
      defaultCompositionId: data.defaultCompositionId || undefined,
      projectInfo: data.projectInfo || undefined,
      ignorePatterns,
    };

    const promise = editingWorkspace
      ? updateWorkspace(editingWorkspace.id, workspaceData)
      : createWorkspace(workspaceData);

    toastService.promise(promise, {
      loading: 'Sauvegarde en cours...',
      success: editingWorkspace 
        ? 'Espace de travail mis à jour avec succès !' 
        : 'Espace de travail créé avec succès !',
      error: 'Erreur lors de la sauvegarde de l\'espace de travail.',
    });
    
    try {
      await promise;
      resetForm();
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  };

  const handleDelete = (id: string, name: string) => {
    showConfirmation(
      `Supprimer "${name}" ?`,
      "Cette action est irréversible. L'espace de travail et toutes ses données seront définitivement supprimés.",
      async () => {
        const promise = deleteWorkspace(id);
        
        toastService.promise(promise, {
          loading: 'Suppression en cours...',
          success: 'Espace de travail supprimé avec succès !',
          error: 'Erreur lors de la suppression de l\'espace de travail.',
        });

        try {
          await promise;
        } catch (error) {
          console.error('Failed to delete workspace:', error);
        }
      }
    );
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
                  onClick={() => handleDelete(workspace.id, workspace.name)}
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
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'espace de travail
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chemin du projet
                  </label>
                  <input
                    type="text"
                    {...register('path')}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.path ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="/chemin/vers/votre/projet"
                  />
                  {errors.path && (
                    <p className="text-red-500 text-sm mt-1">{errors.path.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Composition par défaut (optionnel)
                  </label>
                  <select
                    {...register('defaultCompositionId')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune composition par défaut</option>
                    {compositions.map((composition) => (
                      <option key={composition.id} value={composition.id}>
                        {composition.name}
                      </option>
                    ))}
                  </select>
                  {errors.defaultCompositionId && (
                    <p className="text-red-500 text-sm mt-1">{errors.defaultCompositionId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Informations du projet (optionnel)
                  </label>
                  <textarea
                    {...register('projectInfo')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Description du projet, technologies utilisées, etc."
                  />
                  {errors.projectInfo && (
                    <p className="text-red-500 text-sm mt-1">{errors.projectInfo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patterns d'exclusion (un par ligne)
                  </label>
                  <textarea
                    {...register('ignorePatterns')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="node_modules&#10;.git&#10;*.log&#10;dist"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Fichiers et dossiers à exclure de la structure du projet
                  </p>
                  {errors.ignorePatterns && (
                    <p className="text-red-500 text-sm mt-1">{errors.ignorePatterns.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? 'Sauvegarde...' 
                      : editingWorkspace 
                        ? 'Mettre à jour' 
                        : 'Créer'
                    }
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
